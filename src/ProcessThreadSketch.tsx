import {Audio} from "@remotion/media";
import {AbsoluteFill, interpolate, Sequence, staticFile, useCurrentFrame} from "remotion";

const PAPER = "#fdfcf7";
const INK = "#353535";
const SUBC = "#77736d";
const RED = "#c94f4f";
const BLUE = "#5b87ad";
const GREEN = "#4e9464";
const ORANGE = "#c97a2e";
const BLUE_F = "rgba(139,178,216,0.34)";
const GREEN_F = "rgba(140,200,150,0.34)";
const YEL_F = "rgba(242,202,92,0.5)";
const ORANGE_F = "rgba(242,163,94,0.38)";
const T_FONT = "'STXingkai','华文行楷','KaiTi','楷体',serif";
const B_FONT = "'STKaiti','KaiTi','楷体','Microsoft YaHei',serif";
const W = 1920;
const H = 1080;
const DUR = 2484;

const voiceLines = [
  {audio: "s01.mp3", start: 0, end: 116}, {audio: "s02.mp3", start: 122, end: 206},
  {audio: "s03.mp3", start: 211, end: 325}, {audio: "s04.mp3", start: 331, end: 428},
  {audio: "s05.mp3", start: 434, end: 583}, {audio: "s06.mp3", start: 588, end: 783},
  {audio: "s07.mp3", start: 789, end: 933}, {audio: "s08.mp3", start: 938, end: 1108},
  {audio: "s09.mp3", start: 1113, end: 1308}, {audio: "s10.mp3", start: 1314, end: 1485},
  {audio: "s11.mp3", start: 1490, end: 1587}, {audio: "s12.mp3", start: 1592, end: 1773},
  {audio: "s13.mp3", start: 1779, end: 2048}, {audio: "s14.mp3", start: 2053, end: 2208},
  {audio: "s15.mp3", start: 2214, end: 2484},
];

type Sub = {s: number; e: number; t: string};
const subs: Sub[] = [
  {s: 0, e: 58, t: "面试问进程和线程"}, {s: 58, e: 116, t: "你只会背最小单位"},
  {s: 122, e: 164, t: "面试官很可能"}, {s: 164, e: 206, t: "直接把你刷了"},
  {s: 211, e: 272, t: "因为他真正想听的"}, {s: 272, e: 325, t: "根本不是死背书"},
  {s: 331, e: 376, t: "而是看你懂不懂"}, {s: 376, e: 428, t: "真实开发里的问题"},
  {s: 434, e: 479, t: "比如软件卡死"}, {s: 479, e: 501, t: "点不动"}, {s: 501, e: 583, t: "背后可能就是线程阻塞了"},
  {s: 588, e: 655, t: "记住这个超好懂的类比"}, {s: 655, e: 709, t: "进程就是一套房子"}, {s: 709, e: 783, t: "线程就是房子里干活的人"},
  {s: 789, e: 829, t: "拿微信举例"}, {s: 829, e: 933, t: "整个微信可以理解成一个进程"},
  {s: 938, e: 1000, t: "收消息是一条线程"}, {s: 1000, e: 1031, t: "刷朋友圈"}, {s: 1031, e: 1108, t: "加载图片是另外的线程"},
  {s: 1113, e: 1203, t: "哪怕加载图片的线程卡住了"}, {s: 1203, e: 1263, t: "收消息的线程依然"}, {s: 1263, e: 1308, t: "可以正常运行"},
  {s: 1314, e: 1394, t: "微信能正常收消息"}, {s: 1394, e: 1485, t: "朋友圈却一直在转圈"},
  {s: 1490, e: 1557, t: "所以面试千万别只背"}, {s: 1557, e: 1587, t: "空话定义"},
  {s: 1592, e: 1632, t: "你要能讲清楚"}, {s: 1632, e: 1699, t: "为什么一个线程出问题"}, {s: 1699, e: 1773, t: "其他任务却还能继续运行"},
  {s: 1779, e: 1839, t: "最后记住核心区别"}, {s: 1839, e: 1899, t: "进程负责资源隔离"}, {s: 1899, e: 1959, t: "线程负责执行任务"}, {s: 1959, e: 2048, t: "一个进程可以包含多条线程"},
  {s: 2053, e: 2119, t: "正在准备编程面试的"}, {s: 2119, e: 2156, t: "先收藏这条"}, {s: 2156, e: 2208, t: "面试前再看一遍"},
  {s: 2214, e: 2253, t: "觉得讲明白了"}, {s: 2253, e: 2298, t: "点个赞支持一下"}, {s: 2298, e: 2317, t: "关注我"},
  {s: 2317, e: 2413, t: "操作系统 Linux Docker"}, {s: 2413, e: 2484, t: "面试高频知识点持续更新"},
];

