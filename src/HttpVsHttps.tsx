import React from "react";
import {Audio} from "@remotion/media";
import {AbsoluteFill, interpolate, Sequence, staticFile, useCurrentFrame} from "remotion";
import {
  INK, SUBC, BLUE, BLUE_BG, GREEN, GREEN_BG, ORANGE, ORANGE_BG, RED, RED_BG, YEL, BORDER, F, W, H,
  clamp, ease, prog, BgDots, BigTitle, Sparkle, FlashRing, LoopPacket,
  SpeechBubble, Float, MarkOk, MarkBad, FlatPerson, ServerIcon, LockIcon,
} from "./flatKit";

// ============ 扁平可爱插画科普风 · HTTP vs HTTPS（竞争型九页结构，样板 TcpVsUdpFlat / TokenFlat，全栈小秋 IP） ============
// 结构：钩子(两种待遇) → S=Security结论 → HTTP裸奔 → 对暗号换钥匙 → 证书盖章 → 公共WiFi翻车 → 小锁=密封信 → 金句 → 结尾截图卡
// 语义色：蓝 = HTTP/不安全侧，橙 = HTTPS/安全侧，红 = 警告/风险，黄 = 金句强调

export const DUR = 1906;

// 各句配音起始帧（页面边界 = SENT，词级锚点见各页注释）
const SENT = [0, 221, 447, 657, 892, 1183, 1360, 1542, 1729];

type Sub = {s: number; e: number; t: string};
const subs: Sub[] = [
  {s: 3, e: 69, t: "网址开头有小锁和警告"},
  {s: 69, e: 99, t: "两种待遇"},
  {s: 99, e: 150, t: "HTTP 和 HTTPS"},
  {s: 150, e: 186, t: "差的那一个 S"},
  {s: 186, e: 219, t: "到底贵在哪"},
  {s: 225, e: 250, t: "先说结论"},
  {s: 250, e: 294, t: "S 就是 Security"},
  {s: 294, e: 342, t: "多了一层加密信封"},
  {s: 342, e: 395, t: "HTTP 是明信片"},
  {s: 395, e: 445, t: "HTTPS 是密封信"},
  {s: 450, e: 496, t: "HTTP 裸奔的时候"},
  {s: 496, e: 541, t: "你发出去的每一个字"},
  {s: 541, e: 579, t: "途经的路由器"},
  {s: 579, e: 614, t: "咖啡店 WiFi"},
  {s: 614, e: 655, t: "都能原样读走"},
  {s: 660, e: 712, t: "HTTPS 的思路是"},
  {s: 712, e: 749, t: "内容你们随便抄"},
  {s: 749, e: 781, t: "反正看不懂"},
  {s: 781, e: 815, t: "双方先对暗号"},
  {s: 815, e: 890, t: "协商出一把只有彼此知道的钥匙"},
  {s: 895, e: 949, t: "对暗号又靠证书"},
  {s: 949, e: 1006, t: "网站出门先带身份证"},
  {s: 1006, e: 1053, t: "由权威机构盖章"},
  {s: 1053, e: 1108, t: "假网站盖不了这个章"},
  {s: 1108, e: 1180, t: "浏览器就会弹那个红色大警告"},
  {s: 1186, e: 1238, t: "最典型的翻车现场"},
  {s: 1238, e: 1290, t: "就是在公共 WiFi 上"},
  {s: 1290, e: 1358, t: "连着不带小锁的网站输密码"},
  {s: 1363, e: 1442, t: "现在全网 HTTPS 基本普及"},
  {s: 1442, e: 1467, t: "看到小锁"},
  {s: 1467, e: 1539, t: "说明你的密码正在密封信里走"},
  {s: 1545, e: 1617, t: "金句 HTTP 是明信片"},
  {s: 1617, e: 1671, t: "HTTPS 是密封信"},
  {s: 1671, e: 1726, t: "小锁代表路上没人能读"},
  {s: 1732, e: 1821, t: "更多网络基础对比都在主页合集"},
  {s: 1821, e: 1847, t: "点个关注"},
  {s: 1847, e: 1884, t: "下期接着拆"},
];

// ---------- 基础原语（同 TcpVsUdpFlat） ----------

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

// ---------- 主题图形（自旧版 HttpVsHttps 迁移的视觉资产） ----------

// 明信片：HTTP = 内容裸奔
const Postcard: React.FC<{x: number; y: number; s?: number; rot?: number}> = ({x, y, s = 1, rot = 0}) => (
  <svg width={560 * s} height={340 * s} style={{position: "absolute", left: x - 280 * s, top: y - 170 * s, overflow: "visible", transform: `rotate(${rot}deg)`}}>
    <g transform={`scale(${s})`}>
      <rect x={0} y={0} width={560} height={340} rx={16} fill="#fffdf5" stroke="#d8c9a3" strokeWidth={5}/>
      <rect x={452} y={28} width={72} height={84} rx={6} fill={YEL} stroke="#d9a12c" strokeWidth={4}/>
      <path d="M472 48 l11 11 l11 -11 l11 11 l11 -11" stroke="#d9a12c" strokeWidth={4} fill="none"/>
      <circle cx={420} cy={70} r={30} fill="none" stroke={SUBC} strokeWidth={3} strokeDasharray="6 5"/>
      <text x={40} y={82} fontFamily={F} fontSize={26} fill={SUBC}>收件人：你</text>
      <line x1={40} y1={112} x2={400} y2={112} stroke={SUBC} strokeWidth={3}/>
      <line x1={40} y1={152} x2={330} y2={152} stroke={SUBC} strokeWidth={3}/>
      <text x={40} y={258} fontFamily={F} fontWeight={900} fontSize={58} fill={RED}>密码：123456</text>
      <text x={40} y={308} fontFamily={F} fontSize={26} fill={RED}>—— 路上人人都看得到</text>
    </g>
  </svg>
);

