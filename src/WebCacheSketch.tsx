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
} from "./batch10/webcacheData";

// ============================================================
// 白板手绘 v2 · 《为什么第二次打开网页快很多？》（旅程线 · 全栈小秋）
// 9 句 = 9 页，页边界 = SENT_DUR 累加帧，kit.HardPage 纯硬切
// 页标题/主视觉 delay=STATIC（边界帧即完整画面），页内小元素挂 WORDS 词锚
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

// 旁白每句起点 = SUBS 中该句首条字幕帧
const NARR_START = SENT.map((_, i) =>
  Math.min(...SUBS.filter((s) => s.sent === i).map((s) => s.f))
);

const GOLD_FROM = PAGE_START[7];
const GOLD_TO = PAGE_START[8];

// ---------- 词锚 ----------
const A = {
  sanMiao: wordAt(WORDS, 0, "三秒"), // 71
  miaoKai: wordAt(WORDS, 0, "秒开"), // 104
  touTou: wordAt(WORDS, 1, "偷偷"), // 254
  liu: wordAt(WORDS, 1, "留"), // 268
  huanCun: wordAt(WORDS, 1, "缓存"), // 318
  logo: wordAt(WORDS, 2, "logo"), // 375
  tupian: wordAt(WORDS, 2, "图片"), // 392
  yangshi: wordAt(WORDS, 2, "样式"), // 413
  fuWuQi: wordAt(WORDS, 2, "服务器"), // 494
  huiLai: wordAt(WORDS, 2, "回来"), // 516
  man: wordAt(WORDS, 2, "慢"), // 529
  dingZhu: wordAt(WORDS, 3, "叮嘱"), // 618
  sanGeYue: wordAt(WORDS, 3, "三"), // 667
  cun: wordAt(WORDS, 3, "存"), // 717
  chuWu: wordAt(WORDS, 4, "储物"), // 862
  tuPian2: wordAt(WORDS, 4, "图片"), // 886
  benDi: wordAt(WORDS, 4, "本地"), // 898
  wen: wordAt(WORDS, 4, "问"), // 984
  meiBian: wordAt(WORDS, 5, "没"), // 1029
  kua: wordAt(WORDS, 5, "跨"), // 1087
  miaoKai2: wordAt(SUBS, 5, "秘密"), // 1115（结论条，须在页内完整可见）
  xin: wordAt(WORDS, 6, "新"), // 1263
  bao: wordAt(WORDS, 6, "抱"), // 1305
  fang: wordAt(WORDS, 6, "放"), // 1332
  qiangZhi: wordAt(WORDS, 6, "强制"), // 1345
  lvCheng: wordAt(WORDS, 8, "旅程"), // 1630
  huiChe: wordAt(WORDS, 8, "回车"), // 1589
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
  sw?: number; seed?: number; delay?: number; dur?: number;
}> = ({ f, x, y, w, h, fill = "none", stroke = INK, sw = 5, seed = 0, delay = 0, dur = 16 }) => (
  <Draw f={f} d={sketchRectPath(x, y, w, h, seed)} stroke={stroke} sw={sw} delay={delay} dur={dur} fill={fill} />
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

const ServerSketch: React.FC<{ f: number; x: number; y: number; s?: number; delay?: number; w?: number }> = ({
  f, x, y, s = 1, delay = 0, w = 200,
}) => {
  const h = w * 1.15;
  const p = prog(f, delay, 14);
  if (p <= 0) return null;
  return (
    <svg width={W} height={H} style={{ position: "absolute", left: 0, top: 0, overflow: "visible", pointerEvents: "none" }}>
      <g transform={`translate(${x},${y}) scale(${s})`} opacity={p}>
        <path d={sketchRectPath(-w / 2, -h / 2, w, h, 6)} fill="rgba(255,255,255,0.94)" stroke={INK} strokeWidth={6.5} />
        {[0, 1, 2].map((i) => (
          <React.Fragment key={i}>
            <path d={`M ${-w / 2 + 24} ${-h / 2 + 32 + i * 34} L ${w / 2 - 60} ${-h / 2 + 32 + i * 34}`} stroke={INK} strokeWidth={5.5} strokeLinecap="round" />
            <circle cx={w / 2 - 34} cy={-h / 2 + 32 + i * 34} r={7} fill={GREEN_F} stroke={INK} strokeWidth={3.5} />
          </React.Fragment>
        ))}
        <circle cx={0} cy={h / 2 - 34} r={10} fill={GREEN_F} stroke={INK} strokeWidth={4} />
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

// 手绘浏览器窗（mode=loading 转圈 / full 完整页面）
const BrowserWin: React.FC<{
  f: number; x: number; y: number; w: number; delay?: number; mode?: "loading" | "full";
}> = ({ f, x, y, w, delay = 0, mode = "full" }) => {
  const h = w * 0.62;
  return (
    <>
      <WBox f={f} x={x} y={y} w={w} h={h} fill="rgba(255,255,255,0.94)" sw={6} seed={4} delay={delay} />
      <Draw f={f} d={`M ${x + 2} ${y + 52} L ${x + w - 2} ${y + 52}`} stroke={INK} sw={4.5} delay={delay + 8} dur={8} />
      {[0, 1, 2].map((i) => (
        <circle key={i} cx={x + 30 + i * 30} cy={y + 26} r={8} fill={i === 0 ? RED : i === 1 ? "#e8b93c" : GREEN_E} opacity={prog(f, delay + 10 + i * 3, 6)} />
      ))}
      {mode === "loading" ? (
        <svg width={w} height={h} style={{ position: "absolute", left: x, top: y, overflow: "visible" }}>
          <g transform={`translate(${w / 2},${h / 2 + 26})`}>
            <g transform={`rotate(${f * 4})`}>
              <path d="M 0 -36 A 36 36 0 0 1 31.2 18" stroke={ORANGE_E} strokeWidth={7} fill="none" strokeLinecap="round" />
              <path d="M 0 -36 A 36 36 0 0 0 -31.2 18" stroke="rgba(58,58,58,0.18)" strokeWidth={7} fill="none" strokeLinecap="round" />
            </g>
          </g>
        </svg>
      ) : (
        <>
          <WCol f={f} cx={x + w * 0.3} cy={y + 130} rx={90} ry={44} color={BLUE_F} seed={3} delay={delay + 10} />
          <Draw f={f} d={`M ${x + w - 170} ${y + 110} L ${x + 40} ${y + 110}`} stroke={SUBC} sw={5} delay={delay + 14} dur={8} op={0.6} />
          <Draw f={f} d={`M ${x + w - 170} ${y + 140} L ${x + 40} ${y + 140}`} stroke={SUBC} sw={5} delay={delay + 18} dur={8} op={0.6} />
          <WBox f={f} x={x + w - 160} y={y + h - 78} w={120} h={44} fill={ORANGE_F} sw={4.5} seed={8} delay={delay + 22} />
        </>
      )}
    </>
  );
};

// 小货车
const Truck: React.FC<{ f: number; x: number; y: number; s?: number; delay?: number }> = ({
  f, x, y, s = 1, delay = 0,
}) => {
  const p = prog(f, delay, 12);
  if (p <= 0) return null;
  return (
    <svg width={W} height={H} style={{ position: "absolute", left: 0, top: 0, overflow: "visible", pointerEvents: "none" }}>
      <g transform={`translate(${x},${y}) scale(${s})`} opacity={p}>
        <path d={sketchRectPath(-95, -78, 170, 66, 3)} fill="rgba(255,255,255,0.95)" stroke={INK} strokeWidth={5.5} />
        <path d="M 80 -62 L 126 -62 L 148 -26 L 150 0 L 80 0 Z" fill={YEL_F} stroke={INK} strokeWidth={5.5} strokeLinejoin="round" />
        <circle cx={112} cy={-44} r={10} fill="rgba(139,178,216,0.5)" stroke={INK} strokeWidth={3.5} />
        <circle cx={-55} cy={8} r={17} fill="rgba(58,58,58,0.14)" stroke={INK} strokeWidth={5} />
        <circle cx={95} cy={8} r={17} fill="rgba(58,58,58,0.14)" stroke={INK} strokeWidth={5} />
      </g>
    </svg>
  );
};

// 小货箱卡片（货车上搬的 logo/图片/样式表）
const CargoCard: React.FC<{ f: number; x: number; y: number; text: string; delay?: number }> = ({
  f, x, y, text, delay = 0,
}) => {
  const p = prog(f, delay, 10);
  if (p <= 0) return null;
  return (
    <div style={{
      position: "absolute", left: x, top: y, width: 96, height: 60,
      opacity: p, transform: `scale(${0.85 + 0.15 * p})`,
      backgroundColor: "rgba(255,255,255,0.95)", border: `3.5px solid ${INK}`, borderRadius: 9,
      display: "flex", alignItems: "center", justifyContent: "center",
      fontFamily: B_FONT, fontWeight: 700, fontSize: 26, color: INK, whiteSpace: "nowrap",
    }}>{text}</div>
  );
};

// 储物柜
const Cabinet: React.FC<{ f: number; x: number; y: number; w: number; h: number; delay?: number }> = ({
  f, x, y, w, h, delay = 0,
}) => (
  <>
    <WBox f={f} x={x} y={y} w={w} h={h} fill="rgba(255,255,255,0.9)" sw={7} seed={5} delay={delay} />
    <Draw f={f} d={`M ${x + 8} ${y + h * 0.34} L ${x + w - 8} ${y + h * 0.34}`} stroke={INK} sw={5} delay={delay + 10} dur={10} />
    <Draw f={f} d={`M ${x + 8} ${y + h * 0.67} L ${x + w - 8} ${y + h * 0.67}`} stroke={INK} sw={5} delay={delay + 14} dur={10} />
    {/* 上层两个普通箱子 */}
    <WBox f={f} x={x + 40} y={y + 50} w={120} h={90} fill={BLUE_F} sw={4.5} seed={2} delay={delay + 18} />
    <WBox f={f} x={x + 200} y={y + 54} w={110} h={86} fill={ORANGE_F} sw={4.5} seed={6} delay={delay + 22} />
    {/* 中层普通箱子 */}
    <WBox f={f} x={x + 50} y={y + h * 0.34 + 30} w={120} h={92} fill={YEL_F} sw={4.5} seed={9} delay={delay + 26} />
    {/* 空格：待取件位置（虚线） */}
    <svg width={W} height={H} style={{ position: "absolute", left: 0, top: 0, overflow: "visible", pointerEvents: "none" }}>
      <rect x={x + w - 190} y={y + h * 0.34 + 36} width={140} height={96} fill="none" stroke={GREEN_E}
        strokeWidth={4.5} strokeDasharray="12 9" rx={10} opacity={prog(f, delay + 30, 8)} />
    </svg>
  </>
);

// 带页眉的浏览器页框
const PageFrame: React.FC<{ f: number; x: number; y: number; w: number; h: number; delay?: number }> = ({
  f, x, y, w, h, delay = 0,
}) => (
  <>
    <WBox f={f} x={x} y={y} w={w} h={h} fill="rgba(255,255,255,0.94)" sw={6.5} seed={7} delay={delay} />
    <Draw f={f} d={`M ${x + 2} ${y + 54} L ${x + w - 2} ${y + 54}`} stroke={INK} sw={4.5} delay={delay + 10} dur={8} />
    {[0, 1, 2].map((i) => (
      <circle key={i} cx={x + 30 + i * 30} cy={y + 27} r={8} fill={i === 0 ? RED : i === 1 ? "#e8b93c" : GREEN_E} opacity={prog(f, delay + 12 + i * 3, 6)} />
    ))}
  </>
);

// ================= P0 封面钩子（第 0 帧完整） =================

const PageHook: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill>
      <HandTitle f={f} text="为什么第二次打开网页快很多？" y={64} size={78} delay={STATIC} />
      {/* 左：第一次 → 转圈 */}
      <div style={{
        position: "absolute", left: 230, top: 252, width: 480, textAlign: "center",
        fontFamily: B_FONT, fontSize: 40, color: SUBC, whiteSpace: "nowrap",
      }}>第一次打开</div>
      <BrowserWin f={f} x={230} y={310} w={480} delay={STATIC} mode="loading" />
      {/* 右：第二次 → 完整页面 */}
      <div style={{
        position: "absolute", left: 1210, top: 252, width: 480, textAlign: "center",
        fontFamily: B_FONT, fontSize: 40, color: SUBC, whiteSpace: "nowrap",
      }}>第二次打开</div>
      <BrowserWin f={f} x={1210} y={310} w={480} delay={STATIC} mode="full" />
      <Arrow f={f} x={760} y={460} len={380} color={ORANGE_E} sw={7} bend={-26} delay={STATIC} />
      <PopAt f={A.sanMiao}>
        <div style={{
          position: "absolute", left: 280, top: 660, width: 380, textAlign: "center",
          fontFamily: T_FONT, fontSize: 58, color: RED, whiteSpace: "nowrap",
        }}>转了 3 秒</div>
      </PopAt>
      <PopAt f={A.miaoKai}>
        <div style={{
          position: "absolute", left: 1260, top: 660, width: 380, textAlign: "center",
          fontFamily: T_FONT, fontSize: 58, color: GREEN_E, whiteSpace: "nowrap",
        }}>秒开</div>
      </PopAt>
      <Stick f={f} x={960} y={856} s={1.15} delay={STATIC} color={BLUE_E} pose="cheer" />
    </AbsoluteFill>
  );
};

// ================= P1 缓存真凶 =================

const PageTruth: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill>
      <HandTitle f={f} text="真相：浏览器留了一手" y={64} size={80} delay={STATIC} />
      <BrowserWin f={f} x={560} y={300} w={640} delay={STATIC} mode="full" />
      {/* 偷偷藏起来的小仓库 */}
      <WBox f={f} x={1340} y={540} w={300} h={220} fill="rgba(255,255,255,0.9)" sw={6.5} seed={6} delay={STATIC} />
      <Draw f={f} d={`M 1350 600 Q 1490 570 1630 600`} stroke={INK} sw={5} delay={STATIC} dur={10} />
      <WBox f={f} x={1455} y={620} w={70} h={54} fill={YEL_F} sw={4.5} seed={3} delay={STATIC} />
      <Arrow f={f} x={1215} y={430} len={115} color={ORANGE_E} sw={6} bend={-16} delay={A.liu} />
      <Bubble f={f} x={790} y={158} w={380} h={100} text="偷偷留了一手…" ts={36} delay={A.touTou} tail="br" />
      <Sticker f={f} x={1240} y={452} w={280} h={150} title="缓存" ts={58} color={RED} rot={-6} delay={A.huanCun} />
    </AbsoluteFill>
  );
};

