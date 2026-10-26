# -*- coding: utf-8 -*-
# batch10 剩余6条 统一 TTS + 数据文件生成器（gen_batch8.py 同款内核）
# 词级时间戳(boundary=WordBoundary) + mutagen 实测真实时长 + 词级等比缩放
# 产物：public/audio/b10<topic>-tts/ (mp3+timeline.json) + src/batch10/<topic>Data.ts
# 用法: python gen_batch10.py [topic...]  不带参数=全部
import asyncio, edge_tts, json, os, sys
from mutagen.mp3 import MP3

FPS = 30
TAIL_FRAMES = 48   # 话音落+1.6s收尾（2026-09-19 batch10尾音返修：105帧+outro直铺=3.5s拖尾被用户打回）

PUNCT = "，。？：；！、——…「」『』（）()\"\"''"""

VIDEOS = {
    # ============ 排查剧情线 · 云希 +25% + 句间0.08s（内存泄漏/端口/inode 同款） ============
    "pingopen": {
        "voice": "zh-CN-YunxiNeural", "rate": "+25%", "gap": 0.08,
        "sentences": [
            "ping服务器秒回，网页却死活打不开——是网络坏了，还是浏览器坏了？",
            "都不是。ping通只说明两台机器之间路是通的，不代表门也是开的。",
            "ping走的是ICMP协议，网页走的是TCP的80和443端口，根本是两条不同的通道。",
            "打个比方：ping通等于进了小区，网页打不开，是你要找的那户人家门没开。",
            "最常见的真凶有三个：服务没启动、防火墙拦TCP放行ICMP、端口没对外开放。",
            "经典现场就是新配的防火墙：默认放行ping、拦截所有端口，于是怎么ping都通，网页就是打不开。",
            "这时候换工具，用telnet或者curl去探端口，探通了才算真通。",
            "金句：ping通证明路通，端口通才是门开。",
            "排查技巧我攒了满满一个合集，点个关注收藏起来，下次报错直接翻。",
        ],
    },
    # ============ 旅程/泛好奇线 · 云健 +15% ============
    "webcache": {
        "voice": "zh-CN-YunjianNeural", "rate": "+15%", "gap": 0.18,
        "sentences": [
            "同一个网页，第一次打开要转三秒，第二次秒开——没人动过网线，是谁在暗中提速？",
            "是你的浏览器偷偷留了一手，这招叫缓存。",
            "第一次打开：logo、图片、样式表，每一件都要从千里之外的服务器搬回来，慢是应该的。",
            "搬回来时服务器顺手叮嘱一句：这张图三个月不会变，你先存着，别每次都跑来拿。",
            "第二次打开，浏览器先翻自己的储物间：图片本地直接用，只有拿不准的新内容才去问。",
            "服务器回一句没变，省下的就是一趟跨省运输——这就是秒开的全部秘密。",
            "你肯定见过它的副作用：明明换了新图标，网页还抱着旧图不放，强制刷新一下才肯换。",
            "金句：第一次靠下载，第二次靠缓存——不搬家，直接用。",
            "想看网址回车后那一整段旅程，主页合集第一条就是，点个关注慢慢看。",
        ],
    },
    "pwdhash": {
        "voice": "zh-CN-YunjianNeural", "rate": "+15%", "gap": 0.18,
        "sentences": [
            "如果服务器的数据库整个被拖走，你的登录密码会跟着泄露吗？答案取决于它存的是哪种东西。",
            "低级存法是明文：数据库里躺着你原始的密码，拖库一次，全站裸奔。",
            "正规军的存法是哈希：密码进门先过一台粉碎机，搅成一串看不出原样的乱码，服务器只存乱码。",
            "哈希是单向的：乱码变不回密码；登录时把你输的密码再搅一次，比对两团乱码是否一致就够了。",
            "但简单密码有破绽：123456这类密码的乱码，早被人提前算成查询表，一查一个准。",
            "所以再撒一把盐：给每个密码拼上一段随机字符再搅，同一碗乱码全世界只此一份，查询表当场作废。",
            "那些年几次大型网站拖库事件里被端出来的，多半就是没加盐、甚至明文的库。",
            "金句：正规服务器只存乱码和盐，永远不存你的原密码。",
            "顺带一句：不同网站别用同一个密码，防的就是这种库被拖走。关注全栈小秋，下期见。",
        ],
    },
    "compress": {
        "voice": "zh-CN-YunjianNeural", "rate": "+15%", "gap": 0.18,
        "sentences": [
            "两个G的文件夹，压完只剩五百兆，文件一个没少——消失的体积去哪了？",
            "答案就一句：消失的是重复，不是内容。",
            "文件在硬盘上就是一长串0和1，而重复远比你想象的多：连续一万个0、出现一百次的同一张背景图、每行都一样的表头。",
            "压缩干的事是建字典：把重复的部分编成短代号，正文只写代号，还原时对着字典查回来。",
            "连续一万个0，记成「一万个0」五个字，体积瞬间小两百倍。",
            "规律也跟着简单：重复越多压得越小——小说能压一半；已经压过的图片视频，再压几乎不变。",
            "有人把压缩包再压一遍想省空间，结果发现基本白忙——字典里的重复早被榨干了。",
            "金句：压缩不删内容，只删重复——重复即体积。",
            "文件类硬核科普合集里还有一堆，点个关注，下期拆断点续传。",
        ],
    },
    # ============ 对比线 · 云健 +15% ============
    "concpar": {
        "voice": "zh-CN-YunjianNeural", "rate": "+15%", "gap": 0.18,
        "sentences": [
            "手机处理器就那么几个核，凭什么能同时挂着微信、放着歌、还下载着文件？",
            "先说答案：大多数时候它们根本不是同时跑，是轮流跑，快到你以为是真的同时。",
            "这种轮流叫并发：一个厨师一口锅，菜A在锅里炖着，手上切菜B，谁也不干等。",
            "真正的同时叫并行：四个灶眼同时开火，四道菜一起做，这才需要多个核。",
            "轮流的诀窍在等待上：程序A等网络的时候，CPU立刻转头去跑程序B，一秒切换上千次，你毫无察觉。",
            "所以单核时代的电脑就能边听歌边打字——那是并发；多核时代才有真并行。",
            "面试里把这两个词答反的人不少，记住一句话就行：并发是排队效率高，并行是真的分身。",
            "金句：并发轮流上，并行一起上；切换够快，就伪装成了同时。",
            "这张对照卡停在结尾了，喜欢这类底层科普，关注全栈小秋。",
        ],
    },
    "rangeresume": {
        "voice": "zh-CN-YunjianNeural", "rate": "+15%", "gap": 0.18,
        "sentences": [
            "几个G的游戏下载到百分之九十九断了网，重连之后却从九十九接着走——它是怎么记住进度的？",
            "靠HTTP里一个不起眼的字段：Range，意思是这一回，我只取剩下那一段。",
            "大文件在服务器上不是一团，是一串编号的字节：0到一百万、一百万到两百万，像书页一样能翻。",
            "断线的瞬间，下载器记下最后一个完整字节的位置，重连就在请求里写上：从这个字节往后，给我。",
            "服务器照办，只发剩下的尾巴，前面百分之九十九原封不动躺在硬盘里接着用。",
            "前提是服务器支持：响应里带着「可续传」的标记才行，不支持的老服务器只能从头再来。",
            "有些网盘每次断线都从零开始，八成就是服务端没开这个Range支持，不是你的网络问题。",
            "金句：断点续传的底气就一句——记住字节编号，从断的那页接着读。",
            "下载上传这类原理我拆了不止一条，主页合集收藏起来，关注全栈小秋。",
        ],
    },
}


