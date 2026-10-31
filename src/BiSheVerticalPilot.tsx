import React from "react";
import {Img, staticFile} from "remotion";
import {
  AbsoluteFill, Easing, interpolate, useCurrentFrame,
} from "remotion";

// 竖屏试点小样（1080×1920，无声 9.3s，钩子页 + 对比页）
// 安全区：顶部 y≥190，右侧 x≤980，字幕 bottom=330（y≈1516~1590）。
// 配色：中性灰 + 红（撞题）/ 绿（细化），不再引入第三组强调色。

import {HardPage, PopAt} from "./batch10/kit";

const INK = "#2b3440";
const SUBC = "#7d8894";
const LINE = "#dfe4e9";
const GREEN = "#3f8f6b";
const RED = "#c9564f";
const RED_BG = "#f9f0ef";
const RED_LINE = "#dcc0bd";
const F = "'Microsoft YaHei', sans-serif";
const W = 1080;

const P1_END = 125;

const clamp = {extrapolateLeft: "clamp", extrapolateRight: "clamp"} as const;

const VSub: React.FC<{text: string; from?: number; to?: number}> = ({text, from = 0, to = 1e9}) => {
  const frame = useCurrentFrame();
  const o = Math.min(
    interpolate(frame, [from, from + 5], [0, 1], clamp),
    interpolate(frame, [to, to + 4], [1, 0], clamp),
  );
  if (o <= 0) return null;
  return (
    <div style={{position: "absolute", bottom: 330, left: 0, right: 0, display: "flex", justifyContent: "center", opacity: o, transform: `translateY(${(1 - o) * 12}px)`}}>
      <div style={{
        fontFamily: F, fontSize: 48, fontWeight: 900, color: "#f2f5f8",
        background: "rgba(20,32,44,0.85)", borderRadius: 14, padding: "12px 30px", whiteSpace: "nowrap",
      }}>{text}</div>
    </div>
  );
};

const VStamp: React.FC<{x: number; y: number; text: string; s?: number; rot?: number; born: number}> = ({
  x, y, text, s = 1, rot = -10, born,
}) => {
  const frame = useCurrentFrame();
  const wig = frame >= born ? Math.sin((frame - born) / 2.2) * Math.max(0, 1 - (frame - born) / 14) * 3 : 0;
  return (
    <div style={{
      position: "absolute", left: x, top: y, transform: `rotate(${rot + wig}deg) scale(${s})`,
      border: `6px solid ${RED}`, borderRadius: 16, padding: "8px 22px",
      color: RED, fontFamily: F, fontSize: 52, fontWeight: 900, letterSpacing: 8,
      backgroundColor: "rgba(255,255,255,0.9)", whiteSpace: "nowrap",
      boxShadow: "0 6px 18px rgba(201,86,79,0.18)",
    }}>{text}</div>
  );
};

const DocCard: React.FC<{tag?: string}> = ({tag}) => (
  <div style={{
    position: "absolute", left: 0, top: 0, width: 760, height: 300, boxSizing: "border-box",
    backgroundColor: "#fff", border: `3px solid ${LINE}`, borderRadius: 22, padding: "22px 34px",
    boxShadow: "0 14px 30px rgba(43,52,64,0.1)",
  }}>
    <div style={{display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: `3px solid ${LINE}`, paddingBottom: 12}}>
      <span style={{fontFamily: F, fontSize: 38, fontWeight: 900, color: INK}}>开题报告</span>
      {tag && <span style={{fontFamily: F, fontSize: 22, fontWeight: 900, color: RED, border: `2px solid ${RED}`, borderRadius: 999, padding: "4px 14px", whiteSpace: "nowrap"}}>{tag}</span>}
    </div>
    <div style={{marginTop: 18, fontFamily: F, fontSize: 33, fontWeight: 900, color: INK, whiteSpace: "nowrap"}}>基于SpringBoot的养老信息管理系统</div>
    <div style={{marginTop: 16}}>
      <div style={{width: 600, height: 16, borderRadius: 8, backgroundColor: "#e9edf1", marginBottom: 14}}/>
      <div style={{width: 520, height: 16, borderRadius: 8, backgroundColor: "#e9edf1", marginBottom: 14}}/>
      <div style={{width: 560, height: 16, borderRadius: 8, backgroundColor: "#e9edf1"}}/>
    </div>
    <div style={{position: "absolute", left: 34, bottom: 16, fontFamily: F, fontSize: 22, fontWeight: 800, color: SUBC, whiteSpace: "nowrap"}}>选题方向：社区养老服务</div>
  </div>
);

