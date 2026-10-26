import {Audio} from "@remotion/media";
import {
  AbsoluteFill, interpolate, Sequence, staticFile, useCurrentFrame,
} from "remotion";

// ================= 白板手绘风 · 虚拟内存（贴近"计算机大白"手绘体系 + 小秋 IP） =================
// 视觉基因：纸白底 / 手写体（华文行楷标题 + 楷体正文）/ 手绘抖动线 / 水彩填色 / 火柴人讲解员
// 动画：元素随配音逐个描画（比原版整页静态更有活力）/ 页间 10 帧叠化 / 0:00 封面静态完整

const PAPER = "#fdfcf7";
const INK = "#3a3a3a";
const SUBC = "#8a8579";
const RED = "#c94f4f";
const BLUE_F = "rgba(139,178,216,0.34)";
const BLUE_E = "#5b87ad";
const PINK_E = "#c96a7c";
const GREEN_F = "rgba(140,200,150,0.34)";
const GREEN_E = "#4e9464";
const YEL_F = "rgba(242,202,92,0.45)";
const ORANGE_F = "rgba(242,163,94,0.36)";
const ORANGE_E = "#c97a2e";

const T_FONT = "'STXingkai','华文行楷','KaiTi','楷体',serif";
const B_FONT = "'STKaiti','KaiTi','楷体','Microsoft YaHei',serif";

const DUR = 1780;
const W = 1920;
const H = 1080;

const voiceLines = [
  {index: 1, audio: "s01.mp3", start: 0, end: 200},
  {index: 2, audio: "s02.mp3", start: 206, end: 327},
  {index: 3, audio: "s03.mp3", start: 332, end: 492},
  {index: 4, audio: "s04.mp3", start: 498, end: 643},
  {index: 5, audio: "s05.mp3", start: 648, end: 867},
  {index: 6, audio: "s06.mp3", start: 873, end: 951},
  {index: 7, audio: "s07.mp3", start: 956, end: 1141},
  {index: 8, audio: "s08.mp3", start: 1146, end: 1355},
  {index: 9, audio: "s09.mp3", start: 1360, end: 1592},
  {index: 10, audio: "s10.mp3", start: 1597, end: 1752},
];

type Sub = {s: number; e: number; t: string};
const subs: Sub[] = [
  {s: 0, e: 64, t: "电脑只有16G内存"},
  {s: 64, e: 135, t: "凭什么能同时开着微信"},
  {s: 135, e: 199, t: "浏览器和一大堆软件"},
  {s: 206, e: 297, t: "秘密就是今天的面试高频题"},
  {s: 297, e: 327, t: "虚拟内存"},
  {s: 332, e: 360, t: "虚拟内存"},
  {s: 360, e: 430, t: "是操作系统给每个程序"},
  {s: 430, e: 492, t: "造出来的一套假地址"},
  {s: 498, e: 567, t: "让每个程序都以为自己"},
  {s: 567, e: 643, t: "独占了一大片连续的内存"},
  {s: 648, e: 714, t: "程序里用的叫虚拟地址"},
  {s: 714, e: 767, t: "操作系统通过页表"},
  {s: 767, e: 800, t: "把它翻译成"},
  {s: 800, e: 866, t: "物理内存里的真实位置"},
  {s: 873, e: 951, t: "那物理内存不够用了怎么办"},
  {s: 956, e: 1041, t: "操作系统会把不常用的数据"},
  {s: 1041, e: 1091, t: "暂时搬到硬盘上"},
  {s: 1091, e: 1141, t: "这个动作叫换页"},
  {s: 1146, e: 1200, t: "等再用到的时候"},
  {s: 1200, e: 1231, t: "再搬回来"},
  {s: 1231, e: 1285, t: "所以在系统眼里"},
  {s: 1285, e: 1355, t: "硬盘就是内存的备胎"},
  {s: 1360, e: 1400, t: "记住三个词"},
  {s: 1400, e: 1424, t: "假地址"},
  {s: 1424, e: 1456, t: "页表翻译"},
  {s: 1456, e: 1488, t: "硬盘换页"},
  {s: 1488, e: 1544, t: "面试答出这三个"},
  {s: 1544, e: 1592, t: "这道题就稳了"},
  {s: 1597, e: 1630, t: "学会了吗"},
  {s: 1630, e: 1687, t: "点个赞点个关注"},
  {s: 1687, e: 1752, t: "下期讲进程和线程"},
];

