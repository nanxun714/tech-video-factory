// 《内存去哪了？》竖版封面 1080x1440（发布用 Still）
import {AbsoluteFill} from "remotion";

const PAPER = "#F2EFE4";
const CARD = "#FAF7EC";
const INK = "#1F1D1A";
const RED = "#C0392B";
const BLUE = "#A8CDE0";
const TITLE_FONT = "'Microsoft YaHei', sans-serif";
const MONO = "Consolas, 'Courier New', monospace";

export const MemLeakCover: React.FC = () => (
  <AbsoluteFill style={{background: PAPER, fontFamily: TITLE_FONT, overflow: "hidden"}}>
    {/* 顶部 HUD 仪表（风格签名） */}
    <div style={{position: "absolute", top: 110, left: 90, display: "flex", alignItems: "center", gap: 34, whiteSpace: "nowrap"}}>
      <div style={{fontSize: 52, fontWeight: 900, color: INK}}>内存</div>
      <div style={{position: "relative", width: 560, height: 52, border: `5px solid ${INK}`, borderRadius: 26, background: "#fff"}}>
        <div style={{position: "absolute", left: 5, top: 5, bottom: 5, width: 350, background: RED, borderRadius: 20}} />
      </div>
      <div style={{fontSize: 60, fontWeight: 900, fontFamily: MONO, color: RED}}>93%</div>
    </div>

    {/* 服务器机柜线稿 */}
    <div style={{position: "absolute", top: 300, left: 120, width: 400}}>
      <svg width={400} height={512} viewBox="0 0 400 512">
        <rect x={6} y={6} width={388} height={500} rx={18} fill={CARD} stroke={INK} strokeWidth={6} />
        {[0, 1, 2].map((i) => (
          <g key={i}>
            <rect x={34} y={22 + i * 158} width={332} height={128} rx={10} fill="#fff" stroke={INK} strokeWidth={4} />
            <circle cx={70} cy={22 + i * 158 + 64} r={9} fill={i === 0 ? RED : "#b9b3a2"} stroke={INK} strokeWidth={3} />
            <line x1={104} y1={22 + i * 158 + 64} x2={344} y2={22 + i * 158 + 64} stroke={INK} strokeWidth={3} opacity={0.45} />
          </g>
        ))}
        <circle cx={352} cy={44} r={12} fill={RED} />
      </svg>
    </div>

    {/* 内存块泄漏示意 */}
    {[0, 1, 2, 3].map((i) => (
      <div key={i} style={{
        position: "absolute", left: 580 + (i % 2) * 210, top: 340 + Math.floor(i / 2) * 110,
        width: 180, height: 60, border: `4px solid ${INK}`, borderRadius: 10,
        background: BLUE,
      }} />
    ))}
    <div style={{position: "absolute", left: 596, top: 590, fontSize: 40, fontFamily: "KaiTi, 楷体, serif", fontWeight: 700, color: RED}}>
      只进不出，越积越多
    </div>

    {/* 标题区 */}
    <div style={{position: "absolute", left: 0, right: 0, top: 830, textAlign: "center"}}>
      <div style={{fontSize: 150, fontWeight: 900, color: INK, letterSpacing: 10}}>内存去哪了？</div>
      <div style={{marginTop: 40, fontSize: 56, fontWeight: 900, color: INK}}>
        先查<span style={{background: "#F2CFCF", padding: "0 20px", borderRadius: 14}}>进程</span>
        ，再查<span style={{background: "#F2CFCF", padding: "0 20px", borderRadius: 14}}>代码</span>
      </div>
    </div>

    <div style={{position: "absolute", bottom: 100, left: 0, right: 0, textAlign: "center", fontSize: 44, fontFamily: "KaiTi, 楷体, serif", color: "#6f6a5c", letterSpacing: 6}}>
      小秋 · 0 基础也能学会
    </div>
  </AbsoluteFill>
);
