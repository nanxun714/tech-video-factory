// 《复制的东西去哪了？》v4 定稿（58.4s，云健+15%）
// 2026-09-18 按反馈改版：开头换问题钩子；Ctrl+C/剪切/重启三处重复解释各砍一遍；
// 删「粘贴的那一刻」「下期见」两场；口诀卡收尾。
// 2026-09-19 v3 配音改回云健；v4 结尾两改：①剪掉静置死段 ②按用户要求补 CTA 句
// 「下一期想看什么？点赞评论加关注，在评论区告诉我」+三徽章画面（s11 追加录制，前10句未动）
// 白板手绘风（与《代码怎么跑》CodeRunExplainer 同款视觉基因：纯白底+墨线+荧光黄+Pop+draw-on箭头）
// 配音素材 public/audio/ctrlc-tts-v3/
import {Audio} from "@remotion/media";
import {
  AbsoluteFill, interpolate, Sequence, spring, staticFile, useCurrentFrame, useVideoConfig,
} from "remotion";

const INK = "#262626";
const GREEN = "#dff0dc";
const GREEN_D = "#3e8e52";
const BLUE = "#dbeafe";
const BLUE_D = "#2f6bd8";
const RED = "#fde3e3";
const RED_D = "#d64545";
const YELLOW = "#ffe066";
const YELLOW_D = "#e6b800";
const BOARD = "#2f4f43";
const PAPER = "#ffffff";

const TITLE_FONT = "幼圆, YouYuan, 'Microsoft YaHei', sans-serif";
const HAND_FONT = "楷体, KaiTi, 'Microsoft YaHei', serif";
const MONO = "'Consolas','Courier New',monospace";

export const ctrlcDurationInFrames = 1715; // 语音实际结束帧1708(s11含edge-tts尾部0.79s静音垫,勿用mp3时长)+0.2s呼吸
const MOTTO_START = 1394; // 口诀卡起点（品牌角标隐藏基准）
const CTA_START = 1573; // CTA卡起点（品牌角标回归）

// ---- 配音窗口（ctrlc-tts-v3/timeline.json，云健+15%，MP3实测）----
const voiceLines = [
  {index: 1, audio: "s01.mp3", start: 0, end: 162},
  {index: 2, audio: "s02.mp3", start: 168, end: 257},
  {index: 3, audio: "s03.mp3", start: 263, end: 430},
  {index: 4, audio: "s04.mp3", start: 436, end: 552},
  {index: 5, audio: "s05.mp3", start: 558, end: 705},
  {index: 6, audio: "s06.mp3", start: 710, end: 894},
  {index: 7, audio: "s07.mp3", start: 900, end: 1080},
  {index: 8, audio: "s08.mp3", start: 1085, end: 1211},
  {index: 9, audio: "s09.mp3", start: 1217, end: 1392},
  {index: 10, audio: "s10.mp3", start: 1397, end: 1571},
  {index: 11, audio: "s11.mp3", start: 1576, end: 1733},
];

// ---- 逐字字幕（gen_subs.py 生成；口诀页大字接管防同帧重复，故第10句不出底部字幕）----
type Sub = {s: number; e: number; t: string};
const subs: Sub[] = [
  {s: 0, e: 52, t: "复制的东西去哪了"},
  {s: 52, e: 104, t: "按下Ctrl+C"},
  {s: 104, e: 165, t: "它真的被复制走了吗"},
  {s: 168, e: 184, t: "其实"},
  {s: 184, e: 260, t: "原文件根本没被拿走"},
  {s: 263, e: 309, t: "按下Ctrl+C"},
  {s: 309, e: 367, t: "系统会把内容复制一份"},
  {s: 367, e: 433, t: "放进一个叫剪贴板的地方"},
  {s: 436, e: 500, t: "你可以把剪贴板理解成"},
  {s: 500, e: 555, t: "内存里的一块黑板"},
  {s: 558, e: 605, t: "粘贴Ctrl+V"},
  {s: 605, e: 658, t: "就是把黑板上的内容"},
  {s: 658, e: 707, t: "再抄到你要的位置"},
  {s: 710, e: 763, t: "那Ctrl+X呢"},
  {s: 763, e: 829, t: "它也会把内容放进黑板"},
  {s: 829, e: 897, t: "但原来的内容会被移走"},
  {s: 900, e: 975, t: "不过黑板通常只有一块"},
  {s: 975, e: 1027, t: "你复制新的内容"},
  {s: 1027, e: 1082, t: "旧的就被覆盖了"},
  {s: 1085, e: 1145, t: "那为什么电脑一重启"},
  {s: 1145, e: 1211, t: "剪贴板里的东西也没了"},
  {s: 1217, e: 1269, t: "因为剪贴板的数据"},
  {s: 1269, e: 1314, t: "主要存在内存里"},
  {s: 1314, e: 1353, t: "而内存断电后"},
  {s: 1353, e: 1394, t: "内容就会消失"},
  {s: 1576, e: 1628, t: "下一期想看什么"},
  {s: 1628, e: 1680, t: "点赞评论加关注"},
  {s: 1680, e: 1733, t: "在评论区告诉我"},
];

