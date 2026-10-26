# -*- coding: utf-8 -*-
"""云健 YunjianNeural +15% 重新配音，按新 timeline 重写 RestartSketch.tsx 全部时间参数（纯字符串替换）"""
import asyncio, json, os, re
import edge_tts
from mutagen.mp3 import MP3

AUD = r"F:\小秋技术笔记\00_视频生产线\01_源码\remotion-production\public\audio"
TSX = r"F:\小秋技术笔记\00_视频生产线\01_源码\remotion-production\src\RestartSketch.tsx"
ROOT = r"F:\小秋技术笔记\00_视频生产线\01_源码\remotion-production\src\Root.tsx"
VOICE, RATE, GAP, FPS = "zh-CN-YunjianNeural", "+15%", 0.18, 30

SENTS = [
    "电脑一卡死，网友的第一句话永远是：重启试试。",
    "神奇的是，重启还真治好了大部分毛病。它到底在修什么？",
    "程序跑久了，内存里会堆满临时数据：崩溃留下的残渣，占着不放的资源，还有乱了套的状态。",
    "这些脏东西没人清理，越积越多，程序就开始抽风。",
    "而重启，就是把内存整个清空，让所有程序从头再来。",
    "就像考试的草稿纸写满了，擦掉重画，比在一堆乱线里找错误快得多。",
    "因为大部分故障，只是软件的状态乱了，不是硬件坏了。",
    "所以一张干净的白纸，就能解决九成问题。",
    "但注意：如果是硬件坏了，或者文件本身就损毁了，重启一百次也没用。",
    "所以记住顺序：先重启，再排查。重启能好的，都不是大毛病。",
    "记住这句话：重启不是玄学，是把乱掉的状态清零。",
    "学会了点个赞点个关注，下期讲你按 Ctrl+C 的瞬间，电脑做了什么。",
]
PHRASES = {
    1: ["电脑一卡死", "网友的第一句话永远是", "重启试试"],
    2: ["神奇的是", "重启还真治好了大部分毛病", "它到底在修什么"],
    3: ["程序跑久了", "内存里会堆满临时数据", "崩溃留下的残渣", "占着不放的资源", "还有乱了套的状态"],
    4: ["这些脏东西没人清理", "越积越多", "程序就开始抽风"],
    5: ["而重启", "就是把内存整个清空", "让所有程序从头再来"],
    6: ["就像考试的草稿纸写满了", "擦掉重画", "比在乱线里找错误快得多"],
    7: ["因为大部分故障", "只是软件的状态乱了", "不是硬件坏了"],
    8: ["所以一张干净的白纸", "就能解决九成问题"],
    9: ["但注意", "如果是硬件坏了", "或者文件本身就损毁了", "重启一百次也没用"],
    10: ["所以记住顺序", "先重启再排查", "重启能好的都不是大毛病"],
    11: ["记住这句话", "重启不是玄学", "是把乱掉的状态清零"],
    12: ["学会了点个赞点个关注", "下期讲你按 Ctrl+C 的瞬间", "电脑做了什么"],
}
STRIP = "，。；：？！、（）【】《》「」『』“”‘’…—·,.;:?!()[]"

def clean(t):
    for ch in STRIP:
        t = t.replace(ch, "")
    return t.strip()