// ================= P2 第一次：货车搬运 =================

const PageFirstLoad: React.FC = () => {
  const f = useCurrentFrame();
  const t = interpolate(f, [A.logo, A.huiLai + 20], [0, 1], clamp);
  const tx = interpolate(t, [0, 1], [1370, 700]);
  const ty = 590 - Math.sin(Math.PI * t) * 66;
  return (
    <AbsoluteFill>
      <HandTitle f={f} text="第一次：每一件都要搬" y={64} size={80} delay={STATIC} />
      <BrowserWin f={f} x={150} y={430} w={430} delay={STATIC} mode="loading" />
      <ServerSketch f={f} x={1655} y={590} s={1.0} delay={STATIC} />
      <div style={{
        position: "absolute", left: 1520, top: 716, width: 280, textAlign: "center",
        fontFamily: B_FONT, fontSize: 30, color: SUBC, whiteSpace: "nowrap",
      }}>千里之外的服务器</div>
      {/* 运输路线（虚线） */}
      <svg width={W} height={H} style={{ position: "absolute", left: 0, top: 0, overflow: "visible", pointerEvents: "none" }}>
        <path d="M 640 660 Q 1000 560 1470 630" fill="none" stroke={RED} strokeWidth={6}
          strokeLinecap="round" strokeDasharray="18 16" opacity={0.75} />
      </svg>
      <Truck f={f} x={tx} y={ty} s={1.0} delay={A.logo - 6} />
      <CargoCard f={f} x={tx - 88} y={ty - 148} text="logo" delay={A.logo} />
      <CargoCard f={f} x={tx + 16} y={ty - 162} text="图片" delay={A.tupian} />
      <CargoCard f={f} x={tx + 118} y={ty - 144} text="样式表" delay={A.yangshi} />
      <WCol f={f} cx={960} cy={828} rx={370} ry={48} color={ORANGE_F} seed={3} delay={A.man} />
      <PopAt f={A.man}>
        <div style={{
          position: "absolute", left: 0, right: 0, top: 788, textAlign: "center",
          fontFamily: T_FONT, fontSize: 54, color: INK, whiteSpace: "nowrap",
        }}>慢是应该的</div>
      </PopAt>
    </AbsoluteFill>
  );
};

