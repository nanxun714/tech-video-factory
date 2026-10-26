import React from "react";
import {Audio} from "@remotion/media";
import {AbsoluteFill, interpolate, Sequence, staticFile, useCurrentFrame} from "remotion";

// ============ 扁平可爱插画科普风 · token 是什么（与"AI幻觉"同批视觉资产，全栈小秋 IP） ============
// 结构：封面钩子 → 切块演示 → 粒度对比 → 数字化 → 逐块预测(核心) → 打字机真相 → 计费 → 金句 → 截图卡
// 语义色：用户气泡=右侧浅灰 / AI气泡=左侧蓝#4a86d8；积木块四色池轮换；候选概率条橙色最长

export const DUR = 1578;

// 各句配音起始帧（页面边界，来自 public/audio/token-tts/timeline.json）
const SENT = [0, 130, 327, 536, 724, 928, 1093, 1292, 1413];

type Sub = {s: number; e: number; t: string};
const subs: Sub[] = [
  {s: 0, e: 59, t: "你发给AI的一句话"},
  {s: 59, e: 85, t: "在它眼里"},
  {s: 85, e: 124, t: "根本不是汉字"},
  {s: 130, e: 159, t: "AI看文字"},
  {s: 159, e: 223, t: "先把句子切成一个个小块"},
  {s: 223, e: 258, t: "一块一块地看"},
  {s: 258, e: 321, t: "这些小块就叫token"},
  {s: 327, e: 368, t: "一个token"},
  {s: 368, e: 403, t: "可能是一个词"},
  {s: 403, e: 420, t: "半个词"},
  {s: 420, e: 455, t: "或者一个标点"},
  {s: 455, e: 531, t: "汉字经常一两个字就切成一块"},
  {s: 536, e: 561, t: "切完之后"},
  {s: 561, e: 643, t: "每块token变成一串数字"},
  {s: 643, e: 693, t: "AI眼里全是数字"},
  {s: 693, e: 718, t: "没有文字"},
  {s: 724, e: 748, t: "它的工作"},
  {s: 748, e: 808, t: "就是根据前面的数字块"},
  {s: 808, e: 874, t: "猜下一个最可能的数字块"},
  {s: 874, e: 922, t: "一个接一个往外蹦"},
  {s: 928, e: 1011, t: "所以AI一个字一个字往外打"},
  {s: 1011, e: 1043, t: "不是在打字"},
  {s: 1043, e: 1088, t: "是它在逐块预测"},
  {s: 1093, e: 1182, t: "这也解释了为什么按token收费"},
  {s: 1182, e: 1249, t: "因为AI算的从来不是字数"},
  {s: 1249, e: 1287, t: "是积木块的数量"},
  {s: 1292, e: 1307, t: "记住"},
  {s: 1307, e: 1353, t: "AI不认识字"},
  {s: 1353, e: 1407, t: "它只认识积木块"},
  {s: 1413, e: 1454, t: "这张卡截图存好"},
  {s: 1454, e: 1524, t: "token这个面试高频词"},
  {s: 1524, e: 1553, t: "你就拿下了"},
];

// ---------- 基础原语（本地实现，不 import flatKit） ----------

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
      <pattern id="token-dots" width="46" height="46" patternUnits="userSpaceOnUse">
        <circle cx="23" cy="23" r="2.6" fill="#dbe4ee" />
      </pattern>
    </defs>
    <rect width={W} height={H} fill="url(#token-dots)" opacity={0.5} />
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

// ---------- 本片专属原语 ----------

// 积木块：圆角方块内写字，白色高光边（四色池轮换 蓝/橙/绿/黄）
const TOKEN_COLORS = [BLUE, ORANGE, GREEN, YEL];
const TokenBlock: React.FC<{
  x?: number; y?: number; w?: number; h?: number; text: string; color: string;
  fs?: number; tc?: string; style?: React.CSSProperties;
}> = ({x, y, w = 130, h = 110, text, color, fs = 52, tc = "#fff", style}) => (
  <div style={{
    position: x !== undefined ? "absolute" : "relative",
    left: x, top: y, width: w, height: h,
    backgroundColor: color,
    border: "4px solid #fff",
    borderRadius: Math.min(w, h) * 0.2,
    boxShadow: "0 8px 18px rgba(47,58,69,0.2), inset 0 -8px 0 rgba(0,0,0,0.12), inset 0 3px 0 rgba(255,255,255,0.45)",
    display: "flex", alignItems: "center", justifyContent: "center",
    fontFamily: F, fontWeight: 900, fontSize: fs, color: tc, letterSpacing: 2,
    ...style,
  }}>{text}</div>
);

// 用户气泡：右侧浅灰圆角（尾巴朝右）
const UserBubble: React.FC<{x: number; y: number; w: number; h: number; text: string; ts?: number}> = ({x, y, w, h, text, ts = 48}) => (
  <div style={{position: "absolute", left: x, top: y, width: w, height: h}}>
    <div style={{
      position: "absolute", inset: 0, backgroundColor: "#eef1f6", border: `3px solid ${BORDER}`,
      borderRadius: 26, display: "flex", alignItems: "center", justifyContent: "center",
      fontFamily: F, fontWeight: 900, fontSize: ts, color: INK, boxShadow: "0 8px 18px rgba(47,58,69,0.08)",
    }}>{text}</div>
    <svg width={40} height={36} style={{position: "absolute", right: -32, top: h / 2 - 18, overflow: "visible"}}>
      <path d="M2 4 L36 18 L2 32 Z" fill="#eef1f6" stroke={BORDER} strokeWidth={3} strokeLinejoin="round" />
    </svg>
  </div>
);

