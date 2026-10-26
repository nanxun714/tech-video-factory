# -*- coding: utf-8 -*-
# GetVsPost QC 抽帧：0帧 / 每个页边界精确帧本身 / 转场±1 / 每页中途 / 结尾卡中途+末帧
import cv2, os

VID = r"F:\小秋技术笔记\00_视频生产线\01_源码\remotion-production\out\GetVsPost.mp4"
OUT = r"C:\qc_getpost"  # 纯 ASCII 路径
os.makedirs(OUT, exist_ok=True)

FPS = 30.0
SENT = [0, 198, 375, 669, 873, 1229, 1447, 1653, 1808]
DUR = 2008

frames = set()
frames.add(0)                                    # 0:00 精确帧
for b in SENT[1:]:
    frames.add(b)                                # 页边界精确帧本身
    frames.update([b - 1, b + 1])                # 转场帧 ±1
# 每页中途抽检（含词级锚点元素出现后）
frames.update([60, 150, 260, 340, 440, 560, 640, 720, 800, 950, 1050, 1140, 1210, 1300, 1400, 1500, 1590, 1700, 1760, 1840, 1900, 1960, 1990])
# 结尾卡中途 + 末帧 + CTA出现后
frames.update([1820, 1830, 1915, 1930, 2007])
# P5 幂等页飞行包中途 / P6 爬虫爬行中途 / P8 巨字中途
frames.update([980, 1005, 1240, 1260, 1290, 1360, 1660, 1690, 1730, 1790])

cap = cv2.VideoCapture(VID)
total = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
got = []
for f in sorted(frames):
    if f >= total:
        continue
    cap.set(cv2.CAP_PROP_POS_FRAMES, f)
    ok, img = cap.read()
    if ok:
        p = os.path.join(OUT, "f%05d.png" % f)
        cv2.imwrite(p, img)
        got.append(f)
cap.release()
print("video_frames:", total, "expected_dur:", DUR)
print("extracted:", len(got))
print(" ".join(str(g) for g in got))
