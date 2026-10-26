import {Audio} from "@remotion/media";
import {
  AbsoluteFill, interpolate, Sequence, staticFile, useCurrentFrame,
} from "remotion";

// ================= 白板手绘风 · TCP vs UDP（复刻"计算机大白"画布质感 + 小秋 IP） =================
// 画布基因：速写本纸白底 / 左侧螺旋装订线圈 / 咖啡渍 / 黑墨线稿 / 彩色蜡笔+水彩重点（橙主强调）
// 动画：元素随配音逐个描画，页间 10 帧叠化，0:00 封面静态完整

const PAPER = "#fdfcf7";
const INK = "#3a3a3a";
const SUBC = "#8a8579";
const RED = "#c94f4f";
const PINK_E = "#c96a7c";
const BLUE_F = "rgba(139,178,216,0.34)";
const BLUE_E = "#5b87ad";
const GREEN_E = "#4e9464";
const YEL_F = "rgba(242,202,92,0.45)";
const ORANGE_F = "rgba(242,163,94,0.40)";
const ORANGE_E = "#c97a2e";
const STAIN = "rgba(150,110,70,0.30)";

const T_FONT = "'STXingkai','华文行楷','KaiTi','楷体',serif";
const B_FONT = "'STKaiti','KaiTi','楷体','Microsoft YaHei',serif";

const DUR = 1900;
const W = 1920;
const H = 1080;

const voiceLines = [
  {index: 1, audio: "s01.mp3", start: 0, end: 120},
  {index: 2, audio: "s02.mp3", start: 125, end: 329},
  {index: 3, audio: "s03.mp3", start: 335, end: 485},
  {index: 4, audio: "s04.mp3", start: 490, end: 634},
  {index: 5, audio: "s05.mp3", start: 640, end: 886},
  {index: 6, audio: "s06.mp3", start: 891, end: 1197},
  {index: 7, audio: "s07.mp3", start: 1202, end: 1388},
  {index: 8, audio: "s08.mp3", start: 1394, end: 1640},
  {index: 9, audio: "s09.mp3", start: 1645, end: 1885},
];

type Sub = {s: number; e: number; t: string; kw?: string; kc?: string};
const ORANGE_KW = "#ffb35c";
const BLUE_KW = "#7db3dd";
const subs: Sub[] = [
  // s01 问题钩子
  {s: 0, e: 55, t: "你看视频的时候"},
  {s: 55, e: 120, t: "数据到底是怎么传过来的", kw: "数据", kc: ORANGE_KW},
  // s02 引出 + 冲突
  {s: 125, e: 185, t: "背后离不开两个协议"},
  {s: 185, e: 240, t: "TCP 和 UDP", kw: "TCP 和 UDP", kc: ORANGE_KW},
  {s: 240, e: 288, t: "一个更追求可靠", kw: "可靠", kc: ORANGE_KW},
  {s: 288, e: 335, t: "一个更追求速度", kw: "速度", kc: BLUE_KW},
  // s03 打电话比喻
  {s: 340, e: 400, t: "TCP 像打电话", kw: "打电话", kc: ORANGE_KW},
  {s: 400, e: 448, t: "先问一句 听到了吗"},
  {s: 448, e: 490, t: "听到了 才继续说", kw: "听到了", kc: ORANGE_KW},
  // s04 喊话比喻
  {s: 495, e: 558, t: "UDP 像拿大喇叭喊话", kw: "大喇叭", kc: BLUE_KW},
  {s: 558, e: 596, t: "喊完就走", kw: "喊完就走", kc: BLUE_KW},
  {s: 596, e: 640, t: "不管你听没听到"},
  // s05 TCP 编号签收（五镜头）
  {s: 645, e: 700, t: "TCP 发每个包 都编号签收", kw: "编号签收", kc: ORANGE_KW},
  {s: 700, e: 748, t: "发现第三个没到"},
  {s: 748, e: 782, t: "就问一句 3？"},
  {s: 782, e: 830, t: "然后重新发"},
  {s: 830, e: 891, t: "确认收到 才继续", kw: "确认", kc: ORANGE_KW},
  // s06 UDP 连发反差
  {s: 896, e: 948, t: "UDP 呢 五个包连续发", kw: "连续发", kc: BLUE_KW},
  {s: 948, e: 995, t: "中间丢了 也不等 不确认 不重传", kw: "不重传", kc: BLUE_KW},
  {s: 995, e: 1060, t: "它不提供 TCP 那样的可靠机制"},
  {s: 1060, e: 1202, t: "但换来了低延迟", kw: "低延迟", kc: BLUE_KW},
  // s07 场景
  {s: 1207, e: 1270, t: "网页 文件 登录 走 TCP", kw: "TCP", kc: ORANGE_KW},
  {s: 1270, e: 1394, t: "直播 游戏 DNS 走 UDP", kw: "UDP", kc: BLUE_KW},
  // s08 总结
  {s: 1399, e: 1462, t: "TCP 更强调可靠性", kw: "可靠性", kc: ORANGE_KW},
  {s: 1462, e: 1530, t: "UDP 更强调低延迟和效率", kw: "低延迟", kc: BLUE_KW},
  {s: 1530, e: 1645, t: "不是谁更好 而是看场景需要什么", kw: "场景", kc: ORANGE_KW},
  // s09 结尾
  {s: 1650, e: 1770, t: "浏览器输入网址后 到底发生了什么", kw: "输入网址", kc: ORANGE_KW},
  {s: 1770, e: 1895, t: "关注全栈小秋 把计算机基础讲明白", kw: "关注全栈小秋", kc: RED},
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

// 黄色描边字幕 + 关键词层级（关键词放大+强调色+弹入）
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
  }}>小秋</div>
);

// ---------- 计算机大白画布：螺旋装订线圈 + 咖啡渍（全局静态层） ----------

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
      {/* 左页边阴影 */}
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

// ---------- 主题简笔图标（白底圆牌 + 干净粗线稿，贴近计算机大白） ----------

