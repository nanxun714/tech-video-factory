import React from "react";
import {Audio} from "@remotion/media";
import {AbsoluteFill, interpolate, Sequence, staticFile, useCurrentFrame} from "remotion";
import {
  INK, SUBC, BLUE, BLUE_BG, GREEN, GREEN_BG, ORANGE, ORANGE_BG, RED, RED_BG, YEL, BORDER, F, W, H,
  clamp, ease, prog, BgDots, BigTitle, Sparkle, FlashRing, LoopPacket,
  SpeechBubble, Float, MarkBad, FlatPerson, Globe, ServerIcon, LockIcon,
} from "./flatKit";

// ============ 扁平可爱插画科普风 · GET vs POST（竞争型九页结构，样板 TcpVsUdpFlat，全栈小秋 IP） ============
// 结构：钩子 → 双主角登场 → 参数位置 → 长度 → 幂等核心页(最长) → 踩坑(删除接口写成GET被爬虫扫) → 安全误区 → 金句大字 → 截图卡+CTA
// 语义色：GET = 蓝（拿） / POST = 橙（办）；红只给问题/丢失/警告

export const DUR = 2008;

// 各句配音起始帧（页面边界 = SENT，词级锚点见各页注释；getpost-tts timeline 2026-09-14）
const SENT = [0, 198, 375, 669, 873, 1229, 1447, 1653, 1808];

