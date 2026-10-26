import React from "react";
import {Audio} from "@remotion/media";
import {AbsoluteFill, interpolate, Sequence, staticFile, useCurrentFrame} from "remotion";

// ============ 扁平可爱插画科普风 · Wi-Fi 满格为什么打不开网页（全栈小秋 IP） ============
// 结构：封面钩子 → 结论 → 三道关卡路线图 → 路由器 → 运营商 → DNS → 通行证 → 排查口诀 → 结尾截图卡
// 语义色：蓝=请求/正常 绿=响应/OK 红=只给断线/故障 黄=强调

export const DUR = 1922;

// ---------- 调色与工具（本地 primitives，与 TcpVsUdpFlat 同源） ----------

const INK = "#2f3a45";
const SUBC = "#7a8694";
const BLUE = "#4a86d8";
const BLUE_BG = "#eaf2fc";
const GREEN = "#45a56a";
const GREEN_BG = "#e9f6ee";
const RED = "#e05656";
const RED_BG = "#fdecec";
const YEL = "#f7c948";
const BORDER = "#e0e6ec";
const F = "'Microsoft YaHei', sans-serif";
const W = 1920;
const H = 1080;

const clamp = {extrapolateLeft: "clamp", extrapolateRight: "clamp"} as const;
const ease = (p: number) => 1 - Math.pow(1 - p, 3);
const prog = (f: number, delay: number, dur = 12) =>
  interpolate(f, [delay, delay + dur], [0, 1], clamp);

const BgDots: React.FC = () => (
  <svg width={W} height={H} style={{position: "absolute", left: 0, top: 0, pointerEvents: "none"}}>
    <defs>
      <pattern id="wifi-dots" width="46" height="46" patternUnits="userSpaceOnUse">
        <circle cx="23" cy="23" r="2.6" fill="#dbe4ee" />
      </pattern>
    </defs>
    <rect width={W} height={H} fill="url(#wifi-dots)" opacity={0.5} />
    <circle cx={150} cy={120} r={190} fill={BLUE_BG} opacity={0.5} />
    <circle cx={W - 140} cy={H - 90} r={220} fill={GREEN_BG} opacity={0.45} />
  </svg>
);

const BigTitle: React.FC<{
  f: number; parts: {t: string; c: string}[]; y?: number; size?: number; delay?: number;
}> = ({f, parts, y = 58, size = 88, delay = 0}) => {
  const p = prog(f, delay);
  if (p <= 0) return null;
  const total = parts.reduce((a, x) => a + x.t.length, 0);
  const tw = total * size;
  return (
    <div style={{position: "absolute", top: y, left: 0, right: 0, textAlign: "center", opacity: p}}>
      <div style={{position: "relative", display: "inline-block"}}>
        <div style={{fontSize: size, fontWeight: 900, fontFamily: F, letterSpacing: 5, whiteSpace: "nowrap"}}>
          {parts.map((x, i) => <span key={i} style={{color: x.c}}>{x.t}</span>)}
        </div>
        <svg width={tw * 0.6} height={18} style={{position: "absolute", left: "50%", transform: "translateX(-50%)", bottom: -14, overflow: "visible"}}>
          <path d={`M 4 9 ${Array.from({length: Math.round((tw * 0.6) / 36)}).map(() => `q 9 -10 18 0 q 9 10 18 0`).join(" ")}`}
            fill="none" stroke={YEL} strokeWidth={7} strokeLinecap="round" />
        </svg>
      </div>
    </div>
  );
};

const Sparkle: React.FC<{x: number; y: number; s?: number; color?: string}> = ({x, y, s = 1, color = YEL}) => (
  <svg width={54 * s} height={54 * s} style={{position: "absolute", left: x, top: y, overflow: "visible"}}>
    <path d="M 27 2 L 32 22 L 52 27 L 32 32 L 27 52 L 22 32 L 2 27 L 22 22 Z" fill={color} />
  </svg>
);

const FlashRing: React.FC<{f: number; at: number; x: number; y: number; color?: string}> = ({f, at, x, y, color = RED}) => {
  const p = prog(f, at, 12);
  if (p <= 0 || p >= 1) return null;
  return (
    <svg width={W} height={H} style={{position: "absolute", left: 0, top: 0, overflow: "visible", pointerEvents: "none"}}>
      <circle cx={x} cy={y} r={22 + 46 * ease(p)} fill="none" stroke={color} strokeWidth={7 * (1 - p)} opacity={1 - p} />
    </svg>
  );
};

const LoopPacket: React.FC<{
  f: number; x1: number; y1: number; x2: number; y2: number;
  color?: string; start: number; period?: number; dur?: number; lift?: number; size?: number;
}> = ({f, x1, y1, x2, y2, color = BLUE, start, period = 56, dur = 26, lift = 0, size = 34}) => {
  if (f < start) return null;
  const raw = (f - start) % period;
  const t = raw / dur;
  if (t <= 0 || t >= 1) return null;
  const px = x1 + (x2 - x1) * t;
  const py = y1 + (y2 - y1) * t - Math.sin(Math.PI * t) * lift;
  return (
    <svg width={W} height={H} style={{position: "absolute", left: 0, top: 0, overflow: "visible", pointerEvents: "none"}}>
      <g transform={`translate(${px},${py})`}>
        <rect x={-size / 2} y={-size * 0.4} width={size} height={size * 0.8} rx={8} fill={color} stroke="#fff" strokeWidth={3.5} />
        <circle cx={-size * 0.18} cy={0} r={3.5} fill="#fff" opacity={0.9} />
        <circle cx={size * 0.18} cy={0} r={3.5} fill="#fff" opacity={0.9} />
      </g>
    </svg>
  );
};

const BulbFlat: React.FC<{x: number; y: number; s?: number}> = ({x, y, s = 1}) => (
  <svg width={80 * s} height={110 * s} style={{position: "absolute", left: x - 40 * s, top: y - 55 * s, overflow: "visible"}}>
    <circle cx={40} cy={44} r={30} fill={YEL} stroke={INK} strokeWidth={5} />
    <rect x={30} y={72} width={20} height={14} rx={5} fill="#d9a12c" />
    <path d="M 40 4 L 40 -6 M 76 22 L 86 14 M 4 22 L -6 14" stroke="#d9a12c" strokeWidth={5} strokeLinecap="round" />
  </svg>
);

const Cloud: React.FC<{x: number; y: number; s?: number; c?: string}> = ({x, y, s = 1, c = "#cddcee"}) => (
  <svg width={160 * s} height={95 * s} style={{position: "absolute", left: x - 80 * s, top: y - 47 * s, overflow: "visible"}}>
    <g transform={`scale(${s})`}>
      <ellipse cx={52} cy={62} rx={46} ry={24} fill={c} />
      <ellipse cx={92} cy={46} rx={36} ry={30} fill={c} />
      <ellipse cx={124} cy={64} rx={30} ry={19} fill={c} />
    </g>
  </svg>
);

const Float: React.FC<{f: number; x: number; y: number; w: number; h: number; amp?: number; children: React.ReactNode}> = ({f, x, y, w, h, amp = 6, children}) => (
  <div style={{position: "absolute", left: x, top: y, width: w, height: h}}>
    <div style={{transform: `translateY(${Math.sin(f / 13) * amp}px)`}}>{children}</div>
  </div>
);

const MarkOk: React.FC<{x: number; y: number; s?: number}> = ({x, y, s = 1}) => (
  <svg width={60 * s} height={60 * s} style={{position: "absolute", left: x - 30 * s, top: y - 30 * s, overflow: "visible"}}>
    <g transform={`scale(${s})`}>
      <circle cx={30} cy={30} r={26} fill={GREEN_BG} />
      <path d="M17 31 L27 41 L44 21" fill="none" stroke={GREEN} strokeWidth={6} strokeLinecap="round" strokeLinejoin="round" />
    </g>
  </svg>
);
const MarkBad: React.FC<{x: number; y: number; s?: number}> = ({x, y, s = 1}) => (
  <svg width={60 * s} height={60 * s} style={{position: "absolute", left: x - 30 * s, top: y - 30 * s, overflow: "visible"}}>
    <g transform={`scale(${s})`}>
      <circle cx={30} cy={30} r={26} fill={RED_BG} />
      <path d="M19 19 L41 41 M41 19 L19 41" fill="none" stroke={RED} strokeWidth={6} strokeLinecap="round" strokeLinejoin="round" />
    </g>
  </svg>
);

const Globe: React.FC<{x: number; y: number; s?: number; c?: string}> = ({x, y, s = 1, c = BLUE}) => (
  <svg width={120 * s} height={120 * s} style={{position: "absolute", left: x - 60 * s, top: y - 60 * s, overflow: "visible"}}>
    <g transform={`scale(${s})`}>
      <circle cx={60} cy={60} r={46} fill="#dbe9fa" stroke={c} strokeWidth={5} />
      <ellipse cx={60} cy={60} rx={20} ry={46} fill="none" stroke={c} strokeWidth={3.5} />
      <line x1={14} y1={60} x2={106} y2={60} stroke={c} strokeWidth={3.5} />
      <path d="M 20 36 Q 60 52 100 36 M 20 84 Q 60 68 100 84" fill="none" stroke={c} strokeWidth={3.5} />
    </g>
  </svg>
);

const ServerIcon: React.FC<{x: number; y: number; s?: number; c?: string}> = ({x, y, s = 1, c = "#55677c"}) => (
  <svg width={110 * s} height={140 * s} style={{position: "absolute", left: x - 55 * s, top: y - 70 * s, overflow: "visible"}}>
    <g transform={`scale(${s})`}>
      <rect x={22} y={8} width={66} height={124} rx={12} fill={c} />
      <rect x={32} y={24} width={46} height={9} rx={4.5} fill="#aebdd0" />
      <rect x={32} y={44} width={46} height={9} rx={4.5} fill="#aebdd0" />
      <rect x={32} y={64} width={46} height={9} rx={4.5} fill="#aebdd0" />
      <circle cx={55} cy={102} r={8} fill="#7ee0a3" />
    </g>
  </svg>
);

