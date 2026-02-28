export type ElementItem = (typeof import('../data/mockData').mockElements)[number];

export type LessonQuestion = {
  id: number;
  question: string;
  options: string[];
  correct: number;
  explanation: string;
  hint?: string;
};

export type LessonTrueFalse = {
  id: number;
  question: string;
  correct: boolean;
  explanation: string;
  hint?: string;
};

export type LessonMatch = {
  id: number;
  prompt: string;
  pairs: { left: string; right: string }[];
};

export type LessonWithBanks = {
  id: number;
  title_cn?: string;
  questionBank?: LessonQuestion[];
  trueFalseBank?: LessonTrueFalse[];
  matchBank?: LessonMatch[];
};

export type LessonWithQuestionBank = {
  id: number;
  title_cn: string;
  questionBank?: LessonQuestion[];
};
