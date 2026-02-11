/**
 * Central Learning Guide — Grade-Level Curriculum Map
 *
 * This file defines what each game teaches at each grade level,
 * providing a unified reference for adaptive difficulty across all games.
 *
 * Grade levels map to the adaptive engine's level range (1-50):
 *   Level 1-5   → Grade 1-2  (ages 6-7)
 *   Level 6-10  → Grade 3    (ages 8-9)
 *   Level 11-14 → Grade 4    (ages 9-10)
 *   Level 15-18 → Grade 5    (ages 10-11)
 *   Level 19-25 → Grade 6    (ages 11-12)
 *   Level 26-32 → Grade 7-8  (ages 12-14)
 *   Level 33-40 → Grade 9-10 (ages 14-16)
 *   Level 41-50 → Grade 11+  (ages 16+)
 */

// ── Grade mapping ──

export interface GradeInfo {
  label: string;
  ages: string;
  levelRange: [number, number];
}

export const GRADE_MAP: GradeInfo[] = [
  { label: "Grade 1-2", ages: "6-7",   levelRange: [1, 5] },
  { label: "Grade 3",   ages: "8-9",   levelRange: [6, 10] },
  { label: "Grade 4",   ages: "9-10",  levelRange: [11, 14] },
  { label: "Grade 5",   ages: "10-11", levelRange: [15, 18] },
  { label: "Grade 6",   ages: "11-12", levelRange: [19, 25] },
  { label: "Grade 7-8", ages: "12-14", levelRange: [26, 32] },
  { label: "Grade 9-10", ages: "14-16", levelRange: [33, 40] },
  { label: "Grade 11+", ages: "16+",   levelRange: [41, 50] },
];

/** Get grade info for a given adaptive level */
export function getGradeForLevel(level: number): GradeInfo {
  for (const g of GRADE_MAP) {
    if (level <= g.levelRange[1]) return g;
  }
  return GRADE_MAP[GRADE_MAP.length - 1];
}

// ── Per-game curriculum ──

export interface GameCurriculum {
  id: string;
  name: string;
  category: "math" | "science" | "language" | "logic" | "creative" | "social-studies";
  /** Whether this game uses adaptive difficulty */
  adaptive: boolean;
  /** Short description of what this game teaches */
  teaches: string;
  /** What skills/concepts are covered at each grade band */
  gradeContent: {
    "grade-1-2"?: string;
    "grade-3"?: string;
    "grade-4"?: string;
    "grade-5"?: string;
    "grade-6"?: string;
    "grade-7-8"?: string;
    "grade-9-10"?: string;
    "grade-11+"?: string;
  };
  /** Common Core or curriculum standards addressed */
  standards?: string[];
}

