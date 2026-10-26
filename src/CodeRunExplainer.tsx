import {Audio} from "@remotion/media";
import {
  AbsoluteFill,
  interpolate,
  Sequence,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
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
const PAPER = "#ffffff";

const TITLE_FONT = "幼圆, YouYuan, 'Microsoft YaHei', sans-serif";
const HAND_FONT = "楷体, KaiTi, 'Microsoft YaHei', serif";
const MONO = "'Consolas','Courier New',monospace";

const coderunTts = [
  {index: 1, audio: "s01.mp3", start: 0, end: 141},
  {index: 2, audio: "s02.mp3", start: 147, end: 409},
  {index: 3, audio: "s03.mp3", start: 415, end: 603},
  {index: 4, audio: "s04.mp3", start: 609, end: 821},
  {index: 5, audio: "s05.mp3", start: 827, end: 1062},
  {index: 6, audio: "s06.mp3", start: 1068, end: 1397},
  {index: 7, audio: "s07.mp3", start: 1403, end: 1664},
  {index: 8, audio: "s08.mp3", start: 1670, end: 1891},
  {index: 9, audio: "s09.mp3", start: 1891, end: 2016},
];

type Sub = {s: number; e: number; t: string};
const subs: Sub[] = [
  {s: 0, e: 35, t: "你写的代码"},
  {s: 35, e: 141, t: "是怎么变成电脑上跑起来的程序的"},
  {s: 147, e: 250, t: "无论是 Python Java 还是 C++"},
  {s: 250, e: 313, t: "本质上都是一份文本文件"},
  {s: 313, e: 409, t: "但 CPU 只认识 0 和 1 组成的机器语言"},
  {s: 415, e: 446, t: "所以第一步"},
  {s: 446, e: 502, t: "要靠编译器或解释器"},
  {s: 502, e: 602, t: "把代码翻译成 CPU 能懂的机器指令"},
  {s: 609, e: 658, t: "以 C 语言为例"},
  {s: 658, e: 748, t: "从编译到运行 主要分四步"},
  {s: 748, e: 821, t: "预编译 编译 链接 运行"},
  {s: 827, e: 884, t: "预编译先干三件事"},
  {s: 884, e: 927, t: "把头文件展开"},
  {s: 927, e: 984, t: "把宏做纯文本替换"},
  {s: 984, e: 1062, t: "再删掉条件不满足的代码"},
  {s: 1068, e: 1113, t: "然后是语法检查"},
  {s: 1113, e: 1197, t: "少分号 类型不匹配都会被拦下"},
  {s: 1197, e: 1255, t: "通过后生成目标文件"},
  {s: 1255, e: 1352, t: "链接器再把代码和系统库拼接起来"},
  {s: 1352, e: 1397, t: "变成可执行程序"},
  {s: 1403, e: 1437, t: "双击运行时"},
  {s: 1437, e: 1544, t: "操作系统把它加载进内存 分配好资源"},
  {s: 1544, e: 1618, t: "再把 CPU 交给程序入口"},
  {s: 1618, e: 1665, t: "指令一条条执行"},
  {s: 1671, e: 1774, t: "整个流程就像工厂流水线 各司其职"},
  {s: 1774, e: 1822, t: "才能让几行文本"},
  {s: 1822, e: 1891, t: "变成真正跑起来的软件"},
  {s: 1891, e: 1968, t: "本期内容就到这里"},
  {s: 1968, e: 2016, t: "我们下期见"},
];

// ---------- sketch primitives ----------

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
  x: number;
  y: number;
  w: number;
  h: number;
  fill?: string;
  stroke?: string;
  sw?: number;
  seed?: number;
}> = ({x, y, w, h, fill = "none", stroke = INK, sw = 4, seed = 0}) => (
  <svg width={w + 40} height={h + 40} style={{position: "absolute", left: x - 20, top: y - 20, overflow: "visible"}}>
    <path d={sketchRectPath(20, 20, w, h, seed)} fill={fill} stroke={stroke} strokeWidth={sw} strokeLinecap="round" />
  </svg>
);

const Marker: React.FC<{x: number; y: number; w: number; h: number; color?: string; r?: number}> = ({
  x,
  y,
  w,
  h,
  color = YELLOW,
  r = -1,
}) => (
  <div
    style={{
      position: "absolute",
      left: x,
      top: y,
      width: w,
      height: h,
      backgroundColor: color,
      opacity: 0.9,
      borderRadius: h / 2.6,
      transform: `rotate(${r}deg)`,
    }}
  />
);

