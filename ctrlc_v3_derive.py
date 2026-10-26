# -*- coding: utf-8 -*-
"""从 ctrlc-tts-v3 timeline + subs 推导组件全部锚点常量。"""
import json, re

tl = json.load(open('public/audio/ctrlc-tts-v3/timeline.json', encoding='utf-8'))
S = {s['index']: s for s in tl['sentences']}
sub_re = re.compile(r'\{s: (\d+), e: (\d+), t: "([^"]+)"\}')
subs = [(int(a), int(b), t) for a, b, t in
        sub_re.findall(open('ctrlc-v3-subs.tsx', encoding='utf-8').read())]
P = {}
for a, b, t in subs:
    P[t] = (a, b)

def ph(t):
    return P[t][0]

out = {}
out['fps'] = tl['fps']
out['total'] = tl['total_frames']
# 句窗口
out['voiceLines'] = [(i, S[i]['start_frame'], S[i]['end_frame']) for i in sorted(S)]
# 场景边界：S1=0，其后=对应句 start-3；S8 覆盖 s08+s09；S9=s10start-3；DUR=s10end+90
s2, s3, s4, s5, s6, s7, s8, s9, s10 = (S[i]['start_frame'] for i in range(2, 11))
out['scenes'] = [0, s2-3, s3-3, s4-3, s5-3, s6-3, s7-3, s8-3, s10-3, S[10]['end_frame']+90]
# 场景内句位（相对句起点）
out['copyAt'] = ph('系统会把内容复制一份') - s3
out['reveal'] = ph('放进一个叫剪贴板的地方') - s3
out['memAt'] = ph('内存里的一块黑板') - s4
out['moveTo'] = ph('就是把黑板上的内容') - s5
out['ghosts'] = max(50, ph('再抄到你要的位置') - s5 - 20)
out['boardAt'] = ph('它也会把内容放进黑板') - s6
out['moveAt'] = ph('但原来的内容会被移走') - s6
out['coverAt'] = ph('旧的就被覆盖了') - s7
out['iconAt'] = s9 - s8
out['wipeAt'] = ph('而内存断电后') - s8
out['line2'] = ph('黑板在内存里') - s10
# 音效绝对帧
out['sfx'] = {'click1': s3, 'click2': s6, 'pop': ph('旧的就被覆盖了'), 'success': ph('黑板在内存里')}
out['bed_outro'] = {'from': S[10]['end_frame'], 'dur': 90}
# qc_auto 锚点（绝对帧）
sc = out['scenes']
out['qc_anchors'] = [60, 85,
    sc[1]+26, sc[1]+46,
    s3+out['copyAt']+25, s3+out['reveal']+2,
    s4+out['memAt']+1, s4+out['memAt']+26,
    s5+out['moveTo']+3, s5+out['ghosts']+5, s5+out['ghosts']+48,
    s6+out['boardAt']+1, s6+out['moveAt']+4, s6+out['moveAt']+29,
    s7+out['coverAt']+3,
    s8+out['iconAt']+3, s8+out['wipeAt']+14, S[9]['end_frame']-6,
    s10+11, s10+out['line2']+3, S[10]['end_frame']+21]
json.dump(out, open('ctrlc-v3-constants.json', 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
print(json.dumps(out, ensure_ascii=False))
