import {Audio} from "@remotion/media";
import {
  AbsoluteFill, interpolate, Sequence, spring, staticFile, useCurrentFrame, useVideoConfig,
} from "remotion";

// ---------- palette（深蓝灰 + 橙，横屏 1920x1080）----------
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

// 语音终点 1891 帧 + 48 帧呼吸收尾（outro 压句尾 43 帧快淡）
export const DUR = 1933;

const voiceLines = [
  {index: 1, audio: "s01.mp3", start: 0, end: 89},
  {index: 2, audio: "s02.mp3", start: 95, end: 364},
  {index: 3, audio: "s03.mp3", start: 370, end: 520},
  {index: 4, audio: "s04.mp3", start: 526, end: 702},
  {index: 5, audio: "s05.mp3", start: 707, end: 829},
  {index: 6, audio: "s06.mp3", start: 835, end: 940},
  {index: 7, audio: "s07.mp3", start: 946, end: 1204},
  {index: 8, audio: "s08.mp3", start: 1209, end: 1524},
  {index: 9, audio: "s09.mp3", start: 1530, end: 1891},
];

type Sub = {s: number; e: number; t: string};
const subs: Sub[] = [
  {s: 3, e: 59, t: "ZCode 可能把你的 Git 历史"},
  {s: 61, e: 95, t: "全打包上传了"},
  {s: 97, e: 147, t: "有开发者做了独立取证"},
  {s: 149, e: 202, t: "四万多个文件的快照清单里"},
  {s: 204, e: 266, t: "百分之八十六都是 git 目录"},
  {s: 268, e: 322, t: "完整提交历史 大文件"},
  {s: 324, e: 364, t: "连每一步操作记录都在"},
  {s: 372, e: 424, t: "ZCode 官方已经道歉"},
  {s: 426, e: 487, t: "仓库快照上传的问题已修复"},
  {s: 489, e: 520, t: "还承诺将开源"},
  {s: 528, e: 571, t: "问题出在哪"},
  {s: 573, e: 621, t: "它生成 wiki 页面时"},
  {s: 623, e: 684, t: "会把整个工作区打包成快照"},
  {s: 686, e: 702, t: "传上去"},
  {s: 710, e: 769, t: "你以为只是让它补全一行代码"},
  {s: 771, e: 799, t: "其实整个项目"},
  {s: 801, e: 829, t: "都出门旅行了一圈"},
  {s: 837, e: 877, t: "而你以为删掉的代码"},
  {s: 879, e: 914, t: "以前提交过的历史"},
  {s: 916, e: 940, t: "都还留在快照里"},
  {s: 948, e: 979, t: "更有人实测"},
  {s: 981, e: 1059, t: "把设置里的开关全关了 根本没用"},
  {s: 1061, e: 1117, t: "上传模块一启动就加载"},
  {s: 1119, e: 1166, t: "还有人被安全软件抓到"},
  {s: 1168, e: 1204, t: "传了四十三个G"},
  {s: 1212, e: 1253, t: "现在就三个动作"},
  {s: 1255, e: 1303, t: "把客户端升到修复版"},
  {s: 1305, e: 1359, t: "旧版本别登录公司项目"},
  {s: 1361, e: 1454, t: "用任何 AI 编程工具前 先问三句"},
  {s: 1456, e: 1524, t: "传什么 什么时候传 能不能关"},
  {s: 1533, e: 1558, t: "记住这句"},
  {s: 1560, e: 1644, t: "代码去哪 不该由工具默认决定"},
  {s: 1646, e: 1753, t: "你的 AI 编程工具 隐私设置查过吗"},
  {s: 1755, e: 1798, t: "评论区告诉我"},
  {s: 1800, e: 1798, t: "更多 AI 工具的内幕拆解 去主页合集"},
];

// ---------- 动画原语（DockerExitTroubleshoot 同款）----------

const shakeAmp = (frame: number, at: number, amp = 9, span = 18) => {
  const t = frame - at;
  if (at < 0 || t < 0 || t > span) return 0;
  return Math.sin(t * 2.2) * amp * (1 - t / span);
};

const SceneWrap: React.FC<{children: React.ReactNode; instant?: boolean}> = ({children, instant}) => {
  const frame = useCurrentFrame();
  const op = 1;
  const tx = 0;
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
        <div style={{padding: "38px 50px"}}>{children}</div>
      </div>
    </div>
  );
};

