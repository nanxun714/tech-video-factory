// 《程序一启动就报错？这扇门已经被占了》——端口占用排查故事
// story-whiteboard 风格第二集：米白纸底黑线稿 + 居中构图 + 大号加粗终端面板（逐行打字+当前行粉色高亮）+ 顶部HUD + 男声云希+18%
import {Audio} from "@remotion/media";
import {
  AbsoluteFill, interpolate, Sequence, spring, staticFile, useCurrentFrame,
} from "remotion";
import React from "react";

const PAPER = "#F2EFE4";
const CARD = "#FAF7EC";
const INK = "#1F1D1A";
const PINK = "#F2CFCF";
const RED = "#C0392B";
const BLUE = "#A8CDE0";
const TITLE_FONT = "'Microsoft YaHei', sans-serif";
const HAND_FONT = "KaiTi, 楷体, 'Microsoft YaHei', serif";
const MONO = "Consolas, 'Courier New', monospace";

export const DUR = 1629; // timeline total 1609 + 101 结尾卡停留

// ---- 配音窗口（portoccupied-tts/timeline.json，男声云希+18%，MP3实测）----
const SENT = [0, 171, 400, 666, 838, 1070, 1257, 1437];
const voiceLines = [
  {index: 1, audio: "s01.mp3", start: 0, end: 166},
  {index: 2, audio: "s02.mp3", start: 171, end: 394},
  {index: 3, audio: "s03.mp3", start: 400, end: 660},
  {index: 4, audio: "s04.mp3", start: 666, end: 833},
  {index: 5, audio: "s05.mp3", start: 838, end: 1065},
  {index: 6, audio: "s06.mp3", start: 1070, end: 1252},
  {index: 7, audio: "s07.mp3", start: 1257, end: 1431},
  {index: 8, audio: "s08.mp3", start: 1437, end: 1604},
];

// ---- 逐字字幕（gen_subs.py 生成，逐字无标点）----
type Sub = {s: number; e: number; t: string};
const subs: Sub[] = [
  {s: 0, e: 35, t: "程序一启动就报错"},
  {s: 35, e: 118, t: "Address already in use"},
  {s: 118, e: 166, t: "意思是 这扇门已经被占了"},
  {s: 171, e: 188, t: "先说底"},
  {s: 188, e: 257, t: "报错里的8080是端口号"},
  {s: 257, e: 326, t: "一台电脑的门牌号就那么多"},
  {s: 326, e: 394, t: "一个门同时只能住一个程序"},
  {s: 400, e: 420, t: "谁占的门"},
  {s: 420, e: 456, t: "一行命令揪出来"},
  {s: 456, e: 553, t: "Windows用netstat -ano"},
  {s: 553, e: 614, t: "找到占用8080的那一行"},
  {s: 614, e: 660, t: "最后一列就是PID"},
  {s: 666, e: 774, t: "Mac和Linux用lsof -i8080"},
  {s: 774, e: 833, t: "直接把占门的进程揪出来"},
  {s: 838, e: 882, t: "拿到PID 先查身份"},
  {s: 882, e: 961, t: "Windows用tasklist"},
  {s: 961, e: 1020, t: "Mac和Linux用ps"},
  {s: 1020, e: 1064, t: "看看占门的到底是谁"},
  {s: 1070, e: 1161, t: "是自己忘了关的旧程序 直接杀掉"},
  {s: 1161, e: 1207, t: "是系统重要进程"},
  {s: 1207, e: 1252, t: "就改个端口躲开"},
  {s: 1257, e: 1283, t: "口诀记好"},
  {s: 1283, e: 1328, t: "报错先看端口号"},
  {s: 1328, e: 1367, t: "命令找PID"},
  {s: 1367, e: 1431, t: "确认身份再动手 别乱杀"},
  {s: 1437, e: 1477, t: "这张排查卡截图存好"},
  {s: 1477, e: 1582, t: "下次再遇到Address already in use"},
  {s: 1582, e: 1604, t: "一分钟解决"},
];
// 大字接管区间：屏上大字与字幕同句重复（开场标题 / 口诀页），字幕让位
const SUB_SKIP: Array<[number, number]> = [[118, 166], [1283, 1431]];

// ---------- 原语 ----------

