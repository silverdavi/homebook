/**
 * Daily Challenge system — deterministic daily challenges based on date seed.
 * Rotates across subjects: Math, Fractions, Elements, Vocabulary, Timeline.
 * Tracks streaks and completion in localStorage.
 */

// ── Types ──

export type ChallengeType = "math" | "fraction" | "element" | "vocabulary" | "timeline";

export interface MathChallenge {
  type: "math";
  problems: Array<{ question: string; answer: number; choices: number[] }>;
}

export interface FractionChallenge {
  type: "fraction";
  pairs: Array<{ left: string; right: string; answer: "left" | "right" | "equal" }>;
}

export interface ElementChallenge {
  type: "element";
  questions: Array<{ symbol: string; correctName: string; choices: string[] }>;
}

export interface VocabularyChallenge {
  type: "vocabulary";
  words: Array<{ scrambled: string; answer: string; hint: string }>;
}

export interface TimelineChallenge {
  type: "timeline";
  events: Array<{ name: string; year: number }>;
  correctOrder: number[]; // indices in sorted order
}

export type DailyChallenge =
  | MathChallenge
  | FractionChallenge
  | ElementChallenge
  | VocabularyChallenge
  | TimelineChallenge;

export interface DailyChallengeConfig {
  date: string; // YYYY-MM-DD
  challenge: DailyChallenge;
  seed: number;
}

// ── Seeded RNG ──

function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    return (s >>> 0) / 0xffffffff;
  };
}

function dateToSeed(date: Date): number {
  const y = date.getFullYear();
  const m = date.getMonth() + 1;
  const d = date.getDate();
  return y * 10000 + m * 100 + d;
}

function formatDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

// ── Shuffle ──

function shuffle<T>(arr: T[], rand: () => number): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ── Challenge Data Banks ──

const ELEMENTS = [
  { symbol: "H", name: "Hydrogen" },
  { symbol: "He", name: "Helium" },
  { symbol: "Li", name: "Lithium" },
  { symbol: "C", name: "Carbon" },
  { symbol: "N", name: "Nitrogen" },
  { symbol: "O", name: "Oxygen" },
  { symbol: "F", name: "Fluorine" },
  { symbol: "Ne", name: "Neon" },
  { symbol: "Na", name: "Sodium" },
  { symbol: "Mg", name: "Magnesium" },
  { symbol: "Al", name: "Aluminum" },
  { symbol: "Si", name: "Silicon" },
  { symbol: "P", name: "Phosphorus" },
  { symbol: "S", name: "Sulfur" },
  { symbol: "Cl", name: "Chlorine" },
  { symbol: "Ar", name: "Argon" },
  { symbol: "K", name: "Potassium" },
  { symbol: "Ca", name: "Calcium" },
  { symbol: "Fe", name: "Iron" },
  { symbol: "Cu", name: "Copper" },
  { symbol: "Zn", name: "Zinc" },
  { symbol: "Ag", name: "Silver" },
  { symbol: "Au", name: "Gold" },
  { symbol: "Pb", name: "Lead" },
];

const VOCABULARY_BANK = [
  { word: "GRAVITY", hint: "Force that pulls objects down" },
  { word: "PHOTON", hint: "A particle of light" },
  { word: "PLANET", hint: "A body orbiting a star" },
  { word: "MITOSIS", hint: "Cell division process" },
  { word: "VOLCANO", hint: "Mountain that erupts" },
  { word: "ECLIPSE", hint: "When one body blocks another" },
  { word: "NUCLEUS", hint: "Center of an atom" },
  { word: "PROTON", hint: "Positive particle in an atom" },
  { word: "NEUTRON", hint: "Neutral particle in an atom" },
  { word: "OXYGEN", hint: "Gas we breathe" },
  { word: "FOSSIL", hint: "Preserved remains of ancient life" },
  { word: "TUNDRA", hint: "Cold treeless biome" },
  { word: "PRISM", hint: "Splits white light into colors" },
  { word: "MAGNET", hint: "Attracts iron objects" },
  { word: "GALAXY", hint: "Collection of billions of stars" },
  { word: "GENOME", hint: "Complete set of DNA" },
  { word: "QUARTZ", hint: "Common crystal mineral" },
  { word: "PLASMA", hint: "Fourth state of matter" },
];

