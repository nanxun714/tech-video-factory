import {Audio} from "@remotion/media";
import {
  AbsoluteFill, interpolate, Sequence, staticFile, useCurrentFrame,
} from "remotion";

// ================= 白板手绘风 · TCP 三次握手（v2 大白体系 + 小秋 IP） =================
// 视觉基因：速写本纸白底 / 螺旋装订 / 咖啡渍 / 行楷标题+红波浪 / 水彩块 / 火柴人双方对话
// 动画：元素随配音词级时序逐个描画（遮罩不变量）/ 页间 10 帧叠化 / 0:00 封面静态完整

const PAPER = "#fdfcf7";
const INK = "#3a3a3a";
const SUBC = "#8a8579";
const RED = "#c94f4f";
const PINK_E = "#c96a7c";
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

export const DUR = 2013;
const W = 1920;
const H = 1080;

// 十页边界 = 句起始帧（timeline.json）
const SENT = [0, 181, 305, 539, 754, 987, 1273, 1479, 1676, 1814];
const SEND = [176, 300, 534, 748, 982, 1268, 1474, 1671, 1809, 1989];

const voiceLines = SENT.map((start, i) => ({
  index: i + 1,
  audio: `s${String(i + 1).padStart(2, "0")}.mp3`,
  start,
  end: SEND[i],
}));

