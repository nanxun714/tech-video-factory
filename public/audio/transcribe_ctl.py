# -*- coding: utf-8 -*-
"""对照实验：曼波音色合成普通测试句 -> funasr(带vad+punc)转写，判断吐字 vs ASR 问题。"""
import os, sys, wave
import numpy as np
import requests

API = "http://127.0.0.1:9880"
PROXIES = {"http": None, "https": None}
BASE = os.path.dirname(os.path.abspath(__file__))
TTS = os.path.join(BASE, "bishe-tts")
ASR_DIR = r"D:\MamboTTS\GPT-SoVITS\tools\asr\models"
M_ASR = os.path.join(ASR_DIR, "speech_paraformer-large_asr_nat-zh-cn-16k-common-vocab8404-pytorch")
M_VAD = os.path.join(ASR_DIR, "speech_fsmn_vad_zh-cn-16k-common-pytorch")
M_PUNC = os.path.join(ASR_DIR, "punc_ct-transformer_zh-cn-common-vocab272727-pytorch")

TEST_TEXT = "计算机专业的同学，毕设选题的第一步，是把题目选明白。"


def synth(text, path):
    r = requests.post(f"{API}/", json={
        "text": text, "text_language": "zh", "speed": 1.25,
        "cut_punc": "，。？！；：、…,.;?!",
        "refer_wav_path": r"D:\MamboTTS\models\refer.wav",
        "prompt_text": "大家好，欢迎来到我的频道，今天给大家分享一个有趣的内容",
        "prompt_language": "zh",
    }, timeout=(10, 120), proxies=PROXIES)
    assert r.status_code == 200, r.text[:200]
    with open(path, "wb") as f:
        f.write(r.content)


def to16k(src, dst):
    with wave.open(src, "rb") as w:
        sr, ch = w.getframerate(), w.getnchannels()
        x = np.frombuffer(w.readframes(w.getnframes()), dtype=np.int16)
    if ch > 1:
        x = x.reshape(-1, ch).mean(axis=1).astype(np.int16)
    n_out = int(len(x) * 16000 / sr)
    idx = np.clip((np.arange(n_out) * sr / 16000.0).astype(int), 0, len(x) - 1)
    with wave.open(dst, "wb") as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(16000)
        w.writeframes(x[idx].astype(np.int16).tobytes())


def main():
    ctl_raw = os.path.join(TTS, "_ctl_raw.wav")
    if not os.path.exists(ctl_raw):
        synth(TEST_TEXT, ctl_raw)
    ctl16 = os.path.join(TTS, "_ctl16.wav")
    to16k(ctl_raw, ctl16)
    # 同样转写正式句 s05_raw（最长最关键的一句）
    s05_16 = os.path.join(TTS, "_s05_16.wav")
    to16k(os.path.join(TTS, "s05_raw.wav"), s05_16)
    from funasr import AutoModel
    model = AutoModel(model=M_ASR, vad_model=M_VAD, punc_model=M_PUNC,
                      disable_update=True, disable_pbar=True)
    for name, path in [("_ctl(测试句)", ctl16), ("_s05(正式句5)", s05_16)]:
        res = model.generate(input=path, batch_size_s=120)
        print(f"{name}: {res[0]['text'] if res else '(空)'}", flush=True)


if __name__ == "__main__":
    main()