const clamp = {extrapolateLeft: "clamp", extrapolateRight: "clamp"} as const;
const prog = (f: number, delay: number, dur = 14) => interpolate(f, [delay, delay + dur], [0, 1], clamp);
const wob = (n: number, amp = 2.5) => Math.sin(n * 4.7 + 1.2) * amp;
const ease = (x: number) => 1 - Math.pow(1 - x, 3);

const Draw: React.FC<{f: number; d: string; delay?: number; dur?: number; stroke?: string; sw?: number; fill?: string; op?: number}> = ({f, d, delay = 0, dur = 14, stroke = INK, sw = 5, fill = "none", op = 1}) => {
  const p = prog(f, delay, dur);
  if (p <= 0) return null;
  return <svg width={W} height={H} style={{position: "absolute", inset: 0, overflow: "visible", pointerEvents: "none"}}><path d={d} pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - p} stroke={stroke} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" fill={fill} fillOpacity={fill === "none" ? 0 : p * 0.55} opacity={op} /></svg>;
};

const Box: React.FC<{f: number; x: number; y: number; w: number; h: number; delay?: number; fill?: string; stroke?: string; sw?: number}> = ({f, x, y, w, h, delay = 0, fill = "none", stroke = INK, sw = 5}) => <Draw f={f} delay={delay} d={`M ${x + wob(x)} ${y} Q ${x + w / 2} ${y - 3} ${x + w} ${y + wob(y)} L ${x + w - 2} ${y + h} Q ${x + w / 2} ${y + h + 3} ${x} ${y + h - 2} Z`} stroke={stroke} sw={sw} fill={fill} />;

const Text: React.FC<{f: number; text: string; x?: number; y: number; w?: number; size?: number; delay?: number; color?: string; family?: string; weight?: number; align?: "center" | "left"}> = ({f, text, x = 0, y, w = W, size = 42, delay = 0, color = INK, family = B_FONT, weight = 700, align = "center"}) => {
  const p = prog(f, delay, 12);
  if (p <= 0) return null;
  return <div style={{position: "absolute", left: x, top: y, width: w, textAlign: align, color, fontFamily: family, fontSize: size, fontWeight: weight, letterSpacing: 3, opacity: p, transform: `translateY(${(1 - ease(p)) * 15}px)`, whiteSpace: "nowrap"}}>{text}</div>;
};

const Cloud: React.FC<{f: number; x: number; y: number; w: number; h: number; color: string; delay?: number}> = ({f, x, y, w, h, color, delay = 0}) => {
  const p = prog(f, delay, 12); if (p <= 0) return null;
  return <svg width={W} height={H} style={{position: "absolute", inset: 0, overflow: "visible", pointerEvents: "none"}}><path d={`M ${x + 20} ${y + h * .6} Q ${x - 5} ${y + h * .35} ${x + w * .15} ${y + h * .2} Q ${x + w * .35} ${y - 20} ${x + w * .53} ${y + h * .18} Q ${x + w * .83} ${y - 6} ${x + w - 4} ${y + h * .46} Q ${x + w * .92} ${y + h} ${x + w * .68} ${y + h} L ${x + w * .22} ${y + h} Q ${x + 35} ${y + h} ${x + 20} ${y + h * .6} Z`} fill={color} opacity={p} /></svg>;
};

