export const hdfsFps = 30;
export const hdfsDurationInFrames = 1380;

export type FormatProfile = {
  platform: "douyin" | "bilibili" | "xiaohongshu";
  width: number;
  height: number;
  fps: number;
  aspect: "9:16" | "16:9" | "4:5";
};

export const hdfsFormat: FormatProfile = {
  platform: "douyin",
  width: 1080,
  height: 1920,
  fps: hdfsFps,
  aspect: "9:16",
};

export type TutorialSubtitle = {
  startFrame: number;
  endFrame: number;
  text: string;
};

export type TerminalLine = {
  startFrame: number;
  mode: "typing" | "fade";
  text: string;
  color?: string;
  highlight?: boolean;
};

export const hdfsPalette = {
  background: "#f6f2ea",
  card: "#fbf8f1",
  cardSoft: "rgba(251, 248, 241, 0.94)",
  border: "#e6dccd",
  title: "#1f241f",
  body: "#344233",
  muted: "#697662",
  accent: "#5f7f39",
  accentSoft: "#dce8c8",
  accentDeep: "#4a6a2e",
  nodeLive: "#5f7f39",
  nodeLiveSoft: "#dce8c8",
  nodeDown: "#c0392b",
  nodeDownSoft: "#f6d4cf",
  namenode: "#2f5d8a",
  namenodeSoft: "#d4e3f0",
  block: "#4a6a2e",
  packet: "#7bd88f",
  terminal: "#171a1d",
  terminalBar: "#23282d",
  terminalText: "#eef1f4",
  terminalMuted: "#b8c1cb",
  terminalSuccess: "#a7d88b",
  terminalError: "#ff8f8f",
} as const;

export const hdfsSceneFrames = {
  hook: {start: 0, end: 168},
  conflict: {start: 168, end: 336},
  split: {start: 336, end: 548},
  replica: {start: 548, end: 813},
  offline: {start: 813, end: 1019},
  healthy: {start: 1019, end: 1139},
  summary: {start: 1139, end: hdfsDurationInFrames},
} as const;

export const hdfsSubtitles: TutorialSubtitle[] = [
  {startFrame: 6, endFrame: 164, text: "数据会消失吗？"},
  {startFrame: 174, endFrame: 330, text: "不会。HDFS 不只存一份"},
  {startFrame: 344, endFrame: 540, text: "切成 128MB 的 Block"},
  {startFrame: 554, endFrame: 750, text: "三副本分散存储"},
  {startFrame: 766, endFrame: 956, text: "掉线？去找其它副本"},
  {startFrame: 970, endFrame: 1078, text: "照常能读"},
  {startFrame: 1090, endFrame: 1290, text: "挂一台，不丢一分"},
];

export const uploadTerminalLines: TerminalLine[] = [
  {
    startFrame: 8,
    mode: "typing",
    text: "[root@node1 ~]# hdfs dfs -put bigfile.log /",
    color: hdfsPalette.terminalText,
  },
];

export const reportTerminalLines: TerminalLine[] = [
  {
    startFrame: 6,
    mode: "typing",
    text: "[root@node1 ~]# hdfs dfsadmin -report",
    color: hdfsPalette.terminalText,
  },
  {startFrame: 60, mode: "fade", text: "Live datanodes (2):", color: hdfsPalette.terminalMuted},
  {startFrame: 78, mode: "fade", text: "  node1", color: hdfsPalette.terminalSuccess},
  {startFrame: 96, mode: "fade", text: "  node2", color: hdfsPalette.terminalSuccess},
  {startFrame: 120, mode: "fade", text: "Dead datanodes (1):", color: hdfsPalette.terminalError},
  {
    startFrame: 138,
    mode: "fade",
    text: "  node3",
    color: hdfsPalette.terminalError,
    highlight: true,
  },
];

export const fsckTerminalLines: TerminalLine[] = [
  {
    startFrame: 6,
    mode: "typing",
    text: "[root@node1 ~]# hdfs fsck /bigfile.log",
    color: hdfsPalette.terminalText,
  },
  {
    startFrame: 58,
    mode: "fade",
    text: "Status: HEALTHY",
    color: hdfsPalette.terminalSuccess,
    highlight: true,
  },
];

export type DataNodeConfig = {
  id: string;
  label: string;
  index: number;
};

export const dataNodes: DataNodeConfig[] = [
  {id: "dn1", label: "DataNode 1", index: 1},
  {id: "dn2", label: "DataNode 2", index: 2},
  {id: "dn3", label: "DataNode 3", index: 3},
];

export const failingNodeIndex = 3;
export const blockCount = 3;
export const replicationFactor = 3;

export const hdfsAudioAssets = {
  bed: "audio/bed.wav",
  sfxError: "audio/sfx/error.wav",
  sfxSuccess: "audio/sfx/success.wav",
  sfxTransfer: "audio/sfx/transfer.wav",
  sfxClick: "audio/sfx/click.wav",
  sfxDing: "audio/sfx/ding.wav",
  voiceover: [
    "audio/tts-pipeline/s01.mp3",
    "audio/tts-pipeline/s02.mp3",
    "audio/tts-pipeline/s03.mp3",
    "audio/tts-pipeline/s04.mp3",
    "audio/tts-pipeline/s05.mp3",
    "audio/tts-pipeline/s06.mp3",
    "audio/tts-pipeline/s07.mp3",
  ],
} as const;

export const voiceoverFrames = [
  {start: 0, end: 164},
  {start: 169, end: 332},
  {start: 337, end: 544},
  {start: 549, end: 809},
  {start: 815, end: 1016},
  {start: 1021, end: 1136},
  {start: 1141, end: 1349},
] as const;

export const hdfsSoundEffects = [
  {frame: 28, kind: "sfxError" as const, volume: 0.4},
  {frame: 169, kind: "sfxDing" as const, volume: 0.28},
  {frame: 340, kind: "sfxClick" as const, volume: 0.3},
  {frame: 552, kind: "sfxTransfer" as const, volume: 0.32},
  {frame: 818, kind: "sfxError" as const, volume: 0.4},
  {frame: 1024, kind: "sfxSuccess" as const, volume: 0.34},
  {frame: 1144, kind: "sfxDing" as const, volume: 0.3},
];
