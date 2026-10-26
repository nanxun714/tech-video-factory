import {Audio} from "@remotion/media";
import {
  AbsoluteFill,
  interpolate,
  Sequence,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import {
  ipOctets,
  maskOctets,
  subnetAudioFolder,
  subnetDurationInFrames,
  subnetPalette as P,
  subnetSentences,
  subnetSubtitles,
} from "./subnetMaskExplainerData";

const FONT = "'PingFang SC', 'Microsoft YaHei', 'Noto Sans SC', sans-serif";
const MONO = "Consolas, Menlo, 'Courier New', monospace";

const octetColor = (name: string) => {
  switch (name) {
    case "blue":
      return {fg: P.blue, bg: P.blueBg, bd: P.blueBorder};
    case "green":
      return {fg: P.green, bg: P.greenBg, bd: P.greenBorder};
    case "purple":
      return {fg: P.purple, bg: P.purpleBg, bd: P.purpleBorder};
    default:
      return {fg: P.orange, bg: P.orangeBg, bd: P.orangeBorder};
  }
};

// ---------- primitives ----------

const PopIn: React.FC<{
  delay?: number;
  children: React.ReactNode;
  style?: React.CSSProperties;
  dy?: number;
}> = ({delay = 0, children, style, dy = 18}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const s = spring({frame: frame - delay, fps, config: {damping: 14, stiffness: 160}});
  const opacity = interpolate(s, [0, 1], [0, 1]);
  return (
    <div
      style={{
        transform: `translateY(${(1 - s) * dy}px) scale(${interpolate(s, [0, 1], [0.9, 1])})`,
        opacity,
        ...style,
      }}
    >
      {children}
    </div>
  );
};

const FadeIn: React.FC<{delay?: number; children: React.ReactNode; style?: React.CSSProperties}> = ({
  delay = 0,
  children,
  style,
}) => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [delay, delay + 12], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return <div style={{opacity, ...style}}>{children}</div>;
};

const SceneTitle: React.FC<{text: React.ReactNode}> = ({text}) => {
  return (
    <div
      style={{
        position: "absolute",
        top: 64,
        left: 0,
        right: 0,
        display: "flex",
        justifyContent: "center",
        fontSize: 56,
        fontWeight: 800,
        color: P.title,
        letterSpacing: 2,
      }}
    >
      {text}
    </div>
  );
};

const Chip: React.FC<{
  fg: string;
  bg: string;
  bd: string;
  children: React.ReactNode;
  mono?: boolean;
  size?: number;
  pad?: [number, number];
}> = ({fg, bg, bd, children, mono, size = 34, pad = [14, 30]}) => (
  <div
    style={{
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: bg,
      border: `1.5px solid ${bd}`,
      color: fg,
      borderRadius: 16,
      padding: `${pad[0]}px ${pad[1]}px`,
      fontSize: size,
      fontWeight: 700,
      fontFamily: mono ? MONO : FONT,
      letterSpacing: mono ? 1 : 0,
      whiteSpace: "nowrap",
    }}
  >
    {children}
  </div>
);

const MonitorIcon: React.FC<{size?: number; color?: string}> = ({size = 64, color = "#334155"}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <rect x="2.5" y="4" width="19" height="13" rx="2" stroke={color} strokeWidth="1.8" />
    <path d="M9 21h6M12 17v4" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
  </svg>
);

const RouterIcon: React.FC<{size?: number; color?: string}> = ({size = 72, color = "#334155"}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <rect x="3" y="13" width="18" height="7" rx="2" stroke={color} strokeWidth="1.8" />
    <path
      d="M7 13l5-9 5 9M12 4v6"
      stroke={color}
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <circle cx="7.2" cy="16.5" r="1" fill={color} />
    <circle cx="10.2" cy="16.5" r="1" fill={color} />
  </svg>
);