type Sub = {s: number; e: number; t: string};
const subs: Sub[] = [
  {s: 3, e: 23, t: "面试官问"},
  {s: 23, e: 74, t: "GET和POST的区别"},
  {s: 74, e: 115, t: "你答一个查数据"},
  {s: 115, e: 151, t: "一个传数据"},
  {s: 151, e: 195, t: "他为什么直接摇头"},
  {s: 201, e: 256, t: "因为这句只说对了表面"},
  {s: 256, e: 326, t: "真正的区别藏在四个地方"},
  {s: 326, e: 373, t: "最后一个最值钱"},
  {s: 378, e: 428, t: "第一 参数位置"},
  {s: 428, e: 486, t: "GET把参数拼在网址后面"},
  {s: 486, e: 561, t: "会被收藏 转发 记进日志"},
  {s: 561, e: 622, t: "POST把参数放进请求体"},
  {s: 622, e: 667, t: "地址栏干干净净"},
  {s: 672, e: 708, t: "第二 长度"},
  {s: 708, e: 791, t: "网址栏对URL长度有限制"},
  {s: 791, e: 834, t: "GET传不了大文件"},
  {s: 834, e: 871, t: "POST没这个约束"},
  {s: 876, e: 931, t: "第三 也是最值钱的"},
  {s: 931, e: 964, t: "GET是幂等的"},
  {s: 964, e: 1010, t: "同一请求发一百次"},
  {s: 1010, e: 1058, t: "服务器状态都不变"},
  {s: 1058, e: 1127, t: "浏览器才敢放心刷新和预取"},
  {s: 1127, e: 1175, t: "POST可能下单扣款"},
  {s: 1175, e: 1226, t: "所以刷新前要弹窗确认"},
  {s: 1232, e: 1310, t: "踩过坑的人都懂这条的分量"},
  {s: 1310, e: 1373, t: "有人把删除接口写成GET"},
  {s: 1373, e: 1406, t: "被爬虫一扫"},
  {s: 1406, e: 1445, t: "数据直接没了"},
  {s: 1450, e: 1508, t: "第四 安全性其实一样"},
  {s: 1508, e: 1537, t: "都走明文"},
  {s: 1537, e: 1595, t: "想加密上HTTPS"},
  {s: 1595, e: 1651, t: "跟GET POST本身没关系"},
  {s: 1657, e: 1680, t: "金句"},
  {s: 1680, e: 1708, t: "GET是拿"},
  {s: 1708, e: 1742, t: "POST是办"},
  {s: 1742, e: 1781, t: "能不能重复发"},
  {s: 1781, e: 1806, t: "看幂等"},
  {s: 1811, e: 1875, t: "面试速查卡停在结尾了"},
  {s: 1875, e: 1964, t: "更多高频八股对比在主页合集"},
  {s: 1964, e: 2005, t: "点个关注不迷路"},
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

// 一次性飞行数据包（P5 下单扣款 ¥ 包）
const FlyPacket: React.FC<{
  f: number; n: string; x1: number; y1: number; x2: number; y2: number;
  t0: number; dur?: number; color?: string;
}> = ({f, n, x1, y1, x2, y2, t0, dur = 30, color = ORANGE}) => {
  const t = (f - t0) / dur;
  if (t <= 0 || t >= 1) return null;
  const x = x1 + (x2 - x1) * t;
  const y = y1 + (y2 - y1) * t - Math.sin(Math.PI * t) * 16;
  return (
    <div style={{
      position: "absolute", left: x, top: y, opacity: 1,
      transform: `translate(-50%,-50%)`,
    }}>
      <div style={{
        width: 64, height: 48, borderRadius: 12, backgroundColor: color,
        border: "4px solid #fff", boxShadow: "0 8px 18px rgba(47,58,69,0.18)",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontFamily: F, fontWeight: 900, fontSize: 30, color: "#fff",
      }}>{n}</div>
    </div>
  );
};

// ---------- 主题图标 ----------

const Ico: React.FC<{d: string; x: number; y: number; s?: number; c?: string}> = ({d, x, y, s = 1, c = INK}) => (
  <svg width={24 * s} height={24 * s} viewBox="0 0 24 24"
    style={{position: "absolute", left: x - 12 * s, top: y - 12 * s, overflow: "visible"}}>
    <path d={d} fill={c} />
  </svg>
);

const D_STAR = "M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z";
const D_SHARE = "M14 9V5l7 7-7 7v-4.1c-5 0-8.5 1.6-11 5.1 1-5 4-10 11-11z";
const D_FILE = "M6 2c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6H6zm7 7V3.5L18.5 9H13zm-5 5h8v2H8v-2zm0 4h8v2H8v-2z";
const D_REFRESH = "M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-8 8s3.57 8 8 8c3.73 0 6.84-2.55 7.73-6h-3.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z";
const D_DOWNLOAD = "M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z";

// 爬虫小虫（沿路径爬行）
const Spider: React.FC<{f: number; t0: number; dur: number; x1: number; x2: number; y: number}> = ({f, t0, dur, x1, x2, y}) => {
  if (f < t0 || f > t0 + dur + 30) return null;
  const raw = Math.min(1, (f - t0) / dur);
  const p = ease(raw);
  const x = x1 + (x2 - x1) * p;
  const wob = f - t0;
  return (
    <svg width={120} height={120} viewBox="0 0 120 120"
      style={{position: "absolute", left: x - 60, top: y - 60 + Math.sin(wob / 3) * 4, overflow: "visible"}}>
      <g transform="translate(60,60)">
        <line x1={0} y1={-6} x2={-26} y2={-30} stroke="#55677c" strokeWidth={5} strokeLinecap="round" />
        <line x1={0} y1={-8} x2={-8} y2={-36} stroke="#55677c" strokeWidth={5} strokeLinecap="round" />
        <line x1={0} y1={-6} x2={26} y2={-30} stroke="#55677c" strokeWidth={5} strokeLinecap="round" />
        <line x1={0} y1={-8} x2={8} y2={-36} stroke="#55677c" strokeWidth={5} strokeLinecap="round" />
        <line x1={0} y1={8} x2={-28} y2={28} stroke="#55677c" strokeWidth={5} strokeLinecap="round" />
        <line x1={0} y1={10} x2={-10} y2={38} stroke="#55677c" strokeWidth={5} strokeLinecap="round" />
        <line x1={0} y1={8} x2={28} y2={28} stroke="#55677c" strokeWidth={5} strokeLinecap="round" />
        <line x1={0} y1={10} x2={10} y2={38} stroke="#55677c" strokeWidth={5} strokeLinecap="round" />
        <circle cx={0} cy={4} r={22} fill="#55677c" />
        <circle cx={0} cy={-22} r={12} fill="#3f4d5e" />
        <circle cx={-4} cy={-24} r={2.6} fill="#fff" />
        <circle cx={4} cy={-24} r={2.6} fill="#fff" />
      </g>
    </svg>
  );
};

// 数据库圆柱
const DbIcon: React.FC<{x: number; y: number; s?: number; c?: string}> = ({x, y, s = 1, c = "#55677c"}) => (
  <svg width={140 * s} height={150 * s} viewBox="0 0 140 150"
    style={{position: "absolute", left: x - 70 * s, top: y - 75 * s, overflow: "visible"}}>
    <path d="M 20 30 L 20 120 A 50 18 0 0 0 120 120 L 120 30" fill={c} opacity={0.16} />
    <ellipse cx={70} cy={30} rx={50} ry={18} fill={c} />
    <ellipse cx={70} cy={62} rx={50} ry={18} fill={c} opacity={0.75} />
    <ellipse cx={70} cy={94} rx={50} ry={18} fill={c} opacity={0.5} />
  </svg>
);

// 地址栏 mock（flat 风浏览器地址条）
const UrlBar: React.FC<{
  f: number; delay: number; x: number; y: number; w: number; h: number;
  children: React.ReactNode; danger?: boolean;
}> = ({f, delay, x, y, w, h, children, danger}) => {
  const p = prog(f, delay);
  if (p <= 0) return null;
  return (
    <div style={{
      position: "absolute", left: x, top: y, width: w, height: h,
      backgroundColor: "#f7f9fb", borderRadius: 16,
      border: `3px solid ${danger ? RED : "#d8e2ee"}`,
      display: "flex", alignItems: "center", paddingLeft: 56,
      opacity: p, transform: `scale(${0.96 + 0.04 * ease(p)})`,
    }}>
      <svg width={26} height={26} viewBox="0 0 24 24" style={{position: "absolute", left: 16, top: (h - 26) / 2}}>
        <circle cx={12} cy={12} r={9} fill="none" stroke={danger ? RED : GREEN} strokeWidth={3} />
        <circle cx={12} cy={12} r={3.4} fill={danger ? RED : GREEN} />
      </svg>
      {children}
    </div>
  );
};

// ---------- 翻页与字幕 ----------

const Subtitle: React.FC = () => {
  const f = useCurrentFrame();
  // 金句页（s08）：金句大字=旁白原话上屏，跳过底部字幕避免同帧重复（铁律12）
  if (f >= SENT[7] && f < SENT[8]) return null;
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

// P1 钩子（s01 rel: 面试官3 问17 区别23 查92 传122 摇头179）—— 首帧完整静态，全部 delay=-99
const PageHook: React.FC<{off: number}> = ({off}) => {
  const f = useCurrentFrame() - off;
  return (
    <AbsoluteFill>
      <BigTitle f={f} delay={-99} y={70} size={76} parts={[
        {t: "GET", c: BLUE}, {t: " 和 ", c: INK}, {t: "POST", c: ORANGE}, {t: " 到底差在哪？", c: INK},
      ]} />
      <Sparkle x={300} y={120} s={0.8} />
      <Sparkle x={1620} y={100} s={0.65} color="#b8d4f2" />

      {/* 左：面试官 */}
      <PopAt f={f} delay={-99} x={280} y={330} w={300} h={420}>
        <Float f={f} x={0} y={0} w={300} h={420} amp={5}>
          <FlatPerson x={150} y={210} color="#3f4d5e" s={1.6} />
        </Float>
      </PopAt>
      <Label f={f} d={-99} x={280} y={780} w={300} text="面试官" size={32} color={SUBC} />
      <SpeechBubble f={f} d={-99} x={590} y={270} w={330} h={104} text="说说区别？" ts={38} c={BLUE} tc={BLUE} />

      {/* 右：你 */}
      <PopAt f={f} delay={-99} x={1360} y={330} w={300} h={420}>
        <Float f={f} x={0} y={0} w={300} h={420} amp={5}>
          <FlatPerson x={150} y={210} color={GREEN} s={1.6} />
        </Float>
      </PopAt>
      <Label f={f} d={-99} x={1360} y={780} w={300} text="你" size={32} color={SUBC} />
      <SpeechBubble f={f} d={-99} x={1010} y={250} w={280} h={100} text="查数据" ts={38} c={BLUE} tc={BLUE} />
      <SpeechBubble f={f} d={-99} x={1050} y={392} w={280} h={100} text="传数据" ts={38} c={ORANGE} tc={ORANGE} />

      {/* 中间虚线 */}
      <svg width={W} height={H} style={{position: "absolute", inset: 0, pointerEvents: "none"}}>
        <line x1={600} y1={580} x2={1320} y2={580} stroke="#c3d2e2" strokeWidth={5} strokeDasharray="12 14" />
      </svg>

      {/* 摇头（词级锚点 179） */}
      <div style={{
        position: "absolute", left: 340, top: 160, width: 120, textAlign: "center",
        fontFamily: F, fontWeight: 900, fontSize: 96, color: RED,
        opacity: prog(f, 179, 10), transform: `scale(${0.7 + 0.3 * ease(prog(f, 179, 10))})`,
      }}>?</div>
      <Label f={f} d={179} x={180} y={860} w={500} text="为什么摇头？" color={RED} size={34} weight={900} />
      <Sparkle x={1240} y={700} s={0.7} />
    </AbsoluteFill>
  );
};

// P2 双主角登场 + 四处预告（s02 rel: 表面39 四个地方103 最后129 最值钱151）
const PageTwo: React.FC<{off: number}> = ({off}) => {
  const f = useCurrentFrame() - off;
  return (
    <AbsoluteFill>
      <Pill f={f} delay={39} x={560} y={54} w={800} h={64} bg={RED_BG} text="只说对了表面 · 真正区别有四处" color={RED} ts={31} />
      <BigTitle f={f} delay={-99} y={148} parts={[
        {t: "GET", c: BLUE}, {t: " 和 ", c: INK}, {t: "POST", c: ORANGE},
      ]} />

      <FlatCard f={f} delay={-99} x={175} y={300} w={720} h={370} chip="GET" chipColor={BLUE}>
        <Ico d={D_DOWNLOAD} x={360} y={120} s={3.8} c={BLUE} />
        <div style={{position: "absolute", left: 0, top: 216, width: 720, textAlign: "center", fontFamily: F, fontSize: 30, color: SUBC}}>更偏向</div>
        <div style={{position: "absolute", left: 0, top: 258, width: 720, textAlign: "center", fontFamily: F, fontWeight: 900, fontSize: 76, color: BLUE, letterSpacing: 10}}>拿</div>
      </FlatCard>

      <FlatCard f={f} delay={-99} x={1025} y={300} w={720} h={370} chip="POST" chipColor={ORANGE}>
        <Ico d={D_FILE} x={360} y={120} s={3.8} c={ORANGE} />
        <div style={{position: "absolute", left: 0, top: 216, width: 720, textAlign: "center", fontFamily: F, fontSize: 30, color: SUBC}}>更偏向</div>
        <div style={{position: "absolute", left: 0, top: 258, width: 720, textAlign: "center", fontFamily: F, fontWeight: 900, fontSize: 76, color: ORANGE, letterSpacing: 10}}>办</div>
      </FlatCard>

      <PopAt f={f} delay={72} x={910} y={445} w={100} h={100}>
        <div style={{
          width: 100, height: 100, borderRadius: 999, backgroundColor: "#fff",
          border: `5px solid ${YEL}`, display: "flex", alignItems: "center", justifyContent: "center",
          fontFamily: F, fontWeight: 900, fontSize: 40, color: INK, boxShadow: "0 8px 18px rgba(47,58,69,0.12)",
        }}>VS</div>
      </PopAt>

      {/* 四处预告（词级锚点 103/113/123/133，最值钱 151） */}
      {[
        {x: 355, d: 103, t: "① 参数位置"},
        {x: 665, d: 113, t: "② 长度"},
        {x: 975, d: 123, t: "③ 幂等", hot: true},
        {x: 1285, d: 133, t: "④ 安全性"},
      ].map((p, i) => (
        <Pill key={i} f={f} delay={p.d} x={p.x} y={740} w={280} h={72}
          bg={p.hot ? YEL : "#f6f8fa"} text={p.t} color={INK} ts={32} />
      ))}
      <PopAt f={f} delay={151} x={1000} y={650} w={230} h={60} rot={-3}>
        <div style={{
          width: 230, height: 60, borderRadius: 999, backgroundColor: ORANGE,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontFamily: F, fontWeight: 900, fontSize: 30, color: "#fff", letterSpacing: 4,
          boxShadow: "0 10px 22px rgba(240,145,45,0.35)",
        }}>最值钱 ★</div>
      </PopAt>
      <Sparkle x={1590} y={250} s={0.8} />
    </AbsoluteFill>
  );
};

// P3 参数位置（s03 rel: GET53 拼75 网址86 后面95 收藏121 转发138 日志155 POST186 请求体213 地址栏247 干净264）
const PageParams: React.FC<{off: number}> = ({off}) => {
  const f = useCurrentFrame() - off;
  return (
    <AbsoluteFill>
      <BigTitle f={f} delay={-99} size={76} parts={[
        {t: "第一，", c: INK}, {t: "参数藏在哪", c: BLUE},
      ]} />

      {/* GET：参数拼在网址后面 */}
      <FlatCard f={f} delay={-99} x={150} y={270} w={800} h={580} chip="GET" chipColor={BLUE}>
        <UrlBar f={f} delay={75} x={40} y={90} w={720} h={96}>
          <div style={{fontFamily: "'Consolas, Menlo, monospace'", fontSize: 30, fontWeight: 700, whiteSpace: "nowrap"}}>
            <span style={{color: INK}}>blog.com/list?</span>
            <span style={{color: BLUE, backgroundColor: BLUE_BG, borderRadius: 6, padding: "2px 6px"}}>page=2&amp;kw=abc</span>
          </div>
        </UrlBar>
        <Label f={f} d={95} x={40} y={204} w={720} text="拼在网址后面" color={BLUE} size={30} weight={900} />

        <PopAt f={f} delay={121} x={40} y={268} w={720} h={88}>
          <div style={{position: "absolute", inset: 0, borderRadius: 18, backgroundColor: BLUE_BG, display: "flex", alignItems: "center"}}>
            <Ico d={D_STAR} x={80} y={44} s={1.7} c={ORANGE} />
            <div style={{marginLeft: 130, fontFamily: F, fontWeight: 900, fontSize: 32, color: INK}}>被收藏</div>
          </div>
        </PopAt>
        <PopAt f={f} delay={138} x={40} y={372} w={720} h={88}>
          <div style={{position: "absolute", inset: 0, borderRadius: 18, backgroundColor: BLUE_BG, display: "flex", alignItems: "center"}}>
            <Ico d={D_SHARE} x={80} y={44} s={1.7} c={BLUE} />
            <div style={{marginLeft: 130, fontFamily: F, fontWeight: 900, fontSize: 32, color: INK}}>被转发</div>
          </div>
        </PopAt>
        <PopAt f={f} delay={155} x={40} y={476} w={720} h={88}>
          <div style={{position: "absolute", inset: 0, borderRadius: 18, backgroundColor: BLUE_BG, display: "flex", alignItems: "center"}}>
            <Ico d={D_FILE} x={80} y={44} s={1.7} c="#55677c" />
            <div style={{marginLeft: 130, fontFamily: F, fontWeight: 900, fontSize: 32, color: INK}}>记进日志</div>
          </div>
        </PopAt>
      </FlatCard>

      {/* POST：参数放进请求体 */}
      <FlatCard f={f} delay={-99} x={1070} y={270} w={800} h={580} chip="POST" chipColor={ORANGE}>
        <UrlBar f={f} delay={195} x={40} y={90} w={720} h={96}>
          <div style={{fontFamily: "'Consolas, Menlo, monospace'", fontSize: 30, fontWeight: 700, color: INK, whiteSpace: "nowrap"}}>
            blog.com/list
          </div>
        </UrlBar>
        <PopAt f={f} delay={264} x={40} y={214} w={720} h={50}>
          <div style={{
            position: "absolute", left: 0, top: 0, width: 720, textAlign: "center",
            fontFamily: F, fontWeight: 900, fontSize: 30, color: GREEN,
          }}>地址栏干净 ✓</div>
        </PopAt>

        <PopAt f={f} delay={213} x={40} y={280} w={720} h={210}>
          <div style={{
            position: "absolute", inset: 0, borderRadius: 18, backgroundColor: ORANGE_BG,
            border: `3px dashed ${ORANGE}`,
          }}>
            <div style={{position: "absolute", left: 30, top: 18, fontFamily: F, fontWeight: 700, fontSize: 26, color: SUBC}}>请求体 Body</div>
            <div style={{position: "absolute", left: 0, top: 90, width: 720, textAlign: "center", fontFamily: "'Consolas, Menlo, monospace'", fontWeight: 700, fontSize: 32, color: INK, whiteSpace: "nowrap"}}>
              {"{ \"page\": 2, \"kw\": \"abc\" }"}
            </div>
          </div>
        </PopAt>
        <Label f={f} d={234} x={40} y={510} w={720} text="参数放进请求体" color={ORANGE} size={30} weight={900} />
      </FlatCard>

      <Sparkle x={985} y={230} s={0.8} />
    </AbsoluteFill>
  );
};

// P4 长度（s04 rel: 限制97 GET122 大文件144 POST164 约束188）
const PageLen: React.FC<{off: number}> = ({off}) => {
  const f = useCurrentFrame() - off;
  return (
    <AbsoluteFill>
      <BigTitle f={f} delay={-99} size={76} parts={[
        {t: "第二，", c: INK}, {t: "URL 长度限制", c: RED},
      ]} />

      {/* GET：网址栏塞不下大文件 */}
      <FlatCard f={f} delay={-99} x={150} y={280} w={800} h={470} chip="GET" chipColor={BLUE}>
        <UrlBar f={f} delay={20} x={40} y={90} w={720} h={96} danger>
          <div style={{fontFamily: "'Consolas, Menlo, monospace'", fontSize: 24, fontWeight: 700, color: RED, whiteSpace: "nowrap", overflow: "hidden", width: 620}}>
            blog.com/list?kw=aaaaaaaaaa…&amp;cb=bbbbbb…&amp;x=cc…
          </div>
        </UrlBar>
        <Label f={f} d={97} x={40} y={208} w={720} text="网址栏对 URL 长度有限制" color={RED} size={30} weight={900} />

        <Ico d={D_FILE} x={120} y={340} s={3.4} c="#55677c" />
        <PopAt f={f} delay={155} x={80} y={300} w={80} h={80}>
          <MarkBad x={40} y={40} s={1.1} />
        </PopAt>
        <Pill f={f} delay={149} x={220} y={295} w={540} h={90} bg={RED_BG} text="大文件塞不进网址" color={RED} ts={34} />
      </FlatCard>

      {/* POST：请求体没这个约束 */}
      <FlatCard f={f} delay={-99} x={1070} y={280} w={800} h={470} chip="POST" chipColor={ORANGE}>
        <UrlBar f={f} delay={30} x={40} y={90} w={720} h={80}>
          <div style={{fontFamily: "'Consolas, Menlo, monospace'", fontSize: 26, fontWeight: 700, color: INK, whiteSpace: "nowrap"}}>
            blog.com/upload
          </div>
        </UrlBar>
        <PopAt f={f} delay={40} x={40} y={200} w={720} h={160}>
          <div style={{
            position: "absolute", inset: 0, borderRadius: 18, backgroundColor: ORANGE_BG,
            border: `3px dashed ${ORANGE}`, display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <Ico d={D_FILE} x={200} y={80} s={3.2} c={ORANGE} />
            <div style={{marginLeft: 320, fontFamily: F, fontWeight: 900, fontSize: 32, color: INK}}>大文件装进请求体</div>
          </div>
        </PopAt>
        <Pill f={f} delay={188} x={100} y={380} w={600} h={70} bg={GREEN_BG} text="请求体没有这个限制 ✓" color={GREEN} ts={32} />
      </FlatCard>

      <FlashRing f={f} at={150} x={550} y={420} color={RED} />
      <Sparkle x={985} y={230} s={0.8} />
    </AbsoluteFill>
  );
};

// P5 幂等核心页·最长（s05 rel: 最值钱30 GET58 幂等69 一百次115 不变171 刷新221 预取235 POST253 扣款281 弹窗328 确认341）
const PageIdem: React.FC<{off: number}> = ({off}) => {
  const f = useCurrentFrame() - off;
  return (
    <AbsoluteFill>
      <BigTitle f={f} delay={-99} size={72} parts={[
        {t: "第三，", c: INK}, {t: "幂等", c: BLUE}, {t: " 才是最值钱的", c: INK},
      ]} />

      {/* 中缝分隔线 */}
      <svg width={W} height={H} style={{position: "absolute", inset: 0, pointerEvents: "none"}}>
        <line x1={960} y1={250} x2={960} y2={880} stroke="#d8e2ee" strokeWidth={4} strokeDasharray="10 14" />
      </svg>

      {/* 左：GET 幂等 */}
      <FlatCard f={f} delay={-99} x={150} y={280} w={280} h={190} chip="浏览器" chipColor={BLUE}>
        <Globe x={140} y={100} s={1.7} />
      </FlatCard>
      <FlatCard f={f} delay={-99} x={660} y={280} w={280} h={190} chip="服务器" chipColor={GREEN}>
        <ServerIcon x={140} y={100} s={1.5} />
      </FlatCard>
      <FlatArrow f={f} x1={440} y1={375} x2={650} y2={375} delay={-99} color="#9fb4c8" sw={6} />
      {/* 同一请求反复飞（词级锚点 100/115） */}
      <LoopPacket f={f} x1={450} y1={375} x2={640} y2={375} color={BLUE} start={100} period={44} dur={30} lift={12} size={32} />
      <Pill f={f} delay={115} x={310} y={520} w={460} h={70} bg={BLUE_BG} text="同一请求 ×100 次" color={BLUE} ts={32} />
      <PopAt f={f} delay={171} x={310} y={610} w={460} h={70}>
        <div style={{
          width: 460, height: 70, borderRadius: 35, backgroundColor: GREEN_BG,
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <span style={{fontFamily: F, fontWeight: 900, fontSize: 32, color: GREEN}}>状态：不变 ✓</span>
        </div>
      </PopAt>
      {/* 敢刷新 / 敢预取（词级锚点 221/235） */}
      <PopAt f={f} delay={221} x={150} y={720} w={280} h={70}>
        <div style={{
          width: 280, height: 70, borderRadius: 35, backgroundColor: GREEN_BG,
          display: "flex", alignItems: "center", justifyContent: "center", gap: 12,
        }}>
          <svg width={30} height={30} viewBox="0 0 24 24"><path d={D_REFRESH} fill={GREEN} /></svg>
          <span style={{fontFamily: F, fontWeight: 900, fontSize: 30, color: GREEN}}>敢刷新</span>
        </div>
      </PopAt>
      <PopAt f={f} delay={235} x={470} y={720} w={280} h={70}>
        <div style={{
          width: 280, height: 70, borderRadius: 35, backgroundColor: GREEN_BG,
          display: "flex", alignItems: "center", justifyContent: "center", gap: 12,
        }}>
          <svg width={30} height={30} viewBox="0 0 24 24"><path d={D_DOWNLOAD} fill={GREEN} /></svg>
          <span style={{fontFamily: F, fontWeight: 900, fontSize: 30, color: GREEN}}>敢预取</span>
        </div>
      </PopAt>

      {/* 右：POST 非幂等 */}
      <FlatCard f={f} delay={-99} x={1010} y={280} w={280} h={190} chip="浏览器" chipColor={ORANGE}>
        <Globe x={140} y={100} s={1.7} c={ORANGE} />
      </FlatCard>
      <FlatCard f={f} delay={-99} x={1520} y={280} w={280} h={190} chip="服务器" chipColor={GREEN}>
        <ServerIcon x={140} y={100} s={1.5} />
      </FlatCard>
      <FlatArrow f={f} x1={1300} y1={375} x2={1510} y2={375} delay={-99} color="#9fb4c8" sw={6} />
      <FlyPacket f={f} n="¥" x1={1310} y1={375} x2={1500} y2={375} t0={270} dur={30} color={ORANGE} />
      <Pill f={f} delay={281} x={1170} y={520} w={460} h={70} bg={RED_BG} text="下单 · 扣款" color={RED} ts={32} />

      {/* 刷新前弹窗（词级锚点 328/341） */}
      <PopAt f={f} delay={328} x={1120} y={620} w={560} h={180}>
        <div style={{
          width: 560, height: 180, borderRadius: 20, backgroundColor: "#fff",
          border: `3px solid ${RED}`, boxShadow: "0 14px 30px rgba(224,86,86,0.18)",
        }}>
          <div style={{position: "absolute", left: 0, top: 22, width: 560, textAlign: "center", fontFamily: F, fontWeight: 900, fontSize: 34, color: INK}}>
            确认再次提交吗？
          </div>
          <div style={{position: "absolute", left: 60, top: 95, width: 180, height: 56, borderRadius: 28, backgroundColor: "#eef1f5", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: F, fontWeight: 700, fontSize: 28, color: SUBC}}>取消</div>
          <div style={{position: "absolute", left: 320, top: 95, width: 180, height: 56, borderRadius: 28, backgroundColor: RED, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: F, fontWeight: 900, fontSize: 28, color: "#fff"}}>确认</div>
        </div>
      </PopAt>

      <Label f={f} d={95} x={150} y={190} w={790} text="GET · 随便重复发" color={BLUE} size={30} weight={900} />
      <Label f={f} d={253} x={1010} y={190} w={790} text="POST · 可能动状态" color={ORANGE} size={30} weight={900} />
    </AbsoluteFill>
  );
};

// P6 踩坑页（s06 rel: 有人82 删除95 写成121 GET132 爬虫150 扫165 数据177 没了202）
const PagePit: React.FC<{off: number}> = ({off}) => {
  const f = useCurrentFrame() - off;
  return (
    <AbsoluteFill>
      <BigTitle f={f} delay={-99} size={76} parts={[
        {t: "真实踩坑", c: RED},
      ]} />
      <Label f={f} d={60} x={150} y={630} w={530} text="爬虫会挨个访问它扫到的链接" color={SUBC} size={28} />

      {/* 删除接口写成 GET */}
      <FlatCard f={f} delay={-99} x={430} y={250} w={1060} h={230} chip="删除接口" chipColor={RED}>
        <div style={{position: "absolute", left: 0, top: 60, width: 1060, textAlign: "center", fontFamily: "'Consolas, Menlo, monospace'", fontSize: 26, color: SUBC, opacity: prog(f, 95, 10)}}>
          {"// 有人把删除接口写成了 GET"}
        </div>
        <div style={{
          position: "absolute", left: 0, top: 120, width: 1060, textAlign: "center",
          fontFamily: "'Consolas, Menlo, monospace'", fontWeight: 900, fontSize: 42, color: RED,
          opacity: prog(f, 121, 10), transform: `scale(${0.9 + 0.1 * ease(prog(f, 121, 10))})`, whiteSpace: "nowrap",
        }}>GET /api/user/delete?id=1</div>
      </FlatCard>

      {/* 爬虫扫过（词级锚点 150-165） */}
      <Spider f={f} t0={150} dur={16} x1={1500} x2={480} y={235} />
      <PopAt f={f} delay={165} x={380} y={180} w={60} h={60}><MarkBad x={30} y={30} s={1} /></PopAt>

      {/* 数据库被清空（词级锚点 202） */}
      <FlatCard f={f} delay={-99} x={710} y={560} w={500} h={280} chip="数据库" chipColor={RED}>
        <DbIcon x={250} y={100} s={1.05} />
        <PopAt f={f} delay={202} x={190} y={30} w={120} h={120}>
          <MarkBad x={60} y={60} s={2} />
        </PopAt>
        <div style={{
          position: "absolute", left: 0, top: 210, width: 500, textAlign: "center",
          fontFamily: F, fontWeight: 900, fontSize: 32, color: RED,
          opacity: prog(f, 202, 10),
        }}>整表数据被清空</div>
      </FlatCard>

      <FlashRing f={f} at={202} x={960} y={660} color={RED} />
      <Sparkle x={1650} y={700} s={0.8} color="#f3c1c1" />
    </AbsoluteFill>
  );
};

// P7 安全误区（s07 rel: 一样47 明文73 加密96 HTTPS117 没关系185）
const PageSafe: React.FC<{off: number}> = ({off}) => {
  const f = useCurrentFrame() - off;
  return (
    <AbsoluteFill>
      <BigTitle f={f} delay={-99} size={76} parts={[
        {t: "第四，谁更安全？", c: INK}, {t: " 都一样", c: GREEN},
      ]} />

      {/* GET / POST 明文一样 */}
      <FlatCard f={f} delay={-99} x={150} y={270} w={800} h={360} chip="GET" chipColor={BLUE}>
        <div style={{
          position: "absolute", left: 40, top: 100, width: 720, height: 90, borderRadius: 16,
          backgroundColor: "#f7f9fb", border: "3px solid #d8e2ee",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontFamily: "'Consolas, Menlo, monospace'", fontWeight: 700, fontSize: 34, color: INK,
          opacity: prog(f, 61, 10),
        }}>password=123456</div>
        <Label f={f} d={73} x={0} y={230} w={800} text="路上都是明文" color={RED} size={30} weight={900} />
      </FlatCard>

      <FlatCard f={f} delay={-99} x={1070} y={270} w={800} h={360} chip="POST" chipColor={ORANGE}>
        <div style={{
          position: "absolute", left: 40, top: 100, width: 720, height: 90, borderRadius: 16,
          backgroundColor: "#f7f9fb", border: "3px solid #d8e2ee",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontFamily: "'Consolas, Menlo, monospace'", fontWeight: 700, fontSize: 34, color: INK,
          opacity: prog(f, 66, 10),
        }}>password=123456</div>
        <Label f={f} d={73} x={0} y={230} w={800} text="路上都是明文" color={RED} size={30} weight={900} />
      </FlatCard>

      {/* 加密交给 HTTPS（词级锚点 96/117）；LockIcon 无 delay 参数，用 PopAt 包一层 */}
      <PopAt f={f} delay={96} x={404} y={636} w={152} h={209}>
        <LockIcon x={76} y={105} s={1.9} c={GREEN} />
      </PopAt>
      <Pill f={f} delay={117} x={580} y={700} w={440} h={84} bg={GREEN_BG} text="加密交给 HTTPS" color={GREEN} ts={34} />
      <Pill f={f} delay={185} x={500} y={820} w={920} h={74} bg="#f6f8fa" border={`3px dashed ${SUBC}`} text="跟方法本身没关系" color={SUBC} ts={32} />
      <Sparkle x={1080} y={690} s={0.8} />
    </AbsoluteFill>
  );
};

// P8 金句大字（s08 rel: GET27 拿41 POST55 办71 幂等137）—— 字幕在本页停用，金句整体停留 ≥3 秒
const PageQuote: React.FC<{off: number}> = ({off}) => {
  const f = useCurrentFrame() - off;
  return (
    <AbsoluteFill>
      {/* 巨字 拿 / 办（主视觉，随切页即时呈现） */}
      <PopAt f={f} delay={-99} x={420} y={250} w={400} h={420}>
        <div style={{position: "absolute", left: 0, top: 0, width: 400, height: 420}}>
          <div style={{
            position: "absolute", left: 100, top: 0, width: 200, height: 64, borderRadius: 999,
            backgroundColor: BLUE, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center",
            fontFamily: F, fontWeight: 900, fontSize: 34, letterSpacing: 4,
          }}>GET</div>
          <div style={{
            position: "absolute", left: 0, top: 80, width: 400, textAlign: "center",
            fontFamily: F, fontWeight: 900, fontSize: 220, color: BLUE, lineHeight: 1,
          }}>拿</div>
        </div>
      </PopAt>
      <PopAt f={f} delay={-99} x={1100} y={250} w={400} h={420}>
        <div style={{position: "absolute", left: 0, top: 0, width: 400, height: 420}}>
          <div style={{
            position: "absolute", left: 100, top: 0, width: 200, height: 64, borderRadius: 999,
            backgroundColor: ORANGE, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center",
            fontFamily: F, fontWeight: 900, fontSize: 34, letterSpacing: 4,
          }}>POST</div>
          <div style={{
            position: "absolute", left: 0, top: 80, width: 400, textAlign: "center",
            fontFamily: F, fontWeight: 900, fontSize: 220, color: ORANGE, lineHeight: 1,
          }}>办</div>
        </div>
      </PopAt>

      {/* 金句横幅 */}
      <PopAt f={f} delay={30} x={460} y={690} w={1000} h={90} rot={-1.2}>
        <div style={{
          width: 1000, height: 90, borderRadius: 20, backgroundColor: YEL,
          display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: "0 14px 30px rgba(247,201,72,0.4)",
        }}>
          <span style={{fontFamily: F, fontWeight: 900, fontSize: 46, color: INK, letterSpacing: 3}}>
            <span style={{color: BLUE}}>GET 是拿</span> · <span style={{color: ORANGE}}>POST 是办</span>
          </span>
        </div>
      </PopAt>
      <PopAt f={f} delay={100} x={460} y={806} w={1000} h={100} rot={-1.2}>
        <div style={{
          width: 1000, height: 100, borderRadius: 20, backgroundColor: YEL,
          display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: "0 14px 30px rgba(247,201,72,0.4)",
        }}>
          <span style={{fontFamily: F, fontWeight: 900, fontSize: 50, color: INK, letterSpacing: 3}}>
            能不能重复发，看 <span style={{color: RED}}>幂等</span>
          </span>
        </div>
      </PopAt>
      <Sparkle x={380} y={240} s={0.9} />
      <Sparkle x={1540} y={300} s={0.7} color="#b8d4f2" />
    </AbsoluteFill>
  );
};

// P9 截图卡+CTA（s09 rel: 速查卡14 合集134 关注167）—— 三行总结在卡出现20帧内全部就位，静止 ≥3 秒
const PageOutro: React.FC<{off: number}> = ({off}) => {
  const f = useCurrentFrame() - off;
  return (
    <AbsoluteFill>
      {/* 截图虚线框（随切页即时呈现） */}
      <div style={{
        position: "absolute", left: 310, top: 120, width: 1300, height: 640,
        border: "4px dashed #b8c4d2", borderRadius: 34,
      }} />

      <FlatCard f={f} delay={-99} x={330} y={140} w={1260} h={600} chip="面试速查卡" chipColor={ORANGE}>
        <div style={{
          position: "absolute", left: 0, top: 52, width: 1260, textAlign: "center",
          fontFamily: F, fontWeight: 900, fontSize: 52, color: INK, letterSpacing: 2, whiteSpace: "nowrap",
        }}>
          <span style={{color: BLUE}}>GET</span> vs <span style={{color: ORANGE}}>POST</span> 一张卡分清
        </div>

        <div style={{position: "absolute", left: 60, top: 170, width: 1140, height: 74}}>
          <div style={{position: "absolute", left: 0, top: 0, width: 220, height: 74, borderRadius: 16, backgroundColor: BLUE, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: F, fontWeight: 900, fontSize: 32, color: "#fff"}}>GET = 拿</div>
          <div style={{position: "absolute", left: 250, top: 0, width: 890, height: 74, display: "flex", alignItems: "center", fontFamily: F, fontWeight: 700, fontSize: 31, color: INK, whiteSpace: "nowrap"}}>参数在 URL · 幂等 · 可放心刷新</div>
        </div>
        <div style={{position: "absolute", left: 60, top: 262, width: 1140, height: 74}}>
          <div style={{position: "absolute", left: 0, top: 0, width: 220, height: 74, borderRadius: 16, backgroundColor: ORANGE, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: F, fontWeight: 900, fontSize: 32, color: "#fff"}}>POST = 办</div>
          <div style={{position: "absolute", left: 250, top: 0, width: 890, height: 74, display: "flex", alignItems: "center", fontFamily: F, fontWeight: 700, fontSize: 31, color: INK, whiteSpace: "nowrap"}}>参数在请求体 · 非幂等 · 刷新需确认</div>
        </div>
        <div style={{position: "absolute", left: 60, top: 354, width: 1140, height: 74}}>
          <div style={{position: "absolute", left: 0, top: 0, width: 220, height: 74, borderRadius: 16, backgroundColor: GREEN, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: F, fontWeight: 900, fontSize: 32, color: "#fff"}}>加密</div>
          <div style={{position: "absolute", left: 250, top: 0, width: 890, height: 74, display: "flex", alignItems: "center", fontFamily: F, fontWeight: 700, fontSize: 31, color: INK, whiteSpace: "nowrap"}}>看 HTTPS，不看方法</div>
        </div>

        <div style={{
          position: "absolute", left: 0, top: 500, width: 1260, textAlign: "center",
          fontFamily: F, fontWeight: 700, fontSize: 30, color: SUBC, letterSpacing: 3,
        }}>全栈小秋 · 0 基础也能学会</div>
      </FlatCard>

      {/* 关注 CTA：底边 890，距底部 190 ≥ 170 安全区 */}
      <PopAt f={f} delay={100} x={700} y={790} w={520} h={100}>
        <div style={{
          width: 520, height: 100, borderRadius: 50, backgroundColor: ORANGE,
          display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: "0 14px 30px rgba(240,145,45,0.4)",
          fontFamily: F, fontWeight: 900, fontSize: 44, color: "#fff", letterSpacing: 6,
        }}>关注 全栈小秋</div>
      </PopAt>
      <Sparkle x={300} y={140} s={0.9} />
      <Sparkle x={1620} y={200} s={0.7} color="#bfe3cc" />
    </AbsoluteFill>
  );
};

// ============ 主组件 ============

const PAGES = [
  {C: PageHook, start: SENT[0], end: SENT[1]},
  {C: PageTwo, start: SENT[1], end: SENT[2]},
  {C: PageParams, start: SENT[2], end: SENT[3]},
  {C: PageLen, start: SENT[3], end: SENT[4]},
  {C: PageIdem, start: SENT[4], end: SENT[5]},
  {C: PagePit, start: SENT[5], end: SENT[6]},
  {C: PageSafe, start: SENT[6], end: SENT[7]},
  {C: PageQuote, start: SENT[7], end: SENT[8]},
  {C: PageOutro, start: SENT[8], end: DUR},
];

export const GetVsPost: React.FC = () => {
  const frame = useCurrentFrame();
  const bed = interpolate(frame, [0, 20, DUR - 40, DUR - 6], [0, 0.06, 0.06, 0], clamp);
  return (
    <AbsoluteFill style={{background: "linear-gradient(180deg,#fff 0%,#f3f6f9 100%)", fontFamily: F, overflow: "hidden"}}>
      <BgDots />
      {PAGES.map(({C, start, end}, i) => {
        const last = i === PAGES.length - 1, len = end - start;
        return (
          <Sequence key={i} from={start} durationInFrames={last ? DUR - start : len}>
            <C off={0} />
          </Sequence>
        );
      })}
      {/* 右上角角标 */}
      <div style={{
        position: "absolute", top: 45, right: 70, zIndex: 45, border: `3px solid ${BLUE}`,
        borderRadius: 999, padding: "7px 25px", fontSize: 28, fontWeight: 900, color: INK,
        letterSpacing: 5, background: "#fff",
      }}>全栈小秋</div>

      {/* 配音：getpost-tts（云健 +15%，2026-09-14） */}
      {SENT.map((start, i) => (
        <Sequence key={`v-${i}`} from={start} durationInFrames={i < 8 ? SENT[i + 1] - start + 10 : DUR - start}>
          <Audio src={staticFile(`audio/getpost-tts/s0${i + 1}.mp3`)} volume={1} />
        </Sequence>
      ))}

      {/* 音效层：全部从 SENT / 词级锚点推导 */}
      {PAGES.slice(1).map((p, i) => (
        <Sequence key={`pg-${i}`} from={p.start} durationInFrames={20}>
          <Audio src={staticFile("audio/sfx/transfer.wav")} volume={0.14} />
        </Sequence>
      ))}
      {/* P1 气泡 + 摇头 */}
      {[17, 92, 122].map((t) => (
        <Sequence key={`pop1-${t}`} from={SENT[0] + t} durationInFrames={10}>
          <Audio src={staticFile("audio/sfx/pop.wav")} volume={0.26} />
        </Sequence>
      ))}
      <Sequence from={SENT[0] + 179} durationInFrames={22}>
        <Audio src={staticFile("audio/sfx/error.wav")} volume={0.3} />
      </Sequence>
      {/* P2 四处预告 + 最值钱 */}
      {[103, 133].map((t) => (
        <Sequence key={`pop2-${t}`} from={SENT[1] + t} durationInFrames={10}>
          <Audio src={staticFile("audio/sfx/pop.wav")} volume={0.26} />
        </Sequence>
      ))}
      <Sequence from={SENT[1] + 151} durationInFrames={20}>
        <Audio src={staticFile("audio/sfx/ding.wav")} volume={0.32} />
      </Sequence>
      {/* P3 标签行 + 请求体 + 地址栏干净 */}
      {[121, 155, 213].map((t) => (
        <Sequence key={`pop3-${t}`} from={SENT[2] + t} durationInFrames={10}>
          <Audio src={staticFile("audio/sfx/pop.wav")} volume={0.26} />
        </Sequence>
      ))}
      <Sequence from={SENT[2] + 264} durationInFrames={20}>
        <Audio src={staticFile("audio/sfx/success.wav")} volume={0.24} />
      </Sequence>
      {/* P4 塞不下 / 没约束 */}
      <Sequence from={SENT[3] + 144} durationInFrames={22}>
        <Audio src={staticFile("audio/sfx/error.wav")} volume={0.3} />
      </Sequence>
      <Sequence from={SENT[3] + 188} durationInFrames={18}>
        <Audio src={staticFile("audio/sfx/success.wav")} volume={0.24} />
      </Sequence>
      {/* P5 幂等核心页 */}
      <Sequence from={SENT[4] + 100} durationInFrames={12}>
        <Audio src={staticFile("audio/sfx/whoosh.wav")} volume={0.12} />
      </Sequence>
      {[171, 221, 235].map((t) => (
        <Sequence key={`pop5-${t}`} from={SENT[4] + t} durationInFrames={10}>
          <Audio src={staticFile("audio/sfx/pop.wav")} volume={0.26} />
        </Sequence>
      ))}
      <Sequence from={SENT[4] + 270} durationInFrames={12}>
        <Audio src={staticFile("audio/sfx/whoosh.wav")} volume={0.12} />
      </Sequence>
      <Sequence from={SENT[4] + 281} durationInFrames={10}>
        <Audio src={staticFile("audio/sfx/pop.wav")} volume={0.28} />
      </Sequence>
      <Sequence from={SENT[4] + 341} durationInFrames={18}>
        <Audio src={staticFile("audio/sfx/success.wav")} volume={0.24} />
      </Sequence>
      {/* P6 爬虫 / 清空 */}
      <Sequence from={SENT[5] + 121} durationInFrames={10}>
        <Audio src={staticFile("audio/sfx/pop.wav")} volume={0.26} />
      </Sequence>
      <Sequence from={SENT[5] + 150} durationInFrames={12}>
        <Audio src={staticFile("audio/sfx/whoosh.wav")} volume={0.2} />
      </Sequence>
      <Sequence from={SENT[5] + 202} durationInFrames={22}>
        <Audio src={staticFile("audio/sfx/error.wav")} volume={0.32} />
      </Sequence>
      {/* P7 明文 / HTTPS / 没关系 */}
      {[61, 66].map((t) => (
        <Sequence key={`pop7-${t}`} from={SENT[6] + t} durationInFrames={10}>
          <Audio src={staticFile("audio/sfx/pop.wav")} volume={0.26} />
        </Sequence>
      ))}
      <Sequence from={SENT[6] + 117} durationInFrames={18}>
        <Audio src={staticFile("audio/sfx/success.wav")} volume={0.24} />
      </Sequence>
      <Sequence from={SENT[6] + 185} durationInFrames={10}>
        <Audio src={staticFile("audio/sfx/pop.wav")} volume={0.26} />
      </Sequence>
      {/* P8 金句三段 */}
      {[30, 41, 71, 100].map((t) => (
        <Sequence key={`pop8-${t}`} from={SENT[7] + t} durationInFrames={10}>
          <Audio src={staticFile("audio/sfx/pop.wav")} volume={0.26} />
        </Sequence>
      ))}
      {/* P9 关注 CTA */}
      <Sequence from={SENT[8] + 100} durationInFrames={10}>
        <Audio src={staticFile("audio/sfx/pop.wav")} volume={0.34} />
      </Sequence>

      <Audio src={staticFile("audio/bed.wav")} loop volume={() => bed} />
      <Subtitle />
    </AbsoluteFill>
  );
};
