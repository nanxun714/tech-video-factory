# Tech Video Factory — 全栈小秋 技术科普视频生产线

「输入主题 → 产出 60 秒横屏科普视频」的完整可复现工程：Remotion 动画 + 本地大模型 TTS 配音 + 程序化 QC。
抖音账号「全栈小秋」。已验证成片 30+ 条（科普/对比/排查三线 + 毕设通关系列）。

> ⚠️ **私有仓库，勿转公开**：`src/` 内含部分客户定制项目的组件。

## 目录结构

```
remotion-production/
├─ src/                          全部视频组件（每条片一个 .tsx）
│   ├─ batch10/kit.tsx           公共套件：HardPage 硬切翻页 / PopAt 词锚弹入 /
│   │                            SubtitleBar 字幕条 / BrandCorner 角标 / EndingCard / wordAt
│   ├─ batch10/*Data.ts          各片配音时间轴数据（脚本生成，禁手改）
│   └─ Root.tsx                  Composition 注册入口
├─ public/
│   ├─ audio/<topic>-tts/        各片配音 wav + timeline.json
│   ├─ audio/gen_bishe_tts.py    曼波 TTS 生成一条龙（等引擎→逐句合成→波形实测裁静音垫→建轴→产 Data.ts）
│   ├─ audio/bishe_asr_qc.py     复读质检（funasr 转写查重复，自动重合成）
│   ├─ audio/gen_batch10.py      edge-tts 批量生成器（词级时间戳方案，2026-09 批量片用）
│   └─ audio/sfx/ + bed.wav      音效与垫乐（全系列共用）
├─ skill/tech-video-factory/     ★ 生产规范（实现/QC 前必读）
│   ├─ SKILL.md                  管线八步 + 铁律速查
│   ├─ references/quality-checklist.md   渲染后质检清单（每条坑都付过返工代价）
│   ├─ references/style-flat.md  扁平插画风规范（本系列当前风格，另有 sketch/card/ide/docker）
│   └─ scripts/qc_precheck.py / qc_auto.py / qc_tail_silence.py   程序化 QC 三件套
└─ out/                          渲染产物（gitignore，不入库）
```

## 视觉风格路由（按题材）

| 风格 | 活样板组件 | 适用题材 |
|---|---|---|
| 扁平插画风 flat | `src/BiSheTopicFlat.tsx`（最新）/ `TcpVsUdpFlat.tsx` | 对比类 / 清单类 / 毕设系列（默认） |
| 深蓝灰终端风 docker | `src/DockerExitTroubleshoot.tsx` | 报错排错 / 概念 |
| 手绘大白风 v2 sketch | `src/PythonRuntimeExplainer.tsx` | 原理叙事 / 流程 |
| 暗色 IDE 风 ide | `src/LinuxBasicsTutorial.tsx` | 命令教学 |
| 卡片动画风 card | `src/SubnetMaskExplainer.tsx` | 抽象概念 |

## 环境要求

| 项 | 说明 |
|---|---|
| OS | Windows 10/11（曼波 TTS 引擎仅 Windows + NVIDIA） |
| Node.js | ≥18（渲染） |
| Python 3.10+ | numpy / requests / mutagen（配音与 QC）；funasr 可选（复读质检，引擎 runtime 自带） |
| GPU | NVIDIA ≥6GB 显存（GPT-SoVITS 推理） |
| MangboTTS | 曼波音色 TTS 引擎，见下 |

## 安装（新机复现）

```bash
git clone https://github.com/nanxun714/tech-video-factory.git
cd tech-video-factory
npm install
```

曼波 TTS：从 https://github.com/Tsukimisaka/MamboTTS/releases 下载 `*-full.zip` 解压到 `D:\MamboTTS`
（full 包内置曼波音色模型 manbo-e10.ckpt / manbo_e8_s168.pth / refer.wav；首次启动自动下载 8.2G GPT-SoVITS 引擎）。
启动：双击 `MamboTTS.bat`，或 `GPT-SoVITS\go-api-mambo.bat`（API 监听 127.0.0.1:9880）。

## 一条片的流水线（SCRIPT→VOICE→SUBTITLES→STYLE→IMPLEMENT→RENDER→QC→DELIVER）

1. **口播稿**：单句 ≤35 字（GPT-SoVITS 单句 >40 字必复读）；
2. **配音**：改 `public/audio/gen_bishe_tts.py` 的 `SENTENCES/SUBS_PHRASES` →
   `bishe_asr_qc.py 1.4`（复读质检，脚本自带等引擎就绪）→ `gen_bishe_tts.py 1.4`
   （**波形实测语音终点建轴，文件时长不可信**）；
3. **画面**：复制现有 flat 组件改页面（页边界=SENT 句起始帧，动画挂 WORDS 词锚；**改语速后页内尾段锚点必须重算**）→ `Root.tsx` 注册；
4. **渲染**：`npx remotion render <CompositionId> out/<名字>.mp4 --log=error > render.log`；
5. **QC 三关不许跳**：
   `python skill/tech-video-factory/scripts/qc_precheck.py out/X.mp4 <ASCII输出目录> "<页边界帧>"`
   → `qc_auto.py` 抽帧 + 独立 judge 逐帧验收
   → `qc_tail_silence.py out/X.mp4 --speech-end <语音终点秒>`；
6. **交付**：归档 `F:\小秋技术笔记\NN_日期_标题\`（01_成片 / 02_源码 / 03_音频字幕 / 发布物料）。

## 已踩坑速查（详见 skill/references/quality-checklist.md）

- **结尾禁加垫乐音**（2026-10-27 终审）：话音落 +6 帧直接收，TAIL_FRAMES=6
- 音频文件时长 ≠ 语音终点（edge-tts 与 GPT-SoVITS 都带尾部静音垫），建轴一律按波形实测
- 提语速后页面变短，页内 "+N 帧" 装饰锚点会溢出页尾永不出现，必须重算
- 转场纯硬切；金句段字幕组件级停用；绝对定位文字必须有显式 width
- 带圈数字 ❶❷❸ 有字体回退风险，用普通数字
- bed_outro.wav 素材自带 2s 渐强，禁止整段直接叠（如需垫乐尾音，取稳定段自烘焙包络）

## 版本

- 2026-10-27：首版入库。含毕设通关系列 01《毕设选题避坑》（BiSheTopicFlat，64.1s）全量源码与规范。
