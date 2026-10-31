import React from "react";
import {Audio} from "@remotion/media";
import {
  AbsoluteFill, Img, interpolate, staticFile, useCurrentFrame,
} from "remotion";
import {DUR, SUBS, SHOTS, SENT} from "./fitnessDemoData";

// 智能健身管理系统 · 功能演示（16:9）
// 画面：真实后台截图 + 章节索引 + 步骤号 + 逐句字幕；长图在卡片内纵向滚动。
// 配音：GPT-SoVITS 曼波 speed=1.5，62 句，句间 GAP=0.06，无标点口播。

const INK = "#2b3440";
const SUBC = "#7d8894";
const LINE = "#e2e7ee";
const BLUE = "#3b6fe0";
const BG = "#f3f5f8";
const F = "'Microsoft YaHei', 'PingFang SC', sans-serif";

const CARD_X = 352;
const CARD_Y = 140;
const CARD_W = 1216;
const CARD_H = 760;

const clamp = {extrapolateLeft: "clamp", extrapolateRight: "clamp"} as const;

const CHAPTERS = SHOTS.reduce<string[]>((acc, s) => {
  if (acc.indexOf(s.chapter) < 0) acc.push(s.chapter);
  return acc;
}, []);

const currentShot = (frame: number) => {
  for (let i = SHOTS.length - 1; i >= 0; i--) {
    if (frame >= SHOTS[i].start) return i;
  }
  return 0;
};

const ShotImage: React.FC<{index: number; frame: number; opacity: number; panning: boolean}> = ({
  index, frame, opacity, panning,
}) => {
  const shot = SHOTS[index];
  if (!shot.img) return null;
  const scale = CARD_W / shot.w;
  const imgH = shot.h * scale;
  const panMax = Math.max(0, Math.min(imgH - CARD_H, 820));
  const span = Math.max(1, shot.end - shot.start);
  const local = frame - shot.start;
  const progress = panning && panMax > 0
    ? interpolate(local, [10, span - 6], [0, 1], clamp)
    : 0;
  return (
    <div style={{position: "absolute", inset: 0, overflow: "hidden", opacity}}>
      <Img
        src={staticFile(shot.img)}
        style={{
          width: CARD_W,
          height: "auto",
          display: "block",
          transform: `translateY(${-panMax * progress}px)`,
        }}
      />
    </div>
  );
};

const EndCard: React.FC = () => (
  <AbsoluteFill style={{alignItems: "center", justifyContent: "center", gap: 22}}>
    <div style={{fontSize: 64, fontWeight: 700, color: INK, letterSpacing: 2}}>
      智能健身管理系统
    </div>
    <div style={{fontSize: 28, color: SUBC, letterSpacing: 1}}>
      SpringBoot · Vue3 · MySQL · DeepSeek 接口
    </div>
    <div style={{display: "flex", gap: 14, marginTop: 18}}>
      {["记录", "分析", "指导"].map((t, i) => (
        <div key={t} style={{display: "flex", alignItems: "center", gap: 14}}>
          {i > 0 && <div style={{width: 26, height: 2, backgroundColor: LINE}} />}
          <div style={{
            fontSize: 26, color: INK, padding: "10px 24px",
            border: `1px solid ${LINE}`, borderRadius: 999,
          }}>{t}</div>
        </div>
      ))}
    </div>
  </AbsoluteFill>
);

