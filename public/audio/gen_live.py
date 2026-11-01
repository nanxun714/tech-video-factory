# -*- coding: utf-8 -*-
"""智能健身管理系统 · 实拍操作版配音与时间轴。
用法: <GPT-SoVITS runtime>/python.exe gen_live.py
输入: C:/Temp/fit_live/clips30.json（真实录屏裁切后的片段表）
输出: public/audio/fitness-live/narration.wav、timeline.json、src/fitnessLiveData.ts
铁律: 口播不带标点、单句 ≤35 字；句子时长按波形实测；人工智能统一说“模拟”。
"""
import hashlib, json, os, sys, wave
import numpy as np
import requests

API = "http://127.0.0.1:9880"
PROXIES = {"http": None, "https": None}
CUT_PUNC = "，。？！；：、…,.;?!"
REF = r"D:\MamboTTS\models\refer.wav"
REF_TEXT = "大家好，欢迎来到我的频道，今天给大家分享一个有趣的内容"
FPS = 30
SPEED = 1.5
GAP = 0.06
LEAD = 0.32
TAIL = 0.18

AUDIO_DIR = os.path.dirname(os.path.abspath(__file__))
TTS_DIR = os.path.join(AUDIO_DIR, "fitness-live")
PUBLIC_DIR = os.path.abspath(os.path.join(AUDIO_DIR, ".."))
SRC_DIR = os.path.abspath(os.path.join(PUBLIC_DIR, "..", "src"))
CLIPS_JSON = r"C:\Temp\fit_live\clips30.json"
END_FRAMES = 138

MOCK_SCENES = {"u10_ai_chat", "u11_ai_plan", "u13_ai_report"}

NARR = {
    "u01_login": [
        "这是一套智能健身管理系统",
        "演示用的都是本机的测试账号",
        "先输入用户名和密码",
        "角色下拉里选普通用户",
        "点登录 进入用户端首页",
        "下面再按教练和管理员各走一遍",
    ],
    "u02_dashboard": [
        "首页最上面是体重 身体质量指数 本周训练和热量摄入",
        "往下是体重 训练次数和热量的曲线",
    ],
    "u03_plans": [
        "顶部导航点开健身计划",
        "教练安排的计划和自己建的计划都在一张表里",
        "每条计划后面是完成率",
    ],
    "u04_plan_detail": [
        "点计划名称进入详情",
        "每天练什么按训练日排开",
        "每个动作都有组数 次数 重量和组间休息",
    ],
    "u05_records": [
        "训练记录按日期排开",
        "每次的时长 消耗热量和完成率都在表里",
        "点开一条进入详情",
        "每个动作做没做够都有记录",
    ],
    "u06_exercises": [
        "今日训练页可以直接进动作库",
        "动作按胸 背 腿这些部位分类",
        "每张卡片标着部位和难度",
        "点开有动作说明和注意事项",
    ],
    "u07_diet": [
        "饮食页按早餐 午餐 晚餐和加餐分开记",
        "每餐都有热量和三大营养素",
        "右边直接和每日目标对比",
    ],
    "u08_foods": [
        "食物库支持按名称搜索",
        "输入鸡胸 点搜索",
        "结果里每一项都带热量和蛋白质",
        "常见食物的营养数据都存在库里",
    ],
    "u09_body": [
        "身体数据页把体重和训练量画成趋势图",
        "六张图覆盖体重 训练 热量和营养",
        "右上角可以切近三十天 六十天和九十天",
    ],
    "u10_ai_chat": [
        "人工智能助手可以直接提问",
        "这里问减脂期晚上饿了晚餐怎么安排",
        "回答开头会带上你的身体情况",
        "再给出一组减脂建议",
        "当前是模拟模式 不调用外部模型",
    ],
    "u11_ai_plan": [
        "人工智能也能按目标生成训练计划",
        "点生成 一份四周的计划就排好了",
        "每个动作的组数和次数都列在表里",
        "结果同样来自模拟引擎",
    ],
    "u13_ai_report": [
        "健身报告可以一键生成",
        "最近三十天的训练 体重和饮食汇总在一页",
        "这部分结果同样来自模拟引擎",
    ],
    "u14_courses": [
        "课程页按目标分类列出课程",
        "点开一门课进入详情",
        "授课教练 分类和节数都写在上面",
        "下面是课程介绍和课程安排",
        "右边是价格和报名入口",
    ],
    "u15_knowledge": [
        "健身知识里是科普文章",
        "列表上能看到作者 日期和浏览数",
        "顶部可以按分类切换",
        "我的收藏单独一个标签",
        "点开一篇进入详情",
        "正文按小标题分段",
        "文章既可以是图文 也可以带视频",
        "读完可以直接收藏",
    ],
    "c01_login": [
        "改用教练身份登录",
        "同一个登录页 角色选教练",
        "进来是教练工作台",
        "上面是会员数 今日训练和平均完成率",
        "待启动计划和近七天训练也一起统计",
        "下面能看到会员最新训练动态和最近加入的会员",
    ],
    "c02_members": [
        "会员列表里是教练带的会员",
        "列表可以按性别和健身目标筛选",
        "每个会员的健身目标 身体质量指数和完成率都在表里",
        "点开一个会员",
        "档案 训练记录和饮食都能翻到",
    ],
    "c03_analysis": [
        "训练效果分析按会员看训练情况",
        "上面是训练次数 累计时长和体重变化",
        "下面是完成率 频率 时长和热量的趋势",
        "切到另一个时间范围",
        "图表会按新区间重新计算",
    ],
    "c04_advice": [
        "饮食建议页先选会员",
        "再写建议内容",
        "点推送给会员",
        "会员的首页会收到提醒",
        "右边是已发送的建议",
    ],
    "a01_login": [
        "最后换成管理员账号",
        "角色选管理员",
        "登录后进入管理后台",
        "左边是用户 教练 课程这些管理入口",
        "首页给出全站的数据概览",
        "三个角色共用一套账号体系",
        "账号的角色决定了能进哪个后台",
    ],
    "a02_users": [
        "用户管理列出所有注册账号",
        "支持按用户名 昵称和手机号搜索",
        "输入一个姓 相关账号就筛出来了",
        "表里能看到角色 状态和注册时间",
    ],
    "a03_coaches": [
        "教练管理维护入驻的教练",
        "列表里有电话 擅长方向和从业年限",
        "状态一栏可以改成启用或停用",
        "新增教练时可以设置初始密码",
        "账号资料和教练资料一起维护",
    ],
    "a04_ai_logs": [
        "人工智能使用记录按调用一条条列出",
        "功能 引擎 响应时间和状态都能看到",
        "引擎一栏现在是模拟引擎",
    ],
    "a05_config": [
        "系统配置里能看到人工智能的开关",
        "现在服务是关闭状态",
        "提供方写的是模拟数据",
        "前面的人工智能结果都是预置的",
    ],
}

