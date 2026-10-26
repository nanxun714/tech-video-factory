import React from "react";
import {
  Easing,
  interpolate,
  useCurrentFrame,
} from "remotion";

const FILL: React.CSSProperties = { position: "absolute", top: 0, left: 0, right: 0, bottom: 0 };

// ============================================================
// batch10 共用套件（2026-09-14 定稿）
// 边界一次设好：硬切翻页 / 底部字幕安全区 / 结尾截图卡 / 品牌角标
// 数据源：同目录 <topic>Data.ts（gen_batch10.py 生成，禁止手改）
// 已验收依据：InodeExhausted（judge 全过）+ HttpVsHttps 硬切版（预检 fail:false）
// ============================================================

export const B10 = {
  bg: "#1e2a38", // docker 深蓝灰底（flat 主题各自覆写）
  ink: "#14202c",
  orange: "#f0912d",
  blue: "#4a90d9",
  green: "#3fae7a",
  red: "#d9534f",
  paper: "#f7f5f0",
  gray: "#8fa0b2",
};

/** 页面切换：纯硬切。页内容从 from 帧起完整呈现，到 duration 结束即消失。
 *  禁止在此加 opacity 淡入淡出（铁律①，预检 diff<4 会判 FAIL_NO_HARD_CUT）。 */
export const HardPage: React.FC<{
  from: number;
  duration: number;
  children: React.ReactNode;
}> = ({ from, duration, children }) => {
  const frame = useCurrentFrame();
  if (frame < from || frame >= from + duration) return null;
  return <div style={FILL}>{children}</div>;
};

/** 静态元素标记：delay=-99 表示随页首帧即时完整呈现（标题/主视觉用） */
export const STATIC = -99;

/** 逐词弹入包装：f=词级锚点帧（WORDS 里查），出现前不渲染。
 *  页内元素用；页标题/主视觉用 STATIC 即时呈现。 */
export const PopAt: React.FC<{
  f: number;
  children: React.ReactNode;
  dy?: number;
  dur?: number;
}> = ({ f, children, dy = 18, dur = 12 }) => {
  const frame = useCurrentFrame();
  if (f === STATIC) return <>{children}</>;
  if (frame < f) return null;
  const p = interpolate(frame - f, [0, dur], [0, 1], {
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });
  return (
    <div
      style={{
        transform: `translateY(${(1 - p) * dy}px)`,
        opacity: p,
      }}
    >
      {children}
    </div>
  );
};

/** 品牌角标：右上角「全栈小秋」，禁 emoji。light=浅底深字 / dark=深底浅字 */
export const BrandCorner: React.FC<{ light?: boolean }> = ({ light = true }) => (
  <div
    style={{
      position: "absolute",
      top: 36,
      right: 48,
      fontFamily:
      "PingFang SC, Microsoft YaHei, sans-serif",
      fontSize: 26,
      fontWeight: 700,
      color: light ? B10.ink : "#e8eef4",
      border: `2px solid ${light ? B10.ink : "#e8eef4"}`,
      borderRadius: 28,
      padding: "6px 22px",
      background: "rgba(255,255,255,0.0)",
    }}
  >
    全栈小秋
  </div>
);

/** 底部逐字字幕：传入 SUBS 数据，按帧自动显示当前短语。
 *  安全区：bottom=28，高≥70；页面主体内容请保持在 y<900。 */
export const SubtitleBar: React.FC<{
  subs: { t: string; f: number }[];
  light?: boolean; // 底色浅时字幕用深色字
}> = ({ subs, light = false }) => {
  const frame = useCurrentFrame();
  let cur = "";
  for (const s of subs) {
    if (frame >= s.f) cur = s.t;
  }
  if (!cur) return null;
  return (
    <div
      style={{
        position: "absolute",
        bottom: 28,
        left: 0,
        right: 0,
        display: "flex",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          fontFamily: "PingFang SC, Microsoft YaHei, sans-serif",
          fontSize: 40,
          fontWeight: 700,
          color: light ? "#f2f5f8" : "#eef2f6",
          background: light ? "rgba(20,32,44,0.78)" : "rgba(20,32,44,0.78)",
          borderRadius: 10,
          padding: "10px 28px",
          whiteSpace: "nowrap",
        }}
      >
        {cur}
      </div>
    </div>
  );
};

