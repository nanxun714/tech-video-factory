import {Audio} from "@remotion/media";
import {
  AbsoluteFill, interpolate, Sequence, spring, staticFile, useCurrentFrame, useVideoConfig,
} from "remotion";

// ---------- palette（深蓝灰 + 橙 + 暗红，四色相封顶 · 居中对称终端风）----------
const BG = "#262c3a";
const INK = "#eef1f6";
const SUB = "#9aa3b5";
const CARD = "#2f3646";
const BORDER = "#3d4658";
const ORANGE = "#fb923c";
const ORANGE_D = "#f97316";
const TINT = "rgba(251,146,60,0.14)";
const RED = "#ef6f6f";
const RED_BG = "rgba(239,111,111,0.16)";

const YAHEI = "Microsoft YaHei, sans-serif";
const MONO = "Consolas, 'Courier New', monospace";

// 8 句配音 start_frame（timeline.json），页边界 = SENT
export const SENT = [0, 216, 418, 630, 863, 1120, 1282, 1441];
export const DUR = 1624; // timeline total 1605 + 100 帧结尾卡静止

const voiceLines = SENT.map((start, i) => ({
  index: i + 1,
  audio: `s0${i + 1}.mp3`,
  start,
  end: i < 7 ? SENT[i + 1] : 1605,
}));

type Sub = {s: number; e: number; t: string};
const subs: Sub[] = [
  {s: 0, e: 51, t: "服务器卡成幻灯片"},
  {s: 51, e: 121, t: "一查CPU飙到100%"},
  {s: 121, e: 153, t: "别急着重启"},
  {s: 153, e: 210, t: "凶手就藏在这四层里"},
  {s: 216, e: 254, t: "第一层 top"},
  {s: 254, e: 292, t: "按CPU排序"},
  {s: 292, e: 381, t: "先锁定最吃CPU的那几个进程"},
  {s: 381, e: 412, t: "别大海捞针"},
  {s: 418, e: 459, t: "第二层 看进程"},
  {s: 459, e: 500, t: "揪出可疑进程"},
  {s: 500, e: 541, t: "是自己在空转"},
  {s: 541, e: 624, t: "还是某个任务在疯狂重复跑"},
  {s: 630, e: 668, t: "第三层 看线程"},
  {s: 668, e: 744, t: "用top -H进入线程视角"},
  {s: 744, e: 795, t: "有些进程整体不高"},
  {s: 795, e: 858, t: "里面某根线程却跑满了"},
  {s: 863, e: 909, t: "第四层 看日志"},
  {s: 909, e: 1016, t: "进程在忙什么 日志里一定有痕迹"},
  {s: 1016, e: 1069, t: "死循环 疯狂重试"},
  {s: 1069, e: 1115, t: "全都会留脚印"},
  {s: 1120, e: 1150, t: "四步下来"},
  {s: 1150, e: 1224, t: "从进程到线程再到日志"},
  {s: 1224, e: 1276, t: "问题基本藏不住"},
  {s: 1282, e: 1324, t: "漏斗口诀记好"},
  {s: 1324, e: 1366, t: "top锁进程"},
  {s: 1366, e: 1401, t: "线程往下钻"},
  {s: 1401, e: 1436, t: "日志找动机"},
  {s: 1441, e: 1517, t: "这张四层排查卡截图存好"},
  {s: 1517, e: 1558, t: "服务器再飙高"},
  {s: 1558, e: 1599, t: "你就有章法了"},
];

// ---------- 动画原语 ----------

const SceneWrap: React.FC<{children: React.ReactNode; instant?: boolean}> = ({children, instant}) => {
  const frame = useCurrentFrame();
  const op = instant ? 1 : interpolate(frame, [0, 8], [0, 1], {extrapolateRight: "clamp"});
  const tx = instant ? 0 : interpolate(frame, [0, 10], [70, 0], {extrapolateRight: "clamp"});
  return <AbsoluteFill style={{opacity: op, transform: `translateX(${tx}px)`}}>{children}</AbsoluteFill>;
};

const Pop: React.FC<{delay?: number; children: React.ReactNode; style?: React.CSSProperties}> = ({
  delay = 0, children, style,
}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const sp = spring({frame: frame - delay, fps, config: {damping: 15, stiffness: 170}});
  return (
    <div style={{
      opacity: interpolate(sp, [0, 1], [0, 1]),
      transform: `translateY(${(1 - sp) * 22}px)`,
      ...style,
    }}>
      {children}
    </div>
  );
};

const FadeUp: React.FC<{at: number; children: React.ReactNode; style?: React.CSSProperties}> = ({at, children, style}) => {
  const frame = useCurrentFrame();
  const a = interpolate(frame, [at, at + 8], [0, 1], {extrapolateLeft: "clamp", extrapolateRight: "clamp"});
  if (a <= 0) return null;
  return <div style={{opacity: a, transform: `translateY(${(1 - a) * 14}px)`, ...style}}>{children}</div>;
};

const SlideIn: React.FC<{delay?: number; from?: number; children: React.ReactNode; style?: React.CSSProperties}> = ({
  delay = 0, from = 60, children, style,
}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const sp = spring({frame: frame - delay, fps, config: {damping: 16, stiffness: 150}});
  return (
    <div style={{
      opacity: interpolate(sp, [0, 1], [0, 1]),
      transform: `translateX(${(1 - sp) * from}px)`,
      ...style,
    }}>
      {children}
    </div>
  );
};

// 慢速打字机：cps=0.55（约 16.5 字/秒），光标常驻闪烁，只出现在当前最后一行
const TypeTokens: React.FC<{
  tokens: {t: string; c: string}[]; start: number; cps?: number; fontSize?: number; active?: boolean;
}> = ({tokens, start, cps = 0.55, fontSize = 32, active = true}) => {
  const frame = useCurrentFrame();
  const total = tokens.reduce((a, t) => a + t.t.length, 0);
  const shown = Math.max(0, Math.min(total, Math.floor((frame - start) * cps)));
  let used = 0;
  const parts: React.ReactNode[] = [];
  let cursor: React.ReactNode = null;
  tokens.forEach((tk, i) => {
    const a = used;
    const b = used + tk.t.length;
    if (shown > a) {
      const vis = tk.t.slice(0, Math.min(tk.t.length, shown - a));
      parts.push(<span key={i} style={{color: tk.c}}>{vis}</span>);
      if (shown < b && cursor === null) cursor = <span key={"c" + i} style={{color: INK}}>▌</span>;
    }
    used = b;
  });
  if (shown >= total && active) {
    cursor = <span style={{color: ORANGE, opacity: frame % 30 < 15 ? 1 : 0.15}}>▌</span>;
  }
  return <span style={{fontSize, fontFamily: MONO, fontWeight: 800, whiteSpace: "pre"}}>{parts}{cursor}</span>;
};

