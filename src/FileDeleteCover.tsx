import {AbsoluteFill} from "remotion";

// ================= 删除的文件去哪了 竖版封面（1080x1440 静态，发布专用） =================

const PAPER = "#fdfcf7";
const INK = "#3a3a3a";
const SUBC = "#8a8579";
const RED = "#c94f4f";
const BLUE_F = "rgba(139,178,216,0.34)";
const YEL_F = "rgba(242,202,92,0.45)";

const T_FONT = "'STXingkai','华文行楷','KaiTi','楷体',serif";
const YAHEI = "'Microsoft YaHei',sans-serif";
const B_FONT = "'STKaiti','KaiTi','楷体','Microsoft YaHei',serif";


const sketchRectPath = (x: number, y: number, w: number, h: number, seed = 0) => {
  const wob = (i: number, amp = 2.4) => Math.sin(i * 5.7 + 1.3) * amp;
  const p = (a: number, b: number) => `${a + wob(a + b + seed)} ${b + wob(b - a + seed + 3)}`;
  return (
    `M ${p(x + w * 0.1, y)} Q ${x + w * 0.5} ${y + wob(seed + 1)} ${p(x + w * 0.95, y + 1)} ` +
    `Q ${x + w} ${y + h * 0.5} ${p(x + w - 1, y + h * 0.92)} ` +
    `Q ${x + w * 0.5} ${y + h} ${p(x + w * 0.08, y + h - 1)} ` +
    `Q ${x} ${y + h * 0.5} ${p(x + 1, y + h * 0.08)} Z`
  );
};

export const FileDeleteCover: React.FC = () => {
  const W = 1080;
  const H = 1440;
  return (
    <AbsoluteFill style={{backgroundColor: PAPER, overflow: "hidden"}}>
      {/* 水彩底 */}
      <svg width={W} height={H} style={{position: "absolute", left: 0, top: 0, pointerEvents: "none"}}>
        <path d="M 160 250 Q 540 170 930 260 Q 960 360 900 400 Q 520 460 180 400 Q 130 320 160 250 Z" fill={BLUE_F} />
        <ellipse cx={540} cy={800} rx={380} ry={90} fill={YEL_F} opacity={0.6} />
      </svg>
      {/* 顶部 IP 角标 */}
      <div style={{
        position: "absolute", top: 54, right: 64,
        fontFamily: B_FONT, fontSize: 34, color: INK, letterSpacing: 6, fontWeight: 700,
        transform: "rotate(2deg)", borderBottom: `3px solid ${RED}`,
      }}>全栈小秋</div>
      {/* 主标题（粗雅黑保清晰） */}
      <div style={{
        position: "absolute", top: 190, left: 60, right: 60, textAlign: "center",
        fontFamily: YAHEI, fontWeight: 900, fontSize: 128, color: INK, letterSpacing: 4,
        lineHeight: 1.22, transform: "rotate(-1deg)",
      }}>删掉的文件<br />去哪了？</div>
      {/* 副标题 + 红波浪 */}
      <svg width={W} height={30} style={{position: "absolute", top: 610, left: 0}}>
        <path d="M 260 15 q 35 -14 70 0 q 35 14 70 0 q 35 -14 70 0 q 35 14 70 0 q 35 -14 70 0 q 35 14 70 0 q 35 -14 70 0"
          stroke={RED} strokeWidth={8} fill="none" strokeLinecap="round" opacity={0.85} />
      </svg>
      <div style={{
        position: "absolute", top: 655, left: 0, right: 0, textAlign: "center",
        fontFamily: T_FONT, fontSize: 62, color: INK, letterSpacing: 6,
      }}>其实它还躺在硬盘里</div>
      {/* 垃圾桶 + 探头文件 */}
      <svg width={W} height={H} style={{position: "absolute", left: 0, top: 0, pointerEvents: "none"}}>
        <g transform="translate(330,900)">
          <path d={sketchRectPath(88, -128, 190, 104, 7)} stroke={INK} strokeWidth={5} fill="rgba(255,255,255,0.95)"
            transform="rotate(-7 183 -76)" />
          <text x={120} y={-64} fontFamily={B_FONT} fontSize={26} fontWeight={700} fill={INK}
            transform="rotate(-7 183 -76)">我的文件</text>
          <path d="M -14 0 L 306 0" stroke={INK} strokeWidth={8} strokeLinecap="round" />
          <path d="M 120 -4 Q 146 -40 172 -4" stroke={INK} strokeWidth={6} fill="none" strokeLinecap="round" />
          <path d="M 18 12 L 46 310 L 250 310 L 276 12 Z" stroke={INK} strokeWidth={6} fill="rgba(210,225,238,0.30)" />
          <path d="M 96 58 L 108 268 M 184 58 L 176 268" stroke={INK} strokeWidth={4} opacity={0.5} />
        </g>
        {/* 火柴人 */}
        <g transform="translate(760,1180) scale(1.5)" stroke={INK} strokeWidth={7} fill="none" strokeLinecap="round">
          <circle cx={0} cy={-78} r={26} />
          <path d="M 0 -52 L 0 44 M 0 -26 L 58 -62 M 0 -20 L -36 16 M 0 44 L -30 112 M 0 44 L 30 112" />
          <circle cx={-9} cy={-82} r={3.4} fill={INK} strokeWidth={0} />
          <circle cx={9} cy={-82} r={3.4} fill={INK} strokeWidth={0} />
          <path d="M -11 -70 Q 0 -61 11 -70" strokeWidth={4.5} />
        </g>
      </svg>
      {/* 气泡 */}
      <svg width={W} height={H} style={{position: "absolute", left: 0, top: 0, pointerEvents: "none"}}>
        <ellipse cx={610} cy={1210} rx={225} ry={62} fill="rgba(255,255,255,0.95)" stroke={INK} strokeWidth={5} />
        <path d="M 700 1262 Q 726 1300 752 1312 Q 724 1288 716 1268" fill="rgba(255,255,255,0.95)" stroke={INK} strokeWidth={5} />
      </svg>
      <div style={{
        position: "absolute", left: 400, top: 1178, width: 420, textAlign: "center",
        fontFamily: B_FONT, fontSize: 40, color: INK, fontWeight: 700,
      }}>它还在硬盘里！</div>
      {/* 贴纸 */}
      <div style={{
        position: "absolute", left: 84, top: 830, width: 330, height: 130,
        transform: "rotate(3deg)",
        backgroundColor: "rgba(255,255,255,0.9)", border: `4px dashed ${RED}`, borderRadius: 20,
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
        boxShadow: "0 8px 22px rgba(58,58,58,0.10)",
      }}>
        <div style={{fontFamily: B_FONT, fontWeight: 700, fontSize: 44, color: INK}}>删了 ≠ 没了</div>
        <div style={{fontFamily: B_FONT, fontSize: 30, color: SUBC, marginTop: 4}}>恢复的秘密</div>
      </div>
      {/* 落款 */}
      <div style={{
        position: "absolute", top: 1372, left: 0, right: 0, textAlign: "center",
        fontFamily: B_FONT, fontSize: 30, color: INK, letterSpacing: 4, opacity: 0.72,
      }}>全栈小秋 · 0 基础也能学会</div>
    </AbsoluteFill>
  );
};
