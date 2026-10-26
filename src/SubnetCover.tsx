import {AbsoluteFill} from "remotion";

const C = {
  bg: "#fffdf6",
  ink: "#23324d",
  blue: "#2f6bff",
  blueSoft: "#e8f0ff",
  blueMid: "#c9dcff",
  orange: "#ff7a1a",
  orangeSoft: "#fff1e3",
  green: "#1fb574",
  greenSoft: "#e6f8ef",
  pink: "#ff5f9e",
  pinkSoft: "#ffeef5",
  yellow: "#ffc531",
  yellowSoft: "#fff7dc",
  purple: "#8b5cf6",
  purpleSoft: "#f1ebff",
  mint: "#37c99e",
  gray: "#5b6b85",
  skin: "#ffd9b3",
};

const TITLE_FONT = "幼圆, YouYuan, 'Microsoft YaHei', sans-serif";
const MONO = "'Consolas','Courier New',monospace";

// ---------- doodle bits ----------

type Bit = {x: number; y: number; s?: number; color: string; r?: number};

const Sparkle: React.FC<Bit> = ({x, y, s = 44, color, r = 0}) => (
  <svg width={s} height={s} viewBox="0 0 24 24" style={{position: "absolute", left: x, top: y, transform: `rotate(${r}deg)`}}>
    <path d="M12 1 C13 8 16 11 23 12 C16 13 13 16 12 23 C11 16 8 13 1 12 C8 11 11 8 12 1 Z" fill={color} />
  </svg>
);

const DoubleSparkle: React.FC<Bit> = ({x, y, s = 60, color, r = 0}) => (
  <svg width={s} height={s} viewBox="0 0 32 32" style={{position: "absolute", left: x, top: y, transform: `rotate(${r}deg)`}}>
    <path d="M13 3 C14 9 16.5 11.5 23 13 C16.5 14.5 14 17 13 23 C12 17 9.5 14.5 3 13 C9.5 11.5 12 9 13 3 Z" fill={color} />
    <path d="M25 18 C25.5 21.5 27 23 30.5 23.8 C27 24.6 25.5 26.2 25 29.6 C24.5 26.2 23 24.6 19.5 23.8 C23 23 24.5 21.5 25 18 Z" fill={color} opacity={0.75} />
  </svg>
);

const Star: React.FC<Bit> = ({x, y, s = 40, color, r = 0}) => (
  <svg width={s} height={s} viewBox="0 0 24 24" style={{position: "absolute", left: x, top: y, transform: `rotate(${r}deg)`}}>
    <path
      d="M12 2 L14.8 8.6 L22 9.4 L16.6 14.2 L18.2 21.4 L12 17.6 L5.8 21.4 L7.4 14.2 L2 9.4 L9.2 8.6 Z"
      fill={color}
      stroke={C.ink}
      strokeWidth="1.2"
      strokeLinejoin="round"
    />
  </svg>
);

const Heart: React.FC<Bit> = ({x, y, s = 34, color, r = 0}) => (
  <svg width={s} height={s} viewBox="0 0 24 24" style={{position: "absolute", left: x, top: y, transform: `rotate(${r}deg)`}}>
    <path
      d="M12 21 C5 15.5 2.5 12 2.5 8.5 C2.5 5.5 5 3.5 7.5 3.5 C9.3 3.5 11 4.5 12 6.2 C13 4.5 14.7 3.5 16.5 3.5 C19 3.5 21.5 5.5 21.5 8.5 C21.5 12 19 15.5 12 21 Z"
      fill={color}
    />
    <circle cx={7.6} cy={7.4} r={2} fill="#fff" opacity={0.85} />
  </svg>
);

