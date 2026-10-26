"""Generate short interface SFX WAVs using only the Python standard library.

Outputs (16-bit mono PCM, 44100 Hz) into this same directory:
  error.wav     - descending harsh buzz (alarm-like)
  success.wav   - bright ascending two-step chime
  transfer.wav  - quick sine sweep whoosh
  click.wav     - very short UI tick
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


def env(t: float, dur: float, attack: float = 0.005, release: float = 0.08) -> float:
    if t < attack:
        return t / attack if attack > 0 else 1.0
    if t > dur - release:
        return max(0.0, (dur - t) / release) if release > 0 else 1.0
    return 1.0


def sine(freq: float, t: float) -> float:
    return math.sin(2 * math.pi * freq * t)


def gen_error() -> list[float]:
    dur = 0.45
    n = int(SR * dur)
    out = []
    for i in range(n):
        t = i / SR
        # descending fundamental 420 -> 150
        f = 420 - 270 * (t / dur)
        s = sine(f, t)
        # add buzzy harmonics for harshness
        s += 0.35 * sine(f * 2, t)
        s += 0.2 * sine(f * 3, t)
        # mild noise grit
        s += 0.15 * (random.random() * 2 - 1)
        s *= env(t, dur, 0.004, 0.12) * 0.5
        out.append(s)
    return out


def gen_success() -> list[float]:
    dur = 0.5
    n = int(SR * dur)
    out = []
    notes = [(0.0, 0.22, 523.25), (0.16, 0.34, 659.25)]  # C5 then E5-ish
    for i in range(n):
        t = i / SR
        s = 0.0
        for start, length, freq in notes:
            if start <= t < start + length:
                lt = t - start
                s += sine(freq, lt) * env(lt, length, 0.006, 0.07)
        s *= 0.45
        out.append(s)
    return out


def gen_transfer() -> list[float]:
    dur = 0.32
    n = int(SR * dur)
    out = []
    for i in range(n):
        t = i / SR
        # sweep 900 -> 250
        f = 900 - 650 * (t / dur)
        s = sine(f, t)
        # airy noise layer
        s += 0.25 * (random.random() * 2 - 1) * (1 - t / dur)
        s *= env(t, dur, 0.01, 0.12) * 0.4
        out.append(s)
    return out


def gen_click() -> list[float]:
    dur = 0.05
    n = int(SR * dur)
    out = []
    for i in range(n):
        t = i / SR
        s = sine(1100, t) * env(t, dur, 0.001, 0.045) * 0.55
        out.append(s)
    return out


def main() -> None:
    random.seed(42)
    write_wav("error.wav", gen_error())
    write_wav("success.wav", gen_success())
    write_wav("transfer.wav", gen_transfer())
    write_wav("click.wav", gen_click())
    print("generated: error.wav, success.wav, transfer.wav, click.wav")


if __name__ == "__main__":
    main()
