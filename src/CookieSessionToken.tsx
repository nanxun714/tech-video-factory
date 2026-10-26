import React from "react";
import {Audio} from "@remotion/media";
import {AbsoluteFill, interpolate, Sequence, staticFile, useCurrentFrame} from "remotion";

// ============ 扁平可爱插画科普风 · Cookie/Session/Token 三件套（batch10 §4，全栈小秋 IP） ============
// 结构：钩子(凭什么记得你) → 三件套总览 → Cookie口袋 → Session档案 → 编号牌多机露馅 → Token随身证件 → 迁移原因 → 金句三连 → 截图卡+CTA
// 语义色（决策型三栏）：Cookie = 蓝 #4a86d8 / Session = 绿 #45a56a / Token = 橙 #f0912d
// 转场：铁律① 纯硬切——Sequence durationInFrames 精确对齐 SENT，无任何叠化/透明度过渡；
//       每页大标题/主视觉容器 delay=-99 随切页即时完整呈现，页内细节按词级锚点弹入。

export const DUR = 1852;

// 各句配音起始帧（页面边界，来自 public/audio/cooksesstoken-tts/timeline.json）
const SENT = [0, 180, 342, 546, 766, 1027, 1287, 1468, 1617];

type Sub = {s: number; e: number; t: string};
const subs: Sub[] = [
  {s: 3, e: 43, t: "登录一次之后"},
  {s: 43, e: 110, t: "每个页面都不用再输密码"},
  {s: 110, e: 177, t: "网站凭什么一直记得你是你"},
  {s: 183, e: 230, t: "靠的是三件套"},
  {s: 230, e: 268, t: "但它们的分工"},
  {s: 268, e: 340, t: "很多人干了三年都没分清"},
  {s: 345, e: 394, t: "Cookie是你浏览器里的"},
  {s: 394, e: 419, t: "小口袋"},
  {s: 419, e: 478, t: "网站把凭证放进去"},
  {s: 478, e: 544, t: "之后每次请求自动帮你带上"},
  {s: 549, e: 599, t: "但口袋谁都能翻"},
  {s: 599, e: 659, t: "直接存密码等于裸奔"},
  {s: 659, e: 741, t: "所以真正的档案放在服务器那边"},
  {s: 741, e: 764, t: "这叫Session"},
  {s: 769, e: 826, t: "浏览器只领一张编号牌"},
  {s: 826, e: 872, t: "服务器凭牌查档案"},
  {s: 872, e: 927, t: "可服务器一多就露馅"},
  {s: 927, e: 963, t: "档案存在A机"},
  {s: 963, e: 998, t: "请求到了B机"},
  {s: 998, e: 1025, t: "查无此人"},
  {s: 1030, e: 1069, t: "于是有了Token"},
  {s: 1069, e: 1107, t: "档案不存服务器"},
  {s: 1107, e: 1159, t: "签成一串防伪字符串"},
  {s: 1159, e: 1195, t: "发给你自己带"},
  {s: 1195, e: 1238, t: "服务器验个签就认"},
  {s: 1238, e: 1285, t: "多少台机器都通用"},
  {s: 1291, e: 1334, t: "很多系统从Session"},
  {s: 1334, e: 1368, t: "迁到Token"},
  {s: 1368, e: 1431, t: "就是被这个多机问题逼的"},
  {s: 1431, e: 1466, t: "不是Token时髦"},
  // 金句段（1468~1617）与屏上金句三连大字同帧，按铁律12停用底部字幕
  {s: 1620, e: 1718, t: "这张三件套对比卡建议截图收藏"},
  {s: 1718, e: 1806, t: "更多高频面试对比在主页合集"},
  {s: 1806, e: 1830, t: "点个关注"},
];

// ---------- 基础原语（本地实现） ----------

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
const W = 1920;
const H = 1080;

const clamp = {extrapolateLeft: "clamp", extrapolateRight: "clamp"} as const;
const ease = (p: number) => 1 - Math.pow(1 - p, 3);
const prog = (f: number, delay: number, dur = 12) =>
  interpolate(f, [delay, delay + dur], [0, 1], clamp);

