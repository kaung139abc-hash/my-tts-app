export type VoiceName = "Kore" | "Puck" | "Charon" | "Fenrir" | "Aoede" | "Zephyr";

export type PersonaId =
  | "child_girl"
  | "child_boy"
  | "teen_girl"
  | "teen_boy"
  | "adult_woman"
  | "adult_man"
  | "elder_woman"
  | "elder_man";

export interface PersonaOption {
  id: PersonaId;
  label: string;
  myanmarLabel: string;
  category: "child" | "youth" | "adult" | "elder";
  gender: "female" | "male";
  ageGroup: string;
  myanmarAgeGroup: string;
  description: string;
  myanmarDescription: string;
  defaultVoice: VoiceName;
  defaultEmotion: EmotionType;
  promptDirective: string;
  avatarBg: string;
  iconType: string;
}

export interface VoiceOption {
  id: VoiceName;
  name: string;
  myanmarName: string;
  gender: "female" | "male" | "neutral";
  tone: string;
  myanmarTone: string;
  description: string;
  myanmarDescription: string;
  avatarColor: string;
  tag: string;
}

export type EmotionType =
  | "natural"
  | "cheerful"
  | "storytelling"
  | "news"
  | "empathetic"
  | "dramatic"
  | "motivational"
  | "whisper";

export interface EmotionOption {
  id: EmotionType;
  label: string;
  myanmarLabel: string;
  iconName: string;
  description: string;
  myanmarDescription: string;
  badgeColor: string;
}

export interface GeneratedAudio {
  id: string;
  title: string;
  text: string;
  audioUrl: string;
  duration: number;
  timestamp: number;
  voice: VoiceName;
  persona?: PersonaId;
  emotion: EmotionType;
  language: "my" | "en" | "auto";
  customPrompt?: string;
  isFavorite?: boolean;
  mode?: "single" | "dialogue";
  dialogue?: DialogueLine[];
}

export interface DialogueLine {
  id: string;
  speaker: string;
  voice: VoiceName;
  persona?: PersonaId;
  text: string;
}

export interface TextPreset {
  id: string;
  category: string;
  myanmarCategory: string;
  title: string;
  myanmarTitle: string;
  text: string;
  recommendedVoice: VoiceName;
  recommendedPersona?: PersonaId;
  recommendedEmotion: EmotionType;
}

