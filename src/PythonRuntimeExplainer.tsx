import React from "react";
import {Audio} from "@remotion/media";
import {
  AbsoluteFill, interpolate, Sequence, staticFile, useCurrentFrame,
} from "remotion";

// ================= 白板手绘风 · Python代码为什么能运行（对齐 TCP/UDP 画布基因 + 全栈小秋 IP） =================
// 画布基因：速写本纸白底 / 左侧螺旋装订线圈 / 咖啡渍 / 黑墨线稿 / 彩色蜡笔+水彩重点
// 动画：元素随配音逐个描画，页间 10 帧叠化

const PAPER = "#fdfcf7";
const INK = "#3a3a3a";
const SUBC = "#8a8579";
const RED = "#c94f4f";
const BLUE_F = "rgba(139,178,216,0.34)";
const BLUE_E = "#5b87ad";
const GREEN_E = "#4e9464";
const YEL_F = "rgba(242,202,92,0.45)";
const ORANGE_F = "rgba(242,163,94,0.40)";
const ORANGE_E = "#c97a2e";
const STAIN = "rgba(150,110,70,0.30)";

const T_FONT = "'STXingkai','华文行楷','KaiTi','楷体',serif";
const B_FONT = "'STKaiti','KaiTi','楷体','Microsoft YaHei',serif";
const MONO = "'Consolas','Courier New',monospace";

const DUR = 1165;
const W = 1920;
const H = 1080;

type Sub = {s: number; e: number; t: string; kw?: string; kc?: string};
const ORANGE_KW = "#ffb35c";
const BLUE_KW = "#7db3dd";
const subs: Sub[] = [
  {s: 0, e: 83, t: "Python代码 不是机器码", kw: "机器码", kc: ORANGE_KW},
  {s: 83, e: 135, t: "CPU 不认识它 为什么能运行", kw: "CPU", kc: BLUE_KW},
  {s: 140, e: 205, t: "源码先交给 Python 解释器", kw: "解释器", kc: ORANGE_KW},
  {s: 205, e: 268, t: "通常会被编译成字节码", kw: "字节码", kc: BLUE_KW},
  {s: 272, e: 344, t: "运行时取出指令", kw: "运行时", kc: BLUE_KW},
  {s: 344, e: 414, t: "管理对象 变量和调用", kw: "对象", kc: ORANGE_KW},
  {s: 418, e: 490, t: "不是不编译", kw: "不是不编译", kc: ORANGE_KW},
  {s: 490, e: 562, t: "而是编译和执行方式不同", kw: "方式", kc: BLUE_KW},
  {s: 566, e: 625, t: "比如 print Hello", kw: "print Hello", kc: ORANGE_KW},
  {s: 625, e: 687, t: "变成这样的字节码指令", kw: "字节码", kc: BLUE_KW},
  {s: 692, e: 851, t: "C走机器码 Python多了运行时", kw: "机器码", kc: GREEN_E},
  {s: 855, e: 928, t: "CPU 不认识 Python", kw: "CPU", kc: ORANGE_KW},
  {s: 928, e: 999, t: "执行的是运行环境里的机器指令", kw: "机器指令", kc: ORANGE_KW},
  {s: 1003, e: 1085, t: "点赞关注 转发收藏", kw: "点赞关注", kc: ORANGE_KW},
  {s: 1085, e: 1165, t: "还想听什么 评论区告诉我", kw: "评论区", kc: BLUE_KW},
];

const clamp = {extrapolateLeft: "clamp", extrapolateRight: "clamp"} as const;
const wob = (i: number, amp = 2.4) => Math.sin(i * 5.7 + 1.3) * amp;
const prog = (f: number, delay: number, dur = 16) =>
  interpolate(f, [delay, delay + dur], [0, 1], clamp);

