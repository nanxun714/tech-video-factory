import React from "react";
import {Img, staticFile} from "remotion";
import {
  AbsoluteFill, interpolate, useCurrentFrame,
} from "remotion";

// ============ 竖屏试点效果小样（1080×1920，无声 8s，两种最难页型各一页） ============
// 目的：给用户预览抖音竖屏版式效果——非成片、无配音，时序为演示用硬编码。
// 页1（0~110）：钩子型——大标题+文档卡+撞题章+三胶囊
// 页2（110~240）：对比型——普通方向 vs 社区养老细化方向（嵌入真实截图 shots/11-family-home）
// 竖屏安全区约定（抖音）：顶部 y<180 留给状态栏，右侧 x>1000 留给互动栏，
// 底部 y>1520 留给文案/进度条；字幕条放 y≈1560。

import {HardPage, PopAt} from "./batch10/kit";

const INK = "#2f3a45";
const SUBC = "#7a8694";
const GREEN = "#3fae7a";
const GREEN_BG = "#e9f6ee";
const ORANGE = "#f0912d";
const RED = "#e05656";
const RED_BG = "#fdecec";
const BORDER = "#e0e6ec";
const F = "'Microsoft YaHei', sans-serif";
const W = 1080;

const clamp = {extrapolateLeft: "clamp", extrapolateRight: "clamp"} as const;
const pulse = (f: number, period: number, min: number, max: number) =>
  min + (max - min) * (0.5 + 0.5 * Math.sin(f / period));

const VStamp: React.FC<{x: number; y: number; text: string; s?: number; rot?: number; born: number}> = ({
  x, y, text, s = 1, rot = -12, born,
}) => {
  const frame = useCurrentFrame();
  const wig = frame >= born ? Math.sin((frame - born) / 2.2) * Math.max(0, 1 - (frame - born) / 14) * 3 : 0;
  return (
    <div style={{
      position: "absolute", left: x, top: y, transform: `rotate(${rot + wig}deg) scale(${s})`,
      border: `6px solid ${RED}`, borderRadius: 16, padding: "8px 22px",
      color: RED, fontFamily: F, fontSize: 52, fontWeight: 900, letterSpacing: 8,
      backgroundColor: "rgba(255,255,255,0.85)", whiteSpace: "nowrap",
      boxShadow: "0 6px 18px rgba(224,86,86,0.25)",
    }}>{text}</div>
  );
};

const VSparkle: React.FC<{x: number; y: number; s?: number; color?: string; phase?: number}> = ({
  x, y, s = 1, color = "#f7c948", phase = 0,
}) => {
  const frame = useCurrentFrame();
  const o = pulse(frame + phase * 20, 16, 0.45, 1);
  return (
    <svg width={48 * s} height={48 * s} style={{position: "absolute", left: x, top: y, overflow: "visible", opacity: o}}>
      <path d="M 24 2 L 29 20 L 47 24 L 29 29 L 24 47 L 19 29 L 1 24 L 19 20 Z" fill={color} />
    </svg>
  );
};

const VSub: React.FC<{text: string}> = ({text}) => (
  <div style={{position: "absolute", bottom: 320, left: 40, right: 40, display: "flex", justifyContent: "center"}}>
    <div style={{
      fontFamily: F, fontSize: 54, fontWeight: 900, color: "#f2f5f8",
      background: "rgba(20,32,44,0.82)", borderRadius: 12, padding: "12px 30px", whiteSpace: "nowrap",
    }}>{text}</div>
  </div>
);