// 信封：装进去 + 锁
const Envelope: React.FC<{x: number; y: number; s?: number}> = ({x, y, s = 1}) => (
  <svg width={560 * s} height={340 * s} style={{position: "absolute", left: x - 280 * s, top: y - 170 * s, overflow: "visible"}}>
    <g transform={`scale(${s})`}>
      <rect x={0} y={40} width={560} height={300} rx={16} fill={GREEN_BG} stroke={GREEN} strokeWidth={5}/>
      <path d="M0 56 L280 240 L560 56" fill="none" stroke={GREEN} strokeWidth={6}/>
      <circle cx={280} cy={205} r={54} fill="#fff" stroke={GREEN} strokeWidth={5}/>
      <path d="M 258 190 L 258 178 Q 258 160 280 160 Q 302 160 302 178 L 302 190" fill="none" stroke={INK} strokeWidth={6}/>
      <rect x={246} y={190} width={68} height={54} rx={10} fill={YEL} stroke={INK} strokeWidth={5}/>
      <circle cx={280} cy={214} r={7} fill={INK}/>
      <rect x={276} y={218} width={8} height={14} rx={4} fill={INK}/>
    </g>
  </svg>
);

// 金钥匙
const KeyIcon: React.FC<{x: number; y: number; s?: number; rot?: number}> = ({x, y, s = 1, rot = 0}) => (
  <svg width={120 * s} height={70 * s} style={{position: "absolute", left: x - 60 * s, top: y - 35 * s, overflow: "visible", transform: `rotate(${rot}deg)`}}>
    <g transform={`scale(${s})`}>
      <circle cx={26} cy={35} r={20} fill="none" stroke="#d9a12c" strokeWidth={9}/>
      <line x1={46} y1={35} x2={112} y2={35} stroke="#d9a12c" strokeWidth={9} strokeLinecap="round"/>
      <line x1={96} y1={35} x2={96} y2={52} stroke="#d9a12c" strokeWidth={8} strokeLinecap="round"/>
      <line x1={108} y1={35} x2={108} y2={48} stroke="#d9a12c" strokeWidth={8} strokeLinecap="round"/>
    </g>
  </svg>
);

// 红色警告三角（不安全提示）
const WarnTriangle: React.FC<{x: number; y: number; s?: number}> = ({x, y, s = 1}) => (
  <svg width={90 * s} height={84 * s} style={{position: "absolute", left: x - 45 * s, top: y - 42 * s, overflow: "visible"}}>
    <g transform={`scale(${s})`}>
      <path d="M45 6 L84 76 L6 76 Z" fill={RED} stroke="#fff" strokeWidth={5} strokeLinejoin="round"/>
      <rect x={40} y={28} width={10} height={26} rx={5} fill="#fff"/>
      <circle cx={45} cy={64} r={6} fill="#fff"/>
    </g>
  </svg>
);

// 路由器（途经设备）
const RouterIcon: React.FC<{x: number; y: number; s?: number}> = ({x, y, s = 1}) => (
  <svg width={150 * s} height={110 * s} style={{position: "absolute", left: x - 75 * s, top: y - 55 * s, overflow: "visible"}}>
    <g transform={`scale(${s})`}>
      <rect x={15} y={48} width={120} height={48} rx={14} fill="#55677c"/>
      <line x1={45} y1={48} x2={30} y2={16} stroke="#55677c" strokeWidth={6} strokeLinecap="round"/>
      <line x1={105} y1={48} x2={120} y2={16} stroke="#55677c" strokeWidth={6} strokeLinecap="round"/>
      <circle cx={30} cy={16} r={7} fill={RED}/>
      <circle cx={120} cy={16} r={7} fill={GREEN}/>
      <circle cx={45} cy={72} r={6} fill="#7ee0a3"/>
      <circle cx={70} cy={72} r={6} fill="#7ee0a3"/>
      <rect x={92} y={64} width={30} height={14} rx={4} fill="#aebdd0"/>
    </g>
  </svg>
);

// WiFi 弧线
const WifiIcon: React.FC<{x: number; y: number; s?: number; c?: string}> = ({x, y, s = 1, c = BLUE}) => (
  <svg width={130 * s} height={104 * s} style={{position: "absolute", left: x - 65 * s, top: y - 52 * s, overflow: "visible"}}>
    <g transform={`scale(${s})`}>
      <circle cx={65} cy={92} r={9} fill={c}/>
      <path d="M 40 72 Q 65 52 90 72" fill="none" stroke={c} strokeWidth={9} strokeLinecap="round"/>
      <path d="M 22 52 Q 65 14 108 52" fill="none" stroke={c} strokeWidth={9} strokeLinecap="round"/>
      <path d="M 4 32 Q 65 -22 126 32" fill="none" stroke={c} strokeWidth={9} strokeLinecap="round" opacity={0.55}/>
    </g>
  </svg>
);