const Subtitle: React.FC = () => {
  const frame = useCurrentFrame();
  const current = subnetSubtitles.find((s) => frame >= s.startFrame && frame < s.endFrame);
  if (!current) {
    return null;
  }
  const local = frame - current.startFrame;
  const s = spring({frame: local, fps: 30, config: {damping: 16, stiffness: 200}});
  return (
    <div
      style={{
        position: "absolute",
        bottom: 52,
        left: 0,
        right: 0,
        display: "flex",
        justifyContent: "center",
        pointerEvents: "none",
      }}
    >
      <div
        style={{
          fontSize: 50,
          fontWeight: 700,
          color: "#ffffff",
          fontFamily: FONT,
          letterSpacing: 2,
          transform: `translateY(${(1 - s) * 10}px)`,
          opacity: interpolate(s, [0, 1], [0.4, 1]),
          textShadow:
            "0 0 6px rgba(0,0,0,0.85), 0 2px 4px rgba(0,0,0,0.85), -1.5px 0 0 rgba(0,0,0,0.7), 1.5px 0 0 rgba(0,0,0,0.7), 0 -1.5px 0 rgba(0,0,0,0.7), 0 1.5px 0 rgba(0,0,0,0.7)",
        }}
      >
        {current.text}
      </div>
    </div>
  );
};

const FlowArrow: React.FC<{
  x: number;
  y: number;
  len: number;
  color: string;
  delay: number;
  label?: string;
  vertical?: boolean;
  dashed?: boolean;
}> = ({x, y, len, color, delay, label, vertical, dashed}) => {
  const frame = useCurrentFrame();
  const prog = interpolate(frame, [delay, delay + 22], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const drawLen = len * prog;
  const dashOffset = -frame * 1.6;
  return (
    <div style={{position: "absolute", left: x, top: y}}>
      <svg
        width={vertical ? 60 : len + 40}
        height={vertical ? len + 40 : 60}
        style={{overflow: "visible"}}
      >
        {vertical ? (
          <>
            <line
              x1={30}
              y1={0}
              x2={30}
              y2={drawLen}
              stroke={color}
              strokeWidth={3.5}
              strokeDasharray={dashed ? "10 8" : "1 0"}
              strokeDashoffset={dashed ? dashOffset : 0}
            />
            <polygon
              points={`24,${drawLen - 2} 36,${drawLen - 2} 30,${drawLen + 10}`}
              fill={color}
              opacity={prog > 0.95 ? 1 : 0}
            />
          </>
        ) : (
          <>
            <line
              x1={0}
              y1={30}
              x2={drawLen}
              y2={30}
              stroke={color}
              strokeWidth={3.5}
              strokeDasharray={dashed ? "10 8" : "1 0"}
              strokeDashoffset={dashed ? dashOffset : 0}
            />
            <polygon
              points={`${drawLen - 2},24 ${drawLen - 2},36 ${drawLen + 10},30`}
              fill={color}
              opacity={prog > 0.95 ? 1 : 0}
            />
          </>
        )}
      </svg>
      {label ? (
        <div
          style={{
            position: "absolute",
            left: vertical ? 44 : len * 0.5 - 60,
            top: vertical ? len * 0.4 : -40,
            width: 120,
            textAlign: "center",
            fontSize: 24,
            fontWeight: 700,
            color,
            opacity: prog,
          }}
        >
          {label}
        </div>
      ) : null}
    </div>
  );
};

// ---------- scenes ----------

const SceneHook: React.FC = () => (
  <AbsoluteFill>
    <SceneTitle text="有了 IP，为什么还要子网掩码？" />
    <div
      style={{
        position: "absolute",
        top: 250,
        left: 0,
        right: 0,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 40,
      }}
    >
      <PopIn delay={8}>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 16,
            backgroundColor: P.card,
            border: `1.5px solid ${P.border}`,
            borderRadius: 24,
            padding: "30px 70px",
            boxShadow: "0 10px 26px rgba(15,23,42,0.06)",
          }}
        >
          <MonitorIcon size={72} />
          <div style={{fontSize: 30, fontWeight: 700, color: P.body}}>本机</div>
          <Chip fg={P.blue} bg={P.blueBg} bd={P.blueBorder} mono size={38}>
            192.168.1.10
          </Chip>
        </div>
      </PopIn>
      <PopIn delay={40} dy={-8}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 18,
            fontSize: 38,
            fontWeight: 700,
            color: P.red,
          }}
        >
          <div
            style={{
              width: 46,
              height: 46,
              borderRadius: 999,
              backgroundColor: P.redBg,
              border: `1.5px solid ${P.redBorder}`,
              color: P.red,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 28,
            }}
          >
            ✕
          </div>
          只有 IP，还差一步
        </div>
      </PopIn>
    </div>
  </AbsoluteFill>
);

