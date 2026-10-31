# -*- coding: utf-8 -*-
"""曼波配音 ASR 质检 + 自动重合成：
逐句 plain paraformer 转写 -> 检测复读(GPT-SoVITS 偶发) -> 重合成(≤4次) ->
仍复读写则拆半句分别合成拼接 -> 输出质检报告。修完 raw 再由 gen_bishe_kaiti.py 重建 timeline。
"""
import os, re, sys, wave
import numpy as np
import requests

API = "http://127.0.0.1:9880"
PROXIES = {"http": None, "https": None}
BASE = os.path.dirname(os.path.abspath(__file__))
TTS = os.path.join(BASE, "kaiti-tts")
M_ASR = r"D:\MamboTTS\GPT-SoVITS\tools\asr\models\speech_paraformer-large_asr_nat-zh-cn-16k-common-vocab8404-pytorch"

sys.path.insert(0, BASE)
from gen_bishe_kaiti import SENTENCES  # 句表单一来源

SPEED = float(sys.argv[1]) if len(sys.argv) > 1 else 1.5


def synth(text, path):
    r = requests.post(f"{API}/", json={
        "text": text, "text_language": "zh", "speed": SPEED,
        "cut_punc": "，。？！；：、…,.;?!",
        "refer_wav_path": r"D:\MamboTTS\models\refer.wav",
        "prompt_text": "大家好，欢迎来到我的频道，今天给大家分享一个有趣的内容",
        "prompt_language": "zh",
    }, timeout=(10, 180), proxies=PROXIES)
    assert r.status_code == 200, r.text[:200]
    with open(path, "wb") as f:
        f.write(r.content)


def read_wav(path):
    with wave.open(path, "rb") as w:
        sr, ch = w.getframerate(), w.getnchannels()
        x = np.frombuffer(w.readframes(w.getnframes()), dtype=np.int16)
    if ch > 1:
        x = x.reshape(-1, ch).mean(axis=1).astype(np.int16)
    return sr, x


def write_wav(path, sr, x):
    with wave.open(path, "wb") as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(sr)
        w.writeframes(x.astype(np.int16).tobytes())


def to16k(src, dst):
    sr, x = read_wav(src)
    n_out = int(len(x) * 16000 / sr)
    idx = np.clip((np.arange(n_out) * sr / 16000.0).astype(int), 0, len(x) - 1)
    write_wav(dst, 16000, x[idx])


def find_repeat(t):
    """返回第一个重复的≥6字子串（出现≥2次），无则 None"""
    for L in range(min(12, len(t) // 2), 5, -1):
        seen = {}
        for i in range(len(t) - L + 1):
            g = t[i:i + L]
            if g in seen:
                return g
            seen[g] = i
    return None


def main():
    os.makedirs(TTS, exist_ok=True)
    # 引擎加载需 1~2 分钟，先等 /control 就绪再动手（gen 脚本同款）
    t0 = __import__("time").time()
    while True:
        try:
            requests.get(f"{API}/control", timeout=2, proxies=PROXIES).json()
            break
        except Exception:
            if __import__("time").time() - t0 > 300:
                print("FATAL: 引擎 300s 未就绪", flush=True)
                sys.exit(2)
            __import__("time").sleep(3)
    from funasr import AutoModel
    model = AutoModel(model=M_ASR, disable_update=True, disable_pbar=True)
    tmp16 = os.path.join(TTS, "_qc16.wav")

    def asr(path):
        to16k(path, tmp16)
        res = model.generate(input=tmp16, batch_size_s=120)
        return re.sub(r"[^\u4e00-\u9fffA-Za-z0-9]", "", res[0]["text"]) if res else ""

    report = []
    for i, text in enumerate(SENTENCES):
        raw = os.path.join(TTS, f"s{i+1:02d}_raw.wav")
        status, note = "", ""
        for attempt in range(5):
            if not os.path.exists(raw):
                synth(text, raw)
            txt = asr(raw)
            dup = find_repeat(txt)
            if not dup:
                status = "ok"
                note = f"try{attempt+1}"
                break
            print(f"s{i+1:02d} 复读[{dup}] 第{attempt+1}次合成，重试 ...", flush=True)
            os.remove(raw)
            status = "repeat"
        if status != "ok":
            # 拆半句：按标点找最接近中点的切点，分别合成后拼接
            clean = [j for j, c in enumerate(text) if c in "，。？！；：、"]
            if clean:
                mid = min(clean, key=lambda j: abs(j - len(text) / 2))
                a, b = text[:mid + 1], text[mid + 1:]
            else:
                k = len(text) // 2
                a, b = text[:k], text[k:]
            pa, pb = os.path.join(TTS, "_pa.wav"), os.path.join(TTS, "_pb.wav")
            synth(a, pa); synth(b, pb)
            sra, xa = read_wav(pa); _, xb = read_wav(pb)
            gap = np.zeros(int(sra * 0.12), dtype=np.int16)
            write_wav(raw, sra, np.concatenate([xa, gap, xb]))
            txt = asr(raw)
            dup = find_repeat(txt)
            status = "split-ok" if not dup else "split-repeat"
            note = f"split[{a[-6:]}|{b[:6]}]"
        sr, x = read_wav(raw)
        report.append((i + 1, status, note, len(x) / sr, txt[:44]))
        print(f"s{i+1:02d} [{status}] {len(x)/sr:5.2f}s  {txt[:44]}", flush=True)

    print("\n===== 汇总 =====", flush=True)
    bad = [r for r in report if "repeat" in r[1]]
    for r in report:
        print(f"s{r[0]:02d} {r[1]:12s} {r[3]:5.2f}s {r[2]}")
    print("BAD:", [f"s{r[0]:02d}" for r in bad] if bad else "无", flush=True)


if __name__ == "__main__":
    main()