// 通话：具象听筒 + 橙色信号弧（不再套圆牌）
const PhoneSketch: React.FC<{f: number; x: number; y: number; s?: number; delay?: number}> = ({f, x, y, s = 1, delay = 0}) => (
  <svg width={W} height={H} style={{position: "absolute", left: 0, top: 0, overflow: "visible", pointerEvents: "none"}}>
    <g transform={`translate(${x},${y}) scale(${s})`} opacity={prog(f, delay, 14)}>
      <path d="M -64 44 C -64 35 -57 28 -48 28 C -30 8 -11 -2 0 -2 C 11 -2 30 8 48 28 C 57 28 64 35 64 44 C 64 55 55 64 44 64 L 36 64 C 25 64 17 55 17 44 L 17 39 C 10 32 -10 32 -17 39 L -17 44 C -17 55 -25 64 -36 64 L -44 64 C -55 64 -64 55 -64 44 Z"
        fill={INK} stroke={INK} strokeWidth={3} transform="rotate(-38)" />
      <path d="M -18 47 Q 0 67 18 47" fill="none" stroke="#f6efe3" strokeWidth={5} strokeLinecap="round" opacity={0.85} />
      {[0, 1, 2].map((i) => (
        <path key={i} d={`M ${70 + i * 22} ${-42 - i * 17} A ${58 + i * 20} ${58 + i * 20} 0 0 1 ${70 + i * 22} ${42 + i * 17}`}
          fill="none" stroke={ORANGE_E} strokeWidth={7 + i} strokeLinecap="round"
          opacity={prog(f, delay + 8 + i * 4, 8) * 0.85} />
      ))}
    </g>
  </svg>
);

// 大喇叭：具象喇叭口+手柄+声波（不再套圆牌）
const Megaphone: React.FC<{f: number; x: number; y: number; s?: number; delay?: number; pulse?: boolean}> = ({f, x, y, s = 1, delay = 0, pulse}) => {
  const pu = pulse ? 1 + 0.03 * Math.sin(f / 5) : 1;
  return (
    <svg width={W} height={H} style={{position: "absolute", left: 0, top: 0, overflow: "visible", pointerEvents: "none"}}>
      <g transform={`translate(${x},${y}) scale(${s * pu})`} opacity={prog(f, delay, 14)}>
        <g transform="rotate(-14)">
          <path d="M -108 -28 L 10 -78 L 10 78 L -108 28 Z" fill="rgba(255,255,255,0.96)" stroke={INK} strokeWidth={6.5} strokeLinejoin="round" />
          <path d="M 10 -78 L 62 -58 L 62 58 L 10 78 Z" fill="rgba(139,178,216,0.58)" stroke={INK} strokeWidth={6.5} strokeLinejoin="round" />
          <path d="M -108 -28 L -128 -20 L -128 20 L -108 28 Z" fill={INK} stroke={INK} strokeWidth={4} strokeLinejoin="round" />
          <path d="M -82 40 L -68 112 L -24 102 L -42 44" fill="rgba(255,255,255,0.96)" stroke={INK} strokeWidth={6} strokeLinejoin="round" />
          <path d="M -77 43 L -35 48" stroke={ORANGE_E} strokeWidth={5} strokeLinecap="round" opacity={0.7} />
        </g>
        {[0, 1, 2].map((i) => (
          <path key={i} d={`M ${84 + i * 24} ${-42 - i * 18} A ${50 + i * 20} ${50 + i * 20} 0 0 1 ${84 + i * 24} ${42 + i * 18}`}
            fill="none" stroke={ORANGE_E} strokeWidth={7 + i} strokeLinecap="round"
            opacity={prog(f, delay + 8 + i * 4, 8) * (pulse ? 0.5 + 0.5 * Math.abs(Math.sin(f / 7 + i)) : 0.85)} />
        ))}
      </g>
    </svg>
  );
};

// 服务器机架
const ServerRack: React.FC<{f: number; x: number; y: number; s?: number; delay?: number}> = ({f, x, y, s = 1, delay = 0}) => (
  <svg width={W} height={H} style={{position: "absolute", left: 0, top: 0, overflow: "visible", pointerEvents: "none"}}>
    <g transform={`translate(${x},${y}) scale(${s})`}>
      <path d={sketchRectPath(0, 0, 190, 240, 6)} fill="rgba(210,225,238,0.4)" stroke={INK} strokeWidth={6} opacity={prog(f, delay, 16)} />
      {[0, 1, 2].map((i) => (
        <g key={i} opacity={prog(f, delay + 6 + i * 4, 8)}>
          <path d={sketchRectPath(18, 22 + i * 74, 154, 52, i + 1)} fill="none" stroke={INK} strokeWidth={4.5} />
          <circle cx={40} cy={48 + i * 74} r={6} fill={i === 1 ? GREEN_E : INK} />
          <path d={`M 62 ${44 + i * 74} L 150 ${44 + i * 74} M 62 ${58 + i * 74} L 128 ${58 + i * 74}`} stroke="#9aa5ad" strokeWidth={3.5} strokeLinecap="round" />
        </g>
      ))}
    </g>
  </svg>
);

// 具象路由器：天线、指示灯、网线插口

// 文件包：纸箱、文件页和编号标签
const FileParcel: React.FC<{f: number; x: number; y: number; s?: number; delay?: number}> = ({f, x, y, s = 1, delay = 0}) => (
  <svg width={W} height={H} style={{position: "absolute", left: 0, top: 0, overflow: "visible", pointerEvents: "none"}}>
    <g transform={`translate(${x},${y}) scale(${s})`} opacity={prog(f, delay, 14)}>
      <path d="M -100 -45 L 28 -60 L 100 -22 L -32 -7 Z" fill="rgba(242,163,94,0.38)" stroke={INK} strokeWidth={5.5} />
      <path d="M -100 -45 L -100 70 L -32 112 L -32 -7 Z" fill="rgba(242,202,92,0.38)" stroke={INK} strokeWidth={5.5} />
      <path d="M -32 -7 L 100 -22 L 100 62 L -32 112 Z" fill="rgba(242,163,94,0.22)" stroke={INK} strokeWidth={5.5} />
      <path d="M -42 -28 L 18 -35 L 54 -18 L -8 -10 Z" fill="rgba(255,255,255,0.86)" stroke={INK} strokeWidth={4} />
      <path d="M -20 -20 L 32 -26" stroke="#9aa5ad" strokeWidth={3.5} strokeLinecap="round" />
    </g>
  </svg>
);