// 砸落印章（官方公告的"已修复 / 将开源"）
const Stamp: React.FC<{text: string; at: number; color?: string; rotate?: number}> = ({
  text, at, color = ORANGE, rotate = -6,
}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const sp = spring({frame: frame - at, fps, config: {damping: 10, stiffness: 210}});
  return (
    <span style={{
      display: "inline-block",
      transform: `rotate(${rotate}deg) scale(${interpolate(sp, [0, 1], [1.8, 1])})`,
      opacity: interpolate(sp, [0, 0.6], [0, 1], {extrapolateRight: "clamp"}),
      border: `4px solid ${color}`, color, borderRadius: 14,
      padding: "6px 26px", fontSize: 40, fontWeight: 900, fontFamily: YAHEI,
      backgroundColor: "rgba(0,0,0,0.25)", boxShadow: "0 10px 26px rgba(0,0,0,0.35)",
    }}>{text}</span>
  );
};

const InfoCard: React.FC<{
  x: number; y: number; w: number; delay: number; title: React.ReactNode; lines: string[];
}> = ({x, y, w, delay, title, lines}) => (
  <SlideIn delay={delay} from={70} style={{position: "absolute", left: x, top: y, width: w}}>
    <div style={{
      backgroundColor: CARD, borderRadius: 16, border: `2px solid ${BORDER}`,
      borderLeft: `6px solid ${ORANGE}`,
      boxShadow: "0 12px 30px rgba(0,0,0,0.3)", padding: "28px 36px",
    }}>
      <div style={{fontSize: 33, fontWeight: 900, color: INK, fontFamily: YAHEI, marginBottom: 10, whiteSpace: "nowrap"}}>{title}</div>
      {lines.map((l, i) => (
        <div key={i} style={{fontSize: 29, color: SUB, fontFamily: YAHEI, lineHeight: 1.6, whiteSpace: "nowrap"}}>{l}</div>
      ))}
    </div>
  </SlideIn>
);

const Head: React.FC<{n: string; title: React.ReactNode; sub: string}> = ({n, title, sub}) => (
  <div style={{position: "absolute", top: 54, left: 0, right: 0, textAlign: "center"}}>
    <div style={{display: "flex", justifyContent: "center", alignItems: "center", gap: 26}}>
      <div style={{
        width: 66, height: 66, borderRadius: 16, backgroundColor: ORANGE_D, color: "#fff",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 36, fontWeight: 900, fontFamily: MONO, boxShadow: "0 8px 20px rgba(0,0,0,0.3)",
      }}>{n}</div>
      <div style={{fontSize: 56, fontWeight: 900, color: INK, fontFamily: YAHEI, letterSpacing: 2, whiteSpace: "nowrap"}}>{title}</div>
    </div>
    <div style={{fontSize: 29, color: SUB, fontFamily: YAHEI, marginTop: 16, letterSpacing: 4}}>{sub}</div>
  </div>
);

const CornerMark: React.FC = () => (
  <div style={{
    position: "absolute", top: 64, right: 84, fontSize: 26, color: SUB,
    fontFamily: YAHEI, fontWeight: 700, letterSpacing: 4,
  }}>全栈小秋</div>
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

// 数字滚动（43GB 计数）
const CountUp: React.FC<{to: number; from: number; toF: number; suffix: string; fontSize?: number}> = ({
  from, toF, to, suffix, fontSize = 96,
}) => {
  const frame = useCurrentFrame();
  const v = interpolate(frame, [from, toF], [0, to], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
  });
  return (
    <span style={{fontSize, fontWeight: 900, fontFamily: MONO, color: RED, whiteSpace: "nowrap"}}>
      {Math.round(v)}<span style={{fontSize: fontSize * 0.55, marginLeft: 6}}>{suffix}</span>
    </span>
  );
};

// ---------- 场景 ----------

