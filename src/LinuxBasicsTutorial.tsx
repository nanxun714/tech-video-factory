import {Audio} from "@remotion/media";
import {
  AbsoluteFill, interpolate, Sequence, spring, staticFile, useCurrentFrame, useVideoConfig,
} from "remotion";

// ---------- palette (GitHub Dark + 薄荷绿强调) ----------
const BG = "#0d1117";
const PANEL = "#161b22";
const BORDER = "#30363d";
const TEAL = "#3ddba4";
const TXT = "#e6edf3";
const DIM = "#8b949e";
const GREEN = "#7ee787";
const RED = "#f85149";
const YEL = "#e3b341";

const YAHEI = "Microsoft YaHei, sans-serif";
const MONO = "Consolas, 'Courier New', monospace";

const voiceLines = [
  {index: 1, audio: "s01.mp3", start: 0, end: 168},
  {index: 2, audio: "s02.mp3", start: 174, end: 424},
  {index: 3, audio: "s03.mp3", start: 429, end: 676},
  {index: 4, audio: "s04.mp3", start: 681, end: 943},
  {index: 5, audio: "s05.mp3", start: 948, end: 1214},
  {index: 6, audio: "s06.mp3", start: 1220, end: 1521},
  {index: 7, audio: "s07.mp3", start: 1526, end: 1670},
  {index: 8, audio: "s08.mp3", start: 1675, end: 1805},
  {index: 9, audio: "s09.mp3", start: 1810, end: 1964},
];

type Sub = {s: number; e: number; t: string};
const subs: Sub[] = [
  {s: 0, e: 81, t: "第一次打开 Linux 终端"},
  {s: 81, e: 121, t: "满屏都是黑的"},
  {s: 121, e: 168, t: "不知道该敲什么"},
  {s: 174, e: 248, t: "记住第一个命令 pwd"},
  {s: 248, e: 329, t: "它打印你当前所在的目录"},
  {s: 329, e: 358, t: "敲下回车"},
  {s: 358, e: 424, t: "系统立刻告诉你位置"},
  {s: 429, e: 480, t: "第二个命令 ls"},
  {s: 480, e: 574, t: "它列出当前目录下的所有文件"},
  {s: 574, e: 632, t: "想知道这里有什么"},
  {s: 632, e: 676, t: "敲 ls 就够了"},
  {s: 681, e: 737, t: "第三个命令 cd"},
  {s: 737, e: 856, t: "cd 空格加路径 就能跳进目标目录"},
  {s: 856, e: 904, t: "cd 加两个点"},
  {s: 904, e: 943, t: "退回上一级"},
  {s: 948, e: 1016, t: "新手最容易错两个地方"},
  {s: 1016, e: 1098, t: "命令和路径之间必须有空格"},
  {s: 1098, e: 1180, t: "Linux 严格区分大小写"},
  {s: 1180, e: 1214, t: "敲错它不认"},
  {s: 1220, e: 1249, t: "总结一下"},
  {s: 1249, e: 1292, t: "pwd 看位置"},
  {s: 1292, e: 1328, t: "ls 看内容"},
  {s: 1328, e: 1364, t: "cd 换目录"},
  {s: 1364, e: 1421, t: "三个命令组合起来"},
  {s: 1421, e: 1521, t: "你就能在 Linux 里自由行走"},
  {s: 1526, e: 1569, t: "来一道练习题"},
  {s: 1569, e: 1627, t: "cd 后面跟两个点"},
  {s: 1627, e: 1670, t: "表示什么意思"},
  {s: 1675, e: 1707, t: "答案是 A"},
  {s: 1707, e: 1764, t: "回到上一级目录"},
  {s: 1764, e: 1805, t: "你答对了没"},
  {s: 1810, e: 1861, t: "学会了就点个赞"},
  {s: 1861, e: 1942, t: "下期我们讲更多常用命令"},
  {s: 1942, e: 1964, t: "下期见"},
];

// ---------- 原语 ----------

const Pop: React.FC<{delay?: number; children: React.ReactNode; style?: React.CSSProperties}> = ({
  delay = 0, children, style,
}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const sp = spring({frame: frame - delay, fps, config: {damping: 15, stiffness: 160}});
  return (
    <div style={{
      opacity: interpolate(sp, [0, 1], [0, 1]),
      transform: `translateY(${(1 - sp) * 16}px)`,
      ...style,
    }}>
      {children}
    </div>
  );
};

