import React from "react";
import {Audio} from "@remotion/media";
import {
  AbsoluteFill, interpolate, Sequence, staticFile, useCurrentFrame,
} from "remotion";

// ================= 白板手绘风 · 浏览器输入网址后发生了什么（旅程型 · 全栈小秋 IP） =================
// 画布基因：速写本纸白底 / 左侧螺旋装订线圈 / 咖啡渍 / 黑墨线稿 / 彩色蜡笔+水彩重点
// 动画：元素随配音逐个描画，页间 10 帧叠化；TCP 握手页呼应上一期（合集联动）

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

export const DUR = 1780;
const W = 1920;
const H = 1080;

type Sub = {s: number; e: number; t: string; kw?: string; kc?: string};
const ORANGE_KW = "#ffb35c";
const BLUE_KW = "#7db3dd";
const subs: Sub[] = [
  {s: 3, e: 77, t: "在地址栏敲下网址 按下回车", kw: "回车", kc: ORANGE_KW},
  {s: 77, e: 142, t: "到页面出现 只要一秒", kw: "一秒", kc: BLUE_KW},
  {s: 142, e: 203, t: "这一秒里 你的请求", kw: "请求", kc: ORANGE_KW},
  {s: 203, e: 237, t: "出门跑了一圈", kw: "跑了一圈", kc: ORANGE_KW},
  {s: 242, e: 299, t: "第一步 DNS解析", kw: "DNS", kc: ORANGE_KW},
  {s: 299, e: 377, t: "浏览器拿着网址问DNS服务器", kw: "DNS服务器", kc: BLUE_KW},
  {s: 377, e: 422, t: "这个名字住在哪", kw: "住在哪", kc: ORANGE_KW},
  {s: 422, e: 467, t: "它就像互联网的通讯录", kw: "通讯录", kc: BLUE_KW},
  {s: 467, e: 517, t: "把域名翻译成IP地址", kw: "IP地址", kc: ORANGE_KW},
  {s: 522, e: 588, t: "第二步 建立TCP连接", kw: "TCP", kc: ORANGE_KW},
  {s: 588, e: 653, t: "浏览器和服务器先打电话确认", kw: "打电话", kc: BLUE_KW},
  {s: 653, e: 718, t: "听得到吗 听到了", kw: "听得到", kc: ORANGE_KW},
  {s: 718, e: 779, t: "这套握手 上一期刚讲过", kw: "上一期", kc: BLUE_KW},
  {s: 784, e: 866, t: "第三步 发送HTTP请求", kw: "HTTP", kc: ORANGE_KW},
  {s: 866, e: 931, t: "浏览器说 我要这个页面", kw: "我要这个页面", kc: BLUE_KW},
  {s: 931, e: 968, t: "服务器找到文件", kw: "找到文件", kc: ORANGE_KW},
  {s: 968, e: 1025, t: "把HTML原路发了回来", kw: "HTML", kc: BLUE_KW},
  {s: 1030, e: 1096, t: "最后一步 浏览器渲染", kw: "渲染", kc: ORANGE_KW},
  {s: 1096, e: 1134, t: "HTML搭骨架", kw: "HTML", kc: BLUE_KW},
  {s: 1134, e: 1171, t: "CSS上皮肤", kw: "CSS", kc: ORANGE_KW},
  {s: 1171, e: 1215, t: "JavaScript管动作", kw: "JavaScript", kc: BLUE_KW},
  {s: 1215, e: 1261, t: "页面这才出现在你眼前", kw: "眼前", kc: ORANGE_KW},
  {s: 1266, e: 1299, t: "整个流程就是", kw: "流程", kc: ORANGE_KW},
  {s: 1299, e: 1373, t: "DNS查地址 TCP建连接", kw: "TCP", kc: BLUE_KW},
  {s: 1373, e: 1444, t: "HTTP拿页面 浏览器做渲染", kw: "渲染", kc: ORANGE_KW},
  {s: 1449, e: 1515, t: "下次按下回车 你就知道", kw: "回车", kc: ORANGE_KW},
  {s: 1515, e: 1546, t: "这一秒的背后", kw: "背后", kc: BLUE_KW},
  {s: 1546, e: 1588, t: "是一场毫秒级的接力赛", kw: "接力赛", kc: ORANGE_KW},
  {s: 1593, e: 1687, t: "关注全栈小秋 把计算机基础讲明白", kw: "全栈小秋", kc: ORANGE_KW},
  {s: 1687, e: 1745, t: "还想听什么 评论区告诉我", kw: "评论区", kc: BLUE_KW},
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

// 火柴人讲解员（复用 TCP/UDP sketch 版式）
const Stick: React.FC<{
  f: number; x: number; y: number; s?: number; delay?: number; color?: string; pose?: "point" | "cheer" | "walk" | "phone";
}> = ({f, x, y, s = 1, delay = 0, color = INK, pose = "point"}) => {
  const p = prog(f, delay, 12);
  if (p <= 0) return null;
  const swing = pose === "walk" ? Math.sin(f / 6) * 9 : 0;
  return (
    <svg width={W} height={H} style={{position: "absolute", left: 0, top: 0, overflow: "visible", pointerEvents: "none"}}>
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

// 手绘服务器机架
const ServerSketch: React.FC<{f: number; x: number; y: number; s?: number; delay?: number; w?: number}> = ({
  f, x, y, s = 1, delay = 0, w = 200,
}) => {
  const h = w * 1.15;
  const p = prog(f, delay, 14);
  if (p <= 0) return null;
  return (
    <svg width={W} height={H} style={{position: "absolute", left: 0, top: 0, overflow: "visible", pointerEvents: "none"}}>
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

// 浏览器窗口（手绘）
const BrowserSketch: React.FC<{f: number; x: number; y: number; w?: number; delay?: number}> = ({
  f, x, y, w = 560, delay = 0,
}) => {
  const h = w * 0.62;
  return (
    <>
      <WBox f={f} x={x} y={y} w={w} h={h} fill="rgba(255,255,255,0.94)" sw={6} seed={4} delay={delay} />
      <Draw f={f} d={`M ${x + 2} ${y + 52} L ${x + w - 2} ${y + 52}`} stroke={INK} sw={4.5} delay={delay + 8} dur={8} />
      {[0, 1, 2].map((i) => (
        <circle key={i} cx={x + 30 + i * 30} cy={y + 26} r={8} fill={i === 0 ? RED : i === 1 ? "#e8b93c" : GREEN_E} opacity={prog(f, delay + 10 + i * 3, 6)} />
      ))}
      <WBox f={f} x={x + 26} y={y + 74} w={w - 52} h={46} fill="rgba(139,178,216,0.20)" sw={4} seed={9} delay={delay + 12} />
    </>
  );
};

// ================= P1 钩子：首帧完整静态 =================

const PageHook: React.FC<{off: number}> = ({off}) => {
  const f = useCurrentFrame() - off;
  return (
    <AbsoluteFill>
      <div style={{
        position: "absolute", top: 88, left: 0, right: 0, textAlign: "center",
        fontFamily: "'Microsoft YaHei',sans-serif", fontWeight: 900, fontSize: 104,
        color: INK, letterSpacing: 5, whiteSpace: "nowrap", transform: "rotate(-1deg)",
        textShadow: "8px 8px 0 rgba(201,122,46,0.16)",
      }}>按下回车之后，发生了什么？</div>
      <div style={{position: "absolute", top: 232, left: "50%", transform: "translateX(-50%)"}}>
        <svg width={1060} height={22}>
          <Squiggle f={f} x={4} y={11} w={1052} delay={-99} />
        </svg>
      </div>
      {/* 左：浏览器地址栏（0帧完整） */}
      <BrowserSketch f={f} x={170} y={400} w={560} delay={-99} />
      <div style={{
        position: "absolute", left: 196, top: 474, fontFamily: MONO, fontSize: 30, fontWeight: 700,
        color: INK, opacity: prog(f, -99, 1), whiteSpace: "nowrap",
      }}>www.example.com</div>
      {/* 回车键贴纸 */}
      <Sticker f={f} x={560} y={560} w={190} h={86} title="回车 ⏎" rot={-5} delay={-99} ts={36} color={ORANGE_E} />
      {/* 右：远端服务器（0帧完整） */}
      <ServerSketch f={f} x={1560} y={540} s={1.05} delay={-99} />
      <div style={{
        position: "absolute", left: 1430, top: 700, width: 260, textAlign: "center",
        fontFamily: B_FONT, fontSize: 32, color: SUBC,
      }}>远方的服务器</div>
      {/* 中：请求出门（红色虚线路 + 火柴人走路） */}
      <svg width={W} height={H} style={{position: "absolute", left: 0, top: 0, overflow: "visible", pointerEvents: "none"}}>
        <path d="M 780 560 Q 960 470 1330 545" fill="none" stroke={RED} strokeWidth={6} strokeLinecap="round"
          strokeDasharray="18 16" opacity={0.8} />
      </svg>
      <div style={{
        position: "absolute", left: 880, top: 380, fontFamily: T_FONT, fontSize: 64, color: RED,
        transform: "rotate(-6deg)", opacity: prog(f, 200, 12), whiteSpace: "nowrap",
      }}>请求出门了！</div>
      <Stick f={f} x={870} y={648} s={1.2} delay={-99} pose="walk" />
    </AbsoluteFill>
  );
};

// ================= P2 DNS：互联网的通讯录 =================

const PageDNS: React.FC<{off: number}> = ({off}) => {
  const f = useCurrentFrame() - off;
  return (
    <AbsoluteFill>
      <HandTitle f={f} text="第一步：DNS 解析" y={64} size={88} delay={0} />
      {/* 左：浏览器小人发问 */}
      <Stick f={f} x={330} y={600} s={1.25} delay={4} color={BLUE_E} pose="point" />
      <Bubble f={f} x={150} y={330} w={380} h={110} text="这个名字住在哪？" ts={40} delay={132} />
      {/* 右：DNS 通讯录本 */}
      <WBox f={f} x={760} y={280} w={640} h={430} fill="rgba(255,255,255,0.94)" sw={6.5} seed={7} delay={18} />
      <Draw f={f} d={`M 1080 288 L 1080 702`} stroke={INK} sw={4.5} delay={30} dur={10} />
      <div style={{
        position: "absolute", left: 760, top: 220, width: 640, textAlign: "center",
        fontFamily: T_FONT, fontSize: 44, color: INK, letterSpacing: 6, opacity: prog(f, 25, 10),
      }}>DNS 通讯录</div>
      {/* 名字列 */}
      {["www.a.com", "www.b.com"].map((t, i) => (
        <div key={t} style={{
          position: "absolute", left: 810, top: 330 + i * 90,
          fontFamily: MONO, fontSize: 30, color: SUBC, opacity: prog(f, 110 + i * 8, 8), whiteSpace: "nowrap",
        }}>{t}</div>
      ))}
      {/* IP 列（高亮目标行） */}
      <WCol f={f} cx={1270} cy={345} rx={120} ry={30} color={YEL_F} seed={4} delay={200} />
      <div style={{
        position: "absolute", left: 1120, top: 330,
        fontFamily: MONO, fontSize: 30, fontWeight: 700, color: INK,
        opacity: prog(f, 204, 8), whiteSpace: "nowrap",
      }}>142.250.71.14</div>
      <div style={{
        position: "absolute", left: 1120, top: 420,
        fontFamily: MONO, fontSize: 30, color: SUBC, opacity: prog(f, 132, 8), whiteSpace: "nowrap",
      }}>17.253.144.10</div>
      {/* 翻译箭头 */}
      <Arrow f={f} x={370} y={330} len={330} color={ORANGE_E} sw={7} delay={214} bend={-20} />
      {/* 底部结论 */}
      <WCol f={f} cx={960} cy={840} rx={420} ry={54} color={ORANGE_F} seed={3} delay={224} />
      <div style={{
        position: "absolute", left: 0, right: 0, top: 795, textAlign: "center",
        fontFamily: T_FONT, fontSize: 58, color: INK, letterSpacing: 6, whiteSpace: "nowrap",
        opacity: prog(f, 230, 12),
      }}>域名 → IP 地址</div>
    </AbsoluteFill>
  );
};

// ================= P3 TCP 握手（呼应上期） =================

const PageTCP: React.FC<{off: number}> = ({off}) => {
  const f = useCurrentFrame() - off;
  return (
    <AbsoluteFill>
      <HandTitle f={f} text="第二步：建立 TCP 连接" y={64} size={84} delay={0} />
      {/* 左右两个打电话的小人 */}
      <Stick f={f} x={380} y={560} s={1.3} delay={6} color={BLUE_E} pose="phone" />
      <Stick f={f} x={1540} y={560} s={1.3} delay={10} color={GREEN_E} pose="phone" />
      <div style={{
        position: "absolute", left: 250, top: 620, width: 260, textAlign: "center",
        fontFamily: B_FONT, fontSize: 32, color: SUBC, opacity: prog(f, 8, 8),
      }}>浏览器</div>
      <div style={{
        position: "absolute", left: 1410, top: 620, width: 260, textAlign: "center",
        fontFamily: B_FONT, fontSize: 32, color: SUBC, opacity: prog(f, 12, 8),
      }}>服务器</div>
      {/* 对话 */}
      <Bubble f={f} x={470} y={280} w={330} h={104} text="听得到吗？" ts={40} delay={136} />
      <Bubble f={f} x={1120} y={280} w={330} h={104} text="听得到！" ts={40} delay={172} tail="br" color="rgba(232,246,232,0.95)" />
      {/* 握手箭头往返 */}
      <Arrow f={f} x={560} y={520} len={330} color={BLUE_E} sw={6.5} delay={128} bend={-18} />
      <Arrow f={f} x={1360} y={586} len={330} color={GREEN_E} sw={6.5} delay={164} bend={-18} flip />
      {/* 连接建立 */}
      <WCol f={f} cx={960} cy={700} rx={300} ry={48} color={GREEN_F} seed={6} delay={204} />
      <div style={{
        position: "absolute", left: 0, right: 0, top: 660, textAlign: "center",
        fontFamily: T_FONT, fontSize: 60, color: GREEN_E, letterSpacing: 8, whiteSpace: "nowrap",
        opacity: prog(f, 210, 12),
      }}>连接建立！</div>
      {/* 呼应上期贴纸 */}
      <Sticker f={f} x={1180} y={800} w={430} h={104} title="这套握手 上一期刚讲过" sub="TCP：确认到了才继续" rot={-2} delay={210} ts={34} color={ORANGE_E} />
      <Bulb f={f} x={420} y={840} s={1.15} delay={218} />
    </AbsoluteFill>
  );
};

// ================= P4 HTTP 请求与响应 =================

const PageHTTP: React.FC<{off: number}> = ({off}) => {
  const f = useCurrentFrame() - off;
  // 请求/响应小包裹沿箭头移动
  const t1 = interpolate(f, [90, 116], [0, 1], clamp);
  const t2 = interpolate(f, [192, 220], [0, 1], clamp);
  return (
    <AbsoluteFill>
      <HandTitle f={f} text="第三步：发送 HTTP 请求" y={64} size={84} delay={0} />
      <Node f={f} x={170} y={380} w={360} title="浏览器" sub="我要这个页面" color={BLUE_F} delay={6} />
      <Node f={f} x={1390} y={380} w={360} title="服务器" sub="收到 找文件" color={ORANGE_F} delay={14} />
      {/* 请求：去程 */}
      <Arrow f={f} x={590} y={430} len={740} color={BLUE_E} sw={7} delay={44} bend={-30} />
      <Bubble f={f} x={800} y={230} w={360} h={100} text="HTTP：我要这个页面" ts={36} delay={88} />
      {t1 > 0.02 && t1 < 1 ? (
        <div style={{
          position: "absolute", left: 620 + 680 * t1, top: 470 - Math.sin(Math.PI * t1) * 60,
          width: 46, height: 34, borderRadius: 8, backgroundColor: BLUE_E,
          border: `4px solid ${INK}`, opacity: 0.95,
        }} />
      ) : null}
      {/* 响应：回程 */}
      <Arrow f={f} x={1330} y={560} len={740} color={ORANGE_E} sw={7} delay={190} bend={-30} flip />
      <Bubble f={f} x={760} y={640} w={400} h={100} text="HTML 原路发回来" ts={36} delay={218} tail="br" color="rgba(253,243,224,0.95)" />
      {t2 > 0.02 && t2 < 1 ? (
        <div style={{
          position: "absolute", left: 620 + 680 * (1 - t2), top: 600 - Math.sin(Math.PI * t2) * 60,
          width: 56, height: 40, borderRadius: 8, backgroundColor: ORANGE_E,
          border: `4px solid ${INK}`, opacity: 0.95,
        }} />
      ) : null}
      <div style={{
        position: "absolute", left: 0, right: 0, top: 780, textAlign: "center",
        fontFamily: B_FONT, fontSize: 38, color: INK, whiteSpace: "nowrap",
        opacity: prog(f, 214, 12),
      }}>一去一回　页面数据就拿到了</div>
    </AbsoluteFill>
  );
};

// ================= P5 浏览器渲染三步 =================

const PageRender: React.FC<{off: number}> = ({off}) => {
  const f = useCurrentFrame() - off;
  return (
    <AbsoluteFill>
      <HandTitle f={f} text="最后一步：浏览器渲染" y={64} size={84} delay={0} />
      <Node f={f} x={110} y={300} w={380} title={<MixText text="HTML" />} sub="搭骨架" color={BLUE_F} delay={66} />
      <Arrow f={f} x={500} y={360} len={130} color={BLUE_E} sw={6.5} delay={80} />
      <Node f={f} x={640} y={300} w={340} title={<MixText text="CSS" />} sub="上皮肤" color={ORANGE_F} delay={104} />
      <Arrow f={f} x={990} y={360} len={130} color={ORANGE_E} sw={6.5} delay={118} />
      <Node f={f} x={1130} y={300} w={420} title={<MixText text="JavaScript" />} sub="管动作" color={GREEN_F} delay={142} />
      {/* 页面逐块点亮 */}
      <WBox f={f} x={520} y={560} w={880} h={280} fill="rgba(255,255,255,0.94)" sw={6} seed={8} delay={100} />
      <WCol f={f} cx={760} cy={660} rx={170} ry={52} color={BLUE_F} seed={2} delay={150} />
      <WCol f={f} cx={1130} cy={660} rx={170} ry={52} color={ORANGE_F} seed={5} delay={162} />
      <WCol f={f} cx={945} cy={760} rx={280} ry={40} color={GREEN_F} seed={9} delay={174} />
      <div style={{
        position: "absolute", left: 0, right: 0, top: 890, textAlign: "center",
        fontFamily: T_FONT, fontSize: 62, color: INK, letterSpacing: 8, whiteSpace: "nowrap",
        opacity: prog(f, 216, 12),
      }}>页面出现在你眼前</div>
      <Bulb f={f} x={1470} y={560} s={1.2} delay={222} />
    </AbsoluteFill>
  );
};

// ================= P6 全链路总结 =================

const PageSummary: React.FC<{off: number}> = ({off}) => {
  const f = useCurrentFrame() - off;
  const t = interpolate(f, [40, 170], [0, 1], clamp);
  const x = 250 + 1420 * t;
  return (
    <AbsoluteFill>
      <HandTitle f={f} text="一次完整的接力" y={64} size={88} delay={0} />
      <div style={{position: "absolute", top: 360, left: 0, right: 0, display: "flex", justifyContent: "center", gap: 24, alignItems: "center"}}>
        {[
          {t: "DNS 查地址", d: 30, c: BLUE_E},
          {t: "TCP 建连接", d: 68, c: ORANGE_E},
          {t: "HTTP 拿页面", d: 104, c: GREEN_E},
        ].map(({t: tt, d, c}) => (
          <React.Fragment key={tt}>
            <div style={{opacity: prog(f, d, 12), transform: `scale(${0.9 + 0.1 * prog(f, d, 12)})`}}>
              <div style={{
                fontFamily: B_FONT, fontWeight: 700, fontSize: 42, color: INK,
                backgroundColor: "rgba(255,255,255,0.9)", border: `5px solid ${INK}`, borderRadius: 10,
                padding: "20px 28px", whiteSpace: "nowrap",
              }}>{tt}</div>
            </div>
            <span style={{fontFamily: "'Microsoft YaHei',sans-serif", fontWeight: 900, fontSize: 46, color: ORANGE_E, opacity: prog(f, d + 10, 10)}}>→</span>
          </React.Fragment>
        ))}
        <div style={{opacity: prog(f, 150, 12)}}>
          <div style={{
            fontFamily: B_FONT, fontWeight: 700, fontSize: 42, color: INK,
            backgroundColor: YEL_F, border: `5px solid ${INK}`, borderRadius: 10,
            padding: "20px 28px", whiteSpace: "nowrap",
          }}>浏览器渲染</div>
        </div>
      </div>
      {t > 0.02 && t < 1 ? (
        <div style={{
          position: "absolute", left: x, top: 462, width: 28, height: 28, borderRadius: "50%",
          background: ORANGE_E, border: `4px solid ${INK}`, opacity: 0.95,
        }} />
      ) : null}
      {/* 四步口诀 */}
      <WCol f={f} cx={960} cy={720} rx={560} ry={62} color={YEL_F} seed={3} delay={134} />
      <div style={{
        position: "absolute", left: 0, right: 0, top: 668, textAlign: "center",
        fontFamily: T_FONT, fontSize: 66, color: INK, letterSpacing: 10, whiteSpace: "nowrap",
        opacity: prog(f, 140, 12),
      }}>一次点击 四步接力</div>
      <Stick f={f} x={1690} y={880} s={1.1} delay={138} color={GREEN_E} pose="cheer" />
    </AbsoluteFill>
  );
};

// ================= P7 金句（截图卡） =================

const PageGolden: React.FC<{off: number}> = ({off}) => {
  const f = useCurrentFrame() - off;
  return (
    <AbsoluteFill>
      <div style={{
        position: "absolute", top: 200, left: 0, right: 0, textAlign: "center",
        fontFamily: B_FONT, fontSize: 40, color: SUBC, letterSpacing: 6,
        opacity: prog(f, 2, 12),
      }}>下次按下回车 你就知道</div>
      <div style={{
        position: "absolute", top: 340, left: 0, right: 0, textAlign: "center",
        fontFamily: T_FONT, fontSize: 96, color: INK, letterSpacing: 8,
        opacity: prog(f, 76, 14), whiteSpace: "nowrap", transform: "rotate(-0.8deg)",
      }}>这一秒的背后</div>
      <div style={{
        position: "absolute", top: 500, left: 0, right: 0, textAlign: "center",
        fontFamily: T_FONT, fontSize: 116, color: RED, letterSpacing: 10,
        opacity: prog(f, 99, 14), whiteSpace: "nowrap", transform: "rotate(-0.8deg)",
        textShadow: "10px 10px 0 rgba(201,79,79,0.12)",
      }}>是一场毫秒级的接力赛</div>
      <div style={{position: "absolute", top: 700, left: "50%", transform: "translateX(-50%)"}}>
        <svg width={900} height={22}>
          <Squiggle f={f} x={4} y={11} w={892} delay={141} />
        </svg>
      </div>
      <Stick f={f} x={220} y={860} s={1.15} delay={145} color={BLUE_E} pose="cheer" />
      <Bulb f={f} x={1700} y={840} s={1.3} delay={148} />
    </AbsoluteFill>
  );
};

// ================= P8 结尾：四连 CTA + 问观众 =================

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
      <Bubble f={f} x={610} y={640} w={700} h={120} text="还想听什么？评论区告诉我" ts={46} delay={96} />
      <Bulb f={f} x={420} y={700} s={1.25} delay={104} />
      <Bulb f={f} x={1500} y={700} s={1.25} delay={110} />
      <div style={{
        position: "absolute", top: 840, left: 0, right: 0, textAlign: "center",
        fontFamily: B_FONT, fontSize: 32, color: INK, letterSpacing: 4,
        opacity: 0.75 * prog(f, 116, 10),
      }}>全栈小秋 · 0 基础也能学会</div>
    </AbsoluteFill>
  );
};

// ================= 组装（10 帧叠化转场，页边界 = 配音句窗口） =================

const SENT = [0, 239, 519, 781, 1027, 1263, 1447, 1636];
const PAGES = [
  {C: PageHook, start: 0, end: SENT[1]},
  {C: PageDNS, start: SENT[1], end: SENT[2]},
  {C: PageTCP, start: SENT[2], end: SENT[3]},
  {C: PageHTTP, start: SENT[3], end: SENT[4]},
  {C: PageRender, start: SENT[4], end: SENT[5]},
  {C: PageSummary, start: SENT[5], end: SENT[6]},
  {C: PageGolden, start: SENT[6], end: SENT[7]},
  {C: PageOutro, start: SENT[7], end: DUR},
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
  {index: 1, audio: "s01.mp3", start: 0, end: 234},
  {index: 2, audio: "s02.mp3", start: 236, end: 514},
  {index: 3, audio: "s03.mp3", start: 516, end: 776},
  {index: 4, audio: "s04.mp3", start: 778, end: 1022},
  {index: 5, audio: "s05.mp3", start: 1024, end: 1258},
  {index: 6, audio: "s06.mp3", start: 1260, end: 1441},
  {index: 7, audio: "s07.mp3", start: 1443, end: 1585},
  {index: 8, audio: "s08.mp3", start: 1587, end: 1745},
];

export const UrlJourneySketch: React.FC = () => {
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
          <Audio src={staticFile(`audio/url-tts/${s.audio}`)} volume={1} />
        </Sequence>
      ))}
      {[SENT[1], SENT[2], SENT[3], SENT[4], SENT[5], SENT[6], SENT[7]].map((t) => (
        <Sequence key={`pt-${t}`} from={t - 6} durationInFrames={24}>
          <Audio src={staticFile("audio/sfx/page3.wav")} volume={0.35} />
        </Sequence>
      ))}
      {/* 音效：踩在画面动作点上（音量保守，避让人声） */}
      <Sequence from={205} durationInFrames={24}>
        <Audio src={staticFile("audio/sfx/whoosh.wav")} volume={0.22} />
      </Sequence>
      <Sequence from={115} durationInFrames={20}>
        <Audio src={staticFile("audio/sfx/pop.wav")} volume={0.26} />
      </Sequence>
      <Sequence from={100} durationInFrames={20}>
        <Audio src={staticFile("audio/sfx/pop.wav")} volume={0.26} />
      </Sequence>
      <Sequence from={440} durationInFrames={40}>
        <Audio src={staticFile("audio/sfx/warm3.wav")} volume={0.2} />
      </Sequence>
      <Sequence from={647} durationInFrames={24}>
        <Audio src={staticFile("audio/sfx/whoosh.wav")} volume={0.18} />
      </Sequence>
      <Sequence from={655} durationInFrames={20}>
        <Audio src={staticFile("audio/sfx/pop.wav")} volume={0.24} />
      </Sequence>
      <Sequence from={691} durationInFrames={20}>
        <Audio src={staticFile("audio/sfx/pop.wav")} volume={0.24} />
      </Sequence>
      <Sequence from={871} durationInFrames={24}>
        <Audio src={staticFile("audio/sfx/fly3.wav")} volume={0.16} />
      </Sequence>
      <Sequence from={973} durationInFrames={24}>
        <Audio src={staticFile("audio/sfx/fly3.wav")} volume={0.16} />
      </Sequence>
      <Sequence from={1201} durationInFrames={40}>
        <Audio src={staticFile("audio/sfx/success.wav")} volume={0.24} />
      </Sequence>
      {[1644, 1658, 1672, 1686].map((t) => (
        <Sequence key={`cta-${t}`} from={t} durationInFrames={20}>
          <Audio src={staticFile("audio/sfx/pop.wav")} volume={0.26} />
        </Sequence>
      ))}
      <Sequence from={1732} durationInFrames={40}>
        <Audio src={staticFile("audio/sfx/warm3.wav")} volume={0.2} />
      </Sequence>
      <Audio src={staticFile("audio/bed.wav")} loop volume={() => bedVolume} />
      <Subtitle />
    </AbsoluteFill>
  );
};
