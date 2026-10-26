# -*- coding: utf-8 -*-
import json

BASE = r"F:\小秋技术笔记\00_视频生产线\01_源码\remotion-production"

# ---------- 1. build verbatim subtitles from timeline ----------
tl = json.load(open(BASE + r"\public\audio\coderun-tts\timeline.json", encoding="utf-8"))
splits = {
    1: ["你写的代码，", "是怎么变成电脑上跑起来的程序的？"],
    2: ["无论是 Python、Java 还是 C++，", "本质上都是一份文本文件；", "但 CPU 只认识 0 和 1 组成的机器语言。"],
    3: ["所以第一步，", "要靠编译器或解释器，", "把代码翻译成 CPU 能懂的机器指令。"],
    4: ["以 C 语言为例，", "从编译到运行，主要分四步：", "预编译、编译、链接、运行。"],
    5: ["预编译先干三件事：", "把头文件展开，", "把宏做纯文本替换，", "再删掉条件不满足的代码。"],
    6: ["然后是语法检查，", "少分号、类型不匹配都会被拦下；", "通过后生成目标文件，", "链接器再把代码和系统库拼接起来，", "变成可执行程序。"],
    7: ["双击运行时，", "操作系统把它加载进内存、分配好资源，", "再把 CPU 交给程序入口，", "指令一条条执行。"],
    8: ["整个流程就像工厂流水线，各司其职，", "才能让几行文本，", "变成真正跑起来的软件。"],
}
lines = []
for sent in tl["sentences"]:
    phrases = splits[sent["index"]]
    total = sum(len(p.replace(" ", "")) for p in phrases)
    win = sent["end_frame"] - sent["start_frame"]
    cur = sent["start_frame"]
    for ph in phrases:
        dur = int(round(win * len(ph.replace(" ", "")) / total))
        e = min(cur + dur, sent["end_frame"])
        esc = ph.replace('\\', '\\\\').replace('"', '\\"')
        lines.append('  {s: %d, e: %d, t: "%s"},' % (cur, e, esc))
        cur = e
subs_block = "const subs: Sub[] = [\n" + "\n".join(lines) + "\n];"

# ---------- 2. patch component ----------
p = BASE + r"\src\CodeRunExplainer.tsx"
s = open(p, encoding="utf-8").read()
n = 0
misses = []


def rep(a, b):
    global s, n
    if a in s:
        s = s.replace(a, b, 1)
        n += 1
    else:
        misses.append(a[:80].replace("\n", "\\n"))


# 2a. replace subs array
start = s.index("const subs: Sub[] = [")
end = s.index("\n];", start) + 3
s = s[:start] + subs_block + s[end:]
n += 1

# 2b. remove fades (hard cuts, fixes 0:00 blank / 1:03 blur / transition flashes)
rep(
    """        <Sequence key={i} from={start} durationInFrames={end - start}>
          <AbsoluteFade>
            <C />
          </AbsoluteFade>
        </Sequence>""",
    """        <Sequence key={i} from={start} durationInFrames={end - start}>
          <C />
        </Sequence>""",
)
fade_start = s.index("const AbsoluteFade")
s = s[:fade_start].rstrip() + "\n"

