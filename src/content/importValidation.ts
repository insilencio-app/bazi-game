export type ImportQuestionType = 'mcq' | 'truefalse' | 'match';

export type ImportQuestion = {
  id?: string;
  lessonId: number;
  type: ImportQuestionType;
  prompt: string;
  explanation?: string;
  hint?: string;
  difficulty?: number;
  tags?: string[];
  mcq?: {
    options: string[];
    correctIndex: number;
  };
  truefalse?: {
    correct: boolean;
  };
  match?: {
    pairs: Array<{ left: string; right: string }>;
  };
};

export type ImportValidationIssue = {
  index: number;
  code: string;
  message: string;
  severity: 'error' | 'warning';
};

export type ImportValidationResult = {
  errors: ImportValidationIssue[];
  warnings: ImportValidationIssue[];
  normalizedQuestions: ImportQuestion[];
};

const normalizeText = (value: string) => value.trim().replace(/\s+/g, ' ').toLowerCase();

const isNonEmptyString = (value: unknown): value is string => typeof value === 'string' && value.trim().length > 0;

const pushError = (issues: ImportValidationIssue[], index: number, code: string, message: string) => {
  issues.push({ index, code, message, severity: 'error' });
};

const pushWarning = (issues: ImportValidationIssue[], index: number, code: string, message: string) => {
  issues.push({ index, code, message, severity: 'warning' });
};

const validateMcq = (question: ImportQuestion, index: number, issues: ImportValidationIssue[]) => {
  if (!question.mcq || !Array.isArray(question.mcq.options)) {
    pushError(issues, index, 'MCQ_PAYLOAD_MISSING', 'MCQ 題型需提供 mcq.options 與 mcq.correctIndex。');
    return;
  }

  const options = question.mcq.options.map((option) => option.trim()).filter((option) => option.length > 0);
  if (options.length < 2) {
    pushError(issues, index, 'MCQ_OPTIONS_TOO_FEW', 'MCQ 選項至少需要 2 個非空值。');
  }

  const optionSet = new Set(options.map((option) => normalizeText(option)));
  if (optionSet.size !== options.length) {
    pushWarning(issues, index, 'MCQ_OPTIONS_DUPLICATED', 'MCQ 選項有重複內容，建議修正。');
  }

  if (
    typeof question.mcq.correctIndex !== 'number' ||
    !Number.isInteger(question.mcq.correctIndex) ||
    question.mcq.correctIndex < 0 ||
    question.mcq.correctIndex >= question.mcq.options.length
  ) {
    pushError(issues, index, 'MCQ_CORRECT_INDEX_INVALID', 'MCQ 的 correctIndex 超出 options 範圍。');
  }
};

const validateTrueFalse = (question: ImportQuestion, index: number, issues: ImportValidationIssue[]) => {
  if (!question.truefalse || typeof question.truefalse.correct !== 'boolean') {
    pushError(issues, index, 'TF_PAYLOAD_MISSING', 'True/False 題型需提供 truefalse.correct(boolean)。');
  }
};

const validateMatch = (question: ImportQuestion, index: number, issues: ImportValidationIssue[]) => {
  if (!question.match || !Array.isArray(question.match.pairs)) {
    pushError(issues, index, 'MATCH_PAYLOAD_MISSING', 'Match 題型需提供 match.pairs。');
    return;
  }

  if (question.match.pairs.length < 2) {
    pushError(issues, index, 'MATCH_TOO_FEW_PAIRS', 'Match 題型至少需要 2 組配對。');
  }

  const leftKeySet = new Set<string>();

  question.match.pairs.forEach((pair, pairIndex) => {
    if (!isNonEmptyString(pair.left) || !isNonEmptyString(pair.right)) {
      pushError(issues, index, 'MATCH_EMPTY_PAIR', `第 ${pairIndex + 1} 組配對 left/right 不可為空。`);
      return;
    }

    const leftKey = normalizeText(pair.left);
    if (leftKeySet.has(leftKey)) {
      pushWarning(issues, index, 'MATCH_DUPLICATE_LEFT', `第 ${pairIndex + 1} 組配對 left 與其他項重複。`);
    }
    leftKeySet.add(leftKey);
  });
};

export const validateImportQuestions = (questions: unknown): ImportValidationResult => {
  const issues: ImportValidationIssue[] = [];

  if (!Array.isArray(questions)) {
    return {
      errors: [{ index: -1, code: 'ROOT_NOT_ARRAY', message: '匯入檔內容必須是陣列。', severity: 'error' }],
      warnings: [],
      normalizedQuestions: [],
    };
  }

  const normalizedQuestions: ImportQuestion[] = [];
  const idSet = new Set<string>();
  const promptSet = new Map<string, number>();

  questions.forEach((rawQuestion, index) => {
    if (!rawQuestion || typeof rawQuestion !== 'object') {
      pushError(issues, index, 'QUESTION_NOT_OBJECT', '每筆題目都必須是物件。');
      return;
    }

    const question = rawQuestion as ImportQuestion;

    if (!Number.isInteger(question.lessonId) || question.lessonId < 0) {
      pushError(issues, index, 'LESSON_ID_INVALID', 'lessonId 必須是 >= 0 的整數。');
    }

    if (!['mcq', 'truefalse', 'match'].includes(question.type)) {
      pushError(issues, index, 'QUESTION_TYPE_INVALID', 'type 必須是 mcq / truefalse / match。');
      return;
    }

    if (!isNonEmptyString(question.prompt)) {
      pushError(issues, index, 'PROMPT_EMPTY', 'prompt 不可為空。');
    }

    if (question.id) {
      const normalizedId = question.id.trim();
      if (idSet.has(normalizedId)) {
        pushError(issues, index, 'QUESTION_ID_DUPLICATE', `id 重複：${normalizedId}`);
      }
      idSet.add(normalizedId);
    }

    const normalizedPromptKey = `${question.lessonId}::${question.type}::${normalizeText(question.prompt ?? '')}`;
    const firstPromptIndex = promptSet.get(normalizedPromptKey);
    if (firstPromptIndex !== undefined) {
      pushWarning(issues, index, 'PROMPT_DUPLICATED', `與第 ${firstPromptIndex + 1} 筆題目內容重複（同 lesson/type）。`);
    } else {
      promptSet.set(normalizedPromptKey, index);
    }

    const difficulty = question.difficulty ?? 2;
    if (!Number.isInteger(difficulty) || difficulty < 1 || difficulty > 5) {
      pushError(issues, index, 'DIFFICULTY_INVALID', 'difficulty 必須是 1~5 的整數。');
    }

    if (question.type === 'mcq') validateMcq(question, index, issues);
    if (question.type === 'truefalse') validateTrueFalse(question, index, issues);
    if (question.type === 'match') validateMatch(question, index, issues);

    normalizedQuestions.push({
      ...question,
      prompt: (question.prompt ?? '').trim(),
      explanation: question.explanation?.trim(),
      hint: question.hint?.trim(),
      difficulty,
      tags: Array.isArray(question.tags)
        ? question.tags.map((tag) => tag.trim()).filter((tag) => tag.length > 0)
        : [],
    });
  });

  return {
    errors: issues.filter((issue) => issue.severity === 'error'),
    warnings: issues.filter((issue) => issue.severity === 'warning'),
    normalizedQuestions,
  };
};
