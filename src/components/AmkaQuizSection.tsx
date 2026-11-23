import {useMemo, useState} from 'react';
import {ArrowLeft, ArrowRight, Award, CheckCircle2, HelpCircle, RotateCcw, XCircle} from 'lucide-react';
import {AMKA_QUIZ, type QuizQuestion} from '../data/profileData';
import {SecretCollectible} from './SecretCollectible';

interface ShuffledQuestion extends QuizQuestion {
  shuffledOptions: string[];
}

function shuffleArray(items: string[]): string[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function buildShuffledQuiz(): ShuffledQuestion[] {
  return AMKA_QUIZ.map((q) => ({
    ...q,
    shuffledOptions: shuffleArray(q.options),
  }));
}

const OPTION_LETTERS = ['A', 'B', 'C', 'D'];

export function AmkaQuizSection() {
  const [questions, setQuestions] = useState<ShuffledQuestion[]>(() => buildShuffledQuiz());
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [showResults, setShowResults] = useState(false);

  const currentQuestion = questions[currentIdx];
  const answeredCount = Object.keys(answers).length;
  const totalCount = questions.length;

  const score = useMemo(() => {
    return questions.reduce((acc, q) => {
      return answers[q.id] === q.correctAnswer ? acc + 1 : acc;
    }, 0);
  }, [answers, questions]);

  const handleSelectOption = (option: string) => {
    if (!currentQuestion || answers[currentQuestion.id]) return;
    setAnswers((prev) => ({
      ...prev,
      [currentQuestion.id]: option,
    }));
  };

  const handleReset = () => {
    setQuestions(buildShuffledQuiz());
    setAnswers({});
    setCurrentIdx(0);
    setShowResults(false);
  };

  const handleNext = () => {
    if (currentIdx < totalCount - 1) {
      setCurrentIdx((idx) => idx + 1);
    } else {
      setShowResults(true);
    }
  };

  const selectedAnswer = currentQuestion ? answers[currentQuestion.id] : undefined;
  const isCorrect = selectedAnswer === currentQuestion?.correctAnswer;

  const verdictTitle =
    score === totalCount
      ? 'Perfect 9/9 — Certified Amka Expert'
      : score >= 7
        ? 'Great Score — True Friend Status'
        : score >= 4
          ? 'Solid Guesswork — Halfway There'
          : 'Just Getting Acquainted — Play Again Anytime';

  return (
    <section id="quiz" className="mx-auto max-w-[1200px] px-4 py-12 sm:px-6 sm:py-16">
      <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-medium text-[#425870] dark:text-[#9EB6CF]">
            Interactive Trivia · 9 Questions About Amka
          </p>
          <h2 className="mt-2 font-display text-2xl font-bold tracking-tight text-[#0D1D2E] dark:text-[#ECF4FD] sm:text-3xl">
            How Well Do You Know Me?
          </h2>
        </div>
        <p className="max-w-md text-sm text-[#425870] dark:text-[#9EB6CF]">
          Test your knowledge on my birthday, favourite animals, seasons, Cartoon Network picks,
          nicknames, fruit, and colors.
        </p>
      </div>

      <div className="overflow-hidden rounded-2xl aero-chrome-panel">
        {/* Brushed Silver Header */}
        <div className="aero-silver-header flex flex-wrap items-center justify-between gap-3 px-4 py-3.5 sm:px-6">
          <div className="flex items-center gap-2.5 text-xs font-semibold text-[#0D1D2E] dark:text-[#ECF4FD]">
            <HelpCircle className="h-4 w-4 text-[#0369A1] dark:text-[#38BDF8]" />
            <span>Amka Lore Check</span>
            <span className="text-[#425870] dark:text-[#9EB6CF]">·</span>
            <span className="font-code text-[#0369A1] dark:text-[#38BDF8] tabular-nums">
              {answeredCount}/{totalCount} Answered · {score} Correct
            </span>
            <SecretCollectible eggId="secret-bat" variant="bat" />
          </div>

          <div className="flex items-center gap-2">
            {answeredCount === totalCount && !showResults && (
              <button
                type="button"
                onClick={() => setShowResults(true)}
                className="inline-flex min-h-[42px] sm:min-h-[34px] items-center gap-1.5 rounded-lg px-3 py-1 text-xs font-semibold aero-btn-aqua whitespace-nowrap shrink-0"
              >
                <Award className="h-3.5 w-3.5" />
                <span>View Results</span>
              </button>
            )}
            <button
              type="button"
              onClick={handleReset}
              className="inline-flex min-h-[42px] sm:min-h-[34px] items-center gap-1.5 rounded-lg px-3 py-1 text-xs font-semibold aero-btn-silver whitespace-nowrap shrink-0"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Restart Quiz</span>
            </button>
          </div>
        </div>

        {/* Question Stepper Ribbon */}
        {!showResults && (
          <div className="border-b border-[#C5D2E0] dark:border-[#2C4766] bg-[#EDF4FB]/80 dark:bg-[#0D1F33]/85 px-4 py-3 sm:px-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-1.5" role="tablist" aria-label="Quiz questions">
                {questions.map((q, idx) => {
                  const ans = answers[q.id];
                  const active = idx === currentIdx;
                  const qCorrect = ans === q.correctAnswer;
                  return (
                    <button
                      key={q.id}
                      type="button"
                      role="tab"
                      aria-selected={active}
                      aria-label={`Question ${idx + 1}`}
                      onClick={() => setCurrentIdx(idx)}
                      className={`inline-flex h-10 min-w-[40px] sm:h-8 sm:min-w-[36px] items-center justify-center gap-1 rounded-lg px-2 font-code text-xs font-semibold transition-colors tabular-nums ${
                        active
                          ? 'aero-btn-aqua'
                          : ans
                            ? qCorrect
                              ? 'border border-[#10B981]/50 bg-[#D1FAE5]/70 dark:bg-[#064E3B]/55 text-[#065F46] dark:text-[#6EE7B7]'
                              : 'border border-[#F43F5E]/45 bg-[#FFE4E6]/75 dark:bg-[#4C0519]/55 text-[#9F1239] dark:text-[#FDA4AF]'
                            : 'border border-[#B5C4D6] dark:border-[#365273] bg-white/80 dark:bg-[#132940] text-[#425870] dark:text-[#9EB6CF] hover:text-[#0D1D2E] dark:hover:text-white'
                      }`}
                    >
                      <span>0{idx + 1}</span>
                    </button>
                  );
                })}
              </div>

              <span className="font-code text-xs text-[#425870] dark:text-[#9EB6CF] tabular-nums">
                {Math.round((answeredCount / totalCount) * 100)}% complete
              </span>
            </div>

            <div className="mt-2.5 h-1.5 w-full overflow-hidden rounded-full bg-[#D5E1EE] dark:bg-[#1A314A]">
              <div
                className="h-full rounded-full bg-gradient-to-r from-[#0284C7] via-[#0EA5E9] to-[#10B981] transition-all duration-300"
                style={{width: `${(answeredCount / totalCount) * 100}%`}}
              />
            </div>
          </div>
        )}

        {/* Active Question View OR Results View */}
        {!showResults && currentQuestion ? (
          <div className="p-5 sm:p-8">
            <p className="font-code text-xs font-semibold text-[#0369A1] dark:text-[#38BDF8] tabular-nums">
              QUESTION 0{currentIdx + 1} OF 0{totalCount}
            </p>
            <h3
              className="mt-2 font-display text-xl font-bold text-[#0D1D2E] dark:text-[#ECF4FD] sm:text-2xl"
              style={{textWrap: 'balance'}}
            >
              {currentQuestion.prompt}
            </h3>

            {/* Options Grid */}
            <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
              {currentQuestion.shuffledOptions.map((option, optIdx) => {
                const isSelected = selectedAnswer === option;
                const isCanonicalCorrect = option === currentQuestion.correctAnswer;
                const hasAnswered = Boolean(selectedAnswer);

                let cardStyle =
                  'border-[#B8C8DA] dark:border-[#2C4766] bg-white/85 dark:bg-[#102237]/90 text-[#0D1D2E] dark:text-[#ECF4FD] hover:border-[#0369A1] dark:hover:border-[#38BDF8] hover:bg-white dark:hover:bg-[#162C46]';

                if (hasAnswered) {
                  if (isCanonicalCorrect) {
                    cardStyle =
                      'border-[#059669] dark:border-[#34D399] bg-[#ECFDF5] dark:bg-[#064E3B]/55 text-[#064E3B] dark:text-[#ECFDF5]';
                  } else if (isSelected && !isCanonicalCorrect) {
                    cardStyle =
                      'border-[#E11D48] dark:border-[#FB7185] bg-[#FFF1F2] dark:bg-[#4C0519]/55 text-[#881337] dark:text-[#FFE4E6]';
                  } else {
                    cardStyle =
                      'border-[#D5E1EE] dark:border-[#223953] bg-white/45 dark:bg-[#0B1929]/50 text-[#5B7086] dark:text-[#6C85A0] opacity-75';
                  }
                }

                return (
                  <button
                    key={option}
                    type="button"
                    disabled={hasAnswered}
                    onClick={() => handleSelectOption(option)}
                    className={`group flex min-h-[56px] w-full items-center justify-between gap-3 rounded-xl border px-4 py-3 text-left transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0369A1] ${cardStyle}`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-current/25 font-code text-xs font-bold">
                        {OPTION_LETTERS[optIdx]}
                      </span>
                      <span className="text-sm font-medium leading-snug">{option}</span>
                    </div>

                    {hasAnswered && isCanonicalCorrect && (
                      <CheckCircle2
                        aria-label="Correct answer"
                        className="h-5 w-5 shrink-0 text-[#059669] dark:text-[#34D399]"
                      />
                    )}
                    {hasAnswered && isSelected && !isCanonicalCorrect && (
                      <XCircle
                        aria-label="Incorrect choice"
                        className="h-5 w-5 shrink-0 text-[#E11D48] dark:text-[#FB7185]"
                      />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Instant Reveal Feedback */}
            {selectedAnswer && (
              <div
                className={`mt-5 flex items-start gap-3 rounded-xl border px-4 py-3.5 text-sm ${
                  isCorrect
                    ? 'border-[#10B981]/50 bg-[#ECFDF5]/90 dark:bg-[#064E3B]/45 text-[#064E3B] dark:text-[#D1FAE5]'
                    : 'border-[#F43F5E]/45 bg-[#FFF1F2]/90 dark:bg-[#4C0519]/45 text-[#881337] dark:text-[#FFE4E6]'
                }`}
              >
                {isCorrect ? (
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-[#059669] dark:text-[#34D399]" />
                ) : (
                  <XCircle className="mt-0.5 h-5 w-5 shrink-0 text-[#E11D48] dark:text-[#FB7185]" />
                )}
                <div>
                  <p className="font-semibold">
                    {isCorrect
                      ? 'Correct!'
                      : `Not quite — the answer is ${currentQuestion.correctAnswer}.`}
                  </p>
                  <p className="mt-0.5 text-xs opacity-90">{currentQuestion.revealNote}</p>
                </div>
              </div>
            )}

            {/* Navigation Footer */}
            <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-[#D2DFEC] dark:border-[#2C4766] pt-5">
              <button
                type="button"
                disabled={currentIdx === 0}
                onClick={() => setCurrentIdx((i) => Math.max(0, i - 1))}
                className="inline-flex min-h-[42px] items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-semibold aero-btn-silver disabled:opacity-45 whitespace-nowrap shrink-0"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Previous</span>
              </button>

              <div className="flex items-center gap-2.5">
                {currentIdx < totalCount - 1 ? (
                  <button
                    type="button"
                    onClick={handleNext}
                    className="inline-flex min-h-[42px] items-center gap-1.5 rounded-xl px-5 py-2 text-xs font-semibold aero-btn-aqua whitespace-nowrap shrink-0"
                  >
                    <span>Next Question</span>
                    <ArrowRight className="h-4 w-4" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowResults(true)}
                    className="inline-flex min-h-[42px] items-center gap-1.5 rounded-xl px-5 py-2 text-xs font-semibold aero-btn-aqua whitespace-nowrap shrink-0"
                  >
                    <Award className="h-4 w-4" />
                    <span>See Final Score</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        ) : (
          /* Final Score & Full Answer Key View */
          <div className="p-5 sm:p-8">
            <div className="flex flex-col gap-5 rounded-2xl border border-[#B5C7DA] dark:border-[#2C4766] bg-[#EDF5FC]/85 dark:bg-[#0D1E31]/90 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
              <div>
                <p className="font-code text-xs font-semibold text-[#0369A1] dark:text-[#38BDF8] tabular-nums">
                  FINAL SCORE · {Math.round((score / totalCount) * 100)}%
                </p>
                <h3 className="mt-1.5 font-display text-2xl font-bold text-[#0D1D2E] dark:text-[#ECF4FD]">
                  {verdictTitle}
                </h3>
                <p className="mt-1 text-sm text-[#425870] dark:text-[#9EB6CF] tabular-nums">
                  You got {score} out of {totalCount} questions right about Amka.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                <button
                  type="button"
                  onClick={() => setShowResults(false)}
                  className="inline-flex min-h-[42px] items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-semibold aero-btn-silver whitespace-nowrap shrink-0"
                >
                  <ArrowLeft className="h-4 w-4" />
                  <span>Back to Questions</span>
                </button>
                <button
                  type="button"
                  onClick={handleReset}
                  className="inline-flex min-h-[42px] items-center gap-1.5 rounded-xl px-5 py-2 text-xs font-semibold aero-btn-aqua whitespace-nowrap shrink-0"
                >
                  <RotateCcw className="h-4 w-4" />
                  <span>Play Again</span>
                </button>
              </div>
            </div>

            {/* Answer Key Breakdown Grid */}
            <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
              {questions.map((q, idx) => {
                const picked = answers[q.id];
                const ok = picked === q.correctAnswer;
                return (
                  <div
                    key={q.id}
                    className="flex flex-col justify-between rounded-xl border border-[#C5D2E0] dark:border-[#2C4766] bg-white/80 dark:bg-[#102237]/85 p-4"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-code text-xs font-semibold text-[#425870] dark:text-[#9EB6CF] tabular-nums">
                          Q0{idx + 1}
                        </span>
                        {picked ? (
                          ok ? (
                            <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#059669] dark:text-[#34D399]">
                              <CheckCircle2 className="h-3.5 w-3.5" />
                              Correct
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#E11D48] dark:text-[#FB7185]">
                              <XCircle className="h-3.5 w-3.5" />
                              Missed
                            </span>
                          )
                        ) : (
                          <span className="text-xs font-medium text-[#64748B] dark:text-[#94A3B8]">
                            Skipped
                          </span>
                        )}
                      </div>

                      <p className="mt-2 font-display text-sm font-bold text-[#0D1D2E] dark:text-[#ECF4FD]">
                        {q.prompt}
                      </p>
                      <p className="mt-1.5 text-xs font-semibold text-[#0369A1] dark:text-[#38BDF8]">
                        Answer: {q.correctAnswer}
                      </p>
                    </div>

                    {picked && !ok && (
                      <p className="mt-2 border-t border-[#E2EAF2] dark:border-[#243B55] pt-2 text-xs text-[#E11D48] dark:text-[#FDA4AF]">
                        Your pick: {picked}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