const SpinnerFlat: React.FC<{f: number; x: number; y: number; d: number; color?: string; s?: number}> = ({f, x, y, d, color = BLUE, s = 1}) => {
  if (f < d) return null;
  const a = ((f - d) * 12) % 360;
  return (
    <svg width={80 * s} height={80 * s} style={{position: "absolute", left: x - 40 * s, top: y - 40 * s, overflow: "visible"}}>
      <g transform={`scale(${s})`}>
        <circle cx={40} cy={40} r={34} fill="#fff" stroke={BORDER} strokeWidth={3} />
        <g transform={`translate(40,40) rotate(${a})`}>
          <path d="M0 -22 A22 22 0 1 1 -16 -16" fill="none" stroke={color} strokeWidth={7} strokeLinecap="round" />
        </g>
      </g>
    </svg>
  );
};

// ---------- PopAt / FlatCard / Pill / FlatArrow / Label / FlyPacket（本地版） ----------

const PopAt: React.FC<{
  f: number; delay: number; x: number; y: number; w: number; h: number;
  children: React.ReactNode; rot?: number;
}> = ({f, delay, x, y, w, h, children, rot = 0}) => {
  const p = prog(f, delay);
  if (p <= 0) return null;
  return (
    <div style={{
      position: "absolute", left: x, top: y, width: w, height: h,
      opacity: p,
      transform: `scale(${0.82 + 0.18 * ease(p)}) rotate(${rot * (1 - ease(p))}deg)`,
      transformOrigin: "center center",
    }}>{children}</div>
  );
};

const FlatCard: React.FC<{
  f: number; delay: number; x: number; y: number; w: number; h: number;
  chip?: string; chipColor?: string; fill?: string; children?: React.ReactNode;
}> = ({f, delay, x, y, w, h, chip, chipColor = BLUE, fill = "#ffffff", children}) => {
  const p = prog(f, delay);
  if (p <= 0) return null;
  return (
    <>
      <div style={{
        position: "absolute", left: x, top: y, width: w, height: h,
        backgroundColor: fill, border: `3px solid ${BORDER}`, borderRadius: 26,
        boxShadow: "0 10px 26px rgba(47,58,69,0.07)",
        opacity: p, transform: `scale(${0.92 + 0.08 * ease(p)})`,
      }}>{children}</div>
      {chip ? (
        <div style={{
          position: "absolute", left: x + w / 2 - chip.length * 22 - 26, top: y - 28,
          width: chip.length * 44 + 52, height: 58, borderRadius: 999,
          backgroundColor: chipColor, color: "#fff", display: "flex",
          alignItems: "center", justifyContent: "center",
          fontSize: 34, fontWeight: 900, letterSpacing: 4,
          opacity: p, transform: `scale(${0.9 + 0.1 * ease(p)})`,
          boxShadow: `0 8px 18px ${chipColor}44`,
        }}>{chip}</div>
      ) : null}
    </>
  );
};

const Pill: React.FC<{
  f: number; delay: number; x: number; y: number; w: number; h: number;
  bg?: string; border?: string; text: string; color?: string; ts?: number;
}> = ({f, delay, x, y, w, h, bg = "#f6f8fa", border = "none", text, color = INK, ts = 30}) => {
  const p = prog(f, delay);
  if (p <= 0) return null;
  return (
    <div style={{
      position: "absolute", left: x, top: y, width: w, height: h,
      backgroundColor: bg, border, borderRadius: h / 2,
      display: "flex", alignItems: "center", justifyContent: "center",
      opacity: p, transform: `scale(${0.9 + 0.1 * ease(p)})`,
    }}>
      <div style={{fontFamily: F, fontWeight: 700, fontSize: ts, color, whiteSpace: "nowrap"}}>{text}</div>
    </div>
  );
};

const FlatArrow: React.FC<{
  f: number; x1: number; y1: number; x2: number; y2: number; color?: string;
  dashed?: boolean; sw?: number; delay?: number;
}> = ({f, x1, y1, x2, y2, color = INK, dashed, sw = 7, delay = 0}) => {
  const p = prog(f, delay, 16);
  if (p <= 0) return null;
  const dx = x2 - x1, dy = y2 - y1;
  const len = Math.hypot(dx, dy);
  const ux = dx / len, uy = dy / len;
  const px = -uy, py = ux;
  const endX = x1 + dx * p, endY = y1 + dy * p;
  const head = 22;
  return (
    <svg width={W} height={H} style={{position: "absolute", left: 0, top: 0, overflow: "visible", pointerEvents: "none"}}>
      <line x1={x1} y1={y1} x2={endX} y2={endY} stroke={color}
        strokeWidth={sw} strokeLinecap="round" strokeDasharray={dashed ? "14 12" : undefined} />
      {p > 0.9 ? (
        <path d={`M ${x2 - ux * head + px * head * 0.55} ${y2 - uy * head + py * head * 0.55} L ${x2} ${y2} L ${x2 - ux * head - px * head * 0.55} ${y2 - uy * head - py * head * 0.55}`}
          fill="none" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" />
      ) : null}
    </svg>
  );
};

const Label: React.FC<{f: number; d: number; x: number; y: number; w: number; text: string; color?: string; size?: number; weight?: number}> = ({
  f, d, x, y, w, text, color = INK, size = 30, weight = 700,
}) => {
  const p = prog(f, d, 10);
  if (p <= 0) return null;
  return (
    <div style={{
      position: "absolute", left: x, top: y, width: w, textAlign: "center",
      fontFamily: F, fontSize: size, color, fontWeight: weight, opacity: p, whiteSpace: "nowrap",
    }}>{text}</div>
  );
};

// 带编号的飞行数据包（一次性飞行，可半路坠落）
const FlyPacket: React.FC<{
  f: number; n: string; x1: number; y1: number; x2: number; y2: number;
  t0: number; dur?: number; color?: string; fall?: number;
}> = ({f, n, x1, y1, x2, y2, t0, dur = 32, color = GREEN, fall}) => {
  const t = (f - t0) / dur;
  if (t <= 0 || t >= 1) return null;
  let x = x1 + (x2 - x1) * t;
  let y = y1 + (y2 - y1) * t - Math.sin(Math.PI * t) * 16;
  let rot = 0, op = 1;
  if (fall !== undefined && t >= fall) {
    const ft = (t - fall) / (1 - fall);
    y += ease(ft) * 190;
    rot = ease(ft) * 150;
    op = 1 - ft * 0.45;
  }
  return (
    <div style={{
      position: "absolute", left: x, top: y, opacity: op,
      transform: `translate(-50%,-50%) rotate(${rot}deg)`,
    }}>
      <div style={{
        width: 64, height: 48, borderRadius: 12, backgroundColor: color,
        border: "4px solid #fff", boxShadow: "0 8px 18px rgba(47,58,69,0.18)",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontFamily: F, fontWeight: 900, fontSize: 30, color: "#fff",
      }}>{n}</div>
    </div>
  );
};

// ---------- 主题图标 ----------

// 手机（状态栏 4 格信号全满）
const PhoneFlat: React.FC<{x: number; y: number; s?: number; children?: React.ReactNode}> = ({x, y, s = 1, children}) => (
  <svg width={300 * s} height={560 * s} style={{position: "absolute", left: x, top: y, overflow: "visible"}}>
    <g transform={`scale(${s})`}>
      <rect x={0} y={0} width={300} height={560} rx={44} fill="#3f4d5e" />
      <rect x={12} y={14} width={276} height={532} rx={34} fill="#ffffff" />
      <text x={36} y={56} fontSize={24} fontWeight={700} fill={INK} fontFamily={F}>12:30</text>
      {[0, 1, 2, 3].map((i) => (
        <rect key={i} x={186 + i * 14} y={44 - i * 7} width={9} height={12 + i * 7} rx={2.5} fill={GREEN} />
      ))}
      <rect x={246} y={30} width={30} height={17} rx={4} fill="none" stroke={INK} strokeWidth={3} />
      <rect x={249} y={33} width={21} height={11} rx={2} fill={GREEN} />
      <circle cx={150} cy={32} r={8} fill="#2f3a45" />
      {/* 屏内底部骨架行（占位内容，避免大白屏） */}
      <rect x={36} y={430} width={150} height={16} rx={8} fill="#e8edf3" />
      <rect x={36} y={470} width={228} height={16} rx={8} fill="#e8edf3" />
      <rect x={36} y={510} width={190} height={16} rx={8} fill="#e8edf3" />
      {children}
    </g>
  </svg>
);

// Wi-Fi 满格弧线（两道弧 + 圆点，全亮）
const WifiArcs: React.FC<{x: number; y: number; s?: number; c?: string}> = ({x, y, s = 1, c = GREEN}) => (
  <svg width={140 * s} height={110 * s} style={{position: "absolute", left: x - 70 * s, top: y - 55 * s, overflow: "visible"}}>
    <g transform={`scale(${s})`} fill="none" stroke={c} strokeLinecap="round">
      <path d="M 22 58 A 60 60 0 0 1 118 58" strokeWidth={11} />
      <path d="M 42 76 A 36 36 0 0 1 98 76" strokeWidth={11} />
      <circle cx={70} cy={95} r={9} fill={c} stroke="none" />
    </g>
  </svg>
);

