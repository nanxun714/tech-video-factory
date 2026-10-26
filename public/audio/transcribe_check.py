# -*- coding: utf-8 -*-
"""用引擎自带 funasr paraformer 转写 TTS 产物，核对读音（AI 等英文词）。16k 重采样后识别。"""
import os, sys, wave
import numpy as np

BASE = os.path.dirname(os.path.abspath(__file__))
TTS = os.path.join(BASE, "bishe-tts")
MODEL_DIR = r"D:\MamboTTS\GPT-SoVITS\tools\asr\models\speech_paraformer-large_asr_nat-zh-cn-16k-common-vocab8404-pytorch"


def to16k(src, dst):
    with wave.open(src, "rb") as w:
        sr, ch, sw = w.getframerate(), w.getnchannels(), w.getsampwidth()
        raw = w.readframes(w.getnframes())
    assert sw == 2
    x = np.frombuffer(raw, dtype=np.int16)
    if ch > 1:
        x = x.reshape(-1, ch).mean(axis=1).astype(np.int16)
    n_out = int(len(x) * 16000 / sr)
    idx = np.clip((np.arange(n_out) * sr / 16000.0).astype(int), 0, len(x) - 1)
    with wave.open(dst, "wb") as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(16000)
        w.writeframes(x[idx].astype(np.int16).tobytes())


def main():
    from funasr import AutoModel
    model = AutoModel(model=MODEL_DIR, disable_update=True, disable_pbar=True)
    for name in sys.argv[1:]:
        src = os.path.join(TTS, name)
        dst = os.path.join(TTS, "_16k.wav")
        to16k(src, dst)
        res = model.generate(input=dst, batch_size_s=60)
        text = res[0]["text"] if res else "(空)"
        print(f"{name}: {text}", flush=True)


if __name__ == "__main__":
    main()
