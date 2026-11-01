# -*- coding: utf-8 -*-
"""智能健身管理系统 · 功能演示：曼波配音 + 时间轴 + 画面数据。
用法: <GPT-SoVITS runtime>/python.exe gen_fitness_demo.py 1.5
流程: 等引擎 -> 逐句合成 raw wav -> 波形实测裁剪 -> narration.wav 拼接
      -> timeline.json + src/fitnessDemoData.ts + 截图拷进 public/images/fitness
铁律: 口播文本不带任何标点；单句 ≤35 字；end_frame 按波形实测；
     人工智能当前为 Mock，画面与旁白必须如实标注。
"""
import json, os, re, shutil, struct, sys, time, wave
import numpy as np
import requests

API = "http://127.0.0.1:9880"
PROXIES = {"http": None, "https": None}
CUT_PUNC = "，。？！；：、…,.;?!"
REF = r"D:\MamboTTS\models\refer.wav"
REF_TEXT = "大家好，欢迎来到我的频道，今天给大家分享一个有趣的内容"
FPS = 30
GAP = 0.06
TAIL_FRAMES = 6

AUDIO_DIR = os.path.dirname(os.path.abspath(__file__))
TTS_DIR = os.path.join(AUDIO_DIR, "fitness-tts")
PUBLIC_DIR = os.path.abspath(os.path.join(AUDIO_DIR, ".."))
IMG_DIR = os.path.join(PUBLIC_DIR, "images", "fitness")
SRC_DIR = os.path.abspath(os.path.join(PUBLIC_DIR, "..", "src"))
IMG_SRC = r"C:\Temp\bda_e2e\shots"

SPEED = float(sys.argv[1]) if len(sys.argv) > 1 else 1.5

