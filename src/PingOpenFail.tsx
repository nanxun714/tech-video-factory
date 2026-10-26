import React from "react";
import {Audio} from "@remotion/media";
import {
  AbsoluteFill, interpolate, Sequence, spring, staticFile, useCurrentFrame, useVideoConfig,
} from "remotion";

// ============ 深蓝灰对称终端风 · ping通但网页打不开（batch10 §5，全栈小秋 IP） ============
// 结构：封面(ping通+打不开) → 路通≠门开 → ICMP/TCP两条通道 → 小区/门比喻 → 三真凶
//       → 经典现场(新防火墙) → 换工具探端口 → 金句 → 截图卡
// 铁律：硬切翻页（kit HardPage，页边界 = SENT 真实句起始帧）；场景1第0帧完整海报；
//       终端满宽 1560；命令慢速打字机（cps 0.55）；未敲的命令不渲染；金句段停用底部字幕。

import {HardPage, PopAt, BrandCorner, SubtitleBar, EndingCard, wordAt} from "./batch10/kit";
import {DUR, SENT, SUBS, WORDS} from "./batch10/pingopenData";

// ---------- palette（深蓝灰 + 橙 + 暗红，四色相封顶）----------
const BG = "#262c3a";
const INK = "#eef1f6";
const SUB = "#9aa3b5";
const CARD = "#2f3646";
const BORDER = "#3d4658";
const ORANGE = "#fb923c";
const ORANGE_D = "#f97316";
const TINT = "rgba(251,146,60,0.14)";
const RED = "#ef6f6f";
const RED_BG = "rgba(239,111,111,0.16)";

const YAHEI = "Microsoft YaHei, sans-serif";
const MONO = "Consolas, 'Courier New', monospace";


// ---------- 动画原语 ----------

const Pop: React.FC<{delay?: number; children: React.ReactNode; style?: React.CSSProperties}> = ({
  delay = 0, children, style,
}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const sp = spring({frame: frame - delay, fps, config: {damping: 15, stiffness: 170}});
  if (frame < delay) return null;
  return (
    <div style={{
      opacity: interpolate(sp, [0, 1], [0, 1]),
      transform: `translateY(${(1 - sp) * 22}px)`,
      ...style,
    }}>
      {children}
    </div>
  );
};

const FadeUp: React.FC<{at: number; children: React.ReactNode; style?: React.CSSProperties}> = ({at, children, style}) => {
  const frame = useCurrentFrame();
  const a = interpolate(frame, [at, at + 8], [0, 1], {extrapolateLeft: "clamp", extrapolateRight: "clamp"});
  if (a <= 0) return null;
  return <div style={{opacity: a, transform: `translateY(${(1 - a) * 14}px)`, ...style}}>{children}</div>;
};

const SlideIn: React.FC<{delay?: number; from?: number; children: React.ReactNode; style?: React.CSSProperties}> = ({
  delay = 0, from = 60, children, style,
}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const sp = spring({frame: frame - delay, fps, config: {damping: 16, stiffness: 150}});
  if (frame < delay) return null;
  return (
    <div style={{
      opacity: interpolate(sp, [0, 1], [0, 1]),
      transform: `translateX(${(1 - sp) * from}px)`,
      ...style,
    }}>
      {children}
    </div>
  );
};

// 慢速打字机：cps=0.55（约 16.5 字/秒），光标随帧闪烁，只在当前敲入行
const TypeTokens: React.FC<{
  tokens: {t: string; c: string}[]; start: number; cps?: number; fontSize?: number;
}> = ({tokens, start, cps = 0.55, fontSize = 40}) => {
  const frame = useCurrentFrame();
  const total = tokens.reduce((a, t) => a + t.t.length, 0);
  const shown = Math.max(0, Math.min(total, Math.floor((frame - start) * cps)));
  let used = 0;
  const parts: React.ReactNode[] = [];
  let cursor: React.ReactNode = null;
  tokens.forEach((tk, i) => {
    const a = used;
    const b = used + tk.t.length;
    if (shown > a) {
      const vis = tk.t.slice(0, Math.min(tk.t.length, shown - a));
      parts.push(<span key={i} style={{color: tk.c}}>{vis}</span>);
      if (shown < b && cursor === null) cursor = <span key={"c" + i} style={{color: INK}}>▌</span>;
    }
    used = b;
  });
  return <span style={{fontSize, fontFamily: MONO, fontWeight: 800, whiteSpace: "pre"}}>{parts}{cursor}</span>;
};

// 终端：满宽大窗（≥1560）
const Terminal: React.FC<{
  x: number; y: number; w: number; children: React.ReactNode;
}> = ({x, y, w, children}) => (
  <div style={{position: "absolute", left: x, top: y, width: w}}>
    <div style={{
      backgroundColor: CARD, borderRadius: 18, overflow: "hidden",
      border: `2px solid ${BORDER}`, boxShadow: "0 20px 50px rgba(0,0,0,0.35)",
    }}>
      <div style={{
        height: 58, backgroundColor: "#272e3d", display: "flex", alignItems: "center",
        paddingLeft: 26, gap: 11, borderBottom: `2px solid ${BORDER}`,
      }}>
        <span style={{width: 16, height: 16, borderRadius: 999, backgroundColor: "#d97e5a"}} />
        <span style={{width: 16, height: 16, borderRadius: 999, backgroundColor: "#d9a75a"}} />
        <span style={{width: 16, height: 16, borderRadius: 999, backgroundColor: "#8aa876"}} />
        <span style={{marginLeft: 16, fontSize: 23, color: SUB, fontFamily: MONO}}>xiaoqiu@dev: ~</span>
      </div>
      <div style={{padding: "32px 50px"}}>{children}</div>
    </div>
  </div>
);