const TIMELINE_EVENTS_BANK = [
  { name: "Great Wall of China begun", year: -700 },
  { name: "Roman Empire founded", year: -27 },
  { name: "Fall of Rome", year: 476 },
  { name: "Magna Carta signed", year: 1215 },
  { name: "Gutenberg printing press", year: 1440 },
  { name: "Columbus reaches Americas", year: 1492 },
  { name: "Shakespeare born", year: 1564 },
  { name: "American Revolution", year: 1776 },
  { name: "French Revolution", year: 1789 },
  { name: "First photograph taken", year: 1826 },
  { name: "Theory of Evolution published", year: 1859 },
  { name: "Telephone invented", year: 1876 },
  { name: "Wright Brothers first flight", year: 1903 },
  { name: "World War I begins", year: 1914 },
  { name: "World War II begins", year: 1939 },
  { name: "Moon landing", year: 1969 },
  { name: "World Wide Web invented", year: 1991 },
  { name: "Human Genome Project completed", year: 2003 },
];

// ── Challenge Generators ──

function generateMathChallenge(rand: () => number): MathChallenge {
  const problems: MathChallenge["problems"] = [];
  for (let i = 0; i < 5; i++) {
    const ops = ["+", "−", "×"] as const;
    const op = ops[Math.floor(rand() * ops.length)];
    let a: number, b: number, answer: number, question: string;

    switch (op) {
      case "+":
        a = Math.floor(rand() * 50) + 1;
        b = Math.floor(rand() * 50) + 1;
        answer = a + b;
        question = `${a} + ${b}`;
        break;
      case "−":
        a = Math.floor(rand() * 50) + 10;
        b = Math.floor(rand() * a) + 1;
        answer = a - b;
        question = `${a} − ${b}`;
        break;
      case "×":
        a = Math.floor(rand() * 12) + 2;
        b = Math.floor(rand() * 12) + 2;
        answer = a * b;
        question = `${a} × ${b}`;
        break;
    }

    const wrongSet = new Set<number>();
    while (wrongSet.size < 3) {
      const offset = Math.floor(rand() * 10) - 5;
      const wrong = answer + (offset === 0 ? 1 : offset);
      if (wrong !== answer && wrong >= 0) wrongSet.add(wrong);
    }
    const choices = shuffle([...wrongSet, answer], rand);
    problems.push({ question, answer, choices });
  }
  return { type: "math", problems };
}

function generateFractionChallenge(rand: () => number): FractionChallenge {
  const pairs: FractionChallenge["pairs"] = [];
  for (let i = 0; i < 5; i++) {
    const n1 = Math.floor(rand() * 9) + 1;
    const d1 = Math.floor(rand() * 9) + 2;
    const n2 = Math.floor(rand() * 9) + 1;
    const d2 = Math.floor(rand() * 9) + 2;
    const v1 = n1 / d1;
    const v2 = n2 / d2;
    const answer: "left" | "right" | "equal" =
      Math.abs(v1 - v2) < 0.001 ? "equal" : v1 > v2 ? "left" : "right";
    pairs.push({ left: `${n1}/${d1}`, right: `${n2}/${d2}`, answer });
  }
  return { type: "fraction", pairs };
}

function generateElementChallenge(rand: () => number): ElementChallenge {
  const selected = shuffle([...ELEMENTS], rand).slice(0, 5);
  const questions: ElementChallenge["questions"] = selected.map((el) => {
    const others = ELEMENTS.filter((e) => e.name !== el.name);
    const wrongNames = shuffle(others, rand)
      .slice(0, 3)
      .map((e) => e.name);
    const choices = shuffle([el.name, ...wrongNames], rand);
    return { symbol: el.symbol, correctName: el.name, choices };
  });
  return { type: "element", questions };
}

function scrambleWord(word: string, rand: () => number): string {
  const letters = word.split("");
  let scrambled: string;
  let attempts = 0;
  do {
    scrambled = shuffle(letters, rand).join("");
    attempts++;
  } while (scrambled === word && attempts < 10);
  return scrambled;
}

function generateVocabularyChallenge(rand: () => number): VocabularyChallenge {
  const selected = shuffle([...VOCABULARY_BANK], rand).slice(0, 3);
  const words: VocabularyChallenge["words"] = selected.map((v) => ({
    scrambled: scrambleWord(v.word, rand),
    answer: v.word,
    hint: v.hint,
  }));
  return { type: "vocabulary", words };
}

function generateTimelineChallenge(rand: () => number): TimelineChallenge {
  const selected = shuffle([...TIMELINE_EVENTS_BANK], rand).slice(0, 4);
  const sorted = [...selected].sort((a, b) => a.year - b.year);
  const correctOrder = sorted.map((ev) => selected.indexOf(ev));
  return {
    type: "timeline",
    events: selected.map((e) => ({ name: e.name, year: e.year })),
    correctOrder,
  };
}

