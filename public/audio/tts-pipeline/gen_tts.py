import asyncio, edge_tts, json, os

VOICE = "zh-CN-XiaoxiaoNeural"
RATE = "-8%"
FPS = 30
GAP = 0.18
OUT = os.path.dirname(os.path.abspath(__file__))

SENTENCES = [
    "Hadoop 里一台服务器突然挂了，你的数据会跟着消失吗？",
    "答案是不会。HDFS 从来不会只存一份。",
    "你上传的大文件，会被 HDFS 切成一个个 128MB 的 Block。",
    "HDFS 默认保存三份副本，分散到不同节点，一台出故障，其它副本顶上来。",
    "当一台 DataNode 掉线，NameNode 发现心跳断了，立刻去找其它副本。",
    "数据照常能读，集群照常能跑。",
    "三副本，就是 HDFS 容错的底气。挂一台，不丢一分。",
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
    for i, s in enumerate(SENTENCES):
        r = await synth_one(i, s)
        r["text"] = s
        r["index"] = i + 1
        results.append(r)
        print(f"s{i+1:02d} dur={r['dur_sec']:.2f}s wb={r['wb_count']}")

    cursor = 0.0
    timeline = []
    srt_lines = []
    for r in results:
        start = cursor
        end = start + r["dur_sec"]
        sf = round(start * FPS)
        ef = round(end * FPS)
        timeline.append({
            "index": r["index"], "text": r["text"], "audio": r["audio"],
            "start_sec": round(start, 3), "end_sec": round(end, 3),
            "start_frame": sf, "end_frame": ef, "dur_sec": round(r["dur_sec"], 3),
        })
        srt_lines.append((r["index"], start, end, r["text"]))
        cursor = end + GAP

    total_sec = cursor
    total_frames = round(total_sec * FPS)

    with open(os.path.join(OUT, "timeline.json"), "w", encoding="utf-8") as f:
        json.dump({"fps": FPS, "total_sec": round(total_sec, 3),
                    "total_frames": total_frames, "sentences": timeline},
                   f, ensure_ascii=False, indent=2)

    def fmt(sec):
        ms = int(round(sec * 1000))
        h, ms = divmod(ms, 3600000)
        m, ms = divmod(ms, 60000)
        s, ms = divmod(ms, 1000)
        return f"{h:02d}:{m:02d}:{s:02d},{ms:03d}"

    srt_path = os.path.join(OUT, "..", "hdfs-fault-tolerance-voiceover.srt")
    with open(srt_path, "w", encoding="utf-8") as f:
        for idx, ss, ee, text in srt_lines:
            f.write(f"{idx}\n{fmt(ss)} --> {fmt(ee)}\n{text}\n\n")

    print("TOTAL_SEC", round(total_sec, 3))
    print("TOTAL_FRAMES", total_frames)
    print("SRT", os.path.abspath(srt_path))

asyncio.run(main())