// ---------- 页1：钩子 ----------
const PHook: React.FC = () => {
  return (
    <AbsoluteFill>
      <div style={{position: "absolute", left: 60, top: 190, width: 380}}>
        <div style={{width: 340, height: 50, borderRadius: 999, border: `3px solid ${ORANGE}`, color: ORANGE, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: F, fontSize: 26, fontWeight: 900, letterSpacing: 3, backgroundColor: "rgba(255,255,255,0.8)", whiteSpace: "nowrap"}}>毕设通关 · 第 02 期</div>
      </div>
      <div style={{position: "absolute", top: 280, left: 0, width: W, textAlign: "center", fontFamily: F, fontWeight: 900, fontSize: 82, lineHeight: 1.35, letterSpacing: 3}}>
        <div style={{color: INK}}>开题报告被打回，</div>
        <div>是因为<span style={{color: RED}}>写得差</span>？</div>
        <svg width={430} height={16} style={{position: "relative", left: "50%", transform: "translateX(-50%)", top: -6, overflow: "visible"}}>
          <path d={"M 4 8 " + Array.from({length: 11}).map(() => "q 9 -9 18 0 q 9 9 18 0").join(" ")} fill="none" stroke="#f7c948" strokeWidth={7} strokeLinecap="round" />
        </svg>
      </div>

      {/* 文档卡（第0帧在场） */}
      <div style={{position: "absolute", left: 110, top: 660, transform: "rotate(-3deg)"}}>
        <div style={{width: 860, height: 380, backgroundColor: "#fff", border: `3px solid ${BORDER}`, borderRadius: 22, boxShadow: "0 14px 30px rgba(47,58,69,0.12)", padding: "26px 40px", position: "relative"}}>
          <div style={{fontFamily: F, fontSize: 40, fontWeight: 900, color: INK, borderBottom: `3px solid ${BORDER}`, paddingBottom: 12}}>开题报告</div>
          <div style={{marginTop: 24}}>
            <div style={{width: 680, height: 16, borderRadius: 8, backgroundColor: "#e6ebf1", marginBottom: 18}}/>
            <div style={{width: 600, height: 16, borderRadius: 8, backgroundColor: "#e6ebf1", marginBottom: 18}}/>
            <div style={{width: 640, height: 16, borderRadius: 8, backgroundColor: "#e6ebf1"}}/>
          </div>
          <div style={{position: "absolute", left: 40, bottom: 24, fontFamily: F, fontSize: 32, fontWeight: 900, color: SUBC, whiteSpace: "nowrap"}}>基于SSM的幼儿园管理系统</div>
        </div>
      </div>
      <VStamp x={520} y={780} text="撞 题" s={1.05} rot={-10} born={45} />
      <PopAt f={45}><VSparkle x={480} y={700} s={1.0} /></PopAt>
      <PopAt f={51}><VSparkle x={760} y={980} s={0.8} color="#f2d9a8" phase={1} /></PopAt>

      {/* 三胶囊 */}
      {[
        {t: "2023 届 · 已用", f: 75, x: 40},
        {t: "2024 届 · 已用", f: 87, x: 380},
        {t: "2025 届 · 已用", f: 99, x: 720},
      ].map((c, i) => (
        <PopAt key={i} f={c.f}>
          <div style={{
            position: "absolute", left: c.x, top: 1180, width: 320, height: 78,
            borderRadius: 999, backgroundColor: "#fff", border: `3px solid ${RED}`,
            display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
          }}>
            <span style={{fontFamily: F, fontSize: 30, fontWeight: 900, color: INK, whiteSpace: "nowrap"}}>{c.t}</span>
            <span style={{fontFamily: F, fontSize: 30, fontWeight: 900, color: RED}}>✗</span>
          </div>
        </PopAt>
      ))}
      <VSub text="开题报告被打回" />
    </AbsoluteFill>
  );
};