const SketchArrow: React.FC<{
  x: number;
  y: number;
  len: number;
  color?: string;
  delay?: number;
  bend?: number;
  rot?: number;
  sw?: number;
  flipX?: boolean;
}> = ({x, y, len, color = INK, delay = 0, bend = 0, rot = 0, sw = 6, flipX = false}) => {
  const frame = useCurrentFrame();
  const prog = interpolate(frame, [delay, delay + 18], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const draw = len * prog;
  return (
    <svg
      width={len + 60}
      height={120}
      style={{
        position: "absolute",
        left: x,
        top: y,
        overflow: "visible",
        transform: `rotate(${rot}deg) ${flipX ? "scaleX(-1)" : ""}`,
        transformOrigin: "center",
      }}
    >
      <path
        d={`M 4 60 Q ${len * 0.5} ${60 + bend} ${draw} ${60 + bend * 0.4}`}
        stroke={color}
        strokeWidth={sw}
        strokeLinecap="round"
        fill="none"
      />
      {prog > 0.92 ? (
        <path
          d={`M ${len - 26} ${44 + bend * 0.4} L ${len + 2} ${60 + bend * 0.4} L ${len - 26} ${76 + bend * 0.4}`}
          stroke={color}
          strokeWidth={sw}
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ) : null}
    </svg>
  );
};

const Pop: React.FC<{delay?: number; children: React.ReactNode; style?: React.CSSProperties}> = ({
  delay = 0,
  children,
  style,
}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const s = spring({frame: frame - delay, fps, config: {damping: 13, stiffness: 150}});
  return (
    <div
      style={{
        opacity: interpolate(s, [0, 1], [0, 1]),
        transform: `scale(${interpolate(s, [0, 1], [0.86, 1])}) rotate(${(1 - s) * -2}deg)`,
        ...style,
      }}
    >
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
        <div
          style={{
            position: "relative",
            fontSize: 84,
            fontWeight: 900,
            color: INK,
            fontFamily: "'Microsoft YaHei', sans-serif",
            letterSpacing: 6,
            lineHeight: 1.15,
          }}
        >
          {text}
        </div>
      </div>
      {sub ? (
        <div style={{fontSize: 30, color: "#666", fontFamily: HAND_FONT, marginTop: 2, letterSpacing: 4}}>{sub}</div>
      ) : null}
    </div>
  );
};

const Label: React.FC<{x: number; y: number; size?: number; color?: string; children: React.ReactNode; bold?: boolean}> = ({
  x,
  y,
  size = 34,
  color = INK,
  children,
  bold = true,
}) => (
  <div
    style={{
      position: "absolute",
      left: x,
      top: y,
      fontSize: size,
      fontFamily: HAND_FONT,
      color,
      fontWeight: bold ? 700 : 400,
      whiteSpace: "nowrap",
      textAlign: "center",
      lineHeight: 1.3,
    }}
  >
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
      <div
        style={{
          fontSize: 48,
          fontWeight: 700,
          color: "#262626",
          fontFamily: "Microsoft YaHei, sans-serif",
          letterSpacing: 3,
          transform: `translateY(${(1 - sp) * 8}px)`,
          opacity: interpolate(sp, [0, 1], [0.3, 1]),
        }}
      >
        {cur.t}
      </div>
    </div>
  );
};

// ---------- hand-drawn icons ----------

const CodeFile: React.FC<{x: number; y: number; s?: number; fill?: string; lines?: string[]}> = ({
  x,
  y,
  s = 1,
  fill = GREEN,
  lines = ["function setup() {", "  print('Hello');", "}"],
}) => (
  <svg width={300 * s} height={360 * s} viewBox="0 0 300 360" style={{position: "absolute", left: x, top: y}}>
    <path
      d={sketchRectPath(20, 16, 250, 328, 2)}
      fill={fill}
      stroke={INK}
      strokeWidth={5}
      strokeLinecap="round"
    />
    <path d="M 205 18 L 268 82 L 205 82 Z" fill="#fff" stroke={INK} strokeWidth={5} strokeLinejoin="round" />
    {lines.map((ln, i) => (
      <text key={i} x={44} y={140 + i * 62} fontSize={25} fontFamily={MONO} fill={INK}>
        {ln}
      </text>
    ))}
  </svg>
);

const Laptop: React.FC<{x: number; y: number; s?: number}> = ({x, y, s = 1}) => (
  <svg width={420 * s} height={330 * s} viewBox="0 0 420 330" style={{position: "absolute", left: x, top: y}}>
    <path d={sketchRectPath(60, 20, 300, 210, 5)} fill="#fff" stroke={INK} strokeWidth={6} />
    <rect x={82} y={42} width={256} height={150} rx={10} fill="#e9f6e4" stroke={GREEN_D} strokeWidth={5} />
    <text x={100} y={78} fontSize={22} fontFamily={MONO} fill={INK}>Program Running...</text>
    <circle cx={316} cy={56} r={7} fill={RED_D} />
    <circle cx={292} cy={56} r={7} fill={YELLOW_D} />
    <circle cx={268} cy={56} r={7} fill={GREEN_D} />
    <path d="M 150 120 L 216 154 L 150 188 Z" fill={GREEN_D} opacity={0.85} />
    <text x={100} y={170} fontSize={18} fontFamily={MONO} fill={INK} opacity={0.8}>{">>"} Process complete.</text>
    <path d="M 20 236 L 400 236 L 356 300 L 62 300 Z" fill="#f2f2f0" stroke={INK} strokeWidth={6} strokeLinejoin="round" />
  </svg>
);

