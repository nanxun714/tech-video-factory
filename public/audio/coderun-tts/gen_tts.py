import asyncio, edge_tts, json, os

VOICE = "zh-CN-YunjianNeural"
RATE = "+8%"
FPS = 30
GAP = 0.2
OUT = os.path.dirname(os.path.abspath(__file__))

SENTENCES = [
    "你写的代码，是怎么变成电脑上跑起来的程序的？",
    "无论是 Python、Java 还是 C++，本质上都是一份文本文件；但 CPU 只认识 0 和 1 组成的机器语言。",
    "所以第一步，要靠编译器或解释器，把代码翻译成 CPU 能懂的机器指令。",
    "以 C 语言为例，从编译到运行，主要分四步：预编译、编译、链接、运行。",
    "预编译先干三件事：把头文件展开，把宏做纯文本替换，再删掉条件不满足的代码。",
    "然后是语法检查，少分号、类型不匹配都会被拦下；通过后生成目标文件，链接器再把代码和系统库拼接起来，变成可执行程序。",
    "双击运行时，操作系统把它加载进内存、分配好资源，再把 CPU 交给程序入口，指令一条条执行。",
    "整个流程就像工厂流水线，各司其职，才能让几行文本，变成真正跑起来的软件。",
]


def pick(d, *keys):
    for k in keys:
        if k in d:
            return d[k]
    for k in d:
        if any(k.lower() == kk.lower() for kk in keys):
            return d[k]
    return None


async def synth_one(i, text):
    comm = edge_tts.Communicate(text, VOICE, rate=RATE)
    audio_path = os.path.join(OUT, f"s{i+1:02d}.mp3")
    words = []
    first_wb = None
    with open(audio_path, "wb") as f:
        async for chunk in comm.stream():
            if chunk.get("type") == "audio":
                f.write(chunk["data"])
            else:
                off = pick(chunk, "Offset", "offset")
                dur = pick(chunk, "Duration", "duration")
                txt = pick(chunk, "Text", "text")
                if first_wb is None:
                    first_wb = chunk
                if off is not None and dur is not None:
                    words.append((int(off), int(dur), txt))
    if first_wb and not words:
        print("WARN first non-audio chunk keys:", list(first_wb.keys()), first_wb)
    if words:
        last_off, last_dur, _ = words[-1]
        dur_sec = (last_off + last_dur) / 1e7
    else:
        dur_sec = max(1.5, len(text) / 5.0)
    return {"audio": f"s{i+1:02d}.mp3", "dur_sec": dur_sec, "wb_count": len(words)}


async def main():
    results = []
    cursor = 0.0
    for i, s in enumerate(SENTENCES):
        r = await synth_one(i, s)
        r["text"] = s
        r["index"] = i + 1
        r["start_sec"] = round(cursor, 3)
        r["end_sec"] = round(cursor + r["dur_sec"], 3)
        r["start_frame"] = int(round(r["start_sec"] * FPS))
        r["end_frame"] = int(round(r["end_sec"] * FPS))
        cursor = r["end_sec"] + GAP
        results.append(r)

    total_sec = round(cursor - GAP, 3)
    timeline = {
        "fps": FPS,
        "total_sec": total_sec,
        "total_frames": int(round(total_sec * FPS)),
        "sentences": results,
    }
    with open(os.path.join(OUT, "timeline.json"), "w", encoding="utf-8") as f:
        json.dump(timeline, f, ensure_ascii=False, indent=2)
    print(json.dumps({k: timeline[k] for k in ("fps", "total_sec", "total_frames")}, ensure_ascii=False))
    for r in results:
        print(f's{r["index"]:02d} {r["start_sec"]:>6.2f} -> {r["end_sec"]:>6.2f}  ({r["dur_sec"]:.2f}s)  {r["text"]}')


asyncio.run(main())
