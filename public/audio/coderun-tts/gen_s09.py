# -*- coding: utf-8 -*-
import asyncio, edge_tts, json, os, math

OUT = os.path.dirname(os.path.abspath(__file__))
VOICE = "zh-CN-YunjianNeural"
RATE = "+8%"
TEXT = "本期内容就到这里，我们下期见！"


def pick(d, *keys):
    for k in keys:
        if k in d:
            return d[k]
    for k in d:
        if any(k.lower() == kk.lower() for kk in keys):
            return d[k]
    return None


async def main():
    comm = edge_tts.Communicate(TEXT, VOICE, rate=RATE)
    path = os.path.join(OUT, "s09.mp3")
    words = []
    with open(path, "wb") as f:
        async for chunk in comm.stream():
            if chunk.get("type") == "audio":
                f.write(chunk["data"])
            else:
                off = pick(chunk, "Offset", "offset")
                dur = pick(chunk, "Duration", "duration")
                if off is not None and dur is not None:
                    words.append((int(off), int(dur)))
    if words:
        dur = (words[-1][0] + words[-1][1]) / 1e7
    else:
        dur = max(2.5, len(TEXT) / 5.0)
    json.dump({"dur_sec": round(dur, 3)}, open(os.path.join(OUT, "s09.json"), "w"))
    print("s09 dur:", round(dur, 3))


asyncio.run(main())
