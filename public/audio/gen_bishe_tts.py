# -*- coding: utf-8 -*-
"""毕设系列#1《毕设选题避坑》配音：MamboTTS 本地 GPT-SoVITS（曼波音色）。
用法: <GPT-SoVITS runtime>/python.exe gen_bishe_tts.py [speed]
流程: 等引擎就绪 -> 逐句合成 raw wav -> numpy 波形实测语音起止 -> 裁掉首尾静音垫
      -> s01.wav... + timeline.json + src/batch10/bisheData.ts
铁律: end_frame 一律按波形实测语音终点，文件时长只作上限参考（2026-09-19 尾音事故）。
"""
import json, os, sys, time, wave
import numpy as np
import requests

API = "http://127.0.0.1:9880"
PROXIES = {"http": None, "https": None}  # 绕过本机代理，防长连接被掐
CUT_PUNC = "，。？！；：、…,.;?!"
REF = r"D:\MamboTTS\models\refer.wav"
REF_TEXT = "大家好，欢迎来到我的频道，今天给大家分享一个有趣的内容"
FPS = 30
GAP = 0.06
TAIL_FRAMES = 6  # 话音落 +0.2s 干脆收（2026-10-27 用户拍板：结尾不要垫乐音）

AUDIO_DIR = os.path.dirname(os.path.abspath(__file__))
TTS_DIR = os.path.join(AUDIO_DIR, "bishe-tts")
SRC_DIR = r"F:\小秋技术笔记\00_视频生产线\01_源码\remotion-production\src\batch10"

SPEED = float(sys.argv[1]) if len(sys.argv) > 1 else 1.25

# 注意：GPT-SoVITS 单句 >40 字必复读（s05/s08 实测 5 次重试同位卡死），
# 长句一律拆成 ≤35 字的短句，语义不变。
SENTENCES = [
    "题目越难，分越高？这是毕设选题里最大的坑。",
    "比如这两个题目，你一眼看好哪个？",
    "左边，基于深度学习的图像识别研究。",
    "右边，基于YOLO的校园道路车辆检测系统。",
    "一个空到没法下笔，一个具体到能直接开工。",
    "选错题，后面全是在填坑。",
    "三个最容易犯的错，先对一对。",
    "一，迷信难度。老师打分看的是完成度和工作量。",
    "驾驭不住的高级题就是半成品；完整落地的中等题，反而高分。",
    "二，跟风AI。模型调不通，数据集不会处理，中期骑虎难下。",
    "三，题目太空，比如基于某某技术的研究。",
    "换成，基于YOLO的校园道路车辆检测系统。",
    "研究对象是校园道路车辆，技术方案是YOLO检测。",
    "交付成果，是能跑的系统、实验结果和论文。",
    "怎么选？三个动作，每个都有判断标准。",
    "第一，范围收窄。一句话说不清对象、技术、交付物，就还没收窄。",
    "第二，知网自查。近三年找不到三篇可参考的技术路线，就别碰。",
    "第三，落地检查。数据集拿不到、环境跑不通，就别选。",
    "核心功能，至少列出三个能演示的。",
    "交付物三样：系统、实验结果、论文内容。",
    "记住，选题定方向，制作看落地。",
    "选题选对了，后面每一步才顺。",
    "你现在是完全没想好题目，",
    "还是已经选了一个，但不知道能不能做出来？",
    "评论区扣A或B，告诉我。",
]

# 字幕短语（原话去标点，每条≤14字，按句索引）
SUBS_PHRASES = [
    ["题目越难分越高", "这是毕设选题里最大的坑"],
    ["比如这两个题目", "你一眼看好哪个"],
    ["左边", "基于深度学习的图像识别研究"],
    ["右边", "基于YOLO的校园道路车辆检测系统"],
    ["一个空到没法下笔", "一个具体到能直接开工"],
    ["选错题", "后面全是在填坑"],
    ["三个最容易犯的错", "先对一对"],
    ["一迷信难度", "老师打分看的是", "完成度和工作量"],
    ["驾驭不住的高级题就是半成品", "完整落地的中等题", "反而高分"],
    ["二跟风AI", "模型调不通", "数据集不会处理", "中期骑虎难下"],
    ["三题目太空", "比如基于某某技术的研究"],
    ["换成", "基于YOLO的校园道路车辆检测系统"],
    ["研究对象是校园道路车辆", "技术方案是YOLO检测"],
    ["交付成果", "是能跑的系统", "实验结果和论文"],
    ["怎么选三个动作", "每个都有判断标准"],
    ["第一范围收窄", "一句话说不清对象技术交付物", "就还没收窄"],
    ["第二知网自查", "近三年找不到三篇可参考的技术路线", "就别碰"],
    ["第三落地检查", "数据集拿不到", "环境跑不通", "就别选"],
    ["核心功能", "至少列出三个能演示的"],
    ["交付物三样", "系统实验结果论文内容"],
    ["记住", "选题定方向", "制作看落地"],
    ["选题选对了", "后面每一步才顺"],
    ["你现在是完全没想好题目"],
    ["还是已经选了一个", "但不知道能不能做出来"],
    ["评论区扣A或B", "告诉我"],
]


