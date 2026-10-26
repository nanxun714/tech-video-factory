import React from "react";
import {Audio} from "@remotion/media";
import {AbsoluteFill, interpolate, Sequence, staticFile, useCurrentFrame} from "remotion";

// ============ 扁平可爱插画科普风 · AI 为什么会一本正经地胡说八道（全栈小秋） ============
// 结构：封面钩子 → 内核大字 → 填空题演示 → 像≠对 → 编书演示 → 命名页 → 草稿核对 → 金句横幅 → 结尾截图卡
// 语义色：蓝=AI/正常回答 红=编造/幻觉 黄=强调/金句 绿=核实通过 橙=概率/能量

export const DUR = 1559;

// ---------- 设计令牌 ----------
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

// ---------- 基础原语（拷自 TcpVsUdpFlat 本地版，勿 import flatKit） ----------

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

// 背景：柔和圆点网格
const BgDots: React.FC<{w?: number; h?: number}> = ({w = 1920, h = 1080}) => (
  <svg width={w} height={h} style={{position: "absolute", left: 0, top: 0, pointerEvents: "none"}}>
    <defs>
      <pattern id="aihal-dots" width="46" height="46" patternUnits="userSpaceOnUse">
        <circle cx="23" cy="23" r="2.6" fill="#dbe4ee" />
      </pattern>
    </defs>
    <rect width={w} height={h} fill="url(#aihal-dots)" opacity={0.5} />
    <circle cx={150} cy={120} r={190} fill={BLUE_BG} opacity={0.5} />
    <circle cx={w - 140} cy={h - 90} r={220} fill={ORANGE_BG} opacity={0.4} />
  </svg>
);

// 大标题：多色分段 + 黄色波浪下划线
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

const MarkOk: React.FC<{x: number; y: number; s?: number}> = ({x, y, s = 1}) => (
  <svg width={60 * s} height={60 * s} style={{position: "absolute", left: x - 30 * s, top: y - 30 * s, overflow: "visible"}}>
    <g transform={`scale(${s})`}>
      <circle cx={30} cy={30} r={26} fill={GREEN_BG} />
      <path d="M17 31 L27 41 L44 21" fill="none" stroke={GREEN} strokeWidth={6} strokeLinecap="round" strokeLinejoin="round" />
    </g>
  </svg>
);