const sketchRectPath = (x: number, y: number, w: number, h: number, seed = 0) => {
  const p = (a: number, b: number) => `${a + wob(a + b + seed)} ${b + wob(b - a + seed + 3)}`;
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
    pts.push(`${(cx + Math.cos(a) * rx * jx).toFixed(1)},${(cy + Math.sin(a) * ry * jy).toFixed(1)}`);
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
  f: number; d: string; stroke?: string; sw?: number; delay?: number; dur?: number;
  fill?: string; fillOp?: number; op?: number;
}> = ({f, d, stroke = INK, sw = 5, delay = 0, dur = 16, fill = "none", fillOp = 1, op = 1}) => {
  const p = prog(f, delay, dur);
  if (p <= 0) return null;
  const fo = interpolate(p, [0.5, 1], [0, 1], clamp);
  return (
    <svg width={W} height={H} style={{position: "absolute", left: 0, top: 0, overflow: "visible", pointerEvents: "none"}}>
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
}> = ({f, x, y, w, h, fill = "none", stroke = INK, sw = 5, seed = 0, delay = 0, dur = 16}) => (
  <Draw f={f} d={sketchRectPath(x, y, w, h, seed)} stroke={stroke} sw={sw} delay={delay} dur={dur} fill={fill} />
);

const WCol: React.FC<{
  f: number; cx: number; cy: number; rx: number; ry: number; color: string; seed?: number; delay?: number; op?: number;
}> = ({f, cx, cy, rx, ry, color, seed = 0, delay = 0, op = 1}) => {
  const p = prog(f, delay, 12);
  if (p <= 0) return null;
  const s = 0.82 + 0.18 * p;
  return (
    <svg width={W} height={H} style={{position: "absolute", left: 0, top: 0, overflow: "visible", pointerEvents: "none"}}>
      <g transform={`translate(${cx},${cy}) scale(${s}) translate(${-cx},${-cy})`} opacity={op * p}>
        <path d={blobPath(cx, cy, rx, ry, seed)} fill={color} />
      </g>
    </svg>
  );
};

const Arrow: React.FC<{
  f: number; x: number; y: number; len: number; color?: string; delay?: number;
  bend?: number; rot?: number; sw?: number; flip?: boolean;
}> = ({f, x, y, len, color = INK, delay = 0, bend = 0, rot = 0, sw = 6, flip}) => {
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

const Squiggle: React.FC<{f: number; x: number; y: number; w: number; color?: string; delay?: number; sw?: number}> = ({
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
}> = ({f, x, y, w, h, text, ts = 32, delay = 0, tail = "bl", color = "rgba(255,255,255,0.92)"}) => {
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
}> = ({f, x, y, w, h, title, sub, color = "#c96a7c", delay = 0, rot = 0, ts = 34}) => {
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
      <div style={{fontFamily: B_FONT, fontWeight: 700, fontSize: ts, color: INK, whiteSpace: "nowrap"}}>{title}</div>
      {sub ? <div style={{fontFamily: B_FONT, fontSize: ts * 0.72, color: SUBC, marginTop: 6, whiteSpace: "nowrap"}}>{sub}</div> : null}
    </div>
  );
};

// 中英混排：拉丁/数字用粗雅黑保证清晰，中文保留手写体
const MixText: React.FC<{text: string; latinScale?: number}> = ({text, latinScale = 0.92}) => {
  const parts = text.split(/([A-Za-z0-9.]+)/g);
  return (
    <>
      {parts.map((p, i) =>
        /^[A-Za-z0-9.]+$/.test(p) ? (
          <span key={i} style={{fontFamily: "'Microsoft YaHei',sans-serif", fontWeight: 900, fontSize: `${latinScale}em`, letterSpacing: 1}}>{p}</span>
        ) : (
          <span key={i}>{p}</span>
        )
      )}
    </>
  );
};

// 居中手写标题 + 两侧小笔触 + 红波浪
const HandTitle: React.FC<{f: number; text: React.ReactNode; y?: number; size?: number; delay?: number; sub?: string}> = ({
  f, text, y = 58, size = 96, delay = 0, sub,
}) => {
  const p = prog(f, delay, 10);
  if (p <= 0) return null;
  const tw = (typeof text === "string" ? text.length : 8) * size * 1.02;
  return (
    <div style={{position: "absolute", top: y, left: 0, right: 0, textAlign: "center", opacity: p}}>
      <div style={{position: "relative", display: "inline-block"}}>
        <svg width={70} height={size} style={{position: "absolute", left: -84, top: size * 0.18, overflow: "visible"}}>
          <path d="M 56 12 L 10 30 M 60 38 L 22 48 M 54 62 L 16 66" stroke={INK} strokeWidth={5} strokeLinecap="round" opacity={0.8} />
        </svg>
        <svg width={70} height={size} style={{position: "absolute", right: -84, top: size * 0.18, overflow: "visible"}}>
          <path d="M 14 12 L 60 30 M 10 38 L 48 48 M 16 62 L 54 66" stroke={INK} strokeWidth={5} strokeLinecap="round" opacity={0.8} />
        </svg>
        <div style={{
          fontFamily: T_FONT, fontSize: size, color: INK, letterSpacing: 6,
          transform: "rotate(-0.6deg)", whiteSpace: "nowrap", lineHeight: 1.15,
        }}><MixText text={typeof text === "string" ? text : ""} />{typeof text === "string" ? null : text}</div>
        <div style={{position: "absolute", left: "50%", transform: "translateX(-50%)", bottom: -18}}>
          <svg width={tw * 0.72} height={20} style={{overflow: "visible"}}>
            <Squiggle f={f} x={4} y={10} w={tw * 0.72 - 8} delay={delay + 8} />
          </svg>
        </div>
      </div>
      {sub ? (
        <div style={{fontFamily: B_FONT, fontSize: 34, color: SUBC, marginTop: 26, letterSpacing: 4}}>{sub}</div>
      ) : null}
    </div>
  );
};

// 黄色描边字幕 + 关键词层级
const Subtitle: React.FC = () => {
  const frame = useCurrentFrame();
  const cur = subs.find((s) => frame >= s.s && frame < s.e);
  if (!cur) return null;
  const o = interpolate(frame, [cur.s, cur.s + 5], [0.4, 1], clamp);
  const pop = cur.kw ? 1 + 0.14 * Math.max(0, 1 - (frame - cur.s) / 5) : 1;
  const parts = cur.kw ? cur.t.split(cur.kw) : [cur.t];
  return (
    <div style={{
      position: "absolute", bottom: 30, left: 0, right: 0, display: "flex", justifyContent: "center",
      pointerEvents: "none", zIndex: 50,
    }}>
      <div style={{
        fontFamily: "'Microsoft YaHei', sans-serif", fontWeight: 900, fontSize: 52, letterSpacing: 2,
        color: "#ffd93d", opacity: o,
        textShadow: "4px 0 0 #3a2f10, -4px 0 0 #3a2f10, 0 4px 0 #3a2f10, 0 -4px 0 #3a2f10, 3px 3px 0 #3a2f10, -3px -3px 0 #3a2f10, 3px -3px 0 #3a2f10, -3px 3px 0 #3a2f10, 0 8px 16px rgba(0,0,0,0.35)",
        whiteSpace: "nowrap",
        display: "flex", alignItems: "baseline",
      }}>
        {cur.kw ? parts.map((p, i) => (
          <span key={i}>
            {p}
            {i < parts.length - 1 ? (
              <span style={{
                display: "inline-block", color: cur.kc, fontSize: 64,
                transform: `scale(${pop})`, transformOrigin: "center bottom",
              }}>{cur.kw}</span>
            ) : null}
          </span>
        )) : cur.t}
      </div>
    </div>
  );
};

const CornerMark: React.FC = () => (
  <div style={{
    position: "absolute", top: 52, right: 76, zIndex: 40,
    fontFamily: B_FONT, fontSize: 30, color: INK, letterSpacing: 6, fontWeight: 700,
    transform: "rotate(2deg)", opacity: 0.85,
    borderBottom: `3px solid ${RED}`,
  }}>全栈小秋</div>
);

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
      <svg width={200} height={H} style={{position: "absolute", left: 0, top: 0, overflow: "visible", pointerEvents: "none", zIndex: 30}}>
        {coils}
      </svg>
    </>
  );
};