const SceneBinary: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill>
      <SceneTitle text="IPv4，本质是 32 位二进制数" />
      <div
        style={{
          position: "absolute",
          top: 300,
          left: 0,
          right: 0,
          display: "flex",
          justifyContent: "center",
          gap: 44,
        }}
      >
        {ipOctets.map((o, gi) => {
          const c = octetColor(o.color);
          return (
            <div key={gi} style={{display: "flex", flexDirection: "column", alignItems: "center", gap: 18}}>
              <div style={{display: "flex", gap: 7}}>
                {o.binary.split("").map((bit, bi) => {
                  const delay = gi * 14 + bi * 3;
                  const on = frame >= delay;
                  return (
                    <div
                      key={bi}
                      style={{
                        width: 44,
                        height: 56,
                        borderRadius: 10,
                        backgroundColor: on ? c.bg : "#f3f4f6",
                        border: `1.5px solid ${on ? c.bd : P.border}`,
                        color: on ? c.fg : "#cbd5e1",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 26,
                        fontWeight: 700,
                        fontFamily: MONO,
                        opacity: on ? 1 : 0.6,
                        transform: on ? "scale(1)" : "scale(0.85)",
                        transition: "none",
                      }}
                    >
                      {bit}
                    </div>
                  );
                })}
              </div>
              <FadeIn delay={130 + gi * 8}>
                <div style={{fontSize: 22, color: P.muted, fontWeight: 700}}>8 位</div>
              </FadeIn>
              <PopIn delay={150 + gi * 8}>
                <Chip fg={c.fg} bg={c.bg} bd={c.bd} mono size={42} pad={[10, 26]}>
                  {o.decimal}
                </Chip>
              </PopIn>
            </div>
          );
        })}
      </div>
      <FadeIn delay={195}>
        <div
          style={{
            position: "absolute",
            top: 585,
            left: 0,
            right: 0,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            gap: 26,
          }}
        >
          <div style={{fontSize: 40, fontWeight: 800, color: P.title, fontFamily: MONO}}>
            192 . 168 . 1 . 10
          </div>
        </div>
      </FadeIn>
      <FadeIn delay={230}>
        <div
          style={{
            position: "absolute",
            top: 668,
            left: 0,
            right: 0,
            display: "flex",
            justifyContent: "center",
          }}
        >
          <Chip fg={P.body} bg="#f3f4f6" bd={P.border} size={26} pad={[10, 26]}>
            点分十进制
          </Chip>
        </div>
      </FadeIn>
    </AbsoluteFill>
  );
};

