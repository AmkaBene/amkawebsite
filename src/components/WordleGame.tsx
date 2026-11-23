import {useCallback, useEffect, useState} from 'react';
import {Delete, RotateCcw} from 'lucide-react';

type LetterState = 'correct' | 'present' | 'absent' | 'empty';

const TARGET_WORDS = [
  'CHILL',
  'AUDIO',
  'CLOUD',
  'MUSIC',
  'LIGHT',
  'SHINE',
  'SPACE',
  'PIXEL',
  'PEARL',
  'STARS',
  'DREAM',
  'OCEAN',
  'WATER',
  'CORAL',
  'ORBIT',
  'WAVES',
  'GLASS',
  'SPARK',
  'TIGER',
  'LOTUS',
  'SONIC',
  'VINYL',
  'SYNTH',
  'HEART',
  'FRAME',
  'PHOTO',
  'PAINT',
  'BRUSH',
  'COLOR',
  'GREEN',
  'BLACK',
  'SHARP',
  'NIGHT',
  'FROST',
  'STORM',
  'FLASH',
  'STAGE',
  'TRACK',
  'ALBUM',
  'VOICE',
  'MAGIC',
  'GHOST',
  'FLAME',
  'CROWN',
  'BLOOM',
  'RIVER',
  'APPLE',
  'GRAPE',
  'LEMON',
  'SWEET',
  'SMILE',
  'BRAVE',
  'SMART',
  'HAPPY',
  'SNAKE',
  'BLOCK',
  'SCORE',
  'LEVEL',
  'CHORD',
  'PULSE',
  'CLEAN',
  'PRISM',
  'CLEAR',
  'FLORA',
  'LUNAR',
  'SOLAR',
  'NORTH',
  'SOUTH',
  'TRAIL',
  'DRIFT',
  'GLIDE',
  'SWIFT',
  'CRISP',
  'GLINT',
  'VIVID',
  'CHARM',
  'HONEY',
  'PIZZA',
  'LATTE',
  'MOCHA',
  'BERRY',
  'PEACH',
  'PLUSH',
  'BUNNY',
  'WINGS',
  'CLAWS',
  'STEED',
  'WORLD',
  'QUEST',
];

const KEYBOARD_ROWS = [
  ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
  ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
  ['ENTER', 'Z', 'X', 'C', 'V', 'B', 'N', 'M', 'BACK'],
];

const MAX_ROWS = 6;
const WORD_LEN = 5;

function pickRandomWord(exclude?: string): string {
  const pool = exclude ? TARGET_WORDS.filter((w) => w !== exclude) : TARGET_WORDS;
  return pool[Math.floor(Math.random() * pool.length)] ?? 'PEARL';
}

function evaluateGuess(guess: string, target: string): LetterState[] {
  const result: LetterState[] = Array(WORD_LEN).fill('absent');
  const remaining: Record<string, number> = {};

  for (let i = 0; i < WORD_LEN; i++) {
    if (guess[i] === target[i]) {
      result[i] = 'correct';
    } else {
      const ch = target[i];
      remaining[ch] = (remaining[ch] || 0) + 1;
    }
  }

  for (let i = 0; i < WORD_LEN; i++) {
    if (result[i] === 'correct') continue;
    const ch = guess[i];
    if (remaining[ch] && remaining[ch] > 0) {
      result[i] = 'present';
      remaining[ch] -= 1;
    }
  }

  return result;
}

function isPlausibleFiveLetterWord(word: string): boolean {
  if (!/^[A-Z]{5}$/.test(word)) return false;
  if (TARGET_WORDS.includes(word)) return true;
  // Reject obvious keyboard mash (no vowels/Y or 4+ identical letters)
  if (!/[AEIOUY]/.test(word)) return false;
  if (/(.)\1{3,}/.test(word)) return false;
  return true;
}