// 终端：满宽大窗
const Terminal: React.FC<{
  x: number; y: number; w: number; title: string; children: React.ReactNode;
}> = ({x, y, w, title, children}) => (
  <div style={{position: "absolute", left: x, top: y, width: w}}>
    <div style={{
      backgroundColor: CARD, borderRadius: 18, overflow: "hidden",
      border: `2px solid ${BORDER}`, boxShadow: "0 20px 50px rgba(0,0,0,0.35)",
    }}>
      <div style={{
        height: 58, backgroundColor: "#272e3d", display: "flex", alignItems: "center",
        paddingLeft: 26, gap: 11, borderBottom: `2px solid ${BORDER}`,
      }}>
        <span style={{width: 16, height: 16, borderRadius: 999, backgroundColor: "#d97e5a"}} />
        <span style={{width: 16, height: 16, borderRadius: 999, backgroundColor: "#d9a75a"}} />
        <span style={{width: 16, height: 16, borderRadius: 999, backgroundColor: "#8aa876"}} />
        <span style={{marginLeft: 16, fontSize: 23, color: SUB, fontFamily: MONO}}>{title}</span>
      </div>
      <div style={{padding: "36px 50px"}}>{children}</div>
    </div>
  </div>
);

// 对称双卡
const InfoCard: React.FC<{
  x: number; y: number; w: number; delay: number; title: React.ReactNode; lines: string[];
}> = ({x, y, w, delay, title, lines}) => (
  <SlideIn delay={delay} from={70} style={{position: "absolute", left: x, top: y, width: w}}>
    <div style={{
      backgroundColor: CARD, borderRadius: 16, border: `2px solid ${BORDER}`,
      borderLeft: `6px solid ${ORANGE}`,
      boxShadow: "0 12px 30px rgba(0,0,0,0.3)", padding: "24px 34px",
    }}>
      <div style={{fontSize: 32, fontWeight: 900, color: INK, fontFamily: YAHEI, marginBottom: 8, whiteSpace: "nowrap"}}>{title}</div>
      {lines.map((l, i) => (
        <div key={i} style={{fontSize: 28, color: SUB, fontFamily: YAHEI, lineHeight: 1.6, whiteSpace: "nowrap"}}>{l}</div>
      ))}
    </div>
  </SlideIn>
);

const Head: React.FC<{n: string; title: React.ReactNode; sub: string}> = ({n, title, sub}) => (
  <Pop delay={2} style={{position: "absolute", top: 48, left: 0, width: 1920, textAlign: "center"}}>
    <div style={{display: "flex", justifyContent: "center", alignItems: "center", gap: 24}}>
      <div style={{
        width: 62, height: 62, borderRadius: 15, backgroundColor: ORANGE_D, color: "#fff",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 34, fontWeight: 900, fontFamily: MONO, boxShadow: "0 8px 20px rgba(0,0,0,0.3)",
        flexShrink: 0,
      }}>{n}</div>
      <div style={{fontSize: 52, fontWeight: 900, color: INK, fontFamily: YAHEI, letterSpacing: 2, whiteSpace: "nowrap"}}>{title}</div>
    </div>
    <div style={{fontSize: 27, color: SUB, fontFamily: YAHEI, marginTop: 12, letterSpacing: 4}}>{sub}</div>
  </Pop>
);

const CornerMark: React.FC = () => (
  <div style={{
    position: "absolute", top: 64, right: 84, fontSize: 26, color: SUB,
    fontFamily: YAHEI, fontWeight: 700, letterSpacing: 4,
  }}>小秋</div>
);

const Subtitle: React.FC = () => {
  const frame = useCurrentFrame();
  // 口诀页：屏幕大字与底部字幕同句，按规范错开（大字优先，字幕窗口让位）
  if (frame >= 1324 && frame < 1436) return null;
  const cur = subs.find((s) => frame >= s.s && frame < s.e);
  if (!cur) return null;
  const sp = spring({frame: frame - cur.s, fps: 30, config: {damping: 16, stiffness: 200}});
  return (
    <div style={{position: "absolute", bottom: 36, left: 0, width: 1920, display: "flex", justifyContent: "center", pointerEvents: "none"}}>
      <div style={{
        fontSize: 44, fontWeight: 700, color: INK, fontFamily: YAHEI, letterSpacing: 3,
        backgroundColor: "rgba(15,19,27,0.72)", borderRadius: 12, padding: "8px 28px",
        transform: `translateY(${(1 - sp) * 8}px)`,
        opacity: interpolate(sp, [0, 1], [0.3, 1]),
      }}>
        {cur.t}
      </div>
    </div>
  );
};

// CPU 仪表：指针 + 数值持续抖动（循环动画，封面常驻）
const Gauge: React.FC<{x: number; y: number; size: number}> = ({x, y, size}) => {
  const frame = useCurrentFrame();
  const jitter = Math.sin(frame / 6) * 3 + Math.sin(frame / 2.3) * 1.5;
  const val = 99.7 + Math.sin(frame / 9) * 0.3;
  const angle = -85 + 0.97 * 170 + jitter * 0.4;
  return (
    <div style={{
      position: "absolute", left: x, top: y, width: size, height: size * 0.78,
      backgroundColor: CARD, borderRadius: 18, border: `2px solid ${BORDER}`,
      boxShadow: "0 12px 30px rgba(0,0,0,0.3)", overflow: "hidden",
    }}>
      <svg width={size} height={size * 0.5} viewBox="0 0 170 88">
        <path d="M 15 82 A 70 70 0 0 1 155 82" fill="none" stroke={BORDER} strokeWidth={13} strokeLinecap="round" />
        <path d="M 108 27.5 A 70 70 0 0 1 155 82" fill="none" stroke={RED} strokeWidth={13} strokeLinecap="round" />
      </svg>
      <div style={{
        position: "absolute", left: size / 2 - 2, bottom: size * 0.30, width: 4, height: size * 0.30,
        backgroundColor: RED, borderRadius: 4,
        transform: `rotate(${angle}deg)`, transformOrigin: "bottom center",
      }} />
      <div style={{
        position: "absolute", left: 0, bottom: 8, width: size, textAlign: "center",
        fontSize: 30, fontFamily: MONO, fontWeight: 900, color: RED, whiteSpace: "pre",
      }}>{`${val.toFixed(1)}%`}</div>
    </div>
  );
};