const clamp = {extrapolateLeft: "clamp", extrapolateRight: "clamp"} as const;

// ---------- 手绘原语（f = 页面内容帧，全部纯函数） ----------

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

// 描画路径：pathLength=1 + dashoffset 从 0 偏移滑入
const Draw: React.FC<{
  f: number; d: string; stroke?: string; sw?: number; delay?: number; dur?: number;
  fill?: string; fillOp?: number; op?: number; dashed?: boolean;
}> = ({f, d, stroke = INK, sw = 5, delay = 0, dur = 16, fill = "none", fillOp = 1, op = 1, dashed}) => {
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
        strokeDasharray={dashed ? "12 9" : p < 1 ? "1 1" : undefined}
        strokeDashoffset={dashed ? undefined : p < 1 ? 1 - p : 0}
        pathLength={dashed || p >= 1 ? undefined : 1}
        opacity={op}
      />
    </svg>
  );
};

// 手绘方框（描边描画 + 填充后到）
const WBox: React.FC<{
  f: number; x: number; y: number; w: number; h: number; fill?: string; stroke?: string;
  sw?: number; seed?: number; delay?: number; dur?: number; fillOp?: number;
}> = ({f, x, y, w, h, fill = "none", stroke = INK, sw = 5, seed = 0, delay = 0, dur = 16, fillOp = 1}) => (
  <Draw f={f} d={sketchRectPath(x, y, w, h, seed)} stroke={stroke} sw={sw} delay={delay} dur={dur} fill={fill} fillOp={fillOp} />
);

// 水彩色块（不规则边缘，缩放淡入）
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

