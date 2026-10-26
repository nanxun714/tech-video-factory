import {Audio} from "@remotion/media";
import {
  AbsoluteFill,
  interpolate,
  Sequence,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import {
  envTerminalLines,
  resultTerminalLines,
  sshTerminalLines,
  tutorialAudioAssets,
  tutorialDurationInFrames,
  tutorialPalette,
  tutorialSoundEffects,
  tutorialSubtitles,
  type TerminalLine,
} from "./linuxHadoopTutorialData";

const sceneFrames = {
  title: {start: 0, end: 120},
  issue: {start: 120, end: 270},
  env: {start: 270, end: 480},
  ssh: {start: 480, end: 690},
  result: {start: 690, end: tutorialDurationInFrames},
} as const;

const getCurrentSubtitle = (frame: number) => {
  return tutorialSubtitles.find((item) => frame >= item.startFrame && frame < item.endFrame) ?? null;
};

const Badge = ({text}: {text: string}) => {
  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        minWidth: 94,
        height: 38,
        borderRadius: 999,
        backgroundColor: "#eef4df",
        border: "1px solid rgba(74, 106, 46, 0.16)",
        color: tutorialPalette.accentDeep,
        fontSize: 18,
        fontWeight: 700,
        boxShadow: "none",
      }}
    >
      {text}
    </div>
  );
};

const Bullet = ({text}: {text: string}) => {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 16,
        fontSize: 28,
        color: tutorialPalette.body,
      }}
    >
      <div
        style={{
          width: 24,
          height: 24,
          borderRadius: 999,
          backgroundColor: tutorialPalette.accentDeep,
          color: "#fff",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 16,
          fontWeight: 700,
        }}
      >
        ✓
      </div>
      <div>{text}</div>
    </div>
  );
};