def pick(d, *keys):
    for k in keys:
        if k in d:
            return d[k]
    return None


def clean(text):
    return "".join(ch for ch in text if ch not in PUNCT and not ch.isspace())


NUMSET = set("0123456789百分之点几零一二三四五六七八九十百千万亿")


def tokenize(seg):
    """拉丁词/数字词（含中文数字词如百分之九十九）整体成token，永不拆开。"""
    toks, buf = [], ""
    for ch in seg:
        if (ch.isascii() and ch.isalnum()) or ch in NUMSET:
            buf += ch
        else:
            if buf:
                toks.append(buf); buf = ""
            toks.append(ch)
    if buf:
        toks.append(buf)
    return toks


BIND_FWD = set("不了一是和这那把被就才只更太很个")  # 前向黏着：别断在它后面留半截词


def split_subs(text, limit=14):
    """按标点切分后合并/二次切分到 ≤limit 字；拉丁词原子化；黏着字回退。"""
    raw = []
    buf = ""
    for ch in text:
        if ch in PUNCT:
            if buf:
                raw.append(buf)
            buf = ""
        else:
            buf += ch
    if buf:
        raw.append(buf)
    out = []
    for seg in raw:
        toks = tokenize(seg)
        cur = ""
        pieces = []
        for t in toks:
            if len(cur) + len(t) > limit and cur:
                pieces.append(cur)
                cur = t
            else:
                cur += t
        if cur:
            pieces.append(cur)
        # 黏着字回退/前移
        for i in range(len(pieces) - 1):
            a, b = pieces[i], pieces[i + 1]
            while a and a[-1] in BIND_FWD and len(b) < limit and len(a) > 4:
                a, b = a[:-1], a[-1] + b
            pieces[i], pieces[i + 1] = a, b
        out.extend([x for x in pieces if x])
    # 合并过短片段
    merged = []
    for p in out:
        if merged and len(merged[-1]) + len(p) <= limit:
            merged[-1] += p
        else:
            merged.append(p)
    return merged


