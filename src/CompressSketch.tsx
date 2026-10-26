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
} from "./batch10/compressData";

// ============================================================
// 白板手绘 v2 · 《为什么一个压缩包能装下整个文件夹？》（旅程收尾 · 全栈小秋）
// 9 句 = 9 页，页边界 = SENT_DUR 累加帧，kit.HardPage 纯硬切
// 视觉：0/1 长纸带红圈 → 字典卡片「一万个0 = ◆」→ 2G/500M 双箱 → 再压字典已空
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
  yaWan: wordAt(WORDS, 0, "压完"), // 48
  xiaoShi: wordAt(WORDS, 0, "消失"), // 135
  chongFu: wordAt(WORDS, 1, "重复"), // 251
  neiRong: wordAt(SUBS, 1, "不是"), // 271（「内容：不动」贴纸须在页内完整可见）
  lianXu: wordAt(WORDS, 2, "连续"), // 455
  yiWan: wordAt(WORDS, 2, "万"), // 466
  beiJing: wordAt(WORDS, 2, "背景图"), // 535
  biaoTou: wordAt(SUBS, 2, "每行"), // 554（表头小景须在页内完整可见）
  ziDian: wordAt(WORDS, 3, "字典"), // 645
  duanDai: wordAt(WORDS, 3, "短代"), // 714
  zhengWen: wordAt(WORDS, 3, "正文"), // 736
  daiHao: wordAt(WORDS, 3, "代号"), // 760
  huiLai: wordAt(WORDS, 3, "回来"), // 823
  jiCheng: wordAt(WORDS, 4, "记成"), // 883
  wuGeZi: wordAt(WORDS, 4, "字"), // 928
  bei: wordAt(WORDS, 4, "倍"), // 984
  chongFu3: wordAt(WORDS, 5, "重复"), // 1043
  xiaoShuo: wordAt(WORDS, 5, "小说"), // 1096
  yiBan: wordAt(WORDS, 5, "一半"), // 1119
  tuPian: wordAt(WORDS, 5, "图片"), // 1161
  shiPin: wordAt(WORDS, 5, "视频"), // 1173
  bian: wordAt(WORDS, 5, "变"), // 1221
  yaSuoBao: wordAt(WORDS, 6, "压缩包"), // 1249
  bian2: wordAt(WORDS, 6, "遍"), // 1280
  baiMang: wordAt(WORDS, 6, "白忙"), // 1354
  ziDian2: wordAt(WORDS, 6, "字典"), // 1373
  heYi: wordAt(WORDS, 8, "合"), // 1625
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

// 小图片图标（山+太阳）
const MiniPic: React.FC<{ f: number; x: number; y: number; s?: number; delay?: number; color?: string }> = ({
  f, x, y, s = 1, delay = 0, color = BLUE_F,
}) => {
  const p = prog(f, delay, 10);
  if (p <= 0) return null;
  return (
    <svg width={W} height={H} style={{ position: "absolute", left: 0, top: 0, overflow: "visible", pointerEvents: "none" }}>
      <g transform={`translate(${x},${y}) scale(${s})`} opacity={p}>
        <path d={sketchRectPath(-36, -30, 72, 62, 4)} fill="rgba(255,255,255,0.95)" stroke={INK} strokeWidth={4.5} />
        <path d={blobPath(0, 10, 26, 13, 6)} fill={color} stroke="none" />
        <path d="M -22 22 L -6 -2 L 6 12 L 14 4 L 24 22" fill="none" stroke={INK} strokeWidth={4} strokeLinejoin="round" />
        <circle cx={16} cy={-14} r={6} fill={YEL_F} stroke={INK} strokeWidth={3} />
      </g>
    </svg>
  );
};