export const FitnessDemo: React.FC = () => {
  const frame = useCurrentFrame();
  const idx = currentShot(frame);
  const shot = SHOTS[idx];
  const prev = idx > 0 ? SHOTS[idx - 1] : null;
  const enter = interpolate(frame, [shot.start, shot.start + 12], [0, 1], clamp);
  const entrance = idx === 0 ? 1 : enter;
  const prevVisible = prev && prev.img && frame < shot.start + 12;

  let sub = SUBS[0];
  for (let i = SUBS.length - 1; i >= 0; i--) {
    if (SUBS[i].f <= frame) { sub = SUBS[i]; break; }
  }
  const subOpacity = interpolate(frame, [sub.f, sub.f + 4], [0, 1], clamp);

  return (
    <AbsoluteFill style={{backgroundColor: BG, fontFamily: F}}>
      <div style={{
        position: "absolute", inset: 0,
        background: "radial-gradient(1200px 600px at 12% -10%, #e9eef7 0%, rgba(243,245,248,0) 70%)",
      }} />

      {/* 顶部标识 */}
      <div style={{position: "absolute", left: 72, top: 46, display: "flex", alignItems: "center", gap: 16}}>
        <div style={{
          width: 44, height: 44, borderRadius: 12, backgroundColor: BLUE,
          color: "#fff", fontSize: 24, fontWeight: 700,
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>健</div>
        <div style={{fontSize: 34, fontWeight: 700, color: INK, letterSpacing: 1}}>
          智能健身管理系统
        </div>
        <div style={{fontSize: 24, color: SUBC, marginLeft: 6}}>功能演示</div>
      </div>

      {/* 左侧章节 */}
      <div style={{position: "absolute", left: 72, top: 210, width: 236}}>
        {CHAPTERS.map((c, i) => {
          const on = c === shot.chapter;
          const passed = CHAPTERS.indexOf(shot.chapter) > i;
          return (
            <div key={c} style={{
              display: "flex", alignItems: "center", gap: 14,
              height: 84, opacity: on ? 1 : passed ? 0.62 : 0.38,
            }}>
              <div style={{
                width: 4, height: on ? 34 : 18, borderRadius: 2,
                backgroundColor: on ? BLUE : LINE,
                transition: "none",
              }} />
              <div style={{
                fontSize: on ? 28 : 25,
                fontWeight: on ? 700 : 400,
                color: on ? INK : SUBC,
              }}>{c}</div>
            </div>
          );
        })}
      </div>

      {/* 截图卡片 */}
      <div style={{
        position: "absolute", left: CARD_X, top: CARD_Y,
        width: CARD_W, height: CARD_H,
        backgroundColor: "#fff", borderRadius: 18,
        border: `1px solid ${LINE}`,
        boxShadow: "0 18px 50px rgba(43,52,64,0.09)",
        overflow: "hidden",
      }}>
        {prevVisible && prev && (
          <ShotImage index={idx - 1} frame={shot.start} opacity={1} panning={false} />
        )}
        <ShotImage index={idx} frame={frame} opacity={shot.img ? entrance : 0} panning />
        {!shot.img && (
          <div style={{position: "absolute", inset: 0, opacity: entrance}}>
            <EndCard />
          </div>
        )}
        {shot.aiMock && (
          <div style={{
            position: "absolute", right: 20, top: 20,
            padding: "8px 16px", borderRadius: 999,
            border: `1px solid ${LINE}`, backgroundColor: "rgba(255,255,255,0.94)",
            fontSize: 20, color: SUBC,
          }}>AI 当前为 Mock 演示</div>
        )}
      </div>

      {/* 右侧步骤 */}
      <div style={{position: "absolute", left: 1620, top: 214, width: 232}}>
        <div style={{display: "flex", alignItems: "baseline", gap: 8}}>
          <div style={{fontSize: 76, fontWeight: 700, color: INK, lineHeight: 1}}>
            {idx + 1 < 10 ? `0${idx + 1}` : String(idx + 1)}
          </div>
          <div style={{fontSize: 24, color: SUBC}}>/ {SHOTS.length}</div>
        </div>
        <div style={{width: 56, height: 3, backgroundColor: BLUE, margin: "28px 0 26px"}} />
        <div style={{fontSize: 30, fontWeight: 700, color: INK, lineHeight: 1.35}}>
          {shot.title}
        </div>
        <div style={{fontSize: 22, color: SUBC, marginTop: 10, lineHeight: 1.5}}>
          {shot.sub}
        </div>
        <div style={{fontSize: 20, color: SUBC, marginTop: 34, letterSpacing: 0.5}}>
          {shot.chapter}
        </div>
      </div>

      {/* 字幕 */}
      <div style={{
        position: "absolute", left: 0, right: 0, bottom: 56,
        display: "flex", justifyContent: "center",
      }}>
        <div style={{
          fontSize: 46, fontWeight: 600, color: INK,
          letterSpacing: 1, opacity: subOpacity,
          textShadow: "0 1px 0 rgba(255,255,255,0.8)",
          whiteSpace: "nowrap",
        }}>{sub.t}</div>
      </div>

      <Audio src={staticFile("audio/fitness-tts/narration.wav")} />
    </AbsoluteFill>
  );
};

export const FITNESS_DEMO_DUR = DUR;
export const FITNESS_DEMO_SENT = SENT;