// 地址栏（secure=true 绿锁 https；false 红字 http 无锁）
const AddressBar: React.FC<{f: number; delay: number; x: number; y: number; w: number; h: number; secure: boolean; domain?: string}> = ({
  f, delay, x, y, w, h, secure, domain = "shop.com",
}) => {
  const p = prog(f, delay);
  if (p <= 0) return null;
  return (
    <div style={{position: "absolute", left: x, top: y, width: w, height: h, opacity: p, transform: `scale(${0.92 + 0.08 * ease(p)})`, transformOrigin: "center center"}}>
      <div style={{position: "absolute", inset: 0, background: "#fff", border: `4px solid ${secure ? GREEN : "#e6b8b8"}`, borderRadius: h / 2, boxShadow: "0 14px 32px rgba(47,58,69,.1)", display: "flex", alignItems: "center", paddingLeft: 36, paddingRight: 24, gap: 22}}>
        {secure ? (
          <div style={{width: 56, height: 56, borderRadius: "50%", background: GREEN_BG, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0}}>
            <svg width={34} height={42} viewBox="0 0 34 42">
              <path d="M 9 15 L 9 11 Q 9 2 17 2 Q 25 2 25 11 L 25 15" fill="none" stroke={GREEN} strokeWidth={4}/>
              <rect x={4} y={15} width={26} height={22} rx={5} fill={GREEN}/>
              <circle cx={17} cy={24} r={3.5} fill="#fff"/>
              <rect x={15.5} y={26} width={3.5} height={6} rx={1.75} fill="#fff"/>
            </svg>
          </div>
        ) : (
          <div style={{width: 56, height: 56, borderRadius: "50%", background: RED_BG, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0}}>
            <WarnTriangle x={28} y={28} s={0.62}/>
          </div>
        )}
        <div style={{fontFamily: "'Consolas','Courier New',monospace", fontWeight: 700, fontSize: 42, whiteSpace: "nowrap"}}>
          <span style={{color: secure ? GREEN : RED}}>{secure ? "https://" : "http://"}</span>
          <span style={{color: INK}}>{domain}</span>
        </div>
      </div>
    </div>
  );
};

// ---------- 翻页与字幕 ----------

// 硬切翻页（铁律1）：不做任何透明度淡入淡出。Sequence from=SENT 边界精确对齐，
// 切页帧旧页瞬间消失、新页瞬间完整呈现，无叠化、无 ghost 帧；页内元素仍按词级锚点弹入。

const Subtitle: React.FC = () => {
  const f = useCurrentFrame();
  // 金句时段（s08：屏幕黄横幅大字=旁白原话）跳过底部字幕，避免同帧重复同一句话（铁律12）
  if (f >= 1545 && f < 1726) return null;
  const cur = subs.find((s) => f >= s.s && f < s.e);
  if (!cur) return null;
  return (
    <div style={{position: "absolute", bottom: 30, left: 0, right: 0, zIndex: 50, display: "flex", justifyContent: "center"}}>
      <div style={{
        background: "rgba(12,14,18,.82)", borderRadius: 15, padding: "11px 32px",
        fontFamily: F, fontWeight: 700, fontSize: 44, color: "#fff", letterSpacing: 2, whiteSpace: "nowrap",
      }}>{cur.t}</div>
    </div>
  );
};

// ============ 页面 ============

// P1 钩子（s01 rel: 小锁37 警告55 待遇69 HTTP99 HTTPS127 S171 贵186）—— 首帧完整静态，全部 delay=-99
const PageHook: React.FC<{off: number}> = ({off}) => {
  const f = useCurrentFrame() - off;
  return (
    <AbsoluteFill>
      <BigTitle f={f} delay={-99} y={70} size={80} parts={[
        {t: "差的那一个 ", c: INK}, {t: "S", c: ORANGE}, {t: "，到底贵在哪？", c: INK},
      ]}/>
      <Sparkle x={400} y={120} s={0.8}/>
      <Sparkle x={1530} y={100} s={0.65} color="#b8d4f2"/>

      {/* 左：HTTP · 有警告 */}
      <FlatCard f={f} delay={-99} x={140} y={280} w={760} h={440} chip="HTTP" chipColor={BLUE}>
        <AddressBar f={f} delay={-99} x={60} y={130} w={640} h={110} secure={false} domain="shop.com"/>
        <div style={{position: "absolute", left: 0, top: 290, width: 760, textAlign: "center", fontFamily: F, fontWeight: 900, fontSize: 42, color: RED}}>
          浏览器弹警告
        </div>
        <WarnTriangle x={660} y={320} s={0.9}/>
      </FlatCard>

      {/* 右：HTTPS · 有小锁 */}
      <FlatCard f={f} delay={-99} x={1020} y={280} w={760} h={440} chip="HTTPS" chipColor={ORANGE}>
        <AddressBar f={f} delay={-99} x={60} y={130} w={640} h={110} secure={true} domain="shop.com"/>
        <div style={{position: "absolute", left: 0, top: 290, width: 760, textAlign: "center", fontFamily: F, fontWeight: 900, fontSize: 42, color: GREEN}}>
          地址栏有小锁
        </div>
        <LockIcon x={660} y={320} s={0.85} c={GREEN}/>
      </FlatCard>

      {/* 中央 VS */}
      <PopAt f={f} delay={-99} x={890} y={450} w={140} h={140}>
        <div style={{
          width: 140, height: 140, borderRadius: 999, backgroundColor: "#fff",
          border: `5px solid ${YEL}`, display: "flex", alignItems: "center", justifyContent: "center",
          fontFamily: F, fontWeight: 900, fontSize: 52, color: INK, boxShadow: "0 8px 18px rgba(47,58,69,0.12)",
        }}>VS</div>
      </PopAt>

      <Pill f={f} delay={-99} x={610} y={800} w={700} h={74} bg={ORANGE_BG} border={`3px dashed ${ORANGE}`} text="同一个网站 两种待遇" color={ORANGE} ts={36}/>
      <Sparkle x={120} y={780} s={0.7}/>
    </AbsoluteFill>
  );
};

