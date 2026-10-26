import React from "react";
import { Audio } from "@remotion/media";
import {
  AbsoluteFill,
  interpolate,
  Sequence,
  staticFile,
  useCurrentFrame,
} from "remotion";
import {
  BrandCorner,
  EndingCard,
  HardPage,
  PopAt,
  STATIC,
  SubtitleBar,
  wordAt,
} from "./batch10/kit";
import {
  DUR,
  NARRATION_END,
  SENT,
  SENT_DUR,
  SUBS,
  WORDS,
} from "./batch10/pwdhashData";

// ============================================================
// 白板手绘 v2 · 《你的密码在服务器里是怎么存的？》（全栈小秋）
// 9 句 = 9 页，页边界 = SENT_DUR 累加帧，kit.HardPage 纯硬切
// 视觉：明文抽屉 / 粉碎机 / 单向箭头 / 查询表小册子 / 盐罐（不画真实网站名）
// ============================================================

const PAPER = "#fdfcf7";
const INK = "#3a3a3a";
const SUBC = "#8a8579";
const RED = "#c94f4f";
const BLUE_F = "rgba(139,178,216,0.34)";
const BLUE_E = "#5b87ad";
const GREEN_F = "rgba(140,200,150,0.34)";
const GREEN_E = "#4e9464";
const YEL_F = "rgba(242,202,92,0.45)";
const ORANGE_F = "rgba(242,163,94,0.40)";
const ORANGE_E = "#c97a2e";
const STAIN = "rgba(150,110,70,0.30)";

const T_FONT = "'STXingkai','华文行楷','KaiTi','楷体',serif";
const B_FONT = "'STKaiti','KaiTi','楷体','Microsoft YaHei',serif";
const MONO = "'Consolas','Courier New',monospace";

const W = 1920;
const H = 1080;

// ---------- 页边界：SENT = timeline.json 真实句起始帧（数据驱动，无硬编码帧号） ----------
const PAGE_START: number[] = [...SENT];

const NARR_START = SENT.map((_, i) =>
  Math.min(...SUBS.filter((s) => s.sent === i).map((s) => s.f))
);

const GOLD_FROM = PAGE_START[7];
const GOLD_TO = PAGE_START[8];

// ---------- 词锚 ----------
const A = {
  tuo: wordAt(WORDS, 0, "拖"), // 66
  na: wordAt(WORDS, 0, "哪"), // 225
  mingWen: wordAt(WORDS, 1, "明文"), // 284
  tuoKu: wordAt(WORDS, 1, "拖库"), // 378
  luoben: wordAt(SUBS, 1, "一次"), // 390（结论条须在页内完整可见）
  miMa: wordAt(WORDS, 2, "密码"), // 502
  fenSui: wordAt(WORDS, 2, "粉碎机"), // 547
  luanMa: wordAt(WORDS, 2, "乱码"), // 627
  cun: wordAt(SUBS, 2, "只存"), // 644（贴纸须在页内完整可见）
  danXiang: wordAt(WORDS, 3, "单向"), // 714
  hui: wordAt(WORDS, 3, "回"), // 764
  dengLu: wordAt(WORDS, 3, "登录"), // 789
  biDui: wordAt(WORDS, 3, "比对"), // 860
  chaXun: wordAt(WORDS, 4, "查询"), // 1136（「一查一个准」提前随查询表揭示）
  poZhan: wordAt(WORDS, 4, "破绽"), // 972
  mi123456: wordAt(WORDS, 4, "123456"), // 996
  tiQian: wordAt(WORDS, 4, "提前"), // 1113
  biao: wordAt(WORDS, 4, "表"), // 1147
  yan: wordAt(WORDS, 5, "盐"), // 1220
  suiJi: wordAt(WORDS, 5, "随机"), // 1282
  fen: wordAt(WORDS, 5, "份"), // 1390
  zuoFei: wordAt(WORDS, 5, "作废"), // 1435
  tuoKu2: wordAt(WORDS, 6, "拖库"), // 1504
  duan: wordAt(WORDS, 6, "端"), // 1542
  jia: wordAt(WORDS, 6, "加"), // 1605
  buTong: wordAt(WORDS, 8, "不同"), // 1861
  tuoZou: wordAt(WORDS, 8, "拖走"), // 1976
};

// ---------- 原语（复用 UrlJourneySketch，f=全局帧） ----------
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const wob = (i: number, amp = 2.4) => Math.sin(i * 5.7 + 1.3) * amp;
const prog = (f: number, delay: number, dur = 16) =>
  interpolate(f, [delay, delay + dur], [0, 1], clamp);

const sketchRectPath = (x: number, y: number, w: number, h: number, seed = 0) => {
  const p = (a: number, b: number) =>
    `${a + wob(a + b + seed)} ${b + wob(b - a + seed + 3)}`;
  return (
    `M ${p(x + w * 0.1, y)} Q ${x + w * 0.5} ${y + wob(seed + 1)} ${p(x + w * 0.95, y + 1)} ` +
    `Q ${x + w} ${y + h * 0.5} ${p(x + w - 1, y + h * 0.92)} ` +
    `Q ${x + w * 0.5} ${y + h} ${p(x + w * 0.08, y + h - 1)} ` +
    `Q ${x} ${y + h * 0.5} ${p(x + 1, y + h * 0.08)} Z`
  );
};

const blobPath = (cx: number, cy: number, rx: number, ry: number, seed = 0) => {
  const N = 9;
  const pts: string[] = [];
  for (let i = 0; i < N; i++) {
    const a = (i / N) * Math.PI * 2;
    const jx = 1 + 0.16 * Math.sin(a * 3 + seed * 1.7);
    const jy = 1 + 0.2 * Math.cos(a * 2 + seed);
    pts.push(
      `${(cx + Math.cos(a) * rx * jx).toFixed(1)},${(cy + Math.sin(a) * ry * jy).toFixed(1)}`
    );
  }
  const mid = (a: string, b: string) => {
    const [ax, ay] = a.split(",").map(Number);
    const [bx, by] = b.split(",").map(Number);
    return `${((ax + bx) / 2).toFixed(1)},${((ay + by) / 2).toFixed(1)}`;
  };
  let d = `M ${mid(pts[N - 1], pts[0])}`;
  for (let i = 0; i < N; i++) d += ` Q ${pts[i]} ${mid(pts[i], pts[(i + 1) % N])}`;
  return d + " Z";
};