// AI 气泡：左侧蓝底白字（尾巴朝左）
const AiBubble: React.FC<{x: number; y: number; w: number; h: number; children: React.ReactNode}> = ({x, y, w, h, children}) => (
  <div style={{position: "absolute", left: x, top: y, width: w, height: h}}>
    <div style={{
      position: "absolute", inset: 0, backgroundColor: BLUE,
      borderRadius: 30, display: "flex", alignItems: "center", justifyContent: "center",
      boxShadow: "0 12px 26px rgba(74,134,216,0.3)", padding: "0 36px",
    }}>{children}</div>
    <svg width={40} height={36} style={{position: "absolute", left: -32, top: h / 2 - 18, overflow: "visible"}}>
      <path d="M38 4 L4 18 L38 32 Z" fill={BLUE} />
    </svg>
  </div>
);

// 候选词概率条（横向条形图，最像的橙色最长 + 百分比数字）
const ProbBar: React.FC<{
  f: number; delay: number; y: number; w: number; label: string; pct: number; maxPct: number;
}> = ({f, delay, y, w, label, pct, maxPct}) => {
  const p = prog(f, delay, 14);
  if (p <= 0) return null;
  const isTop = pct === maxPct;
  const barW = (w - 250) * (pct / maxPct) * ease(p);
  return (
    <div style={{position: "absolute", left: 30, top: y, width: w - 60, height: 74}}>
      <div style={{position: "absolute", left: 0, top: 12, width: 150, fontFamily: F, fontWeight: 700, fontSize: 32, color: INK, textAlign: "right"}}>{label}</div>
      <div style={{position: "absolute", left: 170, top: 8, width: w - 260, height: 54, backgroundColor: "#f1f4f8", borderRadius: 14, overflow: "visible"}}>
        <div style={{
          width: Math.max(barW, 4), height: "100%", borderRadius: 14,
          backgroundColor: isTop ? ORANGE : "#b9c6d6",
          boxShadow: isTop ? "0 6px 14px rgba(240,145,45,0.35), inset 0 -5px 0 rgba(0,0,0,0.12), inset 0 2px 0 rgba(255,255,255,0.4)" : "inset 0 -5px 0 rgba(0,0,0,0.08)",
        }} />
        {isTop ? (
          <div style={{
            position: "absolute", left: 170 + Math.max(barW, 4) + 14, top: 8,
            fontFamily: F, fontWeight: 900, fontSize: 36, color: ORANGE, opacity: p,
          }}>{pct}%</div>
        ) : (
          <div style={{
            position: "absolute", left: 170 + Math.max(barW, 4) + 14, top: 12,
            fontFamily: F, fontWeight: 700, fontSize: 28, color: SUBC, opacity: p,
          }}>{pct}%</div>
        )}
      </div>
    </div>
  );
};

// 翻页叠化（首页第0帧完整，末页不淡出）
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
    <div style={{position: "absolute", bottom: 30, left: 0, width: W, zIndex: 50, display: "flex", justifyContent: "center"}}>
      <div style={{
        background: "rgba(12,14,18,.82)", borderRadius: 15, padding: "11px 32px",
        fontFamily: F, fontWeight: 700, fontSize: 46, color: "#fff", letterSpacing: 2, whiteSpace: "nowrap",
      }}>{cur.t}</div>
    </div>
  );
};

// 剪刀图标（切块页）
const Scissors: React.FC<{x: number; y: number; s?: number; c?: string}> = ({x, y, s = 1, c = INK}) => (
  <svg width={48 * s} height={48 * s} viewBox="0 0 24 24"
    style={{position: "absolute", left: x - 24 * s, top: y - 24 * s, overflow: "visible"}}>
    <path d="M9.64 7.64c.23-.5.36-1.05.36-1.64 0-2.21-1.79-4-4-4S2 3.79 2 6s1.79 4 4 4c.59 0 1.14-.13 1.64-.36L10 12l-2.36 2.36C7.14 14.13 6.59 14 6 14c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4c0-.59-.13-1.14-.36-1.64L12 14l7 7h3v-1L9.64 7.64zM6 8c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm0 12c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm6-7.5c-.28 0-.5-.22-.5-.5s.22-.5.5-.5.5.22.5.5-.22.5-.5.5zM19 3l-6 6 2 2 7-7V3z" fill={c} />
  </svg>
);

// ============ 页面 ============

