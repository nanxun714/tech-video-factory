import asyncio, edge_tts, json, os

VOICE = "zh-CN-XiaoxiaoNeural"
RATE = "+28%"
FPS = 30
GAP = 0.18
HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(os.path.dirname(HERE), "http-core-tts")

SENTENCES = [
    "你每天刷网页、点链接，背后都在用同一个东西——HTTP。",
    "它就是浏览器和服务器之间，传数据的规矩。",
    "每次上网都是一问一答：浏览器发一个请求，服务器回一个响应。",
    "请求里第一行是方法：GET 是拿数据，POST 是交数据。",
    "打开网页用 GET，填表单、登录用 POST，别搞混。",
    "请求头里藏着你的身份：什么浏览器、从哪跳过来，服务器全靠它判断。",
    "服务器回来时带一个状态码，三个数字告诉你结果。",
    "200 成功，404 页面不存在，500 服务器自己挂了。",
    "看到 404 是地址错了；看到 500，才是网站的锅。",
    "HTTP 还有个特点：无状态，它记不住你是谁。",
    "所以登录才需要 Cookie，把身份记在浏览器里，下次自动带上。",
    "最重要的一条：HTTP 是明文传输，密码等于裸奔。",
    "所以正式网站都要上 HTTPS，给数据加把锁。",
    "这六条，就是 HTTP 最有用的核心。",
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

    with open(os.path.join(os.path.dirname(HERE), "tts-input-http-core.json"), "w", encoding="utf-8") as f:
        json.dump({"voice": VOICE, "rate": RATE, "out_dir": "http-core-tts", "sentences": SENTENCES}, f, ensure_ascii=False, indent=2)

    print("TOTAL_SEC", round(cursor, 3), "FRAMES", round(cursor * FPS))

asyncio.run(main())
