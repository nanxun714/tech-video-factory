# -*- coding: utf-8 -*-
"""按新 timeline.json 重写 LinuxBasicsTutorial.tsx 的全部时序。"""
import json

BASE = r"F:\小秋技术笔记\00_视频生产线\01_源码\remotion-production"
tl = json.load(open(BASE + r"\public\audio\linux-tts\timeline.json", encoding="utf-8"))
sents = tl["sentences"]
TOTAL = tl["total_frames"]
GAP = 6

# 配音窗口
vo_lines = ",\n".join(
    '  {index: %d, audio: "s%02d.mp3", start: %d, end: %d}' % (x["index"], x["index"], x["start_frame"], x["end_frame"])
    for x in sents
)
voice_block = "const voiceLines = [\n" + vo_lines + ",\n];"

# 场景边界：start = 本句 start，end = 下一句 start - GAP（末句 = TOTAL）
names = ["SceneTitle", "ScenePwd", "SceneLs", "SceneCd", "ScenePitfalls", "SceneSummary", "SceneQuizQ", "SceneQuizA", "SceneOutro"]
bounds = []
for i in range(len(sents)):
    a = sents[i]["start_frame"]
    b = (sents[i + 1]["start_frame"] - GAP) if i + 1 < len(sents) else TOTAL
    bounds.append((a, b))
scene_block = "const scenes = [\n" + ",\n".join(
    "  {start: %d, end: %d, C: %s}" % (a, b, names[i]) for i, (a, b) in enumerate(bounds)
) + "\n];"

# subs 块（gen_subs.py 已生成）
subs_text = open("linux-subs-new.tsx", encoding="utf-8").read().strip()
if not subs_text.startswith("const subs"):
    # 兼容：gen_subs 可能输出了带尾换行的数组
    subs_text = subs_text.strip()

p = BASE + r"\src\LinuxBasicsTutorial.tsx"
s = open(p, encoding="utf-8").read()
n = 0

# 1. voiceLines
i0 = s.index("const voiceLines = [")
i1 = s.index("];", i0) + 2
s = s[:i0] + voice_block + s[i1:]
n += 1

# 2. subs
i0 = s.index("const subs: Sub[] = [")
i1 = s.index("\n];", i0) + 3
s = s[:i0] + subs_text + s[i1:]
n += 1

# 3. scenes
i0 = s.index("const scenes = [")
i1 = s.index("\n];", i0) + 2
s = s[:i0] + scene_block + s[i1:]
n += 1

# 4. bedVolume 淡出 + 时长常量
s = s.replace("1857 - 40, 1857 - 6", "%d - 40, %d - 6" % (TOTAL, TOTAL))
s = s.replace("1857", str(TOTAL))
n += 1

open(p, "w", encoding="utf-8").write(s)
print("component updated,", n, "blocks")

# 5. Root duration
pr = BASE + r"\src\Root.tsx"
sr = open(pr, encoding="utf-8").read()
sr = sr.replace("durationInFrames={1857}", "durationInFrames={%d}" % TOTAL)
open(pr, "w", encoding="utf-8").write(sr)
print("Root duration ->", TOTAL)
