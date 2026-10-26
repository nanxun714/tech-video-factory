# -*- coding: utf-8 -*-
# 2026-09-14 HttpVsHttps 词级字幕对齐（照 skill gen_subs_words.py 模式）
# 读取 httpvshttps-tts/timeline.json 词级数据，按词文本累计定位每条字幕真实起点 → subs.json
import json, os, re

BASE = os.path.dirname(os.path.abspath(__file__))
TL = os.path.join(BASE, "httpvshttps-tts", "timeline.json")

SUBS = {
    1: ["网址开头有小锁和警告", "两种待遇", "HTTP和HTTPS", "差的那一个S", "到底贵在哪"],
    2: ["先说结论", "S就是Security", "多了一层加密信封", "HTTP是明信片", "HTTPS是密封信"],
    3: ["HTTP裸奔的时候", "你发出去的每一个字", "途经的路由器", "咖啡店WiFi", "都能原样读走"],
    4: ["HTTPS的思路是", "内容你们随便抄", "反正看不懂", "双方先对暗号", "协商出一把只有彼此知道的钥匙"],
    5: ["对暗号又靠证书", "网站出门先带身份证", "由权威机构盖章", "假网站盖不了这个章", "浏览器就会弹那个红色大警告"],
    6: ["最典型的翻车现场", "就是在公共WiFi上", "连着不带小锁的网站输密码"],
    7: ["现在全网HTTPS基本普及", "看到小锁", "说明你的密码正在密封信里走"],
    8: ["金句 HTTP是明信片", "HTTPS是密封信", "小锁代表路上没人能读"],
    9: ["更多网络基础对比都在主页合集", "点个关注", "下期接着拆"],
}

def norm(s):
    return re.sub(r"[\s，。？、！；：,.?!——…·《》「」（）()\-—_]", "", s)

def main():
    with open(TL, encoding="utf-8") as f:
        tl = json.load(f)
    fps = tl["fps"]
    subs = []
    for sent in tl["sentences"]:
        idx = sent["index"]
        phrases = SUBS[idx]
        base = sent["start_sec"]
        words = sent["words"]
        wnorm = [norm(w["t"]) for w in words]
        char_acc = []
        acc = 0
        for w, wn in zip(words, wnorm):
            char_acc.append((acc, w["off_sec"]))
            acc += len(wn)
        consumed = 0
        starts = []
        for ph in phrases:
            phn = norm(ph)
            start_sec = sent["dur_sec"] - 0.05
            for c, off in char_acc:
                if c >= consumed:
                    start_sec = off
                    break
            starts.append(start_sec)
            consumed += len(phn)
        # 校验：短语字符总量必须正好覆盖整句
        sent_norm = norm(sent["text"])
        if consumed != len(sent_norm):
            print(f"[WARN] s{idx:02d} phrase chars {consumed} != sentence chars {len(sent_norm)}: {sent_norm}")
        for i, ph in enumerate(phrases):
            s = base + starts[i]
            e = base + (starts[i + 1] if i + 1 < len(starts) else sent["dur_sec"] + 0.10)
            subs.append({"s": round(s * fps), "e": round(e * fps), "t": ph})
    for a, b in zip(subs, subs[1:]):
        if b["s"] < a["e"]:
            b["s"] = a["e"]
    out = os.path.join(BASE, "httpvshttps-tts", "subs.json")
    with open(out, "w", encoding="utf-8") as f:
        json.dump(subs, f, ensure_ascii=False, indent=1)
    total = 0
    for s in subs:
        print(s["s"], s["e"], s["e"] - s["s"], s["t"])
        total += 1
        if len(s["t"].replace(" ", "")) > 14:
            print(f"[WARN] too long: {s['t']}")
    print("total subs:", total)

if __name__ == "__main__":
    main()
