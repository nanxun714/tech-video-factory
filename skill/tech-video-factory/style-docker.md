# 深蓝灰对称终端风（docker / 排错 / 概念科普默认风格）

> 用户经过 7 轮迭代拍板的风格。适用：Docker、Git、报错排错、网络问题、概念科普类。
> Linux / Python 命令教学仍用 `style-ide.md`。活样板：`src/DockerExitTroubleshoot.tsx`（45.5s 横屏成片）。
> 关键词：高级、简洁、对称、专业。拒绝：可爱吉祥物、花哨颜色、廉价贴纸感、PPT 式静态卡片。

## 1. 调色板（只许这几种颜色同屏）

```ts
const BG = "#262c3a";      // 深蓝灰底
const CARD = "#2f3646";    // 面板/终端体
const BORDER = "#3d4658";  // 描边
const INK = "#eef1f6";     // 主文字（浅色）
const SUB = "#9aa3b5";     // 次要文字
const ORANGE = "#fb923c";  // 主橙（提示符、强调字）
const ORANGE_D = "#f97316";// 深橙（按钮底、编号块）
const TINT = "rgba(251,146,60,0.14)";   // 橙色浅底
const RED = "#ef6f6f";     // 报错专用
const RED_BG = "rgba(239,111,111,0.16)";
```

铁律：全片只有 深蓝灰 / 白字 / 橙 / 暗红 四个色相。禁止青色、蓝色、绿色卡片混排；禁止彩虹速查表（用编号区分，不用颜色区分）；阴影一律柔和投影 `0 12px 30px rgba(0,0,0,0.3)`，禁止硬偏移阴影（`0 12px 0` 这种是廉价感来源）；背景纯平色，禁止光斑/网格/渐变纹理。

## 2. 居中对称版式（1920x1080）

```
标题区（居中）：编号块 66px 橙色圆角方块 + 56px 加粗标题 + 29px 灰色小字
终端（居中）：x=160, w=1600（几乎满宽）, y=228
说明卡（对称双卡）：x=210 / x=1010, 各 w=700, 终端下方留 60~110px 呼吸空隙
字幕：底部居中，44px 加粗，深色半透明底条 rgba(15,19,27,0.72)
右上角常驻角标：小秋（26px，SUB 色，letterSpacing 4，无任何 emoji）
顶部：6px 橙色进度条随播放增长
```

- 左右必须对称：说明卡永远成对出现、等宽、与终端左右边缘对齐
- 上下节奏：标题 → 终端 → 卡片，卡片 y 按终端实际高度逐场调（终端矮的场次卡上移），禁止终端下大片空白
- 禁止"左终端右一列卡"的非对称布局（用户明确否决过）

## 3. 终端组件（手机可读标准）

- mac 三点：哑光 `#d97e5a / #d9a75a / #8aa876`，标题栏高 58，标题 `xiaoqiu@dev: ~`（终端用户名保留 ASCII 小写，账号品牌见 §6）
- **命令 46px mono weight 800**；输出/表格 30~32px mono weight 700；行高 ≥1.9
- 退出码等状态徽章：RED 描边 + RED_BG 底 + mono 900，弹出后持续轻微脉动（`1+0.05*sin(f/5)`）

## 4. 动画规范（去 PPT 感的核心）

| 元素 | 动画 | 参数 |
|---|---|---|
| 命令 | **慢速打字机逐字敲出** | cps=0.55（约 17 字/秒），光标 ▌ 常驻闪烁（`frame%30<15`） |
| 输出行/表格 | 渐入上浮 | interpolate(at, at+8) opacity+translateY(14px)，逐行错开 |
| 日志 | 流式滚出 | 时间戳递增，一行行出现，最后 Error 行红色高亮从左往右扫过（scaleX） |
| 划线删除 | 画出来 | 7px RED 线 scaleX 0→1, origin left（先打完整条命令再划） |
| 报错框 | 砸出+震动 | shakeAmp：`sin(t*2.2)*amp*(1-t/span)` 衰减震动 |
| 印章（警示） | 旋转砸落 | spring damping=10 stiffness=200, rotate -3°，红色虚线框 |
| 场景切换 | 右滑淡入 | SceneWrap：10 帧内 translateX 70→0 + opacity（**开场禁用**，见 §5） |
| 速查表行 | 依次左滑入 | 与配音逐句对齐（说到哪条滑哪条） |
| 结尾点赞 | 波纹扩散 | 双环 `(frame%46)/46` scale 1→1.9 淡出 + 👍 轻微摇摆 |

禁止：整段命令文本瞬跳出现、所有元素同帧弹出、无动画的静态卡片页。

## 5. 封面铁律（0:00 = 完整海报）

抖音取第 0 帧当封面。开场场景必须**第 0 帧所有元素完整在画面上**：
- 开场场景禁用 SceneWrap 淡入（用 `<SceneWrap instant>`）和 CharsPop/Pop 等入场动画
- 标题（红色强调词）+ 副题 + 橙色 CTA 胶囊 + 落款，四件套全部静态呈现
- 动画从第二场才开始——开场是海报，不是动画

## 6. 品牌角标与落款「全栈小秋」（无 emoji；2026-09-13 起账号统一此名，「小秋技术笔记」弃用）

- 角标：每场右上角 `全栈小秋`（纯文字，🐧 企鹅 emoji 被用户点名"太廉价"，禁用任何 emoji 做品牌）
- 落款：开场 + 结尾 `全栈小秋 · 0 基础也能学会`
- 终端用户名 `xiaoqiu@dev`，示例路径 `/home/xiaoqiu`
- 结尾 CTA 只说一次（学会了就点个赞），带下期预告

## 7. 文案与字幕防呆

- 屏幕大字与底部字幕**不得同帧显示同一句话**（"三步下来问题藏不住"胶囊+字幕同屏被用户打回）——大字页面出现的内容，字幕窗口要么错开要么删大字
- 速查表页 = 纯三行卡片，落款字幕收尾，不再加总结胶囊

## 8. 关键组件速查（完整代码见活样板）

```tsx
// 慢速打字机（光标随帧闪烁）
<TypeTokens tokens={[{t:"$ ",c:ORANGE},{t:"docker ps -a",c:INK}]}
  start={14} cps={0.55} fontSize={46} active={false}/>

// 输出行渐入
<FadeUp at={46} style={{fontSize:30, fontFamily:MONO, color:SUB, fontWeight:700,
  whiteSpace:"pre", lineHeight:2.2}}>{"CONTAINER ID    IMAGE     STATUS"}</FadeUp>

// 划线删除（包住已敲完的命令）
<span style={{position:"relative", display:"inline-block"}}>
  <TypeTokens .../>
  <span style={{position:"absolute", left:0, top:"55%", height:7, width:"100%",
    backgroundColor:RED, borderRadius:4, transform:`scaleX(${strike})`,
    transformOrigin:"left"}}/>
</span>
```

音频挂载同标准管线（晓晓 +4%），音效点：印章/报错砸落 → error.wav；结尾 → success.wav；BGM bed.wav 8% 淡入淡出。
