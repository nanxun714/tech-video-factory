# -*- coding: utf-8 -*-
# inode 片 QC 抽帧：覆盖 0 帧 / 每个页边界精确帧本身 / 转场±1 / 打字中途 / 结尾卡中途
import cv2, os

VID = r"F:\小秋技术笔记\00_视频生产线\01_源码\remotion-production\out\InodeExhausted.mp4"
OUT = r"C:\qc_inode"  # 纯 ASCII 路径
os.makedirs(OUT, exist_ok=True)

FPS = 30.0
SENT = [0, 172, 323, 585, 773, 978, 1176, 1314, 1400]
DUR = 1662

frames = set()
frames.add(0)                                    # 0:00 精确帧
for b in SENT[1:]:
    frames.add(b)                                # 页边界精确帧本身
    frames.update([b - 1, b + 1])                # 转场帧 ±1
# 打字中途帧
frames.update([1024, 1028, 1104, 1108, 1200, 1210, 1246, 1250])
# 结尾卡中途 + 末帧
frames.update([1440, 1500, 1560, 1600, 1661])
# 场景中途抽检
frames.update([90, 130, 250, 300, 400, 500, 560, 700, 760, 900, 940, 1140, 1290, 1340, 1370])

cap = cv2.VideoCapture(VID)
total = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
got = []
for f in sorted(frames):
    if f >= total:
        continue
    cap.set(cv2.CAP_PROP_POS_FRAMES, f)
    ok, img = cap.read()
    if ok:
        p = os.path.join(OUT, f"f{f:05d}.png")
        cv2.imwrite(p, img)
        got.append(f)
cap.release()
print("video_frames:", total, "expected_dur:", DUR)
print("extracted:", len(got))
print(" ".join(str(g) for g in got))
