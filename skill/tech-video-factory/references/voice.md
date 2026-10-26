# VOICE + SUBTITLES 详细规范

## 声线权威表

- **女声·晓晓 `zh-CN-XiaoxiaoNeural`，rate +4%**（用户已拍板，全系列统一，勿再换）
- **男声·云健 `zh-CN-YunjianNeural`，rate +15%（2026-09-13 用户拍板，账号主男声）**——《代码怎么跑》同款，样本 `Desktop\声音对比\1-云健-男声-现在用的.mp3`。+15% 按参考实测校准（22 字句 4.68s ≈ 参考 4.69s）。用户说"换男声"或"代码怎么跑的声音"且未指定时，默认用这个
- **男声·云希 `zh-CN-YunxiNeural`，rate +18%（2026-09 拍板，Python 系列/内存泄漏系列专用）**——节奏偏快，参考实现 `remotion-production/public/audio/gen_python_runtime_tts.py`。勿与云健混用：云健=小秋主系列科普线，云希=Python/剧情排查线
- **声线权威参考库：`C:\Users\27119\Desktop\声音对比\`**。拿不准用户指哪个声音，先看这个目录或直接问，不要靠基频/MFCC 算法猜——已两次被用户耳朵打回

## TTS 流程

```bash
cd <项目>\public\audio
python <skill目录>\scripts\gen_tts.py tts-input.json
```

输入 JSON：

```json
{
  "voice": "zh-CN-XiaoxiaoNeural",
  "rate": "+4%",
  "out_dir": "my-topic-tts",
  "sentences": ["第一句", "第二句"]
}
```

输出：`s01.mp3...` + `timeline.json`（每句起止帧，后续一切动画的时间基准）。

## ⚠️ edge-tts 大坑

1. **改 rate 后词级元数据（Offset/Duration）不缩放**，按 metadata 算的时长虚高 ~15%（+18% 时 44.7s vs 实际 36.0s）。**必须解析 MP3 帧头测真实时长**再写 timeline.json（脚本见 `gen_python_runtime_tts.py` 同目录历史，或用 mutagen），否则配音比画面先结束。
2. **换声/换语速后全片时间参数都要重算**（voiceLines/subs/PAGES/页内 delay/音效帧），参考自动化脚本 `remotion-production/patch_restart_v4.py`（锚点正则提取现值→按新短语窗口重排），或本 skill `scripts/retime.py`。

## ✅ 词级时间戳的正确打开方式（2026-09-12 TCP扁平片验证）

edge-tts 7.x 默认只发 SentenceBoundary。要拿逐词时间轴必须显式传 `Communicate(text, voice, rate=..., boundary="WordBoundary")`，且事件键名是**小写** `offset/duration/text`（大写 Offset 一个都收不到，词级数组会是空的）。

词级时间轴的两个用途：
1. 字幕按词对齐（比按字数比例准）
2. 页面动画锚点直接挂在关键词的朗读帧上（"可靠"说出口的那一帧弹"可靠"大字）

参考实现：`remotion-production/public/audio/gen_tcpudp_flat.py`（生成+词级采集）、`gen_subs_flat.py`（词级字幕对齐），已拷贝到本 skill `scripts/`（`gen_tts_words.py`）。

## SUBTITLES 字幕生成

```bash
python <skill目录>\scripts\gen_subs.py <项目>\public\audio\my-topic-tts\timeline.json phrases.json > subs.tsx
```

写一份断句 JSON（每句按标点和停顿拆成 ≤14 字短句），把输出数组粘进组件 `subs` 常量。生成器内置规则：
- **逐字匹配旁白**（字幕就是正在念的原话，禁止改写）
- **无任何标点**（中英文标点全剥，`C++` 的 + 保留）
- 每条 ≤14 字，时间按字数比例从整句窗口切分

**词级精确对齐（对比型/口播快的片子推荐）**：Step 2 拿到词级时间轴后改用 `scripts/gen_subs_words.py`——把每句拆成字幕短语写在脚本 `SUBS` 字典（`{"句序": ["短语1", "短语2"...]}`），按词文本匹配定位每条字幕的真实起点，跨句的词（"下一期，浏览器…"里字幕从"浏览器"起）也能精确对上。用法：改脚本顶部 `SUBS` 和 timeline 路径 → `python gen_subs_words.py` → 输出粘进组件。

## §音频素材响度（2026-09-14 结尾静音事故沉淀，接入任何 BGM/音效前必查）

- **接入任何音频素材前先量素材本体响度**：`ffmpeg -i 素材 -af volumedetect -f null - 2>&1 | grep volume`。**bed.wav 实测 mean -56dB / max -49dB——就算组件里 volume 拉到 1.0 也听不见**。正片有人声撑着不会暴露，一旦某个段落只剩这个素材（结尾截图卡静置 3.3s），就是数字静音，用户必打回。改组件音量参数救不了小声的素材，白渲一轮。
- **结尾静置段的听觉主角必须是响度合格的素材**：项目里已有 `public/audio/bed_outro.wav`（bed.wav 增益+40dB 后 loudnorm 归一到 mean -19.3dB/max -11.1dB，32s）。结尾卡区间单独播它，volume 0.4 + 首尾 fade，实测结尾段 mean -31dB（人声段 -25dB 上下，听感"清晰可闻但不吵"）。组件写法：`<Sequence from={DUR - 100} durationInFrames={93}><Audio src={staticFile("audio/bed_outro.wav")} volume={(f) => interpolate(f, [0, 12, 79, 93], [0, 0.4, 0.4, 0], clamp)} /></Sequence>`
- **成片交付前的响度验收线**：量"最后一句结束帧 → 片尾"区间的 mean_volume，**必须 ≥ -45dB**；量法 `ffmpeg -ss <旁白结束秒> -i 成片 -af volumedetect -f null -`。低于线=结尾静音事故，直接打回。
