import {Audio} from "@remotion/media";
import {
  AbsoluteFill, interpolate, Sequence, staticFile, useCurrentFrame,
} from "remotion";

// ================= 白板手绘风 v2 · 删除的文件去哪了（大白体系 + 全栈小秋 IP） =================
// 弧线：钩子(删了≠没了) -> 两面利害 -> 仓库/登记本类比 -> 删除=划目录 -> 恢复=翻货架 -> 覆盖=真没了 -> 金句 -> CTA

const PAPER = "#fdfcf7";
const INK = "#3a3a3a";
const SUBC = "#8a8579";
const RED = "#c94f4f";
const BLUE_F = "rgba(139,178,216,0.34)";
const PINK_E = "#c96a7c";
const GREEN_F = "rgba(140,200,150,0.34)";
const GREEN_E = "#4e9464";
const YEL_F = "rgba(242,202,92,0.45)";
const ORANGE_E = "#c97a2e";

const T_FONT = "'STXingkai','华文行楷','KaiTi','楷体',serif";
const B_FONT = "'STKaiti','KaiTi','楷体','Microsoft YaHei',serif";

const DUR = 2066;
const W = 1920;
const H = 1080;

const voiceLines = [
  {index: 1, audio: "s01.mp3", start: 0, end: 114},
  {index: 2, audio: "s02.mp3", start: 120, end: 216},
  {index: 3, audio: "s03.mp3", start: 222, end: 472},
  {index: 4, audio: "s04.mp3", start: 477, end: 631},
  {index: 5, audio: "s05.mp3", start: 636, end: 809},
  {index: 6, audio: "s06.mp3", start: 814, end: 1018},
  {index: 7, audio: "s07.mp3", start: 1023, end: 1184},
  {index: 8, audio: "s08.mp3", start: 1190, end: 1399},
  {index: 9, audio: "s09.mp3", start: 1405, end: 1561},
  {index: 10, audio: "s10.mp3", start: 1566, end: 1767},
  {index: 11, audio: "s11.mp3", start: 1773, end: 1893},
  {index: 12, audio: "s12.mp3", start: 1898, end: 2066},
];

