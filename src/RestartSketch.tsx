import {Audio} from "@remotion/media";
import {
  AbsoluteFill, interpolate, Sequence, staticFile, useCurrentFrame,
} from "remotion";

// ================= 白板手绘风 v2 · 为什么重启能解决90%的问题（大白体系 + 全栈小秋 IP） =================
// 弧线：钩子(重启试试) -> 内存堆脏东西 -> 重启=清零+草稿纸类比 -> 为什么九成有效 -> 例外 -> 顺序教训 -> 金句 -> CTA
// 结尾预告链：删除片预告了本片，本片预告 Ctrl+C（下一条）

const PAPER = "#fdfcf7";
const INK = "#3a3a3a";
const SUBC = "#8a8579";
const RED = "#c94f4f";
const BLUE_F = "rgba(139,178,216,0.34)";
const BLUE_E = "#5b87ad";
const PINK_E = "#c96a7c";
const GREEN_E = "#4e9464";
const YEL_F = "rgba(242,202,92,0.45)";
const ORANGE_F = "rgba(242,163,94,0.36)";
const ORANGE_E = "#c97a2e";

const T_FONT = "'STXingkai','华文行楷','KaiTi','楷体',serif";
const B_FONT = "'STKaiti','KaiTi','楷体','Microsoft YaHei',serif";

const DUR = 2045;
const W = 1920;
const H = 1080;

const voiceLines = [
  {index: 1, audio: "s01.mp3", start: 0, end: 140},
  {index: 2, audio: "s02.mp3", start: 146, end: 311},
  {index: 3, audio: "s03.mp3", start: 316, end: 554},
  {index: 4, audio: "s04.mp3", start: 559, end: 703},
  {index: 5, audio: "s05.mp3", start: 708, end: 863},
  {index: 6, audio: "s06.mp3", start: 868, end: 1048},
  {index: 7, audio: "s07.mp3", start: 1053, end: 1196},
  {index: 8, audio: "s08.mp3", start: 1201, end: 1324},
  {index: 9, audio: "s09.mp3", start: 1330, end: 1519},
  {index: 10, audio: "s10.mp3", start: 1525, end: 1713},
  {index: 11, audio: "s11.mp3", start: 1719, end: 1866},
  {index: 12, audio: "s12.mp3", start: 1871, end: 2045},
];

