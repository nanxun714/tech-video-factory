# -*- coding: utf-8 -*-
# 【技能参考脚本】词级时间戳字幕对齐（2026-09-12 TCP vs UDP 扁平片验证）
# 用法：改 SUBS 字典（{"句序": ["字幕短语", ...]}）→ python gen_subs_words.py
# 读取 tcpudp-flat-tts/timeline.json 的词级数据，按词文本匹配定位每条字幕真实起点，
# 输出 subs.json（帧号数组，粘进组件 subs 常量）。需先跑 gen_tts_words.py。
# -*- coding: utf-8 -*-
# 用词级时间戳把字幕短语对齐到实际朗读位置，输出 flat 组件用的 subs 数组
import json, os, re

BASE = os.path.dirname(os.path.abspath(__file__))
TL = os.path.join(BASE, "tcpudp-flat-tts", "timeline.json")

# 每句的字幕短语（规范化比较时去掉空格/标点）
SUBS = {
    1: ["你看视频的时候", "数据到底是怎么传过来的"],
    2: ["背后离不开两个协议", "TCP 和 UDP", "一个更追求可靠", "一个更追求速度"],
    3: ["TCP 像打电话", "先问一句 听到了吗", "听到了 才继续说"],
    4: ["UDP 像拿大喇叭喊话", "喊完就走", "不管你听没听到"],
    5: ["TCP 发每个包 都编号签收", "发现第三个没到", "就问一句 3？", "然后重新发", "确认收到 才继续"],
    6: ["UDP 呢 五个包连续发", "中间丢了 也不等 不确认 不重传", "它不提供 TCP 那样的可靠机制", "但换来了低延迟"],
    7: ["网页 文件 登录 走 TCP", "直播 游戏 DNS 走 UDP"],
    8: ["TCP 更强调可靠性", "UDP 更强调低延迟和效率", "不是谁更好 而是看场景需要什么"],
    9: ["浏览器输入网址后 到底发生了什么", "关注全栈小秋 把计算机基础讲明白"],
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
        words = sent["words"]  # {off_sec(相对句首), dur_sec, t}
        # 词文本序列（规范化）
        wnorm = [norm(w["t"]) for w in words]
        starts = []  # 每个短语的句内起始 sec
        ptr = 0.0    # 已消费的字符位置（按词序累计）
        char_acc = []  # (累计字符数, 词start_sec)
        acc = 0
        for w, wn in zip(words, wnorm):
            char_acc.append((acc, w["off_sec"]))
            acc += len(wn)
        total_chars = acc
        sent_norm = norm(sent["text"])
        consumed = 0
        for ph in phrases:
            phn = norm(ph)
            # 在词序列里找到累计字符位置 == consumed 的词
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
    # 相邻句间隙兜底：确保单调
    for a, b in zip(subs, subs[1:]):
        if b["s"] < a["e"]:
            b["s"] = a["e"]
    out = os.path.join(BASE, "tcpudp-flat-tts", "subs.json")
    with open(out, "w", encoding="utf-8") as f:
        json.dump(subs, f, ensure_ascii=False, indent=1)
    for s in subs:
        print(s["s"], s["e"], s["t"])

asyncio_unused = None
if __name__ == "__main__":
    main()