/** 金句大字时段隐藏底部字幕（铁律⑫：大字与字幕不同帧重复）
 *  用法：<SubtitleBar subs={SUBS.filter(s => !(s.f>=GOLD.from && s.f<GOLD.to))} /> */

/** 结尾截图卡（白底黑字金句+三行核心点+落款+CTA）。
 *  已验收布局：卡 top=150，CTA top=736（字幕条上缘~968，bottom≥170 安全区）。
 *  行元素在卡出现后 20 帧内全部就位（delayFrom + 4/9/14）。
 *  出现时刻 startFrame 建议 = NARRATION_END - 70（音频先行画面延后）。 */
export const EndingCard: React.FC<{
  startFrame: number;
  title: React.ReactNode;
  rows: React.ReactNode[]; // 2~3 行核心点
  footer?: string; // 默认落款
  ctaText?: string; // 默认关注 CTA
  children?: React.ReactNode; // 额外自由区（金句大字等），渲染在卡上方
}> = ({
  startFrame,
  title,
  rows,
  footer = "全栈小秋 · 0 基础也能学会",
  ctaText = "关注 全栈小秋",
  children,
}) => {
  const frame = useCurrentFrame();
  if (frame < startFrame) return null;
  const rowDelay = [4, 9, 14];
  return (
    <div style={FILL}>
      {children}
      <div
        style={{
          position: "absolute",
          top: 150,
          left: 340,
          right: 340,
          background: "#ffffff",
          borderRadius: 24,
          padding: "44px 56px 36px",
          boxShadow: "0 18px 50px rgba(10,20,30,0.35)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 18,
            marginBottom: 30,
          }}
        >
          <div
            style={{
              width: 52,
              height: 52,
              borderRadius: 14,
              background: B10.orange,
              color: "#fff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 30,
              fontWeight: 800,
            }}
          >
            卡
          </div>
          <div
            style={{
              fontFamily: "PingFang SC, Microsoft YaHei, sans-serif",
              fontSize: 46,
              fontWeight: 800,
              color: B10.ink,
              whiteSpace: "nowrap",
            }}
          >
            {title}
          </div>
        </div>
        {rows.map((r, i) => (
          <div
            key={i}
            style={{
              background: "#f4f6f9",
              borderRadius: 14,
              padding: "20px 30px",
              marginBottom: 16,
              display: "flex",
              alignItems: "center",
              gap: 20,
              fontFamily: "PingFang SC, Microsoft YaHei, sans-serif",
              fontSize: 33,
              fontWeight: 700,
              color: B10.ink,
              opacity: interpolate(frame - startFrame, [rowDelay[i], rowDelay[i] + 8], [0, 1], {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
              }),
              transform: `translateY(${(
                1 -
                interpolate(frame - startFrame, [rowDelay[i], rowDelay[i] + 8], [0, 1], {
                  extrapolateLeft: "clamp",
                  extrapolateRight: "clamp",
                })
              ) * 14}px)`,
            }}
          >
            <span style={{ color: B10.orange, fontSize: 30, fontWeight: 800 }}>
              {"①②③"[i]}
            </span>
            <span style={{ whiteSpace: "nowrap" }}>{r}</span>
          </div>
        ))}
        <div
          style={{
            textAlign: "center",
            color: "#7a8899",
            fontSize: 26,
            fontFamily: "PingFang SC, Microsoft YaHei, sans-serif",
            marginTop: 10,
          }}
        >
          {footer}
        </div>
      </div>
      <div
        style={{
          position: "absolute",
          top: 736,
          left: 0,
          right: 0,
          display: "flex",
          justifyContent: "center",
          opacity: interpolate(frame - startFrame, [50, 62], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          }),
        }}
      >
        <div
          style={{
            background: B10.orange,
            color: "#fff",
            borderRadius: 40,
            padding: "20px 56px",
            fontSize: 34,
            fontWeight: 800,
            fontFamily: "PingFang SC, Microsoft YaHei, sans-serif",
            whiteSpace: "nowrap",
            boxShadow: "0 10px 24px rgba(240,145,45,0.4)",
          }}
        >
          {ctaText}
        </div>
      </div>
    </div>
  );
};

/** 在 WORDS 数据里查词锚帧：wordAt(WORDS, sentIdx, "缓存") → 首个匹配词的帧 */
export function wordAt(
  words: { t: string; f: number; sent: number }[],
  sent: number,
  text: string
): number {
  const w = words.find((x) => x.sent === sent && x.t.includes(text));
  return w ? w.f : STATIC;
}
