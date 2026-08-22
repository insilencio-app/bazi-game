import React from 'react';
/* Design reminder — 五行研習桌：總測驗是集中判讀的工作頁；以羊皮紙案卷、短檔頭、金色進度與課堂式選項統一載入、答題、錯誤及完成狀態，不以大型 hero 搶奪題目空間。 */
import { MultipleChoiceQuestion } from '../quiz/MultipleChoiceQuestion';
import { QuizActionButton } from '../quiz/QuizActionButton';

type TotalQuizQuestion = {
  lessonTitle: string;
  question: string;
  hint?: string;
  options: string[];
  correct: number;
  explanation: string;
};

interface TotalQuizViewProps {
  isLoading: boolean;
  loadError: string | null;
  isQuizFinished: boolean;
  quizIndex: number;
  totalQuestions: number;
  progress: number;
  currentAccuracy: number;
  latestPercent: number;
  latestBarPercent: number;
  recentWindowSize: number;
  recentCorrect: number;
  recentAttempts: number;
  recentPercent: number;
  quizScore: number;
  currentQuestion: TotalQuizQuestion | null;
  selectedAnswer: number | null;
  answered: boolean;
  showTotalQuizHint: boolean;
  autoAdvanceOnCorrect: boolean;
  userXp: number;
  hintXpCost: number;
  onBack: () => void;
  onUseHint: () => void;
  onToggleAutoAdvance: () => void;
  onSelectAnswer: (index: number) => void;
  onCheck: () => void;
  onNext: () => void;
  rewardOverlay: React.ReactNode;
}

