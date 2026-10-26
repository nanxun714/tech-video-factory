# -*- coding: utf-8 -*-
# 2026-09-13 批量8条 TTS：词级时间戳(boundary=WordBoundary) + mutagen 实测 MP3 真实时长
# 词级锚点按 真实时长/词元数据末尾 的比例缩放，规避 rate 后 metadata 不缩放的坑。
# 用法: python gen_batch8.py [名字...]  不带参数=全部生成
import asyncio, edge_tts, json, os, sys
from mutagen.mp3 import MP3

FPS = 30
GAP = 0.18

VIDEOS = {
    # ============ 科普线 · 云健 +15% ============
    "qrcode": {
        "voice": "zh-CN-YunjianNeural", "rate": "+15%",
        "sentences": [
            "每天扫几十次二维码，那个黑白方块里，到底藏了什么？",
            "先说答案：绝大多数二维码里，藏的就是一条网址。",
            "二维码就像网址的快递包装，黑白格子是打包好的包裹，里面的内容，原封不动送到你手机上。",
            "扫码那一秒，手机先给方块拍张照，再按黑白格子还原成0和1，拼出里面的网址。",
            "所以扫码不是变魔术，只是拆快递，拆出来的网址，由浏览器替你打开。",
            "再看三个角上的大方块，那是定位标记，不管你正着扫、斜着扫，手机都先找到它们来对齐。",
            "二维码破损一点还能扫，因为它自带纠错，缺一小块也能算回来。",
            "下次扫码你就知道，你扫的不是码，是一条藏在格子里的网址。",
            "把这条视频存下来，下次有人问二维码是什么，直接甩给他。",
        ],
    },
    "wifi": {
        "voice": "zh-CN-YunjianNeural", "rate": "+15%",
        "sentences": [
            "Wi-Fi信号满格，网页却一直转圈，问题到底出在哪？",
            "先说结论：信号满格，只说明你连上了路由器，不代表外面的路是通的。",
            "从你的手机到网页，中间隔着三道关卡：路由器、运营商、DNS。",
            "第一关，路由器。它只管你家内部这一段，光猫断了线，信号照样满格，但你哪儿也去不了。",
            "第二关，运营商。数据出了小区，要靠运营商的路由器一跳一跳往外送，中间任何一跳断了，网页就卡住。",
            "第三关，DNS。浏览器不认识网址这种名字，要先查DNS这本电话本，问出IP才能出发，电话本坏了，一样打不开。",
            "所以满格只是第一跳的通行证，后面任何一环断了，页面都打不开。",
            "排查口诀：先重启路由器，再换个DNS试试，还不行，就找运营商。",
            "记住这张卡：满格不等于有网，路由器、运营商、DNS，一环一环查过去。",
        ],
    },
    "aihallucination": {
        "voice": "zh-CN-YunjianNeural", "rate": "+15%",
        "sentences": [
            "问AI一个问题，它张口就答，答得特别自信，结果全是编的。为什么？",
            "先说内核：AI不是在回忆知识，它是在猜下一个词。",
            "你打的每个字，对它来说都是一道填空题，它做的，是算出最像人话的下一个词。",
            "它不知道对错，只知道像不像，答案像真话，它就敢说。",
            "你问一本不存在的书，它不会说不知道，它会顺着语境，一本正经地编一本出来。",
            "这个现象叫幻觉，不是程序坏了，是它的工作原理本来就这样。",
            "所以AI的答案要当草稿看，重要信息，一定自己再核一遍。",
            "记住这句话：AI不负责对，它只负责像。",
            "结尾这张卡截图存好，下次有人问AI为什么会胡说八道，你就能讲明白。",
        ],
    },
    "token": {
        "voice": "zh-CN-YunjianNeural", "rate": "+15%",
        "sentences": [
            "你发给AI的一句话，在它眼里，根本不是汉字。",
            "AI看文字，先把句子切成一个个小块，一块一块地看，这些小块就叫token。",
            "一个token，可能是一个词，半个词，或者一个标点，汉字经常一两个字就切成一块。",
            "切完之后，每块token变成一串数字，AI眼里全是数字，没有文字。",
            "它的工作，就是根据前面的数字块，猜下一个最可能的数字块，一个接一个往外蹦。",
            "所以AI一个字一个字往外打，不是在打字，是它在逐块预测。",
            "这也解释了为什么按token收费，因为AI算的从来不是字数，是积木块的数量。",
            "记住：AI不认识字，它只认识积木块。",
            "这张卡截图存好，token这个面试高频词，你就拿下了。",
        ],
    },
    "phonelag": {
        "voice": "zh-CN-YunjianNeural", "rate": "+15%",
        "sentences": [
            "手机没摔也没进水，为什么越用越卡？凶手通常就这三个。",
            "第一个，缓存堆积。每个App都在偷偷存临时文件，日积月累，存储越挤越满，手机翻东西就越翻越慢。",
            "第二个，后台自启。你以为退出了，其实很多App在后台互相唤醒，内存被悄悄占满，切个App都要重新加载。",
            "第三个，电池老化。电池健康度下降后，系统会主动降频自保，性能直接打折，这是老手机卡的隐藏原因。",
            "对应三招：定期清缓存和大文件，关掉不常用App的自启权限，电池老化明显就去换电池，别急着换手机。",
            "记住这个口诀：卡了先查存储，再查后台，最后查电池。",
            "这三个杀手截图存好，手机再卡，你三分钟就能定位。",
        ],
    },
    # ============ 面试概念线 · 云健 +15% · 手绘大白风 ============
    "tcphandshake": {
        "voice": "zh-CN-YunjianNeural", "rate": "+15%",
        "sentences": [
            "TCP建立连接，为什么非要握三次手？两次明明更快，不行吗？",
            "把三次握手想成对暗号，你就再也忘不掉了。",
            "第一次，客户端先喊：我的暗号是x，你能听到吗？这一步，是在确认服务端的耳朵。",
            "第二次，服务端回话：听到了，我的暗号是y。这一步，是亮出它自己的暗号。",
            "第三次，客户端再喊一句：我也听到你了。服务端这才确认，自己的声音对方收到了。",
            "关键就在这：如果只有两次，服务端说完就当连接成功，但它根本不知道客户端收没收到，只能白白占着门干等。",
            "握三次，刚好让双方都确认同一件事：我说的话你收得到，你说的话我也收得到。",
            "所以三次不是仪式感，是双向确认的最少次数，少一次，就有一头在装聋。",
            "面试记住这一句：三次握手，握的是双向确认。",
            "这张速查卡截图存好，下次被问三次握手，先讲为什么，再讲过程。",
        ],
    },
    # ============ 排查剧情线 · 云希 +18% ============
    "portoccupied": {
        "voice": "zh-CN-YunxiNeural", "rate": "+18%",
        "sentences": [
            "程序一启动就报错：Address already in use，意思是，这扇门已经被占了。",
            "先说底：报错里的8080是端口号，一台电脑的门牌号就那么多，一个门同时只能住一个程序。",
            "谁占的门？一行命令揪出来。Windows用netstat -ano，找到占用8080的那一行，最后一列就是PID。",
            "Mac和Linux用lsof -i:8080，直接把占门的进程揪出来。",
            "拿到PID，先查身份：Windows用tasklist，Mac和Linux用ps，看看占门的到底是谁。",
            "是自己忘了关的旧程序，直接杀掉；是系统重要进程，就改个端口躲开。",
            "口诀记好：报错先看端口号，命令找PID，确认身份再动手，别乱杀。",
            "这张排查卡截图存好，下次再遇到Address already in use，一分钟解决。",
        ],
    },
    "cpu100": {
        "voice": "zh-CN-YunxiNeural", "rate": "+18%",
        "sentences": [
            "服务器卡成幻灯片，一查CPU飙到100%，别急着重启，凶手就藏在这四层里。",
            "第一层，top。按CPU排序，先锁定最吃CPU的那几个进程，别大海捞针。",
            "第二层，看进程。揪出可疑进程，是自己在空转，还是某个任务在疯狂重复跑。",
            "第三层，看线程。用top -H进入线程视角，有些进程整体不高，里面某根线程却跑满了。",
            "第四层，看日志。进程在忙什么，日志里一定有痕迹，死循环、疯狂重试，全都会留脚印。",
            "四步下来，从进程到线程再到日志，问题基本藏不住。",
            "漏斗口诀记好：top锁进程，线程往下钻，日志找动机。",
            "这张四层排查卡截图存好，服务器再飙高，你就有章法了。",
        ],
    },
}


