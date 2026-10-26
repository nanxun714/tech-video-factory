import {Audio} from "@remotion/media";
import {AbsoluteFill, interpolate, Sequence, staticFile, useCurrentFrame} from "remotion";
import {
  INK, SUBC, BLUE, BLUE_BG, GREEN, GREEN_BG, ORANGE, ORANGE_BG, RED, RED_BG, BORDER, F, W, H,
  clamp, ease, prog, BgDots, BigTitle, Sparkle, FlashRing, LoopPacket, BulbFlat,
  FlatPerson, HouseFlat, IconChat, IconGrid, IconImage, SpinnerFlat, PhoneFrame,
  Cloud, SpeechBubble, Float, MarkBad, MarkOk, Sticker, Pill,
} from "./flatKit";

const DUR = 1424;

const voiceLines = [
  {audio:"s01.mp3",start:0,end:160},{audio:"s02.mp3",start:150,end:296},{audio:"s03.mp3",start:286,end:437},
  {audio:"s04.mp3",start:428,end:574},{audio:"s05.mp3",start:564,end:746},{audio:"s06.mp3",start:737,end:951},
  {audio:"s07.mp3",start:942,end:1118},{audio:"s08.mp3",start:1108,end:1252},{audio:"s09.mp3",start:1242,end:1384},
];
type Sub = {s:number;e:number;t:string};
const subs: Sub[] = [
  {s:0,e:72,t:"面试问进程和线程"},{s:72,e:145,t:"只会背最小单位 面试官直接把你刷了"},
  {s:150,e:215,t:"他真正想听的"},{s:215,e:281,t:"是你能不能讲清楚 程序为什么会卡死"},
  {s:286,e:354,t:"软件卡死 点不动"},{s:354,e:422,t:"多半是负责界面的线程被堵住了"},
  {s:428,e:494,t:"记住这个类比 进程是一套房子"},{s:494,e:559,t:"线程是房子里干活的人"},
  {s:564,e:625,t:"整个微信就是一个进程"},{s:625,e:731,t:"收消息 刷朋友圈 加载图片 是三条线程"},
  {s:737,e:836,t:"图片那条线程堵住了 收消息那条照常跑"},{s:836,e:936,t:"所以微信能收消息 朋友圈却在转圈"},
  {s:942,e:1005,t:"核心区别 进程管资源隔离"},{s:1005,e:1103,t:"线程管执行 一个进程带多条线程"},
  {s:1108,e:1152,t:"面试别再背定义了"},{s:1152,e:1237,t:"把这个例子讲清楚 面试官才信你"},
  {s:1242,e:1295,t:"觉得讲明白了 点个赞"},{s:1295,e:1369,t:"面试前把这组知识点再刷一遍"},
];

// 弹性入场：缩放 + 轻微旋转回正
const Pop: React.FC<{f:number;d:number;x:number;y:number;w:number;h:number;children:React.ReactNode;rot?:number}> = ({f,d,x,y,w,h,children,rot=0}) => {
  const p = prog(f,d,14);
  if (p<=0) return null;
  return <div style={{position:"absolute",left:x,top:y,width:w,height:h,opacity:p,transform:`scale(${.7+.3*ease(p)}) rotate(${rot*(1-ease(p))}deg)`,transformOrigin:"center center"}}>{children}</div>;
};