const Pop: React.FC<{delay?: number; children: React.ReactNode; style?: React.CSSProperties}> = ({
  delay = 0, children, style,
}) => {
  const frame = useCurrentFrame();
  const sp = spring({frame: frame - delay, fps: 30, config: {damping: 13, stiffness: 150}});
  return (
    <div style={{
      opacity: interpolate(sp, [0, 1], [0, 1]),
      transform: `scale(${interpolate(sp, [0, 1], [0.86, 1])})`,
      ...style,
    }}>
      {children}
    </div>
  );
};

const Note: React.FC<{x?: number; y?: number; size?: number; color?: string; style?: React.CSSProperties; children: React.ReactNode}> = ({
  x, y, size = 40, color = INK, style, children,
}) => (
  <div style={{
    position: "absolute", fontSize: size, fontFamily: HAND_FONT,
    color, fontWeight: 700, whiteSpace: "nowrap",
    ...(x !== undefined ? {left: x} : {}),
    ...(y !== undefined ? {top: y} : {}),
    ...style,
  }}>
    {children}
  </div>
);

const Outline: React.FC<{style?: React.CSSProperties; children?: React.ReactNode}> = ({style, children}) => (
  <div style={{
    border: `3px solid ${INK}`, borderRadius: 14, background: CARD,
    ...style,
  }}>
    {children}
  </div>
);

// 顶部 HUD：端口状态仪表（占用时红灯闪烁）
const Hud: React.FC<{status: string; tone: "red" | "ink" | "blue"}> = ({status, tone}) => {
  const frame = useCurrentFrame();
  const color = tone === "red" ? RED : tone === "blue" ? "#4a7fa5" : INK;
  const blink = tone === "red" && frame % 24 < 12;
  return (
    <div style={{position: "absolute", top: 34, left: 0, width: 1920, display: "flex", justifyContent: "center"}}>
      <div style={{display: "flex", alignItems: "center", gap: 22, border: `3px solid ${INK}`, borderRadius: 14, background: CARD, padding: "8px 30px"}}>
        <span style={{fontSize: 30, fontWeight: 900, fontFamily: MONO, color: INK, letterSpacing: 2}}>PORT 8080</span>
        <span style={{width: 18, height: 18, borderRadius: 9, background: blink ? RED : "#d8d2c0", border: `2px solid ${INK}`, display: "inline-block"}} />
        <span style={{fontSize: 32, fontWeight: 900, fontFamily: TITLE_FONT, color}}>{status}</span>
      </div>
    </div>
  );
};

// ---------- 大号终端：逐行打字（cps≈0.55/帧）+ 当前行粉色高亮 + 光标只在最后一行 ----------
type TLine = {
  t: string;
  kind: "cmd" | "out" | "cmt" | "err";
  start: number; // 相对页面帧
  hl?: {text: string; at: number; scale?: number; color?: string};
};