const Squiggle: React.FC<{x: number; y: number; w: number; color: string; r?: number}> = ({x, y, w, color, r = 0}) => (
  <svg width={w} height={22} viewBox={`0 0 ${w} 22`} style={{position: "absolute", left: x, top: y, transform: `rotate(${r}deg)`}}>
    <path
      d={`M2 11 Q ${w * 0.14} 2, ${w * 0.28} 11 T ${w * 0.54} 11 T ${w * 0.8} 11 T ${w - 2} 11`}
      stroke={color}
      strokeWidth="5"
      strokeLinecap="round"
      fill="none"
    />
  </svg>
);

const ConfettiDot: React.FC<Bit> = ({x, y, s = 9, color, r = 0}) => (
  <div
    style={{
      position: "absolute",
      left: x,
      top: y,
      width: s,
      height: s,
      borderRadius: r === 0 ? 999 : s / 3,
      backgroundColor: color,
      transform: `rotate(${r}deg)`,
    }}
  />
);

const PlusDoodle: React.FC<Bit> = ({x, y, s = 22, color, r = 0}) => (
  <svg width={s} height={s} viewBox="0 0 20 20" style={{position: "absolute", left: x, top: y, transform: `rotate(${r}deg)`}}>
    <path d="M10 2 V18 M2 10 H18" stroke={color} strokeWidth="4.5" strokeLinecap="round" />
  </svg>
);

const RingDoodle: React.FC<Bit> = ({x, y, s = 22, color}) => (
  <svg width={s} height={s} viewBox="0 0 20 20" style={{position: "absolute", left: x, top: y}}>
    <circle cx={10} cy={10} r={7} stroke={color} strokeWidth="4" fill="none" />
  </svg>
);

const QuestionDoodle: React.FC<Bit & {s: number}> = ({x, y, s, color, r = 0}) => (
  <div style={{position: "absolute", left: x, top: y, fontSize: s, fontWeight: 900, color, fontFamily: TITLE_FONT, transform: `rotate(${r}deg)`}}>?</div>
);

const CloudPuff: React.FC<{x: number; y: number; w: number; h: number; color: string}> = ({x, y, w, h, color}) => (
  <svg width={w} height={h} viewBox="0 0 200 100" style={{position: "absolute", left: x, top: y, opacity: 0.6}}>
    <ellipse cx={60} cy={60} rx={58} ry={38} fill={color} />
    <ellipse cx={130} cy={52} rx={64} ry={44} fill={color} />
    <ellipse cx={100} cy={74} rx={70} ry={26} fill={color} />
  </svg>
);

const CurvedArrow: React.FC<{
  x: number;
  y: number;
  w: number;
  h: number;
  bend: number;
  color: string;
}> = ({x, y, w, h, bend, color}) => {
  const vbW = Math.abs(w) + 60;
  const vbH = Math.abs(h) + 60;
  const sx = w >= 0 ? 30 : vbW - 30;
  const sy = h >= 0 ? 30 : vbH - 30;
  const ex = w >= 0 ? w + 30 : 30;
  const ey = h >= 0 ? h + 30 : 30;
  const cx2 = (sx + ex) / 2;
  const cy2 = (sy + ey) / 2 + bend;
  const ang = (Math.atan2(ey - cy2, ex - cx2) * 180) / Math.PI;
  return (
    <svg width={vbW} height={vbH} style={{position: "absolute", left: x, top: y, overflow: "visible"}}>
      <path
        d={`M ${sx} ${sy} Q ${cx2} ${cy2} ${ex - Math.cos((ang * Math.PI) / 180) * 10} ${ey - Math.sin((ang * Math.PI) / 180) * 10}`}
        stroke={color}
        strokeWidth="6"
        strokeLinecap="round"
        strokeDasharray="1 16"
        fill="none"
      />
      <g transform={`translate(${ex},${ey}) rotate(${ang})`}>
        <path d="M-16 -10 L2 0 L-16 10" fill={color} stroke={color} strokeWidth="4" strokeLinejoin="round" strokeLinecap="round" />
      </g>
    </svg>
  );
};

