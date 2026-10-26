// tech-video-factory 组件骨架
// 复制为 src/<TopicName>.tsx，替换 TODO 部分后到 src/Root.tsx 注册 Composition。
// 音频放到 public/audio/<topic>-tts/（用技能包 scripts/gen_tts.py 生成）。
import {Audio} from "@remotion/media";
import {
  AbsoluteFill, interpolate, Sequence, spring, staticFile, useCurrentFrame, useVideoConfig,
} from "remotion";

const INK = "#262626";
const PAPER = "#ffffff";
const YELLOW = "#ffe066";
const TITLE_FONT = "幼圆, YouYuan, 'Microsoft YaHei', sans-serif";   // 卡片风标题可用
const HAND_FONT = "楷体, KaiTi, 'Microsoft YaHei', serif";           // 手写标注
const MONO = "Consolas, 'Courier New', monospace";

// ---- TODO: 换成 timeline.json 里的实际帧数 ----
export const topicDurationInFrames = 1891;

// ---- TODO: 每句配音的挂载窗口（来自 timeline.json）----
const voiceLines = [
  {index: 1, audio: "s01.mp3", start: 0, end: 141},
  // ...
];

// ---- TODO: 运行技能包 scripts/gen_subs.py 生成后粘贴到这里（逐字、无标点）----
type Sub = {s: number; e: number; t: string};
const subs: Sub[] = [
  // {s: 0, e: 70, t: "你写的代码"},
];

// ---------- 成熟原语 ----------

const Pop: React.FC<{delay?: number; children: React.ReactNode; style?: React.CSSProperties}> = ({
  delay = 0, children, style,
}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const sp = spring({frame: frame - delay, fps, config: {damping: 13, stiffness: 150}});
  return (
    <div style={{
      opacity: interpolate(sp, [0, 1], [0, 1]),
      transform: `scale(${interpolate(sp, [0, 1], [0.86, 1])}) rotate(${(1 - sp) * -2}deg)`,
      ...style,
    }}>
      {children}
    </div>
  );
};

const Marker: React.FC<{x: number; y: number; w: number; h: number; color?: string; r?: number}> = ({
  x, y, w, h, color = YELLOW, r = -1,
}) => (
  <div style={{
    position: "absolute", left: x, top: y, width: w, height: h,
    backgroundColor: color, opacity: 0.9, borderRadius: h / 2.6, transform: `rotate(${r}deg)`,
  }} />
);

const SceneTitle: React.FC<{text: string}> = ({text}) => {
  const w = text.length * 122 + 60; // 荧光笔必须比文字宽
  return (
    <div style={{position: "absolute", top: 42, left: 0, right: 0, textAlign: "center"}}>
      <div style={{position: "relative", display: "inline-block"}}>
        <Marker x={-20} y={26} w={w} h={74} />
        <div style={{position: "relative", fontSize: 84, fontWeight: 900, color: INK,
          fontFamily: "'Microsoft YaHei', sans-serif", letterSpacing: 6, lineHeight: 1.15}}>
          {text}
        </div>
      </div>
    </div>
  );
};

const Label: React.FC<{x: number; y: number; size?: number; color?: string; children: React.ReactNode}> = ({
  x, y, size = 34, color = INK, children,
}) => (
  <div style={{
    position: "absolute", left: x, top: y, fontSize: size, fontFamily: HAND_FONT,
    color, fontWeight: 700, whiteSpace: "nowrap",
  }}>
    {children}
  </div>
);

const Subtitle: React.FC = () => {
  const frame = useCurrentFrame();
  const cur = subs.find((s) => frame >= s.s && frame < s.e);
  if (!cur) return null;
  const sp = spring({frame: frame - cur.s, fps: 30, config: {damping: 16, stiffness: 200}});
  return (
    <div style={{position: "absolute", bottom: 46, left: 0, right: 0, display: "flex", justifyContent: "center", pointerEvents: "none"}}>
      <div style={{
        fontSize: 48, fontWeight: 700, color: "#262626",
        fontFamily: "Microsoft YaHei, sans-serif", letterSpacing: 3,
        transform: `translateY(${(1 - sp) * 8}px)`,
        opacity: interpolate(sp, [0, 1], [0.3, 1]),
        // 注意：不加描边/阴影/底框
      }}>
        {cur.t}
      </div>
    </div>
  );
};

// ---------- TODO: 场景组件（每屏只讲一件事；场景 1 不用 Pop，第 0 帧完整呈现）----------
// const SceneHook: React.FC = () => (<AbsoluteFill>...</AbsoluteFill>);
// ...

// ---------- 组装 ----------
const scenes = [
  // {start: 0, end: 141, C: SceneHook},
];

export const TopicExplainer: React.FC = () => {
  const frame = useCurrentFrame();
  const bedVolume = interpolate(frame, [0, 20, topicDurationInFrames - 40, topicDurationInFrames - 6],
    [0, 0.10, 0.10, 0], {extrapolateLeft: "clamp", extrapolateRight: "clamp"});
  return (
    <AbsoluteFill style={{backgroundColor: PAPER, fontFamily: "Microsoft YaHei, sans-serif", overflow: "hidden"}}>
      {scenes.map(({start, end, C}, i) => (
        <Sequence key={i} from={start} durationInFrames={end - start}>
          <C />
        </Sequence>
      ))}
      {voiceLines.map((s) => (
        <Sequence key={`vo-${s.index}`} from={s.start} durationInFrames={s.end - s.start + 30}>
          <Audio src={staticFile(`audio/<topic>-tts/${s.audio}`)} volume={1} />
        </Sequence>
      ))}
      {/* 音效：<Sequence from={帧}><Audio src={staticFile("audio/sfx/click.wav")} volume={0.3} /></Sequence> */}
      <Audio src={staticFile("audio/bed.wav")} loop volume={() => bedVolume} />
      <Subtitle />
    </AbsoluteFill>
  );
};
