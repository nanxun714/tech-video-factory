import {Audio} from "@remotion/media";
import {
  AbsoluteFill, interpolate, Sequence, spring, staticFile, useCurrentFrame, useVideoConfig,
} from "remotion";

// 《磁盘明明没满，为什么写不进去？》——inode 排查（batch10 §3，排查/收藏线）
// docker 深蓝灰对称终端风（style-docker.md），男声云希 +25% 句间 0.08s，9 句 9 页硬切
import React from "react";

// ---------- palette（深蓝灰 + 橙 + 暗红，四色相封顶）----------
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

// ---- 配音窗口（inode-tts/timeline.json，云希+25%，mutagen 实测）----
export const SENT = [0, 172, 323, 585, 773, 978, 1176, 1314, 1400];
export const DUR = 1586; // timeline total 1560 + 结尾卡静止 102 帧

const voiceLines = SENT.map((start, i) => ({
  index: i + 1,
  audio: `s0${i + 1}.mp3`,
  start,
  end: i < 8 ? SENT[i + 1] : 1560,
}));

// ---- 逐字字幕（gen_inode_subs.py 词级对齐，逐字无标点 ≤14 字）----
type Sub = {s: number; e: number; t: string};
const subs: Sub[] = [
  {s: 3, e: 63, t: "磁盘显示还剩一百个G"},
  {s: 72, e: 110, t: "新建文件却报错说"},
  {s: 110, e: 130, t: "磁盘已满"},
  {s: 137, e: 171, t: "这机器是不是坏了"},
  {s: 175, e: 203, t: "机器没坏"},
  {s: 209, e: 245, t: "是你的文件占满了"},
  {s: 245, e: 264, t: "另一本账"},
  {s: 273, e: 322, t: "这就是今天要排查的真凶"},
  {s: 326, e: 383, t: "硬盘存文件要记两本账"},
  {s: 390, e: 415, t: "一本记内容"},
  {s: 417, e: 439, t: "叫数据块"},
  {s: 447, e: 481, t: "一本记文件身份"},
  {s: 484, e: 506, t: "叫inode"},
  {s: 510, e: 584, t: "文件名大小权限全在里面"},
  {s: 588, e: 645, t: "关键在于inode的数量"},
  {s: 645, e: 695, t: "格式化时就定死了"},
  {s: 698, e: 730, t: "只有几百万个"},
  {s: 733, e: 772, t: "跟数据块各管各的"},
  {s: 776, e: 815, t: "于是出现这种场面"},
  {s: 822, e: 876, t: "几十万张几K的缓存小图"},
  {s: 882, e: 926, t: "数据块还剩一大堆"},
  {s: 933, e: 977, t: "inode却先被吃光了"},
  {s: 981, e: 1014, t: "很多人卡在这一步"},
  {s: 1020, e: 1083, t: "df看磁盘怎么都查不出满"},
  {s: 1086, e: 1128, t: "换成df -i一看"},
  {s: 1134, e: 1175, t: "inode使用率百分百"},
  {s: 1179, e: 1237, t: "删掉那些空占坑的小文件"},
  {s: 1243, e: 1274, t: "inode一释放"},
  {s: 1277, e: 1313, t: "写入立刻恢复"},
  {s: 1318, e: 1356, t: "磁盘满查内容"},
  {s: 1359, e: 1399, t: "写不进查inode"},
  {s: 1403, e: 1473, t: "同类排查题我整理了一整个合集"},
  {s: 1481, e: 1517, t: "点个关注收藏着"},
  {s: 1524, e: 1562, t: "报错的时候用得上"},
];

// 大字接管区间：屏上大字与字幕同句重复（P2「机器没坏」/ P8 金句页），字幕让位
const SUB_SKIP: Array<[number, number]> = [[172, 206], [1314, 1400]];

// ---------- 动画原语 ----------

