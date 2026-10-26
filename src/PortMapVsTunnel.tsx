import {Audio} from "@remotion/media";
import {
  AbsoluteFill, interpolate, Sequence, staticFile, useCurrentFrame,
} from "remotion";

// ============ 扁平可爱插画科普风（参考"AI研究员"系列，小秋 IP） ============
// 特点：白底 + 圆角卡片 + 蓝/绿语义双色 + 扁平图标 + 隐喻场景 + 白字黑底条字幕
// 结构：总览 → 原理+前台类比 → 硬性前提 → 内网穿透 → 区别+怎么选 → CTA

const INK = "#2f3a45";
const SUBC = "#7a8694";
const BLUE = "#4a86d8";
const BLUE_BG = "#eaf2fc";
const GREEN = "#45a56a";
const GREEN_BG = "#e9f6ee";
const ORANGE = "#f0912d";
const ORANGE_BG = "#fdf3e0";
const RED = "#e05656";
const RED_BG = "#fdecec";
const YEL = "#f7c948";
const BORDER = "#e0e6ec";

const F = "'Microsoft YaHei', sans-serif";
const MONO = "'Consolas','Courier New',monospace";

const DUR = 1860;
const W = 1920;
const H = 1080;

const clamp = {extrapolateLeft: "clamp", extrapolateRight: "clamp"} as const;
const prog = (f: number, delay: number, dur = 12) =>
  interpolate(f, [delay, delay + dur], [0, 1], clamp);
const ease = (p: number) => 1 - Math.pow(1 - p, 3);

const voiceLines = [
  {index: 1, audio: "s01.mp3", start: 0, end: 188},
  {index: 2, audio: "s02.mp3", start: 193, end: 410},
  {index: 3, audio: "s03.mp3", start: 416, end: 652},
  {index: 4, audio: "s04.mp3", start: 657, end: 906},
  {index: 5, audio: "s05.mp3", start: 912, end: 1172},
  {index: 6, audio: "s06.mp3", start: 1177, end: 1406},
  {index: 7, audio: "s07.mp3", start: 1412, end: 1659},
  {index: 8, audio: "s08.mp3", start: 1664, end: 1847},
];

type Sub = {s: number; e: number; t: string};
const subs: Sub[] = [
  {s: 0, e: 77, t: "外网访问不了家里的设备"},
  {s: 77, e: 140, t: "端口映射和内网穿透"},
  {s: 140, e: 188, t: "一次给你讲清楚"},
  {s: 193, e: 234, t: "先说端口映射"},
  {s: 234, e: 329, t: "它就是把公网IP上的一个端口"},
  {s: 329, e: 410, t: "和内网设备的端口绑定起来"},
  {s: 416, e: 472, t: "外部访问这个端口"},
  {s: 472, e: 534, t: "路由器就像公司前台"},
  {s: 534, e: 576, t: "查一下转接表"},
  {s: 576, e: 652, t: "把流量转给内网那台机器"},
  {s: 657, e: 711, t: "但它有个硬性前提"},
  {s: 711, e: 785, t: "你必须有真正的公网IP"},
  {s: 785, e: 872, t: "现在运营商大多给的是大内网"},
  {s: 872, e: 906, t: "配了也白配"},
  {s: 912, e: 979, t: "没有公网IP怎么办"},
  {s: 979, e: 1016, t: "用内网穿透"},
  {s: 1016, e: 1120, t: "让设备主动连上一台公网服务器"},
  {s: 1120, e: 1172, t: "打一条加密隧道"},
  {s: 1177, e: 1234, t: "两者的区别一句话"},
  {s: 1234, e: 1313, t: "端口映射是直接把门打开"},
  {s: 1313, e: 1406, t: "内网穿透是找中间人帮你传话"},
  {s: 1412, e: 1435, t: "怎么选"},
  {s: 1435, e: 1520, t: "有公网IP就用端口映射"},
  {s: 1520, e: 1566, t: "速度快延迟低"},
  {s: 1566, e: 1612, t: "没有就用穿透"},
  {s: 1612, e: 1658, t: "零配置更省事"},
  {s: 1664, e: 1713, t: "学会了就点个赞"},
  {s: 1713, e: 1790, t: "下期手把手教你用frp"},
  {s: 1790, e: 1846, t: "搭一条自己的隧道"},
];

// ---------- 基础原语 ----------

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


// 圆角卡片（可带顶部标签胶囊）
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

// 高亮胶囊条
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

// 直线箭头（可虚线、可带飞行数据包）
const FlatArrow: React.FC<{
  f: number; x1: number; y1: number; x2: number; y2: number; color?: string;
  dashed?: boolean; sw?: number; delay?: number; packet?: boolean; packetColor?: string;
}> = ({f, x1, y1, x2, y2, color = INK, dashed, sw = 7, delay = 0, packet, packetColor = ORANGE}) => {
  const p = prog(f, delay, 16);
  if (p <= 0) return null;
  const dx = x2 - x1, dy = y2 - y1;
  const len = Math.hypot(dx, dy);
  const ux = dx / len, uy = dy / len;
  const px = -uy, py = ux;
  const endX = x1 + dx * p, endY = y1 + dy * p;
  const head = 22;
  const pt = prog(f, delay + 12, 24);
  return (
    <svg width={W} height={H} style={{position: "absolute", left: 0, top: 0, overflow: "visible", pointerEvents: "none"}}>
      <line x1={x1} y1={y1} x2={endX} y2={endY} stroke={color}
        strokeWidth={sw} strokeLinecap="round" strokeDasharray={dashed ? "14 12" : undefined} />
      {p > 0.9 ? (
        <path d={`M ${x2 - ux * head + px * head * 0.55} ${y2 - uy * head + py * head * 0.55} L ${x2} ${y2} L ${x2 - ux * head - px * head * 0.55} ${y2 - uy * head - py * head * 0.55}`}
          fill="none" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" />
      ) : null}
      {packet && pt > 0 && pt < 1 ? (
        <g transform={`translate(${x1 + dx * pt},${y1 + dy * pt - 26})`}>
          <rect x={-16} y={-13} width={32} height={26} rx={7} fill={packetColor} stroke="#fff" strokeWidth={3.5} />
        </g>
      ) : null}
    </svg>
  );
};

const Sparkle: React.FC<{x: number; y: number; s?: number; color?: string}> = ({x, y, s = 1, color = YEL}) => (
  <svg width={54 * s} height={54 * s} style={{position: "absolute", left: x, top: y, overflow: "visible"}}>
    <path d="M 27 2 L 32 22 L 52 27 L 32 32 L 27 52 L 22 32 L 2 27 L 22 22 Z" fill={color} />
  </svg>
);

// 循环飞行数据包（直线或二次曲线路径，period 循环）
const LoopPacket: React.FC<{
  f: number; x1: number; y1: number; x2: number; y2: number; cx?: number; cy?: number;
  color?: string; start: number; period?: number; dur?: number; lift?: number; size?: number;
}> = ({f, x1, y1, x2, y2, cx, cy, color = BLUE, start, period = 56, dur = 26, lift = 0, size = 34}) => {
  if (f < start) return null;
  const raw = (f - start) % period;
  const t = raw / dur;
  if (t <= 0 || t >= 1) return null;
  let px: number, py: number;
  if (cx !== undefined && cy !== undefined) {
    px = (1-t)*(1-t)*x1 + 2*(1-t)*t*cx + t*t*x2;
    py = (1-t)*(1-t)*y1 + 2*(1-t)*t*cy + t*t*y2;
  } else {
    px = x1 + (x2-x1)*t;
    py = y1 + (y2-y1)*t - Math.sin(Math.PI*t)*lift;
  }
  return (
    <svg width={W} height={H} style={{position: "absolute", left: 0, top: 0, overflow: "visible", pointerEvents: "none"}}>
      <g transform={`translate(${px},${py})`}>
        <rect x={-size/2} y={-size*0.4} width={size} height={size*0.8} rx={8} fill={color} stroke="#fff" strokeWidth={3.5} />
        <circle cx={-size*0.18} cy={0} r={3.5} fill="#fff" opacity={0.9} />
        <circle cx={size*0.18} cy={0} r={3.5} fill="#fff" opacity={0.9} />
      </g>
    </svg>
  );
};

