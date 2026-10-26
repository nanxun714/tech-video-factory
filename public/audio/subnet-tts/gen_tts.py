import asyncio, edge_tts, json, os

VOICE = "zh-CN-XiaoxiaoNeural"
RATE = "+4%"
FPS = 30
GAP = 0.18
OUT = os.path.dirname(os.path.abspath(__file__))

SENTENCES = [
    "电脑有了IP地址，为什么还要配置子网掩码？",
    "先看IP。IPv4本质是32位二进制数，每8位一组转成十进制，就是192.168.1.10。",
    "实际使用时，IP分成两段：前面的网络部分，决定你属于哪个子网；后面的主机部分，区分子网里的设备。",
    "电脑发数据前必须先判断：目标和我在不在这个子网？在，直接发送；不在，交给默认网关转发。",
    "可只看IP，根本看不出边界在哪：哪几位是网络，哪几位是主机？",
    "子网掩码就是来画这条边界的：255.255.255.0，二进制是连续24个1加8个0，1对应网络，0对应主机。",
    "所以斜杠24，就是255.255.255.0的简写，两种写法是同一回事。",
    "电脑把IP和掩码按位相与：结果相同，就是同一个子网，直接通信；不同，就走网关。这，就是子网掩码的作用。",
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
        print(f's{r["index"]:02d} {r["start_sec"]:>6.2f} -> {r["end_sec"]:>6.2f}  ({r["dur_sec"]:.2f}s, wb={r["wb_count"]})  {r["text"]}')


asyncio.run(main())