// 硬切翻页：不做透明度淡入（页边界精确帧必须完整呈现新场景），只保留位移滑入
const SceneWrap: React.FC<{children: React.ReactNode; instant?: boolean}> = ({children, instant}) => {
  const frame = useCurrentFrame();
  const tx = instant ? 0 : interpolate(frame, [0, 10], [60, 0], {extrapolateRight: "clamp"});
  return <AbsoluteFill style={{transform: `translateX(${tx}px)`}}>{children}</AbsoluteFill>;
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

// 慢速打字机：cps=0.55，光标只在当前敲入行；未敲的命令不渲染（外层加 frame 守卫）
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

// 终端：满宽大窗（w≈1500~1600）
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
      <div style={{padding: "34px 50px"}}>{children}</div>
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

// 标题区：静态呈现（页边界精确帧即完整新场景，禁入场动画）
const Head: React.FC<{n: string; title: React.ReactNode; sub: string}> = ({n, title, sub}) => (
  <div style={{position: "absolute", top: 48, left: 0, width: 1920, textAlign: "center"}}>
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
  </div>
);

const CornerMark: React.FC = () => (
  <div style={{
    position: "absolute", top: 64, right: 84, fontSize: 26, color: SUB,
    fontFamily: YAHEI, fontWeight: 700, letterSpacing: 4,
  }}>全栈小秋</div>
);

// 红色警示印章（旋转砸落）
const Stamp: React.FC<{text: string; delay: number; fontSize?: number; style?: React.CSSProperties}> = ({
  text, delay, fontSize = 56, style,
}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const sp = spring({frame: frame - delay, fps, config: {damping: 10, stiffness: 200}});
  const t = Math.min(1, Math.max(0, (frame - delay) / 18));
  const shake = Math.sin(t * 2.2 * Math.PI) * 9 * (1 - t);
  if (frame < delay) return null;
  return (
    <div style={{
      display: "inline-block",
      transform: `rotate(-3deg) scale(${interpolate(sp, [0, 1], [0.5, 1])}) translateX(${shake}px)`,
      opacity: interpolate(sp, [0, 1], [0, 1]),
      border: `5px dashed ${RED}`, borderRadius: 20, backgroundColor: CARD,
      padding: "22px 52px", fontSize, fontFamily: YAHEI, fontWeight: 900, color: RED,
      boxShadow: "0 14px 34px rgba(0,0,0,0.3)", whiteSpace: "nowrap",
      ...style,
    }}>{text}</div>
  );
};

// 使用率横条（数字 Math.round + nowrap）
const UsageBar: React.FC<{label: string; at: number; pct: number; color: string; y: number}> = ({
  label, at, pct, color, y,
}) => {
  const frame = useCurrentFrame();
  if (frame < at) return null;
  const w = interpolate(frame, [at, at + 16], [0, pct], {extrapolateLeft: "clamp", extrapolateRight: "clamp"});
  const pulse = color === RED ? 1 + Math.sin(Math.max(0, frame - at - 16) / 5) * 0.05 : 1;
  return (
    <div style={{position: "absolute", top: y, left: 260, width: 1400, display: "flex", alignItems: "center", gap: 26}}>
      <div style={{width: 190, fontSize: 34, fontWeight: 900, fontFamily: label.includes("inode") ? MONO : YAHEI, color: INK, whiteSpace: "nowrap", textAlign: "right"}}>{label}</div>
      <div style={{width: 940, height: 30, borderRadius: 15, backgroundColor: "#1f2430", overflow: "hidden"}}>
        <div style={{width: `${w}%`, height: 30, borderRadius: 15, backgroundColor: color, transform: `scale(${pulse})`, transformOrigin: "left center"}} />
      </div>
      <div style={{fontSize: 38, fontWeight: 900, fontFamily: MONO, color, whiteSpace: "nowrap", minWidth: 130}}>
        {`${Math.round(w)}%`}
      </div>
    </div>
  );
};

const Subtitle: React.FC = () => {
  const frame = useCurrentFrame();
  if (SUB_SKIP.some(([a, b]) => frame >= a && frame < b)) return null;
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

// ---------- 场景 1：封面钩子（第 0 帧完整静态海报，delay=-99 禁入场动画）----------
const SceneHook: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <SceneWrap instant>
      <AbsoluteFill>
        {/* 大标题 */}
        <div style={{position: "absolute", top: 92, left: 0, width: 1920, textAlign: "center"}}>
          <div style={{fontSize: 92, fontWeight: 900, fontFamily: YAHEI, letterSpacing: 5, whiteSpace: "nowrap", color: INK}}>
            磁盘没满，<span style={{color: RED}}>却写不进</span>？
          </div>
          <div style={{fontSize: 31, color: SUB, fontFamily: YAHEI, marginTop: 18, letterSpacing: 6}}>
            写不进 ≠ 磁盘坏 · 两本账排查
          </div>
        </div>
        {/* 居中大终端：df -h 没满 + touch 报真实错误 */}
        <Terminal x={210} y={292} w={1500} title="xiaoqiu@dev: ~">
          <div style={{fontSize: 42, fontFamily: MONO, fontWeight: 800}}>
            <span style={{color: ORANGE}}>$ </span>
            <span style={{color: INK}}>df -h</span>
            <span style={{color: ORANGE, opacity: frame % 30 < 15 ? 1 : 0.15}}>▌</span>
          </div>
          <div style={{fontSize: 29, fontFamily: MONO, fontWeight: 700, color: SUB, whiteSpace: "pre", lineHeight: 2.0, marginTop: 14}}>
            {"Filesystem      Size  Used Avail Use% Mounted on"}
          </div>
          <div style={{fontSize: 31, fontFamily: MONO, fontWeight: 800, color: INK, whiteSpace: "pre", lineHeight: 2.0}}>
            {"/dev/vda1        99G   41G   53G  "}
            <span style={{color: ORANGE}}>42%</span>
            {" /"}
          </div>
          <div style={{fontSize: 40, fontFamily: MONO, fontWeight: 800, marginTop: 22}}>
            <span style={{color: ORANGE}}>$ </span>
            <span style={{color: INK}}>touch test.txt</span>
          </div>
          <div style={{marginTop: 18}}>
            <span style={{
              color: RED, backgroundColor: RED_BG, border: `2px solid ${RED}`,
              padding: "8px 20px", borderRadius: 10, display: "inline-block",
              fontSize: 30, fontFamily: MONO, fontWeight: 900, whiteSpace: "pre",
            }}>{"touch: cannot touch 'test.txt': No space left on device"}</span>
          </div>
        </Terminal>
        {/* CTA 胶囊 + 落款（避开底部字幕区） */}
        <div style={{position: "absolute", top: 812, left: 0, width: 1920, display: "flex", justifyContent: "center"}}>
          <div style={{
            backgroundColor: ORANGE_D, color: "#fff", borderRadius: 999, padding: "14px 54px",
            fontSize: 34, fontWeight: 900, fontFamily: YAHEI, letterSpacing: 8,
            boxShadow: "0 16px 36px rgba(0,0,0,0.35)", whiteSpace: "nowrap",
          }}>真凶藏在另一本账</div>
        </div>
        <div style={{position: "absolute", top: 904, left: 0, width: 1920, textAlign: "center"}}>
          <div style={{fontSize: 28, color: SUB, fontFamily: YAHEI, letterSpacing: 3, whiteSpace: "nowrap"}}>全栈小秋 · 0 基础也能学会</div>
        </div>
      </AbsoluteFill>
    </SceneWrap>
  );
};

