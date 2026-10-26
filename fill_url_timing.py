# -*- coding: utf-8 -*-
# 一次性：把 url-tts 真实时间线回填 UrlJourneySketch.tsx
import io, re

p = "src/UrlJourneySketch.tsx"
s = io.open(p, encoding="utf-8").read()
n = 0
miss = []

def rep(a, b):
    global s, n
    if a in s:
        s = s.replace(a, b, 1); n += 1
    else:
        miss.append(a[:70])

rep("export const DUR = 1720;", "export const DUR = 1780;")

real_subs = '''const subs: Sub[] = [
  {s: 3, e: 77, t: "在地址栏敲下网址 按下回车", kw: "回车", kc: ORANGE_KW},
  {s: 77, e: 142, t: "到页面出现 只要一秒", kw: "一秒", kc: BLUE_KW},
  {s: 142, e: 203, t: "这一秒里 你的请求", kw: "请求", kc: ORANGE_KW},
  {s: 203, e: 237, t: "出门跑了一圈", kw: "跑了一圈", kc: ORANGE_KW},
  {s: 242, e: 299, t: "第一步 DNS解析", kw: "DNS", kc: ORANGE_KW},
  {s: 299, e: 377, t: "浏览器拿着网址问DNS服务器", kw: "DNS服务器", kc: BLUE_KW},
  {s: 377, e: 422, t: "这个名字住在哪", kw: "住在哪", kc: ORANGE_KW},
  {s: 422, e: 467, t: "它就像互联网的通讯录", kw: "通讯录", kc: BLUE_KW},
  {s: 467, e: 517, t: "把域名翻译成IP地址", kw: "IP地址", kc: ORANGE_KW},
  {s: 522, e: 588, t: "第二步 建立TCP连接", kw: "TCP", kc: ORANGE_KW},
  {s: 588, e: 653, t: "浏览器和服务器先打电话确认", kw: "打电话", kc: BLUE_KW},
  {s: 653, e: 718, t: "听得到吗 听到了", kw: "听得到", kc: ORANGE_KW},
  {s: 718, e: 779, t: "这套握手 上一期刚讲过", kw: "上一期", kc: BLUE_KW},
  {s: 784, e: 866, t: "第三步 发送HTTP请求", kw: "HTTP", kc: ORANGE_KW},
  {s: 866, e: 931, t: "浏览器说 我要这个页面", kw: "我要这个页面", kc: BLUE_KW},
  {s: 931, e: 968, t: "服务器找到文件", kw: "找到文件", kc: ORANGE_KW},
  {s: 968, e: 1025, t: "把HTML原路发了回来", kw: "HTML", kc: BLUE_KW},
  {s: 1030, e: 1096, t: "最后一步 浏览器渲染", kw: "渲染", kc: ORANGE_KW},
  {s: 1096, e: 1134, t: "HTML搭骨架", kw: "HTML", kc: BLUE_KW},
  {s: 1134, e: 1171, t: "CSS上皮肤", kw: "CSS", kc: ORANGE_KW},
  {s: 1171, e: 1215, t: "JavaScript管动作", kw: "JavaScript", kc: BLUE_KW},
  {s: 1215, e: 1261, t: "页面这才出现在你眼前", kw: "眼前", kc: ORANGE_KW},
  {s: 1266, e: 1299, t: "整个流程就是", kw: "流程", kc: ORANGE_KW},
  {s: 1299, e: 1373, t: "DNS查地址 TCP建连接", kw: "TCP", kc: BLUE_KW},
  {s: 1373, e: 1444, t: "HTTP拿页面 浏览器做渲染", kw: "渲染", kc: ORANGE_KW},
  {s: 1449, e: 1515, t: "下次按下回车 你就知道", kw: "回车", kc: ORANGE_KW},
  {s: 1515, e: 1546, t: "这一秒的背后", kw: "背后", kc: BLUE_KW},
  {s: 1546, e: 1588, t: "是一场毫秒级的接力赛", kw: "接力赛", kc: ORANGE_KW},
  {s: 1593, e: 1687, t: "关注全栈小秋 把计算机基础讲明白", kw: "全栈小秋", kc: ORANGE_KW},
  {s: 1687, e: 1745, t: "还想听什么 评论区告诉我", kw: "评论区", kc: BLUE_KW},
];'''
s = re.sub(r"const subs: Sub\[\] = \[.*?\n\];", lambda m: real_subs, s, count=1, flags=re.DOTALL); n += 1