type Sub = {s: number; e: number; t: string};
const subs: Sub[] = [
  {s: 0, e: 57, t: "你删掉的那个文件"},
  {s: 57, e: 114, t: "其实还躺在硬盘里"},
  {s: 120, e: 164, t: "只是你和电脑"},
  {s: 164, e: 216, t: "都假装它不见了"},
  {s: 222, e: 260, t: "这件事有两面"},
  {s: 260, e: 331, t: "误删的文件有机会救回来"},
  {s: 331, e: 402, t: "但卖电脑前只做普通删除"},
  {s: 402, e: 472, t: "你的照片可能被别人恢复"},
  {s: 477, e: 537, t: "硬盘就像一个大仓库"},
  {s: 537, e: 564, t: "每个文件"},
  {s: 564, e: 631, t: "都是仓库里的一件货物"},
  {s: 636, e: 657, t: "而目录"},
  {s: 657, e: 726, t: "就是仓库门口的登记本"},
  {s: 726, e: 809, t: "写着每件货物放在哪个货架"},
  {s: 814, e: 873, t: "你按下删除键的时候"},
  {s: 873, e: 926, t: "电脑只干了一件事"},
  {s: 926, e: 959, t: "在登记本上"},
  {s: 959, e: 1018, t: "把这件货的名字划掉"},
  {s: 1023, e: 1077, t: "货物一毫米都没挪"},
  {s: 1077, e: 1117, t: "只是这块货架"},
  {s: 1117, e: 1184, t: "被标记成了可以放新货"},
  {s: 1190, e: 1234, t: "恢复软件干的事"},
  {s: 1234, e: 1278, t: "就是跳过登记本"},
  {s: 1278, e: 1322, t: "直接去货架上翻"},
  {s: 1322, e: 1398, t: "找出还没被新货盖住的旧货"},
  {s: 1405, e: 1476, t: "那什么时候才是真没了"},
  {s: 1476, e: 1561, t: "这块位置被新文件覆盖之后"},
  {s: 1566, e: 1606, t: "所以误删文件"},
  {s: 1606, e: 1706, t: "第一件事是别再往这个盘里存东西"},
  {s: 1706, e: 1733, t: "越早恢复"},
  {s: 1733, e: 1767, t: "成功率越高"},
  {s: 1773, e: 1811, t: "记住这句话"},
  {s: 1811, e: 1863, t: "删除删的是目录"},
  {s: 1863, e: 1893, t: "不是数据"},
  {s: 1898, e: 1958, t: "学会了点个赞点个关注"},
  {s: 1958, e: 2006, t: "更多数据保存的坑"},
  {s: 2006, e: 2066, t: "我都放在主页合集里了"},
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

// 文件纸（带折角 + 标签）
const FilePaper: React.FC<{
  f: number; x: number; y: number; w: number; h: number; label: string; delay?: number;
  dashed?: boolean; stroke?: string; fill?: string; rot?: number; ts?: number; op?: number;
}> = ({f, x, y, w, h, label, delay = 0, dashed, stroke = INK, fill = "rgba(255,255,255,0.92)", rot = 0, ts = 26, op = 1}) => (
  <div style={{position: "absolute", left: x, top: y, width: w, height: h, opacity: op}}>
    <div style={{position: "absolute", inset: 0, transform: `rotate(${rot}deg)`, transformOrigin: "50% 50%"}}>
      <Draw f={f} d={sketchRectPath(0, 0, w, h, 7)} stroke={stroke} sw={5} delay={delay} dur={14} fill={fill} dashed={dashed} />
      <Draw f={f} d={`M ${w * 0.76} 2 L ${w * 0.76} ${h * 0.26} L ${w - 2} ${h * 0.26}`} stroke={stroke} sw={4} delay={delay + 10} dur={6} />
      <div style={{
        position: "absolute", left: 0, top: h * 0.4 - ts * 0.7, width: w * 0.9, textAlign: "center",
        fontFamily: B_FONT, fontSize: ts, color: INK, fontWeight: 700,
        opacity: prog(f, delay + 8, 10), whiteSpace: "nowrap",
      }}>{label}</div>
      {dashed ? null : (
        <Draw f={f} d={`M ${w * 0.16} ${h * 0.68} L ${w * 0.62} ${h * 0.68} M ${w * 0.16} ${h * 0.84} L ${w * 0.5} ${h * 0.84}`}
          stroke="#9aa5ad" sw={3} delay={delay + 12} dur={6} />
      )}
    </div>
  </div>
);

// 垃圾桶
const TrashBin: React.FC<{f: number; x: number; y: number; w?: number; h?: number; delay?: number}> = ({
  f, x, y, w = 280, h = 320, delay = 0,
}) => (
  <>
    <Draw f={f} delay={delay} dur={14} d={`M ${x - 22} ${y} L ${x + w + 22} ${y}`} stroke={INK} sw={7} />
    <Draw f={f} delay={delay + 6} dur={10} d={`M ${x + w / 2 - 46} ${y - 2} Q ${x + w / 2} ${y - 36} ${x + w / 2 + 46} ${y - 2}`} stroke={INK} sw={6} />
    <Draw f={f} delay={delay + 10} dur={20}
      d={`M ${x + 16} ${y + 10} L ${x + 46} ${y + h} L ${x + w - 46} ${y + h} L ${x + w - 16} ${y + 10}`}
      stroke={INK} sw={6} fill="rgba(210,225,238,0.30)" />
    <Draw f={f} delay={delay + 24} dur={8}
      d={`M ${x + w * 0.36} ${y + 46} L ${x + w * 0.4} ${y + h - 26} M ${x + w * 0.64} ${y + 46} L ${x + w * 0.6} ${y + h - 26}`}
      stroke={INK} sw={4} op={0.55} />
  </>
);

// 红叉
const BigX: React.FC<{f: number; x: number; y: number; w: number; h: number; delay?: number; sw?: number}> = ({
  f, x, y, w, h, delay = 0, sw = 10,
}) => (
  <>
    <Draw f={f} d={`M ${x} ${y} L ${x + w} ${y + h}`} stroke={RED} sw={sw} delay={delay} dur={12} />
    <Draw f={f} d={`M ${x + w} ${y} L ${x} ${y + h}`} stroke={RED} sw={sw} delay={delay + 8} dur={12} />
  </>
);

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

// 黄色描边字幕
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
      <WCol f={f} cx={760} cy={250} rx={420} ry={110} color={BLUE_F} seed={3} delay={-99} />
      <WCol f={f} cx={1250} cy={560} rx={300} ry={80} color={YEL_F} seed={8} delay={-99} />
      <div style={{
        position: "absolute", top: 120, left: 0, right: 0, textAlign: "center",
        fontFamily: T_FONT, fontSize: 132, color: INK, letterSpacing: 8, whiteSpace: "nowrap",
        transform: "rotate(-1deg)",
      }}>删掉的文件去哪了？</div>
      <div style={{
        position: "absolute", top: 340, left: 0, right: 0, textAlign: "center",
        fontFamily: T_FONT, fontSize: 66, color: INK, letterSpacing: 6, whiteSpace: "nowrap",
      }}>
        <span style={{position: "relative", display: "inline-block"}}>
          其实它还躺在硬盘里
          <span style={{position: "absolute", left: "50%", transform: "translateX(-50%)", bottom: -14}}>
            <svg width={680} height={20}>
              <Squiggle f={f} x={4} y={10} w={672} delay={-99} />
            </svg>
          </span>
        </span>
      </div>
      {/* 垃圾桶 + 探头的文件 */}
      <div style={{position: "absolute", left: 640, top: 500, width: 320, height: 60}}>
        <FilePaper f={f} x={70} y={-66} w={180} h={96} label="我的文件" ts={24} rot={-7} delay={-99} />
      </div>
      <TrashBin f={f} x={670} y={530} w={260} h={310} delay={-99} />
      {/* 小登记本伏笔 */}
      <div style={{position: "absolute", left: 300, top: 640, width: 190, height: 130}}>
        <WBox f={f} x={0} y={0} w={190} h={130} sw={5} seed={4} delay={-99} fill="rgba(255,255,255,0.9)" />
        <Draw f={f} d="M 30 40 L 160 40 M 30 72 L 130 72 M 30 104 L 150 104" stroke={SUBC} sw={4} delay={-99} dur={8} op={0.7} />
        <Squiggle f={f} x={26} y={56} w={138} delay={-99} sw={5} />
      </div>
      <Stick f={f} x={1140} y={660} s={1.45} pose="point" delay={-99} />
      <Bubble f={f} x={1275} y={560} w={430} h={112} text="它还在硬盘里！" ts={40} delay={-99} tail="bl" />
      <Sticker f={f} x={240} y={400} w={390} h={140} title="删了 ≠ 没了" sub="恢复的秘密" rot={3} delay={-99} ts={44} color={RED} />
      <div style={{
        position: "absolute", top: 920, left: 0, right: 0, textAlign: "center",
        fontFamily: B_FONT, fontSize: 30, color: INK, letterSpacing: 4, opacity: 0.72,
      }}>全栈小秋 · 0 基础也能学会</div>
    </AbsoluteFill>
  );
};

