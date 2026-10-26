# -*- coding: utf-8 -*-
lines = open(r"F:\小秋技术笔记\00_视频生产线\01_源码\remotion-production\src\RestartSketch.tsx", encoding="utf-8").read().split("\n")
depth = 0
in_str = None
for i, ln in enumerate(lines, 1):
    start = depth
    j = 0
    while j < len(ln):
        ch = ln[j]
        if in_str:
            if ch == in_str and (j == 0 or ln[j - 1] != "\\"):
                in_str = None
        else:
            if ch in "\"'`":
                in_str = ch
            elif ch == "/" and j + 1 < len(ln) and ln[j + 1] == "/":
                break
            elif ch == "{":
                depth += 1
            elif ch == "}":
                depth -= 1
                if depth < 0:
                    print(f"NEGATIVE at line {i} col {j+1}: | {ln[:70]}")
                    depth = 0
        j += 1
    if 440 <= i <= 520:
        print(f"{i:4d} depth {start}->{depth} | {ln[:56]}")
print("final depth:", depth)