type Sub = {s: number; e: number; t: string};
const subs: Sub[] = [
  {s: 0, e: 49, t: "TCP建立连接"},
  {s: 49, e: 112, t: "为什么非要握三次手"},
  {s: 112, e: 154, t: "两次明明更快"},
  {s: 154, e: 175, t: "不行吗"},
  {s: 181, e: 247, t: "把三次握手想成对暗号"},
  {s: 247, e: 300, t: "你就再也忘不掉了"},
  {s: 305, e: 362, t: "第一次 客户端先喊"},
  {s: 362, e: 441, t: "我的暗号是x 你能听到吗"},
  {s: 441, e: 462, t: "这一步"},
  {s: 462, e: 534, t: "是在确认服务端的耳朵"},
  {s: 539, e: 597, t: "第二次 服务端回话"},
  {s: 597, e: 662, t: "听到了 我的暗号是y"},
  {s: 662, e: 684, t: "这一步"},
  {s: 684, e: 748, t: "是亮出它自己的暗号"},
  {s: 754, e: 823, t: "第三次 客户端再喊一句"},
  {s: 823, e: 864, t: "我也听到你了"},
  {s: 864, e: 912, t: "服务端这才确认"},
  {s: 912, e: 981, t: "自己的声音对方收到了"},
  {s: 987, e: 1018, t: "关键就在这"},
  {s: 1018, e: 1055, t: "如果只有两次"},
  {s: 1055, e: 1124, t: "服务端说完就当连接成功"},
  {s: 1124, e: 1211, t: "但它根本不知道客户端收没收到"},
  {s: 1211, e: 1267, t: "只能白白占着门干等"},
  {s: 1273, e: 1292, t: "握三次"},
  {s: 1292, e: 1367, t: "刚好让双方都确认同一件事"},
  {s: 1367, e: 1417, t: "我说的话你收得到"},
  {s: 1417, e: 1474, t: "你说的话我也收得到"},
  {s: 1479, e: 1539, t: "所以三次不是仪式感"},
  {s: 1539, e: 1605, t: "是双向确认的最少次数"},
  {s: 1605, e: 1625, t: "少一次"},
  {s: 1625, e: 1671, t: "就有一头在装聋"},
  {s: 1676, e: 1728, t: "面试记住这一句"},
  {s: 1728, e: 1809, t: "三次握手 握的是双向确认"},
  {s: 1814, e: 1875, t: "这张速查卡截图存好"},
  {s: 1875, e: 1929, t: "下次被问三次握手"},
  {s: 1929, e: 1989, t: "先讲为什么 再讲过程"},
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

// 描画路径：pathLength=1 + dashoffset 滑入（delay=-99 = 第0帧即完整，用于封面静态元素）
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

// 手绘箭头（描画 + 箭头头；flip=从 x 向左画）
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

// 中英混排：拉丁/数字用粗雅黑保证清晰，中文保留手写体
const MixText: React.FC<{text: string; latinScale?: number}> = ({text, latinScale = 0.92}) => {
  const parts = text.split(/([A-Za-z0-9.+= ]+)/g);
  return (
    <>
      {parts.map((p, i) =>
        /^[A-Za-z0-9.+= ]+$/.test(p) ? (
          <span key={i} style={{fontFamily: "'Microsoft YaHei',sans-serif", fontWeight: 900, fontSize: `${latinScale}em`, letterSpacing: 1}}>{p}</span>
        ) : (
          <span key={i}>{p}</span>
        )
      )}
    </>
  );
};

// 火柴人（双方小人 + 讲解员）：pose 控手势，sit 控坐姿，nod 控点头循环
const Figure: React.FC<{
  f: number; x: number; y: number; s?: number; delay?: number;
  pose?: "pointR" | "pointL" | "cheer" | "deaf" | "down";
  sit?: boolean; dim?: number; nod?: number;
}> = ({f, x, y, s = 1.3, delay = 0, pose = "down", sit, dim = 1, nod = 0}) => {
  const head = "M -26 -78 a 26 26 0 1 1 52 0 a 26 26 0 1 1 -52 0";
  const body = sit ? "M 0 -52 L 0 30" : "M 0 -52 L 0 44";
  const arms: Record<string, string[]> = {
    pointR: ["M 0 -26 L 58 -62", "M 0 -20 L -36 16"],
    pointL: ["M 0 -26 L -58 -62", "M 0 -20 L 36 16"],
    cheer: ["M 0 -26 L 46 -76", "M 0 -26 L -46 -76"],
    deaf: ["M 0 -20 Q -28 -44 -38 -84", "M 0 -20 Q 28 -44 38 -84"],
    down: ["M 0 -20 L -36 16", "M 0 -20 L 36 16"],
  };
  const legs = sit
    ? ["M 0 30 L -44 54", "M 0 30 L 44 54"]
    : ["M 0 44 L -30 112", "M 0 44 L 30 112"];
  const parts: [string, number][] = [
    [head, 0],
    [body, 5],
    [arms[pose][0], 10],
    [arms[pose][1], 14],
    [legs[0], 18],
    [legs[1], 22],
  ];
  const rot = nod ? nod * Math.sin(f / 9) : 0;
  return (
    <svg width={W} height={H} style={{position: "absolute", left: 0, top: 0, overflow: "visible", pointerEvents: "none"}}>
      <g transform={`translate(${x},${y}) scale(${s}) rotate(${rot} 0 -52)`} opacity={dim}>
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

// 小人身份牌（水彩小底 + 名字）
const Tag: React.FC<{f: number; x: number; y: number; text: string; color?: string; delay?: number}> = ({
  f, x, y, text, color = BLUE_F, delay = 0,
}) => {
  const p = prog(f, delay, 10);
  if (p <= 0) return null;
  return (
    <>
      <WCol f={f} cx={x} cy={y + 22} rx={110} ry={36} color={color} seed={x % 5} delay={delay} />
      <div style={{
        position: "absolute", left: x - 150, top: y, width: 300, textAlign: "center",
        fontFamily: B_FONT, fontSize: 34, fontWeight: 700, color: INK, letterSpacing: 5, opacity: p,
      }}>{text}</div>
    </>
  );
};

// 绿色大勾
const GreenCheck: React.FC<{f: number; x: number; y: number; s?: number; delay?: number}> = ({
  f, x, y, s = 1, delay = 0,
}) => {
  const p = prog(f, delay, 12);
  if (p <= 0) return null;
  return (
    <svg width={W} height={H} style={{position: "absolute", left: 0, top: 0, overflow: "visible", pointerEvents: "none"}}>
      <g transform={`translate(${x},${y}) scale(${s})`}>
        <WColInline f={f} delay={delay} />
        <path d="M -46 0 L -10 38 L 52 -46" pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - p}
          stroke={GREEN_E} strokeWidth={13} fill="none" strokeLinecap="round" strokeLinejoin="round" />
      </g>
    </svg>
  );
};
// 勾背后的绿色水彩（供 GreenCheck 内部使用）
const WColInline: React.FC<{f: number; delay: number}> = ({f, delay}) => {
  const p = prog(f, delay + 4, 10);
  if (p <= 0) return null;
  return <path d={blobPath(0, -4, 84, 62, 4)} fill={GREEN_F} opacity={p} />;
};

// 耳朵简笔（服务端"耳朵"）
const Ear: React.FC<{f: number; x: number; y: number; s?: number; delay?: number}> = ({f, x, y, s = 1, delay = 0}) => {
  const p = prog(f, delay, 14);
  if (p <= 0) return null;
  const pc = prog(f, delay + 7, 8);
  return (
    <svg width={W} height={H} style={{position: "absolute", left: 0, top: 0, overflow: "visible", pointerEvents: "none"}}>
      <g transform={`translate(${x},${y}) rotate(-6) scale(${s})`}>
        {pc > 0 ? <path d={blobPath(0, -6, 52, 62, 6)} fill="rgba(233,180,190,0.5)" opacity={pc} /> : null}
        <path d="M -4 -46 C 26 -58 48 -34 40 -8 C 34 14 14 20 6 34 C 0 44 -14 46 -20 38"
          pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - p}
          stroke={INK} strokeWidth={6} fill="none" strokeLinecap="round" />
        <path d="M 10 -28 C 24 -34 28 -16 16 -6" pathLength={1}
          strokeDasharray="1 1" strokeDashoffset={1 - Math.max(0, prog(f, delay + 8, 6))}
          stroke={INK} strokeWidth={5} fill="none" strokeLinecap="round" />
      </g>
    </svg>
  );
};

// 居中手写标题 + 两侧小笔触 + 红波浪
const HandTitle: React.FC<{f: number; text: string; y?: number; size?: number; delay?: number}> = ({
  f, text, y = 58, size = 92, delay = 0,
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
    </div>
  );
};

// 黄色描边字幕（逐字无标点）
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

// ---------- 画布：螺旋装订线圈 + 咖啡渍（全局静态层） ----------

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
    <path d={blobPath(230, 900, 40, 32, 5)} fill="rgba(150,110,70,0.06)" stroke="none" />
    <path d={blobPath(230, 900, 32, 26, 5)} fill="none" stroke={STAIN} strokeWidth={4.5} />
    <path d={blobPath(1790, 860, 48, 38, 8)} fill="rgba(150,110,70,0.06)" stroke="none" />
    <path d={blobPath(1790, 860, 39, 31, 8)} fill="none" stroke={STAIN} strokeWidth={4.5} />
  </svg>
);

// ================= P1 封面钩子（0:00 完整静态，禁入场动画） =================

