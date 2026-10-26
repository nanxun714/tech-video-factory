---
name: tech-video-factory
description: 把一个技术主题做成 60~70 秒横屏科普讲解视频（1920x1080 mp4，AI 配音 + 逐字字幕 + 动画）。Use whenever the user wants a tech explainer video — 科普视频、讲解视频、知识视频、"讲一下XX并做成视频"、"做个XX主题的视频"、"同款视频"、把技术概念变成短视频，哪怕用户只给一个主题没提任何细节。也适用于"改一版视频"、"换风格重做"这类后续修改请求。注意：在 cloud-computing-animation 项目内（全栈小秋账号抖音成片）优先使用该项目的 xiaoqiu-video-pipeline skill，本 skill 仅用于该项目之外的场景。**账号品牌统一「全栈小秋」（2026-09-13 用户拍板，「小秋技术笔记」弃用），角标/落款/合集名/文案都用全栈小秋**
---

# Tech Video Factory

固定管线（按序执行，不许跳步）：

```
SCRIPT -> VOICE -> SUBTITLES -> STYLE -> IMPLEMENT -> RENDER -> QC -> DELIVER
```

## 省 Token 硬规则（全流程适用，优先级最高；⚠️ 唯一例外是 QC 覆盖面，见第 2 条）

1. **脚本/探测结果一律写盘**：ffprobe 时长、TTS 词级时间戳、抽帧清单、QC 结果写成 JSON/文本文件供后续步骤读取，不把长输出打印进对话。
2. **抽帧不重复，但 QC 覆盖面一个帧都不能省**：省的是"同一帧图不发第二遍、看过的段落不回看"；**新片 QC 必须全量覆盖每个页边界精确帧 + 转场帧 + 0:00 + 结尾卡中途帧，与原来完全一致，不许因省 token 减少采样点**。只有用户明确说"只改了第 X 页"的改版会话，才允许只验改动页及其相邻转场。
3. **风格规范一次只读一个**：Step 4 确定风格后只读那一个 `references/style-*.md` + 一个活样板，其余一律不读。
4. **每会话只加载本 skill 一次**：中途各步骤继续用已加载内容，不重复调用。
5. **配音→时长→timeline 自动跑通**：gen_tts → 测 MP3 实际时长 → 写 timeline.json 一个脚本链完成，产物落盘后只在汇报时给摘要。

## Step 0 渲染宿主（不要新建项目）

所有组件做在既有 Remotion 项目里（node_modules 已装好，勿重装）：

```
F:\小秋技术笔记\00_视频生产线\01_源码\remotion-production\
```

新主题 = `src/` 新增组件 + 数据，在 `src/Root.tsx` 注册 Composition。渲染：

```
cd <项目根> && npx remotion render <CompositionId> out/<名字>.mp4 --log=error
```

## Step 1 SCRIPT — 先定技术故事（完整钩子/情绪密度规则见 `references/script-rules.md`）

- 一个视频只回答**一个核心问题**，标题即问题
- 开头第一句 = 问题钩子，禁一切铺垫词（"大家好/今天讲/很多人/我们都知道"全剥）——配音第一个字就是冲突或反常识提问（"你16G电脑同时开30个程序，为什么不崩？"）；句式只用「人人见过的现象+反差疑问」或踩坑场景
- 情绪密度 > 信息密度：开头带锐利感；先答"潜台词"再答概念；**每条至少一个"热经验"位**（真实踩坑案例），初稿用 `【踩坑案例位：待用户确认真实案例】` 占标，**必须等用户确认后才能配音**，AI 不得编造损失金额/人名/公司
- 8 句左右、250~320 字，弧线：钩子→潜台词→概念→原理→过程→总结
- 时长服务于内容，不为完播率数字砍时长（用户原话）；信息密度 4~6 字/秒，宁可超到 70s 不许砍关键解释
- 结尾"截图卡"：最后 3 秒白底黑字总结图，静止停留 ≥3 秒；金句大字幕停留 ≥3 秒，不与底部字幕重复
- **第 8~10 秒必须先兑现一半答案**（平均观看 9.28s，第二断崖在 10 秒附近）；按"10 秒一兑现"排布
- 结尾加合集导流一句（排错/报错类适用），与点赞 CTA 合成一次口播；中途不许口播"截图/收藏"引导
- 对比/排查/旅程三线轮换，别全押对比（对比引流，旅程吸粉）
- 技术命令/名词必须真实，不确定就不写
- **合规红线（配音/字幕/画面文字全适用，脚本定稿前 + 字幕生成后各查一遍）**：绝对禁词（代写/代做/毕设/包过/保过等）；高风险隐晦词（绿泡泡/薇信/加V/私聊等）；绝对化用语（最强/第一/100%解决/根治）。命中即改写。完整清单见 `references/iron-rules.md` 第15条

