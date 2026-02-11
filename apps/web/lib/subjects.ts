import type { SubjectConfig, WorksheetOptions } from "./types";

/**
 * Mapping of which options are applicable to each subject.
 * Options not listed for a subject will be hidden in the UI.
 */
export const SUBJECT_OPTIONS: Record<string, (keyof WorksheetOptions)[]> = {
  math: [
    "includeAnswerKey",
    "showHints",
    "showWorkedExamples",
    "numberProblems",
    "includeIntroPage",
  ],
  chemistry: [
    "includeAnswerKey",
    "showHints",
    "showWorkedExamples",
    "numberProblems",
    "includeIntroPage",
  ],
  biology: [
    "includeAnswerKey",
    "showHints",
    "showWorkedExamples",
    "numberProblems",
    "includeIntroPage",
  ],
  physics: [
    "includeAnswerKey",
    "showHints",
    "showWorkedExamples",
    "numberProblems",
    "includeIntroPage",
  ],
  "earth-science": [
    "includeAnswerKey",
    "showHints",
    "showWorkedExamples",
    "numberProblems",
    "includeIntroPage",
  ],
  reading: ["includeAnswerKey", "showHints", "includeIntroPage"],
};

/**
 * Topic-specific options that only appear for certain topics.
 * These are added on top of the subject options.
 */
export const TOPIC_OPTIONS: Record<string, (keyof WorksheetOptions)[]> = {
  // Fractions-specific options
  fractions: [
    "includeVisualModels",
    "showLcdGcfReference",
    "includeWordProblems",
    "wordProblemRatio",
    "wordProblemContext",
  ],
  // Arithmetic can have word problems too
  arithmetic: [
    "includeWordProblems",
    "wordProblemRatio",
    "wordProblemContext",
  ],
  // Decimals/percentages can have word problems
  decimals: [
    "includeWordProblems",
    "wordProblemRatio",
    "wordProblemContext",
  ],
};

/**
 * Get all applicable options for a subject + topic combination.
 */
export function getOptionsForSubjectAndTopic(
  subject: string,
  topicId: string
): (keyof WorksheetOptions)[] {
  const subjectOpts = SUBJECT_OPTIONS[subject] || [];
  const topicOpts = TOPIC_OPTIONS[topicId] || [];
  // Combine and deduplicate
  return [...new Set([...subjectOpts, ...topicOpts])];
}

/**
 * Options that only apply when specific subtopics are selected.
 * If an option is listed here, it will only appear when at least one
 * of the listed subtopics is currently selected.
 *
 * Options NOT listed here are always shown (if the subject/topic allows them).
 */
export const SUBTOPIC_OPTION_SUPPORT: Partial<Record<keyof WorksheetOptions, string[]>> = {
  // Visual fraction bar models only make sense for addition/subtraction and multiply-by-whole
  includeVisualModels: [
    "add-same-denom",
    "add-unlike-denom",
    "subtract-same-denom",
    "subtract-unlike-denom",
    "multiply-by-whole",
  ],
  // LCD/GCF reference only for subtopics that involve finding LCD or GCF
  showLcdGcfReference: [
    "add-unlike-denom",
    "subtract-unlike-denom",
    "simplify-to-lowest",
    "equivalent-fractions",
    "compare-fractions",
    "ordering-fractions",
    "mixed-number-operations",
  ],
  // Word problems only for operation-based subtopics (not conversions, ordering, etc.)
  includeWordProblems: [
    "add-same-denom",
    "add-unlike-denom",
    "subtract-same-denom",
    "subtract-unlike-denom",
    "multiply-fractions",
    "divide-fractions",
    "multiply-by-whole",
    "divide-by-whole",
  ],
  // These follow includeWordProblems
  wordProblemRatio: [
    "add-same-denom",
    "add-unlike-denom",
    "subtract-same-denom",
    "subtract-unlike-denom",
    "multiply-fractions",
    "divide-fractions",
    "multiply-by-whole",
    "divide-by-whole",
  ],
  wordProblemContext: [
    "add-same-denom",
    "add-unlike-denom",
    "subtract-same-denom",
    "subtract-unlike-denom",
    "multiply-fractions",
    "divide-fractions",
    "multiply-by-whole",
    "divide-by-whole",
  ],
};

