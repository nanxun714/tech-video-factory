# -*- coding: utf-8 -*-
import json

p = r"F:\小秋技术笔记\00_视频生产线\01_源码\remotion-production\src\RestartSketch.tsx"
s = open(p, encoding="utf-8").read()

pairs = [
  # P3
  ('opacity: prog(f, 105, 12), whiteSpace: "nowrap",\n      }}>✓ 全部清空</div>', 'opacity: prog(f, 95, 12), whiteSpace: "nowrap",\n      }}>✓ 全部清空</div>'),
  ('<WBox f={f} x={1130} y={330} w={340} h={300} sw={5} seed={12} delay={185} dur={14}', '<WBox f={f} x={1130} y={330} w={340} h={300} sw={5} seed={12} delay={165} dur={14}'),
  ('opacity: prog(f, 192, 8), letterSpacing: 2,\n      }}>写满的草稿纸</div>', 'opacity: prog(f, 172, 8), letterSpacing: 2,\n      }}>写满的草稿纸</div>'),
  ('delay={196 + i * 5} dur={8} op={0.75 * scribOp}', 'delay={176 + i * 5} dur={8} op={0.75 * scribOp}'),
  ('<Arrow f={f} x={990} y={430} len={110} bend={-16} rot={-10} delay={252} sw={6} />', '<Arrow f={f} x={990} y={430} len={110} bend={-16} rot={-10} delay={225} sw={6} />'),
  ('<Arrow f={f} x={1462} y={450} len={80} bend={-10} delay={252} color={GREEN_E} sw={6} />', '<Arrow f={f} x={1462} y={450} len={80} bend={-10} delay={225} color={GREEN_E} sw={6} />'),
  ('seed={15} delay={268} dur={14}', 'seed={15} delay={240} dur={14}'),
  ('opacity: prog(f, 286, 10), whiteSpace: "nowrap",\n      }}>干干净净</div>', 'opacity: prog(f, 258, 10), whiteSpace: "nowrap",\n      }}>干干净净</div>'),
  ('opacity: prog(f, 300, 10), whiteSpace: "nowrap",\n      }}>\n        擦掉重画', 'opacity: prog(f, 272, 10), whiteSpace: "nowrap",\n      }}>\n        擦掉重画'),
  # P4
  ('<WCol f={f} cx={490} cy={540} rx={330} ry={190} color={BLUE_F} seed={2} delay={16} />', '<WCol f={f} cx={490} cy={540} rx={330} ry={190} color={BLUE_F} seed={2} delay={14} />'),
  ('<WBox f={f} x={190} y={380} w={600} h={320} sw={5} seed={2} delay={18} dur={16} />', '<WBox f={f} x={190} y={380} w={600} h={320} sw={5} seed={2} delay={16} dur={16} />'),
  ('opacity: prog(f, 30, 10), whiteSpace: "nowrap",\n      }}>只是软件的状态乱了</div>', 'opacity: prog(f, 27, 10), whiteSpace: "nowrap",\n      }}>只是软件的状态乱了</div>'),
  ('opacity: prog(f, 48, 10), whiteSpace: "nowrap",\n      }}>硬件本身没坏</div>', 'opacity: prog(f, 43, 10), whiteSpace: "nowrap",\n      }}>硬件本身没坏</div>'),
  ('<Arrow f={f} x={815} y={510} len={170} bend={-14} delay={70} sw={7} />', '<Arrow f={f} x={815} y={510} len={170} bend={-14} delay={63} sw={7} />'),
  ('color={YEL_F} seed={6} delay={84} />', 'color={YEL_F} seed={6} delay={76} />'),
  ('opacity: prog(f, 92, 14), whiteSpace: "nowrap",\n      }}>九成</div>', 'opacity: prog(f, 83, 14), whiteSpace: "nowrap",\n      }}>九成</div>'),
  ('opacity: prog(f, 112, 10), whiteSpace: "nowrap",\n      }}>一张白纸就能解决</div>', 'opacity: prog(f, 101, 10), whiteSpace: "nowrap",\n      }}>一张白纸就能解决</div>'),
  ('<Stick f={f} x={330} y={880} s={1.1} pose="point" delay={140} />', '<Stick f={f} x={330} y={880} s={1.1} pose="point" delay={126} />'),
  ('<Bubble f={f} x={420} y={790} w={430} h={98} text="状态清零就好" ts={34} delay={156} tail="bl" />', '<Bubble f={f} x={420} y={790} w={430} h={98} text="状态清零就好" ts={34} delay={140} tail="bl" />'),
  # P5
  ('<WBox f={f} x={230} y={330} w={640} h={280} sw={6} seed={5} delay={24} dur={14}', '<WBox f={f} x={230} y={330} w={640} h={280} sw={6} seed={5} delay={22} dur={14}'),
  ('opacity: prog(f, 34, 10), whiteSpace: "nowrap",\n      }}>硬件坏了</div>', 'opacity: prog(f, 31, 10), whiteSpace: "nowrap",\n      }}>硬件坏了</div>'),
  ('<BigX f={f} x={255} y={355} w={590} h={230} delay={66} sw={10} />', '<BigX f={f} x={255} y={355} w={590} h={230} delay={59} sw={10} />'),
  ('<WBox f={f} x={1070} y={330} w={640} h={280} sw={6} seed={8} delay={78} dur={14}', '<WBox f={f} x={1070} y={330} w={640} h={280} sw={6} seed={8} delay={70} dur={14}'),
  ('opacity: prog(f, 88, 10), whiteSpace: "nowrap",\n      }}>文件本身损毁了</div>', 'opacity: prog(f, 79, 10), whiteSpace: "nowrap",\n      }}>文件本身损毁了</div>'),
  ('<BigX f={f} x={1095} y={355} w={590} h={230} delay={112} sw={10} />', '<BigX f={f} x={1095} y={355} w={590} h={230} delay={101} sw={10} />'),
  ('opacity: prog(f, 150, 12), whiteSpace: "nowrap",\n      }}>这不是重启能救的</div>', 'opacity: prog(f, 135, 12), whiteSpace: "nowrap",\n      }}>这不是重启能救的</div>'),
  ('<Bulb f={f} x={1560} y={210} s={1.3} delay={20} />', '<Bulb f={f} x={1560} y={210} s={1.3} delay={18} />'),
  # P6
  ('{badge(330, "①", "先重启", BLUE_E, BLUE_F, 50)}', '{badge(330, "①", "先重启", BLUE_E, BLUE_F, 46)}'),
  ('<Arrow f={f} x={620} y={460} len={190} delay={78} sw={7} />', '<Arrow f={f} x={620} y={460} len={190} delay={72} sw={7} />'),
  ('{badge(830, "②", "再排查", ORANGE_E, ORANGE_F, 88)}', '{badge(830, "②", "再排查", ORANGE_E, ORANGE_F, 81)}'),
  ('<WCol f={f} cx={960} cy={800} rx={430} ry={80} color={YEL_F} seed={6} delay={126} />', '<WCol f={f} cx={960} cy={800} rx={430} ry={80} color={YEL_F} seed={6} delay={116} />'),
  ('opacity: prog(f, 140, 10), whiteSpace: "nowrap",\n      }}>小毛病重启就行 大毛病才要排查</div>', 'opacity: prog(f, 129, 10), whiteSpace: "nowrap",\n      }}>小毛病重启就行 大毛病才要排查</div>'),
  # P7
  ('opacity: prog(f, 28, 12), whiteSpace: "nowrap",\n      }}>治得了状态乱 治不了硬件坏</div>', 'opacity: prog(f, 25, 12), whiteSpace: "nowrap",\n      }}>治得了状态乱 治不了硬件坏</div>'),
  ('<Sticker f={f} x={1390} y={200} w={340} h={116} title="觉得有用" sub="截图保存" rot={4} delay={44} ts={34} color={ORANGE_E} />', '<Sticker f={f} x={1390} y={200} w={340} h={116} title="觉得有用" sub="截图保存" rot={4} delay={40} ts={34} color={ORANGE_E} />'),
  ('<Stick f={f} x={330} y={760} s={1.2} pose="cheer" delay={40} />', '<Stick f={f} x={330} y={760} s={1.2} pose="cheer" delay={36} />'),
  # P8
  ('opacity: prog(f, 56, 10), whiteSpace: "nowrap",\n      }}>顺手点个关注，下期不迷路</div>', 'opacity: prog(f, 48, 10), whiteSpace: "nowrap",\n      }}>顺手点个关注，下期不迷路</div>'),
  ('delay={96} ts={46} color={GREEN_E} />\n      <Bulb f={f} x={1560} y={250} s={1.4} delay={80} />', 'delay={82} ts={46} color={GREEN_E} />\n      <Bulb f={f} x={1560} y={250} s={1.4} delay={68} />'),
  ('opacity: 0.72 * prog(f, 140, 10),\n      }}>小秋 · 0 基础也能学会</div>\n    </AbsoluteFill>\n  );\n};\n\n// ================= 组装', 'opacity: 0.72 * prog(f, 119, 10),\n      }}>小秋 · 0 基础也能学会</div>\n    </AbsoluteFill>\n  );\n};\n\n// ================= 组装'),
  # PAGES
  ('{C: PageHook, start: 0, end: 316},\n  {C: PageMess, start: 316, end: 748},\n  {C: PageClear, start: 748, end: 1113},\n  {C: PageWhy, start: 1113, end: 1402},\n  {C: PageException, start: 1402, end: 1611},\n  {C: PageOrder, start: 1611, end: 1808},\n  {C: PageAphorism, start: 1808, end: 1964},\n  {C: PageOutro, start: 1964, end: DUR},', '{C: PageHook, start: 0, end: 291},\n  {C: PageMess, start: 291, end: 667},\n  {C: PageClear, start: 667, end: 992},\n  {C: PageWhy, start: 992, end: 1252},\n  {C: PageException, start: 1252, end: 1441},\n  {C: PageOrder, start: 1441, end: 1623},\n  {C: PageAphorism, start: 1623, end: 1764},\n  {C: PageOutro, start: 1764, end: DUR},'),
  # audio + sfx
  ('audio/restart-tts/', 'audio/restart-tts-v2/'),
  ('{[316, 748, 1113, 1402, 1611, 1808, 1964].map((t) => (', '{[291, 667, 992, 1252, 1441, 1623, 1764].map((t) => ('),
  ('<Sequence from={845} durationInFrames={30}>', '<Sequence from={772} durationInFrames={30}>'),
  ('<Sequence from={1470} durationInFrames={30}>', '<Sequence from={1321} durationInFrames={30}>'),
]

missed = []
for old, new in pairs:
    if old in s:
        s = s.replace(old, new, 1)
    else:
        missed.append(old[:60].replace("\n", "\\n"))
open(p, "w", encoding="utf-8", newline="\n").write(s)
print("applied:", len(pairs) - len(missed), "/", len(pairs))
for m in missed:
    print(" MISS:", m)