const SectionTitle: React.FC<{num: string; text: string; sub?: string}> = ({num, text, sub}) => (
  <div style={{position: "absolute", top: 40, left: 0, right: 0, textAlign: "center"}}>
    <div style={{fontSize: 44, fontWeight: 900, color: TEAL, fontFamily: YAHEI, letterSpacing: 4}}>
      {num} {text}
    </div>
    {sub ? (
      <div style={{fontSize: 26, color: DIM, fontFamily: YAHEI, marginTop: 8, letterSpacing: 3}}>{sub}</div>
    ) : null}
  </div>
);

// 打字机：tokens 带语法色，按 start 帧起逐字显示，正在打字的行尾有光标
const TypeTokens: React.FC<{
  tokens: {t: string; c: string}[];
  start: number;
  cps?: number;
  fontSize?: number;
  active?: boolean;
}> = ({tokens, start, cps = 0.9, fontSize = 30, active = true}) => {
  const frame = useCurrentFrame();
  const total = tokens.reduce((a, t) => a + t.t.length, 0);
  const shown = Math.max(0, Math.min(total, Math.floor((frame - start) * cps)));
  let used = 0;
  const parts: React.ReactNode[] = [];
  let cursor: React.ReactNode = null;
  tokens.forEach((tk, i) => {
    const a = used;
    const b = used + tk.t.length;
    if (shown > a) {
      const vis = tk.t.slice(0, Math.min(tk.t.length, shown - a));
      parts.push(<span key={i} style={{color: tk.c}}>{vis}</span>);
      if (shown < b && cursor === null) {
        cursor = <span key={"c" + i} style={{color: TXT}}>▌</span>;
      }
    }
    used = b;
  });
  if (shown >= total && active) {
    cursor = <span style={{color: TXT, opacity: frame % 30 < 15 ? 1 : 0.15}}>▌</span>;
  }
  return <span style={{fontSize, fontFamily: MONO, whiteSpace: "pre"}}>{parts}{cursor}</span>;
};

const CodeWindow: React.FC<{
  x: number; y: number; w: number; title: string; children: React.ReactNode;
}> = ({x, y, w, title, children}) => (
  <div style={{
    position: "absolute", left: x, top: y, width: w,
    backgroundColor: PANEL, border: `1.5px solid ${BORDER}`, borderRadius: 14,
    overflow: "hidden", boxShadow: "0 14px 34px rgba(0,0,0,0.45)",
  }}>
    <div style={{display: "flex", alignItems: "center", gap: 10, padding: "12px 18px", borderBottom: `1px solid ${BORDER}`}}>
      <div style={{width: 14, height: 14, borderRadius: 999, backgroundColor: "#ff5f56"}} />
      <div style={{width: 14, height: 14, borderRadius: 999, backgroundColor: "#ffbd2e"}} />
      <div style={{width: 14, height: 14, borderRadius: 999, backgroundColor: "#27c93f"}} />
      <span style={{marginLeft: 10, fontSize: 22, fontFamily: MONO, color: DIM}}>{title}</span>
    </div>
    <div style={{padding: "18px 26px 22px"}}>{children}</div>
  </div>
);

const TerminalWindow: React.FC<{
  x: number; y: number; w: number; children: React.ReactNode;
}> = ({x, y, w, children}) => (
  <div style={{
    position: "absolute", left: x, top: y, width: w,
    backgroundColor: "#010409", border: `1.5px solid ${BORDER}`, borderRadius: 14,
    padding: "20px 28px", boxShadow: "0 14px 34px rgba(0,0,0,0.5)",
  }}>
    {children}
  </div>
);

const TLine: React.FC<{children: React.ReactNode}> = ({children}) => (
  <div style={{fontSize: 30, fontFamily: MONO, lineHeight: 1.85, whiteSpace: "pre"}}>
    <span style={{color: TEAL}}>{"> "}</span>{children}
  </div>
);

