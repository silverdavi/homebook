import { create } from "zustand";
import type {
  Subject,
  GradeLevel,
  Difficulty,
  WorksheetOptions,
  PersonalizationConfig,
  WorksheetConfig,
} from "./types";
import { SUBJECTS } from "./subjects";

interface GeneratorState {
  subject: Subject;
  grade: GradeLevel;
  topicId: string;
  subtopicIds: string[];
  problemCount: number;
  difficulty: Difficulty;
  options: WorksheetOptions;
  personalization: PersonalizationConfig;
  previewHtml: string;
  isGenerating: boolean;
  isPreviewLoading: boolean;

  setSubject: (subject: Subject) => void;
  setGrade: (grade: GradeLevel) => void;
  setTopicId: (topicId: string) => void;
  toggleSubtopic: (subtopicId: string) => void;
  setSubtopicIds: (ids: string[]) => void;
  setProblemCount: (count: number) => void;
  setDifficulty: (difficulty: Difficulty) => void;
  setOption: (key: keyof WorksheetOptions, value: boolean) => void;
  setPersonalization: (
    key: keyof PersonalizationConfig,
    value: string
  ) => void;
  setPreviewHtml: (html: string) => void;
  setIsGenerating: (generating: boolean) => void;
  setIsPreviewLoading: (loading: boolean) => void;
  getConfig: () => WorksheetConfig;
}

const today = new Date().toLocaleDateString("en-US", {
  year: "numeric",
  month: "long",
  day: "numeric",
});

export const useGeneratorStore = create<GeneratorState>((set, get) => ({
  subject: "math",
  grade: "5",
  topicId: "fractions",
  subtopicIds: ["add-same-denom"],
  problemCount: 15,
  difficulty: "medium",
  options: {
    includeAnswerKey: true,
    showHints: false,
    includeVisualModels: false,
    showWorkedExamples: false,
    numberProblems: true,
    showLcdGcfReference: false,
    includeIntroPage: false,
  },
  personalization: {
    studentName: "",
    worksheetTitle: "",
    teacherName: "",
    date: today,
  },
  previewHtml: "",
  isGenerating: false,
  isPreviewLoading: false,

  setSubject: (subject) => {
    const subjectConfig = SUBJECTS[subject];
    const topics = Object.keys(subjectConfig?.topics || {});
    const firstTopic = topics[0] || "";
    set({ subject, topicId: firstTopic, subtopicIds: [] });
  },
  setGrade: (grade) => set({ grade }),
  setTopicId: (topicId) => set({ topicId, subtopicIds: [] }),
  toggleSubtopic: (subtopicId) =>
    set((state) => ({
      subtopicIds: state.subtopicIds.includes(subtopicId)
        ? state.subtopicIds.filter((id) => id !== subtopicId)
        : [...state.subtopicIds, subtopicId],
    })),
  setSubtopicIds: (ids) => set({ subtopicIds: ids }),
  setProblemCount: (count) => set({ problemCount: count }),
  setDifficulty: (difficulty) => set({ difficulty }),
  setOption: (key, value) =>
    set((state) => ({
      options: { ...state.options, [key]: value },
    })),
  setPersonalization: (key, value) =>
    set((state) => ({
      personalization: { ...state.personalization, [key]: value },
    })),
  setPreviewHtml: (html) => set({ previewHtml: html }),
  setIsGenerating: (generating) => set({ isGenerating: generating }),
  setIsPreviewLoading: (loading) => set({ isPreviewLoading: loading }),
  getConfig: () => {
    const state = get();
    return {
      subject: state.subject,
      grade: state.grade,
      topicId: state.topicId,
      subtopicIds: state.subtopicIds,
      problemCount: state.problemCount,
      difficulty: state.difficulty,
      options: state.options,
      personalization: state.personalization,
    };
  },
}));