const Stick: React.FC<{f: number; x: number; y: number; delay?: number; color?: string; pose?: "work" | "point" | "sad"}> = ({f, x, y, delay = 0, color = INK, pose = "work"}) => {
  const arm = pose === "point" ? "M 0 -18 L 52 -62 M 0 -18 L -34 15" : pose === "sad" ? "M 0 -18 L 38 12 M 0 -18 L -38 12" : "M 0 -18 L 45 2 M 0 -18 L -40 0";
  const p = prog(f, delay, 14); if (p <= 0) return null;
  return <svg width={W} height={H} style={{position:"absolute",inset:0,overflow:"visible",pointerEvents:"none"}}><g transform={`translate(${x},${y}) scale(1.15)`} opacity={p} fill="none" stroke={color} strokeWidth={7} strokeLinecap="round"><circle cx="0" cy="-75" r="27"/><path d="M 0 -48 L 0 42 M 0 42 L -31 108 M 0 42 L 31 108"/><path d={arm}/><circle cx="-9" cy="-80" r="2.8" fill={color}/><circle cx="9" cy="-80" r="2.8" fill={color}/><path d="M -10 -66 Q 0 -59 10 -66" strokeWidth="4"/></g></svg>;
};

const House: React.FC<{f: number; x: number; y: number; s?: number; delay?: number; label?: string}> = ({f, x, y, s = 1, delay = 0, label}) => <><Draw f={f} delay={delay} dur={18} sw={7} d={`M ${x} ${y + 110*s} L ${x + 125*s} ${y} L ${x + 250*s} ${y + 110*s} L ${x + 250*s} ${y + 270*s} L ${x} ${y + 270*s} Z M ${x + 94*s} ${y + 270*s} L ${x + 94*s} ${y + 165*s} Q ${x + 125*s} ${y + 135*s} ${x + 156*s} ${y + 165*s} L ${x + 156*s} ${y + 270*s}`} fill={BLUE_F}/>{label ? <Text f={f} text={label} x={x - 50*s} y={y + 292*s} w={350*s} size={32*s} delay={delay + 12}/> : null}</>;

const Spinner: React.FC<{f: number; x: number; y: number; delay?: number; color?: string}> = ({f, x, y, delay = 0, color = ORANGE}) => { if (f < delay) return null; const r = ((f - delay) * 10) % 360; return <svg width={W} height={H} style={{position:"absolute",inset:0,overflow:"visible"}}><g transform={`translate(${x},${y}) rotate(${r})`}><path d="M 0 -28 A 28 28 0 1 1 -20 -20" fill="none" stroke={color} strokeWidth="8" strokeLinecap="round"/><path d="M -27 -28 L -8 -25 L -21 -8" fill="none" stroke={color} strokeWidth="6" strokeLinecap="round" strokeLinejoin="round"/></g></svg>;};

const ChatBubble: React.FC<{f:number; x:number; y:number; text:string; delay?:number; color?:string; blocked?:boolean}> = ({f,x,y,text,delay=0,color=GREEN,blocked=false}) => {const p=prog(f,delay,10); if(p<=0)return null; return <div style={{position:"absolute",left:x,top:y,width:300,height:92,border:`5px solid ${color}`,borderRadius:24,background:"rgba(255,255,255,.92)",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:B_FONT,fontWeight:700,fontSize:32,color:INK,opacity:p,transform:`scale(${.85+.15*ease(p)})`}}>{blocked ? <span style={{color:RED,fontSize:42,marginRight:10}}>×</span> : null}{text}</div>};