const TerminalCard = ({
  frame,
  lines,
  title,
  note,
}: {
  frame: number;
  lines: TerminalLine[]; 
  title: string;
  note?: string;
}) => {
  return (
    <div
      style={{
        backgroundColor: tutorialPalette.card,
        border: `1px solid ${tutorialPalette.border}`,
        borderRadius: 34,
        padding: 28,
        boxShadow: "0 12px 24px rgba(49, 56, 43, 0.04)",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 18,
        }}
      >
        <div>
          <div
            style={{
              fontSize: 34,
              fontWeight: 700,
              color: tutorialPalette.title,
            }}
          >
            {title}
          </div>
          {note ? (
            <div
              style={{
                marginTop: 8,
                fontSize: 20,
                color: tutorialPalette.muted,
              }}
            >
              {note}
            </div>
          ) : null}
        </div>
      </div>

      <div
        style={{
          backgroundColor: tutorialPalette.terminal,
          borderRadius: 26,
          overflow: "hidden",
          minHeight: 425,
        }}
      >
        <div
          style={{
            height: 44,
            backgroundColor: tutorialPalette.terminalBar,
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "0 18px",
          }}
        >
          {["#ff6b6b", "#ffd166", "#7bd88f"].map((color) => (
            <div
              key={color}
              style={{
                width: 12,
                height: 12,
                borderRadius: 999,
                backgroundColor: color,
              }}
            />
          ))}
        </div>

        <div
          style={{
            padding: "24px 28px 28px",
            fontFamily: "\"Cascadia Code\", \"JetBrains Mono\", monospace",
            fontSize: 26,
            lineHeight: 1.7,
            color: tutorialPalette.terminalText,
            whiteSpace: "pre-wrap",
          }}
        >
          {lines.map((line, index) => {
            const localFrame = frame - line.startFrame;

            if (localFrame < 0) {
              return null;
            }

            const content =
              line.mode === "typing"
                ? line.text.slice(0, Math.max(0, Math.floor(localFrame * 1.4)))
                : line.text;

            const opacity =
              line.mode === "fade"
                ? interpolate(localFrame, [0, 10], [0, 1], {
                    extrapolateLeft: "clamp",
                    extrapolateRight: "clamp",
                  })
                : 1;

            const isTypingActive = line.mode === "typing" && content.length < line.text.length;

            return (
              <div
                key={`${line.text}-${index}`}
                style={{
                  opacity,
                  color: line.color ?? tutorialPalette.terminalText,
                  backgroundColor: line.highlight ? "rgba(167, 216, 139, 0.08)" : "transparent",
                  borderRadius: 12,
                  padding: line.highlight ? "2px 8px" : 0,
                  marginLeft: line.highlight ? -8 : 0,
                  width: "fit-content",
                }}
              >
                {content}
                {isTypingActive ? (
                  <span
                    style={{
                      color: tutorialPalette.terminalSuccess,
                      opacity: Math.sin(frame / 5) > 0 ? 1 : 0.25,
                    }}
                  >
                    ▋
                  </span>
                ) : null}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

const SubtitleBar = ({text}: {text: string}) => {
  return (
    <div
      style={{
        position: "absolute",
        left: 120,
        right: 120,
        bottom: 52,
        display: "flex",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          maxWidth: 1680,
          backgroundColor: "transparent",
          color: "#ffffff",
          fontSize: 42,
          lineHeight: 1.15,
          fontWeight: 900,
          textAlign: "center",
          boxShadow: "none",
          WebkitTextStroke: "6px #000000",
          paintOrder: "stroke fill",
          textShadow:
            "2px 0 0 #000, -2px 0 0 #000, 0 2px 0 #000, 0 -2px 0 #000, 2px 2px 0 #000, -2px 2px 0 #000, 2px -2px 0 #000, -2px -2px 0 #000",
        }}
      >
        {text}
      </div>
    </div>
  );
};

const SceneCard = ({
  frame,
  start,
  end,
  children,
}: {
  frame: number;
  start: number;
  end: number;
  children: React.ReactNode;
}) => {
  const isVisible = frame >= start && frame < end;

  return (
    <div
      style={{
        position: "absolute",
        inset: 72,
        opacity: isVisible ? 1 : 0,
      }}
    >
      {children}
    </div>
  );
};

export const LinuxHadoopTutorial = () => {
  const frame = useCurrentFrame();
  const {durationInFrames, fps} = useVideoConfig();
  const subtitle = getCurrentSubtitle(frame);
  const bedVolume = interpolate(
    frame,
    [0, fps, durationInFrames - fps * 3, durationInFrames - 1],
    [0, 0.12, 0.12, 0],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    },
  );

  return (
    <AbsoluteFill
      style={{
        backgroundColor: tutorialPalette.background,
        fontFamily: "\"Aptos\", \"Segoe UI\", sans-serif",
        color: tutorialPalette.body,
      }}
    >
      <Audio src={staticFile(tutorialAudioAssets.bed)} volume={() => bedVolume} />
      <Audio src={staticFile(tutorialAudioAssets.voiceover)} volume={() => 0.96} />
      {tutorialSoundEffects.map((event) => (
        <Sequence key={`${event.kind}-${event.frame}`} from={event.frame}>
          <Audio src={staticFile(tutorialAudioAssets[event.kind])} volume={() => event.volume} />
        </Sequence>
      ))}

      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(circle at top left, rgba(228, 238, 209, 0.9), transparent 34%), radial-gradient(circle at bottom right, rgba(218, 230, 199, 0.68), transparent 28%)",
        }}
      />

      <SceneCard frame={frame} start={sceneFrames.title.start} end={sceneFrames.title.end}>
        <div
          style={{
            height: "100%",
            display: "grid",
            gridTemplateColumns: "1fr 0.95fr",
            gap: 30,
            alignItems: "center",
            backgroundColor: "rgba(251, 248, 241, 0.94)",
            border: `1px solid ${tutorialPalette.border}`,
            borderRadius: 40,
            padding: "52px 56px",
            boxShadow: "0 12px 24px rgba(53, 61, 46, 0.04)",
          }}
        >
          <div>
            <Badge text="排错笔记" />
            <div
              style={{
                marginTop: 24,
                fontSize: 72,
                lineHeight: 0.98,
                fontWeight: 800,
                letterSpacing: -2.2,
                color: tutorialPalette.title,
              }}
            >
              Linux / Hadoop
              <br />
              环境排错
            </div>
            <div
              style={{
                marginTop: 16,
                display: "inline-flex",
                padding: "12px 18px",
                borderRadius: 999,
                backgroundColor: tutorialPalette.accentSoft,
                color: tutorialPalette.accentDeep,
                fontSize: 24,
                fontWeight: 700,
              }}
            >
              一次常见启动报错的排查过程
            </div>
            <div
              style={{
                marginTop: 24,
                display: "flex",
                flexDirection: "column",
                gap: 14,
              }}
            >
              <Bullet text="环境变量检查" />
              <Bullet text="SSH 免密验证" />
              <Bullet text="启动结果确认" />
            </div>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <div
              style={{
                width: 520,
                height: 520,
                borderRadius: 42,
                background:
                  "linear-gradient(180deg, rgba(244, 248, 238, 1), rgba(225, 236, 209, 1))",
                border: `1px solid ${tutorialPalette.border}`,
                position: "relative",
                overflow: "hidden",
                transform: "rotate(-2deg)",
                boxShadow: "0 14px 28px rgba(49, 56, 43, 0.04)",
              }}
            >
              <div
                style={{
                  position: "absolute",
                  left: 34,
                  top: 30,
                  padding: "8px 14px",
                  borderRadius: 16,
                  backgroundColor: "#ffffff",
                  border: "1px solid rgba(95, 127, 57, 0.18)",
                  color: tutorialPalette.accentDeep,
                  fontSize: 18,
                  fontWeight: 700,
                }}
              >
                记录一次排错过程
              </div>
              <div
                style={{
                  position: "absolute",
                  left: 76,
                  top: 100,
                  width: 292,
                  height: 210,
                  border: "5px solid #2c342f",
                  borderBottomWidth: 10,
                  borderRadius: 22,
                  transform: "skew(-6deg) rotate(-1deg)",
                  backgroundColor: "#ffffff",
                }}
              />
              <div
                style={{
                  position: "absolute",
                  left: 104,
                  top: 124,
                  width: 252,
                  height: 18,
                  backgroundColor: tutorialPalette.accentSoft,
                  borderRadius: 999,
                }}
              />
              <div
                style={{
                  position: "absolute",
                  left: 104,
                  top: 160,
                  width: 196,
                  height: 12,
                  backgroundColor: "#d8ddd3",
                  borderRadius: 999,
                }}
              />
              <div
                style={{
                  position: "absolute",
                  left: 110,
                  top: 190,
                  width: 150,
                  height: 12,
                  backgroundColor: "#9ac37e",
                  borderRadius: 999,
                }}
              />
              <div
                style={{
                  position: "absolute",
                  left: 238,
                  top: 282,
                  width: 174,
                  height: 164,
                  borderRadius: 999,
                  backgroundColor: "#c0d9a2",
                }}
              />
              <div
                style={{
                  position: "absolute",
                  left: 252,
                  top: 194,
                  width: 148,
                  height: 124,
                  borderRadius: "48% 48% 42% 42%",
                  backgroundColor: "#5a4137",
                }}
              />
              <div
                style={{
                  position: "absolute",
                  left: 272,
                  top: 246,
                  width: 110,
                  height: 88,
                  borderRadius: 26,
                  backgroundColor: "#fff8f2",
                }}
              />
              <div
                style={{
                  position: "absolute",
                  left: 258,
                  top: 316,
                  width: 138,
                  height: 108,
                  borderRadius: 34,
                  backgroundColor: "#b9d69a",
                }}
              />
              <div
                style={{
                  position: "absolute",
                  right: 48,
                  top: 56,
                  fontSize: 70,
                  color: tutorialPalette.accentDeep,
                  transform: "rotate(8deg)",
                }}
              >
                ✦
              </div>
            </div>
          </div>
        </div>
      </SceneCard>

      <SceneCard frame={frame} start={sceneFrames.issue.start} end={sceneFrames.issue.end}>
        <div
          style={{
            height: "100%",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "stretch",
            gap: 24,
            backgroundColor: "rgba(251, 248, 241, 0.94)",
            border: `1px solid ${tutorialPalette.border}`,
            borderRadius: 40,
            padding: "48px 56px",
            boxShadow: "0 12px 24px rgba(53, 61, 46, 0.04)",
          }}
        >
          <Badge text="遇到的问题" />
            <div
              style={{
                fontSize: 60,
                fontWeight: 800,
                letterSpacing: -1.8,
              color: tutorialPalette.title,
            }}
          >
            启动失败，先看这两个地方
          </div>
          <div
            style={{
              fontSize: 28,
              lineHeight: 1.5,
              color: tutorialPalette.body,
              maxWidth: 980,
            }}
          >
            先不要往 Hadoop 本身上想。多数时候，问题就落在环境变量和节点登录这两步。
          </div>
          <div
            style={{
              backgroundColor: tutorialPalette.terminal,
              borderRadius: 28,
              padding: 28,
              color: tutorialPalette.terminalText,
              fontFamily: "\"Cascadia Code\", \"JetBrains Mono\", monospace",
              fontSize: 28,
              lineHeight: 1.6,
              width: "100%",
              minHeight: 320,
            }}
          >
            Error: JAVA_HOME is not set.
            <br />
            Please set the JAVA_HOME variable
            <br />
            in your environment to match the
            <br />
            location of your Java installation.
            <br />
            hadoop cannot be executed.
          </div>
          <div
            style={{
              display: "flex",
              gap: 14,
              flexWrap: "wrap",
            }}
          >
            <div style={{padding: "10px 14px", borderRadius: 999, backgroundColor: "#eef4df", color: tutorialPalette.accentDeep, fontWeight: 700}}>
              JAVA_HOME 未配置
            </div>
            <div style={{padding: "10px 14px", borderRadius: 999, backgroundColor: "#eef4df", color: tutorialPalette.accentDeep, fontWeight: 700}}>
              SSH 免密未打通
            </div>
          </div>
        </div>
      </SceneCard>

      <SceneCard frame={frame} start={sceneFrames.env.start} end={sceneFrames.env.end}>
        <TerminalCard
          frame={frame - sceneFrames.env.start}
          lines={envTerminalLines}
          title="排查过程 1"
          note="先确认 JAVA_HOME，再写入 profile 并重新加载"
        />
      </SceneCard>

      <SceneCard frame={frame} start={sceneFrames.ssh.start} end={sceneFrames.ssh.end}>
        <TerminalCard
          frame={frame - sceneFrames.ssh.start}
          lines={sshTerminalLines}
          title="排查过程 2"
          note="补齐 SSH 免密登录，避免节点启动链路中断"
        />
      </SceneCard>

      <SceneCard frame={frame} start={sceneFrames.result.start} end={sceneFrames.result.end}>
        <div
          style={{
            height: "100%",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            gap: 24,
            backgroundColor: "rgba(251, 248, 241, 0.94)",
            border: `1px solid ${tutorialPalette.border}`,
            borderRadius: 40,
            padding: "48px 56px",
            boxShadow: "0 12px 24px rgba(53, 61, 46, 0.04)",
          }}
        >
          <Badge text="最终结果" />
          <div
            style={{
              fontSize: 58,
              fontWeight: 800,
              letterSpacing: -1.6,
              color: tutorialPalette.title,
            }}
          >
            组件拉起后，再看进程列表
          </div>
          <TerminalCard
            frame={frame - sceneFrames.result.start}
            lines={resultTerminalLines}
            title="Hadoop 启动"
            note="jps 里能看到 NameNode、DataNode、SecondaryNameNode"
          />
          <div
            style={{
              display: "flex",
              gap: 14,
              flexWrap: "wrap",
            }}
          >
            <div style={{padding: "10px 14px", borderRadius: 999, backgroundColor: "#eef4df", color: tutorialPalette.accentDeep, fontWeight: 700}}>
              环境变量已生效
            </div>
            <div style={{padding: "10px 14px", borderRadius: 999, backgroundColor: "#eef4df", color: tutorialPalette.accentDeep, fontWeight: 700}}>
              SSH 免密可用
            </div>
            <div style={{padding: "10px 14px", borderRadius: 999, backgroundColor: "#eef4df", color: tutorialPalette.accentDeep, fontWeight: 700}}>
              进程状态正常
            </div>
          </div>
        </div>
      </SceneCard>

      {subtitle ? <SubtitleBar text={subtitle.text} /> : null}
    </AbsoluteFill>
  );
};