// P1 封面钩子（第0帧完整呈现，全部 delay=-99）
const PageHook: React.FC<{off: number}> = ({off}) => {
  const f = useCurrentFrame() - off;
  const coverBlocks: {t: string; c: string; w: number}[] = [
    {t: "你", c: BLUE, w: 150}, {t: "好", c: ORANGE, w: 150}, {t: "呀", c: GREEN, w: 150}, {t: "AI", c: YEL, w: 190},
  ];
  return (
    <AbsoluteFill>
      <BigTitle f={f} delay={-99} y={62} size={80} parts={[
        {t: "你打的字 ", c: INK}, {t: "AI", c: BLUE}, {t: " 眼里是什么？", c: INK},
      ]} />
      <Sparkle x={300} y={100} s={0.85} />
      <Sparkle x={1600} y={82} s={0.65} color="#b8d4f2" />

      {/* 左：用户气泡（后排小，浅灰） */}
      <PopAt f={f} delay={-99} x={150} y={380} w={480} h={150}>
        <Float f={f} amp={5}>
          <UserBubble x={0} y={0} w={480} h={150} text="你好呀AI" />
        </Float>
      </PopAt>
      <Label f={f} d={-99} x={150} y={556} w={480} text="你发出的" size={30} />

      {/* 中：放大镜（主角过渡） */}
      <PopAt f={f} delay={-99} x={830} y={330} w={260} h={260}>
        <Float f={f} amp={6}>
          <svg width={260} height={290} viewBox="0 0 260 290" style={{overflow: "visible"}}>
            <circle cx={118} cy={118} r={100} fill="#fff" stroke={INK} strokeWidth={12} />
            <circle cx={118} cy={118} r={100} fill="none" stroke={BLUE} strokeWidth={5} opacity={0.35} />
            <text x={118} y={142} textAnchor="middle" fontFamily={F} fontWeight={900} fontSize={78} fill={INK}>你</text>
            <line x1={190} y1={190} x2={248} y2={252} stroke={INK} strokeWidth={18} strokeLinecap="round" />
          </svg>
        </Float>
      </PopAt>

      {/* 右：AI 视角同句变彩色积木块（本页主角，最大） */}
      <PopAt f={f} delay={-99} x={1180} y={340} w={640} h={230}>
        <Float f={f} amp={5}>
          <div style={{position: "relative", width: 640, height: 230, display: "flex", gap: 16, alignItems: "center"}}>
            {coverBlocks.map((b, i) => (
              <TokenBlock key={i} w={b.w} h={190} text={b.t} color={b.c} fs={78} />
            ))}
          </div>
        </Float>
      </PopAt>
      <Label f={f} d={-99} x={1180} y={596} w={640} text="AI 眼里：彩色积木块" size={32} color={BLUE} weight={900} />

      {/* 连接箭头：气泡 → 放大镜 → 积木块 */}
      <FlatArrow f={f} x1={650} y1={455} x2={820} y2={455} delay={-99} color="#9fb4c8" dashed sw={6} />
      <FlatArrow f={f} x1={1090} y1={455} x2={1170} y2={455} delay={-99} color="#9fb4c8" dashed sw={6} />

      <Pill f={f} delay={-99} x={660} y={700} w={600} h={84} bg={ORANGE_BG} border={`3px dashed ${ORANGE}`} text="在它眼里是一串积木块" color={ORANGE} ts={36} />
      <Sparkle x={560} y={690} s={0.8} />
      <Sparkle x={1300} y={710} s={0.7} color="#bfe3cc" />
    </AbsoluteFill>
  );
};

// P2 切块演示：一句完整句子被切成4块彩色积木
const PageCut: React.FC<{off: number}> = ({off}) => {
  const f = useCurrentFrame() - off;
  // 词级锚点（s02 局部帧）：切成60 一个个71 小82 块89 一块一块地看101 这些小块143 token179
  const blocks: {t: string; c: string; d: number; w: number}[] = [
    {t: "帮", c: TOKEN_COLORS[0], d: 60, w: 190},
    {t: "我", c: TOKEN_COLORS[1], d: 71, w: 190},
    {t: "想个", c: TOKEN_COLORS[2], d: 82, w: 230},
    {t: "标题", c: TOKEN_COLORS[3], d: 89, w: 230},
  ];
  const bx = [470, 740, 1010, 1310];
  const sentenceGone = f >= 58;
  // 高亮环在一块一块地看时段循环跳块
  const hopIdx = f >= 101 && f < 143 ? Math.floor((f - 101) / 9) % 4 : -1;
  return (
    <AbsoluteFill>
      <Pill f={f} delay={6} x={700} y={60} w={520} h={66} bg={BLUE_BG} text="第一步 · 把句子切开" color={BLUE} ts={32} />

      {/* 完整句子（切块前） */}
      {!sentenceGone ? (
        <div style={{
          position: "absolute", left: 560, top: 240, width: 800, height: 120,
          backgroundColor: "#fff", border: `3px solid ${BORDER}`, borderRadius: 26,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontFamily: F, fontWeight: 900, fontSize: 62, color: INK, letterSpacing: 8,
          boxShadow: "0 10px 26px rgba(47,58,69,0.07)", opacity: prog(f, 10),
        }}>帮我想个标题</div>
      ) : null}

      {/* 三条分割虚线 + 剪刀 */}
      {[730, 995, 1295].map((cx, i) => {
        const p = prog(f, 50 + i * 3, 8);
        if (p <= 0) return null;
        return (
          <div key={i}>
            <svg width={W} height={H} style={{position: "absolute", left: 0, top: 0, pointerEvents: "none"}}>
              <line x1={cx} y1={300} x2={cx} y2={300 + 300 * p} stroke="#c3d2e2" strokeWidth={5} strokeDasharray="10 10" />
            </svg>
            <div style={{opacity: p}}>
              <Scissors x={cx} y={262} s={1.15} c={INK} />
            </div>
          </div>
        );
      })}

      {/* 四块彩色积木按口播弹出（主角，最满） */}
      {blocks.map((b, i) => (
        <PopAt key={i} f={f} delay={b.d} x={bx[i]} y={420} w={b.w} h={190}>
          <TokenBlock w={b.w} h={190} text={b.t} color={b.c} fs={76} />
        </PopAt>
      ))}
      {/* 高亮环逐块跳（一块一块地看） */}
      {hopIdx >= 0 ? (
        <div style={{
          position: "absolute", left: bx[hopIdx] - 10, top: 410, width: blocks[hopIdx].w + 20, height: 210,
          border: `6px solid ${YEL}`, borderRadius: 26, pointerEvents: "none",
        }} />
      ) : null}

      <PopAt f={f} delay={143} x={560} y={700} w={800} h={120} rot={-1}>
        <div style={{
          width: 800, height: 120, borderRadius: 26, backgroundColor: YEL,
          display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: "0 14px 30px rgba(247,201,72,0.4)",
          fontFamily: F, fontWeight: 900, fontSize: 56, color: INK, letterSpacing: 3,
        }}>这些小块 = <span style={{color: "#a3650a", marginLeft: 14}}>token</span></div>
      </PopAt>
      <Sparkle x={500} y={690} s={0.85} />
      <Sparkle x={1400} y={712} s={0.7} color="#b8d4f2" />
    </AbsoluteFill>
  );
};