const Draw: React.FC<{
  f: number;
  d: string;
  stroke?: string;
  sw?: number;
  delay?: number;
  dur?: number;
  fill?: string;
  fillOp?: number;
  op?: number;
}> = ({ f, d, stroke = INK, sw = 5, delay = 0, dur = 16, fill = "none", fillOp = 1, op = 1 }) => {
  const p = prog(f, delay, dur);
  if (p <= 0) return null;
  const fo = interpolate(p, [0.5, 1], [0, 1], clamp);
  return (
    <svg width={W} height={H} style={{ position: "absolute", left: 0, top: 0, overflow: "visible", pointerEvents: "none" }}>
      <path
        d={d}
        fill={fill}
        fillOpacity={fill === "none" ? 0 : fo * fillOp}
        stroke={stroke}
        strokeWidth={sw}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray={p < 1 ? "1 1" : undefined}
        strokeDashoffset={p < 1 ? 1 - p : 0}
        pathLength={p >= 1 ? undefined : 1}
        opacity={op}
      />
    </svg>
  );
};

const WBox: React.FC<{
  f: number; x: number; y: number; w: number; h: number; fill?: string; stroke?: string;
  sw?: number; seed?: number; delay?: number; dur?: number; op?: number;
}> = ({ f, x, y, w, h, fill = "none", stroke = INK, sw = 5, seed = 0, delay = 0, dur = 16, op = 1 }) => (
  <Draw f={f} d={sketchRectPath(x, y, w, h, seed)} stroke={stroke} sw={sw} delay={delay} dur={dur} fill={fill} op={op} />
);

const WCol: React.FC<{
  f: number; cx: number; cy: number; rx: number; ry: number; color: string; seed?: number; delay?: number; op?: number;
}> = ({ f, cx, cy, rx, ry, color, seed = 0, delay = 0, op = 1 }) => {
  const p = prog(f, delay, 12);
  if (p <= 0) return null;
  const s = 0.82 + 0.18 * p;
  return (
    <svg width={W} height={H} style={{ position: "absolute", left: 0, top: 0, overflow: "visible", pointerEvents: "none" }}>
      <g transform={`translate(${cx},${cy}) scale(${s}) translate(${-cx},${-cy})`} opacity={op * p}>
        <path d={blobPath(cx, cy, rx, ry, seed)} fill={color} />
      </g>
    </svg>
  );
};

const Arrow: React.FC<{
  f: number; x: number; y: number; len: number; color?: string; delay?: number;
  bend?: number; rot?: number; sw?: number; flip?: boolean;
}> = ({ f, x, y, len, color = INK, delay = 0, bend = 0, rot = 0, sw = 6, flip }) => {
  const p = prog(f, delay, 18);
  if (p <= 0) return null;
  const draw = len * p;
  return (
    <svg
      width={len + 60}
      height={140}
      style={{
        position: "absolute", left: flip ? x - len : x, top: y, overflow: "visible",
        transform: flip ? `scaleX(-1) rotate(${rot}deg)` : `rotate(${rot}deg)`,
        transformOrigin: "0 70",
      }}
    >
      <path
        d={`M 4 70 Q ${len * 0.5} ${70 + bend} ${draw} ${70 + bend * 0.4}`}
        stroke={color} strokeWidth={sw} strokeLinecap="round" fill="none"
      />
      {p > 0.9 ? (
        <path
          d={`M ${len - 24} ${54 + bend * 0.4} L ${len + 2} ${70 + bend * 0.4} L ${len - 24} ${86 + bend * 0.4}`}
          stroke={color} strokeWidth={sw} fill="none" strokeLinecap="round" strokeLinejoin="round"
        />
      ) : null}
    </svg>
  );
};

const Squiggle: React.FC<{ f: number; x: number; y: number; w: number; color?: string; delay?: number; sw?: number }> = ({
  f, x, y, w, color = RED, delay = 0, sw = 6,
}) => {
  const n = Math.max(2, Math.round(w / 30));
  const seg = w / n;
  let d = `M ${x} ${y}`;
  for (let i = 0; i < n; i++) d += ` q ${seg / 2} ${i % 2 === 0 ? -11 : 11} ${seg} 0`;
  return <Draw f={f} d={d} stroke={color} sw={sw} delay={delay} dur={12} op={0.85} />;
};

const Bubble: React.FC<{
  f: number; x: number; y: number; w: number; h: number; text: string; ts?: number;
  delay?: number; tail?: "bl" | "br"; color?: string;
}> = ({ f, x, y, w, h, text, ts = 32, delay = 0, tail = "bl", color = "rgba(255,255,255,0.92)" }) => {
  const p = prog(f, delay, 14);
  if (p <= 0) return null;
  const tailD =
    tail === "bl"
      ? `M ${x + 40} ${y + h - 6} Q ${x + 18} ${y + h + 42} ${x - 6} ${y + h + 52} Q ${x + 34} ${y + h + 18} ${x + 66} ${y + h + 2}`
      : `M ${x + w - 40} ${y + h - 6} Q ${x + w - 18} ${y + h + 42} ${x + w + 6} ${y + h + 52} Q ${x + w - 34} ${y + h + 18} ${x + w - 66} ${y + h + 2}`;
  return (
    <>
      <Draw f={f} d={blobPath(x + w / 2, y + h / 2, w / 2, h / 2, x % 7)} stroke={INK} sw={5} delay={delay} dur={14} fill={color} />
      <Draw f={f} d={tailD} stroke={INK} sw={5} delay={delay + 8} dur={6} />
      <div style={{
        position: "absolute", left: x + 10, top: y + h / 2 - ts, width: w - 20, textAlign: "center",
        fontFamily: B_FONT, fontSize: ts, color: INK, opacity: interpolate(p, [0.55, 0.95], [0, 1], clamp),
        whiteSpace: "nowrap",
      }}>{text}</div>
    </>
  );
};

const Sticker: React.FC<{
  f: number; x: number; y: number; w: number; h: number; title: string; sub?: string;
  color?: string; delay?: number; rot?: number; ts?: number;
}> = ({ f, x, y, w, h, title, sub, color = "#c96a7c", delay = 0, rot = 0, ts = 34 }) => {
  const p = prog(f, delay, 12);
  if (p <= 0) return null;
  return (
    <div style={{
      position: "absolute", left: x, top: y, width: w, height: h,
      opacity: p, transform: `rotate(${rot}deg) scale(${0.9 + 0.1 * p}) translateY(${Math.sin(f / 16) * 4}px)`,
      backgroundColor: "rgba(255,255,255,0.9)", border: `4px dashed ${color}`, borderRadius: 20,
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      boxShadow: "0 8px 22px rgba(58,58,58,0.10)",
    }}>
      <div style={{ fontFamily: B_FONT, fontWeight: 700, fontSize: ts, color: INK, whiteSpace: "nowrap" }}>{title}</div>
      {sub ? <div style={{ fontFamily: B_FONT, fontSize: ts * 0.72, color: SUBC, marginTop: 6, whiteSpace: "nowrap" }}>{sub}</div> : null}
    </div>
  );
};

