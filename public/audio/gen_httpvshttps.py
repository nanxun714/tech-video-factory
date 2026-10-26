# -*- coding: utf-8 -*-
# 2026-09-14 HttpVsHttps TTS：词级时间戳(boundary=WordBoundary) + mutagen 实测 MP3 真实时长
# 词级锚点按 真实时长/词元数据末尾 的比例缩放，规避 rate 后 metadata 不缩放的坑。（照 gen_batch8.py 模式）
import asyncio, edge_tts, json, os, sys
from mutagen.mp3 import MP3

FPS = 30
GAP = 0.18

NAME = "httpvshttps"
VOICE = "zh-CN-YunjianNeural"
RATE = "+15%"
SENTENCES = [
    "网址开头有小锁和警告两种待遇，HTTP和HTTPS差的那一个S，到底贵在哪？",
    "先说结论：S就是Security，多了一层加密信封——HTTP是明信片，HTTPS是密封信。",
    "HTTP裸奔的时候，你发出去的每一个字，途经的路由器、咖啡店WiFi都能原样读走。",
    "HTTPS的思路是：内容你们随便抄，反正看不懂——双方先对暗号，协商出一把只有彼此知道的钥匙。",
    "对暗号又靠证书：网站出门先带身份证，由权威机构盖章，假网站盖不了这个章，浏览器就会弹那个红色大警告。",
    "最典型的翻车现场，就是在公共WiFi上，连着不带小锁的网站输密码。",
    "现在全网HTTPS基本普及，看到小锁，说明你的密码正在密封信里走。",
    "金句：HTTP是明信片，HTTPS是密封信，小锁代表路上没人能读。",
    "更多网络基础对比都在主页合集，点个关注，下期接着拆。",
]


def pick(d, *keys):
    for k in keys:
        return d[k] if k in d else None
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


async def gen(name):
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
            "total_sec": round(cursor - GAP, 3), "total_frames": round((cursor - GAP) * FPS),
            "sentences": timeline}
    with open(os.path.join(out_dir, "timeline.json"), "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    print(f"[{NAME}] TOTAL {data['total_sec']}s / {data['total_frames']} frames -> {out_dir}")


asyncio.run(gen(NAME))
