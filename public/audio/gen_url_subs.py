# -*- coding: utf-8 -*-
# 《浏览器输入网址后发生了什么》词级字幕对齐：读 url-tts/timeline.json，输出 subs.json
import json, os, re

BASE = os.path.dirname(os.path.abspath(__file__))
TL = os.path.join(BASE, "url-tts", "timeline.json")

# 每句的字幕短语（规范化比较时去掉空格/标点）
SUBS = {
    1: ["在地址栏敲下网址 按下回车", "到页面出现 只要一秒", "这一秒里 你的请求", "出门跑了一圈"],
    2: ["第一步 DNS解析", "浏览器拿着网址问DNS服务器", "这个名字住在哪", "它就像互联网的通讯录", "把域名翻译成IP地址"],
    3: ["第二步 建立TCP连接", "浏览器和服务器先打电话确认", "听得到吗 听到了", "这套握手 上一期刚讲过"],
    4: ["第三步 发送HTTP请求", "浏览器说 我要这个页面", "服务器找到文件", "把HTML原路发了回来"],
    5: ["最后一步 浏览器渲染", "HTML搭骨架", "CSS上皮肤", "JavaScript管动作", "页面这才出现在你眼前"],
    6: ["整个流程就是", "DNS查地址 TCP建连接", "HTTP拿页面 浏览器做渲染"],
    7: ["下次按下回车 你就知道", "这一秒的背后", "是一场毫秒级的接力赛"],
    8: ["关注全栈小秋 把计算机基础讲明白", "还想听什么 评论区告诉我"],
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
        for i, ph in enumerate(phrases):
            s = base + starts[i]
            e = base + (starts[i + 1] if i + 1 < len(starts) else sent["dur_sec"] + 0.10)
            subs.append({"s": round(s * fps), "e": round(e * fps), "t": ph})
    for a, b in zip(subs, subs[1:]):
        if b["s"] < a["e"]:
            b["s"] = a["e"]
    out = os.path.join(BASE, "url-tts", "subs.json")
    with open(out, "w", encoding="utf-8") as f:
        json.dump(subs, f, ensure_ascii=False, indent=1)
    for s in subs:
        print(s["s"], s["e"], s["t"])

if __name__ == "__main__":
    main()
