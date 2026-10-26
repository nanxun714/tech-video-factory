# -*- coding: utf-8 -*-
# patch3: 光标修复 / 剧透行修复 / 答案页三选项 / 终端放大 / 小秋 IP / 倒计时
p = r"F:\小秋技术笔记\00_视频生产线\01_源码\remotion-production\src\LinuxBasicsTutorial.tsx"
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


# 1. TypeTokens: 光标只在激活行显示（加 active 参数）
rep('''}> = ({tokens, start, cps = 0.9, fontSize = 30}) => {''',
    '''}> = ({tokens, start, cps = 0.9, fontSize = 30, active = true}) => {''')
rep('''  if (shown >= total) {
    cursor = <span style={{color: TXT, opacity: frame % 30 < 15 ? 1 : 0.15}}>▌</span>;
  }''',
    '''  if (shown >= total && active) {
    cursor = <span style={{color: TXT, opacity: frame % 30 < 15 ? 1 : 0.15}}>▌</span>;
  }''')

# 2. ScenePwd 重写：终端放大 + xiaoqiu + 单行光标常亮
h0 = s.index("const ScenePwd")
h1 = s.index("const SceneLs")
s = s[:h0] + '''const ScenePwd: React.FC = () => (
  <AbsoluteFill>
    <SectionTitle num="①" text="pwd：我在哪" sub="跟着敲，一个命令认识一个位置" />
    <Pop delay={6}>
      <TerminalWindow x={210} y={210} w={1500}>
        <TLine><TypeTokens tokens={[{t: "$ ", c: TEAL}, {t: "pwd", c: TXT}]} start={14} fontSize={34} /></TLine>
        <Pop delay={44}>
          <div style={{fontSize: 34, fontFamily: MONO, color: GREEN, lineHeight: 1.85}}>/home/xiaoqiu</div>
        </Pop>
      </TerminalWindow>
    </Pop>
    <Callout x={210} y={600} w={1500} color="yellow" delay={90}
      title="pwd = print working directory"
      lines={["随时敲一下，就知道自己现在在哪个目录里"]} />
  </AbsoluteFill>
);

''' + s[h1:]
n += 1

# 3. SceneLs 重写：终端放大
h0 = s.index("const SceneLs")
h1 = s.index("const SceneCd")
s = s[:h0] + '''const SceneLs: React.FC = () => (
  <AbsoluteFill>
    <SectionTitle num="②" text="ls：这里有什么" sub="列出目录下的所有文件" />
    <Pop delay={6}>
      <TerminalWindow x={210} y={210} w={1500}>
        <TLine><TypeTokens tokens={[{t: "$ ", c: TEAL}, {t: "ls", c: TXT}]} start={14} fontSize={34} /></TLine>
        <Pop delay={40}>
          <div style={{fontSize: 34, fontFamily: MONO, color: GREEN, lineHeight: 1.85}}>docs    music    notes.txt    photo.jpg    tools</div>
        </Pop>
      </TerminalWindow>
    </Pop>
    <Callout x={210} y={600} w={1500} color="yellow" delay={90}
      title="ls = list"
      lines={["想看这个目录里有什么，ls 一下就全出来了"]} />
  </AbsoluteFill>
);

''' + s[h1:]
n += 1