// 对称双卡
const InfoCard: React.FC<{
  x: number; y: number; w: number; delay: number; title: React.ReactNode; lines: string[];
}> = ({x, y, w, delay, title, lines}) => (
  <SlideIn delay={delay} from={70} style={{position: "absolute", left: x, top: y, width: w}}>
    <div style={{
      backgroundColor: CARD, borderRadius: 16, border: `2px solid ${BORDER}`,
      borderLeft: `6px solid ${ORANGE}`,
      boxShadow: "0 12px 30px rgba(0,0,0,0.3)", padding: "24px 34px",
    }}>
      <div style={{fontSize: 32, fontWeight: 900, color: INK, fontFamily: YAHEI, marginBottom: 8, whiteSpace: "nowrap"}}>{title}</div>
      {lines.map((l, i) => (
        <div key={i} style={{fontSize: 28, color: SUB, fontFamily: YAHEI, lineHeight: 1.6, whiteSpace: "nowrap"}}>{l}</div>
      ))}
    </div>
  </SlideIn>
);

// 标题区：页边界帧即完整呈现（禁入场动画）
const Head: React.FC<{n: string; title: React.ReactNode; sub: string}> = ({n, title, sub}) => (
  <div style={{position: "absolute", top: 48, left: 0, width: 1920, textAlign: "center"}}>
    <div style={{display: "flex", justifyContent: "center", alignItems: "center", gap: 24}}>
      <div style={{
        width: 62, height: 62, borderRadius: 15, backgroundColor: ORANGE_D, color: "#fff",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 34, fontWeight: 900, fontFamily: MONO, boxShadow: "0 8px 20px rgba(0,0,0,0.3)",
        flexShrink: 0,
      }}>{n}</div>
      <div style={{fontSize: 52, fontWeight: 900, color: INK, fontFamily: YAHEI, letterSpacing: 2, whiteSpace: "nowrap"}}>{title}</div>
    </div>
    <div style={{fontSize: 27, color: SUB, fontFamily: YAHEI, marginTop: 12, letterSpacing: 4}}>{sub}</div>
  </div>
);

