import {Audio} from "@remotion/media";
import {AbsoluteFill, interpolate, Sequence, staticFile, useCurrentFrame} from "remotion";

const DUR = 1906;
const INK = "#2b2b28";
const PAPER = "#fdfcf7";
const SUBC = "#8a8578";
const BLUE = "#4a72b8";
const GREEN = "#3d8f5f";
const RED = "#c9463d";
const ORANGE = "#d9822b";
const YEL = "#f5d76e";
const F = "'Microsoft YaHei', sans-serif";
const MONO = "'Consolas','Courier New',monospace";
const W = 1920;
const H = 1080;
const clamp = {extrapolateLeft: "clamp", extrapolateRight: "clamp"} as const;
const ease = (p: number) => 1 - Math.pow(1 - p, 3);
const prog = (f: number, d: number, dur = 12) => interpolate(f, [d, d + dur], [0, 1], clamp);

// 线稿自绘：挂到任意 SVG 描边元素上
const sk = (f: number, d: number, dur = 20): any => ({
  pathLength: 1, strokeDasharray: 1, strokeDashoffset: 1 - ease(prog(f, d, dur)),
});

const voiceLines = [
  {audio:"s01.mp3",start:0,end:160},{audio:"s02.mp3",start:150,end:268},{audio:"s03.mp3",start:258,end:421},
  {audio:"s04.mp3",start:412,end:554},{audio:"s05.mp3",start:544,end:677},{audio:"s06.mp3",start:668,end:846},
  {audio:"s07.mp3",start:836,end:967},{audio:"s08.mp3",start:957,end:1099},{audio:"s09.mp3",start:1090,end:1228},
  {audio:"s10.mp3",start:1219,end:1348},{audio:"s11.mp3",start:1339,end:1502},{audio:"s12.mp3",start:1492,end:1637},
  {audio:"s13.mp3",start:1627,end:1768},{audio:"s14.mp3",start:1759,end:1871},
];
type Sub = {s:number;e:number;t:string};
const subs: Sub[] = [
  {s:0,e:72,t:"你每天刷网页 点链接"},{s:72,e:145,t:"背后都在用同一个东西 HTTP"},
  {s:150,e:200,t:"它就是浏览器和服务器之间"},{s:200,e:253,t:"传数据的规矩"},
  {s:258,e:330,t:"每次上网都是一问一答"},{s:330,e:406,t:"浏览器发一个请求 服务器回一个响应"},
  {s:412,e:475,t:"请求里第一行是方法"},{s:475,e:539,t:"GET 是拿数据 POST 是交数据"},
  {s:544,e:600,t:"打开网页用 GET"},{s:600,e:662,t:"填表单 登录用 POST 别搞混"},
  {s:668,e:750,t:"请求头里藏着你的身份"},{s:750,e:831,t:"什么浏览器 从哪跳过来 服务器全靠它判断"},
  {s:836,e:952,t:"服务器回来时带一个状态码"},
  {s:957,e:1020,t:"200 成功 404 页面不存在"},{s:1020,e:1084,t:"500 服务器自己挂了"},
  {s:1090,e:1150,t:"看到 404 是地址错了"},{s:1150,e:1213,t:"看到 500 才是网站的锅"},
  {s:1219,e:1333,t:"HTTP 还有个特点 无状态"},
  {s:1339,e:1410,t:"所以登录才需要 Cookie"},{s:1410,e:1487,t:"把身份记在浏览器里 下次自动带上"},
  {s:1492,e:1545,t:"最重要的一条"},{s:1545,e:1622,t:"HTTP 是明文传输 密码等于裸奔"},
  {s:1627,e:1753,t:"所以正式网站都要上 HTTPS"},
  {s:1759,e:1856,t:"这六条 就是 HTTP 最有用的核心"},
];

// 马克笔大标题
const SketchTitle: React.FC<{f:number;parts:{t:string;c:string}[];y?:number;size?:number;ud?:number}> = ({f,parts,y=64,size=92,ud=0}) => {
  const total = parts.reduce((a,x)=>a+x.t.length,0);
  const tw = total * size * 0.62;
  return (
    <div style={{position:"absolute",top:y,left:0,right:0,textAlign:"center"}}>
      <div style={{position:"relative",display:"inline-block"}}>
        <div style={{fontSize:size,fontWeight:900,fontFamily:F,letterSpacing:5,whiteSpace:"nowrap",opacity:prog(f,-99)}}>
          {parts.map((x,i)=><span key={i} style={{color:x.c}}>{x.t}</span>)}
        </div>
        <svg width={tw} height={20} style={{position:"absolute",left:"50%",transform:"translateX(-50%)",bottom:-14,overflow:"visible"}}>
          <path d={`M 4 10 ${Array.from({length:Math.round(tw/40)}).map(()=>`q 10 -9 20 0 q 10 9 20 0`).join(" ")}`}
            fill="none" stroke={RED} strokeWidth={7} strokeLinecap="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1-ease(prog(f,ud,14))}/>
        </svg>
      </div>
    </div>
  );
};