// ================= P3 服务器叮嘱：先存着 =================

const PageAdvise: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill>
      <HandTitle f={f} text="服务器叮嘱：先存着" y={64} size={80} delay={STATIC} />
      <ServerSketch f={f} x={430} y={580} s={1.15} delay={STATIC} />
      <div style={{
        position: "absolute", left: 310, top: 706, width: 240, textAlign: "center",
        fontFamily: B_FONT, fontSize: 30, color: SUBC, whiteSpace: "nowrap",
      }}>服务器</div>
      <PageFrame f={f} x={1380} y={400} w={360} h={250} delay={STATIC} />
      <div style={{
        position: "absolute", left: 1440, top: 664, width: 240, textAlign: "center",
        fontFamily: B_FONT, fontSize: 30, color: SUBC, whiteSpace: "nowrap",
      }}>你的浏览器</div>
      <Arrow f={f} x={580} y={470} len={740} color={ORANGE_E} sw={7} bend={-30} delay={STATIC} />
      <Bubble f={f} x={540} y={200} w={480} h={110} text="这张图三个月不会变" ts={38} delay={A.dingZhu} tail="br" />
      <Sticker f={f} x={1090} y={196} w={210} h={92} title="保质期 3 个月" ts={30} color={BLUE_E} rot={3} delay={A.sanGeYue} />
      <Sticker f={f} x={700} y={690} w={560} h={110} title="先存着 别每次都跑来拿" ts={40} color={ORANGE_E} rot={-2} delay={A.cun} />
    </AbsoluteFill>
  );
};

