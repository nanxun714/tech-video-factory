import React from "react";
import {Audio} from "@remotion/media";
import {
  AbsoluteFill, interpolate, Sequence, staticFile, useCurrentFrame,
} from "remotion";

// ============ 扁平可爱插画科普风 · 并发 vs 并行（batch10 §9，全栈小秋 IP） ============
// 结构：钩子(一个核凭什么同时跑十个程序) → 答案轮流 → 并发厨师一口锅 → 并行四灶眼
//       → 等待切换循环 → 单核/多核 → 面试别答反 → 金句 → 截图卡
// 语义色（竞争型）：并发 = 蓝 #4a86d8 / 并行 = 橙 #f0912d
// 转场：铁律① 纯硬切（kit HardPage，页边界 = SENT 真实句起始帧，无任何叠化）；
//       每页大标题/主视觉 STATIC 即时完整呈现，页内小元素 PopAt 挂 WORDS 词锚。

import {HardPage, PopAt, BrandCorner, SubtitleBar, EndingCard, wordAt} from "./batch10/kit";
import {DUR, SENT, SUBS, WORDS} from "./batch10/concparData";

// 页面起始帧直接用 SENT（真实句起始帧，主会话已补丁；页宽 = SENT[i+1]-SENT[i]）


// ---------- 调色（flat 竞争型：蓝 vs 橙） ----------
const INK = "#2f3a45";
const SUBC = "#7a8694";
const CON = "#4a86d8";      // 并发 = 蓝
const CON_BG = "#eaf2fc";
const PAR = "#f0912d";      // 并行 = 橙
const PAR_BG = "#fdf3e0";
const RED = "#e05656";
const RED_BG = "#fdecec";
const YEL = "#f7c948";
const BORDER = "#e0e6ec";
const DARK = "#3f4d5e";
const F = "'Microsoft YaHei', sans-serif";
const W = 1920;

const clamp = {extrapolateLeft: "clamp", extrapolateRight: "clamp"} as const;

const BgDots: React.FC = () => (
  <svg width={W} height={1080} style={{position: "absolute", left: 0, top: 0, pointerEvents: "none"}}>
    <defs>
      <pattern id="cpar-dots" width="46" height="46" patternUnits="userSpaceOnUse">
        <circle cx="23" cy="23" r="2.6" fill="#dbe4ee" />
      </pattern>
    </defs>
    <rect width={W} height={1080} fill="url(#cpar-dots)" opacity={0.5} />
    <circle cx={150} cy={130} r={190} fill={CON_BG} opacity={0.45} />
    <circle cx={W - 140} cy={980} r={210} fill={PAR_BG} opacity={0.4} />
  </svg>
);