// 咖啡渍纸纹
const Paper: React.FC = () => (
  <svg width={W} height={H} style={{position:"absolute",left:0,top:0,pointerEvents:"none"}}>
    <rect width={W} height={H} fill={PAPER}/>
    <ellipse cx={1750} cy={170} rx={130} ry={90} fill="none" stroke="#8a5a2b" strokeWidth={10} opacity={0.10}/>
    <ellipse cx={1750} cy={170} rx={98} ry={62} fill="none" stroke="#8a5a2b" strokeWidth={6} opacity={0.07}/>
    <circle cx={150} cy={930} r={66} fill="#8a5a2b" opacity={0.05}/>
    <ellipse cx={1430} cy={990} rx={90} ry={38} fill="none" stroke="#8a5a2b" strokeWidth={8} opacity={0.06}/>
  </svg>
);

const Marker: React.FC<{f:number;d:number;x:number;y:number;w:number;h:number;c?:string}> = ({f,d,x,y,w,h,c=YEL}) => (
  <div style={{position:"absolute",left:x,top:y,width:w*prog(f,d,14),height:h,background:c,opacity:0.75,borderRadius:6}}/>
);
const Label2: React.FC<{f:number;d:number;text:string;x:number;y:number;w:number;size?:number;color?:string}> = ({f,d,text,x,y,w,size=32,color=INK}) => <div style={{position:"absolute",left:x,top:y,width:w,textAlign:"center",fontFamily:F,fontWeight:900,fontSize:size,color,opacity:prog(f,d),whiteSpace:"nowrap"}}>{text}</div>;
const Sparkle2: React.FC<{x:number;y:number}> = ({x,y}) => (
  <svg width={70} height={70} style={{position:"absolute",left:x-35,top:y-35,overflow:"visible"}}>
    <path d="M35 4 L42 28 L66 35 L42 42 L35 66 L28 42 L4 35 L28 28 Z" fill={YEL} stroke={INK} strokeWidth={2}/>
  </svg>
);

// 第 N 条：红色手绘编号徽章
const NumberBadge: React.FC<{f:number;d:number;n:string;x:number;y:number;s?:number}> = ({f,d,n,x,y,s=1}) => {
  const p = prog(f,d,14);
  if (p<=0) return null;
  return (
    <svg width={120*s} height={120*s} style={{position:"absolute",left:x-60*s,top:y-60*s,overflow:"visible",transform:"rotate(-8deg)",opacity:p}}>
      <circle cx={60} cy={60} r={48} fill={YEL} stroke={RED} strokeWidth={6} pathLength={1} strokeDasharray={1} strokeDashoffset={1-ease(p)}/>
      <text x={60} y={82} textAnchor="middle" fontFamily={F} fontWeight={900} fontSize={62} fill={RED}>{n}</text>
    </svg>
  );
};

// 草稿浏览器窗口
const SkBrowser: React.FC<{f:number;d:number;x:number;y:number;s?:number;label:string}> = ({f,d,x,y,s=1,label}) => {
  const p = prog(f,d,10);
  if (p<=0) return null;
  return (
    <svg width={360*s} height={280*s} style={{position:"absolute",left:x-180*s,top:y-140*s,overflow:"visible",opacity:p}}>
      <g transform={`scale(${s})`}>
        <rect x={0} y={0} width={360} height={280} rx={14} fill="#fff" stroke={INK} strokeWidth={6} {...sk(f,d,22)}/>
        <line x1={0} y1={56} x2={360} y2={56} stroke={INK} strokeWidth={5} {...sk(f,d+8,10)}/>
        <circle cx={34} cy={28} r={9} fill="none" stroke={INK} strokeWidth={4} {...sk(f,d+12,8)}/>
        <circle cx={64} cy={28} r={9} fill="none" stroke={INK} strokeWidth={4} {...sk(f,d+14,8)}/>
        <line x1={40} y1={120} x2={300} y2={120} stroke={SUBC} strokeWidth={5} strokeLinecap="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1-ease(prog(f,d+18,14))}/>
        <line x1={40} y1={160} x2={240} y2={160} stroke={SUBC} strokeWidth={5} strokeLinecap="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1-ease(prog(f,d+22,14))}/>
        <text x={180} y={244} textAnchor="middle" fontFamily={F} fontWeight={700} fontSize={30} fill={INK} opacity={prog(f,d+26)}>{label}</text>
      </g>
    </svg>
  );
};

