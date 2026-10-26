# -*- coding: utf-8 -*-
"""验证云健音色 + 校准与《代码怎么跑》一致的语速档位"""
import asyncio, os, statistics, subprocess
import numpy as np
import edge_tts
from mutagen.mp3 import MP3

AUD = r"F:\小秋技术笔记\00_视频生产线\01_源码\remotion-production\public\audio"
FF = r"F:\小秋技术笔记\00_视频生产线\01_源码\remotion-production\node_modules\.pnpm\@remotion+compositor-win32-x64-msvc@4.0.512\node_modules\@remotion\compositor-win32-x64-msvc\ffmpeg.exe"
S1_TEXT = "电脑一卡死，网友的第一句话永远是：重启试试。"
REF_SECS = 4.691  # coderun s01 22字

def to_wav(mp3):
    wav = mp3 + ".wav"
    subprocess.run([FF, "-y", "-loglevel", "error", "-i", mp3, "-ac", "1", "-ar", "16000", "-f", "wav", wav], check=True)
    return wav

def load(path):
    w = wave.open(path, "rb")
    d = np.frombuffer(w.readframes(w.getnframes()), dtype=np.int16).astype(float)
    w.close()
    return d

import wave

def pitch_of(data, sr=16000):
    frame, hop = 640, 320
    ps = []
    for i in range(0, len(data) - frame, hop):
        seg = data[i:i + frame]
        if np.abs(seg).mean() < 300: continue
        seg = seg - seg.mean()
        ac = np.correlate(seg, seg, "full")[frame - 1:]
        if ac[0] <= 0: continue
        ac = ac / ac[0]
        lo, hi = int(sr / 300), int(sr / 70)
        lag = lo + int(np.argmax(ac[lo:hi]))
        if ac[lag] > 0.55: ps.append(sr / lag)
    return float(np.median(ps)) if ps else 0

async def synth(text, voice, rate, out):
    for _ in range(5):
        try:
            comm = edge_tts.Communicate(text, voice, rate=rate)
            with open(out, "wb") as f:
                async for chunk in comm.stream():
                    if chunk.get("type") == "audio":
                        f.write(chunk["data"])
            if os.path.getsize(out) > 3000:
                return True
        except Exception as e:
            print(f"  retry {type(e).__name__}")
            await asyncio.sleep(2)
    return False

async def main():
    # 1. 验证桌面云健样本 vs coderun 参考
    ref_w = to_wav(os.path.join(AUD, "coderun-tts", "s01.mp3"))
    sample_w = to_wav(r"C:\Users\27119\Desktop\声音对比\1-云健-男声-现在用的.mp3")
    print(f"coderun 参考: {pitch_of(load(ref_w)):.0f} Hz | 桌面云健样本: {pitch_of(load(sample_w)):.0f} Hz")

    # 2. 语速校准：我的 s01 在云健不同 rate 下的时长
    for rate in ["+0%", "+8%", "+12%", "+15%"]:
        out = os.path.join(AUD, f"yj_cal_{rate.replace('+', 'p')}.mp3")
        if not await synth(S1_TEXT, "zh-CN-YunjianNeural", rate, out):
            print(f"{rate}: FAIL"); continue
        d = MP3(out).info.length
        print(f"云健 {rate}: s01 = {d:.2f}s (目标≈{REF_SECS:.2f}s)")

asyncio.run(main())
