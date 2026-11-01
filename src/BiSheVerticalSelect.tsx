import React from "react";
import {Img, staticFile} from "remotion";
import {Audio} from "@remotion/media";
import {
  AbsoluteFill, Easing, interpolate, Sequence, useCurrentFrame,
} from "remotion";
import {HardPage, PopAt, STATIC} from "./batch10/kit";
import {DUR, SENT, SENT_DUR, SUBS} from "./bisheV21Data";

// 毕设系列 V2.1《毕设选题怎么选》竖屏 1080x1920（抖音版）
// 页型宪法 = BiSheVerticalPilot v4（小秋定稿）：中性灰配色、字幕淡入切句、
// 安全区（顶部>=190、右侧<=980、字幕 bottom=330）、演示项目窗框、品牌右上。
// 注意：HardPage 不是 Sequence，页内动画一律用（全局帧 - 页起点 base）。

const INK = "#2b3440";
const SUBC = "#7d8894";
const LINE = "#dfe4e9";
const GREEN = "#3f8f6b";
const GREEN_BG = "#eef5f1";
const GREEN_LINE = "#bcd9cc";
const RED = "#c9564f";
const RED_BG = "#f9f0ef";
const RED_LINE = "#dcc0bd";
const F = "'Microsoft YaHei', sans-serif";
const W = 1080;

const clamp = {extrapolateLeft: "clamp", extrapolateRight: "clamp"} as const;

// 锚点：at(i,frac) = SENT[i] + frac*SENT_DUR[i]（禁 wordAt）
const at = (i: number, frac: number) => SENT[i] + Math.round(frac * SENT_DUR[i]);

// ---------- 字幕：短语淡入切句（54px，小秋 v4 的 48 偏小已提） ----------
const VSubs: React.FC<{items: {t: string; from: number; to: number}[]}> = ({items}) => {
  const frame = useCurrentFrame();
  return (
    <>
      {items.map((s, i) => {
        const from = s.from === 0 ? -6 : s.from; // 第0帧首条字幕必须完整在场（铁律③）
        const o = Math.min(
          interpolate(frame, [from, from + 5], [0, 1], clamp),
          interpolate(frame, [s.to, s.to + 4], [1, 0], clamp),
        );
        if (o <= 0) return null;
        return (
          <div key={i} style={{position: "absolute", bottom: 330, left: 0, right: 0, display: "flex", justifyContent: "center", opacity: o, transform: `translateY(${(1 - o) * 12}px)`}}>
            <div style={{
              fontFamily: F, fontSize: 54, fontWeight: 900, color: "#f2f5f8",
              background: "rgba(20,32,44,0.85)", borderRadius: 14, padding: "12px 30px", whiteSpace: "nowrap",
            }}>{s.t}</div>
          </div>
        );
      })}
    </>
  );
};

// 组装一页的短语字幕：range = [起始句, 结束句)（0 基）；skip 里是画面大字同文的句（铁律⑫）
const pageSubs = (a: number, b: number, skip: number[] = [], pageEnd: number) => {
  const list = SUBS.filter((s) => s.sent >= a && s.sent < b && skip.indexOf(s.sent) === -1);
  return list.map((s, j) => ({
    t: s.t,
    from: s.f,
    to: j + 1 < list.length ? list[j + 1].f - 6 : pageEnd - 8,
  }));
};

// ---------- 通用小件 ----------
const Title: React.FC<{children: React.ReactNode; y?: number; size?: number}> = ({children, y = 288, size = 52}) => (
  <div style={{position: "absolute", top: y, left: 0, width: W, textAlign: "center", fontFamily: F, fontWeight: 900, fontSize: size, color: INK, whiteSpace: "nowrap"}}>
    {children}
  </div>
);

