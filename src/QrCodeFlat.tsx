import React from "react";
import {Audio} from "@remotion/media";
import {AbsoluteFill, interpolate, Sequence, staticFile, useCurrentFrame} from "remotion";

// ============ 扁平可爱插画科普风 · 二维码里藏了什么（全栈小秋 IP） ============
// 结构：封面钩子 → 答案：一条网址 → 快递包装比喻 → 解码三步 → 拆快递=浏览器打开
//      → 定位标记 → 纠错 → 金句横幅 → 结尾截图卡
// 语义色：蓝 #4a86d8 / 橙 #f0912d 双色点缀，红 #e05656 只给问题，黄 #f7c948 强调

export const DUR = 1678;

// ---------- 色板与工具 ----------
const INK = "#2f3a45";
const SUBC = "#7a8694";
const BLUE = "#4a86d8";
const BLUE_BG = "#eaf2fc";
const ORANGE = "#f0912d";
const ORANGE_BG = "#fdf3e0";
const RED = "#e05656";
const YEL = "#f7c948";
const BORDER = "#e0e6ec";
const F = "'Microsoft YaHei', sans-serif";
const W = 1920;
const H = 1080;
const QBLACK = "#2b3540";
const URL_TEXT = "https://xiaoqiu.tech";

const clamp = {extrapolateLeft: "clamp", extrapolateRight: "clamp"} as const;
const ease = (p: number) => 1 - Math.pow(1 - p, 3);
const prog = (f: number, delay: number, dur = 12) =>
  interpolate(f, [delay, delay + dur], [0, 1], clamp);

// ---------- 基础原语（本地拷贝自 TcpVsUdpFlat，不用 flatKit） ----------

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

// 大标题：多色分段 + 黄色波浪垫底
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

// 闪光点缀
const Sparkle: React.FC<{x: number; y: number; s?: number; color?: string}> = ({x, y, s = 1, color = YEL}) => (
  <svg width={54 * s} height={54 * s} style={{position: "absolute", left: x, top: y, overflow: "visible"}}>
    <path d="M 27 2 L 32 22 L 52 27 L 32 32 L 27 52 L 22 32 L 2 27 L 22 22 Z" fill={color} />
  </svg>
);

// 闪光光环（快门/确认瞬间）
const FlashRing: React.FC<{f: number; at: number; x: number; y: number; color?: string}> = ({f, at, x, y, color = ORANGE}) => {
  const p = prog(f, at, 12);
  if (p <= 0 || p >= 1) return null;
  return (
    <svg width={W} height={H} style={{position: "absolute", left: 0, top: 0, overflow: "visible", pointerEvents: "none"}}>
      <circle cx={x} cy={y} r={22 + 46 * ease(p)} fill="none" stroke={color} strokeWidth={7 * (1 - p)} opacity={1 - p} />
    </svg>
  );
};

// 循环飞行数据包
const LoopPacket: React.FC<{
  f: number; x1: number; y1: number; x2: number; y2: number;
  color?: string; start: number; period?: number; dur?: number; lift?: number; size?: number;
}> = ({f, x1, y1, x2, y2, color = BLUE, start, period = 56, dur = 26, lift = 0, size = 34}) => {
  if (f < start) return null;
  const raw = (f - start) % period;
  const t = raw / dur;
  if (t <= 0 || t >= 1) return null;
  const px = x1 + (x2 - x1) * t;
  const py = y1 + (y2 - y1) * t - Math.sin(Math.PI * t) * lift;
  return (
    <svg width={W} height={H} style={{position: "absolute", left: 0, top: 0, overflow: "visible", pointerEvents: "none"}}>
      <g transform={`translate(${px},${py})`}>
        <rect x={-size / 2} y={-size * 0.4} width={size} height={size * 0.8} rx={8} fill={color} stroke="#fff" strokeWidth={3.5} />
        <circle cx={-size * 0.18} cy={0} r={3.5} fill="#fff" opacity={0.9} />
        <circle cx={size * 0.18} cy={0} r={3.5} fill="#fff" opacity={0.9} />
      </g>
    </svg>
  );
};

// 状态标记
const MarkOk: React.FC<{x: number; y: number; s?: number}> = ({x, y, s = 1}) => (
  <svg width={60 * s} height={60 * s} style={{position: "absolute", left: x - 30 * s, top: y - 30 * s, overflow: "visible"}}>
    <g transform={`scale(${s})`}>
      <circle cx={30} cy={30} r={26} fill={"#e9f6ee"} />
      <path d="M17 31 L27 41 L44 21" fill="none" stroke="#45a56a" strokeWidth={6} strokeLinecap="round" strokeLinejoin="round" />
    </g>
  </svg>
);

// 漂浮动画
const Float: React.FC<{f: number; x: number; y: number; w: number; h: number; amp?: number; children: React.ReactNode}> = ({f, x, y, w, h, amp = 6, children}) => (
  <div style={{position: "absolute", left: x, top: y, width: w, height: h}}>
    <div style={{transform: `translateY(${Math.sin(f / 13) * amp}px)`}}>{children}</div>
  </div>
);

// ---------- 主题元件：二维码 / 扫描线 / 快递盒 / 包裹 ----------

const QRDIM = 21;
const hash = (r: number, c: number) => {
  const x = Math.sin(r * 127.1 + c * 311.7) * 43758.5453;
  return x - Math.floor(x);
};
const qrBlack = (r: number, c: number): boolean => {
  const finder = (r0: number, c0: number): boolean | null => {
    const dr = r - r0, dc = c - c0;
    if (dr < 0 || dr > 6 || dc < 0 || dc > 6) return null;
    const ring = Math.max(Math.abs(dr - 3), Math.abs(dc - 3));
    if (ring === 3) return true;
    if (ring === 2) return false;
    return true; // ring<=1 中心黑
  };
  const f1 = finder(0, 0);
  if (f1 !== null) return f1;
  const f2 = finder(0, 14);
  if (f2 !== null) return f2;
  const f3 = finder(14, 0);
  if (f3 !== null) return f3;
  if ((r <= 7 && c <= 7) || (r <= 7 && c >= 13) || (r >= 13 && c <= 7)) return false; // 分隔带留白
  return hash(r, c) > 0.52;
};

