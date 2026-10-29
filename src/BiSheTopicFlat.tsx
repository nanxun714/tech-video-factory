import React from "react";
import {Audio} from "@remotion/media";
import {
  AbsoluteFill, interpolate, Sequence, staticFile, useCurrentFrame,
} from "remotion";

// ============ 扁平插画风 · 毕设通关系列 01《毕设选题避坑》v3（外部意见五条整改版，全栈小秋 IP） ============
// v3 改动（2026-10-27）：①前14秒钩子后马上双题对比（空泛 vs YOLO 具体）；②三误区砍小字、
// 误区三改"不推荐→推荐"前后对比+对象/方案/成果三样拆解；③三动作升级为带判断标准的检查项；
// ④金句去比例化改「选题定方向，制作看落地」；⑤互动改 A=没想好 / B=选了但没底；⑥底部字幕放大 52px。
// 配音 24 句 84.3s（曼波 1.4 速），锚点全部用 at(i,frac) 比例定位（规避 2 字组分词边界陷阱）。
// 转场铁律①纯硬切；结尾铁律：话音落+6帧直接收，无垫乐音。

import {HardPage, PopAt, BrandCorner} from "./batch10/kit";
import {DUR, SENT, SENT_DUR, SUBS} from "./batch10/bisheData";

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
// 句 i 内按字符占比定位锚帧（规避 wordAt 分词边界陷阱）
const at = (i: number, frac: number) => SENT[i] + Math.round(frac * SENT_DUR[i]);

// 背景层（层0）
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
        position: "absolute", left: x + w / 2 - (chip.length * 20 + 26), top: y - 28,
        width: chip.length * 40 + 52, height: 56, borderRadius: 999,
        backgroundColor: chipColor, color: "#fff", display: "flex",
        alignItems: "center", justifyContent: "center",
        fontSize: 32, fontWeight: 900, letterSpacing: 3,
        boxShadow: `0 8px 18px ${chipColor}44`,
      }}>{chip}</div>
    ) : null}
  </>
);