// 视频播放器：画面、进度条和播放键
const VideoPlayer: React.FC<{f: number; x: number; y: number; s?: number; delay?: number}> = ({f, x, y, s = 1, delay = 0}) => (
  <svg width={W} height={H} style={{position: "absolute", left: 0, top: 0, overflow: "visible", pointerEvents: "none"}}>
    <g transform={`translate(${x},${y}) scale(${s})`} opacity={prog(f, delay, 14)}>
      <path d={sketchRectPath(-160, -100, 320, 200, 12)} fill="rgba(255,255,255,0.94)" stroke={INK} strokeWidth={6} />
      <path d="M -136 -68 L 136 -68" stroke={INK} strokeWidth={4.5} />
      <circle cx={-112} cy={-84} r={7} fill={RED} /><circle cx={-88} cy={-84} r={7} fill="#e8b93c" /><circle cx={-64} cy={-84} r={7} fill={GREEN_E} />
      <path d="M -120 52 L 120 52" stroke="#9aa5ad" strokeWidth={5} strokeLinecap="round" />
      <path d="M -120 52 L -24 52" stroke={ORANGE_E} strokeWidth={7} strokeLinecap="round" />
      <path d="M -12 -30 L -12 28 L 46 -1 Z" fill={BLUE_F} stroke={INK} strokeWidth={5} strokeLinejoin="round" />
      <path d="M -142 52 L -142 67 M 112 52 L 112 67" stroke={INK} strokeWidth={4} strokeLinecap="round" />
    </g>
  </svg>
);

// 游戏手柄：两个摇杆、方向键和按键
const GamePad: React.FC<{f: number; x: number; y: number; s?: number; delay?: number}> = ({f, x, y, s = 1, delay = 0}) => (
  <svg width={W} height={H} style={{position: "absolute", left: 0, top: 0, overflow: "visible", pointerEvents: "none"}}>
    <g transform={`translate(${x},${y}) scale(${s})`} opacity={prog(f, delay, 14)}>
      <path d="M -120 -42 Q -86 -82 -44 -42 L -18 -15 L 18 -15 L 44 -42 Q 86 -82 120 -42 L 145 50 Q 152 84 120 86 L 78 88 L 40 42 L -40 42 L -78 88 L -120 86 Q -152 84 -145 50 Z" fill="rgba(255,255,255,0.94)" stroke={INK} strokeWidth={6} strokeLinejoin="round" />
      <path d="M -92 4 L -92 42 M -111 23 L -73 23" stroke={INK} strokeWidth={7} strokeLinecap="round" />
      <circle cx={66} cy={10} r={13} fill={ORANGE_E} stroke={INK} strokeWidth={4} /><circle cx={98} cy={40} r={13} fill={BLUE_E} stroke={INK} strokeWidth={4} />
      <circle cx={-37} cy={49} r={15} fill="rgba(139,178,216,0.55)" stroke={INK} strokeWidth={4} /><circle cx={37} cy={49} r={15} fill="rgba(139,178,216,0.55)" stroke={INK} strokeWidth={4} />
    </g>
  </svg>
);

// 放大镜：用于 DNS 查询的具象隐喻
const Magnifier: React.FC<{f: number; x: number; y: number; s?: number; delay?: number}> = ({f, x, y, s = 1, delay = 0}) => (
  <svg width={W} height={H} style={{position: "absolute", left: 0, top: 0, overflow: "visible", pointerEvents: "none"}}>
    <g transform={`translate(${x},${y}) rotate(-24) scale(${s})`} opacity={prog(f, delay, 14)}>
      <circle cx={0} cy={0} r={58} fill="rgba(255,255,255,0.84)" stroke={INK} strokeWidth={7} />
      <path d="M 42 42 L 112 112" stroke={INK} strokeWidth={18} strokeLinecap="round" />
      <path d="M -28 -7 L 28 -7 M -28 13 L 13 13" stroke={BLUE_E} strokeWidth={5} strokeLinecap="round" />
    </g>
  </svg>
);

// 浏览器窗口
const BrowserWin: React.FC<{f: number; x: number; y: number; w?: number; h?: number; delay?: number}> = ({f, x, y, w = 260, h = 190, delay = 0}) => (
  <svg width={W} height={H} style={{position: "absolute", left: 0, top: 0, overflow: "visible", pointerEvents: "none"}}>
    <path d={sketchRectPath(x, y, w, h, 3)} fill="rgba(255,255,255,0.9)" stroke={INK} strokeWidth={6} opacity={prog(f, delay, 16)} />
    <path d={`M ${x + 2} ${y + 40} L ${x + w - 2} ${y + 40}`} stroke={INK} strokeWidth={4.5} opacity={prog(f, delay + 6, 8)} />
    {[0, 1, 2].map((i) => (
      <circle key={i} cx={x + 26 + i * 26} cy={y + 20} r={7} fill={i === 0 ? RED : i === 1 ? "#e8b93c" : GREEN_E} opacity={prog(f, delay + 8 + i * 3, 6)} />
    ))}
    <path d={`M ${x + 24} ${y + 72} L ${x + w - 24} ${y + 72} M ${x + 24} ${y + 104} L ${x + w - 60} ${y + 104} M ${x + 24} ${y + 136} L ${x + w - 90} ${y + 136}`}
      stroke="#9aa5ad" strokeWidth={4} strokeLinecap="round" opacity={prog(f, delay + 12, 10)} />
  </svg>
);

// 信封（带编号）
const Envelope: React.FC<{x: number; y: number; num: string; s?: number; rot?: number; op?: number}> = ({x, y, num, s = 1, rot = 0, op = 1}) => (
  <svg width={140} height={100} style={{position: "absolute", left: x - 70, top: y - 50, overflow: "visible", transform: `rotate(${rot}deg)`, pointerEvents: "none"}}>
    <g transform={`scale(${s})`} opacity={op}>
      <path d={sketchRectPath(0, 8, 120, 76, 4)} fill="rgba(242,202,92,0.4)" stroke={INK} strokeWidth={5.5} strokeLinejoin="round" />
      <path d="M 2 12 L 60 52 L 118 12" fill="none" stroke={INK} strokeWidth={5} strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={96} cy={24} r={17} fill={ORANGE_E} opacity={0.92} />
      <text x={96} y={32} textAnchor="middle" fontFamily="'Microsoft YaHei',sans-serif" fontWeight={900} fontSize={22} fill="#fff">{num}</text>
    </g>
  </svg>
);


// ================= P1 钩子（三拍：问题 → 双协议 → 稳/快冲突） =================
// 拍1 0–45：视频播放+数据包飞行+「视频为什么不卡？」
// 拍2 45–78：TCP / UDP 大字登场
// 拍3 78–130：分屏 稳/快