// ================= P2 两面利害 =================

const PageTwoFaces: React.FC<{off: number}> = ({off}) => {
  const f = useCurrentFrame() - off;
  return (
    <AbsoluteFill>
      <HandTitle f={f} text="这件事有两面" y={64} delay={2} />
      {/* 左：能救回 */}
      <WCol f={f} cx={520} cy={510} rx={345} ry={200} color={GREEN_F} seed={2} delay={27} />
      <WBox f={f} x={190} y={330} w={660} h={360} sw={5} seed={2} delay={29} dur={16} />
      <div style={{
        position: "absolute", left: 190, top: 372, width: 660, textAlign: "center",
        fontFamily: T_FONT, fontSize: 56, color: INK, letterSpacing: 8, opacity: prog(f, 37, 10),
      }}>误删的文件</div>
      <div style={{
        position: "absolute", left: 190, top: 462, width: 660, textAlign: "center",
        fontFamily: B_FONT, fontSize: 36, color: GREEN_E, fontWeight: 700, letterSpacing: 3,
        opacity: prog(f, 49, 10),
      }}>有机会救回来</div>
      <FilePaper f={f} x={430} y={530} w={210} h={110} label="文件回来了" ts={24} delay={59} />
      <Arrow f={f} x={250} y={565} len={160} bend={-24} rot={-14} color={GREEN_E} delay={65} sw={6} />
      {/* 右：隐私风险 */}
      <WCol f={f} cx={1400} cy={510} rx={345} ry={200} color="rgba(233,170,180,0.30)" seed={5} delay={98} />
      <WBox f={f} x={1070} y={330} w={660} h={360} sw={5} seed={5} delay={100} dur={16} />
      <div style={{
        position: "absolute", left: 1070, top: 372, width: 660, textAlign: "center",
        fontFamily: T_FONT, fontSize: 56, color: INK, letterSpacing: 6, opacity: prog(f, 108, 10),
      }}>卖电脑只做删除</div>
      <div style={{
        position: "absolute", left: 1070, top: 462, width: 660, textAlign: "center",
        fontFamily: B_FONT, fontSize: 36, color: RED, fontWeight: 700, letterSpacing: 2,
        opacity: prog(f, 120, 10),
      }}>照片可能被别人恢复</div>
      <FilePaper f={f} x={1310} y={530} w={200} h={110} label="照片.jpg" ts={24} delay={130} />
      <Draw f={f} delay={142} dur={12}
        d={`M 1560 560 a 52 38 0 1 1 104 0 a 52 38 0 1 1 -104 0`} stroke={RED} sw={6} />
      <circle cx={1612} cy={560} r={14} fill={RED} opacity={prog(f, 150, 6)} />
      {/* 底部讲解员 */}
      <Stick f={f} x={940} y={905} s={1.05} pose="cheer" delay={179} />
      <Bubble f={f} x={985} y={755} w={330} h={100} text="一体两面" ts={34} delay={193} tail="bl" />
    </AbsoluteFill>
  );
};

