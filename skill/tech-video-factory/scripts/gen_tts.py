# -*- coding: utf-8 -*-
"""技术科普视频配音生成器。
用法: python gen_tts.py tts-input.json
输入 JSON: {"voice": "zh-CN-XiaoxiaoNeural", "rate": "+4%",
            "out_dir": "my-topic-tts", "sentences": ["第一句", ...]}
输出: out_dir/s01.mp3... + out_dir/timeline.json (每句 start_frame/end_frame)
"""
import asyncio, edge_tts, json, os, sys

FPS = 30
GAP = 0.18  # 句间空隙(秒)


def pick(d, *keys):
    for k in keys:
        if k in d:
            return d[k]
    for k in d:
        if any(k.lower() == kk.lower() for kk in keys):
            return d[k]
    return None


async def synth_one(out_dir, i, text, voice, rate):
    comm = edge_tts.Communicate(text, voice, rate=rate)
    audio_path = os.path.join(out_dir, f"s{i+1:02d}.mp3")
    words = []
    first = None
    with open(audio_path, "wb") as f:
        async for chunk in comm.stream():
            if chunk.get("type") == "audio":
                f.write(chunk["data"])
            else:
                off = pick(chunk, "Offset", "offset")
                dur = pick(chunk, "Duration", "duration")
                if first is None:
                    first = chunk
                if off is not None and dur is not None:
                    words.append((int(off), int(dur)))
    if first and not words:
        print("WARN non-audio chunk keys:", list(first.keys()))
    if words:
        dur_sec = (words[-1][0] + words[-1][1]) / 1e7
    else:
        dur_sec = max(1.5, len(text) / 5.0)
    return dur_sec


async def main(cfg_path):
    cfg = json.load(open(cfg_path, encoding="utf-8"))
    voice = cfg.get("voice", "zh-CN-XiaoxiaoNeural")
    rate = cfg.get("rate", "+4%")
    out_dir = cfg["out_dir"]
    os.makedirs(out_dir, exist_ok=True)
    sentences = cfg["sentences"]

    cursor = 0.0
    results = []
    for i, text in enumerate(sentences):
        dur = await synth_one(out_dir, i, text, voice, rate)
        start = round(cursor, 3)
        end = round(cursor + dur, 3)
        cursor = end + GAP
        results.append({
            "index": i + 1, "text": text, "audio": f"s{i+1:02d}.mp3",
            "start_sec": start, "end_sec": end,
            "start_frame": int(round(start * FPS)),
            "end_frame": int(round(end * FPS)),
        })
        print(f's{i+1:02d} {start:>6.2f} -> {end:>6.2f} ({dur:.2f}s) {text}')

    total = round(cursor - GAP, 3)
    timeline = {"fps": FPS, "voice": voice, "rate": rate,
                "total_sec": total, "total_frames": int(round(total * FPS)),
                "sentences": results}
    with open(os.path.join(out_dir, "timeline.json"), "w", encoding="utf-8") as f:
        json.dump(timeline, f, ensure_ascii=False, indent=2)
    print("total:", total, "s /", timeline["total_frames"], "frames")


if __name__ == "__main__":
    asyncio.run(main(sys.argv[1]))