/**
 * Get applicable options considering the currently selected subtopics.
 * Filters out options that don't apply to any of the selected subtopics.
 */
export function getOptionsForSelection(
  subject: string,
  topicId: string,
  selectedSubtopics: string[]
): (keyof WorksheetOptions)[] {
  const base = getOptionsForSubjectAndTopic(subject, topicId);

  // If no subtopics selected, show all base options (user hasn't picked yet)
  if (selectedSubtopics.length === 0) return base;

  return base.filter((opt) => {
    const supportedBy = SUBTOPIC_OPTION_SUPPORT[opt];
    // If this option has no subtopic restrictions, always show it
    if (!supportedBy) return true;
    // Show only if at least one selected subtopic supports this option
    return selectedSubtopics.some((st) => supportedBy.includes(st));
  });
}

export const FRACTION_SUBTOPICS = [
  { id: "add-same-denom", label: "Add (same denominator)", grade: "3-4" },
  { id: "add-unlike-denom", label: "Add (unlike denominators)", grade: "4-5" },
  {
    id: "subtract-same-denom",
    label: "Subtract (same denominator)",
    grade: "3-4",
  },
  {
    id: "subtract-unlike-denom",
    label: "Subtract (unlike denominators)",
    grade: "4-5",
  },
  {
    id: "equivalent-fractions",
    label: "Equivalent fractions",
    grade: "3-4",
  },
  {
    id: "simplify-to-lowest",
    label: "Simplify to lowest terms",
    grade: "4-5",
  },
  { id: "compare-fractions", label: "Compare fractions", grade: "3-4" },
  { id: "multiply-fractions", label: "Multiply fractions", grade: "5-6" },
  { id: "divide-fractions", label: "Divide fractions", grade: "5-6" },
  { id: "multiply-by-whole", label: "Multiply by whole number", grade: "4" },
  { id: "divide-by-whole", label: "Divide by whole number", grade: "5" },
  { id: "fraction-of-set", label: "Fraction of a set", grade: "3-4" },
  { id: "ordering-fractions", label: "Order fractions", grade: "3-4" },
  { id: "mixed-to-improper", label: "Mixed to improper", grade: "4-5" },
  { id: "improper-to-mixed", label: "Improper to mixed", grade: "4-5" },
  {
    id: "mixed-number-operations",
    label: "Mixed number add/subtract",
    grade: "5-6",
  },
  {
    id: "word-problems",
    label: "Word Problems",
    grade: "3-6",
  },
] as const;

export const CHEMISTRY_SUBTOPICS = [
  { id: "balance-synthesis", label: "Synthesis reactions", grade: "8-9" },
  { id: "balance-decomposition", label: "Decomposition reactions", grade: "8-9" },
  { id: "balance-combustion", label: "Combustion reactions", grade: "9-10" },
  { id: "balance-single-replacement", label: "Single replacement", grade: "9-10" },
  { id: "balance-double-replacement", label: "Double replacement", grade: "9-10" },
] as const;

export const BIOLOGY_SUBTOPICS = [
  { id: "monohybrid-cross", label: "Monohybrid cross", grade: "7-8" },
  { id: "dihybrid-cross", label: "Dihybrid cross", grade: "9-10" },
  { id: "test-cross", label: "Test cross", grade: "8-9" },
  { id: "incomplete-dominance", label: "Incomplete dominance", grade: "9-10" },
  { id: "pedigree-analysis", label: "Pedigree analysis", grade: "9-10" },
] as const;

export const ARITHMETIC_SUBTOPICS = [
  { id: "addition", label: "Addition", grade: "K-3" },
  { id: "subtraction", label: "Subtraction", grade: "K-3" },
  { id: "multiplication", label: "Multiplication", grade: "2-5" },
  { id: "division", label: "Division", grade: "3-6" },
  { id: "mixed", label: "Mixed Operations", grade: "2-6" },
] as const;

