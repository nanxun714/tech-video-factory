# AGENTS.md — 全栈小秋视频生产线（任何 AI 编码工具开工前必读）

本项目 = Remotion 视频工厂：一个主题 → 60~80s 1080p 竖版知识视频（Remotion 渲染 + 本地 GPT-SoVITS「曼波」配音 + 程序化 QC）。

## 开工前必读（按序，只读这些）

1. `skill/tech-video-factory/SKILL.md` — 完整管线 SCRIPT→VOICE→SUBTITLES→STYLE→IMPLEMENT→RENDER→QC→DELIVER + 铁律 16+2 条
2. `skill/tech-video-factory/references/quality-checklist.md` — QC 三关 + 全部历史坑（渲染前必读；§VLM 批量判帧 是判帧加速基建）
3. 系列样板：`src/BiSheKaitiFlat.tsx`（flat 风·毕设系列最新）+ `src/batch10/kit.tsx`（页面套件）+ `src/batch10/kaitiData.ts`（数据契约，由脚本生成禁手改）

## 环境硬约定

- **配音引擎**（GPT-SoVITS 曼波音色，占 6G 显存，用完 `taskkill /T` 杀整树）。Git Bash 形式：
  ```
  cd /d/MamboTTS/GPT-SoVITS && ./runtime/python.exe api.py -a 127.0.0.1 -p 9880 -s "D:\MamboTTS\models\manbo_e8_s168.pth" -g "D:\MamboTTS\models\manbo-e10.ckpt" -dr "D:\MamboTTS\models\refer.wav" -dt "大家好，欢迎来到我的频道，今天给大家分享一个有趣的内容" -dl zh
  ```
  PowerShell 形式（默认终端不是 Git Bash 时用这条，后台启动）：
  ```
  cd D:\MamboTTS\GPT-SoVITS; Start-Process -WindowStyle Hidden .\runtime\python.exe -ArgumentList 'api.py','-a','127.0.0.1','-p','9880','-s','D:\MamboTTS\models\manbo_e8_s168.pth','-g','D:\MamboTTS\models\manbo-e10.ckpt','-dr','D:\MamboTTS\models\refer.wav','-dt','大家好，欢迎来到我的频道，今天给大家分享一个有趣的内容','-dl','zh'
  ```
  加载 1~2 分钟，调用前 poll `GET http://127.0.0.1:9880/control` 出 JSON 才算就绪。单句 >40 字必复读 → **句子一律 ≤35 字**。
- **配音参数（用户锁定档，别再试别的）**：speed=1.5、GAP=0.06、TAIL_FRAMES=6（话音落+6帧干脆收，**结尾禁加任何垫乐音**）。生成脚本模板 `public/audio/gen_bishe_kaiti.py`（改 SENTENCES / SUBS_PHRASES / 输出文件名即可复用）；ASR 复读质检 `public/audio/bishe_kaiti_asr_qc.py`（自带等引擎就绪）。英文词（SSM/Java/Python 可用，但单独字母 A/B/C 必糊）配音后必须转写抽检。
- **VLM 判帧**（QC 加速，与 TTS 引擎显存不共存，先杀 TTS 再启）：
  ```
  D:\AIModels\vlm-judge\bin\llama-server.exe -m ../models/Qwen3VL-4B-Instruct-Q4_K_M.gguf --mmproj ../models/mmproj-Qwen3VL-4B-Instruct-F16.gguf -ngl 99 -c 8192 -np 2 --host 127.0.0.1 --port 8900
  ```
  **参数别加大**：-np 4 / -c 16384 在 6G 卡上 OOM 段错误（实测）。判帧脚本 `--workers 2`（须≤槽数）。用法与坑见 quality-checklist §VLM 批量判帧；判完杀进程。
- **渲染**：`npx remotion render <CompId> out/<名字>.mp4 --log=error`；长片可用 `--frames=起-止` 分两段双进程并行再 ffmpeg 拼接。抽帧一律 Python cv2 顺序解码（禁随机 seek）。

## 用户工作流硬门（违反任何一条 = 返工）

1. **脚本先发用户过目**（20~24 句、单句≤35字、开头禁铺垫词、【踩坑案例位】占标等用户给真实案例），**确认后才准配音**
2. 页内锚点一律 `at(i,frac)=SENT[i]+frac*SENT_DUR[i]`，**禁用 wordAt**（分词边界陷阱）
3. 底部字幕 52px；页内底部胶囊/横幅 top≤860；页面级裸 svg 装饰必须包 PopAt；禁带圈数字❶❷❸（用普通数字）；口播禁单独英文字母（互动选项用中文数字"一/二"或数字卡）；页面第0帧必须有实质内容（提问页双卡即时在场模式，样板 P2）
4. **QC 三关不许省**：`qc_precheck.py`（必须 fail:false）→ `qc_auto.py` 抽帧 + VLM 判帧 + agent judge 复核（期望帧按 at() 精确重算，PopAt 出生帧加 3 帧缓冲）→ `qc_tail_silence.py --speech-end <语音终点秒>`
5. 归档：`F:\小秋技术笔记\NN_日期_标题\`（编号顺延现有最大号）下 `01_成片 / 02_源码 / 03_音频字幕+发布物料`，git add+commit+push，最后提醒用户人耳复听（语速吐字+英文词读音）
6. 合规：方法里可说"毕设/开题"；"稳过/包过/代做/找我做/接单/私聊"零出现（视频/字幕/画面/置顶评论全适用）；转化只走评论区扣数字+私信
7. 品牌一律「全栈小秋」，品牌文字禁 emoji