const SceneTwoParts: React.FC = () => {
  const frame = useCurrentFrame();
  const split = frame >= 30;
  return (
    <AbsoluteFill>
      <SceneTitle text="IP 分成两段：网络 + 主机" />
      <div
        style={{
          position: "absolute",
          top: 340,
          left: 0,
          right: 0,
          display: "flex",
          justifyContent: "center",
        }}
      >
        {!split ? (
          <PopIn delay={4}>
            <div
              style={{
                backgroundColor: P.card,
                border: `1.5px solid ${P.border}`,
                borderRadius: 18,
                padding: "22px 60px",
                fontSize: 54,
                fontWeight: 800,
                color: P.title,
                fontFamily: MONO,
                boxShadow: "0 10px 26px rgba(15,23,42,0.06)",
              }}
            >
              192.168.1.10
            </div>
          </PopIn>
        ) : (
          <div style={{display: "flex", flexDirection: "column", alignItems: "center", gap: 30}}>
            <div style={{display: "flex", alignItems: "flex-end", gap: 14}}>
              <div style={{display: "flex", flexDirection: "column", alignItems: "center", gap: 12}}>
                <FadeIn delay={6}>
                  <div style={{fontSize: 28, fontWeight: 800, color: P.blue}}>网络部分</div>
                </FadeIn>
                <PopIn delay={6}>
                  <div
                    style={{
                      backgroundColor: P.blueBg,
                      border: `2px solid ${P.blueBorder}`,
                      borderRadius: 18,
                      padding: "22px 46px",
                      fontSize: 54,
                      fontWeight: 800,
                      color: P.blue,
                      fontFamily: MONO,
                    }}
                  >
                    192.168.1.
                  </div>
                </PopIn>
              </div>
              <div style={{display: "flex", flexDirection: "column", alignItems: "center", gap: 12}}>
                <FadeIn delay={16}>
                  <div style={{fontSize: 28, fontWeight: 800, color: P.orange}}>主机部分</div>
                </FadeIn>
                <PopIn delay={16}>
                  <div
                    style={{
                      backgroundColor: P.orangeBg,
                      border: `2px solid ${P.orangeBorder}`,
                      borderRadius: 18,
                      padding: "22px 40px",
                      fontSize: 54,
                      fontWeight: 800,
                      color: P.orange,
                      fontFamily: MONO,
                    }}
                  >
                    10
                  </div>
                </PopIn>
              </div>
              <PopIn delay={60}>
                <div
                  style={{
                    backgroundColor: P.greenBg,
                    border: `2px solid ${P.greenBorder}`,
                    borderRadius: 14,
                    padding: "10px 20px",
                    fontSize: 36,
                    fontWeight: 800,
                    color: P.green,
                    fontFamily: MONO,
                    marginLeft: 6,
                    marginBottom: 4,
                  }}
                >
                  /24
                </div>
              </PopIn>
            </div>
            <FadeIn delay={90}>
              <div style={{fontSize: 30, color: P.body, fontWeight: 600, textAlign: "center", lineHeight: 1.6}}>
                网络部分 → 你属于哪个<span style={{color: P.blue, fontWeight: 800}}>子网</span>
                　　主机部分 → 区分子网里的<span style={{color: P.orange, fontWeight: 800}}>设备</span>
              </div>
            </FadeIn>
          </div>
        )}
      </div>
    </AbsoluteFill>
  );
};

const DeviceCard: React.FC<{
  name: string;
  ip: string;
  icon?: "monitor" | "router";
  color?: string;
  fg?: string;
  bg?: string;
  bd?: string;
}> = ({name, ip, icon = "monitor", color = "#334155", fg = P.body, bg = P.card, bd = P.border}) => (
  <div
    style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      gap: 12,
      backgroundColor: bg,
      border: `1.5px solid ${bd}`,
      borderRadius: 22,
      padding: "24px 40px",
      boxShadow: "0 10px 26px rgba(15,23,42,0.06)",
    }}
  >
    {icon === "router" ? <RouterIcon size={64} color={color} /> : <MonitorIcon size={60} color={color} />}
    <div style={{fontSize: 28, fontWeight: 800, color: fg}}>{name}</div>
    <div style={{fontSize: 26, fontWeight: 700, color: fg, fontFamily: MONO}}>{ip}</div>
  </div>
);

