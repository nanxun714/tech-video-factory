# -*- coding: utf-8 -*-
"""用同一句话合成各候选男声，与 coderun-tts 参考做 MFCC+基频双重比对"""
import asyncio, os, subprocess
import numpy as np
import edge_tts
from mutagen.mp3 import MP3

AUD = r"F:\小秋技术笔记\00_视频生产线\01_源码\remotion-production\public\audio"
FF = r"F:\小秋技术笔记\00_视频生产线\01_源码\remotion-production\node_modules\.pnpm\@remotion+compositor-win32-x64-msvc@4.0.512\node_modules\@remotion\compositor-win32-x64-msvc\ffmpeg.exe"
REF_TEXT = "你写的代码，是怎么变成电脑上跑起来的程序的？"
REF_MP3 = os.path.join(AUD, "coderun-tts", "s01.mp3")

CANDS = [
    ("zh-CN-YunxiNeural", "+0%"),
    ("zh-CN-YunxiNeural", "+4%"),
    ("zh-CN-YunxiNeural", "+18%"),
    ("zh-CN-YunyangNeural", "+0%"),
    ("zh-CN-YunyangNeural", "+4%"),
    ("zh-CN-YunjianNeural", "+0%"),
    ("zh-CN-YunhaoNeural", "+0%"),
    ("zh-CN-YunxiaNeural", "+0%"),
]

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

def frames_of(data, sr=16000, fl=400, hop=160):
    # 预加重 + 分帧
    d = np.append(data[0], data[1:] - 0.97 * data[:-1])
    n = (len(d) - fl) // hop
    idx = np.arange(fl)[None, :] + hop * np.arange(n)[:, None]
    fr = d[idx] * np.hamming(fl)
    # 只留有声帧（能量门槛）
    energy = np.abs(fr).mean(axis=1)
    thr = energy.max() * 0.05
    return fr[energy > thr]

def mfcc_mean(data, sr=16000):
    fr = frames_of(data, sr)
    if len(fr) == 0:
        return None, None
    spec = np.abs(np.fft.rfft(fr, axis=1)) ** 2
    # mel 滤波器组 26 带
    nf, nb = spec.shape[1], 26
    def hz2mel(h): return 2595 * np.log10(1 + h / 700)
    def mel2hz(m): return 700 * (10 ** (m / 2595) - 1)
    mels = np.linspace(hz2mel(60), hz2mel(7600), nb + 2)
    bins = np.floor((nf + 1) * mels / sr).astype(int)
    fbank = np.zeros((nb, nf))
    for b in range(1, nb + 1):
        l, c, r = bins[b - 1], bins[b], bins[b + 1]
        if c == l or r == c: continue
        fbank[b - 1, l:c] = (np.arange(l, c) - l) / (c - l)
        fbank[b - 1, c:r] = (r - np.arange(c, r)) / (r - c)
    mel = np.log(spec @ fbank.T + 1e-10)
    # DCT-II 取前 13 系数
    N = nb
    n = np.arange(N)
    k = np.arange(13)[:, None]
    dct = np.cos(np.pi * k * (2 * n + 1) / (2 * N)) @ mel.T
    v = dct.mean(axis=1)
    return v / np.linalg.norm(v), len(fr)

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

async def synth(voice, rate, out):
    for _ in range(5):
        try:
            comm = edge_tts.Communicate(REF_TEXT, voice, rate=rate)
            with open(out, "wb") as f:
                async for chunk in comm.stream():
                    if chunk.get("type") == "audio":
                        f.write(chunk["data"])
            if os.path.getsize(out) > 3000:
                return True
        except Exception as e:
            print(f"  {voice} {rate} retry: {type(e).__name__}")
            await asyncio.sleep(2)
    return False

async def main():
    rw = to_wav(REF_MP3)
    ref = load(rw)
    ref_m, _ = mfcc_mean(ref)
    ref_p = pitch_of(ref)
    print(f"参考 coderun s01: pitch={ref_p:.0f}Hz frames_ok")
    results = []
    for voice, rate in CANDS:
        tag = f"cand2_{voice.split('-')[1]}_{rate.replace('+', 'p')}"
        out = os.path.join(AUD, tag + ".mp3")
        ok = await synth(voice, rate, out)
        if not ok:
            print(f"{voice} {rate}: SYNTH FAIL")
            continue
        c = load(to_wav(out))
        c_m, _ = mfcc_mean(c)
        c_p = pitch_of(c)
        dist = float(np.linalg.norm(ref_m - c_m))
        results.append((dist, abs(c_p - ref_p), voice, rate, c_p))
        print(f"{voice:24s} {rate:5s}: MFCC距离={dist:.3f}  pitch={c_p:.0f}Hz (diff {c_p-ref_p:+.0f})")
    print("\n=== 按音色距离排序（越小越像）===")
    for dist, pd, voice, rate, c_p in sorted(results):
        print(f"{voice} {rate}  MFCC={dist:.3f}  pitchDiff={pd:+.0f}Hz")

asyncio.run(main())