// 封面：第 0 帧完整静态（铁律③）
const SceneHook: React.FC = () => (
  <SceneWrap instant>
    <AbsoluteFill>
      <div style={{position: "absolute", top: 216, left: 0, right: 0, display: "flex", justifyContent: "center"}}>
        <div style={{fontSize: 100, fontWeight: 900, fontFamily: YAHEI, letterSpacing: 6, whiteSpace: "nowrap", color: INK}}>
          <span style={{fontFamily: MONO, color: RED}}>Git</span> 历史也<span style={{color: RED}}>上传</span>？
        </div>
      </div>
      <div style={{position: "absolute", top: 396, left: 0, right: 0, textAlign: "center"}}>
        <div style={{fontSize: 40, color: SUB, fontFamily: YAHEI, letterSpacing: 8, whiteSpace: "nowrap"}}>ZCode 事件 · 60 秒讲清</div>
      </div>
      <div style={{position: "absolute", top: 520, left: 0, right: 0, display: "flex", justifyContent: "center", gap: 60, alignItems: "center"}}>
        <div style={{
          backgroundColor: CARD, borderRadius: 16, border: `2px solid ${BORDER}`,
          padding: "24px 40px", textAlign: "center",
        }}>
          <div style={{fontSize: 34, fontWeight: 900, color: INK, fontFamily: YAHEI, marginBottom: 8}}>你的电脑</div>
          <div style={{fontSize: 27, color: SUB, fontFamily: MONO, whiteSpace: "nowrap"}}>my-project/ 全部文件</div>
        </div>
        <div style={{fontSize: 64, color: ORANGE, fontWeight: 900}}>→</div>
        <div style={{
          backgroundColor: RED_BG, borderRadius: 16, border: `2px solid ${RED}`,
          padding: "24px 40px", textAlign: "center",
        }}>
          <div style={{fontSize: 34, fontWeight: 900, color: RED, fontFamily: YAHEI, marginBottom: 8}}>云端服务器?</div>
          <div style={{fontSize: 27, color: SUB, fontFamily: MONO, whiteSpace: "nowrap"}}>workspace snapshot</div>
        </div>
      </div>
      <div style={{position: "absolute", top: 828, left: 0, right: 0, textAlign: "center"}}>
        <div style={{fontSize: 30, color: SUB, fontFamily: YAHEI, letterSpacing: 3, whiteSpace: "nowrap"}}>全栈小秋 · 看懂 AI 编程</div>
      </div>
    </AbsoluteFill>
  </SceneWrap>
);

const SNAP_LINES: {t: string; at: number; hl?: boolean}[] = [
  {t: "  project/src/main.ts", at: 40},
  {t: "  project/.git/objects/...", at: 58, hl: true},
  {t: "  project/.git/logs/HEAD   (reflog)", at: 76, hl: true},
  {t: "  project/.git/lfs/objects/...", at: 94, hl: true},
];

const SceneForensics: React.FC = () => {
  const frame = useCurrentFrame();
  const sweep = interpolate(frame, [109, 119], [0, 1], {extrapolateLeft: "clamp", extrapolateRight: "clamp"});
  return (
    <SceneWrap>
      <AbsoluteFill>
        <Head n="!" title="独立取证" sub="有开发者逆向了客户端上传链路" />
        <Terminal x={160} y={210} w={1600} title="snapshot 清单（节选）" delay={-30}>
          <TypeTokens tokens={[{t: "$ ", c: ORANGE}, {t: "zcode workspace-snapshot --list", c: INK}]} start={0} cps={0.6} fontSize={40} active={false} />
          <div style={{marginTop: 22}}>
            {SNAP_LINES.map((l, i) => {
              const a = interpolate(frame, [l.at, l.at + 8], [0, 1], {extrapolateLeft: "clamp", extrapolateRight: "clamp"});
              if (a <= 0) return null;
              return (
                <div key={i} style={{
                  fontSize: 30, fontFamily: MONO, fontWeight: 700, lineHeight: 1.85, whiteSpace: "pre",
                  color: l.hl ? ORANGE : SUB, opacity: a, transform: `translateX(${(1 - a) * -26}px)`,
                }}>{l.t}</div>
              );
            })}
          </div>
          <div style={{marginTop: 18, display: "flex", alignItems: "center", gap: 24}}>
            <span style={{position: "relative", display: "inline-block"}}>
              <span style={{
                position: "absolute", left: -10, right: -10, top: 4, bottom: 4,
                backgroundColor: RED_BG, borderRadius: 8,
                transform: `scaleX(${sweep})`, transformOrigin: "left",
              }} />
              <span style={{position: "relative", fontSize: 72, fontWeight: 900, fontFamily: MONO, color: RED}}>86.6%</span>
            </span>
            <span style={{fontSize: 36, color: INK, fontWeight: 900, fontFamily: YAHEI}}>都是 <span style={{fontFamily: MONO, color: ORANGE}}>.git</span> 目录</span>
            <span style={{fontSize: 26, color: SUB, fontFamily: MONO, marginLeft: "auto"}}>42,411 files</span>
          </div>
        </Terminal>
        <InfoCard x={210} y={790} w={700} delay={170}
          title="完整提交历史" lines={["每一次 commit 都在快照里"]} />
        <InfoCard x={1010} y={790} w={700} delay={226}
          title="大文件 + 操作记录" lines={["LFS 大文件、reflog 全都有"]} />
      </AbsoluteFill>
    </SceneWrap>
  );
};