const PageHook: React.FC<{off: number}> = ({off}) => {
  const f = useCurrentFrame() - off;
  // 拍1：数据包从右侧服务器飞向左侧播放器
  const t1 = interpolate(f, [14, 52], [0, 1], clamp);
  const p1 = t1 > 0 && t1 < 1 ? {x: 1460 - 900 * t1, y: 520 - Math.sin(Math.PI * t1) * 90} : null;
  const q1 = interpolate(f, [34, 70], [0, 1], clamp);
  const p2 = q1 > 0 && q1 < 1 ? {x: 1460 - 900 * q1, y: 520 - Math.sin(Math.PI * q1) * 130} : null;
  // 拍1 元素在拍2前淡出
  const fade1 = interpolate(f, [108, 120], [1, 0], clamp);
  // 拍2 大字
  const in2 = prog(f, 112, 12);
  const fade2 = interpolate(f, [238, 248], [1, 0], clamp);
  const o2 = in2 * fade2;
  // 拍3 分屏（s02 后半句「一个更追求可靠/速度」起点 ~240）
  const in3 = prog(f, 242, 14);
  const vsIn = prog(f, 256, 10);
  return (
    <AbsoluteFill>
      {/* ---- 拍1 ---- */}
      <div style={{position: "absolute", left: 0, top: 0, width: W, height: H, opacity: fade1}}>
        <VideoPlayer f={f} x={520} y={520} s={1.15} delay={0} />
        <div style={{
          position: "absolute", left: 320, top: 680, width: 400, textAlign: "center",
          fontFamily: B_FONT, fontSize: 32, color: SUBC, opacity: prog(f, 12, 8),
        }}>你正在看的视频</div>
        <ServerRack f={f} x={1560} y={400} s={0.95} delay={4} />
        <div style={{
          position: "absolute", left: 1455, top: 660, width: 210, textAlign: "center",
          fontFamily: B_FONT, fontSize: 30, color: SUBC, opacity: prog(f, 14, 8),
        }}>远方的服务器</div>
        {p1 ? <Envelope x={p1.x} y={p1.y} num="1" /> : null}
        {p2 ? <Envelope x={p2.x} y={p2.y} num="2" /> : null}
        {/* 核心问题大字：中上区域 */}
        <div style={{
          position: "absolute", top: 120, left: 0, right: 0, textAlign: "center",
          fontFamily: "'Microsoft YaHei',sans-serif", fontWeight: 900, fontSize: 140,
          color: INK, letterSpacing: 6, whiteSpace: "nowrap",
          transform: "rotate(-1deg)",
          opacity: prog(f, 4, 12), textShadow: "8px 8px 0 rgba(201,122,46,0.18)",
        }}>视频<span style={{color: ORANGE_E}}>为什么不卡</span>？</div>
      </div>
      {/* ---- 拍2：TCP / UDP 大字 ---- */}
      <div style={{position: "absolute", left: 0, top: 0, width: W, height: H, opacity: o2, pointerEvents: "none"}}>
        <div style={{
          position: "absolute", top: 340, left: 200, width: 700, textAlign: "center",
          fontFamily: "'Microsoft YaHei',sans-serif", fontWeight: 900, fontSize: 210, color: ORANGE_E,
          transform: `rotate(-2deg) scale(${0.9 + 0.1 * in2})`,
          textShadow: "8px 8px 0 rgba(58,58,58,0.12)",
        }}>TCP</div>
        <div style={{
          position: "absolute", top: 340, left: 1020, width: 700, textAlign: "center",
          fontFamily: "'Microsoft YaHei',sans-serif", fontWeight: 900, fontSize: 210, color: BLUE_E,
          transform: `rotate(2deg) scale(${0.9 + 0.1 * in2})`,
          textShadow: "8px 8px 0 rgba(58,58,58,0.12)",
        }}>UDP</div>
        <div style={{
          position: "absolute", top: 640, left: 0, right: 0, textAlign: "center",
          fontFamily: B_FONT, fontSize: 44, color: INK, letterSpacing: 10,
          opacity: prog(f, 160, 10),
        }}>背后离不开的两个协议</div>
      </div>
      {/* ---- 拍3：分屏 稳 / 快 ---- */}
      <div style={{position: "absolute", left: 0, top: 0, width: W, height: H, opacity: in3, pointerEvents: "none"}}>
        {/* 左右半屏水彩底 */}
        <WCol f={f} cx={480} cy={560} rx={430} ry={280} color={ORANGE_F} seed={2} delay={82} op={0.55} />
        <WCol f={f} cx={1440} cy={560} rx={430} ry={280} color={BLUE_F} seed={6} delay={86} op={0.55} />
        <div style={{
          position: "absolute", top: 330, left: 130, width: 700, textAlign: "center",
          fontFamily: "'Microsoft YaHei',sans-serif", fontWeight: 900, fontSize: 150, color: ORANGE_E,
          transform: "rotate(-1.5deg)", whiteSpace: "nowrap",
        }}>TCP</div>
        <div style={{
          position: "absolute", top: 470, left: 130, width: 700, textAlign: "center",
          fontFamily: T_FONT, fontSize: 170, color: INK, letterSpacing: 20,
          opacity: prog(f, 250, 12), transform: "rotate(-1deg)",
        }}>稳</div>
        <div style={{
          position: "absolute", top: 330, left: 1090, width: 700, textAlign: "center",
          fontFamily: "'Microsoft YaHei',sans-serif", fontWeight: 900, fontSize: 150, color: BLUE_E,
          transform: "rotate(1.5deg)", whiteSpace: "nowrap",
        }}>UDP</div>
        <div style={{
          position: "absolute", top: 470, left: 1090, width: 700, textAlign: "center",
          fontFamily: T_FONT, fontSize: 170, color: INK, letterSpacing: 20,
          opacity: prog(f, 262, 12), transform: "rotate(1deg)",
        }}>快</div>
        {/* 中央双向箭头 */}
        <Arrow f={f} x={850} y={500} len={110} color={ORANGE_E} sw={7} delay={270} bend={-26} />
        <Arrow f={f} x={960} y={560} len={110} color={BLUE_E} sw={7} delay={276} bend={26} flip />
      </div>
      {/* VS 徽标（拍3 中央上方） */}
      <div style={{
        position: "absolute", top: 180, left: 860, width: 200, textAlign: "center",
        fontFamily: "'Microsoft YaHei',sans-serif", fontWeight: 900, fontSize: 72, color: INK,
        opacity: vsIn, transform: `scale(${0.8 + 0.2 * vsIn}) rotate(-4deg)`,
      }}>VS</div>
    </AbsoluteFill>
  );
};