const FlatPerson: React.FC<{x: number; y: number; color?: string; s?: number}> = ({x, y, color = GREEN, s = 1}) => (
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

// ---------- 本片专用原语 ----------

// 盖章（ slamming 印章：砸下 + 微缩）
const Stamp: React.FC<{
  f: number; delay: number; x: number; y: number; w: number; h: number;
  text: string; ts?: number; rot?: number; color?: string;
}> = ({f, delay, x, y, w, h, text, ts = 56, rot = -8, color = RED}) => {
  const p = prog(f, delay, 10);
  if (p <= 0) return null;
  return (
    <div style={{
      position: "absolute", left: x, top: y, width: w, height: h,
      opacity: Math.min(1, p * 1.5),
      transform: `scale(${1.5 - 0.5 * ease(p)}) rotate(${rot}deg)`,
      transformOrigin: "center center",
    }}>
      <div style={{
        position: "absolute", inset: 0, border: `7px solid ${color}`, borderRadius: 22,
        backgroundColor: "rgba(255,255,255,0.78)",
        display: "flex", alignItems: "center", justifyContent: "center",
        boxShadow: "0 10px 24px rgba(224,86,86,0.22)",
      }}>
        <div style={{position: "absolute", inset: 7, border: `3px solid ${color}`, borderRadius: 14}} />
        <div style={{fontFamily: F, fontWeight: 900, fontSize: ts, color, letterSpacing: 12, paddingLeft: 12, whiteSpace: "nowrap"}}>{text}</div>
      </div>
    </div>
  );
};

// 聊天气泡（设计令牌：AI=左侧蓝色圆角气泡白字 / 用户=右侧浅灰气泡）
const ChatBubble: React.FC<{
  f: number; delay: number; side: "ai" | "user"; x: number; y: number; w: number; h: number;
  text: string; ts?: number;
}> = ({f, delay, side, x, y, w, h, text, ts = 34}) => {
  const p = prog(f, delay);
  if (p <= 0) return null;
  const ai = side === "ai";
  return (
    <div style={{
      position: "absolute", left: x, top: y, width: w, height: h, opacity: p,
      transform: `scale(${0.85 + 0.15 * ease(p)})`,
      transformOrigin: ai ? "left center" : "right center",
    }}>
      <div style={{
        position: "absolute", inset: 0,
        backgroundColor: ai ? BLUE : "#eef1f5",
        border: ai ? "none" : `3px solid ${BORDER}`,
        borderRadius: ai ? "26px 26px 26px 8px" : "26px 26px 8px 26px",
        display: "flex", alignItems: "center", justifyContent: "center",
        boxShadow: ai ? "0 10px 22px rgba(74,134,216,0.25)" : "none",
      }}>
        <div style={{fontFamily: F, fontWeight: 700, fontSize: ts, color: ai ? "#fff" : INK, whiteSpace: "nowrap"}}>{text}</div>
      </div>
      {ai ? (
        <svg width={30} height={30} style={{position: "absolute", left: -22, bottom: 0, overflow: "visible"}}>
          <path d="M28 2 L4 28 L28 28 Z" fill={BLUE} />
        </svg>
      ) : (
        <svg width={30} height={30} style={{position: "absolute", right: -22, bottom: 0, overflow: "visible"}}>
          <path d="M2 2 L26 28 L2 28 Z" fill="#eef1f5" stroke={BORDER} strokeWidth={3} />
        </svg>
      )}
    </div>
  );
};

// 候选词概率条（横向条形图：橙色填充 + 百分比数字，选中后呼吸）
const ProbBar: React.FC<{
  f: number; delay: number; x: number; y: number; w: number;
  ch: string; blockColor: string; pct: number; selDelay?: number;
}> = ({f, delay, x, y, w, ch, blockColor, pct, selDelay}) => {
  const p = prog(f, delay);
  if (p <= 0) return null;
  const trackW = w - 320;
  const fillP = prog(f, delay + 5, 16);
  const breathe = f > delay + 26 ? 0.86 + 0.14 * (0.5 + 0.5 * Math.sin(f / 7)) : 1;
  const sel = selDelay !== undefined ? prog(f, selDelay, 10) : 0;
  return (
    <div style={{
      position: "absolute", left: x, top: y, width: w, height: 130,
      opacity: p, transform: `scale(${0.85 + 0.15 * ease(p)})`, transformOrigin: "center center",
    }}>
      <div style={{
        position: "absolute", inset: 0, backgroundColor: "#fff",
        border: sel > 0 ? `5px solid ${GREEN}` : `3px solid ${BORDER}`,
        borderRadius: 24, boxShadow: "0 10px 24px rgba(47,58,69,0.07)",
      }} />
      <div style={{
        position: "absolute", left: 26, top: 19, width: 92, height: 92, borderRadius: 18,
        backgroundColor: blockColor, display: "flex", alignItems: "center", justifyContent: "center",
        fontFamily: F, fontWeight: 900, fontSize: 48, color: "#fff",
        boxShadow: `0 8px 18px ${blockColor}44`,
      }}>{ch}</div>
      <div style={{position: "absolute", left: 138, top: 45, width: trackW, height: 40, borderRadius: 20, backgroundColor: "#eef2f6", overflow: "hidden"}}>
        <div style={{
          width: trackW * (pct / 100) * fillP, height: "100%", borderRadius: 20,
          backgroundColor: ORANGE, opacity: breathe,
        }} />
      </div>
      <div style={{position: "absolute", right: 24, top: 34, width: 90, textAlign: "right", fontFamily: F, fontWeight: 900, fontSize: 44, color: ORANGE}}>
        {pct}%
      </div>
      {sel > 0 ? (
        <div style={{position: "absolute", right: -18, top: -18, width: 60, height: 60, opacity: sel, transform: `scale(${0.6 + 0.4 * ease(sel)})`}}>
          <MarkOk x={30} y={30} s={1} />
        </div>
      ) : null}
    </div>
  );
};

// 积木块：圆角方块上写字（限定蓝/橙/绿/黄四色）
const Block: React.FC<{f: number; delay: number; x: number; y: number; t: string; c: string; rot?: number}> = ({f, delay, x, y, t, c, rot = 0}) => {
  const p = prog(f, delay);
  if (p <= 0) return null;
  return (
    <div style={{
      position: "absolute", left: x, top: y, width: 110, height: 110, borderRadius: 20,
      backgroundColor: c, display: "flex", alignItems: "center", justifyContent: "center",
      fontFamily: F, fontWeight: 900, fontSize: 52, color: "#fff",
      boxShadow: `0 10px 22px ${c}44`, opacity: p,
      transform: `scale(${0.8 + 0.2 * ease(p)}) rotate(${rot}deg)`,
    }}>{t}</div>
  );
};

// 简单神经网络小图标（节点 + 连线 + 循环脉冲）
const NetIcon: React.FC<{f: number; x: number; y: number; delay?: number}> = ({f, x, y, delay = 0}) => {
  const p = prog(f, delay);
  if (p <= 0) return null;
  const col1 = [[0, 40], [0, 120], [0, 200]];
  const col2 = [[105, 10], [105, 80], [105, 150], [105, 220]];
  const col3 = [[210, 70], [210, 160]];
  const link = (a: number[], b: number[]) => ({x1: a[0] + 105, y1: a[1], x2: b[0] + 105, y2: b[1]});
  const lines = [
    ...col1.flatMap((a) => col2.slice(0, 3).map((b) => link(a, b))),
    ...col2.slice(1).map((b) => link(b, col3[0])),
    ...col2.slice(1, 3).map((b) => link(b, col3[1])),
  ];
  const t1 = ((f - delay) % 50) / 50;
  const t2 = (((f - delay) % 50) + 25) % 50 / 50;
  const lerp = (a: number[], b: number[], t: number) => [a[0] + 105 + (b[0] + 105 - a[0] - 105) * t, a[1] + (b[1] - a[1]) * t];
  return (
    <svg width={320} height={240} style={{position: "absolute", left: x, top: y, opacity: p, overflow: "visible"}}>
      {lines.map((l, i) => (
        <line key={i} x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2} stroke="#c9d6e6" strokeWidth={4} />
      ))}
      {[...col1, ...col2, ...col3].map((n, i) => (
        <circle key={`n-${i}`} cx={n[0] + 105} cy={n[1]} r={17}
          fill={i % 3 === 0 ? BLUE : "#fff"} stroke={BLUE} strokeWidth={5} />
      ))}
      {(() => {
        const pa = lerp(col1[1], col2[1], t1);
        const pb = lerp(col2[2], col3[0], t2);
        return (
          <g>
            <circle cx={pa[0]} cy={pa[1]} r={8} fill={ORANGE} opacity={0.9} />
            <circle cx={pb[0]} cy={pb[1]} r={8} fill={ORANGE} opacity={0.9} />
          </g>
        );
      })()}
    </svg>
  );
};

// 闪烁光标
const Cursor: React.FC<{f: number; x: number; y: number; h?: number; c?: string}> = ({f, x, y, h = 76, c = YEL}) => {
  if (Math.floor(f / 14) % 2 !== 0) return null;
  return <div style={{position: "absolute", left: x, top: y, width: 10, height: h, borderRadius: 5, backgroundColor: c}} />;
};

// 扁平小机器人（封面后排）
const RobotIcon: React.FC<{x: number; y: number; s?: number}> = ({x, y, s = 1}) => (
  <svg width={170 * s} height={190 * s} style={{position: "absolute", left: x, top: y, overflow: "visible"}}>
    <g transform={`scale(${s})`}>
      <ellipse cx={85} cy={182} rx={52} ry={8} fill="#e2e9f2" />
      <line x1={85} y1={14} x2={85} y2={38} stroke="#9fb4c8" strokeWidth={7} strokeLinecap="round" />
      <circle cx={85} cy={10} r={9} fill={YEL} />
      <rect x={30} y={38} width={110} height={82} rx={22} fill={BLUE} />
      <circle cx={62} cy={76} r={11} fill="#fff" />
      <circle cx={108} cy={76} r={11} fill="#fff" />
      <circle cx={62} cy={76} r={4.5} fill={INK} />
      <circle cx={108} cy={76} r={4.5} fill={INK} />
      <rect x={70} y={98} width={30} height={7} rx={3.5} fill="#fff" opacity={0.85} />
      <rect x={48} y={130} width={74} height={46} rx={14} fill="#7da7e2" />
      <rect x={6} y={134} width={26} height={12} rx={6} fill="#9fb4c8" />
      <rect x={138} y={134} width={26} height={12} rx={6} fill="#9fb4c8" />
    </g>
  </svg>
);