# 2c. split SceneCompileLink into two less-cluttered scenes
c_start = s.index("const SceneCompileLink")
c_end = s.index("const SceneRun")
new_scenes = """const SceneCompile: React.FC = () => (
  <AbsoluteFill>
    <SceneTitle text="步骤② 编译" />
    <div style={{position: "absolute", top: 320, left: 170, width: 380}}>
      <Pop delay={4}>
        <SketchBox x={0} y={0} w={340} h={250} fill="#fff" sw={5} seed={41} />
        <div style={{position: "absolute", left: 34, top: 36, fontSize: 30, fontFamily: MONO, color: INK, lineHeight: 1.75, whiteSpace: "nowrap"}}>
          int main() {"{"}
          <br />
          {"  "}int x = 10 <span style={{color: RED_D, fontWeight: 900}}>✗</span>
          <br />
          {"  "}char y = x <span style={{color: RED_D, fontWeight: 900}}>✗</span>
          <br />
          {"}"}
        </div>
      </Pop>
    </div>
    <SketchArrow x={590} y={410} len={200} color={INK} delay={45} sw={7} />
    <div style={{position: "absolute", top: 350, left: 850}}>
      <Pop delay={70}>
        <div style={{position: "relative", width: 380, height: 180}}>
          <Marker x={10} y={6} w={360} h={150} color={YELLOW} r={-1} />
          <div style={{position: "absolute", left: 0, top: 52, width: 380, textAlign: "center", fontSize: 40, fontWeight: 900, fontFamily: HAND_FONT, color: INK, whiteSpace: "nowrap"}}>
            语法分析 + 语义分析
          </div>
        </div>
        <Label x={50} y={206} size={32}>检查语法、类型</Label>
      </Pop>
      <Pop delay={150}>
        <div style={{marginTop: 40, fontSize: 36, fontWeight: 800, fontFamily: HAND_FONT, color: RED_D, display: "flex", alignItems: "center", gap: 14}}>
          <span style={{display: "inline-flex", width: 56, height: 56, borderRadius: 999, backgroundColor: RED, border: `5px solid ${RED_D}`, alignItems: "center", justifyContent: "center", fontSize: 30}}>✋</span>
          错误 → 拦截
        </div>
      </Pop>
    </div>
    <div style={{position: "absolute", top: 320, left: 1420}}>
      <Pop delay={115}>
        <SketchBox x={0} y={0} w={320} h={190} fill="#fff" sw={5} seed={52} />
        <div style={{position: "absolute", left: 0, right: 0, top: 42, textAlign: "center", fontSize: 38, fontWeight: 900, fontFamily: HAND_FONT, color: INK}}>目标文件</div>
        <svg width={320} height={190} viewBox="0 0 320 190" style={{position: "absolute", left: 0, top: 0, overflow: "visible"}}>
          <path d="M 126 118 L 152 146 L 204 88" stroke={GREEN_D} strokeWidth={12} fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <Label x={34} y={206} size={30} color="#777" bold={false}>可执行代码生成</Label>
      </Pop>
    </div>
    <SketchArrow x={1250} y={390} len={140} color={GREEN_D} delay={145} sw={7} />
  </AbsoluteFill>
);

const SceneLink: React.FC = () => (
  <AbsoluteFill>
    <SceneTitle text="步骤③ 链接" />
    <div style={{position: "absolute", top: 400, left: 220}}>
      <Pop delay={4}>
        <Puzzle x={0} y={0} fill={GREEN} r={-8} />
        <Puzzle x={130} y={30} fill={YELLOW} r={6} />
        <Puzzle x={255} y={-6} fill={BLUE} r={-3} />
        <Label x={110} y={150} size={34}>你的代码 + 系统库 + 第三方库</Label>
      </Pop>
    </div>
    <SketchArrow x={790} y={490} len={230} color={RED_D} delay={60} bend={12} sw={7} />
    <div style={{position: "absolute", top: 370, left: 1150}}>
      <Pop delay={110}>
        <SketchBox x={0} y={0} w={380} h={260} fill={GREEN} sw={6} seed={61} />
        <div style={{position: "absolute", left: 0, right: 0, top: 80, textAlign: "center", fontSize: 44, fontWeight: 900, fontFamily: HAND_FONT, color: INK}}>可执行程序</div>
        <div style={{position: "absolute", left: 0, right: 0, top: 152, textAlign: "center", fontSize: 30, fontFamily: MONO, color: "#4a5b45"}}>(ELF / EXE)</div>
        <Label x={104} y={292} size={34}>最终成果</Label>
      </Pop>
    </div>
    <div style={{position: "absolute", top: 700, left: 660}}>
      <Pop delay={150}>
        <div style={{position: "relative", display: "inline-block"}}>
          <Marker x={-18} y={4} w={460} h={56} color={YELLOW} r={-0.8} />
          <div style={{position: "relative", fontSize: 38, fontWeight: 800, fontFamily: HAND_FONT, color: INK, whiteSpace: "nowrap"}}>
            拼接依赖库，不再孤立
          </div>
        </div>
      </Pop>
    </div>
  </AbsoluteFill>
);

"""
s = s[:c_start] + new_scenes + s[c_end:]
n += 1

# 2d. scenes array boundaries + outro
rep("  {start: 1068, end: 1403, C: SceneCompileLink},",
    "  {start: 1068, end: 1230, C: SceneCompile},\n  {start: 1230, end: 1403, C: SceneLink},")
rep("  {start: 1670, end: 1891, C: ScenePipeline},",
    "  {start: 1670, end: 1891, C: ScenePipeline},\n  {start: 1891, end: 2011, C: SceneOutro},")
rep("[0, 20, 1891 - 40, 1891 - 6]", "[0, 20, 1971, 2005]")

# 2e. S3 arrow no longer pierces chip
rep("<SketchArrow x={1510} y={480} len={120} color={GREEN_D} delay={128} sw={8} />",
    "<SketchArrow x={1568} y={480} len={120} color={GREEN_D} delay={128} sw={8} />")