const SceneResponse: React.FC = () => (
  <SceneWrap>
    <AbsoluteFill>
      <Head n="官" title="官方回应" sub="ZCode 已就此事致歉" />
      <div style={{position: "absolute", top: 250, left: 0, right: 0, display: "flex", justifyContent: "center"}}>
        <div style={{
          backgroundColor: CARD, borderRadius: 18, border: `2px solid ${BORDER}`,
          boxShadow: "0 16px 40px rgba(0,0,0,0.35)", padding: "44px 64px", width: 1100,
        }}>
          <div style={{fontSize: 40, fontWeight: 900, color: INK, fontFamily: YAHEI, lineHeight: 1.7}}>
            Repo Wiki 生成时，<span style={{color: RED}}>可能触发仓库数据上传</span>
          </div>
          <div style={{fontSize: 40, fontWeight: 900, color: INK, fontFamily: YAHEI, lineHeight: 1.7, marginTop: 14}}>
            且该功能上线初期<span style={{color: RED}}>默认开启</span>
          </div>
          <div style={{marginTop: 26, fontSize: 27, color: SUB, fontFamily: YAHEI, whiteSpace: "nowrap"}}>
            来源：ZCode 官方公告
          </div>
        </div>
      </div>
      <div style={{position: "absolute", top: 640, left: 0, right: 0, display: "flex", justifyContent: "center", gap: 90}}>
        <Stamp text="已修复" at={56} />
        <Stamp text="将开源" at={119} color={ORANGE} rotate={5} />
      </div>
      <Pop delay={120} style={{position: "absolute", top: 800, left: 0, right: 0, textAlign: "center"}}>
        <div style={{fontSize: 36, color: SUB, fontFamily: YAHEI, whiteSpace: "nowrap"}}>
          但在修复之前——你的仓库经历了什么？
        </div>
      </Pop>
    </AbsoluteFill>
  </SceneWrap>
);

const NODES = [
  {x: 130, title: "你的电脑", sub: "my-project/ 全部文件", mono: "~/my-project", at: -30, icon: "📁"},
  {x: 730, title: "打包快照", sub: "整个工作区 → 快照", mono: "snapshot.zip", at: 96, icon: "📦"},
  {x: 1330, title: "云端服务器", sub: "生成 Wiki 页面", mono: "cloud storage", at: 152, icon: "☁"},
];