// ---------- 字幕（已生成，逐字无标点） ----------
type Sub = {s: number; e: number; t: string};
const subs: Sub[] = [
  {s: 0, e: 50, t: "问AI一个问题"},
  {s: 50, e: 86, t: "它张口就答"},
  {s: 86, e: 129, t: "答得特别自信"},
  {s: 129, e: 172, t: "结果全是编的"},
  {s: 172, e: 194, t: "为什么"},
  {s: 200, e: 226, t: "先说内核"},
  {s: 226, e: 286, t: "AI不是在回忆知识"},
  {s: 286, e: 339, t: "它是在猜下一个词"},
  {s: 345, e: 382, t: "你打的每个字"},
  {s: 382, e: 450, t: "对它来说都是一道填空题"},
  {s: 450, e: 469, t: "它做的"},
  {s: 469, e: 544, t: "是算出最像人话的下一个词"},
  {s: 549, e: 590, t: "它不知道对错"},
  {s: 590, e: 631, t: "只知道像不像"},
  {s: 631, e: 666, t: "答案像真话"},
  {s: 666, e: 694, t: "它就敢说"},
  {s: 700, e: 751, t: "你问一本不存在的书"},
  {s: 751, e: 791, t: "它不会说不知道"},
  {s: 791, e: 825, t: "它会顺着语境"},
  {s: 825, e: 882, t: "一本正经地编一本出来"},
  {s: 887, e: 933, t: "这个现象叫幻觉"},
  {s: 933, e: 973, t: "不是程序坏了"},
  {s: 973, e: 1052, t: "是它的工作原理本来就这样"},
  {s: 1057, e: 1137, t: "所以AI的答案要当草稿看"},
  {s: 1137, e: 1163, t: "重要信息"},
  {s: 1163, e: 1216, t: "一定自己再核一遍"},
  {s: 1221, e: 1259, t: "记住这句话"},
  {s: 1259, e: 1305, t: "AI不负责对"},
  {s: 1305, e: 1343, t: "它只负责像"},
  {s: 1349, e: 1405, t: "结尾这张卡截图存好"},
  {s: 1405, e: 1497, t: "下次有人问AI为什么会胡说八道"},
  {s: 1497, e: 1534, t: "你就能讲明白"},
];

// ---------- 翻页与字幕条 ----------

const PageTurn: React.FC<{children: React.ReactNode; off: number; len: number; first: boolean; last: boolean}> = ({children, off, len, first, last}) => {
  const frame = useCurrentFrame();
  const oIn = first ? 1 : interpolate(frame, [0, 10], [0, 1], clamp);
  const lf = frame - off;
  // 不变量：页边界帧上旧页必须仍完整可见（淡出窗口放在边界之后），任何一帧不得出现旧页已消失、新页未画的组合
  const oOut = last ? 1 : interpolate(lf, [len, len + 10], [1, 0], clamp);
  return <AbsoluteFill style={{opacity: Math.min(oIn, oOut)}}>{children}</AbsoluteFill>;
};

const Subtitle: React.FC = () => {
  const f = useCurrentFrame();
  const cur = subs.find((s) => f >= s.s && f < s.e);
  if (!cur) return null;
  return (
    <div style={{position: "absolute", bottom: 30, left: 0, right: 0, zIndex: 50, display: "flex", justifyContent: "center"}}>
      <div style={{
        background: "rgba(12,14,18,.82)", borderRadius: 15, padding: "11px 32px",
        fontFamily: F, fontWeight: 700, fontSize: 46, color: "#fff", letterSpacing: 2, whiteSpace: "nowrap",
      }}>{cur.t}</div>
    </div>
  );
};

// ============ 页面 ============

// P1 封面钩子（第0帧完整呈现：全部 delay=-99）
const PageCover: React.FC<{off: number}> = ({off}) => {
  const f = useCurrentFrame() - off;
  return (
    <AbsoluteFill>
      <BigTitle f={f} delay={-99} y={66} size={80} parts={[
        {t: "AI ", c: BLUE}, {t: "为什么会一本正经地", c: INK}, {t: "胡说八道？", c: RED},
      ]} />
      <Sparkle x={230} y={120} s={0.85} />
      <Sparkle x={1665} y={95} s={0.65} color="#b8d4f2" />

      {/* 主角：聊天面板 */}
      <FlatCard f={f} delay={-99} x={560} y={205} w={800} h={470}>
        <ChatBubble f={f} delay={-99} side="user" x={230} y={56} w={500} h={92} text="帮我讲讲冷门知识" ts={34} />
        <div style={{
          position: "absolute", left: 36, top: 178, width: 66, height: 66, borderRadius: 999,
          backgroundColor: INK, display: "flex", alignItems: "center", justifyContent: "center",
          fontFamily: F, fontWeight: 900, fontSize: 28, color: "#fff",
        }}>AI</div>
        <ChatBubble f={f} delay={-99} side="ai" x={118} y={168} w={580} h={100} text="这个问题我知道！听我的" ts={34} />
        <Pill f={f} delay={-99} x={118} y={300} w={330} h={64} bg={ORANGE_BG} text="自信值：拉满" color={ORANGE} ts={30} />
        {/* 打字中循环动画 */}
        <div style={{position: "absolute", left: 500, top: 318, display: "flex", gap: 12}}>
          {[0, 1, 2].map((i) => (
            <div key={i} style={{
              width: 15, height: 15, borderRadius: 99, backgroundColor: BLUE,
              opacity: Math.floor(f / 9) % 3 === i ? 1 : 0.3,
            }} />
          ))}
        </div>
      </FlatCard>

      {/* 红色盖章 */}
      <Stamp f={f} delay={-99} x={1125} y={565} w={330} h={122} text="全是编的" ts={56} rot={-9} />

      {/* 后排：左机器人 右用户 */}
      <Float f={f} x={215} y={330} w={200} h={240} amp={7}>
        <RobotIcon x={15} y={20} s={1} />
      </Float>
      <Label f={f} d={-99} x={175} y={590} w={280} text="AI" size={30} color={SUBC} />
      <Float f={f} x={1520} y={320} w={260} h={300} amp={6}>
        <FlatPerson x={130} y={150} color={GREEN} s={1.35} />
      </Float>
      <Label f={f} d={-99} x={1510} y={620} w={280} text="用户" size={30} color={SUBC} />

      <Pill f={f} delay={-99} x={800} y={742} w={320} h={70} bg={YEL} text="为什么？" color={INK} ts={36} />
    </AbsoluteFill>
  );
};