// ---------- 场景 2：真凶揭示（机器没坏 → 两本账 → 锁定真凶印章）----------
const SceneVillain: React.FC = () => {
  const frame = useCurrentFrame();
  const chipIn = (i: number) => frame >= 76 + i * 2;
  return (
    <SceneWrap>
      <AbsoluteFill>
        {/* 大字「机器没坏」（字幕在此窗口让位） */}
        <div style={{position: "absolute", top: 150, left: 0, width: 1920, textAlign: "center"}}>
          <div style={{fontSize: 84, fontWeight: 900, fontFamily: YAHEI, letterSpacing: 8, whiteSpace: "nowrap", color: INK}}>
            机器<span style={{color: ORANGE}}>没坏</span>
          </div>
        </div>
        {/* 两本账：A 账本正常 / B 账本被小文件塞爆 */}
        <div style={{position: "absolute", top: 336, left: 280, width: 620}}>
          <SlideIn delay={73} from={-70}>
            <div style={{
              backgroundColor: CARD, borderRadius: 18, border: `2px solid ${BORDER}`,
              boxShadow: "0 12px 30px rgba(0,0,0,0.3)", padding: "26px 34px", height: 300,
            }}>
              <div style={{fontSize: 34, fontWeight: 900, color: INK, fontFamily: YAHEI, whiteSpace: "nowrap"}}>账本 A · 数据块</div>
              <div style={{fontSize: 27, color: SUB, fontFamily: YAHEI, marginTop: 14, whiteSpace: "nowrap"}}>记文件内容，按用量走</div>
              <div style={{marginTop: 26, height: 26, borderRadius: 13, backgroundColor: "#1f2430", width: 550, overflow: "hidden"}}>
                <div style={{width: "42%", height: 26, borderRadius: 13, backgroundColor: SUB}} />
              </div>
              <div style={{fontSize: 26, color: SUB, fontFamily: MONO, marginTop: 16, whiteSpace: "pre"}}>{"42% — 还有大半空着"}</div>
            </div>
          </SlideIn>
        </div>
        <div style={{position: "absolute", top: 336, left: 1020, width: 620}}>
          <SlideIn delay={73} from={70}>
            <div style={{
              backgroundColor: CARD, borderRadius: 18, border: `3px solid ${ORANGE}`,
              boxShadow: "0 12px 30px rgba(0,0,0,0.3)", padding: "26px 34px", height: 300,
            }}>
              <div style={{fontSize: 34, fontWeight: 900, color: ORANGE, fontFamily: MONO, whiteSpace: "nowrap"}}>账本 B · inode</div>
              <div style={{fontSize: 27, color: SUB, fontFamily: YAHEI, marginTop: 14, whiteSpace: "nowrap"}}>记文件身份，一本登记册</div>
              <div style={{marginTop: 20, display: "flex", flexWrap: "wrap", gap: 8, width: 550}}>
                {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
                  <span key={i} style={{
                    fontSize: 20, fontFamily: MONO, fontWeight: 700, color: RED,
                    backgroundColor: RED_BG, borderRadius: 7, padding: "3px 10px",
                    whiteSpace: "nowrap", display: "inline-block",
                    opacity: chipIn(i) ? 1 : 0,
                  }}>{`img_000${i + 1}.jpg`}</span>
                ))}
              </div>
            </div>
          </SlideIn>
        </div>
        {/* 真凶印章 */}
        <div style={{position: "absolute", top: 742, left: 0, width: 1920, display: "flex", justifyContent: "center"}}>
          <Stamp text="真凶锁定：inode 账本" delay={135} fontSize={54} />
        </div>
      </AbsoluteFill>
    </SceneWrap>
  );
};