// 圆角卡片（可带顶部标签胶囊，胶囊带同色投影）
const Card: React.FC<{f:number;d:number;x:number;y:number;w:number;h:number;fill?:string;chip?:string;chipColor?:string;children?:React.ReactNode}> = ({f,d,x,y,w,h,fill="#fff",chip,chipColor=BLUE,children}) => {
  const p = prog(f,d);
  if (p<=0) return null;
  return (<>
    <div style={{position:"absolute",left:x,top:y,width:w,height:h,background:fill,border:`3px solid ${BORDER}`,borderRadius:26,boxShadow:"0 12px 28px rgba(47,58,69,.08)",opacity:p,transform:`scale(${.92+.08*ease(p)})`}}>
      {children ? <div style={{position:"absolute",left:-x,top:-y,width:W,height:H,overflow:"visible"}}>{children}</div> : null}
    </div>
    {chip ? <div style={{position:"absolute",left:x+w/2-chip.length*23-30,top:y-30,width:chip.length*46+60,height:60,borderRadius:999,background:chipColor,color:"#fff",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:F,fontWeight:900,fontSize:30,letterSpacing:3,whiteSpace:"nowrap",opacity:p,transform:`scale(${.9+.1*ease(p)})`,boxShadow:`0 8px 18px ${chipColor}44`}}>{chip}</div> : null}
  </>);
};

const Label: React.FC<{f:number;text:string;x:number;y:number;w:number;size?:number;color?:string;d?:number}> = ({f,text,x,y,w,size=30,color=INK,d=0}) => <div style={{position:"absolute",left:x,top:y,width:w,textAlign:"center",fontFamily:F,fontSize:size,fontWeight:700,color,opacity:prog(f,d),whiteSpace:"nowrap"}}>{text}</div>;

// 任务行：图标芯片 + 文字 + 状态胶囊（装在手机里），滑入入场
const Task: React.FC<{f:number;x:number;y:number;text:string;color:string;iconBg:string;d:number;blocked?:boolean;icon:React.ReactNode}> = ({f,x,y,text,color,iconBg,d,blocked=false,icon}) => {
  const p = prog(f,d,14);
  if (p<=0) return null;
  const slide = (1-ease(p))*30;
  return (<>
    <div style={{position:"absolute",left:x+slide,top:y,width:520,height:104,background:"#fff",border:`3px solid ${BORDER}`,borderRadius:22,boxShadow:"0 8px 20px rgba(47,58,69,.07)",opacity:p}}>
      <div style={{position:"absolute",left:18,top:20,width:64,height:64,borderRadius:18,background:iconBg}}/>
    </div>
    <div style={{position:"absolute",left:x+slide+18,top:y+20,width:64,height:64,borderRadius:18,background:iconBg,opacity:p,display:"flex",alignItems:"center",justifyContent:"center"}}>{icon}</div>
    <div style={{position:"absolute",left:x+slide+100,top:y,width:400,height:104,display:"flex",alignItems:"center",gap:16,fontFamily:F,fontWeight:900,fontSize:36,color:blocked?INK:color,opacity:p}}>
      <span>{text}</span>
      {blocked
        ? <span style={{display:"inline-flex",alignItems:"center",justifyContent:"center",width:100,height:44,borderRadius:999,background:RED_BG,color:RED,fontSize:24,letterSpacing:2}}>已卡住</span>
        : <span style={{display:"inline-flex",alignItems:"center",justifyContent:"center",width:100,height:44,borderRadius:999,background:GREEN_BG,color:GREEN,fontSize:24,letterSpacing:2}}>正常</span>}
    </div>
  </>);
};

const Arrow: React.FC<{f:number;x1:number;y1:number;x2:number;y2:number;color?:string;d?:number}> = ({f,x1,y1,x2,y2,color=INK,d=0}) => {
  const p=prog(f,d,16);
  if(p<=0) return null;
  const ex=x1+(x2-x1)*p,ey=y1+(y2-y1)*p;
  return <svg width={W} height={H} style={{position:"absolute",inset:0,pointerEvents:"none"}}><line x1={x1} y1={y1} x2={ex} y2={ey} stroke={color} strokeWidth="7" strokeLinecap="round"/>{p>.9?<path d={`M ${x2-22} ${y2-13} L ${x2} ${y2} L ${x2-22} ${y2+13}`} fill="none" stroke={color} strokeWidth="7" strokeLinecap="round" strokeLinejoin="round"/>:null}</svg>;
};