const MarkOk: React.FC<{x: number; y: number; s?: number; c?: string}> = ({x, y, s = 1, c = GREEN}) => (
  <svg width={60 * s} height={60 * s} viewBox="0 0 60 60"
    style={{position: "absolute", left: x - 30 * s, top: y - 30 * s, overflow: "visible"}}>
    <circle cx={30} cy={30} r={28} fill={c} />
    <path d="M17 31 L26 40 L43 21" fill="none" stroke="#fff" strokeWidth={7} strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

// 红色印章（斜盖，盖章后小抖）
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

// 文档卡（进度条；blink=红闪，born=填充动画起点帧）
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

// 显示器+代码窗（光标闪烁+日志行）
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

// 报错弹窗（持续小抖）
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

// 火苗（跳动）
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

// 书堆（文献）
const BooksIcon: React.FC<{x: number; y: number; s?: number}> = ({x, y, s = 1}) => (
  <svg width={140 * s} height={110 * s} viewBox="0 0 140 110"
    style={{position: "absolute", left: x - 70 * s, top: y - 55 * s, overflow: "visible"}}>
    <rect x={14} y={78} width={112} height={24} rx={6} fill={BLUE} />
    <rect x={22} y={54} width={96} height={22} rx={6} fill={ORANGE} />
    <rect x={30} y={32} width={80} height={20} rx={6} fill={GREEN} />
    <rect x={40} y={14} width={60} height={16} rx={5} fill={DARK} />
  </svg>
);

// 勾选框（检查项：标准达标后打勾）
const CheckBox: React.FC<{x: number; y: number; born: number; s?: number}> = ({x, y, born, s = 1}) => {
  const frame = useCurrentFrame();
  const done = frame >= born;
  return (
    <svg width={64 * s} height={64 * s} viewBox="0 0 64 64"
      style={{position: "absolute", left: x, top: y, overflow: "visible"}}>
      <rect x={4} y={4} width={56} height={56} rx={12}
        fill={done ? GREEN : "#fff"} stroke={done ? GREEN : SUBC} strokeWidth={5} />
      {done && <path d="M18 33 L28 43 L46 21" fill="none" stroke="#fff" strokeWidth={7} strokeLinecap="round" strokeLinejoin="round" />}
    </svg>
  );
};

const Label: React.FC<{x: number; y: number; w: number; text: string; color?: string; size?: number}> = ({
  x, y, w, text, color = SUBC, size = 30,
}) => (
  <div style={{
    position: "absolute", left: x, top: y, width: w, textAlign: "center",
    fontFamily: F, fontSize: size, color, fontWeight: 700, whiteSpace: "nowrap",
  }}>{text}</div>
);

// ============ P1 钩子 ============
const PageHook: React.FC = () => {
  const frame = useCurrentFrame();
  const q1 = pulse(frame, 18, 0.35, 0.8);
  return (
    <AbsoluteFill>
      <div style={{position: "absolute", left: 64, top: 40, width: 344}}>
        <div style={{width: 344, height: 52, borderRadius: 999, border: `3px solid ${ORANGE}`, color: ORANGE, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: F, fontSize: 26, fontWeight: 900, letterSpacing: 3, backgroundColor: "rgba(255,255,255,0.75)", whiteSpace: "nowrap"}}>毕设通关 · 第 01 期</div>
      </div>
      <BigTitle parts={[{t: "题目", c: INK}, {t: "越难", c: RED}, {t: "，分越高？", c: INK}]} y={250} size={92} />
      <div style={{position: "absolute", right: 120, top: 340, fontFamily: F, fontSize: 300, fontWeight: 900, color: "#dbe4ee", width: 300, textAlign: "center", opacity: q1}}>?</div>
      <div style={{position: "absolute", left: 90, top: 420, fontFamily: F, fontSize: 190, fontWeight: 900, color: "#e7edf4", width: 200, textAlign: "center", opacity: pulse(frame + 14, 18, 0.3, 0.75)}}>?</div>
      <PopAt f={at(0, 0.55) - 6}>
        <div style={{position: "absolute", left: "50%", top: 500, transform: "translateX(-50%)"}}>
          <svg width={330} height={330} viewBox="0 0 360 360" style={{overflow: "visible", transform: "rotate(-12deg)"}}>
            <circle cx={180} cy={180} r={160} fill="none" stroke={RED} strokeWidth={16} opacity={0.9} />
            <circle cx={180} cy={180} r={128} fill="none" stroke={RED} strokeWidth={8} opacity={0.55} />
            <path d="M 116 116 L 244 244 M 244 116 L 116 244" stroke={RED} strokeWidth={22} strokeLinecap="round" />
          </svg>
        </div>
      </PopAt>
      <Sparkle x={390} y={330} s={0.8} phase={0} />
      <Sparkle x={1490} y={580} s={0.65} color="#f2d9a8" phase={1} />
    </AbsoluteFill>
  );
};

// ============ P2 双题对比（具体案例钩子） ============// ============ P2 双题对比（提问时双卡即在场，念到哪边哪边高亮） ============
const PageVs: React.FC = () => {
  const frame = useCurrentFrame();
  const activeL = frame >= SENT[2] && frame < SENT[3];
  const activeR = frame >= SENT[3] && frame < SENT[4];
  const glowL = interpolate(frame, [SENT[2], SENT[2] + 6], [0, 1], clamp);
  const glowR = interpolate(frame, [SENT[3], SENT[3] + 6], [0, 1], clamp);
  const scaleL = activeL ? 1.04 : 1;
  const scaleR = activeR ? 1.04 : 1;
  return (
    <AbsoluteFill>
      <BigTitle parts={[{t: "这两个题目，你", c: INK}, {t: "看好哪个", c: ORANGE}, {t: "？", c: INK}]} y={90} size={66} />
      <PopAt f={SENT[1] + 4}>
        <div style={{position: "absolute", left: 110, top: 290, width: 820, height: 420, transform: `scale(${scaleL})`, transformOrigin: "center center"}}>
          {frame >= SENT[2] && <div style={{position: "absolute", left: -7, top: -7, width: 834, height: 434, border: `6px solid ${RED}`, borderRadius: 28, boxShadow: `0 0 0 6px rgba(224,86,86,0.15)`, opacity: glowL}} />}
          <FlatCard x={0} y={0} w={820} h={420} chip="左边" chipColor={SUBC} fill={RED_BG}>
            <div style={{position: "absolute", left: 0, top: 120, width: 820, textAlign: "center"}}>
              <div style={{fontFamily: F, fontSize: 48, fontWeight: 900, color: INK, whiteSpace: "nowrap"}}>基于深度学习的图像识别研究</div>
            </div>
            <div style={{position: "absolute", left: 210, top: 280, width: 400, height: 74, borderRadius: 999, backgroundColor: "#fff", border: `3px solid ${RED}`, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: F, fontSize: 34, fontWeight: 900, color: RED}}>
              空泛 · 没法下笔
            </div>
          </FlatCard>
        </div>
      </PopAt>
      <PopAt f={SENT[1] + 16}>
        <div style={{position: "absolute", left: 990, top: 290, width: 820, height: 420, transform: `scale(${scaleR})`, transformOrigin: "center center"}}>
          {frame >= SENT[3] && <div style={{position: "absolute", left: -7, top: -7, width: 834, height: 434, border: `6px solid ${GREEN}`, borderRadius: 28, boxShadow: `0 0 0 6px rgba(63,174,122,0.15)`, opacity: glowR}} />}
          <FlatCard x={0} y={0} w={820} h={420} chip="右边" chipColor={GREEN} fill={GREEN_BG}>
            <div style={{position: "absolute", left: 0, top: 120, width: 820, textAlign: "center"}}>
              <div style={{fontFamily: F, fontSize: 42, fontWeight: 900, color: INK, whiteSpace: "nowrap"}}>基于<span style={{color: BLUE}}>YOLO</span>的校园道路车辆检测系统</div>
            </div>
            <div style={{position: "absolute", left: 210, top: 280, width: 400, height: 74, borderRadius: 999, backgroundColor: "#fff", border: `3px solid ${GREEN}`, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: F, fontSize: 34, fontWeight: 900, color: GREEN}}>
              具体 · 能直接开工
            </div>
          </FlatCard>
        </div>
      </PopAt>
      <PopAt f={SENT[2] - 10}>
        <div style={{position: "absolute", left: 890, top: 430, width: 140, height: 140, borderRadius: "50%", backgroundColor: ORANGE, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: F, fontSize: 56, fontWeight: 900, boxShadow: "0 12px 28px rgba(240,145,45,0.4)", border: "6px solid #fff"}}>VS</div>
      </PopAt>
      <PopAt f={at(4, 0.1)}>
        <div style={{position: "absolute", left: 260, top: 800, width: 640, height: 88, backgroundColor: RED_BG, borderRadius: 999, display: "flex", alignItems: "center", justifyContent: "center"}}>
          <span style={{fontFamily: F, fontSize: 38, fontWeight: 900, color: RED, whiteSpace: "nowrap"}}>空到没法下笔</span>
        </div>
      </PopAt>
      <PopAt f={at(4, 0.55)}>
        <div style={{position: "absolute", left: 1020, top: 800, width: 640, height: 88, backgroundColor: GREEN_BG, borderRadius: 999, display: "flex", alignItems: "center", justifyContent: "center"}}>
          <span style={{fontFamily: F, fontSize: 38, fontWeight: 900, color: GREEN, whiteSpace: "nowrap"}}>具体到能直接开工</span>
        </div>
      </PopAt>
      <Sparkle x={930} y={300} s={0.75} phase={1} />
      <Sparkle x={1800} y={280} s={0.6} color="#f2d9a8" phase={2} />
    </AbsoluteFill>
  );
};

// ============ P3 填坑 + 三个错 ============
const PageDebt: React.FC = () => (
  <AbsoluteFill>
    <BigTitle parts={[{t: "选错题，后面全是在", c: INK}, {t: "填坑", c: RED}]} y={300} size={84} />
    <PopAt f={SENT[6] + 8}>
      <div style={{position: "absolute", left: 480, top: 580, width: 150, height: 150, borderRadius: "50%", backgroundColor: RED, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: F, fontSize: 80, fontWeight: 900, boxShadow: "0 10px 24px rgba(224,86,86,0.35)"}}>1</div>
    </PopAt>
    <PopAt f={SENT[6] + 20}>
      <div style={{position: "absolute", left: 890, top: 580, width: 150, height: 150, borderRadius: "50%", backgroundColor: RED, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: F, fontSize: 80, fontWeight: 900, boxShadow: "0 10px 24px rgba(224,86,86,0.35)"}}>2</div>
    </PopAt>
    <PopAt f={SENT[6] + 32}>
      <div style={{position: "absolute", left: 1300, top: 580, width: 150, height: 150, borderRadius: "50%", backgroundColor: RED, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: F, fontSize: 80, fontWeight: 900, boxShadow: "0 10px 24px rgba(224,86,86,0.35)"}}>3</div>
    </PopAt>
    <Sparkle x={400} y={380} s={0.7} phase={0} />
    <Sparkle x={1500} y={420} s={0.6} color="#f2d9a8" phase={1} />
  </AbsoluteFill>
);

// ============ P4 误区一：迷信难度（对比卡，砍小字，数字放大） ============
const PageDiff: React.FC = () => {
  const frame = useCurrentFrame();
  const tBan = at(8, 0.4);
  const tWanZheng = at(8, 0.68);
  const scoreRight = Math.round(92 * interpolate(frame, [tWanZheng, tWanZheng + 20], [0.4, 1], clamp));
  return (
    <AbsoluteFill>
      <div style={{position: "absolute", left: 660, top: 50, width: 300}}>
        <div style={{width: 300, height: 56, borderRadius: 999, backgroundColor: RED, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: F, fontSize: 30, fontWeight: 900, letterSpacing: 6}}>误区一</div>
      </div>
      <BigTitle parts={[{t: "迷信难度", c: RED}]} y={130} size={84} />

      <PopAt f={SENT[7] + 4}>
        <FlatCard x={210} y={400} w={680} h={430} chip="高级题" chipColor={RED} fill={RED_BG}>
          <DocProgress x={225} y={70} pct={0.5} color={RED} w={230} blink />
          <div style={{position: "absolute", left: 0, top: 230, width: 680, textAlign: "center", transform: `translateX(${Math.sin(frame / 5) * 2}px)`}}>
            <span style={{fontFamily: MONO, fontSize: 110, fontWeight: 900, color: RED}}>59</span>
            <span style={{fontFamily: F, fontSize: 36, fontWeight: 800, color: SUBC, marginLeft: 14}}>分</span>
          </div>
        </FlatCard>
      </PopAt>
      <PopAt f={tBan - 6}>
        <Stamp x={300} y={530} text="半成品" s={0.95} rot={-16} born={tBan - 6} />
      </PopAt>

      <PopAt f={tWanZheng - 6}>
        <FlatCard x={1030} y={400} w={680} h={430} chip="中等题" chipColor={GREEN} fill={GREEN_BG}>
          <DocProgress x={225} y={70} pct={1} color={GREEN} w={230} born={tWanZheng} />
          <div style={{position: "absolute", left: 0, top: 230, width: 680, textAlign: "center"}}>
            <span style={{fontFamily: MONO, fontSize: 110, fontWeight: 900, color: GREEN}}>{scoreRight}</span>
            <span style={{fontFamily: F, fontSize: 36, fontWeight: 800, color: SUBC, marginLeft: 14}}>分</span>
          </div>
        </FlatCard>
      </PopAt>
      <PopAt f={at(8, 0.92)}>
        <MarkOk x={1650} y={460} s={1.25} />
      </PopAt>

      <PopAt f={at(8, 0.95) - 4}>
        <div style={{position: "absolute", left: 610, top: 862, width: 700, height: 82, backgroundColor: ORANGE, borderRadius: 999, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 10px 24px rgba(240,145,45,0.35)"}}>
          <div style={{fontFamily: F, fontWeight: 900, fontSize: 40, color: "#fff", whiteSpace: "nowrap"}}>完成度 ＞ 难度</div>
        </div>
      </PopAt>
      <Sparkle x={1000} y={370} s={0.7} color="#f2d9a8" phase={1} />
      <Sparkle x={1760} y={420} s={0.6} phase={2} />
    </AbsoluteFill>
  );
};

// ============ P5 误区二：跟风 AI ============
const PageAi: React.FC = () => {
  const tBuTong = at(9, 0.33);
  return (
    <AbsoluteFill>
      <div style={{position: "absolute", left: 660, top: 50, width: 300}}>
        <div style={{width: 300, height: 56, borderRadius: 999, backgroundColor: RED, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: F, fontSize: 30, fontWeight: 900, letterSpacing: 6}}>误区二</div>
      </div>
      <BigTitle parts={[{t: "跟风", c: RED}, {t: " AI", c: RED}]} y={130} size={84} />

      <div style={{position: "absolute", left: 620, top: 560}}><Monitor x={0} y={0} s={1.05} logF={tBuTong + 6} /></div>

      <PopAt f={at(9, 0.16)}>
        <div style={{position: "absolute", left: 1350, top: 320}}>
          <FireIcon x={0} y={0} s={1.3} />
        </div>
      </PopAt>
      <PopAt f={at(9, 0.24)}>
        <div style={{position: "absolute", left: 1430, top: 280, width: 300, height: 88, backgroundColor: ORANGE, borderRadius: 18, display: "flex", alignItems: "center", justifyContent: "center", transform: "rotate(4deg)", boxShadow: "0 10px 24px rgba(240,145,45,0.35)"}}>
          <span style={{fontFamily: F, fontSize: 40, fontWeight: 900, color: "#fff"}}>热门 · 深度学习</span>
        </div>
      </PopAt>

      <PopAt f={tBuTong - 6}>
        <ErrorPop x={120} y={470} w={430} title="模型训练失败" mono="Loss = NaN" rot={-4} phase={0} />
      </PopAt>
      <PopAt f={at(9, 0.5) - 4}>
        <ErrorPop x={1330} y={560} w={430} title="数据集出问题" mono="rows: 0 (找不到数据)" rot={3} phase={1} />
      </PopAt>

      <PopAt f={at(9, 0.82) - 4}>
        <div style={{position: "absolute", left: 460, top: 850, width: 1000, height: 84, backgroundColor: RED_BG, borderRadius: 999, display: "flex", alignItems: "center", justifyContent: "center"}}>
          <div style={{fontFamily: F, fontWeight: 900, fontSize: 38, color: RED, whiteSpace: "nowrap"}}>别人的热门 ≠ 你的能力圈</div>
        </div>
      </PopAt>
      <Sparkle x={1600} y={200} s={0.7} phase={0} />
      <Sparkle x={200} y={380} s={0.6} color="#f2d9a8" phase={2} />
    </AbsoluteFill>
  );
};

// ============ P6 误区三：题目太空 → 前后对比（对象/方案/成果） ============
const PageEmpty: React.FC = () => {
  const frame = useCurrentFrame();
  const tHuan = SENT[11];
  const strike = interpolate(frame, [at(10, 0.78), at(10, 0.92)], [0, 900], clamp);
  return (
    <AbsoluteFill>
      <div style={{position: "absolute", left: 660, top: 40, width: 300}}>
        <div style={{width: 300, height: 56, borderRadius: 999, backgroundColor: RED, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: F, fontSize: 30, fontWeight: 900, letterSpacing: 6}}>误区三</div>
      </div>
      <BigTitle parts={[{t: "题目", c: INK}, {t: "太空", c: RED}, {t: "？换掉它", c: INK}]} y={116} size={70} />

      {/* 不推荐卡 */}
      <PopAt f={SENT[10] + 4}>
        <div style={{position: "absolute", left: 360, top: 250, width: 1200, height: 150, backgroundColor: RED_BG, border: `4px solid ${RED}`, borderRadius: 22, display: "flex", alignItems: "center", justifyContent: "center"}}>
          <div style={{position: "relative"}}>
            <div style={{fontFamily: F, fontSize: 48, fontWeight: 900, color: INK, whiteSpace: "nowrap"}}>基于某某技术的研究</div>
            <svg width={920} height={18} style={{position: "absolute", left: -10, top: 32, overflow: "visible"}}>
              <line x1={0} y1={9} x2={strike} y2={9} stroke={RED} strokeWidth={8} strokeLinecap="round" opacity={0.85} />
            </svg>
          </div>
        </div>
      </PopAt>
      <PopAt f={at(10, 0.92)}>
        <Stamp x={1420} y={230} text="太空" s={0.8} rot={-14} born={at(10, 0.92)} />
      </PopAt>

      {/* 换成 ↓ */}
      <PopAt f={tHuan - 4}>
        <div style={{position: "absolute", left: 860, top: 428, width: 200, height: 64, borderRadius: 999, backgroundColor: ORANGE, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: F, fontSize: 34, fontWeight: 900, boxShadow: "0 8px 20px rgba(240,145,45,0.4)"}}>
          换 成
        </div>
      </PopAt>
      <PopAt f={SENT[10] + 2}>
        <svg width={W} height={1080} style={{position: "absolute", left: 0, top: 0, overflow: "visible", pointerEvents: "none"}}>
          <line x1={960} y1={404} x2={960} y2={428} stroke={ORANGE} strokeWidth={6} strokeLinecap="round" />
          <line x1={960} y1={492} x2={960} y2={516} stroke={ORANGE} strokeWidth={6} strokeLinecap="round" />
          <path d="M 940 510 L 960 528 L 980 510" fill="none" stroke={ORANGE} strokeWidth={6} strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </PopAt>

      {/* 推荐卡 */}
      <PopAt f={tHuan + 8}>
        <div style={{position: "absolute", left: 310, top: 540, width: 1300, height: 160, backgroundColor: GREEN_BG, border: `4px solid ${GREEN}`, borderRadius: 22, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 10px 26px rgba(63,174,122,0.12)"}}>
          <div style={{fontFamily: F, fontSize: 46, fontWeight: 900, color: INK, whiteSpace: "nowrap"}}>基于<span style={{color: BLUE}}>YOLO</span>的校园道路车辆检测系统</div>
        </div>
      </PopAt>

      {/* 三样拆解 */}
      {[
        {t: "对象 · 校园道路车辆", f: at(12, 0.08)},
        {t: "方案 · YOLO 检测", f: at(12, 0.55)},
        {t: "成果 · 系统+实验+论文", f: SENT[13]},
      ].map((x, i) => (
        <PopAt key={i} f={x.f}>
          <div style={{
            position: "absolute", left: 130 + i * 570, top: 780, width: 540, height: 92,
            borderRadius: 18, backgroundColor: "#fff", border: `3px solid ${GREEN}`,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontFamily: F, fontSize: 34, fontWeight: 900, color: INK, whiteSpace: "nowrap",
          }}>
            <span style={{color: GREEN, marginRight: 12}}>✓</span>{x.t}
          </div>
        </PopAt>
      ))}
      <PopAt f={SENT[13] + 6}><Label x={0} y={900} w={W} text="三样说清楚，题目就从「空」变「能做」" color={SUBC} size={32} /></PopAt>
      <Sparkle x={1660} y={300} s={0.7} phase={1} />
      <Sparkle x={210} y={640} s={0.6} color="#f2d9a8" phase={2} />
    </AbsoluteFill>
  );
};

// ============ P7 三个动作 = 检查项（带判断标准） ============
const PageHow: React.FC = () => (
  <AbsoluteFill>
    <BigTitle parts={[{t: "怎么选？", c: INK}, {t: "三个动作", c: ORANGE}, {t: "＋判断标准", c: INK}]} y={56} size={62} />

    <PopAt f={SENT[15] + 4}>
      <FlatCard x={130} y={200} w={1660} h={180}>
        <div style={{position: "absolute", left: 36, top: 0, width: 110, height: 180, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: F, fontSize: 64, fontWeight: 900, color: ORANGE}}>1</div>
        <div style={{position: "absolute", left: 160, top: 24, width: 1420, fontFamily: F, fontSize: 42, fontWeight: 900, color: INK, whiteSpace: "nowrap"}}>范围收窄</div>
        <div style={{position: "absolute", left: 160, top: 92, width: 1420, fontFamily: F, fontSize: 35, fontWeight: 800, color: INK, whiteSpace: "nowrap"}}>
          一句话说清 <span style={{color: ORANGE}}>对象 · 技术 · 交付物</span>，说不清 = 还没收窄
        </div>
        <div style={{position: "absolute", right: 40, top: 58}}><CheckBox x={0} y={0} born={at(15, 0.85)} /></div>
      </FlatCard>
    </PopAt>

    <PopAt f={SENT[16] + 4}>
      <FlatCard x={130} y={405} w={1660} h={180}>
        <div style={{position: "absolute", left: 36, top: 0, width: 110, height: 180, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: F, fontSize: 64, fontWeight: 900, color: BLUE}}>2</div>
        <div style={{position: "absolute", left: 160, top: 24, width: 1420, fontFamily: F, fontSize: 42, fontWeight: 900, color: INK, whiteSpace: "nowrap"}}>知网自查</div>
        <div style={{position: "absolute", left: 160, top: 92, width: 1420, fontFamily: F, fontSize: 35, fontWeight: 800, color: INK, whiteSpace: "nowrap"}}>
          近三年找不到 <span style={{color: BLUE}}>3 篇</span>可参考的技术路线 = 别碰
        </div>
        <div style={{position: "absolute", left: 1400, top: 40}}><BooksIcon x={0} y={0} s={0.6} /></div>
        <div style={{position: "absolute", right: 40, top: 58}}><CheckBox x={0} y={0} born={at(16, 0.85)} /></div>
      </FlatCard>
    </PopAt>

    <PopAt f={SENT[17] + 4}>
      <FlatCard x={130} y={610} w={1660} h={220}>
        <div style={{position: "absolute", left: 36, top: 0, width: 110, height: 220, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: F, fontSize: 64, fontWeight: 900, color: GREEN}}>3</div>
        <div style={{position: "absolute", left: 160, top: 20, width: 1420, fontFamily: F, fontSize: 42, fontWeight: 900, color: INK, whiteSpace: "nowrap"}}>落地检查</div>
        <div style={{position: "absolute", left: 160, top: 88, width: 1420, fontFamily: F, fontSize: 35, fontWeight: 800, color: INK, whiteSpace: "nowrap"}}>
          数据集 <span style={{color: GREEN}}>拿得到</span> · 环境 <span style={{color: GREEN}}>跑得通</span>，缺一个 = 别选
        </div>
        <div style={{position: "absolute", left: 160, top: 148, width: 1420, fontFamily: F, fontSize: 35, fontWeight: 800, color: INK, whiteSpace: "nowrap"}}>
          核心功能至少 <span style={{color: ORANGE}}>3 个</span>能演示
        </div>
        <div style={{position: "absolute", right: 40, top: 78}}><CheckBox x={0} y={0} born={at(18, 0.6)} /></div>
      </FlatCard>
    </PopAt>

    <PopAt f={SENT[19] + 2}>
      <div style={{position: "absolute", left: 260, top: 866, width: 1400, height: 88, backgroundColor: ORANGE, borderRadius: 999, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 10px 24px rgba(240,145,45,0.35)"}}>
        <span style={{fontFamily: F, fontSize: 40, fontWeight: 900, color: "#fff", whiteSpace: "nowrap"}}>交付物三样：系统 ＋ 实验结果 ＋ 论文内容</span>
      </div>
    </PopAt>
    <Sparkle x={1820} y={180} s={0.7} phase={2} />
    <Sparkle x={110} y={640} s={0.6} color="#f2d9a8" phase={0} />
  </AbsoluteFill>
);

// ============ P8 金句（停用底部字幕） ============
const PageQuote: React.FC = () => {
  const frame = useCurrentFrame();
  const breathe = 1 + Math.sin(frame / 16) * 0.008;
  return (
    <AbsoluteFill>
      <PopAt f={SENT[20] + 2}>
        <div style={{position: "absolute", left: 0, top: 220, width: W, textAlign: "center"}}>
          <span style={{fontFamily: F, fontSize: 40, fontWeight: 900, color: SUBC, backgroundColor: "#eef2f6", borderRadius: 999, padding: "10px 34px"}}>记住</span>
        </div>
      </PopAt>
      <div style={{position: "absolute", left: 210, top: 360, width: 1500, height: 300, backgroundColor: "rgba(247,201,72,0.25)", border: `5px solid ${YEL}`, borderRadius: 30, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 28, transform: `rotate(-1.5deg) scale(${breathe})`}}>
        <div style={{fontFamily: F, fontWeight: 900, fontSize: 80, color: INK, letterSpacing: 8, whiteSpace: "nowrap"}}>
          <span style={{color: ORANGE}}>选题定方向</span>，制作看落地
        </div>
      </div>
      <PopAt f={SENT[21] + 2}>
        <div style={{position: "absolute", left: 0, top: 730, width: W, textAlign: "center"}}>
          <span style={{fontFamily: F, fontSize: 44, fontWeight: 900, color: INK, backgroundColor: "#fff", border: `3px solid ${BORDER}`, borderRadius: 999, padding: "12px 40px", whiteSpace: "nowrap"}}>
            选题选对了，<span style={{color: GREEN}}>后面每一步才顺</span>
          </span>
        </div>
      </PopAt>
      <Sparkle x={330} y={400} s={0.9} phase={0} />
      <Sparkle x={1580} y={470} s={0.7} color="#b8d4f2" phase={1} />
      <Sparkle x={1460} y={720} s={0.6} phase={2} />
    </AbsoluteFill>
  );
};

// ============ P9 结尾 A/B 提问卡（截图卡，保持干净） ============
const PageAsk: React.FC = () => (
  <AbsoluteFill>
    <div style={{
      position: "absolute", top: 120, left: 260, right: 260,
      backgroundColor: "#ffffff", borderRadius: 24, padding: "44px 56px 38px",
      boxShadow: "0 18px 50px rgba(10,20,30,0.18)",
    }}>
      <div style={{display: "flex", alignItems: "center", justifyContent: "center", gap: 18, marginBottom: 34}}>
        <div style={{width: 56, height: 56, borderRadius: 14, backgroundColor: ORANGE, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 36, fontWeight: 900}}>?</div>
        <div style={{fontFamily: F, fontSize: 52, fontWeight: 900, color: INK, whiteSpace: "nowrap"}}>选毕设，你现在——</div>
      </div>
      <div style={{display: "flex", gap: 28, justifyContent: "center"}}>
        <div style={{width: 640, height: 220, borderRadius: 20, backgroundColor: BLUE_BG, border: `4px solid ${BLUE}`, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12}}>
          <div style={{fontFamily: F, fontSize: 34, fontWeight: 900, color: BLUE}}>A</div>
          <div style={{fontFamily: F, fontSize: 40, fontWeight: 900, color: INK, whiteSpace: "nowrap"}}>完全没想好题目</div>
        </div>
        <div style={{width: 640, height: 220, borderRadius: 20, backgroundColor: ORANGE_BG, border: `4px solid ${ORANGE}`, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12}}>
          <div style={{fontFamily: F, fontSize: 34, fontWeight: 900, color: ORANGE}}>B</div>
          <div style={{fontFamily: F, fontSize: 36, fontWeight: 900, color: INK, whiteSpace: "nowrap"}}>选了，但不知道能不能做出来</div>
        </div>
      </div>
      <div style={{textAlign: "center", marginTop: 28, fontFamily: F, fontSize: 32, fontWeight: 800, color: SUBC, whiteSpace: "nowrap"}}>
        评论区扣 A 或 B
      </div>
    </div>
    <div style={{position: "absolute", top: 840, left: 0, width: W, textAlign: "center"}}>
      <span style={{fontFamily: F, fontSize: 30, fontWeight: 800, color: SUBC}}>全栈小秋 · 毕设通关系列 01</span>
    </div>
    <Sparkle x={240} y={130} s={0.8} phase={0} />
    <Sparkle x={1690} y={160} s={0.6} color="#f2d9a8" phase={1} />
  </AbsoluteFill>
);

// ============ 页面编排 ============
const PAGES: {C: React.FC; from: number; dur: number}[] = [
  {C: PageHook, from: SENT[0], dur: SENT[1] - SENT[0]},
  {C: PageVs, from: SENT[1], dur: SENT[5] - SENT[1]},
  {C: PageDebt, from: SENT[5], dur: SENT[7] - SENT[5]},
  {C: PageDiff, from: SENT[7], dur: SENT[9] - SENT[7]},
  {C: PageAi, from: SENT[9], dur: SENT[10] - SENT[9]},
  {C: PageEmpty, from: SENT[10], dur: SENT[14] - SENT[10]},
  {C: PageHow, from: SENT[14], dur: SENT[20] - SENT[14]},
  {C: PageQuote, from: SENT[20], dur: SENT[22] - SENT[20]},
  {C: PageAsk, from: SENT[22], dur: DUR - SENT[22]},
];

const SFX: {f: number; w: string; v: number}[] = [
  ...[1, 5, 7, 9, 10, 14, 20, 22].map((i) => ({f: SENT[i], w: "whoosh.wav", v: 0.2})),
  {f: at(0, 0.55) - 6, w: "error.wav", v: 0.24},
  {f: SENT[2] + 4, w: "pop.wav", v: 0.24},
  {f: SENT[3] + 4, w: "pop.wav", v: 0.24},
  {f: SENT[4] + 4, w: "success.wav", v: 0.22},
  {f: at(8, 0.4) - 4, w: "error.wav", v: 0.24},
  {f: at(8, 0.9), w: "success.wav", v: 0.24},
  {f: at(9, 0.33) - 4, w: "error.wav", v: 0.24},
  {f: at(9, 0.5) - 2, w: "alert.wav", v: 0.22},
  {f: at(11, 0.3), w: "success.wav", v: 0.22},
  {f: at(12, 0.1), w: "pop.wav", v: 0.24},
  {f: at(12, 0.55), w: "pop.wav", v: 0.24},
  {f: SENT[13] + 2, w: "success.wav", v: 0.22},
  {f: SENT[15] + 4, w: "pop.wav", v: 0.26},
  {f: SENT[16] + 4, w: "pop.wav", v: 0.26},
  {f: SENT[17] + 4, w: "pop.wav", v: 0.26},
  {f: at(18, 0.1), w: "pop.wav", v: 0.24},
  {f: SENT[19] + 2, w: "ding.wav", v: 0.26},
  {f: at(20, 0.5) - 4, w: "ding.wav", v: 0.28},
  {f: SENT[22] + 4, w: "pop.wav", v: 0.28},
  {f: SENT[24] + 4, w: "pop.wav", v: 0.26},
];

// 铁律⑫：金句段 [SENT[20], SENT[22]) 组件级停用字幕；字幕放大版（52px，手机可读）
const Subtitles: React.FC = () => {
  const frame = useCurrentFrame();
  if (frame >= SENT[20] && frame < SENT[22]) return null;
  let cur = "";
  for (const s of SUBS) {
    if (frame >= s.f) cur = s.t;
  }
  if (!cur) return null;
  return (
    <div style={{position: "absolute", bottom: 24, left: 0, right: 0, display: "flex", justifyContent: "center"}}>
      <div style={{
        fontFamily: F, fontSize: 52, fontWeight: 900, color: "#f2f5f8",
        background: "rgba(20,32,44,0.82)", borderRadius: 12, padding: "12px 34px", whiteSpace: "nowrap",
      }}>{cur}</div>
    </div>
  );
};

export const BiSheTopicFlat: React.FC = () => {
  const frame = useCurrentFrame();
  const bed = interpolate(frame, [0, 20, DUR - 130, DUR - 100, DUR - 26, DUR - 1], [0, 0.06, 0.06, 0.1, 0.17, 0], clamp);
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
        <Sequence key={`v-${i}`} from={start} durationInFrames={i < SENT.length - 1 ? SENT[i + 1] - start + 10 : DUR - start}>
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