// 草稿服务器塔
const SkServer: React.FC<{f:number;d:number;x:number;y:number;s?:number;label:string}> = ({f,d,x,y,s=1,label}) => {
  const p = prog(f,d,10);
  if (p<=0) return null;
  return (
    <svg width={220*s} height={300*s} style={{position:"absolute",left:x-110*s,top:y-150*s,overflow:"visible",opacity:p}}>
      <g transform={`scale(${s})`}>
        <rect x={0} y={0} width={150} height={280} rx={12} fill="#fff" stroke={INK} strokeWidth={6} {...sk(f,d,22)}/>
        <line x1={24} y1={60} x2={126} y2={60} stroke={SUBC} strokeWidth={5} strokeLinecap="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1-ease(prog(f,d+10,12))}/>
        <line x1={24} y1={100} x2={126} y2={100} stroke={SUBC} strokeWidth={5} strokeLinecap="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1-ease(prog(f,d+14,12))}/>
        <line x1={24} y1={140} x2={126} y2={140} stroke={SUBC} strokeWidth={5} strokeLinecap="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1-ease(prog(f,d+18,12))}/>
        <circle cx={75} cy={210} r={14} fill="none" stroke={GREEN} strokeWidth={5} {...sk(f,d+22,10)}/>
        <text x={75} y={266} textAnchor="middle" fontFamily={F} fontWeight={700} fontSize={30} fill={INK} opacity={prog(f,d+26)}>{label}</text>
      </g>
    </svg>
  );
};

// 手绘箭头
const SkArrow: React.FC<{f:number;d:number;x1:number;y1:number;x2:number;y2:number;color?:string;sw?:number;curve?:number;label?:string;lc?:string;ts?:number}> = ({f,d,x1,y1,x2,y2,color=INK,sw=7,curve,label,lc,ts=30}) => {
  const p = ease(prog(f,d,22));
  if (p<=0) return null;
  const mx=(x1+x2)/2, my=(y1+y2)/2 - (curve||0);
  const t2x=(1-p)*(1-p)*x1+2*(1-p)*p*mx+p*p*x2, t2y=(1-p)*(1-p)*y1+2*(1-p)*p*my+p*p*y2;
  const dx=x2-mx, dy=y2-my, L=Math.hypot(dx,dy)||1, ux=dx/L, uy=dy/L;
  return (
    <g>
      <path d={`M ${x1} ${y1} Q ${mx} ${my} ${t2x} ${t2y}`} fill="none" stroke={color} strokeWidth={sw} strokeLinecap="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1-p}/>
      {p>0.85 ? <path d={`M ${x2-ux*26+(-uy)*14} ${y2-uy*26+(ux)*14} L ${t2x} ${t2y} L ${x2-ux*26-(-uy)*14} ${y2-uy*26-(ux)*14}`} fill="none" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round"/> : null}
      {label ? <text x={(x1+x2)/2} y={my-16} textAnchor="middle" fontFamily={F} fontWeight={900} fontSize={ts} fill={lc||color} opacity={prog(f,d+18,12)}>{label}</text> : null}
    </g>
  );
};

// 手绘方框
const SkBox: React.FC<{f:number;d:number;x:number;y:number;w:number;h:number;stroke?:string;fill?:string;sw?:number;text?:string;ts?:number;tc?:string}> = ({f,d,x,y,w,h,stroke=INK,fill="none",sw=6,text,ts=40,tc}) => {
  const p = prog(f,d,20);
  if (p<=0) return null;
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} rx={12} fill={fill} stroke={stroke} strokeWidth={sw} pathLength={1} strokeDasharray={1} strokeDashoffset={1-ease(p)}/>
      {text ? <text x={x+w/2} y={y+h/2+ts*0.36} textAnchor="middle" fontFamily={F} fontWeight={900} fontSize={ts} fill={tc||stroke} opacity={prog(f,d+14,12)}>{text}</text> : null}
    </g>
  );
};