const MixText: React.FC<{ text: string; latinScale?: number }> = ({ text, latinScale = 0.92 }) => {
  const parts = text.split(/([A-Za-z0-9.]+)/g);
  return (
    <>
      {parts.map((p, i) =>
        /^[A-Za-z0-9.]+$/.test(p) ? (
          <span key={i} style={{ fontFamily: "'Microsoft YaHei',sans-serif", fontWeight: 900, fontSize: `${latinScale}em`, letterSpacing: 1 }}>{p}</span>
        ) : (
          <span key={i}>{p}</span>
        )
      )}
    </>
  );
};

const HandTitle: React.FC<{ f: number; text: React.ReactNode; y?: number; size?: number; delay?: number; sub?: string }> = ({
  f, text, y = 56, size = 84, delay = 0, sub,
}) => {
  const p = prog(f, delay, 10);
  if (p <= 0) return null;
  const tw = (typeof text === "string" ? text.length : 8) * size * 1.02;
  return (
    <div style={{ position: "absolute", top: y, left: 0, right: 0, textAlign: "center", opacity: p }}>
      <div style={{ position: "relative", display: "inline-block" }}>
        <svg width={70} height={size} style={{ position: "absolute", left: -84, top: size * 0.18, overflow: "visible" }}>
          <path d="M 56 12 L 10 30 M 60 38 L 22 48 M 54 62 L 16 66" stroke={INK} strokeWidth={5} strokeLinecap="round" opacity={0.8} />
        </svg>
        <svg width={70} height={size} style={{ position: "absolute", right: -84, top: size * 0.18, overflow: "visible" }}>
          <path d="M 14 12 L 60 30 M 10 38 L 48 48 M 16 62 L 54 66" stroke={INK} strokeWidth={5} strokeLinecap="round" opacity={0.8} />
        </svg>
        <div style={{
          fontFamily: T_FONT, fontSize: size, color: INK, letterSpacing: 6,
          transform: "rotate(-0.6deg)", whiteSpace: "nowrap", lineHeight: 1.15,
        }}><MixText text={typeof text === "string" ? text : ""} />{typeof text === "string" ? null : text}</div>
        <div style={{ position: "absolute", left: "50%", transform: "translateX(-50%)", bottom: -18 }}>
          <svg width={tw * 0.72} height={20} style={{ overflow: "visible" }}>
            <Squiggle f={f} x={4} y={10} w={tw * 0.72 - 8} delay={delay + 8} />
          </svg>
        </div>
      </div>
      {sub ? (
        <div style={{ fontFamily: B_FONT, fontSize: 34, color: SUBC, marginTop: 26, letterSpacing: 4 }}>{sub}</div>
      ) : null}
    </div>
  );
};

const Stick: React.FC<{
  f: number; x: number; y: number; s?: number; delay?: number; color?: string; pose?: "point" | "cheer" | "walk" | "phone";
}> = ({ f, x, y, s = 1, delay = 0, color = INK, pose = "point" }) => {
  const p = prog(f, delay, 12);
  if (p <= 0) return null;
  const swing = pose === "walk" ? Math.sin(f / 6) * 9 : 0;
  return (
    <svg width={W} height={H} style={{ position: "absolute", left: 0, top: 0, overflow: "visible", pointerEvents: "none" }}>
      <g transform={`translate(${x},${y}) scale(${s})`} opacity={p}>
        <path d="M -22 -60 Q 0 -78 22 -60" fill="none" stroke={color} strokeWidth={5} strokeLinecap="round" opacity={p * 0.9} />
        <circle cx={0} cy={-84} r={22} fill="rgba(255,255,255,0.95)" stroke={color} strokeWidth={5} />
        <circle cx={-7} cy={-88} r={2.6} fill={color} />
        <circle cx={7} cy={-88} r={2.6} fill={color} />
        <path d="M -8 -78 Q 0 -72 8 -78" fill="none" stroke={color} strokeWidth={3.5} strokeLinecap="round" />
        <path d="M 0 -62 L 0 6" stroke={color} strokeWidth={5.5} strokeLinecap="round" />
        {pose === "cheer" ? (
          <>
            <path d="M 0 -50 L -26 -76" stroke={color} strokeWidth={5} strokeLinecap="round" />
            <path d="M 0 -50 L 26 -76" stroke={color} strokeWidth={5} strokeLinecap="round" />
          </>
        ) : pose === "phone" ? (
          <>
            <path d="M 0 -50 L -24 -26" stroke={color} strokeWidth={5} strokeLinecap="round" />
            <path d="M 0 -50 L 22 -70" stroke={color} strokeWidth={5} strokeLinecap="round" />
            <path d={sketchRectPath(16, -92, 16, 26, 12)} fill={YEL_F} stroke={color} strokeWidth={4} />
          </>
        ) : (
          <>
            <path d="M 0 -50 L -24 -24" stroke={color} strokeWidth={5} strokeLinecap="round" />
            <path d={`M 0 -50 L 30 ${-38 + swing * 0.4}`} stroke={color} strokeWidth={5} strokeLinecap="round" />
          </>
        )}
        <path d={`M 0 6 L -20 ${44 + swing}`} stroke={color} strokeWidth={5} strokeLinecap="round" />
        <path d={`M 0 6 L 20 ${44 - swing}`} stroke={color} strokeWidth={5} strokeLinecap="round" />
      </g>
    </svg>
  );
};