const PageCover: React.FC<{off: number}> = ({off}) => {
  const f = useCurrentFrame() - off;
  const D = -99; // 封面静态：所有元素 delay=-99
  return (
    <AbsoluteFill>
      <WCol f={f} cx={960} cy={210} rx={600} ry={130} color={YEL_F} seed={3} delay={D} />
      {/* 主标题两行 */}
      <div style={{
        position: "absolute", top: 96, left: 0, right: 0, textAlign: "center",
        fontFamily: T_FONT, fontSize: 92, color: INK, letterSpacing: 10, whiteSpace: "nowrap",
        transform: "rotate(-0.8deg)",
      }}><MixText text="TCP 建连接" /></div>
      <div style={{
        position: "absolute", top: 226, left: 0, right: 0, textAlign: "center",
        fontFamily: T_FONT, fontSize: 116, color: INK, letterSpacing: 6, whiteSpace: "nowrap",
        transform: "rotate(-0.8deg)",
      }}>
        为什么非要握<span style={{color: RED}}>三次手</span>？
        <span style={{position: "absolute", left: "50%", transform: "translateX(-50%)", bottom: -20, width: 900, textAlign: "center"}}>
          <svg width={900} height={22} style={{overflow: "visible"}}>
            <Squiggle f={f} x={4} y={11} w={892} delay={D} />
          </svg>
        </span>
      </div>
      {/* 左右两个小人面对面 */}
      <WCol f={f} cx={420} cy={760} rx={170} ry={54} color={BLUE_F} seed={2} delay={D} />
      <Figure f={f} x={420} y={660} s={1.5} pose="pointR" delay={D} />
      <Tag f={f} x={420} y={856} text="客户端" color={BLUE_F} delay={D} />
      <WCol f={f} cx={1500} cy={760} rx={170} ry={54} color={GREEN_F} seed={5} delay={D} />
      <Figure f={f} x={1500} y={660} s={1.5} pose="pointL" delay={D} />
      <Tag f={f} x={1500} y={856} text="服务端" color={GREEN_F} delay={D} />
      {/* 中央：两次握手 被红笔划掉打叉 */}
      <Arrow f={f} x={620} y={600} len={160} color={BLUE_E} sw={6} delay={D} bend={-10} />
      <Arrow f={f} x={1300} y={640} len={160} color={GREEN_E} sw={6} delay={D} flip bend={-10} />
      <WCol f={f} cx={960} cy={618} rx={210} ry={74} color={ORANGE_F} seed={7} delay={D} />
      <WBox f={f} x={790} y={556} w={340} h={104} sw={6} seed={4} delay={D} />
      <div style={{
        position: "absolute", left: 790, top: 576, width: 340, textAlign: "center",
        fontFamily: T_FONT, fontSize: 62, color: INK, letterSpacing: 8, whiteSpace: "nowrap",
      }}>两次握手</div>
      <Draw f={f} d="M 770 540 L 1160 686" stroke={RED} sw={11} delay={D} dur={10} op={0.92} />
      <Draw f={f} d="M 1160 540 L 770 686" stroke={RED} sw={11} delay={D} dur={10} op={0.92} />
      {/* 右上贴纸 + 落款 */}
      <Sticker f={f} x={1430} y={170} w={340} h={116} title="面试高频题" rot={4} delay={D} ts={40} color={ORANGE_E} />
      <div style={{
        position: "absolute", top: 930, left: 0, right: 0, textAlign: "center",
        fontFamily: B_FONT, fontSize: 30, color: INK, letterSpacing: 4, opacity: 0.72,
      }}>小秋 · 0 基础也能学会</div>
    </AbsoluteFill>
  );
};

// ================= P2 对暗号引入（len 124） =================

const PageMetaphor: React.FC<{off: number}> = ({off}) => {
  const f = useCurrentFrame() - off;
  const chars: [string, number, string, number][] = [
    // [字, cx, 色底, delay]
    ["对", 710, BLUE_F, 45],
    ["暗", 960, YEL_F, 49],
    ["号", 1210, GREEN_F, 53],
  ];
  return (
    <AbsoluteFill>
      {/* 引入句（三次握手 词级帧 9） */}
      <div style={{
        position: "absolute", top: 208, left: 0, right: 0, textAlign: "center",
        fontFamily: B_FONT, fontSize: 44, color: SUBC, letterSpacing: 4, whiteSpace: "nowrap",
        opacity: prog(f, 9, 10),
      }}>把「三次握手」想成 ——</div>
      {/* 中央三个大字 逐字描出 */}
      {chars.map(([c, cx, color, dl]) => (
        <div key={c}>
          <WCol f={f} cx={cx} cy={452} rx={132} ry={118} color={color} seed={cx % 7} delay={dl} />
          <div style={{
            position: "absolute", left: cx - 150, top: 330, width: 300, textAlign: "center",
            fontFamily: T_FONT, fontSize: 230, color: INK, lineHeight: 1.05,
            opacity: prog(f, dl + 2, 9), transform: `scale(${0.8 + 0.2 * prog(f, dl + 2, 9)})`,
          }}>{c}</div>
        </div>
      ))}
      <div style={{position: "absolute", left: 580, top: 636, width: 760, textAlign: "center"}}>
        <svg width={760} height={22} style={{overflow: "visible"}}>
          <Squiggle f={f} x={4} y={11} w={752} delay={70} />
        </svg>
      </div>
      {/* 两侧小人点头示意 */}
      <Figure f={f} x={330} y={740} s={1.15} pose="cheer" delay={3} nod={2.4} />
      <Figure f={f} x={1590} y={740} s={1.15} pose="cheer" delay={8} nod={2.4} />
      <Tag f={f} x={330} y={910} text="客户端" color={BLUE_F} delay={12} />
      <Tag f={f} x={1590} y={910} text="服务端" color={GREEN_F} delay={16} />
      {/* 结论一句（你就 75） */}
      <div style={{
        position: "absolute", top: 830, left: 560, width: 800, textAlign: "center",
        fontFamily: B_FONT, fontSize: 42, color: INK, letterSpacing: 3, whiteSpace: "nowrap",
        opacity: prog(f, 75, 10),
      }}>暗号对上了 连接才算通</div>
    </AbsoluteFill>
  );
};

