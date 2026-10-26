# -*- coding: utf-8 -*-
# 从 stackheap-tts/timeline.json 生成 src/stackheapData.ts（SENT / SUBS / 词级锚点）
import json, os, re

AUD = os.path.join(os.path.dirname(os.path.abspath(__file__)))
TL = json.load(open(os.path.join(AUD, "stackheap-tts", "timeline.json"), encoding="utf-8"))
OUT = os.path.join(AUD, "..", "..", "src", "stackheapData.ts")
FPS = 30

# 每句的字幕短语（逐字来自旁白，去标点，≤14字）
SUBS = {
    1: ["同样是内存", "为什么有的地方", "用完自动收拾干净", "有的地方却越积越多", "最后把程序活活卡死"],
    2: ["因为程序里的内存分两种", "一种叫栈", "一种叫堆", "它们的脾气完全不一样"],
    3: ["栈像一个自动餐盘架", "函数一调用就压进去", "一返回就自动弹走", "全程系统自动管理", "不用你操一点心"],
    4: ["但栈有个死穴", "空间很小", "递归忘了写结束条件", "函数一层压一层", "很快塞爆", "程序当场崩溃", "这就叫栈溢出"],
    5: ["堆就自由多了", "想要多少就申请多少", "C语言用malloc", "Java用new", "创建出来的对象都住在这里"],
    6: ["但自由的代价是自己管自己", "申请了忘了还", "这块内存就永远被占着", "越积越多", "这就是内存泄漏", "上次说的程序越跑越卡", "元凶就是它"],
    7: ["一张图记住", "栈 自动管理", "空间小速度快", "塞爆了叫栈溢出", "堆 手动管理", "空间大更灵活", "漏掉了叫内存泄漏"],
    8: ["所以下次程序崩溃", "先想想是栈炸了", "还是堆漏了", "关注全栈小秋", "下期讲CPU占用爆表", "怎么揪出真凶"],
}

# 词级锚点：名字 -> (句号, 短语, 第几次出现从1计)
ANCHORS = {
    "hook_dead":   (1, "卡死", 1),
    "call_stack":  (2, "叫栈", 1),
    "call_heap":   (2, "叫堆", 1),
    "s3_plate":    (3, "餐盘架", 1),
    "s3_push":     (3, "压进去", 1),
    "s3_pop":      (3, "弹走", 1),
    "s3_auto":     (3, "自动管理", 1),
    "s4_small":    (4, "空间很小", 1),
    "s4_recur":    (4, "递归", 1),
    "s4_layer":    (4, "一层压一层", 1),
    "s4_burst":    (4, "塞爆", 1),
    "s4_crash":    (4, "崩溃", 1),
    "s4_over":     (4, "栈溢出", 1),
    "s5_free":     (5, "自由", 1),
    "s5_apply":    (5, "申请多少", 1),
    "s5_malloc":   (5, "malloc", 1),
    "s5_new":      (5, "new", 1),
    "s5_obj":      (5, "对象", 1),
    "s6_forget":   (6, "忘了还", 1),
    "s6_occupy":   (6, "占着", 1),
    "s6_accum":    (6, "越积越多", 1),
    "s6_leak":     (6, "内存泄漏", 1),
    "s6_culprit":  (6, "元凶", 1),
    "s7_chart":    (7, "一张图", 1),
    "s7_auto":     (7, "自动管理", 1),
    "s7_small":    (7, "空间小", 1),
    "s7_burst":    (7, "塞爆", 1),
    "s7_over":     (7, "栈溢出", 1),
    "s7_manual":   (7, "手动管理", 1),
    "s7_big":      (7, "空间大", 1),
    "s7_leak":     (7, "内存泄漏", 1),
    "s8_crash":    (8, "崩溃", 1),
    "s8_boom":     (8, "栈炸了", 1),
    "s8_leakw":    (8, "堆漏了", 1),
    "s8_follow":   (8, "关注", 1),
    "s8_next":     (8, "下期", 1),
}

def find_frame(sent, phrase, occ):
    # 拼接句内词文本，按字符定位短语第 occ 次出现，映射到所属词的起始帧
    words = sent["words"]
    concat = "".join(w["t"] for w in words)
    concat_np = re.sub(r"[，。？！、\s]", "", concat)
    target = re.sub(r"[，。？！、\s]", "", phrase)
    pos = -1
    for _ in range(occ):
        pos = concat_np.find(target, pos + 1)
        if pos < 0:
            raise RuntimeError(f"phrase not found: {phrase} in s{sent['index']}")
    # pos 是去标点文本中的字符下标；重建"去标点字符 -> 词"映射
    idx = 0
    for w in words:
        wtext = re.sub(r"[，。？！、\s]", "", w["t"])
        if idx <= pos < idx + len(wtext):
            return sent["start_frame"] + round(w["off_sec"] * FPS)
        idx += len(wtext)
    raise RuntimeError(f"char map failed: {phrase}")

sent_by_idx = {s["index"]: s for s in TL["sentences"]}
SENT = [s["start_frame"] for s in TL["sentences"]]
DUR = TL["total_frames"] + 50

subs_out = []
for idx, phrases in SUBS.items():
    s = sent_by_idx[idx]
    bounds = []
    for p in phrases:
        bounds.append(find_frame(s, p, 1))
    for i, p in enumerate(phrases):
        st = bounds[i]
        en = bounds[i + 1] if i + 1 < len(phrases) else s["end_frame"]
        subs_out.append({"s": st, "e": en, "t": re.sub(r"[，。？！、]", "", p).replace(" ", "")})

anchors_out = {k: find_frame(sent_by_idx[v[0]], v[1], v[2]) for k, v in ANCHORS.items()}

lines = []
lines.append("// 自动生成：public/audio/gen_stackheap_subs.py <- stackheap-tts/timeline.json")
lines.append("export const SENT = " + json.dumps(SENT).replace("[", "[").replace("]", "]") + ";")
lines.append(f"export const DUR_EXT = {DUR};")
lines.append("export const SUBS: {s: number; e: number; t: string}[] = " + json.dumps(subs_out, ensure_ascii=False) + ";")
lines.append("export const A: Record<string, number> = " + json.dumps(anchors_out, ensure_ascii=False) + ";")
with open(OUT, "w", encoding="utf-8") as f:
    f.write("\n".join(lines) + "\n")
print("SENT", SENT)
print("DUR", DUR)
print("subs:", len(subs_out), "anchors:", len(anchors_out))
for k, v in anchors_out.items():
    print(" ", k, v)
