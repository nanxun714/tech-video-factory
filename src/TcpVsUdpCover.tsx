import {AbsoluteFill} from "remotion";

// ================= TCP vs UDP 竖版封面（1080x1440 静态，发布专用） =================

const PAPER = "#fdfcf7";
const INK = "#3a3a3a";
const RED = "#c94f4f";
const ORANGE_E = "#c97a2e";
const STAIN = "rgba(150,110,70,0.30)";

const T_FONT = "'STXingkai','华文行楷','KaiTi','楷体',serif";
const YAHEI = "'Microsoft YaHei',sans-serif";

const blobPath = (cx: number, cy: number, rx: number, ry: number, seed = 0) => {
  const N = 9;
  const pts: string[] = [];
  for (let i = 0; i < N; i++) {
    const a = (i / N) * Math.PI * 2;
    const jx = 1 + 0.16 * Math.sin(a * 3 + seed * 1.7);
    const jy = 1 + 0.2 * Math.cos(a * 2 + seed);
    pts.push(`${(cx + Math.cos(a) * rx * jx).toFixed(1)},${(cy + Math.sin(a) * ry * jy).toFixed(1)}`);
  }
  const mid = (a: string, b: string) => {
    const [ax, ay] = a.split(",").map(Number);
    const [bx, by] = b.split(",").map(Number);
    return `${((ax + bx) / 2).toFixed(1)},${((ay + by) / 2).toFixed(1)}`;
  };
  let d = `M ${mid(pts[N - 1], pts[0])}`;
  for (let i = 0; i < N; i++) d += ` Q ${pts[i]} ${mid(pts[i], pts[(i + 1) % N])}`;
  return d + " Z";
};

