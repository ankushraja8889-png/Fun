import type {
  AccessoryId,
  CareAction,
  CoatPattern,
  CompanionState,
  EyeShapeStyle,
  FaceConfig,
  MoodState,
  SpeciesId,
} from './companionTypes';

export const SPECIES_META: Record<
  SpeciesId,
  {
    label: string;
    subtitle: string;
    defaultName: string;
    voiceName: 'Puck' | 'Kore' | 'Zephyr' | 'Fenrir';
  }
> = {
  fox: {
    label: 'Red Fox',
    subtitle: 'Witty Downtown Hustler',
    defaultName: 'Rusty',
    voiceName: 'Puck',
  },
  rabbit: {
    label: 'Cottontail Rabbit',
    subtitle: 'Sharp City Cadet',
    defaultName: 'Clover',
    voiceName: 'Kore',
  },
  red_panda: {
    label: 'Red Panda',
    subtitle: 'Cozy Botanical Sage',
    defaultName: 'Mochi',
    voiceName: 'Zephyr',
  },
  fennec: {
    label: 'Fennec Fox',
    subtitle: 'Desert Beat Ace',
    defaultName: 'Finn',
    voiceName: 'Fenrir',
  },
};

export const DEFAULT_PRESETS: Record<SpeciesId, FaceConfig> = {
  fox: {
    species: 'fox',
    name: 'Rusty',
    primaryFur: '#c85a24',
    secondaryFur: '#efe5d6',
    innerEarColor: '#d9b5a0',
    noseColor: '#1a1514',
    eyeColorLeft: '#2f6f44',
    eyeColorRight: '#2f6f44',
    eyeStyle: 'slick',
    eyeScale: 1.0,
    eyeSpacing: 1.0,
    pupilSize: 0.4,
    snoutLength: 1.12,
    cheekPlumpness: 1.04,
    earLength: 1.02,
    earDroop: 0.0,
    browThickness: 1.05,
    whiskerDensity: 1.0,
    coatPattern: 'tuxedo',
    furSheen: 0.78,
    accessory: 'floral_tie',
  },
  rabbit: {
    species: 'rabbit',
    name: 'Clover',
    primaryFur: '#8a8d96',
    secondaryFur: '#f2eee9',
    innerEarColor: '#d99aa3',
    noseColor: '#d47c8a',
    eyeColorLeft: '#6a4194',
    eyeColorRight: '#6a4194',
    eyeStyle: 'alert',
    eyeScale: 1.12,
    eyeSpacing: 0.98,
    pupilSize: 0.46,
    snoutLength: 0.86,
    cheekPlumpness: 1.1,
    earLength: 1.18,
    earDroop: -0.05,
    browThickness: 0.9,
    whiskerDensity: 1.0,
    coatPattern: 'freckled',
    furSheen: 0.85,
    accessory: 'police_vest',
  },
  red_panda: {
    species: 'red_panda',
    name: 'Mochi',
    primaryFur: '#9e3e22',
    secondaryFur: '#f4ebe1',
    innerEarColor: '#e8d7c5',
    noseColor: '#1d1918',
    eyeColorLeft: '#5c3c24',
    eyeColorRight: '#5c3c24',
    eyeStyle: 'wide',
    eyeScale: 1.08,
    eyeSpacing: 1.04,
    pupilSize: 0.5,
    snoutLength: 0.88,
    cheekPlumpness: 1.2,
    earLength: 0.88,
    earDroop: 0.05,
    browThickness: 1.15,
    whiskerDensity: 0.5,
    coatPattern: 'tuxedo',
    furSheen: 0.88,
    accessory: 'knit_scarf',
  },
  fennec: {
    species: 'fennec',
    name: 'Finn',
    primaryFur: '#d8b482',
    secondaryFur: '#f7efe3',
    innerEarColor: '#dca99c',
    noseColor: '#29201d',
    eyeColorLeft: '#b8762c',
    eyeColorRight: '#b8762c',
    eyeStyle: 'sharp',
    eyeScale: 1.1,
    eyeSpacing: 1.02,
    pupilSize: 0.44,
    snoutLength: 0.95,
    cheekPlumpness: 0.94,
    earLength: 1.32,
    earDroop: 0.04,
    browThickness: 0.95,
    whiskerDensity: 1.0,
    coatPattern: 'solid',
    furSheen: 0.72,
    accessory: 'aviators',
  },
};