const SceneHow: React.FC = () => (
  <SceneWrap>
    <AbsoluteFill>
      <Head n="?" title="代码是怎么出门的" sub="AI 补全的工作原理" />
      {NODES.map((nd, i) => (
        <SlideIn key={i} delay={nd.at} from={i === 2 ? 90 : -70} style={{position: "absolute", left: nd.x, top: 350, width: 460}}>
          <div style={{
            backgroundColor: i === 2 ? RED_BG : CARD, borderRadius: 18,
            border: `2px solid ${i === 2 ? RED : BORDER}`, padding: "30px 34px", textAlign: "center",
            boxShadow: "0 12px 30px rgba(0,0,0,0.3)",
          }}>
            <div style={{fontSize: 58, marginBottom: 10}}>{nd.icon}</div>
            <div style={{fontSize: 36, fontWeight: 900, color: i === 2 ? RED : INK, fontFamily: YAHEI, marginBottom: 8}}>{nd.title}</div>
            <div style={{fontSize: 26, color: SUB, fontFamily: YAHEI, whiteSpace: "nowrap"}}>{nd.sub}</div>
            <div style={{fontSize: 24, color: SUB, fontFamily: MONO, marginTop: 10, whiteSpace: "nowrap"}}>{nd.mono}</div>
          </div>
        </SlideIn>
      ))}
      <Pop delay={40} style={{position: "absolute", top: 470, left: 585}}>
        <div style={{fontSize: 70, color: ORANGE, fontWeight: 900}}>→</div>
      </Pop>
      <Pop delay={140} style={{position: "absolute", top: 470, left: 1185}}>
        <div style={{fontSize: 70, color: ORANGE, fontWeight: 900}}>→</div>
      </Pop>
      <SlideIn delay={168} from={60} style={{position: "absolute", top: 760, left: 0, right: 0, display: "flex", justifyContent: "center"}}>
        <div style={{
          backgroundColor: TINT, borderRadius: 14, padding: "20px 44px",
          fontSize: 32, color: INK, fontWeight: 700, fontFamily: YAHEI, whiteSpace: "nowrap",
        }}>
          上下文 = 你正在写的文件 <span style={{color: ORANGE}}>+ 整个项目的相关代码</span>
        </div>
      </SlideIn>
    </AbsoluteFill>
  </SceneWrap>
);

const SceneTrip: React.FC = () => {
  const frame = useCurrentFrame();
  // 代码块飞出去（0-60）→ 补全气泡飞回来（66-110）
  const out = interpolate(frame, [4, 54], [0, 1], {extrapolateLeft: "clamp", extrapolateRight: "clamp"});
  const back = interpolate(frame, [66, 104], [0, 1], {extrapolateLeft: "clamp", extrapolateRight: "clamp"});
  return (
    <SceneWrap>
      <AbsoluteFill>
        <Head n="→" title="出门旅行一圈" sub="你以为的“一次补全”" />
        <div style={{position: "absolute", top: 330, left: 150}}>
          <div style={{backgroundColor: CARD, borderRadius: 14, border: `2px solid ${BORDER}`, padding: "20px 30px"}}>
            <div style={{fontSize: 28, fontFamily: MONO, color: INK, whiteSpace: "pre"}}>{"def calc_price(items):"}</div>
          </div>
          <div style={{fontSize: 26, color: SUB, fontFamily: YAHEI, marginTop: 12, whiteSpace: "nowrap"}}>你的电脑</div>
        </div>
        <div style={{
          position: "absolute", top: 318, left: 150,
          opacity: frame < 72 ? out : 0,
          transform: `translateX(${out * 980}px) scale(${1 - out * 0.25})`,
        }}>
          <div style={{fontSize: 52}}>📦</div>
        </div>
        <div style={{position: "absolute", top: 330, left: 1420}}>
          <div style={{
            backgroundColor: RED_BG, borderRadius: 14, border: `2px solid ${RED}`, padding: "20px 30px",
          }}>
            <div style={{fontSize: 28, fontFamily: MONO, color: RED, whiteSpace: "pre"}}>{"☁ cloud model"}</div>
          </div>
          <div style={{fontSize: 26, color: SUB, fontFamily: YAHEI, marginTop: 12, whiteSpace: "nowrap"}}>云端</div>
        </div>
        {frame >= 66 ? (
          <div style={{
            position: "absolute", top: 560, left: 420,
            opacity: back,
            transform: `translateX(${(1 - back) * -700}px)`,
          }}>
            <div style={{
              backgroundColor: TINT, borderRadius: 14, border: `2px solid ${ORANGE}`, padding: "18px 30px",
            }}>
              <span style={{fontSize: 28, fontFamily: MONO, color: ORANGE, whiteSpace: "pre"}}>{"→ 建议补全: return sum(...)"}</span>
            </div>
          </div>
        ) : null}
        <Pop delay={104} style={{position: "absolute", top: 720, left: 0, right: 0, textAlign: "center"}}>
          <div style={{fontSize: 46, fontWeight: 900, fontFamily: YAHEI, color: INK, whiteSpace: "nowrap"}}>
            出门的不是一行代码 —— 是<span style={{color: RED}}>整个项目</span>
          </div>
        </Pop>
      </AbsoluteFill>
    </SceneWrap>
  );
};