def wait_engine(timeout=300):
    t0 = time.time()
    while time.time() - t0 < timeout:
        try:
            r = requests.get(f"{API}/control", timeout=2, proxies=PROXIES)
            r.json()
            return True
        except Exception:
            time.sleep(3)
    return False


def synth(text, path, speed):
    r = requests.post(f"{API}/", json={
        "text": text, "text_language": "zh", "speed": speed, "cut_punc": CUT_PUNC,
        "refer_wav_path": REF, "prompt_text": REF_TEXT, "prompt_language": "zh",
    }, timeout=(10, 300), proxies=PROXIES)
    if r.status_code != 200:
        raise RuntimeError(f"HTTP {r.status_code}: {r.text[:200]}")
    with open(path, "wb") as f:
        f.write(r.content)


def read_wav(path):
    with wave.open(path, "rb") as w:
        sr, ch, sw = w.getframerate(), w.getnchannels(), w.getsampwidth()
        raw = w.readframes(w.getnframes())
    assert sw == 2, f"expect 16bit, got {sw*8}bit"
    x = np.frombuffer(raw, dtype=np.int16)
    if ch > 1:
        x = x.reshape(-1, ch).mean(axis=1).astype(np.int16)
    return sr, x


def speech_bounds(path):
    """波形实测语音起止（秒）。阈值 = 峰值-38dB，20ms 窗，连续 3 窗以上才算语音。"""
    sr, x = read_wav(path)
    xf = x.astype(np.float32) / 32768.0
    win = int(sr * 0.02)
    n = len(xf) // win
    rms = np.sqrt((xf[: n * win].reshape(n, win) ** 2).mean(axis=1) + 1e-12)
    db = 20 * np.log10(rms + 1e-12)
    thr = max(db.max() - 38.0, -45.0)
    hot = db > thr
    # 连续 3 窗才认（防孤立噪声峰）
    run = np.convolve(hot.astype(int), np.ones(3, dtype=int), "valid")
    idx = np.where(run >= 3)[0]
    if len(idx) == 0:
        return sr, 0.0, len(x) / sr, len(x) / sr
    start_i, end_i = int(idx[0]), int(idx[-1] + 2)  # +2 补回卷积尾
    pad_s, pad_e = 0.12, 0.15
    s = max(0.0, start_i * 0.02 - pad_s)
    e = min(len(x) / sr, end_i * 0.02 + pad_e)
    return sr, s, e, len(x) / sr


def trim_wav(src, dst, s, e):
    sr, x = read_wav(src)
    a, b = int(s * sr), int(e * sr)
    with wave.open(dst, "wb") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(sr)
        w.writeframes(x[a:b].astype(np.int16).tobytes())
    return (b - a) / sr


def tokenize(text):
    """词级 token：英文/数字串原子，其余 2 字一组（奇数落单）。返回 [(token, char_off)]"""
    out, buf, off = [], "", 0
    for chx in text:
        if chx.isascii() and chx.isalnum():
            buf += chx
        else:
            if buf:
                out.append((buf, off - len(buf))); buf = ""
            out.append((chx, off))
        off += 1
    if buf:
        out.append((buf, off - len(buf)))
    # 中文相邻单字合并成 2 字组（英文/数字原子保留）
    merged, i = [], 0
    while i < len(out):
        t, o = out[i]
        if len(t) == 1 and not t.isascii():
            if i + 1 < len(out) and len(out[i + 1][0]) == 1 and not out[i + 1][0].isascii():
                merged.append((t + out[i + 1][0], o)); i += 2; continue
        merged.append((t, o)); i += 1
    return merged


