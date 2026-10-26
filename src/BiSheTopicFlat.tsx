import React from "react";
import {Audio} from "@remotion/media";
import {
  AbsoluteFill, interpolate, Sequence, staticFile, useCurrentFrame,
} from "remotion";

// ============ 扁平可爱插画科普风 · 毕设通关系列 01《毕设选题避坑》v2 提速加信息版(全栈小秋 IP) ============
// v2：配音 1.4 速/句间隙 0.08s（63.9s），画面全面加密——每页持续循环动画+信息元素（用户反馈节奏慢/信息面少）
// 结构：钩子 → 栽在选题(连锁箭头+图标循环动画) → 七分三分(数字滚动+全程时间链) → 三个错
//       → 误区1(59抖动/92滚动/进度条填充/完成度>难度chip) → 误区2(报错弹窗抖动+训练日志逐行)
//       → 误区3(空槽?闪烁/书名划线) → 三个动作(胶囊逐个点亮/放大镜扫描/卡片呼吸) → 金句(呼吸+闪烁) → A/B结尾卡
// 语义色：错误/误区 = 红 #e05656 / 正确完整 = 绿 #3fae7a / 选题强调 = 橙 #f0912d / 中性 = 蓝 #4a86d8
// 转场：铁律① 纯硬切（kit HardPage，页边界 = SENT 句起始帧）；配音 end_frame 按波形实测（gen_bishe_tts.py）。

import {HardPage, PopAt, BrandCorner, SubtitleBar, wordAt} from "./batch10/kit";
import {DUR, SENT, SUBS, WORDS} from "./batch10/bisheData";

// ---------- 调色 ----------
const INK = "#2f3a45";
const SUBC = "#7a8694";
const BLUE = "#4a86d8";
const BLUE_BG = "#eaf2fc";
const GREEN = "#3fae7a";
const GREEN_BG = "#e9f6ee";
const ORANGE = "#f0912d";
const ORANGE_BG = "#fdf3e0";
const RED = "#e05656";
const RED_BG = "#fdecec";
const YEL = "#f7c948";
const BORDER = "#e0e6ec";
const DARK = "#3f4d5e";
const F = "'Microsoft YaHei', sans-serif";
const MONO = "Consolas, 'Courier New', monospace";
const W = 1920;

const clamp = {extrapolateLeft: "clamp", extrapolateRight: "clamp"} as const;
const pulse = (f: number, period: number, min: number, max: number) =>
  min + (max - min) * (0.5 + 0.5 * Math.sin(f / period));

// 背景层（层0）：圆点网格 + 远景色块，极慢漂移
const BgDots: React.FC = () => {
  const frame = useCurrentFrame();
  const dx = interpolate(frame % 600, [0, 600], [0, 23]);
  const dy = interpolate(frame % 600, [0, 600], [0, 23]);
  return (
    <svg width={W} height={1080} style={{position: "absolute", left: -46, top: -46, pointerEvents: "none"}}>
      <defs>
        <pattern id="bs-dots" width="46" height="46" patternUnits="userSpaceOnUse">
          <circle cx="23" cy="23" r="2.6" fill="#dbe4ee" />
        </pattern>
      </defs>
      <rect width={W + 92} height={1080 + 92} fill="url(#bs-dots)" opacity={0.5} transform={`translate(${dx} ${dy})`} />
      <circle cx={170} cy={140} r={200} fill={BLUE_BG} opacity={0.45} />
      <circle cx={W - 160} cy={960} r={220} fill={ORANGE_BG} opacity={0.4} />
    </svg>
  );
};

const BigTitle: React.FC<{parts: {t: string; c: string}[]; y?: number; size?: number}> = ({
  parts, y = 64, size = 78,
}) => {
  const total = parts.reduce((a, x) => a + x.t.length, 0);
  const tw = total * size;
  return (
    <div style={{position: "absolute", top: y, left: 0, width: W, textAlign: "center"}}>
      <div style={{position: "relative", display: "inline-block"}}>
        <div style={{fontSize: size, fontWeight: 900, fontFamily: F, letterSpacing: 5, whiteSpace: "nowrap"}}>
          {parts.map((x, i) => <span key={i} style={{color: x.c}}>{x.t}</span>)}
        </div>
        <svg width={tw * 0.6} height={18} style={{position: "absolute", left: "50%", transform: "translateX(-50%)", bottom: -14, overflow: "visible"}}>
          <path d={`M 4 9 ${Array.from({length: Math.max(2, Math.round(tw * 0.6 / 36))}).map(() => `q 9 -10 18 0 q 9 10 18 0`).join(" ")}`}
            fill="none" stroke={YEL} strokeWidth={7} strokeLinecap="round" />
        </svg>
      </div>
    </div>
  );
};

// 会呼吸的星星（v2：opacity 正弦闪烁）
const Sparkle: React.FC<{x: number; y: number; s?: number; color?: string; phase?: number}> = ({
  x, y, s = 1, color = YEL, phase = 0,
}) => {
  const frame = useCurrentFrame();
  const o = pulse(frame + phase * 20, 16, 0.45, 1);
  return (
    <svg width={54 * s} height={54 * s} style={{position: "absolute", left: x, top: y, overflow: "visible", opacity: o}}>
      <path d="M 27 2 L 32 22 L 52 27 L 32 32 L 27 52 L 22 32 L 2 27 L 22 22 Z" fill={color} />
    </svg>
  );
};

const FlatCard: React.FC<{
  x: number; y: number; w: number; h: number;
  chip?: string; chipColor?: string; fill?: string; children?: React.ReactNode;
}> = ({x, y, w, h, chip, chipColor = BLUE, fill = "#ffffff", children}) => (
  <>
    <div style={{
      position: "absolute", left: x, top: y, width: w, height: h,
      backgroundColor: fill, border: `3px solid ${BORDER}`, borderRadius: 26,
      boxShadow: "0 10px 26px rgba(47,58,69,0.07)",
    }}>{children}</div>
    {chip ? (
      <div style={{
        position: "absolute", left: x + w / 2 - (chip.length * 22 + 26), top: y - 28,
        width: chip.length * 44 + 52, height: 58, borderRadius: 999,
        backgroundColor: chipColor, color: "#fff", display: "flex",
        alignItems: "center", justifyContent: "center",
        fontSize: 34, fontWeight: 900, letterSpacing: 4,
        boxShadow: `0 8px 18px ${chipColor}44`,
      }}>{chip}</div>
    ) : null}
  </>
);

const Label: React.FC<{x: number; y: number; w: number; text: string; color?: string; size?: number}> = ({
  x, y, w, text, color = SUBC, size = 30,
}) => (
  <div style={{
    position: "absolute", left: x, top: y, width: w, textAlign: "center",
    fontFamily: F, fontSize: size, color, fontWeight: 700, whiteSpace: "nowrap",
  }}>{text}</div>
);