type Sub = {s: number; e: number; t: string};
const subs: Sub[] = [
  {s: 0, e: 37, t: "电脑一卡死"},
  {s: 37, e: 111, t: "网友的第一句话永远是"},
  {s: 111, e: 140, t: "重启试试"},
  {s: 146, e: 175, t: "神奇的是"},
  {s: 175, e: 261, t: "重启还真治好了大部分毛病"},
  {s: 261, e: 311, t: "它到底在修什么"},
  {s: 316, e: 348, t: "程序跑久了"},
  {s: 348, e: 412, t: "内存里会堆满临时数据"},
  {s: 412, e: 457, t: "崩溃留下的残渣"},
  {s: 457, e: 502, t: "占着不放的资源"},
  {s: 502, e: 553, t: "还有乱了套的状态"},
  {s: 559, e: 624, t: "这些脏东西没人清理"},
  {s: 624, e: 653, t: "越积越多"},
  {s: 653, e: 703, t: "程序就开始抽风"},
  {s: 708, e: 730, t: "而重启"},
  {s: 730, e: 796, t: "就是把内存整个清空"},
  {s: 796, e: 862, t: "让所有程序从头再来"},
  {s: 868, e: 944, t: "就像考试的草稿纸写满了"},
  {s: 944, e: 972, t: "擦掉重画"},
  {s: 972, e: 1048, t: "比在乱线里找错误快得多"},
  {s: 1053, e: 1099, t: "因为大部分故障"},
  {s: 1099, e: 1157, t: "只是软件的状态乱了"},
  {s: 1157, e: 1196, t: "不是硬件坏了"},
  {s: 1201, e: 1266, t: "所以一张干净的白纸"},
  {s: 1266, e: 1324, t: "就能解决九成问题"},
  {s: 1330, e: 1350, t: "但注意"},
  {s: 1350, e: 1397, t: "如果是硬件坏了"},
  {s: 1397, e: 1465, t: "或者文件本身就损毁了"},
  {s: 1465, e: 1519, t: "重启一百次也没用"},
  {s: 1525, e: 1574, t: "所以记住顺序"},
  {s: 1574, e: 1623, t: "先重启再排查"},
  {s: 1623, e: 1713, t: "重启能好的都不是大毛病"},
  {s: 1719, e: 1756, t: "记住这句话"},
  {s: 1756, e: 1800, t: "重启不是玄学"},
  {s: 1800, e: 1866, t: "是把乱掉的状态清零"},
  {s: 1871, e: 1929, t: "学会了点个赞点个关注"},
  {s: 1929, e: 2010, t: "下期讲你按 Ctrl+C 的瞬间"},
  {s: 2010, e: 2045, t: "电脑做了什么"},
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

const WBox: React.FC<{
  f: number; x: number; y: number; w: number; h: number; fill?: string; stroke?: string;
  sw?: number; seed?: number; delay?: number; dur?: number; fillOp?: number;
}> = ({f, x, y, w, h, fill = "none", stroke = INK, sw = 5, seed = 0, delay = 0, dur = 16, fillOp = 1}) => (
  <Draw f={f} d={sketchRectPath(x, y, w, h, seed)} stroke={stroke} sw={sw} delay={delay} dur={dur} fill={fill} fillOp={fillOp} />
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

const BigX: React.FC<{f: number; x: number; y: number; w: number; h: number; delay?: number; sw?: number}> = ({
  f, x, y, w, h, delay = 0, sw = 10,
}) => (
  <>
    <Draw f={f} d={`M ${x} ${y} L ${x + w} ${y + h}`} stroke={RED} sw={sw} delay={delay} dur={12} />
    <Draw f={f} d={`M ${x + w} ${y} L ${x} ${y + h}`} stroke={RED} sw={sw} delay={delay + 8} dur={12} />
  </>
);

// 卡死的笔记本电脑
const SickLaptop: React.FC<{f: number; x: number; y: number; w?: number; h?: number; delay?: number}> = ({
  f, x, y, w = 360, h = 280, delay = 0,
}) => (
  <>
    <WBox f={f} x={x} y={y} w={w} h={h * 0.7} sw={6} seed={3} delay={delay} dur={18} fill="rgba(210,225,238,0.35)" />
    <Draw f={f} delay={delay + 12} dur={12}
      d={`M ${x - 24} ${y + h * 0.7} L ${x + w + 24} ${y + h * 0.7} L ${x + w + 56} ${y + h * 0.9} L ${x - 56} ${y + h * 0.9} Z`}
      stroke={INK} sw={6} />
    <svg width={W} height={H} style={{position: "absolute", left: 0, top: 0, overflow: "visible", pointerEvents: "none"}}>
      <g opacity={prog(f, delay + 20, 8)}>
        <circle cx={x + w * 0.36} cy={y + h * 0.3} r={6} fill={INK} />
        <circle cx={x + w * 0.64} cy={y + h * 0.3} r={6} fill={INK} />
        <path d={`M ${x + w * 0.36} ${y + h * 0.48} L ${x + w * 0.64} ${y + h * 0.48}`} stroke={INK} strokeWidth={5} strokeLinecap="round" />
        <path d={`M ${x + w * 0.5} ${y + h * 0.12} l 0 -16 m -9 25 a 9 9 0 1 1 18 0`} stroke={BLUE_E} strokeWidth={4.5} fill="none" strokeLinecap="round" />
      </g>
    </svg>
  </>
);

// 电源键
const PowerBtn: React.FC<{f: number; x: number; y: number; r?: number; delay?: number}> = ({
  f, x, y, r = 46, delay = 0,
}) => (
  <Draw f={f} delay={delay} dur={14}
    d={`M ${x} ${y - r * 0.55} L ${x} ${y + r * 0.25} M ${x - r * 0.72} ${y - r * 0.5} a ${r} ${r} 0 1 0 ${r * 1.44} 0`}
    stroke={GREEN_E} sw={7} />
);

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
  }}>全栈小秋</div>
);

// ================= P1 钩子（0:00 完整静态封面） =================