// ---------- 场景 3：两本账（数据块 / inode 对称双卡）----------
const SceneTwoBooks: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <SceneWrap>
      <AbsoluteFill>
        <Head n="1" title="硬盘的两本账" sub="每存一个文件，记两笔" />
        {/* 中缝连接胶囊 */}
        <Pop delay={51} style={{position: "absolute", top: 208, left: 0, width: 1920, display: "flex", justifyContent: "center"}}>
          <div style={{
            backgroundColor: TINT, border: `2px solid ${BORDER}`, borderRadius: 999,
            padding: "10px 40px", fontSize: 30, fontWeight: 900, color: ORANGE,
            fontFamily: YAHEI, letterSpacing: 4, whiteSpace: "nowrap",
          }}>1 个文件 → 记 2 笔</div>
        </Pop>
        {/* 两本账空账本轮廓：第 0 帧即在（页边界帧不空场），填卡后隐藏 */}
        {([
          {left: 210, tag: "账本一", hideAt: 95},
          {left: 1010, tag: "账本二", hideAt: 165},
        ] as const).map((o, i) => {
          const f = frame;
          if (f >= o.hideAt) return null;
          return (
            <div key={i} style={{position: "absolute", left: o.left, top: 330, width: 700, height: 280}}>
              <div style={{
                border: `3px dashed ${BORDER}`, borderRadius: 16, height: "100%",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <span style={{fontSize: 30, color: BORDER, fontFamily: YAHEI, fontWeight: 900, letterSpacing: 8}}>{o.tag}</span>
              </div>
            </div>
          );
        })}
        {/* 左卡：数据块（记内容） */}
        <InfoCard x={210} y={330} w={700} delay={95}
          title={<span><span style={{color: ORANGE}}>数据块</span> · 记内容</span>}
          lines={["文件的正文，存在这里", "占多少，看文件多大"]} />
        {/* 右卡：inode（记身份） */}
        <SlideIn delay={165} from={70} style={{position: "absolute", left: 1010, top: 330, width: 700}}>
          <div style={{
            backgroundColor: CARD, borderRadius: 16, border: `2px solid ${BORDER}`,
            borderLeft: `6px solid ${ORANGE}`,
            boxShadow: "0 12px 30px rgba(0,0,0,0.3)", padding: "24px 34px",
          }}>
            <div style={{fontSize: 32, fontWeight: 900, color: INK, fontFamily: YAHEI, marginBottom: 8, whiteSpace: "nowrap"}}>
              <span style={{fontFamily: MONO, color: ORANGE}}>inode</span> · 记身份
            </div>
            <FadeUp at={187}><div style={{fontSize: 28, color: SUB, fontFamily: YAHEI, lineHeight: 1.75, whiteSpace: "nowrap"}}>· 文件名</div></FadeUp>
            <FadeUp at={210}><div style={{fontSize: 28, color: SUB, fontFamily: YAHEI, lineHeight: 1.75, whiteSpace: "nowrap"}}>· 大小</div></FadeUp>
            <FadeUp at={229}><div style={{fontSize: 28, color: SUB, fontFamily: YAHEI, lineHeight: 1.75, whiteSpace: "nowrap"}}>· 权限</div></FadeUp>
            <FadeUp at={252}><div style={{fontSize: 28, color: INK, fontFamily: YAHEI, lineHeight: 1.75, whiteSpace: "nowrap"}}>全在这张登记册上</div></FadeUp>
          </div>
        </SlideIn>
        {/* 底部结论条 */}
        <FadeUp at={150}>
          <div style={{position: "absolute", top: 700, left: 210, width: 1500}}>
            <div style={{
              backgroundColor: CARD, borderRadius: 16, border: `2px solid ${BORDER}`,
              boxShadow: "0 12px 30px rgba(0,0,0,0.3)", padding: "22px 40px", textAlign: "center",
            }}>
              <span style={{fontSize: 32, fontWeight: 900, color: INK, fontFamily: YAHEI, whiteSpace: "nowrap"}}>
                任何一本账记满，<span style={{color: RED}}>都写不进去</span>
              </span>
            </div>
          </div>
        </FadeUp>
      </AbsoluteFill>
    </SceneWrap>
  );
};

