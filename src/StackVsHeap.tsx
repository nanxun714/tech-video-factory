import React from "react";
import {Audio} from "@remotion/media";
import {AbsoluteFill, interpolate, Sequence, staticFile, useCurrentFrame} from "remotion";
import {
  INK, SUBC, RED, RED_BG, GREEN, GREEN_BG, YEL, F, W, H,
  clamp, ease, prog, BigTitle, FlashRing, Float, SpinnerFlat,
} from "./flatKit";
import {SENT, DUR_EXT, SUBS, A} from "./stackheapData";

// ============ 堆 vs 栈（对比类 · flat 骨架 + 大白粉彩卡片皮肤，全栈小秋 IP） ============
// 结构：钩子(两种房间的反差) → 双主角 → 栈=餐盘架push/pop → 栈溢出 → 堆=手动申领 → 内存泄漏 → 四行对比 → 金句+CTA
// 语义色：栈 = 深蓝灰（自动/纪律） / 堆 = 橙（自由/堆积）；皮肤：暖白纯底、粉彩无描边、黑大字

export const DUR = DUR_EXT;

const NV = "#3f4d5e";        // 栈·主色（深蓝灰）
const NV_BG = "#e9edf3";     // 栈·粉彩
const NV_BD = "#9fb0c2";     // 栈·激活描边
const OG = "#f0912d";        // 堆·主色（橙）
const OG_BG = "#fdeedd";     // 堆·粉彩
const OG_BD = "#f0b268";     // 堆·激活描边
const PANEL_BD = "#c7d3df";
const CODE_FONT = "'Consolas','JetBrains Mono',monospace";

// 带回弹的入场缓动（盘子/卡片压入的手感）
const back = (p: number) => {
  const t = Math.min(1, Math.max(0, p));
  const c1 = 1.70158, c3 = c1 + 1;
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
};

// ---------- 基础原语（同 TcpVsUdpFlat，皮肤改粉彩） ----------

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

