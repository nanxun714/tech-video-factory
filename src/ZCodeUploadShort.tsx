import {Audio} from "@remotion/media";
import {
  AbsoluteFill, interpolate, Sequence, spring, staticFile, useCurrentFrame, useVideoConfig,
} from "remotion";

// ---------- palette（深蓝灰 + 橙）----------
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

// 语音终点 1066 帧 + 42 帧呼吸（outro 压句尾 43 帧快淡）
export const DUR = 1044;

const voiceLines = [
  {index: 1, audio: "s01.mp3", start: 0, end: 146},
  {index: 2, audio: "s02.mp3", start: 151, end: 350},
  {index: 3, audio: "s03.mp3", start: 355, end: 541},
  {index: 4, audio: "s04.mp3", start: 547, end: 666},
  {index: 5, audio: "s05.mp3", start: 672, end: 811},
  {index: 6, audio: "s06.mp3", start: 816, end: 906},
  {index: 7, audio: "s07.mp3", start: 912, end: 1002},
];

type Sub = {s: number; e: number; t: string};
const subs: Sub[] = [
  {s: 3, e: 83, t: "你以为你只是在用 ZCode 写代码"},
  {s: 85, e: 114, t: "你的 Git 历史"},
  {s: 116, e: 152, t: "可能已经被上传了"},
  {s: 154, e: 189, t: "官方回应承认"},
  {s: 191, e: 234, t: "生成 Wiki 页面时"},
  {s: 236, e: 292, t: "可能触发仓库数据上传"},
  {s: 294, e: 356, t: "上线初期 默认开启"},
  {s: 358, e: 390, t: "有开发者取证"},
  {s: 392, e: 470, t: "快照里百分之八十六 都是 git 目录"},
  {s: 472, e: 523, t: "提交历史 删过的文件"},
  {s: 525, e: 548, t: "全在里面"},
  {s: 550, e: 636, t: "官方说 数据生成后会立即销毁"},
  {s: 638, e: 672, t: "问题已经修复"},
  {s: 674, e: 724, t: "但真正值得警惕的是"},
  {s: 726, e: 769, t: "一个默认开启的功能"},
  {s: 771, e: 817, t: "为什么用户最后才知道"},
  {s: 819, e: 872, t: "用 AI 编程工具前"},
  {s: 874, e: 912, t: "先检查隐私和上传设置"},
  {s: 914, e: 973, t: "你会继续用 ZCode 吗"},
  {s: 975, e: 1018, t: "评论区告诉我"},
  {s: 1020, e: 1036, t: "更多 AI 内幕 主页合集"},
];

// ---------- 动画原语（硬切版：边界帧元素即时在场）----------

const shakeAmp = (frame: number, at: number, amp = 9, span = 18) => {
  const t = frame - at;
  if (at < 0 || t < 0 || t > span) return 0;
  return Math.sin(t * 2.2) * amp * (1 - t / span);
};

const SceneWrap: React.FC<{children: React.ReactNode}> = ({children}) => (
  <AbsoluteFill>{children}</AbsoluteFill>
);

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

const TypeTokens: React.FC<{
  tokens: {t: string; c: string}[]; start: number; cps?: number; fontSize?: number; active?: boolean;
}> = ({tokens, start, cps = 0.9, fontSize = 32, active = true}) => {
  const frame = useCurrentFrame();
  const total = tokens.reduce((a, t) => a + t.t.length, 0);
  const shown = Math.max(0, Math.min(total, Math.floor((frame - start) * cps)));
  let used = 0;
  const parts: React.ReactNode[] = [];
  tokens.forEach((tk, i) => {
    const a = used;
    const b = used + tk.t.length;
    if (shown > a) {
      const vis = tk.t.slice(0, Math.min(tk.t.length, shown - a));
      parts.push(<span key={i} style={{color: tk.c}}>{vis}</span>);
    }
    used = b;
  });
  return <span style={{fontSize, fontFamily: MONO, fontWeight: 800, whiteSpace: "pre"}}>{parts}</span>;
};