// 纸箱（带顶盖线）
const BoxSketch: React.FC<{ f: number; x: number; y: number; w: number; h: number; label: string; ts?: number; delay?: number; fill?: string }> = ({
  f, x, y, w, h, label, ts = 60, delay = 0, fill = "rgba(255,255,255,0.94)",
}) => (
  <>
    <WBox f={f} x={x} y={y} w={w} h={h} fill={fill} sw={6.5} seed={5} delay={delay} />
    <Draw f={f} d={`M ${x} ${y + 26} L ${x + w * 0.42} ${y + 26} L ${x + w * 0.5} ${y + 6}`} stroke={INK} sw={4} delay={delay + 8} dur={8} />
    <Draw f={f} d={`M ${x + w} ${y + 26} L ${x + w * 0.58} ${y + 26} L ${x + w * 0.5} ${y + 6}`} stroke={INK} sw={4} delay={delay + 10} dur={8} />
    <div style={{
      position: "absolute", left: x, top: y + h / 2 - ts / 2 + 8, width: w, textAlign: "center",
      fontFamily: MONO, fontWeight: 700, fontSize: ts, color: INK, whiteSpace: "nowrap",
    }}>{label}</div>
  </>
);

// 0/1 纸带（文字内收 30px 让开手绘边框；ls=字距，◆ 为全角字符需压缩字距防右缘切字）
const BitTape: React.FC<{ f: number; x: number; y: number; w: number; h: number; bits: string; delay?: number; ts?: number; ls?: number }> = ({
  f, x, y, w, h, bits, delay = 0, ts = 42, ls = 6,
}) => (
  <>
    <WBox f={f} x={x} y={y} w={w} h={h} fill="rgba(255,255,255,0.94)" sw={6} seed={7} delay={delay} />
    <div style={{
      position: "absolute", left: x + 30, top: y + h / 2 - ts / 2 - 4, width: w - 60,
      fontFamily: MONO, fontWeight: 700, fontSize: ts, letterSpacing: ls, color: INK,
      whiteSpace: "nowrap", overflow: "hidden",
    }}>{bits}</div>
  </>
);

// 压缩机（漏斗+压块+底座）
const PressMachine: React.FC<{ f: number; x: number; y: number; s?: number; delay?: number }> = ({
  f, x, y, s = 1, delay = 0,
}) => {
  const p = prog(f, delay, 14);
  if (p <= 0) return null;
  const press = Math.sin(f / 14) * 6;
  return (
    <svg width={W} height={H} style={{ position: "absolute", left: 0, top: 0, overflow: "visible", pointerEvents: "none" }}>
      <g transform={`translate(${x},${y}) scale(${s})`} opacity={p}>
        <path d="M -150 -170 L 150 -170 L 60 -70 L -60 -70 Z" fill="rgba(255,255,255,0.94)" stroke={INK} strokeWidth={6} strokeLinejoin="round" />
        <path d={sketchRectPath(-62, -64 + press, 124, 56, 5)} fill={ORANGE_F} stroke={INK} strokeWidth={5.5} />
        <path d={sketchRectPath(-170, 4, 340, 66, 8)} fill="rgba(255,255,255,0.94)" stroke={INK} strokeWidth={6} />
        <path d="M -40 70 L 40 70 L 40 112 L -40 112 Z" fill="rgba(255,255,255,0.94)" stroke={INK} strokeWidth={5.5} strokeLinejoin="round" />
        <circle cx={0} cy={-192} r={12} fill={YEL_F} stroke={INK} strokeWidth={4.5} />
      </g>
    </svg>
  );
};

// ================= P0 封面钩子（第 0 帧完整） =================