// ================= P3 第一次握手（len 234） =================

const PageHS1: React.FC<{off: number}> = ({off}) => {
  const f = useCurrentFrame() - off;
  return (
    <AbsoluteFill>
      <HandTitle f={f} text="第一次握手" y={54} size={88} delay={2} />
      {/* 双方小人 */}
      <Figure f={f} x={400} y={660} s={1.45} pose="pointR" delay={8} nod={1.6} />
      <Tag f={f} x={400} y={846} text="客户端" color={BLUE_F} delay={22} />
      <Figure f={f} x={1520} y={660} s={1.45} pose="down" delay={16} nod={1.6} />
      <Tag f={f} x={1520} y={846} text="服务端" color={GREEN_F} delay={30} />
      {/* 客户端喊话气泡（我的暗号 59） */}
      <Bubble f={f} x={560} y={296} w={560} h={118} text="暗号是x 你听见没？" ts={42} delay={59} tail="bl" />
      {/* 手绘箭头 左→右（x 词级帧 86） */}
      <Arrow f={f} x={660} y={566} len={660} color={BLUE_E} sw={7} delay={86} bend={-18} />
      <div style={{
        position: "absolute", left: 830, top: 462, width: 320, textAlign: "center",
        fontFamily: B_FONT, fontSize: 34, fontWeight: 700, color: BLUE_E, whiteSpace: "nowrap",
        opacity: prog(f, 92, 8),
      }}><MixText text="SYN x" /></div>
      {/* 右侧：耳朵 + 标签（确认 185 / 服务端的耳朵 198-215） */}
      <Ear f={f} x={1656} y={420} s={1.05} delay={185} />
      <div style={{
        position: "absolute", left: 1180, top: 220, width: 620, textAlign: "center",
        fontFamily: B_FONT, fontSize: 38, color: INK, letterSpacing: 2, whiteSpace: "nowrap",
        opacity: prog(f, 198, 10),
      }}>这一步 = 查服务端的<span style={{color: BLUE_E, fontWeight: 700}}>耳朵</span></div>
      <div style={{position: "absolute", left: 1300, top: 282, width: 380, textAlign: "center"}}>
        <svg width={380} height={18} style={{overflow: "visible"}}>
          <Squiggle f={f} x={4} y={9} w={372} delay={210} sw={5} />
        </svg>
      </div>
    </AbsoluteFill>
  );
};

// ================= P4 第二次握手（len 210） =================

const PageHS2: React.FC<{off: number}> = ({off}) => {
  const f = useCurrentFrame() - off;
  return (
    <AbsoluteFill>
      <HandTitle f={f} text="第二次握手" y={54} size={88} delay={2} />
      <Figure f={f} x={400} y={660} s={1.45} pose="down" delay={8} nod={1.6} />
      <Tag f={f} x={400} y={846} text="客户端" color={BLUE_F} delay={22} />
      <Figure f={f} x={1520} y={660} s={1.45} pose="pointL" delay={16} nod={1.6} />
      <Tag f={f} x={1520} y={846} text="服务端" color={GREEN_F} delay={30} />
      {/* 服务端回话气泡（听到了 58） */}
      <Bubble f={f} x={1000} y={296} w={620} h={118} text="收到了！我的暗号是y" ts={42} delay={58} tail="br" />
      {/* 箭头 右→左（我的 84） */}
      <Arrow f={f} x={1260} y={566} len={660} color={ORANGE_E} sw={7} delay={84} bend={-18} flip />
      <div style={{
        position: "absolute", left: 770, top: 462, width: 380, textAlign: "center",
        fontFamily: B_FONT, fontSize: 34, fontWeight: 700, color: ORANGE_E, whiteSpace: "nowrap",
        opacity: prog(f, 111, 8),
      }}><MixText text="SYN y + ACK" /></div>
      {/* 标签（亮出 165） */}
      <div style={{
        position: "absolute", left: 1060, top: 792, width: 620, textAlign: "center",
        fontFamily: B_FONT, fontSize: 38, color: INK, letterSpacing: 2, whiteSpace: "nowrap",
        opacity: prog(f, 165, 10),
      }}>这一步 = <span style={{color: ORANGE_E, fontWeight: 700}}>亮出自己的暗号</span></div>
      <div style={{position: "absolute", left: 1180, top: 852, width: 380, textAlign: "center"}}>
        <svg width={380} height={18} style={{overflow: "visible"}}>
          <Squiggle f={f} x={4} y={9} w={372} delay={177} sw={5} color={ORANGE_E} />
        </svg>
      </div>
    </AbsoluteFill>
  );
};

// ================= P5 第三次握手（len 229） =================