# 4. SceneCd 重写：历史“长出来”（未开始的行不渲染）+ 光标只在最后一行 + 放大
h0 = s.index("const SceneCd")
h1 = s.index("const ScenePitfalls")
s = s[:h0] + '''const SceneCd: React.FC = () => {
  const frame = useCurrentFrame();
  const rows = [
    {start: 16, next: 70, tokens: [{t: "$ ", c: TEAL}, {t: "cd /var/log", c: TXT}]},
    {start: 70, next: 130, tokens: [{t: "$ ", c: TEAL}, {t: "pwd", c: TXT}]},
    {start: 130, next: 170, tokens: [{t: "$ ", c: TEAL}, {t: "cd ..", c: TXT}]},
    {start: 170, next: 9999, tokens: [{t: "$ ", c: TEAL}, {t: "pwd", c: TXT}]},
  ];
  const outs = [
    {at: 98, text: "/var/log"},
    {at: 196, text: "/var"},
  ];
  return (
    <AbsoluteFill>
      <SectionTitle num="③" text="cd：我要去哪" sub="切换目录，去你想去的地方" />
      <Pop delay={6}>
        <TerminalWindow x={210} y={170} w={1500}>
          {rows.map((r, i) =>
            frame >= r.start - 2 ? (
              <TLine key={i}>
                <TypeTokens tokens={r.tokens} start={r.start} active={frame < r.next} />
              </TLine>
            ) : null
          )}
          {frame >= 98 ? <div style={{fontSize: 30, fontFamily: MONO, color: GREEN, lineHeight: 1.85}}>/var/log</div> : null}
          {frame >= 196 ? <div style={{fontSize: 30, fontFamily: MONO, color: GREEN, lineHeight: 1.85}}>/var</div> : null}
        </TerminalWindow>
      </Pop>
      <Callout x={210} y={660} w={730} color="yellow" delay={215}
        title="cd 路径 = 进入" lines={["cd /var/log 就跳进 log 目录"]} />
      <Callout x={980} y={660} w={730} color="red" delay={230}
        title="cd .. = 退回上一级" lines={["两个点就是上一层目录"]} />
    </AbsoluteFill>
  );
};

''' + s[h1:]
n += 1

# 5. SceneQuizQ: 加 3-2-1 倒计时
rep('''const SceneQuizQ: React.FC = () => (
  <AbsoluteFill>
    <SectionTitle num="✎" text="练习时间" sub="来试试这道题" />''',
    '''const SceneQuizQ: React.FC = () => {
  const frame = useCurrentFrame();
  return (
  <AbsoluteFill>
    <SectionTitle num="✎" text="练习时间" sub="来试试这道题" />''')
rep('''      </Pop>
    ))}
  </AbsoluteFill>
);

const SceneQuizA''',
    '''      </Pop>
    ))}
    {frame >= 84 ? (
      <div style={{
        position: "absolute", left: 875, top: 590, width: 170, height: 170, borderRadius: 999,
        border: `5px solid ${TEAL}`, backgroundColor: "rgba(61,219,164,0.08)",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <span style={{fontSize: 92, fontWeight: 900, color: TEAL, fontFamily: MONO}}>
          {frame < 104 ? 3 : frame < 124 ? 2 : 1}
        </span>
      </div>
    ) : null}
  </AbsoluteFill>
  );
};

const SceneQuizA''')

# 6. SceneQuizA: 三个选项都保留，A 高亮，B/C 置灰
a0 = s.index('    <Pop delay={4}>\n      <div style={{position: "absolute", left: 240, top: 300, width: 700}}>')
a1 = s.index('    <SummaryPill x={410} y={780}', a0)
s = s[:a0] + '''    {[
      {t: "回到上一级目录", ok: true},
      {t: "删除这个目录", ok: false},
      {t: "显示当前路径", ok: false},
    ].map((o, i) => (
      <Pop key={i} delay={4 + i * 14} style={{position: "absolute", left: 240, top: 300 + i * 140, width: 1440, opacity: o.ok ? 1 : 0.3}}>
        <div style={{
          backgroundColor: o.ok ? "rgba(61,219,164,0.10)" : PANEL,
          border: `2.5px solid ${o.ok ? TEAL : BORDER}`, borderRadius: 14,
          padding: "20px 26px", display: "flex", alignItems: "center", gap: 20,
        }}>
          <div style={{
            width: 46, height: 46, borderRadius: 999, border: `2px solid ${o.ok ? TEAL : DIM}`,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 26, fontWeight: 900, color: o.ok ? TEAL : DIM, fontFamily: MONO,
          }}>
            {"ABC"[i]}
          </div>
          <div style={{fontSize: 32, color: TXT, fontFamily: YAHEI}}>{o.t}</div>
          {o.ok ? <div style={{marginLeft: "auto", fontSize: 34, color: GREEN}}>✅</div> : null}
        </div>
      </Pop>
    ))}
''' + s[a1:]
n += 1

# 7. 品牌 IP：小秋
rep('🐧 小白 · 0 基础也能学会', '🐧 小秋 · 0 基础也能学会')

open(p, "w", encoding="utf-8").write(s)
print("applied", n, "replacements")
for m in misses:
    print("MISS:", m)