const PageHook: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill>
      <HandTitle f={f} text="为什么压缩包能装下整个文件夹？" y={68} size={70} delay={STATIC} />
      <BoxSketch f={f} x={260} y={360} w={430} h={300} label="2 G" ts={96} delay={STATIC} fill={ORANGE_F} />
      <div style={{
        position: "absolute", left: 330, top: 690, width: 290, textAlign: "center",
        fontFamily: B_FONT, fontSize: 36, color: SUBC, whiteSpace: "nowrap",
      }}>压缩前</div>
      <Arrow f={f} x={740} y={470} len={440} color={ORANGE_E} sw={7} bend={-26} delay={STATIC} />
      <PopAt f={A.yaWan}>
        <div style={{
          position: "absolute", left: 870, top: 350, width: 180, textAlign: "center",
          fontFamily: T_FONT, fontSize: 52, color: INK, whiteSpace: "nowrap",
        }}>压缩</div>
      </PopAt>
      <BoxSketch f={f} x={1230} y={410} w={260} h={250} label="500M" ts={54} delay={STATIC} fill={GREEN_F} />
      <div style={{
        position: "absolute", left: 1230, top: 690, width: 260, textAlign: "center",
        fontFamily: B_FONT, fontSize: 36, color: SUBC, whiteSpace: "nowrap",
      }}>压缩后</div>
      <Bubble f={f} x={740} y={140} w={430} h={100} text="消失的体积去哪了？" ts={36} delay={A.xiaoShi} tail="br" />
      <Stick f={f} x={1660} y={840} s={1.1} delay={STATIC} color={BLUE_E} pose="point" />
    </AbsoluteFill>
  );
};

// ================= P1 答案：消失的是重复 =================

const PageAnswer: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill>
      <HandTitle f={f} text="消失的是重复 不是内容" y={70} size={78} delay={STATIC} />
      {/* 重复的图：5 张一样，划掉 4 张 */}
      {[0, 1, 2, 3, 4].map((i) => (
        <React.Fragment key={i}>
          <MiniPic f={f} x={340 + i * 92} y={400} s={1.0} delay={STATIC} />
          {i < 4 ? (
            <svg key={`x-${i}`} width={W} height={H} style={{ position: "absolute", left: 0, top: 0, overflow: "visible", pointerEvents: "none" }}>
              <path d={`M ${306 + i * 92} 372 L ${374 + i * 92} 428`} stroke={RED} strokeWidth={6} strokeLinecap="round" opacity={0.85} />
            </svg>
          ) : null}
        </React.Fragment>
      ))}
      {/* 唯一的内容：保留 */}
      <MiniPic f={f} x={1350} y={400} s={1.7} delay={STATIC} color={GREEN_F} />
      <Sticker f={f} x={260} y={540} w={340} h={100} title="重复：删掉" ts={38} color={RED} rot={-2} delay={A.chongFu} />
      <Sticker f={f} x={1190} y={560} w={340} h={100} title="内容：不动" ts={38} color={GREEN_E} rot={2} delay={A.neiRong} />
      <PopAt f={A.chongFu}>
        <div style={{
          position: "absolute", left: 0, right: 0, top: 770, textAlign: "center",
          fontFamily: B_FONT, fontSize: 38, color: SUBC, whiteSpace: "nowrap",
        }}>文件一个没少 只是重复被收走了</div>
      </PopAt>
    </AbsoluteFill>
  );
};

// ================= P2 文件 = 一长串 0 和 1 =================