// ── Main API ──

const CHALLENGE_TYPES: ChallengeType[] = ["math", "fraction", "element", "vocabulary", "timeline"];

export function getDailyChallenge(date: Date): DailyChallengeConfig {
  const seed = dateToSeed(date);
  const rand = seededRandom(seed);
  const typeIndex = seed % CHALLENGE_TYPES.length;
  const type = CHALLENGE_TYPES[typeIndex];

  let challenge: DailyChallenge;
  switch (type) {
    case "math":
      challenge = generateMathChallenge(rand);
      break;
    case "fraction":
      challenge = generateFractionChallenge(rand);
      break;
    case "element":
      challenge = generateElementChallenge(rand);
      break;
    case "vocabulary":
      challenge = generateVocabularyChallenge(rand);
      break;
    case "timeline":
      challenge = generateTimelineChallenge(rand);
      break;
  }

  return { date: formatDate(date), challenge, seed };
}

// ── Streak Tracking ──

const STORAGE_KEY_DAILY = "dailyChallengeData";

interface DailyChallengeStore {
  completedDates: string[]; // YYYY-MM-DD
  scores: Record<string, number>; // date -> score
}

function getStore(): DailyChallengeStore {
  try {
    const raw = typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEY_DAILY) : null;
    if (!raw) return { completedDates: [], scores: {} };
    const parsed = JSON.parse(raw);
    return {
      completedDates: Array.isArray(parsed.completedDates) ? parsed.completedDates : [],
      scores: parsed.scores && typeof parsed.scores === "object" ? parsed.scores : {},
    };
  } catch {
    return { completedDates: [], scores: {} };
  }
}

function saveStore(store: DailyChallengeStore): void {
  try {
    localStorage.setItem(STORAGE_KEY_DAILY, JSON.stringify(store));
  } catch {
    // ignore
  }
}

export function setDailyChallengeCompleted(date: Date, score: number): void {
  const dateStr = formatDate(date);
  const store = getStore();
  if (!store.completedDates.includes(dateStr)) {
    store.completedDates.push(dateStr);
  }
  store.scores[dateStr] = Math.max(store.scores[dateStr] ?? 0, score);
  saveStore(store);
}

export function isDailyChallengeCompleted(date: Date): boolean {
  const dateStr = formatDate(date);
  return getStore().completedDates.includes(dateStr);
}

export function getDailyChallengeScore(date: Date): number {
  return getStore().scores[formatDate(date)] ?? 0;
}

export function getDailyChallengeStreak(): number {
  const store = getStore();
  const completed = new Set(store.completedDates);
  let streak = 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Check if today is completed — if not, start from yesterday
  const todayStr = formatDate(today);
  let checkDate = new Date(today);
  if (!completed.has(todayStr)) {
    checkDate.setDate(checkDate.getDate() - 1);
  }

  while (completed.has(formatDate(checkDate))) {
    streak++;
    checkDate.setDate(checkDate.getDate() - 1);
  }
  return streak;
}

export function getLongestStreak(): number {
  const store = getStore();
  if (store.completedDates.length === 0) return 0;

  const sorted = [...store.completedDates].sort();
  let longest = 1;
  let current = 1;

  for (let i = 1; i < sorted.length; i++) {
    const prev = new Date(sorted[i - 1] + "T00:00:00");
    const curr = new Date(sorted[i] + "T00:00:00");
    const diff = (curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24);
    if (Math.abs(diff - 1) < 0.01) {
      current++;
      longest = Math.max(longest, current);
    } else {
      current = 1;
    }
  }
  return longest;
}

export function getCompletedDates(): string[] {
  return getStore().completedDates;
}

/** Get challenge type label for display */
export function getChallengeTypeLabel(type: ChallengeType): string {
  switch (type) {
    case "math": return "Math Sprint";
    case "fraction": return "Fraction Compare";
    case "element": return "Element Quiz";
    case "vocabulary": return "Word Unscramble";
    case "timeline": return "Timeline Order";
  }
}

/** Get challenge type emoji */
export function getChallengeTypeEmoji(type: ChallengeType): string {
  switch (type) {
    case "math": return "🔢";
    case "fraction": return "🥧";
    case "element": return "⚗️";
    case "vocabulary": return "📝";
    case "timeline": return "📅";
  }
}