// 手绘报文行（等宽字）
const SkMono: React.FC<{f:number;d:number;x:number;y:number;text:string;color?:string;fs?:number}> = ({f,d,x,y,text,color=INK,fs=38}) => (
  <text x={x} y={y} fontFamily={MONO} fontWeight={700} fontSize={fs} fill={color} opacity={prog(f,d,14)}>{text}</text>
);

// 白板气泡
const SpeechB: React.FC<{f:number;d:number;x:number;y:number;w:number;h:number;text:string;c?:string;ts?:number}> = ({f,d,x,y,w,h,text,c=INK,ts=38}) => {
  const p = prog(f,d,16);
  if (p<=0) return null;
  return (
    <g opacity={p}>
      <rect x={x} y={y} width={w} height={h} rx={20} fill="#fff" stroke={c} strokeWidth={5} pathLength={1} strokeDasharray={1} strokeDashoffset={1-ease(p)}/>
      <path d={`M ${x+60} ${y+h} L ${x+30} ${y+h+34} L ${x+110} ${y+h}`} fill="#fff" stroke={c} strokeWidth={5}/>
      <text x={x+w/2} y={y+h/2+14} textAnchor="middle" fontFamily={F} fontWeight={900} fontSize={ts} fill={INK}>{text}</text>
    </g>
  );
};

const Subtitle: React.FC = () => {const f=useCurrentFrame();const cur=subs.find(s=>f>=s.s&&f<s.e);if(!cur)return null;return <div style={{position:"absolute",bottom:34,left:0,right:0,zIndex:50,display:"flex",justifyContent:"center"}}><div style={{background:"rgba(247,214,110,.94)",borderRadius:12,padding:"12px 36px",fontFamily:F,fontWeight:900,fontSize:44,color:INK,letterSpacing:2,whiteSpace:"nowrap",boxShadow:"0 4px 0 rgba(180,140,30,.35)"}}>{cur.t}</div></div>;};

// ---------- P1 HTTP 是什么（0-144） ----------
const PageWhat: React.FC<{off:number}> = ({off}) => {const f=useCurrentFrame()-off;return <AbsoluteFill>
  <SketchTitle f={f} ud={0} parts={[{t:"HTTP",c:INK},{t:" 是什么？",c:RED}]}/>
  <SkBrowser f={f} d={0} x={400} y={560} s={1.15} label="你的浏览器"/>
  <SkServer f={f} d={6} x={1520} y={560} s={1.15} label="网站服务器"/>
  <svg width={W} height={H} style={{position:"absolute",inset:0,pointerEvents:"none"}}>
    <SkArrow f={f} d={14} x1={640} y1={520} x2={1300} y2={520} color={BLUE} curve={40} label="请求" lc={BLUE}/>
    <SkArrow f={f} d={22} x1={1300} y1={660} x2={640} y2={660} color={GREEN} curve={40} label="响应" lc={GREEN}/>
  </svg>
  {[["刷网页",620],["点链接",940],["发请求",1260]].map((c,i)=>(
    <g key={i}>
      <SkBox f={f} d={30+i*8} x={(c[1] as number)-110} y={780} w={220} h={72} stroke={SUBC} fill="#fff" sw={4} text={c[0] as string} ts={32} tc={SUBC}/>
    </g>
  ))}
  <Marker f={f} d={56} x={700} y={900} w={520} h={56}/>
  <Label2 f={f} d={60} text="传数据的规矩" x={700} y={900} w={520}/>
  <text x={960} y={300} textAnchor="middle" fontFamily={F} fontWeight={900} fontSize={50} fill={RED} opacity={prog(f,40,14)}>你每天都在用它</text>
</AbsoluteFill>;};