// 大键帽
const KeyCap: React.FC<{label: string; at: number; fontSize?: number}> = ({label, at, fontSize = 34}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const sp = spring({frame: frame - at, fps, config: {damping: 12, stiffness: 190}});
  return (
    <span style={{
      display: "inline-block", transform: `scale(${interpolate(sp, [0, 1], [0.4, 1])})`,
      backgroundColor: "#1f2430", border: `3px solid ${ORANGE}`, color: ORANGE,
      borderRadius: 10, padding: "2px 20px", fontFamily: MONO, fontWeight: 900,
      fontSize, boxShadow: "0 6px 0 rgba(0,0,0,0.35)",
    }}>{label}</span>
  );
};

const pad2 = (n: number) => (n < 10 ? `0${n}` : `${n}`);

// ---------- 场景 1：封面钩子（第 0 帧完整呈现，禁入场动画）----------
const SceneHook: React.FC = () => {
  const frame = useCurrentFrame();
  const pulse = 1 + Math.sin(frame / 5) * 0.05;
  const load = (9.42 + Math.sin(frame / 7) * 0.4).toFixed(2);
  return (
    <SceneWrap instant>
      <AbsoluteFill>
        {/* 大标题 */}
        <div style={{position: "absolute", top: 54, left: 0, width: 1920, textAlign: "center"}}>
          <div style={{fontSize: 82, fontWeight: 900, fontFamily: YAHEI, letterSpacing: 4, whiteSpace: "nowrap", color: INK}}>
            CPU 飙到 <span style={{color: RED}}>{`100%`}</span>？先查这 <span style={{color: ORANGE}}>4 层</span>
          </div>
          <div style={{fontSize: 30, color: SUB, fontFamily: YAHEI, marginTop: 14, letterSpacing: 6}}>
            卡成幻灯片，也先别急着重启
          </div>
        </div>
        {/* 右上 CPU 仪表 */}
        <Gauge x={1652} y={120} size={188} />
        {/* 居中大号终端 */}
        <Terminal x={210} y={252} w={1500} title="xiaoqiu@dev: ~">
          <div style={{fontSize: 40, fontFamily: MONO, fontWeight: 800}}>
            <span style={{color: ORANGE}}>$ </span>
            <span style={{color: INK}}>top</span>
            <span style={{color: ORANGE, opacity: frame % 30 < 15 ? 1 : 0.15}}>▌</span>
          </div>
          <div style={{fontSize: 26, fontFamily: MONO, fontWeight: 700, color: SUB, whiteSpace: "pre", lineHeight: 2.0, marginTop: 12}}>
            {`top - 14:23:07 up 3 days,  1 user,  load average: ${load}, 9.18, 8.97`}
          </div>
          <div style={{fontSize: 28, fontFamily: MONO, fontWeight: 700, color: SUB, whiteSpace: "pre", lineHeight: 2.0}}>
            {"%Cpu(s) : "}
            <span style={{color: RED, fontWeight: 900, transform: `scale(${pulse})`, display: "inline-block"}}>{"99.7 us"}</span>
            {",  0.3 sy,  0.0 id"}
          </div>
          <div style={{fontSize: 28, fontFamily: MONO, fontWeight: 700, color: SUB, whiteSpace: "pre", lineHeight: 2.0, marginTop: 10}}>
            {"  PID  USER      %CPU   %MEM  COMMAND"}
          </div>
          <div style={{fontSize: 30, fontFamily: MONO, fontWeight: 800, whiteSpace: "pre", lineHeight: 1.9, backgroundColor: RED_BG, borderRadius: 8, padding: "0 10px", margin: "0 -10px"}}>
            <span style={{color: INK}}>{" 3021  xiaoqiu  "}</span>
            <span style={{color: RED, fontWeight: 900}}>{"99.7"}</span>
            <span style={{color: INK}}>{"   12.3  "}</span>
            <span style={{color: ORANGE, fontWeight: 900}}>worker</span>
          </div>
          <div style={{fontSize: 30, fontFamily: MONO, fontWeight: 800, color: SUB, whiteSpace: "pre", lineHeight: 1.9}}>
            {" 3022  xiaoqiu   0.3    5.1  nginx"}
          </div>
          <div style={{fontSize: 30, fontFamily: MONO, fontWeight: 800, color: SUB, whiteSpace: "pre", lineHeight: 1.9}}>
            {" 3023  xiaoqiu   0.1    3.8  sshd"}
          </div>
        </Terminal>
        {/* 四层预告 chips */}
        <div style={{position: "absolute", top: 830, left: 0, width: 1920, display: "flex", justifyContent: "center", gap: 26}}>
          {[
            {n: "1", t: "top 排序"},
            {n: "2", t: "看进程"},
            {n: "3", t: "看线程"},
            {n: "4", t: "看日志"},
          ].map((c) => (
            <div key={c.n} style={{
              width: 292, height: 76, backgroundColor: CARD, borderRadius: 14,
              border: `2px solid ${BORDER}`, display: "flex", alignItems: "center",
              justifyContent: "center", gap: 16,
            }}>
              <span style={{
                width: 40, height: 40, borderRadius: 10, backgroundColor: ORANGE_D, color: "#fff",
                fontSize: 24, fontWeight: 900, fontFamily: MONO, display: "flex",
                alignItems: "center", justifyContent: "center", flexShrink: 0,
              }}>{c.n}</span>
              <span style={{fontSize: 32, fontWeight: 900, color: INK, fontFamily: YAHEI, whiteSpace: "nowrap"}}>{c.t}</span>
            </div>
          ))}
        </div>
        {/* 落款 */}
        <div style={{position: "absolute", top: 912, left: 0, width: 1920, textAlign: "center"}}>
          <div style={{fontSize: 28, color: SUB, fontFamily: YAHEI, letterSpacing: 3, whiteSpace: "nowrap"}}>小秋 · 0 基础也能学会</div>
        </div>
      </AbsoluteFill>
    </SceneWrap>
  );
};