const PageCover: React.FC<{off:number}> = ({off}) => {const f=useCurrentFrame()-off;return <AbsoluteFill>
  <Cloud x={300} y={150} s={0.75}/><Cloud x={1680} y={125} s={0.9}/><Sparkle x={120} y={420} s={0.7} color={BLUE}/><Sparkle x={1810} y={520} s={0.6}/>
  <BigTitle f={f} delay={-99} parts={[{t:"进程",c:BLUE},{t:" vs ",c:SUBC},{t:"线程",c:GREEN}]}/>
  <Card f={f} d={-99} x={150} y={215} w={760} h={645} fill={BLUE_BG} chip="进程" chipColor={BLUE}>
    <Pop f={f} d={-99} x={380} y={330} w={300} h={310}><Float f={f} x={0} y={0} w={300} h={310} amp={5}><HouseFlat x={150} y={155} s={0.9}/></Float></Pop>
    <Pop f={f} d={-99} x={200} y={690} w={660} h={60}><Label f={f} text="整个微信 = 一套房子" x={0} y={0} w={660} size={38} d={-99}/></Pop>
    <Pop f={f} d={-99} x={200} y={758} w={660} h={50}><Label f={f} text="负责装资源、隔离风险" x={0} y={0} w={660} size={28} color={SUBC} d={-99}/></Pop>
  </Card>
  <Card f={f} d={-99} x={1010} y={215} w={760} h={645} fill={GREEN_BG} chip="线程" chipColor={GREEN}>
    <Pop f={f} d={-99} x={1125} y={330} w={130} h={180}><Float f={f} x={0} y={0} w={130} h={180} amp={7}><FlatPerson x={65} y={90} color={GREEN} s={0.95}/></Float></Pop>
    <Pop f={f} d={-99} x={1325} y={330} w={130} h={180}><Float f={f} x={0} y={0} w={130} h={180} amp={7}><FlatPerson x={65} y={90} color={BLUE} s={0.95}/></Float></Pop>
    <Pop f={f} d={-99} x={1525} y={330} w={130} h={180}><Float f={f} x={0} y={0} w={130} h={180} amp={7}><FlatPerson x={65} y={90} color={ORANGE} s={0.95}/></Float></Pop>
    <Pop f={f} d={-99} x={1060} y={650} w={660} h={60}><Label f={f} text="房子里干活的人" x={0} y={0} w={660} size={38} d={-99}/></Pop>
    <Pop f={f} d={-99} x={1060} y={722} w={660} h={50}><Label f={f} text="分别处理收消息、刷朋友圈、加载图片" x={0} y={0} w={660} size={26} color={SUBC} d={-99}/></Pop>
  </Card>
  <Pop f={f} d={-99} x={880} y={470} w={160} h={160} rot={-14}>
    <div style={{position:"absolute",inset:0,borderRadius:"50%",background:"#fff",border:`5px solid ${ORANGE}`,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:F,fontWeight:900,fontSize:52,color:ORANGE,boxShadow:"0 10px 24px rgba(240,145,45,.25)"}}>VS</div>
  </Pop>
  <Sparkle x={430} y={905} s={0.9}/><Sparkle x={1490} y={905} s={0.7} color={ORANGE}/>
</AbsoluteFill>;};