// P3 粒度页：一个词 / 半个词 / 一个标点
const PageGranularity: React.FC<{off: number}> = ({off}) => {
  const f = useCurrentFrame() - off;
  // 词级锚点（s03 局部帧）：词51 半个67 标点106 汉字127 经常139
  return (
    <AbsoluteFill>
      <Pill f={f} delay={4} x={700} y={60} w={520} h={66} bg={ORANGE_BG} text="一块 token 可能是" color={ORANGE} ts={32} />

      <FlatCard f={f} delay={44} x={185} y={300} w={470} h={430} chip="一个词" chipColor={BLUE}>
        <div style={{position: "absolute", left: 0, top: 90, width: 470, display: "flex", justifyContent: "center"}}>
          <TokenBlock w={250} h={150} text="今天" color={TOKEN_COLORS[0]} fs={64} />
        </div>
        <div style={{position: "absolute", left: 0, top: 300, width: 470, textAlign: "center", fontFamily: F, fontSize: 28, color: SUBC}}>整块拿走</div>
      </FlatCard>

      <FlatCard f={f} delay={67} x={725} y={300} w={470} h={430} chip="半个词" chipColor={ORANGE}>
        <div style={{position: "absolute", left: 0, top: 90, width: 470, display: "flex", justifyContent: "center", alignItems: "center"}}>
          <TokenBlock w={125} h={150} text="ing" color={TOKEN_COLORS[1]} fs={44} style={{borderTopRightRadius: 6, borderBottomRightRadius: 6, borderRightWidth: 2}} />
          <div style={{
            width: 125, height: 150, marginLeft: 8, borderTop: `4px dashed ${BORDER}`,
            borderRight: `4px dashed ${BORDER}`, borderBottom: `4px dashed ${BORDER}`,
            borderTopRightRadius: 26, borderBottomRightRadius: 26,
          }} />
        </div>
        <div style={{position: "absolute", left: 0, top: 300, width: 470, textAlign: "center", fontFamily: F, fontSize: 28, color: SUBC}}>只切到一半</div>
      </FlatCard>

      <FlatCard f={f} delay={106} x={1265} y={300} w={470} h={430} chip="一个标点" chipColor={YEL}>
        <div style={{position: "absolute", left: 0, top: 110, width: 470, display: "flex", justifyContent: "center"}}>
          <TokenBlock w={110} h={110} text="！" color={TOKEN_COLORS[3]} fs={56} tc={INK} />
        </div>
        <div style={{position: "absolute", left: 0, top: 300, width: 470, textAlign: "center", fontFamily: F, fontSize: 28, color: SUBC}}>标点也单独算一块</div>
      </FlatCard>

      {/* 汉字粒度补充 */}
      <PopAt f={f} delay={139} x={460} y={780} w={1000} h={100}>
        <div style={{
          width: 1000, height: 100, borderRadius: 22, backgroundColor: BLUE_BG,
          border: `3px dashed ${BLUE}`, display: "flex", alignItems: "center", justifyContent: "center", gap: 18,
          fontFamily: F, fontWeight: 900, fontSize: 40, color: INK,
        }}>
          <span>汉字经常</span>
          <TokenBlock w={170} h={72} text="今天" color={TOKEN_COLORS[2]} fs={36} style={{position: "relative"}} />
          <span>= 1 块</span>
        </div>
      </PopAt>
      <Sparkle x={400} y={760} s={0.8} />
      <Sparkle x={1520} y={780} s={0.65} color="#b8d4f2" />
    </AbsoluteFill>
  );
};

// P4 数字化：积木块逐个翻面变数字串
const PageNumbers: React.FC<{off: number}> = ({off}) => {
  const f = useCurrentFrame() - off;
  // 词级锚点（s04 局部帧）：变成58 一串74 数字80 AI眼里全是数字102
  const flips = [
    {ch: "你", num: "104", color: TOKEN_COLORS[0], t: 58},
    {ch: "好", num: "2593", color: TOKEN_COLORS[1], t: 66},
    {ch: "呀", num: "87", color: TOKEN_COLORS[2], t: 74},
  ];
  return (
    <AbsoluteFill>
      <Pill f={f} delay={4} x={700} y={60} w={520} h={66} bg={BLUE_BG} text="切完之后 · 每一块" color={BLUE} ts={32} />
      <BigTitle f={f} delay={102} y={150} size={78} parts={[
        {t: "AI 不看文字 ", c: INK}, {t: "只看数字", c: ORANGE},
      ]} />

      {/* 三块翻面（主角） */}
      {flips.map((b, i) => {
        const appear = prog(f, 10 + i * 6);
        const p = prog(f, b.t, 14);
        // 正弦翻面：0→90→0，中点换面，避免 rotateY 180 背面镜像
        const rotY = Math.sin(Math.PI * ease(p)) * 90;
        const showNum = p >= 0.5;
        return (
          <div key={i} style={{
            position: "absolute", left: 520 + i * 320, top: 430, width: 260, height: 210,
            perspective: 900, opacity: appear,
            transform: `scale(${0.8 + 0.2 * appear})`, transformOrigin: "center center",
          }}>
            <div style={{
              width: 260, height: 210, transformStyle: "preserve-3d",
              transform: `rotateY(${rotY}deg)`,
            }}>
              {showNum ? (
                <TokenBlock w={260} h={210} text={b.num} color={b.color} fs={72} style={{position: "absolute", inset: 0}} />
              ) : (
                <TokenBlock w={260} h={210} text={b.ch} color={b.color} fs={96} style={{position: "absolute", inset: 0}} />
              )}
            </div>
          </div>
        );
      })}

      <PopAt f={f} delay={88} x={660} y={720} w={600} h={90}>
        <div style={{
          width: 600, height: 90, borderRadius: 20, backgroundColor: "#fff",
          border: `3px solid ${BORDER}`, display: "flex", alignItems: "center", justifyContent: "center",
          fontFamily: "Consolas, monospace", fontWeight: 700, fontSize: 44, color: INK, letterSpacing: 3,
        }}>[104, 2593, 87]</div>
      </PopAt>
      <Label f={f} d={96} x={660} y={830} w={600} text="文字块 → 数字串" size={30} />
      <Sparkle x={480} y={410} s={0.8} />
      <Sparkle x={1460} y={430} s={0.7} color="#b8d4f2" />
    </AbsoluteFill>
  );
};