// 手绘箭头（描画 + 箭头头）
const Arrow: React.FC<{
  f: number; x: number; y: number; len: number; color?: string; delay?: number;
  bend?: number; rot?: number; sw?: number;
}> = ({f, x, y, len, color = INK, delay = 0, bend = 0, rot = 0, sw = 6}) => {
  const p = prog(f, delay, 18);
  if (p <= 0) return null;
  const draw = len * p;
  return (
    <svg
      width={len + 60}
      height={140}
      style={{
        position: "absolute", left: x, top: y, overflow: "visible",
        transform: `rotate(${rot}deg)`, transformOrigin: "0 70",
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

// 红色波浪强调线
const Squiggle: React.FC<{f: number; x: number; y: number; w: number; color?: string; delay?: number; sw?: number}> = ({
  f, x, y, w, color = RED, delay = 0, sw = 6,
}) => {
  const n = Math.max(2, Math.round(w / 30));
  const seg = w / n;
  let d = `M ${x} ${y}`;
  for (let i = 0; i < n; i++) d += ` q ${seg / 2} ${i % 2 === 0 ? -11 : 11} ${seg} 0`;
  return <Draw f={f} d={d} stroke={color} sw={sw} delay={delay} dur={12} op={0.85} />;
};

// 对话气泡（水彩白底 + 椭圆 + 小尾巴）
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

// 粉色虚线贴纸
const Sticker: React.FC<{
  f: number; x: number; y: number; w: number; h: number; title: string; sub?: string;
  color?: string; delay?: number; rot?: number; ts?: number;
}> = ({f, x, y, w, h, title, sub, color = PINK_E, delay = 0, rot = 0, ts = 34}) => {
  const p = prog(f, delay, 12);
  if (p <= 0) return null;
  return (
    <div style={{
      position: "absolute", left: x, top: y, width: w, height: h,
      opacity: p, transform: `rotate(${rot}deg) scale(${0.9 + 0.1 * p})`,
      backgroundColor: "rgba(255,255,255,0.9)", border: `4px dashed ${color}`, borderRadius: 20,
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      boxShadow: "0 8px 22px rgba(58,58,58,0.10)",
    }}>
      <div style={{fontFamily: B_FONT, fontWeight: 700, fontSize: ts, color: INK, whiteSpace: "nowrap"}}>{title}</div>
      {sub ? <div style={{fontFamily: B_FONT, fontSize: ts * 0.72, color: SUBC, marginTop: 6, whiteSpace: "nowrap"}}>{sub}</div> : null}
    </div>
  );
};

// 火柴人讲解员
const Stick: React.FC<{
  f: number; x: number; y: number; s?: number; pose?: "point" | "cheer"; delay?: number;
}> = ({f, x, y, s = 1.3, pose = "point", delay = 0}) => {
  const parts: [string, number][] = [
    ["M -26 -78 a 26 26 0 1 1 52 0 a 26 26 0 1 1 -52 0", 0],
    ["M 0 -52 L 0 44", 5],
    pose === "point" ? ["M 0 -26 L 58 -62", 10] : ["M 0 -26 L 46 -76", 10],
    pose === "point" ? ["M 0 -20 L -36 16", 14] : ["M 0 -26 L -46 -76", 14],
    ["M 0 44 L -30 112", 18],
    ["M 0 44 L 30 112", 22],
  ];
  return (
    <svg width={W} height={H} style={{position: "absolute", left: 0, top: 0, overflow: "visible", pointerEvents: "none"}}>
      <g transform={`translate(${x},${y}) scale(${s})`}>
        {parts.map(([d, dl], i) => {
          const p = prog(f, delay + dl, 8);
          if (p <= 0) return null;
          return (
            <path key={i} d={d} pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - p}
              stroke={INK} strokeWidth={7} fill="none" strokeLinecap="round" />
          );
        })}
        <g opacity={prog(f, delay + 26, 6)}>
          <circle cx={-9} cy={-82} r={3.4} fill={INK} />
          <circle cx={9} cy={-82} r={3.4} fill={INK} />
          <path d="M -11 -70 Q 0 -61 11 -70" stroke={INK} strokeWidth={4.5} fill="none" strokeLinecap="round" />
        </g>
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

// 硬盘（圆柱手绘）
const Disk: React.FC<{f: number; x: number; y: number; w?: number; h?: number; delay?: number}> = ({
  f, x, y, w = 300, h = 150, delay = 0,
}) => {
  const ry = h * 0.22;
  return (
    <>
      <Draw f={f} delay={delay} dur={20}
        d={`M ${x} ${y} L ${x} ${y + h} Q ${x + w * 0.5} ${y + h + ry * 1.6} ${x + w} ${y + h} L ${x + w} ${y}`}
        stroke={INK} sw={5} />
      <Draw f={f} delay={delay + 8} dur={12}
        d={`M ${x} ${y} Q ${x + w * 0.5} ${y + ry * 1.9} ${x + w} ${y} Q ${x + w * 0.5} ${y - ry * 1.7} ${x} ${y} Z`}
        stroke={INK} sw={5} fill="rgba(210,225,238,0.5)" />
      <Draw f={f} delay={delay + 14} dur={10}
        d={`M ${x + 24} ${y + 34} L ${x + w - 40} ${y + 34} M ${x + 24} ${y + 52} L ${x + w - 70} ${y + 52}`}
        stroke="#9aa5ad" sw={3} />
      <Draw f={f} delay={delay + 18} dur={8}
        d={`M ${x + w - 58} ${y + h - 34} l 14 -14 m 2 14 l 14 -14`}
        stroke={GREEN_E} sw={4} />
    </>
  );
};

// 内存条（含页格子）
const MemBar: React.FC<{f: number; x: number; y: number; cw?: number; ch?: number; delay?: number; filled: number[]}> = ({
  f, x, y, cw = 128, ch = 128, delay = 0, filled,
}) => {
  const els: React.ReactNode[] = [];
  filled.forEach((idx, i) => {
    const col = idx % 4;
    const row = Math.floor(idx / 4);
    const cx = x + 14 + col * (cw + 12);
    const cy = y + 14 + row * (ch + 12);
    els.push(
      <Draw key={`c${i}`} f={f} delay={delay + 10 + i * 4} dur={8}
        d={sketchRectPath(cx, cy, cw, ch, idx * 3 + 1)} stroke={INK} sw={4.5}
        fill={i % 2 === 0 ? BLUE_F : GREEN_F} fillOp={0.75} />
    );
  });
  return <>{els}</>;
};

// 居中手写标题 + 两侧小笔触 + 红波浪
const HandTitle: React.FC<{f: number; text: string; y?: number; size?: number; delay?: number; sub?: string}> = ({
  f, text, y = 58, size = 96, delay = 0, sub,
}) => {
  const p = prog(f, delay, 10);
  if (p <= 0) return null;
  const tw = text.length * size * 1.02;
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
        }}>{text}</div>
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

// 高亮词（水彩不规则底）
const Hl: React.FC<{text: string; color?: string; fg?: string}> = ({text, color = BLUE_F, fg = INK}) => (
  <span style={{position: "relative", display: "inline-block", padding: "0 8px"}}>
    <span style={{
      position: "absolute", inset: "-8px -14px", background: color,
      borderRadius: "58% 42% 55% 45% / 55% 48% 52% 45%",
    }} />
    <span style={{position: "relative", color: fg}}>{text}</span>
  </span>
);

// 黄色描边字幕（贴近原版）
const Subtitle: React.FC = () => {
  const frame = useCurrentFrame();
  const cur = subs.find((s) => frame >= s.s && frame < s.e);
  if (!cur) return null;
  const o = interpolate(frame, [cur.s, cur.s + 5], [0.4, 1], clamp);
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
      }}>{cur.t}</div>
    </div>
  );
};

const CornerMark: React.FC = () => (
  <div style={{
    position: "absolute", top: 52, right: 76, zIndex: 40,
    fontFamily: B_FONT, fontSize: 30, color: INK, letterSpacing: 6, fontWeight: 700,
    transform: "rotate(2deg)", opacity: 0.85,
    borderBottom: `3px solid ${RED}`,
  }}>小秋</div>
);

// ================= P1 钩子（0:00 完整静态封面） =================

const PageHook: React.FC<{off: number}> = ({off}) => {
  const f = useCurrentFrame() - off;
  return (
    <AbsoluteFill>
      <WCol f={f} cx={700} cy={230} rx={330} ry={105} color={BLUE_F} seed={3} delay={-99} />
      <WCol f={f} cx={1150} cy={430} rx={300} ry={78} color={YEL_F} seed={8} delay={-99} />
      <div style={{
        position: "absolute", top: 140, left: 0, right: 0, textAlign: "center",
        fontFamily: T_FONT, fontSize: 150, color: INK, letterSpacing: 8, whiteSpace: "nowrap",
        transform: "rotate(-1deg)",
      }}>16G 内存</div>
      <div style={{
        position: "absolute", top: 372, left: 0, right: 0, textAlign: "center",
        fontFamily: T_FONT, fontSize: 80, color: INK, letterSpacing: 6, whiteSpace: "nowrap",
      }}>
        <span style={{position: "relative", display: "inline-block"}}>
          凭什么开几十个软件
          <span style={{position: "absolute", left: "50%", transform: "translateX(-50%)", bottom: -16}}>
            <svg width={760} height={22}>
              <Squiggle f={f} x={4} y={11} w={752} delay={-99} />
            </svg>
          </span>
        </span>
        ？
      </div>
      <Stick f={f} x={430} y={560} s={1.5} pose="point" delay={-99} />
      <Bubble f={f} x={585} y={565} w={400} h={120} text="秘密：虚拟内存" ts={40} delay={-99} tail="bl" />
      <Sticker f={f} x={1290} y={470} w={430} h={190} title="面试高频 · 内存管理" sub="背会就能拿分" rot={3} delay={-99} ts={38} />
      <div style={{
        position: "absolute", top: 920, left: 0, right: 0, textAlign: "center",
        fontFamily: B_FONT, fontSize: 30, color: INK, letterSpacing: 4, opacity: 0.72,
      }}>小秋 · 0 基础也能学会</div>
    </AbsoluteFill>
  );
};

// ================= P2 核心定义 =================

const PageDef: React.FC<{off: number}> = ({off}) => {
  const f = useCurrentFrame() - off;
  const line = (t: React.ReactNode, y: number, delay: number) => (
    <div style={{
      position: "absolute", top: y, left: 0, right: 0, textAlign: "center",
      fontFamily: B_FONT, fontSize: 52, color: INK, letterSpacing: 3, whiteSpace: "nowrap",
      opacity: prog(f, delay, 12), transform: `translateY(${(1 - prog(f, delay, 12)) * 16}px)`,
    }}>{t}</div>
  );
  return (
    <AbsoluteFill>
      <HandTitle f={f} text="核心定义" y={62} delay={2} />
      <Bulb f={f} x={1490} y={210} s={1.5} delay={95} />
      {line("虚拟内存，是操作系统给每个程序", 236, 14)}
      {line(<span>造出来的一套 <Hl text="假地址" /> ，</span>, 336, 46)}
      {line("让程序以为自己独占了一大块内存。", 436, 78)}
      <Stick f={f} x={330} y={700} s={1.4} pose="cheer" delay={110} />
      <Bubble f={f} x={475} y={735} w={430} h={112} text="听起来很玄？往下看" ts={34} delay={124} tail="bl" />
      <Sticker f={f} x={1240} y={640} w={400} h={130} title="一句话：假的地址" sub="目的是骗过程序" rot={-3} delay={150} ts={34} />
    </AbsoluteFill>
  );
};

// ================= P3 页表映射 =================

const PageMap: React.FC<{off: number}> = ({off}) => {
  const f = useCurrentFrame() - off;
  const col = (x: number, label: string, rows: string[], chipColor: string, boxColor: string, d0: number) => (
    <>
      <WCol f={f} cx={x + 150} cy={168} rx={140} ry={40} color={chipColor} seed={x} delay={d0} />
      <div style={{
        position: "absolute", left: x, top: 142, width: 300, textAlign: "center",
        fontFamily: B_FONT, fontSize: 36, fontWeight: 700, color: INK, letterSpacing: 4,
        opacity: prog(f, d0 + 4, 8),
      }}>{label}</div>
      <WBox f={f} x={x} y={228} w={300} h={430} fill={boxColor} fillOp={0.5} sw={5} seed={x % 5} delay={d0 + 8} dur={18} />
      {rows.map((r, i) => (
        <div key={i} style={{
          position: "absolute", left: x, top: 240 + i * 84, width: 300, textAlign: "center",
          fontFamily: B_FONT, fontSize: 34, color: INK, letterSpacing: 4,
          opacity: prog(f, d0 + 14 + i * 5, 8),
        }}>{r}</div>
      ))}
      {[1, 2, 3, 4].map((i) => (
        <Draw key={i} f={f} d={`M ${x + 10} ${240 + i * 84} L ${x + 290} ${240 + i * 84}`} stroke={INK} sw={3.5}
          delay={d0 + 16 + i * 4} dur={6} op={0.55} />
      ))}
    </>
  );
  return (
    <AbsoluteFill>
      <HandTitle f={f} text="怎么映射的？" y={54} size={88} delay={0} />
      {col(330, "虚拟地址", ["页 0", "页 1", "页 2", "⋯", "页 N-1"], BLUE_F, "rgba(180,208,232,0.35)", 8)}
      {col(1290, "物理地址", ["帧 0", "帧 1", "帧 2", "⋯", "帧 M-1"], GREEN_F, "rgba(176,214,182,0.4)", 14)}
      <div style={{
        position: "absolute", left: 60, top: 400, width: 250, textAlign: "center",
        fontFamily: B_FONT, fontSize: 30, color: SUBC, lineHeight: 1.6, opacity: prog(f, 26, 10),
      }}>连续、庞大<br />的假空间</div>
      <Arrow f={f} x={300} y={330} len={150} delay={30} bend={-8} rot={-38} sw={5} />
      <WCol f={f} cx={975} cy={460} rx={150} ry={88} color={ORANGE_F} seed={5} delay={34} />
      <WBox f={f} x={880} y={408} w={195} h={104} sw={5} seed={4} delay={36} dur={12} />
      <div style={{
        position: "absolute", left: 855, top: 432, width: 245, textAlign: "center",
        fontFamily: B_FONT, fontSize: 42, fontWeight: 700, color: INK, letterSpacing: 4,
        opacity: prog(f, 44, 8),
      }}>OS 页表</div>
      <div style={{
        position: "absolute", left: 855, top: 540, width: 245, textAlign: "center",
        fontFamily: B_FONT, fontSize: 27, color: SUBC, opacity: prog(f, 52, 8),
      }}>翻译官</div>
      <Arrow f={f} x={655} y={290} len={215} delay={48} bend={26} rot={22} />
      <Arrow f={f} x={1095} y={330} len={185} delay={62} bend={-22} rot={-24} />
      <Arrow f={f} x={655} y={455} len={215} delay={74} bend={-14} rot={-14} />
      <Arrow f={f} x={1095} y={300} len={185} delay={88} bend={18} rot={16} />
      <Draw f={f} delay={100} dur={14} dashed
        d={`M 1010 545 Q 1180 700 1420 745`} stroke={INK} sw={5} />
      <Disk f={f} x={1450} y={700} w={310} h={150} delay={104} />
      <div style={{
        position: "absolute", left: 1440, top: 880, width: 340, textAlign: "center",
        fontFamily: B_FONT, fontSize: 32, color: INK, opacity: prog(f, 116, 10), letterSpacing: 3,
      }}>硬盘（慢，但大）</div>
    </AbsoluteFill>
  );
};

// ================= P4 换页（本片动效担当） =================

const PageSwap: React.FC<{off: number}> = ({off}) => {
  const f = useCurrentFrame() - off;
  // 飞行方块：内存格 -> 硬盘
  const flyT = interpolate(f, [100, 152], [0, 1], clamp);
  const backT = interpolate(f, [306, 352], [0, 1], clamp);
  const flyPos = flyT > 0 && flyT < 1 ? {
    x: 390 + (1370 - 390) * flyT,
    y: 520 + (700 - 520) * flyT - Math.sin(Math.PI * flyT) * 150,
  } : null;
  const backPos = backT > 0 && backT < 1 ? {
    x: 1370 + (390 - 1370) * backT,
    y: 700 + (520 - 700) * backT - Math.sin(Math.PI * backT) * 150,
  } : null;
  return (
    <AbsoluteFill>
      <HandTitle f={f} text="内存满了怎么办？" y={54} size={92} delay={0} />
      <Stick f={f} x={225} y={300} s={1.15} pose="point" delay={8} />
      <Bubble f={f} x={330} y={150} w={470} h={110} text="物理内存不够用了？" ts={36} delay={14} tail="bl" />
      {/* 物理内存条 */}
      <WBox f={f} x={170} y={420} w={560} h={290} fill="rgba(255,255,255,0.85)" sw={6} seed={9} delay={16} dur={18} />
      <div style={{
        position: "absolute", left: 170, top: 372, width: 560, textAlign: "center",
        fontFamily: B_FONT, fontSize: 34, fontWeight: 700, color: INK, letterSpacing: 4,
        opacity: prog(f, 20, 8),
      }}>物理内存（有限）</div>
      <MemBar f={f} x={172} y={434} cw={125} ch={125} delay={24} filled={[0, 1, 2, 4, 5, 6]} />
      <div style={{
        position: "absolute", left: 172 + 3 * 137 + 6, top: 434 + 137 + 30, width: 125, textAlign: "center",
        fontFamily: B_FONT, fontSize: 30, color: RED, opacity: prog(f, 60, 10), fontWeight: 700,
      }}>快满了</div>
      <Squiggle f={f} x={600} y={410} w={110} color={RED} delay={64} />
      {/* 硬盘 */}
      <Disk f={f} x={1360} y={640} w={330} h={170} delay={30} />
      <div style={{
        position: "absolute", left: 1360, top: 850, width: 330, textAlign: "center",
        fontFamily: B_FONT, fontSize: 32, color: INK, opacity: prog(f, 44, 10), letterSpacing: 3,
      }}>硬盘（大，但慢）</div>
      {/* 搬出去 */}
      <Arrow f={f} x={760} y={470} len={560} delay={96} bend={-120} rot={14} sw={7} />
      {flyPos ? (
        <div style={{
          position: "absolute", left: flyPos.x - 60, top: flyPos.y - 55, width: 120, height: 110,
          transform: `rotate(${flyT * 14}deg)`,
          backgroundColor: "rgba(180,208,232,0.55)", border: `5px solid ${INK}`, borderRadius: 14,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontFamily: B_FONT, fontSize: 26, color: INK, whiteSpace: "nowrap",
        }}>不常用的页</div>
      ) : null}
      <Sticker f={f} x={880} y={210} w={280} h={120} title="换页" rot={-4} delay={168} ts={44} color={ORANGE_E} />
      {/* 搬回来 */}
      <Arrow f={f} x={760} y={560} len={560} delay={296} bend={120} rot={-14} color={GREEN_E} sw={7} />
      {backPos ? (
        <div style={{
          position: "absolute", left: backPos.x - 60, top: backPos.y - 55, width: 120, height: 110,
          transform: `rotate(${-backT * 14}deg)`,
          backgroundColor: "rgba(176,214,182,0.55)", border: `5px solid ${INK}`, borderRadius: 14,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontFamily: B_FONT, fontSize: 26, color: INK, whiteSpace: "nowrap",
        }}>要用啦</div>
      ) : null}
      <div style={{
        position: "absolute", left: 1010, top: 766, fontFamily: B_FONT, fontSize: 30, color: SUBC,
        opacity: prog(f, 360, 10), whiteSpace: "nowrap",
      }}>再用到 再搬回来</div>
      {/* 结论云 */}
      <WCol f={f} cx={560} cy={870} rx={330} ry={80} color={YEL_F} seed={6} delay={385} />
      <div style={{
        position: "absolute", left: 280, top: 828, width: 560, textAlign: "center",
        fontFamily: B_FONT, fontSize: 42, fontWeight: 700, color: INK, letterSpacing: 3,
        opacity: prog(f, 392, 10), whiteSpace: "nowrap",
      }}>硬盘就是内存的备胎</div>
    </AbsoluteFill>
  );
};

// ================= P5 总结 + CTA =================

const PageRecap: React.FC<{off: number}> = ({off}) => {
  const f = useCurrentFrame() - off;
  const card = (x: number, color: string, edge: string, t: string, s: string, delay: number, seed: number) => (
    <>
      <WCol f={f} cx={x + 210} cy={415} rx={225} ry={122} color={color} seed={seed} delay={delay} />
      <WBox f={f} x={x} y={300} w={420} h={230} sw={5} seed={seed + 2} delay={delay + 2} dur={14} />
      <div style={{
        position: "absolute", left: x, top: 348, width: 420, textAlign: "center",
        fontFamily: T_FONT, fontSize: 62, color: INK, letterSpacing: 8, opacity: prog(f, delay + 6, 10),
      }}>{t}</div>
      <div style={{
        position: "absolute", left: x, top: 448, width: 420, textAlign: "center",
        fontFamily: B_FONT, fontSize: 28, color: SUBC, opacity: prog(f, delay + 10, 10),
      }}>{s}</div>
    </>
  );
  return (
    <AbsoluteFill>
      <HandTitle f={f} text="记住三个词" y={96} delay={0} />
      {card(250, BLUE_F, BLUE_E, "假地址", "程序以为的地址", 42, 2)}
      {card(760, ORANGE_F, ORANGE_E, "页表翻译", "虚拟地址 → 物理地址", 70, 5)}
      {card(1270, GREEN_F, GREEN_E, "硬盘换页", "内存不够 硬盘顶上", 98, 8)}
      <Sticker f={f} x={750} y={660} w={440} h={130} title="面试就这么答 ✓" delay={192} ts={38} />
      <Stick f={f} x={1480} y={700} s={1.25} pose="cheer" delay={204} />
      <Bubble f={f} x={1550} y={545} w={210} h={100} text="稳了！" ts={38} delay={218} tail="br" />
    </AbsoluteFill>
  );
};

// ================= P6 结尾 CTA =================

const PageOutro: React.FC<{off: number}> = ({off}) => {
  const f = useCurrentFrame() - off;
  return (
    <AbsoluteFill>
      <div style={{
        position: "absolute", top: 252, left: 0, right: 0, textAlign: "center",
        fontFamily: T_FONT, fontSize: 94, color: INK, letterSpacing: 6, whiteSpace: "nowrap",
        opacity: prog(f, 4, 12),
      }}>
        <span style={{position: "relative", display: "inline-block"}}>
          学会了就
          <span style={{color: RED}}>
            <span style={{position: "relative", display: "inline-block"}}>
              点个赞
              <span style={{position: "absolute", left: "50%", transform: "translateX(-50%)", bottom: -14}}>
                <svg width={330} height={20}>
                  <Squiggle f={f} x={4} y={10} w={322} delay={16} />
                </svg>
              </span>
            </span>
          </span>
          ！
        </span>
      </div>
      <div style={{
        position: "absolute", top: 424, left: 0, right: 0, textAlign: "center",
        fontFamily: B_FONT, fontSize: 38, color: SUBC, letterSpacing: 3,
        opacity: prog(f, 56, 10), whiteSpace: "nowrap",
      }}>顺手点个关注，下期不迷路</div>
      <Sticker f={f} x={510} y={530} w={900} h={150} title="下期：进程和线程" sub="一个干活的 一个管活的" delay={96} ts={46} color={GREEN_E} />
      <Bulb f={f} x={1450} y={250} s={1.4} delay={80} />
      <div style={{
        position: "absolute", top: 772, left: 0, right: 0, textAlign: "center",
        fontFamily: B_FONT, fontSize: 30, color: INK, letterSpacing: 4, opacity: 0.72 * prog(f, 140, 10),
      }}>小秋 · 0 基础也能学会</div>
    </AbsoluteFill>
  );
};

// ================= 组装（10 帧叠化转场） =================

const PAGES = [
  {C: PageHook, start: 0, end: 330},
  {C: PageDef, start: 330, end: 645},
  {C: PageMap, start: 645, end: 870},
  {C: PageSwap, start: 870, end: 1357},
  {C: PageRecap, start: 1357, end: 1595},
  {C: PageOutro, start: 1595, end: DUR},
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

export const VirtualMemorySketch: React.FC = () => {
  const frame = useCurrentFrame();
  const bedVolume = interpolate(frame, [0, 20, DUR - 40, DUR - 6], [0, 0.07, 0.07, 0], clamp);
  return (
    <AbsoluteFill style={{backgroundColor: PAPER, overflow: "hidden"}}>
      {PAGES.map(({C, start, end}, i) => {
        const first = i === 0;
        const last = i === PAGES.length - 1;
        const len = end - start;
        const from = first ? 0 : start - 10;
        const dur = len + (first ? 12 : 12);
        const off = first ? 0 : 10;
        return (
          <Sequence key={i} from={from} durationInFrames={dur}>
            <PageTurn off={off} len={len} first={first} last={last}>
              <C off={off} />
            </PageTurn>
          </Sequence>
        );
      })}
      <CornerMark />
      {voiceLines.map((s) => (
        <Sequence key={`vo-${s.index}`} from={s.start} durationInFrames={s.end - s.start + 30}>
          <Audio src={staticFile(`audio/vmem-tts/${s.audio}`)} volume={1} />
        </Sequence>
      ))}
      {[330, 645, 870, 1357].map((t) => (
        <Sequence key={`pt-${t}`} from={t - 6} durationInFrames={24}>
          <Audio src={staticFile("audio/sfx/transfer.wav")} volume={0.16} />
        </Sequence>
      ))}
      <Audio src={staticFile("audio/bed.wav")} loop volume={() => bedVolume} />
      <Subtitle />
    </AbsoluteFill>
  );
};