const GearIcon: React.FC<{x: number; y: number; s?: number; fill?: string}> = ({x, y, s = 1, fill = "#fff"}) => (
  <svg width={220 * s} height={220 * s} viewBox="0 0 220 220" style={{position: "absolute", left: x, top: y}}>
    <g stroke={INK} strokeWidth={6} fill={fill} strokeLinejoin="round">
      <circle cx={110} cy={110} r={64} />
      {Array.from({length: 8}).map((_, i) => {
        const a = (i * Math.PI) / 4;
        const x1 = 110 + Math.cos(a) * 62;
        const y1 = 110 + Math.sin(a) * 62;
        const x2 = 110 + Math.cos(a) * 92;
        const y2 = 110 + Math.sin(a) * 92;
        const px = Math.cos(a + Math.PI / 2) * 20;
        const py = Math.sin(a + Math.PI / 2) * 20;
        return (
          <polygon
            key={i}
            points={`${x1 + px},${y1 + py} ${x2 + px},${y2 + py} ${x2 - px},${y2 - py} ${x1 - px},${y1 - py}`}
          />
        );
      })}
      <circle cx={110} cy={110} r={26} fill="#fff" />
    </g>
  </svg>
);

const CpuChip: React.FC<{x: number; y: number; s?: number; fill?: string}> = ({x, y, s = 1, fill = "#f6f6f2"}) => (
  <svg width={240 * s} height={240 * s} viewBox="0 0 240 240" style={{position: "absolute", left: x, top: y}}>
    <g stroke={INK} strokeWidth={5} strokeLinecap="round">
      {Array.from({length: 6}).map((_, i) => (
        <g key={i}>
          <line x1={40 + i * 32} y1={14} x2={40 + i * 32} y2={44} />
          <line x1={40 + i * 32} y1={196} x2={40 + i * 32} y2={226} />
          <line x1={14} y1={40 + i * 32} x2={44} y2={40 + i * 32} />
          <line x1={196} y1={40 + i * 32} x2={226} y2={40 + i * 32} />
        </g>
      ))}
    </g>
    <path d={sketchRectPath(44, 44, 152, 152, 9)} fill={fill} stroke={INK} strokeWidth={6} />
    <rect x={86} y={86} width={68} height={68} rx={8} fill="#fff" stroke={INK} strokeWidth={5} />
  </svg>
);