// P2 内核大字：不是回忆知识（灰划掉） vs 是在猜下一个词（橙亮起）+ 神经网络 + 积木块
const PageCore: React.FC<{off: number}> = ({off}) => {
  const f = useCurrentFrame() - off;
  const strike = prog(f, 68, 10);
  const p2 = prog(f, 111, 12);
  return (
    <AbsoluteFill>
      <Pill f={f} delay={8} x={660} y={64} w={600} h={66} bg={BLUE_BG} text="一句话说清 AI" color={BLUE} ts={32} />

      {/* 第一行：灰色 + 划掉 */}
      <div style={{position: "absolute", left: 0, top: 245, width: W, textAlign: "center", opacity: prog(f, 40)}}>
        <span style={{position: "relative", display: "inline-block", fontFamily: F, fontWeight: 900, fontSize: 64, color: "#9aa5b1", letterSpacing: 4}}>
          不是在回忆知识
          <svg width={470} height={22} style={{position: "absolute", left: -6, top: 30, overflow: "visible"}}>
            <line x1={0} y1={11} x2={470 * strike} y2={11} stroke="#d98a8a" strokeWidth={8} strokeLinecap="round" />
          </svg>
        </span>
      </div>

      {/* 第二行：橙色亮起 */}
      <div style={{position: "absolute", left: 0, top: 385, width: W, textAlign: "center", opacity: p2, transform: `scale(${0.7 + 0.3 * ease(p2)})`}}>
        <span style={{fontFamily: F, fontWeight: 900, fontSize: 104, color: ORANGE, letterSpacing: 8, textShadow: "0 14px 30px rgba(240,145,45,0.28)"}}>
          是在猜下一个词
        </span>
      </div>

      {/* 积木块：五个词依次码上 */}
      {[
        {t: "猜", c: BLUE}, {t: "下", c: ORANGE}, {t: "一", c: GREEN}, {t: "个", c: YEL}, {t: "词", c: BLUE},
      ].map((b, i) => (
        <Block key={i} f={f} delay={111 + 8 * i} x={637 + i * 134} y={640} t={b.t} c={b.c} rot={i % 2 === 0 ? -3 : 3} />
      ))}

      {/* 后排：神经网络小图标（脉冲循环） */}
      <NetIcon f={f} x={175} y={270} delay={17} />
      <Label f={f} d={24} x={145} y={530} w={320} text="神经网络" size={28} color={SUBC} />

      {/* 左下：灰色书架（被红叉划掉 = 没有库存） */}
      <PopAt f={f} delay={40} x={230} y={600} w={230} h={160}>
        <svg width={230} height={160} style={{position: "absolute", left: 0, top: 0, overflow: "visible"}}>
          <rect x={10} y={10} width={45} height={110} rx={6} fill="#c3cfdd" />
          <rect x={63} y={0} width={45} height={120} rx={6} fill="#d6dfe9" />
          <rect x={116} y={22} width={45} height={98} rx={6} fill="#c3cfdd" />
          <rect x={0} y={120} width={200} height={12} rx={6} fill="#9fb4c8" />
        </svg>
      </PopAt>
      <PopAt f={f} delay={72} x={290} y={620} w={80} h={80}>
        <svg width={80} height={80} style={{position: "absolute", left: 0, top: 0, overflow: "visible"}}>
          <circle cx={40} cy={40} r={36} fill="#fdecec" opacity={0.9} />
          <path d="M26 26 L54 54 M54 26 L26 54" fill="none" stroke={RED} strokeWidth={9} strokeLinecap="round" />
        </svg>
      </PopAt>
      <Label f={f} d={76} x={195} y={785} w={300} text="没有库存" color={RED} size={30} weight={900} />

      <Sparkle x={1670} y={300} s={0.8} />
      <Sparkle x={480} y={770} s={0.6} color="#bfe3cc" />
    </AbsoluteFill>
  );
};

// P3 填空题演示：黑板 + 光标闪烁 + 三个候选词概率条 + AI 选中
const PageBlank: React.FC<{off: number}> = ({off}) => {
  const f = useCurrentFrame() - off;
  return (
    <AbsoluteFill>
      <BigTitle f={f} delay={6} size={80} parts={[
        {t: "AI 眼里的", c: INK}, {t: "填空题", c: BLUE},
      ]} />

      {/* 黑板 */}
      <PopAt f={f} delay={16} x={430} y={215} w={1060} h={210}>
        <div style={{
          position: "absolute", inset: 0, backgroundColor: "#3f5d4a", borderRadius: 22,
          border: `9px solid #8a6a4a`, boxShadow: "0 14px 30px rgba(47,58,69,0.18)",
          display: "flex", alignItems: "center", justifyContent: "center", gap: 20,
        }}>
          <div style={{fontFamily: F, fontWeight: 900, fontSize: 72, color: "#fff", letterSpacing: 8}}>今天天气真</div>
          <div style={{
            position: "relative", width: 165, height: 92, borderRadius: 12,
            border: `5px dashed rgba(255,255,255,0.75)`,
          }}>
            <Cursor f={f} x={14} y={8} h={72} c={YEL} />
          </div>
        </div>
      </PopAt>
      <Label f={f} d={24} x={430} y={462} w={1060} text="它在算：空白处填哪个词最合适" size={30} color={SUBC} />

      {/* 三个候选词概率条 */}
      <ProbBar f={f} delay={128} x={130} y={530} w={520} ch="好" blockColor={ORANGE} pct={72} selDelay={168} />
      <ProbBar f={f} delay={140} x={700} y={530} w={520} ch="糟" blockColor={BLUE} pct={18} />
      <ProbBar f={f} delay={152} x={1270} y={530} w={520} ch="蓝" blockColor={GREEN} pct={3} />

      {/* AI 选中「好」 */}
      <FlashRing f={f} at={168} x={390} y={595} color={GREEN} />
      <Label f={f} d={172} x={240} y={690} w={300} text="AI 选了它" color={GREEN} size={34} weight={900} />
      <Sparkle x={660} y={520} s={0.75} />
      <Sparkle x={1790} y={480} s={0.6} color="#b8d4f2" />
    </AbsoluteFill>
  );
};