const Terminal: React.FC<{
  header: string; lines: TLine[]; x: number; top: number; w: number; h: number; fs?: number;
}> = ({header, lines, x, top, w, h, fs = 38}) => {
  const frame = useCurrentFrame();
  const CPS = 0.55;
  const rows = lines.map((ln) => ({...ln, dur: Math.ceil(ln.t.length / CPS)}));
  const lastEnd = Math.max(...rows.map((r) => (r.kind === "cmd" ? r.start + r.dur : r.start)));
  let activeIdx = -1;
  for (let i = rows.length - 1; i >= 0; i--) {
    const r = rows[i];
    const win = r.kind === "cmd" ? r.dur + 8 : 16;
    if (frame >= r.start && frame < r.start + win) { activeIdx = i; break; }
  }
  const empty = frame < rows[0].start; // 终端还没敲第一行：先给一个闪烁提示符
  const idle = empty || frame >= lastEnd + (rows[rows.length - 1].kind === "cmd" ? 12 : 8);
  const cursorOn = frame % 26 < 13;
  return (
    <div style={{
      position: "absolute", left: x, top, width: w, height: h,
      border: `3px solid ${INK}`, borderRadius: 14, background: "#FDFBF4", overflow: "hidden",
    }}>
      <div style={{
        padding: `${Math.round(fs * 0.42)}px ${Math.round(fs * 0.8)}px`, borderBottom: `3px solid ${INK}`,
        fontFamily: MONO, fontSize: Math.round(fs * 0.75), fontWeight: 700, color: INK, background: "#F3EFE2",
      }}>
        {header}
      </div>
      <div style={{padding: `${Math.round(fs * 0.5)}px ${Math.round(fs * 0.85)}px`, fontFamily: MONO, fontWeight: 700, fontSize: fs, lineHeight: 1.75}}>
        {rows.map((r, i) => {
          if (frame < r.start) return null; // 未敲到/未到的行不渲染：终端历史是"长出来"的
          if (r.kind === "cmd") {
            const n = Math.min(r.t.length, Math.floor((frame - r.start) * CPS));
            const isActive = i === activeIdx;
            return (
              <div key={i} style={{
                background: isActive ? PINK : "transparent", borderRadius: 8,
                padding: "2px 12px", margin: "3px -12px", whiteSpace: "pre",
              }}>
                <span style={{color: "#8a8577"}}>{"$ "}</span>
                <span style={{color: INK}}>{r.t.slice(0, n)}</span>
                {isActive && cursorOn ? <span style={{color: RED}}>▌</span> : null}
              </div>
            );
          }
          const p = interpolate(frame, [r.start, r.start + 9], [0, 1], {extrapolateLeft: "clamp", extrapolateRight: "clamp"});
          const isActive = i === activeIdx;
          const idx = r.hl ? r.t.indexOf(r.hl.text) : -1;
          const hlSp = r.hl ? spring({frame: frame - r.hl.at, fps: 30, config: {damping: 12, stiffness: 180}}) : 0;
          const target = r.hl?.scale ?? 1.2;
          const hlBorder = r.hl && frame >= r.hl.at ? `3px solid ${r.hl.color === "red" ? RED : INK}` : "3px solid transparent";
          return (
            <div key={i} style={{
              background: isActive || r.kind === "err" ? PINK : "transparent",
              borderRadius: 8, padding: "2px 12px", margin: "3px -12px", whiteSpace: "pre",
              color: r.kind === "cmt" ? "#9a9484" : r.kind === "err" ? RED : INK,
              opacity: p, transform: `translateY(${(1 - p) * 14}px)`,
            }}>
              {idx >= 0 ? (
                <>
                  {r.t.slice(0, idx)}
                  <span style={{
                    display: "inline-block", background: PINK, borderRadius: 8, padding: "0 10px",
                    border: hlBorder,
                    color: r.hl && r.hl.color === "red" ? RED : INK,
                    transform: `scale(${1 + (target - 1) * hlSp})`,
                  }}>{r.hl?.text}</span>
                  {r.t.slice(idx + (r.hl?.text.length ?? 0))}
                </>
              ) : r.t}
            </div>
          );
        })}
        {idle ? (
          <div style={{padding: "2px 12px", margin: "3px -12px", whiteSpace: "pre"}}>
            <span style={{color: "#8a8577"}}>{"$ "}</span>
            <span style={{color: RED}}>{cursorOn ? "▌" : " "}</span>
          </div>
        ) : null}
      </div>
    </div>
  );
};

// ---------- 手绘门（页2） ----------
const DoorFig: React.FC<{x: number; y: number; w: number; h: number; num: string; occupied?: boolean; delay: number}> = ({
  x, y, w, h, num, occupied = false, delay,
}) => {
  const frame = useCurrentFrame();
  const sp = spring({frame: frame - delay, fps: 30, config: {damping: 14, stiffness: 160}});
  return (
    <div style={{
      position: "absolute", left: x, top: y, width: w, height: h,
      opacity: interpolate(sp, [0, 1], [0, 1]),
      transform: `scale(${interpolate(sp, [0, 1], [0.7, 1])})`, transformOrigin: "bottom center",
    }}>
      <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
        <rect x={3} y={26} width={w - 6} height={h - 29} rx={8} fill={CARD} stroke={INK} strokeWidth={5} />
        <rect x={20} y={44} width={w - 40} height={h - 66} rx={4} fill={occupied ? PINK : "#fff"} stroke={INK} strokeWidth={4} />
        <circle cx={w - 38} cy={h * 0.55} r={9} fill={INK} />
        <rect x={w / 2 - 78} y={2} width={156} height={48} rx={8} fill="#fff" stroke={INK} strokeWidth={4} />
        <text x={w / 2} y={36} textAnchor="middle" fontFamily={MONO} fontSize={30} fontWeight={700} fill={occupied ? RED : INK}>{num}</text>
        {occupied && (
          <g opacity={0.9}>
            <circle cx={w / 2} cy={h * 0.44} r={26} fill="#fff" stroke={INK} strokeWidth={4} />
            <path d={`M ${w / 2 - 34} ${h - 24} L ${w / 2 - 34} ${h * 0.62} Q ${w / 2} ${h * 0.52} ${w / 2 + 34} ${h * 0.62} L ${w / 2 + 34} ${h - 24} Z`}
              fill="#fff" stroke={INK} strokeWidth={4} />
          </g>
        )}
      </svg>
    </div>
  );
};