const PageMeaning: React.FC<{off:number}> = ({off}) => {const f=useCurrentFrame()-off;return <AbsoluteFill>
  <BigTitle f={f} delay={-99} parts={[{t:"面试官到底想听",c:INK},{t:"什么",c:ORANGE}]}/>
  {/* 左：面试官出场提问 */}
  <Pop f={f} d={-99} x={110} y={280} w={420} h={560}>
    <Float f={f} x={0} y={0} w={420} h={460} amp={5}><FlatPerson x={210} y={230} color="#3f4d5e" s={1.5}/></Float>
    <Pill f={f} d={-99} x={60} y={470} w={300} h={62} bg={BLUE_BG} text="面试官" color={BLUE} ts={34}/>
  </Pop>
  <SpeechBubble f={f} d={-99} x={470} y={260} w={560} h={150} text="说说进程和线程的区别？" ts={40} c={INK}/>
  {/* 右上：错误回答（虚线贴纸 + 红叉） */}
  <Sticker f={f} d={24} x={1080} y={255} w={720} h={150} title="只会背定义" color={RED} ts={46}/>
  <MarkBad f={f} x={1830} y={270} s={0.9}/>
  {/* 右下：正确回答 */}
  <Card f={f} d={44} x={1050} y={440} w={780} h={300} fill={GREEN_BG} chip="面试官想听的" chipColor={GREEN}>
    <Label f={f} text="软件为什么卡死" x={1090} y={540} w={700} size={40} d={58}/>
    <Label f={f} text="一个任务卡住，其他任务还能不能动" x={1090} y={625} w={700} size={32} color={GREEN} d={72}/>
  </Card>
  <MarkOk f={f} x={1850} y={590} s={0.8}/>
  <Arrow f={f} x1={960} y1={340} x2={1040} y2={330} color={RED} d={30}/>
  <Arrow f={f} x1={960} y1={520} x2={1040} y2={560} color={GREEN} d={50}/>
  <Card f={f} d={100} x={430} y={790} w={1060} h={120} fill={ORANGE_BG}>
    <Label f={f} text="程序卡住、点不动：可能是线程阻塞" x={500} y={832} w={920} size={38} color={ORANGE} d={108}/>
  </Card>
  <BulbFlat x={330} y={850} s={0.9}/>
  <Sparkle x={960} y={200} s={0.8}/>
</AbsoluteFill>;};

const PageWeChat: React.FC<{off:number}> = ({off}) => {const f=useCurrentFrame()-off;return <AbsoluteFill>
  <BigTitle f={f} delay={-99} parts={[{t:"一个微信，",c:INK},{t:"三条任务",c:BLUE}]}/>
  <Card f={f} d={8} x={130} y={225} w={620} h={650} fill={BLUE_BG} chip="进程 · 整个微信" chipColor={BLUE}>
    <Pop f={f} d={20} x={290} y={330} w={300} h={310}><HouseFlat x={150} y={155} s={0.9}/></Pop>
    <Pop f={f} d={44} x={170} y={705} w={540} h={60}><Label f={f} text="一套房子" x={0} y={0} w={540} size={42} d={-99}/></Pop>
    <Pop f={f} d={52} x={170} y={775} w={540} h={50}><Label f={f} text="共用同一组资源" x={0} y={0} w={540} size={30} color={SUBC} d={-99}/></Pop>
  </Card>
  <PhoneFrame f={f} d={16} x={880} y={215} w={640} h={640} title="微信"/>
  <Task f={f} x={940} y={320} text="收消息" color={GREEN} iconBg={GREEN_BG} d={46} icon={<IconChat x={32} y={32} s={0.8} c={GREEN}/>}/>
  <Task f={f} x={940} y={450} text="刷朋友圈" color={BLUE} iconBg={BLUE_BG} d={62} icon={<IconGrid x={32} y={32} s={0.8} c={BLUE}/>}/>
  <Task f={f} x={940} y={580} text="加载图片" color={ORANGE} iconBg={ORANGE_BG} d={78} icon={<IconImage x={32} y={32} s={0.8} c={ORANGE}/>}/>
  <Arrow f={f} x1={760} y1={400} x2={920} y2={372} color={GREEN} d={36}/>
  <Arrow f={f} x1={760} y1={520} x2={920} y2={502} color={BLUE} d={54}/>
  <Arrow f={f} x1={760} y1={640} x2={920} y2={632} color={ORANGE} d={72}/>
  <LoopPacket f={f} x1={960} y1={372} x2={1400} y2={372} color={GREEN} start={130} period={64}/>
  <LoopPacket f={f} x1={960} y1={502} x2={1400} y2={502} color={BLUE} start={150} period={64}/>
  <LoopPacket f={f} x1={960} y1={632} x2={1400} y2={632} color={ORANGE} start={170} period={64}/>
</AbsoluteFill>;};

