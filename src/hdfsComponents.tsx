import {interpolate} from "remotion";
import {hdfsPalette, type TerminalLine} from "./hdfsFaultToleranceData";

const FONT_SANS = '"Aptos", "Segoe UI", "PingFang SC", sans-serif';
const FONT_MONO = '"Cascadia Code", "JetBrains Mono", monospace';

export type NodeStatus = "live" | "down" | "dimmed";

const SOFT_SHADOW = "0 6px 18px rgba(49,56,43,0.1)";
const CARD_BORDER = `1px solid ${hdfsPalette.border}`;

export const StatusBadge = ({
  text,
  tone,
}: {
  text: string;
  tone: "live" | "down" | "info";
}) => {
  const bg =
    tone === "live"
      ? hdfsPalette.nodeLiveSoft
      : tone === "down"
        ? hdfsPalette.nodeDownSoft
        : hdfsPalette.accentSoft;
  const color =
    tone === "live"
      ? hdfsPalette.accentDeep
      : tone === "down"
        ? hdfsPalette.nodeDown
        : hdfsPalette.accentDeep;
  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "5px 14px",
        borderRadius: 999,
        backgroundColor: bg,
        color,
        fontSize: 24,
        fontWeight: 800,
        letterSpacing: 1,
      }}
    >
      {text}
    </div>
  );
};

export const BlockChip = ({
  label,
  color = hdfsPalette.block,
}: {
  label: string;
  color?: string;
}) => {
  return (
    <div
      style={{
        width: 128,
        height: 56,
        borderRadius: 12,
        backgroundColor: color,
        color: "#fff",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: 26,
        fontWeight: 800,
        letterSpacing: 1,
      }}
    >
      {label}
    </div>
  );
};

export const FileIcon = ({
  name,
  width = 300,
}: {
  name: string;
  width?: number;
}) => {
  const height = width * 1.2;
  return (
    <div
      style={{
        position: "relative",
        width,
        height,
        borderRadius: 16,
        backgroundColor: "#ffffff",
        border: CARD_BORDER,
        boxShadow: SOFT_SHADOW,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
      }}
    >
      <div
        style={{
          width: width * 0.3,
          height: width * 0.3,
          borderRadius: 10,
          backgroundColor: hdfsPalette.accentSoft,
          marginBottom: 4,
        }}
      />
      <div
        style={{
          fontSize: 28,
          fontWeight: 800,
          color: hdfsPalette.title,
          fontFamily: FONT_MONO,
        }}
      >
        {name}
      </div>
      <div style={{fontSize: 20, color: hdfsPalette.muted}}>大文件</div>
    </div>
  );
};

export const DataNode = ({
  x,
  y,
  width,
  label,
  status,
  replicas,
  frame,
  offlineFrame,
  replicaAppearFrames,
}: {
  x: number;
  y: number;
  width: number;
  label: string;
  status: NodeStatus;
  replicas: string[];
  frame: number;
  offlineFrame?: number;
  replicaAppearFrames?: number[];
}) => {
  const isDown = status === "down";
  const isDimmed = status === "dimmed";

  const borderColor = isDown ? hdfsPalette.nodeDown : hdfsPalette.border;
  const bgColor = isDown
    ? hdfsPalette.nodeDownSoft
    : isDimmed
      ? "rgba(251,248,241,0.6)"
      : hdfsPalette.card;
  const dotColor = isDown
    ? hdfsPalette.nodeDown
    : isDimmed
      ? hdfsPalette.muted
      : hdfsPalette.nodeLive;

  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        width,
        height: 196,
        borderRadius: 20,
        backgroundColor: bgColor,
        border: `1px solid ${borderColor}`,
        boxShadow: SOFT_SHADOW,
        padding: "18px 22px",
        display: "flex",
        flexDirection: "column",
        gap: 12,
        opacity: isDimmed ? 0.65 : 1,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            fontSize: 30,
            fontWeight: 800,
            color: hdfsPalette.title,
          }}
        >
          <div
            style={{
              width: 16,
              height: 16,
              borderRadius: 999,
              backgroundColor: dotColor,
            }}
          />
          {label}
        </div>
        {isDown ? (
          <StatusBadge text="OFFLINE" tone="down" />
        ) : isDimmed ? null : (
          <StatusBadge text="LIVE" tone="live" />
        )}
      </div>
      <div
        style={{
          display: "flex",
          gap: 10,
          flexWrap: "wrap",
          minHeight: 64,
          alignItems: "center",
        }}
      >
        {replicas.length === 0 ? (
          <div style={{fontSize: 22, color: hdfsPalette.muted}}>— 空 —</div>
        ) : (
          replicas.map((r, i) => {
            const appear = replicaAppearFrames?.[i];
            const visible = appear === undefined || frame >= appear;
            const op =
              appear === undefined
                ? 1
                : interpolate(frame - appear, [0, 8], [0, 1], {
                    extrapolateLeft: "clamp",
                    extrapolateRight: "clamp",
                  });
            const dy =
              appear === undefined
                ? 0
                : interpolate(frame - appear, [0, 8], [14, 0], {
                    extrapolateLeft: "clamp",
                    extrapolateRight: "clamp",
                  });
            return (
              <div
                key={r}
                style={{
                  opacity: visible ? op : 0,
                  transform: `translateY(${visible ? dy : 14}px)`,
                }}
              >
                <BlockChip
                  label={r}
                  color={isDown ? hdfsPalette.nodeDown : hdfsPalette.block}
                />
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export const NameNode = ({
  x,
  y,
  width,
  frame,
  heartbeatBrokenFrame,
}: {
  x: number;
  y: number;
  width: number;
  frame: number;
  heartbeatBrokenFrame?: number;
}) => {
  const broken =
    heartbeatBrokenFrame !== undefined && frame >= heartbeatBrokenFrame;
  const dotColor = broken ? hdfsPalette.nodeDown : hdfsPalette.namenode;
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        width,
        height: 120,
        borderRadius: 20,
        backgroundColor: hdfsPalette.card,
        border: `1px solid ${
          broken ? hdfsPalette.nodeDown : hdfsPalette.namenode
        }`,
        boxShadow: SOFT_SHADOW,
        padding: "16px 24px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
      }}
    >
      <div>
        <div
          style={{
            fontSize: 30,
            fontWeight: 800,
            color: hdfsPalette.title,
            letterSpacing: 0.5,
          }}
        >
          NameNode
        </div>
        <div style={{fontSize: 22, color: hdfsPalette.muted, marginTop: 2}}>
          {broken ? "心跳丢失 · 触发副本接管" : "管理元数据 · 监听心跳"}
        </div>
      </div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
        }}
      >
        <div
          style={{
            width: 18,
            height: 18,
            borderRadius: 999,
            backgroundColor: dotColor,
          }}
        />
        <div
          style={{
            fontSize: 26,
            fontWeight: 800,
            color: broken ? hdfsPalette.nodeDown : hdfsPalette.namenode,
          }}
        >
          {broken ? "DEAD" : "ALIVE"}
        </div>
      </div>
    </div>
  );
};

