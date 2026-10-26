import {Audio} from "@remotion/media";
import {
  AbsoluteFill, interpolate, Sequence, spring, staticFile, useCurrentFrame, useVideoConfig,
} from "remotion";

// ---------- palette（深蓝灰 + 橙，横屏 1920x1080，居中对称 · 高级简洁）----------
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

const DUR = 1366;

const voiceLines = [
  {index: 1, audio: "s01.mp3", start: 0, end: 176},
  {index: 2, audio: "s02.mp3", start: 181, end: 481},
  {index: 3, audio: "s03.mp3", start: 487, end: 684},
  {index: 4, audio: "s04.mp3", start: 689, end: 877},
  {index: 5, audio: "s05.mp3", start: 882, end: 1030},
  {index: 6, audio: "s06.mp3", start: 1036, end: 1228},
  {index: 7, audio: "s07.mp3", start: 1234, end: 1366},
];

type Sub = {s: number; e: number; t: string};
const subs: Sub[] = [
  {s: 0, e: 88, t: "Docker 容器一起就秒退"},
  {s: 88, e: 135, t: "别急着删掉重装"},
  {s: 135, e: 176, t: "三步定位问题"},
  {s: 181, e: 290, t: "第一步 docker ps -a 看退出码"},
  {s: 290, e: 379, t: "Exited 1 是程序自己报错"},
  {s: 379, e: 481, t: "Exited 137 是内存不够被杀"},
  {s: 487, e: 580, t: "第二步 docker logs 容器名"},
  {s: 580, e: 632, t: "看最后几行日志"},
  {s: 632, e: 684, t: "九成的问题答案都在这里"},
  {s: 689, e: 782, t: "第三步 去掉横杠 d 前台跑一遍"},
  {s: 782, e: 877, t: "后台藏着的报错直接打在脸上"},
  {s: 882, e: 960, t: "新手最爱一出问题就 rm 重装"},
  {s: 960, e: 1030, t: "但那是在删证据"},
  {s: 1036, e: 1100, t: "ps 看状态"},
  {s: 1100, e: 1150, t: "logs 看原因"},
  {s: 1150, e: 1190, t: "前台跑验证"},
  {s: 1190, e: 1228, t: "三步下来问题藏不住"},
  {s: 1234, e: 1300, t: "学会了就点个赞"},
  {s: 1300, e: 1366, t: "下期教你进容器内部排查"},
];

// ---------- 动画原语 ----------

const shakeAmp = (frame: number, at: number, amp = 9, span = 18) => {
  const t = frame - at;
  if (at < 0 || t < 0 || t > span) return 0;
  return Math.sin(t * 2.2) * amp * (1 - t / span);
};

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

// 输出行渐入上浮
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

const CharsPop: React.FC<{
  text: string; hi?: string; hiColor?: string; size: number; baseDelay?: number; color?: string;
}> = ({text, hi, hiColor = ORANGE, size, baseDelay = 0, color = INK}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const i = hi ? text.indexOf(hi) : -1;
  const pre = i >= 0 ? text.slice(0, i) : text;
  const mid = i >= 0 ? hi! : "";
  const post = i >= 0 ? text.slice(i + hi!.length) : "";
  let idx = 0;
  const render = (s: string, c: string) =>
    s.split("").map((ch, k) => {
      const d = baseDelay + idx++ * 2;
      const sp = spring({frame: frame - d, fps, config: {damping: 14, stiffness: 200}});
      return (
        <span key={`${k}-${idx}`} style={{
          color: c, display: "inline-block", opacity: sp,
          transform: `translateY(${(1 - sp) * 26}px)`,
        }}>{ch}</span>
      );
    });
  return (
    <div style={{fontSize: size, fontWeight: 900, fontFamily: YAHEI, letterSpacing: 6, whiteSpace: "nowrap"}}>
      {render(pre, color)}
      {mid ? render(mid, hiColor) : null}
      {render(post, color)}
    </div>
  );
};