const PageBits: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill>
      <HandTitle f={f} text="文件就是一长串 0 和 1" y={60} size={76} delay={STATIC} />
      <BitTape
        f={f}
        x={170}
        y={290}
        w={1580}
        h={150}
        bits="0110100 00000000000 0101100 00000000000 11010"
        delay={STATIC}
      />
      {/* 红圈圈住连续的 0 */}
      <Draw
        f={f}
        d="M 560 362 a 270 64 0 1 0 540 0 a 270 64 0 1 0 -540 0"
        stroke={RED}
        sw={7}
        delay={A.lianXu}
        dur={20}
      />
      <PopAt f={A.yiWan}>
        <div style={{
          position: "absolute", left: 600, top: 500, width: 460, textAlign: "center",
          fontFamily: T_FONT, fontSize: 48, color: RED, whiteSpace: "nowrap",
        }}>连续一万个 0</div>
      </PopAt>
      {/* 同一张背景图 ×100 */}
      <PopAt f={A.beiJing}>
        {[0, 1, 2, 3].map((i) => (
          <MiniPic key={i} f={f} x={300 + i * 86} y={640} s={0.9} delay={A.beiJing + i * 4} />
        ))}
        <div style={{
          position: "absolute", left: 180, top: 710, width: 480, textAlign: "center",
          fontFamily: B_FONT, fontSize: 32, color: INK, whiteSpace: "nowrap",
        }}>同一张背景图 出现一百次</div>
      </PopAt>
      {/* 每行都一样的表头 */}
      <PopAt f={A.biaoTou}>
        {[0, 1, 2].map((i) => (
          <React.Fragment key={i}>
            <WBox f={f} x={1080} y={600 + i * 62} w={150} h={52} fill={YEL_F} sw={4} seed={i + 2} delay={A.biaoTou + i * 4} />
            <div style={{
              position: "absolute", left: 1080, top: 608 + i * 62, width: 150, textAlign: "center",
              fontFamily: B_FONT, fontWeight: 700, fontSize: 26, color: INK, whiteSpace: "nowrap",
            }}>表头</div>
            <Draw f={f} d={`M 1250 ${626 + i * 62} L 1520 ${626 + i * 62}`} stroke={SUBC} sw={4} delay={A.biaoTou + i * 4} dur={6} op={0.55} />
          </React.Fragment>
        ))}
        <div style={{
          position: "absolute", left: 1050, top: 790, width: 480, textAlign: "center",
          fontFamily: B_FONT, fontSize: 32, color: INK, whiteSpace: "nowrap",
        }}>每行都一样的表头</div>
      </PopAt>
    </AbsoluteFill>
  );
};

// ================= P3 压缩 = 建字典 =================

const PageDict: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill>
      <HandTitle f={f} text="压缩 ＝ 建字典" y={60} size={80} delay={STATIC} />
      {/* 小纸带（已换成代号） */}
      <BitTape f={f} x={170} y={330} w={420} h={120} bits="0110 ◆◆◆ 0110" delay={STATIC} ts={34} ls={2} />
      {/* 字典卡片 */}
      <WBox f={f} x={700} y={260} w={580} h={360} fill="rgba(255,255,255,0.95)" sw={7} seed={3} delay={STATIC} />
      <Draw f={f} d="M 1230 262 Q 1272 300 1276 344 L 1230 344 Z" stroke={INK} sw={4.5} delay={STATIC} dur={8} fill={YEL_F} />
      <PopAt f={A.ziDian}>
        <div style={{
          position: "absolute", left: 740, top: 292, width: 300,
          fontFamily: T_FONT, fontSize: 52, color: INK, whiteSpace: "nowrap",
        }}>字典</div>
      </PopAt>
      <Draw f={f} d="M 740 372 L 1240 372" stroke={INK} sw={3.5} delay={STATIC} dur={8} op={0.5} />
      <PopAt f={A.duanDai}>
        <div style={{
          position: "absolute", left: 740, top: 402, width: 520,
          fontFamily: B_FONT, fontWeight: 700, fontSize: 36, color: INK, whiteSpace: "nowrap",
        }}>连续一万个 0 ＝ ◆</div>
      </PopAt>
      <PopAt f={A.daiHao}>
        <div style={{
          position: "absolute", left: 740, top: 480, width: 520,
          fontFamily: B_FONT, fontWeight: 700, fontSize: 36, color: INK, whiteSpace: "nowrap",
        }}>同一张背景图 ＝ ▲</div>
      </PopAt>
      {/* 正文只写代号 */}
      <Arrow f={f} x={690} y={385} len={100} color={ORANGE_E} sw={6} bend={-12} flip delay={A.zhengWen} />
      <PopAt f={A.zhengWen}>
        <div style={{
          position: "absolute", left: 150, top: 510, width: 460, textAlign: "center",
          fontFamily: B_FONT, fontSize: 34, color: INK, whiteSpace: "nowrap",
        }}>正文只写代号</div>
      </PopAt>
      <Stick f={f} x={1550} y={780} s={1.1} delay={STATIC} color={GREEN_E} pose="point" />
      <Bubble f={f} x={1330} y={470} w={330} h={96} text="照着字典查回来" ts={32} delay={A.huiLai - 40} tail="bl" />
    </AbsoluteFill>
  );
};

