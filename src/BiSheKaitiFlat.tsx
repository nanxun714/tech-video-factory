import React from "react";
import {Audio} from "@remotion/media";
import {
  AbsoluteFill, interpolate, Sequence, staticFile, useCurrentFrame,
} from "remotion";

// ============ 扁平插画风 · 毕设通关系列 02《开题报告怎么写不返工＋前缀防撞题》（全栈小秋 IP） ============
// 结构沿用第1条公式：反直觉钩子 → 前缀双例对比（收藏点：加前缀防撞题）→ 三个检查项带判断标准
// → 定题/自拟 → 金句卡 → 中文数字互动结尾。
// 配音 21 句（曼波 1.5 速，GAP 0.06），锚点全部 at(i,frac)=SENT[i]+frac*SENT_DUR[i]（禁 wordAt）。
// 铁律落地：转场纯硬切；页内底部胶囊 top≤860；裸 svg 一律包 PopAt；无带圈数字；
// 结尾 = 话音落 +6 帧直接收（TAIL_FRAMES=6，无垫乐音）；字幕 52px、金句页组件级停用。

import {HardPage, PopAt, BrandCorner} from "./batch10/kit";
import {DUR, SENT, SENT_DUR, SUBS} from "./batch10/kaitiData";

// ---------- 调色（与第1条同族） ----------
const INK = "#2f3a45";
const SUBC = "#7a8694";
const BLUE = "#4a86d8";
const BLUE_BG = "#eaf2fc";
const GREEN = "#3fae7a";
const GREEN_BG = "#e9f6ee";
const ORANGE = "#f0912d";
const ORANGE_BG = "#fdf3e0";
const RED = "#e05656";
const RED_BG = "#fdecec";
const YEL = "#f7c948";
const BORDER = "#e0e6ec";
const F = "'Microsoft YaHei', sans-serif";
const MONO = "Consolas, 'Courier New', monospace";
const W = 1920;

const clamp = {extrapolateLeft: "clamp", extrapolateRight: "clamp"} as const;
const pulse = (f: number, period: number, min: number, max: number) =>
  min + (max - min) * (0.5 + 0.5 * Math.sin(f / period));
// 句 i 内按字符占比定位锚帧（规避 wordAt 分词边界陷阱）
const at = (i: number, frac: number) => SENT[i] + Math.round(frac * SENT_DUR[i]);

// 背景层（层0，慢漂移）
const BgDots: React.FC = () => {
  const frame = useCurrentFrame();
  const dx = interpolate(frame % 600, [0, 600], [0, 23]);
  const dy = interpolate(frame % 600, [0, 600], [0, 23]);
  return (
    <svg width={W} height={1080} style={{position: "absolute", left: -46, top: -46, pointerEvents: "none"}}>
      <defs>
        <pattern id="kt-dots" width="46" height="46" patternUnits="userSpaceOnUse">
          <circle cx="23" cy="23" r="2.6" fill="#dbe4ee" />
        </pattern>
      </defs>
      <rect width={W + 92} height={1080 + 92} fill="url(#kt-dots)" opacity={0.5} transform={`translate(${dx} ${dy})`} />
      <circle cx={170} cy={140} r={200} fill={BLUE_BG} opacity={0.45} />
      <circle cx={W - 160} cy={960} r={220} fill={ORANGE_BG} opacity={0.4} />
    </svg>
  );
};

const BigTitle: React.FC<{parts: {t: string; c: string}[]; y?: number; size?: number}> = ({
  parts, y = 64, size = 78,
}) => {
  const total = parts.reduce((a, x) => a + x.t.length, 0);
  const tw = total * size;
  return (
    <div style={{position: "absolute", top: y, left: 0, width: W, textAlign: "center"}}>
      <div style={{position: "relative", display: "inline-block"}}>
        <div style={{fontSize: size, fontWeight: 900, fontFamily: F, letterSpacing: 5, whiteSpace: "nowrap"}}>
          {parts.map((x, i) => <span key={i} style={{color: x.c}}>{x.t}</span>)}
        </div>
        <svg width={tw * 0.6} height={18} style={{position: "absolute", left: "50%", transform: "translateX(-50%)", bottom: -14, overflow: "visible"}}>
          <path d={`M 4 9 ${Array.from({length: Math.max(2, Math.round(tw * 0.6 / 36))}).map(() => `q 9 -10 18 0 q 9 10 18 0`).join(" ")}`}
            fill="none" stroke={YEL} strokeWidth={7} strokeLinecap="round" />
        </svg>
      </div>
    </div>
  );
};

const Sparkle: React.FC<{x: number; y: number; s?: number; color?: string; phase?: number}> = ({
  x, y, s = 1, color = YEL, phase = 0,
}) => {
  const frame = useCurrentFrame();
  const o = pulse(frame + phase * 20, 16, 0.45, 1);
  return (
    <svg width={54 * s} height={54 * s} style={{position: "absolute", left: x, top: y, overflow: "visible", opacity: o}}>
      <path d="M 27 2 L 32 22 L 52 27 L 32 32 L 27 52 L 22 32 L 2 27 L 22 22 Z" fill={color} />
    </svg>
  );
};