const SceneRoute: React.FC = () => {
  return (
    <AbsoluteFill>
      <SceneTitle text="同一个子网吗？走法完全不同" />
      {/* 本地子网 dashed box */}
      <FadeIn delay={22}>
        <div
          style={{
            position: "absolute",
            top: 240,
            left: 300,
            width: 780,
            height: 330,
            borderRadius: 30,
            border: "2.5px dashed #93c5fd",
            backgroundColor: "rgba(239,246,255,0.45)",
          }}
        />
        <div
          style={{
            position: "absolute",
            top: 214,
            left: 640,
            fontSize: 26,
            fontWeight: 800,
            color: P.blue,
            backgroundColor: P.bg,
            padding: "0 14px",
          }}
        >
          子网 192.168.1.x
        </div>
      </FadeIn>

      <PopIn delay={4}>
        <div style={{position: "absolute", top: 300, left: 400}}>
          <DeviceCard name="本机" ip="192.168.1.10" color={P.blue} fg={P.blue} bg={P.blueBg} bd={P.blueBorder} />
        </div>
      </PopIn>

      <PopIn delay={34}>
        <div style={{position: "absolute", top: 300, left: 1240}}>
          <DeviceCard name="目标 A" ip="192.168.1.20" color={P.green} fg={P.green} bg={P.greenBg} bd={P.greenBorder} />
        </div>
      </PopIn>

      <FlowArrow x={700} y={390} len={500} color={P.green} delay={55} label="直接发送" />

      <PopIn delay={82}>
        <div style={{position: "absolute", top: 660, left: 1240}}>
          <DeviceCard name="目标 B" ip="192.168.2.20" color={P.purple} fg={P.purple} bg={P.purpleBg} bd={P.purpleBorder} />
        </div>
      </PopIn>

      <PopIn delay={104}>
        <div style={{position: "absolute", top: 640, left: 810}}>
          <DeviceCard name="默认网关" ip="192.168.1.1" icon="router" color={P.orange} fg={P.orange} bg={P.orangeBg} bd={P.orangeBorder} />
        </div>
      </PopIn>

      <FlowArrow x={700} y={752} len={100} color={P.orange} delay={126} label="先交给" />
      <FlowArrow x={1065} y={752} len={140} color={P.purple} delay={146} label="转发" />
    </AbsoluteFill>
  );
};

const SceneBoundary: React.FC = () => {
  const frame = useCurrentFrame();
  const scan = interpolate(frame, [10, 80], [-380, 380], {extrapolateRight: "clamp"});
  return (
    <AbsoluteFill>
      <SceneTitle text="只看 IP，边界在哪？" />
      <div
        style={{
          position: "absolute",
          top: 380,
          left: 0,
          right: 0,
          display: "flex",
          justifyContent: "center",
          gap: 26,
        }}
      >
        {["192", "168", "1", "10"].map((o, i) => (
          <div key={i} style={{display: "flex", alignItems: "center", gap: 26}}>
            {i > 0 ? (
              <PopIn delay={i * 14} dy={-10}>
                <div
                  style={{
                    width: 52,
                    height: 52,
                    borderRadius: 999,
                    backgroundColor: P.orangeBg,
                    border: `2px solid ${P.orangeBorder}`,
                    color: P.orange,
                    fontSize: 32,
                    fontWeight: 800,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  ?
                </div>
              </PopIn>
            ) : null}
            <PopIn delay={i * 8}>
              <div
                style={{
                  backgroundColor: P.card,
                  border: `1.5px solid ${P.border}`,
                  borderRadius: 16,
                  padding: "20px 40px",
                  fontSize: 52,
                  fontWeight: 800,
                  color: P.title,
                  fontFamily: MONO,
                  boxShadow: "0 10px 26px rgba(15,23,42,0.06)",
                }}
              >
                {o}
              </div>
            </PopIn>
          </div>
        ))}
      </div>
      <div
        style={{
          position: "absolute",
          top: 356,
          left: 0,
          right: 0,
          display: "flex",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            position: "relative",
            width: 860,
            height: 190,
            pointerEvents: "none",
          }}
        >
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 430 + scan - 1.5,
              width: 3,
              height: 190,
              backgroundColor: "rgba(234,88,12,0.35)",
              borderRadius: 2,
            }}
          />
        </div>
      </div>
      <FadeIn delay={90}>
        <div
          style={{
            position: "absolute",
            top: 640,
            left: 0,
            right: 0,
            display: "flex",
            justifyContent: "center",
            fontSize: 36,
            fontWeight: 700,
            color: P.body,
          }}
        >
          前面几位是<span style={{color: P.blue, fontWeight: 800, margin: "0 8px"}}>网络</span>，
          后面几位是<span style={{color: P.orange, fontWeight: 800, margin: "0 8px"}}>主机</span>？
        </div>
      </FadeIn>
    </AbsoluteFill>
  );
};