const MarkOk: React.FC<{x: number; y: number; s?: number; c?: string}> = ({x, y, s = 1, c = GREEN}) => (
  <svg width={60 * s} height={60 * s} viewBox="0 0 60 60"
    style={{position: "absolute", left: x - 30 * s, top: y - 30 * s, overflow: "visible"}}>
    <circle cx={30} cy={30} r={28} fill={c} />
    <path d="M17 31 L26 40 L43 21" fill="none" stroke="#fff" strokeWidth={7} strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

// 红色印章（斜盖，v2：盖章后小抖两下再定）
const Stamp: React.FC<{x: number; y: number; text: string; s?: number; rot?: number; color?: string; born?: number}> = ({
  x, y, text, s = 1, rot = -14, color = RED, born = -99,
}) => {
  const frame = useCurrentFrame();
  const wig = born >= 0 && frame >= born
    ? Math.sin((frame - born) / 2.2) * Math.max(0, 1 - (frame - born) / 14) * 3
    : 0;
  return (
    <div style={{
      position: "absolute", left: x, top: y,
      transform: `rotate(${rot + wig}deg) scale(${s})`,
      border: `7px solid ${color}`, borderRadius: 18, padding: "10px 26px",
      color, fontFamily: F, fontSize: 58, fontWeight: 900, letterSpacing: 10,
      backgroundColor: "rgba(255,255,255,0.82)", whiteSpace: "nowrap",
      boxShadow: "0 6px 18px rgba(224,86,86,0.25)",
    }}>{text}</div>
  );
};

// 文档卡（带进度条；v2：卡住时进度条红闪/传入 born 时填充动画）
const DocProgress: React.FC<{x: number; y: number; pct: number; color: string; w?: number; blink?: boolean; born?: number}> = ({
  x, y, pct, color, w = 200, blink, born,
}) => {
  const frame = useCurrentFrame();
  const grow = born === undefined ? 1 : interpolate(frame, [born, born + 26], [0, 1], clamp);
  const danger = blink ? pulse(frame, 10, 0.55, 1) : 1;
  return (
    <svg width={w} height={150} viewBox={`0 0 ${w} 150`}
      style={{position: "absolute", left: x, top: y, overflow: "visible"}}>
      <rect x={10} y={4} width={w - 20} height={130} rx={12} fill="#fff" stroke={BORDER} strokeWidth={4} />
      <rect x={34} y={28} width={w - 100} height={12} rx={6} fill="#e6ebf1" />
      <rect x={34} y={54} width={(w - 100) * 0.8} height={12} rx={6} fill="#e6ebf1" />
      <rect x={34} y={80} width={(w - 100) * 0.6} height={12} rx={6} fill="#e6ebf1" />
      <rect x={30} y={116} width={w - 60} height={14} rx={7} fill="#e6ebf1" />
      <rect x={30} y={116} width={Math.max(8, (w - 60) * pct * grow)} height={14} rx={7} fill={color} opacity={danger} />
    </svg>
  );
};

// 月亮+咖啡（熬夜）+ Zzz 气泡循环上飘
const NightIcon: React.FC<{x: number; y: number; s?: number}> = ({x, y, s = 1}) => {
  const frame = useCurrentFrame();
  const rise = (frame % 36) / 36;
  const z1o = interpolate(rise, [0, 0.2, 0.9, 1], [0, 0.9, 0.5, 0], clamp);
  const z2rise = ((frame + 18) % 36) / 36;
  const z2o = interpolate(z2rise, [0, 0.2, 0.9, 1], [0, 0.7, 0.4, 0], clamp);
  return (
    <svg width={170 * s} height={150 * s} viewBox="0 0 170 150"
      style={{position: "absolute", left: x - 85 * s, top: y - 75 * s, overflow: "visible"}}>
      <path d="M 96 24 A 44 44 0 1 0 122 100 A 36 36 0 0 1 96 24" fill={YEL} />
      <circle cx={34} cy={38} r={5} fill="#d8e2ee" />
      <circle cx={58} cy={26} r={4} fill="#d8e2ee" />
      <rect x={22} y={96} width={44} height={34} rx={8} fill={DARK} />
      <path d="M 66 104 q 14 4 0 20" fill="none" stroke={DARK} strokeWidth={6} strokeLinecap="round" />
      <rect x={30} y={108} width={28} height={7} rx={3} fill={ORANGE} opacity={0.85} />
      <text x={100} y={70 - rise * 30} fontFamily={F} fontSize={34} fontWeight={900} fill={SUBC} opacity={z1o}>Z</text>
      <text x={126} y={52 - z2rise * 26} fontFamily={F} fontSize={26} fontWeight={900} fill="#b3c0cf" opacity={z2o}>z</text>
    </svg>
  );
};

// 循环箭头（换题重来，v2：虚线行进）
const SwapIcon: React.FC<{x: number; y: number; s?: number; c?: string}> = ({x, y, s = 1, c = RED}) => {
  const frame = useCurrentFrame();
  const off = -(frame * 1.6) % 26;
  return (
    <svg width={150 * s} height={120 * s} viewBox="0 0 150 120"
      style={{position: "absolute", left: x - 75 * s, top: y - 60 * s, overflow: "visible"}}>
      <path d="M 30 70 A 48 40 0 0 1 118 44" fill="none" stroke={c} strokeWidth={10} strokeLinecap="round"
        strokeDasharray="18 8" strokeDashoffset={off} />
      <path d="M 118 44 l -22 -12 M 118 44 l -24 12" stroke={c} strokeWidth={10} strokeLinecap="round" />
      <path d="M 120 52 A 48 40 0 0 1 34 80" fill="none" stroke={SUBC} strokeWidth={10} strokeLinecap="round"
        strokeDasharray="18 8" strokeDashoffset={-off} />
      <path d="M 34 80 l 22 12 M 34 80 l 24 -12" stroke={SUBC} strokeWidth={10} strokeLinecap="round" />
    </svg>
  );
};

// 显示器+代码窗（v2：光标闪烁+日志行）
const Monitor: React.FC<{x: number; y: number; s?: number; logF?: number}> = ({x, y, s = 1, logF = 99999}) => {
  const frame = useCurrentFrame();
  const cursor = pulse(frame, 12, 0.15, 1);
  const log1 = interpolate(frame, [logF, logF + 8], [0, 1], clamp);
  return (
    <svg width={520 * s} height={400 * s} viewBox="0 0 520 400"
      style={{position: "absolute", left: x - 260 * s, top: y - 200 * s, overflow: "visible"}}>
      <rect x={30} y={10} width={460} height={310} rx={18} fill={DARK} />
      <rect x={50} y={30} width={420} height={270} rx={10} fill="#1b242e" />
      <circle cx={72} cy={48} r={7} fill={RED} />
      <circle cx={94} cy={48} r={7} fill={YEL} />
      <circle cx={116} cy={48} r={7} fill={GREEN} />
      <rect x={70} y={76} width={220} height={12} rx={6} fill="#3c4a5a" />
      <rect x={70} y={102} width={320} height={12} rx={6} fill="#3c4a5a" />
      <rect x={70} y={128} width={180} height={12} rx={6} fill="#3c4a5a" />
      <rect x={70} y={154} width={260} height={12} rx={6} fill="#3c4a5a" />
      <rect x={70} y={180} width={140} height={12} rx={6} fill="#3c4a5a" />
      <rect x={336} y={152} width={14} height={16} fill={GREEN} opacity={cursor} />
      <text x={296} y={238} fontFamily={MONO} fontSize={22} fontWeight={700} fill={RED} opacity={log1}>epoch 03  loss: nan</text>
      <rect x={230} y={320} width={60} height={34} fill="#33404e" />
      <rect x={160} y={352} width={200} height={14} rx={7} fill="#33404e" />
    </svg>
  );
};

// 报错弹窗（v2：持续小抖动）
const ErrorPop: React.FC<{x: number; y: number; w: number; title: string; mono: string; rot?: number; phase?: number}> = ({
  x, y, w, title, mono, rot = 0, phase = 0,
}) => {
  const frame = useCurrentFrame();
  const shake = Math.sin((frame + phase * 9) / 7) * 2.2;
  return (
    <div style={{
      position: "absolute", left: x, top: y + shake, width: w,
      backgroundColor: "#fff", border: `4px solid ${RED}`, borderRadius: 14,
      transform: `rotate(${rot}deg)`, boxShadow: "0 12px 30px rgba(224,86,86,0.28)", overflow: "hidden",
    }}>
      <div style={{backgroundColor: RED, color: "#fff", fontFamily: F, fontSize: 26, fontWeight: 900, padding: "8px 18px"}}>
        {title}
      </div>
      <div style={{fontFamily: MONO, fontSize: 28, fontWeight: 700, color: RED, padding: "14px 18px", whiteSpace: "nowrap"}}>
        {mono}
      </div>
    </div>
  );
};

// 火苗（v2：跳动）
const FireIcon: React.FC<{x: number; y: number; s?: number}> = ({x, y, s = 1}) => {
  const frame = useCurrentFrame();
  const sc = 1 + Math.sin(frame / 6) * 0.06;
  return (
    <svg width={64 * s} height={84 * s} viewBox="0 0 64 84"
      style={{position: "absolute", left: x - 32 * s, top: y - 42 * s, overflow: "visible", transform: `scale(${sc})`, transformOrigin: "50% 90%"}}>
      <path d="M 32 4 C 46 24 58 34 58 52 A 26 28 0 0 1 6 52 C 6 38 16 30 20 18 C 24 30 30 32 32 22 C 33 14 32 10 32 4"
        fill={ORANGE} />
      <path d="M 32 40 C 39 50 44 54 44 62 A 12 13 0 0 1 20 62 C 20 54 27 50 32 40" fill={YEL} />
    </svg>
  );
};

// 书堆（文献/知网）
const BooksIcon: React.FC<{x: number; y: number; s?: number}> = ({x, y, s = 1}) => (
  <svg width={140 * s} height={110 * s} viewBox="0 0 140 110"
    style={{position: "absolute", left: x - 70 * s, top: y - 55 * s, overflow: "visible"}}>
    <rect x={14} y={78} width={112} height={24} rx={6} fill={BLUE} />
    <rect x={22} y={54} width={96} height={22} rx={6} fill={ORANGE} />
    <rect x={30} y={32} width={80} height={20} rx={6} fill={GREEN} />
    <rect x={40} y={14} width={60} height={16} rx={5} fill={DARK} />
  </svg>
);

// 放大镜（v2：左右扫描）
const SearchIcon: React.FC<{x: number; y: number; s?: number; c?: string; sweep?: boolean}> = ({x, y, s = 1, c = BLUE, sweep}) => {
  const frame = useCurrentFrame();
  const dx = sweep ? Math.sin(frame / 14) * 60 : 0;
  return (
    <svg width={80 * s} height={80 * s} viewBox="0 0 80 80"
      style={{position: "absolute", left: x + dx - 40 * s, top: y - 40 * s, overflow: "visible"}}>
      <circle cx={34} cy={34} r={22} fill="none" stroke={c} strokeWidth={9} />
      <line x1={50} y1={50} x2={70} y2={70} stroke={c} strokeWidth={10} strokeLinecap="round" />
    </svg>
  );
};

// 空槽虚线胶囊（题目太空，v2：? 闪烁）
const SlotPill: React.FC<{x: number; y: number; text: string; phase?: number}> = ({x, y, text, phase = 0}) => {
  const frame = useCurrentFrame();
  const o = pulse(frame + phase * 12, 14, 0.25, 1);
  return (
    <div style={{
      position: "absolute", left: x, top: y, width: 240, height: 84,
      border: `4px dashed ${SUBC}`, borderRadius: 999, backgroundColor: "rgba(255,255,255,0.7)",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontFamily: F, fontSize: 34, fontWeight: 900, color: SUBC,
    }}>
      {text}<span style={{marginLeft: 10, color: RED, opacity: o}}>?</span>
    </div>
  );
};

// 老师小人（后排）
const TeacherIcon: React.FC<{x: number; y: number; s?: number}> = ({x, y, s = 1}) => (
  <svg width={150 * s} height={220 * s} viewBox="0 0 150 220"
    style={{position: "absolute", left: x - 75 * s, top: y - 110 * s, overflow: "visible", opacity: 0.88}}>
    <circle cx={75} cy={52} r={34} fill="#f2c9a4" />
    <path d="M 41 40 A 34 34 0 0 1 109 40 L 109 30 A 34 22 0 0 0 41 30 Z" fill={DARK} />
    <rect x={64} y={44} width={22} height={7} rx={3} fill={DARK} />
    <circle cx={63} cy={56} r={4.5} fill={INK} />
    <circle cx={87} cy={56} r={4.5} fill={INK} />
    <path d="M 68 68 q 7 5 14 0" fill="none" stroke={INK} strokeWidth={3.5} strokeLinecap="round" />
    <path d="M 45 96 Q 75 84 105 96 L 112 190 L 38 190 Z" fill={BLUE} />
    <rect x={55} y={190} width={16} height={24} fill={DARK} />
    <rect x={79} y={190} width={16} height={24} fill={DARK} />
    <rect x={30} y={100} width={26} height={54} rx={12} fill={BLUE} />
    <rect x={94} y={100} width={26} height={54} rx={12} fill={BLUE} />
  </svg>
);

// 页面级描画箭头（画布坐标，v2：可虚线行进）
const FlatArrow: React.FC<{
  x1: number; y1: number; x2: number; y2: number; color?: string; dashed?: boolean; sw?: number; march?: boolean;
}> = ({x1, y1, x2, y2, color = SUBC, dashed, sw = 6, march}) => {
  const frame = useCurrentFrame();
  const off = march ? -(frame * 1.8) % 26 : 0;
  const dx = x2 - x1, dy = y2 - y1;
  const len = Math.hypot(dx, dy);
  const ux = dx / len, uy = dy / len;
  const px = -uy, py = ux;
  const head = 18;
  return (
    <svg width={W} height={1080} style={{position: "absolute", left: 0, top: 0, overflow: "visible", pointerEvents: "none"}}>
      <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={color}
        strokeWidth={sw} strokeLinecap="round" strokeDasharray={dashed ? "14 12" : undefined} strokeDashoffset={march ? off : undefined} />
      <path d={`M ${x2 - ux * head + px * head * 0.55} ${y2 - uy * head + py * head * 0.55} L ${x2} ${y2} L ${x2 - ux * head - px * head * 0.55} ${y2 - uy * head - py * head * 0.55}`}
        fill="none" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
};

// ============ P1 钩子 ============
const PageHook: React.FC = () => {
  const frame = useCurrentFrame();
  const q1 = pulse(frame, 18, 0.35, 0.8);
  const q2 = pulse(frame + 14, 18, 0.3, 0.75);
  return (
    <AbsoluteFill>
      {/* 系列徽标（信息位） */}
      <div style={{position: "absolute", left: 64, top: 40, width: 320}}>
        <div style={{width: 344, height: 52, borderRadius: 999, border: `3px solid ${ORANGE}`, color: ORANGE, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: F, fontSize: 26, fontWeight: 900, letterSpacing: 3, backgroundColor: "rgba(255,255,255,0.75)", whiteSpace: "nowrap"}}>毕设通关 · 第 01 期</div>
      </div>
      <BigTitle parts={[{t: "题目", c: INK}, {t: "越难", c: RED}, {t: "，分越高？", c: INK}]} y={190} size={88} />
      {/* 后排大问号（呼吸） */}
      <div style={{position: "absolute", right: 120, top: 300, fontFamily: F, fontSize: 300, fontWeight: 900, color: "#dbe4ee", width: 300, textAlign: "center", opacity: q1}}>?</div>
      <div style={{position: "absolute", left: 90, top: 380, fontFamily: F, fontSize: 190, fontWeight: 900, color: "#e7edf4", width: 200, textAlign: "center", opacity: q2}}>?</div>

      <PopAt f={wordAt(WORDS, 0, "坑") - 8}>
        <div style={{position: "absolute", left: "50%", top: 480, transform: "translateX(-50%)"}}>
          <svg width={360} height={360} viewBox="0 0 360 360" style={{overflow: "visible", transform: "rotate(-12deg)"}}>
            <circle cx={180} cy={180} r={160} fill="none" stroke={RED} strokeWidth={16} opacity={0.9} />
            <circle cx={180} cy={180} r={128} fill="none" stroke={RED} strokeWidth={8} opacity={0.55} />
            <path d="M 116 116 L 244 244 M 244 116 L 116 244" stroke={RED} strokeWidth={22} strokeLinecap="round" />
          </svg>
        </div>
      </PopAt>

      {/* 前景三个陷阱标签（浮动） */}
      <PopAt f={SENT[0] + 26}>
        <div style={{position: "absolute", left: 330, top: 830 + Math.sin(frame / 9) * 5, width: 340, height: 70, border: `3px dashed ${SUBC}`, borderRadius: 999, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: F, fontSize: 30, fontWeight: 800, color: SUBC, backgroundColor: "rgba(255,255,255,0.8)"}}>跟风热门</div>
      </PopAt>
      <PopAt f={SENT[0] + 40}>
        <div style={{position: "absolute", left: 790, top: 830 + Math.sin(frame / 9 + 2) * 5, width: 340, height: 70, border: `3px dashed ${SUBC}`, borderRadius: 999, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: F, fontSize: 30, fontWeight: 800, color: SUBC, backgroundColor: "rgba(255,255,255,0.8)"}}>难度迷信</div>
      </PopAt>
      <PopAt f={SENT[0] + 54}>
        <div style={{position: "absolute", left: 1250, top: 830 + Math.sin(frame / 9 + 4) * 5, width: 340, height: 70, border: `3px dashed ${SUBC}`, borderRadius: 999, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: F, fontSize: 30, fontWeight: 800, color: SUBC, backgroundColor: "rgba(255,255,255,0.8)"}}>题目太大</div>
      </PopAt>
      <Sparkle x={390} y={310} s={0.8} phase={0} />
      <Sparkle x={1490} y={560} s={0.65} color="#f2d9a8" phase={1} />
    </AbsoluteFill>
  );
};

// ============ P2 栽在选题上（连锁反应链） ============
const PageFall: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill>
      <BigTitle parts={[{t: "每年都有人", c: INK}, {t: "栽在选题", c: RED}, {t: "上", c: INK}]} y={110} size={72} />
      <PopAt f={wordAt(WORDS, 1, "做不") - 6}>
        <FlatCard x={130} y={380} w={480} h={330} chip="做到一半" chipColor={RED}>
          <DocProgress x={120} y={70} pct={0.5} color={RED} w={240} blink />
          <Label x={0} y={250} w={480} text="进度卡死，写不下去" color={SUBC} size={28} />
        </FlatCard>
      </PopAt>
      <PopAt f={wordAt(WORDS, 1, "熬夜") - 6}>
        <FlatCard x={720} y={380} w={480} h={330} chip="熬夜爆肝" chipColor={ORANGE}>
          <NightIcon x={240} y={130} s={1.05} />
          <Label x={0} y={250} w={480} text="通宵赶，越赶越乱" color={SUBC} size={28} />
        </FlatCard>
      </PopAt>
      <PopAt f={wordAt(WORDS, 1, "换题") - 6}>
        <FlatCard x={1310} y={380} w={480} h={330} chip="被迫换题" chipColor={DARK}>
          <SwapIcon x={240} y={150} s={1.05} />
          <Label x={0} y={250} w={480} text="重来一遍，时间白烧" color={SUBC} size={28} />
        </FlatCard>
      </PopAt>
      {/* 卡间连锁箭头（虚线行进） */}
      {frame >= wordAt(WORDS, 1, "熬夜") - 6 && (
        <FlatArrow x1={614} y1={545} x2={716} y2={545} color={RED} sw={7} dashed march />
      )}
      {frame >= wordAt(WORDS, 1, "换题") - 6 && (
        <FlatArrow x1={1204} y1={545} x2={1306} y2={545} color={RED} sw={7} dashed march />
      )}
      <PopAt f={wordAt(WORDS, 1, "换题") - 40}>
        <div style={{position: "absolute", left: 560, top: 790, width: 800, height: 84, backgroundColor: RED_BG, borderRadius: 999, display: "flex", alignItems: "center", justifyContent: "center"}}>
          <div style={{fontFamily: F, fontWeight: 900, fontSize: 38, color: RED, whiteSpace: "nowrap"}}>每一步，都在为选题还债</div>
        </div>
      </PopAt>
      <Sparkle x={640} y={330} s={0.7} color="#f2d9a8" phase={2} />
      <Sparkle x={1240} y={700} s={0.6} phase={0} />
    </AbsoluteFill>
  );
};