def build_delays(tl):
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
    bounds = [st[3] - 5, st[5] - 5, st[7] - 5, st[9] - 5, st[10] - 5, st[11] - 5, st[12] - 5]
    d = {}
    p2, p3, p4, p5, p6, p7, p8 = bounds
    off = 10
    def F(i, j):
        return pw[(i, j)][0]
    d["p2_canzha"] = F(3, 2) + 4 - p2 - off
    d["p2_ziyuan"] = F(3, 3) + 4 - p2 - off
    d["p2_zhuangtai"] = F(3, 4) + 4 - p2 - off
    d["p2_meirenqing"] = F(4, 0) + 4 - p2 - off
    d["p2_yueji"] = F(4, 1) - 4 - p2 - off
    d["p2_yueji2"] = d["p2_yueji"] + 8
    d["p2_stick"] = F(4, 1) + 10 - p2 - off
    d["p2_bubble"] = F(4, 2) + 4 - p2 - off
    d["p3_fade"] = F(5, 1) - 8 - p3 - off
    d["p3_qingkong"] = F(5, 1) + 4 - p3 - off
    d["p3_dirty"] = F(6, 0) + 4 - p3 - off
    d["p3_dirtylabel"] = d["p3_dirty"] + 8
    d["p3_scrib"] = F(6, 0) + 14 - p3 - off
    d["p3_arrow"] = F(6, 1) - 6 - p3 - off
    d["p3_clean"] = F(6, 1) + 4 - p3 - off
    d["p3_cleanlabel"] = d["p3_clean"] + 14
    d["p3_bottom"] = F(6, 2) + 4 - p3 - off
    d["p4_card"] = F(7, 0) + 4 - p4 - off
    d["p4_card2"] = d["p4_card"] + 2
    d["p4_cardtitle"] = F(7, 1) + 2 - p4 - off
    d["p4_cardsub"] = F(7, 2) + 2 - p4 - off
    d["p4_arrow"] = F(8, 0) - 4 - p4 - off
    d["p4_yellow"] = F(8, 0) + 2 - p4 - off
    d["p4_jiucheng"] = F(8, 0) + 8 - p4 - off
    d["p4_sub"] = F(8, 1) + 2 - p4 - off
    d["p4_stick"] = F(8, 1) + 22 - p4 - off
    d["p4_bubble"] = F(8, 1) + 36 - p4 - off
    d["p5_c1"] = F(9, 1) + 2 - p5 - off
    d["p5_c1t"] = d["p5_c1"] + 8
    d["p5_x1"] = F(9, 2) - 8 - p5 - off
    d["p5_c2"] = F(9, 2) + 4 - p5 - off
    d["p5_c2t"] = d["p5_c2"] + 8
    d["p5_x2"] = F(9, 3) - 10 - p5 - off
    d["p5_red"] = F(9, 3) + 4 - p5 - off
    d["p5_bulb"] = d["p5_c1"] - 4
    d["p6_b1"] = F(10, 1) + 2 - p6 - off
    d["p6_arrow"] = d["p6_b1"] + 24
    d["p6_b2"] = d["p6_b1"] + 30
    d["p6_cloud"] = F(10, 2) + 2 - p6 - off
    d["p6_cloudt"] = d["p6_cloud"] + 12
    d["p7_sub"] = F(11, 2) - 4 - p7 - off
    d["p7_sticker"] = F(11, 2) + 14 - p7 - off
    d["p7_stick"] = d["p7_sub"] - 10
    d["p8_sub"] = F(12, 0) + 42 - p8 - off
    d["p8_sticker"] = F(12, 1) - 6 - p8 - off
    d["p8_bulb"] = d["p8_sticker"] - 14
    d["p8_sign"] = d["p8_sticker"] + 42
    return d, tl["total_frames"], bounds, sub_lines

async def synth_all():
    outdir = os.path.join(AUD, "restart-tts-v4")
    os.makedirs(outdir, exist_ok=True)
    cursor, results = 0.0, []
    for i, text in enumerate(SENTS, 1):
        out = os.path.join(outdir, f"s{i:02d}.mp3")
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