const BitChips: React.FC<{binary: string; colorKind: "net" | "host"; delay: number}> = ({
  binary,
  colorKind,
  delay,
}) => {
  const frame = useCurrentFrame();
  const c =
    colorKind === "net"
      ? {fg: P.blue, bg: P.blueBg, bd: P.blueBorder}
      : {fg: P.orange, bg: P.orangeBg, bd: P.orangeBorder};
  return (
    <div style={{display: "flex", gap: 6}}>
      {binary.split("").map((bit, bi) => {
        const on = frame >= delay + bi * 2;
        return (
          <div
            key={bi}
            style={{
              width: 40,
              height: 54,
              borderRadius: 9,
              backgroundColor: on ? c.bg : "#f3f4f6",
              border: `1.5px solid ${on ? c.bd : P.border}`,
              color: on ? c.fg : "#cbd5e1",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 25,
              fontWeight: 700,
              fontFamily: MONO,
              opacity: on ? 1 : 0.6,
            }}
          >
            {bit}
          </div>
        );
      })}
    </div>
  );
};

const SceneMask: React.FC = () => {
  return (
    <AbsoluteFill>
      <SceneTitle text="子网掩码，画出这条边界" />
      <div
        style={{
          position: "absolute",
          top: 260,
          left: 0,
          right: 0,
          display: "flex",
          justifyContent: "center",
        }}
      >
        <PopIn delay={4}>
          <Chip fg={P.green} bg={P.greenBg} bd={P.greenBorder} mono size={46} pad={[16, 46]}>
            255 . 255 . 255 . 0
          </Chip>
        </PopIn>
      </div>
      <div
        style={{
          position: "absolute",
          top: 400,
          left: 0,
          right: 0,
          display: "flex",
          justifyContent: "center",
          gap: 20,
          alignItems: "center",
        }}
      >
        {maskOctets.map((m, gi) => (
          <div key={gi} style={{display: "flex", alignItems: "center", gap: 20}}>
            {gi > 0 ? (
              <div style={{fontSize: 26, color: P.muted, fontWeight: 700, fontFamily: MONO}}>.</div>
            ) : null}
            <PopIn delay={40 + gi * 12} dy={14}>
              <BitChips binary={m.binary} colorKind={m.kind as "net" | "host"} delay={46 + gi * 12} />
            </PopIn>
          </div>
        ))}
      </div>
      <PopIn delay={150} dy={-6}>
        <div
          style={{
            position: "absolute",
            top: 560,
            left: 0,
            right: 0,
            display: "flex",
            justifyContent: "center",
            gap: 60,
          }}
        >
          <div style={{display: "flex", alignItems: "center", gap: 14}}>
            <div style={{width: 70, height: 4, backgroundColor: P.blue, borderRadius: 2}} />
            <div style={{fontSize: 30, fontWeight: 800, color: P.blue}}>24 个 1 → 网络部分</div>
          </div>
          <div style={{display: "flex", alignItems: "center", gap: 14}}>
            <div style={{width: 70, height: 4, backgroundColor: P.orange, borderRadius: 2}} />
            <div style={{fontSize: 30, fontWeight: 800, color: P.orange}}>8 个 0 → 主机部分</div>
          </div>
        </div>
      </PopIn>
      <FadeIn delay={210}>
        <div
          style={{
            position: "absolute",
            top: 660,
            left: 0,
            right: 0,
            display: "flex",
            justifyContent: "center",
            fontSize: 32,
            fontWeight: 700,
            color: P.body,
          }}
        >
          1 对应<span style={{color: P.blue, fontWeight: 800, margin: "0 8px"}}>网络</span>，
          0 对应<span style={{color: P.orange, fontWeight: 800, margin: "0 8px"}}>主机</span>
        </div>
      </FadeIn>
    </AbsoluteFill>
  );
};