// ---------- sketch primitives（与 CodeRunExplainer 同款）----------

const wob = (i: number, amp = 2.4) => Math.sin(i * 5.7 + 1.3) * amp;

const sketchRectPath = (x: number, y: number, w: number, h: number, seed = 0) => {
  const p = (a: number, b: number) => `${a + wob(a + b + seed)} ${b + wob(b - a + seed + 3)}`;
  return (
    `M ${p(x + w * 0.1, y)} Q ${x + w * 0.5} ${y + wob(seed + 1)} ${p(x + w * 0.95, y + 1)} ` +
    `Q ${x + w} ${y + h * 0.5} ${p(x + w - 1, y + h * 0.92)} ` +
    `Q ${x + w * 0.5} ${y + h} ${p(x + w * 0.08, y + h - 1)} ` +
    `Q ${x} ${y + h * 0.5} ${p(x + 1, y + h * 0.08)} Z`
  );
};

const SketchBox: React.FC<{
  x: number; y: number; w: number; h: number; fill?: string; stroke?: string; sw?: number; seed?: number;
}> = ({x, y, w, h, fill = "none", stroke = INK, sw = 4, seed = 0}) => (
  <svg width={w + 40} height={h + 40} style={{position: "absolute", left: x - 20, top: y - 20, overflow: "visible"}}>
    <path d={sketchRectPath(20, 20, w, h, seed)} fill={fill} stroke={stroke} strokeWidth={sw} strokeLinecap="round" />
  </svg>
);

const Marker: React.FC<{x: number; y: number; w: number; h: number; color?: string; r?: number}> = ({
  x, y, w, h, color = YELLOW, r = -1,
}) => (
  <div style={{
    position: "absolute", left: x, top: y, width: w, height: h,
    backgroundColor: color, opacity: 0.9, borderRadius: h / 2.6, transform: `rotate(${r}deg)`,
  }} />
);

const SketchArrow: React.FC<{
  x: number; y: number; len: number; color?: string; delay?: number; bend?: number; rot?: number; sw?: number; flipX?: boolean;
}> = ({x, y, len, color = INK, delay = 0, bend = 0, rot = 0, sw = 6, flipX = false}) => {
  const frame = useCurrentFrame();
  const prog = interpolate(frame, [delay, delay + 18], [0, 1], {extrapolateLeft: "clamp", extrapolateRight: "clamp"});
  const draw = len * prog;
  return (
    <svg width={len + 60} height={120} style={{
      position: "absolute", left: x, top: y, overflow: "visible",
      transform: `rotate(${rot}deg) ${flipX ? "scaleX(-1)" : ""}`, transformOrigin: "center",
    }}>
      <path d={`M 4 60 Q ${len * 0.5} ${60 + bend} ${draw} ${60 + bend * 0.4}`} stroke={color} strokeWidth={sw} strokeLinecap="round" fill="none" />
      {prog > 0.92 ? (
        <path d={`M ${len - 26} ${44 + bend * 0.4} L ${len + 2} ${60 + bend * 0.4} L ${len - 26} ${76 + bend * 0.4}`}
          stroke={color} strokeWidth={sw} fill="none" strokeLinecap="round" strokeLinejoin="round" />
      ) : null}
    </svg>
  );
};

const Pop: React.FC<{delay?: number; children: React.ReactNode; style?: React.CSSProperties}> = ({
  delay = 0, children, style,
}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const s = spring({frame: frame - delay, fps, config: {damping: 13, stiffness: 150}});
  return (
    <div style={{
      opacity: interpolate(s, [0, 1], [0, 1]),
      transform: `scale(${interpolate(s, [0, 1], [0.86, 1])}) rotate(${(1 - s) * -2}deg)`,
      ...style,
    }}>
      {children}
    </div>
  );
};

const SceneTitle: React.FC<{text: string; sub?: string}> = ({text, sub}) => {
  const w = text.length * 122 + 60;
  return (
    <div style={{position: "absolute", top: 42, left: 0, right: 0, textAlign: "center"}}>
      <div style={{position: "relative", display: "inline-block"}}>
        <Marker x={-16} y={26} w={w} h={74} color={YELLOW} r={-0.6} />
        <div style={{position: "relative", fontSize: 84, fontWeight: 900, color: INK,
          fontFamily: "'Microsoft YaHei', sans-serif", letterSpacing: 6, lineHeight: 1.15}}>
          {text}
        </div>
      </div>
      {sub ? <div style={{fontSize: 30, color: "#666", fontFamily: HAND_FONT, marginTop: 2, letterSpacing: 4}}>{sub}</div> : null}
    </div>
  );
};