// P5 逐块预测（核心页做最满）：队列 → 箭头 → 概率条 → 选中飞入队尾，循环2轮
const PagePredict: React.FC<{off: number}> = ({off}) => {
  const f = useCurrentFrame() - off;
  // 词级锚点（s05 局部帧）：数字块62 猜下87 最可能106/116 数字块130 一个接一个157 往外蹦181
  const roundA = [
    {label: "1520", pct: 67}, {label: "3021", pct: 21}, {label: "8846", pct: 12},
  ];
  const roundB = [
    {label: "408", pct: 72}, {label: "128", pct: 18}, {label: "5097", pct: 10},
  ];
  const fadeA = interpolate(f, [148, 156], [1, 0], clamp);
  // 飞行块：A轮 130→156，B轮 176→202
  const fly = (t0: number, from: {x: number; y: number}, to: {x: number; y: number}, num: string, color: string) => {
    const t = (f - t0) / 26;
    if (t <= 0 || t >= 1) return null;
    const x = from.x + (to.x - from.x) * t;
    const y = from.y + (to.y - from.y) * t - Math.sin(Math.PI * t) * 40;
    return (
      <div style={{position: "absolute", left: x, top: y, transform: "translate(-50%,-50%)"}}>
        <TokenBlock w={130} h={96} text={num} color={color} fs={40} style={{position: "relative"}} />
      </div>
    );
  };
  return (
    <AbsoluteFill>
      <Pill f={f} delay={4} x={640} y={54} w={640} h={66} bg={ORANGE_BG} text="AI 的工作 · 预测下一块" color={ORANGE} ts={32} />

      {/* 左：已生成队列（主角卡） */}
      <FlatCard f={f} delay={2} x={130} y={210} w={620} h={520} chip="已生成" chipColor={BLUE}>
        {[
          {n: "104", d: 6, x: 40, y: 60}, {n: "2593", d: 11, x: 220, y: 60}, {n: "87", d: 16, x: 430, y: 60},
        ].map((b, i) => (
          <PopAt key={`q0-${i}`} f={f} delay={b.d} x={b.x} y={b.y} w={150} h={110}>
            <TokenBlock w={150} h={110} text={b.n} color={TOKEN_COLORS[i % 4]} fs={42} />
          </PopAt>
        ))}
        <PopAt f={f} delay={130} x={90} y={250} w={150} h={110}>
          <TokenBlock w={150} h={110} text="1520" color={TOKEN_COLORS[2]} fs={42} />
        </PopAt>
        <PopAt f={f} delay={178} x={280} y={250} w={150} h={110}>
          <TokenBlock w={150} h={110} text="408" color={TOKEN_COLORS[3]} fs={42} tc={INK} />
        </PopAt>
        <Label f={f} d={64} x={40} y={420} w={540} text="根据前面的数字块" size={30} />
      </FlatCard>

      {/* 中：箭头 + 预测标签 */}
      <FlatArrow f={f} x1={790} y1={470} x2={1050} y2={470} delay={60} color={ORANGE} sw={8} />
      <Label f={f} d={87} x={760} y={530} w={340} text="猜下一个" size={34} weight={900} color={ORANGE} />

      {/* 右：候选概率条面板（两轮轮换 = 循环预测） */}
      <FlatCard f={f} delay={80} x={1090} y={190} w={700} h={560} chip="候选" chipColor={ORANGE}>
        {/* A 轮 */}
        <div style={{position: "absolute", inset: 0, opacity: fadeA}}>
          {roundA.map((b, i) => (
            <ProbBar key={`a-${i}`} f={f} delay={87 + i * 6} y={90 + i * 110} w={700} label={b.label} pct={b.pct} maxPct={roundA[0].pct} />
          ))}
        </div>
        {/* B 轮 */}
        {roundB.map((b, i) => (
          <ProbBar key={`b-${i}`} f={f} delay={157 + i * 5} y={90 + i * 110} w={700} label={b.label} pct={b.pct} maxPct={roundB[0].pct} />
        ))}
        {/* 循环点（一个接一个往外蹦） */}
        <div style={{position: "absolute", left: 0, bottom: 24, width: 700, display: "flex", justifyContent: "center", gap: 14}}>
          {[0, 1, 2].map((i) => {
            const on = f >= 188 && Math.floor((f - 188) / 9) % 3 === i;
            return (
              <div key={i} style={{
                width: 18, height: 18, borderRadius: 999,
                backgroundColor: on ? ORANGE : "#d6dee8",
                transform: on ? "scale(1.25)" : "scale(1)",
              }} />
            );
          })}
        </div>
      </FlatCard>

      {/* 飞行块：从概率条飞入队尾 */}
      {fly(130, {x: 1450, y: 330}, {x: 295, y: 515}, "1520", TOKEN_COLORS[2])}
      {fly(176, {x: 1450, y: 330}, {x: 485, y: 515}, "408", TOKEN_COLORS[3])}

      <Sparkle x={1000} y={200} s={0.8} />
      <Sparkle x={1840} y={800} s={0.7} color="#bfe3cc" />
    </AbsoluteFill>
  );
};

