import {Audio} from "@remotion/media";
import {
  AbsoluteFill,
  interpolate,
  Sequence,
  staticFile,
  useCurrentFrame,
} from "remotion";
import {
  BlockChip,
  CoverTitle,
  DataNode,
  DataPacket,
  FileIcon,
  FlowLine,
  FONT_SANS,
  NameNode,
  SceneWrap,
  StatusBadge,
  Terminal,
} from "./hdfsComponents";
import {
  dataNodes,
  failingNodeIndex,
  fsckTerminalLines,
  hdfsAudioAssets,
  hdfsDurationInFrames,
  hdfsFps,
  hdfsFormat,
  hdfsPalette,
  hdfsSceneFrames,
  hdfsSoundEffects,
  hdfsSubtitles,
  replicationFactor,
  reportTerminalLines,
  uploadTerminalLines,
  voiceoverFrames,
} from "./hdfsFaultToleranceData";

const {width: W} = hdfsFormat;

const NODE_W = 300;
const NODE_ROW_Y = 620;
const NODE_X = [70, 390, 710];
const NAMENODE_X = 70;
const NAMENODE_Y = 480;
const NAMENODE_W = 940;
const TERMINAL_Y = 860;
const TITLE_Y = 60;
const SUBTITLE_Y = 1490;

const BeatTitle = ({
  text,
  sub,
}: {
  text: string;
  sub?: string;
}) => {
  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        width: W,
        top: TITLE_Y,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 6,
      }}
    >
      <div
        style={{
          fontSize: 48,
          fontWeight: 900,
          color: hdfsPalette.title,
          fontFamily: FONT_SANS,
          letterSpacing: 1,
          textAlign: "center",
        }}
      >
        {text}
      </div>
      {sub ? (
        <div style={{fontSize: 24, color: hdfsPalette.muted, fontWeight: 700}}>
          {sub}
        </div>
      ) : null}
    </div>
  );
};

const SubtitleTrack = ({frame}: {frame: number}) => {
  const active = hdfsSubtitles.find(
    (s) => frame >= s.startFrame && frame < s.endFrame,
  );
  if (!active) return null;
  const local = frame - active.startFrame;
  const dur = active.endFrame - active.startFrame;
  const op = interpolate(
    local,
    [0, 6, dur - 8, dur],
    [0, 1, 1, 0],
    {extrapolateLeft: "clamp", extrapolateRight: "clamp"},
  );
  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        width: W,
        top: SUBTITLE_Y,
        display: "flex",
        justifyContent: "center",
        opacity: op,
      }}
    >
      <div
        style={{
          fontSize: 42,
          fontWeight: 700,
          color: hdfsPalette.title,
          textAlign: "center",
          maxWidth: 920,
          lineHeight: 1.4,
          textShadow: "0 2px 8px rgba(255,255,255,0.6)",
        }}
      >
        {active.text}
      </div>
    </div>
  );
};

type BeatProps = {frame: number};

const HookBeat = ({frame}: BeatProps) => {
  const {hook} = hdfsSceneFrames;
  const local = frame - hook.start;
  const dn3Down = local >= 30;
  return (
    <SceneWrap start={hook.start} end={hook.end} frame={frame} noFadeIn>
      <CoverTitle
        frame={local}
        kicker="HDFS 容错"
        title="数据会消失吗？"
        subtitle="一台 DataNode 突然挂了"
        y={TITLE_Y}
      />
      {dataNodes.map((n, i) => (
        <DataNode
          key={n.id}
          x={NODE_X[i]}
          y={NODE_ROW_Y}
          width={NODE_W}
          label={n.label}
          status={
            i === failingNodeIndex - 1
              ? dn3Down
                ? "down"
                : "live"
              : "live"
          }
          replicas={["Block 1"]}
          frame={local}
          offlineFrame={dn3Down ? 30 : undefined}
        />
      ))}
      {dn3Down ? (
        <div
          style={{
            position: "absolute",
            left: 0,
            width: W,
            top: NODE_ROW_Y + 214,
            display: "flex",
            justifyContent: "center",
          }}
        >
          <StatusBadge text="DN3 挂了 — 数据会丢吗？" tone="down" />
        </div>
      ) : null}
    </SceneWrap>
  );
};