const Label: React.FC<{x: number; y: number; size?: number; color?: string; children: React.ReactNode; bold?: boolean}> = ({
  x, y, size = 34, color = INK, children, bold = true,
}) => (
  <div style={{
    position: "absolute", left: x, top: y, fontSize: size, fontFamily: HAND_FONT,
    color, fontWeight: bold ? 700 : 400, whiteSpace: "nowrap", textAlign: "center", lineHeight: 1.3,
  }}>
    {children}
  </div>
);

const Subtitle: React.FC = () => {
  const frame = useCurrentFrame();
  const cur = subs.find((s) => frame >= s.s && frame < s.e);
  if (!cur) return null;
  const local = frame - cur.s;
  const sp = spring({frame: local, fps: 30, config: {damping: 16, stiffness: 200}});
  return (
    <div style={{position: "absolute", bottom: 46, left: 0, right: 0, display: "flex", justifyContent: "center", pointerEvents: "none"}}>
      <div style={{
        fontSize: 48, fontWeight: 700, color: "#262626",
        fontFamily: "Microsoft YaHei, sans-serif", letterSpacing: 3,
        transform: `translateY(${(1 - sp) * 8}px)`,
        opacity: interpolate(sp, [0, 1], [0.3, 1]),
      }}>
        {cur.t}
      </div>
    </div>
  );
};

const Brand: React.FC = () => (
  <div style={{
    position: "absolute", top: 36, right: 44, fontSize: 30, fontWeight: 900,
    fontFamily: HAND_FONT, color: INK, border: `3px solid ${INK}`, borderRadius: 10,
    padding: "4px 16px", background: "#fff",
  }}>
    全栈小秋
  </div>
);

// ---------- hand-drawn icons ----------

// 文档（带折角的纸）
const Doc: React.FC<{x: number; y: number; s?: number; fill?: string; text?: string; ghost?: boolean}> = ({
  x, y, s = 1, fill = "#fff", text = "文件.txt", ghost = false,
}) => (
  <svg width={280 * s} height={330 * s} viewBox="0 0 280 330" style={{position: "absolute", left: x, top: y, opacity: ghost ? 0.45 : 1}}>
    <path d={sketchRectPath(20, 16, 230, 292, 3)} fill={fill} stroke={INK} strokeWidth={5} strokeLinecap="round"
      strokeDasharray={ghost ? "14 10" : undefined} />
    <path d="M 190 18 L 248 78 L 190 78 Z" fill="#fff" stroke={INK} strokeWidth={5} strokeLinejoin="round" strokeDasharray={ghost ? "12 9" : undefined} />
    {[0, 1, 2, 3].map((i) => (
      <line key={i} x1={52} y1={130 + i * 44} x2={214 - (i % 2) * 40} y2={130 + i * 44}
        stroke={INK} strokeWidth={4} strokeLinecap="round" opacity={0.55} strokeDasharray={ghost ? "10 8" : undefined} />
    ))}
    <text x={52} y={96} fontSize={26} fontFamily={HAND_FONT} fill={INK}>{text}</text>
  </svg>
);

// 键帽
const KeyCap: React.FC<{x: number; y: number; s?: number; k1?: string; k2?: string; fill?: string; seed?: number}> = ({
  x, y, s = 1, k1 = "Ctrl", k2 = "+C", fill = YELLOW, seed = 8,
}) => (
  <svg width={460 * s} height={170 * s} viewBox="0 0 460 170" style={{position: "absolute", left: x, top: y}}>
    <path d={sketchRectPath(16, 22, 210, 118, seed)} fill={fill} stroke={INK} strokeWidth={6} />
    <text x={121} y={102} fontSize={54} fontWeight={900} fontFamily={MONO} fill={INK} textAnchor="middle">{k1}</text>
    <text x={252} y={104} fontSize={52} fontWeight={900} fontFamily={MONO} fill={INK}>+</text>
    <path d={sketchRectPath(286, 22, 150, 118, seed + 5)} fill="#fff" stroke={INK} strokeWidth={6} />
    <text x={361} y={102} fontSize={54} fontWeight={900} fontFamily={MONO} fill={INK} textAnchor="middle">{k2.replace("+", "")}</text>
  </svg>
);

// 黑板（剪贴板化身）
const Blackboard: React.FC<{x: number; y: number; s?: number; w?: number; h?: number; chalk?: string; seed?: number}> = ({
  x, y, s = 1, w = 560, h = 360, chalk = "剪贴板", seed = 21,
}) => (
  <svg width={(w + 60) * s} height={(h + 110) * s} viewBox={`0 0 ${w + 60} ${h + 110}`}
    style={{position: "absolute", left: x, top: y, overflow: "visible"}}>
    <path d={sketchRectPath(18, 18, w + 24, h + 24, seed)} fill="#8a5a33" stroke={INK} strokeWidth={6} strokeLinecap="round" />
    <path d={sketchRectPath(38, 38, w - 16, h - 16, seed + 3)} fill={BOARD} stroke={INK} strokeWidth={5} strokeLinecap="round" />
    <text x={w / 2 + 6} y={h / 2 + 40} fontSize={72} fontWeight={900} fontFamily={HAND_FONT} fill="#f5f2e8" textAnchor="middle">{chalk}</text>
    <rect x={60} y={h + 46} width={w - 60} height={16} rx={8} fill="#c9a06a" stroke={INK} strokeWidth={4} />
    <rect x={w * 0.62} y={h + 34} width={72} height={16} rx={6} fill="#fff" stroke={INK} strokeWidth={3} transform={`rotate(-4 ${w * 0.62 + 36} ${h + 42})`} />
  </svg>
);