// 敲门的新程序小人（手臂循环敲门）
const Knocker: React.FC<{x: number; y: number; delay: number}> = ({x, y, delay}) => {
  const frame = useCurrentFrame();
  const sp = spring({frame: frame - delay, fps: 30, config: {damping: 13, stiffness: 150}});
  const knock = Math.sin(frame / 3.2) * 16;
  const lean = Math.sin(frame / 3.2) * 2.2;
  const wave = ((frame - delay) % 36) / 36;
  return (
    <div style={{
      position: "absolute", left: x, top: y, width: 170, height: 230,
      opacity: interpolate(sp, [0, 1], [0, 1]),
      transform: `scale(${interpolate(sp, [0, 1], [0.8, 1])}) rotate(${lean}deg)`, transformOrigin: "bottom center",
    }}>
      <svg width={170} height={230} viewBox="0 0 170 230">
        <circle cx={80} cy={46} r={28} fill="#fff" stroke={INK} strokeWidth={5} />
        <circle cx={92} cy={42} r={3.5} fill={INK} />
        <path d="M 70 56 Q 80 62 90 56" fill="none" stroke={INK} strokeWidth={3} />
        <line x1={80} y1={74} x2={80} y2={152} stroke={INK} strokeWidth={6} />
        <line x1={80} y1={152} x2={58} y2={214} stroke={INK} strokeWidth={6} strokeLinecap="round" />
        <line x1={80} y1={152} x2={104} y2={214} stroke={INK} strokeWidth={6} strokeLinecap="round" />
        <line x1={80} y1={92} x2={128} y2={72} stroke={INK} strokeWidth={6} strokeLinecap="round"
          transform={`rotate(${knock} 80 92)`} />
        <line x1={80} y1={98} x2={42} y2={132} stroke={INK} strokeWidth={6} strokeLinecap="round" />
      </svg>
      <div style={{
        position: "absolute", left: 118, top: 28,
        fontSize: 30, fontFamily: HAND_FONT, fontWeight: 700, color: RED,
        opacity: Math.max(0, wave < 0.2 ? wave / 0.2 : 1 - (wave - 0.2) / 0.8),
      }}>咚咚</div>
    </div>
  );
};

const Subtitle: React.FC = () => {
  const frame = useCurrentFrame();
  if (SUB_SKIP.some(([a, b]) => frame >= a && frame < b)) return null;
  const cur = subs.find((s) => frame >= s.s && frame < s.e);
  if (!cur) return null;
  const sp = spring({frame: frame - cur.s, fps: 30, config: {damping: 16, stiffness: 200}});
  return (
    <div style={{position: "absolute", bottom: 34, left: 0, width: 1920, display: "flex", justifyContent: "center", pointerEvents: "none"}}>
      <div style={{
        fontSize: 46, fontWeight: 700, color: INK, fontFamily: TITLE_FONT, letterSpacing: 3,
        background: "rgba(250, 247, 236, 0.85)", borderRadius: 12, padding: "6px 30px",
        transform: `translateY(${(1 - sp) * 8}px)`,
        opacity: interpolate(sp, [0, 1], [0.3, 1]),
      }}>
        {cur.t}
      </div>
    </div>
  );
};

const Brand: React.FC = () => (
  <div style={{
    position: "absolute", top: 36, right: 44, fontSize: 30, fontWeight: 900,
    fontFamily: HAND_FONT, color: INK, border: `3px solid ${INK}`, borderRadius: 10,
    padding: "4px 16px", background: CARD,
  }}>
    小秋
  </div>
);

// ---------- 场景（页内帧均相对） ----------