export const FlowLine = ({
  x1,
  y1,
  x2,
  y2,
  frame,
  color = hdfsPalette.accent,
  flowSpeed = 3,
  packet = false,
  packetStart = 0,
  packetDur = 24,
  packetColor = hdfsPalette.packet,
  width = 1080,
  height = 1920,
}: {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  frame: number;
  color?: string;
  flowSpeed?: number;
  packet?: boolean;
  packetStart?: number;
  packetDur?: number;
  packetColor?: string;
  width?: number;
  height?: number;
}) => {
  const dashOffset = -((frame * flowSpeed) % 22);
  const local = frame - packetStart;
  let px = 0;
  let py = 0;
  let pvisible = false;
  let popacity = 0;
  if (packet && local >= 0 && local <= packetDur) {
    const p = interpolate(local, [0, packetDur], [0, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });
    px = x1 + (x2 - x1) * p;
    py = y1 + (y2 - y1) * p;
    pvisible = true;
    popacity = interpolate(
      local,
      [0, 3, packetDur - 4, packetDur],
      [0, 1, 1, 0],
      {extrapolateLeft: "clamp", extrapolateRight: "clamp"},
    );
  }
  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      style={{position: "absolute", left: 0, top: 0, pointerEvents: "none"}}
    >
      <line
        x1={x1}
        y1={y1}
        x2={x2}
        y2={y2}
        stroke={color}
        strokeWidth={3}
        strokeDasharray="10 12"
        strokeDashoffset={dashOffset}
        opacity={0.55}
      />
      {pvisible ? (
        <circle
          cx={px}
          cy={py}
          r={10}
          fill={packetColor}
          opacity={popacity}
        />
      ) : null}
    </svg>
  );
};