const SceneDeleted: React.FC = () => {
  const frame = useCurrentFrame();
  const strike = interpolate(frame, [46, 58], [0, 1], {extrapolateLeft: "clamp", extrapolateRight: "clamp"});
  return (
    <SceneWrap>
      <AbsoluteFill>
        <Head n="✗" title="删掉的代码去哪了" sub="本地删了 ≠ 快照里没有" />
        <div style={{position: "absolute", top: 300, left: 0, right: 0, display: "flex", justifyContent: "center"}}>
          <span style={{position: "relative", display: "inline-block"}}>
            <span style={{fontSize: 54, fontFamily: MONO, color: SUB, fontWeight: 800, whiteSpace: "pre"}}>{"secret.key  (已删除)"}</span>
            <span style={{
              position: "absolute", left: 0, top: "55%", height: 7, width: "100%",
              backgroundColor: RED, borderRadius: 4,
              transform: `scaleX(${strike})`, transformOrigin: "left",
            }} />
          </span>
        </div>
        <div style={{position: "absolute", top: 440, left: 0, right: 0, display: "flex", justifyContent: "center", gap: 40}}>
          {["历史版本", "已删文件", "提交记录"].map((t, i) => (
            <Pop key={i} delay={60 + i * 14}>
              <div style={{
                backgroundColor: RED_BG, borderRadius: 12, border: `2px solid ${RED}`,
                padding: "12px 30px", fontSize: 32, fontWeight: 900, color: RED, fontFamily: YAHEI, whiteSpace: "nowrap",
              }}>{t} 还在快照里</div>
            </Pop>
          ))}
        </div>
        <Pop delay={78} style={{position: "absolute", top: 660, left: 0, right: 0, textAlign: "center"}}>
          <div style={{fontSize: 84, fontWeight: 900, fontFamily: YAHEI, color: INK, whiteSpace: "nowrap"}}>
            删掉 <span style={{color: RED, fontFamily: MONO}}>≠</span> 历史消失
          </div>
        </Pop>
      </AbsoluteFill>
    </SceneWrap>
  );
};

const SceneSwitch: React.FC = () => {
  const frame = useCurrentFrame();
  const shake = shakeAmp(frame, 118, 6, 20);
  return (
    <SceneWrap>
      <AbsoluteFill>
        <Head n="!" title="关了开关也没用" sub="实测结果" />
        {/* 大开关：OFF 但箭头照飞 */}
        <div style={{position: "absolute", top: 300, left: 250, transform: `translateX(${shake}px)`}}>
          <div style={{
            width: 260, height: 110, borderRadius: 999, backgroundColor: CARD,
            border: `4px solid ${RED}`, position: "relative",
          }}>
            <div style={{
              position: "absolute", left: 12, top: 9, width: 84, height: 84, borderRadius: 999,
              backgroundColor: RED,
            }} />
            <span style={{position: "absolute", right: 28, top: "50%", transform: "translateY(-50%)", fontSize: 34, fontWeight: 900, fontFamily: MONO, color: RED}}>OFF</span>
          </div>
          <div style={{fontSize: 30, color: SUB, fontFamily: YAHEI, marginTop: 18, whiteSpace: "nowrap", textAlign: "center"}}>设置里：已全部关闭</div>
        </div>
        {/* 上传小包持续上飘 */}
        <div style={{position: "absolute", top: 260, left: 620}}>
          {[0, 18, 36].map((o, i) => {
            const p = (((frame - o) % 54) + 54) % 54 / 54;
            return (
              <div key={i} style={{
                position: "absolute", left: i * 34, top: 120 - p * 200,
                fontSize: 30, opacity: (1 - p) * 0.9,
              }}>📦</div>
            );
          })}
          <div style={{fontSize: 30, color: RED, fontWeight: 900, fontFamily: YAHEI, whiteSpace: "nowrap", marginTop: 150, marginLeft: -20}}>
            ↑ 上传没停
          </div>
        </div>
        {/* 43GB 计数卡 */}
        <SlideIn delay={150} from={80} style={{position: "absolute", top: 300, left: 1080, width: 560}}>
          <div style={{
            backgroundColor: CARD, borderRadius: 18, border: `2px solid ${BORDER}`,
            boxShadow: "0 12px 30px rgba(0,0,0,0.3)", padding: "36px 44px", textAlign: "center",
          }}>
            <div style={{fontSize: 28, color: SUB, fontFamily: YAHEI, marginBottom: 10, whiteSpace: "nowrap"}}>安全软件抓到的上传记录</div>
            <CountUp from={173} toF={222} to={43} suffix="GB" />
          </div>
        </SlideIn>
        <Pop delay={200} style={{position: "absolute", top: 700, left: 0, right: 0, textAlign: "center"}}>
          <div style={{
            backgroundColor: TINT, borderRadius: 14, padding: "18px 40px", display: "inline-block",
          }}>
            <span style={{fontSize: 34, fontWeight: 900, color: INK, fontFamily: YAHEI, whiteSpace: "nowrap"}}>
              上传模块一启动就加载 —— 开关<span style={{color: RED}}>只是摆设</span>
            </span>
          </div>
        </Pop>
      </AbsoluteFill>
    </SceneWrap>
  );
};