// ---------- 场景 2：第一层 top（敲 top → 按 P → 高亮锁定）----------
const SceneLayer1: React.FC = () => {
  const frame = useCurrentFrame();
  const locked = frame >= 106;
  const pulse = 1 + Math.sin(Math.max(0, frame - 106) / 5) * 0.05;
  return (
    <SceneWrap>
      <AbsoluteFill>
        <Head n="1" title={<>第 1 层 · <span style={{fontFamily: MONO}}>top</span> 排序</>} sub="先看清谁在烧 CPU，再动手" />
        <Terminal x={180} y={222} w={1560} title="xiaoqiu@dev: ~">
          {/* 命令行：27 帧开始敲 */}
          {frame >= 27 ? (
            <div style={{fontSize: 44, fontFamily: MONO, fontWeight: 800, display: "flex", alignItems: "center", gap: 26, width: 1460}}>
              <TypeTokens tokens={[{t: "$ ", c: ORANGE}, {t: "top", c: INK}]} start={27} cps={0.55} fontSize={44} active={false} />
              {frame >= 75 ? (
                <span style={{display: "inline-flex", alignItems: "center", gap: 14, fontSize: 30, color: SUB, fontFamily: YAHEI, fontWeight: 700}}>
                  <KeyCap label="P" at={75} fontSize={32} /> 按 CPU 排序
                </span>
              ) : null}
            </div>
          ) : null}
          {/* 输出：命令敲完后长出来 */}
          <div style={{marginTop: 24}}>
            {frame >= 40 ? (
              <div style={{fontSize: 28, fontFamily: MONO, fontWeight: 700, color: SUB, whiteSpace: "pre", lineHeight: 2.0}}>
                {"  PID  USER      %CPU   %MEM  COMMAND"}
              </div>
            ) : null}
            {frame >= 52 ? (
              <div style={{
                fontSize: 31, fontFamily: MONO, fontWeight: 800, whiteSpace: "pre", lineHeight: 1.95,
                borderRadius: 8, padding: "0 12px", margin: "0 -12px",
                backgroundColor: locked ? RED_BG : "transparent",
                opacity: interpolate(frame, [52, 60], [0, 1], {extrapolateLeft: "clamp", extrapolateRight: "clamp"}),
                transform: `translateY(${interpolate(frame, [52, 60], [14, 0], {extrapolateLeft: "clamp", extrapolateRight: "clamp"})}px)`,
              }}>
                <span style={{color: INK}}>{" 3021  xiaoqiu  "}</span>
                <span style={{
                  color: locked ? RED : SUB, fontWeight: 900,
                  display: "inline-block", transform: locked ? `scale(${pulse})` : "none",
                }}>{"99.7"}</span>
                <span style={{color: INK}}>{"   12.3  "}</span>
                <span style={{color: locked ? ORANGE : SUB, fontWeight: 900}}>worker</span>
                {locked ? <span style={{color: RED, fontSize: 27}}>{"   <= 最凶的就是它"}</span> : null}
              </div>
            ) : null}
            {frame >= 62 ? (
              <div style={{
                fontSize: 31, fontFamily: MONO, fontWeight: 800, color: SUB, whiteSpace: "pre", lineHeight: 1.95,
                opacity: interpolate(frame, [62, 70], [0, 1], {extrapolateLeft: "clamp", extrapolateRight: "clamp"}),
                transform: `translateY(${interpolate(frame, [62, 70], [14, 0], {extrapolateLeft: "clamp", extrapolateRight: "clamp"})}px)`,
              }}>
                {" 3022  xiaoqiu   0.3    5.1  nginx"}
              </div>
            ) : null}
            {frame >= 72 ? (
              <div style={{
                fontSize: 31, fontFamily: MONO, fontWeight: 800, color: SUB, whiteSpace: "pre", lineHeight: 1.95,
                opacity: interpolate(frame, [72, 80], [0, 1], {extrapolateLeft: "clamp", extrapolateRight: "clamp"}),
                transform: `translateY(${interpolate(frame, [72, 80], [14, 0], {extrapolateLeft: "clamp", extrapolateRight: "clamp"})}px)`,
              }}>
                {" 3023  xiaoqiu   0.1    3.8  sshd"}
              </div>
            ) : null}
          </div>
        </Terminal>
        <InfoCard x={210} y={716} w={700} delay={106}
          title={<span><KeyCap label="P" at={106} fontSize={28} />　按 %CPU 从高到低</span>}
          lines={["最上面那行，就是要抓的头号嫌疑"]} />
        <InfoCard x={1010} y={716} w={700} delay={160}
          title="别大海捞针"
          lines={["先锁定最吃 CPU 的那几个进程"]} />
      </AbsoluteFill>
    </SceneWrap>
  );
};