// 对勾 / 叉（docker 色域内：橙=放行/通，红=拦/断）
const MarkOk: React.FC<{x: number; y: number; s?: number}> = ({x, y, s = 1}) => (
  <svg width={60 * s} height={60 * s} viewBox="0 0 60 60"
    style={{position: "absolute", left: x - 30 * s, top: y - 30 * s, overflow: "visible"}}>
    <circle cx={30} cy={30} r={28} fill={ORANGE_D} />
    <path d="M17 31 L26 40 L43 21" fill="none" stroke="#fff" strokeWidth={7} strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
const MarkBad: React.FC<{x: number; y: number; s?: number}> = ({x, y, s = 1}) => (
  <svg width={60 * s} height={60 * s} viewBox="0 0 60 60"
    style={{position: "absolute", left: x - 30 * s, top: y - 30 * s, overflow: "visible"}}>
    <circle cx={30} cy={30} r={28} fill={RED} />
    <path d="M20 20 L40 40 M40 20 L20 40" stroke="#fff" strokeWidth={7} strokeLinecap="round" />
  </svg>
);

const BlinkCursor: React.FC = () => {
  const frame = useCurrentFrame();
  return <span style={{color: ORANGE, opacity: frame % 30 < 15 ? 1 : 0.15}}>▌</span>;
};

// ============ 页面（frame 全局绝对帧，词锚来自 WORDS） ============

// P1 封面（第 0 帧完整海报：标题 + 满宽终端 + CTA 胶囊 + 落款，全 STATIC）
const SceneHook: React.FC = () => (
  <AbsoluteFill>
      <div style={{position: "absolute", top: 92, left: 0, width: 1920, textAlign: "center"}}>
        <div style={{fontSize: 88, fontWeight: 900, fontFamily: YAHEI, letterSpacing: 4, whiteSpace: "nowrap", color: INK}}>
          ping 得通，<span style={{color: RED}}>网页却打不开</span>？
        </div>
        <div style={{fontSize: 30, color: SUB, fontFamily: YAHEI, marginTop: 16, letterSpacing: 6}}>
          路没坏，坏的可能只是门
        </div>
      </div>
      <Terminal x={180} y={292} w={1560}>
        <div style={{fontSize: 42, fontFamily: MONO, fontWeight: 800}}>
          <span style={{color: ORANGE}}>$ </span>
          <span style={{color: INK}}>ping 1.2.3.4</span>
          <BlinkCursor />
        </div>
        <div style={{fontSize: 29, fontFamily: MONO, fontWeight: 700, color: SUB, whiteSpace: "pre", lineHeight: 2.0, marginTop: 12}}>
          {"64 bytes from 1.2.3.4: icmp_seq=1 ttl=56 time=13.2 ms"}
        </div>
        <div style={{fontSize: 29, fontFamily: MONO, fontWeight: 700, color: SUB, whiteSpace: "pre", lineHeight: 2.0}}>
          {"64 bytes from 1.2.3.4: icmp_seq=2 ttl=56 time=12.8 ms"}
        </div>
      </Terminal>
      <div style={{position: "absolute", top: 806, left: 0, width: 1920, display: "flex", justifyContent: "center"}}>
        <div style={{
          backgroundColor: ORANGE_D, color: "#fff", borderRadius: 999, padding: "14px 54px",
          fontSize: 34, fontWeight: 900, fontFamily: YAHEI, letterSpacing: 8,
          boxShadow: "0 16px 36px rgba(0,0,0,0.35)", whiteSpace: "nowrap",
        }}>真凶藏在端口后面</div>
      </div>
      <div style={{position: "absolute", top: 906, left: 0, width: 1920, textAlign: "center"}}>
        <div style={{fontSize: 28, color: SUB, fontFamily: YAHEI, letterSpacing: 3, whiteSpace: "nowrap"}}>全栈小秋 · 0 基础也能学会</div>
      </div>
  </AbsoluteFill>
);

// P2 路通 ≠ 门开
const SceneRoadGate: React.FC = () => (
  <AbsoluteFill>
    <Head n="1" title="ping 通，只代表路是通的" sub="不代表门也开着" />
    {/* 左卡：路通（对称双卡） */}
    <div style={{position: "absolute", left: 210, top: 300, width: 700, height: 380}}>
      <div style={{
        backgroundColor: CARD, borderRadius: 18, border: `2px solid ${BORDER}`,
        borderLeft: `6px solid ${ORANGE}`, boxShadow: "0 12px 30px rgba(0,0,0,0.3)",
        padding: "30px 40px", height: "100%",
      }}>
        <div style={{fontSize: 36, fontWeight: 900, color: INK, fontFamily: YAHEI, whiteSpace: "nowrap"}}>
          ping 通 ＝ <span style={{color: ORANGE}}>路通</span>
        </div>
        <svg width={600} height={190} viewBox="0 0 600 190" style={{marginTop: 26, overflow: "visible"}}>
          <rect x={30} y={70} width={90} height={70} rx={12} fill="#272e3d" stroke={BORDER} strokeWidth={3} />
          <rect x={480} y={70} width={90} height={70} rx={12} fill="#272e3d" stroke={BORDER} strokeWidth={3} />
          <text x={75} y={112} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={24} fill={INK}>你</text>
          <text x={525} y={112} textAnchor="middle" fontFamily={MONO} fontWeight={800} fontSize={24} fill={INK}>服务器</text>
          <line x1={130} y1={105} x2={470} y2={105} stroke={ORANGE} strokeWidth={8} strokeLinecap="round" />
          <circle cx={300} cy={105} r={12} fill={ORANGE} />
        </svg>
        <div style={{fontSize: 28, color: SUB, fontFamily: YAHEI, whiteSpace: "nowrap"}}>两台机器之间，包能来回跑</div>
      </div>
    </div>
    {/* 右卡：门没开 */}
    <div style={{position: "absolute", left: 1010, top: 300, width: 700, height: 380}}>
      <div style={{
        backgroundColor: CARD, borderRadius: 18, border: `2px solid ${BORDER}`,
        borderLeft: `6px solid ${RED}`, boxShadow: "0 12px 30px rgba(0,0,0,0.3)",
        padding: "30px 40px", height: "100%",
      }}>
        <div style={{fontSize: 36, fontWeight: 900, color: INK, fontFamily: YAHEI, whiteSpace: "nowrap"}}>
          网页要的是 <span style={{color: RED}}>门也开</span>
        </div>
        <div style={{position: "relative", marginTop: 26, width: 600, height: 190}}>
          <svg width={600} height={190} viewBox="0 0 600 190" style={{overflow: "visible"}}>
            <rect x={210} y={30} width={180} height={150} rx={10} fill="#272e3d" stroke={BORDER} strokeWidth={3} />
            <rect x={268} y={70} width={64} height={110} rx={8} fill={CARD} stroke={RED} strokeWidth={4} />
            <circle cx={322} cy={130} r={5} fill={RED} />
          </svg>
          <PopAt f={wordAt(WORDS, 1, "门") - 4}>
            <div style={{position: "absolute", left: 360, top: 30, width: 70, height: 70}}>
              <MarkBad x={35} y={35} s={1.1} />
            </div>
          </PopAt>
        </div>
        <div style={{fontSize: 28, color: SUB, fontFamily: YAHEI, whiteSpace: "nowrap"}}>门关着，包送到门口也进不去</div>
      </div>
    </div>
    <PopAt f={wordAt(WORDS, 1, "通") - 4}>
      <div style={{
        position: "absolute", top: 770, left: 0, width: 1920, display: "flex", justifyContent: "center",
      }}>
        <div style={{
          backgroundColor: TINT, border: `3px solid ${ORANGE}`, borderRadius: 999,
          padding: "14px 60px", fontSize: 38, fontWeight: 900, color: ORANGE,
          fontFamily: YAHEI, letterSpacing: 6, whiteSpace: "nowrap",
        }}>路通 ≠ 门开</div>
      </div>
    </PopAt>
  </AbsoluteFill>
);

// P3 两条不同的通道：ICMP vs TCP 80/443
const SceneChannels: React.FC = () => (
  <AbsoluteFill>
    <Head n="2" title="两条不同的通道" sub="ping 与网页，走的根本不是一条路" />
    {/* 上：ICMP 通道 */}
    <div style={{position: "absolute", left: 310, top: 270, width: 1300, height: 180}}>
      <div style={{
        backgroundColor: CARD, borderRadius: 18, border: `3px solid ${BORDER}`,
        boxShadow: "0 12px 30px rgba(0,0,0,0.3)", padding: "26px 44px", height: "100%",
        display: "flex", alignItems: "center", gap: 40,
      }}>
        <div style={{width: 420, fontFamily: MONO, fontWeight: 900, fontSize: 44, color: INK, whiteSpace: "nowrap"}}>
          <PopAt f={wordAt(WORDS, 2, "ICMP") - 4}><span style={{color: ORANGE}}>ICMP</span></PopAt>
        </div>
        <div style={{position: "relative", width: 620, height: 90}}>
          <svg width={620} height={90} viewBox="0 0 620 90" style={{overflow: "visible"}}>
            <line x1={10} y1={45} x2={560} y2={45} stroke={ORANGE} strokeWidth={8} strokeLinecap="round" />
            <path d="M560 45 L530 28 L530 62 Z" fill={ORANGE} />
            <circle cx={300} cy={45} r={14} fill={ORANGE} />
          </svg>
          <div style={{position: "absolute", left: 540, top: 8, width: 70, height: 70}}>
            <MarkOk x={35} y={35} s={1.05} />
          </div>
        </div>
        <div style={{fontFamily: YAHEI, fontWeight: 700, fontSize: 28, color: SUB, whiteSpace: "nowrap"}}>ping 在这走</div>
      </div>
    </div>
    {/* 下：TCP 通道 */}
    <div style={{position: "absolute", left: 310, top: 500, width: 1300, height: 180}}>
      <div style={{
        backgroundColor: CARD, borderRadius: 18, border: `3px solid ${BORDER}`,
        boxShadow: "0 12px 30px rgba(0,0,0,0.3)", padding: "26px 44px", height: "100%",
        display: "flex", alignItems: "center", gap: 40,
      }}>
        <div style={{width: 420, fontFamily: MONO, fontWeight: 900, fontSize: 44, color: INK, whiteSpace: "nowrap"}}>
          <PopAt f={wordAt(WORDS, 2, "TCP") - 4}>
            <span><span style={{color: RED}}>TCP</span><span style={{fontSize: 30, color: SUB}}> 端口 </span></span>
          </PopAt>
        </div>
        <div style={{position: "relative", width: 620, height: 90, display: "flex", alignItems: "center", gap: 26}}>
          <PopAt f={wordAt(WORDS, 2, "80") - 4}>
            <div style={{
              width: 130, height: 70, borderRadius: 12, backgroundColor: RED_BG,
              border: `3px solid ${RED}`, display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <div style={{fontFamily: MONO, fontWeight: 900, fontSize: 34, color: RED, whiteSpace: "nowrap"}}>80</div>
            </div>
          </PopAt>
          <PopAt f={wordAt(WORDS, 2, "443") - 4}>
            <div style={{
              width: 130, height: 70, borderRadius: 12, backgroundColor: RED_BG,
              border: `3px solid ${RED}`, display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <div style={{fontFamily: MONO, fontWeight: 900, fontSize: 34, color: RED, whiteSpace: "nowrap"}}>443</div>
            </div>
          </PopAt>
          <div style={{position: "relative", width: 70, height: 70, flexShrink: 0}}>
            <MarkBad x={35} y={35} s={1.05} />
          </div>
        </div>
        <div style={{fontFamily: YAHEI, fontWeight: 700, fontSize: 28, color: SUB, whiteSpace: "nowrap"}}>网页在这走</div>
      </div>
    </div>
    <PopAt f={wordAt(WORDS, 2, "端口") - 4}>
      <div style={{
        position: "absolute", top: 780, left: 0, width: 1920, display: "flex", justifyContent: "center",
      }}>
        <div style={{
          backgroundColor: TINT, border: `2px solid ${BORDER}`, borderRadius: 999,
          padding: "12px 52px", fontSize: 34, fontWeight: 900, color: INK,
          fontFamily: YAHEI, letterSpacing: 4, whiteSpace: "nowrap",
        }}>网页的通道：TCP 80 / 443</div>
      </div>
    </PopAt>
  </AbsoluteFill>
);

// P4 比喻：进了小区 ≠ 那户人家开门（简笔小区 + 门牌）
const SceneCommunity: React.FC = () => (
  <AbsoluteFill>
    <Head n="3" title="打个比方" sub="ping 通 ＝ 进了小区；网页打不开 ＝ 那户人家门没开" />
    <div style={{position: "absolute", left: 310, top: 280, width: 1300, height: 420}}>
      <div style={{
        backgroundColor: CARD, borderRadius: 18, border: `2px solid ${BORDER}`,
        boxShadow: "0 12px 30px rgba(0,0,0,0.3)", height: "100%", position: "relative",
      }}>
        <svg width={1300} height={420} viewBox="0 0 1300 420" style={{overflow: "visible"}}>
          {/* 地面 */}
          <line x1={60} y1={360} x2={1240} y2={360} stroke={BORDER} strokeWidth={5} strokeLinecap="round" />
          {/* 小区大门（左） */}
          <rect x={130} y={140} width={36} height={220} rx={8} fill={ORANGE_D} />
          <rect x={330} y={140} width={36} height={220} rx={8} fill={ORANGE_D} />
          <path d="M110 150 Q248 60 386 150 L386 176 L110 176 Z" fill={ORANGE_D} />
          <rect x={196} y={176} width={104} height={184} rx={6} fill="none" stroke={ORANGE} strokeWidth={4} strokeDasharray="10 8" />
          {/* 门牌 */}
          <rect x={176} y={86} width={144} height={52} rx={10} fill={CARD} stroke={ORANGE} strokeWidth={4} />
          <text x={248} y={122} textAnchor="middle" fontFamily={YAHEI} fontWeight={900} fontSize={30} fill={INK}>幸福小区</text>
          {/* 路 */}
          <line x1={420} y1={300} x2={900} y2={300} stroke={BORDER} strokeWidth={8} strokeLinecap="round" strokeDasharray="22 18" />
          {/* ping 小人进门 */}
          <circle cx={560} cy={220} r={22} fill="#f6cfa4" stroke={INK} strokeWidth={4} />
          <rect x={538} y={244} width={44} height={54} rx={16} fill={ORANGE} />
          {/* 住户楼（右） */}
          <rect x={920} y={180} width={260} height={180} rx={10} fill="#272e3d" stroke={BORDER} strokeWidth={3} />
          <path d="M900 184 L1050 96 L1200 184 Z" fill={ORANGE_D} />
          <rect x={970} y={220} width={54} height={50} rx={6} fill={BORDER} />
          <rect x={1076} y={220} width={54} height={50} rx={6} fill={BORDER} />
          {/* 那户的门（关着） */}
          <rect x={1022} y={280} width={56} height={80} rx={6} fill={CARD} stroke={RED} strokeWidth={4} />
          <circle cx={1066} cy={322} r={4.5} fill={RED} />
        </svg>
        {/* ping 进了小区（说到「小区」） */}
        <PopAt f={wordAt(WORDS, 3, "小区") - 4}>
          <div style={{position: "absolute", left: 200, top: 60, width: 80, height: 80}}>
            <MarkOk x={40} y={40} s={1.15} />
          </div>
        </PopAt>
        {/* 那户门没开（说到「门」） */}
        <PopAt f={wordAt(WORDS, 3, "门") - 4}>
          <div style={{position: "absolute", left: 1080, top: 210, width: 80, height: 80}}>
            <MarkBad x={40} y={40} s={1.15} />
          </div>
        </PopAt>
      </div>
    </div>
    <PopAt f={wordAt(WORDS, 3, "打") - 4}>
      <div style={{
        position: "absolute", top: 780, left: 0, width: 1920, display: "flex", justifyContent: "center",
      }}>
        <div style={{
          backgroundColor: TINT, border: `2px solid ${BORDER}`, borderRadius: 999,
          padding: "12px 52px", fontSize: 34, fontWeight: 900, color: INK,
          fontFamily: YAHEI, letterSpacing: 4, whiteSpace: "nowrap",
        }}>ping 能进小区，网页敲不开那扇门</div>
      </div>
    </PopAt>
  </AbsoluteFill>
);

// P5 三真凶（三卡并列；空卡轮廓随页首呈现，卡体按口播弹入）
const SceneCulprits: React.FC = () => {
  const frame = useCurrentFrame();
  const cards = [
    {x: 210, at: wordAt(WORDS, 4, "服务") - 4, n: "1", title: "服务没启动", body: "status"},
    {x: 710, at: wordAt(WORDS, 4, "防火墙") - 4, n: "2", title: "防火墙拦 TCP 放行 ICMP", body: "firewall"},
    {x: 1210, at: wordAt(WORDS, 4, "端口") - 4, n: "3", title: "端口没对外开放", body: "port"},
  ];
  return (
    <AbsoluteFill>
      <Head n="4" title="最常见的真凶有三个" sub="一个一个对号入座" />
      {/* 空卡轮廓：页边界帧即有内容，不空场 */}
      {cards.map((c, i) => (
        <div key={`ph-${i}`} style={{position: "absolute", left: c.x, top: 300, width: 500, height: 400}}>
          {frame >= c.at ? null : (
            <div style={{
              border: `3px dashed ${BORDER}`, borderRadius: 18, height: "100%",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <span style={{fontSize: 30, color: BORDER, fontFamily: YAHEI, fontWeight: 900, letterSpacing: 8}}>{`真凶 ${c.n}`}</span>
            </div>
          )}
        </div>
      ))}
      {cards.map((c, i) => (
        <SlideIn key={i} delay={c.at} from={70} style={{position: "absolute", left: c.x, top: 300, width: 500}}>
          <div style={{
            backgroundColor: CARD, borderRadius: 18, border: `2px solid ${BORDER}`,
            borderTop: `6px solid ${ORANGE}`, boxShadow: "0 12px 30px rgba(0,0,0,0.3)",
            padding: "28px 32px", minHeight: 400,
          }}>
            <div style={{display: "flex", alignItems: "center", gap: 18, width: 436}}>
              <div style={{
                width: 50, height: 50, borderRadius: 12, backgroundColor: ORANGE_D, color: "#fff",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 28, fontWeight: 900, fontFamily: MONO, flexShrink: 0,
              }}>{c.n}</div>
              <div style={{
                fontSize: c.body === "firewall" ? 29 : 32, fontWeight: 900, color: INK,
                fontFamily: YAHEI, whiteSpace: "nowrap",
              }}>{c.title}</div>
            </div>
            <div style={{marginTop: 26}}>
              {c.body === "status" ? (
                <div style={{fontFamily: MONO, fontWeight: 700, fontSize: 26, color: SUB, whiteSpace: "pre", lineHeight: 2.0}}>
                  {"$ systemctl status web\n"}
                  <span style={{color: RED, fontWeight: 900}}>{"Active: inactive (dead)"}</span>
                </div>
              ) : null}
              {c.body === "firewall" ? (
                <div style={{fontFamily: MONO, fontWeight: 800, fontSize: 27, whiteSpace: "pre", lineHeight: 2.3}}>
                  <span style={{color: ORANGE}}>{"ICMP  ✓ 放行\n"}</span>
                  <span style={{color: RED}}>{"TCP    ✗ 全部拦截"}</span>
                </div>
              ) : null}
              {c.body === "port" ? (
                <div style={{fontFamily: MONO, fontWeight: 700, fontSize: 26, color: SUB, whiteSpace: "pre", lineHeight: 2.0}}>
                  {"PORT      STATE\n"}
                  <span style={{color: INK}}>{"22        open\n"}</span>
                  <span style={{color: RED, fontWeight: 900}}>{"443       closed"}</span>
                </div>
              ) : null}
            </div>
          </div>
        </SlideIn>
      ))}
      <Pop delay={wordAt(WORDS, 4, "端口") + 14} style={{
        position: "absolute", top: 806, left: 0, width: 1920, display: "flex", justifyContent: "center",
      }}>
        <div style={{
          backgroundColor: CARD, border: `2px solid ${BORDER}`, borderRadius: 999,
          padding: "10px 44px", fontSize: 30, fontWeight: 900, color: SUB,
          fontFamily: YAHEI, letterSpacing: 4, whiteSpace: "nowrap",
        }}>路是好的 · 服务 / 防火墙 / 端口，挨个查</div>
      </Pop>
    </AbsoluteFill>
  );
};

// P6 经典现场：新防火墙（ping 全通 + curl 卡在 TCP）
const SceneFirewall: React.FC = () => {
  // 全部时点由词锚推导
  const pingAt = wordAt(WORDS, 5, "新") - 6;               // 敲 ping
  const pingLen = Math.ceil(14 / 0.55);                     // "$ ping 1.2.3.4"
  const r1 = pingAt + pingLen + 4;
  const r2 = r1 + 12;
  const curlAt = wordAt(WORDS, 5, "拦截");                  // 敲 curl
  const curlLen = Math.ceil(29 / 0.55);                     // "$ curl -v https://example.com"
  const tryingAt = curlAt + curlLen + 4;
  const badgeAt = wordAt(WORDS, 5, "网页") - 4;
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill>
      <Head n="5" title="经典现场：新配的防火墙" sub="默认放行 ping，拦下所有端口" />
      <Terminal x={180} y={222} w={1560}>
        {/* ping：说到「新配」开始敲 */}
        {frame >= pingAt ? (
          <TypeTokens tokens={[{t: "$ ", c: ORANGE}, {t: "ping 1.2.3.4", c: INK}]} start={pingAt} fontSize={40} />
        ) : null}
        {frame >= r1 ? (
          <FadeUp at={r1} style={{fontSize: 27, fontFamily: MONO, fontWeight: 700, color: SUB, whiteSpace: "pre", lineHeight: 2.0, marginTop: 10}}>
            {"64 bytes from 1.2.3.4: icmp_seq=1 ttl=56 time=13.2 ms"}
          </FadeUp>
        ) : null}
        {frame >= r2 ? (
          <FadeUp at={r2} style={{fontSize: 27, fontFamily: MONO, fontWeight: 700, color: SUB, whiteSpace: "pre", lineHeight: 2.0}}>
            {"64 bytes from 1.2.3.4: icmp_seq=2 ttl=56 time=12.8 ms"}
          </FadeUp>
        ) : null}
        {/* curl：说到「拦截」开始敲；未敲不渲染 */}
        {frame >= curlAt ? (
          <div style={{marginTop: 24}}>
            <TypeTokens tokens={[{t: "$ ", c: ORANGE}, {t: "curl -v https://example.com", c: INK}]} start={curlAt} fontSize={40} />
          </div>
        ) : null}
        {frame >= tryingAt ? (
          <FadeUp at={tryingAt} style={{fontSize: 28, fontFamily: MONO, fontWeight: 700, color: SUB, whiteSpace: "pre", lineHeight: 2.0, marginTop: 10}}>
            <span>{"* Trying 93.184.216.34:443..."}</span>
            <BlinkCursor />
          </FadeUp>
        ) : null}
        {/* 卡在 TCP 连接（说到「打不开」砸出） */}
        {frame >= badgeAt ? (
          <div style={{marginTop: 18}}>
            <span style={{
              color: RED, backgroundColor: RED_BG, border: `2px solid ${RED}`,
              padding: "8px 22px", borderRadius: 10, display: "inline-block",
              fontSize: 29, fontFamily: YAHEI, fontWeight: 900, whiteSpace: "nowrap",
              transform: `scale(${1 + Math.sin(Math.max(0, frame - badgeAt) / 5) * 0.04})`,
            }}>卡在 TCP 连接 · 一个包都进不来</span>
          </div>
        ) : null}
      </Terminal>
      <InfoCard x={210} y={796} w={700} delay={r2 + 12}
        title="ICMP：一路绿灯"
        lines={["ping 怎么发怎么通"]} />
      <InfoCard x={1010} y={796} w={700} delay={badgeAt}
        title="TCP 80 / 443：全部超时"
        lines={["网页的通道被防火墙拦死"]} />
    </AbsoluteFill>
  );
};

// P7 换工具，探端口（telnet 探 443 被拒）
const SceneProbe: React.FC = () => {
  const telnetAt = wordAt(WORDS, 6, "工具");                // 敲 telnet
  const telnetLen = Math.ceil(27 / 0.55);                   // "$ telnet 208.80.154.224 443"
  const tryAt = telnetAt + telnetLen + 3;
  const refusedAt = tryAt + 9;
  const pillAt = wordAt(WORDS, 6, "探端口") - 4;
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill>
      <Head n="6" title="换工具，探端口" sub="telnet / curl，探通了才算真通" />
      <Terminal x={180} y={222} w={1560}>
        {frame >= telnetAt ? (
          <TypeTokens tokens={[{t: "$ ", c: ORANGE}, {t: "telnet 208.80.154.224 443", c: INK}]} start={telnetAt} fontSize={40} />
        ) : null}
        {frame >= tryAt ? (
          <FadeUp at={tryAt} style={{fontSize: 28, fontFamily: MONO, fontWeight: 700, color: SUB, whiteSpace: "pre", lineHeight: 2.1, marginTop: 14}}>
            {"Trying 208.80.154.224..."}
          </FadeUp>
        ) : null}
        {frame >= refusedAt ? (
          <FadeUp at={refusedAt} style={{fontSize: 30, fontFamily: MONO, fontWeight: 900, whiteSpace: "pre", lineHeight: 2.1}}>
            <span style={{
              color: RED, backgroundColor: RED_BG, border: `2px solid ${RED}`,
              padding: "6px 18px", borderRadius: 8, display: "inline-block",
            }}>{"telnet: Connection refused"}</span>
          </FadeUp>
        ) : null}
        {frame >= refusedAt + 14 ? (
          <FadeUp at={refusedAt + 14} style={{fontSize: 27, fontFamily: MONO, fontWeight: 700, color: SUB, whiteSpace: "pre", lineHeight: 2.1, marginTop: 12}}>
            {"# 端口没开：路通，但这扇门是锁的"}
          </FadeUp>
        ) : null}
      </Terminal>
      <InfoCard x={210} y={742} w={700} delay={refusedAt}
        title="Connection refused"
        lines={["机器在，端口后面没人应答"]} />
      <InfoCard x={1010} y={742} w={700} delay={pillAt}
        title="路通 ≠ 端口通"
        lines={["curl -v / telnet 都能探端口"]} />
    </AbsoluteFill>
  );
};

// P8 金句（铁律⑫：此段停用底部字幕）
const SceneMotto: React.FC = () => (
  <AbsoluteFill>
    <Head n="★" title="一句话记住" sub="" />
    <div style={{position: "absolute", top: 330, left: 0, width: 1920, textAlign: "center"}}>
      <Pop delay={wordAt(WORDS, 7, "ping") - 4}>
        <div style={{fontSize: 92, fontWeight: 900, fontFamily: YAHEI, color: INK, letterSpacing: 8, whiteSpace: "nowrap"}}>
          ping 通证明<span style={{color: ORANGE}}>路通</span>
        </div>
      </Pop>
    </div>
    <div style={{position: "absolute", top: 540, left: 0, width: 1920, textAlign: "center"}}>
      <Pop delay={wordAt(WORDS, 7, "端口") - 4}>
        <div style={{fontSize: 92, fontWeight: 900, fontFamily: YAHEI, color: INK, letterSpacing: 8, whiteSpace: "nowrap"}}>
          端口通才是<span style={{color: ORANGE}}>门开</span>
        </div>
      </Pop>
    </div>
  </AbsoluteFill>
);

// P9 结尾亮底截图卡（kit EndingCard，页首即呈现，静置到片尾）
const SceneCard: React.FC = () => (
  <AbsoluteFill>
    <EndingCard
      startFrame={SENT[8]}
      title="ping通 打不开 · 排查卡"
      rows={[
        "ping ＝ ICMP 探路，只证明路通",
        "网页 ＝ TCP 80 / 443，门开才进得去",
        "验证：telnet IP 443 / curl -v",
      ]}
    />
  </AbsoluteFill>
);

// ============ 组装 ============

const SCENES: {C: React.FC; from: number; dur: number}[] = [
  {C: SceneHook, from: SENT[0], dur: SENT[1] - SENT[0]},
  {C: SceneRoadGate, from: SENT[1], dur: SENT[2] - SENT[1]},
  {C: SceneChannels, from: SENT[2], dur: SENT[3] - SENT[2]},
  {C: SceneCommunity, from: SENT[3], dur: SENT[4] - SENT[3]},
  {C: SceneCulprits, from: SENT[4], dur: SENT[5] - SENT[4]},
  {C: SceneFirewall, from: SENT[5], dur: SENT[6] - SENT[5]},
  {C: SceneProbe, from: SENT[6], dur: SENT[7] - SENT[6]},
  {C: SceneMotto, from: SENT[7], dur: SENT[8] - SENT[7]},
  {C: SceneCard, from: SENT[8], dur: DUR - SENT[8]},
];

// 打字键击音：命令打字窗口内每 6 帧一声轻 click
const typeWindows: Array<[number, number]> = [
  [wordAt(WORDS, 5, "新") - 6, wordAt(WORDS, 5, "新") - 6 + 26],
  [wordAt(WORDS, 5, "拦截"), wordAt(WORDS, 5, "拦截") + 53],
  [wordAt(WORDS, 6, "工具"), wordAt(WORDS, 6, "工具") + 50],
];
const clickFrames: number[] = [];
for (const [a, b] of typeWindows) {
  for (let f = a; f <= b; f += 6) clickFrames.push(f);
}

// 音效层（全部由 SENT / 词锚推导）
const SFX: {f: number; w: string; v: number}[] = [
  ...SENT.slice(1).map((f) => ({f, w: "page3.wav", v: 0.28})),
  {f: wordAt(WORDS, 1, "通"), w: "ding.wav", v: 0.26},
  {f: wordAt(WORDS, 1, "门"), w: "alert.wav", v: 0.24},
  {f: wordAt(WORDS, 2, "ICMP"), w: "pop.wav", v: 0.26},
  {f: wordAt(WORDS, 2, "TCP"), w: "error.wav", v: 0.24},
  {f: wordAt(WORDS, 3, "小区"), w: "pop.wav", v: 0.26},
  {f: wordAt(WORDS, 3, "门"), w: "alert.wav", v: 0.24},
  {f: wordAt(WORDS, 4, "服务"), w: "pop.wav", v: 0.26},
  {f: wordAt(WORDS, 4, "防火墙"), w: "pop.wav", v: 0.26},
  {f: wordAt(WORDS, 4, "端口"), w: "pop.wav", v: 0.26},
  {f: wordAt(WORDS, 5, "网页"), w: "alert.wav", v: 0.26},
  {f: wordAt(WORDS, 6, "探端口"), w: "ding.wav", v: 0.26},
  {f: wordAt(WORDS, 7, "ping"), w: "ding.wav", v: 0.28},
  {f: wordAt(WORDS, 7, "端口"), w: "ding.wav", v: 0.28},
  {f: SENT[8] + 6, w: "success.wav", v: 0.24},
];

// 铁律⑫（组件级判断）：金句时段 [SENT[7], SENT[8]) 整个字幕条不渲染。
// 不做 SUBS 数组过滤——字幕条显示"最近一条 f<=frame"，滤短语会让上一条挂屏到结尾。
const Subtitles: React.FC = () => {
  const frame = useCurrentFrame();
  if (frame >= SENT[7] && frame < SENT[8]) return null;
  return <SubtitleBar subs={SUBS} />;
};

export const PingOpenFail: React.FC = () => {
  const frame = useCurrentFrame();
  const bedVolume = interpolate(frame, [0, 20, DUR - 130, DUR - 100, DUR - 26, DUR - 1], [0, 0.06, 0.06, 0.1, 0.17, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return (
    <AbsoluteFill style={{backgroundColor: BG, fontFamily: YAHEI, overflow: "hidden"}}>
      {SCENES.map(({C, from, dur}, i) => (
        <HardPage key={i} from={from} duration={dur}>
          <C />
        </HardPage>
      ))}
      {/* 顶部橙色进度条 + 右上角品牌角标 */}
      <div style={{
        position: "absolute", top: 0, left: 0, height: 6, backgroundColor: ORANGE,
        width: `${(frame / DUR) * 100}%`, zIndex: 10,
      }} />
      <BrandCorner light={false} />
      {/* 配音 */}
      {SENT.map((start, i) => (
        <Sequence key={`vo-${i}`} from={start} durationInFrames={i < 8 ? SENT[i + 1] - start + 10 : DUR - start}>
          <Audio src={staticFile(`audio/b10pingopen-tts/s0${i + 1}.mp3`)} volume={1} />
        </Sequence>
      ))}
      {SFX.map((s, i) => (
        <Sequence key={`sfx-${i}`} from={s.f} durationInFrames={26}>
          <Audio src={staticFile(`audio/sfx/${s.w}`)} volume={s.v} />
        </Sequence>
      ))}
      {clickFrames.map((f) => (
        <Sequence key={`c${f}`} from={f} durationInFrames={6}>
          <Audio src={staticFile("audio/sfx/click.wav")} volume={0.16} />
        </Sequence>
      ))}
      <Audio src={staticFile("audio/bed.wav")} loop volume={() => bedVolume} />
      {/* 铁律⑫：金句时段不渲染底部字幕 */}
      <Subtitles />
    </AbsoluteFill>
  );
};