const FlatCard: React.FC<{
  x: number; y: number; w: number; h: number;
  chip?: string; chipColor?: string; fill?: string; children?: React.ReactNode;
}> = ({x, y, w, h, chip, chipColor = BLUE, fill = "#ffffff", children}) => (
  <>
    <div style={{
      position: "absolute", left: x, top: y, width: w, height: h,
      backgroundColor: fill, border: `3px solid ${BORDER}`, borderRadius: 26,
      boxShadow: "0 10px 26px rgba(47,58,69,0.07)",
    }}>{children}</div>
    {chip ? (
      <div style={{
        position: "absolute", left: x + w / 2 - (chip.length * 20 + 26), top: y - 28,
        width: chip.length * 40 + 52, height: 56, borderRadius: 999,
        backgroundColor: chipColor, color: "#fff", display: "flex",
        alignItems: "center", justifyContent: "center",
        fontSize: 32, fontWeight: 900, letterSpacing: 3,
        boxShadow: `0 8px 18px ${chipColor}44`,
      }}>{chip}</div>
    ) : null}
  </>
);

const MarkNo: React.FC<{x: number; y: number; s?: number; c?: string}> = ({x, y, s = 1, c = RED}) => (
  <svg width={60 * s} height={60 * s} viewBox="0 0 60 60"
    style={{position: "absolute", left: x - 30 * s, top: y - 30 * s, overflow: "visible"}}>
    <circle cx={30} cy={30} r={28} fill={c} />
    <path d="M20 20 L40 40 M40 20 L20 40" stroke="#fff" strokeWidth={7} strokeLinecap="round" />
  </svg>
);

// 红色印章（斜盖，盖章后小抖）
const Stamp: React.FC<{x: number; y: number; text: string; s?: number; rot?: number; color?: string; born?: number}> = ({
  x, y, text, s = 1, rot = -14, color = RED, born = -99,
}) => {
  const frame = useCurrentFrame();
  const wig = born >= 0 && frame >= born
    ? Math.sin((frame - born) / 2.2) * Math.max(0, 1 - (frame - born) / 14) * 3
    : 0;
  return (
    <div style={{
      position: "absolute", left: x, top: y,
      transform: `rotate(${rot + wig}deg) scale(${s})`,
      border: `7px solid ${color}`, borderRadius: 18, padding: "10px 26px",
      color, fontFamily: F, fontSize: 58, fontWeight: 900, letterSpacing: 10,
      backgroundColor: "rgba(255,255,255,0.82)", whiteSpace: "nowrap",
      boxShadow: "0 6px 18px rgba(224,86,86,0.25)",
    }}>{text}</div>
  );
};

// 勾选框（判断标准达标后打勾）
const CheckBox: React.FC<{x: number; y: number; born: number; s?: number}> = ({x, y, born, s = 1}) => {
  const frame = useCurrentFrame();
  const done = frame >= born;
  return (
    <svg width={64 * s} height={64 * s} viewBox="0 0 64 64"
      style={{position: "absolute", left: x, top: y, overflow: "visible"}}>
      <rect x={4} y={4} width={56} height={56} rx={12}
        fill={done ? GREEN : "#fff"} stroke={done ? GREEN : SUBC} strokeWidth={5} />
      {done && <path d="M18 33 L28 43 L46 21" fill="none" stroke="#fff" strokeWidth={7} strokeLinecap="round" strokeLinejoin="round" />}
    </svg>
  );
};

const Label: React.FC<{x: number; y: number; w: number; text: string; color?: string; size?: number}> = ({
  x, y, w, text, color = SUBC, size = 30,
}) => (
  <div style={{
    position: "absolute", left: x, top: y, width: w, textAlign: "center",
    fontFamily: F, fontSize: size, color, fontWeight: 700, whiteSpace: "nowrap",
  }}>{text}</div>
);

// 书本图标（P4 高频题牌用）
const BookIcon: React.FC<{x: number; y: number; s?: number; c?: string}> = ({x, y, s = 1, c = BLUE}) => (
  <svg width={92 * s} height={74 * s} viewBox="0 0 92 74"
    style={{position: "absolute", left: x, top: y, overflow: "visible"}}>
    <rect x={10} y={8} width={34} height={58} rx={6} fill={c} />
    <rect x={48} y={8} width={34} height={58} rx={6} fill={c} opacity={0.75} />
    <rect x={16} y={20} width={22} height={5} rx={2} fill="#fff" opacity={0.85} />
    <rect x={16} y={32} width={22} height={5} rx={2} fill="#fff" opacity={0.85} />
    <rect x={54} y={20} width={22} height={5} rx={2} fill="#fff" opacity={0.85} />
    <rect x={54} y={32} width={22} height={5} rx={2} fill="#fff" opacity={0.85} />
  </svg>
);