// 路由器
const RouterFlat: React.FC<{x: number; y: number; s?: number; c?: string}> = ({x, y, s = 1, c = "#55677c"}) => (
  <svg width={150 * s} height={120 * s} style={{position: "absolute", left: x - 75 * s, top: y - 60 * s, overflow: "visible"}}>
    <g transform={`scale(${s})`}>
      <line x1={45} y1={50} x2={30} y2={12} stroke={INK} strokeWidth={7} strokeLinecap="round" />
      <line x1={105} y1={50} x2={120} y2={12} stroke={INK} strokeWidth={7} strokeLinecap="round" />
      <circle cx={30} cy={12} r={6} fill={c} />
      <circle cx={120} cy={12} r={6} fill={c} />
      <rect x={5} y={48} width={140} height={56} rx={14} fill={c} />
      <circle cx={30} cy={76} r={7} fill="#7ee0a3" />
      <circle cx={54} cy={76} r={7} fill="#ffd76e" />
      <rect x={78} y={70} width={54} height={12} rx={6} fill="#aebdd0" />
    </g>
  </svg>
);

// 光猫
const ModemFlat: React.FC<{x: number; y: number; s?: number; c?: string}> = ({x, y, s = 1, c = "#55677c"}) => (
  <svg width={110 * s} height={150 * s} style={{position: "absolute", left: x - 55 * s, top: y - 75 * s, overflow: "visible"}}>
    <g transform={`scale(${s})`}>
      <rect x={10} y={10} width={90} height={124} rx={14} fill={c} />
      <rect x={24} y={30} width={62} height={10} rx={5} fill="#ffffff" opacity={0.85} />
      <circle cx={36} cy={68} r={7} fill="#7ee0a3" />
      <circle cx={58} cy={68} r={7} fill="#ffd76e" />
      <circle cx={80} cy={68} r={7} fill="#f3a5a5" />
      <rect x={42} y={96} width={26} height={14} rx={5} fill="#ffffff" opacity={0.8} />
    </g>
  </svg>
);

// 运营商信号塔
const TowerFlat: React.FC<{x: number; y: number; s?: number; c?: string}> = ({x, y, s = 1, c = BLUE}) => (
  <svg width={130 * s} height={150 * s} style={{position: "absolute", left: x - 65 * s, top: y - 75 * s, overflow: "visible"}}>
    <g transform={`scale(${s})`}>
      <path d="M65 46 L38 138 M65 46 L92 138 M50 96 L80 96 M44 116 L86 116" stroke={INK} strokeWidth={7} strokeLinecap="round" fill="none" />
      <circle cx={65} cy={36} r={12} fill={c} />
      <path d="M 38 26 A 38 38 0 0 1 92 26" fill="none" stroke={c} strokeWidth={7} strokeLinecap="round" />
      <path d="M 24 10 A 55 55 0 0 1 106 10" fill="none" stroke={c} strokeWidth={7} strokeLinecap="round" opacity={0.55} />
    </g>
  </svg>
);

// 小电话本图标（DNS）
const BookIco: React.FC<{x: number; y: number; s?: number; c?: string}> = ({x, y, s = 1, c = BLUE}) => (
  <svg width={110 * s} height={110 * s} style={{position: "absolute", left: x - 55 * s, top: y - 55 * s, overflow: "visible"}}>
    <g transform={`scale(${s})`}>
      <rect x={12} y={8} width={86} height={94} rx={12} fill="#fff" stroke={c} strokeWidth={6} />
      <rect x={12} y={8} width={18} height={94} rx={9} fill={c} />
      <line x1={44} y1={34} x2={86} y2={34} stroke={c} strokeWidth={5} strokeLinecap="round" />
      <line x1={44} y1={56} x2={86} y2={56} stroke={c} strokeWidth={5} strokeLinecap="round" />
      <line x1={44} y1={78} x2={72} y2={78} stroke={c} strokeWidth={5} strokeLinecap="round" />
    </g>
  </svg>
);

// 红色「坏」章
const StampBad: React.FC<{x: number; y: number; s?: number}> = ({x, y, s = 1}) => (
  <svg width={180 * s} height={180 * s} style={{position: "absolute", left: x - 90 * s, top: y - 90 * s, overflow: "visible", opacity: 0.94}}>
    <g transform={`scale(${s}) rotate(-14 90 90)`}>
      <circle cx={90} cy={90} r={76} fill="none" stroke={RED} strokeWidth={10} />
      <circle cx={90} cy={90} r={60} fill="none" stroke={RED} strokeWidth={4} />
      <text x={90} y={116} textAnchor="middle" fontSize={74} fontWeight={900} fill={RED} fontFamily={F}>坏</text>
    </g>
  </svg>
);

// material 图标
const Ico: React.FC<{d: string; x: number; y: number; s?: number; c?: string}> = ({d, x, y, s = 1, c = INK}) => (
  <svg width={24 * s} height={24 * s} viewBox="0 0 24 24"
    style={{position: "absolute", left: x - 12 * s, top: y - 12 * s, overflow: "visible"}}>
    <path d={d} fill={c} />
  </svg>
);
const D_REFRESH = "M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-8 8s3.57 8 8 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z";
const D_HEADSET = "M12 1c-4.97 0-9 4.03-9 9v7c0 1.66 1.34 3 3 3h3v-8H5v-2c0-3.87 3.13-7 7-7s7 3.13 7 7v2h-4v8h3c1.66 0 3-1.34 3-3v-7c0-4.97-4.03-9-9-9z";
const D_WIFI = "M12 21l3.5-4.5c-1-.76-2.2-1.2-3.5-1.2s-2.5.44-3.5 1.2L12 21zm0-18C7.31 3 3.07 4.9 0 7.98l2.26 2.9C4.76 8.45 8.2 7 12 7s7.24 1.45 9.74 3.88L24 7.98A16.88 16.88 0 0 0 12 3zm0 6c-3.35 0-6.42 1.22-8.78 3.24l2.26 2.9C7.3 13.6 9.55 12.7 12 12s4.7.6 6.52 2.14l2.26-2.9C18.42 9.22 15.35 8 12 8z";

// ---------- 翻页与字幕 ----------

const PageTurn: React.FC<{children: React.ReactNode; off: number; len: number; first: boolean; last: boolean}> = ({children, off, len, first, last}) => {
  const frame = useCurrentFrame();
  const oIn = first ? 1 : interpolate(frame, [0, 10], [0, 1], clamp);
  const lf = frame - off;
  // 不变量：页边界帧上旧页必须仍完整可见（淡出窗口放在边界之后）
  const oOut = last ? 1 : interpolate(lf, [len, len + 10], [1, 0], clamp);
  return <AbsoluteFill style={{opacity: Math.min(oIn, oOut)}}>{children}</AbsoluteFill>;
};

type Sub = {s: number; e: number; t: string};
const subs: Sub[] = [
  {s: 0, e: 57, t: "Wi-Fi信号满格"},
  {s: 57, e: 101, t: "网页却一直转圈"},
  {s: 101, e: 145, t: "问题到底出在哪"},
  {s: 150, e: 176, t: "先说结论"},
  {s: 176, e: 202, t: "信号满格"},
  {s: 202, e: 268, t: "只说明你连上了路由器"},
  {s: 268, e: 334, t: "不代表外面的路是通的"},
  {s: 341, e: 395, t: "从你的手机到网页"},
  {s: 395, e: 449, t: "中间隔着三道关卡"},
  {s: 449, e: 509, t: "路由器 运营商 DNS"},
  {s: 514, e: 554, t: "第一关 路由器"},
  {s: 554, e: 620, t: "它只管你家内部这一段"},
  {s: 620, e: 693, t: "光猫断了线 信号照样满格"},
  {s: 693, e: 746, t: "但你哪儿也去不了"},
  {s: 751, e: 791, t: "第二关 运营商"},
  {s: 791, e: 831, t: "数据出了小区"},
  {s: 831, e: 939, t: "要靠运营商的路由器一跳一跳往外送"},
  {s: 939, e: 993, t: "中间任何一跳断了"},
  {s: 993, e: 1027, t: "网页就卡住"},
  {s: 1032, e: 1070, t: "第三关 DNS"},
  {s: 1070, e: 1147, t: "浏览器不认识网址这种名字"},
  {s: 1147, e: 1217, t: "要先查DNS这本电话本"},
  {s: 1217, e: 1268, t: "问出IP才能出发"},
  {s: 1268, e: 1332, t: "电话本坏了 一样打不开"},
  {s: 1337, e: 1419, t: "所以满格只是第一跳的通行证"},
  {s: 1419, e: 1470, t: "后面任何一环断了"},
  {s: 1470, e: 1508, t: "页面都打不开"},
  {s: 1514, e: 1586, t: "排查口诀 先重启路由器"},
  {s: 1586, e: 1643, t: "再换个DNS试试"},
  {s: 1643, e: 1700, t: "还不行 就找运营商"},
  {s: 1705, e: 1740, t: "记住这张卡"},
  {s: 1740, e: 1788, t: "满格不等于有网"},
  {s: 1788, e: 1850, t: "路由器 运营商 DNS"},
  {s: 1850, e: 1898, t: "一环一环查过去"},
];

const Subtitle: React.FC = () => {
  const f = useCurrentFrame();
  const cur = subs.find((s) => f >= s.s && f < s.e);
  if (!cur) return null;
  return (
    <div style={{position: "absolute", bottom: 30, left: 0, right: 0, zIndex: 50, display: "flex", justifyContent: "center"}}>
      <div style={{
        background: "rgba(12,14,18,.82)", borderRadius: 15, padding: "11px 32px",
        fontFamily: F, fontWeight: 700, fontSize: 46, color: "#fff", letterSpacing: 2, whiteSpace: "nowrap",
      }}>{cur.t}</div>
    </div>
  );
};

// ============ 页面 ============