// ================= P4 第二次：翻储物间 =================

const PageSecond: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill>
      <HandTitle f={f} text="第二次：先翻储物间" y={64} size={80} delay={STATIC} />
      <PopAt f={A.chuWu}>
        <div style={{
          position: "absolute", left: 270, top: 218, width: 700, textAlign: "center",
          fontFamily: T_FONT, fontSize: 50, color: INK, whiteSpace: "nowrap",
        }}>储物间</div>
      </PopAt>
      <Cabinet f={f} x={300} y={300} w={640} h={470} delay={STATIC} />
      {/* 取出的图片（绿框空格位置） */}
      <PopAt f={A.tuPian2}>
        <div style={{
          position: "absolute", left: 762, top: 452, width: 140, height: 96,
          backgroundColor: BLUE_F, border: `4px solid ${INK}`, borderRadius: 10,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontFamily: B_FONT, fontWeight: 700, fontSize: 30, color: INK,
        }}>图片</div>
      </PopAt>
      <Sticker f={f} x={1000} y={318} w={310} h={100} title="本地直接用" ts={36} color={GREEN_E} rot={-3} delay={A.benDi} />
      <PageFrame f={f} x={1330} y={380} w={440} h={280} delay={STATIC} />
      <div style={{
        position: "absolute", left: 1430, top: 676, width: 240, textAlign: "center",
        fontFamily: B_FONT, fontSize: 30, color: SUBC, whiteSpace: "nowrap",
      }}>你的浏览器</div>
      <Arrow f={f} x={960} y={530} len={350} color={GREEN_E} sw={6.5} bend={-20} delay={STATIC} />
    </AbsoluteFill>
  );
};