const PageBlocked: React.FC<{off:number}> = ({off}) => {const f=useCurrentFrame()-off;return <AbsoluteFill>
  <BigTitle f={f} delay={-99} parts={[{t:"为什么还能",c:INK},{t:"收消息",c:GREEN},{t:"？",c:INK}]}/>
  <Card f={f} d={4} x={120} y={225} w={680} h={650} fill={BLUE_BG} chip="微信进程" chipColor={BLUE}>
    <Pop f={f} d={14} x={300} y={330} w={300} h={310}><HouseFlat x={150} y={155} s={0.9}/></Pop>
    <Pop f={f} d={36} x={190} y={705} w={540} h={60}><Label f={f} text="资源还在" x={0} y={0} w={540} size={40} color={GREEN} d={-99}/></Pop>
  </Card>
  <PhoneFrame f={f} d={6} x={880} y={215} w={640} h={640} title="微信"/>
  <Task f={f} x={940} y={320} text="收消息" color={GREEN} iconBg={GREEN_BG} d={18} icon={<IconChat x={32} y={32} s={0.8} c={GREEN}/>}/>
  <Task f={f} x={940} y={450} text="刷朋友圈" color={ORANGE} iconBg={ORANGE_BG} d={26} blocked icon={<IconGrid x={32} y={32} s={0.8} c={ORANGE}/>}/>
  <Task f={f} x={940} y={580} text="加载图片" color={RED} iconBg={RED_BG} d={34} blocked icon={<IconImage x={32} y={32} s={0.8} c={RED}/>}/>
  <SpinnerFlat f={f} x={1490} y={502} d={40} s={0.85}/>
  <FlashRing f={f} at={52} x={1230} y={502} color={ORANGE}/>
  <FlashRing f={f} at={62} x={1230} y={632} color={RED}/>
  <LoopPacket f={f} x1={720} y1={430} x2={960} y2={372} cx={840} cy={350} color={GREEN} start={80} period={110} dur={40}/>
  <Card f={f} d={48} x={770} y={875} w={860} h={92} fill={RED_BG}>
    <Label f={f} text="一条线程阻塞" x={790} y={899} w={820} size={38} color={RED} d={56}/>
  </Card>
</AbsoluteFill>;};

const PageSummary: React.FC<{off:number}> = ({off}) => {const f=useCurrentFrame()-off;return <AbsoluteFill>
  <BigTitle f={f} delay={-99} parts={[{t:"最后记住",c:INK},{t:"这句话",c:GREEN}]}/>
  {/* 左场景：进程 = 一套装资源的房子 */}
  <Pop f={f} d={-99} x={90} y={250} w={820} h={560}>
    <Pill f={f} d={-99} x={130} y={0} w={560} h={66} bg={BLUE_BG} text="进程 · 管资源隔离" color={BLUE} ts={36}/>
    <Float f={f} x={210} y={110} w={380} h={360} amp={5}><HouseFlat x={190} y={180} s={1.1}/></Float>
    <Label f={f} text="一套房子 · 装着资源和风险" x={90} y={490} w={640} size={32} color={SUBC} d={-99}/>
  </Pop>
  {/* 中间虚线分隔 */}
  <svg width={W} height={H} style={{position:"absolute",inset:0,pointerEvents:"none"}}>
    <line x1={960} y1={270} x2={960} y2={780} stroke={SUBC} strokeWidth={4} strokeDasharray="10 12" strokeLinecap="round"/>
  </svg>
  {/* 右场景：线程 = 房里干活的人 */}
  <Pop f={f} d={-99} x={1010} y={250} w={820} h={560}>
    <Pill f={f} d={-99} x={130} y={0} w={560} h={66} bg={GREEN_BG} text="线程 · 管执行任务" color={GREEN} ts={36}/>
    <Float f={f} x={40} y={120} w={240} h={200} amp={7}><FlatPerson x={120} y={100} color={GREEN} s={1}/></Float>
    <Float f={f} x={290} y={120} w={240} h={200} amp={7}><FlatPerson x={120} y={100} color={BLUE} s={1}/></Float>
    <Float f={f} x={540} y={120} w={240} h={200} amp={7}><FlatPerson x={120} y={100} color={ORANGE} s={1}/></Float>
    <Label f={f} text="各干各的活 · 一个卡住，其他照常跑" x={90} y={490} w={640} size={32} color={SUBC} d={-99}/>
  </Pop>
  <Card f={f} d={90} x={430} y={825} w={1060} h={110} fill={ORANGE_BG}>
    <Label f={f} text="面试要讲原因，不只背定义" x={450} y={857} w={1020} size={36} color={ORANGE} d={100}/>
  </Card>
  <BulbFlat x={360} y={880} s={0.85}/>
  <Sparkle x={1780} y={285} s={0.8}/>
</AbsoluteFill>;};