// P2 结论（s02 rel: 结论15 S29 Security49 信封92 HTTP121 明信片149 HTTPS174 密封信207）
const PageConclusion: React.FC<{off: number}> = ({off}) => {
  const f = useCurrentFrame() - off;
  return (
    <AbsoluteFill>
      <BigTitle f={f} delay={-99} y={70} parts={[
        {t: "S = ", c: INK}, {t: "Security", c: ORANGE}, {t: " · 加密信封", c: INK},
      ]}/>

      {/* 中央 +S 徽章 */}
      <PopAt f={f} delay={29} x={880} y={470} w={160} h={160}>
        <div style={{
          width: 160, height: 160, borderRadius: 999, backgroundColor: ORANGE,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontFamily: F, fontWeight: 900, fontSize: 64, color: "#fff",
          boxShadow: "0 12px 26px rgba(240,145,45,0.4)",
        }}>＋S</div>
      </PopAt>

      {/* 左卡：HTTP 是明信片 */}
      <FlatCard f={f} delay={121} x={150} y={300} w={680} h={480} chip="HTTP" chipColor={BLUE}>
        <Postcard x={340} y={190} s={0.92}/>
        <div style={{position: "absolute", left: 0, top: 392, width: 680, textAlign: "center", fontFamily: F, fontWeight: 900, fontSize: 46, color: INK, opacity: prog(f, 149, 10), transform: `scale(${0.7 + 0.3 * ease(prog(f, 149, 10))})`}}>
          明信片
        </div>
      </FlatCard>

      {/* 右卡：HTTPS 是密封信 */}
      <FlatCard f={f} delay={174} x={1090} y={300} w={680} h={480} chip="HTTPS" chipColor={ORANGE}>
        <Envelope x={340} y={195} s={0.92}/>
        <div style={{position: "absolute", left: 0, top: 392, width: 680, textAlign: "center", fontFamily: F, fontWeight: 900, fontSize: 46, color: INK, opacity: prog(f, 203, 10), transform: `scale(${0.7 + 0.3 * ease(prog(f, 203, 10))})`}}>
          密封信
        </div>
      </FlatCard>

      <Sparkle x={880} y={280} s={0.85}/>
      <Sparkle x={260} y={830} s={0.7} color="#b8d4f2"/>
      <Sparkle x={1700} y={840} s={0.7}/>
    </AbsoluteFill>
  );
};

// P3 HTTP 裸奔（s03 rel: 裸奔21 每一个字70 途经94 路由器110 咖啡店WiFi132 都能167 原样读走181）
const PageNaked: React.FC<{off: number}> = ({off}) => {
  const f = useCurrentFrame() - off;
  return (
    <AbsoluteFill>
      <BigTitle f={f} delay={-99} y={64} size={76} parts={[
        {t: "HTTP", c: BLUE}, {t: " 裸奔：路上人人可读", c: INK},
      ]}/>

      {/* 明信片主体 */}
      <PopAt f={f} delay={4} x={180} y={250} w={680} h={420}>
        <Float f={f} x={0} y={0} w={680} h={420} amp={6}>
          <Postcard x={340} y={190} s={1.05} rot={-2}/>
        </Float>
      </PopAt>

      {/* 途经的读者：路由器 / 咖啡店WiFi / 路人 */}
      <PopAt f={f} delay={110} x={1230} y={250} w={220} h={180}>
        <RouterIcon x={110} y={90} s={1.1}/>
      </PopAt>
      <Label f={f} d={110} x={1160} y={408} w={160} text="路由器" size={28} color={SUBC}/>
      <PopAt f={f} delay={132} x={1560} y={250} w={220} h={180}>
        <WifiIcon x={110} y={90} s={1.15} c={RED}/>
      </PopAt>
      <Label f={f} d={132} x={1480} y={408} w={160} text="咖啡店 WiFi" size={28} color={SUBC}/>
      <PopAt f={f} delay={167} x={1250} y={560} w={240} h={330}>
        <FlatPerson x={120} y={165} color="#8896a6" s={1.2}/>
      </PopAt>
      <PopAt f={f} delay={175} x={1550} y={560} w={240} h={330}>
        <Float f={f} x={0} y={0} w={240} h={330} amp={5}>
          <FlatPerson x={120} y={165} color="#6b7a8c" s={1.2}/>
        </Float>
      </PopAt>

      {/* 明信片 → 读者：红色虚线 + 循环明文包 */}
      <FlatArrow f={f} x1={870} y1={380} x2={1210} y2={330} color={RED} dashed sw={6} delay={110}/>
      <FlatArrow f={f} x1={870} y1={450} x2={1540} y2={330} color={RED} dashed sw={6} delay={132}/>
      <LoopPacket f={f} x1={880} y1={400} x2={1220} y2={340} color={RED} start={120} period={72} dur={38} lift={18} size={40}/>
      <LoopPacket f={f} x1={880} y1={450} x2={1540} y2={350} color={RED} start={140} period={84} dur={44} lift={22} size={40}/>

      <Pill f={f} delay={181} x={200} y={790} w={620} h={74} bg={RED_BG} text="明文 · 沿途随便看" color={RED} ts={36}/>
      <Sparkle x={960} y={700} s={0.7} color="#f3c1c1"/>
    </AbsoluteFill>
  );
};

