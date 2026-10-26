# -*- coding: utf-8 -*-
"""批量8条渲染后抽帧QC。用法: python qc_frames.py <mp4路径> <总帧数> [场景边界帧,逗号分隔]"""
import cv2, os, sys

mp4 = sys.argv[1]
total = int(sys.argv[2])
bounds = [int(x) for x in sys.argv[3].split(",")] if len(sys.argv) > 3 else []

cap = cv2.VideoCapture(mp4)
out_dir = mp4.rsplit(".", 1)[0] + "_qc"
os.makedirs(out_dir, exist_ok=True)

# 采集点：每场景结束帧+前几帧、每场景中点（防中段空白）、0:00、结尾卡中途
frames = {0}
for b in bounds:
    frames.add(max(0, b - 1))
    frames.add(max(0, b - 12))
    frames.add(min(total - 1, b - 60))  # 场景中段
frames.add(total - 1)
frames.add(max(0, total - 45))  # 结尾卡中途

saved = []
for f in sorted(frames):
    cap.set(cv2.CAP_PROP_POS_FRAMES, f)
    ok, img = cap.read()
    if not ok:
        continue
    p = os.path.join(out_dir, f"f{f:05d}.png")
    cv2.imwrite(p, img)
    saved.append(p)
cap.release()
print("\n".join(saved))
