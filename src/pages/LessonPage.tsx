// Style: every lesson shares the 「五行研習桌」 parchment, indigo, and gold chrome; Lesson 1 alone keeps bespoke interactive atlas scenes.
/* 五行研習桌設計提醒：各課專屬工作台只承載不計分的證據式練習；正式題庫、提示、XP 與完成流程仍由共用課堂流程管理。 */
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { mockEarthlyBranches, mockElements, mockHeavenlySteams, mockLessons, mockTenGods, ELEMENT_STYLES } from '../data/mockData';
import { loadQuizSessionQuestions, type QuizApiQuestion } from '../api/quizApi';
import { useRemoteQuizApi } from '../config/env';
import { selectByNovelty, shuffleArray } from '../utils/quizSelection';
import { MultipleChoiceQuestion } from '../components/quiz/MultipleChoiceQuestion';
import { QuizHintPanel } from '../components/quiz/QuizHintPanel';
import { QuizActionButton } from '../components/quiz/QuizActionButton';
import { EarthlyBranchRing } from '../components/EarthlyBranchRing';
import { EarthlyBranchJourney } from '../components/lesson/EarthlyBranchJourney';
import { TenGodsLessonGuide } from '../components/lesson/TenGodsLessonGuide';
import { BranchRelationsGuide } from '../components/lesson/BranchRelationsGuide';
import { TiYongMomentumWorkbench } from '../components/lesson/TiYongMomentumWorkbench';
import { DayunMomentumWorkbench } from '../components/lesson/DayunMomentumWorkbench';
import LessonTemplate from '../components/lesson/LessonTemplate';
import { LessonOneAtlas, type LessonOneAtlasStage } from '../components/lesson/LessonOneAtlas';
import { getCourseDisplay } from '../data/courseCatalog';
import type { LessonWithBanks } from '../types/domain';

const getDisplayLessonTitle = (lessonId: number, title: string): string => getCourseDisplay(lessonId)?.title ?? title;

const getLessonKicker = (lessonId: number): string => {
  const course = getCourseDisplay(lessonId);
  if (course?.kind === 'guide') return '導讀';
  if (course?.kind === 'practice') return '隨堂練習';
  if (course?.kind === 'supplement') return '補充專題';
  return course?.title.match(/^第\d+課/)?.[0] ?? `第 ${lessonId} 課`;
};

// Disable built-in narration by default. Previously lesson 5 used narration.
const NARRATED_LESSON_ID = -1;

type Lesson1ElementName = '木' | '火' | '土' | '金' | '水';
type Lesson1MapMode = 'sheng' | 'ke';

const LESSON1_ELEMENT_ORDER: Lesson1ElementName[] = ['木', '火', '土', '金', '水'];

const LESSON1_RELATIONS: Record<Lesson1MapMode, Record<Lesson1ElementName, Lesson1ElementName>> = {
  sheng: { 木: '火', 火: '土', 土: '金', 金: '水', 水: '木' },
  ke: { 木: '土', 火: '金', 土: '水', 金: '木', 水: '火' },
};

const LESSON1_MEMORY_PHRASES: Record<Lesson1ElementName, string> = {
  木: '向上生長',
  火: '向外發散',
  土: '承載轉化',
  金: '收斂成形',
  水: '向下流動',
};

const LESSON1_VIRTUES: Record<Lesson1ElementName, string> = {
  木: '仁',
  火: '禮',
  土: '信',
  金: '義',
  水: '智',
};

const LESSON1_CHALLENGES: Array<{ prompt: string; answer: Lesson1ElementName }> = [
  { prompt: '誰會生金？', answer: '土' },
  { prompt: '誰會剋火？', answer: '水' },
  { prompt: '木會生誰？', answer: '火' },
  { prompt: '金會剋誰？', answer: '木' },
  { prompt: '誰會生木？', answer: '水' },
  { prompt: '土會剋誰？', answer: '水' },
];

const buildNarrationText = (step: Extract<LessonStep, { type: 'content' }>): string => {
  const paragraphs = step.paragraphs ?? [];
  const bullets = step.bullets ?? [];
  const raw = [step.title, ...paragraphs, ...bullets].join('。 ');
  return raw.replace(/／/g, '或');
};

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
      sourceQuestionId: string;
      question: string;
      options: string[];
      correct: number;
      explanation: string;
      hint?: string;
    }
  | {
      id: number;
      type: 'truefalse';
      sourceQuestionId: string;
      question: string;
      correct: boolean;
      explanation: string;
      hint?: string;
    }
  | {
      id: number;
      type: 'match';
      sourceQuestionId: string;
      prompt: string;
      pairs: { left: string; right: string }[];
    };

type LessonBankQuestion = {
  id: string;
  question: string;
  options: string[];
  correct: number;
  explanation: string;
  hint?: string;
};

type LessonBankTrueFalse = {
  id: string;
  question: string;
  correct: boolean;
  explanation: string;
  hint?: string;
};

type LessonBankMatch = {
  id: string;
  prompt: string;
  pairs: { left: string; right: string }[];
};

type ScoredLessonStep = Extract<LessonStep, { type: 'mcq' | 'truefalse' | 'match' }>;

type LessonQuestionRecord = {
  selectedAnswer: number | null;
  matchedPairs: Array<[string, string]>;
  isCorrect: boolean;
};

const isScoredLessonStep = (step: LessonStep | undefined): step is ScoredLessonStep =>
  step?.type === 'mcq' || step?.type === 'truefalse' || step?.type === 'match';

const getLessonQuestionKey = (step: ScoredLessonStep) => `${step.type}:${step.sourceQuestionId}`;

const isMcqQuestion = (question: QuizApiQuestion): question is QuizApiQuestion & { type: 'mcq'; options: string[]; answer: number } =>
  question.type === 'mcq' && Array.isArray(question.options) && typeof question.answer === 'number';

const isTrueFalseQuestion = (
  question: QuizApiQuestion
): question is QuizApiQuestion & { type: 'truefalse'; answer: boolean } =>
  question.type === 'truefalse' && typeof question.answer === 'boolean';

