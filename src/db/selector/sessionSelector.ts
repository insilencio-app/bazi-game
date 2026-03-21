import type { QuestionExposureRow, QuestionType } from '../schema';

export type SelectorQuestion = {
  id: string;
  lessonId: number;
  type: QuestionType;
  difficulty: number;
  status: 'active' | 'draft' | 'retired';
};

export type SelectionPolicy = {
  totalCount: number;
  minGap: number;
  typeTargets?: Partial<Record<QuestionType, number>>;
  lessonIds?: number[];
};

export type ExposureState = {
  cursor: number;
  exposures: Record<string, QuestionExposureRow>;
};

export type SelectionResult = {
  selectedQuestionIds: string[];
  selectedByType: Record<QuestionType, number>;
};

const QUESTION_TYPES: QuestionType[] = ['mcq', 'truefalse', 'match'];

const toExposureMap = (rows: QuestionExposureRow[]): Record<string, QuestionExposureRow> => {
  const map: Record<string, QuestionExposureRow> = {};
  rows.forEach((row) => {
    map[row.questionId] = row;
  });
  return map;
};

export const createSeededRng = (seedInput: string | number): (() => number) => {
  const text = String(seedInput);
  let seed = 0;

  for (let index = 0; index < text.length; index += 1) {
    seed = (seed * 31 + text.charCodeAt(index)) >>> 0;
  }

  return () => {
    seed += 0x6d2b79f5;
    let mixed = Math.imul(seed ^ (seed >>> 15), seed | 1);
    mixed ^= mixed + Math.imul(mixed ^ (mixed >>> 7), mixed | 61);
    return ((mixed ^ (mixed >>> 14)) >>> 0) / 4294967296;
  };
};

type RankedCandidate = {
  question: SelectorQuestion;
  noveltyBand: 0 | 1 | 2;
  seenAt: number;
  tie: number;
};

const rankCandidates = (
  candidates: SelectorQuestion[],
  exposureMap: Record<string, QuestionExposureRow>,
  currentCursor: number,
  minGap: number,
  rng: () => number
): RankedCandidate[] => {
  const ranked = candidates.map((question) => {
    const exposure = exposureMap[question.id];
    const seenAt = exposure?.lastSeenCursor ?? Number.NEGATIVE_INFINITY;
    const isUnseen = exposure === undefined;
    const distance = isUnseen ? Number.POSITIVE_INFINITY : currentCursor - exposure.lastSeenCursor;
    const isGapSatisfied = isUnseen || distance >= minGap;
    const noveltyBand: RankedCandidate['noveltyBand'] = isUnseen ? 0 : isGapSatisfied ? 1 : 2;

    return {
      question,
      noveltyBand,
      seenAt,
      tie: rng(),
    };
  });

  return ranked.sort((left, right) => {
    if (left.noveltyBand !== right.noveltyBand) {
      return left.noveltyBand - right.noveltyBand;
    }

    if (left.seenAt !== right.seenAt) {
      return left.seenAt - right.seenAt;
    }

    return left.tie - right.tie;
  });
};

const resolveTypeTargets = (
  candidates: SelectorQuestion[],
  totalCount: number,
  explicitTargets: Partial<Record<QuestionType, number>> | undefined
): Record<QuestionType, number> => {
  const availability: Record<QuestionType, number> = {
    mcq: 0,
    truefalse: 0,
    match: 0,
  };

  candidates.forEach((candidate) => {
    availability[candidate.type] += 1;
  });

  const targets: Record<QuestionType, number> = {
    mcq: 0,
    truefalse: 0,
    match: 0,
  };

  let remaining = Math.min(totalCount, candidates.length);

  QUESTION_TYPES.forEach((type) => {
    const requested = explicitTargets?.[type] ?? 0;
    const granted = Math.min(Math.max(0, requested), availability[type], remaining);
    targets[type] = granted;
    remaining -= granted;
  });

  while (remaining > 0) {
    let assigned = false;

    QUESTION_TYPES.forEach((type) => {
      if (remaining <= 0) return;
      if (targets[type] >= availability[type]) return;

      targets[type] += 1;
      remaining -= 1;
      assigned = true;
    });

    if (!assigned) break;
  }

  return targets;
};

export const selectQuestionSession = (args: {
  questions: SelectorQuestion[];
  exposureState: ExposureState;
  policy: SelectionPolicy;
  rng?: () => number;
}): SelectionResult => {
  const rng = args.rng ?? Math.random;
  const eligibleQuestions = args.questions.filter((question) => question.status === 'active');
  const typeTargets = resolveTypeTargets(eligibleQuestions, args.policy.totalCount, args.policy.typeTargets);
  const selectedSet = new Set<string>();
  const selectedByType: Record<QuestionType, number> = { mcq: 0, truefalse: 0, match: 0 };

  QUESTION_TYPES.forEach((type) => {
    const candidates = eligibleQuestions.filter((question) => question.type === type);
    const ranked = rankCandidates(
      candidates,
      args.exposureState.exposures,
      args.exposureState.cursor,
      args.policy.minGap,
      rng
    );

    const needed = typeTargets[type];
    ranked.slice(0, needed).forEach((entry) => {
      selectedSet.add(entry.question.id);
      selectedByType[type] += 1;
    });
  });

  const totalNeeded = Math.min(args.policy.totalCount, eligibleQuestions.length);

  if (selectedSet.size < totalNeeded) {
    const remaining = eligibleQuestions.filter((question) => !selectedSet.has(question.id));
    const rankedRemaining = rankCandidates(
      remaining,
      args.exposureState.exposures,
      args.exposureState.cursor,
      args.policy.minGap,
      rng
    );

    rankedRemaining.slice(0, totalNeeded - selectedSet.size).forEach((entry) => {
      selectedSet.add(entry.question.id);
      selectedByType[entry.question.type] += 1;
    });
  }

  const selectedQuestionIds = Array.from(selectedSet);

  for (let index = selectedQuestionIds.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(rng() * (index + 1));
    [selectedQuestionIds[index], selectedQuestionIds[swapIndex]] = [
      selectedQuestionIds[swapIndex],
      selectedQuestionIds[index],
    ];
  }

  return {
    selectedQuestionIds,
    selectedByType,
  };
};

export const applyExposureForSelection = (args: {
  exposureState: ExposureState;
  selectedQuestionIds: string[];
}): ExposureState => {
  const updatedMap: Record<string, QuestionExposureRow> = { ...args.exposureState.exposures };
  let nextCursor = args.exposureState.cursor;

  args.selectedQuestionIds.forEach((questionId) => {
    nextCursor += 1;
    const previous = updatedMap[questionId];

    updatedMap[questionId] = {
      questionId,
      seenCount: (previous?.seenCount ?? 0) + 1,
      lastSeenCursor: nextCursor,
    };
  });

  return {
    cursor: nextCursor,
    exposures: updatedMap,
  };
};

export const createExposureState = (rows: QuestionExposureRow[] = [], cursor = 0): ExposureState => ({
  cursor,
  exposures: toExposureMap(rows),
});