// ---------- P2 一问一答（144-252）第①条 ----------
const PageRoundTrip: React.FC<{off:number}> = ({off}) => {const f=useCurrentFrame()-off;return <AbsoluteFill>
  <SketchTitle f={f} parts={[{t:"第①条：一问一答",c:INK}]}/>
  <NumberBadge f={f} d={0} n="①" x={166} y={300}/>
  <svg width={W} height={H} style={{position:"absolute",inset:0,pointerEvents:"none"}}>
    <SkBox f={f} d={4} x={200} y={330} w={420} h={200} stroke={BLUE} fill="#fff" text="浏览器" ts={52} tc={BLUE}/>
    <SkBox f={f} d={10} x={1300} y={330} w={420} h={200} stroke={GREEN} fill="#fff" text="服务器" ts={52} tc={GREEN}/>
    <SkBox f={f} d={26} x={700} y={210} w={520} h={80} stroke={BLUE} fill="#fff" sw={5}/>
    <SkMono f={f} d={34} x={740} y={266} text="GET /index.html" color={BLUE} fs={36}/>
    <SkBox f={f} d={44} x={700} y={620} w={520} h={80} stroke={GREEN} fill="#fff" sw={5}/>
    <SkMono f={f} d={52} x={740} y={676} text="200 OK · 网页内容" color={GREEN} fs={36}/>
    <SkArrow f={f} d={20} x1={640} y1={470} x2={1280} y2={430} color={BLUE} sw={8} curve={-30}/>
    <SkArrow f={f} d={38} x1={1280} y1={560} x2={640} y2={600} color={GREEN} sw={8} curve={-30}/>
  </svg>
  {[["请求 = 你想要什么",250],["响应 = 服务器给什么",760],["一来一回 = 一次 HTTP 通信",1270]].map((c,i)=>(
    <g key={i}>
      <Marker f={f} d={62+i*10} x={(c[1] as number)-230} y={870} w={460} h={52} c={i===2?"#cfe3c8":YEL}/>
      <Label2 f={f} d={64+i*10} text={c[0] as string} x={(c[1] as number)-230} y={870} w={460} size={30}/>
    </g>
  ))}
</AbsoluteFill>;};

// ---------- P3 GET / POST（252-406）第②条 ----------
const PageMethods: React.FC<{off:number}> = ({off}) => {const f=useCurrentFrame()-off;return <AbsoluteFill>
  <SketchTitle f={f} parts={[{t:"第②条：",c:INK},{t:"GET",c:BLUE},{t:" 拿 ",c:INK},{t:"POST",c:ORANGE},{t:" 交",c:ORANGE}]}/>
  <NumberBadge f={f} d={0} n="②" x={166} y={300}/>
  <SkBox f={f} d={6} x={200} y={270} w={700} h={480} stroke={BLUE} fill="#fff" sw={7}/>
  <text x={550} y={400} textAnchor="middle" fontFamily={MONO} fontWeight={700} fontSize={72} fill={BLUE} opacity={prog(f,16,14)}>GET</text>
  <SkMono f={f} d={26} x={260} y={470} text="GET /index.html" color={BLUE} fs={36}/>
  <SkArrow f={f} d={34} x1={430} y1={510} x2={430} y2={590} color={BLUE} sw={7}/>
  <Label2 f={f} d={40} text="拿数据：打开网页 · 搜索" x={200} y={630} w={700}/>
  <SkBox f={f} d={12} x={1020} y={270} w={700} h={480} stroke={ORANGE} fill="#fff" sw={7}/>
  <text x={1370} y={400} textAnchor="middle" fontFamily={MONO} fontWeight={700} fontSize={72} fill={ORANGE} opacity={prog(f,22,14)}>POST</text>
  <SkMono f={f} d={32} x={1080} y={470} text="POST /login  账号+密码" color={ORANGE} fs={36}/>
  <SkArrow f={f} d={40} x1={1250} y1={510} x2={1250} y2={590} color={ORANGE} sw={7}/>
  <Label2 f={f} d={46} text="交数据：登录 · 提交表单" x={1020} y={630} w={700}/>
  <Marker f={f} d={60} x={660} y={820} w={600} h={60}/>
  <Label2 f={f} d={64} text="别搞混：拿用 GET 交用 POST" x={660} y={820} w={600}/>
</AbsoluteFill>;};