// 开题报告文档卡（P1 主体：两张同款卡相撞=撞车意象）
const KaitiDoc: React.FC<{x: number; y: number; rot: number; born?: number}> = ({x, y, rot, born = -99}) => {
  const frame = useCurrentFrame();
  const shake = born >= 0 && frame >= born
    ? Math.sin((frame - born) / 1.8) * Math.max(0, 1 - (frame - born) / 12) * 7
    : 0;
  return (
    <div style={{position: "absolute", left: x + shake, top: y, transform: `rotate(${rot}deg)`}}>
      <div style={{width: 430, height: 280, backgroundColor: "#fff", border: `3px solid ${BORDER}`, borderRadius: 18, boxShadow: "0 12px 28px rgba(47,58,69,0.12)", padding: "18px 30px", position: "relative"}}>
        <div style={{fontFamily: F, fontSize: 32, fontWeight: 900, color: INK, borderBottom: `3px solid ${BORDER}`, paddingBottom: 8, whiteSpace: "nowrap"}}>开题报告</div>
        <div style={{marginTop: 16}}>
          <div style={{width: 340, height: 12, borderRadius: 6, backgroundColor: "#e6ebf1", marginBottom: 12}}/>
          <div style={{width: 300, height: 12, borderRadius: 6, backgroundColor: "#e6ebf1", marginBottom: 12}}/>
          <div style={{width: 320, height: 12, borderRadius: 6, backgroundColor: "#e6ebf1"}}/>
        </div>
        <div style={{position: "absolute", left: 24, bottom: 16, fontFamily: F, fontSize: 26, fontWeight: 900, color: SUBC, whiteSpace: "nowrap"}}>基于SSM的幼儿园管理系统</div>
      </div>
    </div>
  );
};

// ============ P1 钩子（三拍递进：文档打回 → 双卡相撞 → 前三届排重） ============
const PageHook: React.FC = () => {
  const frame = useCurrentFrame();
  const tZhu = at(0, 0.5);
  const tFly = at(1, 0.35);
  const tHit = at(1, 0.62);
  const x2 = interpolate(frame, [tFly, tHit], [1560, 1010], clamp);
  return (
    <AbsoluteFill>
      <div style={{position: "absolute", left: 64, top: 40, width: 344}}>
        <div style={{width: 344, height: 52, borderRadius: 999, border: `3px solid ${ORANGE}`, color: ORANGE, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: F, fontSize: 26, fontWeight: 900, letterSpacing: 3, backgroundColor: "rgba(255,255,255,0.75)", whiteSpace: "nowrap"}}>毕设通关 · 第 02 期</div>
      </div>
      <BigTitle parts={[{t: "开题报告被打回，是因为", c: INK}, {t: "写得差", c: RED}, {t: "？", c: INK}]} y={140} size={72} />
      <div style={{position: "absolute", right: 60, top: 300, fontFamily: F, fontSize: 220, fontWeight: 900, color: "#e7edf4", width: 240, textAlign: "center", opacity: pulse(frame, 18, 0.3, 0.7)}}>?</div>

      {/* 第一拍：文档被批注重写（第0帧在场） */}
      <KaitiDoc x={430} y={340} rot={-5} born={tHit} />
      <PopAt f={tZhu}>
        <Stamp x={490} y={555} text="重写" s={0.62} rot={-18} born={tZhu} />
      </PopAt>

      {/* 第二拍：同款文档飞入相撞（题目撞车） */}
      {frame >= tFly && (
        <div style={{position: "absolute", left: x2, top: 372, transform: "rotate(6deg)", opacity: interpolate(frame, [tFly, tFly + 4], [0, 1], clamp)}}>
          <KaitiDoc x={0} y={0} rot={0} born={tHit} />
        </div>
      )}
      <PopAt f={tHit}>
        <Stamp x={855} y={395} text="撞 题" s={1.15} rot={-12} born={tHit} />
      </PopAt>
      <PopAt f={tHit}><Sparkle x={820} y={320} s={0.9} phase={0} /></PopAt>
      <PopAt f={tHit + 6}><Sparkle x={1230} y={560} s={0.75} color="#f2d9a8" phase={1} /></PopAt>

      {/* 第三拍：近三届排重（逐个弹入） */}
      {[
        {t: "2023 届 · 已用", f: at(2, 0.35), x: 330},
        {t: "2024 届 · 已用", f: at(2, 0.55), x: 750},
        {t: "2025 届 · 已用", f: at(2, 0.75), x: 1170},
      ].map((c, i) => (
        <PopAt key={i} f={c.f}>
          <div style={{
            position: "absolute", left: c.x, top: 790, width: 420, height: 80,
            borderRadius: 999, backgroundColor: "#fff", border: `3px solid ${RED}`,
            display: "flex", alignItems: "center", justifyContent: "center", gap: 12,
          }}>
            <span style={{fontFamily: F, fontSize: 34, fontWeight: 900, color: INK, whiteSpace: "nowrap"}}>{c.t}</span>
            <span style={{fontFamily: F, fontSize: 34, fontWeight: 900, color: RED}}>✗</span>
          </div>
        </PopAt>
      ))}
      <PopAt f={at(2, 0.9)}>
        <Label x={0} y={722} w={W} text="你的题目，老师手里有一张近三届清单" color={SUBC} size={30} />
      </PopAt>
      <Sparkle x={300} y={300} s={0.7} phase={2} />
    </AbsoluteFill>
  );
};