// 白卡二维码（pos 为页面坐标；放在已定位容器内时传相对坐标）
const QRCodeFlat: React.FC<{x: number; y: number; size: number; pad?: number; rot?: number}> = ({x, y, size, pad = 14, rot = 0}) => {
  const inner = size - pad * 2;
  const cell = inner / QRDIM;
  const cells: boolean[] = [];
  for (let r = 0; r < QRDIM; r++) for (let c = 0; c < QRDIM; c++) cells.push(qrBlack(r, c));
  return (
    <div style={{
      position: "absolute", left: x, top: y, width: size, height: size,
      backgroundColor: "#fff", border: `3px solid ${BORDER}`, borderRadius: 20,
      padding: pad, boxShadow: "0 12px 26px rgba(47,58,69,0.10)",
      transform: rot ? `rotate(${rot}deg)` : undefined,
    }}>
      <div style={{position: "relative", width: inner, height: inner}}>
        {cells.map((b, i) => {
          const r = Math.floor(i / QRDIM), c = i % QRDIM;
          return (
            <div key={i} style={{
              position: "absolute", left: c * cell, top: r * cell,
              width: cell + 0.6, height: cell + 0.6, backgroundColor: b ? QBLACK : "#fff",
            }} />
          );
        })}
      </div>
    </div>
  );
};

// 三个定位角的呼吸高亮（x,y 为码内格子原点，inner 为格子区边长）
const FinderPulse: React.FC<{f: number; x: number; y: number; inner: number; delay: number; color?: string}> = ({f, x, y, inner, delay, color = ORANGE}) => {
  if (f < delay) return null;
  const cell = inner / QRDIM;
  const s = cell * 7;
  const pulse = 0.5 + 0.5 * Math.sin((f - delay) / 8);
  const pos: [number, number][] = [[0, 0], [cell * 14, 0], [0, cell * 14]];
  return (
    <div style={{position: "absolute", left: x, top: y, width: inner, height: inner, pointerEvents: "none"}}>
      {pos.map(([cx, cy], i) => (
        <div key={i} style={{
          position: "absolute", left: cx - 7, top: cy - 7, width: s + 14, height: s + 14,
          border: `6px solid ${color}`, borderRadius: 14, opacity: 0.3 + 0.6 * pulse,
        }} />
      ))}
    </div>
  );
};

// 扫描线（自上而下循环）
const ScanLine: React.FC<{f: number; x: number; y: number; w: number; h: number; period?: number; phase?: number}> = ({f, x, y, w, h, period = 70, phase = 0}) => {
  const t = ((((f + phase) % period) + period) % period) / period;
  const ty = t * (h - 10);
  return (
    <svg width={w + 12} height={h} style={{position: "absolute", left: x - 6, top: y, overflow: "visible", pointerEvents: "none"}}>
      <rect x={0} y={ty - 30} width={w + 12} height={30} fill={ORANGE} opacity={0.13} />
      <rect x={0} y={ty - 4} width={w + 12} height={9} rx={4.5} fill={ORANGE} opacity={0.9} />
    </svg>
  );
};

// 取景框四角括号（可旋转，用于"斜码对齐"）
const Brackets: React.FC<{x: number; y: number; w: number; h: number; color?: string; sw?: number; rot?: number}> = ({x, y, w, h, color = BLUE, sw = 8, rot = 0}) => {
  const L = Math.min(w, h) * 0.3;
  return (
    <svg width={W} height={H} style={{position: "absolute", left: 0, top: 0, overflow: "visible", pointerEvents: "none"}}>
      <g transform={rot ? `rotate(${rot} ${x + w / 2} ${y + h / 2})` : undefined}
        fill="none" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
        <path d={`M ${x} ${y + L} L ${x} ${y} L ${x + L} ${y}`} />
        <path d={`M ${x + w - L} ${y} L ${x + w} ${y} L ${x + w} ${y + L}`} />
        <path d={`M ${x + w} ${y + h - L} L ${x + w} ${y + h} L ${x + w - L} ${y + h}`} />
        <path d={`M ${x + L} ${y + h} L ${x} ${y + h} L ${x} ${y + h - L}`} />
      </g>
    </svg>
  );
};

// 快递盒：盒身铺黑白格纹，盒盖 open∈[0,1] 打开
const CourierBox: React.FC<{x: number; y: number; w: number; h: number; open: number}> = ({x, y, w, h, open}) => {
  const cols = 10, rows = 8;
  return (
    <div style={{position: "absolute", left: x, top: y, width: w, height: h}}>
      {/* 背盖板 */}
      <div style={{
        position: "absolute", left: w * 0.12, top: -14, width: w * 0.76, height: 24,
        backgroundColor: "#eecf9c", border: `3px solid ${BORDER}`, borderRadius: 8,
        transformOrigin: "center bottom", transform: `rotate(${-open * 118}deg)`,
      }} />
      {/* 盒身：黑白格纹 */}
      <div style={{
        position: "absolute", inset: 0, backgroundColor: "#fbf4e4",
        border: `4px solid ${BORDER}`, borderRadius: 14, overflow: "hidden",
        boxShadow: "0 14px 30px rgba(47,58,69,0.12)",
      }}>
        <div style={{
          position: "absolute", inset: 10, display: "grid",
          gridTemplateColumns: `repeat(${cols},1fr)`, gridTemplateRows: `repeat(${rows},1fr)`,
        }}>
          {Array.from({length: cols * rows}).map((_, i) => {
            const r = Math.floor(i / cols), c = i % cols;
            const b = hash(r + 7, c + 13) > 0.5;
            return <div key={i} style={{backgroundColor: b ? QBLACK : "#fbf4e4"}} />;
          })}
        </div>
        <div style={{position: "absolute", left: w / 2 - 20, top: 0, width: 40, height: "100%", backgroundColor: ORANGE, opacity: 0.85}} />
      </div>
      {/* 前盖两片 */}
      <div style={{
        position: "absolute", left: 4, top: -4, width: w * 0.5, height: 26,
        backgroundColor: "#eecf9c", border: `3px solid ${BORDER}`, borderRadius: 8,
        transformOrigin: "left center", transform: `rotate(${-open * 132}deg)`,
      }} />
      <div style={{
        position: "absolute", right: 4, top: -4, width: w * 0.5, height: 26,
        backgroundColor: "#eecf9c", border: `3px solid ${BORDER}`, borderRadius: 8,
        transformOrigin: "right center", transform: `rotate(${open * 132}deg)`,
      }} />
    </div>
  );
};

// 「网址」包裹单（从盒里露出的面单）
const Waybill: React.FC<{x: number; y: number; w: number; h: number; rot?: number}> = ({x, y, w, h, rot = 0}) => (
  <div style={{
    position: "absolute", left: x, top: y, width: w, height: h,
    backgroundColor: "#fff", border: `3px solid ${BORDER}`, borderRadius: 14,
    boxShadow: "0 10px 24px rgba(47,58,69,0.14)", transform: `rotate(${rot}deg)`, overflow: "hidden",
  }}>
    <div style={{position: "absolute", left: 0, top: 0, width: "100%", height: 44, backgroundColor: BLUE}} />
    <div style={{position: "absolute", left: 0, top: 8, width: "100%", textAlign: "center", fontFamily: F, fontWeight: 900, fontSize: 24, color: "#fff", letterSpacing: 4}}>包裹单</div>
    <div style={{position: "absolute", left: 0, top: 56, width: "100%", textAlign: "center", fontFamily: F, fontWeight: 900, fontSize: 56, color: BLUE, letterSpacing: 6}}>网址</div>
    <div style={{position: "absolute", left: 0, top: 128, width: "100%", textAlign: "center", fontFamily: F, fontSize: 20, color: SUBC}}>收件人：你的手机</div>
    <svg width={w - 40} height={30} style={{position: "absolute", left: 20, bottom: 14, overflow: "visible"}}>
      {Array.from({length: 30}).map((_, i) => (
        <rect key={i} x={i * ((w - 40) / 30)} y={0} width={i % 3 === 0 ? 5 : 3} height={30} fill={INK} />
      ))}
    </svg>
  </div>
);