// P1 封面钩子（第 0 帧完整，全部 delay=-99）
const PageHook: React.FC<{off: number}> = ({off}) => {
  const f = useCurrentFrame() - off;
  return (
    <AbsoluteFill>
      <BigTitle f={f} delay={-99} y={78} size={82} parts={[
        {t: "Wi-Fi 满格 ", c: BLUE}, {t: "网页为什么打不开？", c: INK},
      ]} />
      <Sparkle x={400} y={110} s={0.8} />
      <Sparkle x={1560} y={92} s={0.65} color="#b8d4f2" />

      {/* 左：满格手机 */}
      <Float f={f} x={250} y={300} w={300} h={560} amp={6}>
        <PhoneFlat x={0} y={0} s={1}>
          {/* 屏内：具体网页 + 转圈打不开（TCP 手机同款具象画面） */}
          <clipPath id="wifiBannerClip"><rect x="30" y="138" width="240" height="120" rx="14" /></clipPath>
          <rect x={12} y={64} width={276} height={482} fill="#ffffff" />
          {/* 浏览器地址栏：绿锁 + 网址条 */}
          <rect x={30} y={78} width={240} height={42} rx={21} fill={BLUE_BG} />
          <circle cx={54} cy={99} r={9} fill={GREEN} />
          <rect x={50} y={96} width={8} height={7} rx={1.5} fill="#fff" />
          <rect x={71} y={93} width={132} height={13} rx={6.5} fill={BLUE} opacity={0.45} />
          {/* 网页头图：蓝天白云青山（具体内容） */}
          <g clipPath="url(#wifiBannerClip)">
            <rect x="30" y="138" width="240" height="120" fill={BLUE} />
            <circle cx="232" cy="168" r="15" fill="#ffd66e" />
            <path d="M30 258 L100 192 L148 240 L190 204 L270 258 Z" fill="#ffffff" opacity={0.88} />
            <path d="M30 258 L82 214 L134 258 Z" fill="#a8cde0" />
          </g>
          {/* 网页正文行 */}
          <rect x={30} y={276} width={200} height={14} rx={7} fill="#c9d6e4" />
          <rect x={30} y={302} width={240} height={14} rx={7} fill="#e2e9f1" />
          <rect x={30} y={328} width={168} height={14} rx={7} fill="#e2e9f1" />
          {/* 转圈：一直在等 */}
          <circle cx={150} cy={420} r={30} fill="none" stroke="#e6ecf3" strokeWidth={9} />
          <g transform={`rotate(${f * 5} 150 420)`}>
            <path d="M150 390 A30 30 0 0 1 180 420" fill="none" stroke={BLUE} strokeWidth={9} strokeLinecap="round" />
          </g>
          <text x={150} y={486} textAnchor="middle" fontSize={22} fontWeight={700} fill={INK} fontFamily={F}>打不开…</text>
          {/* 缓冲马赛克 */}
          {[0, 1, 2, 3].map((k) => (
            <rect key={k} x={112 + k * 22} y={502} width={15} height={15} rx={3} fill="#c9d6e4" opacity={0.9 - k * 0.22} />
          ))}
        </PhoneFlat>
      </Float>
      {/* 手机上方满格弧线 */}
      <WifiArcs x={400} y={262} s={1.15} c={GREEN} />
      <Label f={f} d={-99} x={250} y={168} w={300} text="一格不少" size={32} weight={900} color={GREEN} />
      <Label f={f} d={-99} x={230} y={892} w={340} text="你" size={30} color={SUBC} />

      {/* 中：虚线路 + 请求/响应循环包 */}
      <FlatArrow f={f} x1={600} y1={540} x2={1290} y2={540} delay={-99} color="#9fb4c8" dashed sw={6} />
      <LoopPacket f={f} x1={620} y1={540} x2={1270} y2={540} color={BLUE} start={0} period={64} dur={40} lift={22} size={40} />
      <LoopPacket f={f} x1={1270} y1={540} x2={620} y2={540} color={GREEN} start={24} period={64} dur={40} lift={22} size={40} />

      {/* 右：浏览器窗口 一直转圈 */}
      <Float f={f} x={1320} y={330} w={460} h={360} amp={5}>
        <div style={{position: "absolute", inset: 0, backgroundColor: "#fff", border: `3px solid #d5dde9`, borderRadius: 22, boxShadow: "0 14px 32px rgba(47,58,69,0.16)"}}>
          <div style={{position: "absolute", left: 0, right: 0, top: 0, height: 56, backgroundColor: "#eef2f7", borderRadius: "22px 22px 0 0"}} />
          <div style={{position: "absolute", left: 22, top: 20, width: 14, height: 14, borderRadius: 999, backgroundColor: RED}} />
          <div style={{position: "absolute", left: 46, top: 20, width: 14, height: 14, borderRadius: 999, backgroundColor: YEL}} />
          <div style={{position: "absolute", left: 70, top: 20, width: 14, height: 14, borderRadius: 999, backgroundColor: GREEN}} />
          <div style={{position: "absolute", left: 100, top: 14, width: 330, height: 30, borderRadius: 999, backgroundColor: "#fff", border: `2px solid ${BORDER}`, fontFamily: F, fontSize: 18, color: SUBC, display: "flex", alignItems: "center", paddingLeft: 16}}>www.example.com</div>
          <SpinnerFlat f={f} x={230} y={200} d={0} s={1.05} color={BLUE} />
          <div style={{position: "absolute", left: 0, top: 268, width: 460, textAlign: "center", fontFamily: F, fontWeight: 900, fontSize: 34, color: INK}}>打不开…</div>
          <div style={{position: "absolute", left: 90, top: 316, width: 280, height: 10, borderRadius: 5, backgroundColor: "#eef2f7"}}>
            <div style={{width: "38%", height: "100%", borderRadius: 5, backgroundColor: BLUE, opacity: 0.6}} />
          </div>
        </div>
      </Float>
      <Label f={f} d={-99} x={1330} y={712} w={440} text="浏览器" size={32} color={SUBC} />

      {/* 底部疑问胶囊 */}
      <Pill f={f} delay={-99} x={730} y={760} w={460} h={80} bg={"#fdf7e2"} border={`4px dashed ${YEL}`} text="卡在哪一环？" color="#a3650a" ts={40} />
      <Sparkle x={1220} y={780} s={0.7} />
    </AbsoluteFill>
  );
};

// P2 结论：你家内部连上了 vs 外面的路不通
const PageConclusion: React.FC<{off: number}> = ({off}) => {
  const f = useCurrentFrame() - off;
  return (
    <AbsoluteFill>
      <Pill f={f} delay={4} x={810} y={58} w={300} h={64} bg={BLUE} text="先说结论" color="#fff" ts={32} />
      <BigTitle f={f} delay={16} y={150} parts={[
        {t: "满格", c: BLUE}, {t: " ≠ ", c: RED}, {t: "有网", c: INK},
      ]} />

      {/* 左：你家内部 连上了 */}
      <FlatCard f={f} delay={95} x={180} y={330} w={740} h={440} chip="你家内部" chipColor={GREEN}>
        <WifiArcs x={370} y={150} s={1.5} c={GREEN} />
        <PopAt f={f} delay={110} x={620} y={110} w={60} h={60}>
          <MarkOk x={30} y={30} s={1.2} />
        </PopAt>
        <div style={{position: "absolute", left: 0, top: 250, width: 740, textAlign: "center", fontFamily: F, fontWeight: 900, fontSize: 84, color: GREEN, letterSpacing: 8}}>连上了</div>
        <div style={{position: "absolute", left: 0, top: 366, width: 740, textAlign: "center", fontFamily: F, fontSize: 27, color: SUBC}}>WiFi 弧线一格不少</div>
      </FlatCard>

      {/* 右：外面的路 不通 */}
      <FlatCard f={f} delay={128} x={1000} y={330} w={740} h={440} chip="外面的路" chipColor={RED}>
        <div style={{position: "absolute", left: 310, top: 60, width: 120, height: 120, opacity: 0.9}}>
          <Globe x={60} y={60} s={1} c="#9aa8b8" />
        </div>
        <PopAt f={f} delay={145} x={620} y={110} w={60} h={60}>
          <MarkBad x={30} y={30} s={1.2} />
        </PopAt>
        <div style={{position: "absolute", left: 0, top: 250, width: 740, textAlign: "center", fontFamily: F, fontWeight: 900, fontSize: 84, color: RED, letterSpacing: 8}}>不通</div>
        <div style={{position: "absolute", left: 0, top: 366, width: 740, textAlign: "center", fontFamily: F, fontSize: 27, color: SUBC, opacity: prog(f, 165, 12)}}>断在哪一段 都要卡</div>
      </FlatCard>

      {/* 压轴横幅 */}
      <PopAt f={f} delay={150} x={460} y={830} w={1000} h={110} rot={-1.2}>
        <div style={{
          width: 1000, height: 110, borderRadius: 22, backgroundColor: YEL,
          display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: "0 14px 30px rgba(247,201,72,0.4)",
        }}>
          <span style={{fontFamily: F, fontWeight: 900, fontSize: 46, color: INK, letterSpacing: 4}}>
            问题出在 <span style={{color: "#a3650a"}}>家门以外</span>
          </span>
        </div>
      </PopAt>
      <Sparkle x={380} y={820} s={0.8} />
    </AbsoluteFill>
  );
};