// 接力闭环：一颗包按 segs 顺序飞完整链路（请求两段蓝 + 响应两段绿），period 循环
const RelayTrip: React.FC<{
  f: number; start: number; period: number; segDur: number;
  segs: {x1: number; y1: number; x2: number; y2: number; cx?: number; cy?: number; color: string; at: number}[];
}> = ({f, start, period, segDur, segs}) => {
  if (f < start) return null;
  const t = (f - start) % period;
  const seg = segs.find((sg) => t >= sg.at && t < sg.at + segDur);
  if (!seg) return null;
  const p = ease((t - seg.at) / segDur);
  let px: number, py: number;
  if (seg.cx !== undefined && seg.cy !== undefined) {
    px = (1-p)*(1-p)*seg.x1 + 2*(1-p)*p*seg.cx + p*p*seg.x2;
    py = (1-p)*(1-p)*seg.y1 + 2*(1-p)*p*seg.cy + p*p*seg.y2;
  } else {
    px = seg.x1 + (seg.x2 - seg.x1) * p;
    py = seg.y1 + (seg.y2 - seg.y1) * p;
  }
  return (
    <svg width={W} height={H} style={{position: "absolute", left: 0, top: 0, overflow: "visible", pointerEvents: "none"}}>
      <g transform={`translate(${px},${py})`}>
        <rect x={-17} y={-14} width={34} height={28} rx={8} fill={seg.color} stroke="#fff" strokeWidth={3.5} />
        <circle cx={-6} cy={0} r={3.5} fill="#fff" opacity={0.9} />
        <circle cx={6} cy={0} r={3.5} fill="#fff" opacity={0.9} />
      </g>
    </svg>
  );
};

// 到达光圈：目标处扩散圆环
const FlashRing: React.FC<{f: number; at: number; x: number; y: number; color?: string}> = ({
  f, at, x, y, color = ORANGE,
}) => {
  const p = prog(f, at, 12);
  if (p <= 0 || p >= 1) return null;
  return (
    <svg width={W} height={H} style={{position: "absolute", left: 0, top: 0, overflow: "visible", pointerEvents: "none"}}>
      <circle cx={x} cy={y} r={22 + 46 * ease(p)} fill="none" stroke={color}
        strokeWidth={7 * (1 - p)} opacity={1 - p} />
    </svg>
  );
};

// ---------- 扁平图标库 ----------

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

