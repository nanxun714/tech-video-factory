"""Softer SFX set v3 (stdlib only): page swish, flight rise, warm chime, gentle fall."""
import math, random, struct, wave
SR = 44100

def write_wav(path, samples):
    with wave.open(path, "w") as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR)
        frames = bytearray()
        for s in samples:
            v = max(-1.0, min(1.0, s))
            frames += struct.pack("<h", int(v * 32767))
        w.writeframes(bytes(frames))

def env(t, dur, a=0.03, r=0.25):
    if t < a: return t / a
    if t > dur - r: return max(0.0, (dur - t) / r)
    return 1.0

# 纸张翻页：极短的柔噪扫频
def gen_page():
    dur = 0.22; n = int(SR * dur); out = []
    low = band = 0.0
    for i in range(n):
        t = i / SR
        f = 0.10 + 0.25 * math.sin(math.pi * t / dur)
        inp = (random.random() * 2 - 1) * 0.5
        low += f * band; band += f * (inp - low - 0.8 * band)
        out.append(band * env(t, dur, 0.04, 0.12) * math.sin(math.pi * t / dur) * 0.35)
    return out

# 飞行：温柔上滑正弦+气声
def gen_fly():
    dur = 0.35; n = int(SR * dur); out = []
    low = band = 0.0
    for i in range(n):
        t = i / SR
        f = 0.05 + 0.35 * (t / dur) ** 1.3
        inp = (random.random() * 2 - 1) * 0.6
        low += f * band; band += f * (inp - low - 0.9 * band)
        tone = 0.18 * math.sin(2 * math.pi * (500 + 700 * t / dur) * t) * (t / dur)
        out.append((band * 0.35 + tone) * env(t, dur, 0.05, 0.15))
    return out

# 温暖木琴双音：C6->E6 正弦+2次谐波慢衰减
def gen_warm():
    dur = 0.9; n = int(SR * dur); out = []
    for i in range(n):
        t = i / SR; v = 0.0
        for st, f0 in [(0.0, 1046.5), (0.16, 1318.5)]:
            tt = t - st
            if tt >= 0:
                e = math.exp(-tt / 0.28) * (1 if tt < 0.01 else min(1.0, tt / 0.01))
                v += e * (math.sin(2 * math.pi * f0 * tt) + 0.35 * math.sin(2 * math.pi * f0 * 2 * tt) + 0.12 * math.sin(2 * math.pi * f0 * 3 * tt))
        out.append(v * 0.22)
    return out

# 丢失：柔和下滑两音
def gen_fall():
    dur = 0.45; n = int(SR * dur); out = []
    for i in range(n):
        t = i / SR
        f = 660 - 320 * (t / dur)
        e = math.exp(-t / 0.3) * env(t, dur, 0.02, 0.2)
        out.append(0.2 * e * (math.sin(2 * math.pi * f * t) + 0.25 * math.sin(2 * math.pi * f * 2 * t)))
    return out

base = r"F:/小秋技术笔记/00_视频生产线/01_源码/remotion-production/public/audio/sfx/"
write_wav(base + "page3.wav", gen_page())
write_wav(base + "fly3.wav", gen_fly())
write_wav(base + "warm3.wav", gen_warm())
write_wav(base + "fall3.wav", gen_fall())
print("sfx v3 done")
