import React from "react";
import {Audio} from "@remotion/media";
import {
  AbsoluteFill, interpolate, Sequence, staticFile, useCurrentFrame,
} from "remotion";

// ============ 扁平可爱插画科普风 · 断点续传 Range（batch10 §10，全栈小秋 IP） ============
// 结构：钩子(下载99%断网) → Range字段 → 字节书页分段 → 断点+Range请求飞向服务器
//       → 服务器只发尾巴 → 可续传徽章 vs 不支持 → 网盘从零开始(热经验) → 金句 → 截图卡
// 语义色：已下载/请求 = 蓝 #4a86d8 / 成功响应 = 绿 #3fae7a / Range断点高亮 = 橙 #f0912d / 断 = 红
// 转场：铁律① 纯硬切（kit HardPage，页边界 = SENT 真实句起始帧）；标题/主视觉 STATIC，小元素 PopAt 挂词锚。

import {HardPage, PopAt, BrandCorner, SubtitleBar, EndingCard, wordAt} from "./batch10/kit";
import {DUR, SENT, SUBS, WORDS} from "./batch10/rangeresumeData";



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
const PAPER = "#f7f5f0";
const F = "'Microsoft YaHei', sans-serif";
const MONO = "Consolas, 'Courier New', monospace";
const W = 1920;

const clamp = {extrapolateLeft: "clamp", extrapolateRight: "clamp"} as const;

const BgDots: React.FC = () => (
  <svg width={W} height={1080} style={{position: "absolute", left: 0, top: 0, pointerEvents: "none"}}>
    <defs>
      <pattern id="rr-dots" width="46" height="46" patternUnits="userSpaceOnUse">
        <circle cx="23" cy="23" r="2.6" fill="#dbe4ee" />
      </pattern>
    </defs>
    <rect width={W} height={1080} fill="url(#rr-dots)" opacity={0.5} />
    <circle cx={160} cy={130} r={190} fill={BLUE_BG} opacity={0.45} />
    <circle cx={W - 150} cy={970} r={210} fill={GREEN_BG} opacity={0.4} />
  </svg>
);

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

const Sparkle: React.FC<{x: number; y: number; s?: number; color?: string}> = ({x, y, s = 1, color = YEL}) => (
  <svg width={54 * s} height={54 * s} style={{position: "absolute", left: x, top: y, overflow: "visible"}}>
    <path d="M 27 2 L 32 22 L 52 27 L 32 32 L 27 52 L 22 32 L 2 27 L 22 22 Z" fill={color} />
  </svg>
);

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