export const GAME_CURRICULUM: GameCurriculum[] = [
  // ── MATH ──
  {
    id: "math-blitz",
    name: "Math Blitz",
    category: "math",
    adaptive: true,
    teaches: "Arithmetic fluency: addition, subtraction, multiplication, division",
    gradeContent: {
      "grade-1-2": "Single-digit addition and subtraction (1-20)",
      "grade-3": "Two-digit add/sub, intro to multiplication (1-5 tables)",
      "grade-4": "Multi-digit add/sub, multiplication through 10, intro division",
      "grade-5": "All four operations with larger numbers (1-60)",
      "grade-6": "Mixed operations, order of operations awareness",
      "grade-7-8": "Complex multi-step arithmetic (1-100 range)",
      "grade-9-10": "Speed-based mastery, mental math strategies",
      "grade-11+": "Expert-level rapid computation",
    },
    standards: ["CCSS.MATH.CONTENT.2.OA", "CCSS.MATH.CONTENT.3.OA", "CCSS.MATH.CONTENT.4.NBT"],
  },
  {
    id: "times-table",
    name: "Times Table",
    category: "math",
    adaptive: true,
    teaches: "Multiplication fact fluency",
    gradeContent: {
      "grade-1-2": "Skip counting by 2s, 5s, 10s",
      "grade-3": "Tables 1-5, building automaticity",
      "grade-4": "Tables 1-7, mixed practice",
      "grade-5": "Tables 1-10, speed challenges",
      "grade-6": "Tables 1-12, instant recall",
      "grade-7-8": "All tables with time pressure, reverse problems",
      "grade-9-10": "Expert speed drills",
    },
    standards: ["CCSS.MATH.CONTENT.3.OA.C.7"],
  },
  {
    id: "fraction-lab",
    name: "Fraction Lab",
    category: "math",
    adaptive: true,
    teaches: "Complete fraction curriculum: identification, operations, equivalence, GCF/LCM",
    gradeContent: {
      "grade-1-2": "Identify fractions (halves, thirds, quarters), visual models",
      "grade-3": "Compare fractions, equivalent fractions, add/subtract same denominator",
      "grade-4": "Add/subtract different denominators, simplify, mixed numbers",
      "grade-5": "Multiply fractions, divide by whole numbers, fraction of a number",
      "grade-6": "Full fraction arithmetic, LCM/GCF, divide fractions",
      "grade-7-8": "Complex operations with large denominators, multi-step",
      "grade-9-10": "Advanced: primes, composites, algebraic fractions",
      "grade-11+": "Expert: very large denominators, rapid problem solving",
    },
    standards: ["CCSS.MATH.CONTENT.3.NF", "CCSS.MATH.CONTENT.4.NF", "CCSS.MATH.CONTENT.5.NF", "CCSS.MATH.CONTENT.6.NS"],
  },
  {
    id: "fraction-fighter",
    name: "Fraction Fighter",
    category: "math",
    adaptive: true,
    teaches: "Fraction comparison and number sense",
    gradeContent: {
      "grade-1-2": "Compare unit fractions (1/2 vs 1/3), visual support",
      "grade-3": "Compare fractions with same denominator",
      "grade-4": "Compare fractions with different denominators (small)",
      "grade-5": "Compare any fractions, identify equal fractions",
      "grade-6": "Speed comparison with large denominators",
      "grade-7-8": "Near-equal fractions, cross-multiplication",
    },
    standards: ["CCSS.MATH.CONTENT.3.NF.A.3", "CCSS.MATH.CONTENT.4.NF.A.2"],
  },
  {
    id: "decimal-dash",
    name: "Decimal Dash",
    category: "math",
    adaptive: true,
    teaches: "Decimal operations, place value, and conversions",
    gradeContent: {
      "grade-3": "Identify tenths, basic decimal notation",
      "grade-4": "Add/subtract decimals to tenths",
      "grade-5": "All operations with 1-2 decimal places, rounding",
      "grade-6": "Operations with 2-3 decimal places, percentage conversions",
      "grade-7-8": "Complex decimal arithmetic, fraction-decimal conversions",
    },
    standards: ["CCSS.MATH.CONTENT.4.NF.C.6", "CCSS.MATH.CONTENT.5.NBT.B.7"],
  },
  {
    id: "graph-plotter",
    name: "Graph Plotter",
    category: "math",
    adaptive: true,
    teaches: "Coordinate geometry, plotting points, slopes, linear equations",
    gradeContent: {
      "grade-4": "Plot points in first quadrant (positive coordinates)",
      "grade-5": "Plot points in all four quadrants",
      "grade-6": "Identify slope from two points, simple patterns",
      "grade-7-8": "Linear equations (y=mx+b), slope-intercept form",
      "grade-9-10": "Systems of equations, distance formula",
    },
    standards: ["CCSS.MATH.CONTENT.5.G.A.1", "CCSS.MATH.CONTENT.8.EE.B.5"],
  },
  {
    id: "unit-converter",
    name: "Unit Converter",
    category: "math",
    adaptive: true,
    teaches: "Measurement units, metric/imperial conversions",
    gradeContent: {
      "grade-3": "Basic length comparisons (cm, m)",
      "grade-4": "Convert within metric system (mm↔cm↔m)",
      "grade-5": "Convert within imperial (in↔ft↔yd), mass, volume",
      "grade-6": "Cross-system conversions (metric↔imperial)",
      "grade-7-8": "Multi-step conversions, unit rates",
      "grade-9-10": "Scientific units, dimensional analysis",
    },
    standards: ["CCSS.MATH.CONTENT.4.MD.A.1", "CCSS.MATH.CONTENT.5.MD.A.1"],
  },
  {
    id: "equation-balancer",
    name: "Equation Balancer",
    category: "math",
    adaptive: true,
    teaches: "Balancing chemical and mathematical equations",
    gradeContent: {
      "grade-5": "Simple number balance (__ + 3 = 7)",
      "grade-6": "Two-step equations, basic chemical equations",
      "grade-7-8": "Multi-element chemical equations",
      "grade-9-10": "Complex chemical equations, stoichiometry",
    },
    standards: ["CCSS.MATH.CONTENT.6.EE.B.7"],
  },
  {
    id: "number-puzzle",
    name: "Number Puzzle",
    category: "math",
    adaptive: true,
    teaches: "Logical reasoning with number constraints",
    gradeContent: {
      "grade-1-2": "Arrange numbers 1-4 in 2x2 grid (no repeats)",
      "grade-3": "3x3 number grids, row/column sums",
      "grade-4": "4x4 grids, math-mode with operations",
      "grade-5": "Larger grids, more complex constraints",
      "grade-6": "Speed challenges, advanced logic",
    },
  },
  {
    id: "maze-runner",
    name: "Maze Runner",
    category: "math",
    adaptive: true,
    teaches: "Problem solving through math-gated maze navigation",
    gradeContent: {
      "grade-1-2": "Small mazes (7x7) with simple addition gates",
      "grade-3": "Medium mazes with add/subtract gates",
      "grade-4": "Larger mazes with multiplication gates",
      "grade-5": "Large mazes (11x11) with all operations",
      "grade-6": "Complex mazes (13x13), science questions",
      "grade-7-8": "Expert mazes (15x15), mixed subjects",
    },
  },
  {
    id: "connect-dots",
    name: "Connect the Dots",
    category: "math",
    adaptive: true,
    teaches: "Number sequencing and counting skills",
    gradeContent: {
      "grade-1-2": "Count 1-20, connect sequential dots",
      "grade-3": "Count by 2s, 5s, 10s; skip counting dots",
      "grade-4": "Larger number sequences, math-answer dots",
      "grade-5": "Multi-step math to find next dot",
    },
  },
  {
    id: "scratch-reveal",
    name: "Scratch & Reveal",
    category: "math",
    adaptive: true,
    teaches: "Math fact practice with motivating scratch-card format",
    gradeContent: {
      "grade-1-2": "Basic addition facts",
      "grade-3": "Add/subtract, intro multiply",
      "grade-4": "All four operations",
      "grade-5": "Fractions and decimals on cards",
      "grade-6": "Mixed operations, larger numbers",
    },
  },

  // ── SCIENCE ──
  {
    id: "science-study",
    name: "Science Study",
    category: "science",
    adaptive: true,
    teaches: "Chemistry, Biology, Physics, Earth Science concepts",
    gradeContent: {
      "grade-3": "Basic states of matter, animal classification",
      "grade-4": "Ecosystems, simple machines, weather",
      "grade-5": "Periodic table basics, cells, forces",
      "grade-6": "Chemical reactions, organ systems, energy",
      "grade-7-8": "Atomic structure, genetics, waves, earth systems",
      "grade-9-10": "Advanced chemistry, molecular biology, mechanics",
      "grade-11+": "AP-level content, complex systems",
    },
    standards: ["NGSS"],
  },
  {
    id: "element-match",
    name: "Element Match",
    category: "science",
    adaptive: true,
    teaches: "Periodic table: element names, symbols, and properties",
    gradeContent: {
      "grade-4": "Common elements (H, O, C, N, Fe, Au, Ag, Cu)",
      "grade-5": "Expand to 20 elements, properties",
      "grade-6": "All common elements including tricky symbols (Na, K, W, Hg)",
      "grade-7-8": "Full periodic table, element groups",
    },
  },
  {
    id: "genetics-lab",
    name: "Genetics Lab",
    category: "science",
    adaptive: true,
    teaches: "Mendelian genetics, Punnett squares, probability",
    gradeContent: {
      "grade-5": "Simple dominant/recessive traits, fill Punnett squares",
      "grade-6": "Predict offspring ratios, monohybrid crosses",
      "grade-7-8": "Dihybrid crosses, incomplete dominance",
      "grade-9-10": "Codominance, sex-linked traits, genetic disorders",
    },
    standards: ["NGSS.MS-LS3"],
  },
  {
    id: "geography",
    name: "Geography Challenge",
    category: "social-studies",
    adaptive: true,
    teaches: "World geography: capitals, continents, landmarks, flags",
    gradeContent: {
      "grade-3": "Continents and oceans, own country",
      "grade-4": "Major world capitals, famous landmarks",
      "grade-5": "All continents' countries, flags of major nations",
      "grade-6": "Detailed geography, lesser-known capitals",
      "grade-7-8": "Expert geography, all flags, physical features",
    },
  },

  // ── LANGUAGE ──
  {
    id: "letter-rain",
    name: "Letter Rain",
    category: "language",
    adaptive: true,
    teaches: "Typing speed, reading fluency, sentence comprehension",
    gradeContent: {
      "grade-1-2": "Single letters and short words (3-4 chars)",
      "grade-3": "Short sentences (3-5 words), slow speed",
      "grade-4": "Medium sentences (5-7 words), moderate speed",
      "grade-5": "Longer sentences (7-10 words), faster",
      "grade-6": "Complex sentences (8-12 words), high speed",
      "grade-7-8": "Long sentences (10-14 words), very fast",
    },
  },
  {
    id: "word-builder",
    name: "Word Builder",
    category: "language",
    adaptive: true,
    teaches: "Science vocabulary, spelling, word recognition",
    gradeContent: {
      "grade-3": "Short science words (3-4 letters: ATOM, CELL)",
      "grade-4": "Medium words (4-5 letters: FORCE, PLANT)",
      "grade-5": "Longer words (5-6 letters: ENERGY, FOSSIL)",
      "grade-6": "Complex words (6-8 letters: CATALYST, MOLECULE)",
    },
  },
  {
    id: "word-search",
    name: "Word Search",
    category: "language",
    adaptive: true,
    teaches: "Vocabulary recognition, pattern finding",
    gradeContent: {
      "grade-1-2": "Small grid (8x8), common words",
      "grade-3": "Medium grid (10x10), science terms",
      "grade-4": "Larger grid (12x12), more words",
      "grade-5": "Large grid (14x14), themed vocabulary",
    },
  },
  {
    id: "crossword",
    name: "Crossword",
    category: "language",
    adaptive: true,
    teaches: "Vocabulary, definitions, spelling through crossword puzzles",
    gradeContent: {
      "grade-3": "Simple crosswords with picture clues",
      "grade-4": "Science-themed crosswords, definition clues",
      "grade-5": "Complex crosswords, multi-subject vocabulary",
      "grade-6": "Advanced vocabulary, longer words",
    },
  },
  {
    id: "trivia-quiz",
    name: "Trivia Quiz",
    category: "language",
    adaptive: true,
    teaches: "General knowledge across multiple subjects",
    gradeContent: {
      "grade-3": "Fun facts, basic science and history",
      "grade-4": "Broader general knowledge",
      "grade-5": "Multi-subject trivia, current events basics",
      "grade-6": "Advanced trivia, connections between subjects",
      "grade-7-8": "Expert-level general knowledge",
    },
  },
  {
    id: "timeline-dash",
    name: "Timeline Dash",
    category: "social-studies",
    adaptive: true,
    teaches: "Historical chronology, cause and effect, era awareness",
    gradeContent: {
      "grade-3": "Famous events with wide date spreads",
      "grade-4": "Major historical milestones",
      "grade-5": "Events within same century, narrower spreads",
      "grade-6": "Detailed history, obscure events",
      "grade-7-8": "Expert chronology, very close dates",
    },
  },

  // ── LOGIC & PUZZLE ──
  {
    id: "sudoku",
    name: "Sudoku",
    category: "logic",
    adaptive: true,
    teaches: "Logical deduction, constraint satisfaction, patience",
    gradeContent: {
      "grade-3": "4x4 Sudoku with many givens",
      "grade-4": "Easy 9x9 Sudoku (many givens)",
      "grade-5": "Medium 9x9 Sudoku",
      "grade-6": "Hard 9x9 Sudoku (fewer givens)",
      "grade-7-8": "Expert 9x9 Sudoku",
    },
  },
  {
    id: "nonogram",
    name: "Nonogram",
    category: "logic",
    adaptive: true,
    teaches: "Pattern logic, deductive reasoning, spatial thinking",
    gradeContent: {
      "grade-3": "5x5 grids, simple patterns",
      "grade-4": "7x7 grids, moderate complexity",
      "grade-5": "10x10 grids",
      "grade-6": "12x12+ grids, complex patterns",
    },
  },

  // ── CREATIVE ──
  {
    id: "color-lab",
    name: "Color Lab",
    category: "creative",
    adaptive: false,
    teaches: "Color theory: mixing, complementary colors, color wheel",
    gradeContent: {
      "grade-1-2": "Primary and secondary colors",
      "grade-3": "Color mixing, warm vs cool colors",
      "grade-4": "Complementary colors, color wheel",
    },
  },
  {
    id: "trace-learn",
    name: "Trace & Learn",
    category: "creative",
    adaptive: true,
    teaches: "Handwriting, letter formation, fine motor skills",
    gradeContent: {
      "grade-1-2": "Uppercase letters, numbers 0-9, loose tolerance",
      "grade-3": "Lowercase letters, words, moderate tolerance",
      "grade-4": "Cursive letters, strict tolerance",
    },
  },

  // ── CRITICAL THINKING ──
  {
    id: "fake-news-detective",
    name: "Fake News Detective",
    category: "social-studies",
    adaptive: true,
    teaches: "Media literacy, critical thinking, identifying misinformation",
    gradeContent: {
      "grade-3": "Obvious vs real: talking animals in news, impossible claims, silly headlines",
      "grade-4": "Clickbait detection: exaggerated headlines, 'you won't believe' patterns",
      "grade-5": "Source checking: who wrote it? Is the website real? Are there references?",
      "grade-6": "Emotional manipulation: fear-based language, outrage bait, bias detection",
      "grade-7-8": "Statistics misuse: cherry-picked data, misleading graphs, correlation vs causation",
      "grade-9-10": "Logical fallacies: ad hominem, straw man, false equivalence, appeal to authority",
      "grade-11+": "Sophisticated misinformation: deepfakes, astroturfing, propaganda techniques",
    },
    standards: ["CCSS.ELA-LITERACY.RI", "ISTE.3"],
  },
];

/** Get curriculum for a specific game */
export function getGameCurriculum(gameId: string): GameCurriculum | undefined {
  return GAME_CURRICULUM.find(g => g.id === gameId);
}

/** Get all games for a specific category */
export function getGamesByCategory(category: GameCurriculum["category"]): GameCurriculum[] {
  return GAME_CURRICULUM.filter(g => g.category === category);
}

/** Get what a specific game teaches at a given level */
export function getContentForLevel(gameId: string, level: number): string | undefined {
  const game = getGameCurriculum(gameId);
  if (!game) return undefined;
  const grade = getGradeForLevel(level);
  const key = grade.label.toLowerCase().replace(/\s+/g, "-") as keyof GameCurriculum["gradeContent"];
  return game.gradeContent[key];
}