// ---------- P4 请求头（406-662）第③条 ----------
const PageHeaders: React.FC<{off:number}> = ({off}) => {const f=useCurrentFrame()-off;return <AbsoluteFill>
  <SketchTitle f={f} parts={[{t:"第③条：请求头",c:INK},{t:" = 你的身份",c:RED}]}/>
  <NumberBadge f={f} d={0} n="③" x={166} y={300}/>
  <svg width={W} height={H} style={{position:"absolute",inset:0,pointerEvents:"none"}}>
    <SkBox f={f} d={6} x={330} y={260} w={1260} h={520} stroke={INK} fill="#fff" sw={6}/>
    <SkMono f={f} d={16} x={400} y={360} text="Host:      xiaoxiu.cloud    ← 访问哪个网站" color={INK} fs={38}/>
    <SkMono f={f} d={30} x={400} y={470} text="User-Agent: Chrome         ← 什么浏览器" color={INK} fs={38}/>
    <SkMono f={f} d={44} x={400} y={580} text="Referer:   google.com      ← 从哪跳过来" color={INK} fs={38}/>
    <SkMono f={f} d={58} x={400} y={690} text="Cookie:    token=abc123    ← 是否登录过" color={INK} fs={38}/>
  </svg>
  <Marker f={f} d={32} x={1055} y={330} w={330} h={48}/>
  <Marker f={f} d={46} x={1055} y={440} w={330} h={48}/>
  <Marker f={f} d={60} x={1055} y={550} w={330} h={48}/>
  <Marker f={f} d={74} x={1055} y={660} w={330} h={48} c="#cfe3c8"/>
  <svg width={W} height={H} style={{position:"absolute",inset:0,pointerEvents:"none"}}>
    <SpeechB f={f} d={88} x={520} y={830} w={880} h={110} text="服务器：哦原来是他，给他看登录后的页面" c={GREEN} ts={40}/>
  </svg>
</AbsoluteFill>;};

// ---------- P5 状态码（662-1213）第④条 ----------
const PageStatus: React.FC<{off:number}> = ({off}) => {const f=useCurrentFrame()-off;return <AbsoluteFill>
  <SketchTitle f={f} parts={[{t:"第④条：状态码",c:INK},{t:" = 三个数字说结果",c:SUBC}]}/>
  <NumberBadge f={f} d={0} n="④" x={166} y={300}/>
  {/* 地址栏 */}
  <svg width={W} height={H} style={{position:"absolute",inset:0,pointerEvents:"none"}}>
    <SkBox f={f} d={100} x={560} y={300} w={800} h={90} stroke={SUBC} fill="#fff" sw={4}/>
    <circle cx={620} cy={345} r={16} fill={GREEN}/>
    <SkMono f={f} d={112} x={660} y={360} text="https://xiaoxiu.cloud/posts" color={INK} fs={34}/>
  </svg>
  {/* 三张返回卡片 */}
  <SkBox f={f} d={170} x={200} y={450} w={480} h={330} stroke={GREEN} fill="#fff" sw={7}/>
  <text x={440} y={600} textAnchor="middle" fontFamily={F} fontWeight={900} fontSize={130} fill={GREEN} opacity={prog(f,180,16)}>200</text>
  <Label2 f={f} d={196} text="成功 · 页面正常打开" x={200} y={660} w={480} size={30}/>
  <SkBox f={f} d={230} x={720} y={450} w={480} h={330} stroke={ORANGE} fill="#fff" sw={7}/>
  <text x={960} y={600} textAnchor="middle" fontFamily={F} fontWeight={900} fontSize={130} fill={ORANGE} opacity={prog(f,240,16)}>404</text>
  <Label2 f={f} d={256} text="页面不存在" x={720} y={660} w={480} size={30}/>
  <SkBox f={f} d={290} x={1240} y={450} w={480} h={330} stroke={RED} fill="#fff" sw={7}/>
  <text x={1480} y={600} textAnchor="middle" fontFamily={F} fontWeight={900} fontSize={130} fill={RED} opacity={prog(f,300,16)}>500</text>
  <Label2 f={f} d={316} text="服务器自己挂了" x={1240} y={660} w={480} size={30}/>
  {/* 归责注释 */}
  <Marker f={f} d={440} x={280} y={810} w={320} h={50}/>
  <Label2 f={f} d={444} text="地址错了 是你的问题" x={280} y={810} w={320} size={28}/>
  <Marker f={f} d={455} x={1320} y={810} w={320} h={50} c="#f5c6c2"/>
  <Label2 f={f} d={458} text="才是网站的锅" x={1320} y={810} w={320} size={28}/>
  {/* 口诀 */}
  <svg width={W} height={H} style={{position:"absolute",inset:0,pointerEvents:"none"}}>
    <SkBox f={f} d={490} x={410} y={890} w={1100} h={100} stroke={INK} fill={PAPER} sw={5}/>
  </svg>
  <Label2 f={f} d={500} text="口诀：2xx 成功 · 4xx 你的问题 · 5xx 服务器的问题" x={410} y={922} w={1100} size={36}/>
</AbsoluteFill>;};