// P1 开场 0-171：第0帧标题+终端框架完整就位，命令敲入后爆红
const Scene1: React.FC = () => (
  <AbsoluteFill>
    <Hud status="占用中" tone="red" />
    <div style={{position: "absolute", top: 128, left: 0, width: 1920, textAlign: "center"}}>
      <span style={{fontSize: 102, fontWeight: 900, fontFamily: TITLE_FONT, color: INK, letterSpacing: 6}}>这扇门已经被占了</span>
    </div>
    <Terminal
      header="cmd — xiaoqiu@pc — 启动失败"
      x={180} top={296} w={1560} h={570} fs={42}
      lines={[
        {t: "node server.js", kind: "cmd", start: 12},
        {t: "Error: listen EADDRINUSE: address already in use", kind: "err", start: 53},
        {t: "    at Server.setupListenBind (node:http)", kind: "cmt", start: 78},
      ]}
    />
    <Note x={1610} y={380} size={36} color={RED} style={{transform: "rotate(-6deg)"}}>占了 8080</Note>
  </AbsoluteFill>
);

// P2 原理 171-400：一排门，8080 被占，新程序敲门被拒
const Scene2: React.FC = () => (
  <AbsoluteFill>
    <Hud status="占用中" tone="red" />
    <Note x={0} y={116} size={54} style={{left: 0, width: 1920, textAlign: "center"}}>端口 = 电脑的门牌号</Note>
    <DoorFig x={452} y={336} w={280} h={392} num=":8079" delay={5} />
    <DoorFig x={800} y={292} w={350} h={462} num=":8080" occupied delay={12} />
    <DoorFig x={1218} y={336} w={280} h={392} num=":8081" delay={19} />
    <Pop delay={48} style={{position: "absolute", left: 966, top: 182, transform: "rotate(-7deg)"}}>
      <div style={{
        border: `4px solid ${RED}`, color: RED, borderRadius: 12, background: "#fff",
        padding: "6px 20px", fontSize: 38, fontWeight: 900, fontFamily: TITLE_FONT, whiteSpace: "nowrap",
      }}>已入住</div>
    </Pop>
    <Note x={524} y={748} size={32} color="#8a8577">还空着</Note>
    <Note x={1290} y={748} size={32} color="#8a8577">还空着</Note>
    <Knocker x={648} y={560} delay={131} />
    <Pop delay={211} style={{position: "absolute", left: 348, top: 566, transform: "rotate(-5deg)"}}>
      <div style={{
        border: `4px solid ${RED}`, color: RED, borderRadius: 14, background: "#fff",
        padding: "10px 26px", fontSize: 40, fontWeight: 900, fontFamily: HAND_FONT, whiteSpace: "nowrap",
      }}>满员了，进不去…</div>
    </Pop>
    <Note x={0} y={866} size={40} color="#6f6a5c" style={{left: 0, width: 1920, textAlign: "center"}}>8080 号门，已经有人住了</Note>
  </AbsoluteFill>
);

// P3 Windows 排查 400-666：netstat 敲出，输出表浮出，PID 粉色高亮放大
const Scene3: React.FC = () => (
  <AbsoluteFill>
    <Hud status="排查中" tone="ink" />
    <Note x={0} y={124} size={48} style={{left: 0, width: 1920, textAlign: "center"}}>第一步：找到占门的 PID</Note>
    <Terminal
      header="cmd — Windows — xiaoqiu@pc"
      x={180} top={240} w={1560} h={560} fs={40}
      lines={[
        {t: "netstat -ano | findstr :8080", kind: "cmd", start: 75},
        {t: "  Proto  Local Address      State          PID", kind: "out", start: 150},
        {t: "  TCP    0.0.0.0:8080         LISTENING     17772", kind: "out", start: 168, hl: {text: "17772", at: 244, scale: 1.28}},
        {t: "  TCP    [::]:8080             LISTENING     17772", kind: "out", start: 197},
      ]}
    />
    <Pop delay={244} style={{position: "absolute", left: 1424, top: 606, transform: "rotate(-5deg)"}}>
      <div style={{fontSize: 40, fontFamily: HAND_FONT, fontWeight: 700, color: RED, whiteSpace: "nowrap"}}>← 最后一列就是它</div>
    </Pop>
  </AbsoluteFill>
);

