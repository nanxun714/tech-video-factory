export const tutorialFps = 30;
export const tutorialDurationInFrames = 32 * tutorialFps;

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

export const tutorialPalette = {
  background: "#f6f2ea",
  card: "#fbf8f1",
  border: "#e6dccd",
  title: "#1f241f",
  body: "#344233",
  muted: "#697662",
  accent: "#5f7f39",
  accentSoft: "#dce8c8",
  accentDeep: "#4a6a2e",
  terminal: "#171a1d",
  terminalBar: "#23282d",
  terminalText: "#eef1f4",
  terminalMuted: "#b8c1cb",
  terminalSuccess: "#a7d88b",
  terminalError: "#ff8f8f",
  subtitleBg: "rgba(255, 255, 255, 0.86)",
} as const;

export const tutorialSubtitles: TutorialSubtitle[] = [
  {
    startFrame: 3,
    endFrame: 114,
    text: "Linux 和 Hadoop 排错，先别急着重新安装。",
  },
  {
    startFrame: 113,
    endFrame: 305,
    text: "真正卡住的，通常就两个地方：JAVA_HOME 没配，SSH 也没通。",
  },
  {
    startFrame: 305,
    endFrame: 423,
    text: "先把环境变量补上，再重新加载 profile。",
  },
  {
    startFrame: 423,
    endFrame: 562,
    text: "然后生成密钥，分发公钥，确认免密登录没问题。",
  },
  {
    startFrame: 562,
    endFrame: 673,
    text: "等这两步都过了，Hadoop 才能稳稳启动。",
  },
  {
    startFrame: 673,
    endFrame: 823,
    text: "记住这个顺序：先看环境，再看连接，最后看结果。",
  },
];

export const envTerminalLines: TerminalLine[] = [
  {
    startFrame: 0,
    mode: "typing",
    text: "[root@node1 ~]# echo $JAVA_HOME",
    color: tutorialPalette.terminalText,
  },
  {
    startFrame: 32,
    mode: "fade",
    text: "(no output)",
    color: tutorialPalette.terminalError,
  },
  {
    startFrame: 58,
    mode: "typing",
    text: "[root@node1 ~]# vi /etc/profile",
    color: tutorialPalette.terminalText,
  },
  {
    startFrame: 95,
    mode: "fade",
    text: "export JAVA_HOME=/usr/local/java",
    color: tutorialPalette.terminalSuccess,
    highlight: true,
  },
  {
    startFrame: 118,
    mode: "fade",
    text: "export PATH=$JAVA_HOME/bin:$PATH",
    color: tutorialPalette.terminalSuccess,
    highlight: true,
  },
  {
    startFrame: 146,
    mode: "typing",
    text: "[root@node1 ~]# source /etc/profile",
    color: tutorialPalette.terminalText,
  },
  {
    startFrame: 183,
    mode: "typing",
    text: "[root@node1 ~]# echo $JAVA_HOME",
    color: tutorialPalette.terminalText,
  },
  {
    startFrame: 214,
    mode: "fade",
    text: "/usr/local/java",
    color: tutorialPalette.terminalSuccess,
  },
];

export const sshTerminalLines: TerminalLine[] = [
  {
    startFrame: 0,
    mode: "typing",
    text: "[root@node1 ~]# ssh-keygen -t rsa",
    color: tutorialPalette.terminalText,
  },
  {
    startFrame: 42,
    mode: "fade",
    text: "Generating public/private rsa key pair...",
    color: tutorialPalette.terminalMuted,
  },
  {
    startFrame: 78,
    mode: "typing",
    text: "[root@node1 ~]# ssh-copy-id node2",
    color: tutorialPalette.terminalText,
  },
  {
    startFrame: 122,
    mode: "fade",
    text: "Number of key(s) added: 1",
    color: tutorialPalette.terminalSuccess,
  },
  {
    startFrame: 150,
    mode: "typing",
    text: "[root@node1 ~]# ssh-copy-id node3",
    color: tutorialPalette.terminalText,
  },
  {
    startFrame: 194,
    mode: "fade",
    text: "Number of key(s) added: 1",
    color: tutorialPalette.terminalSuccess,
  },
  {
    startFrame: 220,
    mode: "typing",
    text: "[root@node1 ~]# ssh node2",
    color: tutorialPalette.terminalText,
  },
  {
    startFrame: 258,
    mode: "fade",
    text: "Login successful.",
    color: tutorialPalette.terminalSuccess,
    highlight: true,
  },
];

export const resultTerminalLines: TerminalLine[] = [
  {
    startFrame: 0,
    mode: "typing",
    text: "[root@node1 ~]# start-dfs.sh",
    color: tutorialPalette.terminalText,
  },
  {
    startFrame: 36,
    mode: "fade",
    text: "Starting namenodes on [node1]",
    color: tutorialPalette.terminalMuted,
  },
  {
    startFrame: 58,
    mode: "fade",
    text: "Starting datanodes",
    color: tutorialPalette.terminalMuted,
  },
  {
    startFrame: 80,
    mode: "fade",
    text: "Starting secondary namenodes [node2]",
    color: tutorialPalette.terminalMuted,
  },
  {
    startFrame: 118,
    mode: "typing",
    text: "[root@node1 ~]# jps",
    color: tutorialPalette.terminalText,
  },
  {
    startFrame: 150,
    mode: "fade",
    text: "9876 NameNode",
    color: tutorialPalette.terminalText,
  },
  {
    startFrame: 166,
    mode: "fade",
    text: "10012 DataNode",
    color: tutorialPalette.terminalText,
  },
  {
    startFrame: 182,
    mode: "fade",
    text: "10234 SecondaryNameNode",
    color: tutorialPalette.terminalText,
  },
  {
    startFrame: 198,
    mode: "fade",
    text: "10456 ResourceManager",
    color: tutorialPalette.terminalText,
  },
  {
    startFrame: 214,
    mode: "fade",
    text: "10678 NodeManager",
    color: tutorialPalette.terminalText,
  },
  {
    startFrame: 230,
    mode: "fade",
    text: "12000 Jps",
    color: tutorialPalette.terminalSuccess,
    highlight: true,
  },
];

export const tutorialAudioAssets = {
  voiceover: "audio/linux-hadoop-tutorial-voiceover-xiaoyi-final.wav",
  bed: "audio/bed.wav",
  switch: "audio/sfx/switch.wav",
  ding: "audio/sfx/ding.wav",
} as const;

export const tutorialSoundEffects = [
  {frame: 120, kind: "switch" as const, volume: 0.12},
  {frame: 270, kind: "switch" as const, volume: 0.12},
  {frame: 480, kind: "switch" as const, volume: 0.13},
  {frame: 690, kind: "switch" as const, volume: 0.13},
  {frame: 820, kind: "ding" as const, volume: 0.2},
];