const PageHook: React.FC<{off: number}> = ({off}) => {
  const f = useCurrentFrame() - off;
  return (
    <AbsoluteFill>
      <WCol f={f} cx={1300} cy={540} rx={290} ry={80} color={YEL_F} seed={8} delay={-99} />
      <div style={{
        position: "absolute", top: 120, left: 0, right: 0, textAlign: "center",
        fontFamily: T_FONT, fontSize: 132, color: INK, letterSpacing: 10, whiteSpace: "nowrap",
        transform: "rotate(-1deg)",
      }}>重启试试</div>
      <div style={{
        position: "absolute", top: 336, left: 0, right: 0, textAlign: "center",
        fontFamily: T_FONT, fontSize: 66, color: INK, letterSpacing: 5, whiteSpace: "nowrap",
      }}>
        <span style={{position: "relative", display: "inline-block"}}>
          凭什么能解决 90% 的问题？
          <span style={{position: "absolute", left: "50%", transform: "translateX(-50%)", bottom: -14}}>
            <svg width={860} height={20}>
              <Squiggle f={f} x={4} y={10} w={852} delay={-99} />
            </svg>
          </span>
        </span>
      </div>
      <SickLaptop f={f} x={480} y={510} w={380} h={290} delay={-99} />
      <div style={{
        position: "absolute", left: 505, top: 815, width: 330, textAlign: "center",
        fontFamily: B_FONT, fontSize: 30, color: SUBC, letterSpacing: 3, opacity: 0.8,
      }}>卡死 / 闪退 / 没网</div>
      <Stick f={f} x={1150} y={640} s={1.45} pose="point" delay={-99} />
      <PowerBtn f={f} x={1310} y={560} r={44} delay={-99} />
      <Bubble f={f} x={1400} y={700} w={380} h={104} text="九成都能治" ts={38} delay={-99} tail="br" />
      <Sticker f={f} x={190} y={380} w={340} h={126} title="不是玄学" sub="是有原理的" rot={3} delay={-99} ts={40} color={RED} />
      <div style={{
        position: "absolute", top: 920, left: 0, right: 0, textAlign: "center",
        fontFamily: B_FONT, fontSize: 30, color: INK, letterSpacing: 4, opacity: 0.72,
      }}>全栈小秋 · 0 基础也能学会</div>
    </AbsoluteFill>
  );
};

// ================= P2 内存堆垃圾 =================

const PageMess: React.FC<{off: number}> = ({off}) => {
  const f = useCurrentFrame() - off;
  const cell = (col: number, row: number, seed: number, delay: number) => {
    const x = 250 + col * 280;
    const y = 400 + row * 205;
    const cx = x + 120 + Math.sin(seed * 2.1) * 18;
    const cy = y + 88 + Math.cos(seed * 1.7) * 12;
    return (
      <>
        <WBox f={f} x={x} y={y} w={250} h={180} sw={5} seed={seed} delay={16} dur={10} fill="rgba(255,255,255,0.85)" />
        <WCol f={f} cx={cx} cy={cy} rx={72} ry={50} color={seed % 2 === 0 ? ORANGE_F : "rgba(160,160,160,0.3)"} seed={seed} delay={delay} />
        <WCol f={f} cx={cx + 58} cy={cy + 34} rx={38} ry={28} color="rgba(160,160,160,0.28)" seed={seed + 3} delay={delay + 6} />
      </>
    );
  };
  return (
    <AbsoluteFill>
      <HandTitle f={f} text="内存里堆满了垃圾" y={52} size={92} delay={0} />
      {cell(0, 0, 2, 30)}
      {cell(1, 0, 5, 38)}
      {cell(2, 0, 8, 46)}
      {cell(0, 1, 11, 54)}
      {cell(1, 1, 14, 62)}
      {cell(2, 1, 17, 70)}
      <div style={{
        position: "absolute", left: 250, top: 330, width: 280, textAlign: "center",
        fontFamily: B_FONT, fontSize: 32, color: SUBC, opacity: prog(f, 22, 8), letterSpacing: 3,
      }}>内存条</div>
      {/* 三个标签跟配音走 */}
      <div style={{
        position: "absolute", left: 250, top: 795, width: 280, textAlign: "center",
        fontFamily: B_FONT, fontSize: 32, fontWeight: 700, color: ORANGE_E,
        opacity: prog(f, 95, 10), whiteSpace: "nowrap",
      }}>崩溃残渣</div>
      <div style={{
        position: "absolute", left: 530, top: 795, width: 280, textAlign: "center",
        fontFamily: B_FONT, fontSize: 32, fontWeight: 700, color: BLUE_E,
        opacity: prog(f, 140, 10), whiteSpace: "nowrap",
      }}>占用的资源</div>
      <div style={{
        position: "absolute", left: 810, top: 795, width: 280, textAlign: "center",
        fontFamily: B_FONT, fontSize: 32, fontWeight: 700, color: RED,
        opacity: prog(f, 185, 10), whiteSpace: "nowrap",
      }}>乱掉的状态</div>
      {/* 越积越多：新的小垃圾 */}
      <WCol f={f} cx={585} cy={370} rx={44} ry={30} color="rgba(160,160,160,0.32)" seed={21} delay={299} />
      <WCol f={f} cx={865} cy={370} rx={44} ry={30} color="rgba(160,160,160,0.32)" seed={24} delay={307} />
      <div style={{
        position: "absolute", left: 1180, top: 470, width: 600, textAlign: "center",
        fontFamily: B_FONT, fontSize: 40, color: RED, fontWeight: 700, letterSpacing: 4,
        opacity: prog(f, 242, 10), whiteSpace: "nowrap",
      }}>没人清理 越积越多</div>
      <Stick f={f} x={1620} y={800} s={1.1} pose="cheer" delay={313} />
      <Bubble f={f} x={1300} y={640} w={340} h={98} text="程序开始抽风" ts={32} delay={336} tail="bl" />
    </AbsoluteFill>
  );
};