const RouterIcon: React.FC<{x: number; y: number; s?: number}> = ({x, y, s = 1}) => (
  <svg width={150 * s} height={120 * s} style={{position: "absolute", left: x - 75 * s, top: y - 60 * s, overflow: "visible"}}>
    <g transform={`scale(${s})`}>
      <line x1={48} y1={40} x2={38} y2={6} stroke={INK} strokeWidth={6} strokeLinecap="round" />
      <line x1={82} y1={40} x2={92} y2={6} stroke={INK} strokeWidth={6} strokeLinecap="round" />
      <rect x={14} y={38} width={102} height={46} rx={12} fill="#3f4d5e" />
      <circle cx={38} cy={61} r={5} fill="#7ee0a3" />
      <circle cx={56} cy={61} r={5} fill="#f7c948" />
      <rect x={72} y={52} width={34} height={7} rx={3.5} fill="#9fb0c2" />
      <rect x={72} y={66} width={26} height={7} rx={3.5} fill="#9fb0c2" />
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

const HouseWifi: React.FC<{x: number; y: number; s?: number}> = ({x, y, s = 1}) => (
  <svg width={150 * s} height={150 * s} style={{position: "absolute", left: x - 75 * s, top: y - 75 * s, overflow: "visible"}}>
    <g transform={`scale(${s})`}>
      <path d="M 30 92 L 30 46 L 75 14 L 120 46 L 120 92 Z" fill="#fff" stroke={GREEN} strokeWidth={6} strokeLinejoin="round" />
      <rect x={62} y={60} width={26} height={32} rx={5} fill={GREEN_BG} stroke={GREEN} strokeWidth={4} />
      <path d="M 56 34 Q 75 14 94 34 M 63 24 Q 75 8 87 24" fill="none" stroke={GREEN} strokeWidth={5} strokeLinecap="round" />
      <circle cx={75} cy={40} r={4} fill={GREEN} />
    </g>
  </svg>
);

const CloudServer: React.FC<{x: number; y: number; s?: number}> = ({x, y, s = 1}) => (
  <svg width={170 * s} height={130 * s} style={{position: "absolute", left: x - 85 * s, top: y - 65 * s, overflow: "visible"}}>
    <g transform={`scale(${s})`}>
      <path d="M 42 96 Q 8 96 8 66 Q 8 40 34 38 Q 40 12 72 12 Q 102 12 110 36 Q 140 30 150 58 Q 162 96 124 96 Z"
        fill="#d9e8f7" stroke="#7aa6d0" strokeWidth={5} />
      <rect x={52} y={40} width={52} height={48} rx={8} fill="#fff" stroke="#55677c" strokeWidth={4.5} />
      <line x1={60} y1={54} x2={96} y2={54} stroke="#55677c" strokeWidth={4} />
      <line x1={60} y1={68} x2={96} y2={68} stroke="#55677c" strokeWidth={4} />
      <circle cx={66} cy={80} r={4} fill="#7ee0a3" />
    </g>
  </svg>
);

const LockIcon: React.FC<{x: number; y: number; s?: number}> = ({x, y, s = 1}) => (
  <svg width={100 * s} height={120 * s} style={{position: "absolute", left: x - 50 * s, top: y - 60 * s, overflow: "visible"}}>
    <g transform={`scale(${s})`}>
      <path d="M 30 42 L 30 28 Q 30 6 50 6 Q 70 6 70 28 L 70 42" fill="none" stroke={INK} strokeWidth={7} />
      <rect x={18} y={42} width={64} height={52} rx={10} fill={YEL} stroke={INK} strokeWidth={5} />
      <circle cx={50} cy={64} r={7} fill={INK} />
      <rect x={46} y={68} width={8} height={14} rx={4} fill={INK} />
    </g>
  </svg>
);

const PersonLaptop: React.FC<{x: number; y: number; s?: number}> = ({x, y, s = 1}) => (
  <svg width={170 * s} height={170 * s} style={{position: "absolute", left: x - 85 * s, top: y - 85 * s, overflow: "visible"}}>
    <g transform={`scale(${s})`}>
      <circle cx={62} cy={44} r={26} fill="#f6cfa4" stroke={INK} strokeWidth={4.5} />
      <path d="M 40 36 Q 62 18 84 36" fill="none" stroke={INK} strokeWidth={5} strokeLinecap="round" />
      <circle cx={54} cy={46} r={3.6} fill={INK} />
      <circle cx={70} cy={46} r={3.6} fill={INK} />
      <path d="M 56 56 Q 62 61 68 56" fill="none" stroke={INK} strokeWidth={3.6} strokeLinecap="round" />
      <rect x={38} y={74} width={48} height={52} rx={16} fill={BLUE} />
      <rect x={92} y={96} width={52} height={10} rx={5} fill="#55677c" />
      <rect x={98} y={70} width={40} height={28} rx={5} fill="#dbe4ee" stroke="#55677c" strokeWidth={4} />
    </g>
  </svg>
);

const DeskIcon: React.FC<{x: number; y: number; s?: number}> = ({x, y, s = 1}) => (
  <svg width={160 * s} height={130 * s} style={{position: "absolute", left: x - 80 * s, top: y - 65 * s, overflow: "visible"}}>
    <g transform={`scale(${s})`}>
      <circle cx={80} cy={34} r={22} fill="#f6cfa4" stroke={INK} strokeWidth={4.5} />
      <circle cx={72} cy={36} r={3.4} fill={INK} />
      <circle cx={88} cy={36} r={3.4} fill={INK} />
      <path d="M 73 45 Q 80 50 87 45" fill="none" stroke={INK} strokeWidth={3.4} strokeLinecap="round" />
      <path d="M 92 40 Q 106 46 100 58" fill="none" stroke={INK} strokeWidth={5} strokeLinecap="round" />
      <rect x={26} y={66} width={108} height={16} rx={8} fill={ORANGE} />
      <rect x={34} y={82} width={12} height={40} fill="#d9822b" />
      <rect x={114} y={82} width={12} height={40} fill="#d9822b" />
      <rect x={56} y={52} width={30} height={16} rx={4} fill="#fff" stroke={INK} strokeWidth={3.5} />
    </g>
  </svg>
);

const QuestionBig: React.FC<{x: number; y: number; s?: number}> = ({x, y, s = 1}) => (
  <svg width={170 * s} height={210 * s} style={{position: "absolute", left: x - 85 * s, top: y - 105 * s, overflow: "visible"}}>
    <text x={85} y={158} textAnchor="middle" fontFamily={F} fontWeight={900} fontSize={172}
      fill={YEL} stroke="#fff" strokeWidth={16} paintOrder="stroke">?</text>
  </svg>
);

const TargetIcon: React.FC<{x: number; y: number; s?: number}> = ({x, y, s = 1}) => (
  <svg width={70 * s} height={70 * s} style={{position: "absolute", left: x - 35 * s, top: y - 35 * s, overflow: "visible"}}>
    <circle cx={35} cy={35} r={30} fill="#fff" stroke={RED} strokeWidth={5} />
    <circle cx={35} cy={35} r={18} fill="none" stroke={RED} strokeWidth={5} />
    <circle cx={35} cy={35} r={7} fill={RED} />
  </svg>
);

const BulbFlat: React.FC<{x: number; y: number; s?: number}> = ({x, y, s = 1}) => (
  <svg width={80 * s} height={110 * s} style={{position: "absolute", left: x - 40 * s, top: y - 55 * s, overflow: "visible"}}>
    <circle cx={40} cy={44} r={30} fill={YEL} stroke={INK} strokeWidth={5} />
    <rect x={30} y={72} width={20} height={14} rx={5} fill="#d9a12c" />
    <path d="M 40 4 L 40 -6 M 76 22 L 86 14 M 4 22 L -6 14" stroke="#d9a12c" strokeWidth={5} strokeLinecap="round" />
  </svg>
);

const ScaleIcon: React.FC<{x: number; y: number; s?: number}> = ({x, y, s = 1}) => (
  <svg width={120 * s} height={110 * s} style={{position: "absolute", left: x - 60 * s, top: y - 55 * s, overflow: "visible"}}>
    <line x1={60} y1={16} x2={60} y2={86} stroke={INK} strokeWidth={6} strokeLinecap="round" />
    <line x1={14} y1={26} x2={106} y2={26} stroke={INK} strokeWidth={6} strokeLinecap="round" />
    <path d="M 4 26 L 14 48 L 24 26 Z" fill={BLUE} />
    <path d="M 96 26 L 106 48 L 116 26 Z" fill={GREEN} />
    <rect x={44} y={86} width={32} height={10} rx={5} fill={INK} />
  </svg>
);

const SignpostIcon: React.FC<{x: number; y: number; s?: number}> = ({x, y, s = 1}) => (
  <svg width={130 * s} height={130 * s} style={{position: "absolute", left: x - 65 * s, top: y - 65 * s, overflow: "visible"}}>
    <line x1={65} y1={26} x2={65} y2={118} stroke={INK} strokeWidth={7} strokeLinecap="round" />
    <rect x={8} y={30} width={84} height={26} rx={8} fill={BLUE} />
    <text x={50} y={50} textAnchor="middle" fontFamily={F} fontWeight={700} fontSize={18} fill="#fff">原理</text>
    <rect x={40} y={68} width={84} height={26} rx={8} fill={GREEN} />
    <text x={82} y={88} textAnchor="middle" fontFamily={F} fontWeight={700} fontSize={18} fill="#fff">场景</text>
  </svg>
);

const ChainIcon: React.FC<{x: number; y: number; s?: number}> = ({x, y, s = 1}) => (
  <svg width={230 * s} height={80 * s} style={{position: "absolute", left: x - 115 * s, top: y - 40 * s, overflow: "visible"}}>
    <circle cx={26} cy={40} r={16} fill="#dbe9fa" stroke={BLUE} strokeWidth={4} />
    <rect x={96} y={26} width={36} height={26} rx={7} fill="#3f4d5e" />
    <path d="M 158 62 L 158 48 L 178 34 L 198 48 L 198 62 Z" fill="#fff" stroke={GREEN} strokeWidth={4} />
    <line x1={48} y1={40} x2={90} y2={40} stroke={SUBC} strokeWidth={4} strokeDasharray="8 7" />
    <line x1={138} y1={40} x2={152} y2={42} stroke={SUBC} strokeWidth={4} strokeDasharray="8 7" />
  </svg>
);

const CrossBig: React.FC<{f: number; delay: number; x: number; y: number; s?: number}> = ({f, delay, x, y, s = 1}) => {
  const p = prog(f, delay, 10);
  if (p <= 0) return null;
  return (
    <svg width={170 * s} height={170 * s} style={{
      position: "absolute", left: x - 85 * s, top: y - 85 * s, overflow: "visible",
      transform: `scale(${0.6 + 0.4 * p})`, transformOrigin: "center",
    }}>
      <line x1={42} y1={42} x2={128} y2={128} stroke={RED} strokeWidth={22} strokeLinecap="round" />
      <line x1={128} y1={42} x2={42} y2={128} stroke={RED} strokeWidth={22} strokeLinecap="round" />
    </svg>
  );
};

// 页面标题（撞色块状 + 黄波浪）
const BigTitle: React.FC<{f: number; parts: {t: string; c: string}[]; y?: number; size?: number; delay?: number; noLine?: boolean}> = ({
  f, parts, y = 58, size = 88, delay = 0, noLine,
}) => {
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
        {noLine ? null : (
        <svg width={tw * 0.6} height={18} style={{position: "absolute", left: "50%", transform: "translateX(-50%)", bottom: -14, overflow: "visible"}}>
          <path d={`M 4 9 ${Array.from({length: Math.round(tw * 0.6 / 36)}).map((_, i) => `q 9 -10 18 0 q 9 10 18 0`).join(" ")}`}
            fill="none" stroke={YEL} strokeWidth={7} strokeLinecap="round" opacity={prog(f, delay + 6, 10)} />
        </svg>)}
      </div>
    </div>
  );
};

