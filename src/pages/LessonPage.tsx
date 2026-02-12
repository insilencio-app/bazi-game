import React, { useEffect, useMemo, useState } from 'react';
import { mockEarthlyBranches, mockElements, mockHeavenlySteams, mockLessons, mockTenGods } from '../data/mockData';

type LessonStep =
  | {
      id: number;
      type: 'content';
      title: string;
      paragraphs?: string[];
      bullets?: string[];
    }
  | {
      id: number;
      type: 'cards';
      title: string;
      description?: string;
      source: 'elements' | 'stems' | 'branches' | 'gods';
    }
  | {
      id: number;
      type: 'mcq';
      question: string;
      options: string[];
      correct: number;
      explanation: string;
    }
  | {
      id: number;
      type: 'truefalse';
      question: string;
      correct: boolean;
      explanation: string;
    }
  | {
      id: number;
      type: 'match';
      prompt: string;
      pairs: { left: string; right: string }[];
    };

type LessonQuestion = {
  id: number;
  question: string;
  options: string[];
  correct: number;
  explanation: string;
};

type LessonTrueFalse = {
  id: number;
  question: string;
  correct: boolean;
  explanation: string;
};

type LessonMatch = {
  id: number;
  prompt: string;
  pairs: { left: string; right: string }[];
};

interface LessonProps {
  lessonId: number;
  onComplete: (lessonId: number, score: number, totalQuestions: number) => void;
  onExit: () => void;
}