// ================= P4 一万个 0 → 五个字 =================

const PageFiveChars: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill>
      <HandTitle f={f} text="一万个 0 记成五个字" y={64} size={78} delay={STATIC} />
      <BitTape f={f} x={170} y={370} w={520} h={130} bits="0000000000 00000" delay={STATIC} ts={36} />
      <Arrow f={f} x={740} y={400} len={300} color={ORANGE_E} sw={7} bend={-24} delay={STATIC} />
      <WBox f={f} x={1090} y={360} w={330} h={150} fill={YEL_F} sw={6.5} seed={6} delay={STATIC} />
      <div style={{
        position: "absolute", left: 1090, top: 405, width: 330, textAlign: "center",
        fontFamily: B_FONT, fontWeight: 700, fontSize: 44, color: INK, whiteSpace: "nowrap",
      }}>一万个0 ◆</div>
      <PopAt f={A.jiCheng}>
        <div style={{
          position: "absolute", left: 1090, top: 540, width: 330, textAlign: "center",
          fontFamily: B_FONT, fontSize: 32, color: SUBC, whiteSpace: "nowrap",
        }}>记成五个字</div>
      </PopAt>
      <PopAt f={A.huiLai}>
        <div style={{
          position: "absolute", left: 0, right: 0, top: 660, textAlign: "center",
          fontFamily: B_FONT, fontSize: 36, color: SUBC, whiteSpace: "nowrap",
        }}>还原时 对着字典查回来 内容一点不少</div>
      </PopAt>
    </AbsoluteFill>
  );
};

// ================= P5 规律：重复越多压得越小 =================

const PageRule: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill>
      <HandTitle f={f} text="重复越多 压得越小" y={64} size={80} delay={STATIC} />
      <WCol f={f} cx={960} cy={288} rx={430} ry={58} color={GREEN_F} seed={3} delay={A.bei} />
      <PopAt f={A.bei}>
        <div style={{
          position: "absolute", left: 0, right: 0, top: 246, textAlign: "center",
          fontFamily: T_FONT, fontSize: 64, color: GREEN_E, whiteSpace: "nowrap",
        }}>体积瞬间小 200 倍</div>
      </PopAt>
      {/* 小说：能压一半 */}
      <PopAt f={A.xiaoShuo}>
        <WBox f={f} x={330} y={440} w={240} h={62} fill={BLUE_F} sw={5} seed={2} delay={A.xiaoShuo} />
        <WBox f={f} x={318} y={506} w={264} h={62} fill={ORANGE_F} sw={5} seed={5} delay={A.xiaoShuo + 5} />
        <WBox f={f} x={340} y={572} w={220} h={62} fill={GREEN_F} sw={5} seed={8} delay={A.xiaoShuo + 10} />
        <Sticker f={f} x={640} y={470} w={360} h={100} title="能压一半" ts={38} color={BLUE_E} rot={-3} delay={A.yiBan} />
        <div style={{
          position: "absolute", left: 300, top: 660, width: 400, textAlign: "center",
          fontFamily: B_FONT, fontSize: 32, color: SUBC, whiteSpace: "nowrap",
        }}>小说 重复字词多</div>
      </PopAt>
      {/* 已压过的图片视频 */}
      <PopAt f={A.tuPian}>
        <MiniPic f={f} x={1250} y={490} s={1.2} delay={A.tuPian} />
        <svg width={W} height={H} style={{ position: "absolute", left: 0, top: 0, overflow: "visible", pointerEvents: "none" }}>
          <g opacity={prog(f, A.shiPin, 10)}>
            <path d={sketchRectPath(1330, 452, 110, 80, 6)} fill="rgba(255,255,255,0.94)" stroke={INK} strokeWidth={4.5} />
            <path d="M 1372 478 L 1372 508 L 1400 493 Z" fill={RED} stroke={INK} strokeWidth={3.5} strokeLinejoin="round" />
          </g>
        </svg>
        <div style={{
          position: "absolute", left: 1100, top: 600, width: 500, textAlign: "center",
          fontFamily: B_FONT, fontSize: 32, color: SUBC, whiteSpace: "nowrap",
        }}>已经压过的图片视频</div>
      </PopAt>
    </AbsoluteFill>
  );
};