# (截图, 章节, 页面标题, 副标题, 旁白句子, 字幕短语, 是否人工智能Mock 标注)
SHOTS = [
    ("public-01-login.png", "登录", "登录页", "三种角色选择", [
        "这是一套智能健身管理系统",
        "后端用 Java 前端用 Vue 数据库用 MySQL",
        "用户 教练 管理员三种角色 登录后进入各自的工作台",
        "三种角色共用一套数据 看到的页面不一样",
    ], [
        ["这是一套", "智能健身管理系统"],
        ["后端用 Java", "前端用 Vue", "数据库用 MySQL"],
        ["用户 教练 管理员三种角色", "登录后进入各自工作台"],
        ["三种角色共用一套数据", "看到的页面不一样"],
    ], False),

    ("user-01-dashboard.png", "用户端", "首页", "数据总览", [
        "用户端首页把体重 BMI 本周训练和热量摄入放在一屏",
        "下面的图分别是体重趋势 每周训练次数和热量摄入",
        "教练的建议和公告也会在首页提醒",
    ], [
        ["首页把体重 BMI", "本周训练和热量摄入", "放在一屏"],
        ["下面是体重趋势", "每周训练次数", "和热量摄入"],
        ["教练的建议和公告", "也会在首页提醒"],
    ], False),

    ("user-02-profile.png", "用户端", "个人中心", "档案与目标", [
        "个人中心维护身高 体重 健身目标和每周训练频率",
        "档案里的数据会用在热量目标和人工智能建议里",
    ], [
        ["个人中心维护", "身高 体重 健身目标", "和每周训练频率"],
        ["档案里的数据会用在", "热量目标和人工智能建议里"],
    ], False),

    ("user-03-goals.png", "用户端", "健身目标", "目标与进度", [
        "健身目标页把目标体重 每周频率和每次时长列成一张表",
        "进行中和已完成分开标记",
    ], [
        ["健身目标页把目标体重", "每周频率和每次时长", "列成一张表"],
        ["进行中和已完成", "分开标记"],
    ], False),

    ("user-04-plans.png", "用户端", "训练计划", "教练 / AI / 自建", [
        "训练计划页把教练安排的计划和自己建的计划放在一起",
        "每条计划都有完成率 教练计划和人工智能生成的也会标出来",
    ], [
        ["训练计划页把", "教练安排的计划", "和自己建的计划放在一起"],
        ["每条计划都有完成率", "教练计划和人工智能生成", "也会标出来"],
    ], False),

    ("user-05-plan-create.png", "用户端", "新建计划", "训练日与动作", [
        "新建计划先填名称 目标 每周训练次数和起止日期",
        "再选训练日 给每天安排动作",
        "每个动作都能设置组数 次数 重量和组间休息",
    ], [
        ["新建计划先填名称 目标", "每周训练次数和起止日期"],
        ["再选训练日", "给每天安排动作"],
        ["每个动作能设置", "组数 次数 重量", "和组间休息"],
    ], False),

    ("user-07-today-training.png", "用户端", "今日训练", "计时与完成度", [
        "今日训练页按顺序排好当天要练的动作",
        "每个动作都有组数 重量和组间休息",
        "点开始训练会计时 练完自动记录完成度",
    ], [
        ["今日训练页", "按顺序排好当天动作"],
        ["每个动作都有", "组数 重量和组间休息"],
        ["点开始训练会计时", "练完自动记录完成度"],
    ], False),

    ("user-08-records.png", "用户端", "训练记录", "时长与完成率", [
        "训练记录里能看到每次的时长 消耗和完成率",
    ], [
        ["训练记录里能看到", "每次的时长 消耗", "和完成率"],
    ], False),

    ("user-09-record-detail.png", "用户端", "记录详情", "动作逐项完成", [
        "点进详情 这次训练五十分钟 消耗三百五十千卡",
        "每个动作的完成情况都在这里",
    ], [
        ["点进详情", "这次训练五十分钟", "消耗三百五十千卡"],
        ["每个动作的完成情况", "都在这里"],
    ], False),

    ("user-10-exercises.png", "用户端", "健身动作库", "部位与难度", [
        "动作库按胸部 背部 腿部这些部位分类",
        "也能按难度筛选 一共二十八个动作",
    ], [
        ["动作库按胸部 背部", "腿部这些部位分类"],
        ["也能按难度筛选", "一共二十八个动作"],
    ], False),

    ("user-12-diet.png", "用户端", "饮食记录", "三餐与营养素", [
        "饮食页按早餐 午餐 晚餐和加餐分别记录",
        "每样食物都会算出热量和蛋白质 碳水 脂肪",
        "右侧实时对比目标 差多少一眼就能看出来",
    ], [
        ["饮食页按早餐 午餐", "晚餐和加餐分别记录"],
        ["每样食物都会算出", "热量和蛋白质", "碳水 脂肪"],
        ["右侧实时对比目标", "差多少一眼看出来"],
    ], False),

    ("user-13-foods.png", "用户端", "食物营养库", "分类与搜索", [
        "食物营养库里存了常见食物的营养数据",
        "按分类筛选 或者直接搜索添加",
    ], [
        ["食物营养库里存了", "常见食物的营养数据"],
        ["按分类筛选", "或者直接搜索添加"],
    ], False),

    ("user-15-body-analysis.png", "用户端", "身体数据", "六维趋势", [
        "身体数据页把体重 BMI 和训练频率放在一起看",
        "六张图覆盖体重 训练量 热量和营养结构",
        "时间范围可以切换近三十天 六十天和九十天",
    ], [
        ["身体数据页把体重 BMI", "和训练频率放在一起看"],
        ["六张图覆盖体重", "训练量 热量和营养结构"],
        ["时间范围可以切换", "近三十天 六十天和九十天"],
    ], False),

    ("user-16-report.png", "用户端", "健身报告", "阶段总结", [
        "健身报告可以按近两周 近三十天和近九十天查看",
        "体重变化 训练次数 时长和完成率都在一页",
    ], [
        ["健身报告可以按", "近两周 近三十天", "和近九十天查看"],
        ["体重变化 训练次数", "时长和完成率", "都在一页"],
    ], False),

    ("user-17-courses.png", "用户端", "健身课程", "浏览与筛选", [
        "课程页可以浏览全部健身课程",
        "每门课都有教练 价格和报名人数",
    ], [
        ["课程页可以浏览", "全部健身课程"],
        ["每门课都有教练", "价格和报名人数"],
    ], False),

    ("user-18-course-detail.png", "用户端", "课程详情", "报名与学习", [
        "课程详情里能直接报名 报名后就在我的课程里",
    ], [
        ["课程详情里能直接报名", "报名后就在我的课程里"],
    ], False),

    ("user-19-cart.png", "用户端", "购物车", "结算", [
        "选好的课程加入购物车 合计金额自动算好",
    ], [
        ["选好的课程加入购物车", "合计金额自动算好"],
    ], False),

    ("user-20-orders.png", "用户端", "我的订单", "支付状态", [
        "结算后生成订单 订单页显示支付状态",
    ], [
        ["结算后生成订单", "订单页显示支付状态"],
    ], False),

    ("user-22-knowledge.png", "用户端", "健身知识", "分类与搜索", [
        "健身知识页按增肌 减脂这些标签分类文章",
        "搜索标题就能找到对应的训练知识",
    ], [
        ["健身知识页按增肌", "减脂这些标签分类文章"],
        ["搜索标题", "就能找到对应的训练知识"],
    ], False),

    ("user-24-ai-chat.png", "AI 助手", "对话", "结合档案与记录", [
        "人工智能助手会结合档案和训练记录回答问题",
        "比如今天练胸 卧推和飞鸟先做哪个",
    ], [
        ["人工智能助手会结合", "档案和训练记录", "回答问题"],
        ["比如今天练胸", "卧推和飞鸟先做哪个"],
    ], True),

    ("user-25-ai-plan.png", "AI 助手", "AI 训练计划", "生成与保存", [
        "填好目标 经验 每周次数和训练场景",
        "人工智能直接生成一份分训练日的计划",
        "每个动作都有组数 次数和重量 满意就一键保存",
    ], [
        ["填好目标 经验", "每周次数和训练场景"],
        ["人工智能直接生成一份", "分训练日的计划"],
        ["每个动作都有", "组数 次数和重量", "满意就一键保存"],
    ], True),

    ("user-26-ai-diet.png", "AI 助手", "AI 饮食分析", "目标与营养素", [
        "人工智能饮食分析会对着目标给出热量和三大营养素建议",
    ], [
        ["人工智能饮食分析会对着目标", "给出热量和营养素建议"],
    ], True),

    ("user-27-ai-report.png", "AI 助手", "AI 健身报告", "30 天总结", [
        "人工智能报告把近三十天的体重变化 训练次数和完成率做成总结",
    ], [
        ["人工智能报告把近三十天", "体重变化 训练次数", "和完成率做成总结"],
    ], True),

    ("coach-01-workbench.png", "教练端", "工作台", "会员与课程", [
        "切到教练端 工作台汇总会员数 待启动计划和近期训练",
        "右边是名下课程和最近加入的会员",
    ], [
        ["切到教练端", "工作台汇总会员数", "待启动计划和近期训练"],
        ["右边是名下课程", "和最近加入的会员"],
    ], False),

    ("coach-02-members.png", "教练端", "会员列表", "BMI 与完成率", [
        "会员列表能看到每个会员的 BMI 和训练完成率",
    ], [
        ["会员列表能看到", "每个会员的 BMI", "和训练完成率"],
    ], False),

    ("coach-03-member-detail.png", "教练端", "会员详情", "计划与体测", [
        "点进详情 体重趋势 计划完成率和体测数据都在一页",
    ], [
        ["点进详情", "体重趋势 计划完成率", "和体测数据都在一页"],
    ], False),

    ("coach-04-member-plan-create.png", "教练端", "制定计划", "目标与周安排", [
        "教练可以直接给会员建计划 安排到具体某一周",
        "目标 频率 时长和日期范围都能一次设好",
    ], [
        ["教练可以直接", "给会员建计划", "安排到具体某一周"],
        ["目标 频率 时长", "和日期范围都能一次设好"],
    ], False),

    ("coach-05-analysis.png", "教练端", "效果分析", "六图 + 雷达", [
        "训练效果分析用六张图加雷达图看会员的变化",
        "近三十天 训练次数 时长 完成率和体重变化一目了然",
    ], [
        ["训练效果分析", "用六张图加雷达图", "看会员的变化"],
        ["近三十天 训练次数", "时长 完成率和体重变化", "一目了然"],
    ], False),

    ("coach-07-advice.png", "教练端", "饮食建议", "发送与记录", [
        "看完数据 教练可以直接写训练建议和饮食建议",
        "发出去的记录会留在右侧 会员端收到提醒",
    ], [
        ["看完数据 教练可以直接", "写训练建议和饮食建议"],
        ["发出去的记录会留在右侧", "会员端收到提醒"],
    ], False),

    ("coach-10-courses.png", "教练端", "课程管理", "上架与报名", [
        "课程管理能上架课程 查看报名人数和学员",
    ], [
        ["课程管理能上架课程", "查看报名人数和学员"],
    ], False),

    ("coach-08-students.png", "教练端", "课程学员", "报名与容量", [
        "课程学员总览能看到每门课的报名人数和容量",
        "点开就能看到这门课有哪些学员",
    ], [
        ["课程学员总览能看到", "每门课的报名人数", "和容量"],
        ["点开就能看到", "这门课有哪些学员"],
    ], False),

    ("admin-01-dashboard.png", "管理端", "后台首页", "全局统计", [
        "最后是管理端 后台首页统计用户 教练 计划和课程",
        "记录数和人工智能调用次数也一起统计出来",
    ], [
        ["最后是管理端", "后台首页统计用户 教练", "计划和课程"],
        ["记录数和人工智能调用次数", "也一起统计出来"],
    ], False),

    ("admin-02-users.png", "管理端", "用户管理", "角色与信息", [
        "用户管理列出全部账号",
        "角色和手机号这些基本信息都能看到",
    ], [
        ["用户管理列出全部账号"],
        ["角色和手机号", "这些基本信息都能看到"],
    ], False),

    ("admin-03-coaches.png", "管理端", "教练管理", "资料与状态", [
        "教练管理维护擅长方向 从业年限和账号状态",
        "账号状态也能在这里禁用",
    ], [
        ["教练管理维护擅长方向", "从业年限和账号状态"],
        ["账号状态", "也能在这里禁用"],
    ], False),

    ("admin-04-exercises.png", "管理端", "内容维护", "动作 / 食物 / 知识", [
        "动作库 食物库和知识库都在后台统一维护",
    ], [
        ["动作库 食物库和知识库", "都在后台统一维护"],
    ], False),

    ("admin-05-foods.png", "管理端", "食物管理", "营养数据", [
        "食物管理维护热量 蛋白质 脂肪和碳水",
    ], [
        ["食物管理维护", "热量 蛋白质", "脂肪和碳水"],
    ], False),

    ("admin-09-ai-logs.png", "管理端", "AI 使用记录", "耗时与状态", [
        "人工智能使用记录里能看到每次调用的功能 耗时和状态",
    ], [
        ["人工智能使用记录里能看到", "每次调用的功能", "耗时和状态"],
    ], False),

    ("admin-08-notifications.png", "管理端", "公告管理", "发布与接收", [
        "公告管理按标题 接收对象和发布时间维护通知",
        "用户首页收到的提醒就来自这里",
    ], [
        ["公告管理按标题", "接收对象和发布时间", "维护通知"],
        ["用户首页收到的提醒", "就来自这里"],
    ], False),

    ("admin-11-config.png", "管理端", "系统配置", "AI 开关与提供方", [
        "系统配置里人工智能目前是关闭的 提供方是模拟模式",
        "换成真实的大模型 打开开关 填上密钥就能接上",
    ], [
        ["系统配置里人工智能目前关闭", "提供方是模拟模式"],
        ["换成真实的大模型", "打开开关 填上密钥就能接上"],
    ], False),

    (None, "总结", "完整闭环", "记录 → 分析 → 指导", [
        "从记录到分析再到指导 这套系统形成一条完整闭环",
        "从用户端到教练端再到管理端 三种角色各管一段",
        "这就是智能健身管理系统的主要功能",
    ], [
        ["从记录到分析再到指导", "整套系统形成完整闭环"],
        ["从用户端到教练端", "再到管理端", "三种角色各管一段"],
        ["这就是智能健身管理系统", "的主要功能"],
    ], False),
]


