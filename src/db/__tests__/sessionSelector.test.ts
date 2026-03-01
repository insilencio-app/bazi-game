import { describe, expect, it } from 'vitest';
import {
  applyExposureForSelection,
  createExposureState,
  createSeededRng,
  selectQuestionSession,
  type SelectorQuestion,
} from '../selector/sessionSelector';

const buildQuestion = (id: string, type: SelectorQuestion['type']): SelectorQuestion => ({
  id,
  lessonId: 1,
  type,
  difficulty: 2,
  status: 'active',
});

describe('selectQuestionSession', () => {
  it('respects per-type targets when inventory is available', () => {
    const questions: SelectorQuestion[] = [
      buildQuestion('mcq-1', 'mcq'),
      buildQuestion('mcq-2', 'mcq'),
      buildQuestion('mcq-3', 'mcq'),
      buildQuestion('tf-1', 'truefalse'),
      buildQuestion('tf-2', 'truefalse'),
      buildQuestion('tf-3', 'truefalse'),
      buildQuestion('match-1', 'match'),
      buildQuestion('match-2', 'match'),
      buildQuestion('match-3', 'match'),
    ];

    const result = selectQuestionSession({
      questions,
      exposureState: createExposureState([], 100),
      policy: {
        totalCount: 6,
        minGap: 3,
        typeTargets: {
          mcq: 2,
          truefalse: 2,
          match: 2,
        },
      },
      rng: createSeededRng('quota-test'),
    });

    expect(result.selectedQuestionIds.length).toBe(6);
    expect(result.selectedByType.mcq).toBe(2);
    expect(result.selectedByType.truefalse).toBe(2);
    expect(result.selectedByType.match).toBe(2);
  });

  it('prioritizes unseen or stale questions before recently seen ones', () => {
    const questions: SelectorQuestion[] = [
      buildQuestion('mcq-recent', 'mcq'),
      buildQuestion('mcq-old', 'mcq'),
      buildQuestion('mcq-unseen', 'mcq'),
    ];

    const exposureState = createExposureState(
      [
        { questionId: 'mcq-recent', seenCount: 4, lastSeenCursor: 99 },
        { questionId: 'mcq-old', seenCount: 10, lastSeenCursor: 60 },
      ],
      100
    );

    const result = selectQuestionSession({
      questions,
      exposureState,
      policy: {
        totalCount: 2,
        minGap: 5,
        typeTargets: { mcq: 2 },
      },
      rng: createSeededRng('novelty-test'),
    });

    expect(result.selectedQuestionIds).toContain('mcq-unseen');
    expect(result.selectedQuestionIds).toContain('mcq-old');
    expect(result.selectedQuestionIds).not.toContain('mcq-recent');
  });

  it('updates exposure cursor and seen count after a session', () => {
    const initialState = createExposureState([{ questionId: 'mcq-1', seenCount: 2, lastSeenCursor: 10 }], 10);
    const updatedState = applyExposureForSelection({
      exposureState: initialState,
      selectedQuestionIds: ['mcq-1', 'tf-1', 'match-1'],
    });

    expect(updatedState.cursor).toBe(13);
    expect(updatedState.exposures['mcq-1'].seenCount).toBe(3);
    expect(updatedState.exposures['mcq-1'].lastSeenCursor).toBe(11);
    expect(updatedState.exposures['tf-1'].seenCount).toBe(1);
    expect(updatedState.exposures['tf-1'].lastSeenCursor).toBe(12);
    expect(updatedState.exposures['match-1'].seenCount).toBe(1);
    expect(updatedState.exposures['match-1'].lastSeenCursor).toBe(13);
  });
});