export const REALISTIC_FUR_SWATCHES: Array<{ label: string; primary: string; secondary: string }> = [
  { label: 'Russet Amber', primary: '#c85a24', secondary: '#efe5d6' },
  { label: 'Silver Slate', primary: '#8a8d96', secondary: '#f2eee9' },
  { label: 'Chestnut', primary: '#7a452b', secondary: '#eadbc8' },
  { label: 'Arctic Cream', primary: '#d8d5cf', secondary: '#faf8f5' },
  { label: 'Charcoal Smoke', primary: '#3d4149', secondary: '#cfd3da' },
  { label: 'Desert Sand', primary: '#d8b482', secondary: '#f7efe3' },
  { label: 'Cinnamon', primary: '#b55635', secondary: '#f3e3d3' },
  { label: 'Cocoa Velvet', primary: '#56382c', secondary: '#dec9b6' },
];

export const REALISTIC_EYE_SWATCHES: Array<{ label: string; hex: string }> = [
  { label: 'Emerald', hex: '#2f6f44' },
  { label: 'Violet', hex: '#6a4194' },
  { label: 'Sapphire', hex: '#2c5f9e' },
  { label: 'Amber Gold', hex: '#c27b22' },
  { label: 'Hazel', hex: '#7c5d32' },
  { label: 'Warm Espresso', hex: '#422a1b' },
  { label: 'Ice Blue', hex: '#679ec2' },
];

export function createInitialCompanionState(): CompanionState {
  return {
    mood: 'happy',
    patience: 92,
    affinity: 68,
    energy: 86,
    recentQuestions: [],
    consecutiveRepeats: 0,
    lastQuestionNormalized: '',
    totalInteractions: 0,
  };
}

export function clamp(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, val));
}

export function clampFaceConfig(config: FaceConfig): FaceConfig {
  return {
    ...config,
    eyeScale: clamp(config.eyeScale, 0.78, 1.25),
    eyeSpacing: clamp(config.eyeSpacing, 0.85, 1.2),
    pupilSize: clamp(config.pupilSize, 0.25, 0.62),
    snoutLength: clamp(config.snoutLength, 0.75, 1.3),
    cheekPlumpness: clamp(config.cheekPlumpness, 0.8, 1.28),
    earLength: clamp(config.earLength, 0.75, 1.35),
    earDroop: clamp(config.earDroop, -0.25, 0.55),
    browThickness: clamp(config.browThickness, 0.6, 1.4),
    whiskerDensity: clamp(config.whiskerDensity, 0, 1),
    furSheen: clamp(config.furSheen, 0.2, 1.0),
  };
}