const TypeTokens: React.FC<{
  tokens: {t: string; c: string}[]; start: number; cps?: number; fontSize?: number; active?: boolean;
}> = ({tokens, start, cps = 0.9, fontSize = 32, active = true}) => {
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

// 终端：居中大窗，手机可读的大号加粗字体
const Terminal: React.FC<{
  x: number; y: number; w: number; title: string; children: React.ReactNode; shakeAt?: number; delay?: number;
}> = ({x, y, w, title, children, shakeAt = -1, delay = 0}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const sp = spring({frame: frame - delay, fps, config: {damping: 17, stiffness: 130}});
  const sh = shakeAmp(frame, shakeAt);
  return (
    <div style={{
      position: "absolute", left: x, top: y, width: w,
      opacity: interpolate(sp, [0, 1], [0, 1]),
      transform: `translateY(${(1 - sp) * 44}px) translateX(${sh}px)`,
    }}>
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
        <div style={{padding: "42px 50px"}}>{children}</div>
      </div>
    </div>
  );
};

const ExitBadge: React.FC<{code: string; at: number; fontSize?: number}> = ({code, at, fontSize = 34}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const sp = spring({frame: frame - at, fps, config: {damping: 11, stiffness: 190}});
  const pulse = 1 + Math.sin(Math.max(0, frame - at) / 5) * 0.05;
  return (
    <span style={{
      display: "inline-block",
      transform: `scale(${sp * pulse})`,
      backgroundColor: RED_BG, border: `3px solid ${RED}`, color: RED,
      padding: "4px 18px", borderRadius: 12,
      fontSize, fontFamily: MONO, fontWeight: 900,
    }}>{code}</span>
  );
};

// 对称双卡：等宽居中，橙色左边条
const InfoCard: React.FC<{
  x: number; y: number; w: number; delay: number; title: React.ReactNode; lines: string[];
}> = ({x, y, w, delay, title, lines}) => (
  <SlideIn delay={delay} from={70} style={{position: "absolute", left: x, top: y, width: w}}>
    <div style={{
      backgroundColor: CARD, borderRadius: 16, border: `2px solid ${BORDER}`,
      borderLeft: `6px solid ${ORANGE}`,
      boxShadow: "0 12px 30px rgba(0,0,0,0.3)", padding: "30px 38px",
    }}>
      <div style={{fontSize: 34, fontWeight: 900, color: INK, fontFamily: YAHEI, marginBottom: 12, whiteSpace: "nowrap"}}>{title}</div>
      {lines.map((l, i) => (
        <div key={i} style={{fontSize: 30, color: SUB, fontFamily: YAHEI, lineHeight: 1.6, whiteSpace: "nowrap"}}>{l}</div>
      ))}
    </div>
  </SlideIn>
);

// 居中标题：编号方块 + 标题 + 小字说明
const Head: React.FC<{n: string; title: React.ReactNode; sub: string}> = ({n, title, sub}) => (
  <Pop delay={2} style={{position: "absolute", top: 54, left: 0, right: 0, textAlign: "center"}}>
    <div style={{display: "flex", justifyContent: "center", alignItems: "center", gap: 26}}>
      <div style={{
        width: 66, height: 66, borderRadius: 16, backgroundColor: ORANGE_D, color: "#fff",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 36, fontWeight: 900, fontFamily: MONO, boxShadow: "0 8px 20px rgba(0,0,0,0.3)",
      }}>{n}</div>
      <div style={{fontSize: 56, fontWeight: 900, color: INK, fontFamily: YAHEI, letterSpacing: 2, whiteSpace: "nowrap"}}>{title}</div>
    </div>
    <div style={{fontSize: 29, color: SUB, fontFamily: YAHEI, marginTop: 16, letterSpacing: 4}}>{sub}</div>
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
  const cur = subs.find((s) => frame >= s.s && frame < s.e);
  if (!cur) return null;
  const sp = spring({frame: frame - cur.s, fps: 30, config: {damping: 16, stiffness: 200}});
  return (
    <div style={{position: "absolute", bottom: 36, left: 0, right: 0, display: "flex", justifyContent: "center", pointerEvents: "none"}}>
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

const Rings: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <>
      {[0, 22].map((o) => {
        const p = (((frame - o) % 46) + 46) % 46 / 46;
        return (
          <div key={o} style={{
            position: "absolute", left: "50%", top: "50%", width: 230, height: 230,
            marginLeft: -115, marginTop: -115, borderRadius: 999,
            border: `5px solid ${ORANGE}`, opacity: (1 - p) * 0.55,
            transform: `scale(${1 + p * 0.9})`,
          }} />
        );
      })}
    </>
  );
};

// ---------- 场景 ----------

// 开场即完整封面：第 0 帧所有元素就在画面上，不做入场动画
const SceneHook: React.FC = () => (
  <SceneWrap instant>
    <AbsoluteFill>
      <div style={{position: "absolute", top: 236, left: 0, right: 0, display: "flex", justifyContent: "center"}}>
        <div style={{fontSize: 104, fontWeight: 900, fontFamily: YAHEI, letterSpacing: 6, whiteSpace: "nowrap", color: INK}}>
          容器一起就<span style={{color: RED}}>秒退</span>？
        </div>
      </div>
      <div style={{position: "absolute", top: 452, left: 0, right: 0, textAlign: "center"}}>
        <div style={{fontSize: 42, color: SUB, fontFamily: YAHEI, letterSpacing: 8, whiteSpace: "nowrap"}}>别急着删掉重装</div>
      </div>
      <div style={{position: "absolute", top: 588, left: 0, right: 0, display: "flex", justifyContent: "center"}}>
        <div style={{
          backgroundColor: ORANGE_D, color: "#fff", borderRadius: 999, padding: "18px 62px",
          fontSize: 40, fontWeight: 900, fontFamily: YAHEI, letterSpacing: 10,
          boxShadow: "0 16px 36px rgba(0,0,0,0.35)", whiteSpace: "nowrap",
        }}>3 步定位问题</div>
      </div>
      <div style={{position: "absolute", top: 812, left: 0, right: 0, textAlign: "center"}}>
        <div style={{fontSize: 30, color: SUB, fontFamily: YAHEI, letterSpacing: 3, whiteSpace: "nowrap"}}>小秋 · 0 基础也能学会</div>
      </div>
    </AbsoluteFill>
  </SceneWrap>
);

const SceneStep1: React.FC = () => (
  <SceneWrap>
    <AbsoluteFill>
      <Head n="1" title={<>docker ps -a <span style={{color: ORANGE}}>看退出码</span></>} sub="第一步：先看状态，别瞎猜" />
      <Terminal x={160} y={228} w={1600} title="xiaoqiu@dev: ~" shakeAt={92} delay={4}>
        <TypeTokens tokens={[{t: "$ ", c: ORANGE}, {t: "docker ps -a", c: INK}]} start={14} cps={0.55} fontSize={46} active={false} />
        <FadeUp at={46} style={{fontSize: 30, fontFamily: MONO, color: SUB, fontWeight: 700, marginTop: 34, whiteSpace: "pre", lineHeight: 2.2}}>
          {"CONTAINER ID    IMAGE     STATUS"}
        </FadeUp>
        <FadeUp at={64} style={{fontSize: 32, fontFamily: MONO, color: INK, fontWeight: 700, whiteSpace: "pre", lineHeight: 2.2}}>
          {"a1b2c3d4e5      myapp     "}
          <ExitBadge code="Exited (1)" at={84} />
        </FadeUp>
      </Terminal>
      <InfoCard x={210} y={700} w={700} delay={104}
        title={<span><span style={{fontFamily: MONO, color: RED}}>Exited (1)</span> = 程序自己报错</span>}
        lines={["最常见原因：配置路径写错"]} />
      <InfoCard x={1010} y={700} w={700} delay={194}
        title={<span><span style={{fontFamily: MONO, color: ORANGE}}>Exited (137)</span> = 内存不够</span>}
        lines={["内存超限，被系统直接杀掉（OOM）"]} />
    </AbsoluteFill>
  </SceneWrap>
);

const LOG_LINES: {t: string; at: number; c: string; hl?: boolean}[] = [
  {t: "[10:23:01] starting myapp...", at: 48, c: SUB},
  {t: "[10:23:01] connect db ...... ok", at: 62, c: SUB},
  {t: "[10:23:02] load config from /app/", at: 76, c: SUB},
  {t: "Error: Cannot find module '/app/config.yml'", at: 96, c: RED, hl: true},
];

const SceneStep2: React.FC = () => {
  const frame = useCurrentFrame();
  const sweep = interpolate(frame, [96, 110], [0, 1], {extrapolateLeft: "clamp", extrapolateRight: "clamp"});
  return (
    <SceneWrap>
      <AbsoluteFill>
        <Head n="2" title={<>docker logs <span style={{color: ORANGE}}>看日志</span></>} sub="答案就在最后几行" />
        <Terminal x={160} y={228} w={1600} title="xiaoqiu@dev: ~" delay={4}>
          <TypeTokens tokens={[{t: "$ ", c: ORANGE}, {t: "docker logs myapp", c: INK}]} start={12} cps={0.55} fontSize={46} active={false} />
          <div style={{marginTop: 30}}>
            {LOG_LINES.map((l, i) => {
              const a = interpolate(frame, [l.at, l.at + 8], [0, 1], {extrapolateLeft: "clamp", extrapolateRight: "clamp"});
              if (a <= 0) return null;
              return (
                <div key={i} style={{
                  fontSize: 32, fontFamily: MONO, fontWeight: 700, lineHeight: 1.9, whiteSpace: "pre",
                  opacity: a, transform: `translateX(${(1 - a) * -26}px)`,
                }}>
                  {l.hl ? (
                    <span style={{position: "relative", display: "inline-block"}}>
                      <span style={{
                        position: "absolute", left: -10, right: -10, top: 3, bottom: 3,
                        backgroundColor: RED_BG, borderRadius: 8,
                        transform: `scaleX(${sweep})`, transformOrigin: "left",
                      }} />
                      <span style={{position: "relative", color: RED, fontWeight: 900}}>{l.t}</span>
                    </span>
                  ) : (
                    <span style={{color: l.c}}>{l.t}</span>
                  )}
                </div>
              );
            })}
          </div>
        </Terminal>
        <InfoCard x={210} y={780} w={700} delay={100}
          title="答案 99% 在最后几行"
          lines={["报错行一般带 Error 字样"]} />
        <InfoCard x={1010} y={780} w={700} delay={150}
          title={<span>日志太长？<span style={{fontFamily: MONO, color: ORANGE}}> --tail 20</span></span>}
          lines={["docker logs --tail 20 myapp", "只看最后 20 行，一眼定位"]} />
      </AbsoluteFill>
    </SceneWrap>
  );
};

const SceneStep3: React.FC = () => {
  const frame = useCurrentFrame();
  const strike = interpolate(frame, [48, 60], [0, 1], {extrapolateLeft: "clamp", extrapolateRight: "clamp"});
  return (
    <SceneWrap>
      <AbsoluteFill>
        <Head n="3" title={<>去掉 <span style={{fontFamily: MONO, color: RED}}>-d</span> 前台跑</>} sub="报错直接打在脸上" />
        <Terminal x={160} y={228} w={1600} title="xiaoqiu@dev: ~" shakeAt={130} delay={4}>
          <span style={{position: "relative", display: "inline-block"}}>
            <TypeTokens tokens={[{t: "$ ", c: ORANGE}, {t: "docker run -d myapp", c: SUB}]} start={6} cps={0.55} fontSize={42} active={false} />
            <span style={{
              position: "absolute", left: 0, top: "55%", height: 7, width: "100%",
              backgroundColor: RED, borderRadius: 4,
              transform: `scaleX(${strike})`, transformOrigin: "left",
            }} />
          </span>
          <div style={{marginTop: 26}}>
            <TypeTokens tokens={[{t: "$ ", c: ORANGE}, {t: "docker run myapp", c: INK}]} start={66} cps={0.55} fontSize={46} active={false} />
          </div>
          {frame >= 118 ? (
            <div style={{marginTop: 30, fontSize: 32, fontFamily: MONO, fontWeight: 900}}>
              <span style={{
                color: RED, backgroundColor: RED_BG, border: `2px solid ${RED}`,
                padding: "8px 20px", borderRadius: 10, display: "inline-block",
                transform: `translateX(${shakeAmp(frame, 130, 5, 14)}px)`,
              }}>Error: Cannot find module '/app/config.yml'</span>
            </div>
          ) : null}
        </Terminal>
        <InfoCard x={210} y={700} w={700} delay={22}
          title={<span><span style={{fontFamily: MONO, color: ORANGE}}>-d</span> = 挂在后台跑</span>}
          lines={["报错被吞掉，你以为它没事"]} />
        <InfoCard x={1010} y={700} w={700} delay={118}
          title="去掉 -d 前台一跑"
          lines={["藏着的报错直接打在脸上"]} />
      </AbsoluteFill>
    </SceneWrap>
  );
};

const ScenePitfall: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const stamp = spring({frame: frame - 40, fps, config: {damping: 10, stiffness: 200}});
  return (
    <SceneWrap>
      <AbsoluteFill>
        <Head n="!" title="最常见的新手操作" sub="一出问题就删掉重装？" />
        <div style={{position: "absolute", top: 310, left: 0, right: 0, display: "flex", justifyContent: "center"}}>
          <div style={{
            transform: `rotate(-3deg) scale(${stamp})`,
            opacity: interpolate(stamp, [0, 1], [0, 1]),
          }}>
            <div style={{
              border: `5px dashed ${RED}`, borderRadius: 20, backgroundColor: CARD,
              padding: "30px 64px", fontSize: 62, fontFamily: MONO, fontWeight: 900, color: RED,
              boxShadow: "0 14px 34px rgba(0,0,0,0.3)", whiteSpace: "nowrap",
            }}>docker rm myapp</div>
          </div>
        </div>
        <Pop delay={78} style={{position: "absolute", top: 540, left: 0, right: 0, textAlign: "center"}}>
          <div style={{fontSize: 88, fontWeight: 900, fontFamily: YAHEI, color: INK, whiteSpace: "nowrap"}}>
            ＝ <span style={{color: RED}}>删证据</span>
          </div>
        </Pop>
        <SlideIn delay={98} from={70} style={{position: "absolute", top: 724, left: 0, right: 0, display: "flex", justifyContent: "center"}}>
          <div style={{
            backgroundColor: CARD, borderRadius: 16, border: `2px solid ${BORDER}`,
            borderLeft: `6px solid ${ORANGE}`, boxShadow: "0 12px 30px rgba(0,0,0,0.3)",
            padding: "30px 48px", width: 940,
          }}>
            <div style={{fontSize: 33, fontWeight: 900, color: INK, fontFamily: YAHEI, marginBottom: 10}}>日志就是线索</div>
            <div style={{fontSize: 30, color: SUB, fontFamily: YAHEI, whiteSpace: "nowrap"}}>重装容器 = 毁灭现场，先看 logs 再动手</div>
          </div>
        </SlideIn>
      </AbsoluteFill>
    </SceneWrap>
  );
};