// 板擦
const Eraser: React.FC<{x: number; y: number; s?: number; r?: number}> = ({x, y, s = 1, r = -10}) => (
  <svg width={150 * s} height={100 * s} viewBox="0 0 150 100" style={{position: "absolute", left: x, top: y, transform: `rotate(${r}deg)`}}>
    <path d={sketchRectPath(12, 16, 126, 66, 55)} fill={BLUE} stroke={INK} strokeWidth={5} strokeLinecap="round" />
    <path d={sketchRectPath(12, 58, 126, 26, 58)} fill="#fff" stroke={INK} strokeWidth={4} strokeLinecap="round" />
  </svg>
);

const BigX: React.FC<{x: number; y: number; s?: number; color?: string; sw?: number}> = ({
  x, y, s = 1, color = RED_D, sw = 16,
}) => (
  <svg width={200 * s} height={200 * s} viewBox="0 0 200 200" style={{position: "absolute", left: x, top: y}}>
    <path d="M 30 30 Q 100 96 172 168" stroke={color} strokeWidth={sw} strokeLinecap="round" fill="none" />
    <path d="M 172 30 Q 104 100 30 170" stroke={color} strokeWidth={sw} strokeLinecap="round" fill="none" />
  </svg>
);

const Bulb: React.FC<{x: number; y: number; s?: number}> = ({x, y, s = 1}) => (
  <svg width={70 * s} height={90 * s} viewBox="0 0 70 90" style={{position: "absolute", left: x, top: y}}>
    <circle cx={35} cy={34} r={26} fill={YELLOW} stroke={INK} strokeWidth={5} />
    <rect x={24} y={58} width={22} height={16} rx={5} fill="#cfcfcf" stroke={INK} strokeWidth={4} />
    <path d="M 35 8 L 35 -2 M 12 16 L 4 8 M 58 16 L 66 8" stroke={YELLOW_D} strokeWidth={5} strokeLinecap="round" />
  </svg>
);

// ---------- scenes ----------

