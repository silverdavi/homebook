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
        grades: ["3", "4", "5", "6"],
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