// P4 Mac/Linux 排查 666-838：lsof 一行揪出，右上角 Mac/Linux 标签
const Scene4: React.FC = () => (
  <AbsoluteFill>
    <Hud status="排查中" tone="ink" />
    <div style={{
      position: "absolute", top: 104, right: 44, border: `3px solid ${INK}`, borderRadius: 10,
      background: BLUE, padding: "4px 18px", fontSize: 28, fontWeight: 900, fontFamily: TITLE_FONT, color: INK,
    }}>Mac / Linux</div>
    <Note x={0} y={124} size={48} style={{left: 0, width: 1920, textAlign: "center"}}>不用开任务管理器</Note>
    <Terminal
      header="bash — Mac / Linux — xiaoqiu@mac"
      x={180} top={240} w={1560} h={430} fs={40}
      lines={[
        {t: "lsof -i:8080", kind: "cmd", start: 30},
        {t: "  COMMAND   PID    USER   FD   TYPE   NODE NAME", kind: "out", start: 85},
        {t: "  node    17772  xiaoqiu  24u  IPv4  TCP *:8080", kind: "out", start: 105, hl: {text: "17772", at: 141, scale: 1.28}},
      ]}
    />
    <Pop delay={141} style={{position: "absolute", left: 672, top: 500, transform: "rotate(-5deg)"}}>
      <div style={{fontSize: 40, fontFamily: HAND_FONT, fontWeight: 700, color: RED, whiteSpace: "nowrap"}}>← 占门的进程</div>
    </Pop>
    <Note x={0} y={790} size={38} color="#6f6a5c" style={{left: 0, width: 1920, textAlign: "center"}}>命令不同，套路一样：先拿到 PID</Note>
  </AbsoluteFill>
);

// P5 查身份 838-1070：双终端 tasklist / ps，工作证弹出
const Scene5: React.FC = () => (
  <AbsoluteFill>
    <Hud status="排查中" tone="ink" />
    <Note x={0} y={112} size={48} style={{left: 0, width: 1920, textAlign: "center"}}>第二步：查身份</Note>
    <Terminal
      header="Windows — PowerShell"
      x={90} top={230} w={840} h={460} fs={30}
      lines={[
        {t: "tasklist | findstr 17772", kind: "cmd", start: 70},
        {t: "node.exe    17772  Console", kind: "out", start: 120, hl: {text: "node.exe", at: 200, scale: 1.15}},
      ]}
    />
    <Terminal
      header="Mac / Linux — bash"
      x={990} top={230} w={840} h={460} fs={30}
      lines={[
        {t: "ps -p 17772", kind: "cmd", start: 145},
        {t: "  PID  TTY      TIME CMD", kind: "out", start: 175},
        {t: "17772  ?     0:02  node", kind: "out", start: 195, hl: {text: "node", at: 218, scale: 1.15}},
      ]}
    />
    <Note x={0} y={842} size={40} color="#6f6a5c" style={{left: 0, width: 1920, textAlign: "center"}}>查清身份，才好动手</Note>
    <Pop delay={218} style={{position: "absolute", left: 490, top: 712, transform: "rotate(-2deg)"}}>
      <div style={{
        border: `4px solid ${INK}`, borderRadius: 14, background: "#fff", padding: "18px 44px",
        whiteSpace: "nowrap", display: "flex", alignItems: "center", gap: 26,
      }}>
        <span style={{fontSize: 40, fontWeight: 900, fontFamily: TITLE_FONT, color: INK}}>工作证</span>
        <span style={{fontSize: 38, fontFamily: MONO, fontWeight: 700, color: RED}}>node.exe（PID 17772）</span>
      </div>
    </Pop>
  </AbsoluteFill>
);

// P6 处置分叉 1070-1257：左杀旧程序 / 右改端口搬家
const Scene6: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill>
      <Hud status={frame < 100 ? "占用中" : "已释放"} tone={frame < 100 ? "red" : "blue"} />
      <Pop delay={30} style={{position: "absolute", left: 110, top: 126}}>
        <Outline style={{width: 760, padding: "18px 34px", background: "#fff", transform: "rotate(-1deg)"}}>
          <span style={{fontSize: 40, fontWeight: 900, fontFamily: TITLE_FONT, color: INK}}>自己的旧程序，忘了关</span>
          <span style={{fontSize: 32, fontFamily: HAND_FONT, color: RED, marginLeft: 18}}>能杀，直接杀</span>
        </Outline>
      </Pop>
      <Terminal
        header="Windows — PowerShell"
        x={110} top={266} w={760} h={440} fs={30}
        lines={[
          {t: "taskkill /PID 17772 /F", kind: "cmd", start: 60},
          {t: "成功: 已终止 PID 17772 的进程", kind: "out", start: 110},
          {t: "# Mac/Linux: kill -9 17772", kind: "cmt", start: 140},
        ]}
      />
      <Pop delay={120} style={{position: "absolute", left: 1050, top: 126}}>
        <Outline style={{width: 760, padding: "18px 34px", background: "#fff", transform: "rotate(1deg)"}}>
          <span style={{fontSize: 40, fontWeight: 900, fontFamily: TITLE_FONT, color: INK}}>系统重要进程，别杀</span>
          <span style={{fontSize: 32, fontFamily: HAND_FONT, color: "#4a7fa5", marginLeft: 18}}>改端口，躲开</span>
        </Outline>
      </Pop>
      <Terminal
        header="application.properties — 改配置"
        x={1050} top={266} w={760} h={440} fs={30}
        lines={[
          {t: "# 换一扇门", kind: "cmt", start: 145},
          {t: "server.port=8081", kind: "cmd", start: 160, hl: {text: "8081", at: 168, scale: 1.2}},
        ]}
      />
      <Note x={902} y={430} size={44} color="#8a8577">或</Note>
      <Note x={0} y={816} size={40} color="#6f6a5c" style={{left: 0, width: 1920, textAlign: "center"}}>动手前，先分清它能不能杀</Note>
    </AbsoluteFill>
  );
};