const SpiralBinding: React.FC = () => {
  const coils: React.ReactNode[] = [];
  const n = 12;
  for (let i = 0; i < n; i++) {
    const y = 60 + i * ((H - 120) / (n - 1));
    coils.push(
      <g key={i}>
        <ellipse cx={52} cy={y} rx={30} ry={13} fill="none" stroke="#4a4a4a" strokeWidth={6}
          transform={`rotate(-28 52 ${y})`} />
        <path d={`M 74 ${y - 4} Q 92 ${y} 86 ${y + 10}`} stroke="#6a6a6a" strokeWidth={4} fill="none" strokeLinecap="round" opacity={0.7} />
        <path d={`M 108 ${y - 9} a 9 7 0 1 0 0.1 0`} fill="rgba(90,90,90,0.16)" stroke="none" />
      </g>
    );
  }
  return (
    <>
      <div style={{
        position: "absolute", left: 0, top: 0, bottom: 0, width: 26,
        background: "linear-gradient(90deg, rgba(70,60,45,0.20), rgba(70,60,45,0))",
      }} />
      <svg width={200} height={H} style={{ position: "absolute", left: 0, top: 0, overflow: "visible", pointerEvents: "none", zIndex: 30 }}>
        {coils}
      </svg>
    </>
  );
};

const CoffeeStains: React.FC = () => (
  <svg width={W} height={H} style={{ position: "absolute", left: 0, top: 0, pointerEvents: "none", zIndex: 1 }}>
    <path d={blobPath(1660, 190, 62, 48, 11)} fill="rgba(150,110,70,0.07)" stroke="none" />
    <path d={blobPath(1660, 190, 52, 40, 11)} fill="none" stroke={STAIN} strokeWidth={5} />
    <circle cx={1738} cy={248} r={7} fill="rgba(150,110,70,0.18)" />
    <path d={blobPath(210, 330, 40, 32, 5)} fill="rgba(150,110,70,0.06)" stroke="none" />
    <path d={blobPath(210, 330, 32, 26, 5)} fill="none" stroke={STAIN} strokeWidth={4.5} />
    <circle cx={256} cy={372} r={5} fill="rgba(150,110,70,0.16)" />
    <path d={blobPath(1790, 860, 48, 38, 8)} fill="rgba(150,110,70,0.06)" stroke="none" />
    <path d={blobPath(1790, 860, 39, 31, 8)} fill="none" stroke={STAIN} strokeWidth={4.5} />
  </svg>
);

const Bulb: React.FC<{ f: number; x: number; y: number; s?: number; delay?: number }> = ({ f, x, y, s = 1.2, delay = 0 }) => {
  const p = prog(f, delay, 12);
  if (p <= 0) return null;
  return (
    <svg width={W} height={H} style={{ position: "absolute", left: 0, top: 0, overflow: "visible", pointerEvents: "none" }}>
      <g transform={`translate(${x},${y}) scale(${s})`} opacity={p}>
        <circle cx={0} cy={0} r={24} fill={YEL_F} stroke={INK} strokeWidth={5} />
        <path d="M -9 24 L 9 24 M -7 31 L 7 31" stroke={INK} strokeWidth={4.5} fill="none" strokeLinecap="round" />
        <path d="M 0 -38 L 0 -50 M 30 -22 L 40 -30 M -30 -22 L -40 -30" stroke="#d9a12c" strokeWidth={4.5} strokeLinecap="round" />
      </g>
    </svg>
  );
};

// ---------- 本片专属图标 ----------

// 数据库圆柱
const DbCylinder: React.FC<{ f: number; x: number; y: number; s?: number; delay?: number; rot?: number }> = ({
  f, x, y, s = 1, delay = 0, rot = 0,
}) => {
  const p = prog(f, delay, 14);
  if (p <= 0) return null;
  return (
    <svg width={W} height={H} style={{ position: "absolute", left: 0, top: 0, overflow: "visible", pointerEvents: "none" }}>
      <g transform={`translate(${x},${y}) rotate(${rot}) scale(${s})`} opacity={p}>
        <path d="M -150 -70 L -150 70 Q 0 128 150 70 L 150 -70" fill="rgba(255,255,255,0.94)" stroke={INK} strokeWidth={6} />
        <path d="M -150 10 Q 0 68 150 10" fill="none" stroke={INK} strokeWidth={5} />
        <ellipse cx={0} cy={-70} rx={150} ry={46} fill={BLUE_F} stroke={INK} strokeWidth={6} />
        <text x={0} y={64} textAnchor="middle" fontFamily={B_FONT} fontSize={34} fontWeight={700} fill={INK}>数据库</text>
      </g>
    </svg>
  );
};

// 粉碎机
const Shredder: React.FC<{ f: number; x: number; y: number; s?: number; delay?: number; rot?: number }> = ({
  f, x, y, s = 1, delay = 0, rot = 0,
}) => {
  const p = prog(f, delay, 14);
  if (p <= 0) return null;
  return (
    <svg width={W} height={H} style={{ position: "absolute", left: 0, top: 0, overflow: "visible", pointerEvents: "none" }}>
      <g transform={`translate(${x},${y}) rotate(${rot}) scale(${s})`} opacity={p}>
        <path d={sketchRectPath(-100, 168, 200, 26, 7)} fill="rgba(255,255,255,0.9)" stroke={INK} strokeWidth={5} />
        <path d={sketchRectPath(-115, -80, 230, 230, 4)} fill="rgba(255,255,255,0.94)" stroke={INK} strokeWidth={6.5} />
        <path d={sketchRectPath(-70, -108, 140, 26, 9)} fill={BLUE_F} stroke={INK} strokeWidth={5} />
        <path d="M -100 96 L -78 122 L -56 96 L -34 122 L -12 96 L 10 122 L 32 96 L 54 122 L 76 96 L 98 122"
          stroke={INK} strokeWidth={4.5} fill="none" strokeLinejoin="round" opacity={0.7} />
        <circle cx={142} cy={20} r={18} fill={ORANGE_F} stroke={INK} strokeWidth={5} />
        <path d="M 142 20 L 170 2" stroke={INK} strokeWidth={5} strokeLinecap="round" />
      </g>
    </svg>
  );
};

// 乱码纸条
const GarbleSlip: React.FC<{ f: number; x: number; y: number; w?: number; h?: number; delay?: number; rot?: number; ts?: number }> = ({
  f, x, y, w = 170, h = 140, delay = 0, rot = -4, ts = 22,
}) => {
  const p = prog(f, delay, 12);
  if (p <= 0) return null;
  return (
    <div style={{
      position: "absolute", left: x, top: y, width: w, height: h,
      opacity: p, transform: `rotate(${rot}deg) scale(${0.88 + 0.12 * p})`,
      backgroundColor: "rgba(255,255,255,0.95)", border: `3.5px solid ${INK}`, borderRadius: 6,
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      fontFamily: MONO, fontWeight: 700, fontSize: ts, color: SUBC,
      whiteSpace: "nowrap", overflow: "hidden", lineHeight: 1.4,
    }}>
      <div>9f86d081</div>
      <div>884c7d65</div>
      <div>7d6...c2</div>
    </div>
  );
};