// ---------- 场景 4：inode 数量格式化定死 ----------
const SceneFixedCount: React.FC = () => {
  const frame = useCurrentFrame();
  // 数字在「几百万个」揭晓：113 帧起 20 帧滚到 2621440（Math.round + nowrap 防浮点溢出）
  const prog = interpolate(frame, [113, 133], [0, 1], {extrapolateLeft: "clamp", extrapolateRight: "clamp"});
  const count = Math.round(6553600 * prog);
  return (
    <SceneWrap>
      <AbsoluteFill>
        <Head n="2" title={<><span style={{fontFamily: MONO}}>inode</span> 账本的规矩</>} sub="另一本账，出厂就定了量" />
        {/* 数量卡 */}
        <div style={{position: "absolute", top: 300, left: 360, width: 1200}}>
          <div style={{
            backgroundColor: CARD, borderRadius: 20, border: `2px solid ${BORDER}`,
            boxShadow: "0 20px 50px rgba(0,0,0,0.35)", padding: "32px 50px", textAlign: "center",
          }}>
            <div style={{fontSize: 32, fontWeight: 900, color: SUB, fontFamily: YAHEI, letterSpacing: 4, whiteSpace: "nowrap"}}>inode 总数上限</div>
            <div style={{fontSize: 100, fontWeight: 900, fontFamily: MONO, color: INK, whiteSpace: "nowrap", marginTop: 14}}>
              {frame >= 113 ? count.toLocaleString("en-US") : "??????"}
              <span style={{fontSize: 40, color: SUB, fontWeight: 700}}> 个</span>
            </div>
            {frame >= 123 ? (
              <div style={{fontSize: 30, fontWeight: 900, color: ORANGE, fontFamily: YAHEI, marginTop: 6, whiteSpace: "nowrap"}}>
                只有几百万个 · 出厂固定
              </div>
            ) : null}
          </div>
        </div>
        {/* 格式化印章 */}
        <div style={{position: "absolute", top: 196, left: 0, width: 1920, display: "flex", justifyContent: "center"}}>
          <Stamp text="格式化时定死" delay={60} fontSize={42} />
        </div>
        {/* 两本账互不通用 */}
        <InfoCard x={210} y={616} w={700} delay={148}
          title="数据块 · 按用量增长"
          lines={["存多少占多少，跟着文件走"]} />
        <InfoCard x={1010} y={616} w={700} delay={166}
          title={<span><span style={{fontFamily: MONO, color: ORANGE}}>inode</span> · 数量固定</span>}
          lines={["跟数据块互不通用，用完就没"]} />
        {/* 底部结论 */}
        <FadeUp at={166}>
          <div style={{position: "absolute", top: 796, left: 210, width: 1500, textAlign: "center"}}>
            <span style={{fontSize: 30, color: SUB, fontFamily: YAHEI, whiteSpace: "nowrap"}}>
              文件再小，也要占一个 inode 名额
            </span>
          </div>
        </FadeUp>
      </AbsoluteFill>
    </SceneWrap>
  );
};

// ---------- 场景 5：小文件海（chips 涌入 + 双账本使用率条）----------
const SceneFileSea: React.FC = () => {
  const frame = useCurrentFrame();
  // 小图洪流：rel 49 起每 2 帧多一张，封顶 24 张（4 行x6 列，不出画面）；计数器 Math.round + nowrap
  const visible = frame >= 49 ? Math.min(24, Math.floor((frame - 49) / 2)) : 0;
  const counter = Math.min(384216, Math.round(Math.max(0, frame - 49) * 7040));
  return (
    <SceneWrap>
      <AbsoluteFill>
        <Head n="3" title="事故现场 · 小文件海" sub="写进来的全是海量小文件" />
        {/* 文件海面板 */}
        <div style={{position: "absolute", top: 218, left: 210, width: 1500}}>
          <div style={{
            backgroundColor: "#272e3d", borderRadius: 18, border: `2px solid ${BORDER}`,
            boxShadow: "0 12px 30px rgba(0,0,0,0.3)", padding: "22px 30px", overflow: "hidden",
          }}>
            <div style={{display: "flex", justifyContent: "space-between", width: 1440}}>
              <span style={{fontSize: 26, color: SUB, fontFamily: YAHEI, fontWeight: 700, whiteSpace: "nowrap"}}>/data/cache/ 正在写入：</span>
              <span style={{fontSize: 26, color: ORANGE, fontFamily: MONO, fontWeight: 900, whiteSpace: "nowrap"}}>
                {`${counter.toLocaleString("en-US")} 张小图`}
              </span>
            </div>
            <div style={{display: "flex", flexWrap: "wrap", gap: 8, width: 1440, height: 218, marginTop: 14, overflow: "hidden"}}>
              {Array.from({length: visible}).map((_, i) => (
                <span key={i} style={{
                  fontSize: 22, fontFamily: MONO, fontWeight: 700, color: INK,
                  backgroundColor: CARD, border: `1px solid ${BORDER}`, borderRadius: 7,
                  padding: "4px 10px", whiteSpace: "nowrap", display: "inline-block",
                }}>{`img_${String(i * 6007 + 1000).padStart(6, "0")}.jpg  3K`}</span>
              ))}
            </div>
          </div>
        </div>
        {/* 双账本使用率：数据块 42% / inode 100% */}
        <UsageBar label="数据块" at={109} pct={42} color={SUB} y={588} />
        <UsageBar label="inode" at={160} pct={100} color={RED} y={672} />
        {/* 结论双卡 */}
        <InfoCard x={210} y={772} w={700} delay={133}
          title="数据块：还剩一大堆"
          lines={["df 看空间，怎么都看不出满"]} />
        <InfoCard x={1010} y={772} w={700} delay={188}
          title={<span><span style={{fontFamily: MONO, color: RED}}>inode</span>：先被吃光</span>}
          lines={["小图再小，一张也要占一个名额"]} />
      </AbsoluteFill>
    </SceneWrap>
  );
};