const Callout: React.FC<{
  x: number; y: number; w: number; color: "red" | "yellow";
  title: string; lines: string[]; delay?: number;
}> = ({x, y, w, color, title, lines, delay = 0}) => {
  const bd = color === "red" ? RED : YEL;
  const bg = color === "red" ? "rgba(248,81,73,0.10)" : "rgba(227,179,65,0.10)";
  return (
    <Pop delay={delay} style={{position: "absolute", left: x, top: y, width: w}}>
      <div style={{
        backgroundColor: bg, border: `2px solid ${bd}`, borderRadius: 14, padding: "20px 26px",
      }}>
        <div style={{fontSize: 34, fontWeight: 900, color: bd, fontFamily: YAHEI, marginBottom: 10}}>
          ⚠ {title}
        </div>
        {lines.map((l, i) => (
          <div key={i} style={{fontSize: 27, color: TXT, fontFamily: YAHEI, lineHeight: 1.75}}>{l}</div>
        ))}
      </div>
    </Pop>
  );
};

const SummaryPill: React.FC<{x: number; y: number; w: number; children: React.ReactNode; delay?: number}> = ({
  x, y, w, children, delay = 0,
}) => (
  <Pop delay={delay} style={{position: "absolute", left: x, top: y, width: w}}>
    <div style={{
      border: `2.5px solid ${TEAL}`, borderRadius: 999, backgroundColor: "rgba(61,219,164,0.08)",
      padding: "16px 20px", textAlign: "center",
      fontSize: 32, fontWeight: 800, fontFamily: YAHEI, color: TEAL, letterSpacing: 2,
    }}>
      {children}
    </div>
  </Pop>
);

const Subtitle: React.FC = () => {
  const frame = useCurrentFrame();
  const cur = subs.find((s) => frame >= s.s && frame < s.e);
  if (!cur) return null;
  const sp = spring({frame: frame - cur.s, fps: 30, config: {damping: 16, stiffness: 200}});
  return (
    <div style={{position: "absolute", bottom: 44, left: 0, right: 0, display: "flex", justifyContent: "center", pointerEvents: "none"}}>
      <div style={{
        fontSize: 48, fontWeight: 700, color: TXT, fontFamily: YAHEI, letterSpacing: 3,
        transform: `translateY(${(1 - sp) * 8}px)`,
        opacity: interpolate(sp, [0, 1], [0.3, 1]),
      }}>
        {cur.t}
      </div>
    </div>
  );
};

// ---------- 场景 ----------

const SceneTitle: React.FC = () => {
  const frame = useCurrentFrame();
  const barW = interpolate(frame, [8, 34], [0, 300], {extrapolateLeft: "clamp", extrapolateRight: "clamp"});
  return (
    <AbsoluteFill>
      <div style={{position: "absolute", top: 340, left: 0, right: 0, textAlign: "center"}}>
        <div style={{fontSize: 92, fontWeight: 900, color: TEAL, fontFamily: YAHEI, letterSpacing: 8}}>
          Linux 基础命令
        </div>
        <div style={{fontSize: 40, color: TXT, fontFamily: YAHEI, marginTop: 26, letterSpacing: 5}}>
          三个命令，在终端里活下来
        </div>
        <div style={{width: barW, height: 4, backgroundColor: TEAL, borderRadius: 2, margin: "30px auto 0"}} />
        <div style={{fontSize: 26, color: DIM, fontFamily: YAHEI, marginTop: 60, letterSpacing: 3}}>
          🐧 小秋 · 0 基础也能学会
        </div>
      </div>
    </AbsoluteFill>
  );
};