// 盐罐
const SaltShaker: React.FC<{ f: number; x: number; y: number; s?: number; delay?: number }> = ({
  f, x, y, s = 1, delay = 0,
}) => {
  const p = prog(f, delay, 12);
  if (p <= 0) return null;
  const tilt = -26 + Math.sin(f / 9) * 4;
  return (
    <svg width={W} height={H} style={{ position: "absolute", left: 0, top: 0, overflow: "visible", pointerEvents: "none" }}>
      <g transform={`translate(${x},${y}) rotate(${tilt}) scale(${s})`} opacity={p}>
        <path d="M -36 44 Q -44 -28 0 -46 Q 44 -28 36 44 Q 0 58 -36 44 Z"
          fill="rgba(255,255,255,0.95)" stroke={INK} strokeWidth={5.5} />
        <path d={sketchRectPath(-26, -68, 52, 24, 12)} fill={ORANGE_F} stroke={INK} strokeWidth={4.5} />
        <circle cx={-10} cy={-56} r={3.5} fill={INK} />
        <circle cx={2} cy={-56} r={3.5} fill={INK} />
        <circle cx={14} cy={-56} r={3.5} fill={INK} />
        <text x={0} y={26} textAnchor="middle" fontFamily={B_FONT} fontSize={32} fontWeight={700} fill={INK}>盐</text>
      </g>
    </svg>
  );
};

// 摊开的查询表小册子
const Booklet: React.FC<{ f: number; x: number; y: number; w: number; h: number; delay?: number }> = ({
  f, x, y, w, h, delay = 0,
}) => (
  <>
    <WBox f={f} x={x} y={y} w={w * 0.48} h={h} fill="rgba(255,255,255,0.94)" sw={5.5} seed={3} delay={delay} />
    <WBox f={f} x={x + w * 0.52} y={y} w={w * 0.48} h={h} fill="rgba(255,255,255,0.94)" sw={5.5} seed={6} delay={delay + 6} />
    <Draw f={f} d={`M ${x + w * 0.5} ${y} L ${x + w * 0.5} ${y + h}`} stroke={INK} sw={4} delay={delay + 10} dur={8} />
    <Draw f={f} d={`M ${x + 24} ${y + 44} L ${x + w * 0.48 - 24} ${y + 44}`} stroke={SUBC} sw={4} delay={delay + 12} dur={8} op={0.6} />
    <Draw f={f} d={`M ${x + w * 0.52 + 24} ${y + 44} L ${x + w - 24} ${y + 44}`} stroke={SUBC} sw={4} delay={delay + 14} dur={8} op={0.6} />
  </>
);

// 大红叉
const BigX: React.FC<{ f: number; x: number; y: number; s?: number; delay?: number; color?: string }> = ({
  f, x, y, s = 1, delay = 0, color = RED,
}) => {
  const p = prog(f, delay, 10);
  if (p <= 0) return null;
  return (
    <svg width={W} height={H} style={{ position: "absolute", left: 0, top: 0, overflow: "visible", pointerEvents: "none" }}>
      <g transform={`translate(${x},${y}) scale(${s})`} opacity={p}>
        <path d="M -55 -55 Q 0 -6 55 55" stroke={color} strokeWidth={12} fill="none" strokeLinecap="round" />
        <path d="M 55 -55 Q 0 -6 -55 55" stroke={color} strokeWidth={12} fill="none" strokeLinecap="round" />
      </g>
    </svg>
  );
};

// ================= P0 封面钩子（第 0 帧完整） =================

const PageHook: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill>
      <HandTitle f={f} text="你的密码在服务器里是怎么存的？" y={68} size={70} delay={STATIC} />
      <DbCylinder f={f} x={820} y={480} s={1.15} delay={STATIC} />
      <div style={{
        position: "absolute", left: 660, top: 700, width: 320, textAlign: "center",
        fontFamily: B_FONT, fontSize: 34, color: SUBC, whiteSpace: "nowrap",
      }}>整台服务器被拖走</div>
      {/* 被拖走：红色箭头 */}
      <Arrow f={f} x={600} y={430} len={230} color={RED} sw={7} bend={-14} flip delay={A.tuo} />
      <PopAt f={A.tuo}>
        <div style={{
          position: "absolute", left: 200, top: 350, width: 300, textAlign: "center",
          fontFamily: T_FONT, fontSize: 54, color: RED, whiteSpace: "nowrap",
        }}>整库拖走</div>
      </PopAt>
      {/* 会泄露吗 */}
      <Bubble f={f} x={1230} y={240} w={320} h={120} text="密码会泄露吗？" ts={38} delay={STATIC} tail="bl" />
      {/* 两种存法 */}
      <PopAt f={A.na}>
        <div style={{
          position: "absolute", left: 1300, top: 500, width: 160, height: 90,
          backgroundColor: "rgba(255,255,255,0.95)", border: `4px solid ${ORANGE_E}`, borderRadius: 14,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontFamily: B_FONT, fontWeight: 700, fontSize: 36, color: INK,
        }}>明文？</div>
      </PopAt>
      <PopAt f={A.na + 10}>
        <div style={{
          position: "absolute", left: 1490, top: 500, width: 160, height: 90,
          backgroundColor: "rgba(255,255,255,0.95)", border: `4px solid ${BLUE_E}`, borderRadius: 14,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontFamily: B_FONT, fontWeight: 700, fontSize: 36, color: INK,
        }}>乱码？</div>
      </PopAt>
      <Stick f={f} x={1620} y={830} s={1.15} delay={STATIC} color={BLUE_E} pose="point" />
    </AbsoluteFill>
  );
};

// ================= P1 低级存法：明文抽屉 =================

