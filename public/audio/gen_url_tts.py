# -*- coding: utf-8 -*-
# 《浏览器输入网址后发生了什么》男声配音（云希 +18%，词级时间戳）
# 8 句旅程结构：钩子 → DNS → TCP握手(呼应上期) → HTTP请求 → 浏览器渲染 → 总结链路 → 金句 → CTA
import asyncio, edge_tts, json, os

VOICE = "zh-CN-YunxiNeural"
RATE = "+18%"
FPS = 30
GAP = 0.18
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "url-tts")
os.makedirs(OUT, exist_ok=True)

SENTENCES = [
    # s01 钩子
    "在地址栏敲下网址，按下回车，到页面出现，只要一秒。但这一秒里，你的请求其实出门跑了一圈。",
    # s02 DNS
    "第一步，DNS解析。浏览器拿着网址问DNS服务器：这个名字住在哪？它就像互联网的通讯录，把域名翻译成IP地址。",
    # s03 TCP 握手（呼应上期）
    "第二步，建立TCP连接。浏览器和服务器先打电话确认：听得到吗？听得到。这套握手，上一期刚讲过。",
    # s04 HTTP
    "第三步，发送HTTP请求。浏览器说：我要这个页面。服务器找到文件，把HTML原路发了回来。",
    # s05 渲染
    "最后一步，浏览器渲染。HTML搭骨架，CSS上皮肤，JavaScript管动作，页面这才出现在你眼前。",
    # s06 总结链路
    "整个流程就是：DNS查地址，TCP建连接，HTTP拿页面，浏览器做渲染。",
    # s07 金句
    "下次按下回车，你就知道，这一秒的背后，是一场毫秒级的接力赛。",
    # s08 CTA
    "关注全栈小秋，把计算机基础讲明白。还想听什么，评论区告诉我。",
]

def pick(d, *keys):
    for k in keys:
        if k in d:
            return d[k]
    return None

async def synth_one(i, text):
    audio_path = os.path.join(OUT, f"s{i+1:02d}.mp3")
    last_err = None
    for attempt in range(5):
        try:
            comm = edge_tts.Communicate(text, VOICE, rate=RATE, boundary="WordBoundary")
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
                if words:
                    last_off, last_dur = words[-1]["off"], words[-1]["dur"]
                    dur_sec = (last_off + last_dur) / 1e7
                else:
                    dur_sec = max(1.5, len(text) / 5.0)
                return {"audio": f"s{i+1:02d}.mp3", "dur_sec": dur_sec, "words": words}
            last_err = RuntimeError("audio too small")
        except Exception as e:
            last_err = e
        await asyncio.sleep(2 + attempt * 2)
    raise last_err

async def main():
    results = []
    for i, s in enumerate(SENTENCES):
        r = await synth_one(i, s)
        r["text"] = s
        r["index"] = i + 1
        results.append(r)
        print(f"s{i+1:02d} dur={r['dur_sec']:.2f}s")

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
            "words": [{"off_sec": round(w["off"] / 1e7, 3),
                        "dur_sec": round(w["dur"] / 1e7, 3), "t": w["t"]} for w in r["words"]],
        })
        cursor = end + GAP

    with open(os.path.join(OUT, "timeline.json"), "w", encoding="utf-8") as f:
        json.dump({"fps": FPS, "voice": VOICE, "rate": RATE,
                    "total_sec": round(cursor, 3),
                    "total_frames": round(cursor * FPS), "sentences": timeline},
                   f, ensure_ascii=False, indent=2)
    print("TOTAL_SEC", round(cursor, 3))
    print("TOTAL_FRAMES", round(cursor * FPS))

asyncio.run(main())
