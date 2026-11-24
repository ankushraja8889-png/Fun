export type SpeciesId = 'fox' | 'rabbit' | 'red_panda' | 'fennec';

export type MoodState = 'happy' | 'curious' | 'teasing' | 'annoyed' | 'angry';

export type EnvironmentId =
  | 'golden_loft'
  | 'twilight_metro'
  | 'rainforest_terrace';

export type EyeShapeStyle = 'alert' | 'slick' | 'wide' | 'sharp';

export type CoatPattern = 'solid' | 'freckled' | 'tabby' | 'tuxedo';

export type AccessoryId =
  | 'none'
  | 'aviators'
  | 'police_vest'
  | 'floral_tie'
  | 'knit_scarf';

export interface FaceConfig {
  species: SpeciesId;
  name: string;
  primaryFur: string;
  secondaryFur: string;
  innerEarColor: string;
  noseColor: string;
  eyeColorLeft: string;
  eyeColorRight: string;
  eyeStyle: EyeShapeStyle;
  eyeScale: number;       // 0.78 - 1.25
  eyeSpacing: number;     // 0.85 - 1.2
  pupilSize: number;      // 0.25 - 0.62
  snoutLength: number;    // 0.75 - 1.3
  cheekPlumpness: number; // 0.8 - 1.28
  earLength: number;      // 0.75 - 1.35
  earDroop: number;       // -0.25 (perked) to 0.55 (lop/relaxed)
  browThickness: number;  // 0.6 - 1.4
  whiskerDensity: number; // 0 - 1 (0 = none, 0.5 = 2 pairs, 1 = 3 pairs)
  coatPattern: CoatPattern;
  furSheen: number;       // 0.2 - 1.0
  accessory: AccessoryId;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'companion';
  text: string;
  mood: MoodState;
  timestamp: number;
}

export interface CompanionState {
  mood: MoodState;
  patience: number;       // 0 - 100 (drops fast on repeated questions!)
  affinity: number;       // 0 - 100
  energy: number;         // 0 - 100
  recentQuestions: string[];
  consecutiveRepeats: number;
  lastQuestionNormalized: string;
  totalInteractions: number;
}

export type CareAction =
  | 'pet'
  | 'boop'
  | 'tickle'
  | 'carrot'
  | 'pawpsicle'
  | 'berry'
  | 'apologize';

export type AnimationCue =
  | 'idle'
  | 'talk'
  | 'happy_hop'
  | 'giggle'
  | 'boop_sneeze'
  | 'eat_treat'
  | 'angry_stomp'
  | 'ear_twitch'
  | 'wave';