// ---------- 场景 6：df 查不出 → df -i 真相 ----------
const SceneDfTruth: React.FC = () => {
  const frame = useCurrentFrame();
  const pulse = 1 + Math.sin(Math.max(0, frame - 156) / 5) * 0.05;
  return (
    <SceneWrap>
      <AbsoluteFill>
        <Head n="4" title={<>df 查不出？换 <span style={{fontFamily: MONO, color: ORANGE}}>df -i</span></>} sub="空间没满，不代表能写入" />
        <Terminal x={180} y={222} w={1560} title="xiaoqiu@dev: ~">
          {/* 第一段：df -h（很多人卡在这一步） */}
          {frame >= 42 ? (
            <TypeTokens tokens={[{t: "$ ", c: ORANGE}, {t: "df -h", c: INK}]} start={42} cps={0.55} fontSize={44} active={false} />
          ) : null}
          {frame >= 56 ? (
            <div style={{fontSize: 27, fontFamily: MONO, fontWeight: 700, color: SUB, whiteSpace: "pre", lineHeight: 1.85, marginTop: 16}}>
              {"Filesystem      Size  Used Avail Use% Mounted on"}
            </div>
          ) : null}
          {frame >= 64 ? (
            <div style={{fontSize: 30, fontFamily: MONO, fontWeight: 800, color: INK, whiteSpace: "pre", lineHeight: 1.85}}>
              {"/dev/vda1        99G   41G   53G  "}
              <span style={{color: ORANGE}}>42%</span>
              {" /"}
            </div>
          ) : null}
          {frame >= 94 ? (
            <FadeUp at={94}>
              <div style={{fontSize: 27, fontFamily: YAHEI, fontWeight: 900, color: RED, whiteSpace: "nowrap", marginTop: 8}}>
                ← 怎么查都是 42%，没满啊？
              </div>
            </FadeUp>
          ) : null}
          {/* 第二段：df -i（换工具） */}
          {frame >= 108 ? (
            <div style={{marginTop: 30}}>
              <TypeTokens tokens={[{t: "$ ", c: ORANGE}, {t: "df -i", c: INK}]} start={122} cps={0.55} fontSize={44} active={false} />
              {frame >= 134 ? (
                <div style={{fontSize: 27, fontFamily: MONO, fontWeight: 700, color: SUB, whiteSpace: "pre", lineHeight: 1.85, marginTop: 16}}>
                  {"Filesystem      Inodes   IUsed   IFree IUse% Mounted on"}
                </div>
              ) : null}
              {frame >= 142 ? (
                <div style={{fontSize: 30, fontFamily: MONO, fontWeight: 800, whiteSpace: "pre", lineHeight: 1.85}}>
                  <span style={{color: INK}}>{"/dev/vda1     6553600  6553600      0  "}</span>
                  <span style={{
                    color: RED, fontWeight: 900, display: "inline-block",
                    transform: `scale(${frame >= 156 ? pulse : 1})`,
                  }}>{"100%"}</span>
                  <span style={{color: INK}}>{" /"}</span>
                </div>
              ) : null}
            </div>
          ) : null}
        </Terminal>
        {/* 对称双卡 */}
        <InfoCard x={210} y={800} w={700} delay={134}
          title={<span><span style={{fontFamily: MONO, color: ORANGE}}>df -h</span> = 数据块账本</span>}
          lines={["只报空间用量，42% 看着很健康"]} />
        <InfoCard x={1010} y={800} w={700} delay={156}
          title={<span><span style={{fontFamily: MONO, color: ORANGE}}>df -i</span> = inode账本</span>}
          lines={["IUse% 100%，名额一个不剩"]} />
      </AbsoluteFill>
    </SceneWrap>
  );
};

