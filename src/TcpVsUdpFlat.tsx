import React from "react";
import {Audio} from "@remotion/media";
import {AbsoluteFill, interpolate, Sequence, staticFile, useCurrentFrame} from "remotion";
import {
  INK, SUBC, BLUE, BLUE_BG, GREEN, GREEN_BG, ORANGE, ORANGE_BG, RED, RED_BG, YEL, BORDER, F, W, H,
  clamp, ease, prog, BgDots, BigTitle, Sparkle, FlashRing, LoopPacket, BulbFlat,
  Cloud, SpeechBubble, Float, MarkOk, MarkBad, FlatPerson, Globe, ServerIcon, SpinnerFlat,
} from "./flatKit";

// ============ 扁平可爱插画科普风 · TCP vs UDP（与"端口映射vs内网穿透"同模板，全栈小秋 IP） ============
// 结构：钩子提问 → 双协议登场 → 打电话比喻 → 大喇叭比喻 → 编号签收 → 连发反差 → 场景 → 总结 → 下期+关注
// 语义色：TCP = 蓝（可靠） / UDP = 橙（快速低延迟）

export const DUR = 1605;

const voiceLines = [
  {audio: "s01.mp3", start: 0, end: 82},
  {audio: "s02.mp3", start: 80, end: 256},
  {audio: "s03.mp3", start: 254, end: 370},
  {audio: "s04.mp3", start: 367, end: 486},
  {audio: "s05.mp3", start: 483, end: 701},
  {audio: "s06.mp3", start: 698, end: 941},
  {audio: "s07.mp3", start: 939, end: 1148},
  {audio: "s08.mp3", start: 1145, end: 1362},
  {audio: "s09.mp3", start: 1359, end: 1580},
];

type Sub = {s: number; e: number; t: string};
const subs: Sub[] = [
  {s: 3, e: 44, t: "你看视频的时候"},
  {s: 44, e: 85, t: "数据到底是怎么传过来的"},
  {s: 90, e: 136, t: "背后离不开两个协议"},
  {s: 136, e: 187, t: "TCP 和 UDP"},
  {s: 187, e: 228, t: "一个更追求可靠"},
  {s: 228, e: 259, t: "一个更追求速度"},
  {s: 265, e: 307, t: "TCP 像打电话"},
  {s: 307, e: 341, t: "先问一句 听到了吗"},
  {s: 341, e: 373, t: "听到了 才继续说"},
  {s: 378, e: 437, t: "UDP 像拿大喇叭喊话"},
  {s: 437, e: 461, t: "喊完就走"},
  {s: 461, e: 489, t: "不管你听没听到"},
  {s: 494, e: 570, t: "TCP 发每个包 都编号签收"},
  {s: 570, e: 611, t: "发现第三个没到"},
  {s: 611, e: 645, t: "就问一句 3？"},
  {s: 645, e: 676, t: "然后重新发"},
  {s: 676, e: 704, t: "确认收到 才继续"},
  {s: 709, e: 763, t: "UDP 呢 五个包连续发"},
  {s: 763, e: 840, t: "中间丢了 也不等 不确认 不重传"},
  {s: 840, e: 911, t: "它不提供 TCP 那样的可靠机制"},
  {s: 911, e: 944, t: "但换来了低延迟"},
  {s: 950, e: 1057, t: "网页 文件 登录 走 TCP"},
  {s: 1057, e: 1150, t: "直播 游戏 DNS 走 UDP"},
  {s: 1156, e: 1209, t: "TCP 更强调可靠性"},
  {s: 1209, e: 1289, t: "UDP 更强调低延迟和效率"},
  {s: 1289, e: 1365, t: "不是谁更好 而是看场景需要什么"},
  {s: 1370, e: 1450, t: "浏览器输入网址后 到底发生了什么"},
  {s: 1450, e: 1568, t: "关注全栈小秋 把计算机基础讲明白"},
];

// ---------- 基础原语（同 PortMapVsTunnel） ----------

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

// 居中标签文字
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