## Step 2 VOICE（详细声线表/edge-tts 大坑/词级时间戳见 `references/voice.md`）

写句子进输入 JSON → `python <skill目录>\scripts\gen_tts.py tts-input.json` → 输出 `s01.mp3...` + `timeline.json`（每句起止帧，后续一切动画的时间基准）。

声线速查（详表在 voice.md）：女声晓晓 `zh-CN-XiaoxiaoNeural` +4%（科普线默认）；男声云健 `zh-CN-YunjianNeural` +15%（主男声，"代码怎么跑的声音"）；男声云希 `zh-CN-YunxiNeural` +18%（Python/剧情排查线）。拿不准用户指哪个声音，先看 `C:\Users\27119\Desktop\声音对比\` 或直接问，不要用算法猜。

⚠️ 改 rate 后词级元数据不缩放，**必须解析 MP3 帧头测真实时长**再写 timeline.json；词级时间戳要显式传 `boundary="WordBoundary"`（事件键小写 offset/duration/text），脚本见 `scripts/gen_tts_words.py`。

⚠️ **MP3 文件时长 ≠ 语音终点（2026-09-19 二次复发）**：edge-tts 每句 mp3 尾部自带 0.5~0.8s 静音垫（CtrlC s11 实测文件 5.208s、语音止于 4.414s），拿文件时长直接当 end_frame 建轴，成片结尾必带"数字静音"死尾。**建轴/追句的 end_frame 一律按波形实测语音终点**：`ffmpeg -i sXX.mp3 -af silencedetect=n=-38dB:d=0.2 -f null -` 取最后一段语音的结束点；成片 DUR = 语音终点 + ≤6 帧呼吸。

⚠️ 接入任何 BGM/音效素材前先 `ffmpeg volumedetect` 量素材本体响度——**bed.wav 本体只有 -56dB，音量参数拉满也听不见**（结尾静置段静音事故根源）；结尾卡静置段的听觉主角用 `public/audio/bed_outro.wav`（响度合格版），规则见 `references/voice.md` §音频素材响度。

## Step 3 SUBTITLES（细节见 `references/voice.md` §字幕）

逐字字幕自动生成：`python <skill目录>\scripts\gen_subs.py <项目>\public\audio\<topic>-tts\timeline.json phrases.json > subs.tsx`，输出数组粘进组件 `subs` 常量。内置规则：逐字匹配旁白/无标点/每条 ≤14 字。词级精确对齐用 `scripts/gen_subs_words.py`（推荐给对比型/口播快的片子）。

## Step 4 STYLE — 按内容形态路由（用户指定则听用户的）

| 内容形态 | 风格 | 规范文件（实现前必须读） |
|---|---|---|
| 抽象概念 / 数字推演 | card 卡片动画风 | `references/style-card.md` |
| 网络科普 / A vs B 对比（竞争型首选） | flat 扁平可爱插画风 | `references/style-flat.md`，样板 `src/TcpVsUdpFlat.tsx`（**对比类默认照这个做**） |
| 流程/叙事 + 面试概念题 | sketch 白板手绘风 v2 | `references/style-sketch.md`，样板 `src/VirtualMemorySketch.tsx` / `src/PythonRuntimeExplainer.tsx` |
| 编程语法 / 命令行教学 | ide 暗色代码教学风 | `references/style-ide.md` |
| 排错 / 报错 / 概念科普 | docker 深蓝灰对称终端风（**默认首选**） | `references/style-docker.md`，样板 `src/DockerExitTroubleshoot.tsx` |

拿不准就用 docker 深蓝灰对称风（账号主风格）。**只读当前用的那一个规范文件**。

## Step 5 IMPLEMENT — 写组件

- 组件 `src/<TopicName>.tsx`，从 `assets/component-skeleton.tsx` 起步；Root.tsx 注册 Composition（1920x1080, 30fps），组件 `export const DUR` 给 Root 引用
- **词级锚点驱动动画**：组件顶部 `SENT = [每句起始帧]`，页面边界 = SENT，元素 delay = 对应关键词的词级朗读帧，谁说到谁出现；音效数组从同一组锚点推导。换配音只重算 SENT 和锚点
- **视听节奏**：每 5~7 秒一次画面变化（长停留页靠循环动画）；音效对齐画面动作、音量保守档（pop 0.26 / success 0.24 / whoosh 0.22 / bed 0.06），交付前人耳复听
- **纵深**：flat 风四层拆分（style-flat.md §纵深分层）；sketch 风"遮罩不变量"+ ink:color=2:1（style-sketch.md §揭示纪律）
- **QC 前必读 `references/quality-checklist.md`**（PageTurn 边界帧空白等真实踩坑，抽帧必须含每个页边界精确帧本身）
- **视觉样板对齐**：用户点名认可的具象样板（手机=TcpVsUdpFlat 那台的深色机身+完整 App 界面，清单在 style-flat.md §视觉样板对齐清单）必须进实现任务书；**主体元素禁止画成白屏+灰色占位图标/占位线框**——judge 查不出"占位图"，用户一眼打回"没有画面感"

## Step 6 RENDER + Step 7 QC（强制验收关卡，2026-09-14 定稿——换任何模型都按此执行，不许跳步）

渲染完成 ≠ 完成。渲染命令照旧，之后必须走完四道关卡：

0. **程序化预检（秒级，先于一切目检）**：
   `python <skill>/scripts/qc_precheck.py out/X.mp4 <ASCII目录> "<SENT逗号分隔>"`
   自动断言四类历史 bug：边界新场景未画出/边界无硬切（叠化）/边界空白/末帧空白。**生产者交付前必须自跑并贴 `fail:false` JSON 进汇报；主会话用同一脚本独立复验。** 详见 `references/quality-checklist.md` §程序化预检。
   音频侧同关：`python <skill>/scripts/qc_tail_silence.py out/X.mp4 --speech-end <语音终点秒>`——双向断言：①死寂（可听声结束后"无可听内容延伸到片尾"，CtrlC 精简版事故形态）②拖尾（话音落 >2.6s 垫乐仍吊到片尾，batch10 十七条尾音返修形态；音乐淡出+短安静的自然收尾放行）。语音终点 = 末句 start_sec + sXX.mp3 末段 silence_start（取 silence_end 会含静音垫虚长 0.5~0.8s）。同样自跑+复验，fail 退出码 1、warn/error 必须人耳或人工裁决。
1. **一键抽帧（脚本，不许手挑）**：
   `python <skill>/scripts/qc_auto.py --video out/X.mp4 --out <ASCII临时目录> --sent "<SENT逗号分隔>" --anchors "<词级锚点帧逗号分隔>" --dur <总帧数>`
   自动采样：0帧 + 每页边界 -12/-1/+2 + 全部锚点帧 + 尾帧±10 + extra，输出 f%04d.png + manifest.txt（帧号→应出现内容，直接粘给 judge）。
2. **独立 judge 逐帧验收（不许生产者自检代替）**：把 out 目录+manifest 交给 judge 子代理（Read/Bash only），prompt 里逐帧写明"应出现什么"（从 SENT/锚点推导）。**judge 未全帧 pass 禁止交付**；修复重渲后必须复验失败帧。judge 尽量用与生产不同的模型/会话（交叉审查漏检率低）。
3. **人耳听检**：音效音量是估的，交付汇报里必须提醒用户复听；合规词在 Step 1 定稿与 Step 3 字幕生成后各查一遍。
4. **音轨响度抽检（程序化，2026-09-14 新增）**：量"最后一句结束帧 → 片尾"区间 mean_volume，**≥ -45dB 为过**（bed.wav -56dB 曾让 8 条片结尾全是数字静音）；不合格用 quality-checklist §结尾段响度 的 ffmpeg 混音配方后处理（`-c:v copy` 无损秒级），修完量数验证。

历史坑清单见 `references/quality-checklist.md`（QC 前必读）。改版会话只验改动页及相邻转场，范围不明则按新片全量验。

## Step 8 DELIVER

成片**不再复制到桌面**（2026-09-19 用户指示）：直接归档到 `F:\小秋技术笔记\NN_YYYY-MM-DD_标题\01_成片\NN_YYYY-MM-DD_标题.mp4`（编号顺延 F 盘现有最大号；渲染产物同时保留在 remotion-production/out/），按固定格式汇报（分辨率/时长/旁白/字幕/BGM/音效/渲染/质检各项状态）。**交付定义（DoD）五项全齐才算完成，完整校准协议见 `references/handover-dod.md`**：

1. 成片已归档 F 盘 `NN_日期_标题\01_成片\`（2026-09-19 起不放桌面；不配单独封面）
2. judge 抽帧验收全 pass（留存帧清单目录）
3. 发布物料三件：标题候选（现象+反差疑问公式）/ 发布文案（技术词进文案吃搜索）/ 置顶评论（具体提问+合集导流）
4. 音轨技术检查（mutagen 确认音轨与时长 + **结尾段响度 ≥ -45dB**）+ 提醒用户人耳复听
5. 项目记忆已更新（成片条目 + 新踩的坑）

## Step 9 PUBLISH — 发布标题公式（完整公式+被否决做法见 `references/publish.md`）

**标题 = 人人见过的现象 + 反差疑问**（「为什么 A 能 X，B 却 Y？」）。已验证 4 条全 4300+；"面试官问 XX"开头全扑、定义式标题扑街。术语降级放文案第一段+话题标签。发布当天按「计算机网络」「操作系统底层」归合集，下期预告指向合集内下一条。

## 铁律（每条都付出过一轮重渲的代价 — 完整 16 条+追加 2 条见 `references/iron-rules.md`，Implement/QC 前必须通读）

速查：① 转场只用硬切 ② 字幕=原话去标点无描边 ③ 场景1第0帧完整呈现，开场禁入场动画 ④ 绝对定位文字容器必须有显式 width ⑤ 裸 `<path>` 必须包 `<svg>` ⑥ 结尾卡有自己的配音，CTA 只说一次 ⑦ 一屏一件事，元素>6拆场景 ⑧ 品牌=全栈小秋，品牌文字禁 emoji，禁占位名 ⑨ 练习题后加 3-2-1 倒计时 ⑩ 终端窗口占满画面宽度，未敲的命令不渲染 ⑪ 命令慢速打字机敲出 ⑫ 屏幕大字与底部字幕不同帧重复 ⑬ 克制配色：深蓝灰+橙+暗红封顶，禁贴纸/光斑/彩虹卡片 ⑭ 网络链路必须画完整请求+响应闭环 ⑮ 合规红线（见 Step 1） ⑯ 内容与发布 12 禁令：空白首帧/核心视觉晚于8秒/结尾互动问题/砍时长/多钩子标题/标题与风格不一致/无答案互动题/绝对技术结论/字幕卡片重复/未听检抽帧就宣布完成/不做单独封面文件/必须附置顶评论；追加A 素材接入先量响度（bed.wav -56dB 教训，结尾段 ≥-45dB）；追加B 主体具象禁占位线框（样板清单 style-flat.md）

## 维护分层（以后加新规则时遵守）

流程骨架、"什么时候读哪个文件"、一句话速查 → 写进本文件；具体细节/长清单/完整表格 → 写进对应 `references/*.md`，主文件只留一行指针。不许把细节塞回主文件（防再次膨胀）。