const SceneNotation: React.FC = () => {
  return (
    <AbsoluteFill>
      <SceneTitle text="两种写法，同一回事" />
      <div
        style={{
          position: "absolute",
          top: 400,
          left: 0,
          right: 0,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          gap: 44,
        }}
      >
        <PopIn delay={4}>
          <div
            style={{
              backgroundColor: P.card,
              border: `1.5px solid ${P.border}`,
              borderRadius: 24,
              padding: "36px 54px",
              display: "flex",
              flexDirection: "column",
              gap: 22,
              boxShadow: "0 10px 26px rgba(15,23,42,0.06)",
            }}
          >
            <div style={{display: "flex", alignItems: "center", gap: 24}}>
              <div style={{fontSize: 28, fontWeight: 800, color: P.muted, width: 130}}>IP 地址</div>
              <div style={{fontSize: 40, fontWeight: 800, color: P.blue, fontFamily: MONO}}>192.168.1.10</div>
            </div>
            <div style={{display: "flex", alignItems: "center", gap: 24}}>
              <div style={{fontSize: 28, fontWeight: 800, color: P.muted, width: 130}}>子网掩码</div>
              <div style={{fontSize: 40, fontWeight: 800, color: P.green, fontFamily: MONO}}>255.255.255.0</div>
            </div>
          </div>
        </PopIn>
        <PopIn delay={40} dy={-10}>
          <div style={{fontSize: 72, fontWeight: 800, color: P.title}}>=</div>
        </PopIn>
        <PopIn delay={60}>
          <div
            style={{
              backgroundColor: P.greenBg,
              border: `2px solid ${P.greenBorder}`,
              borderRadius: 24,
              padding: "52px 60px",
              fontSize: 52,
              fontWeight: 800,
              color: P.green,
              fontFamily: MONO,
            }}
          >
            192.168.1.10 /24
          </div>
        </PopIn>
      </div>
      <FadeIn delay={120}>
        <div
          style={{
            position: "absolute",
            top: 700,
            left: 0,
            right: 0,
            display: "flex",
            justifyContent: "center",
            fontSize: 32,
            fontWeight: 700,
            color: P.body,
          }}
        >
          /24 表示：前 24 位是网络，剩下 8 位是主机
        </div>
      </FadeIn>
    </AbsoluteFill>
  );
};

const AndRow: React.FC<{
  delay: number;
  ip: string;
  result: string;
  verdict: "same" | "diff";
}> = ({delay, ip, result, verdict}) => {
  const frame = useCurrentFrame();
  const show = frame >= delay;
  const ok = verdict === "same";
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 30,
        opacity: show ? 1 : 0,
        transform: show ? "translateY(0)" : "translateY(14px)",
      }}
    >
      <div style={{fontSize: 42, fontWeight: 800, color: P.blue, fontFamily: MONO, width: 380, textAlign: "right"}}>
        {ip}
      </div>
      <div style={{fontSize: 30, fontWeight: 800, color: P.muted, fontFamily: MONO, width: 90, textAlign: "center"}}>
        AND
      </div>
      <div style={{fontSize: 42, fontWeight: 800, color: P.green, fontFamily: MONO, width: 360}}>
        255.255.255.0
      </div>
      <div style={{fontSize: 34, fontWeight: 800, color: P.muted}}>=</div>
      <div style={{fontSize: 42, fontWeight: 800, color: P.title, fontFamily: MONO, width: 330}}>{result}</div>
      <div
        style={{
          fontSize: 28,
          fontWeight: 800,
          color: ok ? P.green : P.orange,
          backgroundColor: ok ? P.greenBg : P.orangeBg,
          border: `1.5px solid ${ok ? P.greenBorder : P.orangeBorder}`,
          borderRadius: 12,
          padding: "8px 18px",
          whiteSpace: "nowrap",
        }}
      >
        {ok ? "✓ 同一子网 → 直接通信" : "✕ 不同 → 走默认网关"}
      </div>
    </div>
  );
};