// ================= P3 仓库与登记本 =================

const PageWarehouse: React.FC<{off: number}> = ({off}) => {
  const f = useCurrentFrame() - off;
  const row = (y: number, text: string, delay: number) => (
    <>
      <div style={{
        position: "absolute", left: 1210, top: y, width: 570, textAlign: "center",
        fontFamily: B_FONT, fontSize: 40, color: INK, letterSpacing: 3,
        opacity: prog(f, delay, 10), whiteSpace: "nowrap",
      }}>{text}</div>
      <Draw f={f} d={`M 1260 ${y + 62} L 1730 ${y + 62}`} stroke={SUBC} sw={3} delay={delay + 6} dur={6} op={0.6} />
    </>
  );
  return (
    <AbsoluteFill>
      <HandTitle f={f} text="硬盘是个大仓库" y={52} size={92} delay={0} />
      <div style={{
        position: "absolute", top: 208, left: 0, right: 0, textAlign: "center",
        fontFamily: B_FONT, fontSize: 38, color: SUBC, letterSpacing: 4, opacity: prog(f, 1, 10),
      }}>文件 = 仓库里的一件件货物</div>
      {/* 左：货架 */}
      <WBox f={f} x={140} y={300} w={600} h={540} sw={6} seed={9} delay={7} dur={20} fill="rgba(255,255,255,0.8)" />
      <Draw f={f} d="M 150 495 L 730 495 M 150 685 L 730 685" stroke={INK} sw={5} delay={21} dur={10} />
      <FilePaper f={f} x={190} y={350} w={185} h={112} label="照片.png" ts={22} delay={13} />
      <FilePaper f={f} x={420} y={350} w={185} h={112} label="文档.doc" ts={22} delay={23} />
      <FilePaper f={f} x={190} y={540} w={185} h={112} label="视频.mp4" ts={22} delay={31} />
      <FilePaper f={f} x={420} y={540} w={185} h={112} label="音乐.flac" ts={22} delay={39} />
      <div style={{
        position: "absolute", left: 140, top: 862, width: 600, textAlign: "center",
        fontFamily: B_FONT, fontSize: 32, color: SUBC, letterSpacing: 3, opacity: prog(f, 55, 10),
      }}>货架 = 磁盘上的位置</div>
      {/* 右：登记本 */}
      <WBox f={f} x={1210} y={300} w={570} h={540} sw={6} seed={12} delay={158} dur={20} fill="rgba(255,252,240,0.95)" />
      <div style={{
        position: "absolute", left: 1210, top: 322, width: 570, textAlign: "center",
        fontFamily: T_FONT, fontSize: 46, color: INK, letterSpacing: 6, opacity: prog(f, 168, 10),
      }}>登记本（目录）</div>
      {row(430, "照片.png → 3 号架", 177)}
      {row(550, "文档.doc → 7 号架", 187)}
      {row(670, "视频.mp4 → 9 号架", 197)}
      <Arrow f={f} x={760} y={382} len={420} bend={-34} rot={-6} delay={246} sw={6} />
      <Bubble f={f} x={700} y={620} w={420} h={104} text="名字和货 是两码事" ts={32} delay={264} tail="br" />
    </AbsoluteFill>
  );
};