// ================= P3 生活比喻（两拍：打电话 / 喊话，短镜头不停留） =================

const PageMetaphor: React.FC<{off: number}> = ({off}) => {
  const f = useCurrentFrame() - off;
  // 拍1（0–160f）：TCP 打电话「听到了吗？」「听到了。」
  const fade1 = interpolate(f, [152, 164], [1, 0], clamp);
  // 拍2（160–305）：UDP 喊话后继续跑
  const in2 = prog(f, 158, 12);
  return (
    <AbsoluteFill>
      <HandTitle f={f} text="两种性格" y={64} size={88} delay={0} />
      {/* ---- 拍1：TCP 打电话 ---- */}
      <div style={{position: "absolute", left: 0, top: 0, width: W, height: H, opacity: fade1}}>
        <PhoneSketch f={f} x={520} y={560} s={1.35} delay={2} />
        <div style={{
          position: "absolute", left: 250, top: 760, width: 540, textAlign: "center",
          fontFamily: T_FONT, fontSize: 56, color: ORANGE_E, letterSpacing: 8,
          opacity: prog(f, 8, 10), whiteSpace: "nowrap",
        }}><MixText text="TCP · 打电话" /></div>
        <Stick f={f} x={1420} y={560} s={1.3} pose="point" delay={6} />
        <Bubble f={f} x={600} y={280} w={330} h={96} text="听到了吗？" ts={34} delay={18} tail="br" />
        <Bubble f={f} x={1050} y={300} w={330} h={96} text="听到了" ts={34} delay={42} tail="bl" />
        <div style={{
          position: "absolute", left: 0, right: 0, top: 850, textAlign: "center",
          fontFamily: B_FONT, fontSize: 36, color: INK, opacity: prog(f, 56, 10), whiteSpace: "nowrap",
        }}>先确认你在线 才继续说</div>
      </div>
      {/* ---- 拍2：UDP 喊完就走 ---- */}
      <div style={{position: "absolute", left: 0, top: 0, width: W, height: H, opacity: in2, pointerEvents: "none"}}>
        <Stick f={f} x={430} y={560} s={1.35} pose="cheer" delay={162} />
        <Megaphone f={f} x={600} y={470} s={1.05} delay={166} pulse />
        <Bubble f={f} x={660} y={250} w={380} h={100} text="我发过去了！" ts={36} delay={174} tail="bl" />
        <div style={{
          position: "absolute", left: 170, top: 760, width: 560, textAlign: "center",
          fontFamily: T_FONT, fontSize: 56, color: BLUE_E, letterSpacing: 8,
          opacity: prog(f, 178, 10), whiteSpace: "nowrap",
        }}><MixText text="UDP · 喊完就走" /></div>
        {/* 喊完继续跑：连续三支箭头接力向前 */}
        <Arrow f={f} x={1050} y={540} len={200} color={BLUE_E} sw={7} delay={186} bend={-12} />
        <Arrow f={f} x={1270} y={540} len={200} color={BLUE_E} sw={7} delay={198} bend={-12} />
        <Arrow f={f} x={1490} y={540} len={200} color={BLUE_E} sw={7} delay={210} bend={-12} />
        <div style={{
          position: "absolute", left: 0, right: 0, top: 850, textAlign: "center",
          fontFamily: B_FONT, fontSize: 36, color: INK, opacity: prog(f, 192, 10), whiteSpace: "nowrap",
        }}>不管你听没听到 更不等回话</div>
      </div>
    </AbsoluteFill>
  );
};

// ================= P4 TCP：编号签收 五镜头连续动画 =================
// A 发 1→2→3→4 / B #3 没到 ❌ / C 服务器问「3?」/ D 重发 3→ / E 签收 ✓ 继续

