# -*- coding: utf-8 -*-
p = "retiming_linux.py"
s = open(p, encoding="utf-8").read()
old = 'open(r"C:\\Users\\27119\\AppData\\Local\\Temp\\linux-subs-new.tsx", encoding="utf-8")'
if old in s:
    s = s.replace(old, 'open("linux-subs-new.tsx", encoding="utf-8")')
    open(p, "w", encoding="utf-8").write(s)
    print("path fixed")
else:
    # 宽松匹配：任何包含 AppData\\Local\\Temp\\linux-subs-new 的行整体替换路径部分
    import re
    s2, cnt = re.subn(r'open\(r?"[^"]*linux-subs-new\.tsx"', 'open("linux-subs-new.tsx"', s)
    assert cnt == 1, "still not found"
    open(p, "w", encoding="utf-8").write(s2)
    print("path fixed (regex)")
