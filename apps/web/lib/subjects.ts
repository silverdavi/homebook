import type { SubjectConfig } from "./types";

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
  reading: {
    id: "reading",
    name: "Reading",
    icon: "BookOpen",
    color: "subject-reading",
    enabled: false,
    topics: {},
  },
  science: {
    id: "science",
    name: "Science",
    icon: "Flask",
    color: "subject-science",
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