rep("const SENT = [0, 146, 398, 582, 758, 958, 1082, 1216];",
    "const SENT = [0, 239, 519, 781, 1027, 1263, 1447, 1591];")

vl_old = re.search(r"const voiceLines = \[.*?\n\];", s, re.DOTALL).group(0)
vl_new = '''const voiceLines = [
  {index: 1, audio: "s01.mp3", start: 0, end: 234},
  {index: 2, audio: "s02.mp3", start: 236, end: 514},
  {index: 3, audio: "s03.mp3", start: 516, end: 776},
  {index: 4, audio: "s04.mp3", start: 778, end: 1022},
  {index: 5, audio: "s05.mp3", start: 1024, end: 1258},
  {index: 6, audio: "s06.mp3", start: 1260, end: 1441},
  {index: 7, audio: "s07.mp3", start: 1443, end: 1585},
  {index: 8, audio: "s08.mp3", start: 1587, end: 1745},
];'''
s = s.replace(vl_old, vl_new, 1); n += 1

# P1
rep('opacity: prog(f, 60, 12), whiteSpace: "nowrap",\n      }}>请求出门了！</div>',
    'opacity: prog(f, 200, 12), whiteSpace: "nowrap",\n      }}>请求出门了！</div>')
# P2
rep('<Bubble f={f} x={150} y={330} w={380} h={110} text="这个名字住在哪？" ts={40} delay={54} />',
    '<Bubble f={f} x={150} y={330} w={380} h={110} text="这个名字住在哪？" ts={40} delay={132} />')
rep('<WBox f={f} x={760} y={280} w={640} h={430} fill="rgba(255,255,255,0.94)" sw={6.5} seed={7} delay={14} />',
    '<WBox f={f} x={760} y={280} w={640} h={430} fill="rgba(255,255,255,0.94)" sw={6.5} seed={7} delay={18} />')
rep('letterSpacing: 6, opacity: prog(f, 22, 10),\n      }}>DNS 通讯录</div>',
    'letterSpacing: 6, opacity: prog(f, 96, 10),\n      }}>DNS 通讯录</div>')
rep('opacity: prog(f, 36 + i * 8, 8), whiteSpace: "nowrap"',
    'opacity: prog(f, 110 + i * 8, 8), whiteSpace: "nowrap"')
rep('<WCol f={f} cx={1270} cy={345} rx={120} ry={30} color={YEL_F} seed={4} delay={62} />',
    '<WCol f={f} cx={1270} cy={345} rx={120} ry={30} color={YEL_F} seed={4} delay={200} />')
rep('opacity: prog(f, 58, 8), whiteSpace: "nowrap",\n      }}>142.250.71.14</div>',
    'opacity: prog(f, 204, 8), whiteSpace: "nowrap",\n      }}>142.250.71.14</div>')
rep('color: SUBC, opacity: prog(f, 44 + 8, 8), whiteSpace: "nowrap",\n      }}>17.253.144.10</div>',
    'color: SUBC, opacity: prog(f, 132, 8), whiteSpace: "nowrap",\n      }}>17.253.144.10</div>')
rep('<Arrow f={f} x={370} y={330} len={330} color={ORANGE_E} sw={7} delay={72} bend={-20} />',
    '<Arrow f={f} x={370} y={330} len={330} color={ORANGE_E} sw={7} delay={214} bend={-20} />')
rep('<WCol f={f} cx={960} cy={840} rx={420} ry={54} color={ORANGE_F} seed={3} delay={86} />',
    '<WCol f={f} cx={960} cy={840} rx={420} ry={54} color={ORANGE_F} seed={3} delay={224} />')
rep('opacity: prog(f, 92, 12),\n      }}>域名 → IP 地址</div>',
    'opacity: prog(f, 230, 12),\n      }}>域名 → IP 地址</div>')
# P3
rep('<Bubble f={f} x={470} y={280} w={330} h={104} text="听得到吗？" ts={40} delay={68} />',
    '<Bubble f={f} x={470} y={280} w={330} h={104} text="听得到吗？" ts={40} delay={136} />')
rep('<Bubble f={f} x={1120} y={280} w={330} h={104} text="听得到！" ts={40} delay={104} tail="br"',
    '<Bubble f={f} x={1120} y={280} w={330} h={104} text="听得到！" ts={40} delay={172} tail="br"')