// ---------- 页2：对比 + 真实截图 ----------
const PVs: React.FC = () => {
  const frame = useCurrentFrame();
  const f = frame - 110; // 页内局部帧（HardPage 非 Sequence，useCurrentFrame 是全局帧，页起点 110）
  const glow = interpolate(f, [80, 88], [0, 1], clamp);
  const scaleB = f >= 80 ? 1.02 : 1;
  return (
    <AbsoluteFill>
      <div style={{position: "absolute", top: 210, left: 0, width: W, textAlign: "center", fontFamily: F, fontWeight: 900, fontSize: 62, color: INK, whiteSpace: "nowrap"}}>
        同样是养老管理系统，<span style={{color: ORANGE}}>差在哪？</span>
      </div>

      {/* 普通方向卡 */}
      <PopAt f={8}>
        <div style={{position: "absolute", left: 70, top: 340, width: 940, height: 290, backgroundColor: RED_BG, border: `3px solid ${RED}`, borderRadius: 22}}>
          <div style={{position: "absolute", left: 330, top: -26, width: 280, height: 52, borderRadius: 999, backgroundColor: RED, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: F, fontSize: 28, fontWeight: 900}}>普通方向</div>
          <div style={{position: "absolute", left: 0, top: 70, width: 940, textAlign: "center", fontFamily: F, fontSize: 44, fontWeight: 900, color: INK}}>养老信息管理系统</div>
          <div style={{position: "absolute", left: 90, top: 160, width: 760, textAlign: "center", fontFamily: F, fontSize: 30, fontWeight: 800, color: SUBC, whiteSpace: "nowrap"}}>老人表 · 增删改查 · 一套 CRUD 走到底</div>
          <div style={{position: "absolute", right: 46, bottom: 28, fontFamily: F, fontSize: 34, fontWeight: 900, color: RED}}>撞题高发区</div>
        </div>
      </PopAt>

      {/* 细化方向卡（含真实截图） */}
      <div style={{position: "absolute", left: 70, top: 700, width: 940, height: 660, transform: `scale(${scaleB})`, transformOrigin: "center center"}}>
        {f >= 80 && <div style={{position: "absolute", left: -7, top: -7, width: 954, height: 674, border: `6px solid ${GREEN}`, borderRadius: 26, boxShadow: "0 0 0 8px rgba(63,174,122,0.15)", opacity: glow}} />}
        <div style={{position: "absolute", left: 250, top: -26, width: 440, height: 52, borderRadius: 999, backgroundColor: GREEN, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: F, fontSize: 28, fontWeight: 900, whiteSpace: "nowrap", zIndex: 2}}>细化方向 · 社区养老服务平台</div>
        <div style={{position: "absolute", left: 0, top: 0, width: 940, height: 660, backgroundColor: GREEN_BG, border: `3px solid ${GREEN}`, borderRadius: 22, overflow: "hidden"}}>
          <div style={{position: "absolute", left: 35, top: 46, width: 870, height: 420, borderRadius: 14, overflow: "hidden", border: `2px solid ${BORDER}`, backgroundColor: "#fff"}}>
            <Img src={staticFile("images/pilot_family_home.png")} style={{width: 870, objectFit: "cover", objectPosition: "top"}} />
          </div>
          <div style={{position: "absolute", left: 35, top: 490, width: 870, display: "flex", gap: 14, justifyContent: "center"}}>
            {["老人端", "家属端", "护理员端", "管理端"].map((r, i) => (
              <div key={i} style={{padding: "8px 22px", borderRadius: 999, backgroundColor: "#fff", border: `2px solid ${GREEN}`, fontFamily: F, fontSize: 27, fontWeight: 900, color: INK, whiteSpace: "nowrap"}}>{r}</div>
            ))}
          </div>
          <div style={{position: "absolute", left: 0, top: 570, width: 940, textAlign: "center", fontFamily: F, fontSize: 32, fontWeight: 900, color: INK, whiteSpace: "nowrap"}}>
            陪同就医 · 康复训练 · 上门送餐 · <span style={{color: GREEN}}>精神慰藉陪伴</span>
          </div>
          <div style={{position: "absolute", left: 34, bottom: 10, fontFamily: F, fontSize: 22, fontWeight: 700, color: SUBC}}>演示项目 · 真实界面</div>
        </div>
      </div>
      <PopAt f={80}><VSparkle x={880} y={640} s={1.0} /></PopAt>
      <VSub text="细化：社区养老，四角色真业务" />
    </AbsoluteFill>
  );
};

export const V_DUR = 240;

export const BiSheVerticalPilot: React.FC = () => (
  <AbsoluteFill style={{background: "linear-gradient(180deg,#ffffff 0%,#f3f6f9 100%)", fontFamily: F, overflow: "hidden"}}>
    <HardPage from={0} duration={110}><PHook /></HardPage>
    <HardPage from={110} duration={130}><PVs /></HardPage>
    <div style={{position: "absolute", right: 36, bottom: 380, fontFamily: F, fontSize: 26, fontWeight: 800, color: SUBC, border: `2px solid ${SUBC}`, borderRadius: 24, padding: "6px 20px", whiteSpace: "nowrap"}}>全栈小秋</div>
  </AbsoluteFill>
);
