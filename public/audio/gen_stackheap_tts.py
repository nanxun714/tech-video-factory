import asyncio, edge_tts, json, os

VOICE = "zh-CN-YunxiNeural"
RATE = "+18%"
FPS = 30
GAP = 0.18
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "stackheap-tts")
os.makedirs(OUT, exist_ok=True)

SENTENCES = [
    # s01 钩子：现象反差
    "同样是内存，为什么有的地方用完自动收拾干净，有的地方却越积越多，最后把程序活活卡死？",
    # s02 兑现：两种内存
    "因为程序里的内存分两种，一种叫栈，一种叫堆，它们的脾气完全不一样。",
    # s03 栈机制：自动管理
    "栈像一个自动餐盘架，函数一调用就压进去，一返回就自动弹走，全程系统自动管理，不用你操一点心。",
    # s04 栈翻车：溢出
    "但栈有个死穴，空间很小。递归忘了写结束条件，函数一层压一层，很快塞爆，程序当场崩溃，这就叫栈溢出。",
    # s05 堆机制：手动申请
    "堆就自由多了，想要多少就申请多少。C语言用malloc，Java用new，创建出来的对象都住在这里。",
    # s06 堆翻车：泄漏
    "但自由的代价是自己管自己。申请了忘了还，这块内存就永远被占着，越积越多，这就是内存泄漏。上次说的程序越跑越卡，元凶就是它。",
    # s07 对比收束
    "一张图记住。栈，自动管理，空间小速度快，塞爆了叫栈溢出。堆，手动管理，空间大更灵活，漏掉了叫内存泄漏。",
    # s08 金句+CTA
    "所以下次程序崩溃，先想想是栈炸了，还是堆漏了。关注全栈小秋，下期讲CPU占用爆表，怎么揪出真凶。",
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
        print(f"s{i+1:02d} word_dur={r['dur_sec']:.2f}s")

    # 用 mutagen 实测 MP3 真实时长，与词级估计偏差 >8% 时以实测为准并等比缩放词级
    try:
        from mutagen.mp3 import MP3
    except ImportError:
        MP3 = None
    corrections = []
    for r in results:
        if MP3 is None:
            break
        real = MP3(os.path.join(OUT, r["audio"])).info.length
        if abs(real - r["dur_sec"]) / max(real, 0.01) > 0.08:
            scale = real / r["dur_sec"] if r["dur_sec"] > 0 else 1.0
            for w in r["words"]:
                w["off"] = int(w["off"] * scale)
                w["dur"] = int(w["dur"] * scale)
            corrections.append((r["audio"], round(r["dur_sec"], 2), round(real, 2)))
            r["dur_sec"] = real
    if corrections:
        print("RESCALED:", corrections)

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
            "words": [{"off_sec": round((w["off"]) / 1e7, 3),
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