// P6 打字机真相：AI气泡逐块吐字 + 打字光标
const PageTypewriter: React.FC<{off: number}> = ({off}) => {
  const f = useCurrentFrame() - off;
  // 词级锚点（s06 局部帧）：往外打31-65 不是在打字82 逐块预测132
  const chunks = [
    {t: "你好", d: 31}, {t: "呀", d: 40}, {t: "我", d: 49}, {t: "是", d: 58}, {t: "AI", d: 67},
  ];
  const cursorOn = f >= 74 && Math.floor(f / 8) % 2 === 0;
  return (
    <AbsoluteFill>
      <Pill f={f} delay={6} x={700} y={60} w={520} h={66} bg={GREEN_BG} text="AI 回答的样子" color={GREEN} ts={32} />

      {/* 后排：用户气泡（小，浅灰） */}
      <PopAt f={f} delay={10} x={1330} y={170} w={400} h={120}>
        <UserBubble x={0} y={0} w={400} h={120} text="你好呀AI" ts={40} />
      </PopAt>

      {/* 主角：AI 蓝气泡逐块吐字 */}
      <PopAt f={f} delay={18} x={260} y={380} w={1180} h={190}>
        <AiBubble x={0} y={0} w={1180} h={190}>
          <div style={{display: "flex", alignItems: "center", gap: 14, flexWrap: "nowrap"}}>
            {chunks.map((c, i) => {
              const p = prog(f, c.d, 8);
              if (p <= 0) return null;
              return (
                <div key={i} style={{
                  backgroundColor: "rgba(255,255,255,0.22)", border: "2px solid rgba(255,255,255,0.65)",
                  borderRadius: 14, padding: "8px 20px", fontFamily: F, fontWeight: 900, fontSize: 52, color: "#fff",
                  opacity: p, transform: `scale(${0.8 + 0.2 * ease(p)})`,
                }}>{c.t}</div>
              );
            })}
            {cursorOn ? (
              <div style={{width: 12, height: 64, backgroundColor: "#fff", borderRadius: 4}} />
            ) : null}
          </div>
        </AiBubble>
      </PopAt>

      {/* 标注：不是打字 / 是逐块预测 */}
      <Pill f={f} delay={82} x={520} y={680} w={380} h={88} bg={RED_BG} border={`3px solid ${RED}`} text="不是打字" color={RED} ts={42} />
      <PopAt f={f} delay={132} x={980} y={680} w={460} h={88}>
        <div style={{
          width: 460, height: 88, borderRadius: 44, backgroundColor: BLUE,
          display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: "0 12px 26px rgba(74,134,216,0.35)",
          fontFamily: F, fontWeight: 900, fontSize: 42, color: "#fff", letterSpacing: 4,
        }}>是逐块预测</div>
      </PopAt>
      <Sparkle x={460} y={670} s={0.8} />
      <Sparkle x={1490} y={420} s={0.7} color="#bfe3cc" />
    </AbsoluteFill>
  );
};

// P7 计费页：字数卡 vs token卡 + 价签
const PageBilling: React.FC<{off: number}> = ({off}) => {
  const f = useCurrentFrame() - off;
  // 词级锚点（s07 局部帧）：token51 收费61 字数140 积木块数量163
  return (
    <AbsoluteFill>
      <Pill f={f} delay={6} x={700} y={60} w={520} h={66} bg="rgba(247,201,72,0.18)" text="收费的秘密" color={INK} ts={32} />

      <FlatCard f={f} delay={30} x={200} y={300} w={650} h={400} chip="字数" chipColor={BLUE}>
        <div style={{
          position: "absolute", left: 0, top: 110, width: 650, textAlign: "center",
          fontFamily: F, fontWeight: 900, fontSize: 170, color: BLUE,
        }}>5</div>
        <div style={{position: "absolute", left: 0, top: 320, width: 650, textAlign: "center", fontFamily: F, fontSize: 28, color: SUBC}}>数一数有几个字</div>
      </FlatCard>

      <div style={{
        position: "absolute", left: 905, top: 440, width: 110, textAlign: "center",
        fontFamily: F, fontWeight: 900, fontSize: 90, color: SUBC,
        opacity: prog(f, 100, 10), transform: `scale(${0.7 + 0.3 * prog(f, 100, 10)})`,
      }}>≠</div>

      <FlatCard f={f} delay={44} x={1070} y={300} w={650} h={400} chip="token" chipColor={ORANGE}>
        <div style={{
          position: "absolute", left: 0, top: 110, width: 650, textAlign: "center",
          fontFamily: F, fontWeight: 900, fontSize: 170, color: ORANGE,
        }}>9</div>
        <div style={{position: "absolute", left: 0, top: 320, width: 650, textAlign: "center", fontFamily: F, fontSize: 28, color: SUBC}}>数一数有几块积木</div>
      </FlatCard>

      {/* 价签 */}
      <PopAt f={f} delay={61} x={1530} y={150} w={330} h={96} rot={7}>
        <div style={{
          width: 330, height: 96, borderRadius: 18, backgroundColor: YEL,
          display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: "0 12px 26px rgba(247,201,72,0.45)",
          fontFamily: F, fontWeight: 900, fontSize: 40, color: INK, letterSpacing: 3,
        }}>按 token 计费</div>
      </PopAt>

      <PopAt f={f} delay={163} x={470} y={770} w={980} h={110} rot={-1}>
        <div style={{
          width: 980, height: 110, borderRadius: 22, backgroundColor: ORANGE,
          display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: "0 14px 30px rgba(240,145,45,0.35)",
          fontFamily: F, fontWeight: 900, fontSize: 48, color: "#fff", letterSpacing: 4,
        }}>收费看块 不看字数</div>
      </PopAt>
      <Sparkle x={420} y={750} s={0.85} />
      <Sparkle x={1500} y={790} s={0.7} color="#b8d4f2" />
    </AbsoluteFill>
  );
};

