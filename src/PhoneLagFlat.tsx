import React from "react";
import {Audio} from "@remotion/media";
import {AbsoluteFill, interpolate, Sequence, staticFile, useCurrentFrame} from "remotion";

// ============ 扁平可爱插画科普风 · 手机越用越卡（全栈小秋） ============
// 结构：钩子封面 → 杀手1缓存堆积 → 杀手2后台自启 → 杀手3电池老化 → 三招对策 → 口诀 → 截图卡
// 语义色：蓝=正常/系统、红=凶手/占满/降频、橙=缓存堆积、黄=强调横幅、绿=对策/解决
// 页边界 = 每句配音起始帧（SENT），页内元素 delay = 词级朗读帧

export const DUR = 1610;

const SENT = [0, 177, 455, 732, 1014, 1275, 1444];

type Sub = {s: number; e: number; t: string};
const subs: Sub[] = [
  {s: 0, e: 59, t: "手机没摔也没进水"},
  {s: 59, e: 111, t: "为什么越用越卡"},
  {s: 111, e: 170, t: "凶手通常就这三个"},
  {s: 177, e: 224, t: "第一个 缓存堆积"},
  {s: 224, e: 317, t: "每个App都在偷偷存临时文件"},
  {s: 317, e: 344, t: "日积月累"},
  {s: 344, e: 384, t: "存储越挤越满"},
  {s: 384, e: 450, t: "手机翻东西就越翻越慢"},
  {s: 455, e: 497, t: "第二个 后台自启"},
  {s: 497, e: 533, t: "你以为退出了"},
  {s: 533, e: 617, t: "其实很多App在后台互相唤醒"},
  {s: 617, e: 659, t: "内存被悄悄占满"},
  {s: 659, e: 725, t: "切个App都要重新加载"},
  {s: 732, e: 779, t: "第三个 电池老化"},
  {s: 779, e: 833, t: "电池健康度下降后"},
  {s: 833, e: 894, t: "系统会主动降频自保"},
  {s: 894, e: 935, t: "性能直接打折"},
  {s: 935, e: 1009, t: "这是老手机卡的隐藏原因"},
  {s: 1014, e: 1038, t: "对应三招"},
  {s: 1038, e: 1091, t: "定期清缓存和大文件"},
  {s: 1091, e: 1168, t: "关掉不常用App的自启权限"},
  {s: 1168, e: 1233, t: "电池老化明显就去换电池"},
  {s: 1233, e: 1269, t: "别急着换手机"},
  {s: 1275, e: 1322, t: "记住这个口诀"},
  {s: 1322, e: 1369, t: "卡了先查存储"},
  {s: 1369, e: 1400, t: "再查后台"},
  {s: 1400, e: 1438, t: "最后查电池"},
  {s: 1444, e: 1504, t: "这三个杀手截图存好"},
  {s: 1504, e: 1531, t: "手机再卡"},
  {s: 1531, e: 1585, t: "你三分钟就能定位"},
];

// ---------- 本地 primitives（从 TcpVsUdpFlat 拷走改造，不 import flatKit） ----------

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

// 互动栏图标（material path，同 TcpVsUdpFlat 手机）
const D_HEART = "M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z";
const D_COMMENT = "M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z";
const D_SHARE = "M14 9V5l7 7-7 7v-4.1c-5 0-8.5 1.6-11 5.1 1-5 4-10 11-11z";
const D_MUSIC = "M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z";
const W = 1920;
const H = 1080;

const clamp = {extrapolateLeft: "clamp", extrapolateRight: "clamp"} as const;
const ease = (p: number) => 1 - Math.pow(1 - p, 3);
const prog = (f: number, delay: number, dur = 12) =>
  interpolate(f, [delay, delay + dur], [0, 1], clamp);

const BgDots: React.FC = () => (
  <svg width={W} height={H} style={{position: "absolute", left: 0, top: 0, pointerEvents: "none"}}>
    <defs>
      <pattern id="phonelag-dots" width="46" height="46" patternUnits="userSpaceOnUse">
        <circle cx="23" cy="23" r="2.6" fill="#dbe4ee" />
      </pattern>
    </defs>
    <rect width={W} height={H} fill="url(#phonelag-dots)" opacity={0.5} />
    <circle cx={150} cy={120} r={190} fill={BLUE_BG} opacity={0.5} />
    <circle cx={W - 140} cy={H - 90} r={220} fill={ORANGE_BG} opacity={0.4} />
  </svg>
);

const BigTitle: React.FC<{
  f: number; parts: {t: string; c: string}[]; y?: number; size?: number; delay?: number; noLine?: boolean;
}> = ({f, parts, y = 58, size = 88, delay = 0, noLine}) => {
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
            <path d={`M 4 9 ${Array.from({length: Math.round(tw * 0.6 / 36)}).map(() => `q 9 -10 18 0 q 9 10 18 0`).join(" ")}`}
              fill="none" stroke={YEL} strokeWidth={7} strokeLinecap="round" />
          </svg>
        )}
      </div>
    </div>
  );
};

const Sparkle: React.FC<{x: number; y: number; s?: number; color?: string}> = ({x, y, s = 1, color = YEL}) => (
  <svg width={54 * s} height={54 * s} style={{position: "absolute", left: x, top: y, overflow: "visible"}}>
    <path d="M 27 2 L 32 22 L 52 27 L 32 32 L 27 52 L 22 32 L 2 27 L 22 22 Z" fill={color} />
  </svg>
);

const FlashRing: React.FC<{f: number; at: number; x: number; y: number; color?: string}> = ({f, at, x, y, color = ORANGE}) => {
  const p = prog(f, at, 12);
  if (p <= 0 || p >= 1) return null;
  return (
    <svg width={W} height={H} style={{position: "absolute", left: 0, top: 0, overflow: "visible", pointerEvents: "none"}}>
      <circle cx={x} cy={y} r={22 + 46 * ease(p)} fill="none" stroke={color} strokeWidth={7 * (1 - p)} opacity={1 - p} />
    </svg>
  );
};

const Float: React.FC<{f: number; x: number; y: number; w: number; h: number; amp?: number; children: React.ReactNode}> = ({f, x, y, w, h, amp = 6, children}) => (
  <div style={{position: "absolute", left: x, top: y, width: w, height: h}}>
    <div style={{transform: `translateY(${Math.sin(f / 13) * amp}px)`}}>{children}</div>
  </div>
);

