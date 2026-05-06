import { act, renderHook, waitFor } from '@testing-library/react';
import { useTotalQuizSession } from '../useTotalQuizSession';

vi.mock('../../data/mockData', () => ({
  mockLessons: [
    {
      id: 1,
      title_cn: '測試課程',
      questionBank: [
        {
          id: 101,
          question: 'Q1',
          options: ['A', 'B'],
          correct: 0,
          explanation: 'E1',
        },
        {
          id: 102,
          question: 'Q2',
          options: ['C', 'D'],
          correct: 1,
          explanation: 'E2',
        },
      ],
    },
  ],
}));

vi.mock('../../utils/quizSelection', () => ({
  selectByNovelty: <T,>(items: T[], count: number) => items.slice(0, count),
}));

describe('useTotalQuizSession', () => {
  it('scores answers and completes quiz flow', async () => {
    const onQuestionAnswered = vi.fn();
    const onUseHint = vi.fn();

    const { result } = renderHook(() =>
      useTotalQuizSession({
        currentMode: 'total-quiz',
        userXp: 200,
        hintXpCost: 50,
        onQuestionAnswered,
        onUseHint,
      })
    );

    await waitFor(() => {
      expect(result.current.totalQuestions).toBe(2);
      expect(result.current.isLoading).toBe(false);
    });

    act(() => {
      result.current.setSelectedAnswer(0);
    });

    act(() => {
      result.current.handleCheck();
    });

    expect(result.current.answered).toBe(true);
    expect(result.current.quizScore).toBe(1);
    expect(result.current.currentAccuracy).toBe(100);
    expect(onQuestionAnswered).toHaveBeenCalledWith(1, true);

    act(() => {
      result.current.handleNext();
    });

    expect(result.current.quizIndex).toBe(1);
    expect(result.current.answered).toBe(false);

    act(() => {
      result.current.setSelectedAnswer(0);
    });

    act(() => {
      result.current.handleCheck();
    });

    expect(result.current.quizScore).toBe(1);
    expect(onQuestionAnswered).toHaveBeenLastCalledWith(1, false);

    act(() => {
      result.current.handleNext();
    });

    expect(result.current.isQuizFinished).toBe(true);
    expect(result.current.latestPercent).toBe(50);
  });

  it('uses hint only once when XP is sufficient', async () => {
    const onQuestionAnswered = vi.fn();
    const onUseHint = vi.fn();

    const { result } = renderHook(() =>
      useTotalQuizSession({
        currentMode: 'total-quiz',
        userXp: 50,
        hintXpCost: 50,
        onQuestionAnswered,
        onUseHint,
      })
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    act(() => {
      result.current.handleUseTotalQuizHint();
      result.current.handleUseTotalQuizHint();
    });

    expect(result.current.showTotalQuizHint).toBe(true);
    expect(onUseHint).toHaveBeenCalledTimes(1);
  });
});