const Terminal: React.FC<{
  x: number; y: number; w: number; title: string; children: React.ReactNode; delay?: number;
}> = ({x, y, w, title, children, delay = -30}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const sp = spring({frame: frame - delay, fps, config: {damping: 17, stiffness: 130}});
  return (
    <div style={{
      position: "absolute", left: x, top: y, width: w,
      opacity: interpolate(sp, [0, 1], [0, 1]),
      transform: `translateY(${(1 - sp) * 44}px)`,
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

// ---------- 场景（7 页，边界帧完整在场）----------

// S1 封面（0-151）：第 0 帧完整静态
const SceneHook: React.FC = () => (
  <SceneWrap>
    <AbsoluteFill>
      <div style={{position: "absolute", top: 216, left: 0, right: 0, display: "flex", justifyContent: "center"}}>
        <div style={{fontSize: 100, fontWeight: 900, fontFamily: YAHEI, letterSpacing: 6, whiteSpace: "nowrap", color: INK}}>
          <span style={{fontFamily: MONO, color: RED}}>Git</span> 历史也<span style={{color: RED}}>上传</span>？
        </div>
      </div>
      <div style={{position: "absolute", top: 396, left: 0, right: 0, textAlign: "center"}}>
        <div style={{fontSize: 40, color: SUB, fontFamily: YAHEI, letterSpacing: 8, whiteSpace: "nowrap"}}>ZCode 事件 · 30 秒讲清</div>
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

// S2 官方回应（151-355）
const SceneResponse: React.FC = () => (
  <SceneWrap>
    <AbsoluteFill>
      <Head n="官" title="官方回应" sub="ZCode 已就此事致歉" />
      <div style={{position: "absolute", top: 260, left: 0, right: 0, display: "flex", justifyContent: "center"}}>
        <div style={{
          backgroundColor: CARD, borderRadius: 18, border: `2px solid ${BORDER}`,
          boxShadow: "0 16px 40px rgba(0,0,0,0.35)", padding: "48px 64px", width: 1150,
        }}>
          <div style={{fontSize: 42, fontWeight: 900, color: INK, fontFamily: YAHEI, lineHeight: 1.8}}>
            Repo Wiki 生成时，<span style={{color: RED}}>可能触发仓库数据上传</span>
          </div>
          <div style={{fontSize: 42, fontWeight: 900, color: INK, fontFamily: YAHEI, lineHeight: 1.8, marginTop: 16}}>
            且上线初期<span style={{color: RED}}>默认开启</span>
          </div>
          <div style={{marginTop: 28, fontSize: 27, color: SUB, fontFamily: YAHEI, whiteSpace: "nowrap"}}>
            来源：ZCode 官方公告
          </div>
        </div>
      </div>
    </AbsoluteFill>
  </SceneWrap>
);

// S3 取证（355-547）
const SNAP_LINES: {t: string; at: number; hl?: boolean}[] = [
  {t: "  project/src/main.ts", at: 18},
  {t: "  project/.git/objects/...", at: 33, hl: true},
  {t: "  project/.git/logs/HEAD   (reflog)", at: 48, hl: true},
  {t: "  project/.git/lfs/objects/...", at: 62, hl: true},
];

const SceneForensics: React.FC = () => {
  const frame = useCurrentFrame();
  const sweep = interpolate(frame, [37, 47], [0, 1], {extrapolateLeft: "clamp", extrapolateRight: "clamp"});
  return (
    <SceneWrap>
      <AbsoluteFill>
        <Head n="!" title="独立取证" sub="有开发者逆向了客户端上传链路" />
        <Terminal x={160} y={230} w={1600} title="snapshot 清单（节选）">
          <TypeTokens tokens={[{t: "$ ", c: ORANGE}, {t: "zcode workspace-snapshot --list", c: INK}]} start={0} cps={0.8} fontSize={40} active={false} />
          <div style={{marginTop: 20}}>
            {SNAP_LINES.map((l, i) => {
              const a = interpolate(frame, [l.at, l.at + 7], [0, 1], {extrapolateLeft: "clamp", extrapolateRight: "clamp"});
              if (a <= 0) return null;
              return (
                <div key={i} style={{
                  fontSize: 30, fontFamily: MONO, fontWeight: 700, lineHeight: 1.8, whiteSpace: "pre",
                  color: l.hl ? ORANGE : SUB, opacity: a, transform: `translateX(${(1 - a) * -26}px)`,
                }}>{l.t}</div>
              );
            })}
          </div>
          <div style={{marginTop: 16, display: "flex", alignItems: "center", gap: 24}}>
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
        <div style={{position: "absolute", top: 800, left: 0, right: 0, textAlign: "center"}}>
          <FadeUp at={110} style={{display: "inline-block"}}>
            <span style={{fontSize: 34, fontWeight: 900, color: INK, fontFamily: YAHEI, whiteSpace: "nowrap"}}>
              提交历史、删过的文件，<span style={{color: RED}}>全在里面</span>
            </span>
          </FadeUp>
        </div>
      </AbsoluteFill>
    </SceneWrap>
  );
};

// S4 官方处理（547-672）：立即销毁 + 已修复
const SceneFixed: React.FC = () => (
  <SceneWrap>
    <AbsoluteFill>
      <Head n="✓" title="官方怎么说" sub="数据去向与修复进展" />
      <div style={{position: "absolute", top: 300, left: 0, right: 0, display: "flex", justifyContent: "center", gap: 110}}>
        <div style={{textAlign: "center"}}>
          <Stamp text="立即销毁" at={45} color={ORANGE} rotate={-5} />
          <div style={{fontSize: 27, color: SUB, fontFamily: YAHEI, marginTop: 22, whiteSpace: "nowrap"}}>云端生成 Wiki 后销毁</div>
        </div>
        <div style={{textAlign: "center"}}>
          <Stamp text="已修复" at={91} color={ORANGE} rotate={5} />
          <div style={{fontSize: 27, color: SUB, fontFamily: YAHEI, marginTop: 22, whiteSpace: "nowrap"}}>上传问题已修复</div>
        </div>
      </div>
      <Pop delay={100} style={{position: "absolute", top: 640, left: 0, right: 0, textAlign: "center"}}>
        <div style={{fontSize: 34, color: SUB, fontFamily: YAHEI, whiteSpace: "nowrap"}}>
          但这件事，真正值得警惕的在这——
        </div>
      </Pop>
    </AbsoluteFill>
  </SceneWrap>
);

// S5 反思（672-767）
const SceneReflect: React.FC = () => (
  <SceneWrap>
    <AbsoluteFill>
      <div style={{position: "absolute", top: 320, left: 0, right: 0, textAlign: "center"}}>
        <div style={{fontSize: 72, fontWeight: 900, fontFamily: YAHEI, color: INK, whiteSpace: "nowrap", lineHeight: 1.5}}>
          <span style={{color: RED}}>默认开启</span>的功能，
        </div>
        <div style={{fontSize: 72, fontWeight: 900, fontFamily: YAHEI, color: INK, whiteSpace: "nowrap", lineHeight: 1.5}}>
          为什么用户<span style={{color: ORANGE}}>最后才知道</span>？
        </div>
      </div>
      <div style={{position: "absolute", top: 640, left: 0, right: 0, textAlign: "center"}}>
        <div style={{fontSize: 30, color: SUB, fontFamily: YAHEI, letterSpacing: 4, whiteSpace: "nowrap"}}>—— 用得放心，不该靠运气</div>
      </div>
    </AbsoluteFill>
  </SceneWrap>
);

// S6 行动（767-890）
const SceneAction: React.FC = () => (
  <SceneWrap>
    <AbsoluteFill>
      <Head n="✓" title="用之前查三样" sub="一分钟搞定" />
      <div style={{position: "absolute", top: 330, left: 0, right: 0, display: "flex", justifyContent: "center", gap: 50}}>
        {["隐私设置", "仓库访问", "上传设置"].map((t, i) => (
          <SlideIn key={i} delay={10 + i * 26} from={-80}>
            <div style={{
              backgroundColor: i === 2 ? RED_BG : TINT, borderRadius: 18,
              border: `2px solid ${i === 2 ? RED : BORDER}`, padding: "30px 46px",
              fontSize: 42, fontWeight: 900, color: i === 2 ? RED : INK, fontFamily: YAHEI, whiteSpace: "nowrap",
            }}>{t}</div>
          </SlideIn>
        ))}
      </div>
      <div style={{position: "absolute", top: 600, left: 0, right: 0, textAlign: "center"}}>
        <FadeUp at={80} style={{display: "inline-block"}}>
          <div style={{
            backgroundColor: CARD, borderRadius: 14, border: `2px solid ${BORDER}`,
            padding: "20px 44px", fontSize: 30, color: SUB, fontFamily: YAHEI, whiteSpace: "nowrap",
          }}>
            任何 AI 编程工具都一样 —— <span style={{color: ORANGE, fontWeight: 900}}>先看它把数据传去哪</span>
          </div>
        </FadeUp>
      </div>
    </AbsoluteFill>
  </SceneWrap>
);

// S7 金句互动（890-1108）
const SceneOutro: React.FC = () => {
  const frame = useCurrentFrame();
  const wob = Math.sin(frame / 9) * 7;
  return (
    <SceneWrap>
      <AbsoluteFill>
        <div style={{position: "absolute", top: 230, left: 0, right: 0, display: "flex", justifyContent: "center"}}>
          <div style={{fontSize: 84, fontWeight: 900, fontFamily: YAHEI, letterSpacing: 4, whiteSpace: "nowrap", color: INK}}>
            你会继续用 <span style={{fontFamily: MONO, color: ORANGE}}>ZCode</span> 吗？
          </div>
        </div>
        <div style={{position: "absolute", top: 420, left: 0, right: 0, textAlign: "center"}}>
          <FadeUp at={60} style={{display: "inline-block"}}>
            <div style={{fontSize: 40, color: INK, fontFamily: YAHEI, fontWeight: 700, whiteSpace: "nowrap"}}>
              评论区告诉我 <span style={{color: SUB, fontWeight: 400}}>/</span> 更多 AI 内幕 · 主页合集
            </div>
          </FadeUp>
        </div>
        <div style={{position: "absolute", top: 560, left: "50%", marginLeft: -120, width: 240, height: 240}}>
          {[0, 22].map((o) => {
            const p = (((frame - o) % 46) + 46) % 46 / 46;
            return (
              <div key={o} style={{
                position: "absolute", inset: 0, borderRadius: 999,
                border: `5px solid ${ORANGE}`, opacity: (1 - p) * 0.55,
                transform: `scale(${1 + p * 0.9})`,
              }} />
            );
          })}
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
        <div style={{position: "absolute", top: 866, left: 0, right: 0, textAlign: "center"}}>
          <div style={{fontSize: 30, color: SUB, fontFamily: YAHEI, letterSpacing: 3, whiteSpace: "nowrap"}}>
            全栈小秋 · 0 基础也能学会
          </div>
        </div>
      </AbsoluteFill>
    </SceneWrap>
  );
};

// ---------- 组装 ----------

const scenes = [
  {start: 0, end: 151, C: SceneHook},
  {start: 151, end: 355, C: SceneResponse},
  {start: 355, end: 547, C: SceneForensics},
  {start: 547, end: 672, C: SceneFixed},
  {start: 672, end: 816, C: SceneReflect},
  {start: 816, end: 912, C: SceneAction},
  {start: 912, end: DUR, C: SceneOutro},
];

export const ZCodeUploadShort: React.FC = () => {
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
      <div style={{
        position: "absolute", top: 0, left: 0, height: 6, backgroundColor: ORANGE,
        width: `${(frame / DUR) * 100}%`, zIndex: 10,
      }} />
      <CornerMark />
      {voiceLines.map((s) => (
        <Sequence key={`vo-${s.index}`} from={s.start} durationInFrames={s.end - s.start + 20}>
          <Audio src={staticFile(`audio/zcodeshort-tts/${s.audio}`)} volume={1} />
        </Sequence>
      ))}
      {/* 音效（词位对齐，保守档） */}
      <Sequence from={392} durationInFrames={26}>
        <Audio src={staticFile("audio/sfx/pop.wav")} volume={0.26} />
      </Sequence>
      <Sequence from={592} durationInFrames={26}>
        <Audio src={staticFile("audio/sfx/success.wav")} volume={0.28} />
      </Sequence>
      <Sequence from={638} durationInFrames={24}>
        <Audio src={staticFile("audio/sfx/ding.wav")} volume={0.22} />
      </Sequence>
      <Sequence from={678} durationInFrames={26}>
        <Audio src={staticFile("audio/sfx/alert.wav")} volume={0.24} />
      </Sequence>
      <Sequence from={876} durationInFrames={24}>
        <Audio src={staticFile("audio/sfx/pop.wav")} volume={0.24} />
      </Sequence>
      <Sequence from={916} durationInFrames={40}>
        <Audio src={staticFile("audio/sfx/success.wav")} volume={0.3} />
      </Sequence>
      {/* 结尾垫乐：压句尾起播、43 帧快淡 */}
      <Sequence from={995} durationInFrames={49}>
        <Audio src={staticFile("audio/bed_outro.wav")} volume={(f) => interpolate(f, [0, 6, 36, 43], [0, 0.55, 0.55, 0], {extrapolateLeft: "clamp", extrapolateRight: "clamp"})} />
      </Sequence>
      <Audio src={staticFile("audio/bed.wav")} loop volume={() => bedVolume} />
      <Subtitle />
    </AbsoluteFill>
  );
};