// ---------- 场景 7：删除小文件恢复 ----------
const SceneFix: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <SceneWrap>
      <AbsoluteFill>
        <Head n="5" title="删小文件，腾名额" sub="第五步：清掉空占坑的" />
        <Terminal x={180} y={222} w={1560} title="xiaoqiu@dev: ~">
          {/* rm 清理 */}
          {frame >= 10 ? (
            <TypeTokens tokens={[{t: "$ ", c: ORANGE}, {t: "rm -rf /data/cache/thumbs/*", c: INK}]} start={10} cps={0.55} fontSize={42} active={false} />
          ) : null}
          {frame >= 62 ? (
            <FadeUp at={62}>
              <div style={{fontSize: 27, fontFamily: MONO, fontWeight: 700, color: SUB, whiteSpace: "pre"}}>
                {"# 几十万张小图清掉，inode 名额全回来了"}
              </div>
            </FadeUp>
          ) : null}
          {/* df -i 验证 */}
          {frame >= 67 ? (
            <div style={{marginTop: 26}}>
              <TypeTokens tokens={[{t: "$ ", c: ORANGE}, {t: "df -i", c: INK}]} start={67} cps={0.55} fontSize={44} active={false} />
              {frame >= 84 ? (
                <div style={{fontSize: 30, fontFamily: MONO, fontWeight: 800, whiteSpace: "pre", lineHeight: 1.85, marginTop: 16}}>
                  <span style={{color: INK}}>{"/dev/vda1     6553600   196608 6356992   "}</span>
                  <span style={{color: ORANGE, fontWeight: 900}}>{"3%"}</span>
                  <span style={{color: INK}}>{" /"}</span>
                </div>
              ) : null}
            </div>
          ) : null}
          {/* 写入恢复徽章 */}
          {frame >= 101 ? (
            <div style={{marginTop: 26}}>
              <span style={{
                color: "#fff", backgroundColor: ORANGE_D,
                padding: "10px 26px", borderRadius: 12, display: "inline-block",
                fontSize: 32, fontFamily: YAHEI, fontWeight: 900, whiteSpace: "nowrap",
                transform: `scale(${1 + Math.sin(Math.max(0, frame - 101) / 5) * 0.04})`,
              }}>✓ touch test.txt 成功 · 写入恢复</span>
            </div>
          ) : null}
        </Terminal>
        <InfoCard x={210} y={800} w={700} delay={70}
          title="inode 一释放"
          lines={["IUse% 从 100% 掉到 3%"]} />
        <InfoCard x={1010} y={800} w={700} delay={101}
          title="写入立刻恢复"
          lines={["touch 不再报 No space left"]} />
      </AbsoluteFill>
    </SceneWrap>
  );
};

// ---------- 场景 8：金句（大字接管，字幕让位）----------
const SceneMotto: React.FC = () => (
  <SceneWrap>
    <AbsoluteFill>
      <Head n="★" title="排查口诀" sub="一句话记住两本账" />
      <div style={{position: "absolute", top: 350, left: 0, width: 1920, textAlign: "center"}}>
        <div style={{fontSize: 96, fontWeight: 900, fontFamily: YAHEI, color: INK, letterSpacing: 8, whiteSpace: "nowrap"}}>
          磁盘满查<span style={{color: ORANGE}}>内容</span>
        </div>
      </div>
      <div style={{position: "absolute", top: 540, left: 0, width: 1920, textAlign: "center"}}>
        <Pop delay={45}>
          <div style={{fontSize: 96, fontWeight: 900, fontFamily: YAHEI, color: INK, letterSpacing: 8, whiteSpace: "nowrap"}}>
            写不进查<span style={{fontFamily: MONO, color: ORANGE}}>inode</span>
          </div>
        </Pop>
      </div>
    </AbsoluteFill>
  </SceneWrap>
);

// ---------- 场景 9：结尾亮底截图卡（最后 102 帧完全静止）----------
const SceneCard: React.FC = () => {
  const rows = [
    {n: "①", cmd: "df -h", desc: "看数据块 · 还剩多少空间", mono: true, at: 4},
    {n: "②", cmd: "df -i", desc: "看 inode · IUse% 是不是 100%", mono: true, at: 9},
    {n: "③", cmd: "小文件海 = inode 杀手", desc: "清小文件，名额立刻回来", mono: false, at: 14},
  ];
  return (
    <SceneWrap>
      <AbsoluteFill>
        {/* 卡体静态呈现（页边界帧即完整截图卡），三行依次滑入 */}
        <div style={{position: "absolute", left: 340, top: 148, width: 1240}}>
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
              <div style={{fontSize: 50, fontWeight: 900, color: "#262c3a", fontFamily: YAHEI, letterSpacing: 2, whiteSpace: "nowrap"}}>
                磁盘没满<span style={{color: "#ef6f6f"}}>写不进</span> · 排查卡
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
                      color: "#262c3a", whiteSpace: "nowrap", width: r.mono ? 250 : 560,
                    }}>{r.cmd}</span>
                    <span style={{fontSize: 29, color: "#6b7488", fontFamily: YAHEI, fontWeight: 700, whiteSpace: "nowrap"}}>{r.desc}</span>
                  </div>
                </SlideIn>
              ))}
            </div>
            <div style={{marginTop: 22, width: 1136, textAlign: "center", fontSize: 28, color: "#6b7488", fontFamily: YAHEI, letterSpacing: 4}}>
              全栈小秋 · 0基础也能学会
            </div>
          </div>
        </div>
        {/* CTA 在卡与底部字幕安全区之间（bottom≥170，不压字幕） */}
        <Pop delay={50} style={{position: "absolute", top: 736, left: 0, width: 1920, display: "flex", justifyContent: "center"}}>
          <div style={{
            backgroundColor: ORANGE_D, color: "#fff", borderRadius: 999, padding: "10px 44px",
            fontSize: 30, fontWeight: 900, fontFamily: YAHEI, letterSpacing: 6,
            boxShadow: "0 14px 34px rgba(0,0,0,0.35)", whiteSpace: "nowrap",
          }}>关注 全栈小秋 · 排查合集</div>
        </Pop>
      </AbsoluteFill>
    </SceneWrap>
  );
};