# 2f. S5 conditional-compile overflow + BigX onto text
rep('<div style={{position: "absolute", top: 762, left: 1210}}>',
    '<div style={{position: "absolute", top: 762, left: 1210, width: 460}}>')
rep(
    '''          <SketchBox x={0} y={-6} w={330} h={96} fill="#fff" sw={4} seed={31} />
          <div style={{position: "absolute", left: 34, top: 18, fontSize: 34, fontFamily: HAND_FONT, color: INK}}>
            ？ 代码包含或排除
          </div>''',
    '''          <SketchBox x={0} y={-6} w={390} h={96} fill="#fff" sw={4} seed={31} />
          <div style={{position: "absolute", left: 34, top: 18, fontSize: 34, fontFamily: HAND_FONT, color: INK, whiteSpace: "nowrap"}}>
            ？ 代码包含或排除
          </div>''')
rep('<div style={{position: "absolute", top: 762, left: 470}}>',
    '<div style={{position: "absolute", top: 758, left: 190}}>')

# 2g. S7 OS pill shift left inside ellipse
rep('<rect x={150} y={60} width={260} height={70} rx={14} fill="#fff" stroke={INK} strokeWidth={6} transform="rotate(-4 280 95)" />',
    '<rect x={118} y={58} width={260} height={70} rx={14} fill="#fff" stroke={INK} strokeWidth={6} transform="rotate(-4 248 93)" />')
rep('<text x={195} y={110} fontSize={40} fontWeight={900} fontFamily={HAND_FONT} fill={INK} transform="rotate(-4 280 95)">',
    '<text x={163} y={108} fontSize={40} fontWeight={900} fontFamily={HAND_FONT} fill={INK} transform="rotate(-4 248 93)">')

# 2h. S4 arrows reach the gear
rep(
    "      <SketchArrow x={560} y={420} len={230} color={RED_D} delay={90} bend={-24} rot={12} sw={7} />\n"
    "      <SketchArrow x={1130} y={420} len={230} color={YELLOW_D} delay={105} bend={24} rot={-12} sw={7} flipX />\n"
    "      <SketchArrow x={1130} y={620} len={230} color={GREEN_D} delay={120} bend={-24} rot={12} sw={7} flipX />\n"
    "      <SketchArrow x={560} y={620} len={230} color={BLUE_D} delay={135} bend={24} rot={-12} sw={7} />",
    "      <SketchArrow x={545} y={392} len={185} color={RED_D} delay={90} bend={-16} sw={7} />\n"
    "      <SketchArrow x={700} y={372} len={185} color={YELLOW_D} delay={105} bend={-16} sw={7} flipX />\n"
    "      <SketchArrow x={700} y={470} len={185} color={GREEN_D} delay={120} bend={16} sw={7} flipX />\n"
    "      <SketchArrow x={545} y={452} len={185} color={BLUE_D} delay={135} bend={16} sw={7} />")

# 2i. outro scene component
rep("// ---------- composition ----------",
    """const SceneOutro: React.FC = () => (
  <AbsoluteFill>
    <div style={{position: "absolute", top: 300, left: 0, right: 0, textAlign: "center"}}>
      <div style={{position: "relative", display: "inline-block"}}>
        <Marker x={-36} y={40} w={560} h={116} color={YELLOW} r={-1} />
        <div style={{position: "relative", fontSize: 128, fontWeight: 900, fontFamily: TITLE_FONT, color: INK, letterSpacing: 12}}>
          下期见！
        </div>
      </div>
    </div>
    <Pop delay={25}>
      <Label x={430} y={640} size={46}>有疑问？评论区留言</Label>
    </Pop>
    <Pop delay={55}>
      <Label x={1120} y={640} size={46}>想了解的技术？</Label>
    </Pop>
    <div style={{position: "absolute", top: 588, left: 916, fontSize: 96}}>👋</div>
    <Pop delay={80}>
      <Label x={700} y={780} size={34} color="#8a8a8a" bold={false}>计算机网络入门 · 代码是如何运行的</Label>
    </Pop>
  </AbsoluteFill>
);

// ---------- composition ----------""")

open(p, "w", encoding="utf-8").write(s)
print("applied", n, "replacements")
for m in misses:
    print("MISS:", m)

# ---------- 3. Root.tsx duration ----------
pr = BASE + r"\src\Root.tsx"
sr = open(pr, encoding="utf-8").read()
if 'durationInFrames={1891}' in sr:
    sr = sr.replace('durationInFrames={1891}', 'durationInFrames={2011}')
    open(pr, "w", encoding="utf-8").write(sr)
    print("Root duration -> 2011")
else:
    print("Root duration pattern not found!")