// P3 三道关卡路线图（包循环飞）
const PageMap: React.FC<{off: number}> = ({off}) => {
  const f = useCurrentFrame() - off;
  const gates = [
    {x: 620, n: "1", label: "路由器", d: 105, ico: <RouterFlat x={90} y={102} s={1.0} />},
    {x: 1000, n: "2", label: "运营商", d: 129, ico: <TowerFlat x={90} y={104} s={0.92} />},
    {x: 1380, n: "3", label: "DNS", d: 153, ico: <BookIco x={90} y={102} s={1.05} />},
  ];
  return (
    <AbsoluteFill>
      <BigTitle f={f} delay={6} parts={[
        {t: "手机到网页 ", c: INK}, {t: "要过三关", c: BLUE},
      ]} />

      {/* 手机（主角） */}
      <PopAt f={f} delay={18} x={150} y={330} w={300} h={560}>
        <Float f={f} x={0} y={0} w={300} h={560} amp={6}>
          <PhoneFlat x={0} y={0} s={1} />
          <WifiArcs x={150} y={-46} s={0.9} c={GREEN} />
        </Float>
      </PopAt>
      <Label f={f} d={18} x={150} y={916} w={300} text="你" size={30} color={SUBC} />

      {/* 链路线 */}
      <FlatArrow f={f} x1={480} y1={560} x2={540} y2={560} delay={100} color="#9fb4c8" sw={6} />
      <FlatArrow f={f} x1={720} y1={560} x2={920} y2={560} delay={120} color="#9fb4c8" sw={6} />
      <FlatArrow f={f} x1={1100} y1={560} x2={1300} y2={560} delay={140} color="#9fb4c8" sw={6} />
      <FlatArrow f={f} x1={1480} y1={560} x2={1600} y2={560} delay={160} color="#9fb4c8" sw={6} />

      {/* 三道关卡（先出灰色虚线底廓，随口播逐个点亮） */}
      {gates.map((g, i) => (
        <PopAt key={`gg-${i}`} f={f} delay={55} x={g.x - 90} y={470} w={180} h={180}>
          <div style={{
            position: "absolute", inset: 0, backgroundColor: "#fbfcfe", border: `3px dashed #c9d4e0`,
            borderRadius: 26,
          }}>
            <div style={{
              position: "absolute", left: -18, top: -18, width: 52, height: 52, borderRadius: 999,
              backgroundColor: "#b9c5d2", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center",
              fontFamily: F, fontWeight: 900, fontSize: 30,
            }}>{g.n}</div>
            <div style={{opacity: 0.3}}>{g.ico}</div>
          </div>
        </PopAt>
      ))}
      {gates.map((g, i) => (
        <React.Fragment key={`g-${i}`}>
          <PopAt f={f} delay={g.d} x={g.x - 90} y={470} w={180} h={180}>
            <div style={{
              position: "absolute", inset: 0, backgroundColor: "#fff", border: `3px solid ${BORDER}`,
              borderRadius: 26, boxShadow: "0 10px 26px rgba(47,58,69,0.07)",
            }}>
              <div style={{
                position: "absolute", left: -18, top: -18, width: 52, height: 52, borderRadius: 999,
                backgroundColor: BLUE, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center",
                fontFamily: F, fontWeight: 900, fontSize: 30, boxShadow: "0 6px 14px rgba(74,134,216,0.4)",
              }}>{g.n}</div>
              {g.ico}
            </div>
          </PopAt>
          <Label f={f} d={g.d + 6} x={g.x - 130} y={672} w={260} text={g.label} size={32} weight={900} />
        </React.Fragment>
      ))}

      {/* 目标服务器 */}
      <PopAt f={f} delay={168} x={1610} y={400} w={220} h={280}>
        <Float f={f} x={0} y={0} w={220} h={280} amp={5}>
          <Cloud x={110} y={16} s={0.9} />
          <ServerIcon x={110} y={168} s={1.35} />
        </Float>
      </PopAt>
      <Label f={f} d={172} x={1560} y={700} w={320} text="网页" size={32} weight={900} />

      {/* 循环包：请求蓝 → 响应绿 */}
      <LoopPacket f={f} x1={500} y1={560} x2={1560} y2={560} color={BLUE} start={62} period={72} dur={62} lift={30} size={44} />
      <LoopPacket f={f} x1={1560} y1={520} x2={500} y2={520} color={GREEN} start={94} period={72} dur={62} lift={30} size={44} />
      <Label f={f} d={62} x={800} y={430} w={320} text="请求" size={28} color={BLUE} weight={900} />
      <Label f={f} d={94} x={800} y={640} w={320} text="响应" size={28} color={GREEN} weight={900} />

      <Pill f={f} delay={158} x={660} y={790} w={600} h={76} bg={BLUE_BG} text="三关都过 网页才通" color={BLUE} ts={36} />
      <Sparkle x={1600} y={330} s={0.8} />
    </AbsoluteFill>
  );
};

// P4 第一关路由器：光猫断线 WiFi 照常满格
const PageRouter: React.FC<{off: number}> = ({off}) => {
  const f = useCurrentFrame() - off;
  return (
    <AbsoluteFill>
      <BigTitle f={f} delay={4} size={80} parts={[
        {t: "第一关 · ", c: INK}, {t: "家里的路由器", c: BLUE},
      ]} />

      {/* 手机 */}
      <PopAt f={f} delay={28} x={210} y={380} w={300} h={560}>
        <Float f={f} x={0} y={0} w={300} h={560} amp={6}>
          <PhoneFlat x={0} y={0} s={1} />
          <WifiArcs x={150} y={-46} s={0.9} c={GREEN} />
        </Float>
      </PopAt>
      <Label f={f} d={175} x={430} y={248} w={320} text="信号：一格不少" size={32} weight={900} color={GREEN} />

      {/* WiFi 弧线 + 路由器（内部正常） */}
      <FlatArrow f={f} x1={525} y1={580} x2={712} y2={580} delay={87} color={GREEN} sw={7} />
      <PopAt f={f} delay={60} x={730} y={560} w={180} h={140}>
        <RouterFlat x={90} y={70} s={1.2} />
      </PopAt>
      <Label f={f} d={60} x={730} y={700} w={180} text="路由器" size={30} color={SUBC} />

      {/* 路由器 → 光猫（家里内部通） */}
      <FlatArrow f={f} x1={920} y1={580} x2={1052} y2={580} delay={100} color="#9fb4c8" sw={7} />
      <PopAt f={f} delay={117} x={1070} y={560} w={120} h={160}>
        <ModemFlat x={60} y={80} s={1.1} />
      </PopAt>
      <Label f={f} d={117} x={1050} y={732} w={160} text="光猫" size={30} color={SUBC} />

      {/* 光猫 → 外面：断！ */}
      <FlatArrow f={f} x1={1195} y1={580} x2={1250} y2={580} delay={100} color="#9fb4c8" sw={7} />
      <PopAt f={f} delay={136} x={1255} y={545} w={70} h={70}>
        <MarkBad x={35} y={35} s={1.35} />
      </PopAt>
      <FlatArrow f={f} x1={1330} y1={580} x2={1500} y2={580} delay={136} color={RED} dashed sw={6} />
      <Label f={f} d={136} x={1210} y={668} w={420} text="出门的线 断了" size={32} weight={900} color={RED} />

      {/* 外面的世界（够不着） */}
      <PopAt f={f} delay={140} x={1570} y={430} w={240} h={300}>
        <Float f={f} x={0} y={0} w={240} h={300} amp={5}>
          <Cloud x={120} y={30} s={1.05} />
          <ServerIcon x={120} y={210} s={1.4} c="#9aa8b8" />
        </Float>
      </PopAt>

      {/* 内部循环包（请求/响应都只在家里面转） */}
      <LoopPacket f={f} x1={560} y1={545} x2={700} y2={545} color={BLUE} start={100} period={52} dur={24} size={32} />
      <LoopPacket f={f} x1={700} y1={615} x2={560} y2={615} color={GREEN} start={114} period={52} dur={24} size={32} />
      {/* 出门的包坠落在断点 */}
      <FlyPacket f={f} n="!" x1={850} y1={580} x2={1280} y2={580} t0={125} dur={46} color={BLUE} fall={0.55} />
      <FlashRing f={f} at={171} x={1290} y={580} color={RED} />

      <Pill f={f} delay={204} x={610} y={790} w={700} h={78} bg={RED_BG} text="满格照旧 就是出不了门" color={RED} ts={38} />
      <Sparkle x={480} y={760} s={0.8} />
    </AbsoluteFill>
  );
};