const PageInterview: React.FC<{off:number}> = ({off}) => {const f=useCurrentFrame()-off;return <AbsoluteFill>
  <BigTitle f={f} delay={-99} parts={[{t:"面试这么答",c:INK},{t:"才加分",c:GREEN}]}/>
  <svg width={W} height={H} style={{position:"absolute",inset:0,pointerEvents:"none"}}>
    <rect x={610} y={660} width={700} height={26} rx={10} fill={ORANGE}/>
    <rect x={650} y={686} width={18} height={150} fill="#d9822b"/>
    <rect x={1252} y={686} width={18} height={150} fill="#d9822b"/>
    <rect x={882} y={556} width={120} height={84} rx={6} fill="#dbe4ee" stroke="#55677c" strokeWidth={4}/>
    <rect x={858} y={640} width={164} height={14} rx={7} fill="#55677c"/>
  </svg>
  <Pop f={f} d={-99} x={330} y={400} w={240} h={340}>
    <Float f={f} x={0} y={0} w={240} h={340} amp={5}><FlatPerson x={120} y={170} color={GREEN} s={1.3}/></Float>
  </Pop>
  <Pop f={f} d={-99} x={1350} y={400} w={240} h={340}>
    <Float f={f} x={0} y={0} w={240} h={340} amp={5}><FlatPerson x={120} y={170} color="#3f4d5e" s={1.3}/></Float>
  </Pop>
  <SpeechBubble f={f} d={14} x={300} y={215} w={560} h={130} text="微信能收消息，朋友圈却在转圈" ts={32} c={GREEN}/>
  <MarkOk f={f} x={1620} y={300} s={1}/>
  <Pill f={f} d={40} x={700} y={870} w={520} h={70} bg={ORANGE_BG} text="举例子 > 背定义" color={ORANGE} ts={32}/>
  <Sparkle x={960} y={170} s={0.9}/>
</AbsoluteFill>;};

const PageCTA: React.FC<{off:number}> = ({off}) => {const f=useCurrentFrame()-off;return <AbsoluteFill>
  <BigTitle f={f} delay={-99} parts={[{t:"讲明白了吗",c:INK},{t:"？",c:ORANGE}]}/>
  <Card f={f} d={-99} x={280} y={255} w={1360} h={440} fill={GREEN_BG}>
    <Label f={f} text="进程管资源 · 线程管执行" x={320} y={375} w={1280} size={68} color={INK} d={-99}/>
    <Label f={f} text="操作系统 · Linux · Docker 面试高频知识点持续更新" x={320} y={525} w={1280} size={34} color={SUBC} d={-99}/>
  </Card>
  <Card f={f} d={-99} x={430} y={785} w={1060} h={100} fill={ORANGE_BG}>
    <Label f={f} text="关注小秋，面试前把这组知识点看一遍" x={450} y={815} w={1020} size={34} color={ORANGE} d={-99}/>
  </Card>
  <Label f={f} text="小秋 · 0 基础也能学会" x={0} y={905} w={W} size={28} color={SUBC} d={-99}/>
</AbsoluteFill>;};