export const TotalQuizView: React.FC<TotalQuizViewProps> = ({
  isLoading,
  loadError,
  isQuizFinished,
  quizIndex,
  totalQuestions,
  progress,
  currentAccuracy,
  latestPercent,
  latestBarPercent,
  recentWindowSize,
  recentCorrect,
  recentAttempts,
  recentPercent,
  quizScore,
  currentQuestion,
  selectedAnswer,
  answered,
  showTotalQuizHint,
  autoAdvanceOnCorrect,
  userXp,
  hintXpCost,
  onBack,
  onUseHint,
  onToggleAutoAdvance,
  onSelectAnswer,
  onCheck,
  onNext,
  rewardOverlay,
}) => {
  const renderedProgress = Math.min(100, Math.max(0, progress));
  const renderedLatestPercent = Math.min(100, Math.max(0, latestBarPercent));

  if (loadError) {
    return (
      <main className="total-quiz-atlas">
        <section className="total-quiz-atlas__sheet total-quiz-atlas__sheet--state" aria-labelledby="total-quiz-state-title">
          <header className="total-quiz-atlas__masthead">
            <div><p className="total-quiz-atlas__kicker">INTEGRATED REVIEW</p><h1 id="total-quiz-state-title">總測驗暫未就緒</h1></div>
            <span className="total-quiz-atlas__seal" aria-hidden="true">!</span>
          </header>
          <div className="total-quiz-atlas__state-copy">
            <p>{loadError}</p>
            <p>你的學習紀錄沒有被更改；可先返回研習桌，稍後再開始綜合測驗。</p>
          </div>
          <QuizActionButton label="返回研習桌" onClick={onBack} fullWidth />
        </section>
      </main>
    );
  }

  if (isLoading) {
    return (
      <main className="total-quiz-atlas">
        <section className="total-quiz-atlas__sheet total-quiz-atlas__sheet--state" aria-live="polite" aria-labelledby="total-quiz-loading-title">
          <header className="total-quiz-atlas__masthead">
            <div><p className="total-quiz-atlas__kicker">INTEGRATED REVIEW</p><h1 id="total-quiz-loading-title">正在整理綜合測驗</h1></div>
            <span className="total-quiz-atlas__seal total-quiz-atlas__seal--loading" aria-hidden="true">○</span>
          </header>
          <div className="total-quiz-atlas__state-copy"><p>正在從已學課程中整理本次題目與研習紀錄。</p></div>
          <div className="total-quiz-atlas__loading-track" aria-hidden="true"><span /></div>
        </section>
      </main>
    );
  }

  if (!currentQuestion) {
    return null;
  }

  if (isQuizFinished) {
    return (
      <>
        <main className="total-quiz-atlas">
          <section className="total-quiz-atlas__sheet total-quiz-atlas__sheet--complete" aria-labelledby="total-quiz-complete-title">
            <header className="total-quiz-atlas__masthead">
              <div><p className="total-quiz-atlas__kicker">INTEGRATED REVIEW・COMPLETE</p><h1 id="total-quiz-complete-title">本次綜合研習已收束</h1></div>
              <span className="total-quiz-atlas__seal" aria-hidden="true">✓</span>
            </header>
            <div className="total-quiz-atlas__complete-layout">
              <section className="total-quiz-atlas__score-card" aria-label="本次總測驗成績">
                <p>本次答對</p><strong>{quizScore}<small>／{totalQuestions}</small></strong><span>題</span>
                <div className="total-quiz-atlas__score-rule" />
                <b>{latestPercent}%</b><em>本次成績</em>
              </section>
              <section className="total-quiz-atlas__record-card" aria-label="本次研習紀錄">
                <p className="total-quiz-atlas__record-label">本次研習紀錄</p>
                <div className="total-quiz-atlas__progress-row"><span>完成度</span><b>{latestPercent}%</b></div>
                <div className="total-quiz-atlas__progress-track"><span style={{ width: `${renderedLatestPercent}%` }} /></div>
                <dl>
                  <div><dt>最近 {recentWindowSize} 題</dt><dd>{recentCorrect}/{recentAttempts}</dd></div>
                  <div><dt>最近正確率</dt><dd>{recentPercent}%</dd></div>
                  <div><dt>本次題數</dt><dd>{totalQuestions} 題</dd></div>
                </dl>
              </section>
            </div>
            <p className="total-quiz-atlas__complete-note">成績與徽章條件已按既有規則更新；你可返回研習桌繼續個別課程或再挑戰一次。</p>
            <QuizActionButton label="返回研習桌" onClick={onBack} fullWidth />
          </section>
        </main>
        {rewardOverlay}
      </>
    );
  }

  return (
    <main className="total-quiz-atlas">
      <div className="total-quiz-atlas__workbench">
        <section className="total-quiz-atlas__sheet total-quiz-atlas__question-sheet" aria-labelledby="total-quiz-title">
          <header className="total-quiz-atlas__masthead total-quiz-atlas__masthead--question">
            <div><p className="total-quiz-atlas__kicker">INTEGRATED REVIEW</p><h1 id="total-quiz-title">總測驗</h1></div>
            <QuizActionButton label="返回研習桌" onClick={onBack} variant="accent" size="compact" stretch={false} />
          </header>
          <div className="total-quiz-atlas__progress-row"><span>本次進度・第 {quizIndex + 1}/{totalQuestions} 題</span><b>目前正確率 {currentAccuracy}%</b></div>
          <div className="total-quiz-atlas__progress-track" aria-label={`總測驗進度 ${Math.round(renderedProgress)}%`}><span style={{ width: `${renderedProgress}%` }} /></div>
          <label className="total-quiz-atlas__setting"><input type="checkbox" checked={autoAdvanceOnCorrect} onChange={onToggleAutoAdvance} /><span>答對後自動下一題</span></label>
          <div className="total-quiz-atlas__question-source"><span>本題來源</span><b>{currentQuestion.lessonTitle}</b></div>
          <MultipleChoiceQuestion
            question={currentQuestion.question}
            options={currentQuestion.options}
            correctIndex={currentQuestion.correct}
            explanation={currentQuestion.explanation}
            selectedAnswer={selectedAnswer}
            answered={answered}
            showFeedback={answered}
            onSelectAnswer={onSelectAnswer}
            hint={currentQuestion.hint}
            showHint={showTotalQuizHint}
            onUseHint={onUseHint}
            canUseHint={userXp >= hintXpCost}
            hintXpCost={hintXpCost}
            size="compact"
            appearance="atlas"
          />
          <div className="total-quiz-atlas__actions">
            {!answered && <QuizActionButton label="檢查答案" onClick={onCheck} disabled={selectedAnswer === null} fullWidth />}
            {answered && <>
              {autoAdvanceOnCorrect && selectedAnswer === currentQuestion.correct && <p>答對後將自動進入下一題。</p>}
              <QuizActionButton label={quizIndex === totalQuestions - 1 ? '完成本次測驗' : '繼續下一題'} onClick={onNext} fullWidth />
            </>}
          </div>
        </section>
        <aside className="total-quiz-atlas__side-record" aria-label="本次研習紀錄">
          <p className="total-quiz-atlas__side-kicker">SESSION RECORD</p>
          <h2>本次研習紀錄</h2>
          <dl>
            <div><dt>目前答對</dt><dd>{quizScore} 題</dd></div>
            <div><dt>尚餘題數</dt><dd>{Math.max(0, totalQuestions - quizIndex - 1)} 題</dd></div>
            <div><dt>可用經驗值</dt><dd>{userXp} XP</dd></div>
          </dl>
          <div className="total-quiz-atlas__side-rule" />
          <p className="total-quiz-atlas__side-note">總測驗會整合已學內容；每題仍可按既有規則使用提示與查看解析。</p>
        </aside>
      </div>
    </main>
  );
};