const WavyUnderline: React.FC<{x: number; y: number; w: number; color: string}> = ({x, y, w, color}) => (
  <svg width={w} height={30} viewBox={`0 0 ${w} 30`} style={{position: "absolute", left: x, top: y}}>
    <path
      d={`M4 17 Q ${w * 0.1} 5, ${w * 0.2} 17 T ${w * 0.4} 17 T ${w * 0.6} 17 T ${w * 0.8} 17 T ${w - 4} 17`}
      stroke={color}
      strokeWidth="11"
      strokeLinecap="round"
      fill="none"
      opacity={0.95}
    />
  </svg>
);

// ---------- title with per-char jitter ----------

const JT: React.FC<{ch: string; rot: number; dy: number; color?: string; stroke?: string; s?: number}> = ({
  ch,
  rot,
  dy,
  color = C.ink,
  stroke = C.ink,
  s = 122,
}) => (
  <span
    style={{
      display: "inline-block",
      fontSize: s,
      transform: `rotate(${rot}deg) translateY(${dy}px)`,
      color,
      WebkitTextStroke: `8px ${stroke}`,
      margin: "0 2px",
    }}
  >
    {ch}
  </span>
);

// ---------- characters ----------

const Face: React.FC<{cx: number; cy: number; scale?: number}> = ({cx, cy, scale = 1}) => (
  <g transform={`translate(${cx},${cy}) scale(${scale})`}>
    {/* eyebrows */}
    <path d="M -38 -26 Q -28 -33 -16 -27" stroke={C.ink} strokeWidth="5" strokeLinecap="round" fill="none" />
    <path d="M 16 -27 Q 28 -33 38 -26" stroke={C.ink} strokeWidth="5" strokeLinecap="round" fill="none" />
    {/* eyes */}
    <ellipse cx={-24} cy={-4} rx={9.5} ry={11} fill={C.ink} />
    <ellipse cx={24} cy={-4} rx={9.5} ry={11} fill={C.ink} />
    <circle cx={-20.5} cy={-8} r={3.4} fill="#fff" />
    <circle cx={27.5} cy={-8} r={3.4} fill="#fff" />
    {/* open smile */}
    <path d="M -13 14 Q 0 20 13 14 Q 11 32 0 32 Q -11 32 -13 14 Z" fill="#a3402f" stroke={C.ink} strokeWidth="4.5" strokeLinejoin="round" />
    <path d="M -6 27 Q 0 23 6 27 Q 4 32 0 32 Q -4 32 -6 27 Z" fill={C.pink} />
    {/* blush + freckles */}
    <ellipse cx={-52} cy={12} rx={13} ry={7.5} fill={C.pink} opacity={0.55} />
    <ellipse cx={52} cy={12} rx={13} ry={7.5} fill={C.pink} opacity={0.55} />
    <circle cx={-40} cy={4} r={2.4} fill={C.ink} opacity={0.5} />
    <circle cx={-34} cy={9} r={2.4} fill={C.ink} opacity={0.5} />
    <circle cx={40} cy={4} r={2.4} fill={C.ink} opacity={0.5} />
    <circle cx={34} cy={9} r={2.4} fill={C.ink} opacity={0.5} />
  </g>
);

const Glove: React.FC<{cx: number; cy: number; r?: number}> = ({cx, cy, r = 0}) => (
  <g transform={`translate(${cx},${cy}) rotate(${r})`}>
    <circle cx={0} cy={0} r={24} fill="#fff" stroke={C.ink} strokeWidth="7" />
    <path d="M -8 -22 Q 0 -30 8 -22" stroke={C.ink} strokeWidth="6" fill="none" strokeLinecap="round" />
  </g>
);