// ---------- 场景 3：第二层 看进程（放大卡片 + 两个可疑迹象）----------
const SceneLayer2: React.FC = () => {
  const frame = useCurrentFrame();
  // 迹象1：CPU 时间疯涨（数字持续滚动 = 循环动画）
  const cs = Math.floor(frame * 3) % 100;
  const secTotal = 41 * 60 + 7 + Math.floor(frame * 0.03);
  const timeStr = `${pad2(Math.floor(secTotal / 60))}:${pad2(secTotal % 60)}.${cs < 10 ? "0" + cs : cs}`;
  // 迹象2：同一命令每隔几秒重复出现
  const runCount = frame >= 191 ? Math.floor((frame - 191) / 6) + 1 : 0;
  const rows = [];
  for (let i = Math.max(0, runCount - 5); i < runCount; i++) {
    const ts = 14 * 3600 + 23 * 60 + 1 + i * 3;
    rows.push({key: i, at: 191 + i * 6, t: `[${pad2(Math.floor(ts / 3600))}:${pad2(Math.floor(ts / 60) % 60)}:${pad2(ts % 60)}] run job #${2001 + i}`});
  }
  return (
    <SceneWrap>
      <AbsoluteFill>
        <Head n="2" title="第 2 层 · 进程体检" sub="worker 到底在忙什么" />
        {/* 锁定进程放大卡 */}
        <Pop delay={30} style={{position: "absolute", left: 310, top: 236, width: 1300}}>
          <div style={{
            backgroundColor: CARD, borderRadius: 20, border: `2px solid ${BORDER}`,
            boxShadow: "0 20px 50px rgba(0,0,0,0.35)", padding: "30px 40px",
          }}>
            <div style={{display: "flex", alignItems: "center", gap: 20, width: 1220}}>
              <span style={{
                backgroundColor: ORANGE_D, color: "#fff", borderRadius: 12, padding: "6px 20px",
                fontSize: 30, fontFamily: MONO, fontWeight: 900, flexShrink: 0,
              }}>PID 3021</span>
              <span style={{fontSize: 36, fontWeight: 900, color: INK, fontFamily: MONO}}>worker</span>
              <span style={{marginLeft: "auto", fontSize: 26, color: SUB, fontFamily: MONO, fontWeight: 700}}>
                {`/home/xiaoqiu/app/worker`}
              </span>
            </div>
            <div style={{display: "flex", gap: 24, marginTop: 24, width: 1220}}>
              {/* 迹象 1：自己空转 */}
              <FadeUp at={125} style={{width: 598, height: 274, backgroundColor: "#272e3d", borderRadius: 14, border: `2px solid ${BORDER}`, padding: "26px 28px"}}>
                <div style={{fontSize: 28, fontWeight: 900, color: ORANGE, fontFamily: YAHEI}}>迹象 1 · 自己在空转</div>
                <div style={{fontSize: 50, fontFamily: MONO, fontWeight: 900, color: INK, marginTop: 26, whiteSpace: "pre"}}>
                  {"TIME+ "}
                  <span style={{color: RED}}>{timeStr}</span>
                </div>
                <div style={{fontSize: 26, color: SUB, fontFamily: YAHEI, marginTop: 24, lineHeight: 1.6}}>CPU 时间疯涨，<br/>界面却毫无动静</div>
              </FadeUp>
              {/* 迹象 2：重复跑 */}
              <FadeUp at={191} style={{width: 598, height: 274, backgroundColor: "#272e3d", borderRadius: 14, border: `2px solid ${BORDER}`, padding: "26px 28px"}}>
                <div style={{fontSize: 28, fontWeight: 900, color: ORANGE, fontFamily: YAHEI}}>迹象 2 · 任务在重复跑</div>
                <div style={{marginTop: 16}}>
                  {rows.map((r) => (
                    <div key={r.key} style={{
                      fontSize: 26, fontFamily: MONO, fontWeight: 700, color: INK,
                      whiteSpace: "pre", lineHeight: 1.9,
                      opacity: interpolate(frame, [r.at, r.at + 6], [0, 1], {extrapolateLeft: "clamp", extrapolateRight: "clamp"}),
                      transform: `translateY(${interpolate(frame, [r.at, r.at + 6], [12, 0], {extrapolateLeft: "clamp", extrapolateRight: "clamp"})}px)`,
                    }}>{r.t}</div>
                  ))}
                </div>
              </FadeUp>
            </div>
          </div>
        </Pop>
        {/* 标签 */}
        <Pop delay={110} style={{position: "absolute", top: 742, left: 0, width: 1920, display: "flex", justifyContent: "center"}}>
          <div style={{
            backgroundColor: ORANGE_D, color: "#fff", borderRadius: 999, padding: "14px 56px",
            fontSize: 36, fontWeight: 900, fontFamily: YAHEI, letterSpacing: 6,
            boxShadow: "0 14px 34px rgba(0,0,0,0.35)", whiteSpace: "nowrap",
          }}>是空转，还是重复跑？</div>
        </Pop>
      </AbsoluteFill>
    </SceneWrap>
  );
};

// ---------- 场景 4：第三层 看线程（top -H，一根线程 99.9 飙红 + 对比条）----------
const SceneLayer3: React.FC = () => {
  const frame = useCurrentFrame();
  const hot = frame >= 194;
  const pulse = 1 + Math.sin(Math.max(0, frame - 194) / 5) * 0.05;
  const threadRows = [
    {pid: " 3021", name: "worker", cpu: "12.3", tag: "main", hot: false},
    {pid: " 4096", name: "worker", cpu: "99.9", tag: "busy-loop", hot: true},
    {pid: " 4097", name: "worker", cpu: " 0.1", tag: "io", hot: false},
    {pid: " 4098", name: "worker", cpu: " 0.0", tag: "timer", hot: false},
  ];
  return (
    <SceneWrap>
      <AbsoluteFill>
        <Head n="3" title={<>第 3 层 · <span style={{fontFamily: MONO}}>top -H</span> 线程下钻</>} sub="进程不高，不代表没凶手" />
        <Terminal x={180} y={222} w={1560} title="xiaoqiu@dev: ~">
          {frame >= 78 ? (
            <TypeTokens tokens={[{t: "$ ", c: ORANGE}, {t: "top -H -p 3021", c: INK}]} start={78} cps={0.55} fontSize={44} active={false} />
          ) : null}
          <div style={{marginTop: 20}}>
            {frame >= 112 ? (
              <div style={{fontSize: 28, fontFamily: MONO, fontWeight: 700, color: SUB, whiteSpace: "pre", lineHeight: 1.9}}>
                {"   PID USER      %CPU  COMMAND"}
              </div>
            ) : null}
            {threadRows.map((r, i) => {
              const at = 124 + i * 10;
              if (frame < at) return null;
              const a = interpolate(frame, [at, at + 8], [0, 1], {extrapolateLeft: "clamp", extrapolateRight: "clamp"});
              const isHot = r.hot && hot;
              return (
                <div key={r.pid} style={{
                  fontSize: 31, fontFamily: MONO, fontWeight: 800, whiteSpace: "pre", lineHeight: 1.9,
                  borderRadius: 8, padding: "0 12px", margin: "0 -12px",
                  backgroundColor: isHot ? RED_BG : "transparent",
                  opacity: a, transform: `translateY(${(1 - a) * 14}px)`,
                }}>
                  <span style={{color: isHot ? INK : SUB}}>{`${r.pid}  ${r.name}  `}</span>
                  <span style={{
                    color: isHot ? RED : SUB, fontWeight: 900,
                    display: "inline-block", transform: isHot ? `scale(${pulse})` : "none",
                  }}>{r.cpu}</span>
                  <span style={{color: isHot ? INK : SUB}}>{"  "}</span>
                  <span style={{color: isHot ? RED : SUB, fontWeight: isHot ? 900 : 700}}>{"─ " + r.tag}</span>
                  {isHot ? <span style={{color: RED, fontSize: 27}}>{"   <= 就是这根"}</span> : null}
                </div>
              );
            })}
          </div>
        </Terminal>
        {/* 对比条 */}
        <InfoCard x={210} y={708} w={700} delay={165}
          title="进程整体：12.3%"
          lines={["top 里看着人畜无害"]}
        />
        <InfoCard x={1010} y={708} w={700} delay={178}
          title={<span>线程 <span style={{fontFamily: MONO, color: RED}}>4096</span>：99.9%</span>}
          lines={["一根线程把整颗核跑满了"]}
        />
        {/* 对比小条 */}
        <Pop delay={176} style={{position: "absolute", left: 244, top: 852, width: 632}}>
          <div style={{height: 16, borderRadius: 8, backgroundColor: BORDER, overflow: "hidden", width: 632}}>
            <div style={{height: 16, width: 78, backgroundColor: SUB, borderRadius: 8}} />
          </div>
        </Pop>
        <Pop delay={198} style={{position: "absolute", left: 1044, top: 852, width: 632}}>
          <div style={{height: 16, borderRadius: 8, backgroundColor: BORDER, overflow: "hidden", width: 632}}>
            <div style={{height: 16, width: 632, backgroundColor: RED, borderRadius: 8}} />
          </div>
        </Pop>
      </AbsoluteFill>
    </SceneWrap>
  );
};