const SceneSummary: React.FC = () => (
  <SceneWrap>
    <AbsoluteFill>
      <Head n="✓" title="三步速查表" sub="截图保存，排错直接对照" />
      {[
        {y: 292, n: "1", cmd: "docker ps -a", t: "看状态和退出码", at: 8},
        {y: 476, n: "2", cmd: "docker logs", t: "看最后几行日志", at: 64},
        {y: 660, n: "3", cmd: "docker run myapp", t: "去掉 -d 前台跑验证", at: 114},
      ].map((r, i) => (
        <SlideIn key={i} delay={r.at} from={-90} style={{position: "absolute", left: 260, top: r.y, width: 1400}}>
          <div style={{
            backgroundColor: i % 2 === 0 ? TINT : CARD, borderRadius: 18,
            border: `2px solid ${BORDER}`, padding: "26px 40px",
            display: "flex", alignItems: "center", gap: 30,
          }}>
            <div style={{
              width: 60, height: 60, borderRadius: 999, backgroundColor: ORANGE_D, color: "#fff",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 32, fontWeight: 900, fontFamily: YAHEI, flexShrink: 0,
            }}>{r.n}</div>
            <div style={{fontSize: 42, fontFamily: MONO, fontWeight: 800, color: INK, whiteSpace: "pre"}}>{r.cmd}</div>
            <div style={{marginLeft: "auto", fontSize: 32, fontFamily: YAHEI, fontWeight: 700, color: ORANGE, whiteSpace: "nowrap"}}>{r.t}</div>
          </div>
        </SlideIn>
      ))}
    </AbsoluteFill>
  </SceneWrap>
);

