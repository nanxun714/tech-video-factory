# -*- coding: utf-8 -*-
"""《删除的文件去哪了》换云健 YunjianNeural +15%，按新 timeline 重写 FileDeleteSketch.tsx 全部时间参数"""
import asyncio, json, os, re
import edge_tts
from mutagen.mp3 import MP3

AUD = r"F:\小秋技术笔记\00_视频生产线\01_源码\remotion-production\public\audio"
TSX = r"F:\小秋技术笔记\00_视频生产线\01_源码\remotion-production\src\FileDeleteSketch.tsx"
ROOT = r"F:\小秋技术笔记\00_视频生产线\01_源码\remotion-production\src\Root.tsx"
VOICE, RATE, GAP, FPS = "zh-CN-YunjianNeural", "+15%", 0.18, 30

SENTS = [
    "你删掉的那个文件，其实还躺在硬盘里。",
    "只是你和电脑，都假装它不见了。",
    "这件事有两面：误删的文件，有机会救回来；但卖电脑前只做普通删除，你的照片可能被别人恢复。",
    "硬盘就像一个大仓库，每个文件，都是仓库里的一件货物。",
    "而目录，就是仓库门口的登记本，写着每件货物放在哪个货架。",
    "你按下删除键的时候，电脑只干了一件事：在登记本上，把这件货的名字划掉。",
    "货物一毫米都没挪，只是这块货架，被标记成了可以放新货。",
    "恢复软件干的事，就是跳过登记本，直接去货架上翻，找出还没被新货盖住的旧货。",
    "那什么时候才是真没了？这块位置被新文件覆盖之后。",
    "所以误删文件，第一件事是别再往这个盘里存东西，越早恢复，成功率越高。",
    "记住这句话：删除删的是目录，不是数据。",
    "学会了点个赞点个关注，更多数据保存的坑，我都放在主页合集里了。",
]
PHRASES = {
    1: ["你删掉的那个文件", "其实还躺在硬盘里"],
    2: ["只是你和电脑", "都假装它不见了"],
    3: ["这件事有两面", "误删的文件有机会救回来", "但卖电脑前只做普通删除", "你的照片可能被别人恢复"],
    4: ["硬盘就像一个大仓库", "每个文件", "都是仓库里的一件货物"],
    5: ["而目录", "就是仓库门口的登记本", "写着每件货物放在哪个货架"],
    6: ["你按下删除键的时候", "电脑只干了一件事", "在登记本上", "把这件货的名字划掉"],
    7: ["货物一毫米都没挪", "只是这块货架", "被标记成了可以放新货"],
    8: ["恢复软件干的事", "就是跳过登记本", "直接去货架上翻", "找出还没被新货盖住的旧货"],
    9: ["那什么时候才是真没了", "这块位置被新文件覆盖之后"],
    10: ["所以误删文件", "第一件事是别再往这个盘里存东西", "越早恢复", "成功率越高"],
    11: ["记住这句话", "删除删的是目录", "不是数据"],
    12: ["学会了点个赞点个关注", "更多数据保存的坑", "我都放在主页合集里了"],
}
STRIP = "，。；：？！、（）【】《》「」『』“”‘’…—·,.;:?!()[]"

def clean(t):
    for ch in STRIP:
        t = t.replace(ch, "")
    return t.strip()

