# -*- coding: utf-8 -*-
"""生成云扬版配音 + 直接重写 RestartSketch.tsx 的时间相关常量"""
import asyncio, json, os, re
import edge_tts
from mutagen.mp3 import MP3

AUD = r"F:\小秋技术笔记\00_视频生产线\01_源码\remotion-production\public\audio"
TSX = r"F:\小秋技术笔记\00_视频生产线\01_源码\remotion-production\src\RestartSketch.tsx"
VOICE, RATE, GAP, FPS = "zh-CN-YunyangNeural", "+0%", 0.18, 30

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

async def synth(i, text):
    out = os.path.join(AUD, "restart-tts-v3", f"s{i:02d}.mp3")
    for attempt in range(6):
        try:
            comm = edge_tts.Communicate(text, VOICE, rate=RATE)
            with open(out, "wb") as f:
                async for chunk in comm.stream():
                    if chunk.get("type") == "audio":
                        f.write(chunk["data"])
            if os.path.getsize(out) > 2000:
                return MP3(out).info.length
        except Exception as e:
            print(f"  s{i:02d} retry {attempt+1}: {type(e).__name__}")
            await asyncio.sleep(2)
    raise SystemExit(f"s{i:02d} failed after retries")

async def main():
    os.makedirs(os.path.join(AUD, "restart-tts-v3"), exist_ok=True)
    cursor, results = 0.0, []
    for i, text in enumerate(SENTS, 1):
        dur = await synth(i, text)
        st, en = round(cursor, 3), round(cursor + dur, 3)
        cursor = en + GAP
        results.append({"index": i, "start_frame": int(round(st * FPS)), "end_frame": int(round(en * FPS))})
        print(f"s{i:02d} {st:6.2f} -> {en:6.2f} ({dur:.2f}s)")
    total_frames = int(round((cursor - GAP) * FPS))
    st = {r["index"]: r["start_frame"] for r in results}
    en = {r["index"]: r["end_frame"] for r in results}
    DUR = total_frames
    bounds = [st[3] - 5, st[5] - 5, st[7] - 5, st[9] - 5, st[10] - 5, st[11] - 5, st[12] - 5]
    print("DUR:", DUR, "PAGES ends:", bounds)

    # 字幕窗口（比例切分，同 gen_subs 逻辑）
    sub_lines = []
    for r in results:
        i = r["index"]
        ph = [clean(p) for p in PHRASES[i]]
        ph = [p for p in ph if p]
        total = sum(len(p.replace(" ", "")) for p in ph)
        a, b, cur = r["start_frame"], r["end_frame"], r["start_frame"]
        for text in ph:
            d = int(round((b - a) * len(text.replace(" ", "")) / total))
            e = min(cur + d, b)
            sub_lines.append((cur, e, text))
            cur = e
    sub_map = {}
    for a, b, t in sub_lines:
        sub_map.setdefault(t, a)

    def dstart(idx, phrase):  # 某句第 idx 个短语的全局起始帧
        return sub_map[clean(PHRASES[[k for k in PHRASES][0] and 0] and "")] if False else None

    # 直接按 (句, 短语序号) 找窗口
    win = {}
    k = 0
    for r in results:
        for j, _ in enumerate(PHRASES[r["index"]]):
            win[(r["index"], j)] = sub_lines[k]
            k += 1

    def F(i, j):  # 短语起始帧
        return win[(i, j)][0]

    off = 10
    def page_f(page_start, global_frame):
        return global_frame - page_start - off

    # 页内 delay 计算
    b = [0] + bounds
    p2, p3, p4, p5, p6, p7, p8 = bounds[0], bounds[1], bounds[2], bounds[3], bounds[4], bounds[5], bounds[6]
    d = {}
    d["p2_canzha"] = page_f(p2, F(3, 2)) + 4
    d["p2_ziyuan"] = page_f(p2, F(3, 3)) + 4
    d["p2_zhuangtai"] = page_f(p2, F(3, 4)) + 4
    d["p2_meirenqing"] = page_f(p2, F(4, 0)) + 4
    d["p2_yueji"] = page_f(p2, F(4, 1)) - 4
    d["p2_yueji2"] = d["p2_yueji"] + 8
    d["p2_stick"] = page_f(p2, F(4, 1)) + 10
    d["p2_bubble"] = page_f(p2, F(4, 2)) + 4
    d["p3_qingkong"] = page_f(p3, F(5, 1)) + 4
    d["p3_fade"] = page_f(p3, F(5, 1)) - 8
    d["p3_dirty"] = page_f(p3, F(6, 0)) + 4
    d["p3_dirtylabel"] = d["p3_dirty"] + 8
    d["p3_scrib"] = page_f(p3, F(6, 0)) + 14
    d["p3_arrow"] = page_f(p3, F(6, 1)) - 6
    d["p3_clean"] = page_f(p3, F(6, 1)) + 4
    d["p3_cleanlabel"] = page_f(p3, F(6, 1)) + 18
    d["p3_bottom"] = page_f(p3, F(6, 2)) + 4
    d["p4_card"] = page_f(p4, F(7, 0)) + 4
    d["p4_cardtitle"] = page_f(p4, F(7, 1)) + 2
    d["p4_cardsub"] = page_f(p4, F(7, 2)) + 2
    d["p4_arrow"] = page_f(p4, F(8, 0)) - 4
    d["p4_yellow"] = page_f(p4, F(8, 0)) + 2
    d["p4_jiucheng"] = page_f(p4, F(8, 0)) + 8
    d["p4_sub"] = page_f(p4, F(8, 1)) + 2
    d["p4_stick"] = page_f(p4, F(8, 1)) + 22
    d["p4_bubble"] = page_f(p4, F(8, 1)) + 36
    d["p5_c1"] = page_f(p5, F(9, 1)) + 2
    d["p5_c1t"] = d["p5_c1"] + 8
    d["p5_x1"] = page_f(p5, F(9, 2)) - 8
    d["p5_c2"] = page_f(p5, F(9, 2)) + 4
    d["p5_c2t"] = d["p5_c2"] + 8
    d["p5_x2"] = page_f(p5, F(9, 3)) - 10
    d["p5_red"] = page_f(p5, F(9, 3)) + 4
    d["p6_b1"] = page_f(p6, F(10, 1)) + 2
    d["p6_arrow"] = page_f(p6, F(10, 1)) + 26
    d["p6_b2"] = page_f(p6, F(10, 1)) + 32
    d["p6_cloud"] = page_f(p6, F(10, 2)) + 2
    d["p6_cloudt"] = d["p6_cloud"] + 12
    d["p7_sub"] = page_f(p7, F(11, 2)) - 4
    d["p7_sticker"] = page_f(p7, F(11, 2)) + 14
    d["p8_sub"] = page_f(p8, F(12, 0)) + 42
    d["p8_sticker"] = page_f(p8, F(12, 1)) - 6
    d["p8_bulb"] = d["p8_sticker"] - 14
    d["p8_sign"] = d["p8_sticker"] + 42

    s = open(TSX, encoding="utf-8").read()
    # DUR
    s = re.sub(r"const DUR = \d+;", f"const DUR = {DUR};", s)
    # voiceLines
    vl = "const voiceLines = [\n" + "".join(
        f'  {{index: {r["index"]}, audio: "s{r["index"]:02d}.mp3", start: {r["start_frame"]}, end: {r["end_frame"]}}},\n' for r in results
    ) + "];"
    s = re.sub(r"const voiceLines = \[.*?\n\];", vl, s, flags=re.S)
    # subs
    sb = "const subs: Sub[] = [\n" + "".join(f'  {{s: {a}, e: {b2}, t: "{t}"}},\n' for a, b2, t in sub_lines) + "];"
    s = re.sub(r"const subs: Sub\[\] = \[.*?\n\];", sb, s, flags=re.S)
    # PAGES
    pg = ("const PAGES = [\n"
          f"  {{C: PageHook, start: 0, end: {bounds[0]}}},\n"
          f"  {{C: PageMess, start: {bounds[0]}, end: {bounds[1]}}},\n"
          f"  {{C: PageClear, start: {bounds[1]}, end: {bounds[2]}}},\n"
          f"  {{C: PageWhy, start: {bounds[2]}, end: {bounds[3]}}},\n"
          f"  {{C: PageException, start: {bounds[3]}, end: {bounds[4]}}},\n"
          f"  {{C: PageOrder, start: {bounds[4]}, end: {bounds[5]}}},\n"
          f"  {{C: PageAphorism, start: {bounds[5]}, end: {bounds[6]}}},\n"
          f"  {{C: PageOutro, start: {bounds[6]}, end: DUR}},\n"
          "]")
    s = re.sub(r"const PAGES = \[.*?\n\];", pg, s, flags=re.S)
    # audio dir + transitions + sfx
    s = s.replace("audio/restart-tts-v2/", "audio/restart-tts-v3/")
    s = re.sub(r"\{\[\d+(, \d+)*\]\.map\(\(t\) => \(", "{" + ", ".join(str(x) for x in bounds) + "].map((t) => (", s)
    s = re.sub(r"<Sequence from=\{\d+\} durationInFrames=\{30\}>\s*\n(\s*)<Audio src=\{staticFile\(\"audio/sfx/warm3.wav\"\)}", f"<Sequence from={{{d['p3_qingkong'] + p3}}} durationInFrames={{30}}>\n\\1<Audio src={{staticFile(\"audio/sfx/warm3.wav\")}}", s)
    s = re.sub(r"<Sequence from=\{\d+\} durationInFrames=\{30\}>\s*\n(\s*)<Audio src=\{staticFile\(\"audio/sfx/fall3.wav\"\)}", f"<Sequence from={{{d['p5_x1'] + p5}}} durationInFrames={{30}}>\n\\1<Audio src={{staticFile(\"audio/sfx/fall3.wav\")}}", s)
    # 页内 delay 数字替换（按 锚点字符串 定位）
    repl = [
        # P2
        ("fontSize: 32, fontWeight: 700, color: ORANGE_E,\n        opacity: prog(f, 100, 10)", f"fontSize: 32, fontWeight: 700, color: ORANGE_E,\n        opacity: prog(f, {d['p2_canzha']}, 10)"),
        ("fontSize: 32, fontWeight: 700, color: BLUE_E,\n        opacity: prog(f, 140, 10)", f"fontSize: 32, fontWeight: 700, color: BLUE_E,\n        opacity: prog(f, {d['p2_ziyuan']}, 10)"),
        ("fontSize: 32, fontWeight: 700, color: RED,\n        opacity: prog(f, 185, 10)", f"fontSize: 32, fontWeight: 700, color: RED,\n        opacity: prog(f, {d['p2_zhuangtai']}, 10)"),
        ('seed={21} delay={300} />', f"seed={{21}} delay={{{d['p2_yueji']}}} />"),
        ('seed={24} delay={308} />', f"seed={{24}} delay={{{d['p2_yueji2']}}} />"),
        ("opacity: prog(f, 240, 10), whiteSpace: \"nowrap\",\n      }}>没人清理 越积越多</div>", f"opacity: prog(f, {d['p2_meirenqing']}, 10), whiteSpace: \"nowrap\",\n      }}>没人清理 越积越多</div>"),
        ('x={1620} y={800} s={1.1} pose="cheer" delay={280} />', f"x={{1620}} y={{800}} s={{1.1}} pose=\"cheer\" delay={{{d['p2_stick']}}} />"),
        ('<Bubble f={f} x={1300} y={640} w={340} h={98} text="程序开始抽风" ts={32} delay={330} tail="bl" />', f'<Bubble f={{f}} x={{1300}} y={{640}} w={{340}} h={{98}} text="程序开始抽风" ts={{32}} delay={{{d["p2_bubble"]}}} tail="bl" />'),
        # P3
        ("const junkOp = 1 - prog(f, 62, 24);", f"const junkOp = 1 - prog(f, {d['p3_fade']}, 24);"),
        ("const scribOp = 1 - prog(f, 272, 24);", f"const scribOp = 1 - prog(f, {d['p3_bottom']}, 24);"),
        ("opacity: prog(f, 95, 12), whiteSpace: \"nowrap\",\n      }}>✓ 全部清空</div>", f"opacity: prog(f, {d['p3_qingkong']}, 12), whiteSpace: \"nowrap\",\n      }}>✓ 全部清空</div>"),
        ("seed={12} delay={165} dur={14}", f"seed={{12}} delay={{{d['p3_dirty']}}} dur={{14}}"),
        ("opacity: prog(f, 172, 8), letterSpacing: 2,", f"opacity: prog(f, {d['p3_dirtylabel']}, 8), letterSpacing: 2,"),
        ("delay={176 + i * 5} dur={8} op={0.75 * scribOp}", f"delay={{{d['p3_scrib']} + i * 5}} dur={{8}} op={{0.75 * scribOp}}"),
        ('x={990} y={430} len={110} bend={-16} rot={-10} delay={225} sw={6} />', f"x={{990}} y={{430}} len={{110}} bend={{-16}} rot={{-10}} delay={{{d['p3_arrow']}}} sw={{6}} />"),
        ('x={1462} y={450} len={80} bend={-10} delay={225} color={GREEN_E} sw={6} />', f"x={{1462}} y={{450}} len={{80}} bend={{-10}} delay={{{d['p3_arrow']}}} color={{GREEN_E}} sw={{6}} />"),
        ("seed={15} delay={240} dur={14}", f"seed={{15}} delay={{{d['p3_clean']}}} dur={{14}}"),
        ("opacity: prog(f, 258, 10), whiteSpace: \"nowrap\",\n      }}>干干净净</div>", f"opacity: prog(f, {d['p3_cleanlabel']}, 10), whiteSpace: \"nowrap\",\n      }}>干干净净</div>"),
        ("opacity: prog(f, 272, 10), whiteSpace: \"nowrap\",\n      }}>\n        擦掉重画", f"opacity: prog(f, {d['p3_bottom']}, 10), whiteSpace: \"nowrap\",\n      }}>\n        擦掉重画"),
        # P4
        ("color={BLUE_F} seed={2} delay={14} />", f"color={{BLUE_F}} seed={{2}} delay={{{d['p4_card']}}} />"),
        ("seed={2} delay={16} dur={16} />", f"seed={{2}} delay={{{d['p4_card'] + 2}}} dur={{16}} />"),
        ("opacity: prog(f, 27, 10),", f"opacity: prog(f, {d['p4_cardtitle']}, 10),"),
        ("opacity: prog(f, 43, 10),", f"opacity: prog(f, {d['p4_cardsub']}, 10),"),
        ("x={815} y={510} len={170} bend={-14} delay={63} sw={7} />", f"x={{815}} y={{510}} len={{170}} bend={{-14}} delay={{{d['p4_arrow']}}} sw={{7}} />"),
        ("color={YEL_F} seed={6} delay={76} />", f"color={{YEL_F}} seed={{6}} delay={{{d['p4_yellow']}}} />"),
        ("opacity: prog(f, 83, 14),", f"opacity: prog(f, {d['p4_jiucheng']}, 14),"),
        ("opacity: prog(f, 101, 10),", f"opacity: prog(f, {d['p4_sub']}, 10),"),
        ('x={330} y={880} s={1.1} pose="point" delay={126} />', f"x={{330}} y={{880}} s={{1.1}} pose=\"point\" delay={{{d['p4_stick']}}} />"),
        ('text="状态清零就好" ts={34} delay={140} tail="bl" />', f'text="状态清零就好" ts={{34}} delay={{{d["p4_bubble"]}}} tail="bl" />'),
        # P5
        ("seed={5} delay={22} dur={14}", f"seed={{5}} delay={{{d['p5_c1']}}} dur={{14}}"),
        ("opacity: prog(f, 31, 10),", f"opacity: prog(f, {d['p5_c1t']}, 10),"),
        ("x={255} y={355} w={590} h={230} delay={59} sw={10} />", f"x={{255}} y={{355}} w={{590}} h={{230}} delay={{{d['p5_x1']}}} sw={{10}} />"),
        ("seed={8} delay={70} dur={14}", f"seed={{8}} delay={{{d['p5_c2']}}} dur={{14}}"),
        ("opacity: prog(f, 79, 10),", f"opacity: prog(f, {d['p5_c2t']}, 10),"),
        ("x={1095} y={355} w={590} h={230} delay={101} sw={10} />", f"x={{1095}} y={{355}} w={{590}} h={{230}} delay={{{d['p5_x2']}}} sw={{10}} />"),
        ("opacity: prog(f, 135, 12),", f"opacity: prog(f, {d['p5_red']}, 12),"),
        ("x={1560} y={210} s={1.3} delay={18} />", f"x={{1560}} y={{210}} s={{1.3}} delay={{{d['p5_c1'] - 4}}} />"),
        # P6
        ('{badge(330, "①", "先重启", BLUE_E, BLUE_F, 46)}', f'{{badge(330, "①", "先重启", BLUE_E, BLUE_F, {d["p6_b1"]})}}'),
        ("x={620} y={460} len={190} delay={72} sw={7} />", f"x={{620}} y={{460}} len={{190}} delay={{{d['p6_arrow']}}} sw={{7}} />"),
        ('{badge(830, "②", "再排查", ORANGE_E, ORANGE_F, 81)}', f'{{badge(830, "②", "再排查", ORANGE_E, ORANGE_F, {d["p6_b2"]})}}'),
        ("color={YEL_F} seed={6} delay={116} />", f"color={{YEL_F}} seed={{6}} delay={{{d['p6_cloud']}}} />"),
        ("opacity: prog(f, 129, 10),", f"opacity: prog(f, {d['p6_cloudt']}, 10),"),
        # P7
        ("opacity: prog(f, 25, 12),", f"opacity: prog(f, {d['p7_sub']}, 12),"),
        ('sub="截图保存" rot={4} delay={40} ts={34} color={ORANGE_E} />', f'sub="截图保存" rot={{4}} delay={{{d["p7_sticker"]}}} ts={{34}} color={{ORANGE_E}} />'),
        ('x={330} y={760} s={1.2} pose="cheer" delay={36} />', f'x={{330}} y={{760}} s={{1.2}} pose="cheer" delay={{{d["p7_sub"] - 10}}} />'),
        # P8
        ("opacity: prog(f, 48, 10),", f"opacity: prog(f, {d['p8_sub']}, 10),"),
        ('delay={82} ts={46} color={GREEN_E} />', f'delay={{{d["p8_sticker"]}}} ts={{46}} color={{GREEN_E}} />'),
        ("x={1560} y={250} s={1.4} delay={68} />", f"x={{1560}} y={{250}} s={{1.4}} delay={{{d['p8_bulb']}}} />"),
        ("opacity: 0.72 * prog(f, 119, 10),", f"opacity: 0.72 * prog(f, {d['p8_sign']}, 10),"),
    ]
    missed = []
    for old, new in repl:
        if old in s:
            s = s.replace(old, new, 1)
        else:
            missed.append(old[:60].replace("\n", "\\n"))
    open(TSX, "w", encoding="utf-8", newline="\n").write(s)
    print("patched:", len(repl) - len(missed), "/", len(repl))
    for m in missed:
        print(" MISS:", m)
    print("KEY FRAMES:", json.dumps({k: v for k, v in d.items()}, ensure_ascii=False))

asyncio.run(main())