// ================= P5 服务器回执：没变（304） =================

const PageReceipt: React.FC = () => {
  const f = useCurrentFrame();
  const tq = interpolate(f, [A.wen, A.wen + 32], [0, 1], clamp);
  const tr = interpolate(f, [A.meiBian, A.meiBian + 40], [0, 1], clamp);
  return (
    <AbsoluteFill>
      <HandTitle f={f} text="服务器回执：没变" y={64} size={80} delay={STATIC} />
      <BrowserWin f={f} x={170} y={420} w={440} delay={STATIC} mode="full" />
      <ServerSketch f={f} x={1655} y={580} s={1.0} delay={STATIC} />
      {/* 去问：蓝色小纸条飞过去 */}
      {tq > 0.02 && tq < 1 ? (
        <div style={{
          position: "absolute", left: 640 + 790 * tq, top: 470 - Math.sin(Math.PI * tq) * 56,
          width: 170, height: 74, backgroundColor: "rgba(255,255,255,0.95)",
          border: `4px solid ${BLUE_E}`, borderRadius: 10,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontFamily: B_FONT, fontWeight: 700, fontSize: 28, color: INK, whiteSpace: "nowrap",
        }}>有新的吗</div>
      ) : null}
      {/* 回执：绿色 304 没变 */}
      {tr > 0.02 && tr < 1 ? (
        <div style={{
          position: "absolute", left: 1440 - 800 * tr, top: 560 - Math.sin(Math.PI * tr) * 56,
          width: 190, height: 84, backgroundColor: GREEN_F,
          border: `4.5px solid ${GREEN_E}`, borderRadius: 12,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontFamily: MONO, fontWeight: 700, fontSize: 30, color: INK, whiteSpace: "nowrap",
        }}>304 没变</div>
      ) : null}
      <Sticker f={f} x={700} y={680} w={520} h={100} title="省下一趟跨省运输" ts={38} color={BLUE_E} rot={-2} delay={A.kua} />
      <WCol f={f} cx={960} cy={846} rx={420} ry={44} color={YEL_F} seed={3} delay={A.miaoKai2} />
      <PopAt f={A.miaoKai2}>
        <div style={{
          position: "absolute", left: 0, right: 0, top: 806, textAlign: "center",
          fontFamily: T_FONT, fontSize: 52, color: INK, whiteSpace: "nowrap",
        }}>这就是秒开的全部秘密</div>
      </PopAt>
    </AbsoluteFill>
  );
};

