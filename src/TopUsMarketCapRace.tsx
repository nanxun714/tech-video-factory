import {Audio} from "@remotion/media";
import {AbsoluteFill, Easing, interpolate, Sequence, staticFile, useCurrentFrame, useVideoConfig} from "remotion";
import {audioAssets, soundEffectEvents} from "./audioTimeline";
import {marketCapSnapshots} from "./data";
import {formatDisplayDate, formatMarketCap, getInterpolatedRaceState} from "./raceMath";
import {DisplayRow} from "./types";

const WIDTH = 1920;
const HEIGHT = 1080;
const PADDING_X = 96;
const PADDING_TOP = 110;
const PADDING_BOTTOM = 88;
const LABEL_COLUMN_WIDTH = 350;
const VALUE_COLUMN_WIDTH = 210;
const ROW_GAP = 12;
const MAX_ROWS = 10;
const BAR_AREA_WIDTH = WIDTH - PADDING_X * 2 - LABEL_COLUMN_WIDTH - VALUE_COLUMN_WIDTH;
const ROW_HEIGHT =
  (HEIGHT - PADDING_TOP - PADDING_BOTTOM - ROW_GAP * (MAX_ROWS - 1)) / MAX_ROWS;

const colors = {
  background: "#f4f6f8",
  title: "#122033",
  body: "#223248",
  muted: "#6f7c8a",
  track: "#dde3ea",
  bar: "#8ba4c5",
  barAccent: "#204a7a",
  stroke: "#e8edf2",
};

const BarRow = ({
  row,
  index,
  maxMarketCap,
}: {
  row: DisplayRow;
  index: number;
  maxMarketCap: number;
}) => {
  const width = Math.max((row.marketCap / maxMarketCap) * BAR_AREA_WIDTH, 8);
  const top = row.rank * (ROW_HEIGHT + ROW_GAP);
  const isLeader = index === 0;

  return (
    <div
      style={{
        position: "absolute",
        top,
        left: 0,
        width: LABEL_COLUMN_WIDTH + BAR_AREA_WIDTH + VALUE_COLUMN_WIDTH,
        height: ROW_HEIGHT,
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          borderBottom: `1px solid ${colors.stroke}`,
        }}
      />
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          width: LABEL_COLUMN_WIDTH - 24,
          height: ROW_HEIGHT,
          display: "flex",
          alignItems: "center",
          gap: 18,
        }}
      >
        <div
          style={{
            width: 28,
            textAlign: "right",
            fontSize: 22,
            fontWeight: 600,
            color: colors.muted,
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {index + 1}
        </div>
        <div
          style={{
            fontSize: 29,
            fontWeight: isLeader ? 700 : 600,
            color: colors.body,
            letterSpacing: -0.4,
            whiteSpace: "nowrap",
          }}
        >
          {row.companyName}
        </div>
      </div>
      <div
        style={{
          position: "absolute",
          left: LABEL_COLUMN_WIDTH,
          top: ROW_HEIGHT / 2 - 15,
          width: BAR_AREA_WIDTH,
          height: 30,
          borderRadius: 999,
          backgroundColor: colors.track,
        }}
      />
      <div
        style={{
          position: "absolute",
          left: LABEL_COLUMN_WIDTH,
          top: ROW_HEIGHT / 2 - 15,
          width,
          height: 30,
          borderRadius: 999,
          backgroundColor: isLeader ? colors.barAccent : colors.bar,
        }}
      />
      <div
        style={{
          position: "absolute",
          right: 0,
          top: 0,
          width: VALUE_COLUMN_WIDTH,
          height: ROW_HEIGHT,
          display: "flex",
          alignItems: "center",
          justifyContent: "flex-end",
          fontSize: 28,
          fontWeight: 650,
          color: colors.body,
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {formatMarketCap(row.marketCap)}
      </div>
    </div>
  );
};

export const BarRace = () => {
  const frame = useCurrentFrame();
  const {durationInFrames, fps} = useVideoConfig();
  const intro = interpolate(frame, [0, fps * 1.2], [0, 1], {
    easing: Easing.bezier(0.16, 1, 0.3, 1),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const titleOffset = interpolate(intro, [0, 1], [20, 0]);
  const chartOffset = interpolate(intro, [0, 1], [34, 0]);
  const chartOpacity = interpolate(intro, [0, 1], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const race = getInterpolatedRaceState({
    frame,
    durationInFrames,
    snapshots: marketCapSnapshots,
    maxRows: MAX_ROWS,
  });
  const bedVolume = interpolate(frame, [0, fps * 1.5, durationInFrames - fps * 4, durationInFrames - 1], [0, 0.14, 0.14, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: colors.background,
        fontFamily: "\"IBM Plex Sans\", \"Aptos\", \"Segoe UI\", sans-serif",
        color: colors.body,
      }}
    >
      <Audio src={staticFile(audioAssets.bed)} volume={() => bedVolume} />
      <Audio src={staticFile(audioAssets.voiceover)} volume={() => 0.92} />
      {soundEffectEvents.map((event) => (
        <Sequence key={`${event.kind}-${event.frame}`} from={event.frame}>
          <Audio src={staticFile(audioAssets[event.kind])} volume={() => event.volume} />
        </Sequence>
      ))}
      <div
        style={{
          position: "absolute",
          left: PADDING_X,
          right: PADDING_X,
          top: 44 + titleOffset,
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          opacity: intro,
        }}
      >
        <div>
          <div
            style={{
              fontSize: 42,
              lineHeight: 1.1,
              fontWeight: 700,
              letterSpacing: -1.2,
              color: colors.title,
            }}
          >
            Highest U.S.-Listed Companies by Market Cap
          </div>
          <div
            style={{
              marginTop: 10,
              fontSize: 21,
              color: colors.muted,
            }}
          >
            2016-08-31 to 2026-08-14 latest close, parent-company market cap
          </div>
        </div>
        <div
          style={{
            textAlign: "right",
          }}
        >
          <div
            style={{
              fontSize: 18,
              textTransform: "uppercase",
              letterSpacing: 1.6,
              color: colors.muted,
            }}
          >
            Date
          </div>
          <div
            style={{
              marginTop: 6,
              fontSize: 34,
              fontWeight: 700,
              color: colors.title,
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {formatDisplayDate(race.displayDate)}
          </div>
        </div>
      </div>

      <div
        style={{
          position: "absolute",
          left: PADDING_X,
          right: PADDING_X,
          top: PADDING_TOP + chartOffset,
          bottom: PADDING_BOTTOM,
          opacity: chartOpacity,
        }}
      >
        {race.rows.map((row, index) => (
          <BarRow
            key={row.companyId}
            row={row}
            index={index}
            maxMarketCap={race.maxMarketCap}
          />
        ))}
      </div>

      <div
        style={{
          position: "absolute",
          left: PADDING_X,
          right: PADDING_X,
          bottom: 32,
          display: "flex",
          justifyContent: "space-between",
          fontSize: 18,
          color: colors.muted,
        }}
      >
        <div>
          Market cap in USD. Replace sample snapshots with month-end series derived from
          SEC share counts and Nasdaq close prices.
        </div>
        <div>{race.latestPointIsClose ? "Latest complete U.S. close: 2026-08-14" : "Monthly snapshots"}</div>
      </div>
    </AbsoluteFill>
  );
};

export const TopUsMarketCapRace = () => {
  return <BarRace />;
};