// P4 对暗号换钥匙（s04 rel: 思路30 随便抄69 看不懂112 双方124 暗号142 协商158 一把176 钥匙219）
const PageHandshake: React.FC<{off: number}> = ({off}) => {
  const f = useCurrentFrame() - off;
  return (
    <AbsoluteFill>
      <BigTitle f={f} delay={-99} y={64} size={78} parts={[
        {t: "先对暗号", c: INK}, {t: " 换把钥匙", c: ORANGE},
      ]}/>

      {/* 双方 */}
      <PopAt f={f} delay={6} x={280} y={430} w={280} h={360}>
        <Float f={f} x={0} y={0} w={280} h={360} amp={5}>
          <FlatPerson x={140} y={180} color={BLUE} s={1.35}/>
        </Float>
      </PopAt>
      <Label f={f} d={6} x={230} y={810} w={380} text="你的浏览器" size={30} color={SUBC}/>
      <PopAt f={f} delay={10} x={1370} y={430} w={280} h={360}>
        <Float f={f} x={0} y={0} w={280} h={360} amp={5}>
          <FlatPerson x={140} y={180} color="#3f4d5e" s={1.35}/>
        </Float>
      </PopAt>
      <Label f={f} d={10} x={1320} y={810} w={380} text="网站服务器" size={30} color={SUBC}/>

      {/* 对暗号气泡 */}
      <SpeechBubble f={f} d={139} x={620} y={280} w={280} h={110} text="对暗号" ts={40} c={BLUE}/>
      <SpeechBubble f={f} d={170} x={1020} y={280} w={280} h={110} text="对上了" ts={40} c={GREEN} tc={GREEN}/>
      <PopAt f={f} delay={170} x={930} y={420} w={60} h={60}>
        <MarkOk x={30} y={30} s={1}/>
      </PopAt>

      {/* 随便抄也看不懂 */}
      <Pill f={f} delay={100} x={760} y={620} w={400} h={70} bg={BLUE_BG} text="抄走也看不懂" color={BLUE} ts={34}/>

      {/* 钥匙（词锚：钥匙 s04+219 帧，压轴元素提前 5 帧出现） */}
      <PopAt f={f} delay={214} x={880} y={780} w={220} h={130}>
        <Float f={f} x={0} y={0} w={220} h={130} amp={6}>
          <KeyIcon x={110} y={65} s={1.5} rot={-14}/>
        </Float>
      </PopAt>
      <Sparkle x={1060} y={740} s={0.9}/>

      {/* 双向绿包 */}
      <LoopPacket f={f} x1={600} y1={520} x2={1320} y2={520} color={GREEN} start={60} period={70} dur={36} lift={16} size={38}/>
      <LoopPacket f={f} x1={1320} y1={590} x2={600} y2={590} color={ORANGE} start={92} period={70} dur={36} lift={16} size={38}/>
    </AbsoluteFill>
  );
};

// P5 证书盖章（s05 rel: 证书35 网站57 身份证92 权威机构119 盖章141 假网站161 盖不了180 浏览器216 红色警告258）
const PageCert: React.FC<{off: number}> = ({off}) => {
  const f = useCurrentFrame() - off;
  return (
    <AbsoluteFill>
      <BigTitle f={f} delay={-99} y={64} size={76} parts={[
        {t: "证书：网站的", c: INK}, {t: "身份证", c: ORANGE},
      ]}/>

      {/* 正牌网站 + 证书 */}
      <FlatCard f={f} delay={35} x={220} y={280} w={620} h={480} chip="网站" chipColor={ORANGE}>
        <ServerIcon x={310} y={170} s={1.5} c={ORANGE}/>
        <div style={{position: "absolute", left: 0, top: 290, width: 620, textAlign: "center", fontFamily: F, fontWeight: 900, fontSize: 42, color: INK, opacity: prog(f, 92, 10)}}>
          出门先带身份证
        </div>
        <div style={{position: "absolute", left: 0, top: 360, width: 620, textAlign: "center", fontFamily: F, fontSize: 28, color: SUBC, opacity: prog(f, 100, 10)}}>
          HTTPS 证书 · 谁签发的写在上面
        </div>
      </FlatCard>

      {/* 权威机构红章 */}
      <PopAt f={f} delay={141} x={720} y={660} w={220} h={220} rot={-12}>
        <div style={{
          width: 220, height: 220, borderRadius: 999, backgroundColor: RED_BG,
          border: `8px solid ${RED}`, display: "flex", alignItems: "center", justifyContent: "center",
          flexDirection: "column", fontFamily: F, fontWeight: 900, color: RED,
        }}>
          <div style={{fontSize: 40, letterSpacing: 4}}>权威机构</div>
          <div style={{fontSize: 34, letterSpacing: 8}}>盖章</div>
        </div>
      </PopAt>
      <FlashRing f={f} at={141} x={720} y={660} color={RED}/>

      {/* 假网站：盖不了章 */}
      <FlatCard f={f} delay={161} x={1080} y={280} w={620} h={300} chip="假网站" chipColor={RED} fill="#f6f8fa">
        <div style={{position: "absolute", left: 0, top: 80, width: 620, textAlign: "center", fontFamily: F, fontWeight: 900, fontSize: 44, color: SUBC}}>
          拿不出盖章的证书
        </div>
        <PopAt f={f} delay={190} x={490} y={190} w={80} h={80}>
          <MarkBad x={40} y={40} s={1.2}/>
        </PopAt>
      </FlatCard>

      {/* 红色大警告 */}
      <PopAt f={f} delay={258} x={1130} y={640} w={520} h={140}>
        <div style={{
          width: 520, height: 140, borderRadius: 24, backgroundColor: RED,
          display: "flex", alignItems: "center", justifyContent: "center", gap: 20,
          boxShadow: "0 14px 30px rgba(224,86,86,0.4)",
        }}>
          <WarnTriangle x={70} y={70} s={1.1}/>
          <span style={{fontFamily: F, fontWeight: 900, fontSize: 52, color: "#fff", letterSpacing: 4}}>不安全</span>
        </div>
      </PopAt>
      <FlashRing f={f} at={258} x={1390} y={710} color={RED}/>
      <Sparkle x={300} y={820} s={0.8}/>
    </AbsoluteFill>
  );
};