// ============ P3 七分选题 三分制作（数字滚动+全程时间链） ============
const PageRatio: React.FC = () => {
  const frame = useCurrentFrame();
  const t3 = wordAt(WORDS, 2, "三分");
  const w1 = interpolate(frame, [SENT[2] + 6, SENT[2] + 34], [0, 1120], clamp);
  const w2 = interpolate(frame, [t3, t3 + 20], [0, 480], clamp);
  const p1 = Math.round(70 * interpolate(frame, [SENT[2] + 6, SENT[2] + 34], [0, 1], clamp));
  const p2 = Math.round(30 * interpolate(frame, [t3, t3 + 20], [0, 1], clamp));
  // 全程时间链：开题/中期/答辩 依次点亮
  const nodes = [
    {t: "开题过", f: t3 + 4},
    {t: "中期稳", f: t3 + 12},
    {t: "答辩顺", f: t3 + 20},
  ];
  return (
    <AbsoluteFill>
      <BigTitle parts={[{t: "毕设能不能", c: INK}, {t: "上岸", c: ORANGE}, {t: "，看这里", c: INK}]} y={140} size={76} />
      <div style={{position: "absolute", left: 160, top: 400, width: 1600, height: 150, borderRadius: 30, backgroundColor: "#eef2f6", border: `3px solid ${BORDER}`, overflow: "hidden"}}>
        <div style={{position: "absolute", left: 0, top: 0, width: w1, height: 150, backgroundColor: ORANGE, display: "flex", alignItems: "center", justifyContent: "center", gap: 20}}>
          {w1 > 500 ? (
            <>
              <span style={{fontFamily: F, fontSize: 52, fontWeight: 900, color: "#fff", letterSpacing: 6}}>选题 · 七分</span>
              <span style={{fontFamily: MONO, fontSize: 46, fontWeight: 900, color: "#fff"}}>{p1}%</span>
            </>
          ) : null}
        </div>
        <div style={{position: "absolute", left: 1120, top: 0, width: w2, height: 150, backgroundColor: DARK, display: "flex", alignItems: "center", justifyContent: "center", gap: 16}}>
          {w2 > 220 ? (
            <>
              <span style={{fontFamily: F, fontSize: 44, fontWeight: 900, color: "#fff", letterSpacing: 4}}>制作 · 三分</span>
              <span style={{fontFamily: MONO, fontSize: 40, fontWeight: 900, color: YEL}}>{p2}%</span>
            </>
          ) : null}
        </div>
      </div>

      {/* 全程时间链：选题定开局，后面每一步都顺 */}
      {nodes.map((n, i) => (
        <PopAt key={i} f={n.f}>
          <>
            {i > 0 && (
              <svg width={170} height={20} style={{position: "absolute", left: 786 + (i - 1) * 340, top: 664, overflow: "visible"}}>
                <line x1={0} y1={10} x2={170} y2={10} stroke={GREEN} strokeWidth={6} strokeLinecap="round" strokeDasharray="12 10" strokeDashoffset={-(frame * 1.6) % 22} />
              </svg>
            )}
            <div style={{
              position: "absolute", left: 620 + i * 340, top: 620, width: 160, height: 92,
              borderRadius: 18, backgroundColor: GREEN_BG, border: `3px solid ${GREEN}`,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontFamily: F, fontSize: 34, fontWeight: 900, color: GREEN,
            }}>{n.t}</div>
          </>
        </PopAt>
      ))}
      <Label x={400} y={640} w={170} text="选题定开局" color={ORANGE} size={30} />

      <Sparkle x={1620} y={360} s={0.8} phase={1} />
      <Sparkle x={240} y={330} s={0.6} color="#f2d9a8" phase={2} />
    </AbsoluteFill>
  );
};