rep('<Arrow f={f} x={560} y={520} len={330} color={BLUE_E} sw={6.5} delay={60} bend={-18} />',
    '<Arrow f={f} x={560} y={520} len={330} color={BLUE_E} sw={6.5} delay={128} bend={-18} />')
rep('<Arrow f={f} x={1360} y={586} len={330} color={GREEN_E} sw={6.5} delay={96} bend={-18} flip />',
    '<Arrow f={f} x={1360} y={586} len={330} color={GREEN_E} sw={6.5} delay={164} bend={-18} flip />')
rep('<WCol f={f} cx={960} cy={700} rx={300} ry={48} color={GREEN_F} seed={6} delay={126} />',
    '<WCol f={f} cx={960} cy={700} rx={300} ry={48} color={GREEN_F} seed={6} delay={204} />')
rep('opacity: prog(f, 132, 12),\n      }}>连接建立！</div>',
    'opacity: prog(f, 210, 12),\n      }}>连接建立！</div>')
rep('rot={-2} delay={146} ts={34} color={ORANGE_E} />',
    'rot={-2} delay={210} ts={34} color={ORANGE_E} />')
rep('<Bulb f={f} x={420} y={840} s={1.15} delay={150} />',
    '<Bulb f={f} x={420} y={840} s={1.15} delay={218} />')
# P4
rep('<Arrow f={f} x={590} y={430} len={740} color={BLUE_E} sw={7} delay={40} bend={-30} />',
    '<Arrow f={f} x={590} y={430} len={740} color={BLUE_E} sw={7} delay={44} bend={-30} />')
rep('<Bubble f={f} x={800} y={230} w={360} h={100} text="HTTP：我要这个页面" ts={36} delay={58} />',
    '<Bubble f={f} x={800} y={230} w={360} h={100} text="HTTP：我要这个页面" ts={36} delay={88} />')
rep('const t1 = interpolate(f, [66, 92], [0, 1], clamp);',
    'const t1 = interpolate(f, [90, 116], [0, 1], clamp);')
rep('<Arrow f={f} x={1330} y={560} len={740} color={ORANGE_E} sw={7} delay={112} bend={-30} flip />',
    '<Arrow f={f} x={1330} y={560} len={740} color={ORANGE_E} sw={7} delay={190} bend={-30} flip />')
rep('const t2 = interpolate(f, [128, 158], [0, 1], clamp);',
    'const t2 = interpolate(f, [192, 220], [0, 1], clamp);')
rep('<Bubble f={f} x={760} y={640} w={400} h={100} text="HTML 原路发回来" ts={36} delay={144} tail="br"',
    '<Bubble f={f} x={760} y={640} w={400} h={100} text="HTML 原路发回来" ts={36} delay={218} tail="br"')
rep('opacity: prog(f, 160, 12),\n      }}>一去一回　页面数据就拿到了</div>',
    'opacity: prog(f, 214, 12),\n      }}>一去一回　页面数据就拿到了</div>')
# P5
rep('<Node f={f} x={110} y={300} w={380} title={<MixText text="HTML" />} sub="搭骨架" color={BLUE_F} delay={4} />',
    '<Node f={f} x={110} y={300} w={380} title={<MixText text="HTML" />} sub="搭骨架" color={BLUE_F} delay={66} />')
rep('<Arrow f={f} x={500} y={360} len={130} color={BLUE_E} sw={6.5} delay={16} />',
    '<Arrow f={f} x={500} y={360} len={130} color={BLUE_E} sw={6.5} delay={80} />')
rep('<Node f={f} x={640} y={300} w={340} title={<MixText text="CSS" />} sub="上皮肤" color={ORANGE_F} delay={26} />',
    '<Node f={f} x={640} y={300} w={340} title={<MixText text="CSS" />} sub="上皮肤" color={ORANGE_F} delay={104} />')
rep('<Arrow f={f} x={990} y={360} len={130} color={ORANGE_E} sw={6.5} delay={40} />',
    '<Arrow f={f} x={990} y={360} len={130} color={ORANGE_E} sw={6.5} delay={118} />')
rep('<Node f={f} x={1130} y={300} w={420} title={<MixText text="JavaScript" />} sub="管动作" color={GREEN_F} delay={50} />',
    '<Node f={f} x={1130} y={300} w={420} title={<MixText text="JavaScript" />} sub="管动作" color={GREEN_F} delay={142} />')
