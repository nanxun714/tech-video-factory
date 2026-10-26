# -*- coding: utf-8 -*-
"""只补录 s11（CTA句），前10句不动，追加进 ctrlc-tts-v3/timeline.json。"""
import asyncio, edge_tts, json, os

TEXT = "下一期想看什么？点赞评论加关注，在评论区告诉我。"
VOICE = "zh-CN-YunjianNeural"
RATE = "+15%"
OUT = "public/audio/ctrlc-tts-v3"


async def synth():
    for i in range(4):
        try:
            comm = edge_tts.Communicate(TEXT, VOICE, rate=RATE)
            data = bytearray()
            async for ch in comm.stream():
                if ch.get("type") == "audio":
                    data += ch["data"]
            if len(data) > 1000:
                open(os.path.join(OUT, "s11.mp3"), "wb").write(bytes(data))
                return len(data)
        except Exception as e:
            print("retry", i, repr(e))
            await asyncio.sleep(2)
    raise SystemExit("TTS failed after retries")


n = asyncio.run(synth())
from mutagen.mp3 import MP3
dur = MP3(os.path.join(OUT, "s11.mp3")).info.length
tl = json.load(open(os.path.join(OUT, "timeline.json"), encoding="utf-8"))
assert tl["sentences"][-1]["index"] == 10, "timeline 尾句不是 s10，勿重复追加"
prev = tl["sentences"][-1]
start_sec = prev["end_sec"] + 0.18
end_sec = start_sec + dur
s11 = {"index": 11, "text": TEXT, "audio": "s11.mp3",
       "start_sec": round(start_sec, 3), "end_sec": round(end_sec, 3),
       "start_frame": round(start_sec * 30), "end_frame": round(end_sec * 30)}
tl["sentences"].append(s11)
tl["total_sec"] = round(end_sec, 3)
tl["total_frames"] = s11["end_frame"]
json.dump(tl, open(os.path.join(OUT, "timeline.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=1)
# 短语窗（7/7/7 三等分）
a, b = s11["start_frame"], s11["end_frame"]
w = (b - a) // 3
print("s11 %d-%d (dur %.2fs) ctaStart=%d p2=%d p3=%d DUR建议=%d"
      % (a, b, dur, a - 3, a + w, a + 2 * w, b + 18))