const RouterMascot: React.FC<{x: number; y: number; s: number}> = ({x, y, s}) => (
  <svg width={660 * s} height={560 * s} viewBox="0 0 660 560" style={{position: "absolute", left: x, top: y}}>
    {/* wifi arcs */}
    <path d="M 130 96 Q 152 56 186 62" stroke={C.blue} strokeWidth="7" fill="none" strokeLinecap="round" strokeDasharray="1 13" />
    <path d="M 530 96 Q 508 56 474 62" stroke={C.blue} strokeWidth="7" fill="none" strokeLinecap="round" strokeDasharray="1 13" />
    {/* antennas */}
    <line x1={242} y1={158} x2={208} y2={62} stroke={C.ink} strokeWidth="11" strokeLinecap="round" />
    <line x1={418} y1={158} x2={452} y2={62} stroke={C.ink} strokeWidth="11" strokeLinecap="round" />
    <circle cx={204} cy={52} r={15} fill={C.yellow} stroke={C.ink} strokeWidth="6" />
    <circle cx={456} cy={52} r={15} fill={C.yellow} stroke={C.ink} strokeWidth="6" />

    {/* body with two-tone */}
    <rect x={92} y={150} width={476} height={310} rx={62} fill="#dbe7ff" stroke={C.ink} strokeWidth="9" />
    <path d="M 92 340 L 568 340 L 568 398 A 62 62 0 0 1 506 460 L 154 460 A 62 62 0 0 1 92 398 Z" fill={C.blueMid} stroke={C.ink} strokeWidth="8" />
    {/* screen */}
    <rect x={126} y={178} width={408} height={168} rx={30} fill="#f6f9ff" stroke={C.ink} strokeWidth="8" />
    <Face cx={330} cy={262} scale={1.25} />

    {/* ports */}
    <circle cx={210} cy={404} r={11} fill={C.green} stroke={C.ink} strokeWidth="5" />
    <circle cx={268} cy={404} r={11} fill={C.yellow} stroke={C.ink} strokeWidth="5" />
    <circle cx={326} cy={404} r={11} fill={C.orange} stroke={C.ink} strokeWidth="5" />
    <rect x={380} y={388} width={92} height={32} rx={16} fill="#fff" stroke={C.ink} strokeWidth="5" />

    {/* left arm down-out, right arm thumbs up */}
    <path d="M 92 300 Q 30 320 24 372" stroke={C.ink} strokeWidth="11" fill="none" strokeLinecap="round" />
    <Glove cx={24} cy={392} r={-18} />
    <path d="M 568 292 Q 628 280 640 216" stroke={C.ink} strokeWidth="11" fill="none" strokeLinecap="round" />
    <Glove cx={644} cy={194} r={14} />
    <rect x={630} y={148} width={22} height={44} rx={11} fill="#fff" stroke={C.ink} strokeWidth="6" />

    {/* feet */}
    <rect x={190} y={452} width={84} height={50} rx={24} fill={C.ink} />
    <rect x={386} y={452} width={84} height={50} rx={24} fill={C.ink} />
  </svg>
);

const ShieldBadge: React.FC<{x: number; y: number; s: number; r?: number}> = ({x, y, s, r = 0}) => (
  <svg width={170 * s} height={192 * s} viewBox="0 0 150 170" style={{position: "absolute", left: x, top: y, transform: `rotate(${r}deg)`}}>
    <path
      d="M75 8 L138 32 L138 88 C138 128 108 152 75 162 C42 152 12 128 12 88 L12 32 Z"
      fill="#dcecff"
      stroke={C.ink}
      strokeWidth="9"
      strokeLinejoin="round"
    />
    <path d="M75 22 L124 40 L124 86 C124 118 102 138 75 147 Z" fill={C.blue} opacity={0.18} />
    <rect x={50} y={66} width={50} height={44} rx={10} fill={C.blue} stroke={C.ink} strokeWidth="7" />
    <path d="M61 66 L61 53 A14 14 0 0 1 89 53 L89 66" stroke={C.ink} strokeWidth="8" fill="none" />
    <circle cx={75} cy={86} r={8} fill="#fff" />
    <circle cx={75} cy={98} r={4.5} fill="#fff" />
  </svg>
);