// ================= P3 重启 = 清零 + 草稿纸类比 =================

const PageClear: React.FC<{off: number}> = ({off}) => {
  const f = useCurrentFrame() - off;
  const junkOp = 1 - prog(f, 9, 24);
  const scribOp = 1 - prog(f, 274, 24);
  return (
    <AbsoluteFill>
      <HandTitle f={f} text="重启做了什么" y={52} size={92} delay={0} />
      {/* 左：内存清空 */}
      <WBox f={f} x={170} y={360} w={560} h={300} sw={6} seed={9} delay={12} dur={16} fill="rgba(255,255,255,0.85)" />
      <div style={{
        position: "absolute", left: 170, top: 312, width: 560, textAlign: "center",
        fontFamily: B_FONT, fontSize: 32, color: SUBC, letterSpacing: 3, opacity: prog(f, 16, 8),
      }}>内存</div>
      {junkOp > 0.01 ? (
        <>
          <WCol f={f} cx={330} cy={470} rx={64} ry={44} color={ORANGE_F} seed={4} delay={0} op={junkOp} />
          <WCol f={f} cx={490} cy={520} rx={58} ry={40} color="rgba(160,160,160,0.3)" seed={7} delay={3} op={junkOp} />
          <WCol f={f} cx={620} cy={450} rx={52} ry={38} color="rgba(160,160,160,0.3)" seed={10} delay={6} op={junkOp} />
        </>
      ) : null}
      <div style={{
        position: "absolute", left: 300, top: 560, width: 340, textAlign: "center",
        fontFamily: B_FONT, fontSize: 42, fontWeight: 700, color: GREEN_E, letterSpacing: 6,
        opacity: prog(f, 21, 12), whiteSpace: "nowrap",
      }}>✓ 全部清空</div>
      <PowerBtn f={f} x={190} y={430} r={40} delay={30} />
      <Arrow f={f} x={240} y={400} len={110} bend={-18} rot={-18} color={GREEN_E} delay={44} sw={6} />
      {/* 右：草稿纸类比 */}
      <WBox f={f} x={1130} y={330} w={340} h={300} sw={5} seed={12} delay={159} dur={14} fill="rgba(255,252,240,0.95)" />
      <div style={{
        position: "absolute", left: 1130, top: 356, width: 340, textAlign: "center",
        fontFamily: B_FONT, fontSize: 30, color: SUBC, opacity: prog(f, 167, 8), letterSpacing: 2,
      }}>写满的草稿纸</div>
      {[430, 470, 510, 550, 590].map((y, i) => (
        <Draw key={i} f={f}
          d={`M 1170 ${y} q 30 ${i % 2 === 0 ? -9 : 9} 60 0 q 30 -9 60 0 q 30 9 60 0 q 30 -9 60 0`}
          stroke={SUBC} sw={4} delay={169 + i * 5} dur={8} op={0.75 * scribOp} />
      ))}
      <Arrow f={f} x={990} y={430} len={110} bend={-16} rot={-10} delay={225} sw={6} />
      <Arrow f={f} x={1462} y={450} len={80} bend={-10} delay={225} color={GREEN_E} sw={6} />
      <WBox f={f} x={1530} y={330} w={340} h={300} sw={5} seed={15} delay={235} dur={14} fill="rgba(255,255,255,0.95)" />
      <div style={{
        position: "absolute", left: 1530, top: 448, width: 340, textAlign: "center",
        fontFamily: B_FONT, fontSize: 44, fontWeight: 700, color: GREEN_E, letterSpacing: 4,
        opacity: prog(f, 249, 10), whiteSpace: "nowrap",
      }}>干干净净</div>
      <div style={{
        position: "absolute", left: 0, right: 0, top: 760, textAlign: "center",
        fontFamily: B_FONT, fontSize: 40, color: INK, fontWeight: 700, letterSpacing: 4,
        opacity: prog(f, 263, 10), whiteSpace: "nowrap",
      }}>
        擦掉重画 &nbsp;比&nbsp; 在乱线里找错误 &nbsp;快得多
      </div>
    </AbsoluteFill>
  );
};