// ================= P4 删除 = 划掉登记本 =================

const PageDelete: React.FC<{off: number}> = ({off}) => {
  const f = useCurrentFrame() - off;
  return (
    <AbsoluteFill>
      <HandTitle f={f} text="删除时发生了什么" y={52} size={92} delay={0} />
      {/* 左：删除键 + 火柴人 */}
      <Stick f={f} x={255} y={330} s={1.1} pose="point" delay={1} />
      <WBox f={f} x={170} y={440} w={270} h={160} sw={6} seed={3} delay={7} dur={14} fill={BLUE_F} fillOp={0.8} />
      <div style={{
        position: "absolute", left: 170, top: 490, width: 270, textAlign: "center",
        fontFamily: "'Microsoft YaHei', sans-serif", fontWeight: 900, fontSize: 46, color: INK,
        opacity: prog(f, 17, 8), letterSpacing: 2,
      }}>Delete</div>
      <Arrow f={f} x={455} y={500} len={165} bend={-12} delay={54} sw={6} />
      {/* 中：登记本 + 划掉 */}
      <WBox f={f} x={640} y={250} w={640} h={560} sw={6} seed={6} delay={13} dur={18} fill="rgba(255,252,240,0.95)" />
      <div style={{
        position: "absolute", left: 640, top: 272, width: 640, textAlign: "center",
        fontFamily: T_FONT, fontSize: 44, color: INK, letterSpacing: 6, opacity: prog(f, 23, 10),
      }}>登记本</div>
      <div style={{
        position: "absolute", left: 640, top: 386, width: 640, textAlign: "center",
        fontFamily: B_FONT, fontSize: 46, color: INK, letterSpacing: 2, opacity: prog(f, 58, 10),
        whiteSpace: "nowrap",
      }}>旅行照片.jpg</div>
      <div style={{
        position: "absolute", left: 640, top: 508, width: 640, textAlign: "center",
        fontFamily: B_FONT, fontSize: 46, color: INK, letterSpacing: 2, opacity: prog(f, 66, 10),
        whiteSpace: "nowrap",
      }}>工作文档.doc</div>
      <div style={{
        position: "absolute", left: 640, top: 630, width: 640, textAlign: "center",
        fontFamily: B_FONT, fontSize: 46, color: INK, letterSpacing: 2, opacity: prog(f, 74, 10),
        whiteSpace: "nowrap",
      }}>安装包.exe</div>
      <Draw f={f} d="M 700 448 L 1220 448 M 700 570 L 1220 570 M 700 692 L 1220 692" stroke={SUBC} sw={3} delay={82} dur={8} op={0.55} />
      <Squiggle f={f} x={750} y={408} w={420} delay={134} sw={9} />
      <div style={{
        position: "absolute", left: 640, top: 320, width: 640, textAlign: "center",
        fontFamily: B_FONT, fontSize: 32, color: RED, fontWeight: 700, letterSpacing: 4,
        opacity: prog(f, 152, 10),
      }}>这一行 被划掉了</div>
      {/* 右：货还在 */}
      <WBox f={f} x={1400} y={330} w={400} h={300} sw={5} seed={8} delay={206} dur={14} fill="rgba(255,255,255,0.85)" />
      <FilePaper f={f} x={1455} y={380} w={290} h={150} label="旅行照片.jpg" ts={26} delay={218} />
      <div style={{
        position: "absolute", left: 1400, top: 652, width: 400, textAlign: "center",
        fontFamily: B_FONT, fontSize: 40, color: GREEN_E, fontWeight: 700, letterSpacing: 6,
        opacity: prog(f, 232, 10),
      }}>货：没动！</div>
      <Sticker f={f} x={1440} y={730} w={330} h={112} title="标记成 可复用" rot={-3} delay={290} ts={34} color={ORANGE_E} />
      {/* 底部结论云 */}
      <WCol f={f} cx={460} cy={905} rx={310} ry={72} color={YEL_F} seed={6} delay={312} />
      <div style={{
        position: "absolute", left: 200, top: 872, width: 520, textAlign: "center",
        fontFamily: B_FONT, fontSize: 42, fontWeight: 700, color: INK, letterSpacing: 3,
        opacity: prog(f, 326, 10), whiteSpace: "nowrap",
      }}>数据还在原地</div>
    </AbsoluteFill>
  );
};

