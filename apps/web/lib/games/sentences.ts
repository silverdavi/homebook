export interface SentenceData {
  text: string;
  category: string;
  difficulty: "easy" | "medium" | "hard";
}

export const CATEGORIES = [
  { id: "math", label: "Math Facts", color: "#6366f1" },
  { id: "science", label: "Science", color: "#10b981" },
  { id: "grammar", label: "Grammar", color: "#f59e0b" },
  { id: "history", label: "History", color: "#ef4444" },
  { id: "geography", label: "Geography", color: "#3b82f6" },
] as const;

export const SENTENCES: SentenceData[] = [
  // ── Math Facts ──────────────────────────────────
  // Easy
  { text: "Two plus two equals four", category: "math", difficulty: "easy" },
  { text: "A triangle has three sides", category: "math", difficulty: "easy" },
  { text: "Ten minus six is four", category: "math", difficulty: "easy" },
  { text: "Five times two is ten", category: "math", difficulty: "easy" },
  { text: "A square has four equal sides", category: "math", difficulty: "easy" },
  { text: "Zero is an even number", category: "math", difficulty: "easy" },
  // Medium
  { text: "The sum of angles in a triangle is one hundred eighty degrees", category: "math", difficulty: "medium" },
  { text: "A prime number has exactly two factors", category: "math", difficulty: "medium" },
  { text: "The area of a rectangle equals length times width", category: "math", difficulty: "medium" },
  { text: "Parallel lines never cross each other", category: "math", difficulty: "medium" },
  { text: "The sum of two even numbers is always even", category: "math", difficulty: "medium" },
  { text: "Pi is the ratio of circumference to diameter", category: "math", difficulty: "medium" },
  // Hard
  { text: "The Pythagorean theorem states that a squared plus b squared equals c squared", category: "math", difficulty: "hard" },
  { text: "A negative number multiplied by a negative number gives a positive result", category: "math", difficulty: "hard" },
  { text: "The greatest common factor of twelve and eighteen is six", category: "math", difficulty: "hard" },

  // ── Science ─────────────────────────────────────
  // Easy
  { text: "Water freezes at zero degrees", category: "science", difficulty: "easy" },
  { text: "The sun is a star", category: "science", difficulty: "easy" },
  { text: "Plants need sunlight to grow", category: "science", difficulty: "easy" },
  { text: "The moon orbits the earth", category: "science", difficulty: "easy" },
  { text: "Ice melts into water", category: "science", difficulty: "easy" },
  { text: "Sound travels in waves", category: "science", difficulty: "easy" },
  // Medium
  { text: "The earth revolves around the sun once every year", category: "science", difficulty: "medium" },
  { text: "Photosynthesis converts sunlight into chemical energy", category: "science", difficulty: "medium" },
  { text: "Gravity pulls all objects toward the center of the earth", category: "science", difficulty: "medium" },
  { text: "An atom is the smallest unit of a chemical element", category: "science", difficulty: "medium" },
  { text: "The water cycle includes evaporation and condensation", category: "science", difficulty: "medium" },
  { text: "Electricity flows through materials called conductors", category: "science", difficulty: "medium" },
  // Hard
  { text: "Deoxyribonucleic acid carries the genetic instructions for all living organisms", category: "science", difficulty: "hard" },
  { text: "Newtons third law states that every action has an equal and opposite reaction", category: "science", difficulty: "hard" },
  { text: "The mitochondria are known as the powerhouse of the cell", category: "science", difficulty: "hard" },

  // ── Grammar ─────────────────────────────────────
  // Easy
  { text: "A noun is a person place or thing", category: "grammar", difficulty: "easy" },
  { text: "A verb shows action", category: "grammar", difficulty: "easy" },
  { text: "Every sentence needs a subject", category: "grammar", difficulty: "easy" },
  { text: "A period ends a sentence", category: "grammar", difficulty: "easy" },
  { text: "Capital letters start a sentence", category: "grammar", difficulty: "easy" },
  // Medium
  { text: "An adjective describes or modifies a noun", category: "grammar", difficulty: "medium" },
  { text: "A comma separates items in a list", category: "grammar", difficulty: "medium" },
  { text: "Pronouns take the place of nouns in a sentence", category: "grammar", difficulty: "medium" },
  { text: "An adverb tells how when or where something happens", category: "grammar", difficulty: "medium" },
  { text: "A compound sentence joins two ideas with a conjunction", category: "grammar", difficulty: "medium" },
  // Hard
  { text: "The subject and verb of a sentence must always agree in number", category: "grammar", difficulty: "hard" },
  { text: "A semicolon connects two independent clauses that are closely related", category: "grammar", difficulty: "hard" },
  { text: "Parallel structure means using the same pattern of words for similar ideas", category: "grammar", difficulty: "hard" },

  // ── History ─────────────────────────────────────
  // Easy
  { text: "The pyramids are in Egypt", category: "history", difficulty: "easy" },
  { text: "Columbus sailed in fourteen ninety two", category: "history", difficulty: "easy" },
  { text: "The Romans built many roads", category: "history", difficulty: "easy" },
  { text: "Dinosaurs lived millions of years ago", category: "history", difficulty: "easy" },
  // Medium
  { text: "The Declaration of Independence was signed in seventeen seventy six", category: "history", difficulty: "medium" },
  { text: "Ancient Greece is known as the birthplace of democracy", category: "history", difficulty: "medium" },
  { text: "The Great Wall of China was built to protect against invaders", category: "history", difficulty: "medium" },
  { text: "The Industrial Revolution began in England in the eighteenth century", category: "history", difficulty: "medium" },
  // Hard
  { text: "The Renaissance was a period of cultural rebirth that began in Italy in the fourteenth century", category: "history", difficulty: "hard" },
  { text: "The invention of the printing press by Gutenberg transformed the spread of knowledge", category: "history", difficulty: "hard" },

  // ── Geography ───────────────────────────────────
  // Easy
  { text: "There are seven continents on earth", category: "science", difficulty: "easy" },
  { text: "The Sahara is the largest hot desert", category: "geography", difficulty: "easy" },
  { text: "Oceans cover most of the earth", category: "geography", difficulty: "easy" },
  { text: "Mount Everest is the tallest mountain", category: "geography", difficulty: "easy" },
  // Medium
  { text: "The Amazon is the largest river by water volume in the world", category: "geography", difficulty: "medium" },
  { text: "The equator divides the earth into northern and southern hemispheres", category: "geography", difficulty: "medium" },
  { text: "Australia is both a country and a continent", category: "geography", difficulty: "medium" },
  { text: "The Pacific Ocean is the largest and deepest ocean on earth", category: "geography", difficulty: "medium" },
  // Hard
  { text: "The Ring of Fire is a horseshoe shaped zone of earthquakes and volcanoes around the Pacific", category: "geography", difficulty: "hard" },
  { text: "Tectonic plates are large slabs of rock that make up the foundation of the earths crust", category: "geography", difficulty: "hard" },
];

/** Get sentences filtered by difficulty and optionally category */
export function getSentences(
  difficulty: "easy" | "medium" | "hard",
  category?: string
): SentenceData[] {
  return SENTENCES.filter(
    (s) => s.difficulty === difficulty && (!category || s.category === category)
  );
}

/** Pick a random sentence for the given difficulty, avoiding recent ones */
export function pickSentence(
  difficulty: "easy" | "medium" | "hard",
  usedIndices: Set<number>,
  category?: string
): { sentence: SentenceData; index: number } {
  const pool = SENTENCES.map((s, i) => ({ s, i })).filter(
    ({ s, i }) =>
      s.difficulty === difficulty &&
      (!category || s.category === category) &&
      !usedIndices.has(i)
  );

  // If all used, reset
  const available = pool.length > 0 ? pool : SENTENCES.map((s, i) => ({ s, i })).filter(
    ({ s }) => s.difficulty === difficulty && (!category || s.category === category)
  );

  const pick = available[Math.floor(Math.random() * available.length)];
  return { sentence: pick.s, index: pick.i };
}