// P7 口诀 1257-1437：三行大字逐句弹出，角落贴纸（不出声）
const Scene7: React.FC = () => (
  <AbsoluteFill>
    <Hud status="已释放" tone="blue" />
    <Note x={0} y={130} size={48} color="#6f6a5c" style={{left: 0, width: 1920, textAlign: "center"}}>排错口诀，记三句</Note>
    <Pop delay={35}>
      <div style={{position: "absolute", top: 286, left: 0, width: 1920, textAlign: "center"}}>
        <span style={{fontSize: 96, fontWeight: 900, fontFamily: TITLE_FONT, color: INK, letterSpacing: 8}}>报错先看端口号</span>
      </div>
    </Pop>
    <Pop delay={77}>
      <div style={{position: "absolute", top: 472, left: 0, width: 1920, textAlign: "center"}}>
        <span style={{fontSize: 96, fontWeight: 900, fontFamily: TITLE_FONT, color: INK, letterSpacing: 8}}>
          {"命令找 "}
          <span style={{background: PINK, borderRadius: 14, padding: "0 18px"}}>PID</span>
        </span>
      </div>
    </Pop>
    <Pop delay={115}>
      <div style={{position: "absolute", top: 660, left: 0, width: 1920, textAlign: "center"}}>
        <span style={{fontSize: 86, fontWeight: 900, fontFamily: TITLE_FONT, color: INK, letterSpacing: 6}}>
          确认身份再动手，<span style={{color: RED}}>别乱杀</span>
        </span>
      </div>
    </Pop>
    <Pop delay={152} style={{position: "absolute", left: 108, top: 852, transform: "rotate(-7deg)"}}>
      <div style={{
        border: `3px solid ${INK}`, borderRadius: 12, background: PINK, padding: "8px 22px",
        fontSize: 32, fontFamily: HAND_FONT, fontWeight: 700, color: INK, whiteSpace: "nowrap",
      }}>结尾有排查卡</div>
    </Pop>
  </AbsoluteFill>
);

// P8 结尾截图卡 1437-1710：亮底速查卡，最后 ~100 帧完全静止
const Scene8: React.FC = () => {
  const rows: Array<{chip: string; cmd: string; tip: string}> = [
    {chip: "Windows", cmd: "netstat -ano | findstr :8080", tip: "找 PID"},
    {chip: "Mac / Linux", cmd: "lsof -i:8080", tip: "找 PID"},
    {chip: "查身份", cmd: "tasklist · ps", tip: "杀掉 或 换端口"},
  ];
  return (
    <AbsoluteFill style={{background: "#FFFFFF"}}>
      <div style={{position: "absolute", top: 124, left: 0, width: 1920, textAlign: "center"}}>
        <div style={{fontSize: 94, fontWeight: 900, fontFamily: TITLE_FONT, color: "#111", letterSpacing: 8}}>端口占用一分钟排查</div>
        <div style={{fontSize: 36, fontFamily: MONO, fontWeight: 700, color: RED, marginTop: 18}}>Address already in use? 别慌</div>
      </div>
      <div style={{position: "absolute", top: 356, left: 260, width: 1400, border: "4px solid #111", borderRadius: 18, background: "#fff", padding: "30px 46px"}}>
        {rows.map((r, i) => (
          <Pop key={i} delay={10 + i * 6}>
            <div style={{display: "flex", alignItems: "center", gap: 30, padding: "16px 0", borderBottom: i < 2 ? "2px dashed #bbb" : "none"}}>
              <span style={{
                width: 230, textAlign: "center", border: "3px solid #111", borderRadius: 10,
                background: i === 2 ? PINK : CARD, padding: "8px 0", fontSize: 32, fontWeight: 900,
                fontFamily: TITLE_FONT, color: "#111",
              }}>{r.chip}</span>
              <span style={{fontSize: 38, fontFamily: MONO, fontWeight: 700, color: "#111", width: 660}}>{r.cmd}</span>
              <span style={{fontSize: 34, fontFamily: HAND_FONT, fontWeight: 700, color: RED}}>{`→ ${r.tip}`}</span>
            </div>
          </Pop>
        ))}
      </div>
      <div style={{position: "absolute", bottom: 116, left: 0, width: 1920, textAlign: "center", fontSize: 36, fontFamily: TITLE_FONT, color: "#888", letterSpacing: 4}}>
        小秋 · 0基础也能学会
      </div>
    </AbsoluteFill>
  );
};