// ================= P5 恢复 = 跳过登记本直接翻货架 =================

const PageRecover: React.FC<{off: number}> = ({off}) => {
  const f = useCurrentFrame() - off;
  return (
    <AbsoluteFill>
      <HandTitle f={f} text="恢复软件怎么找" y={52} size={92} delay={0} />
      {/* 左：被跳过的登记本 */}
      <WBox f={f} x={180} y={330} w={420} h={380} sw={6} seed={11} delay={1} dur={16} fill="rgba(255,252,240,0.95)" />
      <div style={{
        position: "absolute", left: 180, top: 352, width: 420, textAlign: "center",
        fontFamily: B_FONT, fontSize: 38, color: INK, letterSpacing: 4, opacity: prog(f, 11, 10),
      }}>登记本</div>
      <Draw f={f} d="M 230 460 L 550 460 M 230 530 L 490 530 M 230 600 L 530 600" stroke={SUBC} sw={4} delay={19} dur={8} op={0.6} />
      <BigX f={f} x={210} y={360} w={360} h={320} delay={39} sw={9} />
      <div style={{
        position: "absolute", left: 180, top: 736, width: 420, textAlign: "center",
        fontFamily: B_FONT, fontSize: 40, color: RED, fontWeight: 700, letterSpacing: 6,
        opacity: prog(f, 61, 10),
      }}>跳 过</div>
      {/* 绕过去的箭头 */}
      <Arrow f={f} x={620} y={500} len={580} bend={-110} rot={-10} delay={79} color={ORANGE_E} sw={7} />
      {/* 右：货架 */}
      <WBox f={f} x={1230} y={300} w={560} h={540} sw={6} seed={14} delay={23} dur={18} fill="rgba(255,255,255,0.85)" />
      <Draw f={f} d="M 1240 520 L 1780 520 M 1240 710 L 1780 710" stroke={INK} sw={5} delay={35} dur={10} />
      <FilePaper f={f} x={1270} y={350} w={190} h={118} label="新文件" ts={22} delay={89} />
      <FilePaper f={f} x={1500} y={350} w={210} h={118} label="旅行照片.jpg" ts={20} delay={119} dashed stroke={ORANGE_E} fill="rgba(255,248,238,0.95)" />
      <FilePaper f={f} x={1270} y={550} w={190} h={118} label="日志.log" ts={22} delay={97} />
      {/* 圈出旧货 */}
      <Draw f={f} delay={143} dur={18} dashed
        d={blobPath(1605, 408, 155, 105, 7)} stroke={ORANGE_E} sw={6} />
      <Sticker f={f} x={700} y={230} w={330} h={108} title="直接翻货架" rot={-4} delay={87} ts={34} color={ORANGE_E} />
      {/* 火柴人 + 放大镜 */}
      <Stick f={f} x={430} y={810} s={1.2} pose="point" delay={83} />
      <Draw f={f} delay={99} dur={12}
        d={`M 512 700 a 48 48 0 1 1 96 0 a 48 48 0 1 1 -96 0`} stroke={INK} sw={6} />
      <Draw f={f} delay={107} dur={6} d={`M 598 728 L 648 776`} stroke={INK} sw={7} />
      <Bubble f={f} x={640} y={640} w={400} h={100} text="专挑没人盖的翻" ts={32} delay={159} tail="bl" />
    </AbsoluteFill>
  );
};