export function WordleGame() {
  const [target, setTarget] = useState<string>(() => pickRandomWord());
  const [guesses, setGuesses] = useState<string[]>([]);
  const [currentGuess, setCurrentGuess] = useState<string>('');
  const [status, setStatus] = useState<'playing' | 'won' | 'lost'>('playing');
  const [notice, setNotice] = useState<string | null>(null);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState<number>(() => {
    try {
      return parseInt(localStorage.getItem('amka_aero_wordle_best') || '0', 10) || 0;
    } catch {
      return 0;
    }
  });

  const showTempNotice = useCallback((msg: string) => {
    setNotice(msg);
    window.setTimeout(() => {
      setNotice((curr) => (curr === msg ? null : curr));
    }, 2200);
  }, []);

  const resetGame = useCallback(() => {
    setTarget((prev) => pickRandomWord(prev));
    setGuesses([]);
    setCurrentGuess('');
    setStatus('playing');
    setNotice(null);
  }, []);

  const submitGuess = useCallback(() => {
    if (status !== 'playing') return;
    if (currentGuess.length < WORD_LEN) {
      showTempNotice('Type all 5 letters first');
      return;
    }
    if (!isPlausibleFiveLetterWord(currentGuess)) {
      showTempNotice('Try a real 5-letter word');
      return;
    }

    const nextGuesses = [...guesses, currentGuess];
    setGuesses(nextGuesses);
    setCurrentGuess('');

    if (currentGuess === target) {
      setStatus('won');
      setStreak((prev) => {
        const nextStreak = prev + 1;
        setBestStreak((best) => {
          const updatedBest = Math.max(best, nextStreak);
          try {
            localStorage.setItem('amka_aero_wordle_best', String(updatedBest));
          } catch {
            // ignore
          }
          return updatedBest;
        });
        return nextStreak;
      });
    } else if (nextGuesses.length >= MAX_ROWS) {
      setStatus('lost');
      setStreak(0);
    }
  }, [currentGuess, guesses, showTempNotice, status, target]);

  const handleKey = useCallback(
    (key: string) => {
      if (status !== 'playing') return;
      if (key === 'ENTER') {
        submitGuess();
      } else if (key === 'BACK' || key === 'BACKSPACE') {
        setCurrentGuess((prev) => prev.slice(0, -1));
      } else if (/^[A-Z]$/.test(key) && currentGuess.length < WORD_LEN) {
        setCurrentGuess((prev) => prev + key);
      }
    },
    [currentGuess.length, status, submitGuess],
  );

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (status !== 'playing') return;
      const el = e.target as HTMLElement | null;
      if (el && ['INPUT', 'TEXTAREA', 'SELECT'].includes(el.tagName)) return;
      if (e.ctrlKey || e.metaKey || e.altKey) return;

      if (e.key === 'Enter') {
        e.preventDefault();
        handleKey('ENTER');
      } else if (e.key === 'Backspace') {
        e.preventDefault();
        handleKey('BACK');
      } else if (/^[a-zA-Z]$/.test(e.key)) {
        handleKey(e.key.toUpperCase());
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [handleKey, status]);

  // Compute highest known state per letter for the QWERTY keyboard
  const keyStates: Record<string, LetterState> = {};
  const priority: Record<LetterState, number> = {empty: 0, absent: 1, present: 2, correct: 3};
  guesses.forEach((guess) => {
    const evals = evaluateGuess(guess, target);
    for (let i = 0; i < WORD_LEN; i++) {
      const ch = guess[i];
      const nextState = evals[i];
      if (!keyStates[ch] || priority[nextState] > priority[keyStates[ch]]) {
        keyStates[ch] = nextState;
      }
    }
  });

  const getTileClasses = (state: LetterState, filled: boolean) => {
    if (state === 'correct') {
      return 'bg-[#059669] border-[#047857] text-white shadow-sm';
    }
    if (state === 'present') {
      return 'bg-[#D97706] border-[#B45309] text-white shadow-sm';
    }
    if (state === 'absent') {
      return 'bg-[#64748B] dark:bg-[#334155] border-[#475569] text-white';
    }
    if (filled) {
      return 'bg-white dark:bg-[#132942] border-[#0369A1] dark:border-[#38BDF8] text-[#0C1C2C] dark:text-[#ECF4FD]';
    }
    return 'bg-white/75 dark:bg-[#0D1E32]/85 border-[#B5C4D6] dark:border-[#2C4766] text-[#0C1C2C] dark:text-[#ECF4FD]';
  };

  const getKeyClasses = (key: string) => {
    const st = keyStates[key];
    if (st === 'correct') return 'bg-[#059669] border-[#047857] text-white';
    if (st === 'present') return 'bg-[#D97706] border-[#B45309] text-white';
    if (st === 'absent') return 'bg-[#64748B] dark:bg-[#1E293B] border-[#475569] dark:border-[#334155] text-white opacity-80';
    return 'aero-btn-silver text-[#0C1C2C] dark:text-[#ECF4FD]';
  };

  return (
    <div>
      {/* Brushed Y2K Silver Header */}
      <div className="aero-silver-header flex flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={resetGame}
            className="inline-flex min-h-[44px] sm:min-h-[38px] items-center gap-1.5 rounded-lg px-4 py-1.5 text-xs font-semibold aero-btn-aqua whitespace-nowrap shrink-0"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>{status === 'playing' ? 'New Word' : 'Play Next Word'}</span>
          </button>
        </div>

        <div className="flex items-center gap-5 text-xs sm:text-sm font-semibold text-[#0C1C2C] dark:text-[#ECF4FD] tabular-nums">
          <span>Streak: {streak}</span>
          <span className="text-[#0369A1] dark:text-[#38BDF8]">Best: {bestStreak}</span>
        </div>
      </div>

      {/* Wordle Board + On-Screen QWERTY Keyboard */}
      <div className="aero-well p-3.5 sm:p-6">
        <div className="mx-auto max-w-[440px] flex flex-col items-center">
          {/* Status / Feedback Banner */}
          <div className="mb-3 min-h-[28px] flex items-center justify-center text-center">
            {status === 'won' ? (
              <p className="text-xs sm:text-sm font-semibold text-[#047857] dark:text-[#34D399]">
                Solved in {guesses.length}/6 — the word was {target}.
              </p>
            ) : status === 'lost' ? (
              <p className="text-xs sm:text-sm font-semibold text-[#BE123C] dark:text-[#FDA4AF]">
                Out of tries — the word was {target}.
              </p>
            ) : notice ? (
              <p className="text-xs font-semibold text-[#0369A1] dark:text-[#38BDF8]">{notice}</p>
            ) : (
              <p className="text-xs text-[#40566E] dark:text-[#9EB6CF]">
                Guess the 5-letter word in 6 tries using keyboard or tiles below.
              </p>
            )}
          </div>

          {/* 6x5 Letter Grid */}
          <div className="grid grid-rows-6 gap-2 mb-5">
            {Array.from({length: MAX_ROWS}).map((_, rIdx) => {
              const submitted = rIdx < guesses.length;
              const isCurrent = rIdx === guesses.length && status === 'playing';
              const rowWord = submitted ? guesses[rIdx] : isCurrent ? currentGuess : '';
              const evals = submitted ? evaluateGuess(rowWord, target) : null;

              return (
                <div key={rIdx} className="grid grid-cols-5 gap-2">
                  {Array.from({length: WORD_LEN}).map((__, cIdx) => {
                    const ch = rowWord[cIdx] ?? '';
                    const tileState: LetterState = evals ? evals[cIdx] : 'empty';
                    return (
                      <div
                        key={cIdx}
                        className={`flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-xl border-2 font-display text-lg sm:text-xl font-bold select-none transition-colors ${getTileClasses(
                          tileState,
                          Boolean(ch),
                        )}`}
                      >
                        {ch}
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>

          {/* Phone-Friendly QWERTY Keyboard */}
          <div className="w-full flex flex-col gap-1.5 select-none">
            {KEYBOARD_ROWS.map((row, rowIndex) => (
              <div key={rowIndex} className="flex justify-center gap-1 sm:gap-1.5">
                {row.map((key) => {
                  const isWide = key === 'ENTER' || key === 'BACK';
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => handleKey(key)}
                      aria-label={key === 'BACK' ? 'Backspace' : key}
                      className={`inline-flex min-h-[44px] items-center justify-center rounded-lg border text-xs font-bold transition-transform active:translate-y-px touch-manipulation ${
                        isWide
                          ? 'px-2.5 sm:px-3.5 min-w-[52px] sm:min-w-[60px] aero-btn-silver text-[#0C1C2C] dark:text-[#ECF4FD]'
                          : `flex-1 max-w-[38px] ${getKeyClasses(key)}`
                      }`}
                    >
                      {key === 'BACK' ? <Delete className="h-4 w-4" /> : key}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
