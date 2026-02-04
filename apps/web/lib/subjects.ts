import type { SubjectConfig, WorksheetOptions } from "./types";

/**
 * Mapping of which options are applicable to each subject.
 * Options not listed for a subject will be hidden in the UI.
 */
export const SUBJECT_OPTIONS: Record<string, (keyof WorksheetOptions)[]> = {
  math: [
    "includeAnswerKey",
    "showHints",
    "includeVisualModels",
    "showWorkedExamples",
    "numberProblems",
    "showLcdGcfReference",
    "includeIntroPage",
    "includeWordProblems",
    "wordProblemRatio",
    "wordProblemContext",
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
    description: "Denominators 2–6",
  },
  {
    value: "medium",
    label: "Medium",
    description: "Denominators 2–12",
  },
  {
    value: "hard",
    label: "Hard",
    description: "Denominators 2–20",
  },
  {
    value: "mixed",
    label: "Mixed",
    description: "Variety of difficulty",
  },
] as const;