const Tape: React.FC<{x: number; y: number; r?: number; color: string}> = ({x, y, r = 0, color}) => (
  <div
    style={{
      position: "absolute",
      left: x,
      top: y,
      width: 96,
      height: 34,
      backgroundColor: color,
      opacity: 0.9,
      borderRadius: 6,
      transform: `rotate(${r}deg)`,
    }}
  />
);

const IpCard: React.FC<{x: number; y: number; r?: number}> = ({x, y, r = -7}) => (
  <div style={{position: "absolute", left: x, top: y, transform: `rotate(${r}deg)`}}>
    <div
      style={{
        backgroundColor: "#fff",
        border: `7px solid ${C.ink}`,
        borderRadius: 30,
        padding: "22px 36px 20px",
        boxShadow: "10px 12px 0 rgba(47,107,255,0.22)",
        textAlign: "center",
        position: "relative",
      }}
    >
      <Tape x={-26} y={-18} r={-32} color={C.yellowSoft} />
      <div style={{fontSize: 30, fontWeight: 900, color: C.gray, letterSpacing: 4}}>IP 地址</div>
      <div style={{fontSize: 38, fontWeight: 900, color: C.blue, fontFamily: MONO, marginTop: 4}}>192.168.1.10</div>
      <Sparkle x={-30} y={64} s={34} color={C.yellow} r={20} />
    </div>
  </div>
);

const MaskCard: React.FC<{x: number; y: number; r?: number}> = ({x, y, r = 6}) => (
  <div style={{position: "absolute", left: x, top: y, transform: `rotate(${r}deg)`}}>
    <div
      style={{
        backgroundColor: "#fff",
        border: `7px solid ${C.ink}`,
        borderRadius: 30,
        padding: "22px 34px 20px",
        boxShadow: "-10px 12px 0 rgba(31,181,116,0.22)",
        textAlign: "center",
        position: "relative",
      }}
    >
      <Tape x={216} y={-16} r={30} color={C.pinkSoft} />
      <div style={{fontSize: 30, fontWeight: 900, color: C.gray, letterSpacing: 4}}>子网掩码</div>
      <div style={{fontSize: 38, fontWeight: 900, color: C.green, fontFamily: MONO, marginTop: 4}}>255.255.255.0</div>
      <Star x={240} y={62} s={40} color={C.pink} r={14} />
    </div>
  </div>
);

const CircleKid: React.FC<{
  x: number;
  y: number;
  d: number;
  ring: string;
  fill: string;
  children: React.ReactNode;
}> = ({x, y, d, ring, fill, children}) => (
  <div
    style={{
      position: "absolute",
      left: x,
      top: y,
      width: d,
      height: d,
      borderRadius: 999,
      backgroundColor: fill,
      border: `10px solid ${ring}`,
      boxShadow: "0 12px 0 rgba(35,50,77,0.12)",
      overflow: "hidden",
    }}
  >
    {children}
  </div>
);

const BoyInCircle: React.FC = () => (
  <svg width={300} height={300} viewBox="0 0 230 230">
    <rect x={44} y={196} width={142} height={34} rx={14} fill="#dbe6f5" stroke={C.ink} strokeWidth="7" />
    <rect x={40} y={128} width={104} height={54} rx={22} fill={C.blue} stroke={C.ink} strokeWidth="7" />
    <circle cx={104} cy={84} r={56} fill={C.skin} stroke={C.ink} strokeWidth="8" />
    <path d="M 48 74 A 56 56 0 0 1 160 74 L 160 40 A 56 56 0 0 0 48 40 Z" fill={C.ink} />
    <path d="M 52 34 Q 104 -8 156 34 L 156 20 Q 104 -22 52 20 Z" fill={C.ink} />
    <path d="M 150 40 Q 178 52 182 84" stroke={C.ink} strokeWidth="7" fill="none" strokeLinecap="round" />
    <g transform="translate(104,94)">
      <path d="M -30 -14 Q -24 -20 -16 -16" stroke={C.ink} strokeWidth="4" fill="none" strokeLinecap="round" />
      <path d="M 16 -16 Q 24 -20 30 -14" stroke={C.ink} strokeWidth="4" fill="none" strokeLinecap="round" />
      <ellipse cx={-19} cy={-2} rx={7.5} ry={9} fill={C.ink} />
      <ellipse cx={19} cy={-2} rx={7.5} ry={9} fill={C.ink} />
      <circle cx={-16} cy={-5} r={2.6} fill="#fff" />
      <circle cx={22} cy={-5} r={2.6} fill="#fff" />
      <path d="M -8 12 Q 0 18 8 12" stroke={C.ink} strokeWidth="4.5" fill="none" strokeLinecap="round" />
      <ellipse cx={-36} cy={8} rx={9} ry={5.5} fill={C.pink} opacity={0.55} />
      <ellipse cx={36} cy={8} rx={9} ry={5.5} fill={C.pink} opacity={0.55} />
    </g>
    <path d="M 144 150 Q 186 132 194 96" stroke={C.blue} strokeWidth={24} fill="none" strokeLinecap="round" />
    <circle cx={196} cy={88} r={14} fill={C.skin} stroke={C.ink} strokeWidth="6" />
  </svg>
);