// P4 像≠对：天平（左「像真话」右「是真话？」）+ 红问号
const PageBalance: React.FC<{off: number}> = ({off}) => {
  const f = useCurrentFrame() - off;
  const qPulse = 0.75 + 0.25 * Math.sin(f / 9);
  return (
    <AbsoluteFill>
      <BigTitle f={f} delay={6} size={88} parts={[
        {t: "像", c: BLUE}, {t: " ≠ ", c: INK}, {t: "对", c: RED},
      ]} />

      {/* 天平底座（不随横梁摆动） */}
      <svg width={220} height={150} style={{position: "absolute", left: 850, top: 560, overflow: "visible"}}>
        <path d="M110 8 L180 128 L40 128 Z" fill="#55677c" />
        <rect x={10} y={126} width={200} height={14} rx={7} fill="#3f4d5e" />
      </svg>

      {/* 横梁 + 两侧托盘卡（整体微摆动循环） */}
      <div style={{
        position: "absolute", left: 360, top: 300, width: 1200, height: 320,
        transform: `rotate(${-2.5 + Math.sin(f / 18) * 1.2}deg)`, transformOrigin: "600px 145px",
      }}>
        <div style={{position: "absolute", left: 0, top: 138, width: 1200, height: 14, borderRadius: 7, backgroundColor: INK}} />
        {/* 左盘：像真话 */}
        <svg width={30} height={70} style={{position: "absolute", left: 55, top: 145, overflow: "visible"}}>
          <line x1={15} y1={0} x2={15} y2={66} stroke="#9fb4c8" strokeWidth={6} />
        </svg>
        <PopAt f={f} delay={58} x={-115} y={208} w={440} h={110}>
          <div style={{
            position: "absolute", inset: 0, backgroundColor: ORANGE_BG, border: `4px solid ${ORANGE}`,
            borderRadius: 22, display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <div style={{fontFamily: F, fontWeight: 900, fontSize: 46, color: ORANGE, whiteSpace: "nowrap"}}>像真话</div>
          </div>
        </PopAt>
        {/* 右盘：是真话？ */}
        <svg width={30} height={70} style={{position: "absolute", left: 1115, top: 145, overflow: "visible"}}>
          <line x1={15} y1={0} x2={15} y2={66} stroke="#9fb4c8" strokeWidth={6} />
        </svg>
        <PopAt f={f} delay={85} x={875} y={208} w={440} h={110}>
          <div style={{
            position: "absolute", inset: 0, backgroundColor: RED_BG, border: `4px dashed ${RED}`,
            borderRadius: 22, display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <div style={{fontFamily: F, fontWeight: 900, fontSize: 46, color: RED, whiteSpace: "nowrap"}}>是真话？</div>
          </div>
        </PopAt>
      </div>

      {/* 红色大问号 */}
      <div style={{
        position: "absolute", left: 1440, top: 180, width: 200, textAlign: "center",
        fontFamily: F, fontWeight: 900, fontSize: 110, color: RED, opacity: prog(f, 90) * qPulse,
        transform: `scale(${0.7 + 0.3 * ease(prog(f, 90))})`,
      }}>?</div>

      <Pill f={f} delay={131} x={640} y={795} w={640} h={76} bg={YEL} text="说出口 全看像不像" color={INK} ts={36} />
      <Sparkle x={330} y={250} s={0.8} />
      <Sparkle x={1560} y={700} s={0.6} color="#fdecec" />
    </AbsoluteFill>
  );
};

// P5 编书演示：问一本不存在的书 → AI 逐字编出一本 + 红虚线框 + 「编的」标签
const PageBook: React.FC<{off: number}> = ({off}) => {
  const f = useCurrentFrame() - off;
  return (
    <AbsoluteFill>
      <BigTitle f={f} delay={6} size={80} parts={[
        {t: "AI ", c: BLUE}, {t: "会怎么答？", c: INK},
      ]} />

      {/* 用户提问 */}
      <ChatBubble f={f} delay={3} side="user" x={1080} y={195} w={640} h={92} text="推荐一本讲火星文明的书" ts={32} />

      {/* AI 气泡 */}
      <ChatBubble f={f} delay={55} side="ai" x={240} y={330} w={620} h={96} text="没问题！这本讲得特别好：" ts={32} />
      <div style={{
        position: "absolute", left: 250, top: 455, width: 420,
        fontFamily: F, fontWeight: 700, fontSize: 28, color: SUBC, whiteSpace: "nowrap",
        opacity: prog(f, 111),
      }}>顺着语气 接着写</div>
      <FlatArrow f={f} x1={600} y1={438} x2={730} y2={505} delay={120} color="#9fb4c8" sw={6} />

      {/* 书的灰色轮廓（占位，AI 正在编写） */}
      <div style={{
        position: "absolute", left: 720, top: 500, width: 560, height: 340,
        border: `4px dashed #c9d2dc`, borderRadius: 18, backgroundColor: "#f4f7fa",
        display: "flex", alignItems: "center", justifyContent: "center", gap: 14,
        opacity: prog(f, 60),
      }}>
        <div style={{fontFamily: F, fontWeight: 700, fontSize: 32, color: "#b6c2cf", letterSpacing: 4, whiteSpace: "nowrap"}}>AI 正在编写</div>
        {[0, 1, 2].map((i) => (
          <div key={i} style={{
            width: 13, height: 13, borderRadius: 99, backgroundColor: "#b6c2cf",
            opacity: Math.floor(f / 9) % 3 === i ? 1 : 0.3,
          }} />
        ))}
      </div>

      {/* 红色虚线框 + 编的标签 */}
      <div style={{
        position: "absolute", left: 690, top: 470, width: 640, height: 400,
        border: `5px dashed ${RED}`, borderRadius: 26, opacity: prog(f, 156),
      }} />
      <Pill f={f} delay={156} x={1170} y={432} w={160} h={66} bg={RED} text="编的" color="#fff" ts={38} />

      {/* 书卡 */}
      <PopAt f={f} delay={129} x={720} y={500} w={560} h={340}>
        <div style={{
          position: "absolute", inset: 0, backgroundColor: ORANGE, borderRadius: 18,
          boxShadow: "0 16px 34px rgba(240,145,45,0.35)", overflow: "hidden",
        }}>
          <div style={{position: "absolute", left: 0, top: 0, bottom: 0, width: 26, backgroundColor: "#d97f22"}} />
          <div style={{position: "absolute", left: 70, top: 56, width: 460, fontFamily: F, fontWeight: 900, fontSize: 52, color: "#fff", whiteSpace: "nowrap"}}>
            不存在的书
          </div>
          <div style={{position: "absolute", left: 70, top: 150, width: 460, height: 5, borderRadius: 3, backgroundColor: "rgba(255,255,255,0.55)"}} />
          <div style={{position: "absolute", left: 70, top: 190, width: 460, fontFamily: F, fontWeight: 700, fontSize: 30, color: "#fff", opacity: prog(f, 141), whiteSpace: "nowrap"}}>
            作者：佚名
          </div>
          <div style={{position: "absolute", left: 70, top: 244, width: 460, fontFamily: F, fontWeight: 700, fontSize: 30, color: "#fff", opacity: prog(f, 152), whiteSpace: "nowrap"}}>
            出版于 2049 年
          </div>
        </div>
      </PopAt>

      <Sparkle x={560} y={250} s={0.8} />
      <Sparkle x={1400} y={620} s={0.65} color="#fdecec" />
    </AbsoluteFill>
  );
};

// P6 命名页：幻觉 Hallucination 大盖章 + 不是Bug 是原理
const PageName: React.FC<{off: number}> = ({off}) => {
  const f = useCurrentFrame() - off;
  const qPulse = 0.5 + 0.3 * Math.sin(f / 10);
  return (
    <AbsoluteFill>
      <Pill f={f} delay={8} x={660} y={64} w={600} h={66} bg={RED_BG} text="一个正式的名字" color={RED} ts={32} />

      {/* 大盖章 */}
      <Stamp f={f} delay={31} x={640} y={280} w={640} h={230} text="幻觉" ts={120} rot={-6} />
      <Label f={f} d={40} x={560} y={555} w={800} text="Hallucination" size={46} color={SUBC} weight={700} />

      {/* 漂浮问号 */}
      <div style={{
        position: "absolute", left: 300, top: 300, width: 140, textAlign: "center",
        fontFamily: F, fontWeight: 900, fontSize: 100, color: "#c3cfdd", opacity: prog(f, 50) * qPulse,
      }}>?</div>
      <div style={{
        position: "absolute", left: 1490, top: 260, width: 140, textAlign: "center",
        fontFamily: F, fontWeight: 900, fontSize: 130, color: "#c3cfdd", opacity: prog(f, 58) * qPulse,
      }}>?</div>

      {/* 中段：先否定「程序出错」 */}
      <Pill f={f} delay={63} x={710} y={648} w={480} h={70} bg="#f6f8fa" text="程序出错了？" color={SUBC} ts={34} />
      <PopAt f={f} delay={70} x={1150} y={648} w={70} h={70}>
        <svg width={70} height={70} style={{position: "absolute", left: 0, top: 0, overflow: "visible"}}>
          <circle cx={35} cy={35} r={32} fill="#fdecec" opacity={0.9} />
          <path d="M23 23 L47 47 M47 23 L23 47" fill="none" stroke={RED} strokeWidth={8} strokeLinecap="round" />
        </svg>
      </PopAt>

      <Pill f={f} delay={118} x={590} y={775} w={740} h={84} bg={RED_BG} border={`3px dashed ${RED}`}
        text="不是Bug 是原理" color={RED} ts={42} />
      <Sparkle x={520} y={270} s={0.85} />
      <Sparkle x={1370} y={560} s={0.7} color="#fdecec" />
      <Sparkle x={640} y={640} s={0.6} color="#bfe3cc" />
    </AbsoluteFill>
  );
};

// P7 草稿页：AI 答案文档盖「草稿」章 + 人工核对清单打绿勾
const PageDraft: React.FC<{off: number}> = ({off}) => {
  const f = useCurrentFrame() - off;
  return (
    <AbsoluteFill>
      <BigTitle f={f} delay={8} size={76} parts={[
        {t: "答案", c: INK}, {t: " 只是", c: INK}, {t: "草稿", c: RED},
      ]} />

      {/* 左：AI 答案文档 */}
      <FlatCard f={f} delay={12} x={240} y={240} w={640} h={540}>
        <div style={{
          position: "absolute", left: 0, top: 0, right: 0, height: 84,
          backgroundColor: BLUE, borderTopLeftRadius: 23, borderTopRightRadius: 23,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontFamily: F, fontWeight: 900, fontSize: 34, color: "#fff", letterSpacing: 4,
        }}>AI 的回答</div>
        {[540, 470, 520, 390].map((w, i) => (
          <div key={i} style={{position: "absolute", left: 50, top: 130 + i * 52, width: w, height: 16, borderRadius: 8, backgroundColor: "#e8edf3"}} />
        ))}
        <div style={{position: "absolute", left: 50, top: 350, width: 540, height: 16, borderRadius: 8, backgroundColor: "#e8edf3"}} />
        <div style={{position: "absolute", left: 50, top: 420, width: 540, textAlign: "left", fontFamily: F, fontWeight: 700, fontSize: 28, color: SUBC, whiteSpace: "nowrap"}}>
          读起来 头头是道
        </div>
      </FlatCard>
      <Stamp f={f} delay={57} x={590} y={275} w={260} h={120} text="草稿" ts={60} rot={-14} />

      {/* 右：人工核对清单 */}
      <FlatCard f={f} delay={26} x={1100} y={240} w={620} h={540} chip="人工核对" chipColor={GREEN}>
        {[
          {y: 110, d: 82, t: "日期 对不对"},
          {y: 235, d: 96, t: "数字 准不准"},
          {y: 360, d: 110, t: "出处 有没有"},
        ].map((it, i) => (
          <div key={i}>
            <PopAt f={f} delay={it.d} x={60} y={it.y} w={56} h={56}>
              <MarkOk x={28} y={28} s={0.95} />
            </PopAt>
            <div style={{
              position: "absolute", left: 145, top: it.y + 4, width: 420,
              fontFamily: F, fontWeight: 900, fontSize: 38, color: INK, whiteSpace: "nowrap",
              opacity: prog(f, it.d),
            }}>{it.t}</div>
          </div>
        ))}
        <div style={{
          position: "absolute", left: 0, top: 470, width: 620, textAlign: "center",
          fontFamily: F, fontWeight: 900, fontSize: 34, color: GREEN, opacity: prog(f, 143),
        }}>都核过 才敢用</div>
      </FlatCard>

      <Sparkle x={960} y={250} s={0.8} />
      <Sparkle x={1750} y={720} s={0.6} color="#bfe3cc" />
    </AbsoluteFill>
  );
};

// P8 金句横幅：黄横幅微倾斜 + 左右小结卡
const PageQuote: React.FC<{off: number}> = ({off}) => {
  const f = useCurrentFrame() - off;
  return (
    <AbsoluteFill>
      <PopAt f={f} delay={10} x={340} y={250} w={1240} h={140} rot={-1.5}>
        <div style={{
          position: "absolute", inset: 0, backgroundColor: YEL, borderRadius: 26,
          display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: "0 14px 30px rgba(247,201,72,0.4)",
        }}>
          <span style={{fontFamily: F, fontWeight: 900, fontSize: 56, letterSpacing: 4, whiteSpace: "nowrap"}}>
            <span style={{color: INK}}>AI 不负责</span>
            <span style={{color: RED}}>对</span>
            <span style={{color: INK}}> 只负责</span>
            <span style={{color: BLUE}}>像</span>
          </span>
        </div>
      </PopAt>

      {/* 左右小结卡 */}
      <FlatCard f={f} delay={56} x={210} y={500} w={700} h={240} chip="看答案" chipColor={BLUE}>
        <div style={{position: "absolute", left: 0, top: 62, width: 700, textAlign: "center", fontFamily: F, fontWeight: 900, fontSize: 52, color: INK}}>
          先当<span style={{color: ORANGE}}>草稿</span>读
        </div>
        <div style={{position: "absolute", left: 0, top: 152, width: 700, textAlign: "center", fontFamily: F, fontSize: 27, color: SUBC}}>
          别直接全信
        </div>
      </FlatCard>
      <FlatCard f={f} delay={72} x={1010} y={500} w={700} h={240} chip="做核对" chipColor={GREEN}>
        <div style={{position: "absolute", left: 0, top: 62, width: 700, textAlign: "center", fontFamily: F, fontWeight: 900, fontSize: 52, color: INK}}>
          关键处<span style={{color: GREEN}}>自己查</span>
        </div>
        <div style={{position: "absolute", left: 0, top: 152, width: 700, textAlign: "center", fontFamily: F, fontSize: 27, color: SUBC}}>
          日期 · 数字 · 出处
        </div>
      </FlatCard>

      <Sparkle x={300} y={230} s={0.9} />
      <Sparkle x={1620} y={340} s={0.7} />
    </AbsoluteFill>
  );
};

// P9 结尾截图卡：亮底大字卡 + 要点 + 落款 + 关注胶囊（最后~100帧完全静止）
const PageCard: React.FC<{off: number}> = ({off}) => {
  const f = useCurrentFrame() - off;
  return (
    <AbsoluteFill>
      <FlatCard f={f} delay={20} x={460} y={160} w={1000} h={640} chip="小秋笔记" chipColor={BLUE}
        fill="#fffdf5">
        <div style={{position: "absolute", left: 0, top: 110, width: 1000, textAlign: "center", whiteSpace: "nowrap"}}>
          <span style={{fontFamily: F, fontWeight: 900, fontSize: 60, letterSpacing: 3}}>
            <span style={{color: BLUE}}>AI</span>
            <span style={{color: INK}}> = </span>
            <span style={{color: ORANGE}}>猜下一个词</span>
          </span>
        </div>
        <div style={{position: "absolute", left: 180, top: 230, width: 640, height: 3, backgroundColor: BORDER}} />
        <div style={{position: "absolute", left: 0, top: 285, width: 1000, display: "flex", justifyContent: "center", alignItems: "center", gap: 16}}>
          <div style={{width: 16, height: 16, borderRadius: 99, backgroundColor: GREEN}} />
          <div style={{fontFamily: F, fontWeight: 900, fontSize: 40, color: INK, whiteSpace: "nowrap"}}>不知道对错 只管像不像</div>
        </div>
        <div style={{position: "absolute", left: 0, top: 375, width: 1000, display: "flex", justifyContent: "center", alignItems: "center", gap: 16}}>
          <div style={{width: 16, height: 16, borderRadius: 99, backgroundColor: ORANGE}} />
          <div style={{fontFamily: F, fontWeight: 900, fontSize: 40, color: INK, whiteSpace: "nowrap"}}>重要信息 自己再核一遍</div>
        </div>
        <div style={{position: "absolute", left: 0, top: 505, width: 1000, textAlign: "center", fontFamily: F, fontSize: 30, color: SUBC, whiteSpace: "nowrap"}}>
          小秋 · 0基础也能学会
        </div>
      </FlatCard>

      {/* 关注胶囊 */}
      <PopAt f={f} delay={174} x={710} y={830} w={500} h={84}>
        <div style={{
          position: "absolute", inset: 0, backgroundColor: ORANGE, borderRadius: 999,
          display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: "0 14px 30px rgba(240,145,45,0.4)",
        }}>
          <span style={{fontFamily: F, fontWeight: 900, fontSize: 40, color: "#fff", letterSpacing: 6, whiteSpace: "nowrap"}}>关注 全栈小秋</span>
        </div>
      </PopAt>

      <Sparkle x={400} y={190} s={0.9} />
      <Sparkle x={1520} y={240} s={0.7} />
      <Sparkle x={1460} y={840} s={0.6} color="#bfe3cc" />
    </AbsoluteFill>
  );
};

// ============ 主组件 ============

// 各句配音起始帧（页面边界 = SENT，从 timeline.json 读取）
const SENT = [0, 200, 345, 549, 700, 887, 1057, 1221, 1349];
const VOICE_END = [194, 339, 544, 694, 882, 1052, 1216, 1344, 1534];
const PAGES = [
  {C: PageCover, start: SENT[0], end: SENT[1]},
  {C: PageCore, start: SENT[1], end: SENT[2]},
  {C: PageBlank, start: SENT[2], end: SENT[3]},
  {C: PageBalance, start: SENT[3], end: SENT[4]},
  {C: PageBook, start: SENT[4], end: SENT[5]},
  {C: PageName, start: SENT[5], end: SENT[6]},
  {C: PageDraft, start: SENT[6], end: SENT[7]},
  {C: PageQuote, start: SENT[7], end: SENT[8]},
  {C: PageCard, start: SENT[8], end: DUR},
];

export const AiHallucinationFlat: React.FC = () => {
  const frame = useCurrentFrame();
  const bed = interpolate(frame, [0, 20, DUR - 130, DUR - 100, DUR - 26, DUR - 1], [0, 0.06, 0.06, 0.1, 0.17, 0], clamp);
  return (
    <AbsoluteFill style={{background: "linear-gradient(180deg,#fff 0%,#f3f6f9 100%)", fontFamily: F, overflow: "hidden"}}>
      <BgDots />
      {PAGES.map(({C, start, end}, i) => {
        const first = i === 0, last = i === PAGES.length - 1, len = end - start;
        return (
          <Sequence key={i} from={start} durationInFrames={last ? DUR - start : len + 10}>
            <PageTurn off={0} len={len} first={first} last={last}><C off={0} /></PageTurn>
          </Sequence>
        );
      })}
      {/* 右上角品牌角标 */}
      <div style={{
        position: "absolute", top: 45, right: 70, zIndex: 45, border: `3px solid ${BLUE}`,
        borderRadius: 999, padding: "7px 25px", fontSize: 28, fontWeight: 900, color: INK,
        letterSpacing: 5, background: "#fff",
      }}>全栈小秋</div>

      {/* 配音层 */}
      {SENT.map((start, i) => (
        <Sequence key={`v-${i}`} from={start} durationInFrames={VOICE_END[i] - start + 20}>
          <Audio src={staticFile(`audio/aihallucination-tts/s0${i + 1}.mp3`)} volume={1} />
        </Sequence>
      ))}

      {/* 音效层（全部从 SENT / 词级锚点推导） */}
      {/* 翻页 */}
      {SENT.slice(1).map((t, i) => (
        <Sequence key={`pg-${i}`} from={t - 6} durationInFrames={24}>
          <Audio src={staticFile("audio/sfx/page3.wav")} volume={0.28} />
        </Sequence>
      ))}
      {/* P2：AI 回忆(灰) pop / 猜下一个词 whoosh */}
      <Sequence from={SENT[1] + 40} durationInFrames={12}>
        <Audio src={staticFile("audio/sfx/pop.wav")} volume={0.26} />
      </Sequence>
      <Sequence from={SENT[1] + 111} durationInFrames={12}>
        <Audio src={staticFile("audio/sfx/whoosh.wav")} volume={0.22} />
      </Sequence>
      {/* P3：候选词切换 switch + 选中 ding */}
      {[128, 140, 152].map((t) => (
        <Sequence key={`sw3-${t}`} from={SENT[2] + t} durationInFrames={12}>
          <Audio src={staticFile("audio/sfx/switch.wav")} volume={0.22} />
        </Sequence>
      ))}
      <Sequence from={SENT[2] + 168} durationInFrames={20}>
        <Audio src={staticFile("audio/sfx/ding.wav")} volume={0.3} />
      </Sequence>
      {/* P4：左盘 pop / 右盘问号 pop */}
      {[58, 99].map((t) => (
        <Sequence key={`pp4-${t}`} from={SENT[3] + t} durationInFrames={12}>
          <Audio src={staticFile("audio/sfx/pop.wav")} volume={0.26} />
        </Sequence>
      ))}
      {/* P5：提问 pop / AI 气泡 pop / 书 pop / 编的 error */}
      <Sequence from={SENT[4] + 3} durationInFrames={12}>
        <Audio src={staticFile("audio/sfx/pop.wav")} volume={0.26} />
      </Sequence>
      <Sequence from={SENT[4] + 55} durationInFrames={12}>
        <Audio src={staticFile("audio/sfx/pop.wav")} volume={0.26} />
      </Sequence>
      <Sequence from={SENT[4] + 129} durationInFrames={12}>
        <Audio src={staticFile("audio/sfx/pop.wav")} volume={0.26} />
      </Sequence>
      <Sequence from={SENT[4] + 156} durationInFrames={22}>
        <Audio src={staticFile("audio/sfx/error.wav")} volume={0.3} />
      </Sequence>
      {/* P6：幻觉章 error / 否定bug pop / 原理胶囊 pop */}
      <Sequence from={SENT[5] + 31} durationInFrames={22}>
        <Audio src={staticFile("audio/sfx/error.wav")} volume={0.3} />
      </Sequence>
      <Sequence from={SENT[5] + 63} durationInFrames={12}>
        <Audio src={staticFile("audio/sfx/pop.wav")} volume={0.26} />
      </Sequence>
      <Sequence from={SENT[5] + 118} durationInFrames={12}>
        <Audio src={staticFile("audio/sfx/pop.wav")} volume={0.26} />
      </Sequence>
      {/* P7：草稿章 error / 逐项打勾 ding + 收尾 ding */}
      <Sequence from={SENT[6] + 57} durationInFrames={22}>
        <Audio src={staticFile("audio/sfx/error.wav")} volume={0.3} />
      </Sequence>
      {[82, 96, 110, 143].map((t) => (
        <Sequence key={`dg7-${t}`} from={SENT[6] + t} durationInFrames={20}>
          <Audio src={staticFile("audio/sfx/ding.wav")} volume={0.3} />
        </Sequence>
      ))}
      {/* P8：横幅 whoosh / 小结卡 pop */}
      <Sequence from={SENT[7] + 10} durationInFrames={12}>
        <Audio src={staticFile("audio/sfx/whoosh.wav")} volume={0.22} />
      </Sequence>
      {[56, 72].map((t) => (
        <Sequence key={`pq8-${t}`} from={SENT[7] + t} durationInFrames={12}>
          <Audio src={staticFile("audio/sfx/pop.wav")} volume={0.26} />
        </Sequence>
      ))}
      {/* P9：截图卡 pop / 关注胶囊 pop */}
      <Sequence from={SENT[8] + 20} durationInFrames={12}>
        <Audio src={staticFile("audio/sfx/pop.wav")} volume={0.26} />
      </Sequence>
      <Sequence from={SENT[8] + 174} durationInFrames={12}>
        <Audio src={staticFile("audio/sfx/pop.wav")} volume={0.3} />
      </Sequence>

      {/* 铺底 */}
      <Audio src={staticFile("audio/bed.wav")} loop volume={() => bed} />
      <Sequence from={1349} durationInFrames={60}>
        <Audio src={staticFile("audio/sfx/warm3.wav")} volume={0.26} />
      </Sequence>
      <Subtitle />
    </AbsoluteFill>
  );
};