// ================= P6 再压一遍？基本白忙 =================

const PageReCompress: React.FC = () => {
  const f = useCurrentFrame();
  const tp = interpolate(f, [A.yaSuoBao, A.yaSuoBao + 40], [0, 1], clamp);
  return (
    <AbsoluteFill>
      <HandTitle f={f} text="再压一遍？基本白忙" y={64} size={80} delay={STATIC} />
      <PopAt f={A.bian}>
        <div style={{
          position: "absolute", left: 0, right: 0, top: 232, textAlign: "center",
          fontFamily: B_FONT, fontSize: 38, color: SUBC, whiteSpace: "nowrap",
        }}>已压过的图片视频：再压几乎不变</div>
      </PopAt>
      <PressMachine f={f} x={930} y={520} s={1.05} delay={STATIC} />
      {/* 压缩包进去 */}
      {tp > 0.02 && tp < 1 ? (
        <div style={{
          position: "absolute", left: 580 + 290 * tp, top: 430 - 90 * tp,
          width: 140, height: 104, backgroundColor: ORANGE_F,
          border: `4.5px solid ${INK}`, borderRadius: 10,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontFamily: B_FONT, fontWeight: 700, fontSize: 28, color: INK, whiteSpace: "nowrap",
        }}>压缩包</div>
      ) : null}
      {/* 出来：几乎一样大 */}
      <PopAt f={A.bian2}>
        <BoxSketch f={f} x={860} y={700} w={150} h={110} label="≈" ts={44} delay={A.bian2} />
        <div style={{
          position: "absolute", left: 1040, top: 735, width: 300,
          fontFamily: B_FONT, fontWeight: 700, fontSize: 34, color: INK, whiteSpace: "nowrap",
        }}>几乎一样大</div>
      </PopAt>
      <PopAt f={A.baiMang}>
        <div style={{
          position: "absolute", left: 1260, top: 560, width: 380, textAlign: "center",
          fontFamily: T_FONT, fontSize: 62, color: RED, whiteSpace: "nowrap",
        }}>基本白忙</div>
      </PopAt>
      <Sticker f={f} x={200} y={700} w={400} h={110} title="字典：重复早没了" ts={32} color="#8a8579" rot={-3} delay={A.ziDian2} />
    </AbsoluteFill>
  );
};

// ================= P7 金句（无底部字幕时段） =================

const PageGolden: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill>
      <WCol f={f} cx={960} cy={480} rx={420} ry={90} color={YEL_F} seed={3} delay={STATIC} />
      <div style={{
        position: "absolute", top: 280, left: 0, right: 0, textAlign: "center",
        fontFamily: T_FONT, fontSize: 90, color: INK, letterSpacing: 8,
        whiteSpace: "nowrap", transform: "rotate(-0.8deg)",
      }}>压缩不删内容 只删重复</div>
      <div style={{
        position: "absolute", top: 460, left: 0, right: 0, textAlign: "center",
        fontFamily: T_FONT, fontSize: 118, color: RED, letterSpacing: 14,
        whiteSpace: "nowrap", transform: "rotate(-0.8deg)",
        textShadow: "10px 10px 0 rgba(201,79,79,0.12)",
      }}>重复即体积</div>
      <div style={{ position: "absolute", top: 660, left: "50%", transform: "translateX(-50%)" }}>
        <svg width={700} height={22}>
          <Squiggle f={f} x={4} y={11} w={692} delay={STATIC} />
        </svg>
      </div>
      <Stick f={f} x={300} y={880} s={1.15} delay={STATIC} color={BLUE_E} pose="cheer" />
      <Bulb f={f} x={1630} y={310} s={1.3} delay={STATIC} />
    </AbsoluteFill>
  );
};