const GirlInCircle: React.FC = () => (
  <svg width={300} height={300} viewBox="0 0 230 230">
    <rect x={46} y={130} width={100} height={56} rx={24} fill={C.pink} stroke={C.ink} strokeWidth="7" />
    <circle cx={104} cy={86} r={54} fill={C.skin} stroke={C.ink} strokeWidth="8" />
    <path d="M 50 92 A 54 54 0 0 1 158 92 L 158 64 A 54 54 0 0 0 50 64 Z" fill="#5b3a29" />
    <path d="M 50 64 Q 104 18 158 64 L 158 48 Q 104 4 50 48 Z" fill="#5b3a29" />
    <circle cx={48} cy={100} r={15} fill="#5b3a29" stroke={C.ink} strokeWidth="5" />
    <circle cx={160} cy={100} r={15} fill="#5b3a29" stroke={C.ink} strokeWidth="5" />
    <path d="M 40 130 Q 16 112 20 88" stroke={C.pink} strokeWidth={22} fill="none" strokeLinecap="round" />
    <circle cx={20} cy={80} r={13} fill={C.skin} stroke={C.ink} strokeWidth="6" />
    <g transform="translate(104,96)">
      <path d="M -30 -16 Q -24 -22 -16 -18" stroke={C.ink} strokeWidth="4" fill="none" strokeLinecap="round" />
      <path d="M 16 -18 Q 24 -22 30 -16" stroke={C.ink} strokeWidth="4" fill="none" strokeLinecap="round" />
      <ellipse cx={-19} cy={-2} rx={7.5} ry={9} fill={C.ink} />
      <ellipse cx={19} cy={-2} rx={7.5} ry={9} fill={C.ink} />
      <circle cx={-16} cy={-5} r={2.6} fill="#fff" />
      <circle cx={22} cy={-5} r={2.6} fill="#fff" />
      <path d="M -8 12 Q 0 17 8 12" stroke={C.ink} strokeWidth="4.5" fill="none" strokeLinecap="round" />
      <ellipse cx={-35} cy={8} rx={9} ry={5.5} fill={C.pink} opacity={0.6} />
      <ellipse cx={35} cy={8} rx={9} ry={5.5} fill={C.pink} opacity={0.6} />
    </g>
    <circle cx={186} cy={52} r={24} fill="#fff" stroke={C.ink} strokeWidth="6" />
    <text x={186} y={63} textAnchor="middle" fontSize={30} fontWeight={900} fill={C.purple} fontFamily={TITLE_FONT}>?</text>
  </svg>
);

// ---------- cover ----------