rep('<WBox f={f} x={520} y={560} w={880} h={280} fill="rgba(255,255,255,0.94)" sw={6} seed={8} delay={64} />',
    '<WBox f={f} x={520} y={560} w={880} h={280} fill="rgba(255,255,255,0.94)" sw={6} seed={8} delay={100} />')
rep('<WCol f={f} cx={760} cy={660} rx={170} ry={52} color={BLUE_F} seed={2} delay={78} />',
    '<WCol f={f} cx={760} cy={660} rx={170} ry={52} color={BLUE_F} seed={2} delay={150} />')
rep('<WCol f={f} cx={1130} cy={660} rx={170} ry={52} color={ORANGE_F} seed={5} delay={88} />',
    '<WCol f={f} cx={1130} cy={660} rx={170} ry={52} color={ORANGE_F} seed={5} delay={162} />')
rep('<WCol f={f} cx={945} cy={760} rx={280} ry={40} color={GREEN_F} seed={9} delay={98} />',
    '<WCol f={f} cx={945} cy={760} rx={280} ry={40} color={GREEN_F} seed={9} delay={174} />')
rep('opacity: prog(f, 108, 12),\n      }}>页面出现在你眼前</div>',
    'opacity: prog(f, 216, 12),\n      }}>页面出现在你眼前</div>')
rep('<Bulb f={f} x={1470} y={560} s={1.2} delay={112} />',
    '<Bulb f={f} x={1470} y={560} s={1.2} delay={222} />')
# P6
rep('{t: "DNS 查地址", d: 2, c: BLUE_E},', '{t: "DNS 查地址", d: 30, c: BLUE_E},')
rep('{t: "TCP 建连接", d: 18, c: ORANGE_E},', '{t: "TCP 建连接", d: 68, c: ORANGE_E},')
rep('{t: "HTTP 拿页面", d: 34, c: GREEN_E},', '{t: "HTTP 拿页面", d: 104, c: GREEN_E},')
rep('<div style={{opacity: prog(f, 50, 12)}}>', '<div style={{opacity: prog(f, 150, 12)}}>')
rep('const t = interpolate(f, [96, 132], [0, 1], clamp);',
    'const t = interpolate(f, [40, 170], [0, 1], clamp);')
rep('<WCol f={f} cx={960} cy={720} rx={560} ry={62} color={YEL_F} seed={3} delay={60} />',
    '<WCol f={f} cx={960} cy={720} rx={560} ry={62} color={YEL_F} seed={3} delay={150} />')
rep('}}>查地址 建连接 拿页面 做渲染</div>', '}}>一次点击 四步接力</div>')
rep('opacity: prog(f, 68, 12), whiteSpace: "nowrap",\n      }}>一次点击 四步接力</div>',
    'opacity: prog(f, 156, 12), whiteSpace: "nowrap",\n      }}>一次点击 四步接力</div>')
rep('<Stick f={f} x={1690} y={880} s={1.1} delay={80} color={GREEN_E} pose="cheer" />',
    '<Stick f={f} x={1690} y={880} s={1.1} delay={148} color={GREEN_E} pose="cheer" />')
# P7
rep('opacity: prog(f, 0, 12),\n      }}>下次按下回车 你就知道</div>',
    'opacity: prog(f, 2, 12),\n      }}>下次按下回车 你就知道</div>')
rep('opacity: prog(f, 14, 14), whiteSpace: "nowrap", transform: "rotate(-0.8deg)",\n      }}>这一秒的背后</div>',
    'opacity: prog(f, 76, 14), whiteSpace: "nowrap", transform: "rotate(-0.8deg)",\n      }}>这一秒的背后</div>')
rep('opacity: prog(f, 34, 14), whiteSpace: "nowrap", transform: "rotate(-0.8deg)",\n      }}>是一场毫秒级的接力赛</div>',
    'opacity: prog(f, 120, 14), whiteSpace: "nowrap", transform: "rotate(-0.8deg)",\n      }}>是一场毫秒级的接力赛</div>')
rep('<Squiggle f={f} x={4} y={11} w={892} delay={52} />',
    '<Squiggle f={f} x={4} y={11} w={892} delay={132} />')
rep('<Stick f={f} x={220} y={860} s={1.15} delay={60} color={BLUE_E} pose="cheer" />',
    '<Stick f={f} x={220} y={860} s={1.15} delay={132} color={BLUE_E} pose="cheer" />')
rep('<Bulb f={f} x={1700} y={840} s={1.3} delay={66} />',
    '<Bulb f={f} x={1700} y={840} s={1.3} delay={136} />')
