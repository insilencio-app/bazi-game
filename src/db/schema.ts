export type QuestionType = 'mcq' | 'truefalse' | 'match';

export type QuestionStatus = 'active' | 'draft' | 'retired';

export type DifficultyLevel = 1 | 2 | 3 | 4 | 5;

export type LessonRow = {
  id: number;
  titleCn: string;
};

export type QuestionRow = {
  id: string;
  lessonId: number;
  type: QuestionType;
  prompt: string;
  explanation: string;
  hint: string | null;
  difficulty: DifficultyLevel;
  status: QuestionStatus;
};

export type QuestionOptionRow = {
  questionId: string;
  optionIndex: number;
  text: string;
  isCorrect: boolean;
};

export type QuestionTrueFalseRow = {
  questionId: string;
  correct: boolean;
};

export type QuestionMatchPairRow = {
  questionId: string;
  pairIndex: number;
  leftText: string;
  rightText: string;
};

export type QuestionTagRow = {
  questionId: string;
  tag: string;
};

export type NormalizedQuizDataset = {
  lessons: LessonRow[];
  questions: QuestionRow[];
  options: QuestionOptionRow[];
  trueFalseAnswers: QuestionTrueFalseRow[];
  matchPairs: QuestionMatchPairRow[];
  tags: QuestionTagRow[];
};

export type QuestionExposureRow = {
  questionId: string;
  seenCount: number;
  lastSeenCursor: number;
};