export const DataPacket = ({
  fromX,
  fromY,
  toX,
  toY,
  startFrame,
  duration,
  frame,
  color = hdfsPalette.packet,
  size = 20,
}: {
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
  startFrame: number;
  duration: number;
  frame: number;
  color?: string;
  size?: number;
}) => {
  const local = frame - startFrame;
  if (local < 0 || local > duration) return null;
  const p = interpolate(local, [0, duration], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const x = fromX + (toX - fromX) * p;
  const y = fromY + (toY - fromY) * p;
  const opacity = interpolate(
    local,
    [0, 3, duration - 4, duration],
    [0, 1, 1, 0.2],
    {extrapolateLeft: "clamp", extrapolateRight: "clamp"},
  );
  return (
    <div
      style={{
        position: "absolute",
        left: x - size / 2,
        top: y - size / 2,
        width: size,
        height: size,
        borderRadius: 999,
        backgroundColor: color,
        opacity,
      }}
    />
  );
};

export const Terminal = ({
  frame,
  lines,
  title,
  note,
  width = 920,
}: {
  frame: number;
  lines: TerminalLine[];
  title: string;
  note?: string;
  width?: number;
}) => {
  return (
    <div
      style={{
        width,
        borderRadius: 20,
        backgroundColor: hdfsPalette.card,
        border: CARD_BORDER,
        boxShadow: SOFT_SHADOW,
        padding: 22,
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 4,
          marginBottom: 14,
        }}
      >
        <div style={{fontSize: 28, fontWeight: 800, color: hdfsPalette.title}}>
          {title}
        </div>
        {note ? (
          <div style={{fontSize: 20, color: hdfsPalette.muted}}>{note}</div>
        ) : null}
      </div>
      <div
        style={{
          backgroundColor: hdfsPalette.terminal,
          borderRadius: 16,
          overflow: "hidden",
          minHeight: 200,
        }}
      >
        <div
          style={{
            height: 34,
            backgroundColor: hdfsPalette.terminalBar,
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "0 14px",
          }}
        >
          {["#ff6b6b", "#ffd166", "#7bd88f"].map((c) => (
            <div
              key={c}
              style={{
                width: 10,
                height: 10,
                borderRadius: 999,
                backgroundColor: c,
              }}
            />
          ))}
        </div>
        <div
          style={{
            padding: "18px 22px",
            fontFamily: FONT_MONO,
            fontSize: 24,
            lineHeight: 1.7,
            color: hdfsPalette.terminalText,
            whiteSpace: "pre-wrap",
          }}
        >
          {lines.map((line, index) => {
            const localFrame = frame - line.startFrame;
            if (localFrame < 0) return null;
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
            const isTypingActive =
              line.mode === "typing" && content.length < line.text.length;
            return (
              <div
                key={`${line.text}-${index}`}
                style={{
                  opacity,
                  color: line.color ?? hdfsPalette.terminalText,
                  backgroundColor: line.highlight
                    ? "rgba(167,216,139,0.1)"
                    : "transparent",
                  borderRadius: 8,
                  padding: line.highlight ? "2px 8px" : 0,
                  width: "fit-content",
                }}
              >
                {content}
                {isTypingActive ? (
                  <span style={{color: hdfsPalette.terminalSuccess}}>▋</span>
                ) : null}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export const CoverTitle = ({
  frame,
  kicker,
  title,
  subtitle,
  y,
  width = 1080,
}: {
  frame: number;
  kicker: string;
  title: string;
  subtitle: string;
  y: number;
  width?: number;
}) => {
  const kOp = interpolate(frame, [0, 6], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const kDy = interpolate(frame, [0, 6], [10, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const tOp = interpolate(frame, [0, 10], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const tDy = interpolate(frame, [0, 10], [14, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const sOp = interpolate(frame, [0, 14], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const sDy = interpolate(frame, [0, 14], [12, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        width,
        top: y,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 14,
        textAlign: "center",
      }}
    >
      <div
        style={{
          opacity: kOp,
          transform: `translateY(${kDy}px)`,
          fontSize: 28,
          fontWeight: 800,
          letterSpacing: 6,
          color: hdfsPalette.accent,
          fontFamily: FONT_SANS,
        }}
      >
        {kicker}
      </div>
      <div
        style={{
          opacity: tOp,
          transform: `translateY(${tDy}px)`,
          fontSize: 80,
          fontWeight: 900,
          color: hdfsPalette.title,
          fontFamily: FONT_SANS,
          letterSpacing: 2,
          lineHeight: 1.05,
        }}
      >
        {title}
      </div>
      <div
        style={{
          opacity: sOp,
          transform: `translateY(${sDy}px)`,
          fontSize: 34,
          fontWeight: 700,
          color: hdfsPalette.body,
          maxWidth: 860,
        }}
      >
        {subtitle}
      </div>
    </div>
  );
};

export const CameraFrame = ({
  frame,
  zoomFrom,
  zoomTo,
  panFrom = {x: 0, y: 0},
  panTo = {x: 0, y: 0},
  startFrame,
  duration,
  children,
}: {
  frame: number;
  zoomFrom: number;
  zoomTo: number;
  panFrom?: {x: number; y: 0};
  panTo?: {x: number; y: 0};
  startFrame: number;
  duration: number;
  children: React.ReactNode;
}) => {
  const local = frame - startFrame;
  const p = interpolate(local, [0, duration], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const zoom = zoomFrom + (zoomTo - zoomFrom) * p;
  const px = panFrom.x + (panTo.x - panFrom.x) * p;
  const py = panFrom.y + (panTo.y - panFrom.y) * p;
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        transform: `scale(${zoom}) translate(${px}px, ${py}px)`,
        transformOrigin: "center center",
      }}
    >
      {children}
    </div>
  );
};

export const SceneWrap = ({
  start,
  end,
  frame,
  children,
  noFadeIn = false,
}: {
  start: number;
  end: number;
  frame: number;
  children: React.ReactNode;
  noFadeIn?: boolean;
}) => {
  const local = frame - start;
  const dur = end - start;
  const fade = noFadeIn
    ? interpolate(local, [dur - 10, dur], [1, 0], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      })
    : interpolate(
        local,
        [0, 8, dur - 10, dur],
        [0, 1, 1, 0],
        {extrapolateLeft: "clamp", extrapolateRight: "clamp"},
      );
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        opacity: fade,
      }}
    >
      {children}
    </div>
  );
};

export {FONT_SANS, FONT_MONO};