const ACTIONS = [
  {n: "1", main: "把客户端升到修复版", note: "官方已修复", at: 10},
  {n: "2", main: "旧版本别登录公司项目", note: "尤其敏感代码", at: 96},
  {n: "3", main: "任何 AI 工具先问三句", note: "传什么 · 何时传 · 能否关", at: 152},
];

const SceneActions: React.FC = () => (
  <SceneWrap>
    <AbsoluteFill>
      <Head n="✓" title="现在就做三件事" sub="转发给也在用 AI 编程的朋友" />
      {ACTIONS.map((r, i) => (
        <SlideIn key={i} delay={r.at} from={-90} style={{position: "absolute", left: 260, top: 272 + i * 156, width: 1400}}>
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
            <div style={{fontSize: 42, fontFamily: YAHEI, fontWeight: 900, color: INK, whiteSpace: "nowrap"}}>{r.main}</div>
            <div style={{marginLeft: "auto", fontSize: 30, fontFamily: YAHEI, fontWeight: 700, color: ORANGE, whiteSpace: "nowrap"}}>{r.note}</div>
          </div>
        </SlideIn>
      ))}
      <div style={{position: "absolute", top: 780, left: 0, right: 0, display: "flex", justifyContent: "center", gap: 34}}>
        {["传什么?", "什么时候传?", "能不能关?"].map((t, i) => (
          <Pop key={i} delay={246 + i * 12}>
            <div style={{
              backgroundColor: RED_BG, borderRadius: 999, border: `2px solid ${RED}`,
              color: RED, fontSize: 30, fontWeight: 900, fontFamily: YAHEI, padding: "12px 34px", whiteSpace: "nowrap",
            }}>{t}</div>
          </Pop>
        ))}
      </div>
    </AbsoluteFill>
  </SceneWrap>
);

const SceneOutro: React.FC = () => {
  const frame = useCurrentFrame();
  const wob = Math.sin(frame / 9) * 7;
  return (
    <SceneWrap>
      <AbsoluteFill>
        <div style={{position: "absolute", top: 212, left: 0, right: 0, display: "flex", justifyContent: "center"}}>
          <div style={{fontSize: 96, fontWeight: 900, fontFamily: YAHEI, letterSpacing: 6, whiteSpace: "nowrap", color: INK}}>
            代码<span style={{color: ORANGE}}>去哪</span>？
          </div>
        </div>
        <Pop delay={66} style={{position: "absolute", top: 380, left: 0, right: 0, textAlign: "center"}}>
          <div style={{fontSize: 40, color: SUB, fontFamily: YAHEI, letterSpacing: 4, whiteSpace: "nowrap"}}>
            不该由工具<span style={{color: RED, fontWeight: 900}}>默认决定</span>
          </div>
        </Pop>
        <Pop delay={116} style={{position: "absolute", top: 500, left: 0, right: 0, textAlign: "center"}}>
          <div style={{fontSize: 42, color: INK, fontFamily: YAHEI, fontWeight: 700, whiteSpace: "nowrap"}}>
            你的 AI 编程工具，隐私设置查过吗？
          </div>
          <div style={{fontSize: 36, color: ORANGE, fontFamily: YAHEI, fontWeight: 900, marginTop: 16, whiteSpace: "nowrap"}}>
            评论区告诉我
          </div>
        </Pop>
        <div style={{position: "absolute", top: 680, left: "50%", marginLeft: -120, width: 240, height: 240}}>
          <Rings />
          <div style={{
            position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center",
            transform: `rotate(${wob}deg)`,
          }}>
            <div style={{
              backgroundColor: ORANGE_D, color: "#fff", borderRadius: 999, padding: "16px 34px",
              fontSize: 38, fontWeight: 900, fontFamily: YAHEI, letterSpacing: 4, whiteSpace: "nowrap",
              boxShadow: "0 14px 34px rgba(0,0,0,0.4)",
            }}>关注 全栈小秋</div>
          </div>
        </div>
        <Pop delay={270} style={{position: "absolute", top: 962, left: 0, right: 0, textAlign: "center"}}>
          <div style={{fontSize: 32, color: SUB, fontFamily: YAHEI, letterSpacing: 3, whiteSpace: "nowrap"}}>
            更多 AI 工具内幕 · 主页合集 · 全栈小秋 0 基础也能学会
          </div>
        </Pop>
      </AbsoluteFill>
    </SceneWrap>
  );
};