const CornerMark: React.FC = () => (
  <div style={{
    position: "absolute", top: 48, right: 70, zIndex: 40,
    backgroundColor: "#fff", border: `3px solid ${BLUE}`, borderRadius: 999,
    padding: "8px 26px", fontFamily: F, fontWeight: 900, fontSize: 28, color: INK, letterSpacing: 6,
  }}>小秋</div>
);

const Subtitle: React.FC = () => {
  const frame = useCurrentFrame();
  const cur = subs.find((s) => frame >= s.s && frame < s.e);
  if (!cur) return null;
  return (
    <div style={{position: "absolute", bottom: 32, left: 0, right: 0, display: "flex", justifyContent: "center", zIndex: 50}}>
      <div style={{
        backgroundColor: "rgba(12,14,18,0.8)", borderRadius: 16, padding: "12px 34px",
        fontFamily: F, fontWeight: 700, fontSize: 46, color: "#fff", letterSpacing: 2, whiteSpace: "nowrap",
      }}>{cur.t}</div>
    </div>
  );
};

// ============ 页面 ============

// P1 封面总览（第 0 帧完整静态）
const PageCover: React.FC<{off: number}> = ({off}) => {
  const f = useCurrentFrame() - off;
  return (
    <AbsoluteFill>
      <BigTitle f={f} delay={-99} y={64} parts={[
        {t: "端口映射", c: BLUE}, {t: " 与 ", c: INK}, {t: "内网穿透", c: GREEN},
      ]} />
      <Sparkle x={500} y={62} />
      <Sparkle x={1395} y={95} s={0.8} color="#b8d4f2" />

      <FlatCard f={f} delay={-99} x={165} y={252} w={665} h={505} chip="端口映射" chipColor={BLUE} />
      <Pill f={f} delay={-99} x={330} y={318} w={340} h={56} bg="#fff" border={`3px dashed ${BLUE}`} text="固定IP + 端口映射" color={BLUE} ts={26} />
      <Globe x={305} y={475} />
      <RouterIcon x={505} y={468} />
      <ServerIcon x={700} y={462} />
      <FlatArrow f={f} x1={365} y1={475} x2={432} y2={472} delay={-99} color={BLUE} sw={6} />
      <FlatArrow f={f} x1={568} y1={472} x2={640} y2={468} delay={-99} color={BLUE} sw={6} />
      <div style={{position: "absolute", left: 245, top: 548, width: 120, textAlign: "center", fontFamily: F, fontSize: 25, color: INK, fontWeight: 700}}>互联网</div>
      <div style={{position: "absolute", left: 425, top: 548, width: 160, textAlign: "center", fontFamily: F, fontSize: 25, color: INK, fontWeight: 700}}>路由器网关</div>
      <div style={{position: "absolute", left: 640, top: 548, width: 120, textAlign: "center", fontFamily: F, fontSize: 25, color: INK, fontWeight: 700}}>内网服务</div>
      <div style={{
        position: "absolute", left: 205, top: 616, width: 585, height: 108, borderRadius: 18,
        backgroundColor: BLUE_BG, display: "flex", alignItems: "center", paddingLeft: 24,
      }}>
        <TargetIcon x={275} y={670} s={0.95} />
        <div style={{marginLeft: 26, fontFamily: F, fontSize: 30, color: INK, lineHeight: 1.5, fontWeight: 700}}>
          通过路由器将外部请求<br/>转发到内网指定服务
        </div>
      </div>

      <FlatCard f={f} delay={-99} x={1090} y={252} w={665} h={505} chip="内网穿透" chipColor={GREEN} />
      <Pill f={f} delay={-99} x={1255} y={318} w={340} h={56} bg="#fff" border={`3px dashed ${GREEN}`} text="无公网IP 也能穿透" color={GREEN} ts={26} />
      <Globe x={1232} y={475} c={GREEN} />
      <CloudServer x={1422} y={470} />
      <HouseWifi x={1618} y={470} />
      <FlatArrow f={f} x1={1292} y1={475} x2={1338} y2={472} delay={-99} color={GREEN} dashed sw={6} />
      <FlatArrow f={f} x1={1508} y1={472} x2={1552} y2={470} delay={-99} color={GREEN} dashed sw={6} />
      <div style={{position: "absolute", left: 1172, top: 548, width: 120, textAlign: "center", fontFamily: F, fontSize: 25, color: INK, fontWeight: 700}}>互联网</div>
      <div style={{position: "absolute", left: 1342, top: 548, width: 160, textAlign: "center", fontFamily: F, fontSize: 25, color: INK, fontWeight: 700}}>穿透服务端</div>
      <div style={{position: "absolute", left: 1558, top: 548, width: 120, textAlign: "center", fontFamily: F, fontSize: 25, color: INK, fontWeight: 700}}>内网设备</div>
      <div style={{
        position: "absolute", left: 1130, top: 616, width: 585, height: 108, borderRadius: 18,
        backgroundColor: GREEN_BG, display: "flex", alignItems: "center", paddingLeft: 24,
      }}>
        <TargetIcon x={1200} y={670} s={0.95} />
        <div style={{marginLeft: 26, fontFamily: F, fontSize: 30, color: INK, lineHeight: 1.5, fontWeight: 700}}>
          通过第三方中转服务<br/>实现内外网互通
        </div>
      </div>

      <QuestionBig x={958} y={420} s={0.92} />
      <Pill f={f} delay={-99} x={842} y={540} w={235} h={66} bg={ORANGE} text="如何选择？" color="#fff" ts={36} />
      <SignpostIcon x={958} y={680} s={0.85} />

      {[
        {x: 205, ic: <BulbFlat x={285} y={851} s={0.85}/>, chip: "原理", cc: BLUE, d: "两种方案的工作机制"},
        {x: 740, ic: <ScaleIcon x={820} y={854} s={0.85}/>, chip: "对比", cc: ORANGE, d: "优缺点 · 成本 · 稳定性"},
        {x: 1275, ic: <SignpostIcon x={1355} y={857} s={0.8}/>, chip: "场景", cc: GREEN, d: "按需求选更合适的方案"},
      ].map((r, i) => (
        <div key={i}>
          <div style={{
            position: "absolute", left: r.x, top: 770, width: 440, height: 158,
            backgroundColor: "#fff", border: `3px solid ${BORDER}`, borderRadius: 22,
            boxShadow: "0 8px 20px rgba(47,58,69,0.06)",
          }} />
          {r.ic}
          <div style={{position: "absolute", left: r.x + 160, top: 810}}>
            <span style={{
              display: "inline-block", backgroundColor: r.cc, color: "#fff", borderRadius: 999,
              padding: "5px 24px", fontSize: 28, fontWeight: 900, fontFamily: F,
            }}>{r.chip}</span>
            <div style={{marginTop: 12, fontFamily: F, fontSize: 26, color: SUBC, whiteSpace: "nowrap"}}>{r.d}</div>
          </div>
        </div>
      ))}
    </AbsoluteFill>
  );
};