// P5 第二关运营商：一跳一跳，中间断一跳
const PageIsp: React.FC<{off: number}> = ({off}) => {
  const f = useCurrentFrame() - off;
  const hopY = 500;
  const hops = [
    {x: 610, d: 61}, {x: 970, d: 75}, {x: 1330, d: 89},
  ];
  return (
    <AbsoluteFill>
      <BigTitle f={f} delay={4} size={80} parts={[
        {t: "第二关 · ", c: INK}, {t: "运营商的中转站", c: BLUE},
      ]} />

      {/* 你家路由器（起点） */}
      <PopAt f={f} delay={27} x={230} y={hopY} w={180} h={140}>
        <RouterFlat x={90} y={70} s={1.2} c={BLUE} />
      </PopAt>
      <Label f={f} d={27} x={170} y={648} w={220} text="你家" size={30} color={SUBC} />

      {/* 运营商节点 */}
      {hops.map((h, i) => (
        <React.Fragment key={`h-${i}`}>
          <PopAt f={f} delay={h.d} x={h.x - 55} y={hopY - 55} w={110} h={110}>
            <div style={{
              position: "absolute", inset: 0, borderRadius: 999, backgroundColor: "#fff",
              border: `4px solid ${BLUE}`, display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: "0 8px 18px rgba(74,134,216,0.18)",
            }}>
              <Ico d={D_WIFI} x={55} y={55} s={2.2} c={BLUE} />
            </div>
          </PopAt>
          <Label f={f} d={h.d + 4} x={h.x - 90} y={hopY + 78} w={180} text={`第 ${i + 1} 跳`} size={28} color={SUBC} />
        </React.Fragment>
      ))}
      <Label f={f} d={133} x={540} y={hopY + 140} w={860} text="一跳 = 一个中转站" size={30} color={SUBC} />

      {/* 链线 */}
      <FlatArrow f={f} x1={330} y1={hopY} x2={545} y2={hopY} delay={55} color="#9fb4c8" sw={7} />
      <FlatArrow f={f} x1={680} y1={hopY} x2={905} y2={hopY} delay={70} color="#9fb4c8" sw={7} />
      <FlatArrow f={f} x1={1040} y1={hopY} x2={1265} y2={hopY} delay={80} color="#9fb4c8" sw={7} />
      <FlatArrow f={f} x1={1400} y1={hopY} x2={1615} y2={hopY} delay={90} color="#9fb4c8" sw={7} />

      {/* 目标（够不着） */}
      <PopAt f={f} delay={100} x={1700} y={hopY - 120} w={220} h={260}>
        <Float f={f} x={0} y={0} w={220} h={260} amp={5}>
          <ServerIcon x={110} y={120} s={1.4} c="#9aa8b8" />
        </Float>
      </PopAt>
      <Label f={f} d={100} x={1670} y={622} w={280} text="目标网页" size={30} color={SUBC} />

      {/* 逐跳循环包：请求蓝 →，响应绿 ←（前两跳正常） */}
      <LoopPacket f={f} x1={340} y1={hopY} x2={540} y2={hopY} color={BLUE} start={61} period={56} dur={26} size={36} />
      <LoopPacket f={f} x1={540} y1={hopY - 60} x2={340} y2={hopY - 60} color={GREEN} start={78} period={56} dur={26} size={36} />
      <LoopPacket f={f} x1={690} y1={hopY} x2={890} y2={hopY} color={BLUE} start={95} period={56} dur={26} size={36} />
      <LoopPacket f={f} x1={890} y1={hopY - 60} x2={690} y2={hopY - 60} color={GREEN} start={112} period={56} dur={26} size={36} />

      {/* 第三跳：先正常送两包，第三包半路坠落 */}
      <FlyPacket f={f} n="3" x1={1050} y1={hopY} x2={1255} y2={hopY} t0={129} dur={26} color={BLUE} />
      <FlyPacket f={f} n="4" x1={1050} y1={hopY} x2={1255} y2={hopY} t0={160} dur={26} color={BLUE} />
      <FlyPacket f={f} n="5" x1={1050} y1={hopY} x2={1255} y2={hopY} t0={195} dur={60} color={BLUE} fall={0.5} />
      <FlatArrow f={f} x1={1040} y1={hopY} x2={1265} y2={hopY} delay={227} color={RED} dashed sw={6} />
      <PopAt f={f} delay={227} x={1150} y={hopY - 35} w={70} h={70}>
        <MarkBad x={35} y={35} s={1.35} />
      </PopAt>
      <FlashRing f={f} at={227} x={1185} y={hopY} color={RED} />
      <Label f={f} d={227} x={1000} y={hopY - 130} w={320} text="就断在这" size={34} weight={900} color={RED} />

      <Pill f={f} delay={248} x={610} y={790} w={700} h={78} bg={RED_BG} text="页面停在这里" color={RED} ts={38} />
      <Sparkle x={480} y={760} s={0.8} />
    </AbsoluteFill>
  );
};

// P6 第三关 DNS：查电话本问 IP，电话本坏了
const PageDns: React.FC<{off: number}> = ({off}) => {
  const f = useCurrentFrame() - off;
  // 翻页动画：167~200 右半遮页掀开
  const flipP = f >= 167 ? ease(Math.min(1, (f - 167) / 26)) : 0;
  const flipOn = f >= 167 && flipP < 1;
  return (
    <AbsoluteFill>
      <BigTitle f={f} delay={4} size={80} parts={[
        {t: "第三关 · ", c: INK}, {t: "DNS 电话本", c: BLUE},
      ]} />

      {/* 浏览器卡 */}
      <PopAt f={f} delay={58} x={170} y={350} w={420} h={330}>
        <div style={{position: "absolute", inset: 0, backgroundColor: "#fff", border: `3px solid ${BORDER}`, borderRadius: 22, boxShadow: "0 10px 26px rgba(47,58,69,0.08)"}}>
          <div style={{position: "absolute", left: 0, right: 0, top: 0, height: 50, backgroundColor: "#eef2f7", borderRadius: "22px 22px 0 0"}} />
          <div style={{position: "absolute", left: 20, top: 16, width: 12, height: 12, borderRadius: 999, backgroundColor: RED}} />
          <div style={{position: "absolute", left: 42, top: 16, width: 12, height: 12, borderRadius: 999, backgroundColor: YEL}} />
          <div style={{position: "absolute", left: 64, top: 16, width: 12, height: 12, borderRadius: 999, backgroundColor: GREEN}} />
          <div style={{position: "absolute", left: 24, top: 70, width: 372, height: 52, borderRadius: 999, backgroundColor: BLUE_BG, fontFamily: F, fontSize: 26, fontWeight: 700, color: INK, display: "flex", alignItems: "center", paddingLeft: 24}}>www.baidu.com</div>
          <div style={{position: "absolute", left: 24, top: 150, width: 372, height: 52, borderRadius: 999, backgroundColor: "#f2f5f9", fontFamily: F, fontSize: 26, fontWeight: 700, color: SUBC, display: "flex", alignItems: "center", paddingLeft: 24}}>IP = ?</div>
          <div style={{position: "absolute", left: 0, top: 240, width: 420, textAlign: "center", fontFamily: F, fontWeight: 900, fontSize: 32, color: INK, opacity: prog(f, 210, 12)}}>
            <span style={{color: GREEN}}>拿到 IP 出发</span>
          </div>
        </div>
      </PopAt>
      <Label f={f} d={58} x={180} y={704} w={400} text="浏览器" size={30} color={SUBC} />

      {/* DNS 电话本 */}
      <PopAt f={f} delay={28} x={760} y={330} w={640} h={380} rot={-0.6}>
        <div style={{position: "absolute", inset: 0, backgroundColor: "#fff", border: `3px solid ${BORDER}`, borderRadius: 26, boxShadow: "0 12px 28px rgba(47,58,69,0.1)"}}>
          {/* 左页：网址 */}
          <div style={{position: "absolute", left: 40, top: 60, width: 260, height: 240}}>
            <div style={{position: "absolute", left: 0, top: 0, width: 260, textAlign: "center", fontFamily: F, fontSize: 26, color: SUBC}}>网址（名字）</div>
            <div style={{position: "absolute", left: 0, top: 90, width: 260, height: 76, borderRadius: 16, backgroundColor: BLUE_BG, border: `3px solid ${BLUE}`, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: F, fontWeight: 900, fontSize: 30, color: BLUE}}>www.baidu.com</div>
          </div>
          {/* 右页：IP */}
          <div style={{position: "absolute", left: 340, top: 60, width: 260, height: 240}}>
            <div style={{position: "absolute", left: 0, top: 0, width: 260, textAlign: "center", fontFamily: F, fontSize: 26, color: SUBC, opacity: flipP}}>IP（门牌号）</div>
            <div style={{position: "absolute", left: 0, top: 90, width: 260, height: 76, borderRadius: 16, backgroundColor: GREEN_BG, border: `3px solid ${GREEN}`, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: F, fontWeight: 900, fontSize: 34, color: GREEN, opacity: prog(f, 202, 12), transform: `scale(${0.85 + 0.15 * ease(prog(f, 202, 12))})`}}>142.51.100.3</div>
          </div>
          {/* 书脊 */}
          <div style={{position: "absolute", left: 318, top: 20, width: 4, height: 340, backgroundColor: "#eef2f7"}} />
          {/* 右半遮页（问号） */}
          {flipOn || flipP <= 0 ? (
            <div style={{
              position: "absolute", left: 320, top: 0, width: 317, height: 374,
              transformOrigin: "left center",
              transform: `perspective(1100px) rotateY(${-175 * flipP}deg)`,
              backfaceVisibility: "hidden",
              backgroundColor: "#f6f9fc", border: `3px solid ${BORDER}`, borderRadius: "0 26px 26px 0",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontFamily: F, fontWeight: 900, fontSize: 96, color: SUBC,
            }}>?</div>
          ) : null}
          {/* 盖章后变红 */}
          <div style={{position: "absolute", inset: -3, borderRadius: 26, border: `5px solid ${RED}`, opacity: prog(f, 257, 10)}} />
        </div>
        {/* 顶部标签胶囊 */}
        <div style={{
          position: "absolute", left: 190, top: -28, width: 260, height: 58, borderRadius: 999,
          backgroundColor: BLUE, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 32, fontWeight: 900, letterSpacing: 4, boxShadow: "0 8px 18px rgba(74,134,216,0.4)",
        }}>DNS 电话本</div>
      </PopAt>
      <PopAt f={f} delay={257} x={1000} y={440} w={180} h={180} rot={0}>
        <StampBad x={90} y={90} s={1.2} />
      </PopAt>
      <FlashRing f={f} at={257} x={1080} y={520} color={RED} />
      <Label f={f} d={262} x={920} y={742} w={340} text="盖章：不可用" size={32} weight={900} color={RED} />

      {/* 查询（蓝）与应答（绿）包 */}
      <FlatArrow f={f} x1={610} y1={520} x2={740} y2={520} delay={120} color="#9fb4c8" sw={6} />
      <FlyPacket f={f} n="?" x1={610} y1={520} x2={760} y2={520} t0={135} dur={28} color={BLUE} />
      <FlyPacket f={f} n="IP" x1={760} y1={470} x2={610} y2={470} t0={202} dur={28} color={GREEN} />
      <Label f={f} d={135} x={580} y={432} w={200} text="去查" size={28} color={BLUE} weight={900} />
      <Label f={f} d={202} x={580} y={392} w={200} text="问到" size={28} color={GREEN} weight={900} />

      <Pill f={f} delay={280} x={610} y={800} w={700} h={78} bg={RED_BG} text="名字翻译不出来" color={RED} ts={38} />
      <Sparkle x={1470} y={300} s={0.8} />
    </AbsoluteFill>
  );
};