// ================= P6 覆盖 = 真没了 + 实用教训 =================

const PageOverwrite: React.FC<{off: number}> = ({off}) => {
  const f = useCurrentFrame() - off;
  const flyT = interpolate(f, [56, 110], [0, 1], clamp);
  const flyX = 1520 + (808 - 1520) * flyT;
  const flyY = 120 + (368 - 120) * flyT - Math.sin(Math.PI * flyT) * 90;
  return (
    <AbsoluteFill>
      <HandTitle f={f} text="什么时候真没了" y={52} size={92} delay={0} />
      <div style={{
        position: "absolute", left: 740, top: 248, width: 440, textAlign: "center",
        fontFamily: B_FONT, fontSize: 32, color: SUBC, letterSpacing: 3, opacity: prog(f, 3, 10),
      }}>磁盘上的一块位置</div>
      <WBox f={f} x={740} y={300} w={440} h={330} sw={6} seed={10} delay={-1} dur={16} fill="rgba(255,255,255,0.85)" />
      <FilePaper f={f} x={810} y={368} w={300} h={170} label="旧数据" ts={30} delay={15} />
      {/* 新文件飞入覆盖 */}
      {flyT > 0 ? (
        <div style={{
          position: "absolute", left: flyX, top: flyY, width: 300, height: 170,
          transform: `rotate(${flyT * 8 - 4}deg)`,
          backgroundColor: "rgba(180,208,232,0.95)", border: `5px solid ${INK}`, borderRadius: 10,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontFamily: B_FONT, fontSize: 32, fontWeight: 700, color: INK,
        }}>新文件</div>
      ) : null}
      <BigX f={f} x={765} y={322} w={390} h={290} delay={118} sw={10} />
      <div style={{
        position: "absolute", left: 740, top: 656, width: 440, textAlign: "center",
        fontFamily: B_FONT, fontSize: 44, color: RED, fontWeight: 700, letterSpacing: 8,
        opacity: prog(f, 136, 10),
      }}>真没了</div>
      <Sticker f={f} x={1250} y={430} w={300} h={110} title="覆盖 = 真没了" rot={3} delay={154} ts={34} color={RED} />
      {/* 实用教训 */}
      <Sticker f={f} x={380} y={780} w={640} h={150} title="误删第一件事：别再写入" sub="越早恢复 成功率越高" delay={188} ts={40} color={GREEN_E} />
      <Bulb f={f} x={1120} y={840} s={1.35} delay={302} />
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
          删除 ≠ 擦除
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
        opacity: prog(f, 28, 12), whiteSpace: "nowrap",
      }}>撕掉的只是目录 货还在货架上</div>
      <Sticker f={f} x={1390} y={200} w={340} h={116} title="觉得有用" sub="截图保存" rot={4} delay={44} ts={34} color={ORANGE_E} />
      <Stick f={f} x={330} y={760} s={1.2} pose="cheer" delay={40} />
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
        opacity: prog(f, 57, 10), whiteSpace: "nowrap",
      }}>顺手点个关注，下期不迷路</div>
      <Sticker f={f} x={430} y={530} w={1060} h={150} title="下期：为什么重启能解决 90% 的问题" sub="更多翻车现场 都在主页合集" delay={103} ts={46} color={GREEN_E} />
      <Bulb f={f} x={1560} y={250} s={1.4} delay={87} />
      <div style={{
        position: "absolute", top: 772, left: 0, right: 0, textAlign: "center",
        fontFamily: B_FONT, fontSize: 30, color: INK, letterSpacing: 4, opacity: 0.72 * prog(f, 141, 10),
      }}>全栈小秋 · 0 基础也能学会</div>
    </AbsoluteFill>
  );
};