export const PHYSICS_SUBTOPICS = [
  { id: "force-and-motion", label: "Force & Motion", grade: "6-8" },
  { id: "speed-velocity", label: "Speed & Velocity", grade: "6-8" },
  { id: "newtons-laws", label: "Newton's Laws", grade: "7-9" },
  { id: "work-and-energy", label: "Work & Energy", grade: "8-10" },
  { id: "simple-circuits", label: "Simple Circuits", grade: "6-8" },
  { id: "ohms-law", label: "Ohm's Law", grade: "8-10" },
  { id: "waves-and-sound", label: "Waves & Sound", grade: "7-9" },
  { id: "light-and-optics", label: "Light & Optics", grade: "7-9" },
] as const;

export const EARTH_SCIENCE_SUBTOPICS = [
  { id: "rock-cycle", label: "Rock Cycle", grade: "5-7" },
  { id: "plate-tectonics", label: "Plate Tectonics", grade: "6-8" },
  { id: "weather-and-climate", label: "Weather & Climate", grade: "5-7" },
  { id: "water-cycle", label: "Water Cycle", grade: "4-6" },
  { id: "solar-system", label: "Solar System", grade: "4-6" },
  { id: "earth-layers", label: "Earth's Layers", grade: "5-7" },
  { id: "erosion-weathering", label: "Erosion & Weathering", grade: "5-7" },
  { id: "natural-resources", label: "Natural Resources", grade: "5-7" },
] as const;

export const DECIMALS_SUBTOPICS = [
  { id: "decimal-addition", label: "Decimal Addition", grade: "4-6" },
  { id: "decimal-subtraction", label: "Decimal Subtraction", grade: "4-6" },
  { id: "decimal-multiplication", label: "Decimal Multiplication", grade: "5-7" },
  { id: "decimal-division", label: "Decimal Division", grade: "5-7" },
  { id: "decimal-to-fraction", label: "Decimals to Fractions", grade: "4-5" },
  { id: "fraction-to-decimal", label: "Fractions to Decimals", grade: "4-5" },
  { id: "percent-of-number", label: "Percent of a Number", grade: "5-7" },
  { id: "number-to-percent", label: "Number to Percent", grade: "5-7" },
  { id: "percent-to-decimal", label: "Percent to Decimal", grade: "5-7" },
  { id: "decimal-to-percent", label: "Decimal to Percent", grade: "5-7" },
  { id: "percent-increase", label: "Percent Increase", grade: "6-8" },
  { id: "percent-decrease", label: "Percent Decrease", grade: "6-8" },
] as const;