def pick(d, *keys):
    for k in keys:
        if k in d:
            return d[k]
    return None


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
            if os.path.getsize(audio_path) > 1000:
                # mutagen 实测真实时长（权威），词级锚点等比缩放对齐到真实末尾
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


async def gen_video(name):
    cfg = VIDEOS[name]
    voice, rate = cfg["voice"], cfg["rate"]
    out_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), f"{name}-tts")
    os.makedirs(out_dir, exist_ok=True)
    results = []
    for i, s in enumerate(cfg["sentences"]):
        r = await synth_one(out_dir, i, s, voice, rate)
        r["text"] = s
        r["index"] = i + 1
        results.append(r)
        print(f"[{name}] s{i+1:02d} dur={r['dur_sec']:.2f}s scale={r['scale']}")
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
    data = {"fps": FPS, "voice": voice, "rate": rate,
            "total_sec": round(cursor, 3), "total_frames": round(cursor * FPS),
            "sentences": timeline}
    with open(os.path.join(out_dir, "timeline.json"), "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    print(f"[{name}] TOTAL {data['total_sec']}s / {data['total_frames']} frames -> {out_dir}")
    return data


async def main():
    names = sys.argv[1:] or list(VIDEOS)
    # 并行合成：句子间无依赖，3 路并发把 26 分钟压到 ~8 分钟（edge-tts 偶发限流靠重试兜底）
    sem = asyncio.Semaphore(3)

    async def worker(n):
        async with sem:
            await gen_video(n)

    await asyncio.gather(*(worker(n) for n in names))


asyncio.run(main())