// ================= P6 副作用：旧图赖着不走 =================

const PageStale: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill>
      <HandTitle f={f} text="副作用：旧图赖着不走" y={64} size={80} delay={STATIC} />
      <PageFrame f={f} x={560} y={240} w={700} h={440} delay={STATIC} />
      <Draw f={f} d={`M 600 360 L 1180 360`} stroke={SUBC} sw={5} delay={STATIC} dur={8} op={0.55} />
      <Draw f={f} d={`M 600 400 L 820 400`} stroke={SUBC} sw={5} delay={STATIC} dur={8} op={0.55} />
      {/* 图标槽位（虚线） */}
      <svg width={W} height={H} style={{ position: "absolute", left: 0, top: 0, overflow: "visible", pointerEvents: "none" }}>
        <rect x={870} y={440} width={150} height={150} fill="none" stroke={INK}
          strokeWidth={4.5} strokeDasharray="12 9" rx={14} opacity={prog(f, STATIC, 1)} />
      </svg>
      {/* 新图标（虚影，随即被旧图压住） */}
      <PopAt f={A.xin}>
        <svg width={W} height={H} style={{ position: "absolute", left: 0, top: 0, overflow: "visible", pointerEvents: "none" }}>
          <circle cx={945} cy={515} r={52} fill="none" stroke={SUBC} strokeWidth={4.5} strokeDasharray="10 8" />
        </svg>
        <div style={{
          position: "absolute", left: 1030, top: 420, width: 130,
          fontFamily: B_FONT, fontSize: 26, color: SUBC, whiteSpace: "nowrap",
        }}>新图标</div>
      </PopAt>
      {/* 旧图标：抱住不放 */}
      <PopAt f={A.bao}>
        <svg width={W} height={H} style={{ position: "absolute", left: 0, top: 0, overflow: "visible", pointerEvents: "none" }}>
          <circle cx={945} cy={515} r={54} fill={ORANGE_F} stroke={INK} strokeWidth={5.5} />
          <circle cx={928} cy={505} r={5} fill={INK} />
          <circle cx={962} cy={505} r={5} fill={INK} />
          <path d="M 928 536 Q 945 526 962 536" fill="none" stroke={INK} strokeWidth={4} strokeLinecap="round" />
          <path d="M 893 545 Q 862 560 878 588" fill="none" stroke={INK} strokeWidth={5} strokeLinecap="round" />
          <path d="M 997 545 Q 1028 560 1012 588" fill="none" stroke={INK} strokeWidth={5} strokeLinecap="round" />
        </svg>
        <div style={{
          position: "absolute", left: 1022, top: 470, width: 130,
          fontFamily: B_FONT, fontSize: 28, fontWeight: 700, color: INK, whiteSpace: "nowrap",
        }}>旧图标</div>
      </PopAt>
      <Bubble f={f} x={1140} y={300} w={280} h={96} text="我就不走" ts={34} delay={A.fang} tail="bl" color="rgba(253,243,224,0.95)" />
      {/* 强制刷新旋钮 */}
      <PopAt f={A.qiangZhi}>
        <svg width={W} height={H} style={{ position: "absolute", left: 0, top: 0, overflow: "visible", pointerEvents: "none" }}>
          <g transform={`translate(1520,560) rotate(${prog(f, A.qiangZhi, 20) * 300 - 60})`}>
            <circle cx={0} cy={0} r={62} fill="rgba(255,255,255,0.95)" stroke={INK} strokeWidth={6} />
            <path d="M 0 -62 L 0 -18" stroke={RED} strokeWidth={7} strokeLinecap="round" />
            <circle cx={0} cy={0} r={9} fill={INK} />
          </g>
        </svg>
        <div style={{
          position: "absolute", left: 1400, top: 660, width: 240, textAlign: "center",
          fontFamily: B_FONT, fontWeight: 700, fontSize: 36, color: INK, whiteSpace: "nowrap",
        }}>强制刷新</div>
      </PopAt>
    </AbsoluteFill>
  );
};