def main():
    os.makedirs(TTS_DIR, exist_ok=True)
    print("等待引擎就绪 ...", flush=True)
    if not wait_engine():
        print("FATAL: 引擎 300s 未就绪", flush=True)
        sys.exit(2)
    print("引擎在线，开始合成", flush=True)

    rows = []
    for i, text in enumerate(SENTENCES):
        raw = os.path.join(TTS_DIR, f"s{i+1:02d}_raw.wav")
        fin = os.path.join(TTS_DIR, f"s{i+1:02d}.wav")
        if not (os.path.exists(raw) and os.path.getsize(raw) > 40000):
            synth(text, raw, SPEED)
        sr, s, e, dur = speech_bounds(raw)
        tdur = trim_wav(raw, fin, s, e)
        chars = len([c for c in text if not c.isspace()])
        rows.append({
            "index": i + 1, "text": text, "audio": f"s{i+1:02d}.wav",
            "raw_dur": round(dur, 3), "speech_start": round(s, 3), "speech_end": round(e, 3),
            "dur_sec": round(tdur, 3), "cps": round(chars / tdur, 2),
        })
        print(f"s{i+1:02d} raw={dur:5.2f}s 语音[{s:5.2f}~{e:5.2f}] 裁后={tdur:5.2f}s "
              f"{rows[-1]['cps']:.2f}字/s  {text[:18]}", flush=True)

    # timeline（全用裁后实测时长）
    cursor, sent_frames = 0.0, []
    for r in rows:
        start = round(cursor, 3)
        end = round(cursor + r["dur_sec"], 3)
        r["start_sec"], r["end_sec"] = start, end
        r["start_frame"] = int(round(start * FPS))
        r["end_frame"] = int(round(end * FPS))
        sent_frames.append((r["start_frame"], r["end_frame"]))
        cursor = end + GAP
    total = round(cursor - GAP, 3)
    narration_end = int(round(total * FPS))
    dur_total = narration_end + TAIL_FRAMES
    with open(os.path.join(TTS_DIR, "timeline.json"), "w", encoding="utf-8") as f:
        json.dump({"fps": FPS, "engine": "GPT-SoVITS/manbo", "speed": SPEED,
                   "total_sec": total, "narration_end": narration_end,
                   "duration": dur_total, "sentences": rows}, f, ensure_ascii=False, indent=2)

    # ---- Data.ts（batch10 kit 数据契约）----
    sent = [sf[0] for sf in sent_frames]
    sent_dur = [sf[1] - sf[0] for sf in sent_frames]
    subs, words = [], []
    for i, r in enumerate(rows):
        base, dur_f = r["start_frame"], r["end_frame"] - r["start_frame"]
        clean = "".join(c for c in r["text"] if c not in "，。？！；：、…·—“”（）")
        # SUBS：按短语字符占比铺帧
        total_chars = sum(len(p) for p in SUBS_PHRASES[i])
        acc = 0
        for p in SUBS_PHRASES[i]:
            frac = acc / max(1, total_chars)
            subs.append({"t": p, "f": base + int(round(frac * dur_f)), "sent": i})
            acc += len(p)
        # WORDS：token 字符占比铺帧
        for t, off in tokenize(clean):
            frac = off / max(1, len(clean))
            words.append({"t": t, "f": base + int(round(frac * dur_f)), "sent": i})

    lines = []
    lines.append("// 自动生成：public/audio/gen_bishe_tts.py —— 不要手改，重跑脚本再生成")
    lines.append(f"// 主题: bishe01 选题避坑  voice: GPT-SoVITS 曼波 speed={SPEED}")
    lines.append(f"export const DUR = {dur_total};")
    lines.append(f"export const NARRATION_END = {narration_end};")
    lines.append("export const SENT = [" + ",".join(map(str, sent)) + "];")
    lines.append("export const SENT_DUR = [" + ",".join(map(str, sent_dur)) + "];")
    lines.append("export const SENT_TEXT = [" + ",".join(json.dumps(t, ensure_ascii=False) for t in SENTENCES) + "];")
    lines.append("export const SUBS: { t: string; f: number; sent: number }[] = [")
    for s0 in subs:
        lines.append(f"  {{ t: {json.dumps(s0['t'], ensure_ascii=False)}, f: {s0['f']}, sent: {s0['sent']} }},")
    lines.append("];")
    lines.append("export const WORDS: { t: string; f: number; sent: number }[] = [")
    for w0 in words:
        lines.append(f"  {{ t: {json.dumps(w0['t'], ensure_ascii=False)}, f: {w0['f']}, sent: {w0['sent']} }},")
    lines.append("];")
    data_path = os.path.join(SRC_DIR, "bisheData.ts")
    with open(data_path, "w", encoding="utf-8") as f:
        f.write("\n".join(lines) + "\n")
    print(f"\nTOTAL {total:.2f}s / narration_end={narration_end}f / DUR={dur_total}f -> {data_path}", flush=True)


if __name__ == "__main__":
    main()