export function randomizeFaceConfig(
  species?: SpeciesId,
  rng: () => number = Math.random
): FaceConfig {
  const speciesList: SpeciesId[] = ['fox', 'rabbit', 'red_panda', 'fennec'];
  const chosenSpecies =
    species ?? speciesList[Math.floor(rng() * speciesList.length)];
  const base = DEFAULT_PRESETS[chosenSpecies];

  const fur =
    REALISTIC_FUR_SWATCHES[
      Math.floor(rng() * REALISTIC_FUR_SWATCHES.length)
    ];
  const eyeL =
    REALISTIC_EYE_SWATCHES[
      Math.floor(rng() * REALISTIC_EYE_SWATCHES.length)
    ];
  // 22% chance of cute heterochromia!
  const eyeR =
    rng() < 0.22
      ? REALISTIC_EYE_SWATCHES[
          Math.floor(rng() * REALISTIC_EYE_SWATCHES.length)
        ]
      : eyeL;

  const eyeStyles: EyeShapeStyle[] = ['alert', 'slick', 'wide', 'sharp'];
  const patterns: CoatPattern[] = ['solid', 'freckled', 'tabby', 'tuxedo'];
  const accessories: AccessoryId[] = [
    'none',
    'aviators',
    'police_vest',
    'floral_tie',
    'knit_scarf',
  ];

  const namesBySpecies: Record<SpeciesId, string[]> = {
    fox: ['Rusty', 'Sly', 'Vesper', 'Fletcher'],
    rabbit: ['Clover', 'Pip', 'Bramble', 'Hazel'],
    red_panda: ['Mochi', 'Maple', 'Kibo', 'Biscuit'],
    fennec: ['Finn', 'Zuri', 'Saffron', 'Dune'],
  };
  const namePool = namesBySpecies[chosenSpecies];

  return clampFaceConfig({
    ...base,
    species: chosenSpecies,
    name: namePool[Math.floor(rng() * namePool.length)],
    primaryFur: rng() < 0.35 ? base.primaryFur : fur.primary,
    secondaryFur: rng() < 0.35 ? base.secondaryFur : fur.secondary,
    eyeColorLeft: eyeL.hex,
    eyeColorRight: eyeR.hex,
    eyeStyle: eyeStyles[Math.floor(rng() * eyeStyles.length)],
    eyeScale: 0.92 + rng() * 0.26,
    eyeSpacing: 0.92 + rng() * 0.16,
    pupilSize: 0.34 + rng() * 0.2,
    snoutLength: 0.82 + rng() * 0.36,
    cheekPlumpness: 0.9 + rng() * 0.28,
    earLength:
      chosenSpecies === 'rabbit' || chosenSpecies === 'fennec'
        ? 1.05 + rng() * 0.25
        : 0.82 + rng() * 0.24,
    earDroop: chosenSpecies === 'rabbit' ? -0.1 + rng() * 0.45 : -0.05 + rng() * 0.2,
    browThickness: 0.78 + rng() * 0.45,
    whiskerDensity: rng() < 0.2 ? 0.5 : 1.0,
    coatPattern: patterns[Math.floor(rng() * patterns.length)],
    furSheen: 0.55 + rng() * 0.4,
    accessory: accessories[Math.floor(rng() * accessories.length)],
  });
}

const STOP_WORDS = new Set([
  'the',
  'is',
  'are',
  'am',
  'a',
  'an',
  'to',
  'of',
  'in',
  'on',
  'at',
  'for',
  'me',
  'my',
  'you',
  'your',
  'please',
  'tell',
  'batao',
  'bata',
  'yar',
  'yaar',
  'bro',
  'hey',
  'hi',
  'hai',
  'ho',
  'kya',
  'tum',
  'aap',
]);