// ---------- 场景 5：第四层 看日志（tail 流式滚动 + WARN 红框圈出）----------
const LOG_PATTERNS: {t: string; c: string; warn?: boolean}[] = [
  {t: "INFO  handle req #4121 -> 200", c: SUB},
  {t: "INFO  while(true) tick 10240", c: SUB},
  {t: "WARN  connect db timeout, retry 1/∞", c: ORANGE, warn: true},
  {t: "INFO  handle req #4122 -> 200", c: SUB},
  {t: "ERROR connect db refused", c: RED, warn: true},
  {t: "WARN  connect db timeout, retry 2/∞", c: ORANGE, warn: true},
  {t: "INFO  while(true) tick 10241", c: SUB},
  {t: "WARN  connect db timeout, retry 3/∞", c: ORANGE, warn: true},
];

const SceneLayer4: React.FC = () => {
  const frame = useCurrentFrame();
  const MAX_VISIBLE = 7;
  const visible = frame >= 95 ? Math.min(60, Math.floor((frame - 95) / 8) + 1) : 0;
  const startIdx = Math.max(0, visible - MAX_VISIBLE);
  const lines: {idx: number; at: number; pat: (typeof LOG_PATTERNS)[0]; ts: string; retryNo?: number}[] = [];
  for (let i = startIdx; i < visible; i++) {
    const sec = 14 * 3600 + 23 * 60 + 1 + i * 3;
    const pat = LOG_PATTERNS[i % LOG_PATTERNS.length];
    // retry 序号全局连续：按循环轮次累加，不回卷
    const retryNo = pat.t.includes("retry")
      ? Math.floor(i / LOG_PATTERNS.length) * 3 + Number(pat.t.match(/retry (\d+)/)![1])
      : undefined;
    lines.push({
      idx: i, at: 95 + i * 8, pat, retryNo,
      ts: `[${pad2(Math.floor(sec / 3600))}:${pad2(Math.floor(sec / 60) % 60)}:${pad2(sec % 60)}]`,
    });
  }
  return (
    <SceneWrap>
      <AbsoluteFill>
        <Head n="4" title="第 4 层 · 日志取证" sub="盯住 /home/xiaoqiu 的日志" />
        <Terminal x={180} y={222} w={1560} title="xiaoqiu@dev: ~">
          {frame >= 32 ? (
            <TypeTokens tokens={[{t: "$ ", c: ORANGE}, {t: "tail -f /home/xiaoqiu/app/worker.log", c: INK}]} start={32} cps={0.55} fontSize={40} active={false} />
          ) : null}
          <div style={{marginTop: 20, width: 1460}}>
            {lines.map((l) => {
              const sweep = l.pat.warn
                ? interpolate(frame, [188, 202], [0, 1], {extrapolateLeft: "clamp", extrapolateRight: "clamp"})
                : 0;
              return (
                <div key={l.idx} style={{
                  fontSize: 27, fontFamily: MONO, fontWeight: 700, whiteSpace: "pre", lineHeight: 1.85,
                  opacity: interpolate(frame, [l.at, l.at + 7], [0, 1], {extrapolateLeft: "clamp", extrapolateRight: "clamp"}),
                  transform: `translateY(${interpolate(frame, [l.at, l.at + 7], [12, 0], {extrapolateLeft: "clamp", extrapolateRight: "clamp"})}px)`,
                }}>
                  <span style={{position: "relative", display: "inline-block"}}>
                    {l.pat.warn ? (
                      <span style={{
                        position: "absolute", left: -8, right: -8, top: 2, bottom: 2,
                        backgroundColor: RED_BG, border: `2px solid ${RED}`, borderRadius: 8,
                        transform: `scaleX(${sweep})`, transformOrigin: "left",
                      }} />
                    ) : null}
                    <span style={{position: "relative", color: SUB}}>{l.ts + " "}</span>
                    <span style={{position: "relative", color: l.pat.c, fontWeight: l.pat.warn ? 900 : 700}}>
                      {l.pat.t.includes("retry") ? l.pat.t.replace(/retry \d+/, `retry ${l.retryNo}`) : l.pat.t}
                    </span>
                  </span>
                </div>
              );
            })}
          </div>
        </Terminal>
        <InfoCard x={210} y={812} w={700} delay={155}
          title={<span><span style={{fontFamily: MONO, color: RED}}>while(true)</span> 死循环</span>}
          lines={["疯狂空转，一行行 tick 全记着"]}
        />
        <InfoCard x={1010} y={812} w={700} delay={188}
          title={<span><span style={{fontFamily: MONO, color: RED}}>retry 1/∞</span> 疯狂重试</span>}
          lines={["连不上就死磕，脚印全在日志里"]}
        />
      </AbsoluteFill>
    </SceneWrap>
  );
};