# P8
rep('<Bubble f={f} x={610} y={640} w={700} h={120} text="还想听什么？评论区告诉我" ts={46} delay={78} />',
    '<Bubble f={f} x={610} y={640} w={700} h={120} text="还想听什么？评论区告诉我" ts={46} delay={96} />')
rep('<Bulb f={f} x={420} y={700} s={1.25} delay={88} />',
    '<Bulb f={f} x={420} y={700} s={1.25} delay={104} />')
rep('<Bulb f={f} x={1500} y={700} s={1.25} delay={94} />',
    '<Bulb f={f} x={1500} y={700} s={1.25} delay={110} />')
rep('opacity: 0.75 * prog(f, 100, 10),',
    'opacity: 0.75 * prog(f, 116, 10),')
# SFX
rep('<Sequence from={20} durationInFrames={24}>\n          <Audio src={staticFile("audio/sfx/whoosh.wav")} volume={0.22} />',
    '<Sequence from={205} durationInFrames={24}>\n          <Audio src={staticFile("audio/sfx/whoosh.wav")} volume={0.22} />')
rep('<Sequence from={110} durationInFrames={20}>\n          <Audio src={staticFile("audio/sfx/pop.wav")} volume={0.26} />',
    '<Sequence from={115} durationInFrames={20}>\n          <Audio src={staticFile("audio/sfx/pop.wav")} volume={0.26} />')
rep('<Sequence from={204} durationInFrames={20}>\n          <Audio src={staticFile("audio/sfx/pop.wav")} volume={0.26} />',
    '<Sequence from={100} durationInFrames={20}>\n          <Audio src={staticFile("audio/sfx/pop.wav")} volume={0.26} />')
rep('<Sequence from={352} durationInFrames={40}>\n          <Audio src={staticFile("audio/sfx/warm3.wav")} volume={0.2} />',
    '<Sequence from={440} durationInFrames={40}>\n          <Audio src={staticFile("audio/sfx/warm3.wav")} volume={0.2} />')
rep('<Sequence from={452} durationInFrames={24}>\n          <Audio src={staticFile("audio/sfx/whoosh.wav")} volume={0.18} />',
    '<Sequence from={647} durationInFrames={24}>\n          <Audio src={staticFile("audio/sfx/whoosh.wav")} volume={0.18} />')
rep('<Sequence from={500} durationInFrames={20}>\n          <Audio src={staticFile("audio/sfx/pop.wav")} volume={0.24} />',
    '<Sequence from={655} durationInFrames={20}>\n          <Audio src={staticFile("audio/sfx/pop.wav")} volume={0.24} />')
rep('<Sequence from={534} durationInFrames={20}>\n          <Audio src={staticFile("audio/sfx/pop.wav")} volume={0.24} />',
    '<Sequence from={691} durationInFrames={20}>\n          <Audio src={staticFile("audio/sfx/pop.wav")} volume={0.24} />')
rep('<Sequence from={640} durationInFrames={24}>\n          <Audio src={staticFile("audio/sfx/fly3.wav")} volume={0.16} />',
    '<Sequence from={871} durationInFrames={24}>\n          <Audio src={staticFile("audio/sfx/fly3.wav")} volume={0.16} />')
rep('<Sequence from={712} durationInFrames={24}>\n          <Audio src={staticFile("audio/sfx/fly3.wav")} volume={0.16} />',
    '<Sequence from={973} durationInFrames={24}>\n          <Audio src={staticFile("audio/sfx/fly3.wav")} volume={0.16} />')
rep('<Sequence from={920} durationInFrames={40}>\n          <Audio src={staticFile("audio/sfx/success.wav")} volume={0.24} />',
    '<Sequence from={1201} durationInFrames={40}>\n          <Audio src={staticFile("audio/sfx/success.wav")} volume={0.24} />')
rep('{[1218, 1232, 1246, 1260].map((t) => (',
    '{[1599, 1613, 1627, 1641].map((t) => (')
rep('<Sequence from={1296} durationInFrames={40}>\n          <Audio src={staticFile("audio/sfx/warm3.wav")} volume={0.2} />',
    '<Sequence from={1687} durationInFrames={40}>\n          <Audio src={staticFile("audio/sfx/warm3.wav")} volume={0.2} />')

io.open(p, "w", encoding="utf-8", newline="\n").write(s)
print("applied", n)
for m in miss:
    print("MISS:", m)