// P6 公共WiFi翻车（s06 rel: 翻车27 现场37 公共71 WiFi83 连着108 不带117 小锁125 输密码155）
const PageWifi: React.FC<{off: number}> = ({off}) => {
  const f = useCurrentFrame() - off;
  return (
    <AbsoluteFill>
      <BigTitle f={f} delay={-99} y={64} size={74} parts={[
        {t: "翻车现场", c: RED}, {t: "：公共 WiFi", c: INK},
      ]}/>

      {/* 公共WiFi（左上，避开地址栏） */}
      <PopAt f={f} delay={71} x={330} y={260} w={160} h={130}>
        <WifiIcon x={80} y={65} s={1.1} c={BLUE}/>
      </PopAt>
      <Label f={f} d={78} x={460} y={240} w={260} text="公共 WiFi" size={30} color={SUBC}/>

      {/* 不带小锁的网站 */}
      <AddressBar f={f} delay={117} x={510} y={400} w={900} h={110} secure={false} domain="free-wifi-login.top"/>
      <Label f={f} d={132} x={610} y={530} w={700} text="地址栏是空的 · 没有小锁" size={30} color={RED}/>

      {/* 输密码 */}
      <PopAt f={f} delay={155} x={610} y={600} w={700} h={96}>
        <div style={{
          position: "absolute", inset: 0, background: "#fff", border: `4px solid ${BORDER}`, borderRadius: 20,
          display: "flex", alignItems: "center", paddingLeft: 30, gap: 18,
          boxShadow: "0 10px 24px rgba(47,58,69,0.08)",
        }}>
          <span style={{fontFamily: F, fontWeight: 900, fontSize: 34, color: SUBC}}>密码</span>
          <span style={{fontFamily: F, fontWeight: 900, fontSize: 40, color: INK, letterSpacing: 8}}>●●●●●●</span>
          <WarnTriangle x={600} y={48} s={0.7}/>
        </div>
      </PopAt>
      <FlashRing f={f} at={158} x={960} y={648} color={RED}/>

      {/* 人 + 明文上送（垂直走左侧，不穿地址栏） */}
      <PopAt f={f} delay={6} x={300} y={560} w={260} h={340}>
        <Float f={f} x={0} y={0} w={260} h={340} amp={5}>
          <FlatPerson x={130} y={170} color={BLUE} s={1.3}/>
        </Float>
      </PopAt>
      <FlatArrow f={f} x1={430} y1={548} x2={424} y2={382} color={RED} dashed sw={6} delay={130}/>
      <LoopPacket f={f} x1={430} y1={555} x2={428} y2={390} color={RED} start={140} period={60} dur={30} lift={0} size={38}/>
      <Pill f={f} delay={162} x={680} y={745} w={560} h={70} bg={RED_BG} text="密码在路上裸奔" color={RED} ts={34}/>
      <Sparkle x={1620} y={300} s={0.7}/>
    </AbsoluteFill>
  );
};

// P7 小锁=密封信（s07 rel: 全网14 HTTPS29 普及64 看到小锁82 密封149 走169）
const PageLock: React.FC<{off: number}> = ({off}) => {
  const f = useCurrentFrame() - off;
  return (
    <AbsoluteFill>
      <BigTitle f={f} delay={-99} y={64} size={78} parts={[
        {t: "小锁", c: GREEN}, {t: " = 密码在", c: INK}, {t: "密封信", c: ORANGE}, {t: "里", c: INK},
      ]}/>

      {/* 全网普及：一排小锁 */}
      {[520, 960, 1400].map((x, i) => (
        <PopAt key={i} f={f} delay={24 + i * 10} x={x - 35} y={580} w={70} h={84}>
          <LockIcon x={35} y={42} s={0.68} c={GREEN}/>
        </PopAt>
      ))}

      <AddressBar f={f} delay={6} x={310} y={330} w={1300} h={140} secure={true} domain="any-website.com"/>
      <PopAt f={f} delay={89} x={1640} y={360} w={70} h={70}>
        <MarkOk x={35} y={35} s={1.1}/>
      </PopAt>

      {/* 密封信出发 */}
      <PopAt f={f} delay={149} x={1430} y={720} w={280} h={190}>
        <Float f={f} x={0} y={0} w={280} h={190} amp={6}>
          <Envelope x={140} y={95} s={0.48}/>
        </Float>
      </PopAt>
      <LoopPacket f={f} x1={420} y1={790} x2={1380} y2={790} color={GREEN} start={155} period={64} dur={34} lift={20} size={40}/>
      <Pill f={f} delay={162} x={420} y={760} w={560} h={70} bg={GREEN_BG} text="加密封存 · 途中无人能读" color={GREEN} ts={32}/>
      <Sparkle x={280} y={260} s={0.8}/>
      <Sparkle x={1660} y={240} s={0.65} color="#bfe3cc"/>
    </AbsoluteFill>
  );
};