const HandTitle: React.FC<{f:number;text:string;delay?:number}> = ({f,text,delay=0}) => <><Text f={f} text={text} y={58} size={92} delay={delay} family={T_FONT}/><Draw f={f} delay={delay+8} d="M 690 178 q 18 -14 36 0 q 18 14 36 0 q 18 -14 36 0 q 18 14 36 0 q 18 -14 36 0 q 18 14 36 0 q 18 -14 36 0" stroke={RED} sw={6}/></>;

const Subtitle: React.FC = () => { const frame = useCurrentFrame(); const cur = subs.find((s) => frame >= s.s && frame < s.e); if (!cur) return null; return <div style={{position:"absolute",bottom:30,left:0,right:0,zIndex:50,textAlign:"center",fontFamily:"'Microsoft YaHei',sans-serif",fontWeight:900,fontSize:50,color:"#ffd93d",letterSpacing:2,textShadow:"4px 0 #3a2f10,-4px 0 #3a2f10,0 4px #3a2f10,0 -4px #3a2f10,3px 3px #3a2f10,-3px -3px #3a2f10,3px -3px #3a2f10,-3px 3px #3a2f10",whiteSpace:"nowrap"}}>{cur.t}</div>;};
const CornerMark: React.FC = () => <div style={{position:"absolute",top:52,right:76,zIndex:45,fontFamily:B_FONT,fontSize:30,fontWeight:700,letterSpacing:6,color:INK,borderBottom:`3px solid ${RED}`}}>小秋</div>;

const PageHook: React.FC<{off:number}> = ({off}) => {const f=useCurrentFrame()-off; return <AbsoluteFill><Cloud f={f} x={140} y={125} w={630} h={200} color={BLUE_F} delay={-99}/><Cloud f={f} x={980} y={300} w={600} h={180} color={YEL_F} delay={-99}/><Text f={f} text="进程 vs 线程" y={72} size={100} delay={-99} family={T_FONT}/><House f={f} x={300} y={300} s={1.45} delay={-99} label="一个进程 = 一套房子"/><Stick f={f} x={1150} y={525} delay={-99} pose="work"/><Stick f={f} x={1335} y={525} delay={-99} pose="work"/><Stick f={f} x={1520} y={525} delay={-99} pose="work"/><Text f={f} text="多条线程 = 房里干活的人" x={1000} y={700} w={700} size={40} delay={-99}/><ChatBubble f={f} x={455} y={520} text="微信能收消息" delay={-99}/><ChatBubble f={f} x={455} y={640} text="朋友圈在转圈" delay={-99} color={ORANGE} blocked/><Spinner f={f} x={725} y={686} delay={0}/><Text f={f} text="只会背最小单位？" y={855} size={66} delay={-99} color={RED}/></AbsoluteFill>;};

const PageProblem: React.FC<{off:number}> = ({off}) => {const f=useCurrentFrame()-off; return <AbsoluteFill><HandTitle f={f} text="面试官想听什么？"/><Stick f={f} x={340} y={410} delay={8} pose="point"/><ChatBubble f={f} x={500} y={250} text="不是背书" delay={18} color={RED}/><ChatBubble f={f} x={500} y={390} text="是你懂不懂问题" delay={38} color={GREEN}/><Cloud f={f} x={980} y={290} w={600} h={220} color={ORANGE_F} delay={54}/><Text f={f} text="软件卡死 · 点不动" x={965} y={340} w={640} size={56} delay={64} color={RED}/><Text f={f} text="可能是某条线程被卡住" x={960} y={450} w={660} size={38} delay={86}/><House f={f} x={710} y={610} s={1.05} delay={110} label="进程 = 房子"/><Stick f={f} x={1110} y={805} delay={124} pose="work"/><Text f={f} text="线程 = 干活的人" x={1210} y={770} w={450} size={36} delay={138}/></AbsoluteFill>;};