const ConflictBeat = ({frame}: BeatProps) => {
  const {conflict} = hdfsSceneFrames;
  const local = frame - conflict.start;
  const wrongOp = interpolate(local, [0, 14, 60, 80], [0, 1, 1, 0.4], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const strikeWidth = interpolate(local, [44, 64], [0, 100], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const rightOp = interpolate(local, [60, 76], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const rightDy = interpolate(local, [60, 80], [14, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return (
    <SceneWrap start={conflict.start} end={conflict.end} frame={frame}>
      <BeatTitle text="不只存一份" />
      <div
        style={{
          position: "absolute",
          left: W / 2 - 340,
          top: 520,
          width: 680,
          borderRadius: 24,
          backgroundColor: hdfsPalette.card,
          border: `1px solid ${hdfsPalette.border}`,
          boxShadow: "0 6px 18px rgba(49,56,43,0.1)",
          padding: "44px 40px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 28,
        }}
      >
        <div
          style={{
            fontSize: 46,
            fontWeight: 900,
            color: hdfsPalette.muted,
            opacity: wrongOp,
            position: "relative",
          }}
        >
          只存一份？
          <div
            style={{
              position: "absolute",
              left: 0,
              top: "50%",
              height: 5,
              backgroundColor: hdfsPalette.nodeDown,
              borderRadius: 3,
              width: `${strikeWidth}%`,
              transform: "translateY(-50%)",
            }}
          />
        </div>
        <div
          style={{
            fontSize: 48,
            fontWeight: 900,
            color: hdfsPalette.accentDeep,
            opacity: rightOp,
            transform: `translateY(${rightDy}px)`,
          }}
        >
          默认 3 副本分散
        </div>
        {rightOp > 0.5 ? (
          <div style={{display: "flex", gap: 16}}>
            <StatusBadge text="容错" tone="live" />
            <StatusBadge text="防丢失" tone="info" />
          </div>
        ) : null}
      </div>
    </SceneWrap>
  );
};

const SplitBeat = ({frame}: BeatProps) => {
  const {split} = hdfsSceneFrames;
  const local = frame - split.start;
  const diagramOp = interpolate(
    local,
    [0, 6, 100, 110],
    [0, 1, 1, 0],
    {extrapolateLeft: "clamp", extrapolateRight: "clamp"},
  );
  const termOp = interpolate(local, [108, 118], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const fileX = 150;
  const fileY = 540;
  const blocksAt = [24, 58, 92];
  const blockSlotX = 580;
  return (
    <SceneWrap start={split.start} end={split.end} frame={frame}>
      <BeatTitle text="128MB 分块" sub="HDFS 分块写入" />
      <div style={{opacity: diagramOp, position: "absolute", inset: 0}}>
        <div style={{position: "absolute", left: fileX, top: fileY}}>
          <FileIcon name="bigfile.log" width={300} />
        </div>
        <FlowLine
          x1={fileX + 300}
          y1={fileY + 180}
          x2={blockSlotX - 20}
          y2={fileY + 180}
          frame={local}
          flowSpeed={4}
        />
        <div
          style={{
            position: "absolute",
            left: blockSlotX,
            top: fileY + 100,
            display: "flex",
            flexDirection: "column",
            gap: 18,
          }}
        >
          {blocksAt.map((at, i) => {
            const ap = interpolate(local, [at, at + 8], [0, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            });
            const dx = interpolate(local, [at, at + 8], [-30, 0], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            });
            return (
              <div
                key={i}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 14,
                  opacity: ap,
                  transform: `translateX(${dx}px)`,
                }}
              >
                <BlockChip label={`Block ${i + 1}`} />
                <span
                  style={{
                    fontSize: 22,
                    color: hdfsPalette.muted,
                    fontWeight: 700,
                  }}
                >
                  128MB
                </span>
              </div>
            );
          })}
        </div>
      </div>
      <div style={{opacity: termOp, position: "absolute", left: 80, top: TERMINAL_Y}}>
        <Terminal
          frame={local - 110}
          lines={uploadTerminalLines}
          title="上传到 HDFS"
          note="分块 → 写副本"
          width={920}
        />
      </div>
    </SceneWrap>
  );
};

const ReplicaBeat = ({frame}: BeatProps) => {
  const {replica} = hdfsSceneFrames;
  const local = frame - replica.start;
  const centerX = W / 2;
  const srcX = centerX;
  const srcY = 560;
  const pktStarts = [40, 95, 150];
  const replicaAppear = [70, 125, 180];
  const labelOp = interpolate(local, [210, 226], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const labelDy = interpolate(local, [210, 226], [10, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return (
    <SceneWrap start={replica.start} end={replica.end} frame={frame}>
      <BeatTitle text="3 副本" sub="分散到不同 DataNode" />
      <div
        style={{
          position: "absolute",
          left: centerX - 64,
          top: 500,
          opacity: interpolate(local, [0, 10], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          }),
        }}
      >
        <BlockChip label="Block 1" />
      </div>
      {NODE_X.map((nx, i) => (
        <FlowLine
          key={`fl-${i}`}
          x1={srcX}
          y1={srcY}
          x2={nx + NODE_W / 2}
          y2={NODE_ROW_Y}
          frame={local}
          packet
          packetStart={pktStarts[i]}
          packetDur={30}
          flowSpeed={3}
        />
      ))}
      {dataNodes.map((n, i) => (
        <DataNode
          key={n.id}
          x={NODE_X[i]}
          y={NODE_ROW_Y}
          width={NODE_W}
          label={n.label}
          status="live"
          replicas={[`副本${i + 1}`]}
          frame={local}
          replicaAppearFrames={[replicaAppear[i]]}
        />
      ))}
      <div
        style={{
          position: "absolute",
          left: 0,
          width: W,
          top: NODE_ROW_Y + 214,
          display: "flex",
          justifyContent: "center",
          opacity: labelOp,
          transform: `translateY(${labelDy}px)`,
        }}
      >
        <StatusBadge text={`replication = ${replicationFactor}`} tone="info" />
      </div>
    </SceneWrap>
  );
};

const OfflineBeat = ({frame}: BeatProps) => {
  const {offline} = hdfsSceneFrames;
  const local = frame - offline.start;
  const brokenFrame = 18;
  const diagramOp = interpolate(
    local,
    [0, 6, 86, 96],
    [0, 1, 1, 0],
    {extrapolateLeft: "clamp", extrapolateRight: "clamp"},
  );
  const termOp = interpolate(local, [94, 104], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return (
    <SceneWrap start={offline.start} end={offline.end} frame={frame}>
      <BeatTitle text="心跳断了" sub="触发副本接管" />
      <div style={{opacity: diagramOp, position: "absolute", inset: 0}}>
        <NameNode
          x={NAMENODE_X}
          y={NAMENODE_Y}
          width={NAMENODE_W}
          frame={local}
          heartbeatBrokenFrame={brokenFrame}
        />
        {NODE_X.map((nx, i) => {
          const nodeDown = i === failingNodeIndex - 1 && local >= brokenFrame;
          return (
            <FlowLine
              key={`hb-${i}`}
              x1={nx + NODE_W / 2}
              y1={NODE_ROW_Y}
              x2={nx + NODE_W / 2}
              y2={NAMENODE_Y + 120}
              frame={local}
              color={nodeDown ? hdfsPalette.nodeDown : hdfsPalette.namenode}
              flowSpeed={nodeDown ? 0 : 3}
            />
          );
        })}
        {dataNodes.map((n, i) => (
          <DataNode
            key={n.id}
            x={NODE_X[i]}
            y={NODE_ROW_Y}
            width={NODE_W}
            label={n.label}
            status={
              i === failingNodeIndex - 1
                ? local >= brokenFrame
                  ? "down"
                  : "live"
                : "live"
            }
            replicas={[`副本${i + 1}`]}
            frame={local}
            offlineFrame={
              i === failingNodeIndex - 1 && local >= brokenFrame
                ? brokenFrame
                : undefined
            }
          />
        ))}
      </div>
      <div style={{opacity: termOp, position: "absolute", left: 80, top: TERMINAL_Y}}>
        <Terminal
          frame={local - 96}
          lines={reportTerminalLines}
          title="查看集群状态"
          note="Live 2 / Dead 1"
          width={920}
        />
      </div>
    </SceneWrap>
  );
};

const HealthyBeat = ({frame}: BeatProps) => {
  const {healthy} = hdfsSceneFrames;
  const local = frame - healthy.start;
  return (
    <SceneWrap start={healthy.start} end={healthy.end} frame={frame}>
      <BeatTitle text="照常可读" sub="集群照常能跑" />
      {dataNodes.map((n, i) => (
        <DataNode
          key={n.id}
          x={NODE_X[i]}
          y={NODE_ROW_Y}
          width={NODE_W}
          label={n.label}
          status={i === failingNodeIndex - 1 ? "dimmed" : "live"}
          replicas={i === failingNodeIndex - 1 ? [] : [`副本${i + 1}`]}
          frame={local}
        />
      ))}
      <DataPacket
        fromX={NODE_X[0] + NODE_W / 2}
        fromY={NODE_ROW_Y}
        toX={NODE_X[0] + NODE_W / 2}
        toY={NODE_ROW_Y - 100}
        startFrame={20}
        duration={40}
        frame={local}
        size={24}
      />
      <div style={{position: "absolute", left: 80, top: TERMINAL_Y}}>
        <Terminal
          frame={local}
          lines={fsckTerminalLines}
          title="校验文件健康度"
          note="Status: HEALTHY"
          width={920}
        />
      </div>
    </SceneWrap>
  );
};

const SummaryBeat = ({frame}: BeatProps) => {
  const {summary} = hdfsSceneFrames;
  const local = frame - summary.start;
  const items = [
    {label: "128MB Block 分块", at: 8},
    {label: "3 副本分散存储", at: 40},
    {label: "心跳断 → 副本接管", at: 74},
    {label: "挂一台，不丢一分", at: 110},
  ];
  const punchOp = interpolate(local, [120, 140], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const punchDy = interpolate(local, [120, 145], [16, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return (
    <SceneWrap start={summary.start} end={summary.end} frame={frame}>
      <BeatTitle text="容错底气" />
      {dataNodes.map((n, i) => (
        <DataNode
          key={n.id}
          x={NODE_X[i]}
          y={500}
          width={NODE_W}
          label={n.label}
          status={i === failingNodeIndex - 1 ? "dimmed" : "live"}
          replicas={i === failingNodeIndex - 1 ? [] : ["OK"]}
          frame={local}
        />
      ))}
      <div
        style={{
          position: "absolute",
          left: 0,
          width: W,
          top: 740,
          display: "flex",
          flexDirection: "column",
          gap: 20,
          alignItems: "center",
        }}
      >
        {items.map((it) => {
          const op = interpolate(local, [it.at, it.at + 10], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          });
          const dx = interpolate(local, [it.at, it.at + 10], [20, 0], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          });
          return (
            <div
              key={it.label}
              style={{
                opacity: op,
                transform: `translateX(${dx}px)`,
                display: "flex",
                alignItems: "center",
                gap: 16,
                fontSize: 38,
                fontWeight: 800,
                color: hdfsPalette.title,
                fontFamily: FONT_SANS,
              }}
            >
              <StatusBadge text="✓" tone="live" />
              {it.label}
            </div>
          );
        })}
      </div>
      <div
        style={{
          position: "absolute",
          left: 0,
          width: W,
          top: 1060,
          display: "flex",
          justifyContent: "center",
          opacity: punchOp,
          transform: `translateY(${punchDy}px)`,
        }}
      >
        <div
          style={{
            display: "inline-flex",
            fontSize: 56,
            fontWeight: 900,
            color: "#fff",
            backgroundColor: hdfsPalette.accentDeep,
            padding: "18px 48px",
            borderRadius: 20,
            letterSpacing: 4,
          }}
        >
          挂一台，不丢一分
        </div>
      </div>
    </SceneWrap>
  );
};

const sfxPath = (kind: string) => {
  switch (kind) {
    case "sfxError":
      return hdfsAudioAssets.sfxError;
    case "sfxSuccess":
      return hdfsAudioAssets.sfxSuccess;
    case "sfxTransfer":
      return hdfsAudioAssets.sfxTransfer;
    case "sfxClick":
      return hdfsAudioAssets.sfxClick;
    case "sfxDing":
      return hdfsAudioAssets.sfxDing;
    default:
      return hdfsAudioAssets.sfxDing;
  }
};

export const HdfsFaultTolerance = () => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill
      style={{
        backgroundColor: hdfsPalette.background,
        fontFamily: FONT_SANS,
      }}
    >
      {frame < hdfsSceneFrames.conflict.start ? <HookBeat frame={frame} /> : null}
      {frame >= hdfsSceneFrames.conflict.start &&
      frame < hdfsSceneFrames.split.start ? (
        <ConflictBeat frame={frame} />
      ) : null}
      {frame >= hdfsSceneFrames.split.start &&
      frame < hdfsSceneFrames.replica.start ? (
        <SplitBeat frame={frame} />
      ) : null}
      {frame >= hdfsSceneFrames.replica.start &&
      frame < hdfsSceneFrames.offline.start ? (
        <ReplicaBeat frame={frame} />
      ) : null}
      {frame >= hdfsSceneFrames.offline.start &&
      frame < hdfsSceneFrames.healthy.start ? (
        <OfflineBeat frame={frame} />
      ) : null}
      {frame >= hdfsSceneFrames.healthy.start &&
      frame < hdfsSceneFrames.summary.start ? (
        <HealthyBeat frame={frame} />
      ) : null}
      {frame >= hdfsSceneFrames.summary.start ? (
        <SummaryBeat frame={frame} />
      ) : null}

      <SubtitleTrack frame={frame} />

      <Audio src={staticFile(hdfsAudioAssets.bed)} volume={0.12} loop />

      {hdfsAudioAssets.voiceover.map((v, i) => (
        <Sequence
          key={`vo-${i}`}
          from={voiceoverFrames[i].start}
          durationInFrames={voiceoverFrames[i].end - voiceoverFrames[i].start}
        >
          <Audio src={staticFile(v)} />
        </Sequence>
      ))}

      {hdfsSoundEffects.map((s, i) => (
        <Sequence
          key={`sfx-${i}`}
          from={s.frame}
          durationInFrames={hdfsFps * 2}
        >
          <Audio src={staticFile(sfxPath(s.kind))} volume={() => s.volume} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};

export const hdfsDuration = hdfsDurationInFrames;