// ---------- P6 无状态 + Cookie（1213-1486）第⑤条 ----------
const PageCookie: React.FC<{off:number}> = ({off}) => {const f=useCurrentFrame()-off;return <AbsoluteFill>
  <SketchTitle f={f} parts={[{t:"第⑤条：",c:INK},{t:"无状态",c:INK},{t:" 与 ",c:SUBC},{t:"Cookie",c:ORANGE}]}/>
  <NumberBadge f={f} d={0} n="⑤" x={166} y={300}/>
  <svg width={W} height={H} style={{position:"absolute",inset:0,pointerEvents:"none"}}>
    <SkBox f={f} d={4} x={230} y={330} w={420} h={200} stroke={BLUE} fill="#fff" text="你的浏览器" ts={48} tc={BLUE}/>
    <SkBox f={f} d={10} x={1300} y={330} w={420} h={200} stroke={GREEN} fill="#fff" text="服务器" ts={48} tc={GREEN}/>
    <SpeechB f={f} d={20} x={1330} y={160} w={360} h={100} text="你是谁来着？" c={INK} ts={36}/>
    <SkArrow f={f} d={30} x1={670} y1={430} x2={1280} y2={430} color={INK} sw={7} label="登录：POST 账号密码" lc={INK} ts={30}/>
    <SkBox f={f} d={48} x={700} y={560} w={520} h={110} stroke={ORANGE} fill="#fff" text="Cookie：身份卡" ts={40} tc={ORANGE}/>
    <SkArrow f={f} d={62} x1={900} y1={690} x2={480} y2={690} color={ORANGE} sw={7} curve={40} label="存进浏览器" lc={ORANGE} ts={30}/>
    <SkArrow f={f} d={80} x1={480} y1={780} x2={1280} y2={780} color={GREEN} sw={7} curve={30} label="下次访问自动带上 → 服务器认出你" lc={GREEN} ts={30}/>
  </svg>
</AbsoluteFill>;};

// ---------- P7 HTTPS（1486-1753）第⑥条 ----------
const PageHttps: React.FC<{off:number}> = ({off}) => {const f=useCurrentFrame()-off;return <AbsoluteFill>
  <SketchTitle f={f} parts={[{t:"第⑥条：",c:INK},{t:"最重要的",c:RED},{t:" HTTPS",c:GREEN}]}/>
  <NumberBadge f={f} d={0} n="⑥" x={166} y={300}/>
  <svg width={W} height={H} style={{position:"absolute",inset:0,pointerEvents:"none"}}>
    <SkBox f={f} d={6} x={150} y={300} w={700} h={430} stroke={RED} fill="#fff" sw={7}/>
    <text x={500} y={400} textAnchor="middle" fontFamily={F} fontWeight={900} fontSize={52} fill={RED} opacity={prog(f,16,14)}>HTTP：明文</text>
    <SkMono f={f} d={26} x={230} y={490} text="密码：123456" color={RED} fs={44}/>
    <SkArrow f={f} d={44} x1={880} y1={500} x2={1090} y2={500} color={INK} sw={9} label="上锁" lc={INK} ts={34}/>
    <SkBox f={f} d={56} x={1110} y={300} w={700} h={430} stroke={GREEN} fill="#fff" sw={7}/>
    <text x={1460} y={400} textAnchor="middle" fontFamily={F} fontWeight={900} fontSize={52} fill={GREEN} opacity={prog(f,66,14)}>HTTPS：上锁</text>
    <circle cx={1460} cy={480} r={24} fill="none" stroke={INK} strokeWidth={7} {...sk(f,80,14)}/>
    <rect x={1428} y={480} width={64} height={50} rx={9} fill={YEL} stroke={INK} strokeWidth={5} {...sk(f,86,12)}/>
  </svg>
  <Label2 f={f} d={95} text="数据锁起来 路上看不到" x={1110} y={560} w={700}/>
  <Marker f={f} d={110} x={430} y={830} w={1060} h={60} c="#cfe3c8"/>
  <Label2 f={f} d={114} text="部署网站第一步：配 HTTPS 证书（免费的就行）" x={430} y={830} w={1060}/>
</AbsoluteFill>;};