// ================= P8 合集导流 + 结尾截图卡 =================

const PageOutro: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill>
      {/* 无背景大标题：截图卡 children 金句行占据顶部，避免被卡上缘截断 */}
      <Sticker f={f} x={560} y={420} w={800} h={130} title="文件类硬核科普 都在合集里" ts={42} color={BLUE_E} rot={2} delay={A.heYi} />
      <Stick f={f} x={1600} y={810} s={1.15} delay={STATIC} color={GREEN_E} pose="cheer" />
    </AbsoluteFill>
  );
};

// ================= 组装（纯硬切 + 结尾卡 + 字幕 + 音轨） =================

const PAGES = [
  { C: PageHook, from: PAGE_START[0], dur: PAGE_START[1] - PAGE_START[0] },
  { C: PageAnswer, from: PAGE_START[1], dur: PAGE_START[2] - PAGE_START[1] },
  { C: PageBits, from: PAGE_START[2], dur: PAGE_START[3] - PAGE_START[2] },
  { C: PageDict, from: PAGE_START[3], dur: PAGE_START[4] - PAGE_START[3] },
  { C: PageFiveChars, from: PAGE_START[4], dur: PAGE_START[5] - PAGE_START[4] },
  { C: PageRule, from: PAGE_START[5], dur: PAGE_START[6] - PAGE_START[5] },
  { C: PageReCompress, from: PAGE_START[6], dur: PAGE_START[7] - PAGE_START[6] },
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

export const CompressSketch: React.FC = () => {
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
        title="压缩的本质"
        rows={["压缩 ＝ 建字典删重复", "重复越多 压得越小", "压过的再压 ≈ 白忙"]}
      >
        <div style={{
          position: "absolute", top: 52, left: 0, right: 0, textAlign: "center",
          fontFamily: T_FONT, fontSize: 54, color: INK, letterSpacing: 4, whiteSpace: "nowrap",
        }}>压缩不删内容 只删重复 · 下期：断点续传</div>
      </EndingCard>
      {/* 金句大字时段整体不渲染底部字幕（铁律⑫） */}
      <GoldSafeSubs />
      {/* 旁白 */}
      {NARR_START.map((st, i) => (
        <Sequence key={`vo-${i}`} from={st} durationInFrames={SENT_DUR[i] + 30}>
          <Audio src={staticFile(`audio/b10compress-tts/s0${i + 1}.mp3`)} volume={1} />
        </Sequence>
      ))}
      {/* 音效（锚点取自数据帧，音量保守档） */}
      {SFX_PAGE_TURN.map((t) => (
        <Sequence key={`pt-${t}`} from={t - 6} durationInFrames={24}>
          <Audio src={staticFile("audio/sfx/page3.wav")} volume={0.3} />
        </Sequence>
      ))}
      <Sequence from={A.lianXu} durationInFrames={24}>
        <Audio src={staticFile("audio/sfx/whoosh.wav")} volume={0.2} />
      </Sequence>
      <Sequence from={A.zhengWen} durationInFrames={24}>
        <Audio src={staticFile("audio/sfx/fly3.wav")} volume={0.16} />
      </Sequence>
      <Sequence from={A.bei} durationInFrames={40}>
        <Audio src={staticFile("audio/sfx/success.wav")} volume={0.22} />
      </Sequence>
      <Sequence from={A.xiaoShuo} durationInFrames={20}>
        <Audio src={staticFile("audio/sfx/pop.wav")} volume={0.24} />
      </Sequence>
      <Sequence from={A.baiMang} durationInFrames={24}>
        <Audio src={staticFile("audio/sfx/error.wav")} volume={0.18} />
      </Sequence>
      {/* 结尾静置段：bed_outro（响度合格素材） */}
    </AbsoluteFill>
  );
};
