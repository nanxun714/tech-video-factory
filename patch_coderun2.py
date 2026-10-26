# -*- coding: utf-8 -*-
import json, math

BASE = r"F:\小秋技术笔记\00_视频生产线\01_源码\remotion-production"

# ---------- outro timing ----------
s09 = json.load(open(BASE + r"\public\audio\coderun-tts\s09.json", encoding="utf-8"))
END = 1891 + max(105, int(math.ceil(s09["dur_sec"] * 30)) + 25)
print("END =", END)

# ---------- 1. verbatim no-punctuation subtitles ----------
tl = json.load(open(BASE + r"\public\audio\coderun-tts\timeline.json", encoding="utf-8"))
splits = {
    1: ["你写的代码", "是怎么变成电脑上跑起来的程序的"],
    2: ["无论是 Python Java 还是 C++", "本质上都是一份文本文件", "但 CPU 只认识 0 和 1 组成的机器语言"],
    3: ["所以第一步", "要靠编译器或解释器", "把代码翻译成 CPU 能懂的机器指令"],
    4: ["以 C 语言为例", "从编译到运行 主要分四步", "预编译 编译 链接 运行"],
    5: ["预编译先干三件事", "把头文件展开", "把宏做纯文本替换", "再删掉条件不满足的代码"],
    6: ["然后是语法检查", "少分号 类型不匹配都会被拦下", "通过后生成目标文件", "链接器再把代码和系统库拼接起来", "变成可执行程序"],
    7: ["双击运行时", "操作系统把它加载进内存 分配好资源", "再把 CPU 交给程序入口", "指令一条条执行"],
    8: ["整个流程就像工厂流水线 各司其职", "才能让几行文本", "变成真正跑起来的软件"],
    9: ["本期内容就到这里", "我们下期见"],
}
windows = {s["index"]: (s["start_frame"], s["end_frame"]) for s in tl["sentences"]}
windows[9] = (1891, END)

lines = []
for idx in sorted(windows):
    a, b = windows[idx]
    phrases = splits[idx]
    total = sum(len(p.replace(" ", "")) for p in phrases)
    win = b - a
    cur = a
    for ph in phrases:
        dur = int(round(win * len(ph.replace(" ", "")) / total))
        e = min(cur + dur, b)
        lines.append('  {s: %d, e: %d, t: "%s"},' % (cur, e, ph))
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
        misses.append(a[:90].replace("\n", "\\n"))


# 2a. subs array -> verbatim no punctuation + outro lines
start = s.index("const subs: Sub[] = [")
end = s.index("\n];", start) + 3
s = s[:start] + subs_block + s[end:]
n += 1

# 2b. add s09 to voiceover list
rep('  {index: 8, audio: "s08.mp3", start: 1670, end: 1891},',
    '  {index: 8, audio: "s08.mp3", start: 1670, end: 1891},\n  {index: 9, audio: "s09.mp3", start: 1891, end: %d},' % END)

# 2c. bed fade to new end
rep("[0, 20, 1971, 2005]", "[0, 20, %d, %d]" % (END - 40, END - 6))

# 2d. outro scene end
rep("  {start: 1891, end: 2011, C: SceneOutro},",
    "  {start: 1891, end: %d, C: SceneOutro}," % END)

# 2e. SceneLink container width (fix 可执行程序 overflow)
rep('<div style={{position: "absolute", top: 370, left: 1150}}>',
    '<div style={{position: "absolute", top: 370, left: 1150, width: 380}}>')

# 2f. SceneHook: static full cover at frame 0
h0 = s.index("const SceneHook")
h1 = s.index("const SceneVs")
hook = s[h0:h1]
assert hook.count("<Pop") == 3 and hook.count("</Pop>") == 3, "hook pop count unexpected"
hook = hook.replace("<Pop delay={4}>", "<div>").replace("<Pop delay={26}>", "<div>").replace("<Pop delay={48}>", "<div>")
hook = hook.replace("</Pop>", "</div>")
s = s[:h0] + hook + s[h1:]
n += 1

# 2g. Subtitle style: no stroke / no shadow / no box, plain dark text
rep('''      <div
        style={{
          fontSize: 48,
          fontWeight: 800,
          color: "#fff",
          fontFamily: "Microsoft YaHei, sans-serif",
          letterSpacing: 2,
          transform: `translateY(${(1 - sp) * 10}px)`,
          opacity: interpolate(sp, [0, 1], [0.35, 1]),
          textShadow:
            "0 0 6px rgba(0,0,0,0.9), 0 2px 4px rgba(0,0,0,0.9), -2px 0 0 rgba(0,0,0,0.75), 2px 0 0 rgba(0,0,0,0.75), 0 -2px 0 rgba(0,0,0,0.75), 0 2px 0 rgba(0,0,0,0.75)",
        }}
      >''',
'''      <div
        style={{
          fontSize: 48,
          fontWeight: 700,
          color: "#262626",
          fontFamily: "Microsoft YaHei, sans-serif",
          letterSpacing: 3,
          transform: `translateY(${(1 - sp) * 8}px)`,
          opacity: interpolate(sp, [0, 1], [0.3, 1]),
        }}
      >''')

open(p, "w", encoding="utf-8").write(s)
print("applied", n, "replacements")
for m in misses:
    print("MISS:", m)

# ---------- 3. Root duration ----------
pr = BASE + r"\src\Root.tsx"
sr = open(pr, encoding="utf-8").read()
if "durationInFrames={2011}" in sr:
    sr = sr.replace("durationInFrames={2011}", "durationInFrames={%d}" % END)
    open(pr, "w", encoding="utf-8").write(sr)
    print("Root duration ->", END)
else:
    print("Root duration pattern not found!")