async def synth_one(out_dir, i, text, voice, rate):
    audio_path = os.path.join(out_dir, f"s{i+1:02d}.mp3")
    last_err = None
    for attempt in range(5):
        try:
            comm = edge_tts.Communicate(text, voice, rate=rate, boundary="WordBoundary")
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
            if os.path.getsize(audio_path) > 1000 and words:
                real = MP3(audio_path).info.length
                meta_end = (words[-1]["off"] + words[-1]["dur"]) / 1e7
                scale = (real / meta_end) if meta_end > 0.05 else 1.0
                return {
                    "dur_sec": real, "scale": round(scale, 4),
                    "words": [{"off_sec": round(w["off"] / 1e7 * scale, 3),
                               "dur_sec": round(w["dur"] / 1e7 * scale, 3), "t": w["t"]} for w in words],
                }
            last_err = RuntimeError("audio too small or no words")
        except Exception as e:
            last_err = e
        await asyncio.sleep(2 + attempt * 2)
    raise last_err


def emit_data_ts(topic, cfg, timeline, total_frames):
    """生成 src/batch10/<topic>Data.ts：SENT/SUBS/WORDS/DUR，组件只 import 数据。"""
    sent_arr, subs_arr, words_arr = [], [], []
    for s in timeline:
        idx = s["index"]
        sent_arr.append(s["start_frame"])
        cleaned = clean(s["text"])
        total_chars = max(1, len(cleaned))
        char_cursor = 0
        for ph in split_subs(s["text"]):
            frac = char_cursor / total_chars
            f = s["start_frame"] + round(frac * (s["end_frame"] - s["start_frame"]))
            subs_arr.append({"t": ph, "f": f, "sent": idx - 1})
            char_cursor += len(ph)
        for w in s["words"]:
            words_arr.append({"t": w["t"], "f": s["start_frame"] + round(w["off_sec"] * FPS), "sent": idx - 1})
    lines = [
        "// 自动生成：public/audio/gen_batch10.py —— 不要手改，重跑脚本再生成",
        f"// 主题: {topic}  voice: {cfg['voice']} {cfg['rate']}",
        f"export const DUR = {total_frames + TAIL_FRAMES};",
        f"export const NARRATION_END = {total_frames};",
        "export const SENT = [" + ",".join(map(str, sent_arr)) + "];",
        "export const SENT_DUR = [" + ",".join(str(s["end_frame"] - s["start_frame"]) for s in timeline) + "];",
        "export const SENT_TEXT = [" + ",".join(json.dumps(s["text"], ensure_ascii=False) for s in timeline) + "];",
        "export const SUBS: { t: string; f: number; sent: number }[] = [",
    ]
    lines += [f"  {{ t: {json.dumps(x['t'], ensure_ascii=False)}, f: {x['f']}, sent: {x['sent']} }}," for x in subs_arr]
    lines.append("];")
    lines.append("export const WORDS: { t: string; f: number; sent: number }[] = [")
    lines += [f"  {{ t: {json.dumps(x['t'], ensure_ascii=False)}, f: {x['f']}, sent: {x['sent']} }}," for x in words_arr]
    lines.append("];")
    out = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..", "src", "batch10", f"{topic}Data.ts")
    with open(os.path.abspath(out), "w", encoding="utf-8") as f:
        f.write("\n".join(lines) + "\n")
    print(f"[{topic}] Data.ts -> {os.path.abspath(out)}  SUBS={len(subs_arr)} WORDS={len(words_arr)}")


async def gen_video(name):
    cfg = VIDEOS[name]
    voice, rate, gap = cfg["voice"], cfg["rate"], cfg["gap"]
    out_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), f"b10{name}-tts")
    os.makedirs(out_dir, exist_ok=True)
    results = []
    for i, s in enumerate(cfg["sentences"]):
        r = await synth_one(out_dir, i, s, voice, rate)
        r["text"] = s
        results.append(r)
        print(f"[{name}] s{i+1:02d} dur={r['dur_sec']:.2f}s scale={r['scale']}")
    cursor = 0.0
    timeline = []
    for i, r in enumerate(results):
        start = cursor
        end = start + r["dur_sec"]
        timeline.append({
            "index": i + 1, "text": r["text"], "audio": f"s{i+1:02d}.mp3",
            "start_sec": round(start, 3), "end_sec": round(end, 3),
            "start_frame": round(start * FPS), "end_frame": round(end * FPS),
            "words": r["words"],
        })
        cursor = end + gap
    total_frames = round(cursor * FPS)
    data = {"fps": FPS, "voice": voice, "rate": rate, "gap": gap,
            "total_sec": round(cursor, 3), "total_frames": total_frames, "sentences": timeline}
    with open(os.path.join(out_dir, "timeline.json"), "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    emit_data_ts(name, cfg, timeline, total_frames)
    print(f"[{name}] TOTAL {data['total_sec']}s / {total_frames}+{TAIL_FRAMES}帧 -> {out_dir}")


async def main():
    names = sys.argv[1:] or list(VIDEOS)
    for n in names:
        await gen_video(n)


asyncio.run(main())