const CoffeeStains: React.FC = () => (
  <svg width={W} height={H} style={{position: "absolute", left: 0, top: 0, pointerEvents: "none", zIndex: 1}}>
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

// 代码文件：手绘纸张 + 代码行
const CodeFile: React.FC<{f: number; x: number; y: number; w?: number; h?: number; lines: string[]; delay?: number; ts?: number}> = ({
  f, x, y, w = 460, h = 260, lines, delay = 0, ts = 34,
}) => (
  <>
    <WBox f={f} x={x} y={y} w={w} h={h} fill="rgba(255,255,255,0.94)" sw={6} seed={3} delay={delay} />
    <Draw f={f} d={`M ${x + 2} ${y + 48} L ${x + w - 2} ${y + 48}`} stroke={INK} sw={4.5} delay={delay + 8} dur={8} />
    {[0, 1, 2].map((i) => (
      <circle key={i} cx={x + 28 + i * 28} cy={y + 24} r={8} fill={i === 0 ? RED : i === 1 ? "#e8b93c" : GREEN_E} opacity={prog(f, delay + 10 + i * 3, 6)} />
    ))}
    {lines.map((line, i) => (
      <div key={i} style={{
        position: "absolute", left: x + 34, top: y + 82 + i * (ts + 14),
        fontFamily: MONO, fontSize: ts, fontWeight: 700, color: i === 0 ? ORANGE_E : INK,
        opacity: prog(f, delay + 16 + i * 4, 8),
        transform: `translateX(${(1 - prog(f, delay + 16 + i * 4, 8)) * 26}px)`,
        whiteSpace: "nowrap",
      }}>{line}</div>
    ))}
  </>
);

// CPU 芯片：手绘
const CpuChip: React.FC<{f: number; x: number; y: number; s?: number; delay?: number; confused?: boolean}> = ({
  f, x, y, s = 1, delay = 0, confused = false,
}) => {
  const p = prog(f, delay, 14);
  if (p <= 0) return null;
  const pu = 1 + (confused ? 0.02 * Math.sin(f / 5) : 0);
  return (
    <svg width={W} height={H} style={{position: "absolute", left: 0, top: 0, overflow: "visible", pointerEvents: "none"}}>
      <g transform={`translate(${x},${y}) scale(${s * pu})`} opacity={p}>
        <path d={sketchRectPath(-105, -105, 210, 200, 8)} fill={confused ? "rgba(201,79,79,0.22)" : BLUE_F} stroke={INK} strokeWidth={7} />
        {[-65, 0, 65].map((o) => (
          <React.Fragment key={o}>
            <path d={`M ${-105} ${o} L ${-150} ${o}`} stroke={INK} strokeWidth={6} strokeLinecap="round" />
            <path d={`M ${105} ${o} L ${150} ${o}`} stroke={INK} strokeWidth={6} strokeLinecap="round" />
          </React.Fragment>
        ))}
        <path d={sketchRectPath(-50, -45, 100, 90, 2)} fill="rgba(255,255,255,0.85)" stroke={INK} strokeWidth={5} />
        <text x={0} y={14} textAnchor="middle" fontFamily="'Microsoft YaHei',sans-serif" fontWeight={900} fontSize={confused ? 46 : 36} fill={confused ? RED : BLUE_E}>
          {confused ? "？？？" : "CPU"}
        </text>
      </g>
    </svg>
  );
};

// 灯泡
const Bulb: React.FC<{f: number; x: number; y: number; s?: number; delay?: number}> = ({f, x, y, s = 1.2, delay = 0}) => {
  const p = prog(f, delay, 12);
  if (p <= 0) return null;
  return (
    <svg width={W} height={H} style={{position: "absolute", left: 0, top: 0, overflow: "visible", pointerEvents: "none"}}>
      <g transform={`translate(${x},${y}) scale(${s})`} opacity={p}>
        <circle cx={0} cy={0} r={24} fill={YEL_F} stroke={INK} strokeWidth={5} />
        <path d="M -9 24 L 9 24 M -7 31 L 7 31" stroke={INK} strokeWidth={4.5} fill="none" strokeLinecap="round" />
        <path d="M 0 -38 L 0 -50 M 30 -22 L 40 -30 M -30 -22 L -40 -30" stroke="#d9a12c" strokeWidth={4.5} strokeLinecap="round" />
      </g>
    </svg>
  );
};

// 手绘流程节点（贴纸感）
const Node: React.FC<{
  f: number; x: number; y: number; w: number; title: React.ReactNode; sub?: string;
  color: string; delay?: number;
}> = ({f, x, y, w, title, sub, color, delay = 0}) => {
  const p = prog(f, delay, 12);
  if (p <= 0) return null;
  return (
    <div style={{
      position: "absolute", left: x, top: y, width: w, opacity: p,
      transform: `scale(${0.9 + 0.1 * p})`,
    }}>
      <WBox f={f} x={0} y={0} w={w} h={sub ? 150 : 118} fill="rgba(255,255,255,0.9)" stroke={INK} sw={6} seed={x % 9} delay={delay} />
      <div style={{
        position: "absolute", left: 0, top: 0, width: w, height: sub ? 150 : 118,
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      }}>
        <div style={{fontFamily: B_FONT, fontWeight: 700, fontSize: 38, color: INK, whiteSpace: "nowrap"}}>{title}</div>
        {sub ? <div style={{fontFamily: B_FONT, fontSize: 26, color: SUBC, marginTop: 8, whiteSpace: "nowrap"}}>{sub}</div> : null}
      </div>
      <WCol f={f} cx={w / 2} cy={sub ? 150 : 118} rx={w / 2.6} ry={22} color={color} seed={x % 7} delay={delay + 6} />
    </div>
  );
};

// ================= P1 钩子：首帧完整静态（标题+代码+CPU 全部 0 帧在场） =================

const PageHook: React.FC<{off: number}> = ({off}) => {
  const f = useCurrentFrame() - off;
  return (
    <AbsoluteFill>
      {/* 顶部大标题（0帧完整在场） */}
      <div style={{
        position: "absolute", top: 96, left: 0, right: 0, textAlign: "center",
        fontFamily: "'Microsoft YaHei',sans-serif", fontWeight: 900, fontSize: 112,
        color: INK, letterSpacing: 6, whiteSpace: "nowrap", transform: "rotate(-1deg)",
        textShadow: "8px 8px 0 rgba(201,122,46,0.16)",
      }}>
        <MixText text="CPU 不认识 " /><span style={{color: ORANGE_E}}><MixText text="Python" /></span>？
      </div>
      <div style={{position: "absolute", top: 240, left: "50%", transform: "translateX(-50%)"}}>
        <svg width={980} height={22}>
          <Squiggle f={f} x={4} y={11} w={972} delay={-99} />
        </svg>
      </div>
      {/* 左：代码纸片（0帧完整） */}
      <CodeFile f={f} x={190} y={420} w={520} h={210} lines={["print(\"Hello\")"]} delay={-99} ts={40} />
      <div style={{
        position: "absolute", left: 200, top: 680, width: 500, textAlign: "center",
        fontFamily: B_FONT, fontSize: 32, color: SUBC, opacity: 0.9,
      }}>你写的 Python 源代码</div>
      {/* 右：CPU（0帧完整，45帧后变困惑） */}
      <CpuChip f={f} x={1430} y={530} s={1.05} delay={-99} confused={f > 45} />
      <div style={{
        position: "absolute", left: 1280, top: 730, width: 300, textAlign: "center",
        fontFamily: B_FONT, fontSize: 30, color: SUBC,
      }}>CPU</div>
      {/* 中：红色箭头 + ？？？ */}
      <Arrow f={f} x={760} y={500} len={420} color={RED} sw={7} delay={-99} bend={-26} />
      <div style={{
        position: "absolute", left: 830, top: 360, fontFamily: T_FONT, fontSize: 72, color: RED,
        transform: "rotate(-6deg)", opacity: prog(f, 48, 10), whiteSpace: "nowrap",
      }}>？？？</div>
      {/* 底部问句贴纸 */}
      <Sticker f={f} x={640} y={790} w={560} h={104} title="那谁帮它翻译？" rot={-2} delay={-99} ts={40} color={ORANGE_E} />
    </AbsoluteFill>
  );
};

// ================= P2 中间发生了什么 =================

const PageQuestion: React.FC<{off: number}> = ({off}) => {
  const f = useCurrentFrame() - off;
  return (
    <AbsoluteFill>
      <HandTitle f={f} text="中间发生了什么？" y={64} size={88} delay={0} sub={undefined} />
      <div style={{
        position: "absolute", top: 210, left: 0, right: 0, textAlign: "center",
        fontFamily: B_FONT, fontSize: 32, color: SUBC, letterSpacing: 3, opacity: prog(f, 6, 8),
      }}>Python代码 → ??? → CPU</div>
      <Node f={f} x={210} y={430} w={380} title={<MixText text="Python代码" />} sub='print("Hello")' color={ORANGE_F} delay={6} />
      <Arrow f={f} x={600} y={490} len={220} color={ORANGE_E} sw={7} delay={18} />
      <Node f={f} x={840} y={430} w={300} title="？？？" sub="先别急着交给 CPU" color={YEL_F} delay={28} />
      <Arrow f={f} x={1150} y={490} len={220} color={BLUE_E} sw={7} delay={42} />
      <CpuChip f={f} x={1560} y={530} s={0.72} delay={52} />
      <Bubble f={f} x={840} y={730} w={460} h={110} text="答案：Python解释器" ts={42} delay={64} />
    </AbsoluteFill>
  );
};

// ================= P3 Python 执行流程 =================

const PagePipeline: React.FC<{off: number}> = ({off}) => {
  const f = useCurrentFrame() - off;
  return (
    <AbsoluteFill>
      <HandTitle f={f} text="Python 真正的执行流程" y={64} size={80} delay={0} />
      <Node f={f} x={120} y={330} w={310} title={<MixText text=".py 源代码" />} sub="文本" color={BLUE_F} delay={4} />
      <Arrow f={f} x={440} y={390} len={150} color={BLUE_E} sw={7} delay={16} />
      <Node f={f} x={600} y={330} w={340} title={<MixText text="Python解释器" />} sub="处理源码" color={YEL_F} delay={26} />
      <Arrow f={f} x={950} y={390} len={150} color={ORANGE_E} sw={7} delay={40} />
      <Node f={f} x={1110} y={330} w={280} title={<MixText text="字节码" />} sub="中间指令" color={ORANGE_F} delay={50} />
      <Arrow f={f} x={1400} y={390} len={140} color={ORANGE_E} sw={7} delay={64} />
      <Node f={f} x={1550} y={330} w={260} title={<MixText text="运行时" />} sub="逐条执行" color={BLUE_F} delay={74} />
      {/* 下方补充：执行落到 CPU */}
      <Arrow f={f} x={960} y={560} len={0} color={INK} sw={0} delay={999} />
      <WCol f={f} cx={960} cy={700} rx={430} ry={60} color={ORANGE_F} seed={3} delay={92} />
      <div style={{
        position: "absolute", left: 620, top: 655, width: 680, textAlign: "center",
        fontFamily: T_FONT, fontSize: 64, color: INK, letterSpacing: 8,
        opacity: prog(f, 100, 12), whiteSpace: "nowrap",
      }}><MixText text="不是不编译" /></div>
      <div style={{
        position: "absolute", left: 0, right: 0, top: 790, textAlign: "center",
        fontFamily: B_FONT, fontSize: 38, color: SUBC, opacity: prog(f, 118, 10), whiteSpace: "nowrap",
      }}>而是编译和执行方式不同</div>
    </AbsoluteFill>
  );
};

// ================= P4 字节码视觉化 =================

const PageBytecode: React.FC<{off: number}> = ({off}) => {
  const f = useCurrentFrame() - off;
  return (
    <AbsoluteFill>
      <HandTitle f={f} text="源码会变成什么？" y={64} size={88} delay={0} sub="下面是简化示意" />
      <CodeFile f={f} x={170} y={330} w={520} h={180} lines={["print(\"Hello\")"]} delay={4} ts={36} />
      <Arrow f={f} x={720} y={400} len={250} color={ORANGE_E} sw={7} delay={14} bend={-16} />
      <WBox f={f} x={1030} y={300} w={660} h={360} fill={YEL_F} stroke={ORANGE_E} sw={5.5} seed={6} delay={22} />
      <div style={{
        position: "absolute", left: 1080, top: 330, fontFamily: B_FONT, fontSize: 30, color: SUBC,
        opacity: prog(f, 30, 8),
      }}>简化字节码</div>
      {[
        "LOAD_NAME  print",
        "LOAD_CONST \"Hello\"",
        "CALL       1",
      ].map((line, i) => (
        <div key={i} style={{
          position: "absolute", left: 1090, top: 392 + i * 76,
          fontFamily: MONO, fontSize: 34, fontWeight: 700, color: INK,
          opacity: prog(f, 34 + i * 7, 10),
          transform: `translateX(${(1 - prog(f, 34 + i * 7, 10)) * 30}px)`,
          whiteSpace: "pre",
        }}>{line}</div>
      ))}
      <Sticker f={f} x={430} y={760} w={460} h={110} title=".pyc 可缓存" sub="导入过的模块不重复编译" rot={-2} delay={84} ts={36} color={ORANGE_E} />
    </AbsoluteFill>
  );
};

// ================= P5 C 与 Python 对比 =================

const PageCompare: React.FC<{off: number}> = ({off}) => {
  const f = useCurrentFrame() - off;
  const row = (x: number, y: number, txt: string, d0: number, mark: string, mc: string) => (
    <>
      <div style={{
        position: "absolute", left: x + 40, top: y, fontFamily: B_FONT, fontSize: 38, color: INK,
        opacity: prog(f, d0, 10), transform: `translateY(${(1 - prog(f, d0, 10)) * 14}px)`,
        whiteSpace: "nowrap",
      }}>{txt}</div>
      <div style={{
        position: "absolute", left: x + 480, top: y + 2, fontFamily: B_FONT, fontSize: 34, fontWeight: 700,
        color: mc, opacity: prog(f, d0 + 4, 8), whiteSpace: "nowrap",
      }}>{mark}</div>
    </>
  );
  return (
    <AbsoluteFill>
      <HandTitle f={f} text="两条不同的路" y={64} size={88} delay={0} />
      {/* C 语言：源代码 → 编译器 → 机器码 → CPU */}
      <WCol f={f} cx={520} cy={330} rx={300} ry={44} color="rgba(140,200,150,0.34)" seed={3} delay={6} />
      <div style={{
        position: "absolute", left: 260, top: 288, width: 520, textAlign: "center",
        fontFamily: T_FONT, fontSize: 58, color: GREEN_E, letterSpacing: 10, opacity: prog(f, 8, 10),
      }}><MixText text="C 语言" /></div>
      <WBox f={f} x={210} y={390} w={620} h={200} fill="rgba(255,255,255,0.75)" sw={5.5} seed={2} delay={12} />
      {row(210, 420, "源代码", 20, "↓", GREEN_E)}
      {row(210, 480, "编译器→机器码→CPU", 34, "直接", GREEN_E)}
      {/* Python：源代码 → 解释器 → 字节码 → 运行时 → CPU */}
      <WCol f={f} cx={1400} cy={330} rx={300} ry={44} color={BLUE_F} seed={7} delay={14} />
      <div style={{
        position: "absolute", left: 1140, top: 288, width: 520, textAlign: "center",
        fontFamily: T_FONT, fontSize: 58, color: BLUE_E, letterSpacing: 10, opacity: prog(f, 18, 10),
      }}><MixText text="Python" /></div>
      <WBox f={f} x={1090} y={390} w={620} h={280} fill="rgba(255,255,255,0.75)" sw={5.5} seed={5} delay={22} />
      {row(1090, 420, "源代码", 28, "↓", BLUE_E)}
      {row(1090, 480, "解释器→字节码", 42, "多了这层", BLUE_E)}
      {row(1090, 540, "运行时→CPU", 56, "逐条执行", BLUE_E)}
      <div style={{
        position: "absolute", left: 0, right: 0, top: 760, textAlign: "center",
        fontFamily: B_FONT, fontSize: 40, color: INK, opacity: prog(f, 84, 12), whiteSpace: "nowrap",
      }}>C 更直接得到机器码　|　Python 多了一层运行时</div>
    </AbsoluteFill>
  );
};

// ================= P6 结论 =================

const PageConclusion: React.FC<{off: number}> = ({off}) => {
  const f = useCurrentFrame() - off;
  // 数据小球沿主线通过
  const t = interpolate(f, [40, 80], [0, 1], clamp);
  const x = 250 + 1420 * t;
  return (
    <AbsoluteFill>
      <HandTitle f={f} text="CPU 到底执行了什么？" y={64} size={84} delay={0} />
      <div style={{position: "absolute", top: 340, left: 0, right: 0, display: "flex", justifyContent: "center", gap: 26, alignItems: "center"}}>
        {[
          {t: "源代码", d: 2},
          {t: "解释器", d: 16},
          {t: "字节码", d: 30},
          {t: "运行时", d: 44},
        ].map(({t: tt, d}) => (
          <React.Fragment key={tt}>
            <div style={{position: "relative", textAlign: "center", opacity: prog(f, d, 12), transform: `scale(${0.9 + 0.1 * prog(f, d, 12)})`}}>
              <div style={{
                fontFamily: B_FONT, fontWeight: 700, fontSize: 44, color: INK,
                backgroundColor: "rgba(255,255,255,0.9)", border: `5px solid ${INK}`, borderRadius: 10,
                padding: "20px 30px", whiteSpace: "nowrap",
              }}>{tt}</div>
            </div>
            <span style={{fontFamily: "'Microsoft YaHei',sans-serif", fontWeight: 900, fontSize: 46, color: ORANGE_E, opacity: prog(f, d + 10, 10)}}>→</span>
          </React.Fragment>
        ))}
        <div style={{position: "relative", textAlign: "center", opacity: prog(f, 58, 12)}}>
          <div style={{
            fontFamily: "'Microsoft YaHei',sans-serif", fontWeight: 900, fontSize: 44, color: RED,
            backgroundColor: "rgba(201,79,79,0.22)", border: `5px solid ${INK}`, borderRadius: 10,
            padding: "20px 34px", whiteSpace: "nowrap",
          }}>CPU</div>
        </div>
      </div>
      {/* 数据小球 */}
      {t > 0.02 && t < 1 ? (
        <div style={{
          position: "absolute", left: x, top: 445, width: 30, height: 30, borderRadius: "50%",
          background: ORANGE_E, border: `4px solid ${INK}`, opacity: 0.95,
        }} />
      ) : null}
      <div style={{
        position: "absolute", left: 0, right: 0, top: 620, textAlign: "center",
        fontFamily: T_FONT, fontSize: 92, color: RED, letterSpacing: 6,
        opacity: prog(f, 66, 12), whiteSpace: "nowrap",
      }}><MixText text="CPU 不认识 Python" /></div>
      <div style={{
        position: "absolute", left: 0, right: 0, top: 780, textAlign: "center",
        fontFamily: B_FONT, fontSize: 44, color: INK, letterSpacing: 3,
        opacity: prog(f, 84, 12), whiteSpace: "nowrap",
      }}>运行环境负责转换和执行</div>
    </AbsoluteFill>
  );
};

// ================= P7 结尾：四连 CTA + 问观众（无下期预告） =================

const PageOutro: React.FC<{off: number}> = ({off}) => {
  const f = useCurrentFrame() - off;
  const badges = [
    {icon: "👍", label: "点赞", color: RED, d: 8},
    {icon: "➕", label: "关注", color: ORANGE_E, d: 22},
    {icon: "🔁", label: "转发", color: BLUE_E, d: 36},
    {icon: "⭐", label: "收藏", color: GREEN_E, d: 50},
  ];
  return (
    <AbsoluteFill>
      {/* 顶部引导句 */}
      <div style={{
        position: "absolute", top: 150, left: 0, right: 0, textAlign: "center",
        fontFamily: T_FONT, fontSize: 72, color: INK, letterSpacing: 8,
        opacity: prog(f, 0, 12), whiteSpace: "nowrap",
      }}>觉得有用的话，支持一下～</div>
      <div style={{position: "absolute", top: 260, left: "50%", transform: "translateX(-50%)"}}>
        <svg width={760} height={22}>
          <Squiggle f={f} x={4} y={11} w={752} delay={8} />
        </svg>
      </div>
      {/* 四连徽章：点赞 关注 转发 收藏 */}
      <div style={{position: "absolute", top: 350, left: 0, right: 0, display: "flex", justifyContent: "center", gap: 44}}>
        {badges.map(({icon, label, color, d}) => {
          const p = prog(f, d, 14);
          if (p <= 0) return null;
          const bounce = 1 + 0.18 * Math.sin(Math.min(p, 1) * Math.PI);
          return (
            <div key={label} style={{
              opacity: Math.min(1, p * 1.6),
              transform: `translateY(${(1 - p) * 26}px) scale(${(0.7 + 0.3 * p) * bounce}) rotate(${(1 - p) * -5}deg)`,
            }}>
              <div style={{
                width: 200, height: 190, backgroundColor: "rgba(255,255,255,0.92)",
                border: `5px dashed ${color}`, borderRadius: 24,
                display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                boxShadow: "0 10px 26px rgba(58,58,58,0.12)",
                transform: `translateY(${Math.sin((f + d) / 15) * 4}px)`,
              }}>
                <div style={{fontSize: 62, lineHeight: 1.15}}>{icon}</div>
                <div style={{fontFamily: B_FONT, fontWeight: 700, fontSize: 40, color: INK, marginTop: 8}}>{label}</div>
              </div>
            </div>
          );
        })}
      </div>
      {/* 问观众：还想听什么 */}
      <Bubble f={f} x={610} y={640} w={700} h={120} text="还想听什么？评论区告诉我" ts={46} delay={78} />
      <Bulb f={f} x={420} y={700} s={1.25} delay={88} />
      <Bulb f={f} x={1500} y={700} s={1.25} delay={94} />
      {/* 底部落款 */}
      <div style={{
        position: "absolute", top: 840, left: 0, right: 0, textAlign: "center",
        fontFamily: B_FONT, fontSize: 32, color: INK, letterSpacing: 4,
        opacity: 0.75 * prog(f, 100, 10),
      }}>全栈小秋 · 0 基础也能学会</div>
    </AbsoluteFill>
  );
};

// ================= 组装（10 帧叠化转场） =================

const PAGES = [
  {C: PageHook, start: 0, end: 135},        // s01：钩子（首帧完整静态）
  {C: PageQuestion, start: 135, end: 272},  // s02：中间发生了什么
  {C: PagePipeline, start: 272, end: 566},  // s03+s04：执行流程+不是不编译
  {C: PageBytecode, start: 566, end: 692},  // s05：字节码
  {C: PageCompare, start: 692, end: 855},   // s06：C vs Python
  {C: PageConclusion, start: 855, end: 1003}, // s07：结论
  {C: PageOutro, start: 1003, end: DUR},    // s08：四连CTA+问观众
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

const voiceLines = [
  {index: 1, audio: "s01.mp3", start: 0, end: 135},
  {index: 2, audio: "s02.mp3", start: 140, end: 268},
  {index: 3, audio: "s03.mp3", start: 272, end: 414},
  {index: 4, audio: "s04.mp3", start: 418, end: 562},
  {index: 5, audio: "s05.mp3", start: 566, end: 687},
  {index: 6, audio: "s06.mp3", start: 692, end: 851},
  {index: 7, audio: "s07.mp3", start: 855, end: 999},
  {index: 8, audio: "s08.mp3", start: 1003, end: 1160},
];

export const PythonRuntimeExplainer: React.FC = () => {
  const frame = useCurrentFrame();
  const bedVolume = interpolate(frame, [0, 20, DUR - 40, DUR - 6], [0, 0.06, 0.06, 0], clamp);
  return (
    <AbsoluteFill style={{backgroundColor: PAPER, overflow: "hidden"}}>
      <CoffeeStains />
      {PAGES.map(({C, start, end}, i) => {
        const first = i === 0;
        const last = i === PAGES.length - 1;
        const len = end - start;
        const from = first ? 0 : start - 10;
        const dur = len + 12;
        const off = first ? 0 : 10;
        return (
          <Sequence key={i} from={from} durationInFrames={dur}>
            <PageTurn off={off} len={len} first={first} last={last}>
              <C off={off} />
            </PageTurn>
          </Sequence>
        );
      })}
      <SpiralBinding />
      <CornerMark />
      {voiceLines.map((s) => (
        <Sequence key={`vo-${s.index}`} from={s.start} durationInFrames={s.end - s.start + 30}>
          <Audio src={staticFile(`audio/python-runtime-tts-v3/${s.audio}`)} volume={1} />
        </Sequence>
      ))}
      {[135, 272, 566, 692, 855, 1003].map((t) => (
        <Sequence key={`pt-${t}`} from={t - 6} durationInFrames={24}>
          <Audio src={staticFile("audio/sfx/page3.wav")} volume={0.35} />
        </Sequence>
      ))}
      {/* 音效：踩在画面动作点上（音量保守，避让人声） */}
      <Sequence from={18} durationInFrames={24}>
        <Audio src={staticFile("audio/sfx/whoosh.wav")} volume={0.22} />
      </Sequence>
      <Sequence from={55} durationInFrames={20}>
        <Audio src={staticFile("audio/sfx/pop.wav")} volume={0.26} />
      </Sequence>
      <Sequence from={189} durationInFrames={20}>
        <Audio src={staticFile("audio/sfx/pop.wav")} volume={0.26} />
      </Sequence>
      <Sequence from={362} durationInFrames={40}>
        <Audio src={staticFile("audio/sfx/warm3.wav")} volume={0.2} />
      </Sequence>
      <Sequence from={570} durationInFrames={24}>
        <Audio src={staticFile("audio/sfx/fly3.wav")} volume={0.16} />
      </Sequence>
      <Sequence from={925} durationInFrames={40}>
        <Audio src={staticFile("audio/sfx/success.wav")} volume={0.24} />
      </Sequence>
      {[1001, 1015, 1029, 1043].map((t) => (
        <Sequence key={`cta-${t}`} from={t} durationInFrames={20}>
          <Audio src={staticFile("audio/sfx/pop.wav")} volume={0.26} />
        </Sequence>
      ))}
      <Sequence from={1071} durationInFrames={40}>
        <Audio src={staticFile("audio/sfx/warm3.wav")} volume={0.2} />
      </Sequence>
      <Audio src={staticFile("audio/bed.wav")} loop volume={() => bedVolume} />
      <Subtitle />
    </AbsoluteFill>
  );
};