const isMatchQuestion = (
  question: QuizApiQuestion
): question is QuizApiQuestion & { type: 'match'; pairs: { left: string; right: string }[] } =>
  question.type === 'match' && Array.isArray(question.pairs);

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
  const speechSynthesisRef = useRef<SpeechSynthesis | null>(null);
  const narrationTimeoutRef = useRef<number | null>(null);
  const [quizQuestions, setQuizQuestions] = useState<QuizApiQuestion[]>([]);
  const [isQuizLoading, setIsQuizLoading] = useState(useRemoteQuizApi);
  const [quizLoadError, setQuizLoadError] = useState<string | null>(null);
  const [isNarrationSupported, setIsNarrationSupported] = useState(false);
  const [isNarrating, setIsNarrating] = useState(false);
  const shouldUseLocalQuizBank = !useRemoteQuizApi || quizLoadError !== null;

  const getLocalLessonBanks = () => {
    const typedLesson = lesson as LessonWithBanks | undefined;
    return {
      questionBank: (typedLesson?.questionBank ?? []).map((q): LessonBankQuestion => ({
        id: String(q.id),
        question: q.question,
        options: q.options,
        correct: q.correct,
        explanation: q.explanation,
        hint: q.hint,
      })),
      trueFalseBank: (typedLesson?.trueFalseBank ?? []).map((tf): LessonBankTrueFalse => ({
        id: String(tf.id),
        question: tf.question,
        correct: tf.correct,
        explanation: tf.explanation,
        hint: tf.hint,
      })),
      matchBank: (typedLesson?.matchBank ?? []).map((m): LessonBankMatch => ({
        id: String(m.id),
        prompt: m.prompt,
        pairs: m.pairs,
      })),
    };
  };

  const lessonBanks = useMemo(() => {
    if (shouldUseLocalQuizBank) {
      return getLocalLessonBanks();
    }

    return {
      questionBank: quizQuestions.filter(isMcqQuestion).map(
        (question): LessonBankQuestion => ({
          id: question.id,
          question: question.prompt,
          options: question.options,
          correct: question.answer,
          explanation: question.explanation,
          hint: question.hint ?? undefined,
        })
      ),
      trueFalseBank: quizQuestions.filter(isTrueFalseQuestion).map(
        (question): LessonBankTrueFalse => ({
          id: question.id,
          question: question.prompt,
          correct: question.answer,
          explanation: question.explanation,
          hint: question.hint ?? undefined,
        })
      ),
      matchBank: quizQuestions.filter(isMatchQuestion).map(
        (question): LessonBankMatch => ({
          id: question.id,
          prompt: question.prompt,
          pairs: question.pairs,
        })
      ),
    };
  }, [lesson, quizQuestions, shouldUseLocalQuizBank]);

  

  useEffect(() => {
    if (!useRemoteQuizApi) {
      setIsQuizLoading(false);
      setQuizLoadError(null);
      return;
    }

    let cancelled = false;

    const loadLessonQuizQuestions = async () => {
      setIsQuizLoading(true);
      setQuizLoadError(null);

      try {
        const session = await loadQuizSessionQuestions({
          userId: 'guest',
          policy: {
            totalCount: 10,
            minGap: 10,
            lessonIds: [lessonId],
            typeTargets: {
              mcq: 6,
              truefalse: 2,
              match: 2,
            },
          },
        });

        if (cancelled) return;

        if (session.questions.length === 0) {
          setQuizQuestions([]);
          setQuizLoadError('課程測驗 API 沒有返回題目，已改用內建題庫。');
          return;
        }

        setQuizQuestions(session.questions);
      } catch {
        if (cancelled) return;

        setQuizQuestions([]);
        setQuizLoadError('課程測驗 API 無法使用，已改用內建題庫。');
      } finally {
        if (!cancelled) {
          setIsQuizLoading(false);
        }
      }
    };

    void loadLessonQuizQuestions();

    return () => {
      cancelled = true;
    };
  }, [lessonId]);

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
        sourceQuestionId: q.id,
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
        sourceQuestionId: tf.id,
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
        sourceQuestionId: m.id,
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
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [answered, setAnswered] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [finished, setFinished] = useState(false);
  const [selectedLeft, setSelectedLeft] = useState<string | null>(null);
  const [matchedPairs, setMatchedPairs] = useState<Array<[string, string]>>([]);
  const [matchMessage, setMatchMessage] = useState<string | null>(null);
  const [showHint, setShowHint] = useState(false);
  const [lesson1SelectedElement, setLesson1SelectedElement] = useState<Lesson1ElementName>('木');
  const [lesson1MapMode, setLesson1MapMode] = useState<Lesson1MapMode>('sheng');
  const [lesson1Challenge, setLesson1Challenge] = useState(LESSON1_CHALLENGES[0]);
  const [lesson1ChallengeFeedback, setLesson1ChallengeFeedback] = useState<string | null>(null);
  const [lesson1CollectedElements, setLesson1CollectedElements] = useState<Lesson1ElementName[]>([]);
  const [lesson6SelectedBranch, setLesson6SelectedBranch] = useState('子');
  const [questionRecords, setQuestionRecords] = useState<Record<string, LessonQuestionRecord>>({});
  const recordedQuestionKeysRef = useRef<Set<string>>(new Set());

  const lesson1Elements = useMemo(
    () =>
      LESSON1_ELEMENT_ORDER
        .map((name) => mockElements.find((el) => el.name_cn === name))
        .filter((el): el is (typeof mockElements)[number] => Boolean(el)),
    []
  );

  const rollLesson1Challenge = React.useCallback(() => {
    const next = LESSON1_CHALLENGES[Math.floor(Math.random() * LESSON1_CHALLENGES.length)];
    setLesson1Challenge(next);
    setLesson1ChallengeFeedback(null);
  }, []);

  const currentStep = steps[currentStepIndex];
  useEffect(() => {
    if (lessonId !== 6) return;
    const initialByStep: Record<number, string> = { 2: '子', 3: '寅', 4: '辰', 41: '子' };
    const nextBranch = initialByStep[currentStep?.id ?? 0];
    if (nextBranch) setLesson6SelectedBranch(nextBranch);
  }, [lessonId, currentStep?.id]);
  const currentQuestionKey = isScoredLessonStep(currentStep) ? getLessonQuestionKey(currentStep) : null;
  const currentQuestionRecord = currentQuestionKey ? questionRecords[currentQuestionKey] : undefined;
  const score = useMemo(
    () => Math.min(totalQuestions, Object.values(questionRecords).filter((record) => record.isCorrect).length),
    [questionRecords, totalQuestions]
  );
  const lessonOneStage: LessonOneAtlasStage | null = lessonId === 1 && currentStep
    ? ({ 1: 'intro', 2: 'elements', 3: 'relations', 4: 'practice', 5: 'recap' } as Record<number, LessonOneAtlasStage>)[currentStep.id] ?? null
    : null;
  // The archival atlas chrome is now shared by every course; `lessonOneStage` below still gates Lesson 1's bespoke interactive scenes.
  const isLessonOneAtlas = true;
  const lessonOneSectionLabel = lessonOneStage
    ? ({ intro: '課前定位', elements: '五行速覽', relations: '關係圖譜', practice: '導師帶做', recap: '重點回顧' } as Record<LessonOneAtlasStage, string>)[lessonOneStage]
    : '正式測驗';
  const lessonSectionLabel = lessonOneStage
    ? lessonOneSectionLabel
    : currentStep?.type === 'content'
    ? '研習內容'
    : currentStep?.type === 'cards'
    ? '概念索引'
    : currentStep?.type === 'mcq'
    ? '正式測驗'
    : currentStep?.type === 'truefalse'
    ? '判別練習'
    : '關係配對';
  const progress = steps.length ? ((currentStepIndex + 1) / steps.length) * 100 : 0;
  const canSkipToQuiz = firstQuizStepIndex > -1 && currentStepIndex < firstQuizStepIndex;
  const canNarrateCurrentStep = lessonId === NARRATED_LESSON_ID && currentStep?.type === 'content' && isNarrationSupported;
  const lessonAtlasActionClass = (tone: 'previous' | 'primary' | 'skip') =>
    `lesson-atlas-action lesson-atlas-action--${tone}`;

  const stopNarration = () => {
    if (narrationTimeoutRef.current !== null) {
      window.clearTimeout(narrationTimeoutRef.current);
      narrationTimeoutRef.current = null;
    }

    if (speechSynthesisRef.current) {
      speechSynthesisRef.current.cancel();
    }

    setIsNarrating(false);
  };

  const startNarration = () => {
    if (!canNarrateCurrentStep || currentStep?.type !== 'content' || !speechSynthesisRef.current) {
      return;
    }

    stopNarration();

    const utterance = new SpeechSynthesisUtterance(buildNarrationText(currentStep));
    utterance.lang = 'zh-HK';
    utterance.rate = 1;
    utterance.pitch = 1;
    utterance.onstart = () => setIsNarrating(true);
    utterance.onend = () => setIsNarrating(false);
    utterance.onerror = () => setIsNarrating(false);

    narrationTimeoutRef.current = window.setTimeout(() => {
      speechSynthesisRef.current?.speak(utterance);
      narrationTimeoutRef.current = null;
    }, 0);
  };

  const handleNarrationToggle = () => {
    if (!canNarrateCurrentStep) return;

    if (isNarrating) {
      stopNarration();
      return;
    }

    startNarration();
  };

  useEffect(() => {
    if (typeof window === 'undefined' || typeof SpeechSynthesisUtterance === 'undefined' || !("speechSynthesis" in window)) {
      setIsNarrationSupported(false);
      return;
    }

    speechSynthesisRef.current = window.speechSynthesis;
    setIsNarrationSupported(true);

    return () => {
      if (narrationTimeoutRef.current !== null) {
        window.clearTimeout(narrationTimeoutRef.current);
        narrationTimeoutRef.current = null;
      }

      window.speechSynthesis.cancel();
    };
  }, []);

  useEffect(() => {
    setQuestionRecords({});
    recordedQuestionKeysRef.current.clear();
    setFinished(false);
  }, [lessonId]);

  useEffect(() => {
    setSelectedAnswer(currentQuestionRecord?.selectedAnswer ?? null);
    setAnswered(Boolean(currentQuestionRecord));
    setShowFeedback(Boolean(currentQuestionRecord && currentStep?.type !== 'match'));
    setSelectedLeft(null);
    setMatchedPairs(currentQuestionRecord?.matchedPairs ?? []);
    setMatchMessage(currentQuestionRecord?.isCorrect && currentStep?.type === 'match' ? '✓ 此題已記錄，可回看配對結果' : null);
    setShowHint(false);

    if (lessonId !== NARRATED_LESSON_ID || currentStep?.type !== 'content') {
      stopNarration();
    }
  }, [currentQuestionRecord, currentStep?.type, currentStepIndex, lessonId]);

  useEffect(() => {
    if (!canNarrateCurrentStep || currentStep?.type !== 'content') {
      stopNarration();
      return;
    }

    startNarration();

    return () => {
      stopNarration();
    };
  }, [canNarrateCurrentStep, currentStepIndex, lessonId]);

  useEffect(() => {
    if (lessonId !== 1) return;

    const defaultChallenge = LESSON1_CHALLENGES[0];
    setLesson1SelectedElement('木');
    setLesson1MapMode('sheng');
    setLesson1Challenge(defaultChallenge);
    setLesson1ChallengeFeedback(null);
    setLesson1CollectedElements([]);
  }, [lessonId]);

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

  if (!lesson) {
    return <div>課程未找到</div>;
  }

  if (isQuizLoading) {
    return (
      <div className="max-w-3xl mx-auto p-6 bg-white rounded-lg shadow-lg text-center">
        <h2 className="text-3xl font-bold mb-4">載入課程測驗中</h2>
        <p className="text-lg text-gray-600">正在從題庫載入本課測驗題目...</p>
      </div>
    );
  }

  const recordCurrentQuestionOnce = (record: LessonQuestionRecord) => {
    if (!isScoredLessonStep(currentStep)) return false;

    const questionKey = getLessonQuestionKey(currentStep);
    if (recordedQuestionKeysRef.current.has(questionKey)) return false;

    recordedQuestionKeysRef.current.add(questionKey);
    setQuestionRecords((previous) => ({ ...previous, [questionKey]: record }));
    onQuestionAnswered(lessonId, record.isCorrect);
    return true;
  };

  const handleCheck = () => {
    if (!currentStep) return;
    if (currentStep.type !== 'mcq' && currentStep.type !== 'truefalse') return;
    if (selectedAnswer === null || answered) return;

    setAnswered(true);
    setShowFeedback(true);

    let isCorrect = false;

    // For MCQ: check if selectedAnswer matches correct index
    if (currentStep.type === 'mcq' && selectedAnswer === currentStep.correct) isCorrect = true;
    
    // For true/false: selectedAnswer 1 = true, 0 = false
    if (currentStep.type === 'truefalse') {
      const userAnswerIsTrue = selectedAnswer === 1;
      if (userAnswerIsTrue === currentStep.correct) {
        isCorrect = true;
      }
    }

    recordCurrentQuestionOnce({ selectedAnswer, matchedPairs: [], isCorrect });
  };

  const handleUseHint = () => {
    const canOpenHint = lessonId === 0 || userXp >= 50;
    if (canOpenHint && !showHint) {
      setShowHint(true);
      if (lessonId !== 0) onUseHint();
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
      <div className="lesson-atlas-shell lesson-atlas-finish">
        <h2 className="text-5xl font-bold mb-4">課程完成！</h2>
        <p className="lesson-atlas-finish-copy text-xl mb-6">做得很好！你已完成此課程的所有步驟。</p>
        {totalQuestions > 0 && (
          <div className="lesson-atlas-score p-8 mb-6">
            <p className="text-5xl font-bold text-green-700 mb-2">{score} / {totalQuestions}</p>
            <p className="text-xl text-gray-700">答對題數</p>
          </div>
        )}
        <QuizActionButton
          label="返回主頁"
          onClick={() => onComplete(lessonId, score, totalQuestions)}
          fullWidth
          className={lessonAtlasActionClass('primary')}
        />
      </div>
    );
  }

  return (
    <div className="lesson-atlas-shell lesson-atlas-shell--course">
      {/* Header */}
      <div className="lesson-atlas-header">
        <div className="lesson-atlas-header-row">
          <div className="min-w-0 flex-1">
            <p className="lesson-atlas-kicker">{getLessonKicker(lessonId)}／{lessonSectionLabel}　<span>BAZI LEARNING ATLAS</span></p>
            <h1 className="lesson-atlas-title">
              {getDisplayLessonTitle(lesson.id, lesson.title_cn)}
            </h1>
            <p className="lesson-atlas-subtitle">{lessonId === 1 ? '用一張關係圖，讀懂五行的方向。' : lesson.title_en}</p>
          </div>
          <div className="lesson-atlas-header-actions">
            <QuizActionButton
              label="返回主頁"
              onClick={onExit}
              variant="secondary"
              size="compact"
              stretch={false}
              className={lessonAtlasActionClass('previous')}
            />
            <div className="lesson-atlas-step">
              <><span>{lessonSectionLabel}</span><b>{currentStepIndex + 1}/{steps.length}</b></>
            </div>
          </div>
        </div>
        <div className="lesson-atlas-progress">
          <div
            className="lesson-atlas-progress-fill"
            style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
          ></div>
        </div>
        {quizLoadError && (
          <div className="lesson-atlas-alert">
            {quizLoadError}
          </div>
        )}

        {lesson && currentStepIndex === 0 && lessonId !== 1 && (
          <LessonTemplate lesson={lesson as LessonWithBanks} />
        )}
      </div>

      {/* Step Content */}
      {lessonOneStage ? (
        <div className="lesson-atlas-stage">
          <LessonOneAtlas stage={lessonOneStage} />
        </div>
      ) : currentStep?.type === 'content' && (
        <div className="lesson-atlas-content-panel lesson-atlas-content mb-8">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h2 className="lesson-atlas-section-title lesson-atlas-content-title">{currentStep.title}</h2>
            {lessonId === NARRATED_LESSON_ID && (
              <button
                type="button"
                onClick={handleNarrationToggle}
                disabled={!isNarrationSupported}
                className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition-colors ${
                  isNarrationSupported
                    ? isNarrating
                      ? 'border-amber-300 bg-amber-50 text-amber-800 hover:bg-amber-100'
                      : 'border-blue-300 bg-blue-50 text-blue-800 hover:bg-blue-100'
                    : 'cursor-not-allowed border-gray-200 bg-gray-100 text-gray-400'
                }`}
                aria-label={isNarrating ? '停止語音播放' : '播放語音內容'}
              >
                <span aria-hidden="true">{isNarrating ? '■' : '▶'}</span>
                <span>{isNarrating ? '停止語音' : '播放語音'}</span>
              </button>
            )}
          </div>
          {lessonId === 5 && <TenGodsLessonGuide stepId={currentStep.id} />}
          {lessonId === 7 && <BranchRelationsGuide stepId={currentStep.id} />}
          {lessonId === 9 && <TiYongMomentumWorkbench stepId={currentStep.id} />}
          {lessonId === 10 && <DayunMomentumWorkbench stepId={currentStep.id} />}
          {!(lessonId === 6 && currentStep.id === 1) && currentStep.paragraphs?.map((text, idx) => (
            <p key={idx} className="lesson-atlas-body-copy lesson-atlas-copy">
              {text}
            </p>
          ))}

          {/* L6: Hidden stems intro visual map */}
          {lessonId === 6 && currentStep.id === 1 ? (() => {
            const INTRO_CARDS = [
              { title: '什麼是藏干', desc: '地支裡面藏著的天干能量', tone: 'bg-blue-50 border-blue-200 text-blue-700' },
              { title: '為什麼重要', desc: '不看藏干，容易誤判地支真實力量', tone: 'bg-amber-50 border-amber-200 text-amber-700' },
              { title: '用在哪裡', desc: '十神、旺衰、根氣都要回到藏干', tone: 'bg-emerald-50 border-emerald-200 text-emerald-700' },
            ] as const;

            const EXAMPLES = [
              { branch: '子', stems: '癸' },
              { branch: '寅', stems: '甲丙戊' },
              { branch: '丑', stems: '己癸辛' },
            ] as const;

            return (
              <div className="space-y-4">
                <div className="rounded-xl border border-indigo-200 bg-indigo-50 px-3 py-2 text-sm sm:text-base font-semibold text-indigo-800 text-center">
                  藏干 = 地支裡面藏著的天干能量
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {INTRO_CARDS.map((item) => (
                    <div key={item.title} className={`rounded-xl border p-3 ${item.tone}`}>
                      <p className="text-sm font-bold">{item.title}</p>
                      <p className="text-xs sm:text-sm mt-1">{item.desc}</p>
                    </div>
                  ))}
                </div>

                <div className="flex flex-col items-center justify-center gap-1.5 text-xs sm:flex-row sm:gap-2 sm:text-sm">
                  <span className="rounded-full border border-gray-200 bg-white px-2 py-1 font-semibold text-gray-700">地支（外在符號）</span>
                  <span className="text-gray-400 sm:hidden">↓</span><span className="hidden text-gray-400 sm:inline">→</span>
                  <span className="rounded-full border border-gray-200 bg-white px-2 py-1 font-semibold text-gray-700">藏干（內在結構）</span>
                  <span className="text-gray-400 sm:hidden">↓</span><span className="hidden text-gray-400 sm:inline">→</span>
                  <span className="rounded-full border border-gray-200 bg-white px-2 py-1 font-semibold text-gray-700">判讀結果</span>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  {EXAMPLES.map((e) => (
                    <div key={e.branch} className="rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-center">
                      <p className="text-xl font-bold text-gray-800">{e.branch}</p>
                      <p className="text-xs sm:text-sm font-semibold text-gray-700">{e.stems}</p>
                    </div>
                  ))}
                </div>

                <div className="rounded-xl border border-indigo-200 bg-indigo-50 px-3 py-2 text-sm sm:text-base font-semibold text-indigo-800 text-center">
                  看地支，先看表面；要判準，必看藏干
                </div>
              </div>
            );
          })() : lessonId === 0 && currentStep.id === 1 ? (() => {
            const PILLAR_MAP = [
              { key: '年柱', cue: '背景', icon: '年', tone: 'bg-slate-50 border-slate-200 text-slate-700' },
              { key: '月柱', cue: '主氣', icon: '月', tone: 'bg-blue-50 border-blue-200 text-blue-700' },
              { key: '日柱', cue: '自己', icon: '日', tone: 'bg-amber-50 border-amber-200 text-amber-700' },
              { key: '時柱', cue: '行動/結果', icon: '時', tone: 'bg-emerald-50 border-emerald-200 text-emerald-700' },
            ] as const;

            const READING_ORDER = [
              '1 日主',
              '2 月令',
              '3 其餘干支',
              '4 合沖刑害',
            ] as const;

            return (
              <div className="space-y-4">
                <div className="flex gap-2 overflow-x-auto pb-1 snap-x snap-mandatory">
                  {PILLAR_MAP.map((p) => (
                    <div key={p.key} className={`min-w-[112px] md:min-w-[138px] shrink-0 rounded-xl border p-2 md:p-3 snap-start ${p.tone}`}>
                      <p className="text-[11px] md:text-xs font-semibold opacity-80">{p.icon}</p>
                      <p className="text-xl md:text-2xl font-bold leading-none mt-1">{p.key}</p>
                      <p className="text-xs md:text-sm font-semibold mt-1.5 md:mt-2">{p.cue}</p>
                    </div>
                  ))}
                </div>

                <div className="rounded-xl border border-indigo-200 bg-indigo-50 px-3 py-2 text-sm sm:text-base font-semibold text-indigo-800 text-center">
                  年看背景，月看主氣，日看自己，時看行動與結果
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {READING_ORDER.map((item) => (
                    <div key={item} className="rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-center text-xs sm:text-sm font-medium text-gray-700">
                      {item}
                    </div>
                  ))}
                </div>
              </div>
            );
          })() : lessonId === 3 && currentStep.id >= 1 && currentStep.id <= 5 ? (
            <EarthlyBranchJourney stage={currentStep.id as 1 | 2 | 3 | 4 | 5} />
          ) : lessonId === 2 && currentStep.id === 2 ? (() => {
            const ELEMENT_ORDER = ['木', '火', '土', '金', '水'] as const;
            const grouped = ELEMENT_ORDER.map((el) => ({
              element: el,
              stems: mockHeavenlySteams.filter((s) => s.element === el),
              style: ELEMENT_STYLES[el] ?? { bg: 'bg-gray-50', text: 'text-gray-700', border: 'border-gray-200' },
            }));
            return (
              <div className="space-y-3">
                <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 xl:grid-cols-5">
                  {grouped.map(({ element, stems, style }) => (
                    <div key={element} className="flex flex-col gap-2">
                      <div className={`rounded-xl border ${style.border} ${style.bg} px-2 py-1.5 text-center shadow-sm`}>
                        <span className={`text-xs sm:text-base font-black tracking-[0.18em] ${style.text}`}>{element}</span>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        {stems.map((stem) => (
                          <div
                            key={stem.id}
                            className={`group relative overflow-hidden rounded-xl border ${style.border} ${style.bg} p-1.5 shadow-[0_8px_18px_rgba(15,23,42,0.05)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_12px_24px_rgba(15,23,42,0.08)]`}
                          >
                            <div className="absolute inset-0 bg-gradient-to-br from-white/70 via-transparent to-white/10" />
                            <div className="relative flex flex-col items-center gap-1">
                              <div className="flex w-full items-center justify-between gap-1">
                                <span className={`inline-flex items-center rounded-full border ${style.border} bg-white/70 px-1 py-0.5 text-[8px] font-bold ${style.text}`}>
                                  {stem.yin_yang === 'yang' ? '陽' : '陰'}
                                </span>
                                <span className="text-[8px] font-semibold uppercase tracking-[0.14em] text-gray-500">
                                  {stem.name_en}
                                </span>
                              </div>

                              <span className={`text-2xl font-black leading-none ${style.text}`}>{stem.name_cn}</span>

                              <div className={`rounded-full border ${style.border} bg-white/75 px-1.5 py-0.5`}>
                                <span className={`text-[9px] font-semibold ${style.text}`}>{stem.element}</span>
                              </div>

                              <div className="flex flex-wrap justify-center gap-1">
                                {stem.personality_traits.slice(0, 1).map((trait) => (
                                  <span key={trait} className="rounded-full bg-white/80 px-1.5 py-0.5 text-[8px] font-medium text-gray-700">
                                    {trait}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })() : lessonId === 1 && currentStep.id === 3 ? (() => {
              /* L1 id:3 — interactive 生剋 map + quick challenge */
              const circleSize = 320;
              const center = circleSize / 2;
              const nodeRadius = 22;
              const orbit = 110;
              const activeMap = LESSON1_RELATIONS[lesson1MapMode];
              const selectedTarget = activeMap[lesson1SelectedElement];
              const positions = LESSON1_ELEMENT_ORDER.map((element, idx) => {
                const angle = ((idx * 72 - 90) * Math.PI) / 180;
                return {
                  element,
                  x: Math.round(center + orbit * Math.cos(angle)),
                  y: Math.round(center + orbit * Math.sin(angle)),
                };
              });
              const selectedPos = positions.find((p) => p.element === lesson1SelectedElement);
              const targetPos = positions.find((p) => p.element === selectedTarget);

              const handleLesson1NodeClick = (element: Lesson1ElementName) => {
                setLesson1SelectedElement(element);
                setLesson1ChallengeFeedback(element === lesson1Challenge.answer ? '✓ 命中！' : '✗ 再試一次');
              };

              return (
                <div className="space-y-4">
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => setLesson1MapMode('sheng')}
                      className={`px-4 py-2 rounded-full border text-sm font-semibold transition-colors ${
                        lesson1MapMode === 'sheng'
                          ? 'bg-emerald-100 border-emerald-300 text-emerald-700'
                          : 'bg-white border-gray-200 text-gray-600 hover:bg-emerald-50'
                      }`}
                    >
                      生模式
                    </button>
                    <button
                      type="button"
                      onClick={() => setLesson1MapMode('ke')}
                      className={`px-4 py-2 rounded-full border text-sm font-semibold transition-colors ${
                        lesson1MapMode === 'ke'
                          ? 'bg-rose-100 border-rose-300 text-rose-700'
                          : 'bg-white border-gray-200 text-gray-600 hover:bg-rose-50'
                      }`}
                    >
                      剋模式
                    </button>
                    <button
                      type="button"
                      onClick={rollLesson1Challenge}
                      className="px-4 py-2 rounded-full border border-amber-300 bg-amber-50 text-amber-800 text-sm font-semibold hover:bg-amber-100 transition-colors"
                    >
                      換一題
                    </button>
                  </div>

                  <div className="rounded-2xl border border-gray-200 bg-gradient-to-br from-slate-50 to-white p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                      <p className="text-sm text-gray-600">挑戰：{lesson1Challenge.prompt}</p>
                      {lesson1ChallengeFeedback && (
                        <p className={`text-sm font-semibold ${lesson1ChallengeFeedback.startsWith('✓') ? 'text-green-700' : 'text-red-700'}`}>
                          {lesson1ChallengeFeedback}
                        </p>
                      )}
                    </div>

                    <div className="flex justify-center overflow-hidden">
                      <div className="relative aspect-square w-full max-w-[280px] sm:max-w-[320px]">
                        <svg className="absolute inset-0 w-full h-full" viewBox={`0 0 ${circleSize} ${circleSize}`}>
                          {positions.map((point) => {
                            const target = activeMap[point.element];
                            const targetPoint = positions.find((p) => p.element === target);
                            if (!targetPoint) return null;
                            const isActivePath = point.element === lesson1SelectedElement;
                            return (
                              <line
                                key={`${point.element}-${target}`}
                                x1={point.x}
                                y1={point.y}
                                x2={targetPoint.x}
                                y2={targetPoint.y}
                                stroke={lesson1MapMode === 'sheng' ? '#14b8a6' : '#f43f5e'}
                                strokeOpacity={isActivePath ? 0.95 : 0.32}
                                strokeWidth={isActivePath ? 3.5 : 2}
                                strokeDasharray={lesson1MapMode === 'ke' ? '7 4' : undefined}
                              />
                            );
                          })}
                          {selectedPos && targetPos && (
                            <line
                              x1={selectedPos.x}
                              y1={selectedPos.y}
                              x2={targetPos.x}
                              y2={targetPos.y}
                              stroke={lesson1MapMode === 'sheng' ? '#0f766e' : '#be123c'}
                              strokeWidth={4}
                            />
                          )}
                        </svg>

                        {positions.map((point) => {
                          const style = ELEMENT_STYLES[point.element] ?? ELEMENT_STYLES['木'];
                          const isSelected = point.element === lesson1SelectedElement;
                          return (
                            <button
                              key={point.element}
                              type="button"
                              onClick={() => handleLesson1NodeClick(point.element)}
                              className={`absolute -translate-x-1/2 -translate-y-1/2 rounded-full border-2 ${style.border} ${style.bg} ${style.text} font-bold transition-transform ${
                                isSelected ? 'scale-110 shadow-md' : 'hover:scale-105'
                              }`}
                              style={{ left: `${(point.x / circleSize) * 100}%`, top: `${(point.y / circleSize) * 100}%`, width: `${(nodeRadius * 2.4 / circleSize) * 100}%`, aspectRatio: '1 / 1' }}
                            >
                              {point.element}
                            </button>
                          );
                        })}

                        <div className="absolute -translate-x-1/2 -translate-y-1/2 rounded-xl border border-gray-300 bg-white px-4 py-3 text-center"
                          style={{ left: '50%', top: '50%' }}>
                          <p className="text-xs text-gray-500">目前聚焦</p>
                          <p className="text-2xl font-bold text-gray-700">{lesson1SelectedElement}</p>
                          <p className="text-xs text-gray-600 mt-1">
                            {lesson1MapMode === 'sheng' ? '生到' : '剋到'}：{selectedTarget}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })() : lessonId === 1 && currentStep.id === 4 ? (() => {
              /* L1 id:4 — emotion lane */
              return (
                <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
                  {lesson1Elements.map((element) => {
                    const style = ELEMENT_STYLES[element.name_cn] ?? ELEMENT_STYLES['木'];
                    return (
                      <div key={element.id} className={`rounded-xl border ${style.border} ${style.bg} p-3`}>
                        <p className={`text-2xl font-bold ${style.text}`}>{element.name_cn}</p>
                        <p className="text-xs text-gray-500">{element.name_en}</p>
                        <p className="mt-2 text-sm text-gray-700">情感：<span className="font-semibold">{element.emotion}</span></p>
                        <p className="mt-1 text-xs text-gray-600">{LESSON1_MEMORY_PHRASES[element.name_cn as Lesson1ElementName]}</p>
                      </div>
                    );
                  })}
                </div>
              );
            })() : lessonId === 1 && currentStep.id === 5 ? (() => {
              /* L1 id:5 — mastery board */
              const boardItems = [
                { label: '五行速覽', done: lesson1CollectedElements.length >= 5 },
                { label: '相生相剋圖', done: lesson1ChallengeFeedback?.startsWith('✓') ?? false },
                { label: '情感記憶', done: true },
              ];

              return (
                <div className="space-y-4">
                  <div className="rounded-2xl border border-indigo-200 bg-indigo-50 p-4">
                    <p className="text-sm text-indigo-800 font-semibold mb-3">Lesson 1 Mastery Board</p>
                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-3 sm:gap-3">
                      {boardItems.map((item) => (
                        <div key={item.label} className="rounded-xl border border-indigo-100 bg-white px-3 py-2 flex items-center gap-2">
                          <span className={`text-lg ${item.done ? 'text-green-600' : 'text-gray-300'}`}>{item.done ? '✓' : '○'}</span>
                          <span className="text-sm text-gray-700 font-medium">{item.label}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="grid grid-cols-5 gap-1.5 sm:gap-2">
                    {LESSON1_ELEMENT_ORDER.map((element) => {
                      const style = ELEMENT_STYLES[element] ?? ELEMENT_STYLES['木'];
                      const done = lesson1CollectedElements.includes(element);
                      return (
                    <div key={element} className={`rounded-lg border ${style.border} ${done ? style.bg : 'bg-gray-50'} px-1.5 py-2 text-center sm:px-3`}>
                          <p className={`text-xl font-bold ${done ? style.text : 'text-gray-400'}`}>{element}</p>
                      <p className="hidden text-[11px] text-gray-500 sm:block">{done ? '已解鎖' : '待探索'}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })() : lessonId === 4 && [2, 3, 4, 5].includes(currentStep.id) && currentStep.bullets ? (() => {
            /* L4 steps 2-5: seasonal solar terms 2×3 card grid */
            const SEASON_STYLES: Record<number, { bg: string; border: string; text: string; badge: string }> = {
              2: { bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-700', badge: 'bg-emerald-100' },
              3: { bg: 'bg-red-50',     border: 'border-red-200',     text: 'text-red-700',     badge: 'bg-red-100'     },
              4: { bg: 'bg-amber-50',   border: 'border-amber-200',   text: 'text-amber-700',   badge: 'bg-amber-100'   },
              5: { bg: 'bg-blue-50',    border: 'border-blue-200',    text: 'text-blue-700',    badge: 'bg-blue-100'    },
            };
            const s = SEASON_STYLES[currentStep.id];
            const parsed = (currentStep.bullets ?? []).map((b) => {
              const m = b.match(/^(.+?)（(.+?)）\s*-\s*(.+)$/);
              return m ? { name: m[1], date: m[2], desc: m[3] } : { name: b, date: '', desc: '' };
            });
            return (
              <div className="grid grid-cols-2 gap-3">
                {parsed.map((item, idx) => (
                  <div key={idx} className={`rounded-xl border ${s.border} ${s.bg} p-3 flex flex-col gap-1`}>
                    <span className={`text-xl font-bold ${s.text}`}>{item.name}</span>
                    <span className={`text-xs font-medium px-1.5 py-0.5 rounded self-start ${s.badge} ${s.text}`}>{item.date}</span>
                    <span className="text-xs text-gray-600 leading-snug mt-0.5">{item.desc}</span>
                  </div>
                ))}
              </div>
            );
          })() : lessonId === 4 && currentStep.id === 7 && currentStep.bullets ? (() => {
            /* L4 step 7: BaZi month ↔ solar term reference table */
            const ROW_STYLES = [
              'bg-emerald-50 text-emerald-700', 'bg-emerald-50 text-emerald-700', 'bg-emerald-50 text-emerald-700',
              'bg-red-50 text-red-700',          'bg-red-50 text-red-700',          'bg-red-50 text-red-700',
              'bg-amber-50 text-amber-700',      'bg-amber-50 text-amber-700',      'bg-amber-50 text-amber-700',
              'bg-blue-50 text-blue-700',        'bg-blue-50 text-blue-700',        'bg-blue-50 text-blue-700',
            ];
            const parsed = (currentStep.bullets ?? []).map((b) => {
              const m = b.match(/^(.+?)（(.+?)）：(.+?)（(.+?)）$/);
              return m ? { month: m[1], branch: m[2], terms: m[3], approx: m[4] } : { month: b, branch: '', terms: '', approx: '' };
            });
            return (
              <div>
              <div className="space-y-2 sm:hidden">
                {parsed.map((row, idx) => (
                  <article key={idx} className={`rounded-xl border p-3 ${ROW_STYLES[idx]}`}>
                    <div className="flex items-center justify-between gap-2"><strong>{row.month}・{row.branch}</strong><span className="text-xs font-semibold">約 {row.approx}</span></div>
                    <p className="mt-1 text-sm leading-6">節氣跨度：{row.terms}</p>
                  </article>
                ))}
              </div>
              <div className="hidden overflow-x-auto sm:block">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="bg-gray-100 text-gray-600">
                      <th className="text-left px-3 py-2 font-semibold border border-gray-200">月份</th>
                      <th className="text-left px-3 py-2 font-semibold border border-gray-200">地支</th>
                      <th className="text-left px-3 py-2 font-semibold border border-gray-200">節氣跨度</th>
                      <th className="text-left px-3 py-2 font-semibold border border-gray-200">約</th>
                    </tr>
                  </thead>
                  <tbody>
                    {parsed.map((row, idx) => (
                      <tr key={idx} className={`${ROW_STYLES[idx]} border-b border-gray-200`}>
                        <td className="px-3 py-2 font-semibold border border-gray-200 whitespace-nowrap">{row.month}</td>
                        <td className="px-3 py-2 font-bold border border-gray-200">{row.branch}</td>
                        <td className="px-3 py-2 border border-gray-200">{row.terms}</td>
                        <td className="px-3 py-2 border border-gray-200 whitespace-nowrap">{row.approx}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              </div>
            );
          })() : lessonId === 5 && currentStep.id === 25 && currentStep.bullets ? (() => {
            /* L5 id:25 — Five Ten-God families, 5 color-coded cards */
            const FAMILY_META = [
              { label: '印星', pair: '正印／偏印', color: 'bg-purple-50 border-purple-200 text-purple-700 badge-purple' },
              { label: '比劫', pair: '比肩／劫財', color: 'bg-blue-50   border-blue-200   text-blue-700   badge-blue'   },
              { label: '食傷', pair: '食神／傷官', color: 'bg-emerald-50 border-emerald-200 text-emerald-700 badge-emerald' },
              { label: '財星', pair: '正財／偏財', color: 'bg-amber-50  border-amber-200  text-amber-700  badge-amber'  },
              { label: '官殺', pair: '正官／七殺', color: 'bg-red-50    border-red-200    text-red-700    badge-red'    },
            ];
            const BADGE_BG: Record<string, string> = {
              'badge-purple': 'bg-purple-100', 'badge-blue': 'bg-blue-100',
              'badge-emerald': 'bg-emerald-100', 'badge-amber': 'bg-amber-100', 'badge-red': 'bg-red-100',
            };
            const bullets = currentStep.bullets ?? [];
            return (
              <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
                {FAMILY_META.map((fam, idx) => {
                  const [, keywordPart = ''] = (bullets[idx] ?? '').split(/[：:]/);
                  const kwStr = keywordPart.replace(/。$/, '');
                  const kws = kwStr.split('、').map(k => k.trim()).filter(Boolean);
                  const [bgClass, borderClass, textClass, badgeKey] = fam.color.split(' ');
                  const badgeBg = BADGE_BG[badgeKey] ?? 'bg-gray-100';
                  return (
                    <div key={fam.label} className={`rounded-xl border ${borderClass} ${bgClass} p-3 flex flex-col gap-2`}>
                      <span className={`text-xl font-bold ${textClass}`}>{fam.label}</span>
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full self-start ${badgeBg} ${textClass}`}>{fam.pair}</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {kws.map((kw) => (
                          <span key={kw} className={`text-xs px-1.5 py-0.5 rounded ${badgeBg} ${textClass}`}>{kw}</span>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })() : lessonId === 5 && currentStep.id === 3 && currentStep.bullets ? (() => {
            /* L5 id:3 — 十神判定規則: 2-step header + 5-row lookup table */
            const ROWS = [
              { rel: '同我', yang: '比肩', yin: '劫財' },
              { rel: '我生', yang: '食神', yin: '傷官' },
              { rel: '我剋', yang: '偏財', yin: '正財' },
              { rel: '剋我', yang: '七殺', yin: '正官' },
              { rel: '生我', yang: '偏印', yin: '正印' },
            ];
            return (
              <div className="flex flex-col gap-4">
                <div className="flex flex-col sm:flex-row gap-2">
                  {['第1步：確認五行關係（同我、我生、我剋、剋我、生我）', '第2步：看陰陽同異定正偏（同→偏/比肩，異→正/劫財）'].map((s, i) => (
                    <div key={i} className="flex items-start gap-2 flex-1 bg-blue-50 border border-blue-200 rounded-xl px-3 py-2">
                      <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center">{i + 1}</span>
                      <span className="text-sm text-blue-800">{s.replace(/^第\d步：/, '')}</span>
                    </div>
                  ))}
                </div>
                <div className="space-y-2 sm:hidden">
                  {ROWS.map((row) => (
                    <article key={row.rel} className="rounded-xl border border-gray-200 bg-gray-50 p-3">
                      <p className="font-bold text-gray-700">{row.rel}</p>
                      <div className="mt-2 grid grid-cols-2 gap-2 text-sm"><span className="rounded-lg bg-indigo-50 px-2 py-1.5 font-bold text-indigo-700">同陰陽・{row.yang}</span><span className="rounded-lg bg-rose-50 px-2 py-1.5 font-bold text-rose-700">異陰陽・{row.yin}</span></div>
                    </article>
                  ))}
                </div>
                <div className="hidden overflow-x-auto sm:block">
                  <table className="w-full text-sm border-collapse">
                    <thead>
                      <tr className="bg-gray-100 text-gray-600">
                        <th className="px-3 py-2 text-left font-semibold border border-gray-200">五行關係</th>
                        <th className="px-3 py-2 text-left font-semibold border border-gray-200">同陰陽</th>
                        <th className="px-3 py-2 text-left font-semibold border border-gray-200">異陰陽</th>
                      </tr>
                    </thead>
                    <tbody>
                      {ROWS.map((row) => (
                        <tr key={row.rel} className="border-b border-gray-200 even:bg-gray-50">
                          <td className="px-3 py-2 font-semibold border border-gray-200 text-gray-700">{row.rel}</td>
                          <td className="px-3 py-2 font-bold border border-gray-200 text-indigo-700">{row.yang}</td>
                          <td className="px-3 py-2 font-bold border border-gray-200 text-rose-700">{row.yin}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })() : lessonId === 5 && currentStep.id === 45 && currentStep.bullets ? (() => {
            /* L5 id:45 — 實戰流程: vertical numbered stepper */
            const bullets = currentStep.bullets ?? [];
            return (
              <div className="flex flex-col gap-0">
                {bullets.map((b, idx) => {
                  const m = b.match(/^第\d步：(.+?)。(.*)$/);
                  const label = m ? m[1] : b.replace(/^第\d步：/, '');
                  const desc  = m ? m[2].trim() : '';
                  const isLast = idx === bullets.length - 1;
                  return (
                    <div key={idx} className="flex gap-3">
                      <div className="flex flex-col items-center">
                        <div className="w-8 h-8 rounded-full bg-blue-600 text-white text-sm font-bold flex items-center justify-center flex-shrink-0">{idx + 1}</div>
                        {!isLast && <div className="w-0.5 bg-blue-200 flex-1 my-1" />}
                      </div>
                      <div className={`pb-4 ${isLast ? '' : ''}`}>
                        <p className="font-semibold text-gray-800">{label}</p>
                        {desc && <p className="text-sm text-gray-600 mt-0.5">{desc}</p>}
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })() : lessonId === 5 && currentStep.id === 46 && currentStep.bullets ? (() => {
            /* L5 id:46 — 十神互動: 2×2 tiles */
            const TILE_META = [
              { tone: 'bg-emerald-50 border-emerald-200 text-emerald-700' },
              { tone: 'bg-emerald-50 border-emerald-200 text-emerald-700' },
              { tone: 'bg-red-50 border-red-200 text-red-700' },
              { tone: 'bg-red-50 border-red-200 text-red-700' },
            ];
            const bullets = currentStep.bullets ?? [];
            return (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {bullets.map((b, idx) => {
                  const colonIdx = b.indexOf('：');
                  const name = colonIdx > -1 ? b.slice(0, colonIdx) : b;
                  const outcome = colonIdx > -1 ? b.slice(colonIdx + 1) : '';
                  const { tone } = TILE_META[idx] ?? { tone: 'bg-gray-50 border-gray-200 text-gray-700' };
                  const [bgClass, borderClass, textClass] = tone.split(' ');
                  return (
                    <div key={idx} className={`rounded-xl border ${borderClass} ${bgClass} p-4`}>
                      <p className={`font-bold text-base ${textClass}`}>{name}</p>
                      {outcome && <p className="text-sm text-gray-600 mt-1">{outcome}</p>}
                    </div>
                  );
                })}
              </div>
            );
          })() : lessonId === 5 && currentStep.id === 5 && currentStep.bullets ? (() => {
            /* L5 id:5 — 透干有根: 2×2 quadrant */
            const QUAD = [
              { label: '有透有根', desc: '外顯且站得住，通常最穩', bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-700', badge: 'bg-emerald-100' },
              { label: '有透無根', desc: '看得見，但續航未必足',   bg: 'bg-amber-50',   border: 'border-amber-200',   text: 'text-amber-700',   badge: 'bg-amber-100'   },
              { label: '無透有根', desc: '內在有力，但不一定直接外顯', bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700', badge: 'bg-blue-100' },
              { label: '無透無根', desc: '有名無勢，不能放大解讀', bg: 'bg-gray-50',    border: 'border-gray-200',   text: 'text-gray-500',   badge: 'bg-gray-100'  },
            ];
            return (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {QUAD.map((q) => (
                  <div key={q.label} className={`rounded-xl border ${q.border} ${q.bg} p-4 flex flex-col gap-2`}>
                    <span className={`text-sm font-bold px-2 py-0.5 rounded-full self-start ${q.badge} ${q.text}`}>{q.label}</span>
                    <p className="text-sm text-gray-700">{q.desc}</p>
                  </div>
                ))}
              </div>
            );
          })() : lessonId === 5 && currentStep.id === 71 && currentStep.bullets ? (() => {
            /* L5 id:71 — 體用分層: 3-tier ladder */
            const TIERS = [
              { label: '本命層',     indent: 'ml-0',   size: 'text-base', bg: 'bg-indigo-50',  border: 'border-indigo-200',  text: 'text-indigo-700'  },
              { label: '大運流年層', indent: 'ml-2 sm:ml-4',   size: 'text-sm',   bg: 'bg-purple-50',  border: 'border-purple-200',  text: 'text-purple-700'  },
              { label: '流月流日層', indent: 'ml-4 sm:ml-8',   size: 'text-xs',   bg: 'bg-pink-50',    border: 'border-pink-200',    text: 'text-pink-700'    },
            ];
            const bullets = currentStep.bullets ?? [];
            return (
              <div className="flex flex-col gap-2">
                {TIERS.map((tier, idx) => {
                  const b = bullets[idx] ?? '';
                  const desc = b.replace(/^.+?：/, '');
                  return (
                    <div key={tier.label} className={`${tier.indent} rounded-xl border ${tier.border} ${tier.bg} px-4 py-3 flex items-start gap-3`}>
                      <span className={`font-bold whitespace-nowrap ${tier.text} ${tier.size}`}>{tier.label}</span>
                      <span className={`text-gray-600 ${tier.size}`}>{desc}</span>
                    </div>
                  );
                })}
                {bullets[3] && <p className="text-sm text-gray-500 mt-1 ml-1">⚠ {bullets[3].replace(/^.+?：/, '')}</p>}
              </div>
            );
          })() : lessonId === 6 && [2, 3, 4, 41].includes(currentStep.id) && currentStep.bullets ? (() => {
            /* L6 id:2,3,4,41 — Tiered stem cards for memory groups + combined overview */
            const STEM_ELEMENT_MAP: Record<string, string> = {
              '甲': '木', '乙': '木', '丙': '火', '丁': '火', '戊': '土', '己': '土', 
              '庚': '金', '辛': '金', '壬': '水', '癸': '水'
            };
            
            const getStemElement = (stemChar: string): string => {
              return STEM_ELEMENT_MAP[stemChar] || '';
            };
            
            const bullets = currentStep.bullets ?? [];
            const parsedCards = bullets.map((bullet) => {
              const branchMatch = bullet.match(/^(.)\s*支藏干：/);
              const branchName = branchMatch ? branchMatch[1] : '';

              const stemsMatch = bullet.match(/：([^（]+)(?:（|$)/);
              const stemsStr = stemsMatch ? stemsMatch[1] : '';
              const stemChars = stemsStr
                .split('、')
                .map((s) => s.trim())
                .filter((s) => s && /^[甲乙丙丁戊己庚辛壬癸]$/.test(s));

              const primaryMatch = bullet.match(/本氣[是]*\s*([甲乙丙丁戊己庚辛壬癸])/);
              const primary = primaryMatch ? primaryMatch[1] : (stemChars[0] || '');

              const primaryElement = getStemElement(primary);
              let primaryStyle = ELEMENT_STYLES[primaryElement];

              if (!primaryStyle) {
                const BRANCH_ELEMENT: Record<string, string> = {
                  '子': '水', '丑': '土', '寅': '木', '卯': '木', '辰': '土',
                  '巳': '火', '午': '火', '未': '土', '申': '金', '酉': '金',
                  '戌': '土', '亥': '水',
                };
                const branchElement = BRANCH_ELEMENT[branchName] || '木';
                primaryStyle = ELEMENT_STYLES[branchElement];
              }

              return {
                bullet,
                branchName,
                stemChars,
                primary,
                primaryStyle,
              };
            });

            const COMBINED_SEASON_BOXES = [
              { name: '春季(木旺)', color: 'text-green-700', bg: 'bg-green-50', border: 'border-green-200' },
              { name: '夏季(火旺)', color: 'text-red-700', bg: 'bg-red-50', border: 'border-red-200' },
              { name: '秋季(金旺)', color: 'text-slate-600', bg: 'bg-slate-50', border: 'border-slate-200' },
              { name: '冬季(水旺)', color: 'text-blue-700', bg: 'bg-blue-50', border: 'border-blue-200' },
            ];

            const isCombinedOverview = currentStep.id === 41;

            return (
              <div className="space-y-4">
                <div className="space-y-3 sm:hidden">
                  <EarthlyBranchRing
                    showStems={true}
                    showSeasons={true}
                    compactOnMobile
                    title={isCombinedOverview ? '十二地支綜合定位環' : '本步地支聚焦環'}
                    highlightedBranches={isCombinedOverview ? [] : parsedCards.map((item) => item.branchName)}
                    selectedBranch={lesson6SelectedBranch}
                    onBranchSelect={setLesson6SelectedBranch}
                  />
                  {!isCombinedOverview && (
                    <div className="rounded-xl border border-slate-200 bg-white p-3">
                      <p className="text-xs font-bold tracking-[0.1em] text-slate-500">本步四支索引・點一下同步聚焦鐘面</p>
                      <div className="mt-2 grid grid-cols-2 gap-2">
                        {parsedCards.map((item) => {
                          const active = lesson6SelectedBranch === item.branchName;
                          return <button key={`l6-index-${item.branchName}`} type="button" onClick={() => setLesson6SelectedBranch(item.branchName)} className={`rounded-lg border px-2.5 py-2 text-left transition-colors ${active ? `${item.primaryStyle.border} ${item.primaryStyle.bg} shadow-sm` : 'border-slate-200 bg-slate-50'}`}><span className={`text-lg font-black ${item.primaryStyle.text}`}>{item.branchName}</span><span className="ml-1.5 text-xs font-semibold text-slate-600">本氣・{item.primary}</span></button>;
                        })}
                      </div>
                    </div>
                  )}
                  <details className="rounded-xl border border-slate-200 bg-white px-3 py-2">
                    <summary className="cursor-pointer text-sm font-bold text-slate-700">展開完整藏干參考表</summary>
                    <div className="mt-3 grid grid-cols-2 gap-2">
                      {parsedCards.map((item) => <div key={`l6-reference-${item.branchName}`} className={`rounded-lg border ${item.primaryStyle.border} ${item.primaryStyle.bg} p-2 text-center`}><p className={`text-lg font-black ${item.primaryStyle.text}`}>{item.branchName}</p><p className={`mt-1 text-sm font-bold ${item.primaryStyle.text}`}>{item.stemChars.join('・')}</p></div>)}
                    </div>
                  </details>
                </div>
                <div className="hidden sm:block">
                {isCombinedOverview ? (
                  <div className="space-y-1">
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-6 lg:grid-cols-12 lg:gap-1">
                      {parsedCards.map((item, idx) => {
                        const { branchName, stemChars, primary, primaryStyle } = item;
                        return (
                        <div key={idx} className={`rounded-lg border-2 ${primaryStyle.border} ${primaryStyle.bg} p-1.5 space-y-1 sm:p-1`}>
                          {/* Branch name - large */}
                          <div className={`text-lg font-bold ${primaryStyle.text} text-center sm:text-xl`}>{branchName}</div>
                          {/* Primary stem - emphasized with label */}
                          <div className={`text-sm font-bold ${primaryStyle.text} text-center`}>
                            {primary}
                          </div>
                          {/* Secondary & tertiary if present */}
                          {stemChars.length > 1 && (
                            <div className="text-center space-y-1">
                              {stemChars.slice(1).map((stem, i) => {
                                const el = getStemElement(stem);
                                const style = ELEMENT_STYLES[el];
                                return (
                                  <div key={i} className={`text-xs ${style ? style.text : 'text-gray-500'} font-semibold`}>
                                    {stem}
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })}
                    </div>

                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                      {COMBINED_SEASON_BOXES.map((season) => (
                        <div key={season.name} className={`rounded-lg border ${season.border} ${season.bg} px-2 py-1.5 text-center`}>
                          <p className={`text-xs sm:text-sm font-bold ${season.color}`}>{season.name}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-[48px_minmax(0,1fr)] sm:grid-cols-[56px_minmax(0,1fr)] items-start gap-2">
                    <div className="pt-2 md:pt-3">
                      <div className="grid grid-rows-[40px_28px_28px_28px] items-center text-[11px] sm:text-sm md:text-base font-semibold text-gray-400">
                        <span aria-hidden="true" />
                        <span>本氣</span>
                        <span>中氣</span>
                        <span>餘氣</span>
                      </div>
                    </div>

                    <div>
                      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 md:gap-3">
                        {parsedCards.map((item, idx) => {
                          const { branchName, stemChars, primary, primaryStyle } = item;
                          return (
                          <div key={idx} className={`rounded-lg border-2 ${primaryStyle.border} ${primaryStyle.bg} p-2 md:p-3 h-full`}>
                            <div className="grid grid-rows-[40px_28px_28px_28px] items-center text-center">
                              <div className={`text-2xl md:text-3xl font-bold ${primaryStyle.text}`}>{branchName}</div>

                              <div className={`text-base md:text-xl font-bold ${primaryStyle.text}`}>
                                {primary}
                              </div>

                              {([0, 1] as const).map((rowIdx) => {
                                const stem = stemChars[rowIdx + 1] ?? '';
                                const el = stem ? getStemElement(stem) : '';
                                const style = el ? ELEMENT_STYLES[el] : undefined;
                                return (
                                  <div key={rowIdx} className={`text-sm md:text-base font-semibold ${stem ? (style ? style.text : 'text-gray-500') : 'text-transparent'}`}>
                                    {stem || '・'}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                      </div>
                    </div>
                  </div>
                )}
                </div>

                <div className="hidden sm:block">
                {lessonId === 6 && currentStep.id === 2 && (
                    <EarthlyBranchRing
                      showStems={true}
                      highlightedBranches={['子', '午', '卯', '酉']}
                      showSeasons={true}
                      compactOnMobile
                      title="十二地支四季參考環（四專純）"
                  />
                )}

                {lessonId === 6 && currentStep.id === 3 && (
                    <EarthlyBranchRing
                      showStems={true}
                      highlightedBranches={['寅', '申', '巳', '亥']}
                      showSeasons={true}
                      compactOnMobile
                      title="十二地支四季參考環（四長生）"
                  />
                )}

                {lessonId === 6 && currentStep.id === 4 && (
                    <EarthlyBranchRing
                      showStems={true}
                      highlightedBranches={['辰', '戌', '丑', '未']}
                      showSeasons={true}
                      compactOnMobile
                      title="十二地支四季參考環（四墓庫）"
                  />
                )}

                {lessonId === 6 && currentStep.id === 41 && (
                    <EarthlyBranchRing
                      showStems={true}
                      showSeasons={true}
                      showTrinityLines={true}
                      showTrinityLegend={true}
                      compactOnMobile
                      title="十二地支四季參考環（綜合總覽）"
                  />
                )}
                </div>
              </div>
            );
          })() : lessonId === 6 && currentStep.id === 5 && currentStep.bullets ? (() => {
            /* L6 id:5 — Hierarchy ladder: 本氣 > 中氣 > 餘氣 */
            const HIERARCHY = [
              { label: '本氣',  width: 'w-full',   color: 'from-emerald-600 to-emerald-500' },
              { label: '中氣',  width: 'w-5/6',   color: 'from-emerald-500 to-emerald-400' },
              { label: '餘氣',  width: 'w-4/6',   color: 'from-emerald-400 to-emerald-300' },
            ];
            const bullets = currentStep.bullets ?? [];
            return (
              <div className="space-y-4">
                {HIERARCHY.map((tier, idx) => {
                  const desc = bullets[idx]?.split('：')[1] || '';
                  return (
                    <div key={tier.label} className={`${tier.width} mx-auto`}>
                      <div className={`bg-gradient-to-r ${tier.color} rounded-lg px-5 py-3 text-white flex items-center gap-3 shadow-md`}>
                        <span className="font-bold whitespace-nowrap text-lg">{tier.label}</span>
                        <span className="text-sm flex-1">{desc}</span>
                      </div>
                    </div>
                  );
                })}
                {bullets[3] && (
                  <div className="bg-blue-50 border-2 border-blue-200 rounded-lg px-5 py-3 text-blue-700 font-semibold text-sm mt-4">
                    <strong>💡 {bullets[3].split('：')[1] || bullets[3]}</strong>
                  </div>
                )}
              </div>
            );
          })() : lessonId === 7 && currentStep.id === 2 && currentStep.bullets ? (() => {
            /* L7 id:2 — 三合局: one clock, all four formations listed directly above it */
            const bullets = currentStep.bullets ?? [];
            const trinityGroups = [
              { id: 'fire', label: '寅午戌・火局', branches: ['寅', '午', '戌'], color: '#ef4444' },
              { id: 'water', label: '申子辰・水局', branches: ['申', '子', '辰'], color: '#3b82f6' },
              { id: 'wood', label: '亥卯未・木局', branches: ['亥', '卯', '未'], color: '#16a34a' },
              { id: 'metal', label: '巳酉丑・金局', branches: ['巳', '酉', '丑'], color: '#64748b' },
            ].map((group, index) => ({ ...group, note: (bullets[index] ?? '').replace(/^.+? - /, '') || `${group.label}的三點成局。` }));
            return (
              <EarthlyBranchRing compactOnMobile mobileDetailMode="branch-basics" showSeasons title="三合局・在地支時鐘上看三點成局" relationshipLabel="三合圖層" relationshipGroups={trinityGroups} />
            );
          })() : lessonId === 7 && currentStep.id === 3 && currentStep.bullets ? (() => {
            /* L7 id:3 — 六合: all six pairings live in the common clock selector */
            const bullets = currentStep.bullets ?? [];
            const harmonyColors: Record<string, string> = { 土: '#d97706', 木: '#16a34a', 火: '#ef4444', 金: '#64748b', 水: '#3b82f6' };
            const harmonyGroups = bullets.flatMap((bullet, index) => {
              const match = bullet.match(/^(.)(.)\s*合([木火土金水])/);
              if (!match) return [];
              const [, first, second, element] = match;
              return [{ id: `harmony-${index}`, label: `${first}${second}・${element}`, branches: [first, second], color: harmonyColors[element], note: bullet.replace(/^.+? - /, '').replace(/^.+?合，/, '') || `${first}${second}合${element}。` }];
            });
            return (
              <EarthlyBranchRing compactOnMobile mobileDetailMode="branch-basics" showSeasons title="六合・在地支時鐘上辨兩支相合" relationshipLabel="六合圖層" relationshipGroups={harmonyGroups} />
            );
          })() : lessonId === 7 && currentStep.id === 4 && currentStep.bullets ? (() => {
            /* L7 id:4 — 六沖: zodiac clock */
            const BRANCH_EL: Record<string, string> = {
              '子':'水','丑':'土','寅':'木','卯':'木','辰':'土','巳':'火',
              '午':'火','未':'土','申':'金','酉':'金','戌':'土','亥':'水',
            };
            const clashColors = ['#a855f7', '#0891b2', '#16a34a', '#f97316', '#e11d48', '#6366f1'];
            // parse pair descriptions from bullets for the legend
            const bullets = currentStep.bullets ?? [];
            const pairs: { b1: string; b2: string; desc: string; el1: string; el2: string }[] = [];
            bullets.forEach(bullet => {
              const m = bullet.match(/^(.)(.)\s*沖/);
              const em = bullet.match(/（([木火土金水])([木火土金水])沖）/);
              if (!m) return;
              pairs.push({ b1: m[1], b2: m[2], desc: bullet.replace(/^.*?[，,]/, '').trim(),
                el1: em ? em[1] : BRANCH_EL[m[1]] ?? '', el2: em ? em[2] : BRANCH_EL[m[2]] ?? '' });
            });
            return (
              <EarthlyBranchRing compactOnMobile mobileDetailMode="branch-basics" showSeasons title="六沖・在地支時鐘上辨對向兩支" relationshipLabel="六沖圖層" relationshipGroups={pairs.map((pair, index) => ({ id: `clash-${index}`, label: `${pair.b1}${pair.b2}沖`, branches: [pair.b1, pair.b2], color: clashColors[index] ?? '#64748b', note: pair.desc || `${pair.b1}${pair.b2}相沖。` }))} />
            );
          })() : lessonId === 7 && currentStep.id === 9 && currentStep.bullets ? (() => {
            /* L7 id:9 — Relationship reading cards, not a deterministic strength ranking */
            const SPECTRUM = [
              { label: '合', tone: 'border-emerald-200 bg-emerald-50 text-emerald-800', desc: '提示聚合與連動；仍要看是否有條件成局。' },
              { label: '沖', tone: 'border-rose-200 bg-rose-50 text-rose-800', desc: '提示明顯動象；先定位對沖落在哪一柱。' },
              { label: '刑', tone: 'border-orange-200 bg-orange-50 text-orange-800', desc: '提示反覆摩擦；需看組合、位置與場景。' },
              { label: '破', tone: 'border-amber-200 bg-amber-50 text-amber-800', desc: '提示結構鬆動或耗損，常作輔助判斷。' },
              { label: '害', tone: 'border-slate-200 bg-slate-50 text-slate-700', desc: '提示隱性阻礙或消耗；不可脫離全局定論。' },
            ];
            return (
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {SPECTRUM.map((item) => (
                  <div key={item.label} className={`rounded-xl border p-3 ${item.tone}`}>
                    <div className="flex items-start gap-3">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/80 text-lg font-black">{item.label}</span>
                      <p className="text-sm leading-6">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            );
          })() : lessonId === 7 && currentStep.id === 11 && currentStep.bullets ? (() => {
            /* L7 id:11 — Priority rules stepper */
            const bullets = currentStep.bullets ?? [];
            const STEP_COLORS = [
              { circle: 'bg-blue-600',   border: 'border-blue-200',   bg: 'bg-blue-50',   text: 'text-blue-700'   },
              { circle: 'bg-indigo-600', border: 'border-indigo-200', bg: 'bg-indigo-50', text: 'text-indigo-700' },
              { circle: 'bg-violet-600', border: 'border-violet-200', bg: 'bg-violet-50', text: 'text-violet-700' },
              { circle: 'bg-purple-600', border: 'border-purple-200', bg: 'bg-purple-50', text: 'text-purple-700' },
              { circle: 'bg-fuchsia-600',border: 'border-fuchsia-200',bg: 'bg-fuchsia-50',text: 'text-fuchsia-700'},
            ];
            // Collect main steps (第X步) and sub-bullets
            const mainSteps: { num: string; title: string; subs: string[] }[] = [];
            let recallLine = '';
            bullets.forEach((b) => {
              const stepMatch = b.match(/^第(\d+)步(.+)/);
              if (stepMatch) {
                mainSteps.push({ num: stepMatch[1], title: stepMatch[2].replace(/^[：:]\s*/, ''), subs: [] });
              } else if (b.startsWith('速記')) {
                recallLine = b.replace(/^速記[：:]\s*/, '');
              } else if (mainSteps.length > 0 && !b.startsWith('合化條件') && !b.startsWith('判斷口訣') && !b.startsWith('如何判斷') && !b.startsWith('實戰小例')) {
                // skip
              } else if (mainSteps.length > 0) {
                mainSteps[mainSteps.length - 1].subs.push(b);
              }
            });
            return (
              <div className="space-y-2">
                {mainSteps.map((step, idx) => {
                  const c = STEP_COLORS[idx] || STEP_COLORS[0];
                  return (
                    <div key={idx} className="flex gap-3 items-start">
                      <div className="flex flex-col items-center">
                        <div className={`w-8 h-8 rounded-full ${c.circle} text-white flex items-center justify-center font-bold text-sm shrink-0`}>
                          {step.num}
                        </div>
                        {idx < mainSteps.length - 1 && <div className="w-0.5 h-4 bg-gray-200 mt-1" />}
                      </div>
                      <div className={`flex-1 rounded-xl border ${c.border} ${c.bg} px-4 py-2 mb-1`}>
                        <p className={`font-semibold text-sm ${c.text}`}>{step.title}</p>
                      </div>
                    </div>
                  );
                })}
                {recallLine && (
                  <div className="mt-2 bg-gray-800 text-white rounded-xl px-4 py-3 text-sm font-medium">
                    🔖 速記：{recallLine}
                  </div>
                )}
              </div>
            );
          })() : currentStep.bullets ? (
            <ul className="lesson-atlas-copy lesson-atlas-list">
              {currentStep.bullets.map((item, idx) => (
                <li key={idx}>{item}</li>
              ))}
            </ul>
          ) : null}
        </div>
      )}

      {!lessonOneStage && currentStep?.type === 'cards' && (
        <div className="lesson-atlas-content">
          <h2 className="lesson-atlas-content-title">{currentStep.title}</h2>
          {currentStep.description && (
            <p className="lesson-atlas-copy">{currentStep.description}</p>
          )}
          {lessonId === 1 && currentStep.source === 'elements' && (
            <div className="space-y-4">
              <div className="grid grid-cols-5 gap-2 md:gap-3">
                {lesson1Elements.map((element) => {
                  const style = ELEMENT_STYLES[element.name_cn] ?? ELEMENT_STYLES['木'];
                  const isSelected = lesson1SelectedElement === element.name_cn;

                  return (
                    <button
                      key={element.id}
                      type="button"
                      onClick={() => {
                        const name = element.name_cn as Lesson1ElementName;
                        setLesson1SelectedElement(name);
                        setLesson1CollectedElements((prev) => (prev.includes(name) ? prev : [...prev, name]));
                      }}
                      className={`rounded-xl border-2 ${style.border} ${style.bg} px-3 py-4 text-left transition-all ${
                        isSelected ? 'ring-2 ring-offset-2 ring-blue-300 shadow-md' : 'hover:shadow-md'
                      }`}
                    >
                      <p className={`text-3xl font-bold ${style.text}`}>{element.name_cn}</p>
                      <p className="text-xs text-gray-500">{element.name_en}</p>
                      <p className={`mt-1 text-sm font-semibold ${style.text}`}>{element.direction}/{element.season}/{LESSON1_VIRTUES[element.name_cn as Lesson1ElementName]}</p>
                    </button>
                  );
                })}
              </div>

              <div className="rounded-2xl border border-gray-200 bg-white p-4">
                {lesson1Elements
                  .filter((element) => element.name_cn === lesson1SelectedElement)
                  .map((element) => {
                    const style = ELEMENT_STYLES[element.name_cn] ?? ELEMENT_STYLES['木'];
                    return (
                      <div key={element.id} className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                        <div className={`rounded-xl border ${style.border} ${style.bg} p-3 sm:col-span-1`}>
                          <p className={`text-4xl font-bold ${style.text}`}>{element.name_cn}</p>
                          <p className="text-sm text-gray-500">{element.name_en}</p>
                        </div>
                        <div className="sm:col-span-3 grid grid-cols-2 sm:grid-cols-5 gap-2">
                          <div className="rounded-lg bg-gray-50 p-2">
                            <p className="text-xs text-gray-500">方向</p>
                            <p className="text-sm font-semibold text-gray-700">{element.direction}</p>
                          </div>
                          <div className="rounded-lg bg-gray-50 p-2">
                            <p className="text-xs text-gray-500">季節</p>
                            <p className="text-sm font-semibold text-gray-700">{element.season}</p>
                          </div>
                          <div className="rounded-lg bg-gray-50 p-2">
                            <p className="text-xs text-gray-500">情感</p>
                            <p className="text-sm font-semibold text-gray-700">{element.emotion}</p>
                          </div>
                          <div className="rounded-lg bg-gray-50 p-2">
                            <p className="text-xs text-gray-500">五常</p>
                            <p className="text-sm font-semibold text-gray-700">{LESSON1_VIRTUES[element.name_cn as Lesson1ElementName]}</p>
                          </div>
                          <div className="rounded-lg bg-gray-50 p-2">
                            <p className="text-xs text-gray-500">心法</p>
                            <p className="text-sm font-semibold text-gray-700">{LESSON1_MEMORY_PHRASES[element.name_cn as Lesson1ElementName]}</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>

              <div className="flex flex-wrap gap-2">
                {LESSON1_ELEMENT_ORDER.map((element) => {
                  const done = lesson1CollectedElements.includes(element);
                  const style = ELEMENT_STYLES[element] ?? ELEMENT_STYLES['木'];
                  return (
                    <span
                      key={element}
                      className={`px-3 py-1 rounded-full border text-sm ${done ? `${style.bg} ${style.border} ${style.text}` : 'bg-gray-100 border-gray-200 text-gray-400'}`}
                    >
                      {done ? '✓ ' : ''}{element}
                    </span>
                  );
                })}
              </div>
            </div>
          )}
          {currentStep.source === 'elements' && (
            <div className={`grid grid-cols-2 sm:grid-cols-5 gap-3 ${lessonId === 1 ? 'hidden' : ''}`}>
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
        <div className="lesson-atlas-quiz">
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
            canUseHint={lessonId === 0 || userXp >= 50}
            hintXpCost={lessonId === 0 ? 0 : 50}
            size="large"
            appearance="atlas"
          />
        </div>
      )}

      {currentStep?.type === 'truefalse' && (
        <div className="lesson-atlas-quiz">
          <h2 className="lesson-atlas-question-title">{currentStep.question}</h2>

          {currentStep.hint && !answered && (
            <QuizHintPanel
              hint={currentStep.hint}
              answered={answered}
              showHint={showHint}
              onUseHint={handleUseHint}
              canUseHint={lessonId === 0 || userXp >= 50}
              hintXpCost={lessonId === 0 ? 0 : 50}
              appearance="atlas"
            />
          )}

          <div className="lesson-atlas-truefalse-grid">
            <button
              onClick={() => setSelectedAnswer(1)}
              disabled={answered}
              className={`lesson-atlas-truefalse-card transition-all ${
                selectedAnswer === 1
                  ? answered && currentStep.correct === true
                    ? 'border-green-500 bg-green-50'
                    : answered
                    ? 'border-red-500 bg-red-50'
                    : 'border-blue-500 bg-blue-50'
                  : 'border-gray-300 hover:border-blue-500 hover:bg-blue-50'
              } ${answered ? 'cursor-not-allowed' : 'cursor-pointer'}`}
            >
              <div className="text-center">
                <div className="lesson-atlas-truefalse-mark">✓</div>
                <div className="lesson-atlas-truefalse-label">正確</div>
                <div className="lesson-atlas-truefalse-copy">True</div>
              </div>
            </button>
            <button
              onClick={() => setSelectedAnswer(0)}
              disabled={answered}
              className={`lesson-atlas-truefalse-card transition-all ${
                selectedAnswer === 0
                  ? answered && currentStep.correct === false
                    ? 'border-green-500 bg-green-50'
                    : answered
                    ? 'border-red-500 bg-red-50'
                    : 'border-blue-500 bg-blue-50'
                  : 'border-gray-300 hover:border-blue-500 hover:bg-blue-50'
              } ${answered ? 'cursor-not-allowed' : 'cursor-pointer'}`}
            >
              <div className="text-center">
                <div className="lesson-atlas-truefalse-mark">✗</div>
                <div className="lesson-atlas-truefalse-label">錯誤</div>
                <div className="lesson-atlas-truefalse-copy">False</div>
              </div>
            </button>
          </div>

          {showFeedback && (
            <div className={`lesson-atlas-feedback ${(selectedAnswer === 1 && currentStep.correct) || (selectedAnswer === 0 && !currentStep.correct) ? 'bg-green-100 border-l-4 border-green-500' : 'bg-red-100 border-l-4 border-red-500'}`}>
              <p className="lesson-atlas-feedback-title">
                {(selectedAnswer === 1 && currentStep.correct) || (selectedAnswer === 0 && !currentStep.correct) ? '✓ 正確!' : '✗ 錯誤'}
              </p>
              <p className="lesson-atlas-feedback-copy">{currentStep.explanation}</p>
            </div>
          )}
        </div>
      )}

      {currentStep?.type === 'match' && (
        <div className={isLessonOneAtlas ? 'lesson-atlas-match' : 'mb-8'}>
          <h2 className={isLessonOneAtlas ? 'lesson-atlas-question-title' : 'text-xl sm:text-3xl lg:text-4xl font-bold mb-3 sm:mb-4 text-gray-800'}>{currentStep.prompt}</h2>
          <p className={isLessonOneAtlas ? 'lesson-atlas-match-instruction' : 'text-sm sm:text-base text-gray-700 mb-4'}>先選擇左邊的項目，然後點擊右邊對應的選項進行配對</p>
          <div className={isLessonOneAtlas ? 'lesson-atlas-match-grid' : 'grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4'}>
            <div className={isLessonOneAtlas ? 'lesson-atlas-match-column' : 'space-y-1.5 sm:space-y-2'}>
              <h3 className={isLessonOneAtlas ? 'lesson-atlas-match-heading' : 'text-xs sm:text-base font-semibold text-gray-700 mb-1 sm:mb-2'}>選擇項目：</h3>
              {currentStep.pairs.map((pair, index) => {
                const uniqueKey = `${pair.left}-${index}`;
                const isMatched = matchedPairs.some((mp) => mp[0] === uniqueKey);
                return (
                  <button
                    key={uniqueKey}
                    onClick={() => handleMatchLeft(pair.left, index)}
                    disabled={isMatched}
                    className={`${isLessonOneAtlas ? 'lesson-atlas-match-option' : 'w-full p-1.5 sm:p-3 rounded-lg border-2 text-left text-xs sm:text-base lg:text-lg font-semibold'} transition-all ${
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
            <div className={isLessonOneAtlas ? 'lesson-atlas-match-column' : 'space-y-1.5 sm:space-y-2'}>
              <h3 className={isLessonOneAtlas ? 'lesson-atlas-match-heading' : 'text-xs sm:text-base font-semibold text-gray-700 mb-1 sm:mb-2'}>配對選項：</h3>
              {shuffledRights.map((item) => {
                const isMatched = matchedPairs.some((mp) => mp[1] === item.id);
                return (
                  <button
                    key={item.id}
                    onClick={() => handleMatchRight(item)}
                    disabled={isMatched}
                    className={`${isLessonOneAtlas ? 'lesson-atlas-match-option' : 'w-full p-1.5 sm:p-3 rounded-lg border-2 text-left text-xs sm:text-base lg:text-lg font-semibold'} transition-all ${
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
            <p className={`${isLessonOneAtlas ? 'lesson-atlas-match-message' : 'mt-3 sm:mt-4 text-sm sm:text-base lg:text-lg font-semibold'} ${matchMessage.startsWith('✓') ? 'text-green-700' : 'text-red-700'}`}>
              {matchMessage}
            </p>
          )}
          <div className={isLessonOneAtlas ? 'lesson-atlas-match-status' : 'mt-3 sm:mt-4 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2'}>
            <p className={isLessonOneAtlas ? 'lesson-atlas-match-count' : 'text-xs sm:text-sm text-gray-700'}>已完成 {matchedCount}/{currentStep.pairs.length}</p>
            {selectedLeft && (
              <p className={isLessonOneAtlas ? 'lesson-atlas-match-selected' : 'text-xs sm:text-sm text-blue-600 font-medium'}>已選擇: {selectedLeft.split('-')[0]} → 請選擇配對選項</p>
            )}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      {(currentStep?.type === 'mcq' || currentStep?.type === 'truefalse') && !answered && (
        <div className={isLessonOneAtlas ? 'lesson-atlas-actions' : 'flex flex-wrap gap-3'}>
          <QuizActionButton label="上一步" onClick={handlePrevious} disabled={currentStepIndex === 0} variant="secondary" className={lessonAtlasActionClass('previous')} />
          <QuizActionButton label="檢查" onClick={handleCheck} disabled={selectedAnswer === null} className={lessonAtlasActionClass('primary')} />
        </div>
      )}

      {(currentStep?.type === 'mcq' || currentStep?.type === 'truefalse') && answered && (
        <div className={isLessonOneAtlas ? 'lesson-atlas-actions' : 'flex flex-wrap gap-3'}>
              <QuizActionButton label="上一步" onClick={handlePrevious} disabled={currentStepIndex === 0} variant="secondary" className={lessonAtlasActionClass('previous')} />
              <QuizActionButton label="繼續" onClick={handleNext} className={lessonAtlasActionClass('primary')} />
              <p className="text-xs sm:text-sm text-slate-600 basis-full text-center">此題答案已記錄；返回可回看解析，不會再次計分。</p>
            </div>
      )}

      {currentStep?.type === 'match' && isMatchComplete && (
        <div className={isLessonOneAtlas ? 'lesson-atlas-actions' : 'flex flex-wrap gap-3'}>
          <QuizActionButton label="上一步" onClick={handlePrevious} disabled={currentStepIndex === 0} variant="secondary" className={lessonAtlasActionClass('previous')} />
          <QuizActionButton
            label="繼續"
            onClick={() => {
              if (!answered) {
                setAnswered(true);
                recordCurrentQuestionOnce({ selectedAnswer: null, matchedPairs, isCorrect: true });
              }
              handleNext();
            }}
            className={lessonAtlasActionClass('primary')}
          />
        </div>
      )}

      {currentStep?.type === 'content' && (
        <div className={isLessonOneAtlas ? 'lesson-atlas-actions' : 'flex flex-wrap gap-3'}>
          <QuizActionButton label="上一步" onClick={handlePrevious} disabled={currentStepIndex === 0} variant="secondary" className={lessonAtlasActionClass('previous')} />
          <QuizActionButton label="繼續" onClick={handleNext} className={lessonAtlasActionClass('primary')} />
          {canSkipToQuiz && (
            <QuizActionButton label="跳到測驗" onClick={handleSkipToQuiz} variant="accent" className={lessonAtlasActionClass('skip')} />
          )}
        </div>
      )}

      {currentStep?.type === 'cards' && (
        <div className={isLessonOneAtlas ? 'lesson-atlas-actions' : 'flex flex-wrap gap-3'}>
          <QuizActionButton label="上一步" onClick={handlePrevious} disabled={currentStepIndex === 0} variant="secondary" className={lessonAtlasActionClass('previous')} />
          <QuizActionButton label="繼續" onClick={handleNext} className={lessonAtlasActionClass('primary')} />
          {canSkipToQuiz && (
            <QuizActionButton label="跳到測驗" onClick={handleSkipToQuiz} variant="accent" className={lessonAtlasActionClass('skip')} />
          )}
        </div>
      )}
    </div>
  );
};