// P2 端口映射原理 + 前台类比
const PagePrinciple: React.FC<{off: number}> = ({off}) => {
  const f = useCurrentFrame() - off;
  return (
    <AbsoluteFill>
      <BigTitle f={f} delay={0} y={54} parts={[
        {t: "端口映射", c: BLUE}, {t: "原理", c: ORANGE},
      ]} />
      <Pill f={f} delay={10} x={760} y={196} w={400} h={64} bg={ORANGE_BG} text="路由器 · 对外窗口" color={ORANGE} ts={32} />
      <PopAt f={f} delay={6} x={800} y={300} w={320} h={300}>
        <RouterIcon x={160} y={150} s={2.1} />
      </PopAt>
      <FlatCard f={f} delay={14} x={120} y={330} w={340} h={230} fill={BLUE_BG}>
        <Globe x={170} y={85} s={0.95} />
        <div style={{position: "absolute", left: 0, top: 140, width: 340, textAlign: "center", fontFamily: F, fontSize: 36, fontWeight: 900, color: INK}}>公网IP</div>
        <div style={{position: "absolute", left: 0, top: 186, width: 340, textAlign: "center", fontFamily: F, fontSize: 26, color: SUBC}}>全球可访问的公网地址</div>
      </FlatCard>
      <FlatCard f={f} delay={20} x={1460} y={330} w={340} h={230} fill={GREEN_BG}>
        <ServerIcon x={170} y={80} s={1.1} />
        <div style={{position: "absolute", left: 0, top: 140, width: 340, textAlign: "center", fontFamily: F, fontSize: 36, fontWeight: 900, color: INK}}>内网服务</div>
        <div style={{position: "absolute", left: 0, top: 186, width: 340, textAlign: "center", fontFamily: F, fontSize: 26, color: SUBC}}>监听 80 端口</div>
      </FlatCard>
      <div style={{position: "absolute", left: 470, top: 380, fontFamily: F, fontSize: 27, color: BLUE, fontWeight: 700, opacity: prog(f, 30, 10), whiteSpace: "nowrap"}}>访问 公网IP:8080</div>
      <div style={{position: "absolute", left: 1190, top: 380, fontFamily: F, fontSize: 27, color: GREEN, fontWeight: 700, opacity: prog(f, 44, 10), whiteSpace: "nowrap"}}>转发 192.168.x.x:80</div>
      {/* 双车道：上线=请求（蓝，去程），下线=响应（绿，回程） */}
      <FlatArrow f={f} x1={478} y1={424} x2={790} y2={424} delay={28} color={BLUE} sw={6} />
      <FlatArrow f={f} x1={790} y1={462} x2={478} y2={462} delay={52} color={GREEN} sw={6} />
      <FlatArrow f={f} x1={1128} y1={424} x2={1445} y2={424} delay={44} color={BLUE} sw={6} />
      <FlatArrow f={f} x1={1445} y1={462} x2={1128} y2={462} delay={58} color={GREEN} sw={6} />
      <div style={{position: "absolute", left: 556, top: 392, width: 160, textAlign: "center", fontFamily: F, fontSize: 22, color: BLUE, fontWeight: 900, opacity: prog(f, 56, 8)}}>请求 ➜</div>
      <div style={{position: "absolute", left: 556, top: 476, width: 160, textAlign: "center", fontFamily: F, fontSize: 22, color: GREEN, fontWeight: 900, opacity: prog(f, 60, 8)}}>➜ 响应</div>
      {/* 循环数据包：每 2 秒一颗，蓝去绿回交替 */}
      <LoopPacket f={f} x1={500} y1={416} x2={770} y2={416} color={BLUE} start={60} period={60} dur={26} lift={12} size={30} />
      <LoopPacket f={f} x1={1150} y1={416} x2={1425} y2={416} color={BLUE} start={70} period={60} dur={26} lift={12} size={30} />
      <LoopPacket f={f} x1={1425} y1={470} x2={1150} y2={470} color={GREEN} start={90} period={60} dur={26} lift={12} size={30} />
      <LoopPacket f={f} x1={770} y1={470} x2={500} y2={470} color={GREEN} start={100} period={60} dur={26} lift={12} size={30} />

      <div style={{
        position: "absolute", left: 705, top: 628, width: 510, height: 96, borderRadius: 20,
        backgroundColor: YEL, display: "flex", alignItems: "center", justifyContent: "center",
        opacity: prog(f, 52, 10), transform: `scale(${0.9 + 0.1 * ease(prog(f, 52, 10))})`,
      }}>
        <span style={{fontFamily: MONO, fontSize: 52, fontWeight: 900, color: INK}}>80</span>
        <span style={{margin: "0 26px", fontSize: 40, color: INK, fontWeight: 900}}>➜</span>
        <span style={{fontFamily: MONO, fontSize: 52, fontWeight: 900, color: "#a3650a"}}>8080</span>
      </div>
      <div style={{position: "absolute", left: 705, top: 730, width: 510, display: "flex", justifyContent: "space-between", padding: "0 60px", fontFamily: F, fontSize: 26, color: SUBC, opacity: prog(f, 58, 10)}}>
        <span>公网端口</span><span>内网端口</span>
      </div>

      <FlatCard f={f} delay={216} x={160} y={768} w={1600} h={168} fill={ORANGE_BG}>
        <DeskIcon x={175} y={78} s={0.98} />
        <div style={{position: "absolute", left: 280, top: 24, fontFamily: F, fontSize: 30, fontWeight: 900, color: ORANGE}}>类比：公司前台</div>
        {[
          {x: 270, t: "外线电话打总机 8080", d: 240},
          {x: 690, t: "前台查转接表", d: 252},
          {x: 1080, t: "转给内部分机 80", d: 264},
        ].map((c, i) => (
          <div key={i}>
            <div style={{
              position: "absolute", left: c.x, top: 64, width: 360, height: 74, borderRadius: 16,
              backgroundColor: "#fff", border: `3px solid ${BORDER}`,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontFamily: F, fontSize: 29, fontWeight: 700, color: INK,
              opacity: prog(f, c.d, 10), transform: `translateY(${(1 - prog(f, c.d, 10)) * 14}px)`,
            }}>{c.t}</div>
            {i < 2 ? (
              <div style={{position: "absolute", left: c.x + 372, top: 88, fontSize: 38, color: ORANGE, fontWeight: 900, opacity: prog(f, c.d + 8, 8)}}>➜</div>
            ) : null}
          </div>
        ))}
      </FlatCard>
    </AbsoluteFill>
  );
};

// P3 硬性前提
const PagePremise: React.FC<{off: number}> = ({off}) => {
  const f = useCurrentFrame() - off;
  // 红叉砸落时的页面轻震
  const sh = f >= 38 && f < 64
    ? Math.sin((f - 38) * 1.9) * (1 - (f - 38) / 26) * 7
    : 0;
  const prob = (x: number, y: number, no: string, chip: string, icon: React.ReactNode, d: number, desc: string) => (
    <FlatCard f={f} delay={d} x={x} y={y} w={480} h={250} fill="#fff">
      <div style={{position: "absolute", left: 24, top: 14, display: "flex", alignItems: "center", gap: 14}}>
        <span style={{
          backgroundColor: RED, color: "#fff", borderRadius: 999, minWidth: 46, height: 46,
          display: "inline-flex", alignItems: "center", justifyContent: "center",
          fontSize: 27, fontWeight: 900, fontFamily: F,
        }}>{no}</span>
        <span style={{fontFamily: F, fontSize: 36, fontWeight: 900, color: INK}}>{chip}</span>
        <span style={{marginLeft: "auto", marginRight: 18, fontSize: 46, color: RED, fontWeight: 900, opacity: prog(f, d + 14, 8), transform: `rotate(${prog(f, d + 14, 8) * -8}deg)`, display: "inline-block"}}>✗</span>
      </div>
      <div style={{position: "absolute", left: 24, top: 88, width: 240, height: 130, opacity: prog(f, d + 8, 8)}}>
        {icon}
      </div>
      <div style={{position: "absolute", left: 26, top: 202, fontFamily: F, fontSize: 29, color: SUBC, whiteSpace: "nowrap"}}>{desc}</div>
    </FlatCard>
  );
  return (
    <AbsoluteFill style={{transform: `translate(${sh}px, ${Math.abs(sh) * 0.4}px)`}}>
      <BigTitle f={f} delay={0} y={54} parts={[
        {t: "端口映射的", c: INK}, {t: "硬性前提", c: RED},
      ]} />
      <Pill f={f} delay={8} x={430} y={186} w={1060} h={76} bg={RED_BG} border={`3px solid ${RED}`} text="需要真正的公网 IP，否则配置等于白费！" color={RED} ts={38} />
      <PopAt f={f} delay={14} x={830} y={420} w={260} h={260}>
        <Globe x={130} y={130} s={2.0} />
      </PopAt>
      {/* 红叉砸落后持续轻晃，页面保持活感 */}
      <div style={{position: "absolute", left: 0, top: 0, width: W, height: H,
        transform: `rotate(${f >= 42 ? Math.sin(f / 9) * 1.4 : 0}deg)`, transformOrigin: "960px 430px"}}>
        <CrossBig f={f} delay={30} x={960} y={430} s={0.95} />
      </div>
      <Sparkle x={760} y={300} color="#f3b0b0" />
      <Sparkle x={1180} y={560} s={0.7} color="#f3b0b0" />
      {prob(140, 350, "1", "运营商级 NAT",
        <ChainIcon x={110} y={62} s={0.68} />, 16, "层层转发，无法直达")}
      {prob(1300, 350, "2", "端口封锁",
        <LockIcon x={105} y={62} s={0.78} />, 24, "常用端口被阻断")}
      {prob(720, 676, "3", "多层路由",
        <ChainIcon x={110} y={62} s={0.68} />, 32, "每一层都要单独设置")}
    </AbsoluteFill>
  );
};