// P8 金句横幅（s08 rel: 金句3 HTTP24 明信片52 HTTPS76 密封信108 小锁129 没人能读160）
const PageQuote: React.FC<{off: number}> = ({off}) => {
  const f = useCurrentFrame() - off;
  const p1 = prog(f, 24, 10);
  const p2 = prog(f, 76, 10);
  const p3 = prog(f, 129, 10);
  return (
    <AbsoluteFill>
      <PopAt f={f} delay={-99} x={170} y={310} w={1580} h={230} rot={-1.5}>
        <div style={{
          width: 1580, height: 230, borderRadius: 28, backgroundColor: YEL,
          display: "flex", alignItems: "center", justifyContent: "center", gap: 36,
          boxShadow: "0 16px 36px rgba(247,201,72,0.45)",
          fontFamily: F, fontWeight: 900, fontSize: 82, color: INK, letterSpacing: 4, whiteSpace: "nowrap",
        }}>
          <span style={{opacity: p1, transform: `scale(${0.7 + 0.3 * ease(p1)})`, display: "inline-block"}}>
            <span style={{color: BLUE}}>HTTP</span> 是明信片
          </span>
          <span style={{fontSize: 60, opacity: Math.min(p1, p2)}}>·</span>
          <span style={{opacity: p2, transform: `scale(${0.7 + 0.3 * ease(p2)})`, display: "inline-block"}}>
            <span style={{color: "#a3650a"}}>HTTPS</span> 是密封信
          </span>
        </div>
      </PopAt>

      {/* 小锁 = 路上没人能读 */}
      <PopAt f={f} delay={129} x={560} y={640} w={800} h={120}>
        <div style={{
          width: 800, height: 120, borderRadius: 60, backgroundColor: "#fff",
          border: `4px solid ${GREEN}`, display: "flex", alignItems: "center", justifyContent: "center", gap: 22,
          boxShadow: "0 12px 26px rgba(47,58,69,0.1)",
          fontFamily: F, fontWeight: 900, fontSize: 52, color: INK, opacity: p3,
        }}>
          <LockIcon x={60} y={60} s={0.8} c={GREEN}/>
          <span>小锁 = 路上<span style={{color: GREEN}}>没人能读</span></span>
        </div>
      </PopAt>

      <Sparkle x={330} y={280} s={0.9}/>
      <Sparkle x={1620} y={620} s={0.8} color="#bfe3cc"/>
      <Sparkle x={960} y={850} s={0.7}/>
    </AbsoluteFill>
  );
};

// P9 结尾截图卡（s09 rel: 合集72 点个关注92 下期119 接着136 拆144）—— 画面延后45帧，结尾静止≥3秒（全部 delay ≤ 136）
const PageOutro: React.FC<{off: number}> = ({off}) => {
  const f = useCurrentFrame() - off;
  return (
    <AbsoluteFill>
      {/* 截图虚线框 */}
      <div style={{
        position: "absolute", left: 300, top: 130, width: 1320, height: 680,
        border: "4px dashed #b8c4d2", borderRadius: 34, opacity: prog(f, -99),
      }}/>

      <FlatCard f={f} delay={-99} x={350} y={180} w={1220} h={580} chip="金句卡" chipColor={ORANGE}>
        <div style={{
          position: "absolute", left: 0, top: 110, width: 1220, textAlign: "center",
          fontFamily: F, fontWeight: 900, fontSize: 60, color: INK, letterSpacing: 1, whiteSpace: "nowrap",
          opacity: prog(f, -99, 10), transform: `scale(${0.85 + 0.15 * ease(prog(f, -99, 10))})`,
        }}>
          <span style={{color: BLUE}}>HTTP</span> 是明信片 · <span style={{color: ORANGE}}>HTTPS</span> 是密封信
        </div>

        <div style={{position: "absolute", left: 0, top: 250, width: 1220, textAlign: "center", fontFamily: F, fontWeight: 700, fontSize: 38, color: INK, opacity: prog(f, 68, 10)}}>
          HTTP = 明信片 · <span style={{color: RED}}>路上人人可读</span>
        </div>
        <div style={{position: "absolute", left: 0, top: 330, width: 1220, textAlign: "center", fontFamily: F, fontWeight: 700, fontSize: 38, color: INK, opacity: prog(f, 76, 10)}}>
          HTTPS = 密封信 · <span style={{color: GREEN}}>加密 + 证书盖章</span>
        </div>
        <div style={{position: "absolute", left: 0, top: 410, width: 1220, textAlign: "center", fontFamily: F, fontWeight: 900, fontSize: 38, color: INK, opacity: prog(f, 84, 10)}}>
          小锁 = <span style={{color: GREEN}}>密文传输</span>
        </div>

        <div style={{
          position: "absolute", left: 0, top: 500, width: 1220, textAlign: "center",
          fontFamily: F, fontWeight: 700, fontSize: 30, color: SUBC, letterSpacing: 3, opacity: prog(f, 132, 10),
        }}>全栈小秋 · 0 基础也能学会</div>
      </FlatCard>

      <PopAt f={f} delay={102} x={700} y={830} w={520} h={96}>
        <div style={{
          width: 520, height: 96, borderRadius: 48, backgroundColor: ORANGE,
          display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: "0 14px 30px rgba(240,145,45,0.4)",
          fontFamily: F, fontWeight: 900, fontSize: 44, color: "#fff", letterSpacing: 6,
        }}>关注 全栈小秋</div>
      </PopAt>
      {/* 「下期接着拆」只由底部字幕承担（1847-1884），屏上不再重复同一句话（铁律12） */}
      <Sparkle x={320} y={150} s={0.9}/>
      <Sparkle x={1600} y={200} s={0.7} color="#bfe3cc"/>
    </AbsoluteFill>
  );
};

// ============ 主组件 ============

const PAGES = [
  {C: PageHook, start: SENT[0], end: SENT[1]},
  {C: PageConclusion, start: SENT[1], end: SENT[2]},
  {C: PageNaked, start: SENT[2], end: SENT[3]},
  {C: PageHandshake, start: SENT[3], end: SENT[4]},
  {C: PageCert, start: SENT[4], end: SENT[5]},
  {C: PageWifi, start: SENT[5], end: SENT[6]},
  {C: PageLock, start: SENT[6], end: SENT[7]},
  {C: PageQuote, start: SENT[7], end: SENT[8]},
  {C: PageOutro, start: SENT[8], end: DUR},
];