// ---------- 场景 6：四层漏斗总结（对称漏斗）----------
const SceneFunnel: React.FC = () => {
  const layers = [
    {w: 1240, n: "1", name: "top", cmd: true, desc: "按 P 排序，锁定最吃 CPU 的进程", at: 15},
    {w: 1060, n: "2", name: "进程", cmd: false, desc: "看它是空转，还是任务在重复跑", at: 47},
    {w: 880, n: "3", name: "线程", cmd: false, desc: "top -H 下钻，找跑满的那一根", at: 65},
    {w: 700, n: "4", name: "日志", cmd: false, desc: "死循环、疯狂重试，全留脚印", at: 93},
  ];
  return (
    <SceneWrap>
      <AbsoluteFill>
        <Head n="✓" title="四层漏斗 · 一图记牢" sub="一条线，从上查到下" />
        <div style={{position: "absolute", top: 236, left: 0, width: 1920, display: "flex", flexDirection: "column", alignItems: "center", gap: 18}}>
          {layers.map((l) => (
            <FadeUp key={l.n} at={l.at} style={{width: l.w}}>
              <div style={{
                backgroundColor: Number(l.n) % 2 === 1 ? TINT : CARD,
                borderRadius: 16, border: `2px solid ${BORDER}`,
                boxShadow: "0 12px 30px rgba(0,0,0,0.3)",
                padding: "20px 34px", display: "flex", alignItems: "center", gap: 24,
              }}>
                <div style={{
                  width: 54, height: 54, borderRadius: 999, backgroundColor: ORANGE_D, color: "#fff",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 28, fontWeight: 900, fontFamily: YAHEI, flexShrink: 0,
                }}>{l.n}</div>
                <div style={{
                  fontSize: l.cmd ? 40 : 38, fontFamily: l.cmd ? MONO : YAHEI,
                  fontWeight: 900, color: ORANGE, whiteSpace: "nowrap", flexShrink: 0,
                }}>{l.name}</div>
                <div style={{fontSize: 30, color: INK, fontFamily: YAHEI, fontWeight: 700, whiteSpace: "nowrap"}}>{l.desc}</div>
              </div>
            </FadeUp>
          ))}
        </div>
        <Pop delay={104} style={{position: "absolute", top: 836, left: 0, width: 1920, display: "flex", justifyContent: "center"}}>
          <div style={{
            backgroundColor: CARD, border: `2px solid ${BORDER}`, borderRadius: 999,
            padding: "12px 48px", fontSize: 32, fontWeight: 900, color: INK,
            fontFamily: YAHEI, letterSpacing: 4, whiteSpace: "nowrap",
          }}>层层下钻 · 越查越窄</div>
        </Pop>
      </AbsoluteFill>
    </SceneWrap>
  );
};

// ---------- 场景 7：口诀页（大字三行 + 角落小贴纸）----------
const SceneMotto: React.FC = () => {
  const frame = useCurrentFrame();
  const lines = [
    {at: 45, pre: "top", mono: true, post: " 锁进程"},
    {at: 84, pre: "线程", mono: false, post: " 往下钻"},
    {at: 123, pre: "日志", mono: false, post: " 找动机"},
  ];
  return (
    <SceneWrap>
      <AbsoluteFill>
        <Head n="★" title="排查口诀" sub="背下这三句，下次 10 秒上手" />
        <div style={{position: "absolute", top: 300, left: 0, width: 1920, display: "flex", flexDirection: "column", alignItems: "center", gap: 56}}>
          {lines.map((l, i) => {
            if (frame < l.at) return null;
            const sp = spring({frame: frame - l.at, fps: 30, config: {damping: 14, stiffness: 180}});
            return (
              <div key={i} style={{
                fontSize: 88, fontWeight: 900, fontFamily: l.mono ? MONO : YAHEI,
                color: INK, letterSpacing: 8, whiteSpace: "nowrap",
                opacity: interpolate(sp, [0, 1], [0, 1]),
                transform: `translateY(${(1 - sp) * 30}px)`,
              }}>
                {l.pre}
                <span style={{color: ORANGE}}>{l.post}</span>
              </div>
            );
          })}
        </div>
        {/* 角落小贴纸（不出声） */}
        <Pop delay={30} style={{position: "absolute", right: 96, top: 866, width: 320}}>
          <div style={{
            backgroundColor: TINT, border: `2px dashed ${ORANGE}`, borderRadius: 14,
            padding: "14px 22px", fontSize: 26, color: ORANGE, fontWeight: 700,
            fontFamily: YAHEI, textAlign: "center", whiteSpace: "nowrap", transform: "rotate(-2deg)",
          }}>结尾有排查卡，记得存</div>
        </Pop>
      </AbsoluteFill>
    </SceneWrap>
  );
};