const BigX: React.FC<{x: number; y: number; s?: number; color?: string; sw?: number}> = ({
  x,
  y,
  s = 1,
  color = RED_D,
  sw = 16,
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

const Puzzle: React.FC<{x: number; y: number; s?: number; fill: string; r?: number}> = ({x, y, s = 1, fill, r = 0}) => (
  <svg width={120 * s} height={120 * s} viewBox="0 0 120 120" style={{position: "absolute", left: x, top: y, transform: `rotate(${r}deg)`}}>
    <path
      d={sketchRectPath(14, 14, 92, 92, x + y)}
      fill={fill}
      stroke={INK}
      strokeWidth={5}
    />
    <circle cx={106} cy={60} r={16} fill={fill} stroke={INK} strokeWidth={5} />
  </svg>
);

// ---------- scenes ----------

const SceneHook: React.FC = () => {
  const frame = useCurrentFrame();
  const pulse = 1 + Math.sin(frame / 9) * 0.03;
  return (
    <AbsoluteFill>
      <SceneTitle text="代码如何运行？" />
      <div style={{position: "absolute", top: 220, left: 150}}>
        <div>
          <CodeFile x={0} y={30} />
          <Label x={-10} y={430} size={38}>文本代码文件</Label>
          <Label x={30} y={482} size={28} color="#777" bold={false}>(Code File)</Label>
        </div>
      </div>
      <div style={{position: "absolute", top: 250, left: 820}}>
        <div>
          <div style={{position: "relative", transform: `scale(${pulse})`, transformOrigin: "center"}}>
            <div
              style={{
                width: 250,
                height: 250,
                borderRadius: 999,
                backgroundColor: YELLOW,
                border: `6px solid ${INK}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 150,
                fontWeight: 900,
                fontFamily: TITLE_FONT,
                color: INK,
              }}
            >
              ?
            </div>
          </div>
          <Label x={-16} y={280} size={38}>核心问题？</Label>
        </div>
      </div>
      <div style={{position: "absolute", top: 218, left: 1360}}>
        <div>
          <Laptop x={0} y={0} />
          <Label x={60} y={348} size={38}>正在运行的程序</Label>
          <Label x={130} y={400} size={28} color="#777" bold={false}>(Running Program)</Label>
        </div>
      </div>
      <SketchArrow x={480} y={330} len={300} color={YELLOW_D} delay={60} bend={-40} sw={8} />
      <SketchArrow x={1120} y={330} len={280} color={GREEN_D} delay={80} bend={-40} sw={8} />
      <Bulb x={560} y={240} s={0.9} />
      <Bulb x={1230} y={230} s={0.9} />
      <div style={{position: "absolute", bottom: 120, left: 0, right: 0, textAlign: "center"}}>
        <div style={{position: "relative", display: "inline-block"}}>
          <Marker x={-20} y={10} w={460} h={64} color={YELLOW} r={-0.8} />
          <div style={{position: "relative", fontSize: 52, fontWeight: 800, fontFamily: HAND_FONT, color: INK}}>
            从文本到程序的旅程
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

const SceneVs: React.FC = () => {
  const frame = useCurrentFrame();
  const xShow = frame > 60;
  const bits = ["01010101", "10101010", "00110011", "11001100", "00001111", "00110101"];
  return (
    <AbsoluteFill>
      <SceneTitle text="代码 VS 机器语言" />
      <div style={{position: "absolute", top: 260, left: 220}}>
        <Pop delay={4}>
          <CodeFile x={0} y={0} lines={["", "print('hello')", ""]} />
          <Label x={150} y={-52} size={30} color={GREEN_D} bold={false}>Python/Java/C++</Label>
          <Label x={-10} y={392} size={40}>高级语言</Label>
          <Label x={40} y={448} size={30} color="#777" bold={false}>(给人看的)</Label>
        </Pop>
      </div>
      <div style={{position: "absolute", top: 300, left: 1420}}>
        <Pop delay={40}>
          <svg width={380} height={300} viewBox="0 0 380 300">
            {bits.map((row, i) => (
              <text key={i} x={10} y={44 + i * 48} fontSize={40} fontFamily={MONO} fill={BLUE_D} letterSpacing={4}>
                {row}
              </text>
            ))}
          </svg>
          <Label x={120} y={-52} size={30} color={BLUE_D} bold={false}>0和1的二进制</Label>
          <Label x={80} y={322} size={40}>机器语言</Label>
          <Label x={90} y={378} size={30} color="#777" bold={false}>(CPU 认识的)</Label>
        </Pop>
      </div>
      <div style={{position: "absolute", top: 400, left: 850}}>
        <Pop delay={70}>
          <CpuChip x={0} y={0} fill={RED} />
          {xShow ? <BigX x={20} y={20} s={1} /> : null}
        </Pop>
      </div>
      <Label x={770} y={700} size={40}>CPU 看不懂代码文本</Label>
      <SketchArrow x={560} y={470} len={260} color={INK} delay={100} bend={-18} sw={6} rot={-6} />
      <SketchArrow x={1090} y={470} len={260} color={INK} delay={118} bend={-18} sw={6} rot={6} />
    </AbsoluteFill>
  );
};

const SceneTranslate: React.FC = () => (
  <AbsoluteFill>
    <SceneTitle text="翻译：关键第一步" />
    <div style={{position: "absolute", top: 400, left: 140}}>
      <Pop delay={4}>
        <CodeFile x={0} y={-40} s={0.9} fill="#f4f4f0" lines={["code ...", "code ...", ""]} />
        <Label x={-20} y={300} size={40}>高级语言</Label>
      </Pop>
    </div>
    <div style={{position: "absolute", top: 330, left: 700}}>
      <Pop delay={30}>
        <div style={{position: "relative", width: 360}}>
          <div style={{position: "relative", height: 170, marginBottom: 40}}>
            <Marker x={-14} y={0} w={360} h={150} color={YELLOW} r={-1} />
            <GearIcon x={10} y={-10} s={0.66} />
            <div style={{position: "absolute", left: 140, top: 30, fontSize: 46, fontWeight: 900, fontFamily: HAND_FONT, color: INK}}>
              编译器
            </div>
            <div style={{position: "absolute", left: 140, top: 92, fontSize: 26, fontFamily: MONO, color: "#666"}}>(Compiler)</div>
          </div>
          <div style={{position: "relative", height: 170}}>
            <Marker x={-14} y={0} w={360} h={150} color={YELLOW} r={1} />
            <GearIcon x={10} y={-10} s={0.66} />
            <div style={{position: "absolute", left: 140, top: 30, fontSize: 46, fontWeight: 900, fontFamily: HAND_FONT, color: INK}}>
              解释器
            </div>
            <div style={{position: "absolute", left: 140, top: 92, fontSize: 26, fontFamily: MONO, color: "#666"}}>(Interpreter)</div>
          </div>
        </div>
      </Pop>
      <div style={{position: "absolute", left: 360, top: 60}}>
        <Pop delay={55}>
          <div style={{fontSize: 36, fontFamily: HAND_FONT, color: INK, transform: "rotate(-8deg)", whiteSpace: "nowrap"}}>
            作用：<span style={{fontWeight: 900}}>翻译</span>
          </div>
        </Pop>
        <SketchArrow x={-70} y={110} len={120} color={INK} delay={70} bend={20} sw={5} rot={30} />
      </div>
    </div>
    <div style={{position: "absolute", top: 430, left: 1330}}>
      <Pop delay={60}>
        <CpuChip x={0} y={0} fill={RED} s={0.9} />
        <div style={{position: "absolute", left: 30, top: 62, fontSize: 17, fontFamily: MONO, color: INK, lineHeight: 1.6, whiteSpace: "nowrap"}}>
          MOV EAX,[EBX]
          <br />
          MOV EBX,[EAX]
          <br />
          UMOV HEM
        </div>
        <Label x={-6} y={252} size={36}>汇编语言</Label>
      </Pop>
    </div>
    <div style={{position: "absolute", top: 400, left: 1640}}>
      <Pop delay={85}>
        {["0101010110", "0111011010", "1010010111", "0100100100"].map((row, i) => (
          <div key={i} style={{fontSize: 27, fontFamily: MONO, color: INK, lineHeight: 1.55}}>
            {row}
          </div>
        ))}
        <Label x={-16} y={180} size={38}>
          机器语言<span style={{fontSize: 28}}>（0和1）</span>
        </Label>
      </Pop>
    </div>
    <SketchArrow x={470} y={480} len={190} color={GREEN_D} delay={95} sw={8} />
    <SketchArrow x={1070} y={480} len={200} color={GREEN_D} delay={112} sw={8} />
    <SketchArrow x={1555} y={480} len={60} color={GREEN_D} delay={128} sw={8} />
  </AbsoluteFill>
);

const StepCard: React.FC<{
  x: number;
  y: number;
  n: number;
  color: string;
  fill: string;
  title: string;
  delay: number;
}> = ({x, y, n, color, fill, title, delay}) => (
  <div style={{position: "absolute", left: x, top: y}}>
    <Pop delay={delay}>
      <div style={{position: "relative", width: 360, height: 210}}>
        <SketchBox x={0} y={0} w={360} h={210} fill={fill} sw={5} seed={n * 3} />
        <div
          style={{
            position: "absolute",
            top: -30,
            left: 150,
            width: 60,
            height: 60,
            borderRadius: 999,
            backgroundColor: "#fff",
            border: `5px solid ${color}`,
            color,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 34,
            fontWeight: 900,
            fontFamily: TITLE_FONT,
          }}
        >
          {n}
        </div>
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: 78,
            textAlign: "center",
            fontSize: 38,
            fontWeight: 800,
            fontFamily: HAND_FONT,
            color: INK,
          }}
        >
          {title}
        </div>
      </div>
    </Pop>
  </div>
);

const SceneFourSteps: React.FC = () => {
  const frame = useCurrentFrame();
  const rot = frame * 0.4;
  return (
    <AbsoluteFill>
      <SceneTitle text="编译到运行：4步" sub="C/C++ 语言" />
      <div style={{position: "absolute", top: 420, left: 850}}>
        <div style={{transform: `rotate(${rot}deg)`, width: 220, height: 220, marginLeft: -110, marginTop: -110}}>
          <GearIcon x={0} y={0} s={1} />
        </div>
      </div>
      <StepCard x={160} y={330} n={1} color={RED_D} fill={RED} title="预编译" delay={10} />
      <StepCard x={1400} y={330} n={2} color={YELLOW_D} fill={YELLOW} title="语法检查和编译" delay={30} />
      <StepCard x={1400} y={700} n={3} color={GREEN_D} fill={GREEN} title="链接" delay={50} />
      <StepCard x={160} y={700} n={4} color={BLUE_D} fill={BLUE} title="运行" delay={70} />
      <SketchArrow x={545} y={392} len={185} color={RED_D} delay={90} bend={-16} sw={7} />
      <SketchArrow x={917} y={392} len={380} color={YELLOW_D} delay={105} bend={-16} sw={7} flipX />
      <SketchArrow x={917} y={462} len={380} color={GREEN_D} delay={120} bend={16} sw={7} flipX />
      <SketchArrow x={545} y={452} len={185} color={BLUE_D} delay={135} bend={16} sw={7} />
    </AbsoluteFill>
  );
};

const ScenePrecompile: React.FC = () => {
  return (
    <AbsoluteFill>
      <SceneTitle text="步骤① 预编译" />
      <div style={{position: "absolute", top: 66, right: 120}}>
        <Pop delay={8}>
          <div
            style={{
              border: `4px solid ${INK}`,
              borderRadius: 16,
              padding: "10px 26px",
              fontSize: 30,
              fontFamily: HAND_FONT,
              color: INK,
              backgroundColor: "#fff",
              transform: "rotate(2deg)",
            }}
          >
            纯文本处理阶段
          </div>
        </Pop>
      </div>

      <div style={{position: "absolute", top: 260, left: 200}}>
        <Pop delay={16}>
          <span style={{fontSize: 52, fontFamily: MONO, color: RED_D, fontWeight: 700}}>#include {"<stdio.h>"}</span>
        </Pop>
      </div>
      <SketchArrow x={860} y={262} len={240} color={RED_D} delay={40} sw={8} />
      <div style={{position: "absolute", top: 212, left: 1180}}>
        <Pop delay={55}>
          {[0, 1, 2].map((i) => (
            <div key={i} style={{position: "absolute", left: i * 26, top: i * 10}}>
              <SketchBox x={0} y={0} w={240} h={120} fill="#fff" sw={4} seed={i + 20} />
            </div>
          ))}
          <div style={{position: "absolute", left: 22, top: 38, fontSize: 24, fontFamily: MONO, color: "#666"}}>
            stdio.h content
          </div>
          <Label x={-36} y={150} size={36}>头文件展开</Label>
        </Pop>
      </div>

      <div style={{position: "absolute", top: 520, left: 200}}>
        <Pop delay={70}>
          <span style={{fontSize: 52, fontFamily: MONO, color: YELLOW_D, fontWeight: 700}}>#define MAX 100</span>
        </Pop>
      </div>
      <SketchArrow x={860} y={522} len={240} color={YELLOW_D} delay={95} sw={8} />
      <div style={{position: "absolute", top: 512, left: 1210}}>
        <Pop delay={110}>
          <span style={{fontSize: 52, fontFamily: MONO, color: INK, fontWeight: 700}}>
            MAX <span style={{color: "#999"}}>⟹</span> <span style={{color: RED_D}}>100</span>
          </span>
          <Label x={-20} y={80} size={36}>宏替换</Label>
        </Pop>
      </div>

      <div style={{position: "absolute", top: 780, left: 200}}>
        <Pop delay={130}>
          <span style={{fontSize: 52, fontFamily: MONO, color: GREEN_D, fontWeight: 700, position: "relative"}}>#ifdef</span>
        </Pop>
      </div>
      <div style={{position: "absolute", top: 758, left: 190}}>
        <Pop delay={150}>
          <BigX x={0} y={-30} s={0.75} />
        </Pop>
      </div>
      <SketchArrow x={860} y={782} len={240} color={GREEN_D} delay={165} sw={8} />
      <div style={{position: "absolute", top: 762, left: 1210, width: 460}}>
        <Pop delay={180}>
          <SketchBox x={0} y={-6} w={390} h={96} fill="#fff" sw={4} seed={31} />
          <div style={{position: "absolute", left: 34, top: 18, fontSize: 34, fontFamily: HAND_FONT, color: INK, whiteSpace: "nowrap"}}>
            ？ 代码包含或排除
          </div>
          <Label x={-30} y={116} size={36}>条件编译</Label>
        </Pop>
      </div>
    </AbsoluteFill>
  );
};

const SceneCompile: React.FC = () => (
  <AbsoluteFill>
    <SceneTitle text="步骤② 编译" />
    <div style={{position: "absolute", top: 320, left: 170, width: 380}}>
      <Pop delay={4}>
        <SketchBox x={0} y={0} w={340} h={250} fill="#fff" sw={5} seed={41} />
        <div style={{position: "absolute", left: 34, top: 36, fontSize: 30, fontFamily: MONO, color: INK, lineHeight: 1.75, whiteSpace: "nowrap"}}>
          int main() {"{"}
          <br />
          {"  "}int x = 10 <span style={{color: RED_D, fontWeight: 900}}>✗</span>
          <br />
          {"  "}char y = x <span style={{color: RED_D, fontWeight: 900}}>✗</span>
          <br />
          {"}"}
        </div>
      </Pop>
    </div>
    <SketchArrow x={590} y={410} len={200} color={INK} delay={45} sw={7} />
    <div style={{position: "absolute", top: 350, left: 850}}>
      <Pop delay={70}>
        <div style={{position: "relative", width: 380, height: 180}}>
          <Marker x={-8} y={6} w={396} h={150} color={YELLOW} r={-1} />
          <div style={{position: "absolute", left: 0, top: 52, width: 380, textAlign: "center", fontSize: 40, fontWeight: 900, fontFamily: HAND_FONT, color: INK, whiteSpace: "nowrap"}}>
            语法分析 + 语义分析
          </div>
        </div>
        <Label x={50} y={206} size={32}>检查语法、类型</Label>
      </Pop>
      <Pop delay={150}>
        <div style={{marginTop: 40, fontSize: 36, fontWeight: 800, fontFamily: HAND_FONT, color: RED_D, display: "flex", alignItems: "center", gap: 14}}>
          <span style={{display: "inline-flex", width: 56, height: 56, borderRadius: 999, backgroundColor: RED, border: `5px solid ${RED_D}`, alignItems: "center", justifyContent: "center", fontSize: 30}}>✋</span>
          错误 → 拦截
        </div>
      </Pop>
    </div>
    <div style={{position: "absolute", top: 320, left: 1420, width: 380}}>
      <Pop delay={115}>
        <SketchBox x={0} y={0} w={320} h={190} fill="#fff" sw={5} seed={52} />
        <div style={{position: "absolute", left: 0, right: 0, top: 42, textAlign: "center", fontSize: 38, fontWeight: 900, fontFamily: HAND_FONT, color: INK}}>目标文件</div>
        <svg width={320} height={190} viewBox="0 0 320 190" style={{position: "absolute", left: 0, top: 0, overflow: "visible"}}>
          <path d="M 126 118 L 152 146 L 204 88" stroke={GREEN_D} strokeWidth={12} fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <Label x={34} y={206} size={30} color="#777" bold={false}>可执行代码生成</Label>
      </Pop>
    </div>
    <SketchArrow x={1250} y={390} len={140} color={GREEN_D} delay={145} sw={7} />
  </AbsoluteFill>
);

const SceneLink: React.FC = () => (
  <AbsoluteFill>
    <SceneTitle text="步骤③ 链接" />
    <div style={{position: "absolute", top: 400, left: 220}}>
      <Pop delay={4}>
        <Puzzle x={0} y={0} fill={GREEN} r={-8} />
        <Puzzle x={130} y={30} fill={YELLOW} r={6} />
        <Puzzle x={255} y={-6} fill={BLUE} r={-3} />
        <Label x={110} y={150} size={34}>你的代码 + 系统库 + 第三方库</Label>
      </Pop>
    </div>
    <SketchArrow x={790} y={490} len={230} color={RED_D} delay={60} bend={12} sw={7} />
    <div style={{position: "absolute", top: 370, left: 1150, width: 380}}>
      <Pop delay={110}>
        <SketchBox x={0} y={0} w={380} h={260} fill={GREEN} sw={6} seed={61} />
        <div style={{position: "absolute", left: 0, right: 0, top: 80, textAlign: "center", fontSize: 44, fontWeight: 900, fontFamily: HAND_FONT, color: INK}}>可执行程序</div>
        <div style={{position: "absolute", left: 0, right: 0, top: 152, textAlign: "center", fontSize: 30, fontFamily: MONO, color: "#4a5b45"}}>(ELF / EXE)</div>
        <Label x={104} y={292} size={34}>最终成果</Label>
      </Pop>
    </div>
    <div style={{position: "absolute", top: 700, left: 660}}>
      <Pop delay={150}>
        <div style={{position: "relative", display: "inline-block"}}>
          <Marker x={-18} y={4} w={460} h={56} color={YELLOW} r={-0.8} />
          <div style={{position: "relative", fontSize: 38, fontWeight: 800, fontFamily: HAND_FONT, color: INK, whiteSpace: "nowrap"}}>
            拼接依赖库，不再孤立
          </div>
        </div>
      </Pop>
    </div>
  </AbsoluteFill>
);

const SceneRun: React.FC = () => (
  <AbsoluteFill>
    <SceneTitle text="步骤④ 运行" />
    {/* 1 load */}
    <div style={{position: "absolute", top: 330, left: 140}}>
      <Pop delay={6}>
        <svg width={260} height={200} viewBox="0 0 260 200">
          <path d={sketchRectPath(10, 30, 130, 150, 71)} fill="#fff" stroke={INK} strokeWidth={6} />
          <circle cx={75} cy={105} r={44} fill="#eee" stroke={INK} strokeWidth={5} />
          <circle cx={75} cy={105} r={12} fill={INK} />
          <g transform="rotate(18 170 100)">
            <rect x={130} y={70} width={120} height={54} rx={10} fill={BLUE} stroke={INK} strokeWidth={6} />
            {Array.from({length: 4}).map((_, i) => (
              <rect key={i} x={142 + i * 26} y={80} width={16} height={34} rx={3} fill="#fff" stroke={INK} strokeWidth={3} />
            ))}
          </g>
        </svg>
        <Label x={-10} y={216} size={36}>① 加载到内存</Label>
      </Pop>
    </div>
    <SketchArrow x={400} y={400} len={170} color={INK} delay={30} bend={-30} sw={7} />
    {/* 2 OS */}
    <div style={{position: "absolute", top: 280, left: 700}}>
      <Pop delay={50}>
        <svg width={560} height={340} viewBox="0 0 560 340">
          <ellipse cx={280} cy={190} rx={250} ry={140} fill={YELLOW} opacity={0.55} />
          <ellipse cx={280} cy={190} rx={250} ry={140} fill="none" stroke={INK} strokeWidth={5} />
          <rect x={84} y={58} width={304} height={70} rx={14} fill="#fff" stroke={INK} strokeWidth={6} transform="rotate(-4 236 93)" />
          <text x={129} y={108} fontSize={40} fontWeight={900} fontFamily={HAND_FONT} fill={INK} transform="rotate(-4 236 93)">
            操作系统登场
          </text>
          <rect x={90} y={190} width={150} height={58} rx={12} fill="#fff" stroke={INK} strokeWidth={5} transform="rotate(-6 165 219)" />
          <text x={108} y={230} fontSize={28} fontFamily={MONO} fill={INK} transform="rotate(-6 165 219)">PID: 1234</text>
          <rect x={300} y={196} width={150} height={58} rx={12} fill="#fff" stroke={INK} strokeWidth={5} transform="rotate(5 375 225)" />
          <text x={316} y={236} fontSize={28} fontFamily={HAND_FONT} fill={INK} transform="rotate(5 375 225)">文件句柄</text>
          <text x={190} y={300} fontSize={30} fontFamily={HAND_FONT} fill={INK}>内存空间</text>
        </svg>
        <Label x={170} y={330} size={36}>② 分配资源</Label>
      </Pop>
    </div>
    <SketchArrow x={1270} y={400} len={150} color={INK} delay={90} bend={-30} sw={7} />
    {/* 3 cpu */}
    <div style={{position: "absolute", top: 330, left: 1430}}>
      <Pop delay={110}>
        <CpuChip x={0} y={0} fill={GREEN} s={1.05} />
        <svg width={90} height={90} viewBox="0 0 90 90" style={{position: "absolute", left: 190, top: 70}}>
          <path d="M 18 8 L 52 40 L 30 44 L 40 82 L 8 44 L 32 40 Z" fill={YELLOW_D} stroke={INK} strokeWidth={5} strokeLinejoin="round" />
        </svg>
        <Label x={-14} y={250} size={36}>③ 交给CPU执行</Label>
      </Pop>
    </div>
    <Label x={190} y={870} size={34} color="#777" bold={false}>
      CPU 只能从内存取指令执行，不能直接跑硬盘上的程序
    </Label>
  </AbsoluteFill>
);

const ScenePipeline: React.FC = () => {
  const nodes = [
    {t: "人类写代码", c: BLUE_D, f: BLUE},
    {t: "翻译成机器语言", c: GREEN_D, f: GREEN},
    {t: "操作系统调度", c: YELLOW_D, f: YELLOW},
    {t: "CPU 执行", c: "#e07b39", f: "#fde8d2"},
    {t: "输出结果", c: RED_D, f: RED},
  ];
  return (
    <AbsoluteFill>
      <SceneTitle text="代码运行全流程" />
      <div style={{position: "absolute", top: 330, left: 60, right: 60, display: "flex", justifyContent: "space-between"}}>
        {nodes.map((n, i) => (
          <div key={i} style={{position: "relative", width: 300}}>
            <Pop delay={i * 22}>
              <Label x={0} y={-6} size={34} color={n.c}>{n.t}</Label>
              <SketchBox x={10} y={70} w={250} h={330} fill={n.f} sw={5} seed={i * 11} />
              <div style={{position: "absolute", left: 72, top: 150, fontSize: 110}}>{["🧑‍💻", "⚙️", "🗼", "⚡", "🖥️"][i]}</div>
            </Pop>
            {i < 4 ? (
              <div style={{position: "absolute", left: 268, top: 210}}>
                <SketchArrow x={0} y={0} len={72} color={n.c} delay={110 + i * 16} sw={7} />
              </div>
            ) : null}
          </div>
        ))}
      </div>
      <div style={{position: "absolute", bottom: 150, left: 0, right: 0, textAlign: "center"}}>
        <div style={{position: "relative", display: "inline-block"}}>
          <Marker x={-24} y={6} w={430} h={58} color={YELLOW} r={-0.8} />
          <div style={{position: "relative", fontSize: 46, fontWeight: 800, fontFamily: HAND_FONT, color: INK}}>
            工厂流水线，各司其职
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

const SceneOutro: React.FC = () => (
  <AbsoluteFill>
    <div style={{position: "absolute", top: 300, left: 0, right: 0, textAlign: "center"}}>
      <div style={{position: "relative", display: "inline-block"}}>
        <Marker x={-36} y={40} w={560} h={116} color={YELLOW} r={-1} />
        <div style={{position: "relative", fontSize: 128, fontWeight: 900, fontFamily: TITLE_FONT, color: INK, letterSpacing: 12}}>
          下期见！
        </div>
      </div>
    </div>
    <Pop delay={25}>
      <Label x={430} y={640} size={46}>有疑问？评论区留言</Label>
    </Pop>
    <Pop delay={55}>
      <Label x={1120} y={640} size={46}>想了解的技术？</Label>
    </Pop>
    <div style={{position: "absolute", top: 588, left: 916, fontSize: 96}}>👋</div>
    <Pop delay={80}>
      <Label x={700} y={780} size={34} color="#8a8a8a" bold={false}>计算机网络入门 · 代码是如何运行的</Label>
    </Pop>
  </AbsoluteFill>
);

// ---------- composition ----------

const scenes = [
  {start: 0, end: 147, C: SceneHook},
  {start: 147, end: 415, C: SceneVs},
  {start: 415, end: 609, C: SceneTranslate},
  {start: 609, end: 827, C: SceneFourSteps},
  {start: 827, end: 1068, C: ScenePrecompile},
  {start: 1068, end: 1230, C: SceneCompile},
  {start: 1230, end: 1403, C: SceneLink},
  {start: 1403, end: 1670, C: SceneRun},
  {start: 1670, end: 1891, C: ScenePipeline},
  {start: 1891, end: 2016, C: SceneOutro},
];

export const CodeRunExplainer: React.FC = () => {
  const frame = useCurrentFrame();
  const bedVolume = interpolate(frame, [0, 20, 1976, 2010], [0, 0.09, 0.09, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return (
    <AbsoluteFill style={{backgroundColor: PAPER, fontFamily: TITLE_FONT, overflow: "hidden"}}>
      {scenes.map(({start, end, C}, i) => (
        <Sequence key={i} from={start} durationInFrames={end - start}>
          <C />
        </Sequence>
      ))}
      {coderunTts.map((s) => (
        <Sequence key={`vo-${s.index}`} from={s.start} durationInFrames={s.end - s.start + 30}>
          <Audio src={staticFile(`audio/coderun-tts/${s.audio}`)} volume={1} />
        </Sequence>
      ))}
      <Sequence from={0} durationInFrames={40}>
        <Audio src={staticFile("audio/sfx/switch.wav")} volume={0.26} />
      </Sequence>
      <Sequence from={609} durationInFrames={40}>
        <Audio src={staticFile("audio/sfx/click.wav")} volume={0.3} />
      </Sequence>
      <Sequence from={1403} durationInFrames={40}>
        <Audio src={staticFile("audio/sfx/click.wav")} volume={0.3} />
      </Sequence>
      <Sequence from={1790} durationInFrames={50}>
        <Audio src={staticFile("audio/sfx/success.wav")} volume={0.35} />
      </Sequence>
      <Audio src={staticFile("audio/bed.wav")} loop volume={() => bedVolume} />
      <Subtitle />
    </AbsoluteFill>
  );
};