export const HttpVsHttps: React.FC = () => {
  const frame = useCurrentFrame();
  const bed = interpolate(frame, [0, 20, DUR - 40, DUR - 6], [0, 0.06, 0.06, 0], clamp);
  return (
    <AbsoluteFill style={{background: "linear-gradient(180deg,#fff 0%,#f3f6f9 100%)", fontFamily: F, overflow: "hidden"}}>
      <BgDots/>
      {PAGES.map(({C, start, end}, i) => {
        const last = i === PAGES.length - 1, len = end - start;
        // durationInFrames=len 精确到下一 SENT：无 10 帧重叠期，边界帧即硬切
        return (
          <Sequence key={i} from={start} durationInFrames={last ? DUR - start : len}>
            <C off={0}/>
          </Sequence>
        );
        })}
      {/* 右上角角标 */}
      <div style={{
        position: "absolute", top: 45, right: 70, zIndex: 45, border: `3px solid ${BLUE}`,
        borderRadius: 999, padding: "7px 25px", fontSize: 28, fontWeight: 900, color: INK,
        letterSpacing: 5, background: "#fff",
      }}>全栈小秋</div>

      {/* 配音：httpvshttps-tts（2026-09-14 新脚本重做） */}
      {SENT.map((start, i) => (
        <Sequence key={`v-${i}`} from={start} durationInFrames={i < 8 ? SENT[i + 1] - start + 10 : DUR - start}>
          <Audio src={staticFile(`audio/httpvshttps-tts/s0${i + 1}.mp3`)} volume={1}/>
        </Sequence>
      ))}

      {/* 音效层：全部从 SENT / 词级锚点推导 */}
      {PAGES.slice(1).map((p, i) => (
        <Sequence key={`pg-${i}`} from={p.start - 6} durationInFrames={20}>
          <Audio src={staticFile("audio/sfx/transfer.wav")} volume={0.14}/>
        </Sequence>
      ))}
      {/* P1 警告 */}
      <Sequence from={SENT[0] + 55} durationInFrames={22}><Audio src={staticFile("audio/sfx/error.wav")} volume={0.3}/></Sequence>
      {/* P2 明信片卡 / 密封信卡 */}
      {[121, 174].map((t) => (
        <Sequence key={`pop2-${t}`} from={SENT[1] + t} durationInFrames={10}><Audio src={staticFile("audio/sfx/pop.wav")} volume={0.26}/></Sequence>
      ))}
      {/* P3 读者出现 */}
      {[110, 132].map((t) => (
        <Sequence key={`wh3-${t}`} from={SENT[2] + t} durationInFrames={12}><Audio src={staticFile("audio/sfx/whoosh.wav")} volume={0.12}/></Sequence>
      ))}
      <Sequence from={SENT[2] + 181} durationInFrames={10}><Audio src={staticFile("audio/sfx/pop.wav")} volume={0.26}/></Sequence>
      {/* P4 暗号气泡 / 钥匙 */}
      <Sequence from={SENT[3] + 139} durationInFrames={10}><Audio src={staticFile("audio/sfx/pop.wav")} volume={0.28}/></Sequence>
      <Sequence from={SENT[3] + 214} durationInFrames={18}><Audio src={staticFile("audio/sfx/success.wav")} volume={0.24}/></Sequence>
      {/* P5 盖章 / 假网站 / 红色大警告 */}
      <Sequence from={SENT[4] + 141} durationInFrames={10}><Audio src={staticFile("audio/sfx/pop.wav")} volume={0.3}/></Sequence>
      <Sequence from={SENT[4] + 161} durationInFrames={10}><Audio src={staticFile("audio/sfx/pop.wav")} volume={0.26}/></Sequence>
      <Sequence from={SENT[4] + 258} durationInFrames={22}><Audio src={staticFile("audio/sfx/error.wav")} volume={0.32}/></Sequence>
      {/* P6 WiFi / 输密码 */}
      <Sequence from={SENT[5] + 71} durationInFrames={10}><Audio src={staticFile("audio/sfx/pop.wav")} volume={0.26}/></Sequence>
      <Sequence from={SENT[5] + 155} durationInFrames={22}><Audio src={staticFile("audio/sfx/error.wav")} volume={0.3}/></Sequence>
      {/* P7 地址栏 / 小锁确认 / 密封信 */}
      <Sequence from={SENT[6] + 6} durationInFrames={10}><Audio src={staticFile("audio/sfx/pop.wav")} volume={0.26}/></Sequence>
      <Sequence from={SENT[6] + 89} durationInFrames={18}><Audio src={staticFile("audio/sfx/success.wav")} volume={0.24}/></Sequence>
      <Sequence from={SENT[6] + 149} durationInFrames={12}><Audio src={staticFile("audio/sfx/whoosh.wav")} volume={0.2}/></Sequence>
      {/* P8 金句三段 */}
      {[24, 76, 129].map((t) => (
        <Sequence key={`pop8-${t}`} from={SENT[7] + t} durationInFrames={10}><Audio src={staticFile("audio/sfx/pop.wav")} volume={0.26}/></Sequence>
      ))}
      {/* P9 关注 */}
      <Sequence from={SENT[8] + 102} durationInFrames={10}><Audio src={staticFile("audio/sfx/pop.wav")} volume={0.34}/></Sequence>

      <Audio src={staticFile("audio/bed.wav")} loop volume={() => bed}/>
      <Subtitle/>
    </AbsoluteFill>
  );
};
