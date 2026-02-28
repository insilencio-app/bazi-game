import React, { useEffect, useMemo, useState } from 'react';
import { mockEarthlyBranches, mockElements, mockHeavenlySteams, mockLessons, mockTenGods } from '../data/mockData';
import { selectByNovelty, shuffleArray } from '../utils/quizSelection';
import { MultipleChoiceQuestion } from '../components/quiz/MultipleChoiceQuestion';
import { QuizHintPanel } from '../components/quiz/QuizHintPanel';
import { QuizActionButton } from '../components/quiz/QuizActionButton';
import type { LessonWithBanks } from '../types/domain';

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
      hint?: string;
    }
  | {
      id: number;
      type: 'truefalse';
      question: string;
      correct: boolean;
      explanation: string;
      hint?: string;
    }
  | {
      id: number;
      type: 'match';
      prompt: string;
      pairs: { left: string; right: string }[];
    };

interface LessonProps {
  lessonId: number;
  onComplete: (lessonId: number, score: number, totalQuestions: number) => void;
  onExit: () => void;
  userXp: number;
  onUseHint: () => void;
  onQuestionAnswered: (lessonId: number, correct: boolean) => void;
}

export const LessonPage: React.FC<LessonProps> = ({ lessonId, onComplete, onExit, userXp, onUseHint, onQuestionAnswered }) => {
  const lesson = mockLessons.find((l) => l.id === lessonId);
  const baseSteps = (lesson?.steps ?? []) as LessonStep[];

  const lessonBanks = useMemo(() => {
    const typedLesson = lesson as LessonWithBanks | undefined;

    return {
      questionBank: typedLesson?.questionBank ?? [],
      trueFalseBank: typedLesson?.trueFalseBank ?? [],
      matchBank: typedLesson?.matchBank ?? [],
    };
  }, [lesson]);

  const quizSteps = useMemo(() => {
    const isHeavenlyStemsLesson = lessonId === 2;
    const isTenGodsLesson = lessonId === 5;
    const lessonHistoryKey = `bazi-lesson-quiz-history-v1-lesson-${lessonId}`;

    const mcqCount = Math.min(6, lessonBanks.questionBank.length);
    const tfCount = Math.min(2, lessonBanks.trueFalseBank.length);
    const matchCount = Math.min(2, lessonBanks.matchBank.length);
    const dayMasters = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'];

    const isWuHeRelated = (text: string) =>
      /天干五合|五合|甲己|乙庚|丙辛|丁壬|戊癸|見合|化/.test(text);

    const pickWithPriority = <T,>(
      items: T[],
      count: number,
      isPriority: (item: T) => boolean,
      minPriority: number,
      getKey: (item: T) => string
    ) => {
      const priorityItems = shuffleArray(items.filter(isPriority));
      const otherItems = shuffleArray(items.filter((item) => !isPriority(item)));
      const prioritized = priorityItems.slice(0, Math.min(minPriority, count));
      const candidatePool = [...prioritized, ...otherItems];
      return selectByNovelty(candidatePool, count, getKey, lessonHistoryKey, 10);
    };

    const pickBalancedByDayMaster = <T,>(
      items: T[],
      count: number,
      getText: (item: T) => string,
      getKey: (item: T) => string
    ) => {
      const pools = new Map<string, T[]>();

      items.forEach((item) => {
        const text = getText(item);
        const match = text.match(/日主([甲乙丙丁戊己庚辛壬癸])/);
        const key = match ? match[1] : 'other';
        if (!pools.has(key)) pools.set(key, []);
        pools.get(key)!.push(item);
      });

      pools.forEach((groupItems, key) => {
        pools.set(key, shuffleArray(groupItems));
      });

      const selected: T[] = [];
      const orderedStems = shuffleArray(dayMasters.filter((stem) => (pools.get(stem)?.length ?? 0) > 0));

      orderedStems.forEach((stem) => {
        if (selected.length >= count) return;
        const stemPool = pools.get(stem);
        if (stemPool && stemPool.length > 0) {
          selected.push(stemPool.shift()!);
        }
      });

      const remainingPool = shuffleArray(Array.from(pools.values()).flat());
      const remainingCount = Math.max(0, count - selected.length);
      const candidatePool = [...selected, ...remainingPool.slice(0, remainingCount + count)];
      return selectByNovelty(candidatePool, count, getKey, lessonHistoryKey, 10);
    };

    const selectedQuestions = isHeavenlyStemsLesson
      ? pickWithPriority(
          lessonBanks.questionBank,
          mcqCount,
          (q) => isWuHeRelated(`${q.question} ${q.explanation}`),
          4,
          (q) => `mcq-${q.id}`
        )
      : isTenGodsLesson
      ? pickBalancedByDayMaster(
          lessonBanks.questionBank,
          mcqCount,
          (q) => `${q.question} ${q.explanation}`,
          (q) => `mcq-${q.id}`
        )
      : selectByNovelty(lessonBanks.questionBank, mcqCount, (q) => `mcq-${q.id}`, lessonHistoryKey, 10);

    const selectedTrueFalse = isHeavenlyStemsLesson
      ? pickWithPriority(
          lessonBanks.trueFalseBank,
          tfCount,
          (tf) => isWuHeRelated(`${tf.question} ${tf.explanation}`),
          3,
          (tf) => `tf-${tf.id}`
        )
      : isTenGodsLesson
      ? pickBalancedByDayMaster(
          lessonBanks.trueFalseBank,
          tfCount,
          (tf) => `${tf.question} ${tf.explanation}`,
          (tf) => `tf-${tf.id}`
        )
      : selectByNovelty(lessonBanks.trueFalseBank, tfCount, (tf) => `tf-${tf.id}`, lessonHistoryKey, 10);

    const selectedMatches = isHeavenlyStemsLesson
      ? pickWithPriority(
          lessonBanks.matchBank,
          matchCount,
          (m) => isWuHeRelated(m.prompt),
          1,
          (m) => `match-${m.id}`
        )
      : isTenGodsLesson
      ? pickBalancedByDayMaster(
          lessonBanks.matchBank,
          matchCount,
          (m) => `${m.prompt} ${m.pairs.map((pair) => `${pair.left} ${pair.right}`).join(' ')}`,
          (m) => `match-${m.id}`
        )
      : selectByNovelty(lessonBanks.matchBank, matchCount, (m) => `match-${m.id}`, lessonHistoryKey, 10);

    const steps: LessonStep[] = [];

    selectedQuestions.forEach((q, index) => {
      steps.push({
        id: 1000 + index,
        type: 'mcq',
        question: q.question,
        options: q.options,
        correct: q.correct,
        explanation: q.explanation,
        hint: q.hint,
      });
    });

    selectedTrueFalse.forEach((tf, index) => {
      steps.push({
        id: 1500 + index,
        type: 'truefalse',
        question: tf.question,
        correct: tf.correct,
        explanation: tf.explanation,
        hint: tf.hint,
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
  const firstQuizStepIndex = steps.findIndex(
    (step) => step.type === 'mcq' || step.type === 'truefalse' || step.type === 'match'
  );

  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [answered, setAnswered] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [finished, setFinished] = useState(false);
  const [selectedLeft, setSelectedLeft] = useState<string | null>(null);
  const [matchedPairs, setMatchedPairs] = useState<Array<[string, string]>>([]);
  const [matchMessage, setMatchMessage] = useState<string | null>(null);
  const [showHint, setShowHint] = useState(false);

  if (!lesson) {
    return <div>課程未找到</div>;
  }

  const currentStep = steps[currentStepIndex];
  const progress = steps.length ? ((currentStepIndex + 1) / steps.length) * 100 : 0;
  const canSkipToQuiz = firstQuizStepIndex > -1 && currentStepIndex < firstQuizStepIndex;

  useEffect(() => {
    setSelectedAnswer(null);
    setAnswered(false);
    setShowFeedback(false);
    setSelectedLeft(null);
    setMatchedPairs([]);
    setMatchMessage(null);
    setShowHint(false);
  }, [currentStepIndex]);

  const shuffledRights = useMemo(() => {
    if (!currentStep || currentStep.type !== 'match') return [];

    // Count how many times each right value appears in the pairs
    const rightValueCounts = new Map<string, number>();
    currentStep.pairs.forEach(pair => {
      rightValueCounts.set(pair.right, (rightValueCounts.get(pair.right) || 0) + 1);
    });

    // Create the correct number of instances for each right value
    const currentRights: Array<{ right: string; originalIndex: number; id: string }> = [];
    currentStep.pairs.forEach((pair, idx) => {
      currentRights.push({
        right: pair.right, 
        originalIndex: idx,
        id: `correct-${idx}-${pair.right}` 
      });
    });

    // Add distractors
    const extraRightCount = 2;
    const currentRightSet = new Set(currentStep.pairs.map((pair) => pair.right));
    const samePromptMatch = lessonBanks.matchBank.find((match) => match.prompt === currentStep.prompt);
    const samePromptRights = samePromptMatch ? samePromptMatch.pairs.map((pair) => pair.right) : [];
    const allRights = lessonBanks.matchBank.flatMap((match) => match.pairs.map((pair) => pair.right));
    const samePromptDistractors = Array.from(
      new Set(samePromptRights.filter((right) => !currentRightSet.has(right)))
    );
    const allDistractors = Array.from(new Set(allRights.filter((right) => !currentRightSet.has(right))));
    const uniqueDistractors = samePromptDistractors.length >= extraRightCount ? samePromptDistractors : allDistractors;

    const distractors = shuffleArray(uniqueDistractors)
      .slice(0, extraRightCount)
      .map((right, idx) => ({ 
        right, 
        originalIndex: -1,
        id: `distractor-${idx}-${right}` 
      }));

    const rightsWithIndex = [...currentRights, ...distractors];
    
    // Shuffle the options
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

    let isCorrect = false;

    // For MCQ: check if selectedAnswer matches correct index
    if (currentStep.type === 'mcq' && selectedAnswer === currentStep.correct) {
      setScore((prev) => prev + 1);
      isCorrect = true;
    }
    
    // For true/false: selectedAnswer 1 = true, 0 = false
    if (currentStep.type === 'truefalse') {
      const userAnswerIsTrue = selectedAnswer === 1;
      if (userAnswerIsTrue === currentStep.correct) {
        setScore((prev) => prev + 1);
        isCorrect = true;
      }
    }

    // Track performance
    onQuestionAnswered(lessonId, isCorrect);
  };

  const handleUseHint = () => {
    if (userXp >= 50 && !showHint) {
      setShowHint(true);
      onUseHint();
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

  const handleSkipToQuiz = () => {
    if (!canSkipToQuiz) return;

    setCurrentStepIndex(firstQuizStepIndex);
    setSelectedAnswer(null);
    setAnswered(false);
    setShowFeedback(false);
    setSelectedLeft(null);
    setMatchedPairs([]);
    setMatchMessage(null);
  };

  const handleMatchLeft = (value: string, index: number) => {
    if (currentStep?.type !== 'match') return;
    const uniqueKey = `${value}-${index}`;
    const isAlreadyMatched = matchedPairs.some((pair) => pair[0] === uniqueKey);
    if (isAlreadyMatched) return;
    setSelectedLeft(uniqueKey);
    setMatchMessage(null);
  };

  const handleMatchRight = (rightWithIndex: { right: string; originalIndex: number; id: string }) => {
    if (currentStep?.type !== 'match') return;
    if (!selectedLeft) return;

    // Check if this specific right option instance is already matched
    const isAlreadyMatched = matchedPairs.some((pair) => pair[1] === rightWithIndex.id);
    if (isAlreadyMatched) {
      setMatchMessage('✗ 該選項已被配對');
      return;
    }

    // Extract the index from the unique key to find the correct pair
    const selectedIndex = parseInt(selectedLeft.split('-')[1]);
    
    // Find the correct right option for the selected left item using the index
    const correctPair = currentStep.pairs[selectedIndex];
    const correctRight = correctPair?.right;
    
    if (correctRight === rightWithIndex.right) {
      // Store the match using the unique IDs instead of just the right value
      setMatchedPairs((prev) => [...prev, [selectedLeft, rightWithIndex.id]]);
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
        <QuizActionButton
          label="返回主頁"
          onClick={() => onComplete(lessonId, score, totalQuestions)}
          fullWidth
        />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      {/* Header */}
      <div className="mb-6">
        <div className="flex flex-wrap items-center gap-3 sm:gap-4 mb-3">
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">{lesson.title_cn}</h1>
            <p className="text-sm sm:text-lg text-gray-600">{lesson.title_en}</p>
          </div>
          <div className="flex items-center gap-3 ml-auto">
            <QuizActionButton
              label="返回主頁"
              onClick={onExit}
              variant="danger"
              size="compact"
              stretch={false}
            />
            <div className="text-sm sm:text-base text-gray-500 whitespace-nowrap">
              <span className="font-semibold">步驟 {currentStepIndex + 1}/{steps.length}</span>
            </div>
          </div>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2 mt-4">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
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
          <MultipleChoiceQuestion
            question={currentStep.question}
            options={currentStep.options}
            correctIndex={currentStep.correct}
            explanation={currentStep.explanation}
            selectedAnswer={selectedAnswer}
            answered={answered}
            showFeedback={showFeedback}
            onSelectAnswer={setSelectedAnswer}
            hint={currentStep.hint}
            showHint={showHint}
            onUseHint={handleUseHint}
            canUseHint={userXp >= 50}
            hintXpCost={50}
            size="large"
          />
        </div>
      )}

      {currentStep?.type === 'truefalse' && (
        <div className="mb-8">
          <h2 className="text-xl sm:text-3xl lg:text-4xl font-bold mb-4 sm:mb-6 text-gray-800">{currentStep.question}</h2>

          {currentStep.hint && !answered && (
            <QuizHintPanel
              hint={currentStep.hint}
              answered={answered}
              showHint={showHint}
              onUseHint={handleUseHint}
              canUseHint={userXp >= 50}
              hintXpCost={50}
            />
          )}

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
          <div className="grid grid-cols-2 gap-2 sm:gap-4">
            <div className="space-y-1.5 sm:space-y-2">
              <h3 className="text-xs sm:text-base font-semibold text-gray-700 mb-1 sm:mb-2">選擇項目：</h3>
              {currentStep.pairs.map((pair, index) => {
                const uniqueKey = `${pair.left}-${index}`;
                const isMatched = matchedPairs.some((mp) => mp[0] === uniqueKey);
                return (
                  <button
                    key={uniqueKey}
                    onClick={() => handleMatchLeft(pair.left, index)}
                    disabled={isMatched}
                    className={`w-full p-1.5 sm:p-3 rounded-lg border-2 text-left transition-all text-xs sm:text-base lg:text-lg font-semibold ${
                      isMatched
                        ? 'border-green-500 bg-green-50 text-green-700 cursor-not-allowed opacity-60'
                        : selectedLeft === uniqueKey
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-300 hover:border-blue-500 hover:bg-blue-50'
                    }`}
                  >
                    {isMatched && '✓ '}{pair.left}
                  </button>
                );
              })}
            </div>
            <div className="space-y-1.5 sm:space-y-2">
              <h3 className="text-xs sm:text-base font-semibold text-gray-700 mb-1 sm:mb-2">配對選項：</h3>
              {shuffledRights.map((item) => {
                const isMatched = matchedPairs.some((mp) => mp[1] === item.id);
                return (
                  <button
                    key={item.id}
                    onClick={() => handleMatchRight(item)}
                    disabled={isMatched}
                    className={`w-full p-1.5 sm:p-3 rounded-lg border-2 text-left transition-all text-xs sm:text-base lg:text-lg font-semibold ${
                      isMatched
                        ? 'border-green-500 bg-green-50 text-green-700 cursor-not-allowed opacity-60'
                        : selectedLeft
                        ? 'border-gray-300 hover:border-blue-500 hover:bg-blue-50 cursor-pointer'
                        : 'border-gray-300 hover:border-blue-500 hover:bg-blue-50 cursor-pointer'
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
              <p className="text-xs sm:text-sm text-blue-600 font-medium">已選擇: {selectedLeft.split('-')[0]} → 請選擇配對選項</p>
            )}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      {(currentStep?.type === 'mcq' || currentStep?.type === 'truefalse') && !answered && (
        <div className="flex flex-wrap gap-3">
          <QuizActionButton label="上一步" onClick={handlePrevious} disabled={currentStepIndex === 0} variant="secondary" />
          <QuizActionButton label="檢查" onClick={handleCheck} disabled={selectedAnswer === null} />
        </div>
      )}

      {(currentStep?.type === 'mcq' || currentStep?.type === 'truefalse') && answered && (
        <div className="flex flex-wrap gap-3">
          <QuizActionButton label="上一步" onClick={handlePrevious} disabled={currentStepIndex === 0} variant="secondary" />
          <QuizActionButton label="繼續" onClick={handleNext} />
        </div>
      )}

      {currentStep?.type === 'match' && isMatchComplete && (
        <div className="flex flex-wrap gap-3">
          <QuizActionButton label="上一步" onClick={handlePrevious} disabled={currentStepIndex === 0} variant="secondary" />
          <QuizActionButton
            label="繼續"
            onClick={() => {
              if (!answered) {
                setScore((prev) => prev + 1);
                setAnswered(true);
              }
              handleNext();
            }}
          />
        </div>
      )}

      {currentStep?.type === 'content' && (
        <div className="flex flex-wrap gap-3">
          <QuizActionButton label="上一步" onClick={handlePrevious} disabled={currentStepIndex === 0} variant="secondary" />
          <QuizActionButton label="繼續" onClick={handleNext} />
          {canSkipToQuiz && (
            <QuizActionButton label="跳到測驗" onClick={handleSkipToQuiz} variant="accent" />
          )}
        </div>
      )}

      {currentStep?.type === 'cards' && (
        <div className="flex flex-wrap gap-3">
          <QuizActionButton label="上一步" onClick={handlePrevious} disabled={currentStepIndex === 0} variant="secondary" />
          <QuizActionButton label="繼續" onClick={handleNext} />
          {canSkipToQuiz && (
            <QuizActionButton label="跳到測驗" onClick={handleSkipToQuiz} variant="accent" />
          )}
        </div>
      )}
    </div>
  );
};