const PagePlain: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill>
      <HandTitle f={f} text="低级存法：明文" y={64} size={84} delay={STATIC} />
      {/* 柜体 */}
      <WBox f={f} x={480} y={260} w={780} h={190} fill="rgba(255,255,255,0.9)" sw={7} seed={5} delay={STATIC} />
      {/* 拉开的抽屉（明文躺在里面） */}
      <WBox f={f} x={560} y={470} w={660} h={200} fill="rgba(255,255,255,0.94)" sw={6.5} seed={9} delay={STATIC} />
      <Draw f={f} d="M 880 500 L 880 636" stroke={INK} sw={4} delay={STATIC} dur={8} op={0.5} />
      <circle cx={880} cy={622} r={10} fill={ORANGE_F} stroke={INK} strokeWidth={4} />
      {/* 明文纸条（内收于抽屉两格，不压边框/中缝） */}
      <div style={{
        position: "absolute", left: 608, top: 508, width: 250, height: 100,
        backgroundColor: "rgba(255,255,255,0.97)", border: `3.5px solid ${INK}`, borderRadius: 6,
        transform: "rotate(-2deg)", display: "flex", alignItems: "center", justifyContent: "center",
        fontFamily: MONO, fontSize: 26, fontWeight: 700, color: INK, whiteSpace: "nowrap",
      }}>admin / 123456</div>
      <div style={{
        position: "absolute", left: 896, top: 516, width: 250, height: 100,
        backgroundColor: "rgba(255,255,255,0.97)", border: `3.5px solid ${INK}`, borderRadius: 6,
        transform: "rotate(2deg)", display: "flex", alignItems: "center", justifyContent: "center",
        fontFamily: MONO, fontSize: 26, fontWeight: 700, color: INK, whiteSpace: "nowrap",
      }}>user / qwerty</div>
      <Sticker f={f} x={1330} y={290} w={230} h={100} title="明文" ts={48} color={RED} rot={-4} delay={A.mingWen} />
      <Sticker f={f} x={1330} y={470} w={440} h={140} title="拖库一次" sub="全站密码全都看光" color={RED} rot={-2} ts={40} delay={A.tuoKu} />
      <PopAt f={A.luoben}>
        <div style={{
          position: "absolute", left: 0, right: 0, top: 780, textAlign: "center",
          fontFamily: T_FONT, fontSize: 56, color: RED, whiteSpace: "nowrap",
        }}>等于全站裸奔</div>
      </PopAt>
    </AbsoluteFill>
  );
};

// ================= P2 正规军：粉碎机 =================

const PageShred: React.FC = () => {
  const f = useCurrentFrame();
  const wobble = f >= A.fenSui + 20 && f <= A.luanMa + 16 ? Math.sin(f / 1.8) * 1.6 : 0;
  const tp = interpolate(f, [A.miMa, A.miMa + 38], [0, 1], clamp);
  return (
    <AbsoluteFill>
      <HandTitle f={f} text="正规军：哈希粉碎机" y={64} size={80} delay={STATIC} />
      <Shredder f={f} x={860} y={500} s={1.1} delay={STATIC} rot={wobble} />
      {/* 密码纸飞进投料口 */}
      {tp > 0.02 && tp < 1 ? (
        <div style={{
          position: "absolute", left: 460 + 340 * tp, top: 350 + 66 * tp,
          width: 130, height: 84, backgroundColor: "rgba(255,255,255,0.96)",
          border: `3.5px solid ${INK}`, borderRadius: 6, transform: `rotate(${-8 + 14 * tp}deg)`,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontFamily: B_FONT, fontWeight: 700, fontSize: 32, color: INK, whiteSpace: "nowrap",
        }}>密码</div>
      ) : null}
      {/* 出来的乱码纸条 */}
      <GarbleSlip f={f} x={780} y={706} w={180} h={150} delay={A.luanMa} rot={-3} ts={24} />
      <PopAt f={A.miMa}>
        <div style={{
          position: "absolute", left: 300, top: 300, width: 280, textAlign: "center",
          fontFamily: B_FONT, fontSize: 34, color: INK, whiteSpace: "nowrap",
        }}>密码进门</div>
      </PopAt>
      <PopAt f={A.luanMa}>
        <div style={{
          position: "absolute", left: 990, top: 730, width: 300, textAlign: "center",
          fontFamily: B_FONT, fontSize: 32, color: SUBC, whiteSpace: "nowrap",
        }}>看不出原样</div>
      </PopAt>
      <Sticker f={f} x={1210} y={360} w={460} h={120} title="服务器只存乱码" ts={42} color={GREEN_E} rot={-2} delay={A.cun} />
    </AbsoluteFill>
  );
};

// ================= P3 单向：变不回 =================

const PageOneWay: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill>
      <HandTitle f={f} text="哈希是单向的" y={64} size={84} delay={STATIC} />
      {/* 左：乱码 右：密码 */}
      <WBox f={f} x={330} y={330} w={340} h={160} fill="rgba(255,255,255,0.94)" sw={6.5} seed={3} delay={STATIC} />
      <div style={{
        position: "absolute", left: 330, top: 375, width: 340, textAlign: "center",
        fontFamily: B_FONT, fontWeight: 700, fontSize: 44, color: INK, whiteSpace: "nowrap",
      }}>乱码</div>
      <WBox f={f} x={1250} y={330} w={340} h={160} fill="rgba(255,255,255,0.94)" sw={6.5} seed={8} delay={STATIC} />
      <div style={{
        position: "absolute", left: 1250, top: 375, width: 340, textAlign: "center",
        fontFamily: B_FONT, fontWeight: 700, fontSize: 44, color: INK, whiteSpace: "nowrap",
      }}>密码</div>
      {/* 正向：密码 → 乱码（可行） */}
      <Arrow f={f} x={1210} y={380} len={520} color={GREEN_E} sw={7} bend={-26} flip delay={STATIC} />
      <div style={{
        position: "absolute", left: 0, right: 0, top: 268, textAlign: "center",
        fontFamily: B_FONT, fontSize: 36, color: GREEN_E, whiteSpace: "nowrap",
      }}>密码搅成乱码：可以</div>
      {/* 反向：乱码 → 密码（变不回） */}
      <Arrow f={f} x={710} y={560} len={520} color={RED} sw={7} bend={-26} delay={A.danXiang} />
      <BigX f={f} x={970} y={630} s={0.8} delay={A.hui} />
      <PopAt f={A.hui}>
        <div style={{
          position: "absolute", left: 0, right: 0, top: 716, textAlign: "center",
          fontFamily: T_FONT, fontSize: 50, color: RED, whiteSpace: "nowrap",
        }}>乱码变不回密码</div>
      </PopAt>
      {/* 登录比对 */}
      <PopAt f={A.dengLu}>
        <div style={{
          position: "absolute", left: 0, right: 0, top: 796, textAlign: "center",
          fontFamily: B_FONT, fontSize: 34, color: INK, whiteSpace: "nowrap",
        }}>登录时：把你输的密码再搅一次</div>
      </PopAt>
      <WCol f={f} cx={960} cy={884} rx={330} ry={40} color={GREEN_F} seed={5} delay={A.biDui} />
      <PopAt f={A.biDui}>
        <div style={{
          position: "absolute", left: 0, right: 0, top: 854, textAlign: "center",
          fontFamily: B_FONT, fontWeight: 700, fontSize: 38, color: GREEN_E, whiteSpace: "nowrap",
        }}>两团乱码一致 ＝ 是你本人</div>
      </PopAt>
    </AbsoluteFill>
  );
};