// P4 内网穿透核心思路
const PageTunnel: React.FC<{off: number}> = ({off}) => {
  const f = useCurrentFrame() - off;
  const tunT = prog(f, 200, 40);
  return (
    <AbsoluteFill>
      <BigTitle f={f} delay={0} y={54} parts={[
        {t: "内网穿透", c: BLUE}, {t: " · 核心思路", c: INK},
      ]} />
      <Pill f={f} delay={8} x={330} y={172} w={1260} h={86} bg="#f6f8fa" text="设备主动连公网服务器，建立加密隧道，外部从服务器进" color={INK} ts={33} />

      {/* 悬崖地形 */}
      <svg width={W} height={H} style={{position: "absolute", left: 0, top: 0, overflow: "visible", pointerEvents: "none"}}>
        <path d={`M 60 720 L 480 720 Q 560 760 620 860 L 620 920 L 60 920 Z`} fill="#cfe8cf" opacity={prog(f, 10, 10)} />
        <path d={`M 1860 720 L 1440 720 Q 1360 760 1300 860 L 1300 920 L 1860 920 Z`} fill="#cfe8cf" opacity={prog(f, 10, 10)} />
        <path d={`M 620 860 Q 960 960 1300 860 L 1300 920 L 620 920 Z`} fill="#b9d8f2" opacity={prog(f, 12, 10)} />
        <path d={`M 660 862 Q 960 772 1260 862`} fill="none" stroke="#c9a06a" strokeWidth={13} strokeLinecap="round" opacity={prog(f, 40, 12)} />
      </svg>

      <PopAt f={f} delay={14} x={200} y={430} w={260} h={260}>
        <PersonLaptop x={130} y={130} s={1.35} />
      </PopAt>
      <div style={{position: "absolute", left: 165, top: 620, width: 260, textAlign: "center", fontFamily: F, fontSize: 29, fontWeight: 700, color: INK, opacity: prog(f, 20, 8)}}>外部用户</div>
      <div style={{position: "absolute", left: 145, top: 662, width: 310, textAlign: "center", fontFamily: F, fontSize: 25, color: SUBC, opacity: prog(f, 24, 8)}}>（没有公网 IP）</div>

      <PopAt f={f} delay={26} x={830} y={400} w={260} h={300}>
        <ServerIcon x={130} y={150} s={1.6} c="#4a5c72" />
      </PopAt>
      <Pill f={f} delay={32} x={835} y={278} w={250} h={60} bg={ORANGE_BG} text="中转服务器 · 公网" color={ORANGE} ts={26} />
      <PopAt f={f} delay={38} x={1560} y={430} w={240} h={260}>
        <HouseWifi x={120} y={130} s={1.5} />
      </PopAt>
      <div style={{position: "absolute", left: 1495, top: 620, width: 260, textAlign: "center", fontFamily: F, fontSize: 29, fontWeight: 700, color: INK, opacity: prog(f, 44, 8)}}>内网设备</div>
      <div style={{position: "absolute", left: 1475, top: 662, width: 300, textAlign: "center", fontFamily: F, fontSize: 25, color: SUBC, opacity: prog(f, 48, 8)}}>（主动连出）</div>

      {/* 正确入口：外部用户先访问公网中转服务器 */}
      <FlatArrow f={f} x1={410} y1={510} x2={825} y2={500} delay={92} color={BLUE} sw={8} />
      <Pill f={f} delay={104} x={450} y={428} w={290} h={54} bg={BLUE_BG} text="访问公网服务器" color={BLUE} ts={25} />
      {/* 直连内网设备会失败：红色虚线只做对照，不与正确入口混淆 */}
      <FlatArrow f={f} x1={410} y1={708} x2={1510} y2={708} delay={46} color={RED} dashed sw={5} />
      <div style={{position: "absolute", left: 690, top: 672, width: 420, textAlign: "center", fontFamily: F, fontSize: 25, color: RED, fontWeight: 700, opacity: prog(f, 46, 10), whiteSpace: "nowrap"}}>不能直连内网设备</div>
      <CrossBig f={f} delay={50} x={1280} y={708} s={0.42} />
      <svg width={W} height={H} style={{position: "absolute", left: 0, top: 0, overflow: "visible", pointerEvents: "none"}}>
        <path d={`M 1470 430 Q 1250 330 1075 405`} fill="none" stroke={GREEN} strokeWidth={12} strokeLinecap="round"
          strokeDasharray="1 1" pathLength={1}
          strokeDashoffset={1 - prog(f, 100, 26)} opacity={prog(f, 100, 4)} />
        <g transform={`translate(1075 405)`} opacity={prog(f, 122, 6)}>
          <path d="M -30 -18 L 4 0 L -30 18" fill="none" stroke={GREEN} strokeWidth={12} strokeLinecap="round" strokeLinejoin="round" />
        </g>
        {tunT > 0 && tunT < 1 ? (
          <g transform={`translate(${1470 + (1075 - 1470) * tunT},${430 + (405 - 430) * tunT - 40})`}>
            <rect x={-17} y={-14} width={34} height={28} rx={8} fill={GREEN} stroke="#fff" strokeWidth={4} />
            <text x={0} y={7} textAnchor="middle" fontSize={20} fill="#fff" fontFamily={F} fontWeight={900}>🔒</text>
          </g>
        ) : null}
      </svg>
      <Pill f={f} delay={130} x={1160} y={276} w={330} h={60} bg={GREEN_BG} text="主动连接 · 建立隧道" color={GREEN} ts={26} />
      {/* 完整闭环循环：外部用户 → 中转服务器 → 隧道 → 内网设备，再原路返回 */}
      <RelayTrip f={f} start={140} period={88} segDur={17} segs={[
        {x1: 380, y1: 512, x2: 878, y2: 498, color: BLUE, at: 0},
        {x1: 1075, y1: 415, x2: 1470, y2: 430, cx: 1250, cy: 318, color: BLUE, at: 22},
        {x1: 1470, y1: 430, x2: 1075, y2: 415, cx: 1250, cy: 318, color: GREEN, at: 44},
        {x1: 878, y1: 498, x2: 380, y2: 512, color: GREEN, at: 66},
      ]} />
      <FlashRing f={f} at={179} x={1470} y={430} color={GREEN} />
      <FlashRing f={f} at={223} x={380} y={512} color={BLUE} />
      <Pill f={f} delay={215} x={790} y={852} w={340} h={66} bg="#fff" border={`3px solid ${INK}`} text="加密隧道 · 安全中转" color={INK} ts={28} />

      <FlatCard f={f} delay={225} x={250} y={804} w={480} h={110} fill={GREEN_BG}>
        <div style={{position: "absolute", left: 0, top: 0, width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: F, fontSize: 34, fontWeight: 900, color: GREEN}}>✓ 不需要公网 IP</div>
      </FlatCard>
      <FlatCard f={f} delay={240} x={1190} y={804} w={480} h={110} fill={GREEN_BG}>
        <div style={{position: "absolute", left: 0, top: 0, width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: F, fontSize: 34, fontWeight: 900, color: GREEN}}>✓ 不用动路由器</div>
      </FlatCard>
    </AbsoluteFill>
  );
};