// 带编号的飞行数据包（一次性飞行，可坠落）
const FlyPacket: React.FC<{
  f: number; n: string; x1: number; y1: number; x2: number; y2: number;
  t0: number; dur?: number; color?: string; fall?: number;
}> = ({f, n, x1, y1, x2, y2, t0, dur = 32, color = GREEN, fall}) => {
  const t = (f - t0) / dur;
  if (t <= 0 || t >= 1) return null;
  let x = x1 + (x2 - x1) * t;
  let y = y1 + (y2 - y1) * t - Math.sin(Math.PI * t) * 16;
  let rot = 0, op = 1;
  if (fall !== undefined && t >= fall) {
    const ft = (t - fall) / (1 - fall);
    y += ease(ft) * 190;
    rot = ease(ft) * 150;
    op = 1 - ft * 0.45;
  }
  return (
    <div style={{
      position: "absolute", left: x, top: y, opacity: op,
      transform: `translate(-50%,-50%) rotate(${rot}deg)`,
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

// ---------- 主题图标（material 风格路径，24x24 缩放） ----------

const Ico: React.FC<{d: string; x: number; y: number; s?: number; c?: string}> = ({d, x, y, s = 1, c = INK}) => (
  <svg width={24 * s} height={24 * s} viewBox="0 0 24 24"
    style={{position: "absolute", left: x - 12 * s, top: y - 12 * s, overflow: "visible"}}>
    <path d={d} fill={c} />
  </svg>
);

const D_HANDSET = "M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.21c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z";
const D_MEGA = "M18 11v2h4v-2h-4zm-2 6.61c.96.71 2.21 1.65 3.2 2.39.4-.53.8-1.07 1.2-1.6-.99-.74-2.24-1.68-3.2-2.4-.4.54-.8 1.08-1.2 1.61zM20 4v2h4V4h-4zm-2-1.61v3.22c.96-.71 2.21-1.65 3.2-2.39-.4-.53-.8-1.07-1.2-1.61-.99.74-2.24 1.68-3.2 2.4zM4 9c-1.1 0-2 .9-2 2v2c0 1.1.9 2 2 2h1v4h2v-4h1l5 3V6L8 9H4zm11.5 4c0-1.33-.58-2.53-1.5-3.35v6.69c.92-.81 1.5-2.01 1.5-3.34z";
const D_SHIELD = "M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm-1 15l-4-4 1.41-1.41L11 13.17l5.59-5.59L18 9l-7 7z";
const D_BOLT = "M7 2v11h3v9l7-12h-4l4-8z";
const D_FILE = "M6 2c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6H6zm7 7V3.5L18.5 9H13zm-5 5h8v2H8v-2zm0 4h8v2H8v-2z";
const D_KEY = "M12.65 10C11.83 7.67 9.61 6 7 6c-3.31 0-6 2.69-6 6s2.69 6 6 6c2.61 0 4.83-1.67 5.65-4H17v4h4v-4h2v-4H12.65zM7 14c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2z";
const D_LIVE = "M21 6h-7.59l3.29-3.29L16 2l-4 4-4-4-.71.71L10.59 6H3c-1.1 0-2 .89-2 2v12c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2V8c0-1.11-.9-2-2-2zm0 14H3V8h18v12zM9 10v8l7-4z";
const D_PAD = "M21 6H3c-1.1 0-2 .9-2 2v8c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zM11 13H8v3H6v-3H3v-2h3V8h2v3h3v2zm4.5 2c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm4-3c-.83 0-1.5-.67-1.5-1.5S18.67 9 19.5 9s1.5.67 1.5 1.5-.67 1.5-1.5 1.5z";
const D_HEART = "M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z";
const D_COMMENT = "M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z";
const D_SHARE = "M14 9V5l7 7-7 7v-4.1c-5 0-8.5 1.6-11 5.1 1-5 4-10 11-11z";
const D_MUSIC = "M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z";

// 大喇叭声波弧线（脉冲扩散）
const MegaWaves: React.FC<{f: number; x: number; y: number; delay: number; color?: string}> = ({f, x, y, delay, color = ORANGE}) => {
  if (f < delay) return null;
  const t = f - delay;
  return (
    <svg width={W} height={H} style={{position: "absolute", left: 0, top: 0, overflow: "visible", pointerEvents: "none"}}>
      {[0, 14, 28].map((off, i) => {
        const p = (((t - off) % 42) + 42) % 42 / 42;
        if (t < off) return null;
        return (
          <path key={i} d={`M ${x + 70 + i * 8} ${y - 90 + i * 16} Q ${x + 130 + p * 90} ${y} ${x + 70 + i * 8} ${y + 90 - i * 16}`}
            fill="none" stroke={color} strokeWidth={9 - i * 2} strokeLinecap="round"
            opacity={(1 - p) * (0.85 - i * 0.18)} />
        );
      })}
    </svg>
  );
};

// ---------- 翻页与字幕 ----------

const PageTurn: React.FC<{children: React.ReactNode; off: number; len: number; first: boolean; last: boolean}> = ({children, off, len, first, last}) => {
  const frame = useCurrentFrame();
  const oIn = first ? 1 : interpolate(frame, [0, 10], [0, 1], clamp);
  const lf = frame - off;
  const oOut = last ? 1 : interpolate(lf, [len - 10, len], [1, 0], clamp);
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
        fontFamily: F, fontWeight: 700, fontSize: 44, color: "#fff", letterSpacing: 2, whiteSpace: "nowrap",
      }}>{cur.t}</div>
    </div>
  );
};

// ============ 页面 ============

// P1 钩子：数据怎么传过来的（首帧即完整）
const PageHook: React.FC<{off: number}> = ({off}) => {
  const f = useCurrentFrame() - off;
  return (
    <AbsoluteFill>
      <BigTitle f={f} delay={-99} y={78} size={84} parts={[
        {t: "数据", c: ORANGE}, {t: "到底是怎么传过来的？", c: INK},
      ]} />
      <Sparkle x={430} y={110} s={0.8} />
      <Sparkle x={1500} y={88} s={0.65} color="#b8d4f2" />

      {/* 左：看视频的人 */}
      <PopAt f={f} delay={-99} x={250} y={280} w={340} h={640}>
        <Float f={f} x={0} y={0} w={340} h={640} amp={6}>
          <div style={{position: "absolute", left: 10, top: 10, width: 320, height: 620}}>
            {/* 机身：深色一体化外壳 + 电源/音量侧键 */}
            <div style={{position: "absolute", inset: 0, backgroundColor: "#3f4d5e", borderRadius: 48, boxShadow: "0 18px 38px rgba(47,58,69,0.18)"}} />
            <div style={{position: "absolute", right: -7, top: 150, width: 7, height: 78, borderRadius: 4, backgroundColor: "#2f3a45"}} />
            <div style={{position: "absolute", left: -7, top: 130, width: 7, height: 48, borderRadius: 4, backgroundColor: "#2f3a45"}} />
            <div style={{position: "absolute", left: -7, top: 190, width: 7, height: 48, borderRadius: 4, backgroundColor: "#2f3a45"}} />
            {/* 屏幕：竖屏短视频 App 界面 */}
            <div style={{position: "absolute", left: 14, top: 14, width: 292, height: 592, borderRadius: 36, overflow: "hidden", background: "linear-gradient(165deg,#4a86d8 0%,#7db3dd 48%,#f0912d 118%)"}}>
              {/* 状态栏：时间 / 信号 / 电量 */}
              <div style={{position: "absolute", left: 18, top: 10, fontFamily: F, fontSize: 17, fontWeight: 700, color: "#fff"}}>12:30</div>
              <div style={{position: "absolute", right: 16, top: 13, display: "flex", gap: 5, alignItems: "flex-end"}}>
                {[6, 9, 12, 15].map((h, i) => (
                  <div key={i} style={{width: 4, height: h, borderRadius: 1.5, backgroundColor: "#fff", opacity: i < 3 ? 0.95 : 0.4}} />
                ))}
                <div style={{width: 21, height: 11, border: "2px solid #fff", borderRadius: 3.5, marginLeft: 3, padding: 1.5}}>
                  <div style={{width: "70%", height: "100%", backgroundColor: "#fff", borderRadius: 1}} />
                </div>
              </div>
              {/* 挖孔摄像头 */}
              <div style={{position: "absolute", left: 139, top: 9, width: 14, height: 14, borderRadius: 999, backgroundColor: "#2f3a45", border: "2px solid rgba(255,255,255,0.3)"}} />
              {/* 视频画面：小人在白板前讲课 */}
              <div style={{position: "absolute", left: 41, top: 76, width: 210, height: 138, backgroundColor: "#fff", borderRadius: 12, border: "4px solid #e0e6ec", boxShadow: "0 6px 14px rgba(47,58,69,0.25)"}}>
                <div style={{position: "absolute", left: 24, bottom: 14, width: 18, height: 44, borderRadius: 4, backgroundColor: BLUE}} />
                <div style={{position: "absolute", left: 52, bottom: 14, width: 18, height: 70, borderRadius: 4, backgroundColor: ORANGE}} />
                <div style={{position: "absolute", left: 80, bottom: 14, width: 18, height: 56, borderRadius: 4, backgroundColor: GREEN}} />
                <svg width={100} height={40} viewBox="0 0 100 40" style={{position: "absolute", right: 14, top: 12}}>
                  <path d="M4 34 L30 20 L56 26 L96 6" fill="none" stroke="#3f4d5e" strokeWidth={5} strokeLinecap="round" strokeLinejoin="round" />
                  <circle cx={96} cy={6} r={5} fill={ORANGE} />
                </svg>
              </div>
              <svg width={90} height={110} viewBox="0 0 90 110" style={{position: "absolute", left: 176, top: 158}}>
                <path d="M28 58 L4 40" stroke={GREEN} strokeWidth={10} strokeLinecap="round" />
                <circle cx={40} cy={26} r={20} fill="#f6cfa4" stroke="#3f4d5e" strokeWidth={4} />
                <path d="M22 20 Q40 2 58 20 Q46 10 40 11 Q34 10 22 20 Z" fill="#3f4d5e" />
                <circle cx={33} cy={28} r={3} fill="#3f4d5e" />
                <circle cx={47} cy={28} r={3} fill="#3f4d5e" />
                <path d="M34 36 Q40 40 46 36" fill="none" stroke="#3f4d5e" strokeWidth={3} strokeLinecap="round" />
                <rect x={22} y={48} width={36} height={44} rx={13} fill={GREEN} />
                <rect x={24} y={92} width={14} height={14} rx={5} fill="#3f4d5e" />
                <rect x={44} y={92} width={14} height={14} rx={5} fill="#3f4d5e" />
              </svg>
              {/* 画面还在缓冲：马赛克块 + 转圈（呼应数据传输） */}
              {[0, 1, 2, 3].map((k) => (
                <div key={k} style={{position: "absolute", left: 36 + k * 26, bottom: 175, width: 18, height: 18, borderRadius: 3, backgroundColor: "#fff", opacity: 0.9 - k * 0.22}} />
              ))}
              <SpinnerFlat f={f} x={226} y={404} d={0} s={0.5} color={ORANGE} />
              {/* 右侧互动栏：转发 / 评论 / 点赞 */}
              <svg width={36} height={36} viewBox="0 0 24 24" style={{position: "absolute", right: 14, bottom: 148, opacity: 0.95}}><path d={D_SHARE} fill="#fff" /></svg>
              <svg width={36} height={36} viewBox="0 0 24 24" style={{position: "absolute", right: 14, bottom: 218, opacity: 0.95}}><path d={D_COMMENT} fill="#fff" /></svg>
              <svg width={40} height={40} viewBox="0 0 24 24" style={{position: "absolute", right: 12, bottom: 288}}><path d={D_HEART} fill="#ff6060" /></svg>
              {/* UP 主文案 + 背景音乐 */}
              <div style={{position: "absolute", left: 16, bottom: 66, fontFamily: F, fontWeight: 900, fontSize: 22, color: "#fff", textShadow: "0 2px 6px rgba(47,58,69,0.4)", whiteSpace: "nowrap"}}>@全栈小秋</div>
              <div style={{position: "absolute", left: 16, bottom: 46, width: 150, height: 9, borderRadius: 5, backgroundColor: "rgba(255,255,255,0.55)"}} />
              <svg width={22} height={22} viewBox="0 0 24 24" style={{position: "absolute", right: 14, bottom: 42, opacity: 0.9}}><path d={D_MUSIC} fill="#fff" /></svg>
              {/* 播放进度条 */}
              <div style={{position: "absolute", left: 0, right: 0, bottom: 14, height: 5, backgroundColor: "rgba(255,255,255,0.35)"}}>
                <div style={{width: "58%", height: "100%", backgroundColor: "#fff"}} />
              </div>
              {/* 点赞小红心循环上飘 */}
              {[0, 30].map((off) => {
                const t = (((f - 20 - off) % 56) + 56) % 56 / 56;
                if (f < 20 + off) return null;
                return (
                  <svg key={off} width={20} height={20} viewBox="0 0 24 24" style={{
                    position: "absolute", right: 22 + (off ? 16 : 0), bottom: 300 + t * 130,
                    opacity: (1 - t) * 0.9, transform: `scale(${0.8 + t * 0.4})`,
                  }}><path d={D_HEART} fill="#ff8080" /></svg>
                );
              })}
            </div>
          </div>
        </Float>
      </PopAt>
      <Label f={f} d={-99} x={250} y={930} w={340} text="你" size={30} color={SUBC} />

      {/* 右：远端服务器 */}
      <PopAt f={f} delay={-99} x={1440} y={300} w={340} h={420}>
        <Float f={f} x={0} y={0} w={340} h={420} amp={5}>
          <Cloud x={170} y={30} s={1.15} />
          <ServerIcon x={170} y={230} s={1.7} />
        </Float>
      </PopAt>
      <Label f={f} d={-99} x={1440} y={740} w={340} text="远端服务器" size={32} color={SUBC} />

      {/* 中间：数据包飞行路 */}
      <FlatArrow f={f} x1={1390} y1={470} x2={640} y2={470} delay={-99} color="#9fb4c8" dashed sw={6} />
      <LoopPacket f={f} x1={1370} y1={470} x2={670} y2={470} color={ORANGE} start={16} period={64} dur={40} lift={22} size={40} />
      <LoopPacket f={f} x1={1370} y1={470} x2={670} y2={470} color={BLUE} start={48} period={64} dur={40} lift={22} size={40} />
      <Label f={f} d={16} x={810} y={380} w={300} text="数据包" size={30} color={SUBC} />

      <Pill f={f} delay={50} x={790} y={590} w={340} h={72} bg={ORANGE_BG} border={`3px dashed ${ORANGE}`} text="经过了什么？" color={ORANGE} ts={34} />
      <BulbFlat x={1160} y={840} s={0.9} />
    </AbsoluteFill>
  );
};

// P2 两位主角登场：TCP 可靠 / UDP 快速（只保留大标题+两张卡，不塞）
const PageTwo: React.FC<{off: number}> = ({off}) => {
  const f = useCurrentFrame() - off;
  return (
    <AbsoluteFill>
      <Pill f={f} delay={8} x={660} y={64} w={600} h={66} bg={ORANGE_BG} text="视频流畅背后 · 两个协议" color={ORANGE} ts={32} />
      <BigTitle f={f} delay={50} y={158} parts={[
        {t: "TCP", c: BLUE}, {t: " 和 ", c: INK}, {t: "UDP", c: ORANGE},
      ]} />

      <FlatCard f={f} delay={52} x={175} y={330} w={720} h={470} chip="TCP" chipColor={BLUE}>
        <Ico d={D_SHIELD} x={360} y={150} s={4.2} c={BLUE} />
        <div style={{position: "absolute", left: 0, top: 250, width: 720, textAlign: "center", fontFamily: F, fontSize: 34, color: SUBC}}>更追求</div>
        <div style={{position: "absolute", left: 0, top: 302, width: 720, textAlign: "center", fontFamily: F, fontWeight: 900, fontSize: 84, color: BLUE, letterSpacing: 8, opacity: prog(f, 120, 10), transform: `scale(${0.7 + 0.3 * ease(prog(f, 120, 10))})`}}>可靠</div>
        <div style={{position: "absolute", left: 0, top: 424, width: 720, textAlign: "center", fontFamily: F, fontSize: 27, color: SUBC, opacity: prog(f, 128, 12)}}>一个字节都不能丢</div>
      </FlatCard>

      <FlatCard f={f} delay={56} x={1025} y={330} w={720} h={470} chip="UDP" chipColor={ORANGE}>
        <Ico d={D_BOLT} x={360} y={150} s={4.2} c={ORANGE} />
        <div style={{position: "absolute", left: 0, top: 250, width: 720, textAlign: "center", fontFamily: F, fontSize: 34, color: SUBC}}>更追求</div>
        <div style={{position: "absolute", left: 0, top: 302, width: 720, textAlign: "center", fontFamily: F, fontWeight: 900, fontSize: 84, color: ORANGE, letterSpacing: 8, opacity: prog(f, 158, 10), transform: `scale(${0.7 + 0.3 * ease(prog(f, 158, 10))})`}}>速度</div>
        <div style={{position: "absolute", left: 0, top: 424, width: 720, textAlign: "center", fontFamily: F, fontSize: 27, color: SUBC, opacity: prog(f, 166, 12)}}>快就完事了</div>
      </FlatCard>

      <PopAt f={f} delay={72} x={910} y={515} w={100} h={100}>
        <div style={{
          width: 100, height: 100, borderRadius: 999, backgroundColor: "#fff",
          border: `5px solid ${YEL}`, display: "flex", alignItems: "center", justifyContent: "center",
          fontFamily: F, fontWeight: 900, fontSize: 40, color: INK, boxShadow: "0 8px 18px rgba(47,58,69,0.12)",
        }}>VS</div>
      </PopAt>
      <Sparkle x={170} y={855} s={0.8} />
      <Sparkle x={1800} y={240} s={0.7} />
    </AbsoluteFill>
  );
};

// P3 TCP 像打电话：问一句听到了吗，听到了才继续
const PageCall: React.FC<{off: number}> = ({off}) => {
  const f = useCurrentFrame() - off;
  return (
    <AbsoluteFill>
      <BigTitle f={f} delay={0} parts={[
        {t: "TCP", c: BLUE}, {t: " 像打电话", c: INK},
      ]} />

      <PopAt f={f} delay={6} x={300} y={430} w={260} h={340}>
        <Float f={f} x={0} y={0} w={260} h={340} amp={5}>
          <FlatPerson x={130} y={170} color={BLUE} s={1.3} />
        </Float>
      </PopAt>
      <Ico d={D_HANDSET} x={470} y={430} s={2.4} c={BLUE} />
      <PopAt f={f} delay={6} x={1360} y={430} w={260} h={340}>
        <Float f={f} x={0} y={0} w={260} h={340} amp={5}>
          <FlatPerson x={130} y={170} color="#3f4d5e" s={1.3} />
        </Float>
      </PopAt>
      <Ico d={D_HANDSET} x={1450} y={430} s={2.4} c={BLUE} />

      <svg width={W} height={H} style={{position: "absolute", inset: 0, pointerEvents: "none"}}>
        <line x1={620} y1={520} x2={1300} y2={520} stroke="#c3d2e2" strokeWidth={5} strokeDasharray="12 14" opacity={prog(f, 6, 10)} />
      </svg>

      <SpeechBubble f={f} d={45} x={640} y={300} w={300} h={110} text="听到了吗？" ts={40} c={BLUE} />
      <SpeechBubble f={f} d={79} x={1020} y={300} w={280} h={110} text="听到了！" ts={40} c={GREEN} tc={GREEN} />
      <PopAt f={f} delay={83} x={930} y={530} w={60} h={60}><MarkOk x={30} y={30} s={1.1} /></PopAt>
      <Pill f={f} delay={86} x={620} y={680} w={680} h={74} bg={GREEN_BG} text="确认了 才继续说" color={GREEN} ts={36} />
      <Sparkle x={1240} y={620} s={0.8} />
    </AbsoluteFill>
  );
};

// P4 UDP 像大喇叭喊话：喊完就走，不管听没听到
const PageMegaphone: React.FC<{off: number}> = ({off}) => {
  const f = useCurrentFrame() - off;
  return (
    <AbsoluteFill>
      <BigTitle f={f} delay={0} parts={[
        {t: "UDP", c: ORANGE}, {t: " 像拿大喇叭喊话", c: INK},
      ]} />

      {/* 喊话的人 */}
      <PopAt f={f} delay={6} x={280} y={420} w={300} h={360}>
        <Float f={f} x={0} y={0} w={300} h={360} amp={5}>
          <FlatPerson x={130} y={180} color={ORANGE} s={1.4} />
        </Float>
      </PopAt>
      <PopAt f={f} delay={10} x={520} y={330} w={200} h={200}>
        <Ico d={D_MEGA} x={80} y={80} s={5} c={ORANGE} />
      </PopAt>
      <MegaWaves f={f} x={700} y={400} delay={13} />

      {/* 听众：一个没听到 */}
      <PopAt f={f} delay={10} x={1330} y={430} w={240} h={330}>
        <FlatPerson x={120} y={165} color={GREEN} s={1.2} />
      </PopAt>
      <PopAt f={f} delay={14} x={1580} y={450} w={240} h={330}>
        <Float f={f} x={0} y={0} w={240} h={330} amp={5}>
          <FlatPerson x={120} y={165} color="#8896a6" s={1.2} />
        </Float>
      </PopAt>
      <div style={{
        position: "absolute", left: 1560, top: 270, width: 90, textAlign: "center",
        fontFamily: F, fontWeight: 900, fontSize: 64, color: RED, opacity: prog(f, 88, 12),
        transform: `scale(${0.7 + 0.3 * ease(prog(f, 88, 12))})`, whiteSpace: "nowrap",
      }}>?</div>
      <Label f={f} d={90} x={1440} y={790} w={360} text="有人根本没听到" color={RED} size={32} />

      {/* 喊完就走：箭头示意离开 */}
      <FlatArrow f={f} x1={760} y1={820} x2={1020} y2={820} delay={64} color="#9fb4c8" sw={7} />
      <Label f={f} d={62} x={700} y={860} w={420} text="喊完就走" size={34} weight={900} />

      <Pill f={f} delay={90} x={660} y={640} w={600} h={74} bg={RED_BG} text="不管你听没听到" color={RED} ts={36} />
    </AbsoluteFill>
  );
};

// P5 TCP 编号签收：1-5 连发 → 3 坠落 → 「3?」 → 重发 → 全部确认
const PageSign: React.FC<{off: number}> = ({off}) => {
  const f = useCurrentFrame() - off;
  return (
    <AbsoluteFill>
      <BigTitle f={f} delay={0} size={76} parts={[
        {t: "TCP", c: BLUE}, {t: " 每个包都", c: INK}, {t: "编号签收", c: BLUE},
      ]} />

      <FlatCard f={f} delay={4} x={150} y={280} w={340} h={360} chip="发送方" chipColor={BLUE}>
        <ServerIcon x={170} y={190} s={1.6} />
      </FlatCard>
      <FlatCard f={f} delay={8} x={1430} y={280} w={340} h={360} chip="接收方" chipColor={GREEN}>
        <ServerIcon x={170} y={190} s={1.6} c={GREEN} />
      </FlatCard>
      <Label f={f} d={12} x={150} y={652} w={340} text="1 2 3 4 5 都要签收" size={27} color={SUBC} />

      {/* 五连发（3 号坠落）+ 送达签收槽 */}
      <FlyPacket f={f} n="1" x1={540} y1={440} x2={1400} y2={440} t0={16} dur={34} />
      <FlyPacket f={f} n="2" x1={540} y1={440} x2={1400} y2={440} t0={30} dur={34} />
      <FlyPacket f={f} n="3" x1={540} y1={440} x2={940} y2={440} t0={44} dur={48} color={RED} fall={0.55} />
      <FlyPacket f={f} n="4" x1={540} y1={440} x2={1400} y2={440} t0={54} dur={34} />
      <FlyPacket f={f} n="5" x1={540} y1={440} x2={1400} y2={440} t0={66} dur={34} />
      {[
        {y: 330, d: 50}, {y: 380, d: 64}, {y: 430, d: 190}, {y: 480, d: 88}, {y: 530, d: 100},
      ].map((m, i) => (
        <PopAt key={`ok5-${i}`} f={f} delay={m.d} x={1452} y={m.y} w={48} h={48}>
          <MarkOk x={24} y={24} s={0.72} />
        </PopAt>
      ))}
      <FlashRing f={f} at={76} x={720} y={450} color={RED} />
      <PopAt f={f} delay={84} x={910} y={590} w={60} h={60}><MarkBad x={30} y={30} s={1} /></PopAt>
      <Label f={f} d={86} x={750} y={690} w={400} text="3 号在半路丢了" color={RED} size={30} weight={900} />

      {/* 「3?」询问 + 重发 */}
      <SpeechBubble f={f} d={122} x={880} y={200} w={240} h={104} text="3？" ts={44} c={RED} tc={RED} />
      <FlyPacket f={f} n="3" x1={540} y1={440} x2={1400} y2={440} t0={156} dur={34} color={ORANGE} />
      <Label f={f} d={154} x={700} y={350} w={320} text="重新发" color={ORANGE} size={30} weight={900} />

      <PopAt f={f} delay={186} x={1570} y={660} w={60} h={60}><MarkOk x={30} y={30} s={1.1} /></PopAt>
      <Pill f={f} delay={188} x={590} y={780} w={740} h={76} bg={GREEN_BG} text="确认收到 才继续" color={GREEN} ts={38} />
      <Sparkle x={1360} y={760} s={0.9} />
      <Sparkle x={560} y={820} s={0.7} color="#bfe3cc" />
    </AbsoluteFill>
  );
};

// P6 UDP 五连发反差：丢了也不等不确认不重传 → 低延迟
const PageBurst: React.FC<{off: number}> = ({off}) => {
  const f = useCurrentFrame() - off;
  return (
    <AbsoluteFill>
      <BigTitle f={f} delay={0} size={76} parts={[
        {t: "UDP", c: ORANGE}, {t: " 五个包", c: INK}, {t: "连续发", c: ORANGE},
      ]} />

      <FlatCard f={f} delay={4} x={150} y={260} w={340} h={330} chip="发送方" chipColor={ORANGE}>
        <ServerIcon x={170} y={180} s={1.6} />
      </FlatCard>
      <FlatCard f={f} delay={8} x={1430} y={260} w={340} h={330} chip="接收方" chipColor={GREEN}>
        <ServerIcon x={170} y={180} s={1.6} c={GREEN} />
      </FlatCard>

      <FlyPacket f={f} n="1" x1={540} y1={420} x2={1400} y2={420} t0={13} dur={30} color={ORANGE} />
      <FlyPacket f={f} n="2" x1={540} y1={420} x2={1400} y2={420} t0={24} dur={30} color={ORANGE} />
      <FlyPacket f={f} n="3" x1={540} y1={420} x2={940} y2={420} t0={40} dur={36} color={RED} fall={0.5} />
      <FlyPacket f={f} n="4" x1={540} y1={420} x2={1400} y2={420} t0={46} dur={30} color={ORANGE} />
      <FlyPacket f={f} n="5" x1={540} y1={420} x2={1400} y2={420} t0={57} dur={30} color={ORANGE} />
      {/* 送达槽：只到 4 个，3 号空缺 */}
      {[
        {y: 330, d: 43, ok: true}, {y: 380, d: 54, ok: true}, {y: 430, d: 64, ok: false},
        {y: 480, d: 76, ok: true}, {y: 530, d: 87, ok: true},
      ].map((m, i) => (
        <PopAt key={`ok6-${i}`} f={f} delay={m.d} x={1452} y={m.y} w={48} h={48}>
          {m.ok ? <MarkOk x={24} y={24} s={0.72} /> : <MarkBad x={24} y={24} s={0.72} />}
        </PopAt>
      ))}
      <FlashRing f={f} at={56} x={720} y={430} color={RED} />
      <PopAt f={f} delay={64} x={910} y={570} w={60} h={60}><MarkBad x={30} y={30} s={0.85} /></PopAt>

      {/* 三个"不" */}
      {[
        {x: 560, d: 75, t: "不等"},
        {x: 810, d: 91, t: "不确认"},
        {x: 1090, d: 107, t: "不重传"},
      ].map((p, i) => (
        <div key={i}>
          <Pill f={f} delay={p.d} x={p.x} y={680} w={200} h={70} bg={RED_BG} text={p.t} color={RED} ts={34} />
          <PopAt f={f} delay={p.d + 4} x={p.x + 180} y={685} w={60} h={60}><MarkBad x={30} y={30} s={0.75} /></PopAt>
        </div>
      ))}
      <Label f={f} d={143} x={460} y={790} w={1000} text="没有 TCP 那套编号 · 签收 · 重传机制" color={SUBC} size={29} />

      {/* 奖励：低延迟 */}
      <PopAt f={f} delay={206} x={560} y={840} w={800} h={0}>
        <div style={{
          width: 800, height: 100, borderRadius: 22, backgroundColor: ORANGE,
          display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: "0 12px 26px rgba(240,145,45,0.35)",
        }}>
          <span style={{fontFamily: F, fontWeight: 900, fontSize: 46, color: "#fff", letterSpacing: 6}}>换来 低延迟</span>
          <Sparkle x={760} y={-16} s={0.9} />
        </div>
      </PopAt>
    </AbsoluteFill>
  );
};

// P7 场景：网页文件登录走 TCP；直播游戏DNS走 UDP
const PageScene: React.FC<{off: number}> = ({off}) => {
  const f = useCurrentFrame() - off;
  return (
    <AbsoluteFill>
      <BigTitle f={f} delay={0} parts={[
        {t: "什么场景", c: INK}, {t: "走哪个？", c: ORANGE},
      ]} />

      <FlatCard f={f} delay={8} x={150} y={280} w={770} h={560} chip="走 TCP" chipColor={BLUE}>
        <PopAt f={f} delay={19} x={40} y={90} w={700} h={130}>
          <div style={{position: "absolute", inset: 0, borderRadius: 18, backgroundColor: BLUE_BG, display: "flex", alignItems: "center", paddingLeft: 150}}>
            <Globe x={70} y={62} s={1.15} />
            <div style={{marginLeft: 40}}>
              <div style={{fontFamily: F, fontWeight: 900, fontSize: 38, color: INK}}>网页浏览</div>
              <div style={{fontFamily: F, fontSize: 25, color: SUBC, marginTop: 4}}>加载完整 才能看</div>
            </div>
          </div>
        </PopAt>
        <PopAt f={f} delay={39} x={40} y={240} w={700} h={130}>
          <div style={{position: "absolute", inset: 0, borderRadius: 18, backgroundColor: BLUE_BG, display: "flex", alignItems: "center", paddingLeft: 150}}>
            <Ico d={D_FILE} x={70} y={62} s={3.4} c={BLUE} />
            <div style={{marginLeft: 40}}>
              <div style={{fontFamily: F, fontWeight: 900, fontSize: 38, color: INK}}>文件传输</div>
              <div style={{fontFamily: F, fontSize: 25, color: SUBC, marginTop: 4}}>丢一个包 文件就坏</div>
            </div>
          </div>
        </PopAt>
        <PopAt f={f} delay={57} x={40} y={390} w={700} h={130}>
          <div style={{position: "absolute", inset: 0, borderRadius: 18, backgroundColor: BLUE_BG, display: "flex", alignItems: "center", paddingLeft: 150}}>
            <Ico d={D_KEY} x={70} y={62} s={3.4} c={BLUE} />
            <div style={{marginLeft: 40}}>
              <div style={{fontFamily: F, fontWeight: 900, fontSize: 38, color: INK}}>账号登录</div>
              <div style={{fontFamily: F, fontSize: 25, color: SUBC, marginTop: 4}}>密码数据 不能出错</div>
            </div>
          </div>
        </PopAt>
      </FlatCard>

      <FlatCard f={f} delay={88} x={990} y={280} w={780} h={560} chip="走 UDP" chipColor={ORANGE}>
        <PopAt f={f} delay={108} x={40} y={90} w={700} h={130}>
          <div style={{position: "absolute", inset: 0, borderRadius: 18, backgroundColor: ORANGE_BG, display: "flex", alignItems: "center", paddingLeft: 150}}>
            <Ico d={D_LIVE} x={70} y={62} s={3.4} c={ORANGE} />
            <div style={{marginLeft: 40}}>
              <div style={{fontFamily: F, fontWeight: 900, fontSize: 38, color: INK}}>直播</div>
              <div style={{fontFamily: F, fontSize: 25, color: SUBC, marginTop: 4}}>宁可糊一帧 不卡一秒</div>
            </div>
          </div>
        </PopAt>
        <PopAt f={f} delay={128} x={40} y={240} w={700} h={130}>
          <div style={{position: "absolute", inset: 0, borderRadius: 18, backgroundColor: ORANGE_BG, display: "flex", alignItems: "center", paddingLeft: 150}}>
            <Ico d={D_PAD} x={70} y={62} s={3.4} c={ORANGE} />
            <div style={{marginLeft: 40}}>
              <div style={{fontFamily: F, fontWeight: 900, fontSize: 38, color: INK}}>游戏</div>
              <div style={{fontFamily: F, fontSize: 25, color: SUBC, marginTop: 4}}>延迟高 直接输</div>
            </div>
          </div>
        </PopAt>
        <PopAt f={f} delay={152} x={40} y={390} w={700} h={130}>
          <div style={{position: "absolute", inset: 0, borderRadius: 18, backgroundColor: ORANGE_BG, display: "flex", alignItems: "center", paddingLeft: 150}}>
            <ServerIcon x={70} y={62} s={0.98} />
            <div style={{marginLeft: 40}}>
              <div style={{fontFamily: F, fontWeight: 900, fontSize: 38, color: INK}}>DNS 查询</div>
              <div style={{fontFamily: F, fontSize: 25, color: SUBC, marginTop: 4}}>一问一答 快去快回</div>
            </div>
          </div>
        </PopAt>
      </FlatCard>

      <Sparkle x={920} y={250} s={0.8} />
    </AbsoluteFill>
  );
};

// P8 总结：可靠 vs 低延迟，看场景
const PageSummary: React.FC<{off: number}> = ({off}) => {
  const f = useCurrentFrame() - off;
  return (
    <AbsoluteFill>
      <BigTitle f={f} delay={0} parts={[{t: "一句话总结", c: INK}]} />

      <FlatCard f={f} delay={8} x={210} y={280} w={700} h={380} chip="TCP" chipColor={BLUE}>
        <Ico d={D_SHIELD} x={350} y={150} s={4.4} c={BLUE} />
        <div style={{position: "absolute", left: 0, top: 240, width: 700, textAlign: "center", fontFamily: F, fontWeight: 900, fontSize: 56, color: INK}}>
          强调 <span style={{color: BLUE}}>可靠性</span>
        </div>
        <div style={{position: "absolute", left: 0, top: 320, width: 700, textAlign: "center", fontFamily: F, fontSize: 27, color: SUBC}}>不丢 · 不乱 · 不重复</div>
      </FlatCard>

      <FlatCard f={f} delay={56} x={1010} y={280} w={700} h={380} chip="UDP" chipColor={ORANGE}>
        <Ico d={D_BOLT} x={350} y={150} s={4.4} c={ORANGE} />
        <div style={{position: "absolute", left: 0, top: 240, width: 700, textAlign: "center", fontFamily: F, fontWeight: 900, fontSize: 56, color: INK}}>
          强调 <span style={{color: ORANGE}}>低延迟 · 效率</span>
        </div>
        <div style={{position: "absolute", left: 0, top: 320, width: 700, textAlign: "center", fontFamily: F, fontSize: 27, color: SUBC}}>快 · 实时 · 轻量</div>
      </FlatCard>

      <PopAt f={f} delay={130} x={410} y={730} w={1100} h={120} rot={-1.2}>
        <div style={{
          width: 1100, height: 120, borderRadius: 22, backgroundColor: YEL,
          display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: "0 14px 30px rgba(247,201,72,0.4)",
        }}>
          <span style={{fontFamily: F, fontWeight: 900, fontSize: 48, color: INK, letterSpacing: 3}}>
            不是谁更好 而是看<span style={{color: "#a3650a"}}>场景</span>需要什么
          </span>
        </div>
      </PopAt>
      <Sparkle x={380} y={700} s={0.9} />
      <Sparkle x={1560} y={830} s={0.7} />
    </AbsoluteFill>
  );
};

// P9 下期预告 + 关注
const PageOutro: React.FC<{off: number}> = ({off}) => {
  const f = useCurrentFrame() - off;
  return (
    <AbsoluteFill>
      <BigTitle f={f} delay={0} parts={[{t: "下期预告", c: ORANGE}]} />

      <FlatCard f={f} delay={12} x={430} y={250} w={1060} h={320} chip="面试高频" chipColor={BLUE}>
        <div style={{position: "absolute", left: 0, top: 70, width: 1060, textAlign: "center", fontFamily: F, fontWeight: 900, fontSize: 54, color: INK, lineHeight: 1.5}}>
          浏览器输入网址后<br />到底<span style={{color: BLUE}}>发生了什么</span>？
        </div>
      </FlatCard>
      <BulbFlat x={1430} y={240} s={1} />
      <Sparkle x={430} y={230} s={0.9} />

      <PopAt f={f} delay={102} x={300} y={600} w={360} h={340}>
        <Float f={f} x={0} y={0} w={360} h={340} amp={6}>
          <FlatPerson x={180} y={170} color={GREEN} s={1.5} />
        </Float>
      </PopAt>
      <PopAt f={f} delay={110} x={700} y={620} w={620} h={100}>
        <div style={{
          width: 620, height: 100, borderRadius: 999, backgroundColor: ORANGE,
          display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: "0 14px 30px rgba(240,145,45,0.4)",
        }}>
          <span style={{fontFamily: F, fontWeight: 900, fontSize: 46, color: "#fff", letterSpacing: 6}}>关注 全栈小秋</span>
        </div>
      </PopAt>
      <Label f={f} d={128} x={700} y={760} w={620} text="把计算机基础讲明白 · 0 基础也能学会" color={SUBC} size={30} />
    </AbsoluteFill>
  );
};

// ============ 主组件 ============

// 各句配音的起始帧（页面边界与句子对齐，避免关键词刚出现就翻页）
const SENT = [0, 88, 262, 375, 491, 706, 947, 1153, 1367];
const PAGES = [
  {C: PageHook, start: 0, end: SENT[1]},
  {C: PageTwo, start: SENT[1], end: SENT[2]},
  {C: PageCall, start: SENT[2], end: SENT[3]},
  {C: PageMegaphone, start: SENT[3], end: SENT[4]},
  {C: PageSign, start: SENT[4], end: SENT[5]},
  {C: PageBurst, start: SENT[5], end: SENT[6]},
  {C: PageScene, start: SENT[6], end: SENT[7]},
  {C: PageSummary, start: SENT[7], end: SENT[8]},
  {C: PageOutro, start: SENT[8], end: DUR},
];

export const TcpVsUdpFlat: React.FC = () => {
  const frame = useCurrentFrame();
  const bed = interpolate(frame, [0, 20, DUR - 40, DUR - 6], [0, 0.065, 0.065, 0], clamp);
  return (
    <AbsoluteFill style={{background: "linear-gradient(180deg,#fff 0%,#f3f6f9 100%)", fontFamily: F, overflow: "hidden"}}>
      <BgDots />
      {PAGES.map(({C, start, end}, i) => {
        const first = i === 0, last = i === PAGES.length - 1, len = end - start, off = first ? 0 : 10;
        return (
          <Sequence key={i} from={first ? 0 : start - 10} durationInFrames={len + 12}>
            <PageTurn off={off} len={len} first={first} last={last}><C off={off} /></PageTurn>
          </Sequence>
        );
      })}
      <div style={{
        position: "absolute", top: 45, right: 70, zIndex: 45, border: `3px solid ${BLUE}`,
        borderRadius: 999, padding: "7px 25px", fontSize: 28, fontWeight: 900, color: INK,
        letterSpacing: 5, background: "#fff",
      }}>全栈小秋</div>
      {voiceLines.map((s, i) => (
        <Sequence key={`v-${i}`} from={s.start} durationInFrames={s.end - s.start + 20}>
          <Audio src={staticFile(`audio/tcpudp-flat-tts/${s.audio}`)} volume={1} />
        </Sequence>
      ))}
      {/* 音效：翻页 / 包起飞 / 丢失 / 确认 / 气泡 */}
      {PAGES.slice(1).map((p, i) => (
        <Sequence key={`pt-${i}`} from={p.start - 6} durationInFrames={20}>
          <Audio src={staticFile("audio/sfx/transfer.wav")} volume={0.14} />
        </Sequence>
      ))}
      {[16, 30, 44, 54, 66].map((t) => (
        <Sequence key={`wh5-${t}`} from={SENT[4] + t} durationInFrames={12}>
          <Audio src={staticFile("audio/sfx/whoosh.wav")} volume={0.1} />
        </Sequence>
      ))}
      <Sequence from={SENT[4] + 76} durationInFrames={22}>
        <Audio src={staticFile("audio/sfx/error.wav")} volume={0.3} />
      </Sequence>
      <Sequence from={SENT[4] + 154} durationInFrames={12}>
        <Audio src={staticFile("audio/sfx/whoosh.wav")} volume={0.12} />
      </Sequence>
      <Sequence from={SENT[4] + 186} durationInFrames={20}>
        <Audio src={staticFile("audio/sfx/ding.wav")} volume={0.32} />
      </Sequence>
      {[13, 24, 40, 46, 57].map((t) => (
        <Sequence key={`wh6-${t}`} from={SENT[5] + t} durationInFrames={12}>
          <Audio src={staticFile("audio/sfx/whoosh.wav")} volume={0.1} />
        </Sequence>
      ))}
      <Sequence from={SENT[5] + 56} durationInFrames={22}>
        <Audio src={staticFile("audio/sfx/error.wav")} volume={0.3} />
      </Sequence>
      <Sequence from={SENT[5] + 204} durationInFrames={20}>
        <Audio src={staticFile("audio/sfx/ding.wav")} volume={0.34} />
      </Sequence>
      {[45, 79].map((t) => (
        <Sequence key={`pop3-${t}`} from={SENT[2] + t} durationInFrames={10}>
          <Audio src={staticFile("audio/sfx/pop.wav")} volume={0.28} />
        </Sequence>
      ))}
      <Sequence from={SENT[3] + 13} durationInFrames={10}>
        <Audio src={staticFile("audio/sfx/pop.wav")} volume={0.28} />
      </Sequence>
      <Sequence from={SENT[8] + 108} durationInFrames={10}>
        <Audio src={staticFile("audio/sfx/pop.wav")} volume={0.34} />
      </Sequence>
      <Audio src={staticFile("audio/bed.wav")} loop volume={() => bed} />
      <Subtitle />
    </AbsoluteFill>
  );
};