// ---------- 场景 8：结尾亮底速查卡（最后 100 帧完全静止）----------
const SceneCard: React.FC = () => {
  const rows = [
    {n: "①", cmd: "top 按 P 排序", desc: "锁定最吃 CPU 的进程", mono: true, at: 20},
    {n: "②", cmd: "看进程", desc: "空转 / 重复跑", mono: false, at: 45},
    {n: "③", cmd: "top -H 看线程", desc: "找跑满的那一根", mono: true, at: 70},
    {n: "④", cmd: "看日志", desc: "死循环 / 疯狂重试", mono: false, at: 95},
  ];
  return (
    <SceneWrap>
      <AbsoluteFill>
        <SlideIn delay={8} from={90} style={{position: "absolute", left: 340, top: 128, width: 1240}}>
          <div style={{
            backgroundColor: "#f2f4f8", borderRadius: 24, boxShadow: "0 24px 60px rgba(0,0,0,0.45)",
            padding: "40px 52px 34px",
          }}>
            <div style={{display: "flex", alignItems: "center", gap: 22, width: 1136}}>
              <div style={{
                width: 58, height: 58, borderRadius: 14, backgroundColor: ORANGE_D, color: "#fff",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 30, fontWeight: 900, fontFamily: YAHEI, flexShrink: 0,
              }}>卡</div>
              <div style={{fontSize: 52, fontWeight: 900, color: "#262c3a", fontFamily: YAHEI, letterSpacing: 2, whiteSpace: "nowrap"}}>
                CPU <span style={{color: "#ef6f6f"}}>100%</span> 四层排查
              </div>
            </div>
            <div style={{marginTop: 26, display: "flex", flexDirection: "column", gap: 14, width: 1136}}>
              {rows.map((r, i) => (
                <SlideIn key={i} delay={r.at} from={-70} style={{width: 1136}}>
                  <div style={{
                    backgroundColor: "#ffffff", borderRadius: 14, border: "2px solid #d8dde8",
                    padding: "16px 28px", display: "flex", alignItems: "center", gap: 22,
                  }}>
                    <span style={{
                      fontSize: 32, fontWeight: 900, color: ORANGE_D, fontFamily: YAHEI, flexShrink: 0,
                    }}>{r.n}</span>
                    <span style={{
                      fontSize: 36, fontWeight: 900, fontFamily: r.mono ? MONO : YAHEI,
                      color: "#262c3a", whiteSpace: "nowrap",
                    }}>{r.cmd}</span>
                    <span style={{marginLeft: "auto", fontSize: 29, color: "#6b7488", fontFamily: YAHEI, fontWeight: 700, whiteSpace: "nowrap"}}>{r.desc}</span>
                  </div>
                </SlideIn>
              ))}
            </div>
            <div style={{marginTop: 22, width: 1136, textAlign: "center", fontSize: 28, color: "#6b7488", fontFamily: YAHEI, letterSpacing: 4}}>
              小秋 · 0基础也能学会
            </div>
          </div>
        </SlideIn>
        <Pop delay={140} style={{position: "absolute", top: 906, left: 0, width: 1920, display: "flex", justifyContent: "center"}}>
          <div style={{fontSize: 32, color: SUB, fontFamily: YAHEI, letterSpacing: 4, whiteSpace: "nowrap"}}>
            服务器再飙高，按这四层查，就有章法
          </div>
        </Pop>
      </AbsoluteFill>
    </SceneWrap>
  );
};

// ---------- 组装 ----------
const scenes = SENT.map((start, i) => ({
  start,
  end: i < 7 ? SENT[i + 1] : DUR,
  C: [SceneHook, SceneLayer1, SceneLayer2, SceneLayer3, SceneLayer4, SceneFunnel, SceneMotto, SceneCard][i],
}));

// 音效层（统一挂主组件）：page3 翻页 / click 敲键 / pop 弹入 / ding 锁定·口诀 / alert 飙红·可疑 / whoosh 翻卡
const SFX: {f: number; w: string; v: number; d?: number}[] = [
  ...SENT.slice(1).map((f) => ({f, w: "page3.wav", v: 0.28, d: 30})),
  {f: 243, w: "click.wav", v: 0.22, d: 14},   // P2 敲 top
  {f: 291, w: "click.wav", v: 0.22, d: 14},   // P2 按下 P 键
  {f: 708, w: "click.wav", v: 0.22, d: 14},   // P4 敲 top -H
  {f: 895, w: "click.wav", v: 0.22, d: 14},   // P5 敲 tail -f
  {f: 103, w: "alert.wav", v: 0.3, d: 30},    // P1 CPU 100% 飙红
  {f: 322, w: "ding.wav", v: 0.3, d: 30},     // P2 锁定进程
  {f: 481, w: "alert.wav", v: 0.3, d: 30},    // P3 可疑迹象
  {f: 824, w: "alert.wav", v: 0.3, d: 30},    // P4 线程 99.9 飙红
  {f: 1051, w: "alert.wav", v: 0.3, d: 30},   // P5 重试行圈红
  {f: 1135, w: "pop.wav", v: 0.26, d: 20},    // P6 漏斗首层
  {f: 1167, w: "pop.wav", v: 0.26, d: 20},
  {f: 1180, w: "pop.wav", v: 0.24, d: 20},
  {f: 1213, w: "pop.wav", v: 0.26, d: 20},
  {f: 1327, w: "ding.wav", v: 0.3, d: 30},    // P7 口诀第一句
  {f: 1405, w: "ding.wav", v: 0.28, d: 30},   // P7 口诀第三句
  {f: 1451, w: "whoosh.wav", v: 0.22, d: 24}, // P8 速查卡滑入
  {f: 1461, w: "pop.wav", v: 0.26, d: 20},
];

export const Cpu100Diagnosis: React.FC = () => {
  const frame = useCurrentFrame();
  const bedVolume = interpolate(frame, [0, 20, DUR - 130, DUR - 100, DUR - 26, DUR - 1], [0, 0.06, 0.06, 0.1, 0.17, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return (
    <AbsoluteFill style={{backgroundColor: BG, fontFamily: YAHEI, overflow: "hidden"}}>
      {scenes.map(({start, end, C}, i) => (
        <Sequence key={i} from={start} durationInFrames={end - start}>
          <C />
        </Sequence>
      ))}
      {/* 顶部橙色进度条 + 右上角品牌角标 */}
      <div style={{
        position: "absolute", top: 0, left: 0, height: 6, backgroundColor: ORANGE,
        width: `${(frame / DUR) * 100}%`, zIndex: 10,
      }} />
      <CornerMark />
      {voiceLines.map((s) => (
        <Sequence key={`vo-${s.index}`} from={s.start} durationInFrames={s.end - s.start + 30}>
          <Audio src={staticFile(`audio/cpu100-tts/${s.audio}`)} volume={1} />
        </Sequence>
      ))}
      {SFX.map((s, i) => (
        <Sequence key={`sfx-${i}`} from={s.f} durationInFrames={s.d ?? 26}>
          <Audio src={staticFile(`audio/sfx/${s.w}`)} volume={s.v} />
        </Sequence>
      ))}
      <Audio src={staticFile("audio/bed.wav")} loop volume={() => bedVolume} />
      <Sequence from={1441} durationInFrames={60}>
        <Audio src={staticFile("audio/sfx/warm3.wav")} volume={0.26} />
      </Sequence>
      <Subtitle />
    </AbsoluteFill>
  );
};