const PageHS3: React.FC<{off: number}> = ({off}) => {
  const f = useCurrentFrame() - off;
  return (
    <AbsoluteFill>
      <HandTitle f={f} text="第三次握手" y={54} size={88} delay={2} />
      <Figure f={f} x={400} y={660} s={1.45} pose="pointR" delay={8} nod={1.6} />
      <Tag f={f} x={400} y={846} text="客户端" color={BLUE_F} delay={22} />
      <Figure f={f} x={1520} y={660} s={1.45} pose="down" delay={16} nod={1.6} />
      <Tag f={f} x={1520} y={846} text="服务端" color={GREEN_F} delay={30} />
      {/* 客户端再喊（我也听到你了 76） */}
      <Bubble f={f} x={560} y={300} w={460} h={110} text="我也听见了！" ts={42} delay={76} tail="bl" />
      {/* 箭头 左→右（了 105） */}
      <Arrow f={f} x={660} y={566} len={660} color={GREEN_E} sw={7} delay={105} bend={-18} />
      <div style={{
        position: "absolute", left: 900, top: 462, width: 240, textAlign: "center",
        fontFamily: B_FONT, fontSize: 34, fontWeight: 700, color: GREEN_E, whiteSpace: "nowrap",
        opacity: prog(f, 112, 8),
      }}><MixText text="ACK" /></div>
      {/* 服务端亮起绿勾（确认 153）+ 标签（声音 184） */}
      <GreenCheck f={f} x={1560} y={440} s={1.15} delay={153} />
      <div style={{
        position: "absolute", left: 1180, top: 220, width: 620, textAlign: "center",
        fontFamily: B_FONT, fontSize: 38, color: INK, letterSpacing: 2, whiteSpace: "nowrap",
        opacity: prog(f, 184, 10),
      }}>这回 <span style={{color: GREEN_E, fontWeight: 700}}>声音真送到了</span></div>
      <div style={{position: "absolute", left: 1300, top: 282, width: 380, textAlign: "center"}}>
        <svg width={380} height={18} style={{overflow: "visible"}}>
          <Squiggle f={f} x={4} y={9} w={372} delay={196} sw={5} color={GREEN_E} />
        </svg>
      </div>
      {/* 连接建立小徽标 */}
      <div style={{
        position: "absolute", left: 660, top: 810, width: 600, textAlign: "center",
        fontFamily: T_FONT, fontSize: 44, color: GREEN_E, letterSpacing: 6, whiteSpace: "nowrap",
        opacity: prog(f, 200, 10),
      }}>连接，建立了</div>
    </AbsoluteFill>
  );
};

// ================= P6 两次的坑（len 282，关键反证页） =================

const PageTrap: React.FC<{off: number}> = ({off}) => {
  const f = useCurrentFrame() - off;
  return (
    <AbsoluteFill>
      <HandTitle f={f} text="两次的坑" y={54} size={88} delay={2} />
      {/* 顶部假设（两次 56 前置铺垫 38） */}
      <div style={{
        position: "absolute", top: 220, left: 0, right: 0, textAlign: "center",
        fontFamily: B_FONT, fontSize: 38, color: SUBC, letterSpacing: 3, whiteSpace: "nowrap",
        opacity: prog(f, 38, 10),
      }}>假如没有第三次 ——</div>
      {/* 左侧客户端：发出后再无回音（客户 181 起 灰影） */}
      <Figure f={f} x={400} y={660} s={1.45} pose="pointR" delay={181} dim={0.32} />
      <div style={{
        position: "absolute", left: 250, top: 852, width: 300, textAlign: "center",
        fontFamily: B_FONT, fontSize: 32, color: SUBC, letterSpacing: 4,
        opacity: prog(f, 195, 10),
      }}>客户端 没有回音…</div>
      {/* 第三支箭头：灰色虚线 中途折断（X @100） */}
      <Draw f={f} d="M 660 560 Q 950 500 1210 552" stroke="#9aa5ad" sw={6} delay={70} dur={16} dashed />
      <Draw f={f} d="M 1176 516 L 1252 600 M 1252 516 L 1176 600" stroke={RED} sw={10} delay={100} dur={8} op={0.92} />
      {/* 服务端开门干等：门 + 坐着的小人（服务端 75 / 说完 88） */}
      <WBox f={f} x={1430} y={330} w={180} h={300} fill="rgba(255,255,255,0.9)" sw={6} seed={6} delay={75} dur={14} />
      <Draw f={f} d="M 1556 470 a 12 12 0 1 1 0.1 0" stroke={INK} sw={5} delay={85} dur={6} fill={ORANGE_F} />
      <Figure f={f} x={1330} y={620} s={1.2} pose="down" sit delay={88} nod={3.2} />
      <div style={{
        position: "absolute", left: 1210, top: 256, width: 400, textAlign: "center",
        fontFamily: B_FONT, fontSize: 34, color: INK, whiteSpace: "nowrap",
        opacity: prog(f, 95, 10),
      }}>他以为已经连上了</div>
      <Bubble f={f} x={1120} y={632} w={110} h={92} text="？" ts={44} delay={110} tail="br" />
      {/* 红色标签（白白 239） */}
      <div style={{
        position: "absolute", left: 1280, top: 700, width: 420, textAlign: "center",
        fontFamily: B_FONT, fontSize: 46, fontWeight: 700, color: RED, letterSpacing: 4, whiteSpace: "nowrap",
        opacity: prog(f, 239, 10),
      }}>白白占着门干等</div>
      <div style={{position: "absolute", left: 1340, top: 762, width: 300, textAlign: "center"}}>
        <svg width={300} height={18} style={{overflow: "visible"}}>
          <Squiggle f={f} x={4} y={9} w={292} delay={249} sw={5} />
        </svg>
      </div>
      {/* 右下灰字：连接其实没成 */}
      <div style={{
        position: "absolute", left: 560, top: 792, width: 560, textAlign: "center",
        fontFamily: B_FONT, fontSize: 36, color: INK, whiteSpace: "nowrap",
        opacity: prog(f, 205, 10),
      }}>门开着 人走了 连接卡住了</div>
    </AbsoluteFill>
  );
};

