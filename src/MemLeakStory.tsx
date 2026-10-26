// 《服务器越跑越慢？八成是内存泄漏》v2
// story-whiteboard 风格：米白纸底黑线稿 + 居中构图 + 大号加粗终端面板（逐行打字+当前行粉色高亮）+ 顶部HUD内存仪表
// v2 按用户反馈：居中布局 / 终端更大字更粗 / 男声云希+18% / 每场加持续动画 / 砍超长静止画面
import {Audio} from "@remotion/media";
import {
  AbsoluteFill, interpolate, Sequence, spring, staticFile, useCurrentFrame, useVideoConfig,
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

export const memLeakDurationInFrames = 1568;

// ---- 配音窗口（memleak-tts-m/timeline.json，男声云希+18%，MP3实测）----
const voiceLines = [
  {index: 1, audio: "s01.mp3", start: 0, end: 133},
  {index: 2, audio: "s02.mp3", start: 136, end: 280},
  {index: 3, audio: "s03.mp3", start: 282, end: 412},
  {index: 4, audio: "s04.mp3", start: 414, end: 508},
  {index: 5, audio: "s05.mp3", start: 511, end: 615},
  {index: 6, audio: "s06.mp3", start: 618, end: 765},
  {index: 7, audio: "s07.mp3", start: 768, end: 904},
  {index: 8, audio: "s08.mp3", start: 906, end: 1034},
  {index: 9, audio: "s09.mp3", start: 1037, end: 1166},
  {index: 10, audio: "s10.mp3", start: 1169, end: 1313},
  {index: 11, audio: "s11.mp3", start: 1315, end: 1493},
];

// ---- 逐字字幕（gen_subs.py 生成，逐字无标点）----
type Sub = {s: number; e: number; t: string};
const subs: Sub[] = [
  {s: 0, e: 63, t: "这台服务器没人在操作"},
  {s: 63, e: 133, t: "内存却每天都在悄悄变少"},
  {s: 136, e: 177, t: "表面上还能跑"},
  {s: 177, e: 280, t: "直到某天深夜 它突然卡死 服务全挂"},
  {s: 282, e: 342, t: "很多人的第一反应是重启"},
  {s: 342, e: 412, t: "重启能撑几天 然后又慢了回去"},
  {s: 414, e: 458, t: "其实这不是玄学"},
  {s: 458, e: 508, t: "是典型的内存泄漏"},
  {s: 511, e: 576, t: "程序申请了一块堆内存"},
  {s: 576, e: 615, t: "用完却忘了还"},
  {s: 618, e: 667, t: "一两个忘还不致命"},
  {s: 667, e: 765, t: "可怕的是它每分钟都在申请 越积越多"},
  {s: 768, e: 845, t: "第一步 用free命令看总量"},
  {s: 845, e: 904, t: "已用一路涨 可用一路掉"},
  {s: 906, e: 983, t: "第二步 用top按内存排序"},
  {s: 983, e: 1034, t: "真凶就排在第一行"},
  {s: 1037, e: 1098, t: "确认它该不该吃这么多"},
  {s: 1098, e: 1166, t: "再决定杀掉它 还是修代码"},
  // 1169-1212 “记住这句口诀”期间底部无字幕，1212-1313 金句大字接管（铁律12）
  {s: 1315, e: 1404, t: "下一集讲怎么让进程把内存吐出来"},
  {s: 1404, e: 1493, t: "排错系列都在主页合集里 建议收藏"},
];

// ---------- 原语 ----------

const Pop: React.FC<{delay?: number; children: React.ReactNode; style?: React.CSSProperties}> = ({
  delay = 0, children, style,
}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const sp = spring({frame: frame - delay, fps, config: {damping: 13, stiffness: 150}});
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

// 顶部 HUD：内存仪表（居中横条，数字持续跳动）
const Hud: React.FC<{pct: number; usedG: number; totalG?: number; days: number; alarm?: boolean}> = ({
  pct, usedG, totalG = 8, days, alarm = false,
}) => {
  const barW = 360;
  const color = pct >= 88 ? RED : BLUE;
  return (
    <div style={{position: "absolute", top: 34, left: 0, right: 0, display: "flex", justifyContent: "center"}}>
      <div style={{display: "flex", alignItems: "center", gap: 30, whiteSpace: "nowrap"}}>
        <div style={{fontSize: 32, fontWeight: 900, fontFamily: TITLE_FONT, color: INK, letterSpacing: 2}}>内存</div>
        <div style={{position: "relative", width: barW, height: 34, border: `3px solid ${INK}`, borderRadius: 17, background: "#fff"}}>
          <div style={{
            position: "absolute", left: 3, top: 3, bottom: 3,
            width: interpolate(pct, [0, 100], [0, barW - 6]),
            background: color, borderRadius: 14,
          }} />
        </div>
        <div style={{fontSize: 38, fontWeight: 900, fontFamily: MONO, color: pct >= 88 ? RED : INK, minWidth: 100, textAlign: "right"}}>
          {Math.round(pct)}%
        </div>
        <div style={{fontSize: 28, fontFamily: MONO, color: INK, whiteSpace: "nowrap"}}>
          {usedG.toFixed(1)}G / {totalG}.0G
        </div>
        <div style={{fontSize: 28, fontFamily: MONO, color: alarm ? RED : "#8a8577", whiteSpace: "nowrap",
          animation: "none"}}>
          运行 {Math.round(days)} 天{alarm ? " · 告警" : ""}
        </div>
      </div>
    </div>
  );
};

// 右侧→居中的大号代码终端：逐行打字 + 当前行粉色加粗高亮
type CodeLine = {t: string; kind?: "cmd" | "out" | "cmt"; hl?: boolean};
const CodePanel: React.FC<{header?: string; lines: CodeLine[]; top?: number; height?: number}> = ({
  header = "bash — xiaoqiu@server", lines, top = 330, height = 420,
}) => {
  const frame = useCurrentFrame();
  const CMD_CPS = 14;
  const OUT_CPS = 60;
  let cursor = 12;
  const rows = lines.map((ln, i) => {
    const cps = ln.kind === "cmd" ? CMD_CPS : OUT_CPS;
    const dur = Math.max(4, Math.round(ln.t.length / cps * 30));
    const start = cursor;
    cursor += dur + (ln.kind === "cmd" ? 10 : 5);
    const shown = ln.t.slice(0, Math.max(0, Math.floor((frame - start) / 30 * cps)));
    return {ln, shown, start, lastEnd: start + dur, i};
  });
  let activeIdx = -1;
  for (const r of rows) {
    if (frame >= r.start && frame < r.lastEnd + 8) { activeIdx = r.i; break; }
  }
  if (activeIdx === -1) {
    for (let i = rows.length - 1; i >= 0; i--) {
      if (frame >= rows[i].lastEnd) { activeIdx = i; break; }
    }
  }
  const hlIdx = lines.findIndex((l) => l.hl);
  const isHl = (i: number) =>
    (hlIdx >= 0 && i === hlIdx && frame >= rows[i].lastEnd) || i === activeIdx;
  return (
    <Outline style={{position: "absolute", left: 420, top, width: 1080, height, padding: 0, overflow: "hidden", background: "#FDFBF4"}}>
      <div style={{
        padding: "16px 30px", borderBottom: `3px solid ${INK}`,
        fontFamily: MONO, fontSize: 30, fontWeight: 700, color: INK, background: "#F3EFE2",
      }}>
        {header}
      </div>
      <div style={{padding: "26px 34px", fontFamily: MONO, fontSize: 36, fontWeight: 700, lineHeight: 1.72}}>
        {rows.map(({ln, shown, i}) => (
          <div key={i} style={{
            background: isHl(i) && ln.kind !== "cmt" ? PINK : "transparent",
            borderRadius: 8, padding: "3px 14px", margin: "4px -14px",
            whiteSpace: "pre", minHeight: 50,
            color: ln.kind === "cmt" ? "#9a9484" : INK,
          }}>
            {shown}
            {i === activeIdx && ln.kind === "cmd" && frame % 26 < 13 ? "▌" : ""}
          </div>
        ))}
      </div>
    </Outline>
  );
};

// 服务器机柜线稿（LED 持续闪烁）
const ServerRack: React.FC<{x: number; y: number; w?: number; alarm?: boolean; label?: string}> = ({
  x, y, w = 300, alarm = false, label,
}) => {
  const frame = useCurrentFrame();
  const h = w * 1.28;
  const slotH = h * 0.24;
  const ledOn = alarm
    ? frame % 16 < 8
    : frame % 50 < 34;
  return (
    <div style={{position: "absolute", left: x, top: y, width: w, height: h}}>
      <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
        <rect x={4} y={4} width={w - 8} height={h - 8} rx={14}
          fill={CARD} stroke={INK} strokeWidth={4} />
        {[0, 1, 2].map((i) => (
          <g key={i}>
            <rect x={26} y={16 + i * (slotH + 14)} width={w - 52} height={slotH} rx={8}
              fill="#fff" stroke={INK} strokeWidth={3} />
            <circle cx={52} cy={16 + i * (slotH + 14) + slotH / 2} r={7}
              fill={alarm && i === 0 ? (ledOn ? RED : "#e8b3ad") : ledOn ? "#8fb98f" : "#c5cfc5"}
              stroke={INK} strokeWidth={2} />
            <line x1={80} y1={16 + i * (slotH + 14) + slotH / 2} x2={w - 40}
              y2={16 + i * (slotH + 14) + slotH / 2} stroke={INK} strokeWidth={2} opacity={0.45} />
          </g>
        ))}
        {alarm && ledOn && <circle cx={w - 40} cy={34} r={9} fill={RED} />}
      </svg>
      {label && (
        <div style={{textAlign: "center", marginTop: 10, fontFamily: MONO, fontSize: 28, fontWeight: 700, color: INK}}>{label}</div>
      )}
    </div>
  );
};

// 内存块（入场弹跳 + 持续呼吸）
const MemBlock: React.FC<{x: number; y: number; w?: number; color?: string; delay?: number; breath?: boolean}> = ({
  x, y, w = 150, color = BLUE, delay = 0, breath = false,
}) => {
  const frame = useCurrentFrame();
  const sp = spring({frame: frame - delay, fps: 30, config: {damping: 14, stiffness: 170}});
  const pulse = breath ? 1 + 0.03 * Math.sin((frame - delay) / 5) : 1;
  return (
    <div style={{
      position: "absolute", left: x, top: y, width: w, height: 46,
      border: `3px solid ${INK}`, borderRadius: 8,
      background: color, opacity: interpolate(sp, [0, 1], [0, 1]),
      transform: `scale(${interpolate(sp, [0, 1], [0.7, 1]) * pulse})`,
    }} />
  );
};

// 上升的小飘字（+1 越积越多）
const Floater: React.FC<{x: number; y: number; text: string; period: number; offset: number; color?: string}> = ({
  x, y, text, period, offset, color = RED,
}) => {
  const frame = useCurrentFrame();
  const t = ((frame + offset) % period) / period;
  return (
    <div style={{
      position: "absolute", left: x, top: y - t * 90,
      fontSize: 30, fontFamily: MONO, fontWeight: 700, color,
      opacity: t < 0.15 ? t / 0.15 : 1 - (t - 0.15) / 0.85,
    }}>
      {text}
    </div>
  );
};

const Subtitle: React.FC = () => {
  const frame = useCurrentFrame();
  const cur = subs.find((s) => frame >= s.s && frame < s.e);
  if (!cur) return null;
  const sp = spring({frame: frame - cur.s, fps: 30, config: {damping: 16, stiffness: 200}});
  return (
    <div style={{position: "absolute", bottom: 42, left: 0, right: 0, display: "flex", justifyContent: "center", pointerEvents: "none"}}>
      <div style={{
        fontSize: 48, fontWeight: 700, color: INK,
        fontFamily: TITLE_FONT, letterSpacing: 3,
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

// ---------- 场景 ----------

// S1 封面钩子：0-144（第0帧完整呈现；HUD/LED/光标持续微动）
const SceneCover: React.FC = () => {
  const frame = useCurrentFrame();
  const pct = interpolate(frame, [0, 144], [45, 49]);
  return (
    <AbsoluteFill>
      <Hud pct={pct} usedG={3.6} days={12} />
      <div style={{position: "absolute", top: 240, left: 0, right: 0, display: "flex", justifyContent: "center", gap: 90, alignItems: "flex-start"}}>
        <div style={{position: "relative", width: 320, height: 450}}>
          <ServerRack x={0} y={0} w={320} label="web-server" />
        </div>
        <div style={{position: "relative", width: 900, paddingTop: 70}}>
          <div style={{fontWeight: 900, fontFamily: TITLE_FONT, color: INK, fontSize: 120, letterSpacing: 8, whiteSpace: "nowrap"}}>
            内存去哪了？
          </div>
          <Note x={8} y={220} size={44} color="#6f6a5c" style={{left: 8}}>它没人在操作，数字却在每天变小</Note>
          <svg style={{position: "absolute", left: 20, top: 292}} width={360} height={26} viewBox="0 0 360 26">
            <path d="M6 16 C 90 4, 260 4, 350 14" fill="none" stroke={RED} strokeWidth={5} opacity={0.65} />
          </svg>
        </div>
      </div>
    </AbsoluteFill>
  );
};

// S2 深夜卡死：144-300
const SceneCrash: React.FC = () => {
  const frame = useCurrentFrame();
  const pct = interpolate(frame, [0, 100], [49, 91]);
  const crashed = frame > 96; // “卡死”≈s02 rel 99
  const shake = crashed ? Math.sin(frame * 1.7) * (frame > 96 && frame < 120 ? 6 : 2) : 0;
  return (
    <AbsoluteFill>
      <Hud pct={pct} usedG={interpolate(pct, [0, 100], [0, 8])} days={12} alarm={pct >= 88} />
      <div style={{transform: `translateY(${shake}px)`}}>
        <div style={{position: "absolute", top: 280, left: 0, right: 0, display: "flex", justifyContent: "center"}}>
          <div style={{position: "relative", width: 320, height: 460}}>
            <ServerRack x={0} y={0} w={320} alarm={crashed} label={crashed ? "response timeout" : "web-server"} />
          </div>
        </div>
      </div>
      {crashed && (
        <Pop delay={100}>
          <div style={{
            position: "absolute", left: 1180, top: 400, transform: "rotate(-6deg)",
            border: `5px solid ${RED}`, color: RED, borderRadius: 16,
            padding: "18px 44px", fontSize: 84, fontWeight: 900, fontFamily: TITLE_FONT,
            background: "#fff", whiteSpace: "nowrap",
          }}>
            服务全挂
          </div>
        </Pop>
      )}
      {!crashed && <Note x={0} y={780} size={44} color="#6f6a5c" style={{left: 0, right: 0, textAlign: "center"}}>表面上看，一切正常</Note>}
    </AbsoluteFill>
  );
};

// S3 重启误区：300-444
const SceneRestart: React.FC = () => {
  const frame = useCurrentFrame();
  const pct = frame < 58 ? interpolate(frame, [0, 54], [91, 45]) : interpolate(frame, [58, 120], [45, 74]);
  const dash = (frame * 1.4) % 22;
  return (
    <AbsoluteFill>
      <Hud pct={pct} usedG={interpolate(pct, [0, 100], [0, 8])} days={13} alarm={pct >= 88} />
      <div style={{position: "absolute", top: 290, left: 0, right: 0, display: "flex", justifyContent: "center", gap: 110, alignItems: "center"}}>
        <div style={{position: "relative", width: 280, height: 420}}>
          <ServerRack x={0} y={0} w={280} label="重启" />
        </div>
        <svg width={140} height={90} viewBox="0 0 140 90">
          <path d="M14 70 C 55 24, 88 22, 118 52" fill="none" stroke={INK} strokeWidth={5}
            strokeDasharray="14 8" strokeDashoffset={-dash} />
          <path d="M104 56 L124 56 L114 36" fill="none" stroke={INK} strokeWidth={5} />
        </svg>
        <div style={{textAlign: "center"}}>
          <div style={{fontSize: 92, fontWeight: 900, fontFamily: TITLE_FONT, color: INK, letterSpacing: 4}}>然后呢？</div>
          <div style={{fontSize: 44, fontFamily: HAND_FONT, fontWeight: 700, color: RED, marginTop: 18}}>过几天，又慢了回去</div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

// S4 定性：444-549
const SceneName: React.FC = () => {
  const chars = ["内", "存", "泄", "漏"];
  return (
    <AbsoluteFill>
      <Hud pct={74} usedG={5.9} days={26} />
      <div style={{position: "absolute", top: 330, left: 0, right: 0, textAlign: "center"}}>
        <div style={{fontSize: 54, fontFamily: HAND_FONT, color: "#6f6a5c", marginBottom: 24}}>这不是玄学，它有个名字</div>
        <div style={{display: "flex", justifyContent: "center", gap: 18}}>
          {chars.map((c, i) => (
            <Pop key={i} delay={14 + i * 9}>
              <span style={{
                fontSize: 158, fontWeight: 900, fontFamily: TITLE_FONT, color: INK,
                background: i >= 2 ? PINK : "transparent", borderRadius: 16, padding: "0 10px",
                display: "inline-block",
              }}>{c}</span>
            </Pop>
          ))}
        </div>
        <Pop delay={56}>
          <div style={{marginTop: 30, display: "inline-block", border: `3px solid ${INK}`, borderRadius: 12, background: "#fff", padding: "10px 36px"}}>
            <span style={{fontSize: 42, fontFamily: MONO, color: INK, fontWeight: 700}}>Memory Leak</span>
          </div>
        </Pop>
      </div>
    </AbsoluteFill>
  );
};

// S5 原理：申请了忘了还 549-664（内存块滑入 + 归还箭头虚线行进）
const ScenePrinciple: React.FC = () => {
  const frame = useCurrentFrame();
  const slide = interpolate(frame, [30, 64], [-240, 0], {extrapolateLeft: "clamp", extrapolateRight: "clamp"});
  const dash = (frame * 1.6) % 24;
  return (
    <AbsoluteFill>
      <Hud pct={74} usedG={5.9} days={26} />
      <div style={{position: "absolute", top: 330, left: 0, right: 0, display: "flex", justifyContent: "center", alignItems: "flex-start", gap: 70}}>
        <Outline style={{width: 320, height: 150}}>
          <div style={{textAlign: "center", paddingTop: 48, fontFamily: MONO, fontSize: 38, fontWeight: 700}}>程序</div>
        </Outline>
        <div style={{position: "relative", width: 240}}>
          <Note x={0} y={-64} size={36} style={{left: 0, width: 240, textAlign: "center"}}>malloc 申请一块</Note>
          <svg width={240} height={64} viewBox="0 0 240 64">
            <path d="M12 32 L196 32" stroke={INK} strokeWidth={5} />
            <path d="M182 14 L208 32 L182 50" fill="none" stroke={INK} strokeWidth={5} />
          </svg>
          <svg width={240} height={64} viewBox="0 0 240 64">
            <path d="M228 32 L56 32" stroke={RED} strokeWidth={5} strokeDasharray="14 10" strokeDashoffset={-dash} opacity={0.85} />
            <path d="M72 14 L46 32 L72 50" fill="none" stroke={RED} strokeWidth={5} strokeDasharray="14 10" strokeDashoffset={-dash} opacity={0.85} />
          </svg>
        </div>
        <div style={{position: "relative", width: 210}}>
          <div style={{transform: `translateX(${slide}px)`}}>
            <MemBlock x={0} y={0} w={210} delay={30} breath />
          </div>
          <Note x={0} y={72} size={34} style={{left: 0, width: 210, textAlign: "center"}}>堆内存</Note>
        </div>
      </div>
      <Note x={0} y={640} size={40} color={RED} style={{left: 0, right: 0, textAlign: "center"}}>还回去的箭头，不存在</Note>
    </AbsoluteFill>
  );
};

// S6 越积越多 664-825（块不断落下 + 飘字 + 仪表爬升）
const SceneAccumulate: React.FC = () => {
  const frame = useCurrentFrame();
  const pct = interpolate(frame, [0, 140], [74, 93]);
  const dropN = Math.min(9, Math.floor(frame / 15));
  return (
    <AbsoluteFill>
      <Hud pct={pct} usedG={interpolate(pct, [0, 100], [0, 8])} days={interpolate(frame, [0, 140], [26, 47])} alarm={pct >= 88} />
      <Note x={0} y={228} size={42} style={{left: 0, right: 0, textAlign: "center"}}>每分钟都在申请</Note>
      <div style={{position: "absolute", top: 300, left: 440, width: 1040, height: 420, border: `3px solid ${INK}`, borderRadius: 14, background: "#fff", overflow: "hidden"}}>
        <div style={{position: "absolute", top: 12, left: 24, fontFamily: HAND_FONT, fontSize: 34, color: "#6f6a5c"}}>堆（heap）</div>
        {Array.from({length: dropN}).map((_, i) => (
          <MemBlock key={i} x={28 + (i % 3) * 330} y={66 + Math.floor(i / 3) * 92} delay={i * 16} w={300} breath={i > 5} />
        ))}
        <Floater x={920} y={140} text="+1" period={40} offset={0} />
        <Floater x={960} y={220} text="+1" period={40} offset={20} />
        <Floater x={880} y={300} text="+1" period={40} offset={33} />
      </div>
    </AbsoluteFill>
  );
};

// S7 free 看总量 825-974（终端居中放大 + 数字对冲滚动）
const SceneFree: React.FC = () => {
  const frame = useCurrentFrame();
  const used = interpolate(frame, [0, 70], [6.2, 6.9], {extrapolateLeft: "clamp", extrapolateRight: "clamp"});
  const free = interpolate(frame, [0, 70], [1.8, 1.1], {extrapolateLeft: "clamp", extrapolateRight: "clamp"});
  return (
    <AbsoluteFill>
      <Hud pct={93} usedG={6.9} days={47} alarm />
      <div style={{position: "absolute", top: 210, left: 0, right: 0, display: "flex", justifyContent: "center", gap: 150}}>
        <div style={{textAlign: "center"}}>
          <div style={{fontSize: 42, fontFamily: TITLE_FONT, fontWeight: 700, color: INK}}>已用</div>
          <div style={{fontSize: 96, fontFamily: MONO, fontWeight: 900, color: RED, marginTop: 6}}>{used.toFixed(1)}G ↑</div>
        </div>
        <div style={{textAlign: "center"}}>
          <div style={{fontSize: 42, fontFamily: TITLE_FONT, fontWeight: 700, color: INK}}>可用</div>
          <div style={{fontSize: 96, fontFamily: MONO, fontWeight: 900, color: "#4a7fa5", marginTop: 6}}>{free.toFixed(1)}G ↓</div>
        </div>
      </div>
      <CodePanel
        lines={[
          {t: "$ free -h", kind: "cmd"},
          {t: "        total   used   free", kind: "out"},
          {t: "Mem:    8.0Gi   6.9Gi  1.1Gi", kind: "out", hl: true},
          {t: "Swap:   2.0Gi   512Mi  1.5Gi", kind: "out"},
        ]}
        top={470}
        height={380}
      />
    </AbsoluteFill>
  );
};

// S8 top 揪真凶 974-1115（放大镜下移 + 行高亮 + 印章）
const SceneTop: React.FC = () => {
  const frame = useCurrentFrame();
  const magY = interpolate(frame, [10, 60], [0, 120], {extrapolateLeft: "clamp", extrapolateRight: "clamp"});
  const reveal = frame > 78;
  return (
    <AbsoluteFill>
      <Hud pct={93} usedG={6.9} days={47} alarm />
      <Note x={0} y={222} size={42} style={{left: 0, right: 0, textAlign: "center"}}>按 M，以内存排序</Note>
      <div style={{position: "absolute", left: 200, top: 420 + magY}}>
        <svg width={120} height={120} viewBox="0 0 140 140">
          <circle cx={70} cy={70} r={56} fill="none" stroke={INK} strokeWidth={5} opacity={0.85} />
          <line x1={110} y1={110} x2={134} y2={134} stroke={INK} strokeWidth={7} />
        </svg>
      </div>
      {reveal && (
        <Pop delay={86}>
          <div style={{
            position: "absolute", left: 1010, top: 560, transform: "rotate(-4deg)",
            border: `5px solid ${RED}`, color: RED, borderRadius: 16, background: "#fff",
            padding: "14px 40px", fontSize: 78, fontWeight: 900, fontFamily: TITLE_FONT, whiteSpace: "nowrap",
          }}>
            真凶 2318
          </div>
        </Pop>
      )}
      <CodePanel
        lines={[
          {t: "$ top", kind: "cmd"},
          {t: "  PID  USER    %MEM  COMMAND", kind: "out"},
          {t: " 2318  worker  86.1  leak_job", kind: "out", hl: true},
          {t: " 1012  root     1.2  sshd", kind: "out"},
          {t: "  668  root     0.8  nginx", kind: "out"},
        ]}
        top={300}
        height={520}
      />
    </AbsoluteFill>
  );
};

// S9 处理决策 1115-1257（双卡对滑 + 仪表回落 + 内存块飞出）
const SceneDecision: React.FC = () => {
  const frame = useCurrentFrame();
  const fixed = frame > 63;
  const dropX = interpolate(frame, [64, 100], [0, 560], {extrapolateLeft: "clamp", extrapolateRight: "clamp"});
  const dropO = interpolate(frame, [80, 116], [1, 0], {extrapolateLeft: "clamp", extrapolateRight: "clamp"});
  return (
    <AbsoluteFill>
      <Hud pct={fixed ? interpolate(frame, [63, 100], [93, 52]) : 93}
        usedG={fixed ? interpolate(frame, [63, 100], [6.9, 4.1]) : 6.9} days={47} alarm={!fixed} />
      <Pop delay={14} style={{position: "absolute", left: 250, top: 300}}>
        <Outline style={{width: 500, height: 180, background: "#fff", transform: "rotate(-1.5deg)"}}>
          <div style={{padding: "28px 38px"}}>
            <div style={{fontSize: 46, fontWeight: 900, fontFamily: TITLE_FONT}}>方案一：杀掉它</div>
            <div style={{fontSize: 32, fontFamily: HAND_FONT, color: "#6f6a5c", marginTop: 12}}>立刻止血，但会再犯</div>
          </div>
        </Outline>
      </Pop>
      <Pop delay={42} style={{position: "absolute", left: 830, top: 300}}>
        <Outline style={{width: 500, height: 180, background: fixed ? PINK : "#fff", transform: "rotate(1.5deg)"}}>
          <div style={{padding: "28px 38px"}}>
            <div style={{fontSize: 46, fontWeight: 900, fontFamily: TITLE_FONT}}>方案二：修代码 {fixed ? "✓" : ""}</div>
            <div style={{fontSize: 32, fontFamily: HAND_FONT, color: "#6f6a5c", marginTop: 12}}>补上 free，除根</div>
          </div>
        </Outline>
      </Pop>
      {fixed && (
        <div style={{position: "absolute", left: 900, top: 160, transform: `translateY(${-dropX * 1.1}px)`, opacity: dropO}}>
          <MemBlock x={0} y={0} w={180} color="#c9e0ee" />
        </div>
      )}
      <Note x={0} y={228} size={40} style={{left: 0, right: 0, textAlign: "center"}}>先确认它该不该吃这么多</Note>
      <CodePanel
        lines={[
          {t: "$ kill 2318      # 先止血", kind: "cmd"},
          {t: "// 修代码：用完补上", kind: "cmt"},
          {t: "free(buf);", kind: "cmd", hl: true},
        ]}
        top={560}
        height={372}
      />
    </AbsoluteFill>
  );
};

// S10 金句口诀 1257-1414（大字弹入，接管字幕区，垂直居中防裁切）
const SceneMotto: React.FC = () => (
  <AbsoluteFill style={{display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center"}}>
    <div style={{fontSize: 50, fontFamily: HAND_FONT, color: "#6f6a5c", marginBottom: 36}}>一句口诀，带走它</div>
    <Pop delay={6}>
      <div style={{fontSize: 138, fontWeight: 900, fontFamily: TITLE_FONT, color: INK, letterSpacing: 12, whiteSpace: "nowrap", lineHeight: 1.2}}>
        内存只涨不降
      </div>
    </Pop>
    <div style={{marginTop: 52, fontSize: 72, fontWeight: 900, fontFamily: TITLE_FONT, color: INK, letterSpacing: 6, lineHeight: 1.2}}>
      先查<Pop delay={34}><span style={{background: PINK, padding: "2px 22px", borderRadius: 14, display: "inline-block"}}>进程</span></Pop>
      <span style={{display: "inline-block", width: 70}} />
      再查<Pop delay={50}><span style={{background: PINK, padding: "2px 22px", borderRadius: 14, display: "inline-block"}}>代码</span></Pop>
    </div>
  </AbsoluteFill>
);

// S11 结尾截图卡 1414-1696（白底黑字，配音结束后静止≥2.5s）
const SceneEndCard: React.FC = () => (
  <AbsoluteFill style={{background: "#FFFFFF"}}>
    <div style={{position: "absolute", top: 180, left: 0, right: 0, textAlign: "center"}}>
      <div style={{fontSize: 104, fontWeight: 900, fontFamily: TITLE_FONT, color: "#111", letterSpacing: 10}}>
        内存只涨不降
      </div>
      <div style={{fontSize: 66, fontWeight: 900, fontFamily: TITLE_FONT, color: "#111", marginTop: 30, letterSpacing: 4}}>
        先查进程，再查代码
      </div>
    </div>
    <div style={{position: "absolute", top: 560, left: 0, right: 0, display: "flex", justifyContent: "center", gap: 46}}>
      <div style={{border: "4px solid #111", borderRadius: 14, padding: "16px 34px", fontFamily: MONO, fontSize: 42, fontWeight: 700, color: "#111"}}>free -h 看总量</div>
      <div style={{border: "4px solid #111", borderRadius: 14, padding: "16px 34px", fontFamily: MONO, fontSize: 42, fontWeight: 700, color: "#111"}}>top 按 M 揪真凶</div>
    </div>
    <div style={{position: "absolute", bottom: 170, left: 0, right: 0, textAlign: "center", fontSize: 36, fontFamily: TITLE_FONT, color: "#888", letterSpacing: 4}}>
      小秋 · 0 基础也能学会
    </div>
  </AbsoluteFill>
);

// ---------- 组装 ----------
const scenes = [
  {start: 0, end: 135, C: SceneCover},
  {start: 135, end: 281, C: SceneCrash},
  {start: 281, end: 413, C: SceneRestart},
  {start: 413, end: 510, C: SceneName},
  {start: 510, end: 616, C: ScenePrinciple},
  {start: 616, end: 766, C: SceneAccumulate},
  {start: 766, end: 905, C: SceneFree},
  {start: 905, end: 1035, C: SceneTop},
  {start: 1035, end: 1167, C: SceneDecision},
  {start: 1167, end: 1314, C: SceneMotto},
  {start: 1314, end: memLeakDurationInFrames, C: SceneEndCard},
];

export const MemLeakStory: React.FC = () => {
  const frame = useCurrentFrame();
  const bedVolume = interpolate(frame, [0, 20, memLeakDurationInFrames - 40, memLeakDurationInFrames - 6],
    [0, 0.10, 0.10, 0], {extrapolateLeft: "clamp", extrapolateRight: "clamp"});
  return (
    <AbsoluteFill style={{backgroundColor: PAPER, fontFamily: TITLE_FONT, overflow: "hidden"}}>
      {scenes.map(({start, end, C}, i) => (
        <Sequence key={i} from={start} durationInFrames={end - start}>
          <C />
        </Sequence>
      ))}
      {frame < 1314 && <Brand />}
      {voiceLines.map((s) => (
        <Sequence key={`vo-${s.index}`} from={s.start} durationInFrames={s.end - s.start + 30}>
          <Audio src={staticFile(`audio/memleak-tts-m2/${s.audio}`)} volume={1} />
        </Sequence>
      ))}
      {/* 音效层 */}
      <Sequence from={231} durationInFrames={30}><Audio src={staticFile("audio/sfx/alert.wav")} volume={0.5} /></Sequence>
      <Sequence from={983} durationInFrames={30}><Audio src={staticFile("audio/sfx/ding.wav")} volume={0.45} /></Sequence>
      <Sequence from={1212} durationInFrames={30}><Audio src={staticFile("audio/sfx/pop.wav")} volume={0.4} /></Sequence>
      <Sequence from={413} durationInFrames={30}><Audio src={staticFile("audio/sfx/whoosh.wav")} volume={0.5} /></Sequence>
      <Sequence from={766} durationInFrames={30}><Audio src={staticFile("audio/sfx/whoosh.wav")} volume={0.5} /></Sequence>
      <Sequence from={905} durationInFrames={30}><Audio src={staticFile("audio/sfx/whoosh.wav")} volume={0.4} /></Sequence>
      <Sequence from={1314} durationInFrames={30}><Audio src={staticFile("audio/sfx/whoosh.wav")} volume={0.4} /></Sequence>
      <Audio src={staticFile("audio/bed.wav")} loop volume={() => bedVolume} />
      <Subtitle />
    </AbsoluteFill>
  );
};
