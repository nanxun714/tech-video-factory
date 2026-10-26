# -*- coding: utf-8 -*-
# inode 片 词级对齐字幕：短语起点挂词级朗读帧（gen_subs_words.py 同思路）
import json, os

HERE = os.path.dirname(os.path.abspath(__file__))
TL = json.load(open(os.path.join(HERE, "inode-tts", "timeline.json"), encoding="utf-8"))
FPS = TL["fps"]

# 每句拆短语（≤14字，无标点，逐字拼接=原话去标点）
PHRASES = {
    1: ["磁盘显示还剩一百个G", "新建文件却报错说", "磁盘已满", "这机器是不是坏了"],
    2: ["机器没坏", "是你的文件占满了", "另一本账", "这就是今天要排查的真凶"],
    3: ["硬盘存文件要记两本账", "一本记内容", "叫数据块", "一本记文件身份", "叫inode", "文件名大小权限全在里面"],
    4: ["关键在于inode的数量", "格式化时就定死了", "只有几百万个", "跟数据块各管各的"],
    5: ["于是出现这种场面", "几十万张几K的缓存小图", "数据块还剩一大堆", "inode却先被吃光了"],
    6: ["很多人卡在这一步", "df看磁盘怎么都查不出满", "换成df -i一看", "inode使用率百分百"],
    7: ["删掉那些空占坑的小文件", "inode一释放", "写入立刻恢复"],
    8: ["磁盘满查内容", "写不进查inode"],
    9: ["同类排查题我整理了一整个合集", "点个关注收藏着", "报错的时候用得上"],
}

def norm(s):
    # 去空格和连字符/破折号（TTS 词流里不含这些符号）
    return s.replace(" ", "").replace("-", "").replace("—", "")


starts_all = {s["index"]: s["start_frame"] for s in TL["sentences"]}

subs = []
for sent in TL["sentences"]:
    idx = sent["index"]
    words = sent["words"]
    # 词序列 -> 字符流（去空格），记录每个字符对应 (词起始帧, 词结束帧)
    charmap = []  # per char: (start_sec, end_sec)
    for w in words:
        t = norm(w["t"])
        for _ in t:
            charmap.append((w["off_sec"], w["off_sec"] + w["dur_sec"]))
    full = norm("".join(w["t"] for w in words))
    phrases = PHRASES[idx]
    # 校验短语拼接 == 字符流
    joined = norm("".join(phrases))
    if joined != full:
        print(f"[WARN] s{idx} 拼接不匹配:\n  full={full}\n  join={joined}")
    pos = 0
    n = len(charmap)
    base = sent["start_frame"]  # 词级 offset 是句内相对秒，要加上句子绝对起始帧
    sent_subs = []
    for pi, ph in enumerate(phrases):
        plen = len(norm(ph))
        if pos >= n:
            print(f"[WARN] s{idx} phrase {pi} 超出字符流")
            break
        st = charmap[pos][0]
        end_pos = min(n - 1, pos + plen - 1)
        en = charmap[end_pos][1]
        sent_subs.append({
            "s": base + round(st * FPS), "e": base + round(en * FPS) + 2, "t": ph, "sent": idx,
        })
        pos += plen
    # 句内平滑：下一条起点回压上一条终点
    for i in range(1, len(sent_subs)):
        if sent_subs[i]["s"] < sent_subs[i]["e"] and sent_subs[i]["s"] < sent_subs[i - 1]["e"]:
            sent_subs[i - 1]["e"] = sent_subs[i]["s"]
    # 每句最后一条延到下一句开始前 1 帧
    if sent_subs:
        nxt = starts_all.get(idx + 1)
        limit = (nxt - 1) if nxt else TL["total_frames"]
        if sent_subs[-1]["e"] > limit:
            sent_subs[-1]["e"] = limit
    subs.extend(sent_subs)

out = [{"s": x["s"], "e": x["e"], "t": x["t"]} for x in subs]
with open(os.path.join(HERE, "inode-subs.json"), "w", encoding="utf-8") as f:
    json.dump(out, f, ensure_ascii=False, indent=1)
for x in out:
    print(x["s"], x["e"], x["t"])
print("TOTAL_SUBS", len(out))