const SpinnerFlat: React.FC<{f: number; x: number; y: number; d: number; color?: string; s?: number}> = ({f, x, y, d, color = ORANGE, s = 1}) => {
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

// 带尾巴的对话气泡
const SpeechBubble: React.FC<{f: number; d: number; x: number; y: number; w: number; h: number; text: string; ts?: number; c?: string; tc?: string}> = ({
  f, d, x, y, w, h, text, ts = 38, c = INK, tc = INK,
}) => {
  const p = prog(f, d);
  if (p <= 0) return null;
  return (
    <div style={{position: "absolute", left: x, top: y, width: w, height: h, opacity: p, transform: `scale(${0.85 + 0.15 * ease(p)})`, transformOrigin: "left center"}}>
      <div style={{position: "absolute", inset: 0, background: "#fff", border: `4px solid ${c}`, borderRadius: 24, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: F, fontWeight: 900, fontSize: ts, color: tc, textAlign: "center", padding: "0 18px", lineHeight: 1.35}}>{text}</div>
      <svg width={46} height={44} style={{position: "absolute", left: -38, top: h / 2 - 20, overflow: "visible"}}>
        <path d="M44 4 L4 22 L44 40" fill="#fff" stroke={c} strokeWidth={4} strokeLinejoin="round" />
      </svg>
    </div>
  );
};

// ---------- 本片主题元素 ----------

// 扁平手机（克制，不拟物）：深色圆角机身 + 屏幕留白
const PhoneBox: React.FC<{x: number; y: number; w: number; h: number; children?: React.ReactNode; bodyColor?: string}> = ({
  x, y, w, h, children, bodyColor = "#3f4d5e",
}) => (
  <div style={{position: "absolute", left: x, top: y, width: w, height: h}}>
    <div style={{position: "absolute", inset: 0, backgroundColor: bodyColor, borderRadius: 46, boxShadow: "0 18px 38px rgba(47,58,69,0.16)"}} />
    <div style={{position: "absolute", right: -7, top: 150, width: 7, height: 78, borderRadius: 4, backgroundColor: "#2f3a45"}} />
    <div style={{position: "absolute", left: -7, top: 140, width: 7, height: 46, borderRadius: 4, backgroundColor: "#2f3a45"}} />
    <div style={{position: "absolute", left: -7, top: 200, width: 7, height: 46, borderRadius: 4, backgroundColor: "#2f3a45"}} />
    <div style={{position: "absolute", left: 14, top: 14, width: w - 28, height: h - 28, borderRadius: 36, overflow: "hidden", background: "#f6f8fb"}}>
      {children}
    </div>
  </div>
);

// 屏幕顶部状态栏
const PhoneStatus: React.FC<{f: number; w: number}> = ({f, w}) => (
  <div style={{position: "absolute", left: 0, right: 0, top: 0, height: 40, padding: "10px 18px 0", display: "flex", justifyContent: "space-between", alignItems: "center"}}>
    <div style={{fontFamily: F, fontSize: 17, fontWeight: 700, color: INK}}>{f % 2 === 0 ? "12:30" : "12:30"}</div>
    <div style={{display: "flex", gap: 5, alignItems: "flex-end"}}>
      {[6, 9, 12, 15].map((h, i) => (
        <div key={i} style={{width: 4, height: h, borderRadius: 1.5, backgroundColor: INK, opacity: i < 3 ? 0.8 : 0.35}} />
      ))}
    </div>
  </div>
);

// 小纸团（临时文件）
const Crumple: React.FC<{x: number; y: number; s?: number; c?: string; rot?: number}> = ({x, y, s = 1, c = "#e8c9a0", rot = 0}) => (
  <svg width={44 * s} height={44 * s} style={{position: "absolute", left: x - 22 * s, top: y - 22 * s, overflow: "visible", transform: `rotate(${rot}deg)`}}>
    <path d="M22 3 L33 8 L41 18 L37 30 L27 40 L14 38 L5 28 L6 14 Z" fill={c} />
    <path d="M14 12 L24 20 L16 28 M28 12 L20 24 L30 30" stroke="rgba(255,255,255,0.65)" strokeWidth={2.5} fill="none" strokeLinecap="round" />
  </svg>
);

// 循环飞行的纸团：从手机飞向存储卡
const FlyCrumple: React.FC<{f: number; x1: number; y1: number; x2: number; y2: number; start: number; period?: number; dur?: number; s?: number; c?: string}> = ({
  f, x1, y1, x2, y2, start, period = 46, dur = 34, s = 1, c = "#e8c9a0",
}) => {
  if (f < start) return null;
  const t = ((f - start) % period) / dur;
  if (t <= 0 || t >= 1) return null;
  const x = x1 + (x2 - x1) * t;
  const y = y1 + (y2 - y1) * t - Math.sin(Math.PI * t) * 26;
  return <Crumple x={x} y={y} s={s * (0.7 + t * 0.3)} c={c} rot={t * 220} />;
};

// 扁平小蜗牛（卡成蜗牛）
const Snail: React.FC<{x: number; y: number; s?: number; crawl?: number}> = ({x, y, s = 1, crawl = 0}) => (
  <svg width={130 * s} height={90 * s} style={{position: "absolute", left: x - 65 * s, top: y - 45 * s, overflow: "visible", transform: `translateX(${crawl}px)`}}>
    <g transform={`scale(${s})`}>
      <ellipse cx={62} cy={80} rx={56} ry={7} fill="#e2e9f2" />
      <path d="M10 78 Q6 62 26 60 L86 60 Q100 60 102 70 L102 78 Z" fill="#8fb3dd" />
      <path d="M12 62 L4 44 M20 60 L20 42" stroke="#8fb3dd" strokeWidth={7} strokeLinecap="round" />
      <circle cx={4} cy={41} r={5.5} fill="#3f4d5e" />
      <circle cx={20} cy={39} r={5.5} fill="#3f4d5e" />
      <circle cx={70} cy={34} r={27} fill="#f0912d" />
      <path d="M70 34 m 0 -16 a 16 16 0 1 1 -12 26 a 10 10 0 1 0 8 -18" fill="none" stroke="#c96f14" strokeWidth={5} strokeLinecap="round" />
      <path d="M24 78 Q40 70 60 76" fill="none" stroke="#fff" strokeWidth={4} strokeLinecap="round" opacity={0.5} />
    </g>
  </svg>
);

// 半圆仪表盘：value 0~100，指针微摆动画
const Gauge: React.FC<{f: number; cx: number; cy: number; value: number; color: string; s?: number; wobble?: boolean}> = ({f, cx, cy, value, color, s = 1, wobble}) => {
  const ARC = Math.PI * 110;
  const wob = wobble ? Math.sin(f / 9) * 1.2 : 0;
  const ang = -90 + value * 1.8 + wob;
  return (
    <svg width={280 * s} height={175 * s} style={{position: "absolute", left: cx - 140 * s, top: cy - 150 * s, overflow: "visible"}}>
      <g transform={`scale(${s})`}>
        <path d="M 30 150 A 110 110 0 0 1 250 150" fill="none" stroke="#e8edf3" strokeWidth={22} strokeLinecap="round" />
        <path d="M 30 150 A 110 110 0 0 1 250 150" fill="none" stroke={color} strokeWidth={22} strokeLinecap="round"
          strokeDasharray={`${ARC * (value / 100)} 999`} opacity={0.85} />
        {[0, 25, 50, 75, 100].map((v) => {
          const a = ((-90 + v * 1.8) * Math.PI) / 180;
          const x1 = 140 + Math.sin(a) * 88, y1 = 150 - Math.cos(a) * 88;
          const x2 = 140 + Math.sin(a) * 76, y2 = 150 - Math.cos(a) * 76;
          return <line key={v} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#c3d2e2" strokeWidth={4} strokeLinecap="round" />;
        })}
        <g transform={`rotate(${ang} 140 150)`}>
          <line x1={140} y1={150} x2={140} y2={62} stroke={INK} strokeWidth={7} strokeLinecap="round" />
        </g>
        <circle cx={140} cy={150} r={12} fill={INK} />
        <circle cx={140} cy={150} r={5} fill="#fff" />
      </g>
    </svg>
  );
};

// App 小磁贴
const AppTile: React.FC<{x: number; y: number; s?: number; letter: string; color?: string; dim?: boolean}> = ({x, y, s = 1, letter, color = BLUE, dim}) => (
  <div style={{
    position: "absolute", left: x, top: y, width: 74 * s, height: 74 * s, borderRadius: 18 * s,
    backgroundColor: dim ? "#dfe6ee" : color, opacity: dim ? 0.55 : 1,
    display: "flex", alignItems: "center", justifyContent: "center",
    fontFamily: F, fontWeight: 900, fontSize: 30 * s, color: "#fff",
    boxShadow: "0 6px 12px rgba(47,58,69,0.14)",
  }}>{letter}</div>
);

// 对勾标记
const MarkOk: React.FC<{x: number; y: number; s?: number}> = ({x, y, s = 1}) => (
  <svg width={60 * s} height={60 * s} style={{position: "absolute", left: x - 30 * s, top: y - 30 * s, overflow: "visible"}}>
    <g transform={`scale(${s})`}>
      <circle cx={30} cy={30} r={26} fill={GREEN_BG} />
      <path d="M17 31 L27 41 L44 21" fill="none" stroke={GREEN} strokeWidth={6} strokeLinecap="round" strokeLinejoin="round" />
    </g>
  </svg>
);

// ---------- 翻页与字幕 ----------

const PageTurn: React.FC<{children: React.ReactNode; off: number; len: number; first: boolean; last: boolean}> = ({children, off, len, first, last}) => {
  const frame = useCurrentFrame();
  const oIn = first ? 1 : interpolate(frame, [0, 10], [0, 1], clamp);
  const lf = frame - off;
  const oOut = last ? 1 : interpolate(lf, [len - 10, len], [1, 0], clamp);
  return <AbsoluteFill style={{opacity: Math.min(oIn, oOut)}}>{children}</AbsoluteFill>;
};

const Subtitle: React.FC = () => {
  const f = useCurrentFrame();
  const cur = subs.find((s) => f >= s.s && f < s.e);
  if (!cur) return null;
  return (
    <div style={{position: "absolute", bottom: 30, left: 0, right: 0, zIndex: 50, display: "flex", justifyContent: "center"}}>
      <div style={{
        background: "rgba(12,14,18,.82)", borderRadius: 15, padding: "12px 34px",
        fontFamily: F, fontWeight: 700, fontSize: 46, color: "#fff", letterSpacing: 2, whiteSpace: "nowrap",
      }}>{cur.t}</div>
    </div>
  );
};

// ============ 页面 ============

// P1 封面钩子（第0帧完整呈现，全 delay=-99）
const PageHook: React.FC<{off: number}> = ({off}) => {
  const f = useCurrentFrame() - off;
  return (
    <AbsoluteFill>
      <BigTitle f={f} delay={-99} y={72} size={78} parts={[
        {t: "手机越用越卡？", c: INK}, {t: "真凶就这三个", c: RED},
      ]} />
      <Sparkle x={392} y={158} s={0.85} />
      <Sparkle x={1490} y={70} s={0.6} color="#f3b8b8" />

      {/* 主角：卡成蜗牛的手机（带拖影） */}
      <div style={{position: "absolute", left: 212, top: 250, width: 430, height: 620, borderRadius: 46, border: "5px solid #dfe6ee", opacity: 0.35}} />
      <div style={{position: "absolute", left: 156, top: 250, width: 430, height: 620, borderRadius: 46, border: "5px solid #e8edf3", opacity: 0.18}} />
      <PopAt f={f} delay={-99} x={268} y={250} w={430} h={620}>
        <Float f={f} x={0} y={0} w={430} h={620} amp={6}>
          <PhoneBox x={0} y={0} w={430} h={620}>
            {/* 屏：短视频 App 卡住加载（TCP 手机同款具体界面） */}
            <div style={{position: "absolute", left: 0, top: 0, width: 402, height: 592, background: "linear-gradient(165deg,#4a86d8 0%,#7db3dd 48%,#f0912d 118%)", overflow: "hidden"}}>
              {/* 状态栏：时间/信号/电量 + 挖孔摄像头 */}
              <div style={{position: "absolute", left: 20, top: 10, fontFamily: F, fontSize: 18, fontWeight: 700, color: "#fff"}}>12:30</div>
              <div style={{position: "absolute", right: 18, top: 13, display: "flex", gap: 5, alignItems: "flex-end"}}>
                {[6, 9, 12, 15].map((h, i) => (
                  <div key={i} style={{width: 4, height: h, borderRadius: 1.5, backgroundColor: "#fff", opacity: i < 3 ? 0.95 : 0.4}} />
                ))}
                <div style={{width: 22, height: 11, border: "2px solid #fff", borderRadius: 3.5, marginLeft: 3, padding: 1.5}}>
                  <div style={{width: "70%", height: "100%", backgroundColor: "#fff", borderRadius: 1}} />
                </div>
              </div>
              <div style={{position: "absolute", left: 194, top: 9, width: 14, height: 14, borderRadius: 999, backgroundColor: "#2f3a45", border: "2px solid rgba(255,255,255,0.3)"}} />
              {/* 视频画面：白板讲课（同 TCP 手机） */}
              <div style={{position: "absolute", left: 62, top: 72, width: 268, height: 168, backgroundColor: "#fff", borderRadius: 14, border: "4px solid #e0e6ec", boxShadow: "0 6px 14px rgba(47,58,69,0.25)"}}>
                <div style={{position: "absolute", left: 28, bottom: 16, width: 20, height: 52, borderRadius: 4, backgroundColor: BLUE}} />
                <div style={{position: "absolute", left: 60, bottom: 16, width: 20, height: 84, borderRadius: 4, backgroundColor: ORANGE}} />
                <div style={{position: "absolute", left: 92, bottom: 16, width: 20, height: 66, borderRadius: 4, backgroundColor: GREEN}} />
                <svg width={110} height={48} viewBox="0 0 100 40" style={{position: "absolute", right: 16, top: 14}}>
                  <path d="M4 34 L30 20 L56 26 L96 6" fill="none" stroke="#3f4d5e" strokeWidth={5} strokeLinecap="round" strokeLinejoin="round" />
                  <circle cx={96} cy={6} r={5} fill={ORANGE} />
                </svg>
              </div>
              <svg width={100} height={122} viewBox="0 0 90 110" style={{position: "absolute", left: 244, top: 188}}>
                <path d="M28 58 L4 40" stroke={GREEN} strokeWidth={10} strokeLinecap="round" />
                <circle cx={40} cy={26} r={20} fill="#f6cfa4" stroke="#3f4d5e" strokeWidth={4} />
                <path d="M22 20 Q40 2 58 20 Q46 10 40 11 Q34 10 22 20 Z" fill="#3f4d5e" />
                <circle cx={33} cy={28} r={3} fill="#3f4d5e" />
                <circle cx={47} cy={28} r={3} fill="#3f4d5e" />
                <path d="M34 36 Q40 40 46 36" fill="none" stroke="#3f4d5e" strokeWidth={3} strokeLinecap="round" />
                <rect x={22} y={48} width={36} height={44} rx={13} fill={GREEN} />
                <rect x={24} y={92} width={14} height={14} rx={5} fill="#3f4d5e" />
                <rect x={44} y={92} width={14} height={14} rx={5} fill="#3f4d5e" />
              </svg>
              {/* 卡住：缓冲马赛克 + 大转圈 + 加载中 */}
              {[0, 1, 2, 3].map((k) => (
                <div key={k} style={{position: "absolute", left: 60 + k * 26, bottom: 208, width: 18, height: 18, borderRadius: 3, backgroundColor: "#fff", opacity: 0.9 - k * 0.22}} />
              ))}
              <SpinnerFlat f={f} x={201} y={430} d={0} s={1.2} color={ORANGE} />
              <div style={{position: "absolute", left: 0, top: 486, width: 402, textAlign: "center", fontFamily: F, fontSize: 24, fontWeight: 700, color: "#fff", textShadow: "0 2px 6px rgba(47,58,69,0.4)"}}>加载中…</div>
              {/* 右侧互动栏：转发/评论/点赞 */}
              <svg width={34} height={34} viewBox="0 0 24 24" style={{position: "absolute", right: 13, bottom: 158, opacity: 0.95}}><path d={D_SHARE} fill="#fff" /></svg>
              <svg width={34} height={34} viewBox="0 0 24 24" style={{position: "absolute", right: 13, bottom: 224, opacity: 0.95}}><path d={D_COMMENT} fill="#fff" /></svg>
              <svg width={38} height={38} viewBox="0 0 24 24" style={{position: "absolute", right: 11, bottom: 292}}><path d={D_HEART} fill="#ff6060" /></svg>
              {/* UP 主 + 背景音乐 + 进度条（卡在 28%） */}
              <div style={{position: "absolute", left: 16, bottom: 84, fontFamily: F, fontWeight: 900, fontSize: 22, color: "#fff", textShadow: "0 2px 6px rgba(47,58,69,0.4)", whiteSpace: "nowrap"}}>@全栈小秋</div>
              <div style={{position: "absolute", left: 16, bottom: 62, width: 170, height: 9, borderRadius: 5, backgroundColor: "rgba(255,255,255,0.55)"}} />
              <svg width={22} height={22} viewBox="0 0 24 24" style={{position: "absolute", right: 14, bottom: 58, opacity: 0.9}}><path d={D_MUSIC} fill="#fff" /></svg>
              <div style={{position: "absolute", left: 0, right: 0, bottom: 20, height: 5, backgroundColor: "rgba(255,255,255,0.35)"}}>
                <div style={{width: "28%", height: "100%", backgroundColor: "#fff"}} />
              </div>
              {/* 点赞小红心：卡住了，飘得特别慢 */}
              {[0, 65].map((off) => {
                const t = (((f - 30 - off) % 130) + 130) % 130 / 130;
                if (f < 30 + off) return null;
                return (
                  <svg key={off} width={20} height={20} viewBox="0 0 24 24" style={{
                    position: "absolute", right: 22 + (off ? 16 : 0), bottom: 320 + t * 110,
                    opacity: (1 - t) * 0.9, transform: `scale(${0.8 + t * 0.4})`,
                  }}><path d={D_HEART} fill="#ff8080" /></svg>
                );
              })}
            </div>
            {/* 蜗牛趴在屏上 */}
            <Snail x={356} y={142} s={0.72} crawl={Math.sin(f / 26) * 8} />
          </PhoneBox>
        </Float>
      </PopAt>
      <Label f={f} d={-99} x={228} y={888} w={430} text="卡成蜗牛的手机" size={32} color={SUBC} />

      {/* 右侧：三张通缉卡剪影 */}
      {[
        {y: 268}, {y: 458}, {y: 648},
      ].map((c, i) => (
        <div key={i} style={{
          position: "absolute", left: 1150, top: c.y, width: 640, height: 158,
          backgroundColor: "#fff", border: "4px dashed #e05656", borderRadius: 24,
          display: "flex", alignItems: "center", paddingLeft: 34, gap: 30,
          boxShadow: "0 10px 22px rgba(224,86,86,0.08)",
        }}>
          <div style={{width: 96, height: 96, borderRadius: 26, backgroundColor: "#3f4d5e", opacity: 0.85}} />
          <div style={{
            fontFamily: F, fontWeight: 900, fontSize: 74, color: RED,
            transform: `scale(${1 + Math.sin(f / 15 + i * 2) * 0.05})`,
          }}>?</div>
          <div>
            <div style={{fontFamily: F, fontWeight: 900, fontSize: 38, color: INK}}>凶手 {i + 1}</div>
            <div style={{fontFamily: F, fontSize: 25, color: SUBC, marginTop: 6}}>真凶待揭晓</div>
          </div>
        </div>
      ))}
      <FlatArrow f={f} x1={760} y1={540} x2={1120} y2={540} delay={-99} color="#9fb4c8" dashed sw={6} />
      <Pill f={f} delay={-99} x={770} y={600} w={340} h={70} bg={RED_BG} border={`3px dashed ${RED}`} text="都是谁干的？" color={RED} ts={33} />
      <Sparkle x={1836} y={230} s={0.8} />
    </AbsoluteFill>
  );
};

// P2 杀手1 缓存堆积：App吐纸团 + 存储条被橙色塞满
const PageCache: React.FC<{off: number}> = ({off}) => {
  const f = useCurrentFrame() - off;
  // 存储条填充进度（按词级锚点推进：存储170/挤191/满201，呼吸循环）
  const fillPct = interpolate(f, [170, 183, 191, 201], [38, 62, 80, 94], clamp);
  const full = f >= 205;
  const jitter = full ? Math.sin(f / 4) * 1.6 : 0;
  return (
    <AbsoluteFill>
      <BigTitle f={f} delay={0} parts={[
        {t: "杀手1 · ", c: RED}, {t: "缓存堆积", c: ORANGE},
      ]} />

      {/* 主角手机：App 往外吐纸团 */}
      <PopAt f={f} delay={2} x={230} y={230} w={470} h={650}>
        <Float f={f} x={0} y={0} w={470} h={650} amp={5}>
          <PhoneBox x={0} y={0} w={470} h={650}>
            <PhoneStatus f={f} w={470} />
            {/* App 图标（说"每个App"时亮起） */}
            <AppTile x={52} y={80} s={1.05} letter="聊" color={BLUE} />
            <AppTile x={178} y={80} s={1.05} letter="拍" color={ORANGE} />
            <AppTile x={304} y={80} s={1.05} letter="购" color={GREEN} />
            <AppTile x={52} y={196} s={1.05} letter="看" color={RED} />
            <AppTile x={178} y={196} s={1.05} letter="听" color={BLUE} />
            <AppTile x={304} y={196} s={1.05} letter="存" color={ORANGE} />
            {/* 图标旁弹出的小纸团（偷偷存 98 / 临时文件 116） */}
            {[{x: 128, y: 92, d: 98}, {x: 254, y: 92, d: 116}, {x: 380, y: 92, d: 100}, {x: 128, y: 208, d: 120}, {x: 254, y: 208, d: 144}, {x: 380, y: 208, d: 148}].map((p, i) => (
              <PopAt key={i} f={f} delay={p.d} x={p.x} y={p.y} w={30} h={30}>
                <Crumple x={15} y={15} s={0.6} c={i % 2 ? "#f3b46a" : "#e8c9a0"} rot={i * 40} />
              </PopAt>
            ))}
            {/* 屏底纸团堆成小山（三级生长 98/116/144） */}
            {[{n: 4, d: 98}, {n: 8, d: 116}, {n: 12, d: 144}].map((st, si) => (
              <React.Fragment key={si}>
                {Array.from({length: st.n}).map((_, i) => {
                  const row = Math.floor(i / 4);
                  return (
                    <PopAt key={i} f={f} delay={st.d + i * 2} x={54 + (i % 4) * 92 + row * 20} y={524 - row * 40} w={30} h={30}>
                      <Crumple x={15} y={15} s={0.62} c={i % 2 ? "#f3b46a" : "#e8c9a0"} rot={(i * 47) % 180} />
                    </PopAt>
                  );
                })}
              </React.Fragment>
            ))}
            <div style={{position: "absolute", left: 0, bottom: 12, width: 442, textAlign: "center", fontFamily: F, fontSize: 22, fontWeight: 700, color: SUBC}}>临时文件 越堆越多</div>
          </PhoneBox>
        </Float>
      </PopAt>
      <Label f={f} d={8} x={230} y={900} w={470} text="App 都在偷偷存临时文件" size={30} color={SUBC} />

      {/* 飞行的纸团：手机 → 存储卡 */}
      <FlyCrumple f={f} x1={724} y1={470} x2={906} y2={440} start={98} c="#f3b46a" />
      <FlyCrumple f={f} x1={724} y1={520} x2={906} y2={500} start={116} period={52} c="#e8c9a0" />
      <FlyCrumple f={f} x1={724} y1={420} x2={906} y2={380} start={144} period={58} s={0.9} c="#f3b46a" />

      {/* 存储空间卡：存储条被橙色塞满 */}
      <FlatCard f={f} delay={168} x={920} y={280} w={760} h={460} chip="手机存储空间" chipColor={ORANGE}>
        <div style={{position: "absolute", left: 56, top: 96, width: 648, height: 74, borderRadius: 37, backgroundColor: "#f0f3f7", border: "3px solid #e0e6ec", overflow: "visible"}}>
          <div style={{
            position: "absolute", left: 0, top: 0, height: "100%",
            width: `${fillPct}%`, borderRadius: 37,
            backgroundColor: ORANGE,
            opacity: full ? 0.82 + 0.18 * Math.sin(f / 8) : 1,
            transform: `translateX(${jitter}px)`,
            transition: "none",
          }} />
          <div style={{position: "absolute", left: `calc(${Math.min(fillPct, 88)}% - 96px)`, top: 14, fontFamily: F, fontWeight: 900, fontSize: 36, color: "#fff", opacity: prog(f, 205, 10)}}>{Math.round(fillPct)}%</div>
        </div>
        <div style={{position: "absolute", left: 56, top: 190, width: 648, fontFamily: F, fontWeight: 900, fontSize: 42, color: full ? RED : ORANGE, textAlign: "center", opacity: prog(f, 201, 10), transform: `scale(${0.8 + 0.2 * ease(prog(f, 201, 10))})`}}>
          {full ? "存储快被塞满了" : "缓存越挤越多"}
        </div>
        {/* 三条文件占用行（日积月累 144 / 存 170） */}
        {[
          {t: "聊天记录缓存", d: 144},
          {t: "视频图片缓存", d: 160},
          {t: "安装包残留", d: 176},
        ].map((r, i) => (
          <PopAt key={i} f={f} delay={r.d} x={56} y={268 + i * 56} w={648} h={0}>
            <div style={{width: 648, height: 46, borderRadius: 12, backgroundColor: ORANGE_BG, display: "flex", alignItems: "center", paddingLeft: 22, gap: 14}}>
              <svg width={26} height={26} viewBox="0 0 24 24" style={{position: "relative", top: 0}}><path d="M6 2c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6H6z" fill={ORANGE} /></svg>
              <div style={{fontFamily: F, fontSize: 27, fontWeight: 700, color: INK}}>{r.t}</div>
            </div>
          </PopAt>
        ))}
      </FlatCard>

      <Label f={f} d={214} x={920} y={790} w={760} text="翻东西要在一堆缓存里翻找" size={30} color={SUBC} />
      <FlashRing f={f} at={201} x={1244} y={466} color={ORANGE} />
      <Sparkle x={860} y={250} s={0.75} />
      <Sparkle x={1720} y={760} s={0.6} color="#f3d9a8" />
    </AbsoluteFill>
  );
};

// P3 杀手2 后台自启：App互相唤醒红连线网 + 内存条被占满
const PageAutoStart: React.FC<{off: number}> = ({off}) => {
  const f = useCurrentFrame() - off;
  // 内存条填充（内存176/悄悄192/占205/满211）
  const memPct = interpolate(f, [176, 192, 205, 211], [46, 70, 88, 97], clamp);
  const full = f >= 213;
  const tilePos = [0, 1, 2, 3, 4].map((i) => ({x: 850 + i * 210, y: 296}));
  return (
    <AbsoluteFill>
      <BigTitle f={f} delay={0} parts={[
        {t: "杀手2 · ", c: RED}, {t: "后台自启", c: RED},
      ]} />

      {/* 主角手机：你以为退出了 */}
      <PopAt f={f} delay={2} x={230} y={250} w={470} h={620}>
        <Float f={f} x={0} y={0} w={470} h={620} amp={5}>
          <PhoneBox x={0} y={0} w={470} h={620}>
            <PhoneStatus f={f} w={470} />
            <AppTile x={60} y={90} s={1.1} letter="聊" dim />
            <AppTile x={196} y={90} s={1.1} letter="拍" dim />
            <AppTile x={332} y={90} s={1.1} letter="购" dim />
            {/* 后台任务列表（很多App在后台 109~155 亮起） */}
            {[
              {n: "聊天App", d: 109}, {n: "短视频App", d: 120}, {n: "购物App", d: 132}, {n: "天气App", d: 144},
            ].map((r, i) => (
              <PopAt key={i} f={f} delay={r.d} x={50} y={230 + i * 78} w={370} h={0}>
                <div style={{width: 370, height: 62, borderRadius: 14, backgroundColor: "#fff", border: "3px solid #f0c4c4", display: "flex", alignItems: "center", paddingLeft: 18, gap: 14}}>
                  <div style={{width: 16, height: 16, borderRadius: 999, backgroundColor: RED, opacity: 0.5 + 0.5 * Math.sin((f - r.d) / 5)}} />
                  <div style={{fontFamily: F, fontSize: 26, fontWeight: 700, color: INK}}>{r.n}</div>
                  <div style={{fontFamily: F, fontSize: 20, fontWeight: 900, color: RED, marginLeft: "auto", paddingRight: 16}}>自启</div>
                </div>
              </PopAt>
            ))}
            <div style={{position: "absolute", left: 0, bottom: 14, width: 442, textAlign: "center", fontFamily: F, fontSize: 22, fontWeight: 700, color: SUBC, opacity: prog(f, 248, 12)}}>切回来 还要重新加载</div>
          </PhoneBox>
        </Float>
      </PopAt>
      <SpeechBubble f={f} d={72} x={520} y={190} w={300} h={100} text="我已经退出了？" ts={33} c={RED} tc={RED} />

      {/* 一排 App 卡片互相唤醒（红色连线网，闪烁循环） */}
      {["聊", "拍", "购", "天", "音"].map((t, i) => (
        <PopAt key={i} f={f} delay={109 + i * 11} x={tilePos[i].x} y={tilePos[i].y} w={170} h={170}>
          <div style={{
            width: 170, height: 170, borderRadius: 24, backgroundColor: i % 2 ? "#fdecec" : "#eaf2fc",
            border: `4px solid ${i % 2 ? RED : BLUE}`, display: "flex", alignItems: "center", justifyContent: "center",
            fontFamily: F, fontWeight: 900, fontSize: 64, color: i % 2 ? RED : BLUE,
            boxShadow: "0 8px 16px rgba(47,58,69,0.1)",
            transform: `scale(${1 + Math.sin(f / 10 + i * 1.7) * 0.025})`,
          }}>{t}</div>
        </PopAt>
      ))}
      <svg width={W} height={H} style={{position: "absolute", left: 0, top: 0, overflow: "visible", pointerEvents: "none", opacity: prog(f, 148, 10) * (0.55 + 0.45 * Math.abs(Math.sin(f / 7)))}}>
        {[
          [935, 380, 1042, 352], [1145, 380, 1252, 352], [1355, 380, 1462, 352], [1565, 380, 1672, 352],
          [935, 420, 1252, 440], [1145, 425, 1462, 440], [1042, 445, 1355, 448],
        ].map((l, i) => (
          <line key={i} x1={l[0]} y1={l[1]} x2={l[2]} y2={l[3]} stroke={RED} strokeWidth={5} strokeLinecap="round" strokeDasharray="10 9" />
        ))}
      </svg>
      <Label f={f} d={155} x={850} y={500} w={1030} text="互相唤醒 · 谁也不肯睡" size={32} weight={900} color={RED} />

      {/* 内存占用卡：红条被占满 */}
      <FlatCard f={f} delay={176} x={850} y={570} w={1030} h={280} chip="内存占用" chipColor={RED}>
        <div style={{position: "absolute", left: 56, top: 78, width: 918, height: 70, borderRadius: 35, backgroundColor: "#f0f3f7", border: "3px solid #e0e6ec", overflow: "visible"}}>
          <div style={{
            position: "absolute", left: 0, top: 0, height: "100%",
            width: `${memPct}%`, borderRadius: 35, backgroundColor: RED,
            opacity: full ? 0.82 + 0.18 * Math.sin(f / 8) : 1,
          }} />
          <div style={{position: "absolute", left: `calc(${Math.min(memPct, 90)}% - 92px)`, top: 12, fontFamily: F, fontWeight: 900, fontSize: 34, color: "#fff", opacity: prog(f, 211, 10)}}>{Math.round(memPct)}%</div>
        </div>
        <div style={{position: "absolute", left: 0, top: 182, width: 1030, textAlign: "center", fontFamily: F, fontWeight: 900, fontSize: 40, color: RED, opacity: prog(f, 211, 10), transform: `scale(${0.8 + 0.2 * ease(prog(f, 211, 10))})`}}>
          内存被悄悄占满 · 新App挤不进来
        </div>
      </FlatCard>
      <FlashRing f={f} at={211} x={1365} y={708} color={RED} />
      <Sparkle x={780} y={250} s={0.75} />
      <Sparkle x={1790} y={560} s={0.6} color="#f3b8b8" />
    </AbsoluteFill>
  );
};

// P4 杀手3 电池老化：健康度仪表 100→78 指针回落 + 性能指针同步回落
const PageBattery: React.FC<{off: number}> = ({off}) => {
  const f = useCurrentFrame() - off;
  // 电池健康度：下降(96)后 100→78；之后微摆
  const health = f < 96 ? 100 : interpolate(f, [96, 150], [100, 78], clamp) + (f >= 150 ? Math.sin(f / 9) * 0.4 : 0);
  // 性能：降频(152)后回落
  const perf = f < 180 ? 92 : interpolate(f, [180, 202], [92, 46], clamp) + (f >= 202 ? Math.sin(f / 9) * 0.8 : 0);
  return (
    <AbsoluteFill>
      <BigTitle f={f} delay={0} parts={[
        {t: "杀手3 · ", c: RED}, {t: "电池老化", c: ORANGE},
      ]} />

      {/* 电池健康度仪表 */}
      <FlatCard f={f} delay={70} x={200} y={280} w={740} h={520} chip="电池健康度" chipColor={BLUE}>
        <Gauge f={f} cx={370} cy={250} value={health} color={f >= 96 ? RED : BLUE} wobble={f >= 150} />
        <div style={{
          position: "absolute", left: 0, top: 296, width: 740, textAlign: "center",
          fontFamily: F, fontWeight: 900, fontSize: 84, letterSpacing: 2,
          color: f >= 96 ? RED : BLUE,
        }}>{f < 96 ? "100%" : `${Math.round(health)}%`}</div>
        <div style={{position: "absolute", left: 0, top: 424, width: 740, textAlign: "center", fontFamily: F, fontSize: 27, color: SUBC, opacity: prog(f, 150, 12)}}>
          电池老化 健康度往下掉
        </div>
      </FlatCard>

      {/* 系统性能仪表 */}
      <FlatCard f={f} delay={152} x={990} y={280} w={740} h={520} chip="系统性能" chipColor={RED}>
        <Gauge f={f} cx={370} cy={250} value={perf} color={f >= 180 ? RED : BLUE} wobble={f >= 202} />
        <div style={{
          position: "absolute", left: 0, top: 296, width: 740, textAlign: "center",
          fontFamily: F, fontWeight: 900, fontSize: 76, letterSpacing: 2,
          color: f >= 180 ? RED : BLUE, opacity: prog(f, 180, 10), transform: `scale(${0.7 + 0.3 * ease(prog(f, 180, 10))})`,
        }}>性能打折</div>
        <div style={{position: "absolute", left: 0, top: 424, width: 740, textAlign: "center", fontFamily: F, fontSize: 27, color: SUBC, opacity: prog(f, 202, 12)}}>
          老手机卡顿的隐藏原因
        </div>
      </FlatCard>

      <Pill f={f} delay={164} x={560} y={848} w={800} h={76} bg={RED_BG} text="系统主动降频自保 · 速度让位给续航" color={RED} ts={36} />
      <FlashRing f={f} at={150} x={570} y={520} color={RED} />
      <FlashRing f={f} at={202} x={1360} y={520} color={RED} />
      <Sparkle x={920} y={250} s={0.8} />
      <Sparkle x={250} y={860} s={0.6} color="#f3d9a8" />
    </AbsoluteFill>
  );
};

// P5 对应三招：三张绿色处方卡一一对应三杀手
const PageFix: React.FC<{off: number}> = ({off}) => {
  const f = useCurrentFrame() - off;
  return (
    <AbsoluteFill>
      <BigTitle f={f} delay={0} parts={[
        {t: "对症下药 · ", c: INK}, {t: "三招", c: GREEN},
      ]} />

      {[
        {x: 140, d: 30, chip: "对付杀手1", icon: "broom", big: "清缓存大文件", small: "定期清理 卸载残留", mk: 46},
        {x: 700, d: 84, chip: "对付杀手2", icon: "ban", big: "关掉自启权限", small: "不用的App别让它赖着", mk: 100},
        {x: 1260, d: 155, chip: "对付杀手3", icon: "battery", big: "去换块电池", small: "老化明显就换 不用换机", mk: 171},
      ].map((c, i) => (
        <React.Fragment key={i}>
          <FlatCard f={f} delay={c.d} x={c.x} y={300} w={520} h={480} chip={c.chip} chipColor={GREEN}>
            {/* 图标 */}
            {c.icon === "broom" ? (
              <svg width={130} height={130} viewBox="0 0 130 130" style={{position: "absolute", left: 195, top: 64}}>
                <line x1={70} y1={12} x2={54} y2={64} stroke={GREEN} strokeWidth={13} strokeLinecap="round" />
                <path d="M34 66 L82 60 L102 108 L20 112 Z" fill="#8fb3dd" />
                <path d="M36 76 L98 72 M32 90 L100 86 M28 102 L102 98" stroke="#fff" strokeWidth={5} strokeLinecap="round" opacity={0.7} />
              </svg>
            ) : c.icon === "ban" ? (
              <svg width={130} height={130} viewBox="0 0 130 130" style={{position: "absolute", left: 195, top: 64}}>
                <circle cx={65} cy={65} r={50} fill="none" stroke={GREEN} strokeWidth={15} />
                <line x1={30} y1={100} x2={100} y2={30} stroke={GREEN} strokeWidth={15} strokeLinecap="round" />
                <rect x={38} y={52} width={54} height={12} rx={6} fill={GREEN} opacity={0.85} />
              </svg>
            ) : (
              <svg width={130} height={130} viewBox="0 0 130 130" style={{position: "absolute", left: 195, top: 64}}>
                <rect x={18} y={38} width={84} height={56} rx={12} fill={GREEN} />
                <rect x={106} y={54} width={12} height={24} rx={5} fill={GREEN} />
                <path d="M64 44 L48 68 L60 68 L54 88 L76 62 L63 62 Z" fill="#fff" />
              </svg>
            )}
            <div style={{position: "absolute", left: 0, top: 250, width: 520, textAlign: "center", fontFamily: F, fontWeight: 900, fontSize: 50, color: GREEN, letterSpacing: 2}}>{c.big}</div>
            <div style={{position: "absolute", left: 0, top: 330, width: 520, textAlign: "center", fontFamily: F, fontSize: 26, color: SUBC}}>{c.small}</div>
            <PopAt f={f} delay={c.mk} x={418} y={30} w={60} h={60}>
              <MarkOk x={30} y={30} s={1} />
            </PopAt>
          </FlatCard>
        </React.Fragment>
      ))}

      <PopAt f={f} delay={222} x={560} y={840} w={800} h={0}>
        <div style={{
          width: 800, height: 84, borderRadius: 999, backgroundColor: GREEN,
          display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: "0 12px 26px rgba(69,165,106,0.35)",
        }}>
          <span style={{fontFamily: F, fontWeight: 900, fontSize: 42, color: "#fff", letterSpacing: 4}}>先换电池 · 不用急着换手机</span>
        </div>
      </PopAt>
      <Sparkle x={640} y={280} s={0.8} />
      <Sparkle x={1780} y={280} s={0.65} color="#bfe3cc" />
    </AbsoluteFill>
  );
};

// P6 口诀横幅：先查存储 再查后台 最后查电池 + 手机复检小场景
const PageMotto: React.FC<{off: number}> = ({off}) => {
  const f = useCurrentFrame() - off;
  return (
    <AbsoluteFill>
      <BigTitle f={f} delay={0} parts={[
        {t: "记住这个", c: INK}, {t: "口诀", c: ORANGE},
      ]} />

      {/* 黄横幅微倾斜（整句在口播说"口诀"时一次弹出，先于字幕逐句） */}
      <PopAt f={f} delay={26} x={285} y={210} w={1350} h={136} rot={-1.2}>
        <div style={{
          width: 1350, height: 136, borderRadius: 26, backgroundColor: YEL,
          display: "flex", alignItems: "center", justifyContent: "center", gap: 34,
          boxShadow: "0 14px 30px rgba(247,201,72,0.4)",
        }}>
          <span style={{fontFamily: F, fontWeight: 900, fontSize: 56, color: INK, letterSpacing: 3}}>先查<span style={{color: "#a3650a"}}>存储</span></span>
          <span style={{fontFamily: F, fontWeight: 900, fontSize: 44, color: "#c99a1e"}}>→</span>
          <span style={{fontFamily: F, fontWeight: 900, fontSize: 56, color: INK, letterSpacing: 3}}>再查<span style={{color: "#a3650a"}}>后台</span></span>
          <span style={{fontFamily: F, fontWeight: 900, fontSize: 44, color: "#c99a1e"}}>→</span>
          <span style={{fontFamily: F, fontWeight: 900, fontSize: 56, color: INK, letterSpacing: 3}}>最后查<span style={{color: "#a3650a"}}>电池</span></span>
        </div>
      </PopAt>
      <Sparkle x={250} y={200} s={0.9} />
      <Sparkle x={1660} y={340} s={0.7} />

      {/* 手机复检小场景 */}
      <PopAt f={f} delay={45} x={420} y={470} w={330} h={400}>
        <Float f={f} x={0} y={0} w={330} h={400} amp={5}>
          <PhoneBox x={0} y={0} w={330} h={400} bodyColor="#55677c">
            <div style={{position: "absolute", left: 20, top: 16, width: 130, height: 12, borderRadius: 6, backgroundColor: ORANGE, opacity: 0.85}} />
            <div style={{position: "absolute", left: 20, top: 44, width: 210, height: 12, borderRadius: 6, backgroundColor: RED, opacity: 0.75}} />
            <div style={{position: "absolute", left: 20, top: 72, width: 170, height: 12, borderRadius: 6, backgroundColor: "#c3d2e2"}} />
            {/* 电池小图 */}
            <svg width={120} height={64} viewBox="0 0 120 64" style={{position: "absolute", left: 20, top: 130}}>
              <rect x={4} y={14} width={92} height={38} rx={9} fill="#fff" stroke={GREEN} strokeWidth={5} />
              <rect x={98} y={26} width={9} height={14} rx={4} fill={GREEN} />
              <rect x={10} y={20} width={52} height={26} rx={5} fill={GREEN} />
            </svg>
            <div style={{position: "absolute", left: 20, top: 216, width: 250, height: 12, borderRadius: 6, backgroundColor: "#c3d2e2"}} />
            <div style={{position: "absolute", left: 20, top: 240, width: 200, height: 12, borderRadius: 6, backgroundColor: "#d5dee8"}} />
          </PhoneBox>
          {/* 放大镜 */}
          <svg width={110} height={110} viewBox="0 0 110 110" style={{position: "absolute", right: -30, top: -26, overflow: "visible"}}>
            <circle cx={46} cy={46} r={32} fill="rgba(234,242,252,0.75)" stroke={BLUE} strokeWidth={9} />
            <line x1={70} y1={70} x2={100} y2={100} stroke={BLUE} strokeWidth={12} strokeLinecap="round" />
          </svg>
        </Float>
      </PopAt>
      <Label f={f} d={45} x={380} y={880} w={410} text="按顺序排查 一分钟定位" size={29} color={SUBC} />

      {/* 三步复检清单（对应口播词级锚点） */}
      {[
        {y: 470, d: 61, t: "① 存储 还剩多少", ic: ORANGE},
        {y: 596, d: 93, t: "② 后台 谁在自启", ic: RED},
        {y: 722, d: 127, t: "③ 电池 健康度多少", ic: BLUE},
      ].map((r, i) => (
        <React.Fragment key={i}>
          <PopAt f={f} delay={r.d} x={900} y={r.y} w={760} h={92}>
            <div style={{
              width: 760, height: 92, borderRadius: 20, backgroundColor: "#fff", border: "3px solid #e0e6ec",
              display: "flex", alignItems: "center", paddingLeft: 30, gap: 22,
              boxShadow: "0 8px 18px rgba(47,58,69,0.06)",
            }}>
              <div style={{width: 20, height: 20, borderRadius: 999, backgroundColor: r.ic}} />
              <div style={{fontFamily: F, fontWeight: 900, fontSize: 40, color: INK}}>{r.t}</div>
            </div>
          </PopAt>
          <PopAt f={f} delay={r.d + 10} x={1600} y={r.y + 14} w={64} h={64}>
            <MarkOk x={32} y={32} s={1.05} />
          </PopAt>
        </React.Fragment>
      ))}
      <Sparkle x={1830} y={460} s={0.6} />
    </AbsoluteFill>
  );
};

// P7 结尾截图卡（最后~100帧完全静止：无循环动画，全部元素 130 帧前就位）
const PageOutro: React.FC<{off: number}> = ({off}) => {
  const f = useCurrentFrame() - off;
  return (
    <AbsoluteFill>
      <BigTitle f={f} delay={6} parts={[
        {t: "手机卡顿", c: INK}, {t: "三杀手", c: RED},
      ]} />

      <FlatCard f={f} delay={8} x={310} y={240} w={1300} h={560} chip="截图保存" chipColor={BLUE}>
        {[
          {y: 78, d: 20, k: "杀手1", a: "缓存堆积", b: "清存储"},
          {y: 206, d: 40, k: "杀手2", a: "后台自启", b: "关权限"},
          {y: 334, d: 60, k: "杀手3", a: "电池老化", b: "换电池"},
        ].map((r, i) => (
          <PopAt key={i} f={f} delay={r.d} x={120} y={r.y} w={1060} h={104}>
            <div style={{
              width: 1060, height: 104, borderRadius: 20, backgroundColor: i % 2 ? "#fbfcfe" : "#f6f8fa",
              border: "3px solid #e0e6ec", display: "flex", alignItems: "center", paddingLeft: 44, gap: 40,
            }}>
              <div style={{
                width: 160, height: 62, borderRadius: 999, backgroundColor: RED, color: "#fff",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontFamily: F, fontWeight: 900, fontSize: 30,
              }}>{r.k}</div>
              <div style={{fontFamily: F, fontWeight: 900, fontSize: 46, color: INK, width: 270}}>{r.a}</div>
              <svg width={70} height={36} viewBox="0 0 70 36" style={{position: "relative", top: 2}}>
                <line x1={6} y1={18} x2={52} y2={18} stroke={GREEN} strokeWidth={8} strokeLinecap="round" />
                <path d="M48 4 L66 18 L48 32" fill="none" stroke={GREEN} strokeWidth={8} strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <div style={{
                width: 320, height: 68, borderRadius: 999, backgroundColor: GREEN_BG,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontFamily: F, fontWeight: 900, fontSize: 40, color: GREEN,
              }}>{r.b}</div>
            </div>
          </PopAt>
        ))}
      </FlatCard>

      <PopAt f={f} delay={100} x={640} y={838} w={420} h={0}>
        <div style={{
          width: 420, height: 84, borderRadius: 999, backgroundColor: ORANGE,
          display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: "0 12px 26px rgba(240,145,45,0.35)",
        }}>
          <span style={{fontFamily: F, fontWeight: 900, fontSize: 38, color: "#fff", letterSpacing: 4}}>关注 全栈小秋</span>
        </div>
      </PopAt>
      <Label f={f} d={112} x={1090} y={862} w={420} text="小秋 · 0基础也能学会" size={30} color={SUBC} />
      <Sparkle x={560} y={830} s={0.8} />
      <Sparkle x={1640} y={250} s={0.6} color="#f3b8b8" />
    </AbsoluteFill>
  );
};

// ============ 主组件 ============

const PAGES: {C: React.FC<{off: number}>; start: number; end: number}[] = [
  {C: PageHook, start: SENT[0], end: SENT[1]},
  {C: PageCache, start: SENT[1], end: SENT[2]},
  {C: PageAutoStart, start: SENT[2], end: SENT[3]},
  {C: PageBattery, start: SENT[3], end: SENT[4]},
  {C: PageFix, start: SENT[4], end: SENT[5]},
  {C: PageMotto, start: SENT[5], end: SENT[6]},
  {C: PageOutro, start: SENT[6], end: DUR},
];

export const PhoneLagFlat: React.FC = () => {
  const frame = useCurrentFrame();
  const bed = interpolate(frame, [0, 20, DUR - 130, DUR - 100, DUR - 26, DUR - 1], [0, 0.06, 0.06, 0.1, 0.17, 0], clamp);
  return (
    <AbsoluteFill style={{background: "linear-gradient(180deg,#fff 0%,#f3f6f9 100%)", fontFamily: F, overflow: "hidden"}}>
      <BgDots />
      {PAGES.map(({C, start, end}, i) => {
        const first = i === 0, last = i === PAGES.length - 1, len = end - start, off = first ? 0 : 10;
        return (
          <Sequence key={i} from={first ? 0 : start - 10} durationInFrames={len + 12}>
            <PageTurn off={off} len={len} first={first} last={last}><C off={off} /></PageTurn>
          </Sequence>
        );
      })}
      {/* 右上角角标 */}
      <div style={{
        position: "absolute", top: 45, right: 70, zIndex: 45, border: `3px solid ${BLUE}`,
        borderRadius: 999, padding: "7px 25px", fontSize: 28, fontWeight: 900, color: INK,
        letterSpacing: 5, background: "#fff",
      }}>小秋</div>

      {/* 配音（每句一个 Sequence，从 timeline.json 的 start_frame 挂载） */}
      {["s01", "s02", "s03", "s04", "s05", "s06", "s07"].map((s, i) => (
        <Sequence key={`v-${i}`} from={SENT[i]} durationInFrames={(i < 6 ? SENT[i + 1] : 1590) - SENT[i] + 20}>
          <Audio src={staticFile(`audio/phonelag-tts/${s}.mp3`)} volume={1} />
        </Sequence>
      ))}

      {/* 音效层（帧号全部从 SENT / 词级锚点推导） */}
      {/* 翻页 */}
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <Sequence key={`pg-${i}`} from={SENT[i] - 6} durationInFrames={22}>
          <Audio src={staticFile("audio/sfx/page3.wav")} volume={0.28} />
        </Sequence>
      ))}
      {/* P2 杀手1：出场 error，纸团 pop，存储条 whoosh */}
      <Sequence from={SENT[1] + 28} durationInFrames={24}><Audio src={staticFile("audio/sfx/error.wav")} volume={0.3} /></Sequence>
      {[98, 116, 144].map((t) => (
        <Sequence key={`p2pop-${t}`} from={SENT[1] + t} durationInFrames={12}><Audio src={staticFile("audio/sfx/pop.wav")} volume={0.26} /></Sequence>
      ))}
      {[170, 196].map((t) => (
        <Sequence key={`p2wh-${t}`} from={SENT[1] + t} durationInFrames={12}><Audio src={staticFile("audio/sfx/whoosh.wav")} volume={0.22} /></Sequence>
      ))}
      {/* P3 杀手2：气泡 pop，磁贴 pop，唤醒 error，占满 error */}
      {[72, 109, 132].map((t) => (
        <Sequence key={`p3pop-${t}`} from={SENT[2] + t} durationInFrames={12}><Audio src={staticFile("audio/sfx/pop.wav")} volume={0.26} /></Sequence>
      ))}
      <Sequence from={SENT[2] + 150} durationInFrames={24}><Audio src={staticFile("audio/sfx/error.wav")} volume={0.3} /></Sequence>
      <Sequence from={SENT[2] + 211} durationInFrames={24}><Audio src={staticFile("audio/sfx/error.wav")} volume={0.3} /></Sequence>
      {/* P4 杀手3：出场 error，指针回落 whoosh，降频 error，性能 whoosh */}
      <Sequence from={SENT[3] + 45} durationInFrames={24}><Audio src={staticFile("audio/sfx/error.wav")} volume={0.3} /></Sequence>
      <Sequence from={SENT[3] + 96} durationInFrames={12}><Audio src={staticFile("audio/sfx/whoosh.wav")} volume={0.22} /></Sequence>
      <Sequence from={SENT[3] + 152} durationInFrames={24}><Audio src={staticFile("audio/sfx/error.wav")} volume={0.3} /></Sequence>
      <Sequence from={SENT[3] + 180} durationInFrames={12}><Audio src={staticFile("audio/sfx/whoosh.wav")} volume={0.22} /></Sequence>
      {/* P5 三招：ding × 3 + 收尾 pop */}
      {[30, 84, 155].map((t) => (
        <Sequence key={`p5ding-${t}`} from={SENT[4] + t} durationInFrames={22}><Audio src={staticFile("audio/sfx/ding.wav")} volume={0.3} /></Sequence>
      ))}
      <Sequence from={SENT[4] + 222} durationInFrames={12}><Audio src={staticFile("audio/sfx/pop.wav")} volume={0.26} /></Sequence>
      {/* P6 口诀：横幅 whoosh + 三步 pop */}
      <Sequence from={SENT[5] + 26} durationInFrames={12}><Audio src={staticFile("audio/sfx/whoosh.wav")} volume={0.22} /></Sequence>
      {[61, 93, 127].map((t) => (
        <Sequence key={`p6pop-${t}`} from={SENT[5] + t} durationInFrames={12}><Audio src={staticFile("audio/sfx/pop.wav")} volume={0.26} /></Sequence>
      ))}
      {/* P7 截图卡：行 pop × 3 + 关注 ding */}
      {[20, 40, 60].map((t) => (
        <Sequence key={`p7pop-${t}`} from={SENT[6] + t} durationInFrames={12}><Audio src={staticFile("audio/sfx/pop.wav")} volume={0.26} /></Sequence>
      ))}
      <Sequence from={SENT[6] + 100} durationInFrames={22}><Audio src={staticFile("audio/sfx/ding.wav")} volume={0.3} /></Sequence>

      {/* 铺底 bed 循环 */}
      <Audio src={staticFile("audio/bed.wav")} loop volume={() => bed} />
      <Sequence from={1444} durationInFrames={60}>
        <Audio src={staticFile("audio/sfx/warm3.wav")} volume={0.26} />
      </Sequence>
      <Subtitle />
    </AbsoluteFill>
  );
};