const BgDots: React.FC = () => (
  <svg width={W} height={H} style={{position: "absolute", left: 0, top: 0, pointerEvents: "none"}}>
    <defs>
      <pattern id="cst-dots" width="46" height="46" patternUnits="userSpaceOnUse">
        <circle cx="23" cy="23" r="2.6" fill="#dbe4ee" />
      </pattern>
    </defs>
    <rect width={W} height={H} fill="url(#cst-dots)" opacity={0.5} />
    <circle cx={150} cy={120} r={190} fill={BLUE_BG} opacity={0.5} />
    <circle cx={W - 140} cy={H - 90} r={220} fill={GREEN_BG} opacity={0.45} />
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
    <div style={{position: "absolute", top: y, left: 0, width: W, textAlign: "center", opacity: p}}>
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
  bg?: string; border?: string; text: string; color?: string; ts?: number; rot?: number;
}> = ({f, delay, x, y, w, h, bg = "#f6f8fa", border = "none", text, color = INK, ts = 30, rot = 0}) => {
  const p = prog(f, delay);
  if (p <= 0) return null;
  return (
    <div style={{
      position: "absolute", left: x, top: y, width: w, height: h,
      backgroundColor: bg, border, borderRadius: h / 2,
      display: "flex", alignItems: "center", justifyContent: "center",
      opacity: p, transform: `scale(${0.9 + 0.1 * ease(p)}) rotate(${rot}deg)`,
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
  f, d, x, y, w, text, color = SUBC, size = 30, weight = 700,
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

const Float: React.FC<{f: number; amp?: number; children: React.ReactNode}> = ({f, amp = 6, children}) => (
  <div style={{width: "100%", height: "100%"}}>
    <div style={{transform: `translateY(${Math.sin(f / 13) * amp}px)`}}>{children}</div>
  </div>
);

// 循环飞行数据包（长停留页保活）
const LoopPacket: React.FC<{
  f: number; x1: number; y1: number; x2: number; y2: number;
  color?: string; start?: number; period?: number; dur?: number; lift?: number; size?: number;
}> = ({f, x1, y1, x2, y2, color = BLUE, start = 0, period = 64, dur = 40, lift = 20, size = 40}) => {
  const t = (((f - start) % period) + period) % period / dur;
  if (f < start) return null;
  if (t > 1) return null;
  const x = x1 + (x2 - x1) * t;
  const y = y1 + (y2 - y1) * t - Math.sin(Math.PI * t) * lift;
  return (
    <div style={{position: "absolute", left: x, top: y, transform: "translate(-50%,-50%)"}}>
      <div style={{
        width: size, height: size * 0.78, borderRadius: 10, backgroundColor: color,
        border: "3px solid #fff", boxShadow: "0 6px 14px rgba(47,58,69,0.18)",
      }} />
    </div>
  );
};

// 一次性飞行（凭证芯片落进口袋 / Token 发给用户），可选落地后消失
const FlyChip: React.FC<{
  f: number; x1: number; y1: number; x2: number; y2: number; t0: number; dur?: number;
  text: string; color?: string; w?: number; h?: number; fs?: number;
}> = ({f, x1, y1, x2, y2, t0, dur = 26, text, color = BLUE, w = 120, h = 56, fs = 26}) => {
  const t = (f - t0) / dur;
  if (t <= 0 || t >= 1) return null;
  const x = x1 + (x2 - x1) * t;
  const y = y1 + (y2 - y1) * t + Math.sin(Math.PI * t) * 10;
  return (
    <div style={{position: "absolute", left: x, top: y, transform: "translate(-50%,-50%)"}}>
      <div style={{
        width: w, height: h, borderRadius: 12, backgroundColor: color,
        border: "3px solid #fff", boxShadow: "0 8px 18px rgba(47,58,69,0.22)",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontFamily: F, fontWeight: 900, fontSize: fs, color: "#fff",
      }}>{text}</div>
    </div>
  );
};

// ---------- 主题图标 ----------

// 口袋（Cookie）：带盖口袋
const PocketIcon: React.FC<{x: number; y: number; s?: number; c?: string}> = ({x, y, s = 1, c = BLUE}) => (
  <svg width={120 * s} height={120 * s} viewBox="0 0 120 120"
    style={{position: "absolute", left: x - 60 * s, top: y - 60 * s, overflow: "visible"}}>
    <path d="M18 44 L60 18 L102 44 Z" fill={c} opacity={0.75} />
    <path d="M18 44 H102 V96 Q102 108 90 108 H30 Q18 108 18 96 Z" fill={c} />
    <path d="M40 44 Q60 66 80 44" fill="none" stroke="#fff" strokeWidth={6} strokeLinecap="round" />
  </svg>
);

// 档案柜（Session）
const CabinetIcon: React.FC<{x: number; y: number; s?: number; c?: string}> = ({x, y, s = 1, c = GREEN}) => (
  <svg width={120 * s} height={120 * s} viewBox="0 0 120 120"
    style={{position: "absolute", left: x - 60 * s, top: y - 60 * s, overflow: "visible"}}>
    <rect x={20} y={14} width={80} height={92} rx={10} fill={c} />
    <rect x={32} y={28} width={56} height={26} rx={6} fill="#fff" opacity={0.92} />
    <rect x={32} y={64} width={56} height={26} rx={6} fill="#fff" opacity={0.92} />
    <rect x={54} y={38} width={12} height={5} rx={2.5} fill={c} />
    <rect x={54} y={74} width={12} height={5} rx={2.5} fill={c} />
  </svg>
);

// 随身证件（Token）
const IdCardIcon: React.FC<{x: number; y: number; s?: number; c?: string}> = ({x, y, s = 1, c = ORANGE}) => (
  <svg width={120 * s} height={120 * s} viewBox="0 0 120 120"
    style={{position: "absolute", left: x - 60 * s, top: y - 60 * s, overflow: "visible"}}>
    <rect x={14} y={26} width={92} height={68} rx={10} fill={c} />
    <circle cx={42} cy={54} r={12} fill="#fff" opacity={0.92} />
    <path d="M28 82 Q42 66 56 82" fill="#fff" opacity={0.92} />
    <rect x={64} y={44} width={30} height={7} rx={3.5} fill="#fff" opacity={0.92} />
    <rect x={64} y={60} width={30} height={7} rx={3.5} fill="#fff" opacity={0.92} />
    <rect x={30} y={88} width={60} height={0} fill="none" />
  </svg>
);

// 编号牌：挂绳 + 牌
const TagIcon: React.FC<{x: number; y: number; s?: number; c?: string; num?: string}> = ({x, y, s = 1, c = BLUE, num = "007"}) => (
  <svg width={120 * s} height={150 * s} viewBox="0 0 120 150"
    style={{position: "absolute", left: x - 60 * s, top: y - 75 * s, overflow: "visible"}}>
    <path d="M60 4 Q30 26 52 46" fill="none" stroke={c} strokeWidth={6} strokeLinecap="round" />
    <rect x={28} y={44} width={64} height={92} rx={12} fill={c} />
    <circle cx={60} cy={58} r={7} fill="#fff" />
    <text x={60} y={112} textAnchor="middle" fontFamily={F} fontWeight={900} fontSize={28} fill="#fff">{num}</text>
  </svg>
);

// 扁平服务器
const ServerIcon: React.FC<{x: number; y: number; s?: number; c?: string}> = ({x, y, s = 1, c = "#5b6b7d"}) => (
  <svg width={120 * s} height={120 * s} viewBox="0 0 120 120"
    style={{position: "absolute", left: x - 60 * s, top: y - 60 * s, overflow: "visible"}}>
    <rect x={22} y={16} width={76} height={30} rx={8} fill={c} />
    <rect x={22} y={54} width={76} height={30} rx={8} fill={c} />
    <rect x={22} y={92} width={76} height={16} rx={6} fill={c} opacity={0.7} />
    <circle cx={38} cy={31} r={5} fill="#fff" />
    <circle cx={38} cy={69} r={5} fill="#fff" />
    <rect x={56} y={28} width={30} height={6} rx={3} fill="#fff" opacity={0.8} />
    <rect x={56} y={66} width={30} height={6} rx={3} fill="#fff" opacity={0.8} />
  </svg>
);

// 绿色对勾
const MarkOk: React.FC<{x: number; y: number; s?: number; c?: string}> = ({x, y, s = 1, c = GREEN}) => (
  <svg width={60 * s} height={60 * s} viewBox="0 0 60 60"
    style={{position: "absolute", left: x - 30 * s, top: y - 30 * s, overflow: "visible"}}>
    <circle cx={30} cy={30} r={28} fill={c} />
    <path d="M17 31 L26 40 L43 21" fill="none" stroke="#fff" strokeWidth={7} strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

// 红叉
const MarkBad: React.FC<{x: number; y: number; s?: number; c?: string}> = ({x, y, s = 1, c = RED}) => (
  <svg width={60 * s} height={60 * s} viewBox="0 0 60 60"
    style={{position: "absolute", left: x - 30 * s, top: y - 30 * s, overflow: "visible"}}>
    <circle cx={30} cy={30} r={28} fill={c} />
    <path d="M20 20 L40 40 M40 20 L20 40" stroke="#fff" strokeWidth={7} strokeLinecap="round" />
  </svg>
);

// 扁平小人
const FlatPerson: React.FC<{x: number; y: number; s?: number; color?: string}> = ({x, y, s = 1, color = BLUE}) => (
  <svg width={140 * s} height={180 * s} viewBox="0 0 140 180"
    style={{position: "absolute", left: x - 70 * s, top: y - 90 * s, overflow: "visible"}}>
    <circle cx={70} cy={44} r={30} fill="#f6cfa4" stroke={INK} strokeWidth={4} />
    <path d="M44 34 Q70 10 96 34 Q88 20 70 22 Q52 20 44 34 Z" fill={INK} />
    <circle cx={60} cy={46} r={3.6} fill={INK} />
    <circle cx={80} cy={46} r={3.6} fill={INK} />
    <path d="M62 56 Q70 61 78 56" fill="none" stroke={INK} strokeWidth={3} strokeLinecap="round" />
    <rect x={40} y={80} width={60} height={64} rx={22} fill={color} />
    <rect x={46} y={142} width={20} height={26} rx={8} fill={INK} />
    <rect x={74} y={142} width={20} height={26} rx={8} fill={INK} />
  </svg>
);

// 浏览器窗口框（含地址栏）
const BrowserFrame: React.FC<{w: number; h: number; addr?: string; children?: React.ReactNode}> = ({w, h, addr = "my.site", children}) => (
  <div style={{position: "absolute", inset: 0}}>
    <div style={{
      position: "absolute", left: 0, top: 0, width: w, height: 52,
      backgroundColor: "#eef2f7", borderTopLeftRadius: 24, borderTopRightRadius: 24,
      borderBottom: `2px solid ${BORDER}`, display: "flex", alignItems: "center", paddingLeft: 20,
    }}>
      {[RED, YEL, GREEN].map((c, i) => (
        <div key={i} style={{width: 14, height: 14, borderRadius: 999, backgroundColor: c, marginRight: 9}} />
      ))}
      <div style={{
        marginLeft: 14, width: w - 150, height: 30, borderRadius: 999, backgroundColor: "#fff",
        border: `2px solid ${BORDER}`, display: "flex", alignItems: "center", paddingLeft: 14,
        fontFamily: F, fontSize: 18, color: SUBC,
      }}>
        <svg width={16} height={16} viewBox="0 0 24 24" style={{marginRight: 8}}>
          <path d="M12 2a5 5 0 0 0-5 5v3H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8a2 2 0 0 0-2-2h-1V7a5 5 0 0 0-5-5zm-3 8V7a3 3 0 0 1 6 0v3H9z" fill={SUBC} />
        </svg>
        {addr}
      </div>
    </div>
    {children}
  </div>
);

// 翻页与字幕：铁律① 硬切——页序列时长精确对齐，无任何透明度过渡
const Subtitle: React.FC = () => {
  const f = useCurrentFrame();
  const cur = subs.find((s) => f >= s.s && f < s.e);
  if (!cur) return null;
  return (
    <div style={{position: "absolute", bottom: 30, left: 0, width: W, zIndex: 50, display: "flex", justifyContent: "center"}}>
      <div style={{
        background: "rgba(12,14,18,.82)", borderRadius: 15, padding: "11px 32px",
        fontFamily: F, fontWeight: 700, fontSize: 46, color: "#fff", letterSpacing: 2, whiteSpace: "nowrap",
      }}>{cur.t}</div>
    </div>
  );
};

// ============ 页面（局部帧 = useCurrentFrame()，Sequence 从 SENT 起精确对齐） ============

// P1 钩子：网站凭什么一直记得你是你（第0帧完整静态，全部 delay=-99）
const PageHook: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill>
      <BigTitle f={f} delay={-99} y={70} size={80} parts={[
        {t: "网站", c: INK}, {t: "凭什么", c: ORANGE}, {t: "一直记得你是你？", c: INK},
      ]} />
      <Sparkle x={330} y={110} s={0.8} />
      <Sparkle x={1560} y={90} s={0.65} color="#b8d4f2" />

      {/* 左：浏览器（登录成功态） */}
      <FlatCard f={f} delay={-99} x={240} y={280} w={560} h={440}>
        <BrowserFrame w={560} h={440}>
          <div style={{position: "absolute", left: 0, top: 52, width: 560, height: 388}}>
            <div style={{position: "absolute", left: 40, top: 36, width: 120, height: 120, borderRadius: 999, backgroundColor: GREEN_BG, border: `4px solid ${GREEN}`, display: "flex", alignItems: "center", justifyContent: "center"}}>
              <MarkOk x={60} y={60} s={0.85} />
            </div>
            <div style={{position: "absolute", left: 200, top: 56, width: 320, fontFamily: F, fontWeight: 900, fontSize: 40, color: INK}}>登录成功</div>
            <div style={{position: "absolute", left: 200, top: 116, width: 320, fontFamily: F, fontSize: 26, color: SUBC}}>用户名 ｜ 密码已通过</div>
            <div style={{position: "absolute", left: 40, top: 210, width: 480, height: 66, borderRadius: 16, backgroundColor: "#f6f8fa", border: `2px solid ${BORDER}`, display: "flex", alignItems: "center", paddingLeft: 24, fontFamily: F, fontSize: 28, color: SUBC}}>
              用户名：qiu______
            </div>
            <div style={{position: "absolute", left: 40, top: 296, width: 480, height: 66, borderRadius: 16, backgroundColor: "#f6f8fa", border: `2px solid ${BORDER}`, display: "flex", alignItems: "center", paddingLeft: 24, fontFamily: F, fontSize: 28, color: SUBC}}>
              密　码：••••••••
            </div>
          </div>
        </BrowserFrame>
      </FlatCard>
      <Label f={f} d={-99} x={240} y={748} w={560} text="浏览器" size={32} color={SUBC} />

      {/* 右：服务器 */}
      <FlatCard f={f} delay={-99} x={1360} y={300} w={360} h={380} chip="服务器" chipColor={GREEN}>
        <ServerIcon x={180} y={190} s={1.7} />
      </FlatCard>

      {/* 中：请求自动往返 */}
      <FlatArrow f={f} x1={1330} y1={470} x2={840} y2={470} delay={-99} color="#9fb4c8" dashed sw={6} />
      <LoopPacket f={f} x1={1300} y1={470} x2={870} y2={470} color={BLUE} start={10} period={60} dur={38} lift={22} size={42} />
      <LoopPacket f={f} x1={1300} y1={470} x2={870} y2={470} color={ORANGE} start={40} period={60} dur={38} lift={22} size={42} />
      <Label f={f} d={-99} x={960} y={370} w={280} text="每次请求" size={30} color={SUBC} />

      <Pill f={f} delay={-99} x={700} y={600} w={520} h={80} bg={ORANGE_BG} border={`3px dashed ${ORANGE}`} text="凭什么记得你？" color={ORANGE} ts={36} />
      <Sparkle x={640} y={580} s={0.75} />
    </AbsoluteFill>
  );
};

// P2 三件套总览：Cookie / Session / Token 三卡（容器 -99，名字与分工按口播弹入）
const PageTrio: React.FC = () => {
  const f = useCurrentFrame();
  const cards = [
    {x: 130, name: "Cookie", nc: BLUE, role: "浏览器的小口袋", Ico: PocketIcon, d: 20},
    {x: 710, name: "Session", nc: GREEN, role: "服务器管的档案", Ico: CabinetIcon, d: 28},
    {x: 1290, name: "Token", nc: ORANGE, role: "自己带的证件", Ico: IdCardIcon, d: 36},
  ];
  return (
    <AbsoluteFill>
      <BigTitle f={f} delay={-99} y={90} parts={[{t: "三件套", c: INK}]} />

      {cards.map((c, i) => (
        <FlatCard key={i} f={f} delay={-99} x={c.x} y={300} w={500} h={440} chip={c.name} chipColor={c.nc}>
          <c.Ico x={250} y={170} s={1.6} c={c.nc} />
          <div style={{
            position: "absolute", left: 0, top: 280, width: 500, textAlign: "center",
            fontFamily: F, fontWeight: 900, fontSize: 58, color: c.nc,
            opacity: prog(f, c.d, 10), transform: `scale(${0.7 + 0.3 * ease(prog(f, c.d, 10))})`,
          }}>{c.name}</div>
          <div style={{
            position: "absolute", left: 0, top: 366, width: 500, textAlign: "center",
            fontFamily: F, fontSize: 30, color: SUBC, opacity: prog(f, c.d + 8, 10),
          }}>{c.role}</div>
        </FlatCard>
      ))}

      <Pill f={f} delay={50} x={610} y={820} w={700} h={74} bg="#f6f8fa" border={`3px solid ${BORDER}`} text="Cookie · Session · Token" color={INK} ts={34} />
      <Label f={f} d={89} x={610} y={910} w={700} text="分工没分清？一个一个拆" color={RED} size={30} weight={900} />
      <Sparkle x={640} y={270} s={0.75} />
      <Sparkle x={1250} y={250} s={0.6} color="#bfe3cc" />
    </AbsoluteFill>
  );
};

// P3 Cookie：浏览器里的小口袋，凭证放进去，请求自动带
const PageCookie: React.FC = () => {
  const f = useCurrentFrame();
  // 词级锚点（s03 局部）：小口袋52 网站77 凭证99 放113 进去118 之后136 每次146 请求155 带上187
  return (
    <AbsoluteFill>
      <BigTitle f={f} delay={-99} size={80} parts={[
        {t: "Cookie", c: BLUE}, {t: " 是浏览器里的", c: INK}, {t: "小口袋", c: BLUE},
      ]} />

      {/* 左：浏览器 + 口袋（主视觉） */}
      <FlatCard f={f} delay={-99} x={220} y={260} w={600} h={470}>
        <BrowserFrame w={600} h={470}>
          <div style={{position: "absolute", left: 0, top: 52, width: 600, height: 418}}>
            <PocketIcon x={300} y={240} s={2.2} c={BLUE} />
          </div>
        </BrowserFrame>
      </FlatCard>
      <Label f={f} d={-99} x={220} y={756} w={600} text="Cookie 住在浏览器里" size={30} color={BLUE} weight={900} />

      {/* 凭证芯片落进口袋（网站把凭证放进去）——标签放浏览器内部，不压标题 */}
      <PopAt f={f} delay={99} x={290} y={330} w={150} h={60}>
        <div style={{
          width: 150, height: 60, borderRadius: 14, backgroundColor: BLUE,
          border: "3px solid #fff", boxShadow: "0 8px 18px rgba(74,134,216,0.35)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontFamily: F, fontWeight: 900, fontSize: 30, color: "#fff",
        }}>凭证</div>
      </PopAt>
      <FlyChip f={f} x1={365} y1={395} x2={505} y2={478} t0={118} dur={22} text="凭证" color={BLUE} w={130} h={56} fs={28} />
      <PopAt f={f} delay={136} x={470} y={470} w={100} h={60}><MarkOk x={50} y={30} s={0.9} /></PopAt>

      {/* 右：之后每次请求自动带上（服务器侧） */}
      <FlatCard f={f} delay={-99} x={1330} y={280} w={380} h={380} chip="服务器" chipColor={GREEN}>
        <ServerIcon x={190} y={190} s={1.6} />
      </FlatCard>
      <FlatArrow f={f} x1={1300} y1={450} x2={860} y2={450} delay={146} color={BLUE} sw={7} />
      <Label f={f} d={155} x={940} y={360} w={320} text="请求自动带上" color={BLUE} size={32} weight={900} />
      <LoopPacket f={f} x1={1290} y1={450} x2={880} y2={450} color={BLUE} start={158} period={56} dur={36} lift={18} size={40} />

      <Pill f={f} delay={150} x={620} y={810} w={680} h={76} bg={BLUE_BG} text="凭证存在浏览器这边" color={BLUE} ts={36} />
      <Sparkle x={580} y={790} s={0.8} />
    </AbsoluteFill>
  );
};

// P4 Session：口袋谁都能翻，档案放服务器
const PageSession: React.FC = () => {
  const f = useCurrentFrame();
  // 词级锚点（s04 局部）：口袋9 翻39 存密码64 裸奔93 所以113 档案142 服务器163 这194 叫200 Session204
  return (
    <AbsoluteFill>
      <BigTitle f={f} delay={-99} size={80} parts={[
        {t: "真正的档案 放在", c: INK}, {t: "服务器", c: GREEN},
      ]} />

      {/* 左：浏览器口袋 + 谁都能翻 */}
      <FlatCard f={f} delay={-99} x={200} y={290} w={520} h={430}>
        <BrowserFrame w={520} h={430} addr="my.site">
          <div style={{position: "absolute", left: 0, top: 52, width: 520, height: 378}}>
            <PocketIcon x={260} y={230} s={1.8} c={BLUE} />
            {/* 偷看的人（谁都能翻） */}
            <PopAt f={f} delay={39} x={330} y={190} w={160} h={160}>
              <svg width={160} height={160} viewBox="0 0 160 160" style={{overflow: "visible"}}>
                <circle cx={80} cy={80} r={62} fill={RED_BG} stroke={RED} strokeWidth={6} />
                <circle cx={56} cy={80} r={14} fill={RED} />
                <circle cx={104} cy={80} r={14} fill={RED} />
              </svg>
            </PopAt>
            <PopAt f={f} delay={39} x={400} y={110} w={70} h={70}><MarkBad x={35} y={35} s={1.05} /></PopAt>
          </div>
        </BrowserFrame>
      </FlatCard>
      <Label f={f} d={39} x={200} y={744} w={520} text="口袋谁都能翻" color={RED} size={32} weight={900} />

      {/* 中：裸奔警告 */}
      <Pill f={f} delay={93} x={770} y={420} w={330} h={80} bg={RED_BG} border={`3px solid ${RED}`} text="存密码 = 裸奔" color={RED} ts={36} />
      <FlatArrow f={f} x1={770} y1={585} x2={1150} y2={578} delay={113} color={GREEN} sw={7} />
      <Label f={f} d={125} x={795} y={608} w={330} text="档案搬家" color={GREEN} size={30} weight={900} />

      {/* 右：服务器档案柜（Session） */}
      <FlatCard f={f} delay={-99} x={1180} y={260} w={560} h={470} chip="服务器" chipColor={GREEN}>
        <CabinetIcon x={280} y={200} s={2.1} c={GREEN} />
        <div style={{
          position: "absolute", left: 0, top: 330, width: 560, textAlign: "center",
          fontFamily: F, fontWeight: 900, fontSize: 34, color: INK,
          opacity: prog(f, 142, 10),
        }}>你的档案在这</div>
      </FlatCard>
      <Label f={f} d={163} x={1180} y={756} w={560} text="只在服务器这边" size={30} color={SUBC} />

      {/* Session 大字登场（delay 177，切页前保证 ≥40 帧停留） */}
      <PopAt f={f} delay={177} x={700} y={760} w={520} h={110}>
        <div style={{
          width: 520, height: 110, borderRadius: 999, backgroundColor: GREEN,
          display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: "0 14px 30px rgba(69,165,106,0.4)",
          fontFamily: F, fontWeight: 900, fontSize: 64, color: "#fff", letterSpacing: 10,
        }}>Session</div>
      </PopAt>
      <Sparkle x={660} y={740} s={0.85} />
      <Sparkle x={1250} y={220} s={0.6} color="#bfe3cc" />
    </AbsoluteFill>
  );
};

// P5 编号牌 + 多机露馅：凭牌查档案，A机有 B机查无此人
const PageMultiFail: React.FC = () => {
  const f = useCurrentFrame();
  // 词级锚点（s05 局部）：编号牌37 服务器60 凭牌74 查84 档案89 服务器111 一多124 档案161 存在171 A183 机187 请求197 B215 机221 查无此人232
  return (
    <AbsoluteFill>
      <BigTitle f={f} delay={-99} size={78} parts={[
        {t: "服务器一多 ", c: INK}, {t: "就露馅", c: RED},
      ]} />

      {/* 左：浏览器挂编号牌 */}
      <FlatCard f={f} delay={-99} x={160} y={330} w={420} h={420} chip="浏览器" chipColor={BLUE}>
        <PopAt f={f} delay={37} x={210} y={210} w={120} h={150}>
          <TagIcon x={60} y={75} s={1.0} c={BLUE} num="007" />
        </PopAt>
      </FlatCard>
      <Label f={f} d={37} x={160} y={776} w={420} text="只领一张编号牌" color={BLUE} size={30} weight={900} />

      {/* 服务器A：档案在这（顶部） */}
      <FlatCard f={f} delay={-99} x={1230} y={200} w={300} h={260} chip="A机" chipColor={GREEN}>
        <CabinetIcon x={150} y={140} s={1.15} c={GREEN} />
      </FlatCard>
      <PopAt f={f} delay={171} x={1500} y={190} w={70} h={70}><MarkOk x={35} y={35} s={1.05} /></PopAt>
      <Label f={f} d={161} x={1180} y={464} w={400} text="档案存在A机" color={GREEN} size={30} weight={900} />

      {/* 服务器B/C：一多就露馅（B机收红箭与红章，C机居右不挡箭） */}
      <FlatCard f={f} delay={124} x={1230} y={545} w={280} h={250} chip="B机" chipColor={ORANGE}>
        <ServerIcon x={140} y={140} s={1.1} />
      </FlatCard>
      <FlatCard f={f} delay={132} x={1560} y={545} w={280} h={250} chip="C机" chipColor={ORANGE}>
        <ServerIcon x={140} y={140} s={1.1} />
      </FlatCard>

      {/* 浏览器→A：凭牌查档案（通） */}
      <FlatArrow f={f} x1={590} y1={430} x2={1220} y2={330} delay={74} color={GREEN} sw={7} />
      <Label f={f} d={84} x={660} y={300} w={420} text="凭牌查档案" color={GREEN} size={30} weight={900} />
      {/* 浏览器→B：请求到了B机（断，只到B卡左缘，不穿C卡） */}
      <FlatArrow f={f} x1={590} y1={560} x2={1215} y2={650} delay={197} color={RED} dashed sw={7} />

      {/* B机红章：查无此人 */}
      <PopAt f={f} delay={232} x={1190} y={585} w={340} h={105} rot={-6}>
        <div style={{
          width: 340, height: 105, borderRadius: 18, border: `6px solid ${RED}`,
          backgroundColor: "rgba(253,236,236,0.92)", display: "flex", alignItems: "center", justifyContent: "center",
          fontFamily: F, fontWeight: 900, fontSize: 44, color: RED, letterSpacing: 5,
        }}>查无此人</div>
      </PopAt>

      <Pill f={f} delay={200} x={560} y={840} w={800} h={74} bg={RED_BG} text="档案只有一份 服务器却有多台" color={RED} ts={34} />
      <Sparkle x={1120} y={180} s={0.7} />
    </AbsoluteFill>
  );
};

// P6 Token：签成防伪字符串发给你自己带，验个签就认，多少台机器都通用
const PageToken: React.FC = () => {
  const f = useCurrentFrame();
  // 词级锚点（s06 局部）：Token20 档案41 存57 签成80 防伪104 字符串114 发给131 你142 自己145 带154 服务168 器验177 签190 认201 通用245
  return (
    <AbsoluteFill>
      <BigTitle f={f} delay={-99} size={80} parts={[
        {t: "Token", c: ORANGE}, {t: " ＝ 随身", c: INK}, {t: "证件", c: ORANGE},
      ]} />

      {/* 左：签发服务器 */}
      <FlatCard f={f} delay={-99} x={170} y={290} w={380} h={380} chip="服务器" chipColor={GREEN}>
        <ServerIcon x={190} y={160} s={1.35} />
        <PopAt f={f} delay={80} x={190} y={280} w={110} h={110}>
          <div style={{
            width: 110, height: 110, borderRadius: 999, border: `6px solid ${ORANGE}`,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontFamily: F, fontWeight: 900, fontSize: 48, color: ORANGE, backgroundColor: "#fff",
          }}>签</div>
        </PopAt>
      </FlatCard>
      <Label f={f} d={80} x={170} y={694} w={380} text="签个防伪章" color={ORANGE} size={30} weight={900} />

      {/* 中：防伪字符串（Token 本体） */}
      <PopAt f={f} delay={104} x={620} y={340} w={620} h={110}>
        <div style={{
          width: 620, height: 110, borderRadius: 20, backgroundColor: "#fff",
          border: `4px solid ${ORANGE}`, boxShadow: "0 12px 26px rgba(240,145,45,0.22)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontFamily: "Consolas, monospace", fontWeight: 700, fontSize: 40, color: INK, letterSpacing: 2,
        }}>A8f3.x9k2.p7Qm</div>
      </PopAt>
      <Label f={f} d={114} x={620} y={470} w={620} text="防伪字符串 发给你自己带" color={ORANGE} size={32} weight={900} />

      {/* 字符串飞到用户手里 */}
      <FlyChip f={f} x1={930} y1={450} x2={930} y2={640} t0={131} dur={24} text="Token" color={ORANGE} w={170} h={60} fs={30} />

      {/* 中下：用户随身带 */}
      <PopAt f={f} delay={142} x={790} y={600} w={300} h={260}>
        <Float f={f} amp={5}>
          <div style={{position: "absolute", inset: 0}}>
            <FlatPerson x={150} y={120} s={1.15} color={ORANGE} />
            <div style={{
              position: "absolute", left: 190, top: 120, width: 92, height: 40, borderRadius: 10,
              backgroundColor: ORANGE, border: "3px solid #fff",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontFamily: F, fontWeight: 900, fontSize: 20, color: "#fff",
            }}>Token</div>
          </div>
        </Float>
      </PopAt>
      <Label f={f} d={154} x={790} y={856} w={300} text="自己带" color={ORANGE} size={30} weight={900} />

      {/* 右：任意服务器验签就认 */}
      <FlatCard f={f} delay={-99} x={1350} y={250} w={440} h={430} chip="随便哪台" chipColor={ORANGE}>
        {[
          {y: 70, d: 190, name: "B机"},
          {y: 180, d: 201, name: "C机"},
          {y: 290, d: 245, name: "N机"},
        ].map((r, i) => (
          <div key={i} style={{
            position: "absolute", left: 50, top: r.y, width: 340, height: 92, display: "flex", alignItems: "center",
            opacity: prog(f, r.d - 12, 8),
          }}>
            <div style={{
              width: 200, height: 84, borderRadius: 16, backgroundColor: "#f6f8fa",
              border: `2px solid ${BORDER}`, display: "flex", alignItems: "center", justifyContent: "center",
              fontFamily: F, fontWeight: 900, fontSize: 32, color: INK,
            }}>{r.name}</div>
            <div style={{position: "relative", marginLeft: 30, width: 54, height: 54, flexShrink: 0}}>
              <MarkOk x={27} y={27} s={0.9} c={GREEN} />
            </div>
            <div style={{
              marginLeft: 16, width: 60, fontFamily: F, fontWeight: 900, fontSize: 26, color: GREEN,
              opacity: prog(f, r.d, 8),
            }}>认</div>
          </div>
        ))}
      </FlatCard>
      <Label f={f} d={177} x={1350} y={704} w={440} text="验个签就认 不查档案库" color={GREEN} size={30} weight={900} />

      <Pill f={f} delay={201} x={200} y={900} w={620} h={70} bg={ORANGE_BG} text="一台签发 台台都认" color={ORANGE} ts={34} />
      <Sparkle x={580} y={330} s={0.75} />
    </AbsoluteFill>
  );
};

// P7 迁移：从 Session 迁到 Token，是被多机问题逼的
const PageMigrate: React.FC = () => {
  const f = useCurrentFrame();
  // 词级锚点（s07 局部）：Session32 迁到47 Token59 多105 机111 问题116 逼126 的132 不是143 时髦163
  return (
    <AbsoluteFill>
      <BigTitle f={f} delay={-99} size={80} parts={[
        {t: "从 ", c: INK}, {t: "Session", c: GREEN}, {t: " 迁到 ", c: INK}, {t: "Token", c: ORANGE},
      ]} />

      {/* 左：Session 卡 */}
      <FlatCard f={f} delay={-99} x={250} y={330} w={520} h={380} chip="Session" chipColor={GREEN}>
        <CabinetIcon x={260} y={150} s={1.5} c={GREEN} />
        <div style={{
          position: "absolute", left: 0, top: 270, width: 520, textAlign: "center",
          fontFamily: F, fontWeight: 900, fontSize: 36, color: INK, opacity: prog(f, 8, 10),
        }}>档案在服务器</div>
      </FlatCard>

      {/* 右：Token 卡 */}
      <FlatCard f={f} delay={-99} x={1150} y={330} w={520} h={380} chip="Token" chipColor={ORANGE}>
        <IdCardIcon x={260} y={150} s={1.5} c={ORANGE} />
        <div style={{
          position: "absolute", left: 0, top: 270, width: 520, textAlign: "center",
          fontFamily: F, fontWeight: 900, fontSize: 36, color: INK, opacity: prog(f, 16, 10),
        }}>证件随身带</div>
      </FlatCard>

      {/* 大箭头 + 多机难题 */}
      <FlatArrow f={f} x1={820} y1={520} x2={1100} y2={520} delay={47} color={ORANGE} sw={10} />
      <PopAt f={f} delay={105} x={820} y={400} w={280} h={80} rot={-4}>
        <div style={{
          width: 280, height: 80, borderRadius: 16, backgroundColor: RED_BG, border: `3px solid ${RED}`,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontFamily: F, fontWeight: 900, fontSize: 34, color: RED,
        }}>多机难题</div>
      </PopAt>

      <Pill f={f} delay={132} x={610} y={800} w={700} h={80} bg="rgba(247,201,72,0.22)" border={`3px solid ${YEL}`} text="被逼出来的架构升级" color={INK} ts={38} />
      <Sparkle x={560} y={780} s={0.8} />
    </AbsoluteFill>
  );
};

// P8 金句三连：Cookie是口袋 / Session是档案 / Token是随身证件
const PageQuote: React.FC = () => {
  const f = useCurrentFrame();
  // 词级锚点（s08 局部）：Cookie26 口袋42 Session60 档案78 Token95 随身116 证件131
  const lines = [
    {t: "Cookie 是口袋", bg: BLUE, d: 26},
    {t: "Session 是档案", bg: GREEN, d: 60},
    {t: "Token 是随身证件", bg: ORANGE, d: 95},
  ];
  return (
    <AbsoluteFill>
      <BigTitle f={f} delay={-99} y={130} parts={[{t: "记住这三句", c: INK}]} />
      {lines.map((l, i) => {
        const p = prog(f, l.d, 12);
        return (
          <div key={i} style={{
            position: "absolute", left: 510, top: 330 + i * 150, width: 900, height: 116,
            opacity: p, transform: `scale(${0.8 + 0.2 * ease(p)})`,
          }}>
            <div style={{
              width: 900, height: 116, borderRadius: 999, backgroundColor: l.bg,
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: `0 14px 30px ${l.bg}55`,
              fontFamily: F, fontWeight: 900, fontSize: 56, color: "#fff", letterSpacing: 5,
            }}>{l.t}</div>
          </div>
        );
      })}
      <Sparkle x={440} y={330} s={0.9} />
      <Sparkle x={1440} y={640} s={0.7} color="#bfe3cc" />
      <Sparkle x={1460} y={300} s={0.6} color="#b8d4f2" />
    </AbsoluteFill>
  );
};

// P9 结尾截图卡（白底黑字，主视觉 delay=-99 切页即完整呈现，整页静止到片尾）+ CTA
const PageOutro: React.FC = () => {
  const rows = [
    {t: "Cookie ＝ 浏览器里的小口袋", c: BLUE},
    {t: "Session ＝ 服务器上的档案", c: GREEN},
    {t: "Token ＝ 随身证件（验签不查库）", c: ORANGE},
  ];
  return (
    <AbsoluteFill>
      {/* 白底截图区 */}
      <div style={{
        position: "absolute", left: 310, top: 120, width: 1300, height: 680,
        backgroundColor: "#ffffff", border: "4px dashed #b8c4d2", borderRadius: 34,
      }} />
      <div style={{
        position: "absolute", left: 360, top: 160, width: 1200, height: 600,
        backgroundColor: "#ffffff", border: `3px solid ${BORDER}`, borderRadius: 26,
        boxShadow: "0 12px 30px rgba(47,58,69,0.10)",
      }}>
        <div style={{
          position: "absolute", left: 0, top: 44, width: 1200, textAlign: "center",
          fontFamily: F, fontWeight: 900, fontSize: 54, color: INK, letterSpacing: 2, lineHeight: 1.4,
        }}>
          <div>Cookie 是口袋 · Session 是档案</div>
          <div><span style={{color: ORANGE}}>Token</span> 是随身证件</div>
        </div>
        <div style={{position: "absolute", left: 150, top: 240, width: 900}}>
          {rows.map((r, i) => (
            <div key={i} style={{
              display: "flex", alignItems: "center", marginBottom: 22,
            }}>
              <div style={{width: 26, height: 26, borderRadius: 8, backgroundColor: r.c, marginRight: 22}} />
              <div style={{fontFamily: F, fontWeight: 700, fontSize: 40, color: INK}}>{r.t}</div>
            </div>
          ))}
        </div>
        <div style={{
          position: "absolute", left: 0, top: 536, width: 1200, textAlign: "center",
          fontFamily: F, fontWeight: 700, fontSize: 30, color: INK, letterSpacing: 3,
        }}>全栈小秋 · 0 基础也能学会</div>
      </div>

      {/* CTA：bottom ≥170，不进字幕区 */}
      <div style={{
        position: "absolute", bottom: 175, left: 0, width: W, display: "flex", justifyContent: "center",
      }}>
        <div style={{
          width: 520, height: 96, borderRadius: 48, backgroundColor: ORANGE,
          display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: "0 14px 30px rgba(240,145,45,0.4)",
          fontFamily: F, fontWeight: 900, fontSize: 44, color: "#fff", letterSpacing: 6,
        }}>关注 全栈小秋</div>
      </div>
      <Sparkle x={340} y={140} s={0.85} />
      <Sparkle x={1570} y={170} s={0.65} color="#bfe3cc" />
    </AbsoluteFill>
  );
};

// ============ 主组件 ============

const PAGES = [
  {C: PageHook, start: SENT[0], end: SENT[1]},
  {C: PageTrio, start: SENT[1], end: SENT[2]},
  {C: PageCookie, start: SENT[2], end: SENT[3]},
  {C: PageSession, start: SENT[3], end: SENT[4]},
  {C: PageMultiFail, start: SENT[4], end: SENT[5]},
  {C: PageToken, start: SENT[5], end: SENT[6]},
  {C: PageMigrate, start: SENT[6], end: SENT[7]},
  {C: PageQuote, start: SENT[7], end: SENT[8]},
  {C: PageOutro, start: SENT[8], end: DUR},
];

export const CookieSessionToken: React.FC = () => {
  const frame = useCurrentFrame();
  const bed = interpolate(frame, [0, 20, DUR - 10, DUR - 1], [0, 0.06, 0.06, 0], clamp);
  return (
    <AbsoluteFill style={{background: "linear-gradient(180deg,#fff 0%,#f3f6f9 100%)", fontFamily: F, overflow: "hidden"}}>
      <BgDots />
      {/* 铁律① 硬切：每页 Sequence 精确 [start, end)，无叠化 */}
      {PAGES.map(({C, start, end}, i) => (
        <Sequence key={i} from={start} durationInFrames={end - start}>
          <C />
        </Sequence>
      ))}
      {/* 右上角角标 */}
      <div style={{
        position: "absolute", top: 45, right: 70, zIndex: 45, border: `3px solid ${BLUE}`,
        borderRadius: 999, padding: "7px 25px", fontSize: 28, fontWeight: 900, color: INK,
        letterSpacing: 5, background: "#fff",
      }}>全栈小秋</div>

      {/* 配音 */}
      {SENT.map((start, i) => (
        <Sequence key={`v-${i}`} from={start} durationInFrames={i < 8 ? SENT[i + 1] - start + 10 : DUR - start}>
          <Audio src={staticFile(`audio/cooksesstoken-tts/s0${i + 1}.mp3`)} volume={1} />
        </Sequence>
      ))}

      {/* 音效层：全部从 SENT / 词级锚点推导 */}
      {/* 每页硬切 whoosh */}
      {PAGES.slice(1).map((p, i) => (
        <Sequence key={`pg-${i}`} from={p.start - 4} durationInFrames={14}>
          <Audio src={staticFile("audio/sfx/whoosh.wav")} volume={0.22} />
        </Sequence>
      ))}
      {/* P3 凭证放进口袋 / 请求出发 */}
      <Sequence from={SENT[2] + 118} durationInFrames={12}>
        <Audio src={staticFile("audio/sfx/pop.wav")} volume={0.26} />
      </Sequence>
      <Sequence from={SENT[2] + 155} durationInFrames={12}>
        <Audio src={staticFile("audio/sfx/whoosh.wav")} volume={0.22} />
      </Sequence>
      {/* P4 裸奔警告 / Session 登场 */}
      <Sequence from={SENT[3] + 93} durationInFrames={12}>
        <Audio src={staticFile("audio/sfx/pop.wav")} volume={0.26} />
      </Sequence>
      <Sequence from={SENT[3] + 190} durationInFrames={16}>
        <Audio src={staticFile("audio/sfx/success.wav")} volume={0.24} />
      </Sequence>
      {/* P5 编号牌 / 查档案通 / 查无此人 */}
      <Sequence from={SENT[4] + 37} durationInFrames={10}>
        <Audio src={staticFile("audio/sfx/pop.wav")} volume={0.26} />
      </Sequence>
      <Sequence from={SENT[4] + 74} durationInFrames={12}>
        <Audio src={staticFile("audio/sfx/whoosh.wav")} volume={0.22} />
      </Sequence>
      <Sequence from={SENT[4] + 171} durationInFrames={16}>
        <Audio src={staticFile("audio/sfx/success.wav")} volume={0.24} />
      </Sequence>
      <Sequence from={SENT[4] + 232} durationInFrames={14}>
        <Audio src={staticFile("audio/sfx/whoosh.wav")} volume={0.22} />
      </Sequence>
      {/* P6 签章 / 字符串 / 飞给用户 / 验签 / 通用 */}
      <Sequence from={SENT[5] + 80} durationInFrames={10}>
        <Audio src={staticFile("audio/sfx/pop.wav")} volume={0.26} />
      </Sequence>
      <Sequence from={SENT[5] + 104} durationInFrames={10}>
        <Audio src={staticFile("audio/sfx/pop.wav")} volume={0.26} />
      </Sequence>
      <Sequence from={SENT[5] + 131} durationInFrames={12}>
        <Audio src={staticFile("audio/sfx/whoosh.wav")} volume={0.22} />
      </Sequence>
      <Sequence from={SENT[5] + 201} durationInFrames={16}>
        <Audio src={staticFile("audio/sfx/success.wav")} volume={0.24} />
      </Sequence>
      <Sequence from={SENT[5] + 245} durationInFrames={16}>
        <Audio src={staticFile("audio/sfx/success.wav")} volume={0.24} />
      </Sequence>
      {/* P7 迁移箭头 / 多机难题 */}
      <Sequence from={SENT[6] + 47} durationInFrames={12}>
        <Audio src={staticFile("audio/sfx/whoosh.wav")} volume={0.22} />
      </Sequence>
      <Sequence from={SENT[6] + 105} durationInFrames={10}>
        <Audio src={staticFile("audio/sfx/pop.wav")} volume={0.26} />
      </Sequence>
      {/* P8 金句三连 */}
      {[26, 60, 95].map((t) => (
        <Sequence key={`q8-${t}`} from={SENT[7] + t} durationInFrames={10}>
          <Audio src={staticFile("audio/sfx/pop.wav")} volume={0.26} />
        </Sequence>
      ))}
      {/* P9 截图卡 + CTA */}
      <Sequence from={SENT[8] + 6} durationInFrames={10}>
        <Audio src={staticFile("audio/sfx/pop.wav")} volume={0.26} />
      </Sequence>
      <Sequence from={SENT[8] + 16} durationInFrames={10}>
        <Audio src={staticFile("audio/sfx/success.wav")} volume={0.24} />
      </Sequence>

      <Audio src={staticFile("audio/bed.wav")} loop volume={() => bed} />
      <Subtitle />
    </AbsoluteFill>
  );
};