// P7 通行证：满格只管第一跳
const PageTicket: React.FC<{off: number}> = ({off}) => {
  const f = useCurrentFrame() - off;
  const gates = [
    {x: 1040, n: "1", label: "路由器", d: 86},
    {x: 1290, n: "2", label: "运营商", d: 97},
    {x: 1540, n: "3", label: "DNS", d: 108},
  ];
  return (
    <AbsoluteFill>
      <BigTitle f={f} delay={18} size={80} parts={[
        {t: "满格的通行证 ", c: INK}, {t: "只管", c: RED}, {t: "第一跳", c: BLUE},
      ]} />

      {/* 左：手机 + 通行证票券 */}
      <PopAt f={f} delay={18} x={140} y={400} w={190} h={310}>
        <Float f={f} x={0} y={0} w={190} h={310} amp={6}>
          <PhoneFlat x={0} y={0} s={0.55} />
          <WifiArcs x={82} y={-26} s={0.6} c={GREEN} />
        </Float>
      </PopAt>
      <PopAt f={f} delay={61} x={380} y={330} w={580} h={350}>
        <div style={{
          position: "absolute", inset: 0, backgroundColor: "#fffbe8",
          border: `4px dashed #d9a12c`, borderRadius: 24,
          boxShadow: "0 12px 28px rgba(217,161,44,0.2)",
        }}>
          {/* 票券缺口 */}
          <div style={{position: "absolute", left: -16, top: 153, width: 32, height: 44, borderRadius: 999, backgroundColor: "#f3f6f9"}} />
          <div style={{position: "absolute", right: -16, top: 153, width: 32, height: 44, borderRadius: 999, backgroundColor: "#f3f6f9"}} />
          <div style={{position: "absolute", left: 190, top: -24, width: 200, height: 54, borderRadius: 999, backgroundColor: GREEN, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 30, fontWeight: 900, letterSpacing: 6, boxShadow: "0 8px 18px rgba(69,165,106,0.4)"}}>通行证</div>
          <div style={{position: "absolute", left: 0, top: 96, width: 580, textAlign: "center", fontFamily: F, fontWeight: 900, fontSize: 96, color: BLUE, letterSpacing: 12}}>满格</div>
          <div style={{position: "absolute", left: 0, top: 236, width: 580, textAlign: "center", fontFamily: F, fontWeight: 700, fontSize: 34, color: "#a3650a"}}>仅限第一跳 · 后面的关卡不认</div>
        </div>
      </PopAt>
      <Sparkle x={920} y={320} s={0.9} />

      {/* 右：后面的关卡链 */}
      {gates.map((g, i) => (
        <React.Fragment key={`tg-${i}`}>
          <PopAt f={f} delay={g.d} x={g.x - 70} y={370} w={140} h={140}>
            <div style={{
              position: "absolute", inset: 0, backgroundColor: "#fff", border: `3px solid ${BORDER}`,
              borderRadius: 22, boxShadow: "0 8px 18px rgba(47,58,69,0.07)",
            }}>
              <div style={{
                position: "absolute", left: -16, top: -16, width: 46, height: 46, borderRadius: 999,
                backgroundColor: BLUE, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center",
                fontFamily: F, fontWeight: 900, fontSize: 26,
              }}>{g.n}</div>
              {i === 0 ? <RouterFlat x={70} y={76} s={0.78} /> : i === 1 ? <TowerFlat x={70} y={78} s={0.72} /> : <BookIco x={70} y={76} s={0.82} />}
            </div>
          </PopAt>
          <Label f={f} d={g.d + 4} x={g.x - 100} y={534} w={200} text={g.label} size={28} weight={900} />
        </React.Fragment>
      ))}
      {/* 第一跳：通行证有效（蓝）+ 循环包 */}
      <FlatArrow f={f} x1={820} y1={440} x2={960} y2={440} delay={95} color={BLUE} sw={7} />
      <LoopPacket f={f} x1={830} y1={440} x2={950} y2={440} color={BLUE} start={110} period={50} dur={22} size={32} />
      <PopAt f={f} delay={100} x={855} y={350} w={56} h={56}>
        <MarkOk x={28} y={28} s={1.05} />
      </PopAt>
      {/* 后面两段：断 */}
      <FlatArrow f={f} x1={1115} y1={440} x2={1215} y2={440} delay={112} color={RED} dashed sw={6} />
      <PopAt f={f} delay={112} x={1135} y={410} w={60} h={60}>
        <MarkBad x={30} y={30} s={1.15} />
      </PopAt>
      <FlatArrow f={f} x1={1365} y1={440} x2={1465} y2={440} delay={112} color={RED} dashed sw={6} />
      <PopAt f={f} delay={112} x={1385} y={410} w={60} h={60}>
        <MarkBad x={30} y={30} s={1.15} />
      </PopAt>
      <FlashRing f={f} at={112} x={1165} y={440} color={RED} />

      <Label f={f} d={100} x={390} y={730} w={560} text="凭它过第一跳" size={32} weight={900} color={GREEN} />
      <Pill f={f} delay={137} x={1000} y={700} w={580} h={76} bg={RED_BG} text="一环断 全程断" color={RED} ts={38} />
      <Sparkle x={1600} y={680} s={0.7} color="#bfe3cc" />
    </AbsoluteFill>
  );
};

// P8 排查口诀三卡
const PageFix: React.FC<{off: number}> = ({off}) => {
  const f = useCurrentFrame() - off;
  return (
    <AbsoluteFill>
      <BigTitle f={f} delay={4} parts={[{t: "排查口诀 三步走", c: INK}]} />
      <BulbFlat x={470} y={110} s={0.9} />

      {/* 第 1 步 重启路由器 */}
      <FlatCard f={f} delay={43} x={130} y={330} w={520} h={430} chip="第 1 步" chipColor={GREEN}>
        <Ico d={D_REFRESH} x={260} y={140} s={4.6} c={GREEN} />
        <div style={{position: "absolute", left: 0, top: 268, width: 520, textAlign: "center", fontFamily: F, fontWeight: 900, fontSize: 46, color: INK}}>重启路由器</div>
        <div style={{position: "absolute", left: 0, top: 346, width: 520, textAlign: "center", fontFamily: F, fontSize: 26, color: SUBC, opacity: prog(f, 58, 12)}}>断电等十秒 再通电</div>
      </FlatCard>

      {/* 第 2 步 换 DNS */}
      <FlatCard f={f} delay={100} x={700} y={330} w={520} h={430} chip="第 2 步" chipColor={BLUE}>
        <BookIco x={260} y={130} s={1.7} />
        <div style={{position: "absolute", left: 0, top: 238, width: 520, textAlign: "center", fontFamily: F, fontWeight: 900, fontSize: 46, color: INK}}>换个 DNS</div>
        <div style={{position: "absolute", left: 90, top: 316, width: 340, height: 48, borderRadius: 999, backgroundColor: BLUE_BG, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: F, fontWeight: 700, fontSize: 27, color: BLUE}}>114.114.114.114</div>
        <div style={{position: "absolute", left: 90, top: 372, width: 340, height: 48, borderRadius: 999, backgroundColor: BLUE_BG, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: F, fontWeight: 700, fontSize: 27, color: BLUE}}>223.5.5.5</div>
      </FlatCard>

      {/* 第 3 步 找运营商 */}
      <FlatCard f={f} delay={168} x={1270} y={330} w={520} h={430} chip="第 3 步" chipColor="#e8a13a">
        <Ico d={D_HEADSET} x={260} y={140} s={4.6} c="#e8a13a" />
        <div style={{position: "absolute", left: 0, top: 268, width: 520, textAlign: "center", fontFamily: F, fontWeight: 900, fontSize: 46, color: INK}}>找运营商</div>
        <div style={{position: "absolute", left: 0, top: 346, width: 520, textAlign: "center", fontFamily: F, fontSize: 26, color: SUBC, opacity: prog(f, 183, 12)}}>线路问题 他们能查</div>
      </FlatCard>

      <Pill f={f} delay={178} x={660} y={820} w={600} h={74} bg={"#fdf7e2"} border={`3px solid ${YEL}`} text="从近到远 逐个排查" color="#a3650a" ts={36} />
      <Sparkle x={620} y={300} s={0.7} />
      <Sparkle x={1260} y={810} s={0.8} />
    </AbsoluteFill>
  );
};

// P9 结尾截图卡（最后 ~100 帧完全静止）
const PageCard: React.FC<{off: number}> = ({off}) => {
  const f = useCurrentFrame() - off;
  const chips = [
    {t: "路由器", d: 87}, {t: "运营商", d: 109}, {t: "DNS", d: 133},
  ];
  return (
    <AbsoluteFill>
      <Pill f={f} delay={3} x={810} y={64} w={300} h={64} bg={YEL} text="收好这张卡" color={INK} ts={32} />

      {/* 大字卡 */}
      <FlatCard f={f} delay={24} x={410} y={210} w={1100} h={440}>
        <div style={{
          position: "absolute", left: 0, top: 90, width: 1100, textAlign: "center",
          fontFamily: F, fontWeight: 900, fontSize: 96, letterSpacing: 6,
          opacity: prog(f, 41, 12), transform: `scale(${0.7 + 0.3 * ease(prog(f, 41, 12))})`,
        }}>
          <span style={{color: BLUE}}>满格</span>
          <span style={{color: RED}}> ≠ </span>
          <span style={{color: INK}}>有网</span>
        </div>
        {/* 三道关卡小链 */}
        {chips.map((c, i) => (
          <React.Fragment key={`c-${i}`}>
            <div style={{
              position: "absolute", left: 190 + i * 260, top: 288, width: 190, height: 68,
              borderRadius: 999, backgroundColor: BLUE_BG, border: `3px solid ${BLUE}`,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontFamily: F, fontWeight: 900, fontSize: 30, color: BLUE,
              opacity: prog(f, c.d, 10), transform: `scale(${0.85 + 0.15 * ease(prog(f, c.d, 10))})`,
            }}>{c.t}</div>
            {i < 2 ? (
              <svg width={70} height={30} style={{position: "absolute", left: 382 + i * 260, top: 307, overflow: "visible", opacity: prog(f, c.d + 10, 10)}}>
                <line x1={4} y1={15} x2={54} y2={15} stroke="#9fb4c8" strokeWidth={6} strokeLinecap="round" />
                <path d="M50 4 L66 15 L50 26" fill="none" stroke="#9fb4c8" strokeWidth={6} strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            ) : null}
          </React.Fragment>
        ))}
      </FlatCard>
      <Sparkle x={380} y={200} s={0.9} />
      <Sparkle x={1560} y={300} s={0.7} color="#b8d4f2" />

      {/* 关注胶囊 + 落款 */}
      <PopAt f={f} delay={176} x={660} y={710} w={600} h={96}>
        <div style={{
          width: 600, height: 96, borderRadius: 999, backgroundColor: "#f0912d",
          display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: "0 14px 30px rgba(240,145,45,0.4)",
        }}>
          <span style={{fontFamily: F, fontWeight: 900, fontSize: 44, color: "#fff", letterSpacing: 6}}>关注 全栈小秋</span>
        </div>
      </PopAt>
      <Label f={f} d={165} x={610} y={838} w={700} text="小秋 · 0 基础也能学会" size={30} color={SUBC} />
    </AbsoluteFill>
  );
};

