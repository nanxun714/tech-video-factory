import React from "react";
import {Audio} from "@remotion/media";
import {
  AbsoluteFill, OffthreadVideo, Sequence, interpolate, staticFile, useCurrentFrame,
} from "remotion";
import {DUR, END_SENTS, END_START, SCENES, LiveScene} from "./fitnessLiveData";

const F = "'Microsoft YaHei', 'PingFang SC', sans-serif";
const clamp = {extrapolateLeft: "clamp", extrapolateRight: "clamp"} as const;

const GROUP_NAME: {[k: string]: string} = {"AI 助手": "人工智能"};

type Cap = {t: string; start: number; end: number};

const CAPS: Cap[] = (() => {
  const out: Cap[] = [];
  SCENES.forEach((sc) => {
    sc.sents.forEach((s, i) => {
      const next = sc.sents[i + 1];
      out.push({
        t: s.t,
        start: s.start,
        end: next ? next.start - 2 : sc.start + sc.dur - 4,
      });
    });
  });
  return out;
})();

const activeScene = (frame: number): LiveScene | null => {
  for (let i = SCENES.length - 1; i >= 0; i--) {
    const sc = SCENES[i];
    if (frame >= sc.start && frame < sc.start + sc.dur) return sc;
  }
  return null;
};

const activeCap = (frame: number): Cap | null => {
  for (let i = CAPS.length - 1; i >= 0; i--) {
    if (frame >= CAPS[i].start && frame < CAPS[i].end) return CAPS[i];
  }
  return null;
};

const fadeInOut = (frame: number, start: number, end: number, edge: number) =>
  Math.min(
    interpolate(frame, [start, start + edge], [0, 1], clamp),
    interpolate(frame, [end - edge, end], [1, 0], clamp),
  );

const SceneOverlay: React.FC<{scene: LiveScene; frame: number}> = ({scene, frame}) => {
  const end = scene.start + scene.dur;
  const opacity = fadeInOut(frame, scene.start, end, 8);
  const group = GROUP_NAME[scene.group] || scene.group;
  const label = group === scene.title ? scene.title : `${group} / ${scene.title}`;
  return (
    <>
      <div style={{
        position: "absolute", left: 44, bottom: 50, display: "flex", alignItems: "center", gap: 10,
        padding: "9px 18px", borderRadius: 999, background: "rgba(255,255,255,.94)",
        border: "1px solid #dfe5ee", boxShadow: "0 6px 20px rgba(15,23,42,.14)",
        fontFamily: F, fontSize: 19, color: "#334155", opacity,
      }}>
        <div style={{width: 8, height: 8, borderRadius: 4, background: "#2563eb"}} />
        <span>{label}</span>
      </div>
      {scene.aiMock ? (
        <div style={{
          position: "absolute", right: 44, bottom: 50, display: "flex", alignItems: "center", gap: 9,
          padding: "9px 16px", borderRadius: 999, background: "rgba(254,243,199,.96)",
          border: "1px solid #f3d38a", boxShadow: "0 6px 20px rgba(15,23,42,.12)",
          fontFamily: F, fontSize: 18, color: "#92400e", opacity,
        }}>
          <div style={{width: 8, height: 8, borderRadius: 4, background: "#d97706"}} />
          <span>人工智能：模拟模式</span>
        </div>
      ) : null}
    </>
  );
};

const Caption: React.FC<{frame: number}> = ({frame}) => {
  const cap = activeCap(frame);
  if (!cap) return null;
  const span = cap.end - cap.start;
  const edge = Math.min(6, Math.max(2, Math.floor(span / 6)));
  const opacity = fadeInOut(frame, cap.start, cap.end, edge);
  return (
    <AbsoluteFill style={{alignItems: "center", justifyContent: "flex-end", paddingBottom: 52}}>
      <div style={{
        maxWidth: 1360, textAlign: "center", padding: "13px 30px", borderRadius: 12,
        background: "rgba(15,23,42,.76)", color: "#fff", fontFamily: F, fontSize: 34,
        lineHeight: 1.45, letterSpacing: 0.4, opacity,
        textShadow: "0 1px 2px rgba(0,0,0,.35)",
      }}>
        {cap.t}
      </div>
    </AbsoluteFill>
  );
};

const EndCard: React.FC<{frame: number}> = ({frame}) => {
  const opacity = interpolate(frame, [END_START, END_START + 12], [0, 1], clamp);
  const line = interpolate(frame, [END_START + 6, END_START + 26], [0, 1], clamp);
  const shown = END_SENTS.filter((s) => frame >= s.start - 3).map((s) => s.t);
  return (
    <AbsoluteFill style={{
      background: "linear-gradient(135deg, #0b1220 0%, #101b31 55%, #0c1526 100%)",
      alignItems: "center", justifyContent: "center", opacity,
    }}>
      <div style={{width: 92, height: 6, borderRadius: 3, background: "#3b82f6", marginBottom: 34, transform: `scaleX(${line})`}} />
      <div style={{fontFamily: F, fontSize: 56, fontWeight: 700, color: "#f8fafc", letterSpacing: 3}}>
        演示结束
      </div>
      <div style={{fontFamily: F, fontSize: 26, color: "#93a4bd", marginTop: 16, letterSpacing: 1.2}}>
        画面为真实浏览器操作录制 · 原速播放
      </div>
      <div style={{display: "flex", gap: 14, marginTop: 40}}>
        {shown.map((t) => (
          <div key={t} style={{
            fontFamily: F, fontSize: 20, color: "#dbe5f3", padding: "9px 18px",
            border: "1px solid #23324b", borderRadius: 999, background: "rgba(30,44,68,.55)",
          }}>{t}</div>
        ))}
      </div>
      <div style={{fontFamily: F, fontSize: 18, color: "#64748b", marginTop: 34}}>
        数据来自本机演示库 · 测试账号
      </div>
    </AbsoluteFill>
  );
};

export const FitnessLive: React.FC = () => {
  const frame = useCurrentFrame();
  const audio = <Audio src={staticFile("audio/fitness-live/narration.wav")} />;
  if (frame >= END_START) {
    return (
      <AbsoluteFill style={{backgroundColor: "#0b1220"}}>
        <EndCard frame={frame} />
        {audio}
      </AbsoluteFill>
    );
  }
  const scene = activeScene(frame);
  return (
    <AbsoluteFill style={{backgroundColor: "#eef1f5"}}>
      {SCENES.map((sc) => (
        <Sequence key={sc.id} from={sc.start} durationInFrames={sc.dur} layout="none">
          <OffthreadVideo
            src={staticFile(sc.file)}
            muted
            style={{
              position: "absolute", inset: 0, width: "100%", height: "100%",
              objectFit: "cover",
            }}
          />
        </Sequence>
      ))}
      {audio}
      {scene ? <SceneOverlay scene={scene} frame={frame} /> : null}
      <Caption frame={frame} />
    </AbsoluteFill>
  );
};

export const FITNESS_LIVE_DUR = DUR;