// ================= P4 破绽：查询表小册子 =================

const PageTable: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill>
      <HandTitle f={f} text="简单密码的破绽" y={64} size={84} delay={STATIC} />
      <Booklet f={f} x={660} y={300} w={560} h={380} delay={STATIC} />
      {/* 封面标题（上移，不贴册子上边缘） */}
      <PopAt f={A.biao}>
        <div style={{
          position: "absolute", left: 700, top: 224, width: 480, textAlign: "center",
          fontFamily: T_FONT, fontSize: 46, color: INK, whiteSpace: "nowrap",
        }}>查询表</div>
      </PopAt>
      {/* 破绽裂纹（避开右页条目） */}
      <PopAt f={A.poZhan}>
        <svg width={W} height={H} style={{ position: "absolute", left: 0, top: 0, overflow: "visible", pointerEvents: "none" }}>
          <path d="M 1140 312 L 1114 344 L 1150 362 L 1124 388" stroke={RED} strokeWidth={7} fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </PopAt>
      {/* 表内条目（各占一页，不跨中缝） */}
      <PopAt f={A.mi123456}>
        <div style={{
          position: "absolute", left: 684, top: 400, width: 220,
          fontFamily: MONO, fontSize: 20, fontWeight: 700, color: INK, whiteSpace: "nowrap",
        }}>123456 → e10adc…</div>
      </PopAt>
      <PopAt f={A.poZhan + 40}>
        <div style={{
          position: "absolute", left: 972, top: 400, width: 220,
          fontFamily: MONO, fontSize: 20, fontWeight: 700, color: INK, whiteSpace: "nowrap",
        }}>000000 → 6ae42a…</div>
      </PopAt>
      <Sticker f={f} x={1290} y={330} w={400} h={110} title="早被人提前算好" ts={36} color={RED} rot={2} delay={A.tiQian} />
      <WCol f={f} cx={960} cy={840} rx={340} ry={46} color={ORANGE_F} seed={4} delay={A.chaXun} />
      <PopAt f={A.chaXun}>
        <div style={{
          position: "absolute", left: 0, right: 0, top: 800, textAlign: "center",
          fontFamily: T_FONT, fontSize: 54, color: RED, whiteSpace: "nowrap",
        }}>一查一个准</div>
      </PopAt>
    </AbsoluteFill>
  );
};

// ================= P5 解法：撒盐 =================

const PageSalt: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill>
      <HandTitle f={f} text="所以：再撒一把盐" y={64} size={80} delay={STATIC} />
      <Shredder f={f} x={760} y={540} s={0.9} delay={STATIC} />
      <SaltShaker f={f} x={760} y={330} s={1.1} delay={A.yan} />
      {/* 撒下的盐粒 */}
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <svg key={i} width={W} height={H} style={{ position: "absolute", left: 0, top: 0, overflow: "visible", pointerEvents: "none" }}>
          <circle cx={726 + i * 14} cy={420 + i * 16 + Math.sin(f / 7 + i) * 3} r={5}
            fill={ORANGE_E} opacity={prog(f, A.yan + 6 + i * 3, 8) * 0.8} />
        </svg>
      ))}
      <Sticker f={f} x={1030} y={300} w={480} h={110} title="拼上一段随机字符" ts={38} color={ORANGE_E} rot={-2} delay={A.suiJi} />
      {/* 独一份的乱码 */}
      <GarbleSlip f={f} x={330} y={690} w={190} h={150} delay={A.fen} rot={4} ts={24} />
      <PopAt f={A.fen}>
        <div style={{
          position: "absolute", left: 580, top: 720, width: 900,
          fontFamily: B_FONT, fontWeight: 700, fontSize: 40, color: INK, whiteSpace: "nowrap",
        }}>同一碗乱码 全世界只此一份</div>
      </PopAt>
    </AbsoluteFill>
  );
};

// ================= P6 真实教训：拖库事件 =================

const PageLesson: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill>
      <HandTitle f={f} text="真实的教训" y={64} size={84} delay={STATIC} />
      {/* 查询表作废（承接上句） */}
      <PopAt f={A.zuoFei}>
        <Booklet f={f} x={1330} y={260} w={330} h={210} delay={A.zuoFei} />
        <BigX f={f} x={1495} y={365} s={0.9} delay={A.zuoFei + 8} />
        <div style={{
          position: "absolute", left: 1330, top: 480, width: 330, textAlign: "center",
          fontFamily: B_FONT, fontWeight: 700, fontSize: 34, color: RED, whiteSpace: "nowrap",
        }}>查询表作废</div>
      </PopAt>
      {/* 被拖走的库（翻倒） */}
      <DbCylinder f={f} x={560} y={480} s={1.2} rot={-64} delay={A.tuoKu2} />
      {/* 撒出来的纸条 */}
      <PopAt f={A.tuoKu2 + 10}>
        <GarbleSlip f={f} x={720} y={620} w={150} h={110} delay={A.tuoKu2 + 10} rot={10} ts={18} />
      </PopAt>
      <PopAt f={A.duan}>
        <div style={{
          position: "absolute", left: 240, top: 740, width: 700, textAlign: "center",
          fontFamily: B_FONT, fontSize: 36, color: INK, whiteSpace: "nowrap",
        }}>大型网站拖库 被端出来的库</div>
      </PopAt>
      <Sticker f={f} x={1060} y={560} w={480} h={140} title="多半是没加盐" sub="甚至是明文的库" color={RED} rot={-2} ts={38} delay={A.jia} />
    </AbsoluteFill>
  );
};

// ================= P7 金句（无底部字幕时段） =================