// ---------- 组装 ----------
const scenes = [
  {start: SENT[0], C: Scene1},
  {start: SENT[1], C: Scene2},
  {start: SENT[2], C: Scene3},
  {start: SENT[3], C: Scene4},
  {start: SENT[4], C: Scene5},
  {start: SENT[5], C: Scene6},
  {start: SENT[6], C: Scene7},
  {start: SENT[7], C: Scene8},
];
const bounds = [...SENT, DUR];

// 打字键击音：命令打字窗口内每 6 帧一声轻 click（绝对帧）
const typeWindows: Array<[number, number]> = [
  [12, 42], [475, 527], [696, 719], [908, 953], [983, 1004], [1130, 1171],
];
const clickFrames: number[] = [];
for (const [a, b] of typeWindows) {
  for (let f = a; f <= b; f += 6) clickFrames.push(f);
}

export const PortOccupied: React.FC = () => {
  const frame = useCurrentFrame();
  const bedVolume = interpolate(frame, [0, 20, DUR - 130, DUR - 100, DUR - 26, DUR - 1], [0, 0.06, 0.06, 0.1, 0.17, 0], {extrapolateLeft: "clamp", extrapolateRight: "clamp"});
  return (
    <AbsoluteFill style={{backgroundColor: PAPER, fontFamily: TITLE_FONT, overflow: "hidden"}}>
      {scenes.map(({start, C}, i) => (
        <Sequence key={i} from={start} durationInFrames={bounds[i + 1] - start}>
          <C />
        </Sequence>
      ))}
      {frame < SENT[7] && <Brand />}
      {voiceLines.map((s) => (
        <Sequence key={`vo-${s.index}`} from={s.start} durationInFrames={s.end - s.start + 30}>
          <Audio src={staticFile(`audio/portoccupied-tts/${s.audio}`)} volume={1} />
        </Sequence>
      ))}
      {/* 音效层（统一挂主组件） */}
      <Sequence from={53} durationInFrames={30}><Audio src={staticFile("audio/sfx/error.wav")} volume={0.3} /></Sequence>
      {[176, 219, 311, 644, 1100, 1190, 1445].map((f) => (
        <Sequence key={`p${f}`} from={f} durationInFrames={30}><Audio src={staticFile("audio/sfx/pop.wav")} volume={0.26} /></Sequence>
      ))}
      {[1056, 1292].map((f) => (
        <Sequence key={`d${f}`} from={f} durationInFrames={30}><Audio src={staticFile("audio/sfx/ding.wav")} volume={0.3} /></Sequence>
      ))}
      {[171, 400, 666, 838, 1070, 1257, 1437].map((f) => (
        <Sequence key={`t${f}`} from={f} durationInFrames={30}><Audio src={staticFile("audio/sfx/page3.wav")} volume={0.28} /></Sequence>
      ))}
      {clickFrames.map((f) => (
        <Sequence key={`c${f}`} from={f} durationInFrames={6}><Audio src={staticFile("audio/sfx/click.wav")} volume={0.16} /></Sequence>
      ))}
      <Audio src={staticFile("audio/bed.wav")} loop volume={() => bedVolume} />
      <Sequence from={1437} durationInFrames={60}>
        <Audio src={staticFile("audio/sfx/warm3.wav")} volume={0.26} />
      </Sequence>
      <Subtitle />
    </AbsoluteFill>
  );
};
