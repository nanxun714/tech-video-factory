export type SoundEffectEvent = {
  frame: number;
  kind: "switch" | "ding";
  volume: number;
};

export const audioAssets = {
  voiceover: "audio/voiceover-final.wav",
  bed: "audio/bed.wav",
  switch: "audio/sfx/switch.wav",
  ding: "audio/sfx/ding.wav",
} as const;

export const soundEffectEvents: SoundEffectEvent[] = [
  {frame: 320, kind: "switch", volume: 0.16},
  {frame: 480, kind: "switch", volume: 0.18},
  {frame: 651, kind: "ding", volume: 0.28},
  {frame: 668, kind: "switch", volume: 0.17},
];