export const TcpVsUdpCover: React.FC = () => {
  const W = 1080;
  const H = 1440;
  const coils: React.ReactNode[] = [];
  const n = 14;
  for (let i = 0; i < n; i++) {
    const y = 50 + i * ((H - 100) / (n - 1));
    coils.push(
      <g key={i}>
        <ellipse cx={46} cy={y} rx={26} ry={11} fill="none" stroke="#4a4a4a" strokeWidth={5.5}
          transform={`rotate(-28 46 ${y})`} />
        <path d={`M 66 ${y - 4} Q 82 ${y} 76 ${y + 9}`} stroke="#6a6a6a" strokeWidth={4} fill="none" strokeLinecap="round" opacity={0.7} />
      </g>
    );
  }
  return (
    <AbsoluteFill style={{backgroundColor: PAPER, overflow: "hidden"}}>
      {/* 咖啡渍 */}
      <svg width={W} height={H} style={{position: "absolute", left: 0, top: 0, pointerEvents: "none"}}>
        <path d={blobPath(920, 200, 56, 44, 11)} fill="rgba(150,110,70,0.07)" />
        <path d={blobPath(920, 200, 47, 36, 11)} fill="none" stroke={STAIN} strokeWidth={4.5} />
        <path d={blobPath(190, 1250, 42, 33, 5)} fill="rgba(150,110,70,0.06)" />
        <path d={blobPath(190, 1250, 34, 27, 5)} fill="none" stroke={STAIN} strokeWidth={4} />
      </svg>
      {/* 标题：粗雅黑保证清晰 */}
      <div style={{
        position: "absolute", top: 88, left: 0, right: 0, textAlign: "center",
        fontFamily: YAHEI, fontWeight: 900, fontSize: 118,
        letterSpacing: 2, whiteSpace: "nowrap", transform: "rotate(-1deg)",
      }}>
        <span style={{color: ORANGE_E}}>TCP</span>
        <span style={{fontFamily: T_FONT, fontWeight: 400, fontSize: 66, color: INK, margin: "0 26px"}}>vs</span>
        <span style={{color: "#5b87ad"}}>UDP</span>
      </div>
      <div style={{position: "absolute", top: 268, left: "50%", transform: "translateX(-50%)"}}>
        <svg width={620} height={22}>
          <path d="M 4 11 q 39 -11 78 0 t 78 0 t 78 0 t 78 0 t 78 0 t 78 0 t 78 0 t 62 0" fill="none" stroke={RED} strokeWidth={6} opacity={0.85} />
        </svg>
      </div>
      {/* 钩子贴纸 */}
      <div style={{
        position: "absolute", top: 348, left: 120, width: 840, height: 104,
        backgroundColor: "rgba(255,255,255,0.9)", border: `4px dashed ${ORANGE_E}`, borderRadius: 20,
        display: "flex", alignItems: "center", justifyContent: "center",
        boxShadow: "0 8px 22px rgba(58,58,58,0.10)", transform: "rotate(-2deg)",
      }}>
        <div style={{fontFamily: YAHEI, fontWeight: 700, fontSize: 40, color: INK, whiteSpace: "nowrap"}}>
          视频丢了能糊弄 <span style={{color: RED}}>转账为什么不能？</span>
        </div>
      </div>
      {/* TCP 圆牌：实心话筒 + 橙色信号弧 */}
      <svg width={W} height={H} style={{position: "absolute", left: 0, top: 0, pointerEvents: "none"}}>
        <g transform="translate(540 560) scale(0.88)">
          <path d="M -64 45 C -64 38 -59 33 -52 33 C -30 10 -10 0 0 0 C 10 0 30 10 52 33 C 59 33 64 38 64 45 C 64 54 57 61 48 61 L 40 61 C 31 61 24 54 24 45 L 24 40 C 17 33 -17 33 -24 40 L -24 45 C -24 54 -31 61 -40 61 L -48 61 C -57 61 -64 54 -64 45 Z"
            fill={INK} transform="rotate(-38)" />
          {[0, 1, 2].map((i) => (
            <path key={i} d={`M ${64 + i * 19} ${-34 - i * 16} A ${50 + i * 17} ${50 + i * 17} 0 0 1 ${64 + i * 19} ${34 + i * 16}`}
              fill="none" stroke={ORANGE_E} strokeWidth={6 + i} strokeLinecap="round" opacity={0.85} />
          ))}
        </g>
      </svg>
      <div style={{
        position: "absolute", top: 690, left: 0, right: 0, textAlign: "center",
        fontFamily: T_FONT, fontSize: 68, color: INK, letterSpacing: 10, whiteSpace: "nowrap",
      }}>先确认 再开讲</div>
      {/* 中间 VS：手绘双向箭头，避免抽象徽章 */}
      <svg width={W} height={H} style={{position: "absolute", left: 0, top: 0, pointerEvents: "none"}}>
        <path d="M 330 862 Q 420 820 470 850" fill="none" stroke={ORANGE_E} strokeWidth={7} strokeLinecap="round" />
        <path d="M 470 850 L 445 832 M 470 850 L 442 862" fill="none" stroke={ORANGE_E} strokeWidth={7} strokeLinecap="round" strokeLinejoin="round" />
        <path d="M 750 850 Q 660 890 610 862" fill="none" stroke="#5b87ad" strokeWidth={7} strokeLinecap="round" />
        <path d="M 610 862 L 635 880 M 610 862 L 638 850" fill="none" stroke="#5b87ad" strokeWidth={7} strokeLinecap="round" strokeLinejoin="round" />
        <text x={540} y={884} textAnchor="middle" fontFamily={YAHEI} fontWeight={900} fontSize={58} fill={INK}>VS</text>
      </svg>
      <div style={{position: "absolute", left: 270, top: 910, width: 540, textAlign: "center", fontFamily: YAHEI, fontWeight: 700, fontSize: 28, color: "#8a8579", whiteSpace: "nowrap"}}>可靠传输  ↔  快速传输</div>
      {/* UDP 具象喇叭：白板线稿，不套圆牌 */}
      <svg width={W} height={H} style={{position: "absolute", left: 0, top: 0, pointerEvents: "none"}}>
        <g transform="translate(540 1090)">
          <g transform="rotate(-14)">
            <path d="M -80 -22 L 14 -61 L 14 61 L -80 22 Z" fill="rgba(255,255,255,0.95)" stroke={INK} strokeWidth={6} strokeLinejoin="round" />
            <path d="M 14 -61 L 54 -47 L 54 47 L 14 61 Z" fill="rgba(139,178,216,0.55)" stroke={INK} strokeWidth={6} strokeLinejoin="round" />
            <path d="M -80 -22 L -96 -17 L -96 17 L -80 22 Z" fill={INK} stroke={INK} strokeWidth={4} strokeLinejoin="round" />
            <path d="M -61 35 L -50 84 L -16 77 L -30 38" fill="rgba(255,255,255,0.95)" stroke={INK} strokeWidth={5.5} strokeLinejoin="round" />
          </g>
          {[0, 1, 2].map((i) => (
            <path key={i} d={`M ${76 + i * 19} ${-35 - i * 14} A ${40 + i * 16} ${40 + i * 16} 0 0 1 ${76 + i * 19} ${35 + i * 14}`}
              fill="none" stroke={ORANGE_E} strokeWidth={6} strokeLinecap="round" opacity={0.85} />
          ))}
        </g>
      </svg>
      <div style={{
        position: "absolute", top: 1210, left: 0, right: 0, textAlign: "center",
        fontFamily: T_FONT, fontSize: 68, color: INK, letterSpacing: 10, whiteSpace: "nowrap",
      }}>喊完就走</div>
      {/* 落款 */}
      <div style={{
        position: "absolute", top: 1352, left: 0, right: 0, textAlign: "center",
        fontFamily: YAHEI, fontSize: 28, color: INK, letterSpacing: 4, opacity: 0.72,
      }}>小秋 · 0 基础也能学会</div>
      {/* 螺旋装订 */}
      <div style={{
        position: "absolute", left: 0, top: 0, bottom: 0, width: 22,
        background: "linear-gradient(90deg, rgba(70,60,45,0.20), rgba(70,60,45,0))",
      }} />
      <svg width={180} height={H} style={{position: "absolute", left: 0, top: 0, overflow: "visible", pointerEvents: "none", zIndex: 30}}>
        {coils}
      </svg>
    </AbsoluteFill>
  );
};