const PageGolden: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill>
      <WCol f={f} cx={960} cy={500} rx={470} ry={92} color={YEL_F} seed={3} delay={STATIC} />
      <div style={{
        position: "absolute", top: 280, left: 0, right: 0, textAlign: "center",
        fontFamily: T_FONT, fontSize: 86, color: INK, letterSpacing: 6,
        whiteSpace: "nowrap", transform: "rotate(-0.8deg)",
      }}>正规服务器只存乱码和盐</div>
      <div style={{
        position: "absolute", top: 450, left: 0, right: 0, textAlign: "center",
        fontFamily: T_FONT, fontSize: 110, color: RED, letterSpacing: 10,
        whiteSpace: "nowrap", transform: "rotate(-0.8deg)",
        textShadow: "10px 10px 0 rgba(201,79,79,0.12)",
      }}>永远不存你的原密码</div>
      <div style={{ position: "absolute", top: 650, left: "50%", transform: "translateX(-50%)" }}>
        <svg width={820} height={22}>
          <Squiggle f={f} x={4} y={11} w={812} delay={STATIC} />
        </svg>
      </div>
      <Stick f={f} x={300} y={880} s={1.15} delay={STATIC} color={BLUE_E} pose="cheer" />
      <Bulb f={f} x={1630} y={310} s={1.3} delay={STATIC} />
    </AbsoluteFill>
  );
};

// ================= P8 结尾提醒 + 结尾截图卡 =================

const PageOutro: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill>
      {/* 无背景大标题：截图卡 children 金句行占据顶部，避免被卡上缘截断 */}
      <Sticker f={f} x={540} y={400} w={840} h={140} title="不同网站 别用同一个密码" ts={46} color={ORANGE_E} rot={-2} delay={A.buTong} />
      <PopAt f={A.tuoZou}>
        <div style={{
          position: "absolute", left: 0, right: 0, top: 640, textAlign: "center",
          fontFamily: B_FONT, fontSize: 36, color: SUBC, whiteSpace: "nowrap",
        }}>防的就是：库被拖走</div>
      </PopAt>
      <Stick f={f} x={1600} y={820} s={1.15} delay={STATIC} color={GREEN_E} pose="cheer" />
    </AbsoluteFill>
  );
};

// ================= 组装（纯硬切 + 结尾卡 + 字幕 + 音轨） =================

const PAGES = [
  { C: PageHook, from: PAGE_START[0], dur: PAGE_START[1] - PAGE_START[0] },
  { C: PagePlain, from: PAGE_START[1], dur: PAGE_START[2] - PAGE_START[1] },
  { C: PageShred, from: PAGE_START[2], dur: PAGE_START[3] - PAGE_START[2] },
  { C: PageOneWay, from: PAGE_START[3], dur: PAGE_START[4] - PAGE_START[3] },
  { C: PageTable, from: PAGE_START[4], dur: PAGE_START[5] - PAGE_START[4] },
  { C: PageSalt, from: PAGE_START[5], dur: PAGE_START[6] - PAGE_START[5] },
  { C: PageLesson, from: PAGE_START[6], dur: PAGE_START[7] - PAGE_START[6] },
  { C: PageGolden, from: PAGE_START[7], dur: PAGE_START[8] - PAGE_START[7] },
  { C: PageOutro, from: PAGE_START[8], dur: DUR - PAGE_START[8] },
];

const SFX_PAGE_TURN = [PAGE_START[1], PAGE_START[2], PAGE_START[3], PAGE_START[4], PAGE_START[5], PAGE_START[6], PAGE_START[7], PAGE_START[8]];

// 金句窗口整体隐藏字幕（铁律⑫：句尾残留短语会被 SubtitleBar「最近一条」逻辑顺延显示到大字时段）
const GoldSafeSubs: React.FC = () => {
  const frame = useCurrentFrame();
  if (frame >= GOLD_FROM && frame < GOLD_TO) return null;
  return <SubtitleBar subs={SUBS} light />;
};

export const PwdHashSketch: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: PAPER, overflow: "hidden" }}>
      <CoffeeStains />
      {PAGES.map(({ C, from, dur }, i) => (
        <HardPage key={i} from={from} duration={dur}>
          <C />
        </HardPage>
      ))}
      <SpiralBinding />
      <BrandCorner light />
      <EndingCard
        startFrame={NARRATION_END - 70}
        title="密码怎么存"
        rows={["明文 ＝ 裸奔", "哈希 ＝ 只存乱码", "加盐 ＝ 查询表作废"]}
      >
        <div style={{
          position: "absolute", top: 52, left: 0, right: 0, textAlign: "center",
          fontFamily: T_FONT, fontSize: 54, color: INK, letterSpacing: 4, whiteSpace: "nowrap",
        }}>只存乱码和盐 · 不存原密码</div>
      </EndingCard>
      {/* 金句大字时段整体不渲染底部字幕（铁律⑫） */}
      <GoldSafeSubs />
      {/* 旁白 */}
      {NARR_START.map((st, i) => (
        <Sequence key={`vo-${i}`} from={st} durationInFrames={SENT_DUR[i] + 30}>
          <Audio src={staticFile(`audio/b10pwdhash-tts/s0${i + 1}.mp3`)} volume={1} />
        </Sequence>
      ))}
      {/* 音效（锚点取自数据帧，音量保守档） */}
      {SFX_PAGE_TURN.map((t) => (
        <Sequence key={`pt-${t}`} from={t - 6} durationInFrames={24}>
          <Audio src={staticFile("audio/sfx/page3.wav")} volume={0.3} />
        </Sequence>
      ))}
      <Sequence from={A.miMa} durationInFrames={24}>
        <Audio src={staticFile("audio/sfx/fly3.wav")} volume={0.16} />
      </Sequence>
      <Sequence from={A.luanMa} durationInFrames={20}>
        <Audio src={staticFile("audio/sfx/pop.wav")} volume={0.24} />
      </Sequence>
      <Sequence from={A.tuoKu} durationInFrames={24}>
        <Audio src={staticFile("audio/sfx/error.wav")} volume={0.2} />
      </Sequence>
      <Sequence from={A.yan} durationInFrames={20}>
        <Audio src={staticFile("audio/sfx/pop.wav")} volume={0.26} />
      </Sequence>
      <Sequence from={A.tuoKu2} durationInFrames={24}>
        <Audio src={staticFile("audio/sfx/error.wav")} volume={0.18} />
      </Sequence>
      <Sequence from={GOLD_FROM} durationInFrames={40}>
        <Audio src={staticFile("audio/sfx/success.wav")} volume={0.22} />
      </Sequence>
      {/* 结尾静置段：bed_outro（响度合格素材） */}
    </AbsoluteFill>
  );
};