// ================= P4 为什么九成有效 =================

const PageWhy: React.FC<{off: number}> = ({off}) => {
  const f = useCurrentFrame() - off;
  return (
    <AbsoluteFill>
      <HandTitle f={f} text="为什么九成都有效" y={64} delay={0} />
      <WCol f={f} cx={490} cy={540} rx={330} ry={190} color={BLUE_F} seed={2} delay={-1} />
      <WBox f={f} x={190} y={380} w={600} h={320} sw={5} seed={2} delay={1} dur={16} />
      <div style={{
        position: "absolute", left: 190, top: 452, width: 600, textAlign: "center",
        fontFamily: B_FONT, fontSize: 48, color: INK, letterSpacing: 3, opacity: prog(f, 43, 10),
        whiteSpace: "nowrap",
      }}>只是软件的状态乱了</div>
      <div style={{
        position: "absolute", left: 190, top: 560, width: 600, textAlign: "center",
        fontFamily: B_FONT, fontSize: 36, color: SUBC, opacity: prog(f, 101, 10), whiteSpace: "nowrap",
      }}>硬件本身没坏</div>
      <Arrow f={f} x={815} y={510} len={170} bend={-14} delay={139} sw={7} />
      <WCol f={f} cx={1380} cy={530} rx={330} ry={185} color={YEL_F} seed={6} delay={145} />
      <div style={{
        position: "absolute", left: 1060, top: 440, width: 640, textAlign: "center",
        fontFamily: T_FONT, fontSize: 150, color: ORANGE_E, letterSpacing: 8,
        opacity: prog(f, 151, 14), whiteSpace: "nowrap",
      }}>九成</div>
      <div style={{
        position: "absolute", left: 1060, top: 620, width: 640, textAlign: "center",
        fontFamily: B_FONT, fontSize: 38, color: INK, fontWeight: 700, letterSpacing: 3,
        opacity: prog(f, 210, 10), whiteSpace: "nowrap",
      }}>一张白纸就能解决</div>
      <Stick f={f} x={330} y={880} s={1.1} pose="point" delay={230} />
      <Bubble f={f} x={420} y={790} w={430} h={98} text="状态清零就好" ts={34} delay={244} tail="bl" />
    </AbsoluteFill>
  );
};

// ================= P5 例外：重启没用的两种情况 =================