// P5 核心区别 + 怎么选
// 决策探路球：橙点从问号卡出发，左右分支交替滑到结果卡，到达弹光圈
const PathProbe: React.FC<{f: number}> = ({f}) => {
  const start = 272, round = 120, fly = 0.4;
  if (f < start) return null;
  const tf = f - start;
  const roundIdx = Math.floor(tf / round);
  const left = roundIdx % 2 === 0;
  const t = (tf % round) / round;
  const x1 = 960, y1 = 544;
  // 到达箭头尖端上方，脉冲不遮挡结果卡正文
  const x2 = left ? 560 : 1360, y2 = 690;
  const cx = left ? 660 : 1260, cy = 630;
  const bez = (p: number) => ({
    x: (1-p)*(1-p)*x1 + 2*(1-p)*p*cx + p*p*x2,
    y: (1-p)*(1-p)*y1 + 2*(1-p)*p*cy + p*p*y2,
  });
  return (
    <svg width={W} height={H} style={{position: "absolute", left: 0, top: 0, overflow: "visible", pointerEvents: "none"}}>
      {t < fly ? [0.12, 0.06, 0].map((lag, i) => {
        const p = Math.max(0, ease(t / fly) - lag);
        const pos = bez(p);
        const r = 13 - i * 3;
        return (
          <circle key={i} cx={pos.x} cy={pos.y} r={r} fill={ORANGE}
            opacity={i === 0 ? 1 : 0.32 - i * 0.1} stroke="#fff" strokeWidth={i === 0 ? 3.5 : 0} />
        );
      }) : null}
      {t >= fly && t < fly + 0.15 ? (() => {
        const p2 = (t - fly) / 0.15;
        return <circle cx={x2} cy={y2} r={20 + 42 * ease(p2)} fill="none"
          stroke={left ? BLUE : ORANGE} strokeWidth={7 * (1 - p2)} opacity={1 - p2} />;
      })() : null}
    </svg>
  );
};

const PageCompare: React.FC<{off: number}> = ({off}) => {
  const f = useCurrentFrame() - off;
  return (
    <AbsoluteFill>
      <BigTitle f={f} delay={0} y={50} noLine parts={[
        {t: "一句话分清", c: INK}, {t: " + 怎么选", c: ORANGE},
      ]} />
      <FlatCard f={f} delay={8} x={130} y={172} w={820} h={230} fill={BLUE_BG}>
        <div style={{position: "absolute", left: 40, top: 44, fontFamily: F, fontSize: 46, fontWeight: 900, color: INK}}>
          端口映射 <span style={{color: BLUE}}>＝ 直接把门打开</span>
        </div>
        <div style={{position: "absolute", left: 42, top: 140, fontFamily: F, fontSize: 29, color: SUBC, whiteSpace: "nowrap"}}>路由器做地址翻译，流量不经过第三方</div>
      </FlatCard>
      <FlatCard f={f} delay={22} x={970} y={172} w={820} h={230} fill={GREEN_BG}>
        <div style={{position: "absolute", left: 40, top: 44, fontFamily: F, fontSize: 46, fontWeight: 900, color: INK}}>
          内网穿透 <span style={{color: GREEN}}>＝ 中间人传话</span>
        </div>
        <div style={{position: "absolute", left: 42, top: 140, fontFamily: F, fontSize: 29, color: SUBC, whiteSpace: "nowrap"}}>公网服务器做中转，流量走加密隧道</div>
      </FlatCard>

      <PopAt f={f} delay={240} x={660} y={496} w={600} h={96}>
        <div style={{
          width: "100%", height: "100%", backgroundColor: "#fff", border: `3px solid ${INK}`,
          borderRadius: 999, display: "flex", alignItems: "center", justifyContent: "center",
          fontFamily: F, fontSize: 42, fontWeight: 900, color: INK,
          transform: `translateY(${f >= 252 ? Math.sin(f / 20) * 6 : 0}px)`,
        }}>？ 你有公网 IP 吗？</div>
      </PopAt>
      <FlatArrow f={f} x1={800} y1={600} x2={560} y2={700} delay={258} color={GREEN} sw={8} />
      <FlatArrow f={f} x1={1120} y1={600} x2={1360} y2={700} delay={258} color={RED} sw={8} />
      <Pill f={f} delay={268} x={490} y={622} w={130} h={58} bg={GREEN} text="有 ✓" color="#fff" ts={32} />
      <Pill f={f} delay={268} x={1300} y={622} w={160} h={58} bg={RED} text="没有 ✗" color="#fff" ts={32} />

      <FlatCard f={f} delay={276} x={130} y={706} w={820} h={230} fill={BLUE_BG}>
        <div style={{position: "absolute", left: 40, top: 36, fontFamily: F, fontSize: 42, fontWeight: 900, color: BLUE}}>选 端口映射</div>
        <div style={{position: "absolute", left: 42, top: 112, fontFamily: F, fontSize: 31, color: INK, fontWeight: 700}}>速度快 · 延迟低</div>
        <div style={{position: "absolute", left: 42, top: 168, fontFamily: F, fontSize: 27, color: SUBC, whiteSpace: "nowrap"}}>需要配置路由器，注意安全防护</div>
      </FlatCard>
      <FlatCard f={f} delay={396} x={970} y={706} w={820} h={230} fill={ORANGE_BG}>
        <div style={{position: "absolute", left: 40, top: 36, fontFamily: F, fontSize: 42, fontWeight: 900, color: ORANGE}}>选 内网穿透</div>
        <div style={{position: "absolute", left: 42, top: 112, fontFamily: F, fontSize: 31, color: INK, fontWeight: 700}}>零配置 · 更易落地</div>
        <div style={{position: "absolute", left: 42, top: 168, fontFamily: F, fontSize: 27, color: SUBC, whiteSpace: "nowrap"}}>流量经中转稍慢，敏感信息要加密</div>
      </FlatCard>
      {/* 放在结果卡之后，探路球和到达光圈显示在卡片上层 */}
      <PathProbe f={f} />
    </AbsoluteFill>
  );
};

