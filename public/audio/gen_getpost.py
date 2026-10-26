# -*- coding: utf-8 -*-
# 2026-09-14 GetVsPost TTS：词级时间戳(boundary=WordBoundary) + mutagen 实测 MP3 真实时长
# 词级锚点按 真实时长/词元数据末尾 的比例缩放，规避 rate 后 metadata 不缩放的坑。（照 gen_batch8.py 模式）
import asyncio, edge_tts, json, os, sys
from mutagen.mp3 import MP3

FPS = 30
GAP = 0.18

NAME = "getpost"
VOICE = "zh-CN-YunjianNeural"
RATE = "+15%"
SENTENCES = [
    "面试官问GET和POST的区别，你答一个查数据一个传数据，他为什么直接摇头？",
    "因为这句只说对了表面，真正的区别藏在四个地方，最后一个最值钱。",
    "第一，参数位置：GET把参数拼在网址后面，会被收藏、转发、记进日志；POST把参数放进请求体，地址栏干干净净。",
    "第二，长度：网址栏对URL长度有限制，GET传不了大文件，POST没这个约束。",
    "第三，也是最值钱的：GET是幂等的，同一请求发一百次，服务器状态都不变，浏览器才敢放心刷新和预取；POST可能下单扣款，所以刷新前要弹窗确认。",
    "踩过坑的人都懂这条的分量：有人把删除接口写成GET，被爬虫一扫，数据直接没了。",
    "第四，安全性其实一样：都走明文，想加密上HTTPS，跟GET POST本身没关系。",
    "金句：GET是拿，POST是办；能不能重复发，看幂等。",
    "面试速查卡停在结尾了，更多高频八股对比在主页合集，点个关注不迷路。",
]


def pick(d, *keys):
    for k in keys:
        if k in d:
            return d[k]
    return None


async def synth_one(out_dir, i, text, voice, rate):
    audio_path = os.path.join(out_dir, f"s{i+1:02d}.mp3")
    last_err = None
    for attempt in range(5):
        try:
            comm = edge_tts.Communicate(text, voice, rate=rate, boundary="WordBoundary")
            words = []
            with open(audio_path, "wb") as f:
                async for chunk in comm.stream():
                    if chunk.get("type") == "audio":
                        f.write(chunk["data"])
                    else:
                        off = pick(chunk, "offset", "Offset")
                        dur = pick(chunk, "duration", "Duration")
                        txt = pick(chunk, "text", "Text")
                        if off is not None and dur is not None:
                            words.append({"off": int(off), "dur": int(dur), "t": txt or ""})
            if os.path.getsize(audio_path) > 1000:
                real = MP3(audio_path).info.length
                meta_end = (words[-1]["off"] + words[-1]["dur"]) / 1e7 if words else 0.0
                scale = (real / meta_end) if meta_end > 0.05 else 1.0
                return {
                    "audio": os.path.basename(audio_path),
                    "dur_sec": real,
                    "scale": round(scale, 4),
                    "words": [
                        {"off_sec": round(w["off"] / 1e7 * scale, 3),
                         "dur_sec": round(w["dur"] / 1e7 * scale, 3), "t": w["t"]}
                        for w in words
                    ],
                }
            last_err = RuntimeError("audio too small")
        except Exception as e:
            last_err = e
        await asyncio.sleep(2 + attempt * 2)
    raise last_err


async def gen():
    out_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), f"{NAME}-tts")
    os.makedirs(out_dir, exist_ok=True)
    results = []
    for i, s in enumerate(SENTENCES):
        r = await synth_one(out_dir, i, s, VOICE, RATE)
        r["text"] = s
        r["index"] = i + 1
        results.append(r)
        print(f"[{NAME}] s{i+1:02d} dur={r['dur_sec']:.2f}s scale={r['scale']}")
    cursor = 0.0
    timeline = []
    for r in results:
        start = cursor
        end = start + r["dur_sec"]
        timeline.append({
            "index": r["index"], "text": r["text"], "audio": r["audio"],
            "start_sec": round(start, 3), "end_sec": round(end, 3),
            "start_frame": round(start * FPS), "end_frame": round(end * FPS),
            "dur_sec": round(r["dur_sec"], 3),
            "words": r["words"],
        })
        cursor = end + GAP
    data = {"fps": FPS, "voice": VOICE, "rate": RATE,
            "total_sec": round(cursor, 3), "total_frames": round(cursor * FPS),
            "sentences": timeline}
    with open(os.path.join(out_dir, "timeline.json"), "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    print(f"[{NAME}] TOTAL {data['total_sec']}s / {data['total_frames']} frames -> {out_dir}")
    return data


asyncio.run(gen())
