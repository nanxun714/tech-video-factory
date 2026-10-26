import asyncio, edge_tts, json, os

VOICE = "zh-CN-YunxiNeural"
RATE = "+18%"
FPS = 30
GAP = 0.16
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "python-runtime-tts-v3")
os.makedirs(OUT, exist_ok=True)

SENTENCES = [
    "Python不是机器码，CPU不认识它，为什么还能运行？",
    "因为源码先交给Python解释器，通常会被编译成字节码。",
    "再由Python运行时取出指令，管理对象、变量和调用。",
    "所以Python不是不编译，而是编译和执行方式不同。",
    "比如print Hello，会变成类似这样的字节码指令。",
    "C通常先生成机器码；Python则多了字节码、解释器和运行时。",
    "CPU不认识Python，它执行的是运行环境里的机器指令。",
    "下一期，程序运行时，内存到底发生了什么？",
]

async def synth_one(i, text):
    path = os.path.join(OUT, f"s{i + 1:02d}.mp3")
    last = None
    for attempt in range(5):
        try:
            comm = edge_tts.Communicate(text, VOICE, rate=RATE)
            words = []
            with open(path, "wb") as f:
                async for chunk in comm.stream():
                    if chunk.get("type") == "audio":
                        f.write(chunk["data"])
                    elif chunk.get("Offset") is not None and chunk.get("Duration") is not None:
                        words.append((int(chunk["Offset"]), int(chunk["Duration"])))
            if os.path.getsize(path) > 1000:
                duration = ((words[-1][0] + words[-1][1]) / 1e7) if words else max(1.5, len(text) / 5)
                return duration
        except Exception as exc:
            last = exc
        await asyncio.sleep(2 + attempt * 2)
    raise last or RuntimeError("TTS produced no audio")

async def main():
    durations = []
    for i, text in enumerate(SENTENCES):
        duration = await synth_one(i, text)
        durations.append(duration)
        print(f"s{i + 1:02d} dur={duration:.2f}s")

    cursor = 0.0
    sentences = []
    for i, (text, duration) in enumerate(zip(SENTENCES, durations), 1):
        start = cursor
        end = start + duration
        sentences.append({
            "index": i, "text": text, "audio": f"s{i:02d}.mp3",
            "start_sec": round(start, 3), "end_sec": round(end, 3),
            "start_frame": round(start * FPS), "end_frame": round(end * FPS),
            "dur_sec": round(duration, 3),
        })
        cursor = end + GAP

    with open(os.path.join(OUT, "timeline.json"), "w", encoding="utf-8") as f:
        json.dump({"fps": FPS, "voice": VOICE, "rate": RATE,
                   "total_sec": round(cursor, 3), "total_frames": round(cursor * FPS),
                   "sentences": sentences}, f, ensure_ascii=False, indent=2)
    print("TOTAL_SEC", round(cursor, 3))
    print("TOTAL_FRAMES", round(cursor * FPS))

asyncio.run(main())