const BrowserFrame: React.FC<{label: string; note?: string; noteColor?: string; imgH: number; children: React.ReactNode}> = ({label, note, noteColor, imgH, children}) => (
  <div style={{position: "absolute", left: 60, width: 960, borderRadius: 14, overflow: "hidden", border: `2px solid ${LINE}`, backgroundColor: "#fff", boxSizing: "border-box", boxShadow: "0 12px 28px rgba(43,52,64,0.08)"}}>
    <div style={{height: 42, backgroundColor: "#f7f8fa", borderBottom: `1px solid ${LINE}`, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 16px", boxSizing: "border-box"}}>
      <div style={{display: "flex", alignItems: "center", gap: 10}}>
        <span style={{width: 10, height: 10, borderRadius: 5, backgroundColor: "#c9d0d7"}}/>
        <span style={{width: 10, height: 10, borderRadius: 5, backgroundColor: "#c9d0d7"}}/>
        <span style={{width: 10, height: 10, borderRadius: 5, backgroundColor: "#c9d0d7"}}/>
        <span style={{fontFamily: F, fontSize: 21, fontWeight: 800, color: INK, marginLeft: 6, whiteSpace: "nowrap"}}>{label}</span>
      </div>
      <span style={{fontFamily: F, fontSize: 18, fontWeight: 700, color: noteColor || SUBC, whiteSpace: "nowrap"}}>{note || "演示项目 · 真实界面"}</span>
    </div>
    <div style={{width: 956, height: imgH, overflow: "hidden", position: "relative"}}>{children}</div>
  </div>
);

// ---------- 页1：钩子（s0~s1） ----------
const PHook: React.FC = () => {
  const frame = useCurrentFrame();
  const cardY = interpolate(frame, [at(0, 0.2), at(0, 0.2) + 24], [1900, 760], {
    ...clamp, easing: Easing.out(Easing.back(1.1)),
  });
  const tags = [
    {t: "看着简单", f: at(1, 0.12), x: 80, y: 880, rot: -4},
    {t: "功能不好设计", f: at(1, 0.48), x: 560, y: 1120, rot: 3},
    {t: "技术不知道怎么选", f: at(1, 0.78), x: 100, y: 1240, rot: -2},
  ];
  return (
    <AbsoluteFill>
      <div style={{position: "absolute", left: 60, top: 190, width: 380, height: 50, borderRadius: 999, border: `3px solid ${LINE}`, color: INK, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: F, fontSize: 26, fontWeight: 900, letterSpacing: 3, backgroundColor: "rgba(255,255,255,0.82)", whiteSpace: "nowrap"}}>毕设通关 · 选题篇</div>

      <div style={{position: "absolute", top: 300, left: 0, width: W, textAlign: "center", fontFamily: F, fontWeight: 900, fontSize: 80, lineHeight: 1.32, letterSpacing: 2}}>
        <div style={{color: INK}}>毕设选题，怎么选？</div>
        <div>千万别<span style={{color: RED}}>急着定</span></div>
        <svg width={300} height={18} style={{display: "block", margin: "-6px auto 0", overflow: "visible"}}>
          <path d={"M 4 9 " + Array.from({length: 7}).map(() => "q 10 -9 20 0 q 10 9 20 0").join(" ")} fill="none" stroke={RED} strokeWidth={6} strokeLinecap="round" opacity={0.55} />
        </svg>
      </div>

      <div style={{position: "absolute", left: 190, top: 0, width: 700, height: 300, transform: `translateY(${cardY}px) rotate(-2deg)`}}>
        <div style={{width: 700, height: 300, boxSizing: "border-box", backgroundColor: "#fff", border: `3px solid ${LINE}`, borderRadius: 22, padding: "24px 36px", boxShadow: "0 14px 30px rgba(43,52,64,0.1)", position: "relative"}}>
          <div style={{display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: `3px solid ${LINE}`, paddingBottom: 12}}>
            <span style={{fontFamily: F, fontSize: 38, fontWeight: 900, color: INK}}>开题自检</span>
            <span style={{fontFamily: F, fontSize: 22, fontWeight: 900, color: SUBC, border: `2px solid ${LINE}`, borderRadius: 999, padding: "4px 14px", whiteSpace: "nowrap"}}>还没定题</span>
          </div>
          <div style={{marginTop: 24}}>
            <div style={{width: 520, height: 18, borderRadius: 9, backgroundColor: "#e9edf1", marginBottom: 18}}/>
            <div style={{width: 440, height: 18, borderRadius: 9, backgroundColor: "#e9edf1", marginBottom: 18}}/>
            <div style={{width: 480, height: 18, borderRadius: 9, backgroundColor: "#e9edf1"}}/>
          </div>
          <div style={{position: "absolute", left: 36, bottom: 18, fontFamily: F, fontSize: 22, fontWeight: 800, color: SUBC, whiteSpace: "nowrap"}}>功能？技术？范围？全是问号</div>
        </div>
      </div>

      {tags.map((c, i) => (
        <PopAt key={i} f={c.f}>
          <div style={{
            position: "absolute", left: c.x, top: c.y, transform: `rotate(${c.rot}deg)`,
            border: `3px solid ${RED_LINE}`, borderRadius: 16, padding: "14px 28px",
            backgroundColor: RED_BG, fontFamily: F, fontSize: 36, fontWeight: 900, color: RED, whiteSpace: "nowrap",
          }}>{c.t}</div>
        </PopAt>
      ))}

      <VSubs items={pageSubs(0, 2, [], SENT[2])}/>
    </AbsoluteFill>
  );
};

// ---------- 页2：案例对比（s2~s5，v4 宪法页） ----------
const PVs: React.FC = () => {
  const frame = useCurrentFrame();
  const greenY = interpolate(frame, [at(3, 0.02), at(3, 0.02) + 26], [2000, 620], {
    ...clamp, easing: Easing.out(Easing.cubic),
  });
  const chain1 = [
    {t: "老人预约", f: at(4, 0.06)},
    {t: "管理员审核", f: at(4, 0.3)},
    {t: "智能派单", f: at(4, 0.52)},
    {t: "护理员上门", f: at(4, 0.74)},
  ];
  const chain2 = [
    {t: "服务评价", f: at(5, 0.1)},
    {t: "自动预警", f: at(5, 0.38)},
  ];
  return (
    <AbsoluteFill>
      <Title>同样是养老管理系统，<span style={{color: GREEN}}>差在哪？</span></Title>

      <div style={{position: "absolute", left: 60, top: 384, width: 960, height: 212, backgroundColor: RED_BG, border: `3px solid ${RED_LINE}`, borderRadius: 22, boxSizing: "border-box"}}>
        <div style={{position: "absolute", left: 370, top: -27, width: 220, height: 54, borderRadius: 999, backgroundColor: "#8a949f", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: F, fontSize: 28, fontWeight: 900}}>普通方向</div>
        <div style={{position: "absolute", left: 0, top: 42, width: 960, textAlign: "center", fontFamily: F, fontSize: 46, fontWeight: 900, color: INK}}>养老信息管理系统</div>
        <div style={{position: "absolute", left: 0, top: 110, width: 960, textAlign: "center", fontFamily: F, fontSize: 30, fontWeight: 800, color: SUBC, whiteSpace: "nowrap"}}>老人表 · 增删改查 · 一套 CRUD 走到底</div>
        <div style={{position: "absolute", right: 36, bottom: 18, padding: "6px 18px", borderRadius: 999, backgroundColor: RED, color: "#fff", fontFamily: F, fontSize: 26, fontWeight: 900, whiteSpace: "nowrap"}}>撞题高发区</div>
      </div>

      <div style={{position: "absolute", left: 60, top: 0, width: 960, transform: `translateY(${greenY}px)`}}>
        <div style={{position: "absolute", left: 180, top: -26, width: 600, height: 54, borderRadius: 999, backgroundColor: GREEN, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: F, fontSize: 28, fontWeight: 900, whiteSpace: "nowrap", zIndex: 2}}>细化方向 · 社区养老服务平台</div>
        <div style={{position: "relative", width: 960, height: 444}}>
          <div style={{position: "absolute", left: 0, top: 44}}>
            <BrowserFrame label="社区养老服务平台 · 数据看板" imgH={358}>
              <Img src={staticFile("images/pilot_admin_stats_top.png")} style={{width: 956, display: "block", filter: "contrast(1.05) saturate(0.88)"}} />
            </BrowserFrame>
          </div>
        </div>
      </div>

      <div style={{position: "absolute", left: 60, top: 1076, width: 960, display: "flex", gap: 14, justifyContent: "center"}}>
        {["老人端", "家属端", "护理员端", "管理端"].map((r, i) => (
          <PopAt key={r} f={at(3, 0.42) + i * 4}>
            <div style={{padding: "10px 24px", borderRadius: 999, backgroundColor: "#fff", border: `2px solid ${LINE}`, fontFamily: F, fontSize: 28, fontWeight: 900, color: INK, whiteSpace: "nowrap"}}>{r}</div>
          </PopAt>
        ))}
      </div>

      <div style={{position: "absolute", left: 60, top: 1168, width: 960, display: "flex", gap: 10, justifyContent: "center", alignItems: "center"}}>
        {chain1.map((c, i) => (
          <React.Fragment key={c.t}>
            {i > 0 && (
              <PopAt f={c.f - 2}>
                <span style={{fontFamily: F, fontSize: 34, fontWeight: 900, color: SUBC, whiteSpace: "nowrap"}}>→</span>
              </PopAt>
            )}
            <PopAt f={c.f}>
              <div style={{padding: "12px 20px", borderRadius: 14, backgroundColor: GREEN_BG, border: `2.5px solid ${GREEN_LINE}`, fontFamily: F, fontSize: 28, fontWeight: 900, color: INK, whiteSpace: "nowrap"}}>{c.t}</div>
            </PopAt>
          </React.Fragment>
        ))}
      </div>
      <div style={{position: "absolute", left: 60, top: 1266, width: 960, display: "flex", gap: 10, justifyContent: "center", alignItems: "center"}}>
        {chain2.map((c, i) => (
          <React.Fragment key={c.t}>
            {i > 0 && (
              <PopAt f={c.f - 2}>
                <span style={{fontFamily: F, fontSize: 34, fontWeight: 900, color: SUBC, whiteSpace: "nowrap"}}>→</span>
              </PopAt>
            )}
            <PopAt f={c.f}>
              <div style={{padding: "12px 20px", borderRadius: 14, backgroundColor: GREEN_BG, border: `2.5px solid ${GREEN_LINE}`, fontFamily: F, fontSize: 28, fontWeight: 900, color: INK, whiteSpace: "nowrap"}}>{c.t}</div>
            </PopAt>
          </React.Fragment>
        ))}
      </div>

      <PopAt f={at(5, 0.62)}>
        <div style={{position: "absolute", left: 0, top: 1372, width: W, display: "flex", justifyContent: "center"}}>
          <div style={{padding: "10px 28px", borderRadius: 999, backgroundColor: "#fff", border: `2.5px solid ${LINE}`, fontFamily: F, fontSize: 30, fontWeight: 900, color: INK, whiteSpace: "nowrap"}}>
            细化 = 换场景 + 加角色 + 真业务
          </div>
        </div>
      </PopAt>

      <VSubs items={pageSubs(2, 6, [], SENT[6])}/>
    </AbsoluteFill>
  );
};

// ---------- 页3：先查（s6~s8，模拟搜索界面·示意） ----------
const PSearch: React.FC = () => {
  const results = [
    {t: "养老信息管理系统", s: "2024 届 · 往届毕设", f: at(6, 0.5)},
    {t: "社区养老服务平台改造", s: "2025 届 · 往届毕设", f: at(6, 0.62)},
    {t: "智能派单规则研究", s: "相关论文 · 知网", f: at(6, 0.74)},
  ];
  return (
    <AbsoluteFill>
      <Title>第一步：<span style={{color: GREEN}}>先查</span>，再定题</Title>

      <div style={{position: "absolute", left: 60, top: 400}}>
        <BrowserFrame label="往届课题检索" note="示意 · 非真实结果" noteColor={RED} imgH={620}>
          <div style={{padding: "22px 26px", boxSizing: "border-box", width: 956}}>
            <div style={{display: "flex", gap: 14, alignItems: "center"}}>
              <div style={{flex: 1, height: 74, borderRadius: 12, border: `3px solid ${LINE}`, backgroundColor: "#fbfcfd", display: "flex", alignItems: "center", paddingLeft: 24, fontFamily: F, fontSize: 32, fontWeight: 800, color: INK, whiteSpace: "nowrap"}}>养老管理系统</div>
              <div style={{width: 150, height: 74, borderRadius: 12, backgroundColor: GREEN, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: F, fontSize: 30, fontWeight: 900, whiteSpace: "nowrap"}}>搜 索</div>
            </div>
            {results.map((r, i) => (
              <PopAt key={i} f={r.f}>
                <div style={{marginTop: 22, borderRadius: 14, border: `2.5px solid ${LINE}`, backgroundColor: "#fff", padding: "18px 26px", position: "relative"}}>
                  <div style={{fontFamily: F, fontSize: 32, fontWeight: 900, color: INK, whiteSpace: "nowrap"}}>{r.t}</div>
                  <div style={{marginTop: 8, fontFamily: F, fontSize: 24, fontWeight: 800, color: SUBC, whiteSpace: "nowrap"}}>{r.s}</div>
                </div>
              </PopAt>
            ))}
          </div>
        </BrowserFrame>
      </div>

      <PopAt f={at(7, 0.5)}>
        <div style={{position: "absolute", left: 0, top: 1120, width: W, textAlign: "center", fontFamily: F, fontSize: 34, fontWeight: 900, color: INK, whiteSpace: "nowrap"}}>
          查的重点，<span style={{color: SUBC}}>不是完全不能重复</span>
        </div>
      </PopAt>

      <PopAt f={at(8, 0.12)}>
        <div style={{position: "absolute", left: 60, top: 1210, width: 960, boxSizing: "border-box", borderRadius: 20, border: `3.5px solid ${GREEN}`, backgroundColor: GREEN_BG, padding: "26px 32px"}}>
          <div style={{fontFamily: F, fontSize: 26, fontWeight: 900, color: GREEN, letterSpacing: 2}}>你的切入点</div>
          <div style={{marginTop: 10, fontFamily: F, fontSize: 40, fontWeight: 900, color: INK, whiteSpace: "nowrap"}}>
            把<span style={{color: GREEN}}>派单规则</span>做成你的创新点
          </div>
        </div>
      </PopAt>
      <PopAt f={at(8, 0.55)}>
        <div style={{position: "absolute", left: 0, top: 1400, width: W, textAlign: "center", fontFamily: F, fontSize: 28, fontWeight: 800, color: SUBC, whiteSpace: "nowrap"}}>
          别人做过没关系，做出自己的角度
        </div>
      </PopAt>

      <VSubs items={pageSubs(6, 9, [], SENT[9])}/>
    </AbsoluteFill>
  );
};

// ---------- 页4：缩小范围（s9~s10，功能聚合→核心链高亮 + 派单公式占比条） ----------
const PScope: React.FC = () => {
  const frame = useCurrentFrame();
  const dimAt = at(10, 0.12);
  const gridOpacity = interpolate(frame, [dimAt, dimAt + 10], [1, 0.22], clamp);
  const cutAt = at(10, 0.04);
  const cutScale = interpolate(frame, [cutAt, cutAt + 12], [2.2, 1], {...clamp, easing: Easing.out(Easing.cubic)});
  const cutOpacity = interpolate(frame, [cutAt, cutAt + 12], [0, 1], clamp);
  const barGrow = interpolate(frame, [at(10, 0.4), at(10, 0.4) + 20], [0, 1], clamp);
  const mods = ["用户管理", "订单管理", "在线支付", "数据统计", "评价管理", "营销活动", "内容管理", "物流跟踪"];
  const segs = [
    {t: "技能", v: 40, c: GREEN},
    {t: "社区", v: 25, c: INK},
    {t: "工作量", v: 20, c: SUBC},
    {t: "历史评价", v: 15, c: "#b8c2cc"},
  ];
  return (
    <AbsoluteFill>
      <Title>坑二：<span style={{color: RED}}>贪大求全</span></Title>

      <div style={{position: "absolute", left: 60, top: 402, width: 960, opacity: gridOpacity}}>
        {[0, 1].map((row) => (
          <div key={row} style={{display: "flex", gap: 16, justifyContent: "center", marginBottom: 20}}>
            {mods.slice(row * 4, row * 4 + 4).map((m, i) => {
              const idx = row * 4 + i;
              // 页首即时在场4个（口播将点名的），其余随"全想做"逐个弹入（v4空页标准解）
              const f0 = idx < 4 ? STATIC : at(9, 0.28) + idx * 6;
              return (
                <PopAt key={m} f={f0}>
                  <div style={{width: 216, height: 92, borderRadius: 16, backgroundColor: RED_BG, border: `2.5px solid ${RED_LINE}`, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: F, fontSize: 30, fontWeight: 900, color: INK, whiteSpace: "nowrap", boxSizing: "border-box"}}>{m}</div>
                </PopAt>
              );
            })}
          </div>
        ))}
      </div>

      <div style={{position: "absolute", left: 330, top: 470, opacity: cutOpacity, transform: `scale(${cutScale}) rotate(-8deg)`}}>
        <div style={{border: `7px solid ${RED}`, borderRadius: 18, padding: "10px 34px", color: RED, fontFamily: F, fontSize: 64, fontWeight: 900, letterSpacing: 14, backgroundColor: "rgba(255,255,255,0.92)"}}>砍</div>
      </div>

      <PopAt f={at(10, 0.14)}>
        <div style={{position: "absolute", left: 60, top: 640, width: 960, boxSizing: "border-box", borderRadius: 20, border: `3.5px solid ${GREEN}`, backgroundColor: GREEN_BG, padding: "24px 28px"}}>
          <div style={{fontFamily: F, fontSize: 26, fontWeight: 900, color: GREEN, letterSpacing: 2}}>先砍到一条核心业务链</div>
          <div style={{marginTop: 16, display: "flex", gap: 8, justifyContent: "center", alignItems: "center"}}>
            {["老人预约", "审核", "智能派单", "上门服务"].map((c, i) => (
              <React.Fragment key={c}>
                {i > 0 && <span style={{fontFamily: F, fontSize: 30, fontWeight: 900, color: GREEN, whiteSpace: "nowrap"}}>→</span>}
                <div style={{padding: "10px 18px", borderRadius: 12, backgroundColor: "#fff", border: `2.5px solid ${GREEN_LINE}`, fontFamily: F, fontSize: 27, fontWeight: 900, color: INK, whiteSpace: "nowrap"}}>{c}</div>
              </React.Fragment>
            ))}
          </div>
        </div>
      </PopAt>

      <PopAt f={at(10, 0.3)}>
        <div style={{position: "absolute", left: 60, top: 920, width: 960, boxSizing: "border-box", borderRadius: 20, border: `3px solid ${LINE}`, backgroundColor: "#fff", padding: "26px 32px", boxShadow: "0 12px 28px rgba(43,52,64,0.08)"}}>
          <div style={{display: "flex", alignItems: "center", justifyContent: "space-between"}}>
            <span style={{fontFamily: F, fontSize: 30, fontWeight: 900, color: INK, whiteSpace: "nowrap"}}>创新点 · 智能派单匹配分</span>
            <span style={{fontFamily: F, fontSize: 22, fontWeight: 800, color: SUBC, whiteSpace: "nowrap"}}>示意</span>
          </div>
          <div style={{marginTop: 20, height: 64, borderRadius: 12, overflow: "hidden", display: "flex", border: `2px solid ${LINE}`}}>
            {segs.map((s, i) => (
              <div key={s.t} style={{
                width: `${s.v * barGrow}%`,
                backgroundColor: s.c,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontFamily: F, fontSize: 24, fontWeight: 900, color: "#fff", whiteSpace: "nowrap",
              }}>{s.v}%</div>
            ))}
          </div>
          <div style={{marginTop: 18, display: "flex", justifyContent: "space-between"}}>
            {segs.map((s) => (
              <div key={s.t} style={{display: "flex", alignItems: "center", gap: 8}}>
                <span style={{width: 16, height: 16, borderRadius: 4, backgroundColor: s.c}}/>
                <span style={{fontFamily: F, fontSize: 24, fontWeight: 800, color: INK, whiteSpace: "nowrap"}}>{s.t} {s.v}%</span>
              </div>
            ))}
          </div>
        </div>
      </PopAt>

      <VSubs items={pageSubs(9, 11, [], SENT[11])}/>
    </AbsoluteFill>
  );
};

// ---------- 页5：技术路线（s11~s13，双栈卡） ----------
const PTech: React.FC = () => {
  return (
    <AbsoluteFill>
      <Title size={56}>技术路线，要<span style={{color: GREEN}}>匹配需求</span></Title>
      <div style={{position: "absolute", top: 380, left: 0, width: W, textAlign: "center", fontFamily: F, fontSize: 28, fontWeight: 800, color: SUBC, whiteSpace: "nowrap"}}>
        需求定技术，不是技术定需求
      </div>

      <PopAt f={at(12, 0.04)}>
        <div style={{position: "absolute", left: 60, top: 420, width: 960, boxSizing: "border-box", borderRadius: 22, border: `3.5px solid ${GREEN}`, backgroundColor: GREEN_BG, padding: "28px 34px"}}>
          <div style={{display: "flex", alignItems: "center", justifyContent: "space-between"}}>
            <span style={{fontFamily: F, fontSize: 34, fontWeight: 900, color: INK, whiteSpace: "nowrap"}}>做管理系统 · 网站类</span>
            <span style={{fontFamily: F, fontSize: 26, fontWeight: 900, color: "#fff", backgroundColor: GREEN, borderRadius: 999, padding: "6px 22px", whiteSpace: "nowrap"}}>够用</span>
          </div>
          <div style={{marginTop: 24, display: "flex", gap: 18, justifyContent: "center"}}>
            {[
              {t: "SpringBoot", f: at(12, 0.22)},
              {t: "Vue3", f: at(12, 0.4)},
              {t: "MySQL", f: at(12, 0.55)},
            ].map((c) => (
              <PopAt key={c.t} f={c.f}>
                <div style={{padding: "18px 34px", borderRadius: 16, backgroundColor: "#fff", border: `3px solid ${GREEN_LINE}`, fontFamily: F, fontSize: 40, fontWeight: 900, color: INK, whiteSpace: "nowrap"}}>{c.t}</div>
              </PopAt>
            ))}
          </div>
        </div>
      </PopAt>

      <PopAt f={at(13, 0.1)}>
        <div style={{position: "absolute", left: 60, top: 780, width: 960, boxSizing: "border-box", borderRadius: 22, border: `3px solid ${LINE}`, backgroundColor: "#fff", padding: "28px 34px"}}>
          <div style={{display: "flex", alignItems: "center", justifyContent: "space-between"}}>
            <span style={{fontFamily: F, fontSize: 34, fontWeight: 900, color: INK, whiteSpace: "nowrap"}}>做数据分析类</span>
            <span style={{fontFamily: F, fontSize: 26, fontWeight: 900, color: SUBC, border: `2.5px solid ${LINE}`, borderRadius: 999, padding: "6px 22px", whiteSpace: "nowrap"}}>再考虑</span>
          </div>
          <div style={{marginTop: 24, display: "flex", justifyContent: "center"}}>
            <PopAt f={at(13, 0.34)}>
              <div style={{padding: "18px 40px", borderRadius: 16, backgroundColor: "#fbfcfd", border: `3px solid ${LINE}`, fontFamily: F, fontSize: 40, fontWeight: 900, color: INK, whiteSpace: "nowrap"}}>Python</div>
            </PopAt>
          </div>
        </div>
      </PopAt>

      <PopAt f={at(13, 0.62)}>
        <div style={{position: "absolute", left: 0, top: 1130, width: W, display: "flex", gap: 18, justifyContent: "center"}}>
          {["微服务", "大数据", "前后端分离全家桶"].map((t, i) => (
            <div key={t} style={{display: "flex", alignItems: "center", gap: 10, padding: "10px 22px", borderRadius: 999, backgroundColor: "#f4f6f8", border: `2px solid ${LINE}`, whiteSpace: "nowrap"}}>
              <span style={{fontFamily: F, fontSize: 26, fontWeight: 800, color: SUBC, whiteSpace: "nowrap"}}>{t}</span>
              <span style={{fontFamily: F, fontSize: 28, fontWeight: 900, color: RED}}>✗</span>
            </div>
          ))}
        </div>
      </PopAt>

      <VSubs items={pageSubs(11, 14, [11], SENT[14])}/>
    </AbsoluteFill>
  );
};

// ---------- 页6：金句 + 互动（s14~s16，金句段字幕停用） ----------
const PGolden: React.FC = () => {
  return (
    <AbsoluteFill>
      <div style={{position: "absolute", top: 380, left: 0, width: W, textAlign: "center", fontFamily: F, fontWeight: 900, fontSize: 68, lineHeight: 1.42, letterSpacing: 2}}>
        <div style={{color: INK}}>记住，题目是</div>
        <div><span style={{color: GREEN}}>查出来</span>的，</div>
        <div>不是随便<span style={{color: RED}}>想出来</span>的</div>
        <svg width={300} height={18} style={{display: "block", margin: "2px auto 0", overflow: "visible"}}>
          <path d={"M 4 9 " + Array.from({length: 7}).map(() => "q 10 -9 20 0 q 10 9 20 0").join(" ")} fill="none" stroke={GREEN} strokeWidth={6} strokeLinecap="round" opacity={0.55} />
        </svg>
      </div>

      <PopAt f={at(15, 0.04)}>
        <div style={{position: "absolute", left: 110, top: 830, width: 860, boxSizing: "border-box", borderRadius: 22, border: `3px solid ${LINE}`, backgroundColor: "#fff", padding: "26px 34px"}}>
          {[
            {t: "先查相似课题", f: at(15, 0.08)},
            {t: "再定研究范围", f: at(15, 0.32)},
            {t: "再定技术路线", f: at(15, 0.52)},
          ].map((r, i) => (
            <PopAt key={r.t} f={r.f}>
              <div style={{display: "flex", alignItems: "center", gap: 18, marginTop: i === 0 ? 0 : 18}}>
                <span style={{width: 52, height: 52, borderRadius: 14, backgroundColor: GREEN, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: F, fontSize: 28, fontWeight: 900, flexShrink: 0}}>{"123"[i]}</span>
                <span style={{fontFamily: F, fontSize: 36, fontWeight: 900, color: INK, whiteSpace: "nowrap"}}>{r.t}</span>
              </div>
            </PopAt>
          ))}
          <PopAt f={at(15, 0.78)}>
            <div style={{marginTop: 22, fontFamily: F, fontSize: 28, fontWeight: 800, color: GREEN, whiteSpace: "nowrap"}}>写代码，才少走弯路</div>
          </PopAt>
        </div>
      </PopAt>

      <div style={{position: "absolute", left: 60, top: 1230, width: 960, display: "flex", gap: 24, justifyContent: "center"}}>
        <PopAt f={at(16, 0.12)}>
          <div style={{width: 340, height: 170, borderRadius: 22, backgroundColor: "#fff", border: `3.5px solid ${GREEN}`, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", boxSizing: "border-box"}}>
            <div style={{fontFamily: F, fontSize: 64, fontWeight: 900, color: GREEN}}>1</div>
            <div style={{fontFamily: F, fontSize: 28, fontWeight: 900, color: INK, whiteSpace: "nowrap"}}>刚选题</div>
          </div>
        </PopAt>
        <PopAt f={at(16, 0.26)}>
          <div style={{width: 340, height: 170, borderRadius: 22, backgroundColor: "#fff", border: `3.5px solid ${LINE}`, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", boxSizing: "border-box"}}>
            <div style={{fontFamily: F, fontSize: 64, fontWeight: 900, color: INK}}>2</div>
            <div style={{fontFamily: F, fontSize: 28, fontWeight: 900, color: INK, whiteSpace: "nowrap"}}>开始写代码了</div>
          </div>
        </PopAt>
      </div>

      <PopAt f={at(16, 0.58)}>
        <div style={{position: "absolute", left: 0, top: 1450, width: W, display: "flex", justifyContent: "center"}}>
          <div style={{padding: "14px 44px", borderRadius: 999, backgroundColor: GREEN, color: "#fff", fontFamily: F, fontSize: 32, fontWeight: 900, whiteSpace: "nowrap"}}>评论区扣一或二，告诉我</div>
        </div>
      </PopAt>

      <VSubs items={pageSubs(14, 17, [14], DUR)}/>
    </AbsoluteFill>
  );
};

export const BiSheVerticalSelect: React.FC = () => (
  <AbsoluteFill style={{background: "linear-gradient(180deg,#ffffff 0%,#f4f6f8 100%)", fontFamily: F, overflow: "hidden"}}>
    <HardPage from={0} duration={SENT[2]}><PHook /></HardPage>
    <HardPage from={SENT[2]} duration={SENT[6] - SENT[2]}><PVs /></HardPage>
    <HardPage from={SENT[6]} duration={SENT[9] - SENT[6]}><PSearch /></HardPage>
    <HardPage from={SENT[9]} duration={SENT[11] - SENT[9]}><PScope /></HardPage>
    <HardPage from={SENT[11]} duration={SENT[14] - SENT[11]}><PTech /></HardPage>
    <HardPage from={SENT[14]} duration={DUR - SENT[14]}><PGolden /></HardPage>
    {SENT.map((start, i) => (
      <Sequence key={`v-${i}`} from={start} durationInFrames={i < SENT.length - 1 ? SENT[i + 1] - start + 10 : DUR - start}>
        <Audio src={staticFile(`audio/bishe21-tts/s${("0" + (i + 1)).slice(-2)}.wav`)} volume={1} />
      </Sequence>
    ))}
    <div style={{position: "absolute", right: 60, top: 190, fontFamily: F, fontSize: 26, fontWeight: 800, color: INK, border: `2.5px solid ${INK}`, borderRadius: 26, padding: "7px 24px", whiteSpace: "nowrap", backgroundColor: "rgba(255,255,255,0.78)", zIndex: 50}}>全栈小秋</div>
  </AbsoluteFill>
);
