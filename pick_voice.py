# -*- coding: utf-8 -*-
import asyncio, os
import edge_tts
from mutagen.mp3 import MP3
import wave, subprocess, statistics
import numpy as np

AUD = r"F:\小秋技术笔记\00_视频生产线\01_源码\remotion-production\public\audio"
FF = r"F:\小秋技术笔记\00_视频生产线\01_源码\remotion-production\node_modules\.pnpm\@remotion+compositor-win32-x64-msvc@4.0.512\node_modules\@remotion\compositor-win32-x64-msvc\ffmpeg.exe"
TEXT = "电脑一卡死，网友的第一句话永远是：重启试试。"
CANDS = [
    ("zh-CN-YunxiNeural", "+18%"),
    ("zh-CN-YunxiNeural", "+0%"),
    ("zh-CN-YunyangNeural", "+0%"),
    ("zh-CN-YunjianNeural", "+0%"),
    ("zh-CN-YunhaoNeural", "+0%"),
]

def pitch_of(path):
    subprocess.run([FF, "-y", "-loglevel", "error", "-i", path, "-ac", "1", "-ar", "16000", "-f", "wav", path + ".wav"], check=True)
    w = wave.open(path + ".wav", "rb")
    data = np.frombuffer(w.readframes(w.getnframes()), dtype=np.int16).astype(float)
    w.close()
    sr = 16000
    frame, hop = 640, 320
    ps = []
    for i in range(0, len(data) - frame, hop):
        seg = data[i:i + frame]
        if np.abs(seg).mean() < 300:
            continue
        seg = seg - seg.mean()
        ac = np.correlate(seg, seg, "full")[frame - 1:]
        if ac[0] <= 0:
            continue
        ac = ac / ac[0]
        lo, hi = int(sr / 300), int(sr / 70)
        lag = lo + int(np.argmax(ac[lo:hi]))
        if ac[lag] > 0.5:
            ps.append(sr / lag)
    return statistics.median(ps) if ps else 0

async def synth(voice, rate, out):
    for _ in range(4):
        try:
            comm = edge_tts.Communicate(TEXT, voice, rate=rate)
            with open(out, "wb") as f:
                async for chunk in comm.stream():
                    if chunk.get("type") == "audio":
                        f.write(chunk["data"])
            return True
        except Exception as e:
            print("  retry:", type(e).__name__)
            await asyncio.sleep(2)
    return False

async def main():
    ref = pitch_of(os.path.join(AUD, "pitch_coderun.wav"))
    print(f"reference coderun s01: {ref:.0f} Hz")
    for voice, rate in CANDS:
        out = os.path.join(AUD, f"cand_{voice.split('-')[1]}_{rate.replace('+','p')}.mp3")
        ok = await synth(voice, rate, out)
        if not ok:
            print(f"{voice} {rate}: SYNTH FAIL")
            continue
        p = pitch_of(out)
        dur = MP3(out).info.length
        print(f"{voice:24s} {rate:5s}: {p:.0f} Hz  ({dur:.2f}s)  diff={p-ref:+.0f}")

asyncio.run(main())
