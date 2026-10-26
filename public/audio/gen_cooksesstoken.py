# -*- coding: utf-8 -*-
# batch10 §4 CookieSessionToken TTS：词级时间戳(boundary=WordBoundary) + mutagen 实测真实时长
# 词级锚点按 真实时长/词元数据末尾 的比例缩放（同 gen_batch8.py）。
# 用法: python gen_cooksesstoken.py
import asyncio, json, os, re
import edge_tts
from mutagen.mp3 import MP3

FPS = 30
GAP = 0.18
NAME = "cooksesstoken"
VOICE = "zh-CN-YunjianNeural"
RATE = "+15%"

SENTENCES = [
    "登录一次之后，每个页面都不用再输密码——网站凭什么一直记得你是你？",
    "靠的是三件套，但它们的分工，很多人干了三年都没分清。",
    "Cookie是你浏览器里的小口袋，网站把凭证放进去，之后每次请求自动帮你带上。",
    "但口袋谁都能翻，直接存密码等于裸奔，所以真正的档案放在服务器那边，这叫Session。",
    "浏览器只领一张编号牌，服务器凭牌查档案——可服务器一多就露馅：档案存在A机，请求到了B机，查无此人。",
    "于是有了Token：档案不存服务器，签成一串防伪字符串发给你自己带，服务器验个签就认，多少台机器都通用。",
    "很多系统从Session迁到Token，就是被这个多机问题逼的，不是Token时髦。",
    "金句：Cookie是口袋，Session是档案，Token是随身证件。",
    "这张三件套对比卡建议截图收藏，更多高频面试对比在主页合集，点个关注。",
]

# 字幕短语（每条≤14字，去标点；与旁白逐字匹配）
SUBS = {
    1: ["登录一次之后", "每个页面都不用再输密码", "网站凭什么一直记得你是你"],
    2: ["靠的是三件套", "但它们的分工", "很多人干了三年都没分清"],
    3: ["Cookie是你浏览器里的", "小口袋", "网站把凭证放进去", "之后每次请求自动帮你带上"],
    4: ["但口袋谁都能翻", "直接存密码等于裸奔", "所以真正的档案放在服务器那边", "这叫Session"],
    5: ["浏览器只领一张编号牌", "服务器凭牌查档案", "可服务器一多就露馅", "档案存在A机", "请求到了B机", "查无此人"],
    6: ["于是有了Token", "档案不存服务器", "签成一串防伪字符串", "发给你自己带", "服务器验个签就认", "多少台机器都通用"],
    7: ["很多系统从Session", "迁到Token", "就是被这个多机问题逼的", "不是Token时髦"],
    8: ["金句", "Cookie是口袋", "Session是档案", "Token是随身证件"],
    9: ["这张三件套对比卡建议截图收藏", "更多高频面试对比在主页合集", "点个关注"],
}


def pick(d, *keys):
    for k in keys:
        if k in d:
            return d[k]
    return None


def norm(s):
    return re.sub(r"[\s，。？、！；：,.?!—…·]", "", s)


async def synth_one(out_dir, i, text):
    audio_path = os.path.join(out_dir, f"s{i+1:02d}.mp3")
    last_err = None
    for attempt in range(5):
        try:
            comm = edge_tts.Communicate(text, VOICE, rate=RATE, boundary="WordBoundary")
            words = []
            with open(audio_path, "wb") as f:
                async for chunk in comm.stream():
                    if chunk.get("type") == "audio":
                        f.write(chunk["data"])
                    else:
                        off = pick(chunk, "offset", "Offset")
                        dur = pick(chunk, "duration", "Duration")
                        txt = pick(chunk, "text", "Text")
                        if off is not None and dur is not None:
                            words.append({"off": int(off), "dur": int(dur), "t": txt or ""})
            if os.path.getsize(audio_path) > 1000:
                real = MP3(audio_path).info.length
                meta_end = (words[-1]["off"] + words[-1]["dur"]) / 1e7 if words else 0.0
                scale = (real / meta_end) if meta_end > 0.05 else 1.0
                return {
                    "audio": os.path.basename(audio_path),
                    "dur_sec": real,
                    "scale": round(scale, 4),
                    "words": [
                        {"off_sec": round(w["off"] / 1e7 * scale, 3),
                         "dur_sec": round(w["dur"] / 1e7 * scale, 3), "t": w["t"]}
                        for w in words
                    ],
                }
            last_err = RuntimeError("audio too small")
        except Exception as e:
            last_err = e
        await asyncio.sleep(2 + attempt * 2)
    raise last_err


async def main():
    base = os.path.dirname(os.path.abspath(__file__))
    out_dir = os.path.join(base, f"{NAME}-tts")
    os.makedirs(out_dir, exist_ok=True)
    results = []
    for i, s in enumerate(SENTENCES):
        r = await synth_one(out_dir, i, s)
        r["text"] = s
        r["index"] = i + 1
        results.append(r)
        print(f"s{i+1:02d} dur={r['dur_sec']:.2f}s scale={r['scale']}")
    cursor = 0.0
    timeline = []
    for r in results:
        start = cursor
        end = start + r["dur_sec"]
        timeline.append({
            "index": r["index"], "text": r["text"], "audio": r["audio"],
            "start_sec": round(start, 3), "end_sec": round(end, 3),
            "start_frame": round(start * FPS), "end_frame": round(end * FPS),
            "dur_sec": round(r["dur_sec"], 3),
            "words": r["words"],
        })
        cursor = end + GAP
    data = {"fps": FPS, "voice": VOICE, "rate": RATE,
            "total_sec": round(cursor, 3), "total_frames": round(cursor * FPS),
            "sentences": timeline}
    with open(os.path.join(out_dir, "timeline.json"), "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    print(f"TOTAL {data['total_sec']}s / {data['total_frames']} frames -> {out_dir}")

    # 字幕：词级对齐（同 gen_subs_words.py 逻辑）
    subs = []
    for sent in timeline:
        idx = sent["index"]
        phrases = SUBS[idx]
        base_s = sent["start_sec"]
        words = sent["words"]
        char_acc = []
        acc = 0
        for w in words:
            char_acc.append((acc, w["off_sec"]))
            acc += len(norm(w["t"]))
        consumed = 0
        starts = []
        for ph in phrases:
            phn = norm(ph)
            start_sec = sent["dur_sec"] - 0.05
            for c, off in char_acc:
                if c >= consumed:
                    start_sec = off
                    break
            starts.append(start_sec)
            consumed += len(phn)
        for i, ph in enumerate(phrases):
            s = base_s + starts[i]
            e = base_s + (starts[i + 1] if i + 1 < len(starts) else sent["dur_sec"] + 0.10)
            subs.append({"s": round(s * FPS), "e": round(e * FPS), "t": ph})
    for a, b in zip(subs, subs[1:]):
        if b["s"] < a["e"]:
            b["s"] = a["e"]
    with open(os.path.join(out_dir, "subs.json"), "w", encoding="utf-8") as f:
        json.dump(subs, f, ensure_ascii=False, indent=1)
    print("SUBS:")
    for s in subs:
        print(f'  {{s: {s["s"]}, e: {s["e"]}, t: "{s["t"]}"}},')


asyncio.run(main())