// ================= 组装（10 帧叠化转场） =================

const PAGES = [
  {C: PageHook, start: 0, end: 219},
  {C: PageTwoFaces, start: 219, end: 474},
  {C: PageWarehouse, start: 474, end: 811},
  {C: PageDelete, start: 811, end: 1187},
  {C: PageRecover, start: 1187, end: 1402},
  {C: PageOverwrite, start: 1402, end: 1770},
  {C: PageAphorism, start: 1770, end: 1895},
  {C: PageOutro, start: 1895, end: DUR},
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

export const FileDeleteSketch: React.FC = () => {
  const frame = useCurrentFrame();
  const bedVolume = interpolate(frame, [0, 20, DUR - 40, DUR - 6], [0, 0.07, 0.07, 0], clamp);
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
          <Audio src={staticFile(`audio/filedelete-tts-v2/${s.audio}`)} volume={1} />
        </Sequence>
      ))}
      {[219, 474, 811, 1187, 1402, 1770, 1895].map((t) => (
        <Sequence key={`pt-${t}`} from={t - 6} durationInFrames={24}>
          <Audio src={staticFile("audio/sfx/transfer.wav")} volume={0.16} />
        </Sequence>
      ))}
      {/* 动作音效：按下删除 / 划掉 / 圈中旧货 / 覆盖 */}
      <Sequence from={878} durationInFrames={20}>
        <Audio src={staticFile("audio/sfx/click.wav")} volume={0.3} />
      </Sequence>
      <Sequence from={995} durationInFrames={30}>
        <Audio src={staticFile("audio/sfx/error.wav")} volume={0.26} />
      </Sequence>
      <Sequence from={1438} durationInFrames={30}>
        <Audio src={staticFile("audio/sfx/ding.wav")} volume={0.24} />
      </Sequence>
      <Sequence from={1600} durationInFrames={30}>
        <Audio src={staticFile("audio/sfx/pop.wav")} volume={0.3} />
      </Sequence>
      <Audio src={staticFile("audio/bed.wav")} loop volume={() => bedVolume} />
      <Subtitle />
    </AbsoluteFill>
  );
};
