import {interpolate} from "remotion";

// ============ 扁平可爱插画科普风 · 公共组件库（从 PortMapVsTunnel 抽取 + 扩展） ============
// 规范：白底 + 圆角卡片 + 蓝/绿语义双色 + 填充式扁平图标 + 隐喻场景 + 白字黑底条字幕

export const INK = "#2f3a45";
export const SUBC = "#7a8694";
export const BLUE = "#4a86d8";
export const BLUE_BG = "#eaf2fc";
export const GREEN = "#45a56a";
export const GREEN_BG = "#e9f6ee";
export const ORANGE = "#f0912d";
export const ORANGE_BG = "#fdf3e0";
export const RED = "#e05656";
export const RED_BG = "#fdecec";
export const YEL = "#f7c948";
export const BORDER = "#e0e6ec";
export const F = "'Microsoft YaHei', sans-serif";
export const W = 1920;
export const H = 1080;

export const clamp = {extrapolateLeft: "clamp", extrapolateRight: "clamp"} as const;
export const ease = (p: number) => 1 - Math.pow(1 - p, 3);
export const prog = (f: number, delay: number, dur = 12) =>
  interpolate(f, [delay, delay + dur], [0, 1], clamp);

// 背景：柔和圆点网格 + 两处淡淡色块，避免大片死白
export const BgDots: React.FC<{w?: number; h?: number}> = ({w = 1920, h = 1080}) => (
  <svg width={w} height={h} style={{position: "absolute", left: 0, top: 0, pointerEvents: "none"}}>
    <defs>
      <pattern id="flatkit-dots" width="46" height="46" patternUnits="userSpaceOnUse">
        <circle cx="23" cy="23" r="2.6" fill="#dbe4ee" />
      </pattern>
    </defs>
    <rect width={w} height={h} fill="url(#flatkit-dots)" opacity={0.5} />
    <circle cx={150} cy={120} r={190} fill={BLUE_BG} opacity={0.5} />
    <circle cx={w - 140} cy={h - 90} r={220} fill={GREEN_BG} opacity={0.45} />
  </svg>
);

