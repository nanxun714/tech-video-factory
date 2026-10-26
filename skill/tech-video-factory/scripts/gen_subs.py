# -*- coding: utf-8 -*-
"""逐字无标点字幕生成器。
用法: python gen_subs.py <timeline.json> <phrases.json> [out.tsx]

phrases.json 格式（每句旁白按标点/停顿拆成 ≤14 字短句，禁止改写原话）:
{
  "1": ["你写的代码", "是怎么变成电脑上跑起来的程序的"],
  "2": ["无论是 Python Java 还是 C++", "本质上都是一份文本文件"]
}

输出: 可直接粘进 Remotion 组件的 subs 数组（TSX 片段）。
规则: 逐字匹配旁白；剥离全部中英文标点；每条时间按字数比例从整句窗口切分。
"""
import json, os, sys, re

STRIP = "，。；：？！、（）【】《》「」『』“”‘’…—·,.;:?!()[]"


def clean(t):
    t = t.replace("、", " ")  # 顿号变空格保持可读
    for ch in STRIP:
        t = t.replace(ch, "")
    return re.sub(r"\s+", " ", t).strip()


def main(tl_path, ph_path, out_path=None):
    tl = json.load(open(tl_path, encoding="utf-8"))
    ph = json.load(open(ph_path, encoding="utf-8"))
    lines = []
    for sent in tl["sentences"]:
        idx = str(sent["index"])
        if idx not in ph:
            raise SystemExit(f"phrases.json 缺少第 {idx} 句的断句")
        phrases = [clean(p) for p in ph[idx]]
        phrases = [p for p in phrases if p]
        total = sum(len(p.replace(" ", "")) for p in phrases)
        a, b = sent["start_frame"], sent["end_frame"]
        cur = a
        for text in phrases:
            dur = int(round((b - a) * len(text.replace(" ", "")) / total))
            e = min(cur + dur, b)
            esc = text.replace('"', '\\"')
            lines.append('  {s: %d, e: %d, t: "%s"},' % (cur, e, esc))
            cur = e
    block = "const subs: Sub[] = [\n" + "\n".join(lines) + "\n];"
    if out_path:
        open(out_path, "w", encoding="utf-8").write(block + "\n")
        print("written to", out_path)
    else:
        print(block)


if __name__ == "__main__":
    main(sys.argv[1], sys.argv[2], sys.argv[3] if len(sys.argv) > 3 else None)