// S1 封面钩子 0-165：第0帧完整（主元素不 Pop，箭头可后续描画）
const SceneHook: React.FC = () => {
  const frame = useCurrentFrame();
  const pulse = 1 + Math.sin(frame / 9) * 0.03;
  return (
    <AbsoluteFill>
      <SceneTitle text="复制的东西去哪了？" />
      <div style={{position: "absolute", top: 260, left: 200}}>
        <Doc x={0} y={0} fill={BLUE} />
        <Label x={36} y={360} size={38}>你选中的内容</Label>
      </div>
      <div style={{position: "absolute", top: 290, left: 830}}>
        <div style={{position: "relative", transform: `scale(${pulse})`, transformOrigin: "center"}}>
          <div style={{
            width: 250, height: 250, borderRadius: 999, backgroundColor: YELLOW,
            border: `6px solid ${INK}`, display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 150, fontWeight: 900, fontFamily: TITLE_FONT, color: INK,
          }}>
            ?
          </div>
        </div>
        <Label x={-30} y={286} size={38}>真的被复制走了吗</Label>
      </div>
      <div style={{position: "absolute", top: 260, left: 1360}}>
        <Doc x={0} y={0} fill={GREEN} ghost />
        <Label x={30} y={360} size={38} color="#8a8a8a" bold={false}>空空如也？</Label>
      </div>
      <SketchArrow x={500} y={400} len={280} color={YELLOW_D} delay={60} bend={-40} sw={8} />
      <SketchArrow x={1140} y={400} len={240} color={RED_D} delay={85} bend={-40} sw={8} />
      <Bulb x={580} y={290} s={0.9} />
      <div style={{position: "absolute", bottom: 130, left: 0, right: 0, textAlign: "center"}}>
        <div style={{position: "relative", display: "inline-block"}}>
          <Marker x={-20} y={10} w={620} h={64} color={YELLOW} r={-0.8} />
          <div style={{position: "relative", fontSize: 52, fontWeight: 800, fontFamily: HAND_FONT, color: INK}}>
            按下 Ctrl+C 的那一瞬间
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

// S2 并没有拿走 165-260
const SceneNotTaken: React.FC = () => (
  <AbsoluteFill>
    <SceneTitle text="其实没拿走" />
    <div style={{position: "absolute", top: 300, left: 380}}>
      <Pop delay={4}>
        <Doc x={0} y={0} fill={GREEN} text="文件.txt" />
        <Label x={30} y={368} size={42}>原件好好躺在原地</Label>
      </Pop>
    </div>
    <div style={{position: "absolute", top: 330, left: 1180}}>
      <Pop delay={26}>
        <div style={{position: "relative", width: 340, height: 160}}>
          <Marker x={-10} y={10} w={350} h={130} color={RED} r={-1} />
          <div style={{position: "absolute", left: 0, top: 30, width: 330, textAlign: "center",
            fontSize: 58, fontWeight: 900, fontFamily: HAND_FONT, color: INK, whiteSpace: "nowrap"}}>被“拿走”</div>
        </div>
        <div style={{position: "relative", width: 340}}>
          <BigX x={70} y={-52} s={0.95} />
        </div>
        <Label x={36} y={196} size={34} color="#8a8a8a" bold={false}>这个想法是错的</Label>
      </Pop>
    </div>
    <SketchArrow x={760} y={430} len={260} color={INK} delay={45} bend={-24} sw={7} />
    <Label x={700} y={300} size={38} color={GREEN_D}>复制的真相 ↓</Label>
  </AbsoluteFill>
);

// S3 Ctrl+C 的瞬间 260-433
const SceneCopyMoment: React.FC = () => {
  const copyAt = 309 - 263; // “系统会把内容复制一份”句位
  const reveal = 367 - 263; // “放进一个叫剪贴板的地方”句位
  return (
    <AbsoluteFill>
      <SceneTitle text="Ctrl+C 做了什么" />
      <div style={{position: "absolute", top: 330, left: 150}}>
        <Pop delay={8}>
          <KeyCap x={0} y={60} k1="Ctrl" k2="+C" fill={YELLOW} />
          <Label x={80} y={230} size={36}>你按下的瞬间</Label>
        </Pop>
      </div>
      <SketchArrow x={640} y={400} len={200} color={INK} delay={28} bend={-20} sw={7} />
      <div style={{position: "absolute", top: 320, left: 880}}>
        <Pop delay={copyAt - 8}>
          <Doc x={0} y={-10} s={0.72} fill={BLUE} text="抄一份" />
          <Label x={-30} y={296} size={36}>系统抄了一份副本</Label>
        </Pop>
      </div>
      <SketchArrow x={1170} y={400} len={170} color={GREEN_D} delay={reveal - 45} bend={-20} sw={7} />
      <div style={{position: "absolute", top: 330, left: 1390}}>
        <Pop delay={reveal - 40}>
          <div style={{position: "relative", width: 370, height: 262}}>
            <SketchBox x={0} y={0} w={330} h={220} fill={GREEN} sw={6} seed={33} />
            <div style={{position: "absolute", left: 20, top: 64, width: 330, textAlign: "center",
              fontSize: 52, fontWeight: 900, fontFamily: HAND_FONT, color: INK, whiteSpace: "nowrap"}}>公共地盘</div>
          </div>
        </Pop>
        <Pop delay={reveal}>
          <div style={{marginTop: 44, width: 370, textAlign: "center",
            fontSize: 46, fontWeight: 900, fontFamily: TITLE_FONT, color: GREEN_D, whiteSpace: "nowrap"}}>它叫剪贴板！</div>
        </Pop>
      </div>
    </AbsoluteFill>
  );
};

// S4 剪贴板=内存黑板 433-555
const SceneBlackboard: React.FC = () => {
  const memAt = 500 - 436; // “内存里的一块黑板”句位
  return (
    <AbsoluteFill>
      <SceneTitle text="剪贴板 = 一块黑板" />
      <div style={{position: "absolute", top: 260, left: 560}}>
        <Pop delay={10}>
          <Blackboard x={0} y={0} w={640} h={400} chalk="剪贴板" />
        </Pop>
      </div>
      <div style={{position: "absolute", top: 330, left: 220}}>
        <Pop delay={memAt}>
          <div style={{position: "relative", width: 300, height: 130}}>
            <Marker x={-10} y={6} w={310} h={110} color={YELLOW} r={-1} />
            <div style={{position: "absolute", left: 0, right: 0, top: 26, textAlign: "center",
              fontSize: 48, fontWeight: 900, fontFamily: HAND_FONT, color: INK}}>内存里</div>
          </div>
          <Label x={22} y={160} size={34} color="#8a8a8a" bold={false}>系统开的公共地盘</Label>
        </Pop>
      </div>
      <SketchArrow x={420} y={420} len={130} color={INK} delay={memAt + 15} bend={-20} sw={7} />
      <SketchArrow x={1360} y={420} len={130} color={INK} delay={memAt + 15} bend={-20} sw={7} flipX />
      <div style={{position: "absolute", top: 330, left: 1460}}>
        <Pop delay={memAt + 25}>
          <div style={{position: "relative", width: 300, height: 130}}>
            <Marker x={-10} y={6} w={310} h={110} color={BLUE} r={1} />
            <div style={{position: "absolute", left: 0, right: 0, top: 26, textAlign: "center",
              fontSize: 48, fontWeight: 900, fontFamily: HAND_FONT, color: INK}}>谁都能用</div>
          </div>
          <Label x={16} y={160} size={34} color="#8a8a8a" bold={false}>所有程序共用的中转站</Label>
        </Pop>
      </div>
    </AbsoluteFill>
  );
};

// S5 粘贴 555-707
const ScenePaste: React.FC = () => {
  const moveTo = 605 - 558; // “就是把黑板上的内容”句位
  const ghosts = 80; // 连续粘贴画面（“再抄到你要的位置”段）
  return (
    <AbsoluteFill>
      <SceneTitle text="Ctrl+V 粘贴" />
      <div style={{position: "absolute", top: 300, left: 170}}>
        <Pop delay={8}>
          <Blackboard x={0} y={0} w={380} h={260} s={0.85} chalk="内容在这" />
          <Label x={60} y={340} size={34} color="#8a8a8a" bold={false}>黑板上的还在</Label>
        </Pop>
      </div>
      <SketchArrow x={620} y={420} len={230} color={GREEN_D} delay={25} bend={-24} sw={8} />
      <div style={{position: "absolute", top: 300, left: 920}}>
        <Pop delay={moveTo}>
          <Doc x={0} y={0} s={0.85} fill={GREEN} text="新位置" />
          <Label x={20} y={320} size={36}>抄到新位置</Label>
        </Pop>
      </div>
      <div style={{position: "absolute", top: 640, left: 920}}>
        {[0, 1, 2].map((i) => (
          <Pop key={i} delay={ghosts + i * 12}>
            <div style={{position: "absolute", left: i * 180, top: 80 + i * 12}}>
              <Doc x={0} y={0} s={0.5} fill="#fff" text="" ghost={i === 0} />
            </div>
          </Pop>
        ))}
        <Pop delay={ghosts + 48}>
          <div style={{position: "absolute", left: 600, top: 10, fontSize: 66, fontWeight: 900,
            fontFamily: TITLE_FONT, color: BLUE_D}}>×10</div>
        </Pop>
        <Pop delay={ghosts + 20}>
          <Label x={140} y={285} size={38} color={BLUE_D}>黑板上还有，所以能一直贴</Label>
        </Pop>
      </div>
    </AbsoluteFill>
  );
};

// S6 剪切 707-897（合并原「粘贴的那一刻」：原位置❌ → 黑板 → 新位置）
const SceneCut: React.FC = () => {
  const boardAt = 763 - 710; // “它也会把内容放进黑板”句位
  const moveAt = 829 - 710; // “但原来的内容会被移走”句位
  return (
    <AbsoluteFill>
      <SceneTitle text="Ctrl+X 剪切" />
      <div style={{position: "absolute", top: 290, left: 170}}>
        <Pop delay={6}>
          <Doc x={0} y={0} fill={BLUE} text="文件.txt" />
          <Label x={40} y={362} size={36}>原位置</Label>
        </Pop>
      </div>
      <div style={{position: "absolute", top: 330, left: 620}}>
        <Pop delay={8}>
          <KeyCap x={0} y={60} k1="Ctrl" k2="+X" fill={RED} seed={12} />
          <Label x={96} y={230} size={36}>也会放进黑板</Label>
        </Pop>
      </div>
      <SketchArrow x={1090} y={420} len={140} color={GREEN_D} delay={boardAt - 12} bend={-16} sw={7} />
      <div style={{position: "absolute", top: 260, left: 1240}}>
        <Pop delay={boardAt}>
          <Blackboard x={0} y={0} w={340} h={230} s={0.85} chalk="已记录" />
        </Pop>
      </div>
      <div style={{position: "absolute", top: 310, left: 1530}}>
        <Pop delay={moveAt}>
          <Doc x={0} y={0} s={0.78} fill={GREEN} text="新位置" />
        </Pop>
      </div>
      <Pop delay={moveAt}>
        <div style={{position: "absolute", left: 180, top: 265}}>
          <BigX x={0} y={0} s={0.9} />
        </div>
      </Pop>
      <div style={{position: "absolute", bottom: 150, left: 0, right: 0, textAlign: "center"}}>
        <Pop delay={moveAt + 25}>
          <div style={{position: "relative", display: "inline-block"}}>
            <Marker x={-20} y={8} w={760} h={62} color={YELLOW} r={-0.8} />
            <div style={{position: "relative", fontSize: 46, fontWeight: 800, fontFamily: HAND_FONT, color: INK, whiteSpace: "nowrap"}}>
              复制：原件还在 · 剪切：原件消失
            </div>
          </div>
        </Pop>
      </div>
    </AbsoluteFill>
  );
};

// S7 黑板只有一块 897-1082
const SceneOverwrite: React.FC = () => {
  const coverAt = 1027 - 900; // “旧的就被覆盖了”句位
  return (
    <AbsoluteFill>
      <SceneTitle text="黑板只有一块" />
      <div style={{position: "absolute", top: 280, left: 520}}>
        <Pop delay={8}>
          <Blackboard x={0} y={0} w={640} h={400} chalk="旧内容" />
        </Pop>
      </div>
      <Pop delay={coverAt}>
        <div style={{position: "absolute", left: 760, top: 330}}>
          <div style={{position: "relative", width: 400, height: 275}}>
            <SketchBox x={0} y={0} w={360} h={230} fill={YELLOW} sw={6} seed={77} />
            <div style={{position: "absolute", left: 20, top: 78, width: 360, textAlign: "center",
              fontSize: 56, fontWeight: 900, fontFamily: HAND_FONT, color: INK, whiteSpace: "nowrap"}}>新内容</div>
          </div>
        </div>
      </Pop>
      <Label x={470} y={730} size={42} color={RED_D}>新的直接盖掉旧的，旧的找不回来了</Label>
      <Bulb x={430} y={240} s={1} />
    </AbsoluteFill>
  );
};

// S8 重启就擦干净 1082-1394（问句起手，答句擦黑板，只讲一遍）
const SceneReboot: React.FC = () => {
  const iconAt = 1217 - 1085; // 进入答句，重启图标出现
  const wipeAt = 1314 - 1085; // “而内存断电后”句位，板擦启动
  const frame = useCurrentFrame();
  const wipe = interpolate(frame, [wipeAt, wipeAt + 70], [0, 1], {extrapolateLeft: "clamp", extrapolateRight: "clamp"});
  return (
    <AbsoluteFill>
      <SceneTitle text="重启后为什么空了" />
      <div style={{position: "absolute", top: 280, left: 480}}>
        <Pop delay={8}>
          <div style={{position: "relative", width: 680, height: 470}}>
            <Blackboard x={0} y={0} w={640} h={400} chalk={wipe > 0.5 ? "" : "内容…"} />
            {/* 板擦扫过 */}
            <div style={{position: "absolute", left: -30 + wipe * 620, top: 140}}>
              <Eraser x={0} y={0} s={1.1} r={-8} />
            </div>
          </div>
        </Pop>
      </div>
      <div style={{position: "absolute", top: 330, left: 1220}}>
        <Pop delay={iconAt}>
          <svg width={200} height={200} viewBox="0 0 200 200">
            <path d="M 160 60 A 66 66 0 1 0 172 108" fill="none" stroke={BLUE_D} strokeWidth={12} strokeLinecap="round" />
            <path d="M 130 30 L 166 64 L 120 78" fill="none" stroke={BLUE_D} strokeWidth={12} strokeLinecap="round" strokeLinejoin="round" />
            <text x={100} y={122} fontSize={44} fontWeight={900} fontFamily={HAND_FONT} fill={INK} textAnchor="middle">重启</text>
          </svg>
          <Label x={-6} y={210} size={38} color={BLUE_D}>内存断电即清</Label>
        </Pop>
      </div>
    </AbsoluteFill>
  );
};

// S9 口诀 1394-1573（大字接管字幕区；2026-09-19 剪掉无声静置段）
const SceneMotto: React.FC = () => (
  <AbsoluteFill>
    <div style={{position: "absolute", top: 300, left: 0, right: 0, textAlign: "center"}}>
      <div style={{fontSize: 50, fontFamily: HAND_FONT, color: "#777", marginBottom: 36}}>一句口诀，带走它</div>
      {/* 第一行第0帧完整呈现：场景边界帧不得空白（qc_precheck 抓过），且配音起句即念这行 */}
      <div style={{position: "relative", display: "inline-block"}}>
        <Marker x={-40} y={16} w={1240} h={104} color={YELLOW} r={-0.8} />
        <div style={{position: "relative", fontSize: 92, fontWeight: 900, fontFamily: HAND_FONT, color: INK, letterSpacing: 6, whiteSpace: "nowrap"}}>
          复制不是拿走，是抄上黑板
        </div>
      </div>
      <div style={{marginTop: 60}} />
      <Pop delay={83}>
        <div style={{position: "relative", display: "inline-block"}}>
          <Marker x={-40} y={16} w={1330} h={104} color={BLUE} r={0.8} />
          <div style={{position: "relative", fontSize: 92, fontWeight: 900, fontFamily: HAND_FONT, color: INK, letterSpacing: 6, whiteSpace: "nowrap"}}>
            黑板在内存里，重启就擦干净
          </div>
        </div>
      </Pop>
    </div>
  </AbsoluteFill>
);

// S10 CTA 1573-1751（用户 2026-09-19 要求：下一期想看什么+点赞评论关注+评论区留言；三徽章随配音逐个弹出）
const SceneCTA: React.FC = () => {
  const chip1 = 52; // “点赞评论加关注”句位（词级三等分）
  const chip2 = 67;
  const chip3 = 82;
  const askAt = 104; // “在评论区告诉我”句位
  const chip = (t: string, d: number) => (
    <Pop delay={d}>
      <div style={{position: "relative", width: 300, height: 170}}>
        <Marker x={-12} y={18} w={318} h={126} color={YELLOW} r={-1} />
        <SketchBox x={0} y={0} w={290} h={130} fill="#fff" sw={5} seed={t.length * 9} />
        <div style={{position: "absolute", left: 0, top: 30, width: 290, textAlign: "center",
          fontSize: 64, fontWeight: 900, fontFamily: HAND_FONT, color: INK, whiteSpace: "nowrap"}}>{t}</div>
      </div>
    </Pop>
  );
  return (
    <AbsoluteFill>
      <SceneTitle text="下一期想看什么？" />
      <div style={{position: "absolute", top: 400, left: 0, right: 0, display: "flex", justifyContent: "center", gap: 90}}>
        {chip("点赞", chip1)}
        {chip("评论", chip2)}
        {chip("关注", chip3)}
      </div>
      <div style={{position: "absolute", top: 680, left: 0, right: 0, textAlign: "center"}}>
        <Pop delay={askAt}>
          <div style={{position: "relative", display: "inline-block"}}>
            <Marker x={-24} y={8} w={520} h={66} color={BLUE} r={-0.8} />
            <div style={{position: "relative", fontSize: 54, fontWeight: 800, fontFamily: HAND_FONT, color: INK, whiteSpace: "nowrap"}}>
              在评论区告诉我
            </div>
          </div>
        </Pop>
      </div>
    </AbsoluteFill>
  );
};

// ---------- composition ----------

const scenes = [
  {start: 0, end: 165, C: SceneHook},
  {start: 165, end: 260, C: SceneNotTaken},
  {start: 260, end: 433, C: SceneCopyMoment},
  {start: 433, end: 555, C: SceneBlackboard},
  {start: 555, end: 707, C: ScenePaste},
  {start: 707, end: 897, C: SceneCut},
  {start: 897, end: 1082, C: SceneOverwrite},
  {start: 1082, end: 1394, C: SceneReboot},
  {start: 1394, end: CTA_START, C: SceneMotto},
  {start: CTA_START, end: ctrlcDurationInFrames, C: SceneCTA},
];

export const CtrlCopyExplainer: React.FC = () => {
  const frame = useCurrentFrame();
  const bedVolume = interpolate(frame, [0, 20, ctrlcDurationInFrames - 40, ctrlcDurationInFrames - 6],
    [0, 0.09, 0.09, 0], {extrapolateLeft: "clamp", extrapolateRight: "clamp"});
  return (
    <AbsoluteFill style={{backgroundColor: PAPER, fontFamily: TITLE_FONT, overflow: "hidden"}}>
      {scenes.map(({start, end, C}, i) => (
        <Sequence key={i} from={start} durationInFrames={end - start}>
          <C />
        </Sequence>
      ))}
      {(frame < MOTTO_START || frame >= CTA_START) && <Brand />}
      {voiceLines.map((s) => (
        <Sequence key={`vo-${s.index}`} from={s.start} durationInFrames={s.end - s.start + 30}>
          <Audio src={staticFile(`audio/ctrlc-tts-v3/${s.audio}`)} volume={1} />
        </Sequence>
      ))}
      {/* 音效层：开屏切换 / 复制按键 / 剪切按键 / 新内容覆盖 / 口诀收束 */}
      <Sequence from={0} durationInFrames={40}><Audio src={staticFile("audio/sfx/switch.wav")} volume={0.26} /></Sequence>
      <Sequence from={263} durationInFrames={40}><Audio src={staticFile("audio/sfx/click.wav")} volume={0.3} /></Sequence>
      <Sequence from={710} durationInFrames={40}><Audio src={staticFile("audio/sfx/click.wav")} volume={0.3} /></Sequence>
      <Sequence from={1027} durationInFrames={40}><Audio src={staticFile("audio/sfx/pop.wav")} volume={0.32} /></Sequence>
      <Sequence from={1480} durationInFrames={50}><Audio src={staticFile("audio/sfx/success.wav")} volume={0.32} /></Sequence>
      {/* CTA 三徽章 pop（音量保守档） */}
      <Sequence from={1628} durationInFrames={30}><Audio src={staticFile("audio/sfx/pop.wav")} volume={0.26} /></Sequence>
      <Sequence from={1643} durationInFrames={30}><Audio src={staticFile("audio/sfx/pop.wav")} volume={0.26} /></Sequence>
      <Sequence from={1658} durationInFrames={30}><Audio src={staticFile("audio/sfx/pop.wav")} volume={0.26} /></Sequence>
      {/* 结尾收束：bed_outro 压着 CTA 句尾音起播、快速淡出（s11 语音实际止于帧1714，mp3 后 0.6s 是数字静音） */}
      <Sequence from={1708} durationInFrames={43}>
        <Audio src={staticFile("audio/bed_outro.wav")} volume={(f) => interpolate(f, [0, 6, 31, 43], [0, 0.4, 0.4, 0], {extrapolateLeft: "clamp", extrapolateRight: "clamp"})} />
      </Sequence>
      <Audio src={staticFile("audio/bed.wav")} loop volume={() => bedVolume} />
      <Subtitle />
    </AbsoluteFill>
  );
};