const PAGES = [{C:PageCover,start:0,end:144},{C:PageMeaning,start:144,end:422},{C:PageWeChat,start:422,end:731},{C:PageBlocked,start:731,end:936},{C:PageSummary,start:936,end:1102},{C:PageInterview,start:1102,end:1236},{C:PageCTA,start:1236,end:DUR}];

const PageTurn: React.FC<{children:React.ReactNode;off:number;len:number;first:boolean;last:boolean}> = ({children,off,len,first,last}) => {
  const frame = useCurrentFrame();
  const oIn = first ? 1 : interpolate(frame,[0,10],[0,1],clamp);
  const lf = frame - off;
  const oOut = last ? 1 : interpolate(lf,[len-10,len],[1,0],clamp);
  return <AbsoluteFill style={{opacity:Math.min(oIn,oOut)}}>{children}</AbsoluteFill>;
};

const Subtitle: React.FC = () => {const f=useCurrentFrame();const cur=subs.find(s=>f>=s.s&&f<s.e);if(!cur)return null;return <div style={{position:"absolute",bottom:30,left:0,right:0,zIndex:50,display:"flex",justifyContent:"center"}}><div style={{background:"rgba(12,14,18,.82)",borderRadius:15,padding:"11px 32px",fontFamily:F,fontWeight:700,fontSize:44,color:"#fff",letterSpacing:2,whiteSpace:"nowrap"}}>{cur.t}</div></div>;};

export const ProcessThreadFlat: React.FC = () => {
  const frame = useCurrentFrame();
  const bed = interpolate(frame,[0,20,DUR-40,DUR-6],[0,.065,.065,0],clamp);
  return (
    <AbsoluteFill style={{background:"linear-gradient(180deg,#fff 0%,#f3f6f9 100%)",fontFamily:F,overflow:"hidden"}}>
      <BgDots/>
      {PAGES.map(({C,start,end},i)=>{
        const first=i===0,last=i===PAGES.length-1,len=end-start,off=first?0:10;
        return <Sequence key={i} from={first?0:start-10} durationInFrames={len+12}>
          <PageTurn off={off} len={len} first={first} last={last}><C off={off}/></PageTurn>
        </Sequence>;
      })}
      <div style={{position:"absolute",top:45,right:70,zIndex:45,border:`3px solid ${BLUE}`,borderRadius:999,padding:"7px 25px",fontSize:28,fontWeight:900,color:INK,letterSpacing:5,background:"#fff"}}>小秋</div>
      {voiceLines.map((s,i)=><Sequence key={i} from={s.start} durationInFrames={s.end-s.start+20}><Audio src={staticFile(`audio/process-thread-tts/${s.audio}`)} volume={1}/></Sequence>)}
      {[144,422,731,936,1102,1236].map(t=><Sequence key={`turn-${t}`} from={t-5} durationInFrames={18}><Audio src={staticFile("audio/sfx/transfer.wav")} volume={.14}/></Sequence>)}
      {[149,427,736,941,1107,1241].map(t=><Sequence key={`whoosh-${t}`} from={t} durationInFrames={12}><Audio src={staticFile("audio/sfx/whoosh.wav")} volume={.11}/></Sequence>)}
      <Sequence from={286} durationInFrames={24}><Audio src={staticFile("audio/sfx/error.wav")} volume={.38}/></Sequence>
      <Sequence from={850} durationInFrames={18}><Audio src={staticFile("audio/sfx/ding.wav")} volume={.4}/></Sequence>
      <Sequence from={1102} durationInFrames={12}><Audio src={staticFile("audio/sfx/pop.wav")} volume={.35}/></Sequence>
      <Audio src={staticFile("audio/bed.wav")} loop volume={()=>bed}/>
      <Subtitle/>
    </AbsoluteFill>
  );
};