// ---------- 组装 ----------
const scenes = SENT.map((start, i) => ({
  start,
  end: i < 8 ? SENT[i + 1] : DUR,
  C: [SceneHook, SceneVillain, SceneTwoBooks, SceneFixedCount, SceneFileSea, SceneDfTruth, SceneFix, SceneMotto, SceneCard][i],
}));

// 打字键击音：命令打字窗口内每 6 帧一声轻 click（绝对帧）
const typeWindows: Array<[number, number]> = [
  [1020, 1032], [1100, 1112], [1186, 1236], [1243, 1254],
];
const clickFrames: number[] = [];
for (const [a, b] of typeWindows) {
  for (let f = a; f <= b; f += 6) clickFrames.push(f);
}

// 音效层：page3 翻页 / pop 弹入 / alert 报错砸落·飙红(保守) / success 恢复 / whoosh 翻卡
const SFX: {f: number; w: string; v: number; d?: number}[] = [
  ...SENT.slice(1).map((f) => ({f, w: "page3.wav", v: 0.28, d: 30})),
  {f: 118, w: "error.wav", v: 0.3, d: 30},    // P1 报错念出
  {f: 245, w: "pop.wav", v: 0.26, d: 20},     // P2 两本账卡弹入
  {f: 307, w: "alert.wav", v: 0.22, d: 30},   // P2 真凶印章
  {f: 418, w: "pop.wav", v: 0.26, d: 20},     // P3 数据块卡
  {f: 490, w: "pop.wav", v: 0.26, d: 20},     // P3 inode 卡
  {f: 535, w: "ding.wav", v: 0.26, d: 30},    // P3 结论条
  {f: 645, w: "alert.wav", v: 0.24, d: 30},   // P4 格式化印章
  {f: 698, w: "pop.wav", v: 0.26, d: 20},     // P4 数字揭晓
  {f: 921, w: "pop.wav", v: 0.26, d: 20},     // P5 数据块条
  {f: 938, w: "alert.wav", v: 0.24, d: 30},   // P5 inode 100% 飙红
  {f: 1112, w: "alert.wav", v: 0.26, d: 30},  // P6 df -i 100% 红徽章
  {f: 1160, w: "alert.wav", v: 0.2, d: 30},   // P6 「百分百」口播
  {f: 1277, w: "success.wav", v: 0.24, d: 30},// P7 写入恢复
  {f: 1318, w: "pop.wav", v: 0.26, d: 20},    // P8 金句一
  {f: 1359, w: "ding.wav", v: 0.28, d: 30},   // P8 金句二
  {f: 1408, w: "whoosh.wav", v: 0.22, d: 24}, // P9 截图卡滑入
  {f: 1450, w: "pop.wav", v: 0.26, d: 20},    // P9 关注胶囊
];

export const InodeExhausted: React.FC = () => {
  const frame = useCurrentFrame();
  const bedVolume = interpolate(frame, [0, 20, DUR - 40, DUR - 6], [0, 0.06, 0.06, 0], {
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
          <Audio src={staticFile(`audio/inode-tts/${s.audio}`)} volume={1} />
        </Sequence>
      ))}
      {SFX.map((s, i) => (
        <Sequence key={`sfx-${i}`} from={s.f} durationInFrames={s.d ?? 26}>
          <Audio src={staticFile(`audio/sfx/${s.w}`)} volume={s.v} />
        </Sequence>
      ))}
      {clickFrames.map((f) => (
        <Sequence key={`c${f}`} from={f} durationInFrames={6}>
          <Audio src={staticFile("audio/sfx/click.wav")} volume={0.16} />
        </Sequence>
      ))}
      <Audio src={staticFile("audio/bed.wav")} loop volume={() => bedVolume} />
      <Subtitle />
    </AbsoluteFill>
  );
};
