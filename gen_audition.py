# -*- coding: utf-8 -*-
"""生成未用过的 edge-tts 中文声音试听样本，存到桌面声音对比目录"""
import asyncio, os
import edge_tts

OUT = r"C:\Users\27119\Desktop\声音对比"
TEXT = "电脑一卡死，网友的第一句话永远是：重启试试。"
JOBS = [
    ("4-晓伊-女声-活泼年轻.mp3", "zh-CN-XiaoyiNeural", "+4%"),
    ("5-云夏-男声-少年音.mp3", "zh-CN-YunxiaNeural", "+0%"),
    ("6-云扬-男声-新闻主播风.mp3", "zh-CN-YunyangNeural", "+0%"),
    ("7-小北-女声-东北话.mp3", "zh-CN-liaoning-XiaobeiNeural", "+0%"),
    ("8-小妮-女声-陕西话.mp3", "zh-CN-shaanxi-XiaoniNeural", "+0%"),
]

async def one(fname, voice, rate):
    out = os.path.join(OUT, fname)
    for attempt in range(5):
        try:
            comm = edge_tts.Communicate(TEXT, voice, rate=rate)
            with open(out, "wb") as f:
                async for chunk in comm.stream():
                    if chunk.get("type") == "audio":
                        f.write(chunk["data"])
            if os.path.getsize(out) > 3000:
                print("OK ", fname)
                return
        except Exception as e:
            print(f"  retry {fname}: {type(e).__name__}")
            await asyncio.sleep(2)
    print("FAIL", fname)

async def main():
    for job in JOBS:
        await one(*job)

asyncio.run(main())