// P6 CTA
const PageOutro: React.FC<{off: number}> = ({off}) => {
  const f = useCurrentFrame() - off;
  return (
    <AbsoluteFill>
      <div style={{position: "absolute", inset: 0, transform: "translateY(-30px)"}}>
      <div style={{
        position: "absolute", top: 236, left: 0, right: 0, textAlign: "center",
        fontFamily: F, fontSize: 84, fontWeight: 900, color: INK, whiteSpace: "nowrap",
        opacity: prog(f, 4, 12),
      }}>
        端口映射 <span style={{color: BLUE}}>＝ 直接开门</span>
      </div>
      <div style={{
        position: "absolute", top: 372, left: 0, right: 0, textAlign: "center",
        fontFamily: F, fontSize: 84, fontWeight: 900, color: INK, whiteSpace: "nowrap",
        opacity: prog(f, 18, 12),
      }}>
        内网穿透 <span style={{color: GREEN}}>＝ 中间人传话</span>
      </div>
      <BulbFlat x={1470} y={300} s={1.5} />
      <Pill f={f} delay={62} x={460} y={548} w={1000} h={110} bg={ORANGE_BG} border={`3px solid ${ORANGE}`}
        text="先看有没有公网 IP，再选方案" color={ORANGE} ts={46} />
      <div style={{
        position: "absolute", top: 724, left: 0, right: 0, textAlign: "center",
        fontFamily: F, fontSize: 62, fontWeight: 900, color: INK, opacity: prog(f, 108, 12),
      }}>
        学会了就<span style={{color: ORANGE}}>点个赞</span>！
      </div>
      <Sticker f={f} delay={140} x={460} y={812} w={1000} h={110} title="下期：手把手用 frp 搭一条自己的隧道" ts={38} color={GREEN} />
      <div style={{
        position: "absolute", top: 680, left: 0, right: 0, textAlign: "center",
        fontFamily: F, fontSize: 30, color: SUBC, letterSpacing: 4, opacity: 0.8 * prog(f, 160, 10),
      }}>小秋 · 0 基础也能学会</div>
      </div>
    </AbsoluteFill>
  );
};

// 结尾贴纸（本文件内复用）
const Sticker: React.FC<{
  f: number; delay: number; x: number; y: number; w: number; h: number; title: string;
  color?: string; ts?: number;
}> = ({f, delay, x, y, w, h, title, color = GREEN, ts = 38}) => {
  const p = prog(f, delay);
  if (p <= 0) return null;
  return (
    <div style={{
      position: "absolute", left: x, top: y, width: w, height: h,
      backgroundColor: "#fff", border: `4px dashed ${color}`, borderRadius: 20,
      display: "flex", alignItems: "center", justifyContent: "center",
      fontFamily: F, fontWeight: 900, fontSize: ts, color: INK,
      opacity: p, transform: `scale(${0.9 + 0.1 * p})`,
    }}>{title}</div>
  );
};

const PAGES = [
  {C: PageCover, start: 0, end: 190},
  {C: PagePrinciple, start: 190, end: 655},
  {C: PagePremise, start: 655, end: 910},
  {C: PageTunnel, start: 910, end: 1175},
  {C: PageCompare, start: 1175, end: 1662},
  {C: PageOutro, start: 1662, end: DUR},
];

const PageTurn: React.FC<{
  children: React.ReactNode; off: number; len: number; first: boolean; last: boolean;
}> = ({children, off, len, first, last}) => {
  const frame = useCurrentFrame();
  const oIn = first ? 1 : interpolate(frame, [0, 10], [0, 1], clamp);
  const lf = frame - off;
  const oOut = last ? 1 : interpolate(lf, [len - 10, len], [1, 0], clamp);
  return <AbsoluteFill style={{opacity: Math.min(oIn, oOut)}}>{children}</AbsoluteFill>;
};

export const PortMapVsTunnel: React.FC = () => {
  const frame = useCurrentFrame();
  const bedVolume = interpolate(frame, [0, 20, DUR - 40, DUR - 6], [0, 0.07, 0.07, 0], clamp);
  return (
    <AbsoluteFill style={{
      background: "linear-gradient(180deg, #ffffff 0%, #f3f6f9 100%)",
      fontFamily: F, overflow: "hidden",
    }}>
      {PAGES.map(({C, start, end}, i) => {
        const first = i === 0, last = i === PAGES.length - 1;
        const len = end - start;
        const off = first ? 0 : 10;
        return (
          <Sequence key={i} from={first ? 0 : start - 10} durationInFrames={len + 12}>
            <PageTurn off={off} len={len} first={first} last={last}>
              <C off={off} />
            </PageTurn>
          </Sequence>
        );
      })}
      <CornerMark />
      {voiceLines.map((s) => (
        <Sequence key={`vo-${s.index}`} from={s.start} durationInFrames={s.end - s.start + 30}>
          <Audio src={staticFile(`audio/portmap-tts/${s.audio}`)} volume={1} />
        </Sequence>
      ))}
      {/* ---- 音效层 ---- */}
      {/* 翻页 */}
      {[190, 655, 910, 1175, 1662].map((t) => (
        <Sequence key={`pt-${t}`} from={t - 6} durationInFrames={24}>
          <Audio src={staticFile("audio/sfx/transfer.wav")} volume={0.15} />
        </Sequence>
      ))}
      {/* P2 数据包循环起飞 whoosh（蓝去/绿回交替，每颗一发） */}
      {[250, 310, 370, 430, 490, 550, 610, 280, 340, 400, 460, 520, 580].map((t) => (
        <Sequence key={`wh2-${t}`} from={t} durationInFrames={12}>
          <Audio src={staticFile("audio/sfx/whoosh.wav")} volume={0.09} />
        </Sequence>
      ))}
      {/* P3 红叉砸落 error + 页面震动 */}
      <Sequence from={685} durationInFrames={26}>
        <Audio src={staticFile("audio/sfx/error.wav")} volume={0.5} />
      </Sequence>
      {/* P4 接力包每段起飞 whoosh + 到达设备/用户 click */}
      {[1050, 1072, 1098, 1120, 1138, 1158].map((t) => (
        <Sequence key={`wh4-${t}`} from={t} durationInFrames={12}>
          <Audio src={staticFile("audio/sfx/whoosh.wav")} volume={0.13} />
        </Sequence>
      ))}
      {[1089, 1133].map((t) => (
        <Sequence key={`ck4-${t}`} from={t} durationInFrames={6}>
          <Audio src={staticFile("audio/sfx/click.wav")} volume={0.22} />
        </Sequence>
      ))}
      {/* P4 两张 ✓ 卡 */}
      {[1135, 1150].map((t) => (
        <Sequence key={`dg4-${t}`} from={t} durationInFrames={18}>
          <Audio src={staticFile("audio/sfx/ding.wav")} volume={0.3} />
        </Sequence>
      ))}
      {/* P5 问号卡 pop、探路球 whoosh、结果卡 ding */}
      <Sequence from={1415} durationInFrames={10}>
        <Audio src={staticFile("audio/sfx/pop.wav")} volume={0.35} />
      </Sequence>
      {[1447, 1575].map((t) => (
        <Sequence key={`wh5-${t}`} from={t} durationInFrames={12}>
          <Audio src={staticFile("audio/sfx/whoosh.wav")} volume={0.12} />
        </Sequence>
      ))}
      {[1451, 1571].map((t) => (
        <Sequence key={`dg5-${t}`} from={t} durationInFrames={20}>
          <Audio src={staticFile("audio/sfx/ding.wav")} volume={0.5} />
        </Sequence>
      ))}
      {/* P6 点赞 */}
      <Sequence from={1770} durationInFrames={10}>
        <Audio src={staticFile("audio/sfx/pop.wav")} volume={0.5} />
      </Sequence>
      <Audio src={staticFile("audio/bed.wav")} loop volume={() => bedVolume} />
      <Subtitle />
    </AbsoluteFill>
  );
};
