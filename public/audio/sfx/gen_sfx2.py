"""Generate whoosh/pop SFX + crisper ding (stdlib only, 16-bit mono 44.1k).

whoosh.wav - band-pass noise sweep up (packet taking off)
pop.wav    - quick bubbly pop (element pop-in / like button)
ding.wav   - bright E6 with attack transient (decision result)
"""
import math
import random
import struct
import wave

SR = 44100


def write_wav(path: str, samples: list[float]) -> None:
    with wave.open(path, "w") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(SR)
        frames = bytearray()
        for s in samples:
            v = max(-1.0, min(1.0, s))
            frames += struct.pack("<h", int(v * 32767))
        w.writeframes(bytes(frames))


def gen_whoosh() -> list[float]:
    dur = 0.3
    n = int(SR * dur)
    out = []
    low = 0.0
    band = 0.0
    for i in range(n):
        t = i / SR
        f = 0.04 + 0.4 * (t / dur) ** 1.6  # cutoff sweeping up
        q = 0.9
        inp = (random.random() * 2 - 1) * 0.8
        low += f * band
        band += f * (inp - low - q * band)
        a = 0.02
        rel = 0.12
        if t < a:
            e = t / a
        elif t > dur - rel:
            e = max(0.0, (dur - t) / rel)
        else:
            e = 1.0
        bump = math.sin(math.pi * min(1.0, t / dur))
        out.append(band * e * bump * 0.55)
    return out


def gen_pop() -> list[float]:
    dur = 0.16
    n = int(SR * dur)
    out = []
    for i in range(n):
        t = i / SR
        f = 380 + 620 * min(1.0, t / 0.03)
        e = math.exp(-t / 0.045)
        s = math.sin(2 * math.pi * f * t) * e
        if t < 0.006:
            s += (1 - t / 0.006) * 0.5 * (random.random() * 2 - 1)
        out.append(s * 0.7)
    return out


def gen_ding() -> list[float]:
    dur = 0.55
    n = int(SR * dur)
    out = []
    for i in range(n):
        t = i / SR
        e = math.exp(-t / 0.14)
        s = math.sin(2 * math.pi * 1318.5 * t)
        s += 0.4 * math.sin(2 * math.pi * 2637.0 * t) * math.exp(-t / 0.05)
        if t < 0.004:
            s += (1 - t / 0.004) * 0.3
        out.append(s * e * 0.5)
    return out


def main() -> None:
    random.seed(7)
    write_wav("whoosh.wav", gen_whoosh())
    write_wav("pop.wav", gen_pop())
    write_wav("ding.wav", gen_ding())
    print("generated: whoosh.wav, pop.wav, ding.wav")


if __name__ == "__main__":
    main()