// 大白式粉彩卡：无描边、低饱和填充、柔和阴影
const PastelCard: React.FC<{
  f: number; delay: number; x: number; y: number; w: number; h: number;
  fill?: string; children?: React.ReactNode;
}> = ({f, delay, x, y, w, h, fill = "#ffffff", children}) => {
  const p = prog(f, delay);
  if (p <= 0) return null;
  return (
    <div style={{
      position: "absolute", left: x, top: y, width: w, height: h,
      backgroundColor: fill, borderRadius: 28,
      boxShadow: "0 12px 30px rgba(47,58,69,0.08)",
      opacity: p, transform: `scale(${0.94 + 0.06 * ease(p)})`,
    }}>{children}</div>
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

// 盘子（双环椭圆 + 编号，大白餐盘原语）
const Plate: React.FC<{cx: number; cy: number; w?: number; color?: string; fill?: string; num?: string; ts?: number}> = ({
  cx, cy, w = 280, color = NV, fill = "#dbe4ee", num, ts = 30,
}) => (
  <svg width={w} height={64} viewBox={`0 0 ${w} 64`}
    style={{position: "absolute", left: cx - w / 2, top: cy - 32, overflow: "visible"}}>
    <ellipse cx={w / 2} cy={32} rx={w / 2 - 4} ry={28} fill={fill} stroke={color} strokeWidth={3.5} />
    <ellipse cx={w / 2} cy={32} rx={(w / 2 - 4) * 0.6} ry={15} fill="none" stroke={color} strokeWidth={2.5} opacity={0.55} />
    {num ? (
      <text x={w / 2} y={40} textAnchor="middle" fontFamily={F} fontWeight={900} fontSize={ts} fill={color}>{num}</text>
    ) : null}
  </svg>
);

// 堆区包裹箱
const Box: React.FC<{cx: number; cy: number; w?: number; text: string; color?: string; active?: boolean; op?: number}> = ({
  cx, cy, w = 300, text, color = OG, active, op = 1,
}) => (
  <div style={{
    position: "absolute", left: cx - w / 2, top: cy - 36, width: w, height: 72,
    backgroundColor: "#fff", border: `3.5px solid ${active ? color : OG_BD}`, borderRadius: 16,
    display: "flex", alignItems: "center", justifyContent: "center",
    boxShadow: "0 8px 18px rgba(47,58,69,0.08)", opacity: op,
  }}>
    <span style={{fontFamily: F, fontWeight: 900, fontSize: 32, color: active ? color : "#7c6a50", whiteSpace: "nowrap"}}>{text}</span>
  </div>
);

// 堆叠压入动画容器：把"从上方落下+回弹"封装成可复用原语
// 用法：包住任意已定位的元素，t0 前不渲染，t0 起 dur 帧内从上方 dropY 落到原位
const DropIn: React.FC<{
  f: number; t0: number; dropY?: number; dur?: number; children: React.ReactNode;
}> = ({f, t0, dropY = 170, dur = 22, children}) => {
  if (f < t0) return null;
  const p = back((f - t0) / dur);
  return (
    <div style={{
      position: "absolute", inset: 0,
      transform: `translateY(${(1 - p) * -dropY}px)`,
      opacity: Math.min(1, (f - t0) / 6),
    }}>{children}</div>
  );
};

// 调用栈面板（P3/P4 共用几何）
const STACK_PANEL = {x: 1200, y: 280, w: 460, h: 590};
const StackPanel: React.FC<{f: number; alert?: number}> = ({f, alert}) => {
  const alerted = alert !== undefined && f >= alert;
  return (
    <div style={{
      position: "absolute", left: STACK_PANEL.x, top: STACK_PANEL.y,
      width: STACK_PANEL.w, height: STACK_PANEL.h,
      backgroundColor: "#f2f5f9", border: `3.5px solid ${PANEL_BD}`, borderRadius: 26,
      boxShadow: "0 12px 30px rgba(47,58,69,0.08)",
      background: "linear-gradient(180deg,#f6f9fc 0%,#e9eef5 100%)",
    }}>
      {alerted ? (
        <div style={{
          position: "absolute", inset: -3.5, border: `3.5px solid ${RED}`, borderRadius: 26,
          opacity: Math.min(1, (f - alert) / 14),
        }} />
      ) : null}
    </div>
  );
};

// 栈内函数卡（静置态）
const FuncCard: React.FC<{x: number; y: number; label: string; active?: boolean; fill?: string; bd?: string; op?: number}> = ({
  x, y, label, active, fill = NV_BG, bd = "transparent", op = 1,
}) => (
  <div style={{
    position: "absolute", left: x, top: y, width: 360, height: 88,
    backgroundColor: fill, border: `3.5px solid ${active ? NV_BD : bd}`, borderRadius: 18,
    display: "flex", alignItems: "center", justifyContent: "center", opacity: op,
  }}>
    <span style={{fontFamily: CODE_FONT, fontWeight: 700, fontSize: 36, color: NV}}>{label}</span>
  </div>
);

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
  const cur = SUBS.find((s) => f >= s.s && f < s.e);
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

// P1 钩子（首帧即完整封面）：两个房间的反差
const PageHook: React.FC<{off: number; base: number}> = ({off}) => {
  const f = useCurrentFrame() - off;
  return (
    <AbsoluteFill>
      <BigTitle f={f} delay={-99} y={70} size={78} parts={[
        {t: "同样是", c: INK}, {t: "内存", c: NV}, {t: "，待遇差这么多？", c: INK},
      ]} />

      {/* 左房间：用完自动收拾 */}
      <PopAt f={f} delay={-99} x={230} y={280} w={640} h={540}>
        <Float f={f} x={0} y={0} w={640} h={540} amp={5}>
          <div style={{position: "absolute", inset: 0, backgroundColor: NV_BG, borderRadius: 30}} />
          <div style={{position: "absolute", left: 270, top: 60, width: 100, height: 330, borderLeft: "6px solid #b8c6d6", borderRight: "6px solid #b8c6d6", borderRadius: 8}} />
          <Plate cx={500} cy={210} num="3" />
          <Plate cx={500} cy={266} num="2" />
          <Plate cx={500} cy={322} num="1" />
          <div style={{position: "absolute", left: 120, top: 420, width: 400, height: 70, borderRadius: 999, backgroundColor: GREEN_BG, display: "flex", alignItems: "center", justifyContent: "center"}}>
            <span style={{fontFamily: F, fontWeight: 900, fontSize: 32, color: GREEN}}>用完自动收拾</span>
          </div>
          <div style={{position: "absolute", left: 0, top: 30, width: 640, textAlign: "center", fontFamily: F, fontSize: 30, color: SUBC, fontWeight: 700}}>有的地方</div>
        </Float>
      </PopAt>

      {/* 右房间：越积越多 */}
      <PopAt f={f} delay={-99} x={1050} y={280} w={640} h={540}>
        <Float f={f} x={0} y={0} w={640} h={540} amp={5}>
          <div style={{position: "absolute", inset: 0, backgroundColor: OG_BG, borderRadius: 30}} />
          <div style={{position: "absolute", left: 120, top: 110, width: 180, height: 110, backgroundColor: "#fff", border: "4px solid " + OG_BD, borderRadius: 14, transform: "rotate(-5deg)"}} />
          <div style={{position: "absolute", left: 330, top: 130, width: 180, height: 100, backgroundColor: "#fff", border: "4px solid " + OG_BD, borderRadius: 14, transform: "rotate(4deg)"}} />
          <div style={{position: "absolute", left: 210, top: 230, width: 200, height: 105, backgroundColor: "#fff", border: "4px solid " + OG_BD, borderRadius: 14, transform: "rotate(-2deg)"}} />
          <div style={{position: "absolute", left: 120, top: 300, width: 190, height: 100, backgroundColor: "#fff", border: "4px solid " + OG_BD, borderRadius: 14, transform: "rotate(6deg)"}} />
          <div style={{position: "absolute", left: 330, top: 300, width: 180, height: 96, backgroundColor: "#fff", border: "4px solid " + OG_BD, borderRadius: 14, transform: "rotate(-6deg)"}} />
          <div style={{position: "absolute", left: 120, top: 420, width: 400, height: 70, borderRadius: 999, backgroundColor: RED_BG, display: "flex", alignItems: "center", justifyContent: "center"}}>
            <span style={{fontFamily: F, fontWeight: 900, fontSize: 32, color: RED}}>越积越多 卡到崩溃</span>
          </div>
          <div style={{position: "absolute", left: 0, top: 30, width: 640, textAlign: "center", fontFamily: F, fontSize: 30, color: SUBC, fontWeight: 700}}>有的地方</div>
        </Float>
      </PopAt>

      {/* 中间大问号 */}
      <PopAt f={f} delay={-99} x={898} y={470} w={124} h={124}>
        <div style={{
          width: 124, height: 124, borderRadius: 999, backgroundColor: "#fff",
          border: `5px solid ${YEL}`, display: "flex", alignItems: "center", justifyContent: "center",
          fontFamily: F, fontWeight: 900, fontSize: 62, color: INK, boxShadow: "0 10px 24px rgba(47,58,69,0.14)",
        }}>？</div>
      </PopAt>
      <Pill f={f} delay={-99} x={760} y={870} w={400} h={72} bg="#fff" border={`3px dashed ${NV_BD}`} text="凭什么不一样？" color={NV} ts={34} />
    </AbsoluteFill>
  );
};

// P2 双主角登场：栈 / 堆
const PageTwo: React.FC<{off: number; base: number}> = ({off}) => {
  const f = useCurrentFrame() - off;
  return (
    <AbsoluteFill>
      <Pill f={f} delay={8} x={610} y={64} w={700} h={66} bg={OG_BG} text="程序内存的两种性格" color={OG} ts={32} />
      <BigTitle f={f} delay={40} y={150} parts={[
        {t: "栈", c: NV}, {t: " 和 ", c: INK}, {t: "堆", c: OG},
      ]} />

      <PastelCard f={f} delay={10} x={175} y={320} w={720} h={480} fill={NV_BG}>
        <PopAt f={f} delay={72} x={230} y={70} w={260} h={62}>
          <div style={{position: "absolute", inset: 0, borderRadius: 999, backgroundColor: NV, display: "flex", alignItems: "center", justifyContent: "center"}}>
            <span style={{fontFamily: F, fontWeight: 900, fontSize: 32, color: "#fff", letterSpacing: 4}}>栈</span>
          </div>
        </PopAt>
        <Plate cx={360} cy={190} num="2" w={220} />
        <Plate cx={360} cy={244} num="1" w={220} />
        <div style={{position: "absolute", left: 0, top: 310, width: 720, textAlign: "center", fontFamily: F, fontWeight: 900, fontSize: 72, color: NV, letterSpacing: 8, opacity: prog(f, 80, 10), transform: `scale(${0.7 + 0.3 * ease(prog(f, 80, 10))})`}}>自动管理</div>
        <div style={{position: "absolute", left: 0, top: 408, width: 720, textAlign: "center", fontFamily: F, fontSize: 27, color: SUBC, opacity: prog(f, 88, 12)}}>用完就走 系统包办</div>
      </PastelCard>

      <PastelCard f={f} delay={16} x={1025} y={320} w={720} h={480} fill={OG_BG}>
        <PopAt f={f} delay={105} x={230} y={70} w={260} h={62}>
          <div style={{position: "absolute", inset: 0, borderRadius: 999, backgroundColor: OG, display: "flex", alignItems: "center", justifyContent: "center"}}>
            <span style={{fontFamily: F, fontWeight: 900, fontSize: 32, color: "#fff", letterSpacing: 4}}>堆</span>
          </div>
        </PopAt>
        <Box cx={250} cy={210} w={200} text="包裹" active op={0.9} />
        <Box cx={480} cy={230} w={200} text="包裹" active op={0.9} />
        <Box cx={365} cy={300} w={200} text="包裹" active op={0.9} />
        <div style={{position: "absolute", left: 0, top: 310, width: 720, textAlign: "center", fontFamily: F, fontWeight: 900, fontSize: 72, color: OG, letterSpacing: 8, opacity: prog(f, 113, 10), transform: `scale(${0.7 + 0.3 * ease(prog(f, 113, 10))})`}}>手动管理</div>
        <div style={{position: "absolute", left: 0, top: 408, width: 720, textAlign: "center", fontFamily: F, fontSize: 27, color: SUBC, opacity: prog(f, 121, 12)}}>想要多少 自己申请</div>
      </PastelCard>

      <PopAt f={f} delay={50} x={910} y={510} w={100} h={100}>
        <div style={{
          width: 100, height: 100, borderRadius: 999, backgroundColor: "#fff",
          border: `5px solid ${YEL}`, display: "flex", alignItems: "center", justifyContent: "center",
          fontFamily: F, fontWeight: 900, fontSize: 40, color: INK, boxShadow: "0 8px 18px rgba(47,58,69,0.12)",
        }}>VS</div>
      </PopAt>
    </AbsoluteFill>
  );
};

// P3 栈机制：餐盘架 + 调用栈 push/pop
const PageStack: React.FC<{off: number; base: number}> = ({off, base}) => {
  const f = useCurrentFrame() - off;
  const push = A.s3_push - base;   // 压入锚点（页内帧）
  const pop = A.s3_pop - base;

  // 左：餐盘架，第三只盘子随"压进去"落下，随"弹走"升起淡出
  const pOut = pop >= 0 ? Math.min(1, Math.max(0, (f - pop) / 16)) : 0;
  const plate3Y = f < push ? 430 : 536 - (pOut > 0 ? ease(pOut) * 130 : 0);
  const plate3Op = pop >= 0 ? 1 - pOut : (f < push ? 0 : Math.min(1, (f - push) / 6));

  // 右：调用栈，B() 压入/弹出
  const cardIn = push >= 0 ? back(Math.max(0, (f - push) / 22)) : 0;
  const cardOut = pop >= 0 ? ease(Math.min(1, Math.max(0, (f - pop) / 16))) : 0;
  const bY = f < push ? STACK_PANEL.y + 40 : (644 - cardOut * 150);
  const bOp = pop >= 0 ? 1 - cardOut : (f < push ? 0 : Math.min(1, (f - push) / 6));

  return (
    <AbsoluteFill>
      <BigTitle f={f} delay={0} parts={[
        {t: "函数一调用，", c: INK}, {t: "栈", c: NV}, {t: "里发生了什么？", c: INK},
      ]} />

      {/* 左：生活比喻 餐盘架 */}
      <PastelCard f={f} delay={6} x={240} y={280} w={640} h={470} fill={NV_BG}>
        <div style={{position: "absolute", left: 290, top: 50, width: 60, height: 300, borderLeft: "6px solid #b8c6d6", borderRight: "6px solid #b8c6d6", borderRadius: 8}} />
        <Plate cx={360} cy={230} num="2" w={240} />
        <Plate cx={360} cy={286} num="1" w={240} />
        {plate3Op > 0 ? (
          <div style={{position: "absolute", left: 0, top: 0, opacity: plate3Op}}>
            <Plate cx={360} cy={plate3Y} num="3" w={240} fill="#c9d8ea" />
          </div>
        ) : null}
        <Label f={f} d={10} x={140} y={396} w={440} text="餐盘架" size={30} color={SUBC} />
      </PastelCard>

      {/* 右：调用栈 */}
      <Label f={f} d={A.s3_plate - base} x={STACK_PANEL.x} y={236} w={STACK_PANEL.w} text="调用栈" size={32} color={SUBC} weight={900} />
      <StackPanel f={f} />
      <PopAt f={f} delay={A.s3_plate - base + 4} x={1250} y={760} w={360} h={88}>
        <FuncCard x={0} y={0} label="main()" />
      </PopAt>
      {cardIn > 0 && bOp > 0 ? (
        <div style={{position: "absolute", left: 1250, top: bY, opacity: bOp}}>
          <FuncCard x={0} y={0} label="B()" active fill="#dbe4ee" />
        </div>
      ) : null}

      {f < pop ? (
        <FlatArrow f={f} x1={1000} y1={662} x2={1190} y2={662} delay={push - 6} color="#4a86d8" sw={8} />
      ) : null}
      {f < pop ? (
        <Label f={f} d={push - 6} x={950} y={600} w={200} text="压入" size={32} weight={900} color="#4a86d8" />
      ) : null}
      <FlatArrow f={f} x1={1672} y1={560} x2={1862} y2={560} delay={pop - 4} color={RED} sw={8} />
      <Label f={f} d={pop - 4} x={1762} y={498} w={200} text="弹走" size={32} weight={900} color={RED} />

      <Pill f={f} delay={A.s3_auto - base} x={350} y={790} w={560} h={74} bg={GREEN_BG} text="全程 系统自动管理" color={GREEN} ts={36} />
    </AbsoluteFill>
  );
};

// P4 栈溢出：递归层层压栈 → 塞爆
const PageOverflow: React.FC<{off: number; base: number}> = ({off, base}) => {
  const f = useCurrentFrame() - off;
  const burst = A.s4_burst - base;
  const pushTs = [A.s4_recur - base, A.s4_recur - base + 18, A.s4_recur - base + 36, A.s4_recur - base + 54, A.s4_recur - base + 72];
  const slotYs = [660, 564, 468, 372, 350];
  const alert = burst;

  return (
    <AbsoluteFill>
      <BigTitle f={f} delay={0} parts={[
        {t: "栈", c: NV}, {t: " 的死穴：", c: INK}, {t: "空间很小", c: RED},
      ]} />

      <StackPanel f={f} alert={alert} />
      <PopAt f={f} delay={8} x={1250} y={744} w={360} h={88}>
        <FuncCard x={0} y={0} label="main()" />
      </PopAt>
      {pushTs.map((t0, i) => {
        if (f < t0) return null;
        const p = back((f - t0) / 18);
        const y = interpolate(Math.min(1, p), [0, 1], [slotYs[i] - 150, slotYs[i]]);
        const isTop = i === pushTs.length - 1;
        const topRed = isTop && f >= burst;
        return (
          <div key={i} style={{position: "absolute", left: 1250, top: y, opacity: Math.min(1, (f - t0) / 5)}}>
            <div style={{
              width: 360, height: 72, borderRadius: 16,
              backgroundColor: topRed ? "#f8d7d7" : "#dbe4ee",
              border: `3.5px solid ${topRed ? RED : NV_BD}`,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <span style={{fontFamily: CODE_FONT, fontWeight: 700, fontSize: 32, color: topRed ? RED : NV}}>f()</span>
            </div>
          </div>
        );
      })}

      <PopAt f={f} delay={burst + 4} x={1250} y={218} w={360} h={64}>
        <div style={{position: "absolute", inset: 0, borderRadius: 999, backgroundColor: RED, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 10px 24px rgba(224,86,86,0.35)"}}>
          <span style={{fontFamily: CODE_FONT, fontWeight: 900, fontSize: 30, color: "#fff", letterSpacing: 2}}>Stack Overflow</span>
        </div>
      </PopAt>
      <FlashRing f={f} at={burst} x={1430} y={386} color={RED} />

      {/* 左：三连解释 */}
      <Pill f={f} delay={A.s4_recur - base} x={280} y={340} w={660} h={74} bg={NV_BG} text="递归忘了写结束条件" color={NV} ts={34} />
      <Pill f={f} delay={A.s4_layer - base} x={280} y={450} w={660} h={74} bg={NV_BG} text="函数一层压一层" color={NV} ts={34} />
      <Pill f={f} delay={burst} x={280} y={560} w={660} h={74} bg={RED_BG} text="很快 塞爆" color={RED} ts={34} />
      <Label f={f} d={A.s4_crash - base} x={230} y={672} w={760} text="程序当场崩溃" color={RED} size={40} weight={900} />
      <Pill f={f} delay={A.s4_over - base - 28} x={280} y={760} w={660} h={74} bg={RED} text="这就叫 栈溢出" color="#fff" ts={38} />
    </AbsoluteFill>
  );
};

// P5 堆机制：手动申领，包裹落进堆区
const PageHeap: React.FC<{off: number; base: number}> = ({off, base}) => {
  const f = useCurrentFrame() - off;
  return (
    <AbsoluteFill>
      <BigTitle f={f} delay={0} parts={[
        {t: "堆", c: OG}, {t: " 就自由多了", c: INK},
      ]} />

      {/* 左：代码卡 */}
      <PastelCard f={f} delay={6} x={200} y={310} w={560} h={400} fill="#ffffff">
        <div style={{position: "absolute", left: 44, top: 34, fontFamily: F, fontSize: 28, color: SUBC, fontWeight: 700}}>申请堆内存</div>
        <PopAt f={f} delay={A.s5_malloc - base + 2} x={44} y={110} w={470} h={78}>
          <div style={{position: "absolute", inset: 0, borderRadius: 14, backgroundColor: OG_BG, display: "flex", alignItems: "center", paddingLeft: 30}}>
            <span style={{fontFamily: CODE_FONT, fontWeight: 700, fontSize: 32, color: INK}}>C: <span style={{color: OG, fontWeight: 900}}>malloc()</span></span>
          </div>
        </PopAt>
        <PopAt f={f} delay={A.s5_new - base + 2} x={44} y={210} w={470} h={78}>
          <div style={{position: "absolute", inset: 0, borderRadius: 14, backgroundColor: OG_BG, display: "flex", alignItems: "center", paddingLeft: 30}}>
            <span style={{fontFamily: CODE_FONT, fontWeight: 700, fontSize: 32, color: INK}}>Java: <span style={{color: OG, fontWeight: 900}}>new User()</span></span>
          </div>
        </PopAt>
        <div style={{position: "absolute", left: 44, top: 316, width: 470, textAlign: "center", fontFamily: F, fontSize: 27, color: SUBC, opacity: prog(f, A.s5_obj - base + 2, 12)}}>
          创建出来的对象 都住这里
        </div>
      </PastelCard>

      <FlatArrow f={f} x1={790} y1={510} x2={1120} y2={510} delay={A.s5_malloc - base - 4} color={OG} sw={8} />

      {/* 右：堆区容器 + 包裹落箱 */}
      <Label f={f} d={10} x={1140} y={236} w={540} text="堆区" size={32} color={SUBC} weight={900} />
      <div style={{
        position: "absolute", left: 1140, top: 280, width: 540, height: 600,
        backgroundColor: OG_BG, border: "3.5px solid #f0c896", borderRadius: 26,
        boxShadow: "0 12px 30px rgba(47,58,69,0.08)",
      }} />
      <DropIn f={f} t0={A.s5_malloc - base + 6}>
        <Box cx={1410} cy={770} text="malloc 的内存" active />
      </DropIn>
      <DropIn f={f} t0={A.s5_new - base + 4}>
        <Box cx={1410} cy={668} text="new 的对象" active />
      </DropIn>
      <DropIn f={f} t0={A.s5_obj - base + 2} dur={26}>
        <Box cx={1410} cy={566} text="User 对象" active />
      </DropIn>

      <Pill f={f} delay={A.s5_apply - base} x={280} y={770} w={520} h={74} bg={OG_BG} text="想要多少 申请多少" color={OG} ts={36} />
    </AbsoluteFill>
  );
};

// P6 内存泄漏：忘了归还 → 越积越多
const PageLeak: React.FC<{off: number; base: number}> = ({off, base}) => {
  const f = useCurrentFrame() - off;
  const leak = A.s6_leak - base;
  const alert = leak;
  const dropTs = [A.s6_accum - base, A.s6_accum - base + 16, A.s6_accum - base + 32];
  const newSlots = [526, 442, 358];

  return (
    <AbsoluteFill>
      <BigTitle f={f} delay={0} parts={[
        {t: "自由的代价：", c: INK}, {t: "忘了归还", c: RED},
      ]} />

      <Label f={f} d={8} x={1500} y={243} w={180} text="堆区" size={32} color={SUBC} weight={900} />
      <div style={{
        position: "absolute", left: 1140, top: 280, width: 540, height: 600,
        backgroundColor: OG_BG,
        border: `3.5px solid ${f >= alert ? RED : "#f0c896"}`,
        borderRadius: 26, boxShadow: "0 12px 30px rgba(47,58,69,0.08)",
      }} />
      {/* 上页遗留：只申请没归还 */}
      <Box cx={1410} cy={814} text="malloc 的内存" active op={0.8} />
      <Box cx={1410} cy={730} text="new 的对象" active op={0.8} />
      <Box cx={1410} cy={646} text="User 对象" active op={0.8} />
      {dropTs.map((t0, i) => {
        if (f < t0) return null;
        const p = back((f - t0) / 20);
        const y = interpolate(Math.min(1, p), [0, 1], [newSlots[i] - 150, newSlots[i]]);
        return (
          <div key={i} style={{position: "absolute", left: 1410 - 150, top: y, opacity: Math.min(1, (f - t0) / 5)}}>
            <Box cx={150} cy={36} w={300} text="没归还的内存" active />
          </div>
        );
      })}

      <PopAt f={f} delay={leak + 2} x={1160} y={240} w={300} h={64}>
        <div style={{position: "absolute", inset: 0, borderRadius: 999, backgroundColor: RED, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 10px 24px rgba(224,86,86,0.35)"}}>
          <span style={{fontFamily: F, fontWeight: 900, fontSize: 32, color: "#fff", letterSpacing: 4}}>内存泄漏</span>
        </div>
      </PopAt>

      {/* 左：解释链 */}
      <Pill f={f} delay={A.s6_forget - base} x={230} y={330} w={640} h={74} bg={RED_BG} text="申请了 忘了还" color={RED} ts={34} />
      <Label f={f} d={A.s6_occupy - base} x={230} y={436} w={640} text="这块内存永远被占着" color={INK} size={34} weight={900} />
      <Pill f={f} delay={leak} x={230} y={520} w={640} h={74} bg={RED} text="这就是 内存泄漏" color="#fff" ts={36} />
      <PopAt f={f} delay={A.s6_culprit - base - 34} x={230} y={640} w={640} h={110}>
        <div style={{position: "absolute", inset: 0, borderRadius: 22, backgroundColor: "#fff", border: "3.5px solid #f0c896", display: "flex", alignItems: "center", paddingLeft: 130}}>
          <SpinnerFlat f={f} x={70} y={55} d={0} s={0.62} color={OG} />
          <div style={{marginLeft: 24}}>
            <div style={{fontFamily: F, fontWeight: 900, fontSize: 30, color: INK}}>程序越跑越卡</div>
            <div style={{fontFamily: F, fontSize: 24, color: SUBC, marginTop: 4}}>元凶就是它 · 上期讲过</div>
          </div>
        </div>
      </PopAt>
    </AbsoluteFill>
  );
};

// P7 一张图记住：四行对比
const PageCompare: React.FC<{off: number; base: number}> = ({off, base}) => {
  const f = useCurrentFrame() - off;
  const Row: React.FC<{y: number; delay: number; bg: string; t: React.ReactNode}> = ({y, delay, bg, t}) => (
    <PopAt f={f} delay={delay} x={40} y={y} w={680} h={112}>
      <div style={{position: "absolute", inset: 0, borderRadius: 18, backgroundColor: bg, display: "flex", alignItems: "center", justifyContent: "center"}}>
        <span style={{fontFamily: F, fontWeight: 900, fontSize: 36, color: INK, whiteSpace: "nowrap"}}>{t}</span>
      </div>
    </PopAt>
  );
  const leakR = A.s7_leak - base - 19; // 提前到"漏掉了"出口，保证压轴停留
  return (
    <AbsoluteFill>
      <BigTitle f={f} delay={0} parts={[{t: "一张图记住", c: INK}]} />

      <PastelCard f={f} delay={6} x={170} y={250} w={760} h={610} fill={NV_BG}>
        <PopAt f={f} delay={10} x={280} y={-30} w={200} h={60}>
          <div style={{position: "absolute", inset: 0, borderRadius: 999, backgroundColor: NV, display: "flex", alignItems: "center", justifyContent: "center"}}>
            <span style={{fontFamily: F, fontWeight: 900, fontSize: 32, color: "#fff", letterSpacing: 4}}>栈</span>
          </div>
        </PopAt>
        <Row y={70} delay={A.s7_auto - base} bg="#dde5ee" t={<>系统 <span style={{color: NV}}>自动管理</span></>} />
        <Row y={210} delay={A.s7_small - base} bg="#dde5ee" t={<>空间小 · 速度快</>} />
        <Row y={350} delay={A.s7_burst - base} bg={RED_BG} t={<><span style={{color: RED}}>塞爆了 → 栈溢出</span></>} />
        <div style={{position: "absolute", left: 0, top: 500, width: 760, textAlign: "center", fontFamily: F, fontSize: 26, color: SUBC, opacity: prog(f, A.s7_over - base + 10, 12)}}>
          函数的临时工作台
        </div>
      </PastelCard>

      <PastelCard f={f} delay={12} x={990} y={250} w={760} h={610} fill={OG_BG}>
        <PopAt f={f} delay={14} x={280} y={-30} w={200} h={60}>
          <div style={{position: "absolute", inset: 0, borderRadius: 999, backgroundColor: OG, display: "flex", alignItems: "center", justifyContent: "center"}}>
            <span style={{fontFamily: F, fontWeight: 900, fontSize: 32, color: "#fff", letterSpacing: 4}}>堆</span>
          </div>
        </PopAt>
        <Row y={70} delay={A.s7_manual - base} bg="#fae3c4" t={<>自己 <span style={{color: OG}}>手动管理</span></>} />
        <Row y={210} delay={A.s7_big - base} bg="#fae3c4" t={<>空间大 · 更灵活</>} />
        <Row y={350} delay={leakR} bg={RED_BG} t={<><span style={{color: RED}}>漏掉了 → 内存泄漏</span></>} />
        <div style={{position: "absolute", left: 0, top: 500, width: 760, textAlign: "center", fontFamily: F, fontSize: 26, color: SUBC, opacity: prog(f, leakR + 10, 12)}}>
          对象的公共仓库
        </div>
      </PastelCard>
    </AbsoluteFill>
  );
};

// P8 金句 + 关注 + 下期（结尾卡，静止停留）
const PageGolden: React.FC<{off: number; base: number}> = ({off, base}) => {
  const f = useCurrentFrame() - off;
  return (
    <AbsoluteFill>
      <Label f={f} d={A.s8_crash - base} x={360} y={170} w={1200} text="下次程序崩溃 先想想是哪种" color={SUBC} size={38} weight={700} />

      <PopAt f={f} delay={A.s8_boom - base} x={360} y={270} w={1200} h={150}>
        <div style={{position: "absolute", inset: 0, borderRadius: 26, backgroundColor: NV, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 16px 36px rgba(63,77,94,0.3)"}}>
          <span style={{fontFamily: F, fontWeight: 900, fontSize: 56, color: "#fff", letterSpacing: 8}}>栈炸了 叫 栈溢出</span>
        </div>
      </PopAt>
      <PopAt f={f} delay={A.s8_leakw - base} x={360} y={450} w={1200} h={150}>
        <div style={{position: "absolute", inset: 0, borderRadius: 26, backgroundColor: OG, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 16px 36px rgba(240,145,45,0.32)"}}>
          <span style={{fontFamily: F, fontWeight: 900, fontSize: 56, color: "#fff", letterSpacing: 8}}>堆漏了 叫 内存泄漏</span>
        </div>
      </PopAt>

      <PopAt f={f} delay={A.s8_follow - base} x={660} y={680} w={600} h={96}>
        <div style={{position: "absolute", inset: 0, borderRadius: 999, backgroundColor: "#fff", border: `5px solid ${OG}`, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 12px 26px rgba(240,145,45,0.25)"}}>
          <span style={{fontFamily: F, fontWeight: 900, fontSize: 44, color: OG, letterSpacing: 6}}>关注 全栈小秋</span>
        </div>
      </PopAt>
      <Pill f={f} delay={A.s8_next - base + 2} x={430} y={820} w={1060} h={72} bg={NV_BG} text="下期：CPU 占用爆表 怎么揪出真凶" color={NV} ts={34} />
      <Label f={f} d={A.s8_next - base + 14} x={660} y={920} w={600} text="全栈小秋 · 0 基础也能学会" color={SUBC} size={26} />
    </AbsoluteFill>
  );
};

// ============ 主组件 ============

const PAGES: {C: React.FC<{off: number; base: number}>; start: number; end: number}[] = [
  {C: PageHook, start: SENT[0], end: SENT[1]},
  {C: PageTwo, start: SENT[1], end: SENT[2]},
  {C: PageStack, start: SENT[2], end: SENT[3]},
  {C: PageOverflow, start: SENT[3], end: SENT[4]},
  {C: PageHeap, start: SENT[4], end: SENT[5]},
  {C: PageLeak, start: SENT[5], end: SENT[6]},
  {C: PageCompare, start: SENT[6], end: SENT[7]},
  {C: PageGolden, start: SENT[7], end: DUR},
];

export const StackVsHeap: React.FC = () => {
  const frame = useCurrentFrame();
  const bed = interpolate(frame, [0, 20, DUR - 40, DUR - 6], [0, 0.06, 0.06, 0], clamp);
  return (
    <AbsoluteFill style={{background: "#f7f5f0", fontFamily: F, overflow: "hidden"}}>
      {PAGES.map(({C, start, end}, i) => {
        const first = i === 0, last = i === PAGES.length - 1, len = end - start, off = first ? 0 : 10;
        return (
          <Sequence key={i} from={first ? 0 : start - 10} durationInFrames={len + 12}>
            <PageTurn off={off} len={len} first={first} last={last}><C off={off} base={start} /></PageTurn>
          </Sequence>
        );
      })}
      <div style={{
        position: "absolute", top: 45, right: 70, zIndex: 45, border: `3px solid ${NV}`,
        borderRadius: 999, padding: "7px 25px", fontSize: 28, fontWeight: 900, color: INK,
        letterSpacing: 5, background: "#fff",
      }}>全栈小秋</div>
      {[
        "s01.mp3", "s02.mp3", "s03.mp3", "s04.mp3", "s05.mp3", "s06.mp3", "s07.mp3", "s08.mp3",
      ].map((a, i) => (
        <Sequence key={`v-${i}`} from={SENT[i]} durationInFrames={i < 7 ? SENT[i + 1] - SENT[i] + 20 : DUR - SENT[i]}>
          <Audio src={staticFile(`audio/stackheap-tts/${a}`)} volume={1} />
        </Sequence>
      ))}
      {/* 音效：翻页 / 压入whoosh / 溢出泄漏error / 确认ding / 关注pop */}
      {PAGES.slice(1).map((p, i) => (
        <Sequence key={`pt-${i}`} from={p.start - 6} durationInFrames={20}>
          <Audio src={staticFile("audio/sfx/transfer.wav")} volume={0.14} />
        </Sequence>
      ))}
      {[A.s3_push, A.s4_recur, A.s4_recur + 18, A.s4_recur + 36, A.s4_recur + 54, A.s4_recur + 72,
        A.s5_malloc + 6, A.s5_new + 4, A.s5_obj + 2, A.s6_accum, A.s6_accum + 16, A.s6_accum + 32].map((t) => (
        <Sequence key={`wh-${t}`} from={t} durationInFrames={12}>
          <Audio src={staticFile("audio/sfx/whoosh.wav")} volume={0.1} />
        </Sequence>
      ))}
      <Sequence from={A.s4_burst} durationInFrames={22}>
        <Audio src={staticFile("audio/sfx/error.wav")} volume={0.3} />
      </Sequence>
      <Sequence from={A.s6_leak} durationInFrames={22}>
        <Audio src={staticFile("audio/sfx/error.wav")} volume={0.3} />
      </Sequence>
      <Sequence from={A.s3_auto} durationInFrames={20}>
        <Audio src={staticFile("audio/sfx/ding.wav")} volume={0.3} />
      </Sequence>
      <Sequence from={A.s8_follow} durationInFrames={20}>
        <Audio src={staticFile("audio/sfx/ding.wav")} volume={0.34} />
      </Sequence>
      <Audio src={staticFile("audio/bed.wav")} loop volume={() => bed} />
      <Subtitle />
    </AbsoluteFill>
  );
};