// ================= P7 金句（无底部字幕时段） =================

const PageGolden: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill>
      <WCol f={f} cx={960} cy={450} rx={440} ry={95} color={YEL_F} seed={3} delay={STATIC} />
      <div style={{
        position: "absolute", top: 250, left: 0, right: 0, textAlign: "center",
        fontFamily: T_FONT, fontSize: 82, color: INK, letterSpacing: 8,
        whiteSpace: "nowrap", transform: "rotate(-0.8deg)",
      }}>第一次靠下载</div>
      <div style={{
        position: "absolute", top: 380, left: 0, right: 0, textAlign: "center",
        fontFamily: T_FONT, fontSize: 124, color: RED, letterSpacing: 10,
        whiteSpace: "nowrap", transform: "rotate(-0.8deg)",
        textShadow: "10px 10px 0 rgba(201,79,79,0.12)",
      }}>第二次靠缓存</div>
      <div style={{
        position: "absolute", top: 620, left: 0, right: 0, textAlign: "center",
        fontFamily: T_FONT, fontSize: 64, color: INK, letterSpacing: 10, whiteSpace: "nowrap",
      }}>不搬家，直接用</div>
      <div style={{ position: "absolute", top: 740, left: "50%", transform: "translateX(-50%)" }}>
        <svg width={760} height={22}>
          <Squiggle f={f} x={4} y={11} w={752} delay={STATIC} />
        </svg>
      </div>
      <Stick f={f} x={290} y={880} s={1.15} delay={STATIC} color={BLUE_E} pose="cheer" />
      <Bulb f={f} x={1640} y={300} s={1.3} delay={STATIC} />
    </AbsoluteFill>
  );
};

// ================= P8 结尾导流 + 结尾截图卡 =================