const PageReliable: React.FC<{off: number}> = ({off}) => {
  const f = useCurrentFrame() - off;
  const pos = (t: number, arc = 110) => ({
    x: 480 + 900 * t,
    y: 560 - Math.sin(Math.PI * t) * arc,
  });
  // 镜头A：四连发（编号1-4，间隔紧凑）
  const flight = (d0: number, d1: number) => {
    const t = interpolate(f, [d0, d1], [0, 1], clamp);
    return t > 0 && t < 1 ? pos(t) : null;
  };
  const f1 = flight(8, 36);
  const f2 = flight(16, 44);
  const f3 = flight(24, 52);
  const f4 = flight(32, 60);
  // #3 在服务器前停下 → 坠落（镜头B）
  const t3stop = interpolate(f, [52, 60], [0, 1], clamp);
  const drop3 = interpolate(f, [66, 88], [0, 1], clamp);
  // 镜头C：服务器冒「3?」
  const askIn = prog(f, 96, 12);
  // 镜头D：重发 3
  const t3r = interpolate(f, [122, 148], [0, 1], clamp);
  const p3r = t3r > 0 && t3r < 1 ? pos(t3r) : null;
  // 镜头A 元素在镜头B后弱化
  const dim = interpolate(f, [96, 110], [1, 0.35], clamp);
  return (
    <AbsoluteFill>
      <HandTitle f={f} text={<MixText text="TCP：编号签收" />} y={64} size={88} delay={0} />
      <BrowserWin f={f} x={220} y={470} w={230} h={170} delay={0} />
      <div style={{
        position: "absolute", left: 210, top: 660, width: 250, textAlign: "center",
        fontFamily: B_FONT, fontSize: 30, color: SUBC, opacity: prog(f, 4, 8),
      }}>发送方</div>
      <ServerRack f={f} x={1490} y={450} s={0.95} delay={4} />
      <div style={{
        position: "absolute", left: 1480, top: 700, width: 210, textAlign: "center",
        fontFamily: B_FONT, fontSize: 30, color: SUBC, opacity: prog(f, 8, 8),
      }}>接收方</div>
      {/* 镜头A 四连发 */}
      {f1 ? <Envelope x={f1.x} y={f1.y} num="1" /> : null}
      {f2 ? <Envelope x={f2.x} y={f2.y} num="2" /> : null}
      {f3 ? <Envelope x={f3.x} y={f3.y} num="3" /> : null}
      {f4 ? <Envelope x={f4.x} y={f4.y} num="4" /> : null}
      {/* 到达后的包堆叠在服务器左侧 */}
      <Envelope x={1350} y={560} num="1" op={prog(f, 38, 8) * dim} />
      <Envelope x={1210} y={560} num="2" op={prog(f, 46, 8) * dim} />
      <Envelope x={1350} y={640} num="4" op={prog(f, 62, 8) * dim} />
      {/* 镜头B：#3 没到 ❌（在半路坠落） */}
      {drop3 > 0 ? (
        <>
          <Envelope x={930} y={470 + drop3 * 240} num="3" rot={drop3 * 60} op={1 - drop3 * 0.5} />
          <div style={{
            position: "absolute", left: 830, top: 760, fontFamily: T_FONT, fontSize: 58, color: RED,
            transform: "rotate(-8deg)", opacity: prog(f, 70, 10), whiteSpace: "nowrap",
          }}>3 没到 ✕</div>
        </>
      ) : (
        <Envelope x={480 + 900 * t3stop} y={560 - Math.sin(Math.PI * t3stop) * 110} num="3" op={t3stop > 0 && t3stop < 1 ? 1 : 0} />
      )}
      {/* 镜头C：接收方问「3?」 */}
      {askIn > 0 ? (
        <div style={{opacity: askIn}}>
          <Bubble f={f} x={1380} y={330} w={190} h={92} text="3？" ts={44} delay={96} tail="bl" />
        </div>
      ) : null}
      {/* 镜头D：重发 3 */}
      {p3r ? <Envelope x={p3r.x} y={p3r.y} num="3" /> : null}
      <div style={{
        position: "absolute", left: 700, top: 800, width: 300, textAlign: "center",
        fontFamily: B_FONT, fontSize: 34, fontWeight: 700, color: ORANGE_E,
        opacity: prog(f, 122, 8), whiteSpace: "nowrap",
      }}>重新发 3</div>
      {/* 镜头E：签收 ✓ 继续传输 */}
      <div style={{
        position: "absolute", left: 1430, top: 420, fontFamily: B_FONT, fontSize: 44, fontWeight: 700,
        color: GREEN_E, opacity: prog(f, 154, 10), whiteSpace: "nowrap",
        transform: `scale(${0.8 + 0.2 * prog(f, 154, 10)})`,
      }}>3 收到 ✓</div>
      <Arrow f={f} x={1240} y={760} len={160} color={GREEN_E} sw={6} delay={162} bend={-10} />
      <div style={{
        position: "absolute", left: 1400, top: 800, width: 300, textAlign: "center",
        fontFamily: B_FONT, fontSize: 30, color: SUBC, opacity: prog(f, 168, 8), whiteSpace: "nowrap",
      }}>确认后才继续</div>
    </AbsoluteFill>
  );
};

// ================= P5 UDP：连发不等（节奏比 TCP 快一倍的反差） =================

const PageFast: React.FC<{off: number}> = ({off}) => {
  const f = useCurrentFrame() - off;
  const pos = (t: number, arc: number) => ({
    x: 480 + 900 * t,
    y: 470 - Math.sin(Math.PI * t) * arc,
  });
  // 五连发：间隔 6 帧（TCP 是 8 帧一发且要等确认）
  const flight = (d0: number, d1: number, arc: number) => {
    const t = interpolate(f, [d0, d1], [0, 1], clamp);
    return t > 0 && t < 1 ? pos(t, arc) : null;
  };
  const f1 = flight(4, 22, 60);
  const f2 = flight(10, 28, 100);
  const f3 = flight(16, 34, 80);
  const f4 = flight(22, 40, 60);
  const f5 = flight(28, 46, 100);
  // #3 半路 ×，其余 ✓（无确认过程，直接继续）
  const drop3 = interpolate(f, [34, 52], [0, 1], clamp);
  const reachIn = prog(f, 24, 8);
  return (
    <AbsoluteFill>
      <HandTitle f={f} text={<MixText text="UDP：连续发" />} y={64} size={88} delay={0} />
      <Stick f={f} x={280} y={560} s={1.3} pose="cheer" delay={0} />
      <Megaphone f={f} x={440} y={430} s={0.9} delay={2} pulse />
      <ServerRack f={f} x={1560} y={400} s={0.85} delay={2} />
      <div style={{
        position: "absolute", left: 1455, top: 640, width: 210, textAlign: "center",
        fontFamily: B_FONT, fontSize: 28, color: SUBC, opacity: prog(f, 6, 8),
      }}>接收方</div>
      {/* 五连发 */}
      {f1 ? <Envelope x={f1.x} y={f1.y} num="1" /> : null}
      {f2 ? <Envelope x={f2.x} y={f2.y} num="2" /> : null}
      {f3 ? <Envelope x={f3.x} y={f3.y} num="3" /> : null}
      {f4 ? <Envelope x={f4.x} y={f4.y} num="4" /> : null}
      {f5 ? <Envelope x={f5.x} y={f5.y} num="5" /> : null}
      {/* 1 2 4 5 到达 ✓（不等待，到了就到） */}
      <Envelope x={1380} y={520} num="1" op={prog(f, 24, 6)} />
      <Envelope x={1250} y={520} num="2" op={prog(f, 30, 6)} />
      <Envelope x={1380} y={600} num="4" op={prog(f, 42, 6)} />
      <Envelope x={1250} y={600} num="5" op={prog(f, 48, 6)} />
      <div style={{
        position: "absolute", left: 1440, top: 380, fontFamily: B_FONT, fontSize: 34, fontWeight: 700,
        color: GREEN_E, opacity: reachIn, whiteSpace: "nowrap",
      }}>到了 ✓</div>
      {/* #3 ×：没到也没人等它 */}
      {drop3 > 0 ? (
        <>
          <Envelope x={930} y={390 + drop3 * 220} num="3" rot={drop3 * 65} op={(1 - drop3 * 0.5) * 0.95} />
          <div style={{
            position: "absolute", left: 880, top: 650, fontFamily: T_FONT, fontSize: 52, color: RED,
            transform: "rotate(-6deg)", opacity: prog(f, 38, 8), whiteSpace: "nowrap",
          }}>3 丢了 ✕</div>
        </>
      ) : null}
      {/* 关键反差：不等 不确认 不重传 */}
      <div style={{
        position: "absolute", left: 700, top: 760, width: 560, textAlign: "center",
        fontFamily: B_FONT, fontSize: 38, fontWeight: 700, color: BLUE_E,
        opacity: prog(f, 60, 10), whiteSpace: "nowrap",
      }}>不等 · 不确认 · 不重传</div>
      <div style={{
        position: "absolute", left: 700, top: 830, width: 560, textAlign: "center",
        fontFamily: B_FONT, fontSize: 30, color: SUBC,
        opacity: prog(f, 126, 10), whiteSpace: "nowrap",
      }}>不提供 TCP 那样的可靠机制 换来低延迟</div>
      <Sticker f={f} x={1240} y={730} w={230} h={110} title="快！" rot={6} delay={60} ts={52} color={ORANGE_E} />
    </AbsoluteFill>
  );
};