// 大标题（黄波浪垫底）：delay=STATIC 即随页首帧完整呈现
const BigTitle: React.FC<{
  parts: {t: string; c: string}[]; y?: number; size?: number;
}> = ({parts, y = 64, size = 78}) => {
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

// 白底圆角卡（含顶部撞色标签胶囊）
const FlatCard: React.FC<{
  x: number; y: number; w: number; h: number;
  chip?: string; chipColor?: string; fill?: string; children?: React.ReactNode;
}> = ({x, y, w, h, chip, chipColor = CON, fill = "#ffffff", children}) => (
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

// 底部说明标签
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

// 循环飞行数据包（长停留页保活：请求蓝 / 响应绿）
const LoopPacket: React.FC<{
  x1: number; y1: number; x2: number; y2: number;
  color?: string; start?: number; period?: number; dur?: number; lift?: number; size?: number;
}> = ({x1, y1, x2, y2, color = CON, start = 0, period = 60, dur = 38, lift = 20, size = 40}) => {
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

// ---------- 主题图标 ----------

// CPU 芯片（主体具象：金属壳 + 引脚 + 核心网格 + 核数标注）
const ChipIcon: React.FC<{x: number; y: number; s?: number; cores?: number; label?: string}> = ({
  x, y, s = 1, cores = 2, label = "2 核",
}) => {
  const corePos = [
    {cx: 46, cy: 46}, {cx: 96, cy: 46}, {cx: 46, cy: 96}, {cx: 96, cy: 96},
  ];
  return (
    <svg width={170 * s} height={190 * s} viewBox="0 0 170 190"
      style={{position: "absolute", left: x - 85 * s, top: y - 95 * s, overflow: "visible"}}>
      {Array.from({length: 7}).map((_, i) => (
        <rect key={"t" + i} x={24 + i * 19} y={2} width={8} height={16} rx={3} fill={SUBC} />
      ))}
      {Array.from({length: 7}).map((_, i) => (
        <rect key={"b" + i} x={24 + i * 19} y={142} width={8} height={16} rx={3} fill={SUBC} />
      ))}
      {Array.from({length: 5}).map((_, i) => (
        <rect key={"l" + i} x={2} y={32 + i * 22} width={16} height={8} rx={3} fill={SUBC} />
      ))}
      {Array.from({length: 5}).map((_, i) => (
        <rect key={"r" + i} x={152} y={32 + i * 22} width={16} height={8} rx={3} fill={SUBC} />
      ))}
      <rect x={20} y={18} width={130} height={124} rx={14} fill={DARK} />
      {corePos.slice(0, cores).map((p, i) => (
        <g key={i}>
          <rect x={p.cx - 22} y={p.cy - 22} width={44} height={44} rx={8} fill={CON} />
          <rect x={p.cx - 12} y={p.cy - 12} width={24} height={24} rx={4} fill="#fff" opacity={0.55} />
        </g>
      ))}
      <text x={85} y={172} textAnchor="middle" fontFamily={F} fontWeight={900} fontSize={26} fill={INK}>{label}</text>
    </svg>
  );
};

// 扁平小人（可选厨师帽）
const FlatPerson: React.FC<{x: number; y: number; s?: number; color?: string; hat?: boolean}> = ({
  x, y, s = 1, color = CON, hat,
}) => (
  <svg width={140 * s} height={180 * s} viewBox="0 0 140 180"
    style={{position: "absolute", left: x - 70 * s, top: y - 90 * s, overflow: "visible"}}>
    <circle cx={70} cy={44} r={30} fill="#f6cfa4" stroke={INK} strokeWidth={4} />
    <path d="M44 34 Q70 10 96 34 Q88 20 70 22 Q52 20 44 34 Z" fill={INK} />
    <circle cx={60} cy={46} r={3.6} fill={INK} />
    <circle cx={80} cy={46} r={3.6} fill={INK} />
    <path d="M62 56 Q70 61 78 56" fill="none" stroke={INK} strokeWidth={3} strokeLinecap="round" />
    {hat ? <path d="M40 22 Q70 -14 100 22 L100 30 L40 30 Z" fill="#fff" stroke={INK} strokeWidth={4} /> : null}
    <rect x={40} y={80} width={60} height={64} rx={22} fill={color} />
    <rect x={46} y={142} width={20} height={26} rx={8} fill={INK} />
    <rect x={74} y={142} width={20} height={26} rx={8} fill={INK} />
  </svg>
);

// 灶眼 + 锅 + 火苗（火苗持续跳动 = 循环动画）
const StoveIcon: React.FC<{x: number; y: number; s?: number; flame?: boolean; dish?: string}> = ({
  x, y, s = 1, flame = true, dish,
}) => {
  const f = useCurrentFrame();
  const flick = flame ? 1 + Math.sin(f / 3.5 + x) * 0.16 : 0;
  return (
    <svg width={230 * s} height={200 * s} viewBox="0 0 230 200"
      style={{position: "absolute", left: x - 115 * s, top: y - 100 * s, overflow: "visible"}}>
      <rect x={30} y={130} width={170} height={44} rx={12} fill={DARK} />
      <rect x={52} y={150} width={44} height={14} rx={7} fill="#5b6b7d" />
      <circle cx={160} cy={157} r={7} fill={PAR} />
      {flame ? (
        <g transform={`translate(0 ${(1 - flick) * 8})`}>
          <path d="M115 128 Q100 108 115 88 Q122 102 130 94 Q140 110 122 126 Z" fill={PAR} />
          <path d="M116 126 Q110 114 118 104 Q121 112 126 108 Q130 118 120 124 Z" fill={YEL} />
        </g>
      ) : null}
      <path d="M62 86 Q62 70 84 70 L146 70 Q168 70 168 86 L160 106 Q158 116 146 116 L84 116 Q72 116 70 106 Z" fill="#5b6b7d" />
      <rect x={52} y={62} width={126} height={12} rx={6} fill={DARK} />
      {dish ? (
        <g>
          <rect x={78} y={26} width={76} height={34} rx={10} fill={PAR} />
          <text x={116} y={50} textAnchor="middle" fontFamily={F} fontWeight={900} fontSize={22} fill="#fff">{dish}</text>
        </g>
      ) : null}
    </svg>
  );
};

// ============ 页面（frame 为全局绝对帧，词锚来自 WORDS） ============

// P1 钩子（第 0 帧完整封面：标题 + 芯片 + 三个 app 全 STATIC，铁律③）
const PageHook: React.FC = () => (
  <AbsoluteFill>
    <BigTitle parts={[
      {t: "一个核，凭什么", c: INK}, {t: "“同时”", c: RED}, {t: "跑十个程序？", c: INK},
    ]} />
    <Sparkle x={300} y={110} s={0.8} />
    <Sparkle x={1600} y={90} s={0.6} color="#b8d4f2" />

    {/* 主视觉：处理器芯片卡（就几个核） */}
    <FlatCard x={760} y={300} w={400} h={390} chip="手机处理器" chipColor={DARK}>
      <ChipIcon x={200} y={170} s={1.35} cores={2} label="就 2 个核" />
    </FlatCard>
    <Label x={760} y={716} w={400} text="核心就这几个" color={SUBC} />

    {/* 左右 app 药丸：全 STATIC（封面完整） */}
    {[
      {x: 250, y: 330, t: "微信", bg: CON_BG, bd: CON, tc: CON},
      {x: 250, y: 560, t: "放着歌", bg: PAR_BG, bd: PAR, tc: PAR},
      {x: 1390, y: 330, t: "下着文件", bg: CON_BG, bd: CON, tc: CON},
      {x: 1390, y: 560, t: "…还有一堆", bg: "#f6f8fa", bd: BORDER, tc: SUBC},
    ].map((p, i) => (
      <div key={i} style={{
        position: "absolute", left: p.x, top: p.y, width: 280, height: 88,
        backgroundColor: p.bg, border: `3px solid ${p.bd}`, borderRadius: 999,
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <div style={{fontFamily: F, fontWeight: 900, fontSize: 34, color: p.tc, whiteSpace: "nowrap"}}>{p.t}</div>
      </div>
    ))}
    <FlatArrow x1={560} y1={410} x2={740} y2={440} color="#9fb4c8" dashed sw={5} />
    <FlatArrow x1={560} y1={610} x2={740} y2={560} color="#9fb4c8" dashed sw={5} />
    <FlatArrow x1={1360} y1={410} x2={1180} y2={440} color="#9fb4c8" dashed sw={5} />
    <FlatArrow x1={1360} y1={610} x2={1180} y2={560} color="#9fb4c8" dashed sw={5} />
    <LoopPacket x1={600} y1={430} x2={740} y2={460} color={CON} start={8} period={62} dur={40} size={34} />
    <LoopPacket x1={1320} y1={430} x2={1180} y2={460} color={PAR} start={38} period={62} dur={40} size={34} />

    {/* 疑问胶囊 */}
    <div style={{
      position: "absolute", left: 640, top: 830, width: 640, height: 76,
      backgroundColor: RED_BG, border: `3px dashed ${RED}`, borderRadius: 999,
      display: "flex", alignItems: "center", justifyContent: "center",
    }}>
      <div style={{fontFamily: F, fontWeight: 900, fontSize: 34, color: RED, whiteSpace: "nowrap"}}>
        为什么它不卡？
      </div>
    </div>
  </AbsoluteFill>
);

// P2 答案：不是同时，是轮流（A/B 轮流点亮循环）
const PageAnswer: React.FC = () => {
  const f = useCurrentFrame();
  const aActive = Math.floor((f - SENT[1]) / 18) % 2 === 0;
  return (
    <AbsoluteFill>
      <BigTitle parts={[{t: "不是同时，是", c: INK}, {t: "轮流", c: CON}]} />
      <Sparkle x={480} y={120} s={0.7} color="#b8d4f2" />

      <FlatCard x={760} y={310} w={400} h={340} chip="处理器" chipColor={DARK}>
        <ChipIcon x={200} y={160} s={1.1} cores={1} label="1 个核" />
      </FlatCard>

      {/* 程序A / 程序B 轮流高亮 */}
      {[
        {x: 220, y: 400, name: "程序A", on: aActive},
        {x: 1400, y: 400, name: "程序B", on: !aActive},
      ].map((p, i) => (
        <div key={i} style={{
          position: "absolute", left: p.x, top: p.y, width: 300, height: 110,
          backgroundColor: p.on ? CON_BG : "#f6f8fa",
          border: `4px solid ${p.on ? CON : BORDER}`, borderRadius: 22,
          display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
          transform: `scale(${p.on ? 1.04 : 0.98})`,
        }}>
          <div style={{fontFamily: F, fontWeight: 900, fontSize: 36, color: p.on ? CON : SUBC, whiteSpace: "nowrap"}}>{p.name}</div>
          <div style={{fontFamily: F, fontWeight: 900, fontSize: 24, color: p.on ? CON : "#a8b4c0", whiteSpace: "nowrap"}}>
            {p.on ? "正在跑" : "… 等一会"}
          </div>
        </div>
      ))}
      <FlatArrow x1={540} y1={440} x2={740} y2={470} color={aActive ? CON : "#c6d2de"} sw={aActive ? 7 : 5} />
      <FlatArrow x1={1380} y1={440} x2={1180} y2={470} color={!aActive ? CON : "#c6d2de"} sw={!aActive ? 7 : 5} />
      <LoopPacket x1={560} y1={450} x2={750} y2={480} color={CON} start={SENT[1]} period={36} dur={26} size={32} />
      <LoopPacket x1={1360} y1={450} x2={1170} y2={480} color={CON} start={SENT[1] + 18} period={36} dur={26} size={32} />

      <PopAt f={wordAt(WORDS, 1, "轮流") - 4}>
        <div style={{
          position: "absolute", left: 760, top: 700, width: 400, height: 70,
          backgroundColor: CON_BG, borderRadius: 999, display: "flex",
          alignItems: "center", justifyContent: "center",
        }}>
          <div style={{fontFamily: F, fontWeight: 900, fontSize: 32, color: CON, whiteSpace: "nowrap"}}>轮流用同一个核</div>
        </div>
      </PopAt>
      <PopAt f={wordAt(WORDS, 1, "以为") - 4}>
        <div style={{
          position: "absolute", left: 560, top: 820, width: 800, height: 76,
          backgroundColor: "rgba(247,201,72,0.22)", border: `3px solid ${YEL}`, borderRadius: 999,
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <div style={{fontFamily: F, fontWeight: 900, fontSize: 36, color: INK, whiteSpace: "nowrap"}}>
            快到你以为是真的同时
          </div>
        </div>
      </PopAt>
      <Sparkle x={1420} y={660} s={0.6} />
    </AbsoluteFill>
  );
};

// P3 并发 = 一个厨师一口锅（蓝）
const PageConcurrency: React.FC = () => (
  <AbsoluteFill>
    <BigTitle parts={[{t: "并发 · 一口锅", c: CON}, {t: "轮着炒", c: INK}]} />
    <Sparkle x={330} y={120} s={0.75} color="#b8d4f2" />

    <FlatCard x={360} y={280} w={1200} h={440} chip="并发" chipColor={CON}>
      {/* 厨师（主视觉 STATIC，整体上收给底部说明行让位） */}
      <FlatPerson x={220} y={205} s={1.3} color={CON} hat />
      {/* 一口锅在灶上（蒸汽循环） */}
      <Steam x={520} y={140} />
      <StoveIcon x={520} y={272} s={1.08} flame={false} />
      {/* 锅里的菜A（说到才出现） */}
      <PopAt f={wordAt(WORDS, 2, "菜") - 4}>
        <div style={{
          position: "absolute", left: 455, top: 168, width: 130, height: 56,
          backgroundColor: CON, borderRadius: 14, display: "flex",
          alignItems: "center", justifyContent: "center", border: "3px solid #fff",
          boxShadow: "0 8px 18px rgba(74,134,216,0.35)",
        }}>
          <div style={{fontFamily: F, fontWeight: 900, fontSize: 28, color: "#fff", whiteSpace: "nowrap"}}>菜A</div>
        </div>
      </PopAt>
      {/* 砧板上的菜B（说到才出现；并发场景统一蓝色系） */}
      <PopAt f={wordAt(WORDS, 2, "切") - 4}>
        <div style={{position: "absolute", left: 850, top: 160, width: 260, height: 190}}>
          <svg width={260} height={190} viewBox="0 0 260 190" style={{overflow: "visible"}}>
            <rect x={20} y={110} width={220} height={46} rx={12} fill="#d9a75a" />
            <rect x={60} y={70} width={90} height={44} rx={10} fill="#7fc48f" />
            <rect x={150} y={30} width={16} height={86} rx={8} fill={DARK} transform="rotate(24 158 73)" />
          </svg>
          <div style={{
            position: "absolute", left: 70, top: 8, width: 110, height: 50,
            backgroundColor: CON, borderRadius: 12, display: "flex",
            alignItems: "center", justifyContent: "center", border: "3px solid #fff",
          }}>
            <div style={{fontFamily: F, fontWeight: 900, fontSize: 26, color: "#fff", whiteSpace: "nowrap"}}>菜B</div>
          </div>
        </div>
      </PopAt>
      {/* 说明行：置于图形下方空白区（灶底 380 / 板底 350 / 厨师底 322，均不与之重叠） */}
      <div style={{
        position: "absolute", left: 0, top: 398, width: 1200, textAlign: "center",
        fontFamily: F, fontWeight: 700, fontSize: 25, color: SUBC, whiteSpace: "nowrap",
      }}>一个人 · 一口锅 · 两道菜轮着照顾</div>
    </FlatCard>
    <Label x={360} y={736} w={1200} text="锅里炖着A 手上切着B" color={CON} size={30} />

    {/* 底部奖励条（说到「炖」弹出，压轴留足停留） */}
    <PopAt f={wordAt(WORDS, 2, "炖") - 4}>
      <div style={{
        position: "absolute", left: 460, top: 800, width: 1000, height: 74,
        backgroundColor: CON_BG, borderRadius: 999, display: "flex",
        alignItems: "center", justifyContent: "center",
      }}>
        <div style={{fontFamily: F, fontWeight: 900, fontSize: 34, color: CON, whiteSpace: "nowrap"}}>
          谁也不闲着 · 谁也不用干等
        </div>
      </div>
    </PopAt>
    <Sparkle x={1470} y={260} s={0.65} color="#b8d4f2" />
  </AbsoluteFill>
);

// 蒸汽循环（锅上白汽）
const Steam: React.FC<{x: number; y: number}> = ({x, y}) => {
  const f = useCurrentFrame();
  return (
    <svg width={140} height={110} style={{position: "absolute", left: x - 70, top: y, overflow: "visible"}}>
      {[0, 1, 2].map((i) => {
        const t = ((f / 40 + i / 3) % 1);
        return (
          <circle key={i} cx={35 + i * 35} cy={90 - t * 70} r={9 + i * 2}
            fill="#c9d6e2" opacity={(1 - t) * 0.7} />
        );
      })}
    </svg>
  );
};

// P4 并行 = 四个灶眼同开（橙）
const PageParallel: React.FC = () => (
  <AbsoluteFill>
    <BigTitle parts={[{t: "并行 · 四灶眼", c: PAR}, {t: "一起开火", c: INK}]} />
    <Sparkle x={1580} y={120} s={0.75} />

    <FlatCard x={360} y={280} w={1200} h={440} chip="并行" chipColor={PAR}>
      {[
        // 四道菜逐个上：锚点 = s04 的「四/道/菜/一起」词锚（提前 4 帧）
        {x: 300, y: 160, dish: "菜1", d: wordAt(WORDS, 3, "四") - 4},
        {x: 760, y: 160, dish: "菜2", d: wordAt(WORDS, 3, "道") - 4},
        {x: 300, y: 360, dish: "菜3", d: wordAt(WORDS, 3, "菜") - 4},
        {x: 760, y: 360, dish: "菜4", d: wordAt(WORDS, 3, "一起") - 4},
      ].map((s, i) => (
        <div key={i} style={{position: "absolute", left: s.x - 115, top: s.y - 100, width: 230, height: 200}}>
          <StoveIcon x={115} y={100} s={1.0} />
          <PopAt f={s.d}>
            <div style={{
              position: "absolute", left: 60, top: 10, width: 110, height: 44,
              backgroundColor: PAR, borderRadius: 10, display: "flex",
              alignItems: "center", justifyContent: "center", border: "2px solid #fff",
            }}>
              <div style={{fontFamily: F, fontWeight: 900, fontSize: 22, color: "#fff", whiteSpace: "nowrap"}}>{s.dish}</div>
            </div>
          </PopAt>
        </div>
      ))}
      <div style={{
        position: "absolute", left: 960, top: 180, width: 200, textAlign: "center",
        fontFamily: F, fontWeight: 900, fontSize: 40, color: PAR, whiteSpace: "nowrap",
      }}>× 4</div>
    </FlatCard>
    <Label x={360} y={736} w={1200} text="四个灶眼各炒各的 · 一刻都不用等" color={PAR} size={30} />

    <PopAt f={wordAt(WORDS, 3, "一起") - 4}>
      <div style={{
        position: "absolute", left: 510, top: 800, width: 900, height: 76,
        backgroundColor: PAR_BG, borderRadius: 999, display: "flex",
        alignItems: "center", justifyContent: "center",
      }}>
        <div style={{fontFamily: F, fontWeight: 900, fontSize: 36, color: PAR, whiteSpace: "nowrap"}}>
          四道菜一起做，这才是真同时
        </div>
      </div>
    </PopAt>
    <Sparkle x={430} y={250} s={0.6} color="#f2d9a8" />
  </AbsoluteFill>
);

// P5 轮流的诀窍：等就换人（程序A/B 轮流上 CPU 的小循环）
const PageSwitch: React.FC = () => {
  const f = useCurrentFrame();
  const aOn = Math.floor((f - SENT[4]) / 30) % 2 === 0;
  const n = Math.max(0, Math.floor((f - wordAt(WORDS, 4, "一秒")) / 2));
  return (
    <AbsoluteFill>
      <BigTitle size={72} parts={[{t: "诀窍：等的时候", c: INK}, {t: "马上换人", c: CON}]} />

      {/* 程序A 卡 */}
      <FlatCard x={170} y={330} w={380} h={320}>
        <div style={{
          position: "absolute", left: 0, top: 40, width: 380, textAlign: "center",
          fontFamily: F, fontWeight: 900, fontSize: 40, color: INK, whiteSpace: "nowrap",
        }}>程序A</div>
        <div style={{
          position: "absolute", left: 60, top: 130, width: 260, height: 90,
          backgroundColor: aOn ? CON_BG : "#f6f8fa", border: `3px solid ${aOn ? CON : BORDER}`,
          borderRadius: 16, display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <div style={{fontFamily: F, fontWeight: 900, fontSize: 30, color: aOn ? CON : SUBC, whiteSpace: "nowrap"}}>
            {aOn ? "上 CPU 跑" : "等网络…"}
          </div>
        </div>
        <div style={{
          position: "absolute", left: 60, top: 236, width: 260, textAlign: "center",
          fontFamily: F, fontSize: 26, color: SUBC, fontWeight: 700, whiteSpace: "nowrap",
        }}>{aOn ? "轮到我" : "让给 B"}</div>
      </FlatCard>

      {/* CPU 卡 */}
      <FlatCard x={770} y={310} w={380} h={360} chip="CPU" chipColor={DARK}>
        <ChipIcon x={190} y={150} s={1.05} cores={1} label="" />
        <div style={{
          position: "absolute", left: 0, top: 260, width: 380, textAlign: "center",
          fontFamily: F, fontWeight: 900, fontSize: 32, color: aOn ? CON : PAR, whiteSpace: "nowrap",
        }}>正在跑 程序{aOn ? "A" : "B"}</div>
      </FlatCard>

      {/* 程序B 卡 */}
      <FlatCard x={1370} y={330} w={380} h={320}>
        <div style={{
          position: "absolute", left: 0, top: 40, width: 380, textAlign: "center",
          fontFamily: F, fontWeight: 900, fontSize: 40, color: INK, whiteSpace: "nowrap",
        }}>程序B</div>
        <div style={{
          position: "absolute", left: 60, top: 130, width: 260, height: 90,
          backgroundColor: !aOn ? CON_BG : "#f6f8fa", border: `3px solid ${!aOn ? CON : BORDER}`,
          borderRadius: 16, display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <div style={{fontFamily: F, fontWeight: 900, fontSize: 30, color: !aOn ? CON : SUBC, whiteSpace: "nowrap"}}>
            {!aOn ? "上 CPU 跑" : "等网络…"}
          </div>
        </div>
        <div style={{
          position: "absolute", left: 60, top: 236, width: 260, textAlign: "center",
          fontFamily: F, fontSize: 26, color: SUBC, fontWeight: 700, whiteSpace: "nowrap",
        }}>{!aOn ? "轮到我" : "让给 A"}</div>
      </FlatCard>

      <FlatArrow x1={570} y1={480} x2={760} y2={500} color={aOn ? CON : "#c6d2de"} sw={aOn ? 7 : 5} />
      <FlatArrow x1={1350} y1={480} x2={1160} y2={500} color={!aOn ? CON : "#c6d2de"} sw={!aOn ? 7 : 5} />

      {/* 切换计数器 + 压轴结论 */}
      <PopAt f={wordAt(WORDS, 4, "一秒") - 4}>
        <div style={{
          position: "absolute", left: 700, top: 730, width: 520, height: 70,
          backgroundColor: "#f6f8fa", border: `3px solid ${BORDER}`, borderRadius: 999,
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <div style={{fontFamily: "Consolas, monospace", fontWeight: 900, fontSize: 32, color: INK, whiteSpace: "nowrap"}}>
            {`切换次数 ${n}`}
          </div>
        </div>
      </PopAt>
      <PopAt f={wordAt(WORDS, 4, "切换") - 4}>
        <div style={{
          position: "absolute", left: 510, top: 830, width: 900, height: 74,
          backgroundColor: CON_BG, borderRadius: 999, display: "flex",
          alignItems: "center", justifyContent: "center",
        }}>
          <div style={{fontFamily: F, fontWeight: 900, fontSize: 36, color: CON, whiteSpace: "nowrap"}}>
            切换快到你毫无察觉
          </div>
        </div>
      </PopAt>
    </AbsoluteFill>
  );
};

// P6 单核靠并发 · 多核靠并行
const PageEras: React.FC = () => (
  <AbsoluteFill>
    <BigTitle size={72} parts={[{t: "单核靠", c: INK}, {t: "并发", c: CON}, {t: "，多核靠", c: INK}, {t: "并行", c: PAR}]} />

    {/* 左：单核时代 */}
    <FlatCard x={220} y={310} w={680} h={400} chip="单核时代" chipColor={CON}>
      <div style={{position: "absolute", left: 90, top: 90, width: 500, height: 150}}>
        <div style={{
          position: "absolute", left: 0, top: 0, width: 500, height: 150,
          backgroundColor: "#f6f8fa", border: `3px solid ${BORDER}`, borderRadius: 20,
          display: "flex", alignItems: "center", justifyContent: "center", gap: 30,
        }}>
          <CoreBox label="1 核" />
          <Pill48 text="听歌" at={wordAt(WORDS, 5, "听歌") - 4} />
          <Pill48 text="打字" at={wordAt(WORDS, 5, "打字") - 4} />
        </div>
      </div>
      <PopAt f={wordAt(WORDS, 5, "并发") - 4}>
        <div style={{
          position: "absolute", left: 140, top: 290, width: 400, height: 66,
          backgroundColor: CON_BG, borderRadius: 999, display: "flex",
          alignItems: "center", justifyContent: "center",
        }}>
          <div style={{fontFamily: F, fontWeight: 900, fontSize: 30, color: CON, whiteSpace: "nowrap"}}>
            一个核轮流带 → 这叫并发
          </div>
        </div>
      </PopAt>
    </FlatCard>

    {/* 右：多核时代 */}
    <FlatCard x={1020} y={310} w={680} h={400} chip="多核时代" chipColor={PAR}>
      <div style={{
        position: "absolute", left: 60, top: 80, width: 560, height: 170,
        backgroundColor: "#f6f8fa", border: `3px solid ${BORDER}`, borderRadius: 20,
        display: "flex", alignItems: "center", justifyContent: "center", gap: 22,
      }}>
        <CoreBox label="核1" lit /><CoreBox label="核2" lit /><CoreBox label="核3" lit /><CoreBox label="核4" lit />
      </div>
      <PopAt f={wordAt(WORDS, 5, "多核") - 7}>
        <div style={{
          position: "absolute", left: 140, top: 290, width: 400, height: 66,
          backgroundColor: PAR_BG, borderRadius: 999, display: "flex",
          alignItems: "center", justifyContent: "center",
        }}>
          <div style={{fontFamily: F, fontWeight: 900, fontSize: 30, color: PAR, whiteSpace: "nowrap"}}>
            四个核一起上 → 才叫并行
          </div>
        </div>
      </PopAt>
    </FlatCard>

    <Label x={220} y={760} w={680} text="边听歌边打字，单核也办得到" color={CON} />
    <Label x={1020} y={760} w={680} text="真同时干活，得真有多个核" color={PAR} />
    <Sparkle x={930} y={300} s={0.7} />
  </AbsoluteFill>
);

// 核心小方块
const CoreBox: React.FC<{label: string; lit?: boolean}> = ({label, lit}) => (
  <div style={{
    width: 96, height: 96, borderRadius: 14, backgroundColor: lit ? PAR : CON,
    border: "3px solid #fff", boxShadow: "0 6px 14px rgba(47,58,69,0.18)",
    display: "flex", alignItems: "center", justifyContent: "center",
  }}>
    <div style={{fontFamily: F, fontWeight: 900, fontSize: 24, color: "#fff", whiteSpace: "nowrap"}}>{label}</div>
  </div>
);

// 卡内小药丸（词锚弹入）
const Pill48: React.FC<{text: string; at: number}> = ({text, at}) => (
  <PopAt f={at}>
    <div style={{
      width: 110, height: 60, borderRadius: 999, backgroundColor: "#fff",
      border: `3px solid ${CON}`, display: "flex", alignItems: "center", justifyContent: "center",
    }}>
      <div style={{fontFamily: F, fontWeight: 900, fontSize: 26, color: CON, whiteSpace: "nowrap"}}>{text}</div>
    </div>
  </PopAt>
);

// P7 面试别答反（两张结论卡 + VS 徽章）
const PageExam: React.FC = () => (
  <AbsoluteFill>
    <BigTitle parts={[{t: "面试这两个词，", c: INK}, {t: "别答反", c: RED}]} />

    <FlatCard x={230} y={330} w={560} h={360} chip="并发" chipColor={CON}>
      <FlatPerson x={280} y={150} s={1.15} color={CON} />
      <div style={{
        position: "absolute", left: 0, top: 268, width: 560, textAlign: "center",
        fontFamily: F, fontWeight: 900, fontSize: 40, color: CON, whiteSpace: "nowrap",
      }}>排队效率高</div>
    </FlatCard>

    <FlatCard x={1130} y={330} w={560} h={360} chip="并行" chipColor={PAR}>
      <div style={{position: "absolute", left: 160, top: 120, width: 240, height: 140}}>
        <StoveIcon x={120} y={70} s={0.95} />
      </div>
      <div style={{
        position: "absolute", left: 0, top: 268, width: 560, textAlign: "center",
        fontFamily: F, fontWeight: 900, fontSize: 40, color: PAR, whiteSpace: "nowrap",
      }}>是真的分身</div>
    </FlatCard>

    {/* 中央 VS 徽章 */}
    <div style={{
      position: "absolute", left: 860, top: 440, width: 200, height: 200, borderRadius: 999,
      backgroundColor: "#fff", border: `6px solid ${YEL}`, display: "flex",
      alignItems: "center", justifyContent: "center", boxShadow: "0 12px 30px rgba(47,58,69,0.15)",
    }}>
      <div style={{fontFamily: F, fontWeight: 900, fontSize: 60, color: INK, whiteSpace: "nowrap"}}>VS</div>
    </div>

    {/* 警示章（说到「答反」砸出） */}
    <PopAt f={wordAt(WORDS, 6, "反") - 4}>
      <div style={{
        position: "absolute", left: 760, top: 226, width: 400, height: 84,
        border: `5px dashed ${RED}`, borderRadius: 18, backgroundColor: RED_BG,
        display: "flex", alignItems: "center", justifyContent: "center",
        transform: "rotate(-3deg)",
      }}>
        <div style={{fontFamily: F, fontWeight: 900, fontSize: 38, color: RED, whiteSpace: "nowrap"}}>
          答反的人真不少
        </div>
      </div>
    </PopAt>
    <Label x={230} y={740} w={560} text="一句话记住下面这页" color={SUBC} />
    <Sparkle x={840} y={760} s={0.7} />
  </AbsoluteFill>
);

// P8 金句：并发轮流上，并行一起上（铁律⑫：此段停用底部字幕）
const PageQuote: React.FC = () => (
  <AbsoluteFill>
    <BigTitle y={140} parts={[{t: "一句话记住", c: INK}]} />
    <PopAt f={wordAt(WORDS, 7, "并发") - 4}>
      <div style={{
        position: "absolute", left: 460, top: 320, width: 1000, height: 130,
        backgroundColor: CON, borderRadius: 999, display: "flex",
        alignItems: "center", justifyContent: "center",
        boxShadow: "0 14px 30px rgba(74,134,216,0.35)",
      }}>
        <div style={{fontFamily: F, fontWeight: 900, fontSize: 60, color: "#fff", letterSpacing: 8, whiteSpace: "nowrap"}}>
          并发 轮流上
        </div>
      </div>
    </PopAt>
    <PopAt f={wordAt(WORDS, 7, "并行") - 4}>
      <div style={{
        position: "absolute", left: 460, top: 490, width: 1000, height: 130,
        backgroundColor: PAR, borderRadius: 999, display: "flex",
        alignItems: "center", justifyContent: "center",
        boxShadow: "0 14px 30px rgba(240,145,45,0.35)",
      }}>
        <div style={{fontFamily: F, fontWeight: 900, fontSize: 60, color: "#fff", letterSpacing: 8, whiteSpace: "nowrap"}}>
          并行 一起上
        </div>
      </div>
    </PopAt>
    <PopAt f={wordAt(WORDS, 7, "切换") - 4}>
      <div style={{
        position: "absolute", left: 410, top: 700, width: 1100, height: 104,
        backgroundColor: "rgba(247,201,72,0.25)", border: `4px solid ${YEL}`, borderRadius: 26,
        display: "flex", alignItems: "center", justifyContent: "center",
        transform: "rotate(-1.5deg)",
      }}>
        <div style={{fontFamily: F, fontWeight: 900, fontSize: 44, color: INK, letterSpacing: 4, whiteSpace: "nowrap"}}>
          切换够快，就伪装成了同时
        </div>
      </div>
    </PopAt>
    <Sparkle x={380} y={320} s={0.9} />
    <Sparkle x={1500} y={500} s={0.7} color="#f2d9a8" />
    <Sparkle x={1480} y={280} s={0.6} color="#b8d4f2" />
  </AbsoluteFill>
);

// P9 结尾截图卡（kit EndingCard，页首即呈现，静置到片尾）
const PageOutro: React.FC = () => (
  <AbsoluteFill>
    <EndingCard
      startFrame={SENT[8]}
      title="并发 vs 并行 对照卡"
      rows={[
        "并发 ＝ 轮流上（单核也行）",
        "并行 ＝ 一起上（要多个核）",
        "切换够快，就约等于同时",
      ]}
    />
    <Sparkle x={330} y={140} s={0.8} />
  </AbsoluteFill>
);

// ============ 主组件 ============

const PAGES: {C: React.FC; from: number; dur: number}[] = [
  {C: PageHook, from: SENT[0], dur: SENT[1] - SENT[0]},
  {C: PageAnswer, from: SENT[1], dur: SENT[2] - SENT[1]},
  {C: PageConcurrency, from: SENT[2], dur: SENT[3] - SENT[2]},
  {C: PageParallel, from: SENT[3], dur: SENT[4] - SENT[3]},
  {C: PageSwitch, from: SENT[4], dur: SENT[5] - SENT[4]},
  {C: PageEras, from: SENT[5], dur: SENT[6] - SENT[5]},
  {C: PageExam, from: SENT[6], dur: SENT[7] - SENT[6]},
  {C: PageQuote, from: SENT[7], dur: SENT[8] - SENT[7]},
  {C: PageOutro, from: SENT[8], dur: DUR - SENT[8]},
];

// 音效点（全部由 SENT / 词锚推导）
const SFX: {f: number; w: string; v: number}[] = [
  ...SENT.slice(1).map((f) => ({f, w: "whoosh.wav", v: 0.22})),
  {f: wordAt(WORDS, 1, "轮流"), w: "pop.wav", v: 0.26},
  {f: wordAt(WORDS, 1, "以为"), w: "pop.wav", v: 0.26},
  {f: wordAt(WORDS, 2, "菜"), w: "pop.wav", v: 0.26},
  {f: wordAt(WORDS, 2, "切"), w: "pop.wav", v: 0.26},
  {f: wordAt(WORDS, 2, "炖"), w: "ding.wav", v: 0.28},
  {f: wordAt(WORDS, 3, "四"), w: "pop.wav", v: 0.24},
  {f: wordAt(WORDS, 3, "一起"), w: "pop.wav", v: 0.26},
  {f: wordAt(WORDS, 4, "转头"), w: "whoosh.wav", v: 0.22},
  {f: wordAt(WORDS, 4, "一秒"), w: "pop.wav", v: 0.26},
  {f: wordAt(WORDS, 5, "听歌"), w: "pop.wav", v: 0.24},
  {f: wordAt(WORDS, 5, "多核"), w: "pop.wav", v: 0.26},
  {f: wordAt(WORDS, 6, "反"), w: "error.wav", v: 0.24},
  {f: wordAt(WORDS, 7, "并发"), w: "pop.wav", v: 0.26},
  {f: wordAt(WORDS, 7, "并行"), w: "pop.wav", v: 0.26},
  {f: wordAt(WORDS, 7, "切换"), w: "ding.wav", v: 0.28},
  {f: SENT[8] + 6, w: "success.wav", v: 0.24},
];

// 铁律⑫（组件级判断）：金句时段 [SENT[7], SENT[8]) 整个字幕条不渲染。
// 不做 SUBS 数组过滤——字幕条显示"最近一条 f<=frame"，滤短语会让上一条挂屏到结尾。
const Subtitles: React.FC = () => {
  const frame = useCurrentFrame();
  if (frame >= SENT[7] && frame < SENT[8]) return null;
  return <SubtitleBar subs={SUBS} />;
};

export const ConcParFlat: React.FC = () => {
  const frame = useCurrentFrame();
  const bed = interpolate(frame, [0, 20, DUR - 130, DUR - 100, DUR - 26, DUR - 1], [0, 0.06, 0.06, 0.1, 0.17, 0], clamp);
  return (
    <AbsoluteFill style={{background: "linear-gradient(180deg,#fff 0%,#f3f6f9 100%)", fontFamily: F, overflow: "hidden"}}>
      <BgDots />
      {/* 铁律① 纯硬切：HardPage 页边界精确对齐 SENT 句起始帧 */}
      {PAGES.map(({C, from, dur}, i) => (
        <HardPage key={i} from={from} duration={dur}>
          <C />
        </HardPage>
      ))}
      <BrandCorner light />

      {/* 配音（batch10 已生成，直接挂载） */}
      {SENT.map((start, i) => (
        <Sequence key={`v-${i}`} from={start} durationInFrames={i < 8 ? SENT[i + 1] - start + 10 : DUR - start}>
          <Audio src={staticFile(`audio/b10concpar-tts/s0${i + 1}.mp3`)} volume={1} />
        </Sequence>
      ))}
      {SFX.map((s, i) => (
        <Sequence key={`sfx-${i}`} from={s.f} durationInFrames={22}>
          <Audio src={staticFile(`audio/sfx/${s.w}`)} volume={s.v} />
        </Sequence>
      ))}
      <Audio src={staticFile("audio/bed.wav")} loop volume={() => bed} />

      {/* 铁律⑫：金句时段（SENT[7] → SENT[8]）不渲染底部字幕 */}
      <Subtitles />
    </AbsoluteFill>
  );
};
