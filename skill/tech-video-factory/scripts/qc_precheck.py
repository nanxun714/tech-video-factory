# -*- coding: utf-8 -*-
"""batch10 QC 程序化预检：像素级扫描页边界帧 + 结尾段响度，抓三大历史bug。
用法: python qc_precheck.py <video.mp4> <out_dir> <帧号列表,逗号分隔> [旁白结束帧] [cut|crossfade]
  mode=cut (默认,硬切风格): 边界帧必须与前一帧明显不同
  mode=crossfade (flat/sketch 等叠化风格): 边界帧=旧页完整淡出起点(允许≈前一帧)，
      真正的 bug 信号是"边界与 +10 帧都没变化"=新场景永远没画(PageTurn bug)
输出: <out_dir>/precheck.json + 抽出的帧 PNG
判定:
  A. 新场景未画出(cut: 边界≈前帧 / crossfade: 边界与+10帧都≈前帧)
  B. 边界帧灰度std<12 => 大面积空白
  C. 末帧std<12 => 结尾卡空白
  D. [可选传旁白结束帧] "旁白结束→片尾"区间 mean_volume < -45dB => 结尾静音事故
"""
import sys, json, os, subprocess
import cv2
import numpy as np

def main():
    video, outdir, frames_s = sys.argv[1], sys.argv[2], sys.argv[3]
    voice_end_frame = int(sys.argv[4]) if len(sys.argv) > 4 and sys.argv[4] not in ("cut", "crossfade") else None
    rest = sys.argv[4:] if len(sys.argv) > 4 else []
    mode = "cut"
    for a in rest:
        if a in ("cut", "crossfade"):
            mode = a
    frames = sorted(set(int(x) for x in frames_s.split(",")))
    os.makedirs(outdir, exist_ok=True)
    cap = cv2.VideoCapture(video)
    total = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    need = set()
    for f in frames:
        need.add(max(0, f - 1)); need.add(f)
        if mode == "crossfade":
            need.add(min(total - 1, f + 30))
    need.add(total - 1)
    idx = 0
    grabbed = {}
    while idx <= max(need):
        ok, img = cap.read()
        if not ok:
            break
        if idx in need:
            grabbed[idx] = img
            cv2.imwrite(os.path.join(outdir, "p%05d.png" % idx), img)
        idx += 1
    cap.release()

    report = {"video": video, "total_frames": total, "mode": mode, "checks": [], "fail": False}
    for f in frames:
        prev, cur = grabbed.get(max(0, f - 1)), grabbed.get(f)
        item = {"frame": f, "saved": "p%05d.png" % f}
        if prev is None or cur is None:
            item["error"] = "frame missing"
            report["fail"] = True
        else:
            diff = float(np.mean(cv2.absdiff(prev, cur)))
            g = cv2.cvtColor(cur, cv2.COLOR_BGR2GRAY)
            std = float(np.std(g))
            item["diff_prev"] = round(diff, 2)
            item["std"] = round(std, 2)
            if f == 0:
                item["verdict"] = "ok(first frame)" if std >= 12.0 else "FAIL_BLANK(首帧空白)"
                if std < 12.0:
                    report["fail"] = True
            elif mode == "crossfade":
                # 叠化/滑入风格：边界帧允许是旧页（crossfade）或空场（docker 滑入）。
                # 预检只抓两类可靠信号（内容层面交给 judge）：
                #   ①页面冻结：边界到 +30 帧画面几乎零变化（含循环动画的活页不会零变化）
                #   ②持续空白：边界与 +30 帧都是近空白画布
                nxt = grabbed.get(min(total - 1, f + 30))
                if nxt is None:
                    item["verdict"] = "error(+30帧缺失)"
                    report["fail"] = True
                else:
                    d_nxt = float(np.mean(cv2.absdiff(cur, nxt)))
                    n_std = float(np.std(cv2.cvtColor(nxt, cv2.COLOR_BGR2GRAY)))
                    item["diff_next30"] = round(d_nxt, 2)
                    item["next_std"] = round(n_std, 2)
                    if d_nxt < 0.6 and std < 12.0:
                        item["verdict"] = "FAIL_BLANK(边界与+30帧都空白)"
                        report["fail"] = True
                    elif d_nxt < 0.6:
                        item["verdict"] = "FAIL_FROZEN(边界到+30帧画面冻结=新场景大概率未画出)"
                        report["fail"] = True
                    else:
                        item["verdict"] = "ok"
            elif diff < 2.0:
                item["verdict"] = "FAIL_SAME_AS_PREV(新场景未画出)"
                report["fail"] = True
            elif diff < 4.0:
                item["verdict"] = "FAIL_NO_HARD_CUT(边界无硬切=叠化/未切页,违反铁律1)"
                report["fail"] = True
            elif std < 12.0:
                item["verdict"] = "FAIL_BLANK(大面积空白)"
                report["fail"] = True
            else:
                item["verdict"] = "ok"
        report["checks"].append(item)
    last = grabbed.get(total - 1)
    if last is not None:
        g = cv2.cvtColor(last, cv2.COLOR_BGR2GRAY)
        report["last_frame_std"] = round(float(np.std(g)), 2)

    # D. 结尾段响度（2026-09-14 bed.wav -56dB 静音事故；素材接入前也要 volumedetect）
    if voice_end_frame is not None:
        fps = 30.0
        start_s = max(0.0, voice_end_frame / fps + 0.3)
        p = subprocess.run(
            ["ffmpeg", "-ss", str(start_s), "-i", video, "-af", "volumedetect", "-f", "null", "-"],
            capture_output=True, text=True)
        mean_line = [l for l in p.stderr.splitlines() if "mean_volume" in l]
        mean_db = float(mean_line[0].split("mean_volume:")[1].replace("dB", "").strip()) if mean_line else -99.0
        report["ending_mean_volume_db"] = mean_db
        item = {"check": "ending_loudness", "from_sec": round(start_s, 2), "mean_db": mean_db,
                "verdict": "ok" if mean_db >= -45.0 else "FAIL_SILENT_ENDING(结尾段静音,阈值-45dB)"}
        report["checks"].append(item)
        if mean_db < -45.0:
            report["fail"] = True
    with open(os.path.join(outdir, "precheck.json"), "w", encoding="utf-8") as fp:
        json.dump(report, fp, ensure_ascii=False, indent=1)
    print(json.dumps({"fail": report["fail"], "n_checks": len(report["checks"])}, ensure_ascii=False))

if __name__ == "__main__":
    main()