// ---------- 页1：题目撞车 ----------
const PHook: React.FC = () => {
  const frame = useCurrentFrame();
  const cardB = interpolate(frame, [22, 48], [1920, 850], {
    ...clamp, easing: Easing.out(Easing.back(1.15)),
  });
  return (
    <AbsoluteFill>
      <div style={{position: "absolute", left: 60, top: 190, width: 340, height: 50, borderRadius: 999, border: `3px solid ${LINE}`, color: INK, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: F, fontSize: 26, fontWeight: 900, letterSpacing: 3, backgroundColor: "rgba(255,255,255,0.82)", whiteSpace: "nowrap"}}>毕设通关 · 第 02 期</div>

      <div style={{position: "absolute", top: 285, left: 0, width: W, textAlign: "center", fontFamily: F, fontWeight: 900, fontSize: 76, lineHeight: 1.3, letterSpacing: 2}}>
        <div style={{color: INK}}>开题报告被打回，</div>
        <div>是因为<span style={{color: RED}}>写得差</span>？</div>
        <svg width={280} height={18} style={{display: "block", margin: "-8px auto 0", overflow: "visible"}}>
          <path d={"M 4 9 " + Array.from({length: 7}).map(() => "q 9 -9 18 0 q 9 9 18 0").join(" ")} fill="none" stroke={RED} strokeWidth={6} strokeLinecap="round" opacity={0.55} />
        </svg>
      </div>

      <div style={{position: "absolute", left: 160, top: 545, transform: "rotate(-3deg)"}}><DocCard /></div>
      <div style={{position: "absolute", left: 160, top: 0, transform: `translateY(${cardB}px) rotate(3deg)`}}><DocCard tag="同届 · 同题" /></div>

      <VStamp x={445} y={790} text="撞 题" s={1.05} rot={-10} born={50} />

      <PopAt f={62}>
        <div style={{position: "absolute", left: 0, top: 1188, width: W, textAlign: "center", fontFamily: F, fontSize: 34, fontWeight: 900, color: SUBC, whiteSpace: "nowrap"}}>
          老师手里，有一张<span style={{color: RED}}>近三届清单</span>
        </div>
      </PopAt>
      {[
        {t: "2023 届", f: 62, x: 45},
        {t: "2024 届", f: 70, x: 390},
        {t: "2025 届", f: 78, x: 735},
      ].map((c, i) => (
        <PopAt key={i} f={c.f}>
          <div style={{
            position: "absolute", left: c.x, top: 1268, width: 300, height: 86,
            borderRadius: 999, backgroundColor: "#fff", border: `3px solid ${LINE}`,
            display: "flex", alignItems: "center", justifyContent: "center", gap: 12, boxSizing: "border-box",
          }}>
            <span style={{fontFamily: F, fontSize: 30, fontWeight: 900, color: INK, whiteSpace: "nowrap"}}>{c.t}</span>
            <span style={{fontFamily: F, fontSize: 25, fontWeight: 900, color: SUBC, whiteSpace: "nowrap"}}>已用</span>
            <span style={{fontFamily: F, fontSize: 32, fontWeight: 900, color: RED}}>✗</span>
          </div>
        </PopAt>
      ))}

      <VSub text="开题报告被打回，是因为写得差？" to={80} />
      <VSub text="八成不是，是题目撞车了" from={84} />
    </AbsoluteFill>
  );
};