const PageOutro: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill>
      {/* 无背景大标题：截图卡 children 金句行占据顶部，避免叠印/被卡截断 */}
      <Sticker f={f} x={600} y={430} w={700} h={120} title="《输入网址之后》在合集第一条" ts={40} color={BLUE_E} rot={2} delay={A.lvCheng} />
      {/* 气泡已删：会被截图卡遮住大半、尾巴戳出卡外 */}
      <Stick f={f} x={1580} y={800} s={1.15} delay={STATIC} color={GREEN_E} pose="point" />
    </AbsoluteFill>
  );
};

// ================= 组装（纯硬切 + 结尾卡 + 字幕 + 音轨） =================

const PAGES = [
  { C: PageHook, from: PAGE_START[0], dur: PAGE_START[1] - PAGE_START[0] },
  { C: PageTruth, from: PAGE_START[1], dur: PAGE_START[2] - PAGE_START[1] },
  { C: PageFirstLoad, from: PAGE_START[2], dur: PAGE_START[3] - PAGE_START[2] },
  { C: PageAdvise, from: PAGE_START[3], dur: PAGE_START[4] - PAGE_START[3] },
  { C: PageSecond, from: PAGE_START[4], dur: PAGE_START[5] - PAGE_START[4] },
  { C: PageReceipt, from: PAGE_START[5], dur: PAGE_START[6] - PAGE_START[5] },
  { C: PageStale, from: PAGE_START[6], dur: PAGE_START[7] - PAGE_START[6] },
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

export const WebCacheSketch: React.FC = () => {
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
        title="第二次为什么快"
        rows={["第一次 ＝ 全量下载", "第二次 ＝ 本地直接用", "旧图不更新 → 强制刷新"]}
      >
        <div style={{
          position: "absolute", top: 52, left: 0, right: 0, textAlign: "center",
          fontFamily: T_FONT, fontSize: 54, color: INK, letterSpacing: 4, whiteSpace: "nowrap",
        }}>第一次靠下载 · 第二次靠缓存</div>
      </EndingCard>
      {/* 金句大字时段整体不渲染底部字幕（铁律⑫） */}
      <GoldSafeSubs />
      {/* 旁白 */}
      {NARR_START.map((st, i) => (
        <Sequence key={`vo-${i}`} from={st} durationInFrames={SENT_DUR[i] + 30}>
          <Audio src={staticFile(`audio/b10webcache-tts/s0${i + 1}.mp3`)} volume={1} />
        </Sequence>
      ))}
      {/* 音效（锚点取自数据帧，音量保守档） */}
      {SFX_PAGE_TURN.map((t) => (
        <Sequence key={`pt-${t}`} from={t - 6} durationInFrames={24}>
          <Audio src={staticFile("audio/sfx/page3.wav")} volume={0.3} />
        </Sequence>
      ))}
      <Sequence from={A.huanCun} durationInFrames={20}>
        <Audio src={staticFile("audio/sfx/pop.wav")} volume={0.26} />
      </Sequence>
      <Sequence from={A.cun} durationInFrames={20}>
        <Audio src={staticFile("audio/sfx/pop.wav")} volume={0.26} />
      </Sequence>
      <Sequence from={A.wen} durationInFrames={24}>
        <Audio src={staticFile("audio/sfx/fly3.wav")} volume={0.16} />
      </Sequence>
      <Sequence from={A.meiBian} durationInFrames={24}>
        <Audio src={staticFile("audio/sfx/ding.wav")} volume={0.22} />
      </Sequence>
      <Sequence from={A.tuPian2} durationInFrames={20}>
        <Audio src={staticFile("audio/sfx/pop.wav")} volume={0.24} />
      </Sequence>
      <Sequence from={A.qiangZhi} durationInFrames={20}>
        <Audio src={staticFile("audio/sfx/click.wav")} volume={0.22} />
      </Sequence>
      <Sequence from={GOLD_FROM} durationInFrames={40}>
        <Audio src={staticFile("audio/sfx/success.wav")} volume={0.22} />
      </Sequence>
      {/* 结尾静置段：bed_outro（响度合格素材） */}
    </AbsoluteFill>
  );
};
