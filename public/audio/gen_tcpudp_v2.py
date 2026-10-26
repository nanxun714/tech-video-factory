import asyncio, edge_tts, json, os

VOICE = "zh-CN-XiaoxiaoNeural"
RATE = "+4%"
FPS = 30
GAP = 0.18
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "tcpudp-tts-v2")
os.makedirs(OUT, exist_ok=True)

SENTENCES = [
    # s01 0~1.5s 问题钩子
    "你看视频的时候，数据到底是怎么传过来的？",
    # s02 1.5~5s 引出+冲突
    "背后离不开两个协议，TCP和UDP。一个更追求可靠，一个更追求速度。",
    # s03 生活比喻
    "TCP像打电话，先问一句听到了吗，听到了才继续说。",
    # s04 UDP比喻
    "UDP像拿大喇叭喊话，喊完就走，不管你听没听到。",
    # s05 TCP五镜头
    "TCP发每个包，都编号签收。发现第三个没到，就问一句，然后重新发，确认收到才继续。",
    # s06 UDP反差
    "UDP呢，五个包连续发，中间丢了也不等、不确认、不重传。它不提供TCP那样的可靠机制，但换来了低延迟。",
    # s07 场景
    "所以网页、文件、登录，走TCP；直播、游戏、DNS，走UDP。",
    # s08 总结
    "TCP更强调可靠性，UDP更强调低延迟和效率。不是谁更好，而是看你的场景需要什么。",
    # s09 结尾
    "下一期，浏览器输入网址后，到底发生了什么？关注全栈小秋，继续把计算机基础讲明白。",
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
            comm = edge_tts.Communicate(text, VOICE, rate=RATE)
            words = []
            with open(audio_path, "wb") as f:
                async for chunk in comm.stream():
                    if chunk.get("type") == "audio":
                        f.write(chunk["data"])
                    else:
                        off = pick(chunk, "Offset")
                        dur = pick(chunk, "Duration")
                        if off is not None and dur is not None:
                            words.append((int(off), int(dur)))
            if os.path.getsize(audio_path) > 1000:
                if words:
                    last_off, last_dur = words[-1]
                    dur_sec = (last_off + last_dur) / 1e7
                else:
                    dur_sec = max(1.5, len(text) / 5.0)
                return {"audio": f"s{i+1:02d}.mp3", "dur_sec": dur_sec}
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