def wait_engine(timeout=300):
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


def main():
    all_sents, all_subs, shot_rows = [], [], []
    for img, chapter, title, sub, sents, subs, ai in SHOTS:
        assert len(sents) == len(subs), f"{title}: 句子数与字幕组数不一致"
        shot_rows.append({"img": img, "chapter": chapter, "title": title,
                          "sub": sub, "aiMock": ai,
                          "s0": len(all_sents), "n": len(sents)})
        for s in sents:
            n = len([c for c in s if not c.isspace()])
            assert n <= 35, f"{title} 单句 {n} 字超 35: {s}"
            all_sents.append(s)
        all_subs.extend(subs)

    os.makedirs(IMG_DIR, exist_ok=True)
    for img, *_ in SHOTS:
        if img:
            shutil.copy2(os.path.join(IMG_SRC, img), os.path.join(IMG_DIR, img))

    os.makedirs(TTS_DIR, exist_ok=True)
    print(f"共 {len(all_sents)} 句 / {len(SHOTS)} 屏，等待引擎 ...", flush=True)
    if not wait_engine():
        print("FATAL: 引擎 300s 未就绪", flush=True)
        sys.exit(2)
    print("引擎在线，开始合成", flush=True)

    rows = []
    for i, text in enumerate(all_sents):
        raw = os.path.join(TTS_DIR, f"s{i+1:02d}_raw.wav")
        fin = os.path.join(TTS_DIR, f"s{i+1:02d}.wav")
        spd = 1.2 if re.search(r"[A-Za-z]", text) else SPEED
        if not (os.path.exists(raw) and os.path.getsize(raw) > 40000):
            synth(text, raw, spd)
        sr, s, e, dur = speech_bounds(raw)
        tdur = trim_wav(raw, fin, s, e)
        chars = len([c for c in text if not c.isspace()])
        rows.append({"index": i + 1, "text": text, "audio": f"s{i+1:02d}.wav",
                     "raw_dur": round(dur, 3), "speech_start": round(s, 3),
                     "speech_end": round(e, 3), "dur_sec": round(tdur, 3),
                     "cps": round(chars / tdur, 2)})
        print(f"s{i+1:02d} 裁后={tdur:5.2f}s {rows[-1]['cps']:.2f}字/s  {text[:20]}",
              flush=True)

    cursor, sent_frames = 0.0, []
    for r in rows:
        start = round(cursor, 3)
        end = round(cursor + r["dur_sec"], 3)
        r["start_sec"], r["end_sec"] = start, end
        r["start_frame"] = int(round(start * FPS))
        r["end_frame"] = int(round(end * FPS))
        sent_frames.append((r["start_frame"], r["end_frame"]))
        cursor = end + GAP
    total = round(cursor - GAP, 3)
    narration_end = int(round(total * FPS))
    dur_total = narration_end + TAIL_FRAMES

    sr, _ = read_wav(os.path.join(TTS_DIR, "s01.wav"))
    gap = np.zeros(int(round(sr * GAP)), dtype=np.int16)
    pieces = []
    for i, r in enumerate(rows):
        _, x = read_wav(os.path.join(TTS_DIR, r["audio"]))
        pieces.append(x)
        if i < len(rows) - 1:
            pieces.append(gap)
    with wave.open(os.path.join(TTS_DIR, "narration.wav"), "wb") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(sr)
        w.writeframes(np.concatenate(pieces).tobytes())

    with open(os.path.join(TTS_DIR, "timeline.json"), "w", encoding="utf-8") as f:
        json.dump({"fps": FPS, "engine": "GPT-SoVITS/manbo", "speed": SPEED,
                   "total_sec": total, "narration_end": narration_end,
                   "duration": dur_total, "sentences": rows},
                  f, ensure_ascii=False, indent=2)

    subs = []
    sidx = 0
    for i, r in enumerate(rows):
        base, dur_f = r["start_frame"], r["end_frame"] - r["start_frame"]
        phrases = all_subs[sidx]
        total_chars = sum(len(p) for p in phrases)
        acc = 0
        for p in phrases:
            frac = acc / max(1, total_chars)
            subs.append({"t": p, "f": base + int(round(frac * dur_f)), "sent": i})
            acc += len(p)
        sidx += 1

    shots_ts = []
    for s in shot_rows:
        a, b = s["s0"], s["s0"] + s["n"] - 1
        start_f = rows[a]["start_frame"]
        end_f = rows[b]["end_frame"] if b + 1 < len(rows) else narration_end
        if b + 1 < len(rows):
            end_f = rows[b + 1]["start_frame"]
        img = s["img"]
        w = h = 0
        if img:
            with open(os.path.join(IMG_DIR, img), "rb") as fh:
                head = fh.read(24)
            w, h = struct.unpack(">II", head[16:24])
        shots_ts.append({"img": img, "chapter": s["chapter"], "title": s["title"],
                         "sub": s["sub"], "aiMock": s["aiMock"],
                         "start": start_f, "end": end_f, "w": w, "h": h})

    sent = [sf[0] for sf in sent_frames]
    sent_dur = [sf[1] - sf[0] for sf in sent_frames]
    L = []
    L.append("// 自动生成：public/audio/gen_fitness_demo.py —— 不要手改，重跑脚本再生成")
    L.append(f"// 主题: 智能健身管理系统功能演示  voice: GPT-SoVITS 曼波 speed={SPEED}")
    L.append(f"export const DUR = {dur_total};")
    L.append(f"export const NARRATION_END = {narration_end};")
    L.append("export const SENT = [" + ",".join(map(str, sent)) + "];")
    L.append("export const SENT_DUR = [" + ",".join(map(str, sent_dur)) + "];")
    L.append("export const SENT_TEXT = [" + ",".join(json.dumps(t, ensure_ascii=False) for t in all_sents) + "];")
    L.append("export const SUBS: { t: string; f: number; sent: number }[] = [")
    for s0 in subs:
        L.append(f"  {{ t: {json.dumps(s0['t'], ensure_ascii=False)}, f: {s0['f']}, sent: {s0['sent']} }},")
    L.append("];")
    L.append("export type Shot = { img: string | null; chapter: string; title: string;"
             " sub: string; aiMock: boolean; start: number; end: number; w: number; h: number };")
    L.append("export const SHOTS: Shot[] = [")
    for s0 in shots_ts:
        img = "null" if s0["img"] is None else json.dumps(f"images/fitness/{s0['img']}")
        L.append("  {" + f"img: {img}, chapter: {json.dumps(s0['chapter'], ensure_ascii=False)},"
                 f" title: {json.dumps(s0['title'], ensure_ascii=False)},"
                 f" sub: {json.dumps(s0['sub'], ensure_ascii=False)},"
                 f" aiMock: {str(s0['aiMock']).lower()}, start: {s0['start']},"
                 f" end: {s0['end']}, w: {s0['w']}, h: {s0['h']}" + "},")
    L.append("];")
    data_path = os.path.join(SRC_DIR, "fitnessDemoData.ts")
    with open(data_path, "w", encoding="utf-8") as f:
        f.write("\n".join(L) + "\n")
    print(f"\nTOTAL {total:.2f}s / narration_end={narration_end}f / DUR={dur_total}f", flush=True)
    print(f"数据 -> {data_path}", flush=True)


if __name__ == "__main__":
    main()