// ================= P6 选型 =================

const PageChoose: React.FC<{off: number}> = ({off}) => {
  const f = useCurrentFrame() - off;
  const row = (x: number, y: number, txt: string, d0: number, mark: string, mc: string) => (
    <>
      <div style={{
        position: "absolute", left: x + 40, top: y, fontFamily: B_FONT, fontSize: 40, color: INK,
        opacity: prog(f, d0, 10), whiteSpace: "nowrap",
      }}>{txt}</div>
      <div style={{
        position: "absolute", left: x + 330, top: y + 2, fontFamily: B_FONT, fontSize: 36, fontWeight: 700,
        color: mc, opacity: prog(f, d0 + 4, 8), whiteSpace: "nowrap",
      }}>{mark}</div>
    </>
  );
  return (
    <AbsoluteFill>
      <HandTitle f={f} text="什么时候用哪个？" y={64} size={88} delay={2} />
      {/* TCP 场景：浏览器、文件包、支付确认 */}
      <BrowserWin f={f} x={300} y={330} w={110} h={82} delay={12} />
      <FileParcel f={f} x={510} y={335} s={0.28} delay={22} />
      <Envelope x={700} y={335} num="✓" s={0.52} />
      <WCol f={f} cx={520} cy={410} rx={300} ry={44} color={ORANGE_F} seed={3} delay={12} />
      <div style={{
        position: "absolute", left: 260, top: 388, width: 520, textAlign: "center",
        fontFamily: T_FONT, fontSize: 58, color: ORANGE_E, letterSpacing: 10, opacity: prog(f, 16, 10),
      }}><MixText text="TCP 稳" /></div>
      <WBox f={f} x={210} y={450} w={620} h={280} fill="rgba(255,255,255,0.75)" sw={5.5} seed={2} delay={20} dur={16} />
      {row(210, 485, "网页加载", 34, "不能乱", ORANGE_E)}
      {row(210, 555, "文件传输", 48, "不能丢", ORANGE_E)}
      {row(210, 625, "登录支付", 62, "不能错", ORANGE_E)}
      {/* UDP 场景：视频、手柄、放大镜 */}
      <VideoPlayer f={f} x={1200} y={335} s={0.30} delay={22} />
      <GamePad f={f} x={1400} y={335} s={0.28} delay={30} />
      <Magnifier f={f} x={1590} y={335} s={0.34} delay={38} />
      <WCol f={f} cx={1400} cy={410} rx={300} ry={44} color={BLUE_F} seed={7} delay={26} />
      <div style={{
        position: "absolute", left: 1140, top: 388, width: 520, textAlign: "center",
        fontFamily: T_FONT, fontSize: 58, color: BLUE_E, letterSpacing: 10, opacity: prog(f, 30, 10),
      }}><MixText text="UDP 快" /></div>
      <WBox f={f} x={1090} y={450} w={620} h={280} fill="rgba(255,255,255,0.75)" sw={5.5} seed={5} delay={34} dur={16} />
      {row(1090, 485, "直播连麦", 46, "卡了就算了", BLUE_E)}
      {row(1090, 555, "游戏对战", 60, "延迟优先", BLUE_E)}
      {row(1090, 625, "DNS 查询", 74, "问一下就跑", BLUE_E)}
      <Sticker f={f} x={560} y={820} w={800} h={130} title="先问自己一句：这数据 丢得起吗？" rot={-2} delay={120} ts={42} color={ORANGE_E} />
    </AbsoluteFill>
  );
};

// ================= P7 总结四层（对照卡 → 一句话 → 下期钩子 → 关注） =================