const PageException: React.FC<{off: number}> = ({off}) => {
  const f = useCurrentFrame() - off;
  return (
    <AbsoluteFill>
      <HandTitle f={f} text="但有两种情况" y={64} delay={0} />
      <WBox f={f} x={230} y={330} w={640} h={280} sw={6} seed={5} delay={17} dur={14} fill="rgba(255,255,255,0.9)" />
      <div style={{
        position: "absolute", left: 230, top: 430, width: 640, textAlign: "center",
        fontFamily: B_FONT, fontSize: 52, color: INK, letterSpacing: 5, opacity: prog(f, 25, 10),
        whiteSpace: "nowrap",
      }}>硬件坏了</div>
      <BigX f={f} x={255} y={355} w={590} h={230} delay={54} sw={10} />
      <WBox f={f} x={1070} y={330} w={640} h={280} sw={6} seed={8} delay={66} dur={14} fill="rgba(255,255,255,0.9)" />
      <div style={{
        position: "absolute", left: 1070, top: 430, width: 640, textAlign: "center",
        fontFamily: B_FONT, fontSize: 52, color: INK, letterSpacing: 3, opacity: prog(f, 74, 10),
        whiteSpace: "nowrap",
      }}>文件本身损毁了</div>
      <BigX f={f} x={1095} y={355} w={590} h={230} delay={120} sw={10} />
      <div style={{
        position: "absolute", top: 700, left: 0, right: 0, textAlign: "center",
        fontFamily: B_FONT, fontSize: 48, color: RED, fontWeight: 700, letterSpacing: 6,
        opacity: prog(f, 134, 12), whiteSpace: "nowrap",
      }}>这不是重启能救的</div>
      <Bulb f={f} x={1560} y={210} s={1.3} delay={13} />
    </AbsoluteFill>
  );
};

// ================= P6 正确顺序 =================

const PageOrder: React.FC<{off: number}> = ({off}) => {
  const f = useCurrentFrame() - off;
  const badge = (x: number, num: string, text: string, color: string, fill: string, delay: number) => (
    <>
      <WCol f={f} cx={x + 130} cy={470} rx={185} ry={125} color={fill} seed={x} delay={delay} />
      <WBox f={f} x={x} y={360} w={260} h={220} sw={6} seed={x % 5} delay={delay + 2} dur={12} />
      <div style={{
        position: "absolute", left: x, top: 392, width: 260, textAlign: "center",
        fontFamily: T_FONT, fontSize: 62, color: color, letterSpacing: 4, opacity: prog(f, delay + 6, 10),
      }}>{num}</div>
      <div style={{
        position: "absolute", left: x, top: 474, width: 260, textAlign: "center",
        fontFamily: B_FONT, fontSize: 44, fontWeight: 700, color: INK, letterSpacing: 6,
        opacity: prog(f, delay + 10, 10), whiteSpace: "nowrap",
      }}>{text}</div>
    </>
  );
  return (
    <AbsoluteFill>
      <HandTitle f={f} text="记住这个顺序" y={72} delay={0} />
      {badge(330, "①", "先重启", BLUE_E, BLUE_F, 46)}
      <Arrow f={f} x={620} y={460} len={190} delay={70} sw={7} />
      {badge(830, "②", "再排查", ORANGE_E, ORANGE_F, 76)}
      <WCol f={f} cx={960} cy={800} rx={430} ry={80} color={YEL_F} seed={6} delay={95} />
      <div style={{
        position: "absolute", top: 766, left: 0, right: 0, textAlign: "center",
        fontFamily: B_FONT, fontSize: 44, fontWeight: 700, color: INK, letterSpacing: 4,
        opacity: prog(f, 107, 10), whiteSpace: "nowrap",
      }}>小毛病重启就行 大毛病才要排查</div>
    </AbsoluteFill>
  );
};

// ================= P7 金句（截图卡） =================

const PageAphorism: React.FC<{off: number}> = ({off}) => {
  const f = useCurrentFrame() - off;
  return (
    <AbsoluteFill>
      <WCol f={f} cx={960} cy={440} rx={580} ry={175} color={YEL_F} seed={4} delay={0} />
      <div style={{
        position: "absolute", top: 330, left: 0, right: 0, textAlign: "center",
        fontFamily: T_FONT, fontSize: 116, color: INK, letterSpacing: 10, whiteSpace: "nowrap",
        opacity: prog(f, 4, 12), transform: "rotate(-0.8deg)",
      }}>
        <span style={{position: "relative", display: "inline-block"}}>
          重启 ≠ 玄学
          <span style={{position: "absolute", left: "50%", transform: "translateX(-50%)", bottom: -18}}>
            <svg width={560} height={22}>
              <Squiggle f={f} x={4} y={11} w={552} delay={16} />
            </svg>
          </span>
        </span>
      </div>
      <div style={{
        position: "absolute", top: 540, left: 0, right: 0, textAlign: "center",
        fontFamily: B_FONT, fontSize: 44, color: INK, letterSpacing: 5,
        opacity: prog(f, 72, 12), whiteSpace: "nowrap",
      }}>治得了状态乱 治不了硬件坏</div>
      <Sticker f={f} x={1390} y={200} w={340} h={116} title="觉得有用" sub="截图保存" rot={4} delay={90} ts={34} color={ORANGE_E} />
      <Stick f={f} x={330} y={760} s={1.2} pose="cheer" delay={62} />
    </AbsoluteFill>
  );
};