// ---------- P8 总结图（1753-1906） ----------
const PageSummaryMap: React.FC<{off:number}> = ({off}) => {const f=useCurrentFrame()-off;return <AbsoluteFill>
  <SketchTitle f={f} parts={[{t:"HTTP 核心",c:INK},{t:" 6 条",c:RED}]}/>
  <svg width={W} height={H} style={{position:"absolute",inset:0,pointerEvents:"none"}}>
    {[["① 一问一答",300,320],["② GET·POST",760,280],["③ 请求头",1220,320],["④ 状态码",1560,530],["⑤ Cookie",1220,740],["⑥ HTTPS",760,780],["①",300,320]].map((n,i)=>i<6?(
      <g key={i}>
        <line x1={960} y1={530} x2={n[1] as number} y2={n[2] as number} stroke={SUBC} strokeWidth={4} pathLength={1} strokeDasharray={1} strokeDashoffset={1-ease(prog(f,80+i*8,14))}/>
        <SkBox f={f} d={i*12} x={(n[1] as number)-170} y={(n[2] as number)-55} w={340} h={110} stroke={INK} fill="#fff" sw={5} text={n[0] as string} ts={40}/>
      </g>
    ):null)}
    <circle cx={960} cy={530} r={86} fill={YEL} stroke={RED} strokeWidth={6} {...sk(f,0,18)}/>
    <text x={960} y={548} textAnchor="middle" fontFamily={F} fontWeight={900} fontSize={54} fill={RED} opacity={prog(f,14,12)}>HTTP</text>
  </svg>
  <Marker f={f} d={130} x={710} y={880} w={500} h={56}/>
  <Label2 f={f} d={134} text="收藏这一页" x={710} y={880} w={500}/>
</AbsoluteFill>;};

const PageTurn: React.FC<{children:React.ReactNode;off:number;len:number;first:boolean;last:boolean}> = ({children,off,len,first,last}) => {
  const frame = useCurrentFrame();
  const oIn = first ? 1 : interpolate(frame,[0,8],[0,1],clamp);
  const lf = frame - off;
  const oOut = last ? 1 : interpolate(lf,[len-8,len],[1,0],clamp);
  return <AbsoluteFill style={{opacity:Math.min(oIn,oOut)}}>{children}</AbsoluteFill>;
};

const PAGES = [
  {C:PageWhat,start:0,end:144},{C:PageRoundTrip,start:144,end:252},{C:PageMethods,start:252,end:406},
  {C:PageHeaders,start:406,end:662},{C:PageStatus,start:662,end:1213},{C:PageCookie,start:1213,end:1486},
  {C:PageHttps,start:1486,end:1753},{C:PageSummaryMap,start:1753,end:DUR},
];

export const HttpSketch: React.FC = () => {
  const frame = useCurrentFrame();
  const bed = interpolate(frame,[0,20,DUR-40,DUR-6],[0,.06,0.06,0],clamp);
  return (
    <AbsoluteFill style={{background:PAPER,fontFamily:F,overflow:"hidden"}}>
      <Paper/>
      {PAGES.map(({C,start,end},i)=>{
        const first=i===0,last=i===PAGES.length-1,len=end-start,off=first?0:10;
        return <Sequence key={i} from={first?0:start-10} durationInFrames={len+12}>
          <PageTurn off={off} len={len} first={first} last={last}><C off={off}/></PageTurn>
        </Sequence>;
      })}
      <div style={{position:"absolute",top:40,right:64,zIndex:45,fontFamily:F,fontWeight:900,fontSize:30,color:INK,letterSpacing:5,opacity:.85,transform:"rotate(-2deg)"}}>小秋</div>
      {voiceLines.map((s,i)=><Sequence key={i} from={s.start} durationInFrames={s.end-s.start+20}><Audio src={staticFile(`audio/http-core-tts/${s.audio}`)} volume={1}/></Sequence>)}
      {[144,252,406,662,1213,1486,1753].map(t=><Sequence key={`turn-${t}`} from={t-5} durationInFrames={16}><Audio src={staticFile("audio/sfx/transfer.wav")} volume={.13}/></Sequence>)}
      {[150,258,412,668,860,1219,1339,1492,1627,1759].map(t=><Sequence key={`draw-${t}`} from={t} durationInFrames={10}><Audio src={staticFile("audio/sfx/whoosh.wav")} volume={.08}/></Sequence>)}
      <Sequence from={960} durationInFrames={14}><Audio src={staticFile("audio/sfx/ding.wav")} volume={.4}/></Sequence>
      <Sequence from={1492} durationInFrames={24}><Audio src={staticFile("audio/sfx/error.wav")} volume={.35}/></Sequence>
      <Sequence from={1759} durationInFrames={12}><Audio src={staticFile("audio/sfx/pop.wav")} volume={.35}/></Sequence>
      <Audio src={staticFile("audio/bed.wav")} loop volume={()=>bed}/>
      <Subtitle/>
    </AbsoluteFill>
  );
};