// P8 金句横幅：AI不认识字 只认识积木块
const PageQuote: React.FC<{off: number}> = ({off}) => {
  const f = useCurrentFrame() - off;
  // 词级锚点（s08 局部帧）：AI不认识字26 只认识积木块76
  const p1 = prog(f, 26, 10);
  const p2 = prog(f, 76, 10);
  return (
    <AbsoluteFill>
      <PopAt f={f} delay={6} x={230} y={380} w={1460} h={210} rot={-1.5}>
        <div style={{
          width: 1460, height: 210, borderRadius: 28, backgroundColor: YEL,
          display: "flex", alignItems: "center", justifyContent: "center", gap: 30,
          boxShadow: "0 16px 36px rgba(247,201,72,0.45)",
          fontFamily: F, fontWeight: 900, fontSize: 84, color: INK, letterSpacing: 4, whiteSpace: "nowrap",
        }}>
          <span style={{opacity: p1, transform: `scale(${0.7 + 0.3 * ease(p1)})`, display: "inline-block"}}>AI 不认识字</span>
          <span style={{opacity: p2, transform: `scale(${0.7 + 0.3 * ease(p2)})`, display: "inline-block"}}>
            只认识<span style={{color: "#a3650a"}}>积木块</span>
          </span>
        </div>
      </PopAt>

      {/* 下方积木块点缀（循环轻跳） */}
      {["积", "木", "块"].map((t, i) => (
        <PopAt key={i} f={f} delay={96 + i * 6} x={830 + i * 110} y={670} w={90} h={90}>
          <div style={{transform: `translateY(${Math.sin((f + i * 10) / 9) * 7}px)`, width: 90, height: 90}}>
            <TokenBlock w={90} h={90} text={t} color={TOKEN_COLORS[(i + 1) % 4]} fs={44} />
          </div>
        </PopAt>
      ))}
      <Sparkle x={320} y={330} s={0.9} />
      <Sparkle x={1580} y={620} s={0.8} color="#bfe3cc" />
      <Sparkle x={1620} y={300} s={0.65} color="#b8d4f2" />
    </AbsoluteFill>
  );
};

// P9 结尾截图卡（最后~100帧完全静止：所有 delay ≤ 130）
const PageOutro: React.FC<{off: number}> = ({off}) => {
  const f = useCurrentFrame() - off;
  // 词级锚点（s09 局部帧）：卡截17 token54 面试高频85 拿下124
  const steps = [
    {t: "汉字", c: "#f6f8fa", tc: INK, d: 40},
    {t: "切块", c: TOKEN_COLORS[0], tc: "#fff", d: 50},
    {t: "变数字", c: TOKEN_COLORS[1], tc: "#fff", d: 60},
    {t: "逐块预测", c: TOKEN_COLORS[2], tc: "#fff", d: 70},
  ];
  return (
    <AbsoluteFill>
      {/* 截图虚线框 */}
      <div style={{
        position: "absolute", left: 320, top: 150, width: 1280, height: 660,
        border: "4px dashed #b8c4d2", borderRadius: 34, opacity: prog(f, 12),
      }} />

      <FlatCard f={f} delay={6} x={360} y={190} w={1200} h={580} chip="面试高频" chipColor={BLUE}>
        <div style={{
          position: "absolute", left: 0, top: 90, width: 1200, textAlign: "center",
          fontFamily: F, fontWeight: 900, fontSize: 84, color: INK, letterSpacing: 2,
          opacity: prog(f, 17, 10), transform: `scale(${0.85 + 0.15 * ease(prog(f, 17, 10))})`,
        }}>
          <span style={{color: BLUE}}>token</span> = AI 的积木块
        </div>

        {/* 流程一行 */}
        <div style={{position: "absolute", left: 0, top: 280, width: 1200, display: "flex", justifyContent: "center", alignItems: "center", gap: 16}}>
          {steps.map((s, i) => (
            <React.Fragment key={i}>
              {i > 0 ? (
                <span style={{
                  fontFamily: F, fontWeight: 900, fontSize: 44, color: SUBC,
                  opacity: prog(f, s.d - 6, 8),
                }}>→</span>
              ) : null}
              <div style={{
                backgroundColor: s.c, color: s.tc, borderRadius: 18, padding: "14px 30px",
                fontFamily: F, fontWeight: 900, fontSize: 38,
                boxShadow: "0 8px 18px rgba(47,58,69,0.14), inset 0 -5px 0 rgba(0,0,0,0.1)",
                border: "3px solid #fff",
                opacity: prog(f, s.d, 8), transform: `scale(${0.85 + 0.15 * ease(prog(f, s.d, 8))})`,
              }}>{s.t}</div>
            </React.Fragment>
          ))}
        </div>

        <div style={{
          position: "absolute", left: 0, top: 440, width: 1200, textAlign: "center",
          fontFamily: F, fontWeight: 700, fontSize: 32, color: SUBC, letterSpacing: 3,
          opacity: prog(f, 85, 10),
        }}>小秋 · 0 基础也能学会</div>
      </FlatCard>

      <PopAt f={f} delay={110} x={700} y={830} w={520} h={96}>
        <div style={{
          width: 520, height: 96, borderRadius: 48, backgroundColor: ORANGE,
          display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: "0 14px 30px rgba(240,145,45,0.4)",
          fontFamily: F, fontWeight: 900, fontSize: 44, color: "#fff", letterSpacing: 6,
        }}>关注 全栈小秋</div>
      </PopAt>
      <Sparkle x={330} y={160} s={0.9} />
      <Sparkle x={1580} y={190} s={0.7} color="#bfe3cc" />
    </AbsoluteFill>
  );
};