const PageGolden: React.FC<{off: number}> = ({off}) => {
  const f = useCurrentFrame() - off;
  // 层1（0–75）：可靠优先/低延迟优先；层2（75–146）：场景一句话；层3（146–251）：下期钩子；层4（251–末尾）：关注
  const fade1 = interpolate(f, [75, 86], [1, 0], clamp);
  const o2 = interpolate(f, [75, 86], [0, 1], clamp) * interpolate(f, [146, 156], [1, 0], clamp);
  const o3 = interpolate(f, [146, 158], [0, 1], clamp) * interpolate(f, [251, 262], [1, 0], clamp);
  const o4 = prog(f, 254, 14);
  return (
    <AbsoluteFill>
      {/* ---- 层1：可靠优先 / 低延迟优先 ---- */}
      <div style={{position: "absolute", left: 0, top: 0, width: W, height: H, opacity: fade1}}>
        <div style={{position: "absolute", top: 300, left: 0, right: 0, display: "flex", justifyContent: "center", gap: 240}}>
          <div style={{position: "relative", textAlign: "center", opacity: prog(f, 4, 12), transform: `rotate(-2deg) scale(${0.92 + 0.08 * prog(f, 4, 12)})`}}>
            <div style={{
              fontFamily: "'Microsoft YaHei',sans-serif", fontWeight: 900, fontSize: 120, color: ORANGE_E, lineHeight: 1.1,
              textShadow: "6px 6px 0 rgba(58,58,58,0.12)",
            }}>TCP</div>
            <div style={{
              fontFamily: T_FONT, fontSize: 150, color: INK, marginTop: 10, letterSpacing: 10,
              opacity: prog(f, 14, 10),
            }}>可靠优先</div>
          </div>
          <div style={{position: "relative", textAlign: "center", opacity: prog(f, 12, 12), transform: `rotate(2deg) scale(${0.92 + 0.08 * prog(f, 12, 12)})`}}>
            <div style={{
              fontFamily: "'Microsoft YaHei',sans-serif", fontWeight: 900, fontSize: 120, color: BLUE_E, lineHeight: 1.1,
              textShadow: "6px 6px 0 rgba(58,58,58,0.12)",
            }}>UDP</div>
            <div style={{
              fontFamily: T_FONT, fontSize: 150, color: INK, marginTop: 10, letterSpacing: 10,
              opacity: prog(f, 22, 10),
            }}>低延迟优先</div>
          </div>
        </div>
        <div style={{
          position: "absolute", top: 720, left: 0, right: 0, textAlign: "center",
          fontFamily: B_FONT, fontSize: 40, color: SUBC, letterSpacing: 4, opacity: prog(f, 34, 10),
        }}>确认 / 快 —— 记住这两个字就够了</div>
        <Bulb f={f} x={1580} y={220} s={1.5} delay={36} />
      </div>
      {/* ---- 层2：场景需要什么 ---- */}
      <div style={{position: "absolute", left: 0, top: 0, width: W, height: H, opacity: o2, pointerEvents: "none"}}>
        <div style={{
          position: "absolute", top: 380, left: 0, right: 0, textAlign: "center",
          fontFamily: T_FONT, fontSize: 92, color: INK, letterSpacing: 6, whiteSpace: "nowrap",
        }}>不是谁更好</div>
        <div style={{
          position: "absolute", top: 380, left: 0, right: 0, textAlign: "center",
          fontFamily: T_FONT, fontSize: 92, color: INK, letterSpacing: 6, whiteSpace: "nowrap",
          opacity: prog(f, 90, 12),
        }}>而是看你的<span style={{color: ORANGE_E}}>场景</span>需要什么</div>
      </div>
      {/* ---- 层3：下期钩子 ---- */}
      <div style={{position: "absolute", left: 0, top: 0, width: W, height: H, opacity: o3, pointerEvents: "none"}}>
        <div style={{
          position: "absolute", top: 300, left: 0, right: 0, textAlign: "center",
          fontFamily: B_FONT, fontSize: 40, color: SUBC, letterSpacing: 8, opacity: prog(f, 150, 10),
        }}>下一期</div>
        <div style={{
          position: "absolute", top: 380, left: 0, right: 0, textAlign: "center",
          fontFamily: "'Microsoft YaHei',sans-serif", fontWeight: 900, fontSize: 88, color: INK,
          letterSpacing: 4, whiteSpace: "nowrap", opacity: prog(f, 158, 12),
          transform: "rotate(-0.8deg)",
        }}>浏览器输入网址后</div>
        <div style={{
          position: "absolute", top: 510, left: 0, right: 0, textAlign: "center",
          fontFamily: "'Microsoft YaHei',sans-serif", fontWeight: 900, fontSize: 88, color: ORANGE_E,
          letterSpacing: 4, whiteSpace: "nowrap", opacity: prog(f, 174, 12),
          transform: "rotate(-0.8deg)",
        }}>到底发生了什么？</div>
        <div style={{position: "absolute", top: 680, left: 0, right: 0, textAlign: "center", opacity: prog(f, 190, 10)}}>
          <svg width={700} height={22} style={{overflow: "visible"}}>
            <Squiggle f={f} x={4} y={11} w={692} delay={194} />
          </svg>
        </div>
      </div>
      {/* ---- 层4：关注（弱营销） ---- */}
      <div style={{position: "absolute", left: 0, top: 0, width: W, height: H, opacity: o4, pointerEvents: "none"}}>
        <div style={{
          position: "absolute", top: 400, left: 0, right: 0, textAlign: "center",
          fontFamily: T_FONT, fontSize: 84, color: INK, letterSpacing: 6, whiteSpace: "nowrap",
        }}>
          <span style={{position: "relative", display: "inline-block"}}>
            关注
            <span style={{color: RED, fontWeight: 700}}>全栈小秋</span>
          </span>
        </div>
        <div style={{
          position: "absolute", top: 540, left: 0, right: 0, textAlign: "center",
          fontFamily: B_FONT, fontSize: 40, color: SUBC, letterSpacing: 4,
          opacity: prog(f, 280, 10), whiteSpace: "nowrap",
        }}>继续把计算机基础讲明白</div>
        <div style={{
          position: "absolute", top: 700, left: 0, right: 0, textAlign: "center",
          fontFamily: B_FONT, fontSize: 30, color: INK, letterSpacing: 4,
          opacity: 0.72 * prog(f, 296, 10),
        }}>小秋 · 0 基础也能学会</div>
      </div>
    </AbsoluteFill>
  );
};

// ================= 组装（10 帧叠化转场） =================

const PAGES = [
  {C: PageHook, start: 0, end: 330},        // s01+s02：问题→双协议→稳/快
  {C: PageMetaphor, start: 330, end: 640},  // s03+s04：打电话/喊话
  {C: PageReliable, start: 640, end: 891},  // s05：编号签收五镜头
  {C: PageFast, start: 891, end: 1202},     // s06：UDP连发反差
  {C: PageChoose, start: 1202, end: 1394},  // s07：场景
  {C: PageGolden, start: 1394, end: DUR},   // s08+s09：总结四层
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

export const TcpVsUdpSketch: React.FC = () => {
  const frame = useCurrentFrame();
  const bedVolume = interpolate(frame, [0, 20, DUR - 40, DUR - 6], [0, 0.07, 0.07, 0], clamp);
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
          <Audio src={staticFile(`audio/tcpudp-tts-v2/${s.audio}`)} volume={1} />
        </Sequence>
      ))}
      {[330, 640, 891, 1202, 1394].map((t) => (
        <Sequence key={`pt-${t}`} from={t - 6} durationInFrames={24}>
          <Audio src={staticFile("audio/sfx/page3.wav")} volume={0.35} />
        </Sequence>
      ))}
      {[652, 662, 672, 682, 901, 908, 915, 922, 929, 1022].map((t) => (
        <Sequence key={`fly-${t}`} from={t} durationInFrames={24}>
          <Audio src={staticFile("audio/sfx/fly3.wav")} volume={0.2} />
        </Sequence>
      ))}
      {[712, 936].map((t) => (
        <Sequence key={`fall-${t}`} from={t} durationInFrames={30}>
          <Audio src={staticFile("audio/sfx/fall3.wav")} volume={0.4} />
        </Sequence>
      ))}
      {[795, 1058, 1450].map((t) => (
        <Sequence key={`warm-${t}`} from={t} durationInFrames={40}>
          <Audio src={staticFile("audio/sfx/warm3.wav")} volume={0.3} />
        </Sequence>
      ))}
      <Audio src={staticFile("audio/bed.wav")} loop volume={() => bedVolume} />
      <Subtitle />
    </AbsoluteFill>
  );
};