const ScenePwd: React.FC = () => (
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

const SceneLs: React.FC = () => (
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

const SceneCd: React.FC = () => {
  const frame = useCurrentFrame();
  const rows = [
    {start: 16, next: 70, tokens: [{t: "$ ", c: TEAL}, {t: "cd /var/log", c: TXT}]},
    {start: 70, next: 130, tokens: [{t: "$ ", c: TEAL}, {t: "pwd", c: TXT}]},
    {start: 130, next: 170, tokens: [{t: "$ ", c: TEAL}, {t: "cd ..", c: TXT}]},
    {start: 170, next: 9999, tokens: [{t: "$ ", c: TEAL}, {t: "pwd", c: TXT}]},
  ];
  return (
    <AbsoluteFill>
      <SectionTitle num="③" text="cd：我要去哪" sub="切换目录，去你想去的地方" />
      <Pop delay={6}>
        <TerminalWindow x={210} y={170} w={1500}>
          {([
            {t: 16, el: <TLine><TypeTokens tokens={rows[0].tokens} start={16} active={frame < 70} /></TLine>},
            {t: 70, el: <TLine><TypeTokens tokens={rows[1].tokens} start={70} active={frame < 130} /></TLine>},
            {t: 98, el: <div style={{fontSize: 30, fontFamily: MONO, color: GREEN, lineHeight: 1.85}}>/var/log</div>},
            {t: 130, el: <TLine><TypeTokens tokens={rows[2].tokens} start={130} active={frame < 170} /></TLine>},
            {t: 170, el: <TLine><TypeTokens tokens={rows[3].tokens} start={170} /></TLine>},
            {t: 196, el: <div style={{fontSize: 30, fontFamily: MONO, color: GREEN, lineHeight: 1.85}}>/var</div>},
          ] as {t: number; el: React.ReactNode}[]).filter((i) => frame >= i.t).map((i, k) => (
            <div key={k}>{i.el}</div>
          ))}
        </TerminalWindow>
      </Pop>
      <Callout x={210} y={660} w={730} color="yellow" delay={215}
        title="cd 路径 = 进入" lines={["cd /var/log 就跳进 log 目录"]} />
      <Callout x={980} y={660} w={730} color="red" delay={230}
        title="cd .. = 退回上一级" lines={["两个点就是上一层目录"]} />
    </AbsoluteFill>
  );
};

const ScenePitfalls: React.FC = () => (
  <AbsoluteFill>
    <SectionTitle num="⚠" text="新手最容易错的两个地方" />
    <Callout x={230} y={280} w={680} color="red" delay={10}
      title="空格不能省"
      lines={["命令和路径之间必须隔一个空格", "cd/var/log ✗", "cd /var/log ✓"]} />
    <Callout x={1010} y={280} w={680} color="yellow" delay={45}
      title="大小写敏感"
      lines={["LS ≠ ls ≠ Ls", "敲错大小写，系统不认识它"]} />
    <SummaryPill x={460} y={760} w={1000} delay={90}>
      记住这两条，能少踩一半的坑
    </SummaryPill>
  </AbsoluteFill>
);

const SceneSummary: React.FC = () => (
  <AbsoluteFill>
    <SectionTitle num="✓" text="三个命令就够起步" />
    {[
      {x: 260, cmd: "pwd", t: "看位置", d: 10},
      {x: 760, cmd: "ls", t: "看内容", d: 40},
      {x: 1260, cmd: "cd", t: "换目录", d: 70},
    ].map((n) => (
      <div key={n.cmd}>
        <Pop delay={n.d} style={{position: "absolute", left: n.x, top: 320, width: 400}}>
          <div style={{
            backgroundColor: PANEL, border: `2px solid ${BORDER}`, borderRadius: 18,
            padding: "30px 0 26px", textAlign: "center",
          }}>
            <div style={{fontSize: 48, fontFamily: MONO, color: TEAL, fontWeight: 900}}>{n.cmd}</div>
            <div style={{fontSize: 32, fontFamily: YAHEI, color: TXT, marginTop: 14}}>{n.t}</div>
          </div>
        </Pop>
      </div>
    ))}
    <SummaryPill x={410} y={720} w={1100} delay={110}>
      三个命令组合 = 在 Linux 里自由行走
    </SummaryPill>
  </AbsoluteFill>
);

const SceneQuizQ: React.FC = () => {
  const frame = useCurrentFrame();
  return (
  <AbsoluteFill>
    <SectionTitle num="✎" text="练习时间" sub="来试试这道题" />
    <div style={{position: "absolute", top: 190, left: 240, fontSize: 40, fontWeight: 800, color: TXT, fontFamily: YAHEI}}>
      Q：cd 后面跟两个点，表示什么意思？
    </div>
    <Pop delay={25}>
      <CodeWindow x={240} y={300} w={560} title="terminal">
        <div style={{fontSize: 30, fontFamily: MONO, color: TXT, lineHeight: 2}}>
          <span style={{color: TEAL}}>$ </span>cd ..
        </div>
      </CodeWindow>
    </Pop>
    {[
      {letter: "A", t: "回到上一级目录", x: 900, y: 300},
      {letter: "B", t: "删除这个目录", x: 900, y: 430},
      {letter: "C", t: "显示当前路径", x: 900, y: 560},
    ].map((o) => (
      <Pop key={o.letter} delay={50} style={{position: "absolute", left: o.x, top: o.y, width: 700}}>
        <div style={{
          backgroundColor: PANEL, border: `2px solid ${BORDER}`, borderRadius: 14,
          padding: "20px 26px", display: "flex", alignItems: "center", gap: 20,
        }}>
          <div style={{
            width: 46, height: 46, borderRadius: 999, border: `2px solid ${DIM}`,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 26, fontWeight: 900, color: DIM, fontFamily: MONO,
          }}>
            {o.letter}
          </div>
          <div style={{fontSize: 32, color: TXT, fontFamily: YAHEI}}>{o.t}</div>
        </div>
      </Pop>
    ))}
    {frame >= 84 ? (
      <div style={{
        position: "absolute", left: 380, top: 600, width: 170, height: 170, borderRadius: 999,
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

const SceneQuizA: React.FC = () => (
  <AbsoluteFill>
    <SectionTitle num="✎" text="答案：A" />
    <div style={{position: "absolute", top: 190, left: 240, fontSize: 40, fontWeight: 800, color: TXT, fontFamily: YAHEI}}>
      cd 后面跟两个点，表示什么意思？
    </div>
    {[
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
    <SummaryPill x={410} y={780} w={1100} delay={110}>
      cd .. = 退回上一级目录
    </SummaryPill>
  </AbsoluteFill>
);

const SceneOutro: React.FC = () => (
  <AbsoluteFill>
    <div style={{position: "absolute", top: 360, left: 0, right: 0, textAlign: "center"}}>
      <div style={{fontSize: 96, fontWeight: 900, color: TEAL, fontFamily: YAHEI, letterSpacing: 6}}>
        学会了就点个赞！
      </div>
      <div style={{fontSize: 42, color: TXT, fontFamily: YAHEI, marginTop: 34, letterSpacing: 4}}>
        下期讲更多常用命令，下期见
      </div>
      <div style={{fontSize: 72, marginTop: 60, letterSpacing: 40}}>
        👍 ⭐ ✏️
      </div>
    </div>
  </AbsoluteFill>
);

// ---------- 组装 ----------

const scenes = [
  {start: 0, end: 168, C: SceneTitle},
  {start: 174, end: 423, C: ScenePwd},
  {start: 429, end: 675, C: SceneLs},
  {start: 681, end: 942, C: SceneCd},
  {start: 948, end: 1214, C: ScenePitfalls},
  {start: 1220, end: 1520, C: SceneSummary},
  {start: 1526, end: 1669, C: SceneQuizQ},
  {start: 1675, end: 1804, C: SceneQuizA},
  {start: 1810, end: 1964, C: SceneOutro}
];;

export const LinuxBasicsTutorial: React.FC = () => {
  const frame = useCurrentFrame();
  const bedVolume = interpolate(frame, [0, 20, 1964 - 40, 1964 - 6], [0, 0.09, 0.09, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return (
    <AbsoluteFill style={{backgroundColor: BG, fontFamily: YAHEI, overflow: "hidden"}}>
      {scenes.map(({start, end, C}, i) => (
        <Sequence key={i} from={start} durationInFrames={end - start}>
          <C />
        </Sequence>
      ))}
      {voiceLines.map((s) => (
        <Sequence key={`vo-${s.index}`} from={s.start} durationInFrames={s.end - s.start + 30}>
          <Audio src={staticFile(`audio/linux-tts/${s.audio}`)} volume={1} />
        </Sequence>
      ))}
      <Sequence from={176} durationInFrames={30}>
        <Audio src={staticFile("audio/sfx/click.wav")} volume={0.22} />
      </Sequence>
      <Sequence from={411} durationInFrames={30}>
        <Audio src={staticFile("audio/sfx/click.wav")} volume={0.22} />
      </Sequence>
      <Sequence from={1599} durationInFrames={40}>
        <Audio src={staticFile("audio/sfx/success.wav")} volume={0.35} />
      </Sequence>
      <Audio src={staticFile("audio/bed.wav")} loop volume={() => bedVolume} />
      <Subtitle />
    </AbsoluteFill>
  );
};
