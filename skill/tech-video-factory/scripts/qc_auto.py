# -*- coding: utf-8 -*-
"""一键 QC 抽帧：按页边界(±)/词级锚点/首尾帧自动生成采样清单并抽帧。

用法：
  python qc_auto.py --video out/X.mp4 --out /tmp/qc_xxx \
      --sent "0,219,407,652,928,1176,1524,1835" \
      --anchors "490,550,595" --dur 2169 [--extra "100,200"]

采样点 = 0帧 + 每页边界 b 的 {b-12, b-1, b+2} + 全部锚点帧 + {dur-10, dur-1} + extra。
输出：out/f%04d.png + manifest.txt（帧号→采样原因，可直接粘给 judge）。
"""
import argparse, json, os, shutil, tempfile

import cv2

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--video", required=True)
    ap.add_argument("--out", required=True)
    ap.add_argument("--sent", default="", help="逗号分隔的页起始帧（SENT 数组）")
    ap.add_argument("--anchors", default="", help="逗号分隔的词级锚点帧")
    ap.add_argument("--dur", type=int, required=True, help="总帧数")
    ap.add_argument("--extra", default="", help="额外采样帧")
    args = ap.parse_args()

    def nums(s):
        return [int(x) for x in s.split(",") if x.strip()]

    sent = nums(args.sent)
    anchors = nums(args.anchors)
    extra = nums(args.extra)

    samples = {}  # frame -> reason
    samples[0] = "0帧封面（必须完整主视觉）"
    for b in sent:
        samples[max(0, b - 12)] = "页边界前12帧（转场叠化前）"
        samples[max(0, b - 1)] = "页边界前1帧"
        samples[b + 2] = "页边界后2帧（新页已入场）"
    for a in anchors:
        samples.setdefault(max(0, a), "词级锚点帧（动画应已触发）")
    samples[max(0, args.dur - 10)] = "尾帧前10（结尾卡停留）"
    samples[max(0, args.dur - 1)] = "最后一帧"
    for e in extra:
        samples.setdefault(max(0, e), "指定帧")

    frames = sorted(samples)
    os.makedirs(args.out, exist_ok=True)

    # cv2 在 Windows 上读不了非 ASCII 路径，先拷到 ASCII 临时目录
    tmp = os.path.join(tempfile.gettempdir(), "qc_auto_video.mp4")
    shutil.copyfile(args.video, tmp)
    cap = cv2.VideoCapture(tmp)
    fps = cap.get(cv2.CAP_PROP_FPS) or 30
    total = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    # ⚠️ 禁用 cap.set(POS_FRAMES) 随机 seek——Windows 上会抽错帧（2026-09-14 HttpVsHttps
    # 892 边界"假空白"即此假象）。一律顺序解码挑帧。
    done = 0
    frames_sorted = sorted(fr for fr in frames if fr < total)
    idx = 0
    img = None
    for fr in frames_sorted:
        while idx <= fr:
            ok, img = cap.read()
            if not ok:
                break
            idx += 1
        if ok and idx - 1 == fr and img is not None:
            cv2.imwrite(os.path.join(args.out, "f%04d.png" % fr), img)
            done += 1
    cap.release()
    os.remove(tmp)

    with open(os.path.join(args.out, "manifest.txt"), "w", encoding="utf-8") as f:
        f.write("video=%s fps=%s total_frames=%s\n" % (os.path.abspath(args.video), fps, total))
        for fr in frames:
            f.write("f%04d.png  %s\n" % (fr, samples[fr]))
    print(json.dumps({"video": os.path.abspath(args.video), "out": os.path.abspath(args.out),
                      "frames": len(frames), "written": done}, ensure_ascii=False))

if __name__ == "__main__":
    main()