// ============ P4 三个错 过渡 ============
const PageThree: React.FC = () => (
  <AbsoluteFill>
    <BigTitle parts={[{t: "三个最容易犯的", c: INK}, {t: "错", c: RED}]} y={330} size={92} />
    <PopAt f={SENT[3] + 4}>
      <div style={{position: "absolute", left: 480, top: 560, width: 150, height: 150, borderRadius: "50%", backgroundColor: RED, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: F, fontSize: 80, fontWeight: 900, boxShadow: "0 10px 24px rgba(224,86,86,0.35)"}}>1</div>
    </PopAt>
    <PopAt f={SENT[3] + 14}>
      <div style={{position: "absolute", left: 890, top: 560, width: 150, height: 150, borderRadius: "50%", backgroundColor: RED, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: F, fontSize: 80, fontWeight: 900, boxShadow: "0 10px 24px rgba(224,86,86,0.35)"}}>2</div>
    </PopAt>
    <PopAt f={SENT[3] + 24}>
      <div style={{position: "absolute", left: 1300, top: 560, width: 150, height: 150, borderRadius: "50%", backgroundColor: RED, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: F, fontSize: 80, fontWeight: 900, boxShadow: "0 10px 24px rgba(224,86,86,0.35)"}}>3</div>
    </PopAt>
    <Sparkle x={400} y={380} s={0.7} phase={0} />
    <Sparkle x={1500} y={400} s={0.6} color="#f2d9a8" phase={1} />
  </AbsoluteFill>
);