// 「网址」包裹飞行动画
const FlyParcel: React.FC<{f: number; x1: number; y1: number; x2: number; y2: number; t0: number; dur?: number}> = ({f, x1, y1, x2, y2, t0, dur = 30}) => {
  const t = (f - t0) / dur;
  if (t <= 0 || t >= 1) return null;
  const x = x1 + (x2 - x1) * t;
  const y = y1 + (y2 - y1) * t - Math.sin(Math.PI * t) * 40;
  const rot = Math.sin(Math.PI * t) * -10;
  return (
    <div style={{position: "absolute", left: x, top: y, transform: `translate(-50%,-50%) rotate(${rot}deg)`}}>
      <div style={{
        width: 96, height: 74, borderRadius: 12, backgroundColor: "#f2d8a8",
        border: "4px solid #fff", boxShadow: "0 10px 22px rgba(47,58,69,0.22)",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <div style={{
          backgroundColor: "#fff", borderRadius: 8, padding: "4px 14px",
          fontFamily: F, fontWeight: 900, fontSize: 28, color: BLUE,
        }}>网址</div>
      </div>
    </div>
  );
};

// 服务器塔
const ServerIcon: React.FC<{x: number; y: number; s?: number; c?: string}> = ({x, y, s = 1, c = "#55677c"}) => (
  <svg width={110 * s} height={140 * s} style={{position: "absolute", left: x - 55 * s, top: y - 70 * s, overflow: "visible"}}>
    <g transform={`scale(${s})`}>
      <rect x={22} y={8} width={66} height={124} rx={12} fill={c} />
      <rect x={32} y={24} width={46} height={9} rx={4.5} fill="#aebdd0" />
      <rect x={32} y={44} width={46} height={9} rx={4.5} fill="#aebdd0" />
      <rect x={32} y={64} width={46} height={9} rx={4.5} fill="#aebdd0" />
      <circle cx={55} cy={102} r={8} fill="#7ee0a3" />
    </g>
  </svg>
);

// 逐格翻成 0/1 的网格（n x n）
const FlipGrid: React.FC<{f: number; x: number; y: number; size: number; base: number}> = ({f, x, y, size, base}) => {
  const n = 7, gap = 6;
  const cell = (size - gap * (n - 1)) / n;
  return (
    <div style={{position: "absolute", left: x, top: y, width: size, height: size}}>
      {Array.from({length: n * n}).map((_, i) => {
        const r = Math.floor(i / n), c = i % n;
        const black = hash(r + 3, c + 5) > 0.5;
        const p = prog(f, base + c * 4 + r * 2, 8);
        return (
          <div key={i} style={{
            position: "absolute", left: c * (cell + gap), top: r * (cell + gap),
            width: cell, height: cell, borderRadius: 8,
            backgroundColor: black ? QBLACK : "#fff",
            border: black ? "none" : `3px solid ${BORDER}`,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <div style={{
              fontFamily: F, fontWeight: 900, fontSize: cell * 0.58,
              color: black ? "#fff" : "#8a97a5",
              opacity: p, transform: `scale(${0.5 + 0.5 * p})`,
            }}>{black ? "1" : "0"}</div>
          </div>
        );
      })}
    </div>
  );
};

// ---------- 翻页与字幕 ----------

const PageTurn: React.FC<{children: React.ReactNode; off: number; len: number; first: boolean; last: boolean}> = ({children, off, len, first, last}) => {
  const frame = useCurrentFrame();
  const oIn = first ? 1 : interpolate(frame, [0, 10], [0, 1], clamp);
  const lf = frame - off;
  // 不变量：页边界帧上旧页必须仍完整可见（淡出窗口放在边界之后）
  const oOut = last ? 1 : interpolate(lf, [len, len + 10], [1, 0], clamp);
  return <AbsoluteFill style={{opacity: Math.min(oIn, oOut)}}>{children}</AbsoluteFill>;
};

type Sub = {s: number; e: number; t: string};
const subs: Sub[] = [
  {s: 0, e: 60, t: "每天扫几十次二维码"},
  {s: 60, e: 107, t: "那个黑白方块里"},
  {s: 107, e: 147, t: "到底藏了什么"},
  {s: 152, e: 180, t: "先说答案"},
  {s: 180, e: 235, t: "绝大多数二维码里"},
  {s: 235, e: 290, t: "藏的就是一条网址"},
  {s: 295, e: 369, t: "二维码就像网址的快递包装"},
  {s: 369, e: 437, t: "黑白格子是打包好的包裹"},
  {s: 437, e: 468, t: "里面的内容"},
  {s: 468, e: 530, t: "原封不动送到你手机上"},
  {s: 535, e: 568, t: "扫码那一秒"},
  {s: 568, e: 628, t: "手机先给方块拍张照"},
  {s: 628, e: 708, t: "再按黑白格子还原成0和1"},
  {s: 708, e: 754, t: "拼出里面的网址"},
  {s: 760, e: 818, t: "所以扫码不是变魔术"},
  {s: 818, e: 850, t: "只是拆快递"},
  {s: 850, e: 889, t: "拆出来的网址"},
  {s: 889, e: 940, t: "由浏览器替你打开"},
  {s: 946, e: 1007, t: "再看三个角上的大方块"},
  {s: 1007, e: 1043, t: "那是定位标记"},
  {s: 1043, e: 1079, t: "不管你正着扫"},
  {s: 1079, e: 1097, t: "斜着扫"},
  {s: 1097, e: 1164, t: "手机都先找到它们来对齐"},
  {s: 1170, e: 1233, t: "二维码破损一点还能扫"},
  {s: 1233, e: 1277, t: "因为它自带纠错"},
  {s: 1277, e: 1333, t: "缺一小块也能算回来"},
  {s: 1338, e: 1387, t: "下次扫码你就知道"},
  {s: 1387, e: 1424, t: "你扫的不是码"},
  {s: 1424, e: 1492, t: "是一条藏在格子里的网址"},
  {s: 1498, e: 1550, t: "把这条视频存下来"},
  {s: 1550, e: 1621, t: "下次有人问二维码是什么"},
  {s: 1621, e: 1653, t: "直接甩给他"},
];

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

// 背景圆点网格（蓝/橙点缀，克制）
const BgDots: React.FC = () => (
  <svg width={W} height={H} style={{position: "absolute", left: 0, top: 0, pointerEvents: "none"}}>
    <defs>
      <pattern id="qr-dots" width="46" height="46" patternUnits="userSpaceOnUse">
        <circle cx="23" cy="23" r="2.6" fill="#dbe4ee" />
      </pattern>
    </defs>
    <rect width={W} height={H} fill="url(#qr-dots)" opacity={0.5} />
    <circle cx={150} cy={120} r={190} fill={BLUE_BG} opacity={0.5} />
    <circle cx={W - 140} cy={H - 90} r={220} fill={ORANGE_BG} opacity={0.45} />
  </svg>
);

// ============ 页面 ============
// 页内 delay 全部由词级朗读帧推导（off_sec*30 取整，相对句首）

// P1 封面钩子（第 0 帧完整呈现，全部 delay=-99）
const PageCover: React.FC<{off: number}> = ({off}) => {
  const f = useCurrentFrame() - off;
  return (
    <AbsoluteFill>
      <BigTitle f={f} delay={-99} y={72} size={76} parts={[
        {t: "扫二维码的那一秒 ", c: INK}, {t: "发生了什么？", c: BLUE},
      ]} />
      <Sparkle x={430} y={200} s={0.8} />
      <Sparkle x={1530} y={180} s={0.65} color="#b8d4f2" />

      {/* 主角：大二维码 + 循环扫描线 */}
      <QRCodeFlat x={330} y={290} size={470} />
      <ScanLine f={f} x={347} y={307} w={436} h={436} period={72} />
      <Label f={f} d={-99} x={330} y={790} w={470} text="二维码" size={32} color={SUBC} weight={900} />

      {/* 手机扫码场景 */}
      <PopAt f={f} delay={-99} x={1300} y={230} w={360} h={570}>
        <Float f={f} x={0} y={0} w={360} h={570} amp={6}>
          <div style={{position: "absolute", inset: 0}}>
            <div style={{position: "absolute", inset: 0, backgroundColor: "#3f4d5e", borderRadius: 44, boxShadow: "0 18px 38px rgba(47,58,69,0.18)"}} />
            <div style={{position: "absolute", left: 14, top: 14, width: 332, height: 542, borderRadius: 34, overflow: "hidden", backgroundColor: "#22303e"}}>
              <div style={{position: "absolute", left: 0, top: 0, width: "100%", height: 62, backgroundColor: BLUE}} />
              <div style={{position: "absolute", left: 0, top: 16, width: "100%", textAlign: "center", fontFamily: F, fontWeight: 900, fontSize: 26, color: "#fff", letterSpacing: 6}}>扫一扫</div>
              {/* 取景框 + 小码 */}
              <QRCodeFlat x={62} y={130} size={208} pad={10} />
              <Brackets x={48} y={116} w={236} h={236} color={YEL} sw={7} />
              <div style={{position: "absolute", left: 0, top: 384, width: "100%", textAlign: "center", fontFamily: F, fontSize: 24, color: "#c6d4e2"}}>对准二维码</div>
              {/* 快门键 */}
              <div style={{position: "absolute", left: 136, top: 452, width: 60, height: 60, borderRadius: 999, backgroundColor: "#fff", border: `6px solid ${YEL}`}} />
            </div>
          </div>
        </Float>
      </PopAt>

      {/* 虚线疑问胶囊 */}
      <Pill f={f} delay={-99} x={880} y={800} w={380} h={76}
        bg={ORANGE_BG} border={`4px dashed ${ORANGE}`} text="里面藏了什么？" color={ORANGE} ts={36} />
      <Sparkle x={820} y={300} s={0.6} />
    </AbsoluteFill>
  );
};

// P2 答案：一条网址（"网址"词级锚点 125 弹出胶囊）
const PageAnswer: React.FC<{off: number}> = ({off}) => {
  const f = useCurrentFrame() - off;
  return (
    <AbsoluteFill>
      <BigTitle f={f} delay={10} y={90} parts={[
        {t: "里面装的是 ", c: INK}, {t: "一条网址", c: ORANGE},
      ]} />

      {/* 左：二维码主角 */}
      <QRCodeFlat x={340} y={330} size={400} />
      <ScanLine f={f} x={357} y={347} w={366} h={366} period={64} />
      <FinderPulse f={f} x={354} y={344} inner={372} delay={44} />

      {/* 网址胶囊从码里弹出 */}
      {/* 等待期占位：URL 弹出前右侧不空（词"答案"@+16 出现，"网址"@+125 让位） */}
      <PopAt f={f} delay={16} x={1000} y={440} w={660} h={130}>
        <div style={{
          position: "absolute", inset: 0, backgroundColor: BLUE_BG, border: `4px dashed ${BLUE}`,
          borderRadius: 999, display: "flex", alignItems: "center", justifyContent: "center",
          opacity: 1 - prog(f, 112, 8),
        }}>
          <div style={{fontFamily: F, fontWeight: 900, fontSize: 42, color: BLUE, whiteSpace: "nowrap"}}>答案 就藏在码里</div>
        </div>
      </PopAt>
      <FlatArrow f={f} x1={770} y1={510} x2={980} y2={505} delay={118} color={ORANGE} sw={8} />
      <PopAt f={f} delay={125} x={1000} y={440} w={660} h={130}>
        <div style={{
          position: "absolute", inset: 0, backgroundColor: "#fff", border: `4px solid ${ORANGE}`,
          borderRadius: 999, boxShadow: "0 12px 26px rgba(240,145,45,0.25)",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <div style={{fontFamily: F, fontWeight: 900, fontSize: 44, color: INK, whiteSpace: "nowrap"}}>{URL_TEXT}</div>
        </div>
      </PopAt>
      <Label f={f} d={135} x={1000} y={596} w={660} text="一条网址 藏在黑白格子里" size={30} color={SUBC} />
      <Sparkle x={960} y={330} s={0.8} />
      <Sparkle x={1720} y={640} s={0.6} color="#f4d9ae" />
    </AbsoluteFill>
  );
};

// P3 快递包装比喻（盒盖 129 打开，包裹单 149 露出）
const PageParcel: React.FC<{off: number}> = ({off}) => {
  const f = useCurrentFrame() - off;
  const open = prog(f, 129, 14);
  return (
    <AbsoluteFill>
      <BigTitle f={f} delay={2} parts={[
        {t: "二维码 就是 ", c: INK}, {t: "网址的快递盒", c: ORANGE},
      ]} />

      {/* 主角：黑白格纹快递盒 */}
      <PopAt f={f} delay={3} x={430} y={350} w={520} h={400}>
        <CourierBox x={0} y={0} w={520} h={400} open={open} />
      </PopAt>
      {/* 打开后从盒口露出的网址包裹单 */}
      {open > 0.6 ? (
        <PopAt f={f} delay={149} x={560} y={222} w={300} h={210}>
          <Waybill x={0} y={0} w={300} h={210} rot={-3} />
        </PopAt>
      ) : null}
      <Label f={f} d={10} x={430} y={776} w={520} text="黑白格纹快递盒" size={30} color={SUBC} />

      {/* 右侧解释条 */}
      <FlatArrow f={f} x1={990} y1={470} x2={1130} y2={450} delay={100} color="#9fb4c8" dashed sw={6} />
      <Pill f={f} delay={108} x={1150} y={390} w={560} h={78} bg={BLUE_BG} text="黑白格子 ＝ 包装材料" color={BLUE} ts={34} />
      <Pill f={f} delay={203} x={1150} y={540} w={560} h={78} bg={ORANGE_BG} text="内容 原封不动" color={ORANGE} ts={34} />
      <Sparkle x={1090} y={640} s={0.8} />
      <Sparkle x={300} y={280} s={0.6} color="#f4d9ae" />
    </AbsoluteFill>
  );
};

// P4 解码三步：拍照(73) → 翻 0/1(135) → 拼网址(180/206)
const PageDecode: React.FC<{off: number}> = ({off}) => {
  const f = useCurrentFrame() - off;
  const flash = interpolate(f, [73, 76, 84], [0, 0.9, 0], clamp);
  return (
    <AbsoluteFill>
      <BigTitle f={f} delay={6} size={76} parts={[
        {t: "拆出网址 ", c: INK}, {t: "三步走", c: BLUE},
      ]} />

      {/* ① 手机拍照 */}
      <PopAt f={f} delay={39} x={170} y={300} w={340} h={480}>
        <div style={{position: "absolute", inset: 0}}>
          <div style={{position: "absolute", inset: 0, backgroundColor: "#3f4d5e", borderRadius: 40, boxShadow: "0 16px 34px rgba(47,58,69,0.16)"}} />
          <div style={{position: "absolute", left: 14, top: 14, width: 312, height: 452, borderRadius: 30, overflow: "hidden", backgroundColor: "#22303e"}}>
            <QRCodeFlat x={52} y={92} size={208} pad={10} />
            <Brackets x={38} y={78} w={236} h={236} color={YEL} sw={7} />
            <div style={{position: "absolute", left: 126, top: 380, width: 60, height: 60, borderRadius: 999, backgroundColor: "#fff", border: `6px solid ${YEL}`}} />
            {/* 快门白闪 */}
            <div style={{position: "absolute", inset: 0, backgroundColor: "#fff", opacity: flash}} />
          </div>
        </div>
      </PopAt>
      <FlashRing f={f} at={74} x={340} y={520} color={YEL} />
      <Label f={f} d={73} x={170} y={806} w={340} text="① 拍照" size={34} weight={900} color={BLUE} />

      <FlatArrow f={f} x1={540} y1={520} x2={668} y2={520} delay={100} color="#9fb4c8" sw={7} />

      {/* ② 格子翻成 0 和 1 */}
      <PopAt f={f} delay={109} x={700} y={340} w={360} h={360}>
        <div style={{
          position: "absolute", inset: 0, backgroundColor: "#fff", border: `3px solid ${BORDER}`,
          borderRadius: 20, boxShadow: "0 12px 26px rgba(47,58,69,0.10)", padding: 14,
        }}>
          <div style={{position: "relative", width: 326, height: 326}}>
            <FlipGrid f={f} x={0} y={0} size={326} base={135} />
          </div>
        </div>
      </PopAt>
      <Label f={f} d={135} x={680} y={726} w={400} text="② 还原成 0 和 1" size={34} weight={900} color={BLUE} />

      <FlatArrow f={f} x1={1100} y1={520} x2={1218} y2={520} delay={170} color="#9fb4c8" sw={7} />
      <LoopPacket f={f} x1={1100} y1={520} x2={1218} y2={520} color={BLUE} start={195} period={40} dur={24} size={28} />

      {/* ③ 拼出网址条 */}
      <PopAt f={f} delay={180} x={1250} y={450} w={540} h={130}>
        <div style={{
          position: "absolute", inset: 0, backgroundColor: INK, borderRadius: 999,
          boxShadow: "0 12px 26px rgba(47,58,69,0.28)",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <div style={{fontFamily: F, fontWeight: 900, fontSize: 40, color: "#fff", whiteSpace: "nowrap"}}>{URL_TEXT}</div>
        </div>
      </PopAt>
      <Label f={f} d={206} x={1250} y={606} w={540} text="③ 拼出网址" size={34} weight={900} color={ORANGE} />
      <Sparkle x={1210} y={360} s={0.7} />
      <Sparkle x={1810} y={700} s={0.6} color="#f4d9ae" />
    </AbsoluteFill>
  );
};

// P5 拆快递＝浏览器打开（包 117 起飞 → 浏览器 139 → 页面 167 弹出 → 请求/响应双向）
const PageBrowser: React.FC<{off: number}> = ({off}) => {
  const f = useCurrentFrame() - off;
  return (
    <AbsoluteFill>
      <BigTitle f={f} delay={4} size={76} parts={[
        {t: "拆出的网址 ", c: INK}, {t: "交给浏览器", c: BLUE},
      ]} />

      {/* 左：拆开的快递盒 + 网址包 */}
      <CourierBox x={230} y={560} w={320} h={240} open={1} />
      <PopAt f={f} delay={98} x={300} y={480} w={180} h={92}>
        <div style={{
          position: "absolute", inset: 0, backgroundColor: "#f2d8a8", border: `3px solid ${BORDER}`,
          borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <div style={{backgroundColor: "#fff", borderRadius: 8, padding: "2px 12px", fontFamily: F, fontWeight: 900, fontSize: 26, color: BLUE}}>网址</div>
        </div>
      </PopAt>
      <Label f={f} d={74} x={230} y={824} w={320} text="拆快递" size={30} color={SUBC} />
      <FlyParcel f={f} x1={420} y1={560} x2={880} y2={520} t0={117} dur={28} />

      {/* 中：浏览器窗口 */}
      <PopAt f={f} delay={139} x={880} y={300} w={580} h={440}>
        <div style={{position: "absolute", inset: 0, backgroundColor: "#fff", border: `3px solid ${BORDER}`, borderRadius: 22, boxShadow: "0 14px 30px rgba(47,58,69,0.12)", overflow: "hidden"}}>
          <div style={{position: "absolute", left: 0, top: 0, width: "100%", height: 60, backgroundColor: "#eef2f7"}}>
            <div style={{position: "absolute", left: 22, top: 22, width: 16, height: 16, borderRadius: 999, backgroundColor: RED}} />
            <div style={{position: "absolute", left: 50, top: 22, width: 16, height: 16, borderRadius: 999, backgroundColor: YEL}} />
            <div style={{position: "absolute", left: 78, top: 22, width: 16, height: 16, borderRadius: 999, backgroundColor: "#7ee0a3"}} />
          </div>
          <div style={{
            position: "absolute", left: 24, top: 76, width: 532, height: 52, borderRadius: 999,
            backgroundColor: "#f2f5f9", display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <div style={{fontFamily: F, fontWeight: 700, fontSize: 26, color: BLUE, whiteSpace: "nowrap"}}>{URL_TEXT}</div>
          </div>
          {/* 页面元素弹出 */}
          <PopAt f={f} delay={167} x={24} y={150} w={532} h={0}>
            <div style={{position: "absolute", left: 0, top: 0, width: 532, height: 0}}>
              <div style={{position: "absolute", left: 30, top: 0, width: 300, height: 30, borderRadius: 8, backgroundColor: BLUE}} />
              <div style={{position: "absolute", left: 30, top: 52, width: 470, height: 16, borderRadius: 8, backgroundColor: "#dfe6ee"}} />
              <div style={{position: "absolute", left: 30, top: 82, width: 380, height: 16, borderRadius: 8, backgroundColor: "#dfe6ee"}} />
              <div style={{position: "absolute", left: 30, top: 118, width: 200, height: 110, borderRadius: 12, backgroundColor: ORANGE_BG, border: `3px solid ${ORANGE}`}} />
              <div style={{position: "absolute", left: 260, top: 118, width: 240, height: 110, borderRadius: 12, backgroundColor: BLUE_BG, border: `3px solid ${BLUE}`}} />
              <div style={{position: "absolute", left: 30, top: 248, width: 180, height: 54, borderRadius: 999, backgroundColor: ORANGE}} />
            </div>
          </PopAt>
        </div>
      </PopAt>
      <Label f={f} d={143} x={880} y={764} w={580} text="浏览器" size={32} weight={900} color={INK} />

      {/* 右：服务器 + 请求/响应双向 */}
      <FlatArrow f={f} x1={1490} y1={430} x2={1600} y2={430} delay={175} color={BLUE} sw={6} />
      <FlatArrow f={f} x1={1600} y1={540} x2={1490} y2={540} delay={183} color={ORANGE} sw={6} />
      <PopAt f={f} delay={178} x={1600} y={380} w={220} h={220}>
        <ServerIcon x={110} y={110} s={1.35} />
      </PopAt>
      <Label f={f} d={182} x={1540} y={626} w={240} text="网站服务器" size={28} color={SUBC} />
      <LoopPacket f={f} x1={1490} y1={430} x2={1600} y2={430} color={BLUE} start={186} period={46} dur={26} size={28} />
      <LoopPacket f={f} x1={1600} y1={540} x2={1490} y2={540} color={ORANGE} start={194} period={46} dur={26} size={28} />
      <Label f={f} d={186} x={1250} y={368} w={240} text="请求" size={28} weight={900} color={BLUE} />
      <Label f={f} d={190} x={1250} y={556} w={240} text="响应" size={28} weight={900} color={ORANGE} />
      <Sparkle x={800} y={250} s={0.7} />
    </AbsoluteFill>
  );
};

// P6 定位标记（角块 42 高亮 → 定位标记 82 → 正扫 117 / 斜扫 139 → 对齐 207）
const PageFinder: React.FC<{off: number}> = ({off}) => {
  const f = useCurrentFrame() - off;
  const alignP = ease(prog(f, 186, 20));
  return (
    <AbsoluteFill>
      <BigTitle f={f} delay={61} size={78} parts={[
        {t: "三个角的大方块 ", c: INK}, {t: "定位标记", c: BLUE},
      ]} />

      {/* 左：大码 + 三个角呼吸高亮 */}
      <QRCodeFlat x={260} y={290} size={480} />
      <FinderPulse f={f} x={274} y={304} inner={452} delay={42} />
      <Label f={f} d={42} x={260} y={796} w={480} text="先找到这三个角" size={30} color={SUBC} />

      <FlatArrow f={f} x1={780} y1={420} x2={1010} y2={360} delay={78} color={BLUE} dashed sw={6} />
      <Pill f={f} delay={82} x={1030} y={316} w={330} h={72} bg={BLUE_BG} text="定位标记" color={BLUE} ts={36} />

      {/* 右上：正着扫 */}
      <Pill f={f} delay={110} x={1180} y={392} w={200} h={56} bg="#f6f8fa" text="正着扫" ts={28} />
      <QRCodeFlat x={1190} y={462} size={170} pad={8} />
      <Brackets x={1176} y={448} w={198} h={198} color={BLUE} sw={6} />
      <PopAt f={f} delay={127} x={1430} y={540} w={60} h={60}><MarkOk x={30} y={30} s={1} /></PopAt>

      {/* 右下：斜着扫 15° 仍被识别 */}
      <Pill f={f} delay={139} x={1180} y={688} w={200} h={56} bg="#f6f8fa" text="斜着扫" ts={28} />
      <QRCodeFlat x={1195} y={756} size={150} pad={8} rot={15} />
      {/* 括号从斜 15° 转正 = 对齐 */}
      <Brackets x={1181} y={742} w={178} h={178} color={ORANGE} sw={6} rot={15 * (1 - alignP)} />
      <PopAt f={f} delay={207} x={1430} y={828} w={60} h={60}><MarkOk x={30} y={30} s={1} /></PopAt>
      <Sparkle x={1000} y={620} s={0.8} />
      <Sparkle x={1700} y={420} s={0.6} color="#b8d4f2" />
    </AbsoluteFill>
  );
};

// P7 纠错（缺口 21 出现 → 照样扫出 52 → 自带纠错 92 → 算回来 154）
const PageECC: React.FC<{off: number}> = ({off}) => {
  const f = useCurrentFrame() - off;
  const bite = prog(f, 21, 12);
  return (
    <AbsoluteFill>
      <BigTitle f={f} delay={4} size={78} parts={[
        {t: "缺了一角 ", c: INK}, {t: "还能扫吗？", c: RED},
      ]} />

      {/* 左：缺角的码（红只给破损） */}
      <PopAt f={f} delay={3} x={330} y={300} w={460} h={460}>
        <QRCodeFlat x={0} y={0} size={460} pad={16} />
      </PopAt>
      {/* 破损缺口：白底咬掉 + 红虚线圈 */}
      {bite > 0 ? (
        <div style={{position: "absolute", left: 592, top: 522, opacity: bite, transform: `scale(${0.7 + 0.3 * bite})`, transformOrigin: "center center"}}>
          <svg width={220} height={220} style={{position: "absolute", left: 0, top: 0, overflow: "visible"}}>
            <circle cx={100} cy={100} r={74} fill="#fff" />
            <circle cx={122} cy={80} r={46} fill="#fff" />
            <circle cx={100} cy={100} r={82} fill="none" stroke={RED} strokeWidth={6} strokeDasharray="16 12" />
            <circle cx={100} cy={100} r={10} fill={RED} />
          </svg>
        </div>
      ) : null}
      <Label f={f} d={21} x={330} y={786} w={460} text="这里破了一块" size={30} color={RED} weight={900} />

      {/* 右：结论 */}
      <PopAt f={f} delay={52} x={1030} y={360} w={620} h={110}>
        <div style={{
          position: "absolute", inset: 0, backgroundColor: "#e9f6ee", border: `4px solid #45a56a`,
          borderRadius: 999, display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <div style={{fontFamily: F, fontWeight: 900, fontSize: 44, color: "#2e7d4f", whiteSpace: "nowrap"}}>照样扫出来</div>
        </div>
      </PopAt>
      <PopAt f={f} delay={60} x={1580} y={380} w={70} h={70}><MarkOk x={35} y={35} s={1.15} /></PopAt>
      <Pill f={f} delay={92} x={1060} y={540} w={560} h={78} bg={BLUE_BG} text="自带纠错 能算回来" color={BLUE} ts={36} />
      <PopAt f={f} delay={154} x={1560} y={552} w={60} h={60}><MarkOk x={30} y={30} s={1} /></PopAt>
      <Sparkle x={990} y={680} s={0.8} />
      <Sparkle x={1750} y={300} s={0.6} color="#bfe3cc" />
    </AbsoluteFill>
  );
};

// P8 金句横幅 + 两张小结卡（横幅分两段按口播弹出：55 / 110）
const PageQuote: React.FC<{off: number}> = ({off}) => {
  const f = useCurrentFrame() - off;
  const p1 = prog(f, 55, 10);
  const p2 = prog(f, 110, 10);
  return (
    <AbsoluteFill>
      <BigTitle f={f} delay={2} size={72} parts={[{t: "一句话记住", c: INK}]} />

      <FlatCard f={f} delay={8} x={180} y={250} w={700} h={330} chip="定位" chipColor={BLUE}>
        <svg width={120} height={120} viewBox="0 0 24 24" style={{position: "absolute", left: 290, top: 44}}>
          <path d="M3 3h4v2H5v2H3V3zm14 0h4v4h-2V5h-2V3zM3 17h2v2h2v2H3v-4zm16 0h2v4h-4v-2h2v-2zM9 9h6v6H9V9z" fill={BLUE} />
        </svg>
        <div style={{position: "absolute", left: 0, top: 196, width: 700, textAlign: "center", fontFamily: F, fontWeight: 900, fontSize: 50, color: INK}}>
          三个角 ＝ <span style={{color: BLUE}}>定位标记</span>
        </div>
        <div style={{position: "absolute", left: 0, top: 268, width: 700, textAlign: "center", fontFamily: F, fontSize: 27, color: SUBC}}>正着扫 斜着扫 都靠它对齐</div>
      </FlatCard>

      <FlatCard f={f} delay={24} x={1040} y={250} w={700} h={330} chip="纠错" chipColor={ORANGE}>
        <svg width={120} height={120} viewBox="0 0 24 24" style={{position: "absolute", left: 290, top: 44}}>
          <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm-1 15l-4-4 1.41-1.41L11 13.17l5.59-5.59L18 9l-7 7z" fill={ORANGE} />
        </svg>
        <div style={{position: "absolute", left: 0, top: 196, width: 700, textAlign: "center", fontFamily: F, fontWeight: 900, fontSize: 50, color: INK}}>
          破损能扫 ＝ <span style={{color: ORANGE}}>自带纠错</span>
        </div>
        <div style={{position: "absolute", left: 0, top: 268, width: 700, textAlign: "center", fontFamily: F, fontSize: 27, color: SUBC}}>缺一小块 也能算回来</div>
      </FlatCard>

      {/* 黄横幅微倾斜，两段文字跟口播弹出 */}
      <PopAt f={f} delay={55} x={340} y={660} w={1240} h={124} rot={-1.2}>
        <div style={{
          width: 1240, height: 124, borderRadius: 24, backgroundColor: YEL,
          display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: "0 14px 30px rgba(247,201,72,0.4)",
        }}>
          <span style={{fontFamily: F, fontWeight: 900, fontSize: 50, color: INK, letterSpacing: 3, whiteSpace: "nowrap"}}>
            <span style={{opacity: p1}}>你扫的不是码</span>
            <span style={{opacity: p2}}> 是藏在格子里的网址</span>
          </span>
        </div>
      </PopAt>
      <Sparkle x={300} y={640} s={0.9} />
      <Sparkle x={1620} y={800} s={0.7} />
    </AbsoluteFill>
  );
};

// P9 结尾截图卡（全部入场在句内完成，最后 ~100 帧完全静止）
const PageOutro: React.FC<{off: number}> = ({off}) => {
  const f = useCurrentFrame() - off;
  return (
    <AbsoluteFill>
      <FlatCard f={f} delay={8} x={430} y={200} w={1060} h={430} chip="存下来" chipColor={BLUE}>
        <QRCodeFlat x={70} y={110} size={200} pad={10} />
        <div style={{position: "absolute", left: 320, top: 90, width: 700, fontFamily: F, fontWeight: 900, fontSize: 52, color: INK, lineHeight: 1.4}}>
          二维码 ＝<br /><span style={{color: ORANGE}}>网址的快递包装</span>
        </div>
        <div style={{position: "absolute", left: 320, top: 260, width: 700, fontFamily: F, fontWeight: 700, fontSize: 33, color: INK}}>
          <span style={{color: BLUE, fontWeight: 900}}>●</span> 三个角 ＝ 定位标记
        </div>
        <div style={{position: "absolute", left: 320, top: 326, width: 700, fontFamily: F, fontWeight: 700, fontSize: 33, color: INK}}>
          <span style={{color: ORANGE, fontWeight: 900}}>●</span> 破损还能扫 ＝ 自带纠错
        </div>
      </FlatCard>

      <Label f={f} d={64} x={560} y={680} w={800} text="小秋 · 0基础也能学会" size={32} color={SUBC} />
      <PopAt f={f} delay={78} x={660} y={740} w={600} h={96}>
        <div style={{
          width: 600, height: 96, borderRadius: 999, backgroundColor: ORANGE,
          display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: "0 14px 30px rgba(240,145,45,0.4)",
        }}>
          <span style={{fontFamily: F, fontWeight: 900, fontSize: 44, color: "#fff", letterSpacing: 6}}>关注 全栈小秋</span>
        </div>
      </PopAt>
      <Sparkle x={400} y={170} s={0.9} />
      <Sparkle x={1540} y={620} s={0.7} />
    </AbsoluteFill>
  );
};

// ============ 主组件 ============

const SENT = [0, 152, 295, 535, 760, 946, 1170, 1338, 1498];
const PAGES = [
  {C: PageCover, start: SENT[0], end: SENT[1]},
  {C: PageAnswer, start: SENT[1], end: SENT[2]},
  {C: PageParcel, start: SENT[2], end: SENT[3]},
  {C: PageDecode, start: SENT[3], end: SENT[4]},
  {C: PageBrowser, start: SENT[4], end: SENT[5]},
  {C: PageFinder, start: SENT[5], end: SENT[6]},
  {C: PageECC, start: SENT[6], end: SENT[7]},
  {C: PageQuote, start: SENT[7], end: SENT[8]},
  {C: PageOutro, start: SENT[8], end: DUR},
];

const SFX = {
  whoosh: "audio/sfx/whoosh.wav",
  pop: "audio/sfx/pop.wav",
  ding: "audio/sfx/ding.wav",
  error: "audio/sfx/error.wav",
  page: "audio/sfx/page3.wav",
};

export const QrCodeFlat: React.FC = () => {
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
      {/* 右上角 IP 角标 */}
      <div style={{
        position: "absolute", top: 45, right: 70, zIndex: 45, border: `3px solid ${BLUE}`,
        borderRadius: 999, padding: "7px 25px", fontSize: 28, fontWeight: 900, color: INK,
        letterSpacing: 5, background: "#fff",
      }}>全栈小秋</div>

      {/* 配音层 */}
      {SENT.map((start, i) => (
        <Sequence key={`v-${i}`} from={start} durationInFrames={DUR - start}>
          <Audio src={staticFile(`audio/qrcode-tts/s0${i + 1}.mp3`)} volume={1} />
        </Sequence>
      ))}

      {/* 音效层：帧号全部由 SENT / 词级锚点推导 */}
      {PAGES.slice(1).map((p, i) => (
        <Sequence key={`pt-${i}`} from={p.start - 6} durationInFrames={20}>
          <Audio src={staticFile(SFX.page)} volume={0.28} />
        </Sequence>
      ))}
      {/* P1 扫描线 whoosh */}
      {[10, 82].map((t) => (
        <Sequence key={`wh1-${t}`} from={SENT[0] + t} durationInFrames={12}>
          <Audio src={staticFile(SFX.whoosh)} volume={0.22} />
        </Sequence>
      ))}
      {/* P2 答案 ding + 网址胶囊弹出 */}
      <Sequence from={SENT[1] + 16} durationInFrames={22}>
        <Audio src={staticFile(SFX.ding)} volume={0.3} />
      </Sequence>
      <Sequence from={SENT[1] + 120} durationInFrames={12}>
        <Audio src={staticFile(SFX.whoosh)} volume={0.22} />
      </Sequence>
      <Sequence from={SENT[1] + 125} durationInFrames={12}>
        <Audio src={staticFile(SFX.pop)} volume={0.26} />
      </Sequence>
      {/* P3 盒子弹出 / 打开 / 包裹单 */}
      <Sequence from={SENT[2] + 3} durationInFrames={12}>
        <Audio src={staticFile(SFX.pop)} volume={0.26} />
      </Sequence>
      <Sequence from={SENT[2] + 129} durationInFrames={12}>
        <Audio src={staticFile(SFX.whoosh)} volume={0.22} />
      </Sequence>
      <Sequence from={SENT[2] + 149} durationInFrames={12}>
        <Audio src={staticFile(SFX.pop)} volume={0.26} />
      </Sequence>
      {/* P4 手机 / 快门 / 翻格 / 拼出网址 */}
      <Sequence from={SENT[3] + 39} durationInFrames={12}>
        <Audio src={staticFile(SFX.pop)} volume={0.26} />
      </Sequence>
      <Sequence from={SENT[3] + 73} durationInFrames={12}>
        <Audio src={staticFile(SFX.whoosh)} volume={0.22} />
      </Sequence>
      <Sequence from={SENT[3] + 135} durationInFrames={12}>
        <Audio src={staticFile(SFX.pop)} volume={0.26} />
      </Sequence>
      <Sequence from={SENT[3] + 206} durationInFrames={22}>
        <Audio src={staticFile(SFX.ding)} volume={0.3} />
      </Sequence>
      {/* P5 包起飞 / 浏览器 / 页面元素 / 打开确认 */}
      <Sequence from={SENT[4] + 117} durationInFrames={12}>
        <Audio src={staticFile(SFX.whoosh)} volume={0.22} />
      </Sequence>
      <Sequence from={SENT[4] + 139} durationInFrames={12}>
        <Audio src={staticFile(SFX.pop)} volume={0.26} />
      </Sequence>
      <Sequence from={SENT[4] + 167} durationInFrames={12}>
        <Audio src={staticFile(SFX.pop)} volume={0.26} />
      </Sequence>
      <Sequence from={SENT[4] + 185} durationInFrames={22}>
        <Audio src={staticFile(SFX.ding)} volume={0.3} />
      </Sequence>
      {/* P6 角块高亮 / 斜码 / 对齐 */}
      <Sequence from={SENT[5] + 42} durationInFrames={12}>
        <Audio src={staticFile(SFX.pop)} volume={0.26} />
      </Sequence>
      <Sequence from={SENT[5] + 139} durationInFrames={12}>
        <Audio src={staticFile(SFX.pop)} volume={0.26} />
      </Sequence>
      <Sequence from={SENT[5] + 207} durationInFrames={22}>
        <Audio src={staticFile(SFX.ding)} volume={0.3} />
      </Sequence>
      {/* P7 缺口 error / 照样扫出 / 算回来 */}
      <Sequence from={SENT[6] + 21} durationInFrames={24}>
        <Audio src={staticFile(SFX.error)} volume={0.3} />
      </Sequence>
      <Sequence from={SENT[6] + 52} durationInFrames={12}>
        <Audio src={staticFile(SFX.pop)} volume={0.26} />
      </Sequence>
      <Sequence from={SENT[6] + 154} durationInFrames={22}>
        <Audio src={staticFile(SFX.ding)} volume={0.3} />
      </Sequence>
      {/* P8 小结卡 + 金句两段 */}
      {[8, 24, 55, 110].map((t) => (
        <Sequence key={`pop8-${t}`} from={SENT[7] + t} durationInFrames={12}>
          <Audio src={staticFile(SFX.pop)} volume={0.26} />
        </Sequence>
      ))}
      {/* P9 截图卡 / 关注 */}
      {[8, 78].map((t) => (
        <Sequence key={`pop9-${t}`} from={SENT[8] + t} durationInFrames={12}>
          <Audio src={staticFile(SFX.pop)} volume={0.26} />
        </Sequence>
      ))}

      <Audio src={staticFile("audio/bed.wav")} loop volume={() => bed} />
      <Sequence from={1498} durationInFrames={60}>
        <Audio src={staticFile("audio/sfx/warm3.wav")} volume={0.26} />
      </Sequence>
      <Subtitle />
    </AbsoluteFill>
  );
};