const PageWeChat: React.FC<{off:number}> = ({off}) => {const f=useCurrentFrame()-off; return <AbsoluteFill><HandTitle f={f} text="拿微信举例"/><House f={f} x={250} y={250} s={1.55} delay={8} label="整个微信 = 一个进程"/><Text f={f} text="同一套房里，三个人同时干活" x={1030} y={185} w={680} size={42} delay={18}/><ChatBubble f={f} x={1090} y={390} text="收消息" delay={36} color={GREEN}/><ChatBubble f={f} x={1090} y={540} text="刷朋友圈" delay={56} color={BLUE}/><ChatBubble f={f} x={1090} y={690} text="加载图片" delay={76} color={ORANGE}/><Stick f={f} x={970} y={468} delay={40} pose="work"/><Stick f={f} x={970} y={618} delay={60} pose="work"/><Stick f={f} x={970} y={768} delay={80} pose="work"/><Draw f={f} delay={98} d="M 840 460 L 1040 440 M 840 570 L 1040 590 M 840 680 L 1040 740" stroke={INK} sw={4}/></AbsoluteFill>;};

const PageBlock: React.FC<{off:number}> = ({off}) => {const f=useCurrentFrame()-off; const pulse=0.85+Math.sin(f/8)*0.08; return <AbsoluteFill><HandTitle f={f} text="为什么还能收消息？"/><House f={f} x={160} y={260} s={1.35} delay={-99} label="微信进程"/><ChatBubble f={f} x={970} y={300} text="收消息 继续运行" delay={0} color={GREEN}/><ChatBubble f={f} x={970} y={470} text="朋友圈 卡住" delay={4} color={ORANGE} blocked/><ChatBubble f={f} x={970} y={640} text="加载图片 卡住" delay={8} color={RED} blocked/><Spinner f={f} x={1290} y={515} delay={8}/><div style={{position:"absolute",left:650,top:320,width:170,height:170,border:`8px solid ${GREEN}`,borderRadius:"50%",opacity:prog(f,0),transform:`scale(${pulse})`}}/><Text f={f} text="一条线程卡住" x={520} y={680} w={420} size={43} delay={18} color={RED}/><Text f={f} text="不会让其他线程都停下" x={980} y={800} w={700} size={46} delay={28} color={GREEN}/></AbsoluteFill>;};

const PageAnswer: React.FC<{off:number}> = ({off}) => {const f=useCurrentFrame()-off; return <AbsoluteFill><HandTitle f={f} text="面试别背空话"/><Cloud f={f} x={250} y={235} w={1420} h={190} color={YEL_F} delay={-99}/><Text f={f} text="重点是讲清：一条出问题，其他为什么还能继续" y={292} size={52} delay={-99}/><Box f={f} x={280} y={540} w={600} h={230} delay={-99} fill={BLUE_F}/><Box f={f} x={1040} y={540} w={600} h={230} delay={-99} fill={GREEN_F}/><Text f={f} text="进程" x={280} y={582} w={600} size={70} delay={-99} family={T_FONT}/><Text f={f} text="资源隔离" x={280} y={685} w={600} size={40} delay={-99}/><Text f={f} text="线程" x={1040} y={582} w={600} size={70} delay={-99} family={T_FONT}/><Text f={f} text="执行任务" x={1040} y={685} w={600} size={40} delay={-99}/><Draw f={f} delay={-99} d="M 900 655 L 1015 655" stroke={ORANGE} sw={8}/></AbsoluteFill>;};