const line1: Array<{ch: string; rot: number; dy: number; color?: string; stroke?: string}> = [
  {ch: "有", rot: -2.5, dy: 0},
  {ch: "了", rot: 1.5, dy: 4},
  {ch: "I", rot: -3, dy: -2, color: C.blue, stroke: C.blue},
  {ch: "P", rot: 2, dy: 2, color: C.blue, stroke: C.blue},
  {ch: "，", rot: 0, dy: 6},
  {ch: "为", rot: 2, dy: -2},
  {ch: "什", rot: -1.5, dy: 3},
  {ch: "么", rot: 1.8, dy: -1},
];

const line2: Array<{ch: string; rot: number; dy: number; color?: string; stroke?: string}> = [
  {ch: "还", rot: -2, dy: 2},
  {ch: "要", rot: 1.6, dy: -3},
  {ch: "子", rot: -1.8, dy: 2, color: C.orange, stroke: C.orange},
  {ch: "网", rot: 1.2, dy: -2, color: C.orange, stroke: C.orange},
  {ch: "掩", rot: -1.4, dy: 3, color: C.orange, stroke: C.orange},
  {ch: "码", rot: 2.2, dy: -1, color: C.orange, stroke: C.orange},
  {ch: "？", rot: -2.4, dy: 4},
];