// ---------- 页2：普通方向 vs 细化方向（嵌入真实管理端界面） ----------
const PVs: React.FC = () => {
  const frame = useCurrentFrame();
  const f = frame - P1_END;
  const cardY = interpolate(f, [8, 34], [2000, 660], {...clamp, easing: Easing.out(Easing.cubic)});
  return (
    <AbsoluteFill>
      <div style={{position: "absolute", top: 288, left: 0, width: W, textAlign: "center", fontFamily: F, fontWeight: 900, fontSize: 52, color: INK, whiteSpace: "nowrap"}}>
        同样是养老管理系统，<span style={{color: GREEN}}>差在哪？</span>
      </div>

      <div style={{position: "absolute", left: 60, top: 392, width: 960, height: 232, backgroundColor: RED_BG, border: `3px solid ${RED_LINE}`, borderRadius: 22, boxSizing: "border-box"}}>
        <div style={{position: "absolute", left: 370, top: -27, width: 220, height: 54, borderRadius: 999, backgroundColor: "#8a949f", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: F, fontSize: 28, fontWeight: 900}}>普通方向</div>
        <div style={{position: "absolute", left: 0, top: 44, width: 960, textAlign: "center", fontFamily: F, fontSize: 46, fontWeight: 900, color: INK}}>养老信息管理系统</div>
        <div style={{position: "absolute", left: 0, top: 112, width: 960, textAlign: "center", fontFamily: F, fontSize: 30, fontWeight: 800, color: SUBC, whiteSpace: "nowrap"}}>老人表 · 增删改查 · 一套 CRUD 走到底</div>
        <div style={{position: "absolute", right: 36, bottom: 20, padding: "6px 18px", borderRadius: 999, backgroundColor: RED, color: "#fff", fontFamily: F, fontSize: 26, fontWeight: 900, whiteSpace: "nowrap"}}>撞题高发区</div>
      </div>

      <div style={{position: "absolute", left: 60, top: 0, width: 960, height: 720, transform: `translateY(${cardY}px)`}}>
        <div style={{position: "absolute", left: 210, top: -26, width: 540, height: 54, borderRadius: 999, backgroundColor: GREEN, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: F, fontSize: 28, fontWeight: 900, whiteSpace: "nowrap", zIndex: 2}}>细化方向 · 社区养老服务平台</div>
        <div style={{position: "absolute", left: 0, top: 0, width: 960, height: 720}}>
          <div style={{position: "absolute", left: 30, top: 50, width: 900, height: 380, borderRadius: 14, overflow: "hidden", border: `2px solid ${LINE}`, backgroundColor: "#fff", boxSizing: "border-box", boxShadow: "0 12px 28px rgba(43,52,64,0.08)"}}>
            <div style={{height: 42, backgroundColor: "#f7f8fa", borderBottom: `1px solid ${LINE}`, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 16px", boxSizing: "border-box"}}>
              <div style={{display: "flex", alignItems: "center", gap: 10}}>
                <span style={{width: 10, height: 10, borderRadius: 5, backgroundColor: "#c9d0d7"}}/>
                <span style={{width: 10, height: 10, borderRadius: 5, backgroundColor: "#c9d0d7"}}/>
                <span style={{width: 10, height: 10, borderRadius: 5, backgroundColor: "#c9d0d7"}}/>
                <span style={{fontFamily: F, fontSize: 21, fontWeight: 800, color: INK, marginLeft: 6, whiteSpace: "nowrap"}}>社区养老服务平台 · 数据看板</span>
              </div>
              <span style={{fontFamily: F, fontSize: 18, fontWeight: 700, color: SUBC, whiteSpace: "nowrap"}}>演示项目 · 真实界面</span>
            </div>
            <div style={{width: 896, height: 334, overflow: "hidden"}}>
              <Img src={staticFile("images/pilot_admin_stats_top.png")} style={{width: 896, display: "block", filter: "contrast(1.05) saturate(0.88)"}} />
            </div>
          </div>

          <div style={{position: "absolute", left: 30, top: 470, width: 900, display: "flex", gap: 14, justifyContent: "center"}}>
            {["老人端", "家属端", "护理员端", "管理端"].map((r, i) => (
              <PopAt key={r} f={P1_END + 34 + i * 4}>
                <div style={{padding: "10px 24px", borderRadius: 999, backgroundColor: "#fff", border: `2px solid ${LINE}`, fontFamily: F, fontSize: 28, fontWeight: 900, color: INK, whiteSpace: "nowrap"}}>{r}</div>
              </PopAt>
            ))}
          </div>

          <PopAt f={P1_END + 56}>
            <div style={{position: "absolute", left: 0, top: 556, width: 960, textAlign: "center", fontFamily: F, fontSize: 32, fontWeight: 900, color: INK, whiteSpace: "nowrap"}}>
              陪同就医 · 康复训练 · 上门送餐 · <span style={{color: GREEN}}>精神慰藉陪伴</span>
            </div>
          </PopAt>
          <PopAt f={P1_END + 72}>
            <div style={{position: "absolute", left: 0, top: 646, width: 960, display: "flex", justifyContent: "center"}}>
              <div style={{padding: "8px 26px", borderRadius: 999, backgroundColor: "#fff", border: `2.5px solid ${LINE}`, fontFamily: F, fontSize: 28, fontWeight: 900, color: INK, whiteSpace: "nowrap"}}>
                细化 = 换场景 + 加角色 + 真业务
              </div>
            </div>
          </PopAt>
        </div>
      </div>

      <VSub text="同样是养老管理系统，差在哪？" to={P1_END + 52} />
      <VSub text="细化：社区养老，四角色真业务" from={P1_END + 56} />
    </AbsoluteFill>
  );
};

export const V_DUR = 280;

export const BiSheVerticalPilot: React.FC = () => (
  <AbsoluteFill style={{background: "linear-gradient(180deg,#ffffff 0%,#f4f6f8 100%)", fontFamily: F, overflow: "hidden"}}>
    <HardPage from={0} duration={P1_END}><PHook /></HardPage>
    <HardPage from={P1_END} duration={V_DUR - P1_END}><PVs /></HardPage>
    <div style={{position: "absolute", right: 60, top: 190, fontFamily: F, fontSize: 26, fontWeight: 800, color: INK, border: `2.5px solid ${INK}`, borderRadius: 26, padding: "7px 24px", whiteSpace: "nowrap", backgroundColor: "rgba(255,255,255,0.78)"}}>全栈小秋</div>
  </AbsoluteFill>
);