// 大标题：多色分段 + 黄色波浪手绘下划线
export const BigTitle: React.FC<{
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

// 闪光点缀
export const Sparkle: React.FC<{x: number; y: number; s?: number; color?: string}> = ({x, y, s = 1, color = YEL}) => (
  <svg width={54 * s} height={54 * s} style={{position: "absolute", left: x, top: y, overflow: "visible"}}>
    <path d="M 27 2 L 32 22 L 52 27 L 32 32 L 27 52 L 22 32 L 2 27 L 22 22 Z" fill={color} />
  </svg>
);

// 出现时的扩散光环（卡住/报错瞬间用）
export const FlashRing: React.FC<{f: number; at: number; x: number; y: number; color?: string}> = ({f, at, x, y, color = ORANGE}) => {
  const p = prog(f, at, 12);
  if (p <= 0 || p >= 1) return null;
  return (
    <svg width={W} height={H} style={{position: "absolute", left: 0, top: 0, overflow: "visible", pointerEvents: "none"}}>
      <circle cx={x} cy={y} r={22 + 46 * ease(p)} fill="none" stroke={color} strokeWidth={7 * (1 - p)} opacity={1 - p} />
    </svg>
  );
};

// 循环飞行数据包（直线或二次曲线路径）
export const LoopPacket: React.FC<{
  f: number; x1: number; y1: number; x2: number; y2: number; cx?: number; cy?: number;
  color?: string; start: number; period?: number; dur?: number; lift?: number; size?: number;
}> = ({f, x1, y1, x2, y2, cx, cy, color = BLUE, start, period = 56, dur = 26, lift = 0, size = 34}) => {
  if (f < start) return null;
  const raw = (f - start) % period;
  const t = raw / dur;
  if (t <= 0 || t >= 1) return null;
  let px: number, py: number;
  if (cx !== undefined && cy !== undefined) {
    px = (1 - t) * (1 - t) * x1 + 2 * (1 - t) * t * cx + t * t * x2;
    py = (1 - t) * (1 - t) * y1 + 2 * (1 - t) * t * cy + t * t * y2;
  } else {
    px = x1 + (x2 - x1) * t;
    py = y1 + (y2 - y1) * t - Math.sin(Math.PI * t) * lift;
  }
  return (
    <svg width={W} height={H} style={{position: "absolute", left: 0, top: 0, overflow: "visible", pointerEvents: "none"}}>
      <g transform={`translate(${px},${py})`}>
        <rect x={-size / 2} y={-size * 0.4} width={size} height={size * 0.8} rx={8} fill={color} stroke="#fff" strokeWidth={3.5} />
        <circle cx={-size * 0.18} cy={0} r={3.5} fill="#fff" opacity={0.9} />
        <circle cx={size * 0.18} cy={0} r={3.5} fill="#fff" opacity={0.9} />
      </g>
    </svg>
  );
};

// 灯泡（点子 / 记住）
export const BulbFlat: React.FC<{x: number; y: number; s?: number}> = ({x, y, s = 1}) => (
  <svg width={80 * s} height={110 * s} style={{position: "absolute", left: x - 40 * s, top: y - 55 * s, overflow: "visible"}}>
    <circle cx={40} cy={44} r={30} fill={YEL} stroke={INK} strokeWidth={5} />
    <rect x={30} y={72} width={20} height={14} rx={5} fill="#d9a12c" />
    <path d="M 40 4 L 40 -6 M 76 22 L 86 14 M 4 22 L -6 14" stroke="#d9a12c" strokeWidth={5} strokeLinecap="round" />
  </svg>
);

// 虚线贴纸框（强调/警示）
export const Sticker: React.FC<{
  f: number; delay: number; x: number; y: number; w: number; h: number; title: string;
  color?: string; ts?: number;
}> = ({f, d, x, y, w, h, title, color = GREEN, ts = 38}) => {
  const p = prog(f, d);
  if (p <= 0) return null;
  return (
    <div style={{
      position: "absolute", left: x, top: y, width: w, height: h,
      backgroundColor: "#fff", border: `4px dashed ${color}`, borderRadius: 20,
      display: "flex", alignItems: "center", justifyContent: "center",
      fontFamily: F, fontWeight: 900, fontSize: ts, color: INK,
      opacity: p, transform: `scale(${0.9 + 0.1 * p})`,
    }}>{title}</div>
  );
};

// 高亮胶囊条
export const Pill: React.FC<{
  f: number; delay: number; x: number; y: number; w: number; h: number;
  bg?: string; text: string; color?: string; ts?: number;
}> = ({f, d, x, y, w, h, bg = "#f6f8fa", text, color = INK, ts = 30}) => {
  const p = prog(f, d);
  if (p <= 0) return null;
  return (
    <div style={{
      position: "absolute", left: x, top: y, width: w, height: h,
      backgroundColor: bg, borderRadius: h / 2, display: "flex",
      alignItems: "center", justifyContent: "center",
      opacity: p, transform: `scale(${0.9 + 0.1 * ease(p)})`,
    }}>
      <div style={{fontFamily: F, fontWeight: 700, fontSize: ts, color, whiteSpace: "nowrap"}}>{text}</div>
    </div>
  );
};

// Q 版小人（线程 = 房里干活的人）：填充式身体 + 手脚 + 腮红
export const FlatPerson: React.FC<{x: number; y: number; color?: string; s?: number}> = ({x, y, color = GREEN, s = 1}) => (
  <svg width={130 * s} height={180 * s} style={{position: "absolute", left: x - 65 * s, top: y - 90 * s, overflow: "visible"}}>
    <g transform={`scale(${s})`}>
      <ellipse cx={65} cy={162} rx={42} ry={8} fill="#e2e9f2" />
      <rect x={50} y={116} width={13} height={36} rx={6.5} fill="#3f4d5e" />
      <rect x={68} y={116} width={13} height={36} rx={6.5} fill="#3f4d5e" />
      <rect x={43} y={146} width={24} height={11} rx={5.5} fill={INK} />
      <rect x={64} y={146} width={24} height={11} rx={5.5} fill={INK} />
      <path d="M42 86 L20 110" stroke={color} strokeWidth={14} strokeLinecap="round" />
      <path d="M88 86 L110 110" stroke={color} strokeWidth={14} strokeLinecap="round" />
      <circle cx={19} cy={112} r={8} fill="#f6cfa4" />
      <circle cx={111} cy={112} r={8} fill="#f6cfa4" />
      <rect x={36} y={70} width={58} height={56} rx={21} fill={color} />
      <circle cx={65} cy={40} r={28} fill="#f6cfa4" stroke={INK} strokeWidth={4} />
      <path d="M 40 34 Q 65 8 90 34 Q 76 20 65 21 Q 54 20 40 34 Z" fill={INK} />
      <circle cx={55} cy={44} r={4} fill={INK} />
      <circle cx={75} cy={44} r={4} fill={INK} />
      <path d="M 57 54 Q 65 60 73 54" fill="none" stroke={INK} strokeWidth={3.5} strokeLinecap="round" />
      <circle cx={46} cy={52} r={4.5} fill="#f0a8a0" opacity={0.75} />
      <circle cx={84} cy={52} r={4.5} fill="#f0a8a0" opacity={0.75} />
    </g>
  </svg>
);

// 填充式扁平小房子（进程）：屋顶填色 + 双格窗 + 门把手 + 烟囱 + 灌木 + 地面阴影
export const HouseFlat: React.FC<{x: number; y: number; s?: number}> = ({x, y, s = 1}) => (
  <svg width={330 * s} height={330 * s} style={{position: "absolute", left: x - 165 * s, top: y - 165 * s, overflow: "visible"}}>
    <g transform={`scale(${s})`}>
      <ellipse cx={130} cy={300} rx={155} ry={13} fill="#e2e9f2" />
      <rect x={196} y={28} width={36} height={74} rx={7} fill="#8fb3dd" />
      <path d="M-16 142 L130 6 L276 142 Z" fill={BLUE} />
      <path d="M-16 142 L130 6 L276 142" fill="none" stroke={BLUE} strokeWidth={9} strokeLinecap="round" strokeLinejoin="round" />
      <rect x={14} y={140} width={232} height={152} fill={BLUE_BG} stroke={BLUE} strokeWidth={7} />
      <rect x={40} y={172} width={62} height={62} rx={10} fill="#fff" stroke={GREEN} strokeWidth={6} />
      <line x1={71} y1={172} x2={71} y2={234} stroke={GREEN} strokeWidth={4} />
      <line x1={40} y1={203} x2={102} y2={203} stroke={GREEN} strokeWidth={4} />
      <rect x={158} y={172} width={62} height={62} rx={10} fill="#fff" stroke={GREEN} strokeWidth={6} />
      <line x1={189} y1={172} x2={189} y2={234} stroke={GREEN} strokeWidth={4} />
      <line x1={158} y1={203} x2={220} y2={203} stroke={GREEN} strokeWidth={4} />
      <path d="M112 292 L112 228 Q130 210 148 228 L148 292 Z" fill="#fff" stroke={BLUE} strokeWidth={6} />
      <circle cx={139} cy={262} r={5.5} fill={BLUE} />
      <circle cx={4} cy={286} r={17} fill={GREEN_BG} stroke={GREEN} strokeWidth={4.5} />
      <circle cx={258} cy={286} r={17} fill={GREEN_BG} stroke={GREEN} strokeWidth={4.5} />
    </g>
  </svg>
);

// 图标：收消息（对话气泡）
export const IconChat: React.FC<{x: number; y: number; s?: number; c?: string}> = ({x, y, s = 1, c = GREEN}) => (
  <svg width={72 * s} height={72 * s} style={{position: "absolute", left: x - 36 * s, top: y - 36 * s, overflow: "visible"}}>
    <g transform={`scale(${s})`}>
      <path d="M10 12 H62 A10 10 0 0 1 72 22 V44 A10 10 0 0 1 62 54 H38 L22 66 V54 H10 A10 10 0 0 1 0 44 V22 A10 10 0 0 1 10 12 Z" fill="#fff" stroke={c} strokeWidth={5} strokeLinejoin="round" />
      <circle cx={24} cy={33} r={4.5} fill={c} />
      <circle cx={36} cy={33} r={4.5} fill={c} />
      <circle cx={48} cy={33} r={4.5} fill={c} />
    </g>
  </svg>
);

// 图标：刷朋友圈（九宫格）
export const IconGrid: React.FC<{x: number; y: number; s?: number; c?: string}> = ({x, y, s = 1, c = BLUE}) => (
  <svg width={72 * s} height={72 * s} style={{position: "absolute", left: x - 36 * s, top: y - 36 * s, overflow: "visible"}}>
    <g transform={`scale(${s})`}>
      <rect x={4} y={4} width={64} height={64} rx={12} fill="#fff" stroke={c} strokeWidth={5} />
      <rect x={15} y={15} width={19} height={19} rx={4} fill={c} />
      <rect x={38} y={15} width={19} height={19} rx={4} fill={c} opacity={0.55} />
      <rect x={15} y={38} width={19} height={19} rx={4} fill={c} opacity={0.55} />
      <rect x={38} y={38} width={19} height={19} rx={4} fill={c} />
    </g>
  </svg>
);

// 图标：加载图片
export const IconImage: React.FC<{x: number; y: number; s?: number; c?: string}> = ({x, y, s = 1, c = ORANGE}) => (
  <svg width={72 * s} height={72 * s} style={{position: "absolute", left: x - 36 * s, top: y - 36 * s, overflow: "visible"}}>
    <g transform={`scale(${s})`}>
      <rect x={4} y={10} width={64} height={52} rx={10} fill="#fff" stroke={c} strokeWidth={5} />
      <circle cx={24} cy={27} r={5.5} fill={c} />
      <path d="M10 54 L30 36 L44 48 L54 40 L64 50" fill="none" stroke={c} strokeWidth={5} strokeLinecap="round" strokeLinejoin="round" />
    </g>
  </svg>
);

// 转动的加载环
export const SpinnerFlat: React.FC<{f: number; x: number; y: number; d: number; color?: string; s?: number}> = ({f, x, y, d, color = ORANGE, s = 1}) => {
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

// 手机外壳（微信风格：绿头栏 + 灰屏 + 圆角机身）
export const PhoneFrame: React.FC<{f: number; d: number; x: number; y: number; w: number; h: number; title?: string}> = ({f, d, x, y, w, h, title = "微信"}) => {
  const p = prog(f, d);
  if (p <= 0) return null;
  return (
    <div style={{position: "absolute", left: x, top: y, width: w, height: h, opacity: p}}>
      <div style={{
        position: "absolute", inset: 0, backgroundColor: "#f2f4f7",
        border: `6px solid #3f4d5e`, borderRadius: 46,
        boxShadow: "0 18px 38px rgba(47,58,69,0.14)", overflow: "hidden",
      }} />
      <div style={{position: "absolute", left: 0, right: 0, top: 0, height: 64, backgroundColor: GREEN}} />
      <div style={{
        position: "absolute", left: 26, top: 20, width: 0, height: 0,
        borderTop: "12px solid transparent", borderBottom: "12px solid transparent", borderRight: "14px solid #fff",
      }} />
      <div style={{
        position: "absolute", left: 0, right: 0, top: 16, textAlign: "center",
        fontFamily: F, fontWeight: 900, fontSize: 28, color: "#fff", letterSpacing: 4,
      }}>{title}</div>
      <div style={{
        position: "absolute", left: w / 2 - 60, bottom: 12, width: 120, height: 8,
        backgroundColor: "#c9d2dc", borderRadius: 999,
      }} />
    </div>
  );
};

// 云朵（环境点缀）
export const Cloud: React.FC<{x: number; y: number; s?: number; c?: string}> = ({x, y, s = 1, c = "#cddcee"}) => (
  <svg width={160 * s} height={95 * s} style={{position: "absolute", left: x - 80 * s, top: y - 47 * s, overflow: "visible"}}>
    <g transform={`scale(${s})`}>
      <ellipse cx={52} cy={62} rx={46} ry={24} fill={c} />
      <ellipse cx={92} cy={46} rx={36} ry={30} fill={c} />
      <ellipse cx={124} cy={64} rx={30} ry={19} fill={c} />
    </g>
  </svg>
);

// 说话气泡（带指向尾巴）
export const SpeechBubble: React.FC<{f: number; d: number; x: number; y: number; w: number; h: number; text: string; ts?: number; c?: string; bg?: string; tc?: string}> = ({f, d, x, y, w, h, text, ts = 38, c = INK, bg = "#fff", tc = INK}) => {
  const p = prog(f, d);
  if (p <= 0) return null;
  return (
    <div style={{position: "absolute", left: x, top: y, width: w, height: h, opacity: p, transform: `scale(${0.85 + 0.15 * ease(p)})`, transformOrigin: "left center"}}>
      <div style={{position: "absolute", inset: 0, background: bg, border: `4px solid ${c}`, borderRadius: 24, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: F, fontWeight: 900, fontSize: ts, color: tc, textAlign: "center", padding: "0 18px", lineHeight: 1.35}}>{text}</div>
      <svg width={46} height={44} style={{position: "absolute", left: -40, top: h / 2 - 20, overflow: "visible"}}>
        <path d="M44 4 L4 22 L44 40" fill={bg} stroke={c} strokeWidth={4} strokeLinejoin="round" />
      </svg>
    </div>
  );
};

// 漂浮动画：让静态元素"活"起来
export const Float: React.FC<{f: number; x: number; y: number; w: number; h: number; amp?: number; children: React.ReactNode}> = ({f, x, y, w, h, amp = 6, children}) => (
  <div style={{position: "absolute", left: x, top: y, width: w, height: h}}>
    <div style={{transform: `translateY(${Math.sin(f / 13) * amp}px)`}}>{children}</div>
  </div>
);
// 状态标记：正常 / 卡住
export const MarkOk: React.FC<{x: number; y: number; s?: number}> = ({x, y, s = 1}) => (
  <svg width={60 * s} height={60 * s} style={{position: "absolute", left: x - 30 * s, top: y - 30 * s, overflow: "visible"}}>
    <g transform={`scale(${s})`}>
      <circle cx={30} cy={30} r={26} fill={GREEN_BG} />
      <path d="M17 31 L27 41 L44 21" fill="none" stroke={GREEN} strokeWidth={6} strokeLinecap="round" strokeLinejoin="round" />
    </g>
  </svg>
);
export const MarkBad: React.FC<{x: number; y: number; s?: number}> = ({x, y, s = 1}) => (
  <svg width={60 * s} height={60 * s} style={{position: "absolute", left: x - 30 * s, top: y - 30 * s, overflow: "visible"}}>
    <g transform={`scale(${s})`}>
      <circle cx={30} cy={30} r={26} fill={RED_BG} />
      <path d="M19 19 L41 41 M41 19 L19 41" fill="none" stroke={RED} strokeWidth={6} strokeLinecap="round" />
    </g>
  </svg>
);

// 地球（互联网 / 公网）
export const Globe: React.FC<{x: number; y: number; s?: number; c?: string}> = ({x, y, s = 1, c = BLUE}) => (
  <svg width={120 * s} height={120 * s} style={{position: "absolute", left: x - 60 * s, top: y - 60 * s, overflow: "visible"}}>
    <g transform={`scale(${s})`}>
      <circle cx={60} cy={60} r={46} fill="#dbe9fa" stroke={c} strokeWidth={5} />
      <ellipse cx={60} cy={60} rx={20} ry={46} fill="none" stroke={c} strokeWidth={3.5} />
      <line x1={14} y1={60} x2={106} y2={60} stroke={c} strokeWidth={3.5} />
      <path d="M 20 36 Q 60 52 100 36 M 20 84 Q 60 68 100 84" fill="none" stroke={c} strokeWidth={3.5} />
    </g>
  </svg>
);

// 服务器塔
export const ServerIcon: React.FC<{x: number; y: number; s?: number; c?: string}> = ({x, y, s = 1, c = "#55677c"}) => (
  <svg width={110 * s} height={140 * s} style={{position: "absolute", left: x - 55 * s, top: y - 70 * s, overflow: "visible"}}>
    <g transform={`scale(${s})`}>
      <rect x={22} y={8} width={66} height={124} rx={12} fill={c} />
      <rect x={32} y={24} width={46} height={9} rx={4.5} fill="#aebdd0" />
      <rect x={32} y={44} width={46} height={9} rx={4.5} fill="#aebdd0" />
      <rect x={32} y={64} width={46} height={9} rx={4.5} fill="#aebdd0" />
      <circle cx={55} cy={102} r={8} fill="#7ee0a3" />
    </g>
  </svg>
);

// 挂锁（加密 / HTTPS）
export const LockIcon: React.FC<{x: number; y: number; s?: number; c?: string}> = ({x, y, s = 1, c = YEL}) => (
  <svg width={100 * s} height={120 * s} style={{position: "absolute", left: x - 50 * s, top: y - 60 * s, overflow: "visible"}}>
    <g transform={`scale(${s})`}>
      <path d="M 30 42 L 30 28 Q 30 6 50 6 Q 70 6 70 28 L 70 42" fill="none" stroke={INK} strokeWidth={7} />
      <rect x={18} y={42} width={64} height={52} rx={10} fill={c} stroke={INK} strokeWidth={5} />
      <circle cx={50} cy={64} r={7} fill={INK} />
      <rect x={46} y={68} width={8} height={14} rx={4} fill={INK} />
    </g>
  </svg>
);
