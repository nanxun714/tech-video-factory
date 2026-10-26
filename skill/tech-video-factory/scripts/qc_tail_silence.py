# -*- coding: utf-8 -*-
"""成片尾部死寂预检（第0关音频侧，2026-09-19 CtrlC 精简版 0.6s 尾部数字静音事故沉淀）。

思路：解码片尾近 WINDOW 秒 → 50ms 窗 RMS 响度 → 95 分位当"人声基准"ref →
定位"最后一个可听级声音"（≥ ref-12dB）→ 检查从它到 EOF 之间剩什么。

判定规则（用 02_代码如何运行=合格 / CtrlCopyExplainer_v4=事故 / 精简版修复版 三条实片校准）：
  fail  语音/可听声结束后直到 EOF 再没有任何 ≥ ref-8dB 的内容（≥0.5s）——画面挂着但没东西听
  warn  收尾偏长（0.45~0.8s）、或有声音但收尾异常——必须人耳复听
  pass  人声/音乐铺到最后 0.45s 内；或"可听级音乐淡出+≤2s 安静"的自然收尾

关键教训：单看静音长度会把 02 这种"音乐淡出后留 1s 安静"的好片子误杀，
也抓不住 v4 那种"-33dB 残留渐升"的事故——必须同时看【可听级事件】和【淡出形态】。

用法：python qc_tail_silence.py <成片.mp4> [窗宽秒=10] [--speech-end 语音终点秒]
  --speech-end：timeline 最后一句的波形实测语音终点（秒 = start_sec + sXX.mp3 末段 silence_start）。
  提供后追加拖尾断言（2026-09-19 batch10 十七条 outro 直铺 3.5s 尾音返修沉淀）：
    拖尾 = 片长 - 语音终点；>2.6s fail（话音落了垫乐还吊着）/ >2.0s warn / ≤2.0s 不降级。
  注意：语音终点必须取 sXX.mp3 最后一段 silence_start（文件尾静音段的开端），
  不能取 silence_end（ffmpeg 在 EOF 补发的 silence_end=文件时长，含静音垫会虚长 0.5~0.8s）。
输出 JSON 到 stdout；fail 退出码 1，warn/pass 退出码 0。
"""
import array, io, json, math, os, re, shutil, subprocess, sys, wave

WINDOW = 10.0
HOP = 0.05          # 50ms
WIN = 0.04          # 40ms 分析窗
RATE = 16000
FLOOR_DB = -100.0

FF_CANDIDATES = [
    os.environ.get("FFMPEG", ""),
    shutil.which("ffmpeg") or "",
    r"C:\Program Files\EVCapture\ffmpeg.exe",
]


def find_ffmpeg():
    for c in FF_CANDIDATES:
        if c and os.path.exists(c):
            return c
    raise SystemExit("找不到 ffmpeg：设 FFMPEG 环境变量或确认 EVCapture 路径")


def decode_tail(ffmpeg, path, window):
    """解码最后 window 秒为 16k 单声道 s16 PCM，返回样本数组。容忍个别损坏帧；
    -sseof 撞上损坏包解不出数据时，回退为"ffmpeg 时长 + 普通寻址"。"""
    out_opts = ["-vn", "-ac", "1", "-ar", str(RATE), "-f", "wav", "pipe:1"]
    p = subprocess.run([ffmpeg, "-v", "error", "-err_detect", "ignore_err",
                        "-sseof", "-%g" % window, "-i", path] + out_opts, capture_output=True)
    xs = _wav_samples(p.stdout)
    if len(xs) >= RATE:
        return xs
    dur = probe_duration(ffmpeg, path)
    p = subprocess.run([ffmpeg, "-v", "error", "-err_detect", "ignore_err",
                        "-ss", "%g" % max(0.0, dur - window), "-i", path] + out_opts,
                       capture_output=True)
    xs = _wav_samples(p.stdout)
    if len(xs) >= RATE:
        return xs
    raise RuntimeError("ffmpeg 解码无有效数据（损坏？）：%s" % p.stderr.decode("utf-8", "replace")[:200])


def probe_duration(ffmpeg, path):
    p = subprocess.run([ffmpeg, "-i", path], capture_output=True)
    m = re.search(r"Duration: (\d+):(\d+):(\d+(?:\.\d+)?)",
                  p.stderr.decode("utf-8", "replace"))
    if not m:
        return 0.0
    return int(m.group(1)) * 3600 + int(m.group(2)) * 60 + float(m.group(3))


def _wav_samples(data):
    if not data:
        return array.array("h")
    w = wave.open(io.BytesIO(data), "rb")
    n = w.getnframes()
    xs = array.array("h")
    xs.frombytes(w.readframes(n)[: n * 2])
    return xs


def window_dbs(xs):
    win_n = int(WIN * RATE)
    hop_n = int(HOP * RATE)
    out = []
    for i in range(0, len(xs) - win_n + 1, hop_n):
        seg = xs[i:i + win_n]
        acc = sum(x * x for x in seg)
        r = math.sqrt(acc / len(seg))
        out.append(20 * math.log10(r / 32768.0) if r >= 1 else FLOOR_DB)
    return out


