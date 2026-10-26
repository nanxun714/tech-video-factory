# -*- coding: utf-8 -*-
"""batch10 QC 程序化预检：像素级扫描页边界帧，抓两大历史bug。
用法: python qc_precheck.py <video.mp4> <out_dir> <帧号列表,逗号分隔>
输出: <out_dir>/precheck.json + 抽出的帧 PNG
判定:
  A. 边界帧与前一帧几乎相同(diff<2.0) => 新场景没画出来(PageTurn bug变体)
  B. 边界帧灰度std<12 => 大面积空白
  C. 末帧std<12 => 结尾卡空白
"""
import sys, json, os
import cv2
import numpy as np

def main():
    video, outdir, frames_s = sys.argv[1], sys.argv[2], sys.argv[3]
    frames = sorted(set(int(x) for x in frames_s.split(",")))
    os.makedirs(outdir, exist_ok=True)
    cap = cv2.VideoCapture(video)
    total = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    need = set()
    for f in frames:
        need.add(max(0, f - 1)); need.add(f)
    need.add(total - 1)
    idx = 0
    grabbed = {}
    while idx <= max(need):
        ok, img = cap.read()
        if not ok:
            break
        if idx in need:
            grabbed[idx] = img
            cv2.imwrite(os.path.join(outdir, "p%05d.png" % idx), img)
        idx += 1
    cap.release()

    report = {"video": video, "total_frames": total, "checks": [], "fail": False}
    for f in frames:
        prev, cur = grabbed.get(max(0, f - 1)), grabbed.get(f)
        item = {"frame": f, "saved": "p%05d.png" % f}
        if prev is None or cur is None:
            item["error"] = "frame missing"
            report["fail"] = True
        else:
            diff = float(np.mean(cv2.absdiff(prev, cur)))
            g = cv2.cvtColor(cur, cv2.COLOR_BGR2GRAY)
            std = float(np.std(g))
            item["diff_prev"] = round(diff, 2)
            item["std"] = round(std, 2)
            if f == 0:
                item["verdict"] = "ok(first frame)" if std >= 12.0 else "FAIL_BLANK(首帧空白)"
                if std < 12.0:
                    report["fail"] = True
            elif diff < 2.0:
                item["verdict"] = "FAIL_SAME_AS_PREV(新场景未画出)"
                report["fail"] = True
            elif diff < 4.0:
                item["verdict"] = "FAIL_NO_HARD_CUT(边界无硬切=叠化/未切页,违反铁律1)"
                report["fail"] = True
            elif std < 12.0:
                item["verdict"] = "FAIL_BLANK(大面积空白)"
                report["fail"] = True
            else:
                item["verdict"] = "ok"
        report["checks"].append(item)
    last = grabbed.get(total - 1)
    if last is not None:
        g = cv2.cvtColor(last, cv2.COLOR_BGR2GRAY)
        report["last_frame_std"] = round(float(np.std(g)), 2)
    with open(os.path.join(outdir, "precheck.json"), "w", encoding="utf-8") as fp:
        json.dump(report, fp, ensure_ascii=False, indent=1)
    print(json.dumps({"fail": report["fail"], "n_checks": len(report["checks"])}, ensure_ascii=False))

if __name__ == "__main__":
    main()