// ================= P7 双向确认（len 201） =================

const PageBoth: React.FC<{off: number}> = ({off}) => {
  const f = useCurrentFrame() - off;
  return (
    <AbsoluteFill>
      <HandTitle f={f} text="双向确认" y={54} size={92} delay={3} />
      <Figure f={f} x={400} y={680} s={1.35} pose="cheer" delay={27} nod={2} />
      <Tag f={f} x={400} y={856} text="客户端" color={BLUE_F} delay={36} />
      <Figure f={f} x={1520} y={680} s={1.35} pose="cheer" delay={45} nod={2} />
      <Tag f={f} x={1520} y={856} text="服务端" color={GREEN_F} delay={52} />
      {/* 去程箭头 + 绿勾（我 108） */}
      <Arrow f={f} x={660} y={452} len={640} color={BLUE_E} sw={7} delay={108} bend={-16} />
      <GreenCheck f={f} x={1330} y={408} s={0.9} delay={120} />
      <div style={{
        position: "absolute", left: 660, top: 356, width: 600, textAlign: "center",
        fontFamily: B_FONT, fontSize: 36, color: INK, whiteSpace: "nowrap",
        opacity: prog(f, 108, 10),
      }}>发出去的话 <span style={{color: GREEN_E, fontWeight: 700}}>✓ 送达</span></div>
      {/* 回程箭头 + 绿勾（你 155） */}
      <Arrow f={f} x={1260} y={740} len={640} color={ORANGE_E} sw={7} delay={155} bend={-16} flip />
      <GreenCheck f={f} x={590} y={696} s={0.9} delay={167} />
      <div style={{
        position: "absolute", left: 660, top: 800, width: 600, textAlign: "center",
        fontFamily: B_FONT, fontSize: 36, color: INK, whiteSpace: "nowrap",
        opacity: prog(f, 155, 10),
      }}>传回来的话 <span style={{color: GREEN_E, fontWeight: 700}}>✓ 送达</span></div>
      {/* 中央小字 */}
      <div style={{
        position: "absolute", left: 760, top: 576, width: 400, textAlign: "center",
        fontFamily: T_FONT, fontSize: 40, color: SUBC, letterSpacing: 8, whiteSpace: "nowrap",
        opacity: prog(f, 178, 10),
      }}>两条路都通了</div>
    </AbsoluteFill>
  );
};

// ================= P8 总结：最少次数（len 192） =================

const PageMin: React.FC<{off: number}> = ({off}) => {
  const f = useCurrentFrame() - off;
  return (
    <AbsoluteFill>
      <HandTitle f={f} text="为什么刚好三次？" y={54} size={84} delay={2} />
      {/* 大公式（双向 69 / 最少 98） */}
      <div style={{
        position: "absolute", top: 268, left: 0, right: 0, textAlign: "center",
        fontFamily: T_FONT, fontSize: 128, color: INK, letterSpacing: 8, whiteSpace: "nowrap",
        opacity: prog(f, 69, 12), transform: `scale(${0.9 + 0.1 * prog(f, 69, 12)})`,
      }}>
        <span style={{position: "relative", display: "inline-block", padding: "0 10px"}}>
          <span style={{
            position: "absolute", inset: "-10px -22px", background: YEL_F,
            borderRadius: "58% 42% 55% 45% / 55% 48% 52% 45%",
            opacity: prog(f, 74, 10),
          }} />
          <span style={{position: "relative"}}>双向确认</span>
        </span>
      </div>
      <div style={{
        position: "absolute", top: 452, left: 0, right: 0, textAlign: "center",
        fontFamily: B_FONT, fontSize: 52, color: INK, letterSpacing: 4, whiteSpace: "nowrap",
        opacity: prog(f, 98, 10),
      }}>—— 最少要 <MixText text="3" latinScale={1} /> 次才做得到</div>
      {/* 少一次 → 捂耳朵小人（少一次 130 / 装 152 / 聋 177） */}
      <div style={{
        position: "absolute", top: 582, left: 380, width: 400, textAlign: "center",
        fontFamily: B_FONT, fontSize: 42, fontWeight: 700, color: RED, whiteSpace: "nowrap",
        opacity: prog(f, 130, 10),
      }}>少一次呢？</div>
      <Arrow f={f} x={800} y={640} len={120} color={RED} sw={6} delay={140} bend={-10} />
      <Figure f={f} x={1060} y={780} s={1.15} pose="deaf" delay={152} nod={2.6} />
      <div style={{
        position: "absolute", left: 1180, top: 742, width: 520, textAlign: "center",
        fontFamily: B_FONT, fontSize: 38, color: INK, whiteSpace: "nowrap",
        opacity: prog(f, 160, 10),
      }}>就有一头 <span style={{color: RED, fontWeight: 700}}>听不见</span></div>
      <div style={{position: "absolute", left: 1240, top: 800, width: 400, textAlign: "center"}}>
        <svg width={400} height={18} style={{overflow: "visible"}}>
          <Squiggle f={f} x={4} y={9} w={392} delay={172} sw={5} />
        </svg>
      </div>
    </AbsoluteFill>
  );
};

// ================= P9 金句（len 133） =================