def main():
    argv = sys.argv[1:]
    speech_end = None
    if "--speech-end" in argv:
        i = argv.index("--speech-end")
        speech_end = float(argv[i + 1])
        del argv[i:i + 2]
    try:
        path = argv[0]
        window = float(argv[1]) if len(argv) > 1 else WINDOW
        ffmpeg = find_ffmpeg()
        xs = decode_tail(ffmpeg, path, window)
        dbs = window_dbs(xs)
    except Exception as e:  # 损坏文件等：输出 JSON 而非裸栈，批扫不中断
        print(json.dumps({"file": os.path.basename(sys.argv[1]),
                          "verdict": "error", "reason": str(e)[:200]}, ensure_ascii=False))
        sys.exit(2)
    if len(dbs) < 20:
        print(json.dumps({"file": os.path.basename(path), "verdict": "error",
                          "reason": "解码样本不足"}, ensure_ascii=False))
        sys.exit(2)
    span = len(dbs) * HOP
    ref = sorted(dbs)[min(len(dbs) - 1, int(0.95 * len(dbs)))]
    snd_thr = ref - 12          # 可听级声音（语音/音乐）下限
    event_thr = ref - 8         # 明确"有东西在响"下限

    last_snd = -1
    for i, d in enumerate(dbs):
        if d >= snd_thr:
            last_snd = i
    dead_tail = round(span - (last_snd + 1) * HOP, 2) if last_snd >= 0 else round(span, 2)

    # 语音终点之后的剖面与形态
    tail = dbs[last_snd + 1:] if last_snd >= 0 else dbs
    tail_max = max(tail) if tail else FLOOR_DB
    has_event = tail_max >= event_thr
    # 淡出收尾三条件：结尾有 ≥0.3s 的 < -60dB 安静；安静开始前 2s 内有可听级事件；
    # 且事件→安静之间有 ≥2 个中间电平窗（渐弱坡道）——防止"戛然而止接长静音"冒充淡出
    n_quiet = 0
    for d in reversed(tail):
        if d < -60:
            n_quiet += 1
        else:
            break
    ramp = sum(1 for d in tail[:max(1, len(tail) - n_quiet)] if event_thr > d > -60) if n_quiet else 0
    pre_quiet = dbs[max(0, last_snd - 39): last_snd + 1] if last_snd >= 0 else []
    fade_out = (n_quiet * HOP >= 0.3
                and (max(pre_quiet) if pre_quiet else FLOOR_DB) >= event_thr
                and ramp >= 2)

    last1 = dbs[max(0, len(dbs) - 20):]
    last1_mean = round(sum(last1) / len(last1), 1)

    if last_snd < 0:
        verdict, reason = "fail", "解码窗内无任何可听级音频（全静音？）"
    elif fade_out and dead_tail <= 2.0:
        verdict, reason = "pass", "音乐淡出+%.2fs 安静的自然收尾" % dead_tail
    elif dead_tail >= 0.5 and not has_event:
        verdict, reason = ("fail", "可听声结束后 %.2fs 再无 ≥%.0fdB 的内容直到片尾（末1s均值 %.1fdB，"
                                   "人声基准 %.1fdB）——画面挂着但没东西听" % (dead_tail, event_thr, last1_mean, ref))
    elif dead_tail >= 0.8:
        verdict, reason = "warn", "收尾 %.2fs 偏长（末1s均值 %.1fdB），人耳复听" % (dead_tail, last1_mean)
    elif dead_tail >= 0.45:
        verdict, reason = "warn", "语音终点后 %.2fs 收尾，建议人耳复听" % dead_tail
    else:
        verdict, reason = "pass", "人声/音乐铺到最后 %.2fs，收尾干净" % dead_tail

    # 拖尾断言（--speech-end 提供时）：话音终点到片尾过长 = 垫乐吊尾，用户观感"话完了还有尾音"
    drag = None
    if speech_end is not None:
        dur = probe_duration(ffmpeg, path)
        drag = round(dur - speech_end, 2)
        if drag > 2.6 and verdict != "fail":
            verdict = "fail"
            reason = "话音终点 %.2fs 后拖尾 %.2fs 到片尾（>2.6s，outro/垫乐直铺形态）" % (speech_end, drag)
        elif drag > 2.0 and verdict == "pass":
            verdict = "warn"
            reason = "话音终点后拖尾 %.2fs 偏长，人耳复听" % drag

    print(json.dumps({
        "file": os.path.basename(path), "window_s": round(span, 2),
        "voice_ref_db": round(ref, 1), "dead_tail_s": dead_tail,
        "tail_max_db": round(tail_max, 1), "last1s_mean_db": last1_mean,
        "fade_out_ending": fade_out, "verdict": verdict, "reason": reason,
    }, ensure_ascii=False))
    sys.exit(1 if verdict == "fail" else 0)


if __name__ == "__main__":
    main()
