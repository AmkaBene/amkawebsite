import {useState} from 'react';
import {Blocks, Gamepad2, Type, Wind} from 'lucide-react';
import type {SiteTheme} from '../App';
import {ErrorBoundary} from './ErrorBoundary';
import {FlappyBirdGame} from './FlappyBirdGame';
import {SnakeGameWidget} from './SnakeGameWidget';
import {TetrisGame} from './TetrisGame';
import {VisitorNotesBoard} from './VisitorNotesBoard';
import {WordleGame} from './WordleGame';

type ArcadeGameId = 'snake' | 'tetris' | 'flappy' | 'wordle';

const ARCADE_TABS: {id: ArcadeGameId; label: string; subtitle: string}[] = [
  {id: 'snake', label: 'Aero Snake', subtitle: 'Classic liquid-chrome grid & emerald orbs'},
  {id: 'tetris', label: 'Aero Tetris', subtitle: 'Crystal 7-bag blocks & line clears'},
  {id: 'flappy', label: 'Flappy Bird', subtitle: 'Tap sky or Spacebar past emerald pipes'},
  {id: 'wordle', label: 'Aero Wordle', subtitle: 'Guess the 5-letter word in 6 tries'},
];

export function GamesArcadeSection({theme}: {theme: SiteTheme}) {
  const [activeGame, setActiveGame] = useState<ArcadeGameId>('snake');

  const activeMeta = ARCADE_TABS.find((t) => t.id === activeGame) ?? ARCADE_TABS[0];

  const renderIcon = (id: ArcadeGameId) => {
    switch (id) {
      case 'snake':
        return <Gamepad2 className="h-4 w-4 shrink-0" />;
      case 'tetris':
        return <Blocks className="h-4 w-4 shrink-0" />;
      case 'flappy':
        return <Wind className="h-4 w-4 shrink-0" />;
      case 'wordle':
        return <Type className="h-4 w-4 shrink-0" />;
    }
  };

  return (
    <section id="snake" className="mx-auto max-w-[1200px] px-4 py-12 sm:px-6 sm:py-16">
      {/* Arcade Header & Segmented Game Selector */}
      <div id="games" className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-medium text-[#40566E] dark:text-[#9EB6CF]">
            Y2K Desktop Arcade &amp; Hangout · {activeMeta.subtitle}
          </p>
          <h2 className="mt-2 font-display text-2xl font-bold tracking-tight text-[#0C1C2C] dark:text-[#ECF4FD] sm:text-3xl">
            Y2K Arcade Corner
          </h2>
        </div>

        {/* 2x2 grid on phones, inline chrome bar on tablet/desktop */}
        <div
          role="tablist"
          aria-label="Choose arcade game"
          className="grid grid-cols-2 sm:inline-flex items-center gap-1.5 rounded-2xl border border-[#B5C4D6] dark:border-[#365273] aero-tray p-1.5"
        >
          {ARCADE_TABS.map((tab) => {
            const active = activeGame === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setActiveGame(tab.id)}
                className={`inline-flex min-h-[44px] sm:min-h-[38px] items-center justify-center gap-2 rounded-xl px-3.5 py-1.5 text-xs font-semibold whitespace-nowrap shrink-0 transition-all ${
                  active
                    ? 'aero-btn-aqua'
                    : 'text-[#40566E] dark:text-[#9EB6CF] hover:bg-white/60 dark:hover:bg-[#1E3550]/60 hover:text-[#0C1C2C] dark:hover:text-white'
                }`}
              >
                {renderIcon(tab.id)}
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Active Game Console Window */}
      <div className="overflow-hidden rounded-2xl aero-chrome-panel">
        {activeGame === 'snake' && <SnakeGameWidget theme={theme} embedded />}
        {activeGame === 'tetris' && <TetrisGame theme={theme} />}
        {activeGame === 'flappy' && <FlappyBirdGame theme={theme} />}
        {activeGame === 'wordle' && <WordleGame />}
      </div>

      {/* Live Shared Visitor Notes Guestbook */}
      <ErrorBoundary fallbackTitle="Visitor Notes Temporarily Unavailable">
        <VisitorNotesBoard />
      </ErrorBoundary>
    </section>
  );
}