// ============ P5 误区一：迷信难度 ============
const PageDiff: React.FC = () => {
  const frame = useCurrentFrame();
  const bob = Math.sin(frame / 14) * 6;
  const tWan = wordAt(WORDS, 5, "成品");
  const tWanZheng = wordAt(WORDS, 5, "完整");
  const scoreRight = Math.round(92 * interpolate(frame, [tWanZheng, tWanZheng + 22], [0.4, 1], clamp));
  return (
    <AbsoluteFill>
      <div style={{position: "absolute", left: 660, top: 60, width: 300}}>
        <div style={{width: 300, height: 56, borderRadius: 999, backgroundColor: RED, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: F, fontSize: 30, fontWeight: 900, letterSpacing: 6}}>误区一</div>
      </div>
      <BigTitle parts={[{t: "迷信难度", c: RED}]} y={140} size={82} />

      {/* 后排老师（层1） */}
      <div style={{position: "absolute", left: 60, top: 420 + bob * 0.4, opacity: 0.55}}><TeacherIcon x={0} y={0} s={0.85} /></div>

      <PopAt f={wordAt(WORDS, 4, "完成") - 6}>
        <div style={{position: "absolute", left: 430, top: 300, width: 1060, height: 74, backgroundColor: "#eef2f6", borderRadius: 999, display: "flex", alignItems: "center", justifyContent: "center", gap: 18}}>
          <span style={{fontFamily: F, fontSize: 32, fontWeight: 900, color: SUBC}}>老师打分看的是</span>
          <span style={{fontFamily: F, fontSize: 32, fontWeight: 900, color: INK, backgroundColor: "#fff", borderRadius: 999, padding: "4px 22px", border: `2px solid ${BORDER}`}}>完成度</span>
          <span style={{fontFamily: F, fontSize: 32, fontWeight: 900, color: INK, backgroundColor: "#fff", borderRadius: 999, padding: "4px 22px", border: `2px solid ${BORDER}`}}>工作量匹配</span>
        </div>
      </PopAt>

      {/* 左卡：高级题 半成品 59 分（数字抖动+进度条红闪） */}
      <PopAt f={SENT[4] + 4}>
        <FlatCard x={250} y={430} w={620} h={440} chip="高级题" chipColor={RED} fill={RED_BG}>
          <DocProgress x={200} y={60} pct={0.5} color={RED} w={230} blink />
          <div style={{position: "absolute", left: 0, top: 220, width: 620, textAlign: "center", transform: `translateX(${Math.sin(frame / 5) * 2}px)`}}>
            <span style={{fontFamily: MONO, fontSize: 96, fontWeight: 900, color: RED}}>59</span>
            <span style={{fontFamily: F, fontSize: 34, fontWeight: 800, color: SUBC, marginLeft: 12}}>分</span>
          </div>
        </FlatCard>
      </PopAt>
      <PopAt f={tWan - 6}>
        <Stamp x={330} y={560} text="半成品" s={0.9} rot={-16} born={tWan - 6} />
      </PopAt>

      {/* 右卡：中等题 完整 92 分（数字滚动+进度条填充） */}
      <PopAt f={tWanZheng - 6}>
        <FlatCard x={1050} y={430} w={620} h={440} chip="中等题" chipColor={GREEN} fill={GREEN_BG}>
          <DocProgress x={200} y={60} pct={1} color={GREEN} w={230} born={tWanZheng} />
          <div style={{position: "absolute", left: 0, top: 220, width: 620, textAlign: "center"}}>
            <span style={{fontFamily: MONO, fontSize: 96, fontWeight: 900, color: GREEN}}>{scoreRight}</span>
            <span style={{fontFamily: F, fontSize: 34, fontWeight: 800, color: SUBC, marginLeft: 12}}>分</span>
          </div>
        </FlatCard>
      </PopAt>
      <PopAt f={wordAt(WORDS, 5, "高分") - 4}>
        <MarkOk x={1600} y={470} s={1.2} />
      </PopAt>

      {/* 结论 chip（信息位） */}
      <PopAt f={wordAt(WORDS, 5, "高分") - 14}>
        <div style={{position: "absolute", left: 610, top: 868, width: 700, height: 78, backgroundColor: ORANGE, borderRadius: 999, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 10px 24px rgba(240,145,45,0.35)"}}>
          <div style={{fontFamily: F, fontWeight: 900, fontSize: 38, color: "#fff", whiteSpace: "nowrap"}}>完成度 ＞ 难度</div>
        </div>
      </PopAt>
      <Sparkle x={1000} y={380} s={0.7} color="#f2d9a8" phase={1} />
      <Sparkle x={1740} y={430} s={0.6} phase={2} />
    </AbsoluteFill>
  );
};

// ============ P6 误区二：跟风 AI ============
const PageAi: React.FC = () => {
  const tBuTong = wordAt(WORDS, 6, "不通");
  return (
    <AbsoluteFill>
      <div style={{position: "absolute", left: 660, top: 60, width: 300}}>
        <div style={{width: 300, height: 56, borderRadius: 999, backgroundColor: RED, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: F, fontSize: 30, fontWeight: 900, letterSpacing: 6}}>误区二</div>
      </div>
      <BigTitle parts={[{t: "跟风", c: RED}, {t: " AI", c: RED}]} y={140} size={82} />

      <div style={{position: "absolute", left: 620, top: 560}}><Monitor x={0} y={0} s={1.05} logF={tBuTong + 6} /></div>

      <PopAt f={wordAt(WORDS, 6, "AI") - 4}>
        <div style={{position: "absolute", left: 1350, top: 320}}>
          <FireIcon x={0} y={0} s={1.3} />
        </div>
      </PopAt>
      <PopAt f={wordAt(WORDS, 6, "AI") + 6}>
        <div style={{position: "absolute", left: 1430, top: 280, width: 300, height: 88, backgroundColor: ORANGE, borderRadius: 18, display: "flex", alignItems: "center", justifyContent: "center", transform: "rotate(4deg)", boxShadow: "0 10px 24px rgba(240,145,45,0.35)"}}>
          <span style={{fontFamily: F, fontSize: 40, fontWeight: 900, color: "#fff"}}>热门 · 深度学习</span>
        </div>
      </PopAt>

      <PopAt f={tBuTong - 6}>
        <ErrorPop x={120} y={470} w={430} title="模型训练失败" mono="Loss = NaN" rot={-4} phase={0} />
      </PopAt>
      <PopAt f={wordAt(WORDS, 6, "数据") - 4}>
        <ErrorPop x={1330} y={560} w={430} title="数据集出问题" mono="rows: 0 (找不到数据)" rot={3} phase={1} />
      </PopAt>

      <PopAt f={wordAt(WORDS, 6, "虎") - 4}>
        <div style={{position: "absolute", left: 460, top: 880, width: 1000, height: 84, backgroundColor: RED_BG, borderRadius: 999, display: "flex", alignItems: "center", justifyContent: "center"}}>
          <div style={{fontFamily: F, fontWeight: 900, fontSize: 38, color: RED, whiteSpace: "nowrap"}}>别人的热门 ≠ 你的能力圈</div>
        </div>
      </PopAt>
      <Sparkle x={1600} y={200} s={0.7} phase={0} />
      <Sparkle x={200} y={380} s={0.6} color="#f2d9a8" phase={2} />
    </AbsoluteFill>
  );
};

// ============ P7 误区三：题目太空 ============
const PageEmpty: React.FC = () => {
  const tDa = wordAt(WORDS, 7, "被打");
  const frame = useCurrentFrame();
  const strike = interpolate(frame, [tDa - 4, tDa + 10], [0, 1040], clamp);
  return (
    <AbsoluteFill>
      <div style={{position: "absolute", left: 660, top: 60, width: 300}}>
        <div style={{width: 300, height: 56, borderRadius: 999, backgroundColor: RED, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: F, fontSize: 30, fontWeight: 900, letterSpacing: 6}}>误区三</div>
      </div>
      <BigTitle parts={[{t: "题目", c: INK}, {t: "太空", c: RED}]} y={140} size={82} />

      <PopAt f={SENT[7] + 4}>
        <div style={{position: "absolute", left: 360, top: 360, width: 1200, height: 220, backgroundColor: "#fff", border: `4px solid ${BORDER}`, borderRadius: 22, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16, boxShadow: "0 10px 26px rgba(47,58,69,0.07)"}}>
          <div style={{position: "relative"}}>
            <div style={{fontFamily: F, fontSize: 56, fontWeight: 900, color: INK, whiteSpace: "nowrap"}}>《基于某某技术的研究》</div>
            {/* 划掉红线（描画动画） */}
            <svg width={1040} height={20} style={{position: "absolute", left: -20, top: 38, overflow: "visible"}}>
              <line x1={0} y1={10} x2={strike} y2={10} stroke={RED} strokeWidth={9} strokeLinecap="round" opacity={0.85} />
            </svg>
          </div>
          <div style={{fontFamily: F, fontSize: 30, fontWeight: 700, color: SUBC, whiteSpace: "nowrap"}}>—— 研究什么？给谁用？做哪些功能？</div>
        </div>
      </PopAt>

      <PopAt f={tDa - 6}>
        <Stamp x={1240} y={400} text="退回" s={1.15} rot={-18} born={tDa - 6} />
      </PopAt>

      <PopAt f={wordAt(WORDS, 7, "具体") - 6}>
        <SlotPill x={340} y={700} text="具体场景" phase={0} />
      </PopAt>
      <PopAt f={wordAt(WORDS, 7, "具体") + 2}>
        <SlotPill x={840} y={700} text="具体对象" phase={1} />
      </PopAt>
      <PopAt f={wordAt(WORDS, 7, "具体") + 8}>
        <SlotPill x={1340} y={700} text="具体功能" phase={2} />
      </PopAt>

      <Sparkle x={1660} y={330} s={0.7} phase={1} />
    </AbsoluteFill>
  );
};

// ============ P8 三个动作 ============
const PageHow: React.FC = () => {
  const frame = useCurrentFrame();
  const t1 = SENT[9] + 4;
  const lit = (k: number) => interpolate(frame, [t1 + 10 + k * 9, t1 + 18 + k * 9], [0.25, 1], clamp);
  return (
    <AbsoluteFill>
      <BigTitle parts={[{t: "怎么选？", c: INK}, {t: "三个动作", c: ORANGE}]} y={90} size={76} />

      {/* 动作一：范围收窄（三胶囊逐个点亮） */}
      <PopAt f={t1}>
        <FlatCard x={160} y={280} w={1600} h={190}>
          <div style={{position: "absolute", left: 40, top: 0, width: 120, height: 190, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: F, fontSize: 64, fontWeight: 900, color: ORANGE}}>1</div>
          <div style={{position: "absolute", left: 180, top: 62, width: 360, fontFamily: F, fontSize: 44, fontWeight: 900, color: INK, whiteSpace: "nowrap"}}>范围收窄</div>
          <div style={{position: "absolute", left: 580, top: 56, display: "flex", gap: 18}}>
            {["场景", "对象", "功能"].map((t, i) => (
              <div key={i} style={{width: 250, height: 78, borderRadius: 999, backgroundColor: ORANGE_BG, border: `3px solid ${ORANGE}`, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: F, fontSize: 34, fontWeight: 900, color: ORANGE, opacity: lit(i)}}>
                具体{t}
              </div>
            ))}
          </div>
          <MarkOk x={1520} y={95} s={0.9} />
        </FlatCard>
      </PopAt>

      {/* 动作二：知网自查（放大镜扫描+省略号打字） */}
      <PopAt f={SENT[10] + 4}>
        <FlatCard x={160} y={510} w={1600} h={190}>
          <div style={{position: "absolute", left: 40, top: 0, width: 120, height: 190, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: F, fontSize: 64, fontWeight: 900, color: BLUE}}>2</div>
          <div style={{position: "absolute", left: 180, top: 62, width: 360, fontFamily: F, fontSize: 44, fontWeight: 900, color: INK, whiteSpace: "nowrap"}}>知网自查</div>
          <div style={{position: "absolute", left: 580, top: 52, width: 760, height: 86, backgroundColor: "#f4f6f9", border: `3px solid ${BORDER}`, borderRadius: 999, display: "flex", alignItems: "center", paddingLeft: 34}}>
            <span style={{fontFamily: F, fontSize: 34, fontWeight: 800, color: SUBC, whiteSpace: "nowrap"}}>搜：文献 · 同类毕设案例{["", "…", "……"][Math.floor(frame / 12) % 3]}</span>
            <div style={{position: "absolute", right: -60, top: -12}}><SearchIcon x={0} y={0} s={1.0} sweep /></div>
          </div>
          <div style={{position: "absolute", left: 1400, top: 30}}><BooksIcon x={0} y={0} s={0.62} /></div>
          <MarkOk x={1520} y={95} s={0.9} />
        </FlatCard>
      </PopAt>

      {/* 动作三：优选案例多的题（卡片呼吸） */}
      <PopAt f={SENT[11] + 4}>
        <FlatCard x={160} y={740} w={1600} h={190}>
          <div style={{position: "absolute", left: 40, top: 0, width: 120, height: 190, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: F, fontSize: 64, fontWeight: 900, color: GREEN}}>3</div>
          <div style={{position: "absolute", left: 180, top: 40, width: 420, fontFamily: F, fontSize: 44, fontWeight: 900, color: INK, whiteSpace: "nowrap"}}>选案例多的题</div>
          <div style={{position: "absolute", left: 180, top: 108, width: 420, fontFamily: F, fontSize: 28, fontWeight: 700, color: SUBC, whiteSpace: "nowrap"}}>计算机最稳的两类：</div>
          <div style={{position: "absolute", left: 640, top: 56, display: "flex", gap: 20}}>
            {["管理系统", "小程序"].map((t, i) => (
              <div key={i} style={{width: 320, height: 78, borderRadius: 18, backgroundColor: GREEN_BG, border: `3px solid ${GREEN}`, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: F, fontSize: 34, fontWeight: 900, color: GREEN, transform: `translateY(${Math.sin(frame / 10 + i * 2) * 4}px)`}}>{t}</div>
            ))}
          </div>
          <div style={{position: "absolute", left: 1330, top: 62, width: 150, fontFamily: F, fontSize: 30, fontWeight: 900, color: GREEN, whiteSpace: "nowrap"}}>落地最稳</div>
          <MarkOk x={1520} y={95} s={0.9} />
        </FlatCard>
      </PopAt>
      <Sparkle x={1800} y={220} s={0.7} phase={2} />
      <Sparkle x={120} y={700} s={0.6} color="#f2d9a8" phase={0} />
    </AbsoluteFill>
  );
};

// ============ P9 金句（停用底部字幕） ============
const PageQuote: React.FC = () => {
  const frame = useCurrentFrame();
  const breathe = 1 + Math.sin(frame / 16) * 0.008;
  return (
    <AbsoluteFill>
      <PopAt f={SENT[12] + 2}>
        <div style={{position: "absolute", left: 0, top: 250, width: W, textAlign: "center"}}>
          <span style={{fontFamily: F, fontSize: 40, fontWeight: 900, color: SUBC, backgroundColor: "#eef2f6", borderRadius: 999, padding: "10px 34px"}}>毕设是长跑</span>
        </div>
      </PopAt>
      <div style={{position: "absolute", left: 260, top: 380, width: 1400, height: 300, backgroundColor: "rgba(247,201,72,0.25)", border: `5px solid ${YEL}`, borderRadius: 30, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 28, transform: `rotate(-1.5deg) scale(${breathe})`}}>
        <div style={{fontFamily: F, fontWeight: 900, fontSize: 76, color: INK, letterSpacing: 8, whiteSpace: "nowrap"}}>
          <span style={{color: ORANGE}}>七分选题</span>定生死
        </div>
        <div style={{fontFamily: F, fontWeight: 900, fontSize: 76, color: INK, letterSpacing: 8, whiteSpace: "nowrap"}}>
          <span style={{color: BLUE}}>三分制作</span>看功夫
        </div>
      </div>
      <Sparkle x={330} y={420} s={0.9} phase={0} />
      <Sparkle x={1560} y={480} s={0.7} color="#b8d4f2" phase={1} />
      <Sparkle x={1460} y={720} s={0.6} phase={2} />
      <Sparkle x={430} y={730} s={0.55} color="#f2d9a8" phase={1} />
    </AbsoluteFill>
  );
};

// ============ P10 结尾 A/B 提问卡（截图卡，保持干净） ============
const PageAsk: React.FC = () => (
  <AbsoluteFill>
    <div style={{
      position: "absolute", top: 130, left: 300, right: 300,
      backgroundColor: "#ffffff", borderRadius: 24, padding: "46px 60px 40px",
      boxShadow: "0 18px 50px rgba(10,20,30,0.18)",
    }}>
      <div style={{display: "flex", alignItems: "center", justifyContent: "center", gap: 18, marginBottom: 36}}>
        <div style={{width: 56, height: 56, borderRadius: 14, backgroundColor: ORANGE, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 36, fontWeight: 900}}>?</div>
        <div style={{fontFamily: F, fontSize: 52, fontWeight: 900, color: INK, whiteSpace: "nowrap"}}>你现在卡在哪一步？</div>
      </div>
      <div style={{display: "flex", gap: 30, justifyContent: "center"}}>
        <div style={{width: 560, height: 210, borderRadius: 20, backgroundColor: BLUE_BG, border: `4px solid ${BLUE}`, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12}}>
          <div style={{fontFamily: F, fontSize: 30, fontWeight: 900, color: BLUE}}>A</div>
          <div style={{fontFamily: F, fontSize: 40, fontWeight: 900, color: INK, whiteSpace: "nowrap"}}>不知道选什么方向</div>
        </div>
        <div style={{width: 560, height: 210, borderRadius: 20, backgroundColor: ORANGE_BG, border: `4px solid ${ORANGE}`, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12}}>
          <div style={{fontFamily: F, fontSize: 30, fontWeight: 900, color: ORANGE}}>B</div>
          <div style={{fontFamily: F, fontSize: 40, fontWeight: 900, color: INK, whiteSpace: "nowrap"}}>有题目，怕做不出来</div>
        </div>
      </div>
      <div style={{textAlign: "center", marginTop: 30, fontFamily: F, fontSize: 30, fontWeight: 800, color: SUBC, whiteSpace: "nowrap"}}>
        评论区扣 A 或 B，讲讲你的题目
      </div>
    </div>
    <div style={{position: "absolute", top: 830, left: 0, width: W, textAlign: "center"}}>
      <span style={{fontFamily: F, fontSize: 30, fontWeight: 800, color: SUBC}}>全栈小秋 · 毕设通关系列 01</span>
    </div>
    <Sparkle x={280} y={140} s={0.8} phase={0} />
    <Sparkle x={1650} y={170} s={0.6} color="#f2d9a8" phase={1} />
  </AbsoluteFill>
);

// ============ 页面编排 ============
const PAGES: {C: React.FC; from: number; dur: number}[] = [
  {C: PageHook, from: SENT[0], dur: SENT[1] - SENT[0]},
  {C: PageFall, from: SENT[1], dur: SENT[2] - SENT[1]},
  {C: PageRatio, from: SENT[2], dur: SENT[3] - SENT[2]},
  {C: PageThree, from: SENT[3], dur: SENT[4] - SENT[3]},
  {C: PageDiff, from: SENT[4], dur: SENT[6] - SENT[4]},
  {C: PageAi, from: SENT[6], dur: SENT[7] - SENT[6]},
  {C: PageEmpty, from: SENT[7], dur: SENT[8] - SENT[7]},
  {C: PageHow, from: SENT[8], dur: SENT[12] - SENT[8]},
  {C: PageQuote, from: SENT[12], dur: SENT[13] - SENT[12]},
  {C: PageAsk, from: SENT[13], dur: DUR - SENT[13]},
];

const SFX: {f: number; w: string; v: number}[] = [
  ...[1, 2, 3, 4, 6, 7, 8, 12, 13].map((i) => ({f: SENT[i], w: "whoosh.wav", v: 0.2})),
  {f: wordAt(WORDS, 0, "坑") - 6, w: "error.wav", v: 0.24},
  {f: SENT[9], w: "pop.wav", v: 0.26},
  {f: SENT[10], w: "pop.wav", v: 0.26},
  {f: SENT[11], w: "pop.wav", v: 0.26},
  {f: wordAt(WORDS, 2, "三分") + 14, w: "pop.wav", v: 0.22},
  {f: wordAt(WORDS, 2, "三分") + 30, w: "success.wav", v: 0.22},
  {f: wordAt(WORDS, 5, "成品") - 6, w: "error.wav", v: 0.24},
  {f: wordAt(WORDS, 5, "高分") - 4, w: "success.wav", v: 0.24},
  {f: wordAt(WORDS, 5, "高分") - 12, w: "ding.wav", v: 0.24},
  {f: wordAt(WORDS, 6, "不通") - 4, w: "error.wav", v: 0.24},
  {f: wordAt(WORDS, 6, "数据") - 2, w: "alert.wav", v: 0.22},
  {f: wordAt(WORDS, 7, "被打") - 4, w: "error.wav", v: 0.26},
  {f: wordAt(WORDS, 12, "生死") - 4, w: "ding.wav", v: 0.28},
  {f: SENT[13] + 4, w: "pop.wav", v: 0.28},
];

// 铁律⑫：金句段 [SENT[12], SENT[13]) 组件级停用字幕
const Subtitles: React.FC = () => {
  const frame = useCurrentFrame();
  if (frame >= SENT[12] && frame < SENT[13]) return null;
  return <SubtitleBar subs={SUBS} />;
};

export const BiSheTopicFlat: React.FC = () => {
  const frame = useCurrentFrame();
  const bed = interpolate(frame, [0, 20, DUR - 130, DUR - 100, DUR - 26, DUR - 1], [0, 0.06, 0.06, 0.1, 0.17, 0], clamp);
  // 结尾无垫乐音（2026-10-27 用户拍板"不要最后那个音"）：话音落+0.4s 呼吸直接收。
  return (
    <AbsoluteFill style={{background: "linear-gradient(180deg,#fff 0%,#f3f6f9 100%)", fontFamily: F, overflow: "hidden"}}>
      <BgDots />
      {PAGES.map(({C, from, dur}, i) => (
        <HardPage key={i} from={from} duration={dur}>
          <C />
        </HardPage>
      ))}
      <BrandCorner light />

      {SENT.map((start, i) => (
        <Sequence key={`v-${i}`} from={start} durationInFrames={i < 13 ? SENT[i + 1] - start + 10 : DUR - start}>
          <Audio src={staticFile(`audio/bishe-tts/s${("0" + (i + 1)).slice(-2)}.wav`)} volume={1} />
        </Sequence>
      ))}
      {SFX.map((s, i) => (
        <Sequence key={`sfx-${i}`} from={s.f} durationInFrames={22}>
          <Audio src={staticFile(`audio/sfx/${s.w}`)} volume={s.v} />
        </Sequence>
      ))}
      <Audio src={staticFile("audio/bed.wav")} loop volume={() => bed} />

      <Subtitles />
    </AbsoluteFill>
  );
};