export const SubnetCover: React.FC = () => {
  return (
    <AbsoluteFill style={{backgroundColor: C.bg, overflow: "hidden", fontFamily: TITLE_FONT}}>
      {/* soft pastel blobs behind scene */}
      <CloudPuff x={110} y={760} w={360} h={180} color={C.blueSoft} />
      <CloudPuff x={640} y={700} w={380} h={190} color={C.pinkSoft} />
      <CloudPuff x={420} y={920} w={300} h={150} color={C.yellowSoft} />

      {/* confetti field */}
      <ConfettiDot x={54} y={220} s={10} color={C.pink} />
      <ConfettiDot x={130} y={520} s={8} color={C.blue} />
      <ConfettiDot x={36} y={880} s={10} color={C.yellow} />
      <ConfettiDot x={70} y={1180} s={8} color={C.green} />
      <ConfettiDot x={1020} y={240} s={10} color={C.blue} />
      <ConfettiDot x={1044} y={560} s={8} color={C.pink} />
      <ConfettiDot x={1010} y={900} s={10} color={C.purple} />
      <ConfettiDot x={1036} y={1190} s={8} color={C.orange} />
      <ConfettiDot x={430} y={1240} s={9} color={C.mint} />
      <ConfettiDot x={620} y={1226} s={8} color={C.pink} />
      <ConfettiDot x={520} y={470} s={8} color={C.purple} />
      <ConfettiDot x={300} y={480} s={7} color={C.orange} />
      <PlusDoodle x={180} y={140} s={26} color={C.mint} r={12} />
      <PlusDoodle x={900} y={160} s={24} color={C.orange} r={-10} />
      <PlusDoodle x={40} y={660} s={22} color={C.pink} r={8} />
      <PlusDoodle x={1006} y={760} s={24} color={C.blue} r={-14} />
      <PlusDoodle x={360} y={1264} s={20} color={C.purple} r={10} />
      <PlusDoodle x={700} y={1258} s={22} color={C.yellow} r={-12} />
      <RingDoodle x={250} y={60} s={24} color={C.orange} />
      <RingDoodle x={860} y={44} s={20} color={C.pink} />
      <RingDoodle x={990} y={1050} s={22} color={C.mint} />
      <RingDoodle x={80} y={1030} s={20} color={C.purple} />

      {/* scattered doodles */}
      <Sparkle x={64} y={96} s={52} color={C.yellow} />
      <Sparkle x={950} y={70} s={44} color={C.pink} r={18} />
      <Sparkle x={16} y={380} s={38} color={C.green} r={24} />
      <DoubleSparkle x={972} y={420} s={62} color={C.blue} r={10} />
      <DoubleSparkle x={120} y={920} s={54} color={C.pink} r={-12} />
      <Star x={190} y={300} s={46} color={C.yellow} r={-12} />
      <Star x={866} y={352} s={40} color={C.orange} r={14} />
      <Star x={988} y={712} s={42} color={C.yellow} r={-16} />
      <Star x={40} y={1330} s={38} color={C.pink} r={12} />
      <Star x={1006} y={1330} s={38} color={C.blue} r={-10} />
      <Heart x={230} y={182} s={40} color={C.pink} r={-14} />
      <Heart x={852} y={210} s={36} color={C.orange} r={12} />
      <Heart x={54} y={540} s={32} color={C.purple} r={-8} />
      <Heart x={1002} y={620} s={32} color={C.pink} r={16} />
      <Squiggle x={140} y={56} w={112} color={C.pink} r={-8} />
      <Squiggle x={812} y={46} w={112} color={C.blue} r={10} />
      <Squiggle x={30} y={742} w={100} color={C.yellow} r={-70} />
      <Squiggle x={960} y={1120} w={100} color={C.pink} r={70} />
      <QuestionDoodle x={300} y={402} s={50} color={C.blue} r={-14} />
      <QuestionDoodle x={760} y={396} s={44} color={C.purple} r={12} />

      {/* title */}
      <div style={{position: "absolute", top: 64, left: 0, right: 0, textAlign: "center", lineHeight: 1.12}}>
        <div>{line1.map((c, i) => <JT key={i} {...c} />)}</div>
        <div style={{marginTop: 4}}>
          {line2.slice(0, 2).map((c, i) => <JT key={i} {...c} />)}
          <span style={{display: "inline-block", position: "relative", margin: "0 2px"}}>
            {line2.slice(2, 6).map((c, i) => <JT key={i} {...c} />)}
            <WavyUnderline x={6} y={138} w={500} color={C.yellow} />
          </span>
          <span style={{display: "inline-block", position: "relative"}}>
            <JT {...line2[6]} />
            <Star x={-46} y={6} s={38} color={C.yellow} r={-14} />
          </span>
        </div>
      </div>

      {/* subtitle pill */}
      <div style={{position: "absolute", top: 398, left: 0, right: 0, display: "flex", justifyContent: "center"}}>
        <div
          style={{
            backgroundColor: C.ink,
            color: "#fff",
            fontSize: 35,
            fontWeight: 800,
            borderRadius: 999,
            padding: "14px 40px",
            letterSpacing: 3,
            boxShadow: "0 8px 0 rgba(35,50,77,0.14)",
          }}
        >
          电脑发数据前，靠它决定走哪条路
        </div>
      </div>

      {/* illustration */}
      <RouterMascot x={262} y={500} s={0.85} />
      <IpCard x={14} y={548} />
      <MaskCard x={688} y={506} />
      <ShieldBadge x={104} y={820} s={0.92} r={-8} />

      <CircleKid x={36} y={1020} d={300} ring={C.blue} fill={C.blueSoft}>
        <BoyInCircle />
      </CircleKid>
      <CircleKid x={744} y={1020} d={300} ring={C.pink} fill={C.pinkSoft}>
        <GirlInCircle />
      </CircleKid>

      <CurvedArrow x={190} y={1040} w={150} h={-100} bend={-40} color={C.blue} />
      <CurvedArrow x={630} y={1040} w={160} h={-100} bend={40} color={C.green} />

      {/* bottom series tag */}
      <div style={{position: "absolute", bottom: 48, left: 0, right: 0, display: "flex", justifyContent: "center", gap: 20, alignItems: "center"}}>
        <Star x={0} y={0} s={30} color={C.yellow} r={-12} />
        <div
          style={{
            border: `6px solid ${C.ink}`,
            borderRadius: 999,
            padding: "12px 38px",
            fontSize: 35,
            fontWeight: 900,
            color: C.ink,
            backgroundColor: "#fff",
            letterSpacing: 4,
            boxShadow: "0 8px 0 rgba(35,50,77,0.12)",
          }}
        >
          计算机网络入门 · 第 1 篇
        </div>
        <Star x={0} y={0} s={30} color={C.pink} r={14} />
      </div>
    </AbsoluteFill>
  );
};
