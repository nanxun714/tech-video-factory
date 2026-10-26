import {interpolate, Easing} from "remotion";
import {DisplayRow, MarketCapSnapshot} from "./types";

const RANK_FALLOFF = 6;

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  year: "numeric",
  month: "short",
  day: "2-digit",
});

export const formatMarketCap = (value: number): string => {
  if (value >= 1_000_000_000_000) {
    return `$${(value / 1_000_000_000_000).toFixed(2)}T`;
  }

  if (value >= 100_000_000_000) {
    return `$${(value / 1_000_000_000).toFixed(1)}B`;
  }

  if (value >= 1_000_000_000) {
    return `$${(value / 1_000_000_000).toFixed(2)}B`;
  }

  return `$${(value / 1_000_000).toFixed(0)}M`;
};

export const formatDisplayDate = (dateString: string): string => {
  const date = new Date(`${dateString}T00:00:00Z`);
  return dateFormatter.format(date);
};

const getRankMap = (snapshot: MarketCapSnapshot): Map<string, number> => {
  const sorted = [...snapshot.entries].sort((a, b) => b.marketCap - a.marketCap);

  return new Map(
    sorted.map((entry, index) => {
      return [entry.companyId, index];
    }),
  );
};

const getValueMap = (snapshot: MarketCapSnapshot): Map<string, number> => {
  return new Map(snapshot.entries.map((entry) => [entry.companyId, entry.marketCap]));
};

const getNameMap = (snapshots: MarketCapSnapshot[]): Map<string, string> => {
  const names = new Map<string, string>();

  for (const snapshot of snapshots) {
    for (const entry of snapshot.entries) {
      names.set(entry.companyId, entry.companyName);
    }
  }

  return names;
};

export const getInterpolatedRaceState = ({
  frame,
  durationInFrames,
  snapshots,
  maxRows,
}: {
  frame: number;
  durationInFrames: number;
  snapshots: MarketCapSnapshot[];
  maxRows: number;
}): {
  rows: DisplayRow[];
  displayDate: string;
  latestPointIsClose: boolean;
  maxMarketCap: number;
} => {
  const clampedFrame = Math.max(0, Math.min(frame, durationInFrames - 1));
  const segmentCount = Math.max(1, snapshots.length - 1);
  const timelineProgress = durationInFrames === 1 ? 0 : clampedFrame / (durationInFrames - 1);
  const scaledProgress = timelineProgress * segmentCount;
  const segmentIndex = Math.min(Math.floor(scaledProgress), segmentCount - 1);
  const intraSegmentProgress = scaledProgress - segmentIndex;
  const easedProgress = interpolate(intraSegmentProgress, [0, 1], [0, 1], {
    easing: Easing.bezier(0.22, 1, 0.36, 1),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const fromSnapshot = snapshots[segmentIndex];
  const toSnapshot = snapshots[Math.min(segmentIndex + 1, snapshots.length - 1)];
  const fromRanks = getRankMap(fromSnapshot);
  const toRanks = getRankMap(toSnapshot);
  const fromValues = getValueMap(fromSnapshot);
  const toValues = getValueMap(toSnapshot);
  const names = getNameMap(snapshots);
  const allCompanyIdsSet = new Set<string>();

  for (const snapshot of snapshots) {
    for (const entry of snapshot.entries) {
      allCompanyIdsSet.add(entry.companyId);
    }
  }

  const allCompanyIds = [...allCompanyIdsSet];
  const fallbackRank = Math.max(fromSnapshot.entries.length, toSnapshot.entries.length) + RANK_FALLOFF;

  const rows = allCompanyIds
    .map((companyId) => {
      const startRank = fromRanks.get(companyId) ?? fallbackRank;
      const endRank = toRanks.get(companyId) ?? fallbackRank;
      const marketCap = interpolate(
        easedProgress,
        [0, 1],
        [fromValues.get(companyId) ?? 0, toValues.get(companyId) ?? 0],
        {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        },
      );

      return {
        companyId,
        companyName: names.get(companyId) ?? companyId,
        marketCap,
        rank: interpolate(easedProgress, [0, 1], [startRank, endRank], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        }),
      };
    })
    .sort((a, b) => a.rank - b.rank)
    .slice(0, maxRows);

  const maxMarketCap = rows.reduce((maxValue, row) => Math.max(maxValue, row.marketCap), 1);
  const latestPointIsClose = toSnapshot.date === "2026-08-14" && segmentIndex === segmentCount - 1;
  const displayDate = intraSegmentProgress > 0.5 ? toSnapshot.date : fromSnapshot.date;

  return {
    rows,
    displayDate,
    latestPointIsClose,
    maxMarketCap,
  };
};