END_SENTS = [
    "以上是三个角色的主要操作演示",
    "人工智能部分当前为模拟模式",
]


def wait_engine(timeout=300):
    import time
    t0 = time.time()
    while time.time() - t0 < timeout:
        try:
            r = requests.get(f"{API}/control", timeout=2, proxies=PROXIES)
            r.json()
            return True
        except Exception:
            time.sleep(3)
    return False


def synth(text, path, speed):
    r = requests.post(f"{API}/", json={
        "text": text, "text_language": "zh", "speed": speed, "cut_punc": CUT_PUNC,
        "refer_wav_path": REF, "prompt_text": REF_TEXT, "prompt_language": "zh",
    }, timeout=(10, 300), proxies=PROXIES)
    if r.status_code != 200:
        raise RuntimeError(f"HTTP {r.status_code}: {r.text[:200]}")
    with open(path, "wb") as f:
        f.write(r.content)


def read_wav(path):
    with wave.open(path, "rb") as w:
        sr, ch, sw = w.getframerate(), w.getnchannels(), w.getsampwidth()
        raw = w.readframes(w.getnframes())
    assert sw == 2, f"expect 16bit, got {sw * 8}bit"
    x = np.frombuffer(raw, dtype=np.int16)
    if ch > 1:
        x = x.reshape(-1, ch).mean(axis=1).astype(np.int16)
    return sr, x


def speech_bounds(path):
    sr, x = read_wav(path)
    xf = x.astype(np.float32) / 32768.0
    win = int(sr * 0.02)
    n = len(xf) // win
    rms = np.sqrt((xf[: n * win].reshape(n, win) ** 2).mean(axis=1) + 1e-12)
    db = 20 * np.log10(rms + 1e-12)
    thr = max(db.max() - 38.0, -45.0)
    hot = db > thr
    run = np.convolve(hot.astype(int), np.ones(3, dtype=int), "valid")
    idx = np.where(run >= 3)[0]
    if len(idx) == 0:
        return sr, 0.0, len(x) / sr, len(x) / sr
    start_i, end_i = int(idx[0]), int(idx[-1] + 2)
    s = max(0.0, start_i * 0.02 - 0.12)
    e = min(len(x) / sr, end_i * 0.02 + 0.15)
    return sr, s, e, len(x) / sr