const SceneAnd: React.FC = () => {
  return (
    <AbsoluteFill>
      <SceneTitle text="按位相与，一判便知" />
      <div
        style={{
          position: "absolute",
          top: 300,
          left: 0,
          right: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 48,
        }}
      >
        <AndRow delay={16} ip="192.168.1.10" result="192.168.1.0" verdict="same" />
        <AndRow delay={95} ip="192.168.1.20" result="192.168.1.0" verdict="same" />
        <AndRow delay={174} ip="192.168.2.20" result="192.168.2.0" verdict="diff" />
      </div>
      <PopIn delay={250} dy={-8}>
        <div
          style={{
            position: "absolute",
            top: 700,
            left: 0,
            right: 0,
            display: "flex",
            justifyContent: "center",
          }}
        >
          <Chip fg={P.green} bg={P.greenBg} bd={P.greenBorder} size={40} pad={[16, 46]}>
            子网掩码 = 网络与主机的边界线
          </Chip>
        </div>
      </PopIn>
    </AbsoluteFill>
  );
};

// ---------- composition ----------

const scenes = [
  {start: 0, end: 138, Component: SceneHook},
  {start: 138, end: 460, Component: SceneBinary},
  {start: 460, end: 757, Component: SceneTwoParts},
  {start: 757, end: 1053, Component: SceneRoute},
  {start: 1053, end: 1246, Component: SceneBoundary},
  {start: 1246, end: 1591, Component: SceneMask},
  {start: 1591, end: 1831, Component: SceneNotation},
  {start: 1831, end: subnetDurationInFrames, Component: SceneAnd},
];

export const SubnetMaskExplainer: React.FC = () => {
  const frame = useCurrentFrame();
  const bedVolume = interpolate(
    frame,
    [0, 20, subnetDurationInFrames - 40, subnetDurationInFrames - 6],
    [0, 0.10, 0.10, 0],
    {extrapolateLeft: "clamp", extrapolateRight: "clamp"}
  );
  return (
    <AbsoluteFill style={{backgroundColor: P.bg, fontFamily: FONT}}>
      {scenes.map(({start, end, Component}, i) => (
        <Sequence key={i} from={start} durationInFrames={end - start}>
          <Component />
        </Sequence>
      ))}

      {/* voiceover: one Audio per sentence placed on the timeline */}
      {subnetSentences.map((s) => (
        <Sequence key={`vo-${s.index}`} from={s.startFrame} durationInFrames={s.endFrame - s.startFrame + 30}>
          <Audio src={staticFile(`${subnetAudioFolder}/${s.audio}`)} volume={1} />
        </Sequence>
      ))}

      {/* SFX */}
      <Sequence from={460} durationInFrames={40}>
        <Audio src={staticFile("audio/sfx/click.wav")} volume={0.3} />
      </Sequence>
      <Sequence from={1053} durationInFrames={40}>
        <Audio src={staticFile("audio/sfx/click.wav")} volume={0.3} />
      </Sequence>
      <Sequence from={1246} durationInFrames={40}>
        <Audio src={staticFile("audio/sfx/switch.wav")} volume={0.28} />
      </Sequence>
      <Sequence from={1591} durationInFrames={40}>
        <Audio src={staticFile("audio/sfx/click.wav")} volume={0.3} />
      </Sequence>
      <Sequence from={1985} durationInFrames={50}>
        <Audio src={staticFile("audio/sfx/success.wav")} volume={0.4} />
      </Sequence>
      <Sequence from={2060} durationInFrames={50}>
        <Audio src={staticFile("audio/sfx/ding.wav")} volume={0.3} />
      </Sequence>

      {/* BGM bed, looped */}
      <Audio src={staticFile("audio/bed.wav")} loop volume={() => bedVolume} />

      <Subtitle />
    </AbsoluteFill>
  );
};