async def synth_all():
    outdir = os.path.join(AUD, "filedelete-tts-v2")
    os.makedirs(outdir, exist_ok=True)
    cursor, results = 0.0, []
    for i, text in enumerate(SENTS, 1):
        out = os.path.join(outdir, f"s{i:02d}.mp3")
        if os.path.exists(out) and os.path.getsize(out) > 2500:
            dur = MP3(out).info.length
        else:
            for attempt in range(6):
                try:
                    comm = edge_tts.Communicate(text, VOICE, rate=RATE)
                    with open(out, "wb") as f:
                        async for chunk in comm.stream():
                            if chunk.get("type") == "audio":
                                f.write(chunk["data"])
                    if os.path.getsize(out) > 2500:
                        break
                except Exception as e:
                    print(f"  s{i:02d} retry {attempt + 1}: {type(e).__name__}")
                    await asyncio.sleep(2)
            else:
                raise SystemExit(f"s{i:02d} failed")
            dur = MP3(out).info.length
        st, en = round(cursor, 3), round(cursor + dur, 3)
        cursor = en + GAP
        results.append({"index": i, "start_frame": int(round(st * FPS)), "end_frame": int(round(en * FPS))})
        print(f"s{i:02d} {st:6.2f} -> {en:6.2f} ({dur:.2f}s)")
    tl = {"fps": FPS, "voice": VOICE, "rate": RATE,
          "total_sec": round(cursor - GAP, 3), "total_frames": int(round((cursor - GAP) * FPS)),
          "sentences": results}
    json.dump(tl, open(os.path.join(outdir, "timeline.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=2)
    return tl

def build_timing(tl):
    sub_lines, pw = [], {}
    for r in tl["sentences"]:
        i = r["index"]
        ph = [clean(p) for p in PHRASES[i]]
        ph = [p for p in ph if p]
        total = sum(len(p.replace(" ", "")) for p in ph)
        a, b, cur = r["start_frame"], r["end_frame"], r["start_frame"]
        for j, text in enumerate(ph):
            dur = int(round((b - a) * len(text.replace(" ", "")) / total))
            e = min(cur + dur, b)
            sub_lines.append((cur, e, text))
            pw[(i, j)] = (cur, e)
            cur = e
    st = {r["index"]: r["start_frame"] for r in tl["sentences"]}
    bounds = [st[3] - 3, st[4] - 3, st[6] - 3, st[8] - 3, st[9] - 3, st[11] - 3, st[12] - 3]
    return pw, bounds, sub_lines, st

async def main():
    tl = await synth_all()
    pw, bounds, sub_lines, st = build_timing(tl)
    DUR = tl["total_frames"]
    b1, b2, b3, b4, b5, b6, b7 = bounds
    print("DUR:", DUR, "bounds:", bounds)

    def F(i, j):
        return pw[(i, j)][0]

    P2, P3, P4, P5, P6 = b1, b2, b3, b4, b5

    def d(page, i, j, delta):
        return F(i, j) + delta - page - 10

    s = open(TSX, encoding="utf-8").read()
    s = re.sub(r"const DUR = \d+;", f"const DUR = {DUR};", s)
    vl = "const voiceLines = [\n" + "".join(
        '  {index: %d, audio: "s%02d.mp3", start: %d, end: %d},\n' % (r["index"], r["index"], r["start_frame"], r["end_frame"]) for r in tl["sentences"]
    ) + "];"
    s = re.sub(r"const voiceLines = \[.*?\n\];", vl, s, flags=re.S)
    sb = "const subs: Sub[] = [\n" + "".join('  {s: %d, e: %d, t: "%s"},\n' % (a, b, t) for a, b, t in sub_lines) + "];"
    s = re.sub(r"const subs: Sub\[\] = \[.*?\n\];", sb, s, flags=re.S)
    pg = ("const PAGES = [\n"
          "  {C: PageHook, start: 0, end: %d},\n" % b1 +
          "  {C: PageTwoFaces, start: %d, end: %d},\n" % (b1, b2) +
          "  {C: PageWarehouse, start: %d, end: %d},\n" % (b2, b3) +
          "  {C: PageDelete, start: %d, end: %d},\n" % (b3, b4) +
          "  {C: PageRecover, start: %d, end: %d},\n" % (b4, b5) +
          "  {C: PageOverwrite, start: %d, end: %d},\n" % (b5, b6) +
          "  {C: PageAphorism, start: %d, end: %d},\n" % (b6, b7) +
          "  {C: PageOutro, start: %d, end: DUR},\n" % b7 +
          "]")
    s = re.sub(r"const PAGES = \[.*?\n\];", pg, s, flags=re.S)
    s = s.replace("audio/filedelete-tts/", "audio/filedelete-tts-v2/")
    s = re.sub(r"\{\[[\d, ]+\]\.map\(\(t\) => \(",
               "{[" + ", ".join(str(x) for x in bounds) + "].map((t) => (", s)

    # 页内 delay 站点：(模板含☃, 句i, 短语j, 偏移)
    T = [
        # P2 两面
        ('color={GREEN_F} seed={2} delay={☃} />', 3, 1, -4),
        ('<WBox f={f} x={190} y={330} w={660} h={360} sw={5} seed={2} delay={☃} dur={16} />', 3, 1, -2),
        ('fontSize: 56, color: INK, letterSpacing: 8, opacity: prog(f, ☃, 10),\n      }}>误删的文件</div>', 3, 1, 6),
        ('color: GREEN_E, fontWeight: 700, letterSpacing: 3,\n        opacity: prog(f, ☃, 10),', 3, 1, 18),
        ('<FilePaper f={f} x={430} y={530} w={210} h={110} label="文件回来了" ts={24} delay={☃} />', 3, 1, 28),
        ('<Arrow f={f} x={250} y={565} len={160} bend={-24} rot={-14} color={GREEN_E} delay={☃} sw={6} />', 3, 1, 34),
        ('color="rgba(233,170,180,0.30)" seed={5} delay={☃} />', 3, 2, -4),
        ('<WBox f={f} x={1070} y={330} w={660} h={360} sw={5} seed={5} delay={☃} dur={16} />', 3, 2, -2),
        ('fontSize: 56, color: INK, letterSpacing: 6, opacity: prog(f, ☃, 10),\n      }}>卖电脑只做删除</div>', 3, 2, 6),
        ('color: RED, fontWeight: 700, letterSpacing: 2,\n        opacity: prog(f, ☃, 10),', 3, 2, 18),
        ('<FilePaper f={f} x={1310} y={530} w={200} h={110} label="照片.jpg" ts={24} delay={☃} />', 3, 2, 28),
        ('stroke={RED} sw={6} delay={☃} dur={12} />', 3, 2, 40),
        ('<circle cx={1612} cy={560} r={14} fill={RED} opacity={prog(f, ☃, 6)} />', 3, 2, 48),
        ('<Stick f={f} x={940} y={905} s={1.05} pose="cheer" delay={☃} />', 3, 3, 6),
        ('<Bubble f={f} x={985} y={755} w={330} h={100} text="一体两面" ts={34} delay={☃} tail="bl" />', 3, 3, 20),
        # P3 仓库
        ('fontSize: 38, color: SUBC, letterSpacing: 4, opacity: prog(f, ☃, 10),\n      }}>文件 = 仓库里的一件件货物</div>', 4, 0, 8),
        ('<WBox f={f} x={140} y={300} w={600} h={540} sw={6} seed={9} delay={☃} dur={20} fill="rgba(255,255,255,0.8)" />', 4, 0, 14),
        ('<Draw f={f} d="M 150 495 L 730 495 M 150 685 L 730 685" stroke={INK} sw={5} delay={☃} dur={10} />', 4, 0, 28),
        ('label="照片.png" ts={22} delay={☃} />', 4, 0, 20),
        ('label="文档.doc" ts={22} delay={☃} />', 4, 0, 30),
        ('label="视频.mp4" ts={22} delay={☃} />', 4, 0, 38),
        ('label="音乐.flac" ts={22} delay={☃} />', 4, 0, 46),
        ('fontSize: 32, color: SUBC, letterSpacing: 3, opacity: prog(f, ☃, 10),\n      }}>货架 = 磁盘上的位置</div>', 4, 1, 2),
        ('<WBox f={f} x={1210} y={300} w={570} h={540} sw={6} seed={12} delay={☃} dur={20} fill="rgba(255,252,240,0.95)" />', 5, 0, 6),
        ('fontFamily: T_FONT, fontSize: 46, color: INK, letterSpacing: 6, opacity: prog(f, ☃, 10),\n      }}>登记本（目录）</div>', 5, 0, 16),
        ('row(430, "照片.png → 3 号架", ☃)', 5, 1, 4),
        ('row(550, "文档.doc → 7 号架", ☃)', 5, 1, 14),
        ('row(670, "视频.mp4 → 9 号架", ☃)', 5, 1, 24),
        ('<Arrow f={f} x={760} y={382} len={420} bend={-34} rot={-6} delay={☃} sw={6} />', 5, 2, 4),
        ('<Bubble f={f} x={700} y={620} w={420} h={104} text="名字和货 是两码事" ts={32} delay={☃} tail="br" />', 5, 2, 22),
        # P4 删除
        ('<Stick f={f} x={255} y={330} s={1.1} pose="point" delay={☃} />', 6, 0, 8),
        ('<WBox f={f} x={170} y={440} w={270} h={160} sw={6} seed={3} delay={☃} dur={14} fill={BLUE_F} fillOp={0.8} />', 6, 0, 14),
        ("fontSize: 46, color: INK,\n        opacity: prog(f, ☃, 8), letterSpacing: 2,\n      }}>Delete</div>", 6, 0, 24),
        ('<Arrow f={f} x={455} y={500} len={165} bend={-12} delay={☃} sw={6} />', 6, 1, 2),
        ('<WBox f={f} x={640} y={250} w={640} h={560} sw={6} seed={6} delay={☃} dur={18} fill="rgba(255,252,240,0.95)" />', 6, 0, 20),
        ('fontFamily: T_FONT, fontSize: 44, color: INK, letterSpacing: 6, opacity: prog(f, ☃, 10),\n      }}>登记本</div>', 6, 0, 30),
        ('opacity: prog(f, ☃, 10),\n        whiteSpace: "nowrap",\n      }}>旅行照片.jpg</div>', 6, 1, 6),
        ('opacity: prog(f, ☃, 10),\n        whiteSpace: "nowrap",\n      }}>工作文档.doc</div>', 6, 1, 14),
        ('opacity: prog(f, ☃, 10),\n        whiteSpace: "nowrap",\n      }}>安装包.exe</div>', 6, 1, 22),
        ('<Draw f={f} d="M 700 448 L 1220 448 M 700 570 L 1220 570 M 700 692 L 1220 692" stroke={SUBC} sw={3} delay={☃} dur={8} op={0.55} />', 6, 1, 30),
        ('<Squiggle f={f} x={750} y={408} w={420} delay={☃} sw={9} />', 6, 3, -4),
        ('opacity: prog(f, ☃, 10),\n      }}>这一行 被划掉了</div>', 6, 3, 14),
        ('<WBox f={f} x={1400} y={330} w={400} h={300} sw={5} seed={8} delay={☃} dur={14} fill="rgba(255,255,255,0.85)" />', 7, 0, 4),
        ('<FilePaper f={f} x={1455} y={380} w={290} h={150} label="旅行照片.jpg" ts={26} delay={☃} />', 7, 0, 16),
        ('color: GREEN_E, fontWeight: 700, letterSpacing: 6,\n        opacity: prog(f, ☃, 10),\n      }}>货：没动！</div>', 7, 0, 30),
        ('<Sticker f={f} x={1440} y={730} w={330} h={112} title="标记成 可复用" rot={-3} delay={☃} ts={34} color={ORANGE_E} />', 7, 2, -6),
        ('<WCol f={f} cx={460} cy={905} rx={310} ry={72} color={YEL_F} seed={6} delay={☃} />', 7, 2, 16),
        ('opacity: prog(f, ☃, 10), whiteSpace: "nowrap",\n      }}>数据还在原地</div>', 7, 2, 30),
        # P5 恢复
        ('<WBox f={f} x={180} y={330} w={420} h={380} sw={6} seed={11} delay={☃} dur={16} fill="rgba(255,252,240,0.95)" />', 8, 0, 8),
        ('fontFamily: B_FONT, fontSize: 38, color: INK, letterSpacing: 4, opacity: prog(f, ☃, 10),\n      }}>登记本</div>', 8, 0, 18),
        ('<Draw f={f} d="M 230 460 L 550 460 M 230 530 L 490 530 M 230 600 L 530 600" stroke={SUBC} sw={4} delay={☃} dur={8} op={0.6} />', 8, 0, 26),
        ('<BigX f={f} x={210} y={360} w={360} h={320} delay={☃} sw={9} />', 8, 1, 2),
        ('color: RED, fontWeight: 700, letterSpacing: 6,\n        opacity: prog(f, ☃, 10),\n      }}>跳 过</div>', 8, 1, 24),
        ('<Arrow f={f} x={620} y={500} len={580} bend={-110} rot={-10} delay={☃} color={ORANGE_E} sw={7} />', 8, 2, -2),
        ('<WBox f={f} x={1230} y={300} w={560} h={540} sw={6} seed={14} delay={☃} dur={18} fill="rgba(255,255,255,0.85)" />', 8, 0, 30),
        ('<Draw f={f} d="M 1240 520 L 1780 520 M 1240 710 L 1780 710" stroke={INK} sw={5} delay={☃} dur={10} />', 8, 0, 42),
        ('<FilePaper f={f} x={1270} y={350} w={190} h={118} label="新文件" ts={22} delay={☃} />', 8, 2, 8),
        ('label="旅行照片.jpg" ts={20} delay={☃} dashed', 8, 3, -6),
        ('<FilePaper f={f} x={1270} y={550} w={190} h={118} label="日志.log" ts={22} delay={☃} />', 8, 2, 16),
        ('<Draw f={f} delay={☃} dur={18} dashed\n        d={blobPath(1605, 408, 155, 105, 7)} stroke={ORANGE_E} sw={6} />', 8, 3, 18),
        ('<Sticker f={f} x={700} y={230} w={330} h={108} title="直接翻货架" rot={-4} delay={☃} ts={34} color={ORANGE_E} />', 8, 2, 6),
        ('<Stick f={f} x={430} y={810} s={1.2} pose="point" delay={☃} />', 8, 2, 2),
        ('<Draw f={f} delay={☃} dur={12}\n        d={`M 512 700 a 48 48 0 1 1 96 0 a 48 48 0 1 1 -96 0`} stroke={INK} sw={6} />', 8, 2, 18),
        ('<Draw f={f} delay={☃} dur={6} d={`M 598 728 L 648 776`} stroke={INK} sw={7} />', 8, 2, 26),
        ('<Bubble f={f} x={640} y={640} w={400} h={100} text="专挑没人盖的翻" ts={32} delay={☃} tail="bl" />', 8, 3, 34),
        # P6 覆盖
        ('fontSize: 32, color: SUBC, letterSpacing: 3, opacity: prog(f, ☃, 10),\n      }}>磁盘上的一块位置</div>', 9, 0, 10),
        ('<WBox f={f} x={740} y={300} w={440} h={330} sw={6} seed={10} delay={☃} dur={16} fill="rgba(255,255,255,0.85)" />', 9, 0, 6),
        ('<FilePaper f={f} x={810} y={368} w={300} h={170} label="旧数据" ts={30} delay={☃} />', 9, 0, 22),
        ('<BigX f={f} x={765} y={322} w={390} h={290} delay={☃} sw={10} />', 9, 1, 54),
        ('opacity: prog(f, ☃, 10),\n      }}>真没了</div>', 9, 1, 72),
        ('<Sticker f={f} x={1250} y={430} w={300} h={110} title="覆盖 = 真没了" rot={3} delay={☃} ts={34} color={RED} />', 9, 1, 90),
        ('<Sticker f={f} x={380} y={780} w={640} h={150} title="误删第一件事：别再写入" sub="越早恢复 成功率越高" delay={☃} ts={40} color={GREEN_E} />', 10, 1, -6),
        ('<Bulb f={f} x={1120} y={840} s={1.35} delay={☃} />', 10, 2, 8),
        # P8 CTA
        ('opacity: prog(f, ☃, 10), whiteSpace: "nowrap",\n      }}>顺手点个关注，下期不迷路</div>', 12, 1, 4),
        ('title="下期：为什么重启能解决 90% 的问题" sub="更多翻车现场 都在主页合集" delay={☃} ts={46} color={GREEN_E} />', 12, 2, 2),
        ('<Bulb f={f} x={1560} y={250} s={1.4} delay={☃} />', 12, 2, -14),
        ('opacity: 0.72 * prog(f, ☃, 10),', 12, 2, 40),
    ]
    pages = {3: P2, 4: P3, 5: P3, 6: P4, 7: P4, 8: P5, 9: P6, 10: P6, 12: b7}
    missed = []
    for tmpl, i, j, delta in T:
        P = pages[i]
        new = tmpl.replace("☃", str(F(i, j) + delta - P - 10))
        pat = re.escape(tmpl).replace(re.escape("☃"), r"(-?\d+)")
        m = re.search(pat, s)
        if not m:
            missed.append("NO MATCH: " + tmpl[:64].replace("\n", "\\n"))
            continue
        if m.group(1) != str(F(i, j) + delta - P - 10):
            s = s.replace(m.group(0), new, 1)
    # P6 飞行时间窗
    fly_start = F(9, 1) - 8 - P6 - 10
    s = re.sub(r"const flyT = interpolate\(f, \[-?\d+, -?\d+\], \[0, 1\], clamp\);",
               f"const flyT = interpolate(f, [{fly_start}, {fly_start + 54}], [0, 1], clamp);", s)
    # P7/P8 固定小延迟微调（P7 页变长，保持原 stagger 即可，不动）
    # 音效：click=Delete键出现, error=划掉, ding=圈中旧货, pop=新文件落位
    for old_snd, new_snd in [
        ('<Sequence from={\d+} durationInFrames={20}>\s*\n(\s*)<Audio src=\{staticFile\("audio/sfx/click.wav"\)\}',
         f'<Sequence from={{{F(6, 0) + 16 - P4 - 10 + P4}}} durationInFrames={{20}}>\n\\1<Audio src={{staticFile("audio/sfx/click.wav")}}'),
        ('<Sequence from={\d+} durationInFrames={30}>\s*\n(\s*)<Audio src=\{staticFile\("audio/sfx/error.wav"\)\}',
         f'<Sequence from={{{F(6, 3) - 4 - P4 - 10 + P4 + 6}}} durationInFrames={{30}}>\n\\1<Audio src={{staticFile("audio/sfx/error.wav")}}'),
        ('<Sequence from={\d+} durationInFrames={30}>\s*\n(\s*)<Audio src=\{staticFile\("audio/sfx/ding.wav"\)\}',
         f'<Sequence from={{{F(8, 3) + 18 - P5 - 10 + P5}}} durationInFrames={{30}}>\n\\1<Audio src={{staticFile("audio/sfx/ding.wav")}}'),
        ('<Sequence from={\d+} durationInFrames={30}>\s*\n(\s*)<Audio src=\{staticFile\("audio/sfx/pop.wav"\)\}',
         f'<Sequence from={{{fly_start + 54 + P6}}} durationInFrames={{30}}>\n\\1<Audio src={{staticFile("audio/sfx/pop.wav")}}'),
    ]:
        s = re.sub(old_snd, new_snd, s, count=1)
    open(TSX, "w", encoding="utf-8", newline="\n").write(s)
    print("sites patched:", len(T) - len(missed), "/", len(T))
    for m in missed:
        print(" MISS:", m)

    rs = open(ROOT, encoding="utf-8").read()
    rs = re.sub(r'(id="FileDeleteSketch"\s*\n\s*component=\{FileDeleteSketch\}\s*\n\s*durationInFrames=)\{\d+\}',
                r"\g<1>{%d}" % DUR, rs)
    open(ROOT, "w", encoding="utf-8", newline="\n").write(rs)
    print("Root DUR ->", DUR)

asyncio.run(main())