export function normalizeQuestion(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function extractContentTokens(text: string): string[] {
  const norm = normalizeQuestion(text);
  if (!norm) return [];
  const words = norm.split(' ');
  const filtered = words.filter((w) => w.length > 1 && !STOP_WORDS.has(w));
  return filtered.length > 0 ? filtered : words;
}

export function computeQuestionSimilarity(a: string, b: string): number {
  const normA = normalizeQuestion(a);
  const normB = normalizeQuestion(b);
  if (!normA || !normB) return 0;
  if (normA === normB) return 1;

  const tokensA = new Set(extractContentTokens(normA));
  const tokensB = new Set(extractContentTokens(normB));
  if (tokensA.size === 0 || tokensB.size === 0) return 0;

  let intersection = 0;
  for (const t of tokensA) {
    if (tokensB.has(t)) intersection++;
  }
  const union = new Set([...tokensA, ...tokensB]).size;
  const jaccard = intersection / union;

  // Also check containment for short queries like "your name" vs "what is your name"
  const containment = intersection / Math.min(tokensA.size, tokensB.size);
  return Math.max(jaccard, containment * 0.85);
}

const APOLOGY_OR_KIND_RE =
  /\b(sorry|maaf|apologize|forgive|cute|adorable|love|sweet|good boy|good girl|best friend|accha|pyara|pyari|mast)\b/i;

export function deriveMoodFromPatience(
  patience: number,
  consecutiveRepeats: number,
  isKind: boolean
): MoodState {
  if (patience <= 25 || consecutiveRepeats >= 3) return 'angry';
  if (patience <= 48 || consecutiveRepeats === 2) return 'annoyed';
  if (consecutiveRepeats === 1 || patience <= 68) return 'teasing';
  if (isKind || patience >= 82) return 'happy';
  return 'curious';
}

export function evaluateInteractionTurn(
  prev: CompanionState,
  rawUserText: string
): {
  nextState: CompanionState;
  isRepeat: boolean;
  isKindOrApology: boolean;
} {
  const norm = normalizeQuestion(rawUserText);
  const isKindOrApology = APOLOGY_OR_KIND_RE.test(rawUserText);

  let highestSim = 0;
  for (const prevQ of prev.recentQuestions) {
    const sim = computeQuestionSimilarity(norm, prevQ);
    if (sim > highestSim) highestSim = sim;
  }

  const isRepeat = norm.length >= 2 && highestSim >= 0.68;

  let consecutiveRepeats = prev.consecutiveRepeats;
  let patience = prev.patience;
  let affinity = prev.affinity;

  if (isRepeat) {
    consecutiveRepeats += 1;
    // Escalating patience drain when user keeps nagging with the same question
    const penalty = consecutiveRepeats === 1 ? 18 : consecutiveRepeats === 2 ? 28 : 35;
    patience = clamp(patience - penalty, 0, 100);
    affinity = clamp(affinity - (consecutiveRepeats >= 2 ? 5 : 2), 0, 100);
  } else if (isKindOrApology) {
    consecutiveRepeats = 0;
    patience = clamp(patience + 24, 0, 100);
    affinity = clamp(affinity + 8, 0, 100);
  } else {
    consecutiveRepeats = 0;
    patience = clamp(patience + 8, 0, 100);
    affinity = clamp(affinity + 3, 0, 100);
  }

  const mood = deriveMoodFromPatience(patience, consecutiveRepeats, isKindOrApology);

  const recentQuestions = [
    norm,
    ...prev.recentQuestions.filter((q) => q !== norm),
  ].slice(0, 6);

  return {
    nextState: {
      mood,
      patience,
      affinity,
      energy: clamp(prev.energy - 1, 15, 100),
      recentQuestions,
      consecutiveRepeats,
      lastQuestionNormalized: norm,
      totalInteractions: prev.totalInteractions + 1,
    },
    isRepeat,
    isKindOrApology,
  };
}

export function applyCareAction(
  prev: CompanionState,
  action: CareAction
): CompanionState {
  let patience = prev.patience;
  let affinity = prev.affinity;
  let energy = prev.energy;
  let consecutiveRepeats = prev.consecutiveRepeats;

  switch (action) {
    case 'pet':
      patience = clamp(patience + 18, 0, 100);
      affinity = clamp(affinity + 7, 0, 100);
      consecutiveRepeats = Math.max(0, consecutiveRepeats - 1);
      break;
    case 'boop':
      // Booping is playful unless already very angry!
      if (prev.mood === 'angry') {
        patience = clamp(patience - 6, 0, 100);
      } else {
        affinity = clamp(affinity + 4, 0, 100);
      }
      break;
    case 'tickle':
      patience = clamp(patience + 8, 0, 100);
      affinity = clamp(affinity + 6, 0, 100);
      energy = clamp(energy - 3, 15, 100);
      break;
    case 'carrot':
    case 'pawpsicle':
    case 'berry':
      patience = clamp(patience + 30, 0, 100);
      affinity = clamp(affinity + 10, 0, 100);
      energy = clamp(energy + 18, 0, 100);
      consecutiveRepeats = 0;
      break;
    case 'apologize':
      patience = clamp(patience + 32, 0, 100);
      affinity = clamp(affinity + 6, 0, 100);
      consecutiveRepeats = 0;
      break;
  }

  const mood: MoodState =
    action === 'boop' && prev.mood === 'angry'
      ? 'angry'
      : deriveMoodFromPatience(patience, consecutiveRepeats, action !== 'boop');

  return {
    ...prev,
    mood,
    patience,
    affinity,
    energy,
    consecutiveRepeats,
    totalInteractions: prev.totalInteractions + 1,
  };
}