// ============ 主组件 ============

// 各句配音起始帧（页面边界 = 句起始帧，来自 timeline.json）
const SENT = [0, 150, 341, 514, 751, 1032, 1337, 1514, 1705];
const PAGES = [
  {C: PageHook, start: SENT[0], end: SENT[1]},
  {C: PageConclusion, start: SENT[1], end: SENT[2]},
  {C: PageMap, start: SENT[2], end: SENT[3]},
  {C: PageRouter, start: SENT[3], end: SENT[4]},
  {C: PageIsp, start: SENT[4], end: SENT[5]},
  {C: PageDns, start: SENT[5], end: SENT[6]},
  {C: PageTicket, start: SENT[6], end: SENT[7]},
  {C: PageFix, start: SENT[7], end: SENT[8]},
  {C: PageCard, start: SENT[8], end: DUR},
];

const voiceLines = [
  {audio: "s01.mp3", s: 0, e: 145},
  {audio: "s02.mp3", s: 150, e: 335},
  {audio: "s03.mp3", s: 341, e: 509},
  {audio: "s04.mp3", s: 514, e: 746},
  {audio: "s05.mp3", s: 751, e: 1027},
  {audio: "s06.mp3", s: 1032, e: 1332},
  {audio: "s07.mp3", s: 1337, e: 1508},
  {audio: "s08.mp3", s: 1514, e: 1700},
  {audio: "s09.mp3", s: 1705, e: 1899},
];

export const WifiFullBars: React.FC = () => {
  const frame = useCurrentFrame();
  const bed = interpolate(frame, [0, 20, DUR - 130, DUR - 100, DUR - 26, DUR - 1], [0, 0.06, 0.06, 0.1, 0.17, 0], clamp);
  return (
    <AbsoluteFill style={{background: "linear-gradient(180deg,#fff 0%,#f3f6f9 100%)", fontFamily: F, overflow: "hidden"}}>
      <div style={{position: "absolute", inset: 0, transform: `translateY(${Math.sin(frame / 90) * 8}px)`}}>
        <BgDots />
      </div>
      {PAGES.map(({C, start, end}, i) => {
        const first = i === 0, last = i === PAGES.length - 1, len = end - start;
        return (
          <Sequence key={i} from={start} durationInFrames={last ? DUR - start : len + 10}>
            <PageTurn off={0} len={len} first={first} last={last}><C off={0} /></PageTurn>
          </Sequence>
        );
      })}
      {/* 右上角品牌角标 */}
      <div style={{
        position: "absolute", top: 45, right: 70, zIndex: 45, border: `3px solid ${BLUE}`,
        borderRadius: 999, padding: "7px 25px", fontSize: 28, fontWeight: 900, color: INK,
        letterSpacing: 5, background: "#fff",
      }}>全栈小秋</div>

      {/* 配音 */}
      {voiceLines.map((s, i) => (
        <Sequence key={`v-${i}`} from={s.s} durationInFrames={s.e - s.s + 20}>
          <Audio src={staticFile(`audio/wifi-tts/${s.audio}`)} volume={1} />
        </Sequence>
      ))}

      {/* 音效层（帧号全部由 SENT / 词级锚点推导） */}
      {/* 翻页 */}
      {SENT.slice(1).map((t, i) => (
        <Sequence key={`pt-${i}`} from={t - 6} durationInFrames={20}>
          <Audio src={staticFile("audio/sfx/page3.wav")} volume={0.28} />
        </Sequence>
      ))}
      {/* P2 结论卡弹入 */}
      {[95, 128, 150].map((t) => (
        <Sequence key={`pop2-${t}`} from={SENT[1] + t} durationInFrames={10}>
          <Audio src={staticFile("audio/sfx/pop.wav")} volume={0.26} />
        </Sequence>
      ))}
      {/* P3 关卡逐个弹入 + 包起飞 + 服务器就位 */}
      {[18, 105, 129, 153, 168].map((t) => (
        <Sequence key={`pop3-${t}`} from={SENT[2] + t} durationInFrames={10}>
          <Audio src={staticFile("audio/sfx/pop.wav")} volume={0.26} />
        </Sequence>
      ))}
      {[62, 94].map((t) => (
        <Sequence key={`wh3-${t}`} from={SENT[2] + t} durationInFrames={12}>
          <Audio src={staticFile("audio/sfx/whoosh.wav")} volume={0.22} />
        </Sequence>
      ))}
      {/* P4 路由器弹入 / 内部包 / 光猫断线 */}
      {[28, 60, 117, 204].map((t) => (
        <Sequence key={`pop4-${t}`} from={SENT[3] + t} durationInFrames={10}>
          <Audio src={staticFile("audio/sfx/pop.wav")} volume={0.26} />
        </Sequence>
      ))}
      <Sequence from={SENT[3] + 100} durationInFrames={12}>
        <Audio src={staticFile("audio/sfx/whoosh.wav")} volume={0.22} />
      </Sequence>
      <Sequence from={SENT[3] + 136} durationInFrames={22}>
        <Audio src={staticFile("audio/sfx/error.wav")} volume={0.3} />
      </Sequence>
      {/* P5 逐跳起飞 / 断跳 / 卡住 */}
      {[61, 95, 195].map((t) => (
        <Sequence key={`wh5-${t}`} from={SENT[4] + t} durationInFrames={12}>
          <Audio src={staticFile("audio/sfx/whoosh.wav")} volume={0.22} />
        </Sequence>
      ))}
      {[27, 61, 75, 89].map((t) => (
        <Sequence key={`pop5-${t}`} from={SENT[4] + t} durationInFrames={10}>
          <Audio src={staticFile("audio/sfx/pop.wav")} volume={0.24} />
        </Sequence>
      ))}
      <Sequence from={SENT[4] + 227} durationInFrames={22}>
        <Audio src={staticFile("audio/sfx/error.wav")} volume={0.3} />
      </Sequence>
      <Sequence from={SENT[4] + 248} durationInFrames={10}>
        <Audio src={staticFile("audio/sfx/pop.wav")} volume={0.26} />
      </Sequence>
      {/* P6 电话本 / 查询 / 问到 / 盖章 */}
      {[28, 58, 280].map((t) => (
        <Sequence key={`pop6-${t}`} from={SENT[5] + t} durationInFrames={10}>
          <Audio src={staticFile("audio/sfx/pop.wav")} volume={0.26} />
        </Sequence>
      ))}
      <Sequence from={SENT[5] + 135} durationInFrames={12}>
        <Audio src={staticFile("audio/sfx/whoosh.wav")} volume={0.22} />
      </Sequence>
      <Sequence from={SENT[5] + 212} durationInFrames={20}>
        <Audio src={staticFile("audio/sfx/ding.wav")} volume={0.3} />
      </Sequence>
      <Sequence from={SENT[5] + 257} durationInFrames={22}>
        <Audio src={staticFile("audio/sfx/error.wav")} volume={0.3} />
      </Sequence>
      {/* P7 票券 / 断环 */}
      {[61, 137].map((t) => (
        <Sequence key={`pop7-${t}`} from={SENT[6] + t} durationInFrames={10}>
          <Audio src={staticFile("audio/sfx/pop.wav")} volume={0.26} />
        </Sequence>
      ))}
      <Sequence from={SENT[6] + 112} durationInFrames={22}>
        <Audio src={staticFile("audio/sfx/error.wav")} volume={0.28} />
      </Sequence>
      {/* P8 三卡按口播弹入 */}
      {[43, 100, 168].map((t) => (
        <Sequence key={`pop8-${t}`} from={SENT[7] + t} durationInFrames={10}>
          <Audio src={staticFile("audio/sfx/pop.wav")} volume={0.26} />
        </Sequence>
      ))}
      {/* P9 大字卡 / 关注 */}
      {[41, 176].map((t) => (
        <Sequence key={`pop9-${t}`} from={SENT[8] + t} durationInFrames={10}>
          <Audio src={staticFile("audio/sfx/pop.wav")} volume={0.3} />
        </Sequence>
      ))}
      <Sequence from={SENT[8] + 190} durationInFrames={20}>
        <Audio src={staticFile("audio/sfx/ding.wav")} volume={0.3} />
      </Sequence>

      {/* 铺底 */}
      <Audio src={staticFile("audio/bed.wav")} loop volume={() => bed} />
      <Sequence from={1705} durationInFrames={60}>
        <Audio src={staticFile("audio/sfx/warm3.wav")} volume={0.26} />
      </Sequence>
      <Subtitle />
    </AbsoluteFill>
  );
};