def trim_wav(src, dst, s, e):
    sr, x = read_wav(src)
    a, b = int(s * sr), int(e * sr)
    with wave.open(dst, "wb") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(sr)
        w.writeframes(x[a:b].astype(np.int16).tobytes())
    return (b - a) / sr


def key_of(text):
    return hashlib.md5((text + "|" + str(SPEED)).encode("utf-8")).hexdigest()[:12]


def main():
    clips = json.load(open(CLIPS_JSON, encoding="utf-8"))
    os.makedirs(TTS_DIR, exist_ok=True)

    missing = [c["id"] for c in clips if c["id"] not in NARR]
    assert not missing, f"缺少旁白: {missing}"

    for c in clips:
        for s in NARR[c["id"]]:
            assert s and s == s.strip()
            n = len([ch for ch in s if not ch.isspace()])
            assert n <= 35, f"{c['id']} 单句 {n} 字超 35: {s}"
            assert not any(ch in "，。？！；：、…,.;?!" for ch in s), f"口播不得带标点: {s}"

    total_chars = 0
    for c in clips:
        total_chars += sum(len([ch for ch in s if not ch.isspace()]) for s in NARR[c["id"]])
    total_chars += sum(len(s) for s in END_SENTS)
    print(f"{len(clips)} 个片段 / {sum(len(v) for v in NARR.values()) + len(END_SENTS)} 句 / {total_chars} 字", flush=True)

    if not wait_engine():
        print("FATAL: 引擎 300s 未就绪", flush=True)
        sys.exit(2)
    print("引擎在线，开始合成", flush=True)

    cache = {}
    for c in clips:
        for s in NARR[c["id"]]:
            cache.setdefault(s, key_of(s))
    for s in END_SENTS:
        cache.setdefault(s, key_of(s))

    rows = {}
    for text in cache:
        k = cache[text]
        raw = os.path.join(TTS_DIR, k + "_raw.wav")
        fin = os.path.join(TTS_DIR, k + ".wav")
        if not (os.path.exists(raw) and os.path.getsize(raw) > 40000):
            synth(text, raw, SPEED)
        sr, s0, e0, dur = speech_bounds(raw)
        tdur = trim_wav(raw, fin, s0, e0)
        rows[text] = {"text": text, "audio": k + ".wav", "dur": tdur,
                      "cps": round(len([ch for ch in text if not ch.isspace()]) / tdur, 2)}
        print(f"{k} {tdur:5.2f}s {rows[text]['cps']:.2f}字/s {text[:24]}", flush=True)

    # 逐场景排句：场景起点 + LEAD，句间 GAP，结束至少留 TAIL
    scenes, over = [], []
    cursor = 0
    for c in clips:
        dur = c["frames"] / FPS
        sents = NARR[c["id"]]
        t = LEAD
        placed = []
        for s in sents:
            placed.append({"t": s, "off": t, "dur": rows[s]["dur"]})
            t += rows[s]["dur"] + GAP
        used = t - GAP
        if used + TAIL > dur:
            over.append((c["id"], round(used, 2), round(dur, 2)))
        scenes.append({
            "id": c["id"], "title": c["title"], "group": c["group"],
            "file": c["file"], "start": cursor, "dur": c["frames"],
            "aiMock": c["id"] in MOCK_SCENES, "sents": placed,
        })
        cursor += c["frames"]

    end_start = cursor
    t = 0.45
    end_placed = []
    for s in END_SENTS:
        end_placed.append({"t": s, "off": t, "dur": rows[s]["dur"]})
        t += rows[s]["dur"] + GAP
    total_frames = end_start + END_FRAMES

    if over:
        print("WARN 旁白超出片段时长:", over, flush=True)

    # 绝对帧
    for sc in scenes:
        for s in sc["sents"]:
            s["sf"] = sc["start"] + int(round(s["off"] * FPS))
            s["df"] = int(round(s["dur"] * FPS))
    for s in end_placed:
        s["sf"] = end_start + int(round(s["off"] * FPS))
        s["df"] = int(round(s["dur"] * FPS))

    sr, _ = read_wav(os.path.join(TTS_DIR, rows[END_SENTS[0]]["audio"]))
    total_samples = int(round(total_frames / FPS * sr))
    mix = np.zeros(total_samples, dtype=np.float32)
    for sc in scenes + [{"sents": end_placed}]:
        for s in sc["sents"]:
            _, x = read_wav(os.path.join(TTS_DIR, rows[s["t"]]["audio"]))
            a = int(round(s["sf"] / FPS * sr))
            b = min(total_samples, a + len(x))
            if b > a:
                mix[a:b] += x[: b - a].astype(np.float32) / 32768.0
    peak = float(np.max(np.abs(mix))) if len(mix) else 0.0
    if peak > 0.98:
        mix *= 0.98 / peak
    pcm = np.clip(mix * 32767.0, -32768, 32767).astype(np.int16)
    with wave.open(os.path.join(TTS_DIR, "narration.wav"), "wb") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(sr)
        w.writeframes(pcm.tobytes())

    timeline = {
        "fps": FPS, "engine": "GPT-SoVITS/manbo", "speed": SPEED,
        "total_frames": total_frames, "total_sec": round(total_frames / FPS, 2),
        "narration_sec": round(total_frames / FPS, 2),
        "end_start": end_start,
        "scenes": [{
            "id": sc["id"], "title": sc["title"], "group": sc["group"],
            "file": sc["file"], "start": sc["start"], "dur": sc["dur"],
            "aiMock": sc["aiMock"], "used": round(sum(s["dur"] for s in sc["sents"]) + GAP * (len(sc["sents"]) - 1) + LEAD, 2),
            "sents": [{"t": s["t"], "start": round(s["sf"] / FPS, 3), "dur": round(s["dur"], 3)} for s in sc["sents"]],
        } for sc in scenes] + [{
            "id": "end", "title": "结束", "group": "结束", "start": end_start,
            "dur": END_FRAMES, "aiMock": False,
            "sents": [{"t": s["t"], "start": round(s["sf"] / FPS, 3), "dur": round(s["dur"], 3)} for s in end_placed],
        }],
    }
    json.dump(timeline, open(os.path.join(TTS_DIR, "timeline.json"), "w", encoding="utf-8"),
              ensure_ascii=False, indent=2)

    L = []
    L.append("// 自动生成：public/audio/gen_live.py —— 不要手改，重跑脚本再生成")
    L.append(f"// 智能健身管理系统 · 真实操作演示  voice: GPT-SoVITS 曼波 speed={SPEED}")
    L.append(f"export const FPS = {FPS};")
    L.append(f"export const DUR = {total_frames};")
    L.append("export type LiveSent = { t: string; start: number; dur: number };")
    L.append("export type LiveScene = { id: string; title: string; group: string;"
             " file: string; start: number; dur: number; aiMock: boolean; sents: LiveSent[] };")
    L.append("export const SCENES: LiveScene[] = [")
    for sc in scenes:
        sents = ",".join(
            "{" + f"t: {json.dumps(s['t'], ensure_ascii=False)}, start: {s['sf']}, dur: {s['df']}" + "}" for s in sc["sents"])
        L.append("  {" + f"id: {json.dumps(sc['id'])}, title: {json.dumps(sc['title'], ensure_ascii=False)},"
                 f" group: {json.dumps(sc['group'], ensure_ascii=False)},"
                 f" file: {json.dumps('videos/fitness-live/' + sc['file'])},"
                 f" start: {sc['start']}, dur: {sc['dur']},"
                 f" aiMock: {str(sc['aiMock']).lower()}, sents: [{sents}]" + "},")
    L.append("];")
    L.append(f"export const END_START = {end_start};")
    L.append(f"export const END_DUR = {END_FRAMES};")
    end_sents = ",".join(
        "{" + f"t: {json.dumps(s['t'], ensure_ascii=False)}, start: {s['sf']}, dur: {s['df']}" + "}" for s in end_placed)
    L.append(f"export const END_SENTS: LiveSent[] = [{end_sents}];")
    with open(os.path.join(SRC_DIR, "fitnessLiveData.ts"), "w", encoding="utf-8") as f:
        f.write("\n".join(L) + "\n")

    print(f"\nTOTAL {total_frames}f / {total_frames / FPS:.1f}s  audio={total_samples / sr:.1f}s", flush=True)
    print("数据 -> src/fitnessLiveData.ts", flush=True)


if __name__ == "__main__":
    main()