export const LessonPage: React.FC<LessonProps> = ({ lessonId, onComplete, onExit }) => {
  const lesson = mockLessons.find((l) => l.id === lessonId);
  const baseSteps = (lesson?.steps ?? []) as LessonStep[];

  const lessonBanks = useMemo(() => {
    return {
      questionBank: ((lesson as any)?.questionBank ?? []) as LessonQuestion[],
      trueFalseBank: ((lesson as any)?.trueFalseBank ?? []) as LessonTrueFalse[],
      matchBank: ((lesson as any)?.matchBank ?? []) as LessonMatch[],
    };
  }, [lessonId]);

  const shuffled = <T,>(items: T[]) => {
    const copy = [...items];
    for (let i = copy.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  };

  const quizSteps = useMemo(() => {
    const mcqCount = Math.min(10, lessonBanks.questionBank.length);
    const tfCount = Math.min(6, lessonBanks.trueFalseBank.length);
    const matchCount = Math.min(4, lessonBanks.matchBank.length);
    const selectedQuestions = shuffled(lessonBanks.questionBank).slice(0, mcqCount);
    const selectedTrueFalse = shuffled(lessonBanks.trueFalseBank).slice(0, tfCount);
    const selectedMatches = shuffled(lessonBanks.matchBank).slice(0, matchCount);
    const steps: LessonStep[] = [];

    selectedQuestions.forEach((q, index) => {
      steps.push({
        id: 1000 + index,
        type: 'mcq',
        question: q.question,
        options: q.options,
        correct: q.correct,
        explanation: q.explanation,
      });
    });

    selectedTrueFalse.forEach((tf, index) => {
      steps.push({
        id: 1500 + index,
        type: 'truefalse',
        question: tf.question,
        correct: tf.correct,
        explanation: tf.explanation,
      });
    });

    selectedMatches.forEach((m, index) => {
      steps.push({
        id: 2000 + index,
        type: 'match',
        prompt: m.prompt,
        pairs: m.pairs,
      });
    });

    return steps;
  }, [lessonBanks, lessonId]);

  const steps = useMemo(() => [...baseSteps, ...quizSteps], [baseSteps, quizSteps]);
  const totalQuestions = steps.filter((step) => step.type === 'mcq' || step.type === 'truefalse' || step.type === 'match').length;

  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [answered, setAnswered] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [finished, setFinished] = useState(false);
  const [selectedLeft, setSelectedLeft] = useState<string | null>(null);
  const [matchedPairs, setMatchedPairs] = useState<Array<[string, string]>>([]);
  const [matchMessage, setMatchMessage] = useState<string | null>(null);

  if (!lesson) {
    return <div>課程未找到</div>;
  }

  const currentStep = steps[currentStepIndex];
  const progress = steps.length ? ((currentStepIndex + 1) / steps.length) * 100 : 0;

  useEffect(() => {
    setSelectedAnswer(null);
    setAnswered(false);
    setShowFeedback(false);
    setSelectedLeft(null);
    setMatchedPairs([]);
    setMatchMessage(null);
  }, [currentStepIndex]);

  const shuffledRights = useMemo(() => {
    if (!currentStep || currentStep.type !== 'match') return [];

    const extraRightCount = 2;
    const currentRights = currentStep.pairs.map((pair, idx) => ({ right: pair.right, originalIndex: idx }));
    const currentRightSet = new Set(currentStep.pairs.map((pair) => pair.right));
    const samePromptMatch = lessonBanks.matchBank.find((match) => match.prompt === currentStep.prompt);
    const samePromptRights = samePromptMatch ? samePromptMatch.pairs.map((pair) => pair.right) : [];
    const allRights = lessonBanks.matchBank.flatMap((match) => match.pairs.map((pair) => pair.right));
    const samePromptDistractors = Array.from(
      new Set(samePromptRights.filter((right) => !currentRightSet.has(right)))
    );
    const allDistractors = Array.from(new Set(allRights.filter((right) => !currentRightSet.has(right))));
    const uniqueDistractors = samePromptDistractors.length >= extraRightCount ? samePromptDistractors : allDistractors;

    const distractors = shuffled(uniqueDistractors)
      .slice(0, extraRightCount)
      .map((right) => ({ right, originalIndex: -1 }));

    const rightsWithIndex = [...currentRights, ...distractors];
    for (let i = rightsWithIndex.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [rightsWithIndex[i], rightsWithIndex[j]] = [rightsWithIndex[j], rightsWithIndex[i]];
    }
    return rightsWithIndex;
  }, [currentStepIndex, lessonBanks.matchBank]);

  const handleCheck = () => {
    if (!currentStep) return;
    if (currentStep.type !== 'mcq' && currentStep.type !== 'truefalse') return;
    if (selectedAnswer === null || answered) return;

    setAnswered(true);
    setShowFeedback(true);

    // For MCQ: check if selectedAnswer matches correct index
    if (currentStep.type === 'mcq' && selectedAnswer === currentStep.correct) {
      setScore((prev) => prev + 1);
    }
    
    // For true/false: selectedAnswer 1 = true, 0 = false
    if (currentStep.type === 'truefalse') {
      const userAnswerIsTrue = selectedAnswer === 1;
      if (userAnswerIsTrue === currentStep.correct) {
        setScore((prev) => prev + 1);
      }
    }
  };

  const handleNext = () => {
    if (currentStepIndex < steps.length - 1) {
      setCurrentStepIndex((prev) => prev + 1);
      return;
    }

    setFinished(true);
  };

  const handlePrevious = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex((prev) => prev - 1);
    }
  };

  const handleMatchLeft = (value: string) => {
    if (currentStep?.type !== 'match') return;
    const isAlreadyMatched = matchedPairs.some((pair) => pair[0] === value);
    if (isAlreadyMatched) return;
    setSelectedLeft(value);
    setMatchMessage(null);
  };

  const handleMatchRight = (rightWithIndex: { right: string; originalIndex: number }) => {
    if (currentStep?.type !== 'match') return;
    if (!selectedLeft) return;

    // Check if this right option is already matched
    const isAlreadyMatched = matchedPairs.some((pair) => pair[1] === rightWithIndex.right);
    if (isAlreadyMatched) {
      setMatchMessage('✗ 該選項已被配對');
      return;
    }

    const correctRight = currentStep.pairs.find((pair) => pair.left === selectedLeft)?.right;
    if (correctRight === rightWithIndex.right) {
      setMatchedPairs((prev) => [...prev, [selectedLeft, rightWithIndex.right]]);
      setSelectedLeft(null);
      setMatchMessage('✓ 正確配對');
    } else {
      setMatchMessage('✗ 再試一次');
    }
  };

  const matchedCount = currentStep?.type === 'match' ? matchedPairs.length : 0;
  const isMatchComplete = currentStep?.type === 'match' && matchedCount === currentStep.pairs.length;

  if (finished) {
    return (
      <div className="max-w-3xl mx-auto p-6 bg-white rounded-lg shadow-lg text-center">
        <h2 className="text-5xl font-bold mb-4">課程完成！</h2>
        <p className="text-xl text-gray-600 mb-6">做得很好！你已完成此課程的所有步驟。</p>
        {totalQuestions > 0 && (
          <div className="bg-green-50 rounded-lg p-8 mb-6">
            <p className="text-5xl font-bold text-green-700 mb-2">{score} / {totalQuestions}</p>
            <p className="text-xl text-gray-700">答對題數</p>
          </div>
        )}
        <button
          onClick={() => onComplete(lessonId, score, totalQuestions)}
          className="w-full bg-blue-600 text-white font-bold py-4 rounded-lg hover:bg-blue-700 transition-colors text-xl"
        >
          返回主菜單
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-4 mb-3">
          <button
            onClick={handlePrevious}
            disabled={currentStepIndex === 0}
            className="text-gray-600 hover:text-gray-800 disabled:text-gray-300 disabled:cursor-not-allowed transition-colors"
            title="上一步驟"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div className="flex-1">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">{lesson.title_cn}</h1>
            <p className="text-sm sm:text-lg text-gray-600">{lesson.title_en}</p>
          </div>
          <button
            onClick={onExit}
            className="p-2 rounded-full bg-gray-200 hover:bg-gray-300 text-gray-700 hover:text-gray-900 transition-colors"
            title="返回主菜單"
          >
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12a9 9 0 1 1 18 0 9 9 0 0 1-18 0z" />
            </svg>
          </button>
          <div className="text-base text-gray-500">
            <span className="font-semibold">步驟 {currentStepIndex + 1}/{steps.length}</span>
          </div>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2 mt-4">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          ></div>
        </div>
      </div>

      {/* Step Content */}
      {currentStep?.type === 'content' && (
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-4 text-gray-800">{currentStep.title}</h2>
          {currentStep.paragraphs?.map((text, idx) => (
            <p key={idx} className="text-xl text-gray-700 mb-3">
              {text}
            </p>
          ))}
          {currentStep.bullets && (
            <ul className="list-disc list-inside text-xl text-gray-700 space-y-2">
              {currentStep.bullets.map((item, idx) => (
                <li key={idx}>{item}</li>
              ))}
            </ul>
          )}
        </div>
      )}

      {currentStep?.type === 'cards' && (
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-2 text-gray-800">{currentStep.title}</h2>
          {currentStep.description && (
            <p className="text-lg text-gray-600 mb-4">{currentStep.description}</p>
          )}
          {currentStep.source === 'elements' && (
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              {mockElements.map((el) => (
                <div key={el.id} className="p-3 bg-green-50 rounded text-center">
                  <p className="text-2xl font-bold">{el.name_cn}</p>
                  <p className="text-base text-gray-600">{el.name_en}</p>
                  <p className="text-base font-semibold text-green-700">{el.direction}</p>
                  <p className="text-base text-gray-600">{el.season}</p>
                </div>
              ))}
            </div>
          )}
          {currentStep.source === 'stems' && (
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              {mockHeavenlySteams.map((stem) => (
                <div key={stem.id} className="p-3 bg-blue-50 rounded text-center">
                  <p className="text-3xl font-bold">{stem.name_cn}</p>
                  <p className="text-base text-gray-600">{stem.name_en}</p>
                  <p className="text-base font-semibold text-blue-700">{stem.element}</p>
                  <p className="text-base text-gray-600">{stem.yin_yang === 'yang' ? '陽' : '陰'}</p>
                </div>
              ))}
            </div>
          )}
          {currentStep.source === 'branches' && (
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
              {mockEarthlyBranches.map((branch) => (
                <div key={branch.id} className="p-3 bg-teal-50 rounded text-center">
                  <p className="text-3xl font-bold">{branch.name_cn}</p>
                  <p className="text-base text-gray-600">{branch.zodiac_animal}</p>
                  <p className="text-base font-semibold text-teal-700">{branch.element}</p>
                  <p className="text-base text-gray-600">{branch.hour_range}</p>
                </div>
              ))}
            </div>
          )}
          {currentStep.source === 'gods' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {mockTenGods.map((god) => (
                <div key={god.id} className="p-4 bg-red-50 rounded">
                  <p className="text-2xl font-bold">{god.name_cn}</p>
                  <p className="text-base text-gray-600">{god.name_en}</p>
                  <p className="text-base text-gray-700 mt-2">{god.description}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {currentStep?.type === 'mcq' && (
        <div className="mb-8">
          <h2 className="text-xl sm:text-3xl lg:text-4xl font-bold mb-4 sm:mb-6 text-gray-800">{currentStep.question}</h2>
          <div className="space-y-3 mb-6">
            {currentStep.options.map((option, idx) => (
              <button
                key={idx}
                onClick={() => setSelectedAnswer(idx)}
                disabled={answered}
                className={`w-full p-3 sm:p-5 text-left rounded-lg border-2 transition-all text-sm sm:text-base lg:text-lg ${
                  selectedAnswer === idx
                    ? idx === currentStep.correct
                      ? 'border-green-500 bg-green-50'
                      : answered
                      ? 'border-red-500 bg-red-50'
                      : 'border-blue-500 bg-blue-50'
                    : 'border-gray-300 hover:border-blue-500 hover:bg-blue-50'
                } ${answered ? 'cursor-not-allowed' : 'cursor-pointer'}`}
              >
                <span className="font-semibold">{String.fromCharCode(65 + idx)}.</span> {option}
              </button>
            ))}
          </div>

          {showFeedback && (
            <div className={`p-3 sm:p-5 rounded-lg text-sm sm:text-base lg:text-lg ${selectedAnswer === currentStep.correct ? 'bg-green-100 border-l-4 border-green-500' : 'bg-red-100 border-l-4 border-red-500'}`}>
              <p className="font-semibold mb-2 text-base sm:text-lg">
                {selectedAnswer === currentStep.correct ? '✓ 正確!' : '✗ 錯誤'}
              </p>
              <p className="text-gray-700 text-sm sm:text-base">{currentStep.explanation}</p>
            </div>
          )}
        </div>
      )}

      {currentStep?.type === 'truefalse' && (
        <div className="mb-8">
          <h2 className="text-xl sm:text-3xl lg:text-4xl font-bold mb-4 sm:mb-6 text-gray-800">{currentStep.question}</h2>
          <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-6">
            <button
              onClick={() => setSelectedAnswer(1)}
              disabled={answered}
              className={`p-3 sm:p-6 rounded-lg border-2 transition-all ${
                selectedAnswer === 1
                  ? currentStep.correct === true
                    ? 'border-green-500 bg-green-50'
                    : answered
                    ? 'border-red-500 bg-red-50'
                    : 'border-blue-500 bg-blue-50'
                  : 'border-gray-300 hover:border-blue-500 hover:bg-blue-50'
              } ${answered ? 'cursor-not-allowed' : 'cursor-pointer'}`}
            >
              <div className="text-center">
                <div className="text-3xl sm:text-4xl lg:text-5xl mb-1 sm:mb-2">✓</div>
                <div className="text-lg sm:text-2xl lg:text-3xl font-bold">正確</div>
                <div className="text-xs sm:text-sm lg:text-base text-gray-600">True</div>
              </div>
            </button>
            <button
              onClick={() => setSelectedAnswer(0)}
              disabled={answered}
              className={`p-3 sm:p-6 rounded-lg border-2 transition-all ${
                selectedAnswer === 0
                  ? currentStep.correct === false
                    ? 'border-green-500 bg-green-50'
                    : answered
                    ? 'border-red-500 bg-red-50'
                    : 'border-blue-500 bg-blue-50'
                  : 'border-gray-300 hover:border-blue-500 hover:bg-blue-50'
              } ${answered ? 'cursor-not-allowed' : 'cursor-pointer'}`}
            >
              <div className="text-center">
                <div className="text-3xl sm:text-4xl lg:text-5xl mb-1 sm:mb-2">✗</div>
                <div className="text-lg sm:text-2xl lg:text-3xl font-bold">錯誤</div>
                <div className="text-xs sm:text-sm lg:text-base text-gray-600">False</div>
              </div>
            </button>
          </div>

          {showFeedback && (
            <div className={`p-4 rounded-lg ${(selectedAnswer === 1 && currentStep.correct) || (selectedAnswer === 0 && !currentStep.correct) ? 'bg-green-100 border-l-4 border-green-500' : 'bg-red-100 border-l-4 border-red-500'}`}>
              <p className="text-xl font-semibold mb-2">
                {(selectedAnswer === 1 && currentStep.correct) || (selectedAnswer === 0 && !currentStep.correct) ? '✓ 正確!' : '✗ 錯誤'}
              </p>
              <p className="text-lg text-gray-700">{currentStep.explanation}</p>
            </div>
          )}
        </div>
      )}

      {currentStep?.type === 'match' && (
        <div className="mb-8">
          <h2 className="text-xl sm:text-3xl lg:text-4xl font-bold mb-3 sm:mb-4 text-gray-800">{currentStep.prompt}</h2>
          <p className="text-sm sm:text-base text-gray-600 mb-4">先選擇左邊的項目，然後點擊右邊對應的選項進行配對</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div className="space-y-2">
              <h3 className="text-sm sm:text-base font-semibold text-gray-700 mb-2">選擇項目：</h3>
              {currentStep.pairs.map((pair) => {
                const isMatched = matchedPairs.some((mp) => mp[0] === pair.left);
                return (
                  <button
                    key={pair.left}
                    onClick={() => handleMatchLeft(pair.left)}
                    disabled={isMatched}
                    className={`w-full p-2 sm:p-3 rounded-lg border-2 text-left transition-all text-xs sm:text-base lg:text-lg font-semibold ${
                      isMatched
                        ? 'border-green-500 bg-green-50 text-green-700 cursor-not-allowed opacity-60'
                        : selectedLeft === pair.left
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-300 hover:border-blue-500 hover:bg-blue-50'
                    }`}
                  >
                    {isMatched && '✓ '}{pair.left}
                  </button>
                );
              })}
            </div>
            <div className="space-y-2">
              <h3 className="text-sm sm:text-base font-semibold text-gray-700 mb-2">配對選項：</h3>
              {shuffledRights.map((item) => {
                const isMatched = matchedPairs.some((mp) => mp[1] === item.right);
                const isDisabled = isMatched || !selectedLeft;
                return (
                  <button
                    key={`${item.right}-${item.originalIndex}`}
                    onClick={() => handleMatchRight(item)}
                    disabled={isDisabled}
                    className={`w-full p-2 sm:p-3 rounded-lg border-2 text-left transition-all text-xs sm:text-base lg:text-lg font-semibold ${
                      isMatched
                        ? 'border-green-500 bg-green-50 text-green-700 cursor-not-allowed opacity-60'
                        : selectedLeft
                        ? 'border-gray-300 hover:border-blue-500 hover:bg-blue-50 cursor-pointer'
                        : 'border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed'
                    }`}
                  >
                    {isMatched && '✓ '}{item.right}
                  </button>
                );
              })}
            </div>
          </div>
          {matchMessage && (
            <p className={`mt-3 sm:mt-4 text-sm sm:text-base lg:text-lg font-semibold ${matchMessage.startsWith('✓') ? 'text-green-700' : 'text-red-700'}`}>
              {matchMessage}
            </p>
          )}
          <div className="mt-3 sm:mt-4 flex justify-between items-center">
            <p className="text-xs sm:text-sm text-gray-600">已完成 {matchedCount}/{currentStep.pairs.length}</p>
            {selectedLeft && (
              <p className="text-xs sm:text-sm text-blue-600 font-medium">已選擇: {selectedLeft} → 請選擇配對選項</p>
            )}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      {(currentStep?.type === 'mcq' || currentStep?.type === 'truefalse') && !answered && (
        <button
          onClick={handleCheck}
          disabled={selectedAnswer === null}
          className={`w-full font-bold py-3 sm:py-4 rounded-lg transition-colors text-sm sm:text-lg lg:text-xl ${
            selectedAnswer === null
              ? 'bg-gray-300 text-gray-600 cursor-not-allowed'
              : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}
        >
          檢查
        </button>
      )}

      {(currentStep?.type === 'mcq' || currentStep?.type === 'truefalse') && answered && (
        <button
          onClick={handleNext}
          className="w-full bg-blue-600 text-white font-bold py-3 sm:py-4 rounded-lg hover:bg-blue-700 transition-colors text-sm sm:text-lg lg:text-xl"
        >
          繼續
        </button>
      )}

      {currentStep?.type === 'match' && isMatchComplete && (
        <button
          onClick={() => {
            if (!answered) {
              setScore((prev) => prev + 1);
              setAnswered(true);
            }
            handleNext();
          }}
          className="w-full bg-blue-600 text-white font-bold py-3 sm:py-4 rounded-lg hover:bg-blue-700 transition-colors text-sm sm:text-lg lg:text-xl"
        >
          繼續
        </button>
      )}

      {currentStep?.type === 'content' && (
        <button
          onClick={handleNext}
          className="w-full bg-blue-600 text-white font-bold py-3 sm:py-4 rounded-lg hover:bg-blue-700 transition-colors text-sm sm:text-lg lg:text-xl"
        >
          繼續
        </button>
      )}

      {currentStep?.type === 'cards' && (
        <button
          onClick={handleNext}
          className="w-full bg-blue-600 text-white font-bold py-3 sm:py-4 rounded-lg hover:bg-blue-700 transition-colors text-sm sm:text-lg lg:text-xl"
        >
          繼續
        </button>
      )}
    </div>
  );
};