// 页面级描画箭头（画布坐标，禁放 flex 容器内）
const FlatArrow: React.FC<{
  x1: number; y1: number; x2: number; y2: number; color?: string; dashed?: boolean; sw?: number;
}> = ({x1, y1, x2, y2, color = SUBC, dashed, sw = 6}) => {
  const dx = x2 - x1, dy = y2 - y1;
  const len = Math.hypot(dx, dy);
  const ux = dx / len, uy = dy / len;
  const px = -uy, py = ux;
  const head = 20;
  return (
    <svg width={W} height={1080} style={{position: "absolute", left: 0, top: 0, overflow: "visible", pointerEvents: "none"}}>
      <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={color}
        strokeWidth={sw} strokeLinecap="round" strokeDasharray={dashed ? "14 12" : undefined} />
      <path d={`M ${x2 - ux * head + px * head * 0.55} ${y2 - uy * head + py * head * 0.55} L ${x2} ${y2} L ${x2 - ux * head - px * head * 0.55} ${y2 - uy * head - py * head * 0.55}`}
        fill="none" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
};

const MarkOk: React.FC<{x: number; y: number; s?: number; c?: string}> = ({x, y, s = 1, c = GREEN}) => (
  <svg width={60 * s} height={60 * s} viewBox="0 0 60 60"
    style={{position: "absolute", left: x - 30 * s, top: y - 30 * s, overflow: "visible"}}>
    <circle cx={30} cy={30} r={28} fill={c} />
    <path d="M17 31 L26 40 L43 21" fill="none" stroke="#fff" strokeWidth={7} strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const MarkBad: React.FC<{x: number; y: number; s?: number; c?: string}> = ({x, y, s = 1, c = "#98a6b5"}) => (
  <svg width={60 * s} height={60 * s} viewBox="0 0 60 60"
    style={{position: "absolute", left: x - 30 * s, top: y - 30 * s, overflow: "visible"}}>
    <circle cx={30} cy={30} r={28} fill={c} />
    <path d="M20 20 L40 40 M40 20 L20 40" stroke="#fff" strokeWidth={7} strokeLinecap="round" />
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

// 游戏手柄（下载主体具象）
const GameIcon: React.FC<{x: number; y: number; s?: number}> = ({x, y, s = 1}) => (
  <svg width={140 * s} height={100 * s} viewBox="0 0 140 100"
    style={{position: "absolute", left: x - 70 * s, top: y - 50 * s, overflow: "visible"}}>
    <rect x={14} y={18} width={112} height={64} rx={30} fill={DARK} />
    <path d="M46 38 v24 M34 50 h24" stroke="#fff" strokeWidth={8} strokeLinecap="round" />
    <circle cx={96} cy={44} r={7} fill={YEL} />
    <circle cx={110} cy={58} r={7} fill={ORANGE} />
  </svg>
);

// WiFi 断开图标（红）
const WifiOff: React.FC<{x: number; y: number; s?: number}> = ({x, y, s = 1}) => (
  <svg width={80 * s} height={80 * s} viewBox="0 0 80 80"
    style={{position: "absolute", left: x - 40 * s, top: y - 40 * s, overflow: "visible"}}>
    <path d="M14 34 Q40 12 66 34" fill="none" stroke={RED} strokeWidth={7} strokeLinecap="round" />
    <path d="M24 46 Q40 32 56 46" fill="none" stroke={RED} strokeWidth={7} strokeLinecap="round" />
    <circle cx={40} cy={60} r={5} fill={RED} />
    <line x1={16} y1={16} x2={64} y2={66} stroke={RED} strokeWidth={8} strokeLinecap="round" />
  </svg>
);

// 云（网盘）
const CloudIcon: React.FC<{x: number; y: number; s?: number; c?: string}> = ({x, y, s = 1, c = "#5b6b7d"}) => (
  <svg width={150 * s} height={110 * s} viewBox="0 0 150 110"
    style={{position: "absolute", left: x - 75 * s, top: y - 55 * s, overflow: "visible"}}>
    <path d="M40 92 Q14 92 14 70 Q14 50 36 48 Q40 24 66 24 Q90 24 96 44 Q120 40 128 60 Q140 64 138 78 Q134 92 114 92 Z" fill={c} />
    <path d="M75 50 v26 M62 66 l13 13 13 -13" fill="none" stroke="#fff" strokeWidth={7} strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

// 进度条（fillPct 0~100，尾部可选 Range 高亮段）
const ProgressBar: React.FC<{
  x: number; y: number; w: number; h: number; pct: number;
  color?: string; tailPct?: number; tailColor?: string;
}> = ({x, y, w, h, pct, color = BLUE, tailPct, tailColor = ORANGE}) => (
  <div style={{
    position: "absolute", left: x, top: y, width: w, height: h,
    backgroundColor: "#eef2f6", border: `2px solid ${BORDER}`, borderRadius: h / 2, overflow: "hidden",
  }}>
    <div style={{position: "absolute", left: 0, top: 0, height: h, width: `${pct}%`, backgroundColor: color}} />
    {tailPct ? (
      <div style={{position: "absolute", left: `${pct}%`, top: 0, height: h, width: `${tailPct}%`, backgroundColor: tailColor}} />
    ) : null}
  </div>
);

// 一次性飞行块（Range 高亮段从断点飞向服务器）
const FlyChip: React.FC<{
  x1: number; y1: number; x2: number; y2: number; t0: number; dur?: number;
  text: string; color?: string; w?: number; h?: number; fs?: number;
}> = ({x1, y1, x2, y2, t0, dur = 26, text, color = ORANGE, w = 170, h = 54, fs = 24}) => {
  const f = useCurrentFrame();
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
        fontFamily: MONO, fontWeight: 900, fontSize: fs, color: "#fff", whiteSpace: "nowrap",
      }}>{text}</div>
    </div>
  );
};

// 循环飞行包（响应流：绿）
const LoopPacket: React.FC<{
  x1: number; y1: number; x2: number; y2: number;
  color?: string; start?: number; period?: number; dur?: number; lift?: number; size?: number;
}> = ({x1, y1, x2, y2, color = GREEN, start = 0, period = 60, dur = 40, lift = 20, size = 40}) => {
  const f = useCurrentFrame();
  if (f < start) return null;
  const t = (((f - start) % period) + period) % period / dur;
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

// ============ 页面（frame 全局绝对帧） ============

// P1 钩子：下载到99%断网（第 0 帧完整封面，全 STATIC）
const PageHook: React.FC = () => (
  <AbsoluteFill>
    <BigTitle parts={[{t: "下载到 ", c: INK}, {t: "99%", c: RED}, {t: " 断网了，会怎样？", c: INK}]} />
    <Sparkle x={320} y={110} s={0.8} />
    <Sparkle x={1580} y={90} s={0.65} color="#b8d4f2" />

    {/* 主视觉：下载管理器（99% 卡住） */}
    <FlatCard x={560} y={290} w={800} h={400} chip="下载管理器" chipColor={BLUE}>
      <GameIcon x={400} y={110} s={1.4} />
      <div style={{
        position: "absolute", left: 0, top: 190, width: 800, textAlign: "center",
        fontFamily: F, fontWeight: 900, fontSize: 36, color: INK, whiteSpace: "nowrap",
      }}>某 3A 大作 · 8.6 GB</div>
      <ProgressBar x={80} y={250} w={640} h={34} pct={99} />
      <div style={{
        position: "absolute", left: 0, top: 300, width: 800, textAlign: "center",
        fontFamily: MONO, fontWeight: 900, fontSize: 44, color: BLUE, whiteSpace: "nowrap",
      }}>99%</div>
    </FlatCard>
    <Label x={560} y={714} w={800} text="就差最后 1% 的尾巴" color={SUBC} />

    {/* 断网 + 重连（封面即完整，全 STATIC） */}
    <div style={{position: "absolute", left: 1420, top: 330, width: 180, height: 180}}>
      <WifiOff x={90} y={90} s={1.7} />
    </div>
    <div style={{
      position: "absolute", left: 1390, top: 540, width: 260, height: 70,
      backgroundColor: RED_BG, border: `3px solid ${RED}`, borderRadius: 999,
      display: "flex", alignItems: "center", justifyContent: "center",
    }}>
      <div style={{fontFamily: F, fontWeight: 900, fontSize: 30, color: RED, whiteSpace: "nowrap"}}>啪，断网</div>
    </div>
    <div style={{
      position: "absolute", left: 170, top: 430, width: 320, height: 90,
      backgroundColor: GREEN_BG, border: `4px solid ${GREEN}`, borderRadius: 22,
      display: "flex", alignItems: "center", justifyContent: "center",
    }}>
      <div style={{fontFamily: F, fontWeight: 900, fontSize: 32, color: GREEN, whiteSpace: "nowrap"}}>重连后：从 99% 走</div>
    </div>
    <FlatArrow x1={500} y1={475} x2={560} y2={475} color={GREEN} sw={6} />

    {/* 疑问胶囊 */}
    <div style={{
      position: "absolute", left: 610, top: 830, width: 700, height: 76,
      backgroundColor: "rgba(247,201,72,0.22)", border: `3px dashed ${YEL}`, borderRadius: 999,
      display: "flex", alignItems: "center", justifyContent: "center",
    }}>
      <div style={{fontFamily: F, fontWeight: 900, fontSize: 34, color: INK, whiteSpace: "nowrap"}}>
        进度是怎么被记住的？
      </div>
    </div>
  </AbsoluteFill>
);

// P2 答案：HTTP 的 Range 字段
const PageRange: React.FC = () => (
  <AbsoluteFill>
    <BigTitle parts={[{t: "答案：HTTP 的 ", c: INK}, {t: "Range", c: ORANGE}, {t: " 字段", c: INK}]} />
    <Sparkle x={1470} y={120} s={0.7} />

    <FlatCard x={410} y={300} w={1100} h={380} chip="HTTP 请求头" chipColor={DARK}>
      <div style={{
        position: "absolute", left: 70, top: 70, width: 960,
        fontFamily: MONO, fontWeight: 700, fontSize: 40, color: SUBC, whiteSpace: "pre",
      }}>{"GET /game.zip HTTP/1.1"}</div>
      <PopAt f={wordAt(WORDS, 1, "Range") - 4}>
        <div style={{
          position: "absolute", left: 70, top: 160, width: 960, height: 78,
          backgroundColor: ORANGE_BG, border: `3px solid ${ORANGE}`, borderRadius: 14,
          display: "flex", alignItems: "center", paddingLeft: 30,
        }}>
          <div style={{fontFamily: MONO, fontWeight: 900, fontSize: 40, color: INK, whiteSpace: "pre"}}>
            <span style={{color: ORANGE}}>Range</span>{": bytes=990000-"}
          </div>
        </div>
      </PopAt>
      {/* 字节条：99% 蓝 + 尾段橙；橙标注移到条下方空白区（离端帽 ≥40px，不压条） */}
      <div style={{position: "absolute", left: 70, top: 264, width: 960, height: 116}}>
        <ProgressBar x={0} y={0} w={960} h={34} pct={99} tailPct={1} />
        <div style={{
          position: "absolute", left: 0, top: 80, width: 960, textAlign: "center",
          fontFamily: F, fontWeight: 900, fontSize: 24, color: ORANGE, whiteSpace: "nowrap",
        }}>这一回只取这段</div>
      </div>
    </FlatCard>
    <Label x={410} y={704} w={1100} text="带上 Range 字段，就只要剩下那一段" color={ORANGE} />

    <PopAt f={wordAt(WORDS, 1, "只") - 4}>
      <div style={{
        position: "absolute", left: 560, top: 790, width: 800, height: 76,
        backgroundColor: ORANGE_BG, borderRadius: 999, display: "flex",
        alignItems: "center", justifyContent: "center",
      }}>
        <div style={{fontFamily: F, fontWeight: 900, fontSize: 36, color: ORANGE, whiteSpace: "nowrap"}}>
          不从头下，续上就行
        </div>
      </div>
    </PopAt>
    <Sparkle x={480} y={300} s={0.65} color="#f2d9a8" />
  </AbsoluteFill>
);

// P3 大文件 = 编号字节书
const PageBytes: React.FC = () => (
  <AbsoluteFill>
    <BigTitle parts={[{t: "大文件 ＝ 一串", c: INK}, {t: "编号的字节", c: BLUE}]} />
    <Sparkle x={330} y={120} s={0.75} color="#b8d4f2" />

    <FlatCard x={410} y={290} w={1100} h={430} chip="服务器上的文件" chipColor={DARK}>
      {[
        {y: 60, label: "字节 0 ~ 1,000,000", d: wordAt(WORDS, 2, "一百万") - 4},
        {y: 170, label: "字节 1,000,000 ~ 2,000,000", d: wordAt(WORDS, 2, "两百万") - 4},
        {y: 280, label: "字节 2,000,000 ~ 3,000,000", d: wordAt(WORDS, 2, "书页") - 6},
      ].map((r, i) => (
        <div key={i} style={{
          position: "absolute", left: 70, top: r.y, width: 830, height: 88,
          backgroundColor: PAPER, border: `3px solid ${BORDER}`, borderRadius: 14,
          display: "flex", alignItems: "center", paddingLeft: 30, gap: 20,
        }}>
          <svg width={40} height={52} viewBox="0 0 40 52" style={{flexShrink: 0}}>
            <rect x={2} y={2} width={36} height={48} rx={6} fill="#fff" stroke={BLUE} strokeWidth={3} />
            <line x1={9} y1={14} x2={31} y2={14} stroke={BLUE} strokeWidth={3} strokeLinecap="round" />
            <line x1={9} y1={24} x2={31} y2={24} stroke={BLUE} strokeWidth={3} strokeLinecap="round" />
            <line x1={9} y1={34} x2={24} y2={34} stroke={BLUE} strokeWidth={3} strokeLinecap="round" />
          </svg>
          <PopAt f={r.d}>
            <div style={{fontFamily: MONO, fontWeight: 900, fontSize: 30, color: INK, whiteSpace: "nowrap"}}>
              {r.label}
            </div>
          </PopAt>
        </div>
      ))}
      <div style={{position: "absolute", left: 950, top: 70, width: 110, height: 300}}>
        <PopAt f={wordAt(WORDS, 2, "书页") - 6}>
          <svg width={110} height={300} viewBox="0 0 110 300" style={{overflow: "visible"}}>
            <path d="M55 20 Q95 0 105 24 L105 270 Q95 246 55 266 Z" fill={BLUE} opacity={0.85} />
            <path d="M55 20 Q15 0 5 24 L5 270 Q15 246 55 266 Z" fill={BLUE} />
            <line x1={55} y1={20} x2={55} y2={266} stroke="#fff" strokeWidth={4} />
          </svg>
        </PopAt>
      </div>
    </FlatCard>
    <Label x={410} y={744} w={1100} text="每一段都有编号，想取哪段取哪段" color={BLUE} />

    <PopAt f={wordAt(WORDS, 2, "书页") - 6}>
      <div style={{
        position: "absolute", left: 460, top: 820, width: 1000, height: 74,
        backgroundColor: BLUE_BG, borderRadius: 999, display: "flex",
        alignItems: "center", justifyContent: "center",
      }}>
        <div style={{fontFamily: F, fontWeight: 900, fontSize: 36, color: BLUE, whiteSpace: "nowrap"}}>
          像一本书，能直接翻到任何一页
        </div>
      </div>
    </PopAt>
    <Sparkle x={1560} y={300} s={0.6} color="#b8d4f2" />
  </AbsoluteFill>
);

// P4 断点 + Range 请求（高亮段从断点飞向服务器）
const PageRequest: React.FC = () => (
  <AbsoluteFill>
    <BigTitle parts={[{t: "断在哪，就从哪", c: INK}, {t: "接着要", c: ORANGE}]} />

    {/* 左：下载器（记着断点） */}
    <FlatCard x={190} y={310} w={420} h={360} chip="下载器" chipColor={BLUE}>
      <ProgressBar x={50} y={110} w={320} h={30} pct={99} />
      <div style={{
        position: "absolute", left: 0, top: 170, width: 420, textAlign: "center",
        fontFamily: MONO, fontWeight: 900, fontSize: 34, color: BLUE, whiteSpace: "nowrap",
      }}>99%</div>
      <div style={{
        position: "absolute", left: 60, top: 240, width: 300, textAlign: "center",
        fontFamily: F, fontWeight: 700, fontSize: 26, color: SUBC, whiteSpace: "nowrap",
      }}>记下断点位置</div>
    </FlatCard>

    {/* 右：服务器 */}
    <FlatCard x={1310} y={310} w={420} h={360} chip="服务器" chipColor={DARK}>
      <ServerIcon x={210} y={170} s={1.7} />
    </FlatCard>
    <PopAt f={wordAt(WORDS, 3, "请求") + 26}>
      <div style={{position: "absolute", left: 1500, top: 320, width: 70, height: 70}}>
        <MarkOk x={35} y={35} s={1.05} />
      </div>
    </PopAt>

    {/* 中：字节条 + 断点旗 */}
    <div style={{position: "absolute", left: 650, top: 380, width: 620, height: 90}}>
      <ProgressBar x={0} y={40} w={620} h={36} pct={99} />
      <PopAt f={wordAt(WORDS, 3, "断线") - 4}>
        <svg width={44} height={60} viewBox="0 0 44 60" style={{position: "absolute", left: 590, top: -8, overflow: "visible"}}>
          <line x1={22} y1={12} x2={22} y2={60} stroke={RED} strokeWidth={5} />
          <path d="M22 2 L40 12 L22 22 Z" fill={RED} />
        </svg>
      </PopAt>
      <PopAt f={wordAt(WORDS, 3, "记") - 4}>
        <div style={{
          position: "absolute", left: -20, top: 90, width: 660, textAlign: "center",
          fontFamily: MONO, fontWeight: 900, fontSize: 26, color: RED, whiteSpace: "nowrap",
        }}>断点：第 990000 字节</div>
      </PopAt>
    </div>

    {/* 请求卡：Range 请求（Range=橙 语义色，与 P2 统一）+ 高亮段飞向服务器 */}
    <PopAt f={wordAt(WORDS, 3, "请求") - 2}>
      <div style={{
        position: "absolute", left: 660, top: 560, width: 600, height: 76,
        backgroundColor: ORANGE_BG, border: `3px solid ${ORANGE}`, borderRadius: 16,
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <div style={{fontFamily: MONO, fontWeight: 900, fontSize: 30, color: INK, whiteSpace: "nowrap"}}>
          <span style={{color: ORANGE}}>Range</span>{": bytes=990000-"}
        </div>
      </div>
    </PopAt>
    <FlyChip x1={960} y1={430} x2={1500} y2={420} t0={wordAt(WORDS, 3, "请求")} dur={26}
      text="990000 ~ 尾巴" color={ORANGE} w={210} h={54} fs={22} />

    {/* 请求气泡（压轴，提前 4 帧，停留 ≥50 帧） */}
    <PopAt f={wordAt(WORDS, 3, "写") - 4}>
      <div style={{
        position: "absolute", left: 560, top: 770, width: 800, height: 78,
        backgroundColor: BLUE, borderRadius: 999, display: "flex",
        alignItems: "center", justifyContent: "center",
        boxShadow: "0 14px 30px rgba(74,134,216,0.35)",
      }}>
        <div style={{fontFamily: F, fontWeight: 900, fontSize: 38, color: "#fff", whiteSpace: "nowrap"}}>
          这个字节往后的，都要
        </div>
      </div>
    </PopAt>
    <Sparkle x={600} y={340} s={0.7} color="#b8d4f2" />
  </AbsoluteFill>
);

// P5 服务器照办，只发尾巴
const PageTail: React.FC = () => (
  <AbsoluteFill>
    <BigTitle parts={[{t: "服务器照办：只发", c: INK}, {t: "剩下的尾巴", c: GREEN}]} />

    <FlatCard x={190} y={310} w={420} h={360} chip="下载器" chipColor={BLUE}>
      <ProgressBar x={50} y={110} w={320} h={30} pct={99} tailPct={1} tailColor={GREEN} />
      <div style={{
        position: "absolute", left: 0, top: 170, width: 420, textAlign: "center",
        fontFamily: MONO, fontWeight: 900, fontSize: 34, color: GREEN, whiteSpace: "nowrap",
      }}>99% → 100%</div>
      <div style={{
        position: "absolute", left: 60, top: 240, width: 300, textAlign: "center",
        fontFamily: F, fontWeight: 700, fontSize: 26, color: SUBC, whiteSpace: "nowrap",
      }}>尾巴一到就合体</div>
    </FlatCard>

    <FlatCard x={1310} y={310} w={420} h={360} chip="服务器" chipColor={DARK}>
      <ServerIcon x={210} y={160} s={1.6} />
      <PopAt f={wordAt(WORDS, 4, "照办") - 4}>
        <div style={{
          position: "absolute", left: 110, top: 240, width: 200, height: 60,
          backgroundColor: GREEN, borderRadius: 999, display: "flex",
          alignItems: "center", justifyContent: "center",
        }}>
          <div style={{fontFamily: F, fontWeight: 900, fontSize: 28, color: "#fff", whiteSpace: "nowrap"}}>照办</div>
        </div>
      </PopAt>
    </FlatCard>

    {/* 绿色响应包循环飞行 */}
    <LoopPacket x1={1300} y1={480} x2={620} y2={480} color={GREEN} start={wordAt(WORDS, 4, "照办")} period={54} dur={38} lift={24} size={44} />
    <Label x={820} y={540} w={280} text="响应：剩下的 1%" color={GREEN} size={28} />

    <PopAt f={wordAt(WORDS, 4, "原封不动") - 4}>
      <div style={{
        position: "absolute", left: 460, top: 770, width: 1000, height: 78,
        backgroundColor: GREEN_BG, borderRadius: 999, display: "flex",
        alignItems: "center", justifyContent: "center",
      }}>
        <div style={{fontFamily: F, fontWeight: 900, fontSize: 36, color: GREEN, whiteSpace: "nowrap"}}>
          前面 99% 一字节都没动，接着用
        </div>
      </div>
    </PopAt>
    <Sparkle x={700} y={330} s={0.7} color="#bfe3cc" />
    <Sparkle x={1420} y={700} s={0.6} />
  </AbsoluteFill>
);

// P6 前提：可续传标记（绿徽章） vs 不支持（灰叉）
const PageSupport: React.FC = () => (
  <AbsoluteFill>
    <BigTitle parts={[{t: "前提：服务器得", c: INK}, {t: "支持续传", c: GREEN}]} />

    {/* 左：支持（Accept-Ranges: bytes 绿徽章） */}
    <FlatCard x={210} y={300} w={700} h={440} chip="支持" chipColor={GREEN}>
      <PopAt f={wordAt(WORDS, 5, "响应") - 2}>
        <div style={{
          position: "absolute", left: 70, top: 80, width: 560, height: 80,
          backgroundColor: GREEN, borderRadius: 16, display: "flex",
          alignItems: "center", justifyContent: "center",
          boxShadow: "0 12px 26px rgba(63,174,122,0.35)",
        }}>
          <div style={{fontFamily: MONO, fontWeight: 900, fontSize: 34, color: "#fff", whiteSpace: "nowrap"}}>
            Accept-Ranges: bytes
          </div>
        </div>
      </PopAt>
      <PopAt f={wordAt(WORDS, 5, "可") - 4}>
        <div style={{position: "absolute", left: 300, top: 200, width: 100, height: 100}}>
          <MarkOk x={50} y={50} s={1.6} />
        </div>
      </PopAt>
      <div style={{
        position: "absolute", left: 0, top: 330, width: 700, textAlign: "center",
        fontFamily: F, fontWeight: 900, fontSize: 34, color: GREEN, whiteSpace: "nowrap",
      }}>断过也能接着走</div>
    </FlatCard>

    {/* 右：不支持（从头再来循环条） */}
    <FlatCard x={1010} y={300} w={700} h={440} chip="不支持" chipColor="#98a6b5">
      <div style={{position: "absolute", left: 290, top: 70, width: 120, height: 120}}>
        <MarkBad x={60} y={60} s={1.7} />
      </div>
      <RestartBar x={70} y={220} w={560} />
      <PopAt f={wordAt(WORDS, 5, "不") - 4}>
        <div style={{
          position: "absolute", left: 150, top: 320, width: 400, height: 70,
          backgroundColor: RED_BG, borderRadius: 999, display: "flex",
          alignItems: "center", justifyContent: "center",
        }}>
          <div style={{fontFamily: F, fontWeight: 900, fontSize: 32, color: RED, whiteSpace: "nowrap"}}>
            从头再来，白下 99%
          </div>
        </div>
      </PopAt>
    </FlatCard>

    <Label x={210} y={770} w={700} text="响应里带着「可续传」标记" color={GREEN} />
    <Label x={1010} y={770} w={700} text="老服务器：推倒重来" color={SUBC} />
    <Sparkle x={950} y={330} s={0.7} />
  </AbsoluteFill>
);

// 从头下载循环条（涨到 40% 又清零）
const RestartBar: React.FC<{x: number; y: number; w: number}> = ({x, y, w}) => {
  const f = useCurrentFrame();
  const t = ((f - SENT[5]) % 80) / 80;
  const pct = t < 0.5 ? t * 80 : 0;
  return (
    <div style={{position: "absolute", left: x, top: y, width: w}}>
      <ProgressBar x={0} y={0} w={w} h={30} pct={pct} color="#98a6b5" />
      <div style={{
        position: "absolute", left: 0, top: 44, width: w, textAlign: "center",
        fontFamily: MONO, fontWeight: 900, fontSize: 26, color: SUBC, whiteSpace: "nowrap",
      }}>{`每次断线：${Math.round(pct)}% → 0%`}</div>
    </div>
  );
};

// P7 热经验：网盘每次断线都从零开始
const PageNetdisk: React.FC = () => (
  <AbsoluteFill>
    <BigTitle parts={[{t: "网盘下载为什么", c: INK}, {t: "总从零开始？", c: RED}]} />

    <FlatCard x={560} y={300} w={800} h={380} chip="某网盘下载" chipColor={DARK}>
      <CloudIcon x={400} y={110} s={1.5} />
      <div style={{position: "absolute", left: 90, top: 200, width: 620}}>
        <RestartBar x={0} y={0} w={620} />
      </div>
      <PopAt f={wordAt(WORDS, 6, "从") - 4}>
        <div style={{
          position: "absolute", left: 250, top: 280, width: 300, height: 62,
          backgroundColor: RED_BG, border: `3px solid ${RED}`, borderRadius: 999,
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <div style={{fontFamily: F, fontWeight: 900, fontSize: 30, color: RED, whiteSpace: "nowrap"}}>
            又从 0% 开始
          </div>
        </div>
      </PopAt>
    </FlatCard>
    <Label x={560} y={704} w={800} text="断一次，清一次，一夜回到解放前" color={SUBC} />

    <PopAt f={wordAt(WORDS, 6, "服务端") - 4}>
      <div style={{
        position: "absolute", left: 410, top: 790, width: 1100, height: 78,
        backgroundColor: ORANGE_BG, borderRadius: 999, display: "flex",
        alignItems: "center", justifyContent: "center",
      }}>
        <div style={{fontFamily: F, fontWeight: 900, fontSize: 36, color: ORANGE, whiteSpace: "nowrap"}}>
          八成是服务端没开 Range 支持
        </div>
      </div>
    </PopAt>
    <Sparkle x={1440} y={320} s={0.7} color="#f2d9a8" />
  </AbsoluteFill>
);

// P8 金句（铁律⑫：此段停用底部字幕）
const PageQuote: React.FC = () => (
  <AbsoluteFill>
    <BigTitle y={150} parts={[{t: "断点续传的底气", c: INK}]} />
    <PopAt f={wordAt(WORDS, 7, "记住") - 4}>
      <div style={{
        position: "absolute", left: 360, top: 360, width: 1200, height: 260,
        backgroundColor: "rgba(247,201,72,0.25)", border: `5px solid ${YEL}`, borderRadius: 30,
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
        gap: 24, transform: "rotate(-1.5deg)",
      }}>
        <div style={{fontFamily: F, fontWeight: 900, fontSize: 68, color: INK, letterSpacing: 8, whiteSpace: "nowrap"}}>
          记住<span style={{color: ORANGE}}>字节编号</span>
        </div>
        <div style={{fontFamily: F, fontWeight: 900, fontSize: 68, color: INK, letterSpacing: 8, whiteSpace: "nowrap"}}>
          从<span style={{color: BLUE}}>断的那页</span>接着读
        </div>
      </div>
    </PopAt>
    <Sparkle x={340} y={360} s={0.9} />
    <Sparkle x={1520} y={400} s={0.7} color="#b8d4f2" />
    <Sparkle x={1480} y={640} s={0.6} />
  </AbsoluteFill>
);

// P9 结尾截图卡
const PageOutro: React.FC = () => (
  <AbsoluteFill>
    <EndingCard
      startFrame={SENT[8]}
      title="断点续传 对照卡"
      rows={[
        "Range ＝ 只取剩余的字节",
        "断点 ＝ 最后一个完整字节的位置",
        "服务器不支持 ＝ 只能从头下",
      ]}
    />
    <Sparkle x={330} y={140} s={0.8} />
  </AbsoluteFill>
);

// ============ 主组件 ============

const PAGES: {C: React.FC; from: number; dur: number}[] = [
  {C: PageHook, from: SENT[0], dur: SENT[1] - SENT[0]},
  {C: PageRange, from: SENT[1], dur: SENT[2] - SENT[1]},
  {C: PageBytes, from: SENT[2], dur: SENT[3] - SENT[2]},
  {C: PageRequest, from: SENT[3], dur: SENT[4] - SENT[3]},
  {C: PageTail, from: SENT[4], dur: SENT[5] - SENT[4]},
  {C: PageSupport, from: SENT[5], dur: SENT[6] - SENT[5]},
  {C: PageNetdisk, from: SENT[6], dur: SENT[7] - SENT[6]},
  {C: PageQuote, from: SENT[7], dur: SENT[8] - SENT[7]},
  {C: PageOutro, from: SENT[8], dur: DUR - SENT[8]},
];

const SFX: {f: number; w: string; v: number}[] = [
  ...SENT.slice(1).map((f) => ({f, w: "whoosh.wav", v: 0.22})),
  {f: wordAt(WORDS, 1, "Range"), w: "pop.wav", v: 0.26},
  {f: wordAt(WORDS, 1, "只"), w: "ding.wav", v: 0.26},
  {f: wordAt(WORDS, 2, "一百万"), w: "pop.wav", v: 0.24},
  {f: wordAt(WORDS, 2, "两百万"), w: "pop.wav", v: 0.24},
  {f: wordAt(WORDS, 2, "书页"), w: "ding.wav", v: 0.26},
  {f: wordAt(WORDS, 3, "断线"), w: "error.wav", v: 0.26},
  {f: wordAt(WORDS, 3, "请求"), w: "whoosh.wav", v: 0.22},
  {f: wordAt(WORDS, 4, "照办"), w: "success.wav", v: 0.24},
  {f: wordAt(WORDS, 5, "响应"), w: "success.wav", v: 0.24},
  {f: wordAt(WORDS, 5, "不"), w: "error.wav", v: 0.24},
  {f: wordAt(WORDS, 6, "服务端"), w: "alert.wav", v: 0.24},
  {f: wordAt(WORDS, 7, "记住"), w: "ding.wav", v: 0.28},
  {f: SENT[8] + 6, w: "success.wav", v: 0.24},
];

// 铁律⑫（组件级判断）：金句时段 [SENT[7], SENT[8]) 整个字幕条不渲染。
// 不做 SUBS 数组过滤——字幕条显示"最近一条 f<=frame"，滤短语会让上一条挂屏到结尾。
const Subtitles: React.FC = () => {
  const frame = useCurrentFrame();
  if (frame >= SENT[7] && frame < SENT[8]) return null;
  return <SubtitleBar subs={SUBS} />;
};

export const RangeResumeFlat: React.FC = () => {
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
        <Sequence key={`v-${i}`} from={start} durationInFrames={i < 8 ? SENT[i + 1] - start + 10 : DUR - start}>
          <Audio src={staticFile(`audio/b10rangeresume-tts/s0${i + 1}.mp3`)} volume={1} />
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