async def main():
    d3, _, _, _ = None, None, None, None  # 现值直接从 tsx 提取
    tl4 = await synth_all()
    d4, DUR4, bounds4, sub4 = build_delays(tl4)
    print("v4 DUR:", DUR4, "bounds:", bounds4)

    s = open(TSX, encoding="utf-8").read()
    s = re.sub(r"const DUR = \d+;", f"const DUR = {DUR4};", s)
    vl = "const voiceLines = [\n" + "".join(
        '  {index: %d, audio: "s%02d.mp3", start: %d, end: %d},\n' % (r["index"], r["index"], r["start_frame"], r["end_frame"]) for r in tl4["sentences"]
    ) + "];"
    s = re.sub(r"const voiceLines = \[.*?\n\];", vl, s, flags=re.S)
    sb = "const subs: Sub[] = [\n" + "".join('  {s: %d, e: %d, t: "%s"},\n' % (a, b, t) for a, b, t in sub4) + "];"
    s = re.sub(r"const subs: Sub\[\] = \[.*?\n\];", sb, s, flags=re.S)
    pg = ("const PAGES = [\n"
          "  {C: PageHook, start: 0, end: %d},\n" % bounds4[0] +
          "  {C: PageMess, start: %d, end: %d},\n" % (bounds4[0], bounds4[1]) +
          "  {C: PageClear, start: %d, end: %d},\n" % (bounds4[1], bounds4[2]) +
          "  {C: PageWhy, start: %d, end: %d},\n" % (bounds4[2], bounds4[3]) +
          "  {C: PageException, start: %d, end: %d},\n" % (bounds4[3], bounds4[4]) +
          "  {C: PageOrder, start: %d, end: %d},\n" % (bounds4[4], bounds4[5]) +
          "  {C: PageAphorism, start: %d, end: %d},\n" % (bounds4[5], bounds4[6]) +
          "  {C: PageOutro, start: %d, end: DUR},\n" % bounds4[6] +
          "]")
    s = re.sub(r"const PAGES = \[.*?\n\];", pg, s, flags=re.S)
    s = s.replace("audio/restart-tts-v3/", "audio/restart-tts-v4/")
    s = re.sub(r"\{\[[\d, ]+\]\.map\(\(t\) => \(",
               "{[" + ", ".join(str(x) for x in bounds4) + "].map((t) => (", s)

    # 页内 delay：锚点模板（☃=数字占位），old 用 v3 值，new 用 v4 值
    T = [
        ('fontSize: 32, fontWeight: 700, color: ORANGE_E,\n        opacity: prog(f, ☃, 10)', "p2_canzha"),
        ('fontSize: 32, fontWeight: 700, color: BLUE_E,\n        opacity: prog(f, ☃, 10)', "p2_ziyuan"),
        ('fontSize: 32, fontWeight: 700, color: RED,\n        opacity: prog(f, ☃, 10)', "p2_zhuangtai"),
        ('seed={21} delay={☃} />', "p2_yueji"),
        ('seed={24} delay={☃} />', "p2_yueji2"),
        ('opacity: prog(f, ☃, 10), whiteSpace: "nowrap",\n      }}>没人清理 越积越多</div>', "p2_meirenqing"),
        ('pose="cheer" delay={☃} />\n      <Bubble f={f} x={1300}', "p2_stick"),
        ('text="程序开始抽风" ts={32} delay={☃} tail="bl"', "p2_bubble"),
        ('const junkOp = 1 - prog(f, ☃, 24);', "p3_fade"),
        ('opacity: prog(f, ☃, 12), whiteSpace: "nowrap",\n      }}>✓ 全部清空</div>', "p3_qingkong"),
        ('seed={12} delay={☃} dur={14}', "p3_dirty"),
        ('opacity: prog(f, ☃, 8), letterSpacing: 2,', "p3_dirtylabel"),
        ('delay={☃ + i * 5} dur={8} op={0.75 * scribOp}', "p3_scrib"),
        ('x={990} y={430} len={110} bend={-16} rot={-10} delay={☃} sw={6} />', "p3_arrow"),
        ('x={1462} y={450} len={80} bend={-10} delay={☃} color={GREEN_E} sw={6} />', "p3_arrow"),
        ('seed={15} delay={☃} dur={14}', "p3_clean"),
        ('opacity: prog(f, ☃, 10), whiteSpace: "nowrap",\n      }}>干干净净</div>', "p3_cleanlabel"),
        ('opacity: prog(f, ☃, 10), whiteSpace: "nowrap",\n      }}>\n        擦掉重画', "p3_bottom"),
        ('color={BLUE_F} seed={2} delay={☃} />', "p4_card"),
        ('seed={2} delay={☃} dur={16} />', "p4_card2"),
        ('opacity: prog(f, ☃, 10),\n      }}>只是软件的状态乱了</div>', "p4_cardtitle"),
        ('opacity: prog(f, ☃, 10), whiteSpace: "nowrap",\n      }}>硬件本身没坏</div>', "p4_cardsub"),
        ('x={815} y={510} len={170} bend={-14} delay={☃} sw={7} />', "p4_arrow"),
        ('cx={1380} cy={530} rx={330} ry={185} color={YEL_F} seed={6} delay={☃} />', "p4_yellow"),
        ('opacity: prog(f, ☃, 14),', "p4_jiucheng"),
        ('opacity: prog(f, ☃, 10), whiteSpace: "nowrap",\n      }}>一张白纸就能解决</div>', "p4_sub"),
        ('x={330} y={880} s={1.1} pose="point" delay={☃} />', "p4_stick"),
        ('text="状态清零就好" ts={34} delay={☃} tail="bl"', "p4_bubble"),
        ('seed={5} delay={☃} dur={14}', "p5_c1"),
        ('opacity: prog(f, ☃, 10),\n      }}>硬件坏了</div>', "p5_c1t"),
        ('x={255} y={355} w={590} h={230} delay={☃} sw={10} />', "p5_x1"),
        ('seed={8} delay={☃} dur={14}', "p5_c2"),
        ('opacity: prog(f, ☃, 10),\n      }}>文件本身损毁了</div>', "p5_c2t"),
        ('x={1095} y={355} w={590} h={230} delay={☃} sw={10} />', "p5_x2"),
        ('opacity: prog(f, ☃, 12),\n      }}>这不是重启能救的</div>', "p5_red"),
        ('x={1560} y={210} s={1.3} delay={☃} />', "p5_bulb"),
        ('{badge(330, "①", "先重启", BLUE_E, BLUE_F, ☃)}', "p6_b1"),
        ('x={620} y={460} len={190} delay={☃} sw={7} />', "p6_arrow"),
        ('{badge(830, "②", "再排查", ORANGE_E, ORANGE_F, ☃)}', "p6_b2"),
        ('cy={800} rx={430} ry={80} color={YEL_F} seed={6} delay={☃} />', "p6_cloud"),
        ('opacity: prog(f, ☃, 10), whiteSpace: "nowrap",\n      }}>小毛病重启就行 大毛病才要排查</div>', "p6_cloudt"),
        ('opacity: prog(f, ☃, 12), whiteSpace: "nowrap",\n      }}>治得了状态乱 治不了硬件坏</div>', "p7_sub"),
        ('sub="截图保存" rot={4} delay={☃} ts={34} color={ORANGE_E} />', "p7_sticker"),
        ('x={330} y={760} s={1.2} pose="cheer" delay={☃} />', "p7_stick"),
        ('opacity: prog(f, ☃, 10), whiteSpace: "nowrap",\n      }}>顺手点个关注，下期不迷路</div>', "p8_sub"),
        ('delay={☃} ts={46} color={GREEN_E} />', "p8_sticker"),
        ('x={1560} y={250} s={1.4} delay={☃} />', "p8_bulb"),
        ('opacity: 0.72 * prog(f, ☃, 10),', "p8_sign"),
    ]
    missed = []
    for tmpl, key in T:
        # 从当前 tsx 提取现值作为 old
        pat = re.escape(tmpl).replace(re.escape("☃"), r"(-?\d+)")
        m = re.search(pat, s)
        if not m:
            missed.append("NO MATCH: " + tmpl[:64].replace("\n", "\\n"))
            continue
        old = tmpl.replace("☃", m.group(1))
        new = tmpl.replace("☃", str(d4[key]))
        if old != new:
            s = s.replace(old, new, 1)
    # 音效帧：warm3 = p3_qingkong+P3start, fall3 = p5_x1+P5start（旧帧值从 tsx 正则提取）
    m_w = re.search(r'<Sequence from=\{(\d+)\} durationInFrames=\{30\}>\s*\n\s*<Audio src=\{staticFile\("audio/sfx/warm3\.wav"\)\}', s)
    m_f = re.search(r'<Sequence from=\{(\d+)\} durationInFrames=\{30\}>\s*\n\s*<Audio src=\{staticFile\("audio/sfx/fall3\.wav"\)\}', s)
    if m_w:
        s = s.replace('<Sequence from={%s} durationInFrames={30}>\n        <Audio src={staticFile("audio/sfx/warm3.wav")}' % m_w.group(1),
                      '<Sequence from={%d} durationInFrames={30}>\n        <Audio src={staticFile("audio/sfx/warm3.wav")}' % (d4["p3_qingkong"] + bounds4[1]))
    if m_f:
        s = s.replace('<Sequence from={%s} durationInFrames={30}>\n        <Audio src={staticFile("audio/sfx/fall3.wav")}' % m_f.group(1),
                      '<Sequence from={%d} durationInFrames={30}>\n        <Audio src={staticFile("audio/sfx/fall3.wav")}' % (d4["p5_x1"] + bounds4[3]))
    open(TSX, "w", encoding="utf-8", newline="\n").write(s)
    print("patched:", len(T) - len(missed), "/", len(T))
    for m in missed:
        print(" MISS:", m)

    rs = open(ROOT, encoding="utf-8").read()
    rs = re.sub(r'(id="RestartSketch"\s*\n\s*component=\{RestartSketch\}\s*\n\s*durationInFrames=)\{\d+\}',
                r"\g<1>{%d}" % DUR4, rs)
    open(ROOT, "w", encoding="utf-8", newline="\n").write(rs)
    print("Root DUR ->", DUR4)

asyncio.run(main())