const SceneOutro: React.FC = () => {
  const frame = useCurrentFrame();
  const wob = Math.sin(frame / 9) * 7;
  return (
    <SceneWrap>
      <AbsoluteFill>
        <div style={{position: "absolute", top: 258, left: 0, right: 0, display: "flex", justifyContent: "center"}}>
          <CharsPop text="学会了就点个赞！" hi="点个赞" size={92} baseDelay={6} />
        </div>
        <div style={{position: "absolute", top: 430, left: "50%", marginLeft: -130, width: 260, height: 260}}>
          <Rings />
          <div style={{
            position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center",
            transform: `rotate(${wob}deg)`,
          }}>
            <span style={{fontSize: 140}}>👍</span>
          </div>
        </div>
        <Pop delay={66} style={{position: "absolute", top: 748, left: 0, right: 0, textAlign: "center"}}>
          <div style={{fontSize: 40, color: SUB, fontFamily: YAHEI, letterSpacing: 3, whiteSpace: "nowrap"}}>
            下期：<span style={{color: ORANGE, fontWeight: 900}}>进容器内部排查 exec</span>
          </div>
        </Pop>
        <Pop delay={84} style={{position: "absolute", top: 856, left: 0, right: 0, textAlign: "center"}}>
          <div style={{fontSize: 30, color: SUB, fontFamily: YAHEI, letterSpacing: 3, whiteSpace: "nowrap"}}>
            小秋 · 0 基础也能学会
          </div>
        </Pop>
      </AbsoluteFill>
    </SceneWrap>
  );
};

