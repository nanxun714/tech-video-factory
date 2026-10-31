# -*- coding: utf-8 -*-
"""VLM 批量判帧（v2 架构：模型只做 OCR 报所见 + 报画面缺陷，元素比对由脚本确定性完成）。

背景（2026-10-30 校准实测）：Qwen3-VL-4B 视觉可靠（开放问答逐字报全），但让它自己
"对照预期判 pass/fail" 会自相矛盾（seen 里报了、issues 里说缺）。所以 v2 拆工种：
  模型 → seen（逐条列出可读文字）+ defects（空白/重叠/压字/字幕被侵四类画面缺陷）
  脚本 → task.json 里每帧的 must 关键词是否都出现在 seen 中（子串匹配，去标点归一化）

前置：llama-server 已启动：
  <bin>/llama-server.exe -m <model>.gguf --mmproj <mmproj>.gguf -ngl 99 -c 8192 --port 8900

用法：
  python qc_vlm_judge.py --frames-dir <qc_auto输出目录> --task task.json --out report.json
    task.json = {"f0000.png": {"must": ["误区一","迷信难度"], "note": "P1边界"}, ...}
  python qc_vlm_judge.py --frames-dir . --frame f0055.png --ask "问题"   # 开放问答（校准/排查）

输出：report.json（逐帧 seen/defects/missing/verdict）+ stdout 摘要。
verdict：pass = must 全命中且无 defects；fail = 有缺关键词或 defects；warn = 解析失败。
fail/warn 仍由主会话仲裁（人眼或 Read 实帧），本脚本漏报率>误报率：关键词要选大字号必现文本。
"""
import argparse, base64, json, os, re, sys, time
from concurrent.futures import ThreadPoolExecutor
import urllib.request

API = "http://127.0.0.1:{port}/v1/chat/completions"

RUBRIC = (
    "看这张 1920x1080 的视频帧截图，做两件事：\n"
    "一、把图里所有可读的文字逐条列在 seen 字段（分号分隔）：包括顶部标签、大标题、"
    "卡片里的文字、数字、角标、底部深色字幕条里的文字；圆形小徽章上的字母（如 VS）、"
    "底部横条/胶囊里的文字也要列出。只写亲眼读到的，不要猜。\n"
    "二、检查四类画面缺陷，写进 defects 数组（没有就空数组）："
    "①大面积空白/纯灰底/半透明淡入残留；②元素互相重叠、文字互相压住；"
    "③文字被容器边框切半；④底部字幕条被图形侵入。装饰元素（星星、圆点、圆形色块）不是缺陷。"
    "只输出一个 JSON 对象："
    '{"seen":"文字一；文字二；...","defects":["每条缺陷一句话，写清位置"]}'
)

_RE_NONWORD = re.compile(r"[^\w]+", re.UNICODE)


def norm(s):
    return _RE_NONWORD.sub("", s)


def ask(port, img_b64, question, timeout=180):
    body = json.dumps({
        "messages": [{"role": "user", "content": [
            {"type": "image_url", "image_url": {"url": f"data:image/png;base64,{img_b64}"}},
            {"type": "text", "text": question},
        ]}],
        "temperature": 0, "max_tokens": 600,
    }).encode("utf-8")
    req = urllib.request.Request(API.format(port=port), data=body,
                                 headers={"Content-Type": "application/json"})
    with urllib.request.urlopen(req, timeout=timeout) as r:
        data = json.loads(r.read().decode("utf-8"))
    return data["choices"][0]["message"]["content"]


def parse_out(text):
    text = re.sub(r"```(json)?", "", text).strip()
    m = re.search(r"\{.*\}", text, re.S)
    if not m:
        return None
    try:
        v = json.loads(m.group(0))
        return {
            "seen": str(v.get("seen", "")),
            "defects": [str(x) for x in v.get("defects", [])],
        }
    except Exception:
        return None


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--frames-dir", required=True)
    ap.add_argument("--task", help="task.json：帧名 -> {must:[关键词], note:说明}")
    ap.add_argument("--frame", help="单帧开放问答模式的帧文件名")
    ap.add_argument("--ask", help="开放问答模式的问题")
    ap.add_argument("--port", type=int, default=8900)
    ap.add_argument("--out", default="report.json")
    ap.add_argument("--retries", type=int, default=2)
    ap.add_argument("--workers", type=int, default=4,
                    help="并发请求数；须 ≤ llama-server 的 -np 槽位数")
    args = ap.parse_args()

    mode_task = args.task is not None
    if not mode_task and not (args.frame and args.ask):
        sys.exit("需要 --task 或 --frame+--ask")

    for _ in range(60):
        try:
            urllib.request.urlopen(f"http://127.0.0.1:{args.port}/health", timeout=3)
            break
        except Exception:
            time.sleep(2)
    else:
        sys.exit("FATAL: llama-server 120s 未就绪")

    if not mode_task:
        path = os.path.join(args.frames_dir, args.frame)
        with open(path, "rb") as f:
            b64 = base64.b64encode(f.read()).decode()
        print(ask(args.port, b64, args.ask))
        return

    with open(args.task, encoding="utf-8") as f:
        task = json.load(f)
    frames = sorted(task.keys())
    if not frames:
        sys.exit("FATAL: task.json 为空")

    def judge_one(name):
        path = os.path.join(args.frames_dir, name)
        if not os.path.exists(path):
            return {"verdict": "warn", "missing": [], "defects": ["帧文件缺失"], "seen": ""}
        with open(path, "rb") as f:
            b64 = base64.b64encode(f.read()).decode()
        out = None
        for attempt in range(args.retries + 1):
            try:
                out = parse_out(ask(args.port, b64, RUBRIC))
                if out is not None:
                    break
            except Exception:
                time.sleep(2)
        if out is None:
            return {"verdict": "warn", "missing": [], "defects": ["解析失败/请求失败"], "seen": ""}
        seen_n = norm(out["seen"])
        must = task[name].get("must", []) if isinstance(task[name], dict) else []
        missing = [k for k in must if norm(k) not in seen_n]
        defects = out["defects"]
        verdict = "fail" if (missing or defects) else "pass"
        return {"verdict": verdict, "missing": missing, "defects": defects, "seen": out["seen"][:200]}

    results, n_pass = {}, 0
    t0 = time.time()
    with ThreadPoolExecutor(max_workers=args.workers) as pool:
        for i, name in enumerate(frames):
            results[name] = pool.submit(judge_one, name)
        for i, name in enumerate(frames):
            results[name] = results[name].result()
            res = results[name]
            if res["verdict"] == "pass":
                n_pass += 1
            flag = res["verdict"].upper()
            detail = ("缺:" + ";".join(res["missing"]) if res.get("missing") else "") + \
                     ("|缺陷:" + ";".join(res["defects"])[:70] if res.get("defects") else "")
            print(f"[{i+1}/{len(frames)}] {name} {flag} {detail}", flush=True)

    fails = [k for k, v in results.items() if v["verdict"] == "fail"]
    warns = [k for k, v in results.items() if v["verdict"] == "warn"]
    summary = {
        "total": len(frames), "pass": n_pass, "fail": len(fails), "warn": len(warns),
        "fail_frames": fails, "warn_frames": warns,
        "elapsed_sec": round(time.time() - t0, 1),
    }
    with open(args.out, "w", encoding="utf-8") as f:
        json.dump({"summary": summary, "frames": results}, f, ensure_ascii=False, indent=1)
    print(json.dumps(summary, ensure_ascii=False))


if __name__ == "__main__":
    main()