const PageGolden: React.FC<{off: number}> = ({off}) => {
  const f = useCurrentFrame() - off;
  const breathe = 1 + 0.015 * Math.sin(f / 8);
  return (
    <AbsoluteFill>
      <div style={{
        position: "absolute", top: 196, left: 0, right: 0, textAlign: "center",
        fontFamily: B_FONT, fontSize: 36, color: SUBC, letterSpacing: 6, whiteSpace: "nowrap",
        opacity: prog(f, 3, 10),
      }}>面试官想听的答案</div>
      {/* 黄字描边大字（三次 55 / 双向确认 104） */}
      <div style={{
        position: "absolute", top: 300, left: 0, right: 0, textAlign: "center",
        fontFamily: "'Microsoft YaHei',sans-serif", fontWeight: 900, fontSize: 158, letterSpacing: 10,
        color: "#ffd93d", whiteSpace: "nowrap", transform: `rotate(-1deg) scale(${breathe})`,
        textShadow: "6px 0 0 #3a2f10, -6px 0 0 #3a2f10, 0 6px 0 #3a2f10, 0 -6px 0 #3a2f10, 4px 4px 0 #3a2f10, -4px -4px 0 #3a2f10, 4px -4px 0 #3a2f10, -4px 4px 0 #3a2f10, 0 12px 22px rgba(0,0,0,0.30)",
        opacity: prog(f, 55, 12),
      }}>三次握手</div>
      <div style={{
        position: "absolute", top: 532, left: 0, right: 0, textAlign: "center",
        fontFamily: "'Microsoft YaHei',sans-serif", fontWeight: 900, fontSize: 110, letterSpacing: 8,
        color: "#ffd93d", whiteSpace: "nowrap", transform: "rotate(-1deg)",
        textShadow: "5px 0 0 #3a2f10, -5px 0 0 #3a2f10, 0 5px 0 #3a2f10, 0 -5px 0 #3a2f10, 3px 3px 0 #3a2f10, -3px -3px 0 #3a2f10, 3px -3px 0 #3a2f10, -3px 3px 0 #3a2f10, 0 10px 18px rgba(0,0,0,0.30)",
        opacity: prog(f, 104, 12),
      }}><MixText text="= 双向确认" latinScale={1} /></div>
      <div style={{position: "absolute", left: 560, top: 726, width: 800, textAlign: "center"}}>
        <svg width={800} height={22} style={{overflow: "visible"}}>
          <Squiggle f={f} x={4} y={11} w={792} delay={118} />
        </svg>
      </div>
      {/* 截图预告小贴纸（不出声） */}
      <Sticker f={f} x={1430} y={140} w={350} h={112} title="结尾有速查卡" rot={5} delay={20} ts={34} color={ORANGE_E} />
      {/* 底部讲解小人（填充下方留白 + 循环点头） */}
      <Figure f={f} x={280} y={838} s={0.82} pose="cheer" delay={8} nod={3} />
      <Bubble f={f} x={400} y={790} w={250} h={92} text="记住了！" ts={34} delay={30} tail="bl" />
    </AbsoluteFill>
  );
};

// ================= P10 结尾速查卡（len 281，最后~100帧静止） =================

const PageCard: React.FC<{off: number}> = ({off}) => {
  const f = useCurrentFrame() - off;
  const row = (y: number, d: number, txt: string, color?: string) => (
    <div style={{
      position: "absolute", left: 590, top: y, width: 760, textAlign: "left",
      fontFamily: B_FONT, fontSize: 40, color: color ?? INK, letterSpacing: 2, whiteSpace: "nowrap",
      opacity: prog(f, d, 10),
    }}><MixText text={txt} /></div>
  );
  return (
    <AbsoluteFill>
      <WCol f={f} cx={960} cy={480} rx={480} ry={310} color={YEL_F} seed={6} delay={14} />
      <WBox f={f} x={540} y={166} w={840} h={646} fill="rgba(255,255,255,0.92)" sw={6} seed={3} delay={14} dur={16} />
      {/* 卡片标题（速查卡 14） */}
      <div style={{
        position: "absolute", left: 540, top: 196, width: 840, textAlign: "center",
        fontFamily: T_FONT, fontSize: 68, color: INK, letterSpacing: 10, whiteSpace: "nowrap",
        opacity: prog(f, 18, 10),
      }}>三次握手速查</div>
      <div style={{position: "absolute", left: 740, top: 282, width: 440, textAlign: "center"}}>
        <svg width={440} height={18} style={{overflow: "visible"}}>
          <Squiggle f={f} x={4} y={9} w={432} delay={26} sw={5} />
        </svg>
      </div>
      {/* 三行过程（存好 30/下次 62/三次 84） */}
      {row(330, 30, "① 客户端 → 服务端：SYN x", BLUE_E)}
      {row(412, 62, "② 服务端 → 客户端：SYN y + ACK", ORANGE_E)}
      {row(494, 84, "③ 客户端 → 服务端：ACK", GREEN_E)}
      <Draw f={f} d="M 600 574 L 1320 574" stroke="#9aa5ad" sw={3.5} delay={100} dur={8} op={0.7} />
      {/* 为什么不是两次（先/为什么 116） */}
      <div style={{
        position: "absolute", left: 590, top: 604, width: 760,
        fontFamily: B_FONT, fontSize: 38, fontWeight: 700, color: RED, whiteSpace: "nowrap",
        opacity: prog(f, 116, 10),
      }}>为什么不是两次？</div>
      <div style={{
        position: "absolute", left: 590, top: 662, width: 760,
        fontFamily: B_FONT, fontSize: 34, color: INK, whiteSpace: "nowrap",
        opacity: prog(f, 128, 10),
      }}>服务端无法确认对方收到</div>
      {/* 落款（170） */}
      <div style={{
        position: "absolute", left: 540, top: 736, width: 840, textAlign: "center",
        fontFamily: B_FONT, fontSize: 28, color: INK, letterSpacing: 4,
        opacity: 0.75 * prog(f, 170, 10),
      }}>小秋 · 0 基础也能学会</div>
      {/* 侧边便签（再讲过程 164） */}
      <Sticker f={f} x={1450} y={700} w={350} h={128} title="答题顺序" sub="为什么 → 过程" rot={4} delay={150} ts={34} color={GREEN_E} />
    </AbsoluteFill>
  );
};