// ---------- 组装 ----------

const scenes = [
  {start: 0, end: 176, C: SceneHook},
  {start: 181, end: 481, C: SceneStep1},
  {start: 487, end: 684, C: SceneStep2},
  {start: 689, end: 877, C: SceneStep3},
  {start: 882, end: 1030, C: ScenePitfall},
  {start: 1036, end: 1228, C: SceneSummary},
  {start: 1234, end: 1366, C: SceneOutro},
];

export const DockerExitTroubleshoot: React.FC = () => {
  const frame = useCurrentFrame();
  const bedVolume = interpolate(frame, [0, 20, DUR - 40, DUR - 6], [0, 0.08, 0.08, 0], {
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
      {/* 顶部橙色进度条 + 右上角个人标识 */}
      <div style={{
        position: "absolute", top: 0, left: 0, height: 6, backgroundColor: ORANGE,
        width: `${(frame / DUR) * 100}%`, zIndex: 10,
      }} />
      <CornerMark />
      {voiceLines.map((s) => (
        <Sequence key={`vo-${s.index}`} from={s.start} durationInFrames={s.end - s.start + 30}>
          <Audio src={staticFile(`audio/docker-exit-tts/${s.audio}`)} volume={1} />
        </Sequence>
      ))}
      <Sequence from={60} durationInFrames={30}>
        <Audio src={staticFile("audio/sfx/click.wav")} volume={0.22} />
      </Sequence>
      <Sequence from={66} durationInFrames={26}>
        <Audio src={staticFile("audio/sfx/error.wav")} volume={0.2} />
      </Sequence>
      <Sequence from={917} durationInFrames={26}>
        <Audio src={staticFile("audio/sfx/error.wav")} volume={0.22} />
      </Sequence>
      <Sequence from={1310} durationInFrames={40}>
        <Audio src={staticFile("audio/sfx/success.wav")} volume={0.32} />
      </Sequence>
      <Audio src={staticFile("audio/bed.wav")} loop volume={() => bedVolume} />
      <Subtitle />
    </AbsoluteFill>
  );
};