export const SUBJECTS: Record<string, SubjectConfig> = {
  math: {
    id: "math",
    name: "Mathematics",
    icon: "Calculator",
    color: "subject-math",
    enabled: true,
    topics: {
      fractions: {
        id: "fractions",
        name: "Fractions",
        grades: ["3", "4", "5", "6", "7"],
        subtopics: [...FRACTION_SUBTOPICS],
      },
      arithmetic: {
        id: "arithmetic",
        name: "Arithmetic",
        grades: ["K", "1", "2", "3", "4", "5", "6"],
        subtopics: [...ARITHMETIC_SUBTOPICS],
      },
      decimals: {
        id: "decimals",
        name: "Decimals & Percentages",
        grades: ["4", "5", "6", "7", "8"],
        subtopics: [...DECIMALS_SUBTOPICS],
      },
    },
  },
  chemistry: {
    id: "chemistry",
    name: "Chemistry",
    icon: "FlaskConical",
    color: "subject-chemistry",
    enabled: true,
    topics: {
      "balancing-equations": {
        id: "balancing-equations",
        name: "Balancing Equations",
        grades: ["8", "9", "10"],
        subtopics: [...CHEMISTRY_SUBTOPICS],
      },
    },
  },
  biology: {
    id: "biology",
    name: "Biology",
    icon: "Dna",
    color: "subject-biology",
    enabled: true,
    topics: {
      "mendelian-genetics": {
        id: "mendelian-genetics",
        name: "Mendelian Genetics",
        grades: ["7", "8", "9", "10"],
        subtopics: [...BIOLOGY_SUBTOPICS],
      },
    },
  },
  physics: {
    id: "physics",
    name: "Physics",
    icon: "Zap",
    color: "subject-physics",
    enabled: true,
    topics: {
      mechanics: {
        id: "mechanics",
        name: "Forces & Motion",
        grades: ["6", "7", "8", "9", "10"],
        subtopics: [
          ...PHYSICS_SUBTOPICS.filter((s) =>
            ["force-and-motion", "speed-velocity", "newtons-laws", "work-and-energy"].includes(s.id)
          ),
        ],
      },
      electricity: {
        id: "electricity",
        name: "Electricity & Circuits",
        grades: ["6", "7", "8", "9", "10"],
        subtopics: [
          ...PHYSICS_SUBTOPICS.filter((s) =>
            ["simple-circuits", "ohms-law"].includes(s.id)
          ),
        ],
      },
      waves: {
        id: "waves",
        name: "Waves, Sound & Light",
        grades: ["7", "8", "9"],
        subtopics: [
          ...PHYSICS_SUBTOPICS.filter((s) =>
            ["waves-and-sound", "light-and-optics"].includes(s.id)
          ),
        ],
      },
    },
  },
  "earth-science": {
    id: "earth-science",
    name: "Earth Science",
    icon: "Globe",
    color: "subject-earth",
    enabled: true,
    topics: {
      geology: {
        id: "geology",
        name: "Geology",
        grades: ["5", "6", "7", "8"],
        subtopics: [
          ...EARTH_SCIENCE_SUBTOPICS.filter((s) =>
            ["rock-cycle", "plate-tectonics", "earth-layers", "erosion-weathering"].includes(s.id)
          ),
        ],
      },
      atmosphere: {
        id: "atmosphere",
        name: "Weather & Water",
        grades: ["4", "5", "6", "7"],
        subtopics: [
          ...EARTH_SCIENCE_SUBTOPICS.filter((s) =>
            ["weather-and-climate", "water-cycle"].includes(s.id)
          ),
        ],
      },
      space: {
        id: "space",
        name: "Space & Solar System",
        grades: ["4", "5", "6"],
        subtopics: [
          ...EARTH_SCIENCE_SUBTOPICS.filter((s) =>
            ["solar-system"].includes(s.id)
          ),
        ],
      },
      resources: {
        id: "resources",
        name: "Natural Resources",
        grades: ["5", "6", "7"],
        subtopics: [
          ...EARTH_SCIENCE_SUBTOPICS.filter((s) =>
            ["natural-resources"].includes(s.id)
          ),
        ],
      },
    },
  },
  reading: {
    id: "reading",
    name: "Reading",
    icon: "BookOpen",
    color: "subject-reading",
    enabled: false,
    topics: {},
  },
};

export const GRADE_LEVELS = [
  { value: "K", label: "Kindergarten" },
  { value: "1", label: "1st Grade" },
  { value: "2", label: "2nd Grade" },
  { value: "3", label: "3rd Grade" },
  { value: "4", label: "4th Grade" },
  { value: "5", label: "5th Grade" },
  { value: "6", label: "6th Grade" },
  { value: "7", label: "7th Grade" },
  { value: "8", label: "8th Grade" },
  { value: "9", label: "9th Grade" },
  { value: "10", label: "10th Grade" },
] as const;

export const DIFFICULTY_LEVELS = [
  {
    value: "easy",
    label: "Easy",
    description: "Simpler problems",
  },
  {
    value: "medium",
    label: "Medium",
    description: "Moderate challenge",
  },
  {
    value: "hard",
    label: "Hard",
    description: "Advanced problems",
  },
  {
    value: "mixed",
    label: "Mixed",
    description: "Variety of difficulty",
  },
] as const;