// ================= 组装（10 帧叠化转场） =================

const PAGES = [
  {C: PageCover, start: SENT[0], end: SENT[1]},
  {C: PageMetaphor, start: SENT[1], end: SENT[2]},
  {C: PageHS1, start: SENT[2], end: SENT[3]},
  {C: PageHS2, start: SENT[3], end: SENT[4]},
  {C: PageHS3, start: SENT[4], end: SENT[5]},
  {C: PageTrap, start: SENT[5], end: SENT[6]},
  {C: PageBoth, start: SENT[6], end: SENT[7]},
  {C: PageMin, start: SENT[7], end: SENT[8]},
  {C: PageGolden, start: SENT[8], end: SENT[9]},
  {C: PageCard, start: SENT[9], end: DUR},
];

const PageTurn: React.FC<{
  children: React.ReactNode; off: number; len: number; first: boolean; last: boolean;
}> = ({children, off, len, first, last}) => {
  const frame = useCurrentFrame();
  // 淡入在新页序列前 10 帧（边界起）；淡出落在旧页序列延长出的后 10 帧。
  // 关键不变量：边界帧上旧页 opacity=1（尚未开始淡出）、新页内容虽未画但被旧页垫底，
  // 从而任何一帧都不会出现"旧页已消失、新页还没画"的空白纸闪。
  const oIn = first ? 1 : interpolate(frame, [0, 10], [0, 1], clamp);
  const lf = frame - off;
  const oOut = last ? 1 : interpolate(lf, [len, len + 10], [1, 0], clamp);
  return <AbsoluteFill style={{opacity: Math.min(oIn, oOut)}}>{children}</AbsoluteFill>;
};

// 音效：挂动作帧（页内词级帧 + 页起点换算为全局帧）
const PAGE_TURN = SENT.slice(1).map((t) => t - 6);                 // page3.wav 翻页
const SFX_WHOOSH = [391, 623, 859, 1047, 1381, 1428];              // 箭头飞
const SFX_POP = [226, 364, 597, 830];                              // 气泡/大字弹入
const SFX_DING = [907, 1391, 1438];                                // 绿勾确认
const SFX_ERROR = [1087, 1226];                                    // 红叉/坑

export const TcpHandshakeSketch: React.FC = () => {
  const frame = useCurrentFrame();
  const bedVolume = interpolate(frame, [0, 20, DUR - 130, DUR - 100, DUR - 26, DUR - 1], [0, 0.06, 0.06, 0.1, 0.17, 0], clamp);
  return (
    <AbsoluteFill style={{backgroundColor: PAPER, overflow: "hidden"}}>
      <CoffeeStains />
      {PAGES.map(({C, start, end}, i) => {
        const first = i === 0;
        const last = i === PAGES.length - 1;
        const len = end - start;
        // 序列从页边界帧起，向后延长 10 帧与新页交叉淡化（末页到 DUR）。
        // 页内内容帧 f = 全局帧 - start，词级 delay 对齐不变。
        const dur = last ? DUR - start : len + 10;
        return (
          <Sequence key={i} from={start} durationInFrames={dur}>
            <PageTurn off={0} len={len} first={first} last={last}>
              <C off={0} />
            </PageTurn>
          </Sequence>
        );
      })}
      <SpiralBinding />
      <CornerMark />
      {/* 配音层 */}
      {voiceLines.map((s) => (
        <Sequence key={`vo-${s.index}`} from={s.start} durationInFrames={s.end - s.start + 30}>
          <Audio src={staticFile(`audio/tcphandshake-tts/${s.audio}`)} volume={1} />
        </Sequence>
      ))}
      {/* 音效层 */}
      {PAGE_TURN.map((t) => (
        <Sequence key={`pt-${t}`} from={t} durationInFrames={24}>
          <Audio src={staticFile("audio/sfx/page3.wav")} volume={0.28} />
        </Sequence>
      ))}
      {SFX_WHOOSH.map((t) => (
        <Sequence key={`wh-${t}`} from={t} durationInFrames={24}>
          <Audio src={staticFile("audio/sfx/whoosh.wav")} volume={0.22} />
        </Sequence>
      ))}
      {SFX_POP.map((t) => (
        <Sequence key={`pp-${t}`} from={t} durationInFrames={24}>
          <Audio src={staticFile("audio/sfx/pop.wav")} volume={0.26} />
        </Sequence>
      ))}
      {SFX_DING.map((t) => (
        <Sequence key={`dg-${t}`} from={t} durationInFrames={40}>
          <Audio src={staticFile("audio/sfx/ding.wav")} volume={0.3} />
        </Sequence>
      ))}
      {SFX_ERROR.map((t) => (
        <Sequence key={`er-${t}`} from={t} durationInFrames={40}>
          <Audio src={staticFile("audio/sfx/error.wav")} volume={0.3} />
        </Sequence>
      ))}
      <Audio src={staticFile("audio/bed.wav")} loop volume={() => bedVolume} />
      <Sequence from={1814} durationInFrames={60}>
        <Audio src={staticFile("audio/sfx/warm3.wav")} volume={0.26} />
      </Sequence>
      <Subtitle />
    </AbsoluteFill>
  );
};