// ---------- 组装 ----------

const scenes = [
  {start: 0, end: 95, C: SceneHook},
  {start: 95, end: 370, C: SceneForensics},
  {start: 370, end: 526, C: SceneResponse},
  {start: 526, end: 707, C: SceneHow},
  {start: 707, end: 835, C: SceneTrip},
  {start: 835, end: 946, C: SceneDeleted},
  {start: 946, end: 1209, C: SceneSwitch},
  {start: 1209, end: 1530, C: SceneActions},
  {start: 1530, end: DUR, C: SceneOutro},
];

export const ZCodeUploadDark: React.FC = () => {
  const frame = useCurrentFrame();
  const bedVolume = interpolate(frame, [0, 20, DUR - 60, DUR - 14], [0, 0.08, 0.08, 0], {
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
        <Sequence key={`vo-${s.index}`} from={s.start} durationInFrames={s.end - s.start + 20}>
          <Audio src={staticFile(`audio/zcode-tts/${s.audio}`)} volume={1} />
        </Sequence>
      ))}
      {/* 音效：对齐画面动作，量保守档 */}
      <Sequence from={208} durationInFrames={26}>
        <Audio src={staticFile("audio/sfx/pop.wav")} volume={0.26} />
      </Sequence>
      <Sequence from={430} durationInFrames={26}>
        <Audio src={staticFile("audio/sfx/success.wav")} volume={0.28} />
      </Sequence>
      <Sequence from={466} durationInFrames={24}>
        <Audio src={staticFile("audio/sfx/ding.wav")} volume={0.22} />
      </Sequence>
      <Sequence from={712} durationInFrames={28}>
        <Audio src={staticFile("audio/sfx/fly3.wav")} volume={0.2} />
      </Sequence>
      <Sequence from={839} durationInFrames={24}>
        <Audio src={staticFile("audio/sfx/error.wav")} volume={0.22} />
      </Sequence>
      <Sequence from={950} durationInFrames={26}>
        <Audio src={staticFile("audio/sfx/alert.wav")} volume={0.24} />
      </Sequence>
      <Sequence from={1168} durationInFrames={30}>
        <Audio src={staticFile("audio/sfx/error.wav")} volume={0.26} />
      </Sequence>
      <Sequence from={1259} durationInFrames={22}>
        <Audio src={staticFile("audio/sfx/pop.wav")} volume={0.24} />
      </Sequence>
      <Sequence from={1544} durationInFrames={40}>
        <Audio src={staticFile("audio/sfx/success.wav")} volume={0.3} />
      </Sequence>
      {/* 结尾垫乐：压句尾起播、43 帧快淡（禁直铺 EOF） */}
      <Sequence from={1884} durationInFrames={49}>
        <Audio src={staticFile("audio/bed_outro.wav")} volume={(f) => interpolate(f, [0, 6, 36, 43], [0, 0.55, 0.55, 0], {extrapolateLeft: "clamp", extrapolateRight: "clamp"})} />
      </Sequence>
      <Audio src={staticFile("audio/bed.wav")} loop volume={() => bedVolume} />
      <Subtitle />
    </AbsoluteFill>
  );
};
