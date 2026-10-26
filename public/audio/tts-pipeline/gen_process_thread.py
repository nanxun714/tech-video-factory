import asyncio, edge_tts, json, os, shutil

VOICE = "zh-CN-XiaoxiaoNeural"
RATE = "+28%"
FPS = 30
GAP = 0.18
HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(os.path.dirname(HERE), "process-thread-tts")

SENTENCES = [
    "面试问进程和线程，只会背最小单位？面试官直接把你刷了。",
    "他真正想听的，是你能不能讲清楚：程序为什么会卡死。",
    "软件卡死、点不动，多半是负责界面的那个线程被堵住了。",
    "记住这个类比：进程是一套房子，线程是房子里干活的人。",
    "整个微信就是一个进程，收消息、刷朋友圈、加载图片，是三条线程。",
    "图片那条线程堵住了，收消息那条照常跑——所以微信能收消息，朋友圈却在转圈。",
    "核心区别：进程管资源隔离，线程管执行，一个进程带多条线程。",
    "面试别再背定义了，把这个例子讲清楚，面试官才信你。",
    "觉得讲明白了，点个赞，面试前把这组知识点再刷一遍。",
]

def pick(d, *keys):
    for k in keys:
        if k in d:
            return d[k]
    return None

async def synth_one(i, text):
    comm = edge_tts.Communicate(text, VOICE, rate=RATE)
    audio_path = os.path.join(OUT, f"s{i+1:02d}.mp3")
    words = []
    with open(audio_path, "wb") as f:
        async for chunk in comm.stream():
            if chunk.get("type") == "audio":
                f.write(chunk["data"])
            else:
                off = pick(chunk, "Offset", "offset")
                dur = pick(chunk, "Duration", "duration")
                if off is not None and dur is not None:
                    words.append((int(off), int(dur)))
    if words:
        last_off, last_dur = words[-1]
        dur_sec = (last_off + last_dur) / 1e7
    else:
        dur_sec = max(1.5, len(text) / 6.0)
    return {"audio": f"s{i+1:02d}.mp3", "dur_sec": dur_sec}

async def main():
    os.makedirs(OUT, exist_ok=True)
    for f in os.listdir(OUT):
        if f.startswith("s") and f.endswith(".mp3"):
            os.remove(os.path.join(OUT, f))
    results = []
    for i, s in enumerate(SENTENCES):
        r = await synth_one(i, s)
        r["text"] = s
        r["index"] = i + 1
        results.append(r)
        print(f"s{i+1:02d} dur={r['dur_sec']:.2f}s chars={len(s)} rate={len(s)/r['dur_sec']:.2f}/s")

    cursor = 0.0
    timeline = []
    for r in results:
        start, end = cursor, cursor + r["dur_sec"]
        timeline.append({
            "index": r["index"], "text": r["text"], "audio": r["audio"],
            "start_sec": round(start, 3), "end_sec": round(end, 3),
            "start_frame": round(start * FPS), "end_frame": round(end * FPS),
            "dur_sec": round(r["dur_sec"], 3),
        })
        cursor = end + GAP

    with open(os.path.join(OUT, "timeline.json"), "w", encoding="utf-8") as f:
        json.dump({"fps": FPS, "rate": RATE, "total_sec": round(cursor, 3),
                   "total_frames": round(cursor * FPS), "sentences": timeline},
                  f, ensure_ascii=False, indent=2)

    with open(os.path.join(os.path.dirname(HERE), "tts-input-process-thread.json"), "w", encoding="utf-8") as f:
        json.dump({"voice": VOICE, "rate": RATE, "out_dir": "process-thread-tts", "sentences": SENTENCES}, f, ensure_ascii=False, indent=2)

    print("TOTAL_SEC", round(cursor, 3), "FRAMES", round(cursor * FPS))

asyncio.run(main())