// ================= P8 结尾 CTA =================

const PageOutro: React.FC<{off: number}> = ({off}) => {
  const f = useCurrentFrame() - off;
  return (
    <AbsoluteFill>
      <div style={{
        position: "absolute", top: 240, left: 0, right: 0, textAlign: "center",
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
        position: "absolute", top: 412, left: 0, right: 0, textAlign: "center",
        fontFamily: B_FONT, fontSize: 38, color: SUBC, letterSpacing: 3,
        opacity: prog(f, 37, 10), whiteSpace: "nowrap",
      }}>顺手点个关注，下期不迷路</div>
      <Sticker f={f} x={430} y={530} w={1060} h={150} title="下期：你按 Ctrl+C 的瞬间" sub="电脑在偷偷干什么" delay={47} ts={46} color={GREEN_E} />
      <Bulb f={f} x={1560} y={250} s={1.4} delay={33} />
      <div style={{
        position: "absolute", top: 772, left: 0, right: 0, textAlign: "center",
        fontFamily: B_FONT, fontSize: 30, color: INK, letterSpacing: 4, opacity: 0.72 * prog(f, 89, 10),
      }}>全栈小秋 · 0 基础也能学会</div>
    </AbsoluteFill>
  );
};

// ================= 组装（10 帧叠化转场） =================

const PAGES = [
  {C: PageHook, start: 0, end: 310},
  {C: PageMess, start: 310, end: 711},
  {C: PageClear, start: 711, end: 1071},
  {C: PageWhy, start: 1071, end: 1346},
  {C: PageException, start: 1346, end: 1545},
  {C: PageOrder, start: 1545, end: 1735},
  {C: PageAphorism, start: 1735, end: 1882},
  {C: PageOutro, start: 1882, end: DUR},
]

const PageTurn: React.FC<{
  children: React.ReactNode; off: number; len: number; first: boolean; last: boolean;
}> = ({children, off, len, first, last}) => {
  const frame = useCurrentFrame();
  const oIn = first ? 1 : interpolate(frame, [0, 10], [0, 1], clamp);
  const lf = frame - off;
  const oOut = last ? 1 : interpolate(lf, [len - 10, len], [1, 0], clamp);
  return <AbsoluteFill style={{opacity: Math.min(oIn, oOut)}}>{children}</AbsoluteFill>;
};

export const RestartSketch: React.FC = () => {
  const frame = useCurrentFrame();
  const bedVolume = interpolate(frame, [0, 20, DUR - 40, DUR - 6], [0, 0.06, 0.06, 0], clamp);
  return (
    <AbsoluteFill style={{backgroundColor: PAPER, overflow: "hidden"}}>
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
      <CornerMark />
      {voiceLines.map((s) => (
        <Sequence key={`vo-${s.index}`} from={s.start} durationInFrames={s.end - s.start + 30}>
          <Audio src={staticFile(`audio/restart-tts-v4/${s.audio}`)} volume={1} />
        </Sequence>
      ))}
      {[311, 703, 1048, 1325, 1520, 1714, 1866].map((t) => (
        <Sequence key={`pt-${t}`} from={t - 6} durationInFrames={24}>
          <Audio src={staticFile("audio/sfx/page3.wav")} volume={0.28} />
        </Sequence>
      ))}
      {/* 动作音效（柔和套件）：清空完成 / 大叉警告 */}
      <Sequence from={724} durationInFrames={30}>
        <Audio src={staticFile("audio/sfx/warm3.wav")} volume={0.22} />
      </Sequence>
      <Sequence from={1379} durationInFrames={30}>
        <Audio src={staticFile("audio/sfx/fall3.wav")} volume={0.18} />
      </Sequence>
      <Audio src={staticFile("audio/bed.wav")} loop volume={() => bedVolume} />
      <Subtitle />
    </AbsoluteFill>
  );
};
