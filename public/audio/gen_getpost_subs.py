# -*- coding: utf-8 -*-
# GetVsPost 词级字幕对齐（照 skill scripts/gen_subs_words.py 逻辑，指向 getpost-tts）
import json, os, re

BASE = os.path.dirname(os.path.abspath(__file__))
TL = os.path.join(BASE, "getpost-tts", "timeline.json")

SUBS = {
    1: ["面试官问", "GET和POST的区别", "你答一个查数据", "一个传数据", "他为什么直接摇头"],
    2: ["因为这句只说对了表面", "真正的区别藏在四个地方", "最后一个最值钱"],
    3: ["第一 参数位置", "GET把参数拼在网址后面", "会被收藏 转发 记进日志", "POST把参数放进请求体", "地址栏干干净净"],
    4: ["第二 长度", "网址栏对URL长度有限制", "GET传不了大文件", "POST没这个约束"],
    5: ["第三 也是最值钱的", "GET是幂等的", "同一请求发一百次", "服务器状态都不变", "浏览器才敢放心刷新和预取", "POST可能下单扣款", "所以刷新前要弹窗确认"],
    6: ["踩过坑的人都懂这条的分量", "有人把删除接口写成GET", "被爬虫一扫", "数据直接没了"],
    7: ["第四 安全性其实一样", "都走明文", "想加密上HTTPS", "跟GET POST本身没关系"],
    8: ["金句", "GET是拿", "POST是办", "能不能重复发", "看幂等"],
    9: ["面试速查卡停在结尾了", "更多高频八股对比在主页合集", "点个关注不迷路"],
}


def norm(s):
    return re.sub(r"[\s，。？、！；：,.?!]", "", s)


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
        starts = []
        consumed = 0
        for ph in phrases:
            phn = norm(ph)
            start_sec = sent["dur_sec"] - 0.05
            for c, off in char_acc:
                if c >= consumed:
                    start_sec = off
                    break
            starts.append(start_sec)
            consumed += len(phn)
        assert consumed == len(norm(sent["text"])), f"s{idx} phrase chars {consumed} != sentence {len(norm(sent['text']))}"
        for i, ph in enumerate(phrases):
            s = base + starts[i]
            e = base + (starts[i + 1] if i + 1 < len(starts) else sent["dur_sec"] + 0.10)
            subs.append({"s": round(s * fps), "e": round(e * fps), "t": ph})
    for a, b in zip(subs, subs[1:]):
        if b["s"] < a["e"]:
            b["s"] = a["e"]
    out = os.path.join(BASE, "getpost-tts", "subs.json")
    with open(out, "w", encoding="utf-8") as f:
        json.dump(subs, f, ensure_ascii=False, indent=1)
    for s in subs:
        print("{s:%d, e:%d, t: \"%s\"}," % (s["s"], s["e"], s["t"]))


if __name__ == "__main__":
    main()