// ============ P2 前缀双例对比（收藏点：加前缀防撞题） ============
const PageVs: React.FC = () => {
  const frame = useCurrentFrame();
  const activeL = frame >= SENT[4] && frame < SENT[5];
  const activeR = frame >= SENT[5] && frame < SENT[6];
  const glowL = interpolate(frame, [SENT[4], SENT[4] + 6], [0, 1], clamp);
  const glowR = interpolate(frame, [SENT[5], SENT[5] + 6], [0, 1], clamp);
  const scaleL = activeL ? 1.04 : 1;
  const scaleR = activeR ? 1.04 : 1;
  return (
    <AbsoluteFill>
      <BigTitle parts={[{t: "同一个系统，", c: INK}, {t: "两种写法", c: ORANGE}]} y={90} size={66} />
      <PopAt f={SENT[3] + 4}>
        <div style={{position: "absolute", left: 110, top: 290, width: 820, height: 420, transform: `scale(${scaleL})`, transformOrigin: "center center"}}>
          {frame >= SENT[4] && <div style={{position: "absolute", left: -7, top: -7, width: 834, height: 434, border: `6px solid ${RED}`, borderRadius: 28, boxShadow: `0 0 0 6px rgba(224,86,86,0.15)`, opacity: glowL}} />}
          <FlatCard x={0} y={0} w={820} h={420} chip="改前" chipColor={RED} fill={RED_BG}>
            <div style={{position: "absolute", left: 0, top: 120, width: 820, textAlign: "center"}}>
              <div style={{fontFamily: F, fontSize: 48, fontWeight: 900, color: INK, whiteSpace: "nowrap"}}>基于<span style={{color: BLUE}}>SSM</span>的幼儿园管理系统</div>
            </div>
            <div style={{position: "absolute", left: 210, top: 280, width: 400, height: 74, borderRadius: 999, backgroundColor: "#fff", border: `3px solid ${RED}`, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: F, fontSize: 34, fontWeight: 900, color: RED}}>
              一查一大把
            </div>
          </FlatCard>
        </div>
      </PopAt>
      <PopAt f={SENT[3] + 16}>
        <div style={{position: "absolute", left: 990, top: 290, width: 820, height: 420, transform: `scale(${scaleR})`, transformOrigin: "center center"}}>
          {frame >= SENT[5] && <div style={{position: "absolute", left: -7, top: -7, width: 834, height: 434, border: `6px solid ${GREEN}`, borderRadius: 28, boxShadow: `0 0 0 6px rgba(63,174,122,0.15)`, opacity: glowR}} />}
          <FlatCard x={0} y={0} w={820} h={420} chip="改后" chipColor={GREEN} fill={GREEN_BG}>
            <div style={{position: "absolute", left: 0, top: 120, width: 820, textAlign: "center"}}>
              <div style={{fontFamily: F, fontSize: 42, fontWeight: 900, color: INK, whiteSpace: "nowrap"}}>基于<span style={{color: BLUE}}>SSM</span>的「<span style={{color: ORANGE}}>智慧蓝天</span>」幼儿园管理系统</div>
            </div>
            <div style={{position: "absolute", left: 210, top: 280, width: 400, height: 74, borderRadius: 999, backgroundColor: "#fff", border: `3px solid ${GREEN}`, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: F, fontSize: 34, fontWeight: 900, color: GREEN}}>
              全院独一份
            </div>
          </FlatCard>
        </div>
      </PopAt>
      <PopAt f={at(6, 0.12) - 4}>
        <div style={{position: "absolute", left: 460, top: 806, width: 1000, height: 88, backgroundColor: ORANGE, borderRadius: 999, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 10px 24px rgba(240,145,45,0.35)"}}>
          <div style={{fontFamily: F, fontWeight: 900, fontSize: 42, color: "#fff", whiteSpace: "nowrap"}}>加前缀 · 防撞题</div>
        </div>
      </PopAt>
      <Sparkle x={930} y={300} s={0.75} phase={1} />
      <Sparkle x={1800} y={280} s={0.6} color="#f2d9a8" phase={2} />
    </AbsoluteFill>
  );
};

// ============ P3 撞题的代价 + 三检查预告 ============
const PageStake: React.FC = () => (
  <AbsoluteFill>
    <BigTitle parts={[{t: "题目撞了，", c: INK}, {t: "代价不小", c: RED}]} y={110} size={80} />
    <PopAt f={at(7, 0.3) - 4}>
      <FlatCard x={230} y={330} w={680} h={300} chip="轻" chipColor={SUBC} fill={RED_BG}>
        <div style={{position: "absolute", left: 0, top: 70, width: 680, textAlign: "center", fontFamily: F, fontSize: 58, fontWeight: 900, color: INK}}>打回重写</div>
        <div style={{position: "absolute", left: 0, top: 170, width: 680, textAlign: "center", fontFamily: F, fontSize: 32, fontWeight: 800, color: SUBC}}>开题报告从头再来</div>
      </FlatCard>
    </PopAt>
    <PopAt f={at(7, 0.62) - 4}>
      <FlatCard x={1010} y={330} w={680} h={300} chip="重" chipColor={RED} fill="#fbe3e3">
        <div style={{position: "absolute", left: 0, top: 70, width: 680, textAlign: "center", fontFamily: F, fontSize: 58, fontWeight: 900, color: RED}}>换题重做</div>
        <div style={{position: "absolute", left: 0, top: 170, width: 680, textAlign: "center", fontFamily: F, fontSize: 32, fontWeight: 800, color: SUBC}}>整个学期推倒重来</div>
      </FlatCard>
    </PopAt>
    <PopAt f={at(8, 0.4) - 4}>
      <Label x={0} y={700} w={W} text="防撞题，开题前做好三个检查" color={INK} size={36} />
    </PopAt>
    {[
      {t: "一 避高频", f: at(8, 0.5)},
      {t: "二 收范围", f: at(8, 0.62)},
      {t: "三 定技术", f: at(8, 0.74)},
    ].map((x, i) => (
      <PopAt key={i} f={x.f}>
        <div style={{
          position: "absolute", left: 330 + i * 430, top: 790, width: 360, height: 84,
          borderRadius: 999, backgroundColor: "#fff", border: `3px solid ${ORANGE}`,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontFamily: F, fontSize: 36, fontWeight: 900, color: INK, whiteSpace: "nowrap",
        }}>{x.t}</div>
      </PopAt>
    ))}
    <Sparkle x={1700} y={230} s={0.7} phase={1} />
    <Sparkle x={200} y={260} s={0.6} color="#f2d9a8" phase={2} />
  </AbsoluteFill>
);

// ============ P4 检查一：避开高频题 ============
const PageHigh: React.FC = () => (
  <AbsoluteFill>
    <div style={{position: "absolute", left: 660, top: 50, width: 300}}>
      <div style={{width: 300, height: 56, borderRadius: 999, backgroundColor: ORANGE, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: F, fontSize: 30, fontWeight: 900, letterSpacing: 6}}>检查一</div>
    </div>
    <BigTitle parts={[{t: "避开", c: INK}, {t: "高频题", c: RED}]} y={130} size={84} />

    {[
      {name: "图书管理", x: 290, f: at(9, 0.22)},
      {name: "教务管理", x: 1030, f: at(9, 0.42)},
    ].map((b, i) => (
      <PopAt key={i} f={b.f}>
        <div style={{position: "absolute", left: b.x, top: 350, width: 600, height: 200, backgroundColor: "#fff", border: `3px solid ${BORDER}`, borderRadius: 22, boxShadow: "0 10px 26px rgba(47,58,69,0.07)"}}>
          <BookIcon x={40} y={62} s={0.9} c={i === 0 ? BLUE : ORANGE} />
          <div style={{position: "absolute", left: 170, top: 62, fontFamily: F, fontSize: 52, fontWeight: 900, color: INK, whiteSpace: "nowrap"}}>{b.name}</div>
          <div style={{position: "absolute", left: 170, top: 132, fontFamily: F, fontSize: 30, fontWeight: 800, color: SUBC, whiteSpace: "nowrap"}}>历代同款 · 用了不知道多少届</div>
          <PopAt f={b.f + 14}><MarkNo x={560} y={60} s={0.95} /></PopAt>
        </div>
      </PopAt>
    ))}

    <PopAt f={at(9, 0.78) - 4}>
      <div style={{position: "absolute", left: 360, top: 680, width: 1200, height: 88, backgroundColor: "#fff", border: `4px solid ${GREEN}`, borderRadius: 999, display: "flex", alignItems: "center", justifyContent: "center", gap: 16}}>
        <span style={{fontFamily: F, fontSize: 38, fontWeight: 900, color: INK, whiteSpace: "nowrap"}}>判断标准：近三届出现过的，</span>
        <span style={{fontFamily: F, fontSize: 38, fontWeight: 900, color: RED, whiteSpace: "nowrap"}}>直接划掉</span>
      </div>
    </PopAt>
    <PopAt f={at(9, 0.9)}>
      <CheckBox x={1520} y={692} born={at(9, 0.9)} s={0.95} />
    </PopAt>
    <Sparkle x={240} y={620} s={0.65} color="#f2d9a8" phase={1} />
  </AbsoluteFill>
);

// ============ P5 检查二：范围收窄 ============
const PageNarrow: React.FC = () => (
  <AbsoluteFill>
    <div style={{position: "absolute", left: 660, top: 50, width: 300}}>
      <div style={{width: 300, height: 56, borderRadius: 999, backgroundColor: ORANGE, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: F, fontSize: 30, fontWeight: 900, letterSpacing: 6}}>检查二</div>
    </div>
    <BigTitle parts={[{t: "范围", c: INK}, {t: "收窄", c: ORANGE}]} y={130} size={84} />
    <PopAt f={at(10, 0.4) - 4}>
      <Label x={0} y={280} w={W} text="题目越大越容易撞，收窄就没人跟你挤" color={INK} size={38} />
    </PopAt>

    {[
      {from: "商城系统", to: "生鲜商城", f: at(11, 0.12)},
      {from: "旅游系统", to: "某城市旅游攻略", f: at(11, 0.45)},
    ].map((r, i) => (
      <PopAt key={i} f={r.f}>
        <div style={{position: "absolute", left: 260, top: 400 + i * 180, width: 1400, height: 130, display: "flex", alignItems: "center", justifyContent: "center", gap: 30}}>
          <div style={{width: 460, height: 110, borderRadius: 18, backgroundColor: RED_BG, border: `3px solid ${RED}`, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: F, fontSize: 44, fontWeight: 900, color: INK, whiteSpace: "nowrap"}}>{r.from}</div>
          <span style={{fontFamily: F, fontSize: 60, fontWeight: 900, color: ORANGE}}>→</span>
          <div style={{width: 620, height: 110, borderRadius: 18, backgroundColor: GREEN_BG, border: `3px solid ${GREEN}`, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: F, fontSize: 44, fontWeight: 900, color: INK, whiteSpace: "nowrap"}}>{r.to}</div>
        </div>
      </PopAt>
    ))}

    <PopAt f={at(11, 0.8) - 4}>
      <div style={{position: "absolute", left: 460, top: 790, width: 1000, height: 88, backgroundColor: GREEN, borderRadius: 999, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 10px 24px rgba(63,174,122,0.3)"}}>
        <span style={{fontFamily: F, fontSize: 40, fontWeight: 900, color: "#fff", whiteSpace: "nowrap"}}>收窄一步，撞车的人少一截</span>
      </div>
    </PopAt>
    <Sparkle x={1650} y={320} s={0.7} phase={0} />
    <Sparkle x={230} y={560} s={0.6} color="#f2d9a8" phase={2} />
  </AbsoluteFill>
);

// ============ P6 检查三：技术选型先想好 ============
const PageTech: React.FC = () => (
  <AbsoluteFill>
    <div style={{position: "absolute", left: 660, top: 50, width: 300}}>
      <div style={{width: 300, height: 56, borderRadius: 999, backgroundColor: ORANGE, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: F, fontSize: 30, fontWeight: 900, letterSpacing: 6}}>检查三</div>
    </div>
    <BigTitle parts={[{t: "技术选型，", c: INK}, {t: "先想好", c: ORANGE}]} y={130} size={80} />

    <PopAt f={at(12, 0.3) - 4}>
      <FlatCard x={230} y={320} w={700} h={330} chip="Java 方向" chipColor={BLUE} fill={BLUE_BG}>
        <div style={{position: "absolute", left: 0, top: 90, width: 700, textAlign: "center", fontFamily: MONO, fontSize: 40, fontWeight: 900, color: INK, whiteSpace: "nowrap"}}>SpringBoot · SSM · MySQL</div>
        <div style={{position: "absolute", left: 0, top: 190, width: 700, textAlign: "center", fontFamily: F, fontSize: 30, fontWeight: 800, color: SUBC}}>管理系统 · 网站类项目主力</div>
      </FlatCard>
    </PopAt>
    <PopAt f={at(12, 0.5) - 4}>
      <FlatCard x={990} y={320} w={700} h={330} chip="Python 方向" chipColor={ORANGE} fill={ORANGE_BG}>
        <div style={{position: "absolute", left: 0, top: 90, width: 700, textAlign: "center", fontFamily: MONO, fontSize: 40, fontWeight: 900, color: INK, whiteSpace: "nowrap"}}>Django · 爬虫 · 数据分析</div>
        <div style={{position: "absolute", left: 0, top: 190, width: 700, textAlign: "center", fontFamily: F, fontSize: 30, fontWeight: 800, color: SUBC}}>可视化 · 大数据类项目主力</div>
      </FlatCard>
    </PopAt>

    <PopAt f={at(13, 0.3) - 4}>
      <div style={{position: "absolute", left: 360, top: 700, width: 1200, height: 84, backgroundColor: "#fff", border: `3px solid ${BORDER}`, borderRadius: 999, display: "flex", alignItems: "center", justifyContent: "center"}}>
        <span style={{fontFamily: F, fontSize: 36, fontWeight: 900, color: INK, whiteSpace: "nowrap"}}>开发软件想清楚：</span>
        <span style={{fontFamily: MONO, fontSize: 36, fontWeight: 900, color: BLUE, whiteSpace: "nowrap"}}>IDEA · VS Code · PyCharm</span>
      </div>
    </PopAt>
    <PopAt f={at(13, 0.7) - 4}>
      <div style={{position: "absolute", left: 510, top: 806, width: 900, height: 84, backgroundColor: ORANGE, borderRadius: 999, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 10px 24px rgba(240,145,45,0.35)"}}>
        <span style={{fontFamily: F, fontSize: 38, fontWeight: 900, color: "#fff", whiteSpace: "nowrap"}}>老师一问，就要答得上</span>
      </div>
    </PopAt>
    <Sparkle x={1750} y={260} s={0.7} phase={1} />
  </AbsoluteFill>
);

// ============ P7 定题 vs 自拟 ============
const PageAssign: React.FC = () => (
  <AbsoluteFill>
    <BigTitle parts={[{t: "定题 vs 自拟，", c: INK}, {t: "都通", c: GREEN}]} y={110} size={78} />
    <PopAt f={SENT[14] + 4}>
      <FlatCard x={230} y={330} w={700} h={360} chip="老师定题" chipColor={BLUE} fill={BLUE_BG}>
        <div style={{position: "absolute", left: 0, top: 80, width: 700, textAlign: "center", fontFamily: F, fontSize: 52, fontWeight: 900, color: INK}}>看中就赶紧选</div>
        <div style={{position: "absolute", left: 0, top: 200, width: 700, textAlign: "center"}}>
          <span style={{fontFamily: F, fontSize: 36, fontWeight: 900, color: BLUE, backgroundColor: "#fff", border: `3px solid ${BLUE}`, borderRadius: 999, padding: "10px 30px", whiteSpace: "nowrap"}}>好题手快有</span>
        </div>
      </FlatCard>
    </PopAt>
    <PopAt f={SENT[15] + 4}>
      <FlatCard x={990} y={330} w={700} h={360} chip="自己拟题" chipColor={GREEN} fill={GREEN_BG}>
        <div style={{position: "absolute", left: 0, top: 80, width: 700, textAlign: "center", fontFamily: F, fontSize: 52, fontWeight: 900, color: INK}}>核心就一条</div>
        <div style={{position: "absolute", left: 0, top: 200, width: 700, textAlign: "center"}}>
          <span style={{fontFamily: F, fontSize: 36, fontWeight: 900, color: GREEN, backgroundColor: "#fff", border: `3px solid ${GREEN}`, borderRadius: 999, padding: "10px 30px", whiteSpace: "nowrap"}}>别跟前三届重复</span>
        </div>
      </FlatCard>
    </PopAt>
    <Sparkle x={1660} y={300} s={0.7} phase={0} />
    <Sparkle x={210} y={280} s={0.6} color="#f2d9a8" phase={2} />
  </AbsoluteFill>
);

// ============ P8 金句（停用底部字幕） ============
const PageQuote: React.FC = () => {
  const frame = useCurrentFrame();
  const breathe = 1 + Math.sin(frame / 16) * 0.008;
  return (
    <AbsoluteFill>
      <PopAt f={SENT[16] + 2}>
        <div style={{position: "absolute", left: 0, top: 220, width: W, textAlign: "center"}}>
          <span style={{fontFamily: F, fontSize: 40, fontWeight: 900, color: SUBC, backgroundColor: "#eef2f6", borderRadius: 999, padding: "10px 34px"}}>记住</span>
        </div>
      </PopAt>
      <div style={{position: "absolute", left: 210, top: 360, width: 1500, height: 300, backgroundColor: "rgba(247,201,72,0.25)", border: `5px solid ${YEL}`, borderRadius: 30, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 28, transform: `rotate(-1.5deg) scale(${breathe})`}}>
        <div style={{fontFamily: F, fontWeight: 900, fontSize: 76, color: INK, letterSpacing: 6, whiteSpace: "nowrap"}}>
          题目是<span style={{color: ORANGE}}>查出来</span>的，不是想出来的
        </div>
      </div>
      <PopAt f={SENT[17] + 2}>
        <div style={{position: "absolute", left: 0, top: 730, width: W, textAlign: "center"}}>
          <span style={{fontFamily: F, fontSize: 44, fontWeight: 900, color: INK, backgroundColor: "#fff", border: `3px solid ${BORDER}`, borderRadius: 999, padding: "12px 40px", whiteSpace: "nowrap"}}>
            动笔前先查一遍，<span style={{color: GREEN}}>开题少返工一轮</span>
          </span>
        </div>
      </PopAt>
      <Sparkle x={330} y={400} s={0.9} phase={0} />
      <Sparkle x={1580} y={470} s={0.7} color="#b8d4f2" phase={1} />
      <Sparkle x={1460} y={720} s={0.6} phase={2} />
    </AbsoluteFill>
  );
};

// ============ P9 结尾互动卡（选项数字卡，口播纯中文数字） ============
const PageAsk: React.FC = () => (
  <AbsoluteFill>
    <div style={{
      position: "absolute", top: 120, left: 260, right: 260,
      backgroundColor: "#ffffff", borderRadius: 24, padding: "44px 56px 38px",
      boxShadow: "0 18px 50px rgba(10,20,30,0.18)",
    }}>
      <div style={{display: "flex", alignItems: "center", justifyContent: "center", gap: 18, marginBottom: 34}}>
        <div style={{width: 56, height: 56, borderRadius: 14, backgroundColor: ORANGE, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 36, fontWeight: 900}}>?</div>
        <div style={{fontFamily: F, fontSize: 52, fontWeight: 900, color: INK, whiteSpace: "nowrap"}}>开题，你现在——</div>
      </div>
      <div style={{display: "flex", gap: 28, justifyContent: "center"}}>
        <div style={{width: 640, height: 220, borderRadius: 20, backgroundColor: BLUE_BG, border: `4px solid ${BLUE}`, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12}}>
          <div style={{fontFamily: F, fontSize: 38, fontWeight: 900, color: BLUE}}>1</div>
          <div style={{fontFamily: F, fontSize: 40, fontWeight: 900, color: INK, whiteSpace: "nowrap"}}>题目还没影</div>
        </div>
        <div style={{width: 640, height: 220, borderRadius: 20, backgroundColor: ORANGE_BG, border: `4px solid ${ORANGE}`, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12}}>
          <div style={{fontFamily: F, fontSize: 38, fontWeight: 900, color: ORANGE}}>2</div>
          <div style={{fontFamily: F, fontSize: 36, fontWeight: 900, color: INK, whiteSpace: "nowrap"}}>定好了，怕开题被打回</div>
        </div>
      </div>
      <div style={{textAlign: "center", marginTop: 28, fontFamily: F, fontSize: 32, fontWeight: 800, color: SUBC, whiteSpace: "nowrap"}}>
        评论区扣 1 或 2
      </div>
    </div>
    <div style={{position: "absolute", top: 840, left: 0, width: W, textAlign: "center"}}>
      <span style={{fontFamily: F, fontSize: 30, fontWeight: 800, color: SUBC}}>全栈小秋 · 毕设通关系列 02</span>
    </div>
    <Sparkle x={240} y={130} s={0.8} phase={0} />
    <Sparkle x={1690} y={160} s={0.6} color="#f2d9a8" phase={1} />
  </AbsoluteFill>
);

// ============ 页面编排 ============
const PAGES: {C: React.FC; from: number; dur: number}[] = [
  {C: PageHook, from: SENT[0], dur: SENT[3] - SENT[0]},
  {C: PageVs, from: SENT[3], dur: SENT[7] - SENT[3]},
  {C: PageStake, from: SENT[7], dur: SENT[9] - SENT[7]},
  {C: PageHigh, from: SENT[9], dur: SENT[10] - SENT[9]},
  {C: PageNarrow, from: SENT[10], dur: SENT[12] - SENT[10]},
  {C: PageTech, from: SENT[12], dur: SENT[14] - SENT[12]},
  {C: PageAssign, from: SENT[14], dur: SENT[16] - SENT[14]},
  {C: PageQuote, from: SENT[16], dur: SENT[18] - SENT[16]},
  {C: PageAsk, from: SENT[18], dur: DUR - SENT[18]},
];

const SFX: {f: number; w: string; v: number}[] = [
  ...[0, 3, 7, 9, 10, 12, 14, 16, 18].map((i) => ({f: SENT[i], w: "whoosh.wav", v: 0.2})),
  {f: at(0, 0.5), w: "error.wav", v: 0.22},
  {f: at(1, 0.35), w: "whoosh.wav", v: 0.2},
  {f: at(1, 0.62), w: "error.wav", v: 0.26},
  {f: at(2, 0.35), w: "pop.wav", v: 0.22},
  {f: at(2, 0.55), w: "pop.wav", v: 0.22},
  {f: at(2, 0.75), w: "pop.wav", v: 0.22},
  {f: SENT[3] + 4, w: "pop.wav", v: 0.24},
  {f: SENT[3] + 16, w: "pop.wav", v: 0.24},
  {f: SENT[4] + 4, w: "alert.wav", v: 0.2},
  {f: SENT[5] + 4, w: "success.wav", v: 0.22},
  {f: at(6, 0.12) - 4, w: "ding.wav", v: 0.26},
  {f: at(7, 0.3) - 4, w: "error.wav", v: 0.22},
  {f: at(7, 0.62) - 4, w: "alert.wav", v: 0.2},
  {f: at(8, 0.5), w: "pop.wav", v: 0.24},
  {f: at(9, 0.22), w: "pop.wav", v: 0.24},
  {f: at(9, 0.42), w: "pop.wav", v: 0.24},
  {f: at(9, 0.36), w: "error.wav", v: 0.2},
  {f: at(9, 0.78) - 4, w: "ding.wav", v: 0.24},
  {f: at(11, 0.12), w: "pop.wav", v: 0.24},
  {f: at(11, 0.45), w: "pop.wav", v: 0.24},
  {f: at(11, 0.8) - 4, w: "success.wav", v: 0.24},
  {f: at(12, 0.3) - 4, w: "pop.wav", v: 0.24},
  {f: at(12, 0.5) - 4, w: "pop.wav", v: 0.24},
  {f: at(13, 0.3) - 4, w: "pop.wav", v: 0.24},
  {f: at(13, 0.7) - 4, w: "ding.wav", v: 0.26},
  {f: SENT[14] + 4, w: "pop.wav", v: 0.24},
  {f: SENT[15] + 4, w: "pop.wav", v: 0.24},
  {f: at(16, 0.5) - 4, w: "ding.wav", v: 0.28},
  {f: SENT[18] + 4, w: "pop.wav", v: 0.28},
  {f: SENT[18] + 20, w: "pop.wav", v: 0.24},
];

// 铁律⑫：金句段 [SENT[16], SENT[18]) 组件级停用字幕；52px 字幕（手机可读）
const Subtitles: React.FC = () => {
  const frame = useCurrentFrame();
  if (frame >= SENT[16] && frame < SENT[18]) return null;
  let cur = "";
  for (const s of SUBS) {
    if (frame >= s.f) cur = s.t;
  }
  if (!cur) return null;
  return (
    <div style={{position: "absolute", bottom: 24, left: 0, right: 0, display: "flex", justifyContent: "center"}}>
      <div style={{
        fontFamily: F, fontSize: 52, fontWeight: 900, color: "#f2f5f8",
        background: "rgba(20,32,44,0.82)", borderRadius: 12, padding: "12px 34px", whiteSpace: "nowrap",
      }}>{cur}</div>
    </div>
  );
};

export const BiSheKaitiFlat: React.FC = () => {
  const frame = useCurrentFrame();
  const bed = interpolate(frame, [0, 20, DUR - 130, DUR - 100, DUR - 26, DUR - 1], [0, 0.06, 0.06, 0.1, 0.17, 0], clamp);
  return (
    <AbsoluteFill style={{background: "linear-gradient(180deg,#fff 0%,#f3f6f9 100%)", fontFamily: F, overflow: "hidden"}}>
      <BgDots />
      {PAGES.map(({C, from, dur}, i) => (
        <HardPage key={i} from={from} duration={dur}>
          <C />
        </HardPage>
      ))}
      <BrandCorner light />

      {SENT.map((start, i) => (
        <Sequence key={`v-${i}`} from={start} durationInFrames={i < SENT.length - 1 ? SENT[i + 1] - start + 10 : DUR - start}>
          <Audio src={staticFile(`audio/kaiti-tts/s${("0" + (i + 1)).slice(-2)}.wav`)} volume={1} />
        </Sequence>
      ))}
      {SFX.map((s, i) => (
        <Sequence key={`sfx-${i}`} from={s.f} durationInFrames={22}>
          <Audio src={staticFile(`audio/sfx/${s.w}`)} volume={s.v} />
        </Sequence>
      ))}
      <Audio src={staticFile("audio/bed.wav")} loop volume={() => bed} />

      <Subtitles />
    </AbsoluteFill>
  );
};
