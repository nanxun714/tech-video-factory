# -*- coding: utf-8 -*-
# 2026-09-14 inode 排查片 TTS：云希 zh-CN-YunxiNeural rate +25% 句间0.08s
# 照 gen_batch8.py：boundary=WordBoundary（小写键）+ mutagen 实测真实时长 + 词级锚点等比缩放
import asyncio, edge_tts, json, os
from mutagen.mp3 import MP3

FPS = 30
GAP = 0.08

SENTENCES = [
    "磁盘显示还剩一百个G，新建文件却报错说磁盘已满——这机器是不是坏了？",
    "机器没坏，是你的文件占满了另一本账，这就是今天要排查的真凶。",
    "硬盘存文件要记两本账：一本记内容，叫数据块；一本记文件身份，叫inode，文件名、大小、权限全在里面。",
    "关键在于inode的数量格式化时就定死了，只有几百万个，跟数据块各管各的。",
    "于是出现这种场面：几十万张几K的缓存小图，数据块还剩一大堆，inode却先被吃光了。",
    "很多人卡在这一步，df看磁盘怎么都查不出满，换成df -i一看，inode使用率百分百。",
    "删掉那些空占坑的小文件，inode一释放，写入立刻恢复。",
    "磁盘满查内容，写不进查inode。",
    "同类排查题我整理了一整个合集，点个关注收藏着，报错的时候用得上。",
]


def pick(d, *keys):
    for k in keys:
        if k in d:
            return d[k]
    return None


async def synth_one(out_dir, i, text, voice, rate):
    audio_path = os.path.join(out_dir, f"s{i+1:02d}.mp3")
    last_err = None
    for attempt in range(6):
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
            if os.path.getsize(audio_path) > 1000 and words:
                real = MP3(audio_path).info.length  # mutagen 实测真实时长（权威）
                meta_end = (words[-1]["off"] + words[-1]["dur"]) / 1e7
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
            last_err = RuntimeError("audio too small or no words")
        except Exception as e:
            last_err = e
        await asyncio.sleep(2 + attempt * 2)  # NoAudioReceived 退避重试
    raise last_err


async def main():
    out_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "inode-tts")
    os.makedirs(out_dir, exist_ok=True)
    results = []
    for i, s in enumerate(SENTENCES):
        r = await synth_one(out_dir, i, s, "zh-CN-YunxiNeural", "+25%")
        r["text"] = s
        r["index"] = i + 1
        results.append(r)
        print(f"s{i+1:02d} dur={r['dur_sec']:.2f}s scale={r['scale']} words={len(r['words'])}")
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
    data = {"fps": FPS, "voice": "zh-CN-YunxiNeural", "rate": "+25%",
            "total_sec": round(cursor, 3), "total_frames": round(cursor * FPS),
            "sentences": timeline}
    with open(os.path.join(out_dir, "timeline.json"), "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    print(f"TOTAL {data['total_sec']}s / {data['total_frames']} frames -> {out_dir}")


asyncio.run(main())