const PageShot: React.FC<{off:number}> = ({off}) => {const f=useCurrentFrame()-off; return <AbsoluteFill style={{backgroundColor:"#fff"}}><Text f={f} text="面试截图卡" y={120} size={50} delay={-99} color={SUBC}/><Text f={f} text="进程管资源 线程管执行" y={285} size={82} delay={-99} family={"'Microsoft YaHei',sans-serif"}/><Draw f={f} delay={-99} d="M 450 410 L 1470 410" stroke={INK} sw={5}/><Text f={f} text="进程 = 一套房子" x={280} y={495} w={600} size={52} delay={-99}/><Text f={f} text="线程 = 房里干活的人" x={1040} y={495} w={620} size={52} delay={-99}/><Text f={f} text="一个进程 可以包含多条线程" y={660} size={48} delay={-99} color={ORANGE}/><Text f={f} text="截图保存 面试前看一遍" y={805} size={34} delay={-99} color={SUBC}/></AbsoluteFill>;};

const PageCTA: React.FC<{off:number}> = ({off}) => {const f=useCurrentFrame()-off; return <AbsoluteFill><Cloud f={f} x={430} y={240} w={1050} h={230} color={GREEN_F} delay={-99}/><Text f={f} text="觉得讲明白了 就点个赞" y={270} size={76} delay={-99} family={T_FONT}/><Text f={f} text="操作系统 · Linux · Docker 面试高频知识点" y={495} size={40} delay={-99}/><Box f={f} x={450} y={615} w={1020} h={120} delay={-99} fill={ORANGE_F} stroke={ORANGE}/><Text f={f} text="关注小秋 面试前把这组知识点看一遍" y={650} size={42} delay={-99}/><Text f={f} text="小秋 · 0 基础也能学会" y={835} size={30} delay={-99} color={SUBC}/></AbsoluteFill>;};

const PAGES = [
  {C: PageHook, start: 0, end: 435}, {C: PageProblem, start: 435, end: 785}, {C: PageWeChat, start: 785, end: 1110},
  {C: PageBlock, start: 1110, end: 1488}, {C: PageAnswer, start: 1488, end: 1778}, {C: PageShot, start: 1778, end: 2210}, {C: PageCTA, start: 2210, end: DUR},
];
const PageTurn: React.FC<{children: React.ReactNode; off:number; len:number; first:boolean; last:boolean}> = ({children}) => <AbsoluteFill>{children}</AbsoluteFill>;

export const ProcessThreadSketch: React.FC = () => {const frame=useCurrentFrame(); const bed=interpolate(frame,[0,20,DUR-40,DUR-6],[0,0.065,0.065,0],clamp); return <AbsoluteFill style={{backgroundColor:PAPER,overflow:"hidden"}}>{PAGES.map(({C,start,end},i)=>{const first=i===0,last=i===PAGES.length-1,len=end-start,off=first?0:10; return <Sequence key={start} from={first?0:start-10} durationInFrames={len+12}><PageTurn off={off} len={len} first={first} last={last}><C off={off}/></PageTurn></Sequence>;})}<CornerMark/>{voiceLines.map((s,i)=><Sequence key={s.audio} from={s.start} durationInFrames={s.end-s.start+20}><Audio src={staticFile(`audio/process-thread-tts/${s.audio}`)} volume={1}/></Sequence>)}{[435,785,1110,1488,1778,2210].map(t=><Sequence key={t} from={t-5} durationInFrames={18}><Audio src={staticFile("audio/sfx/transfer.wav")} volume={0.14}/></Sequence>)}{[440,612,960,1120,1320].map(t=><Sequence key={`whoosh-${t}`} from={t} durationInFrames={12}><Audio src={staticFile("audio/sfx/whoosh.wav")} volume={0.12}/></Sequence>)}<Sequence from={500} durationInFrames={26}><Audio src={staticFile("audio/sfx/error.wav")} volume={0.36}/></Sequence><Sequence from={1310} durationInFrames={18}><Audio src={staticFile("audio/sfx/ding.wav")} volume={0.38}/></Sequence><Sequence from={2120} durationInFrames={12}><Audio src={staticFile("audio/sfx/pop.wav")} volume={0.35}/></Sequence><Audio src={staticFile("audio/bed.wav")} loop volume={()=>bed}/><Subtitle/></AbsoluteFill>;};
