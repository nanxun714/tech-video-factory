# -*- coding: utf-8 -*-
"""换声/改语速后的整体重对轴。
用法: python retime.py retime-config.json

当更换配音音色或语速后，每句时长都会变化。本脚本按新 timeline.json 重写组件里
的 4 个时序块（配音窗口 / 场景边界 / 字幕数组 / 总时长），并同步 Root.tsx。

配置 JSON:
{
  "tsx": "C:/.../src/MyVideo.tsx",
  "root": "C:/.../src/Root.tsx",
  "timeline": "C:/.../public/audio/mytopic-tts/timeline.json",
  "subs_file": "C:/.../my-subs.tsx",        // gen_subs.py 的输出文件
  "scene_names": ["SceneTitle", "ScenePwd"], // 与句子一一对应
  "old_duration": 1857,                      // Root.tsx 里旧的 durationInFrames
  "scene_gap_frames": 6
}

注意：场景内元素动画的 delay 是相对场景的帧号，通常无需改；若新语速差异大
（>15%），打字机 start 帧需要按比例手动校一遍。
"""
import json, sys


def main(cfg_path):
    cfg = json.load(open(cfg_path, encoding="utf-8"))
    tl = json.load(open(cfg["timeline"], encoding="utf-8"))
    sents = tl["sentences"]
    total = tl["total_frames"]
    gap = cfg.get("scene_gap_frames", 6)
    names = cfg["scene_names"]
    assert len(names) == len(sents), "scene_names 数量必须等于句子数量"

    vo = "const voiceLines = [\n" + ",\n".join(
        '  {index: %d, audio: "s%02d.mp3", start: %d, end: %d}' % (
            x["index"], x["index"], x["start_frame"], x["end_frame"])
        for x in sents) + ",\n];"

    bounds = []
    for i in range(len(sents)):
        a = sents[i]["start_frame"]
        b = (sents[i + 1]["start_frame"] - gap) if i + 1 < len(sents) else total
        bounds.append((a, b))
    sc = "const scenes = [\n" + ",\n".join(
        "  {start: %d, end: %d, C: %s}" % (a, b, names[i]) for i, (a, b) in enumerate(bounds)
    ) + "\n];"

    subs = open(cfg["subs_file"], encoding="utf-8").read().strip()

    p = cfg["tsx"]
    s = open(p, encoding="utf-8").read()

    i0 = s.index("const voiceLines = [")
    i1 = s.index("];", i0) + 2
    s = s[:i0] + vo + s[i1:]

    i0 = s.index("const subs: Sub[] = [")
    i1 = s.index("\n];", i0) + 3
    s = s[:i0] + subs + s[i1:]

    i0 = s.index("const scenes = [")
    i1 = s.index("\n];", i0) + 2
    s = s[:i0] + sc + s[i1:]

    s = s.replace("%d - 40, %d - 6" % (cfg["old_duration"], cfg["old_duration"]),
                  "%d - 40, %d - 6" % (total, total))
    s = s.replace(str(cfg["old_duration"]), str(total))
    open(p, "w", encoding="utf-8").write(s)

    pr = cfg["root"]
    sr = open(pr, encoding="utf-8").read()
    sr = sr.replace("durationInFrames={%d}" % cfg["old_duration"],
                    "durationInFrames={%d}" % total)
    open(pr, "w", encoding="utf-8").write(sr)
    print("retimed ->", total, "frames (%.1fs)" % (total / 30))


if __name__ == "__main__":
    main(sys.argv[1])
