export type Subject = "math" | "chemistry" | "biology" | "reading" | "physics" | "earth-science";

export type Difficulty = "easy" | "medium" | "hard" | "mixed";

export type GradeLevel =
  | "K"
  | "1"
  | "2"
  | "3"
  | "4"
  | "5"
  | "6"
  | "7"
  | "8";

export interface Subtopic {
  id: string;
  label: string;
  grade: string;
}

export interface Topic {
  id: string;
  name: string;
  grades: string[];
  subtopics: Subtopic[];
}

export interface SubjectConfig {
  id: Subject;
  name: string;
  icon: string;
  color: string;
  enabled: boolean;
  topics: Record<string, Topic>;
}

export type WordProblemContext = 'cooking' | 'sports' | 'shopping' | 'school' | 'mixed';

export interface WorksheetOptions {
  includeAnswerKey: boolean;
  showHints: boolean;
  includeVisualModels: boolean;
  showWorkedExamples: boolean;
  numberProblems: boolean;
  showLcdGcfReference: boolean;
  includeIntroPage: boolean;
  includeWordProblems: boolean;
  wordProblemRatio: number;  // 0.0 to 1.0
  wordProblemContext: WordProblemContext;
}

export interface PersonalizationConfig {
  studentName: string;
  worksheetTitle: string;
  teacherName: string;
  date: string;
}

export interface WorksheetConfig {
  subject: Subject;
  grade: GradeLevel;
  topicId: string;
  subtopicIds: string[];
  problemCount: number;
  difficulty: Difficulty;
  options: WorksheetOptions;
  personalization: PersonalizationConfig;
}

export interface WorksheetResult {
  worksheetId: string;
  downloadUrl: string;
  filename: string;
}