// ============ 主组件 ============

const PAGES = [
  {C: PageHook, start: SENT[0], end: SENT[1]},
  {C: PageCut, start: SENT[1], end: SENT[2]},
  {C: PageGranularity, start: SENT[2], end: SENT[3]},
  {C: PageNumbers, start: SENT[3], end: SENT[4]},
  {C: PagePredict, start: SENT[4], end: SENT[5]},
  {C: PageTypewriter, start: SENT[5], end: SENT[6]},
  {C: PageBilling, start: SENT[6], end: SENT[7]},
  {C: PageQuote, start: SENT[7], end: SENT[8]},
  {C: PageOutro, start: SENT[8], end: DUR},
];

export const TokenFlat: React.FC = () => {
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
      {/* 右上角角标 */}
      <div style={{
        position: "absolute", top: 45, right: 70, zIndex: 45, border: `3px solid ${BLUE}`,
        borderRadius: 999, padding: "7px 25px", fontSize: 28, fontWeight: 900, color: INK,
        letterSpacing: 5, background: "#fff",
      }}>全栈小秋</div>

      {/* 配音（已生成，勿重新合成） */}
      {SENT.map((start, i) => (
        <Sequence key={`v-${i}`} from={start} durationInFrames={i < 8 ? SENT[i + 1] - start + 10 : DUR - start}>
          <Audio src={staticFile(`audio/token-tts/s0${i + 1}.mp3`)} volume={1} />
        </Sequence>
      ))}

      {/* 音效层：帧号全部从 SENT / 词级锚点推导 */}
      {/* 翻页 */}
      {PAGES.slice(1).map((p, i) => (
        <Sequence key={`pg-${i}`} from={p.start - 6} durationInFrames={20}>
          <Audio src={staticFile("audio/sfx/page3.wav")} volume={0.28} />
        </Sequence>
      ))}
      {/* P2 积木块弹出 pop */}
      {[60, 71, 82, 89].map((t) => (
        <Sequence key={`pop2-${t}`} from={SENT[1] + t} durationInFrames={10}>
          <Audio src={staticFile("audio/sfx/pop.wav")} volume={0.26} />
        </Sequence>
      ))}
      {/* P3 卡片弹出 pop */}
      {[44, 67, 106].map((t) => (
        <Sequence key={`pop3-${t}`} from={SENT[2] + t} durationInFrames={10}>
          <Audio src={staticFile("audio/sfx/pop.wav")} volume={0.26} />
        </Sequence>
      ))}
      {/* P4 翻面完成 ding */}
      {[72, 80, 88].map((t) => (
        <Sequence key={`dg4-${t}`} from={SENT[3] + t} durationInFrames={16}>
          <Audio src={staticFile("audio/sfx/ding.wav")} volume={0.22} />
        </Sequence>
      ))}
      {/* P5 候选出现 switch / 选中飞入 whoosh / 选中确定 ding */}
      {[85, 155].map((t) => (
        <Sequence key={`sw5-${t}`} from={SENT[4] + t} durationInFrames={14}>
          <Audio src={staticFile("audio/sfx/switch.wav")} volume={0.2} />
        </Sequence>
      ))}
      {[128, 174].map((t) => (
        <Sequence key={`wh5-${t}`} from={SENT[4] + t} durationInFrames={12}>
          <Audio src={staticFile("audio/sfx/whoosh.wav")} volume={0.22} />
        </Sequence>
      ))}
      {[140, 188].map((t) => (
        <Sequence key={`dg5-${t}`} from={SENT[4] + t} durationInFrames={16}>
          <Audio src={staticFile("audio/sfx/ding.wav")} volume={0.3} />
        </Sequence>
      ))}
      {/* P6 逐块吐字 pop */}
      {[31, 40, 49, 58, 67].map((t) => (
        <Sequence key={`pop6-${t}`} from={SENT[5] + t} durationInFrames={10}>
          <Audio src={staticFile("audio/sfx/pop.wav")} volume={0.2} />
        </Sequence>
      ))}
      {/* P8 金句横幅 pop / P9 截图卡 pop + 关注 pop */}
      <Sequence from={SENT[7] + 6} durationInFrames={10}>
        <Audio src={staticFile("audio/sfx/pop.wav")} volume={0.28} />
      </Sequence>
      <Sequence from={SENT[8] + 6} durationInFrames={10}>
        <Audio src={staticFile("audio/sfx/pop.wav")} volume={0.3} />
      </Sequence>
      <Sequence from={SENT[8] + 110} durationInFrames={10}>
        <Audio src={staticFile("audio/sfx/pop.wav")} volume={0.34} />
      </Sequence>

      <Audio src={staticFile("audio/bed.wav")} loop volume={() => bed} />
      <Sequence from={1413} durationInFrames={60}>
        <Audio src={staticFile("audio/sfx/warm3.wav")} volume={0.26} />
      </Sequence>
      <Subtitle />
    </AbsoluteFill>
  );
};
