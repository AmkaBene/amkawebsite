import {useCallback, useEffect, useRef, useState, type TouchEvent} from 'react';
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Pause,
  Play,
  RotateCcw,
} from 'lucide-react';
import type {SiteTheme} from '../App';

type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';
type SpeedTier = 'chill' | 'normal' | 'turbo';

interface Point {
  x: number;
  y: number;
}

const GRID_COLS = 22;
const GRID_ROWS = 14;
const SPEED_MS: Record<SpeedTier, number> = {
  chill: 150,
  normal: 108,
  turbo: 74,
};

function spawnOrb(occupied: Point[]): Point {
  const taken = new Set(occupied.map((p) => `${p.x},${p.y}`));
  const candidates: Point[] = [];
  for (let y = 0; y < GRID_ROWS; y++) {
    for (let x = 0; x < GRID_COLS; x++) {
      if (!taken.has(`${x},${y}`)) {
        candidates.push({x, y});
      }
    }
  }
  if (candidates.length === 0) return {x: 0, y: 0};
  return candidates[Math.floor(Math.random() * candidates.length)];
}

export function SnakeGameWidget({
  theme = 'light',
  embedded = false,
}: {
  theme?: SiteTheme;
  embedded?: boolean;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const themeRef = useRef<SiteTheme>(theme);
  const snakeRef = useRef<Point[]>([
    {x: 8, y: 7},
    {x: 7, y: 7},
    {x: 6, y: 7},
  ]);
  const dirRef = useRef<Direction>('RIGHT');
  const dirQueueRef = useRef<Direction[]>([]);
  const orbRef = useRef<Point>({x: 15, y: 7});
  const touchStartRef = useRef<{x: number; y: number} | null>(null);

  const [status, setStatus] = useState<'idle' | 'playing' | 'paused' | 'gameover'>('idle');
  const [speed, setSpeed] = useState<SpeedTier>('normal');
  const [score, setScore] = useState(0);
  const [bestScore, setBestScore] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('amka_aero_snake_best');
      return saved ? parseInt(saved, 10) || 0 : 0;
    } catch {
      return 0;
    }
  });

  const drawBoard = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const isDark = themeRef.current === 'dark';
    const w = canvas.width;
    const h = canvas.height;
    const cellW = w / GRID_COLS;
    const cellH = h / GRID_ROWS;

    // Luminous Frutiger Aero silver-aqua (or midnight ocean) playfield backdrop
    const bgGrad = ctx.createLinearGradient(0, 0, w, h);
    if (isDark) {
      bgGrad.addColorStop(0, '#091829');
      bgGrad.addColorStop(0.5, '#0D2238');
      bgGrad.addColorStop(1, '#092329');
    } else {
      bgGrad.addColorStop(0, '#F5FAFF');
      bgGrad.addColorStop(0.5, '#E4F1FC');
      bgGrad.addColorStop(1, '#DCF3EC');
    }
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, w, h);

    // Crisp hairline grid
    ctx.strokeStyle = isDark ? 'rgba(56, 189, 248, 0.14)' : 'rgba(148, 178, 206, 0.28)';
    ctx.lineWidth = 1;
    for (let x = 1; x < GRID_COLS; x++) {
      ctx.beginPath();
      ctx.moveTo(x * cellW, 0);
      ctx.lineTo(x * cellW, h);
      ctx.stroke();
    }
    for (let y = 1; y < GRID_ROWS; y++) {
      ctx.beginPath();
      ctx.moveTo(0, y * cellH);
      ctx.lineTo(w, y * cellH);
      ctx.stroke();
    }

    // Glowing Aqua-Emerald Orb Target
    const orb = orbRef.current;
    const ox = orb.x * cellW + cellW / 2;
    const oy = orb.y * cellH + cellH / 2;
    const orbR = Math.min(cellW, cellH) * 0.36;

    ctx.save();
    const glowGrad = ctx.createRadialGradient(ox, oy, 1, ox, oy, orbR * 1.9);
    glowGrad.addColorStop(0, 'rgba(16, 185, 129, 0.55)');
    glowGrad.addColorStop(1, 'rgba(16, 185, 129, 0)');
    ctx.fillStyle = glowGrad;
    ctx.beginPath();
    ctx.arc(ox, oy, orbR * 1.9, 0, Math.PI * 2);
    ctx.fill();

    const sphereGrad = ctx.createRadialGradient(
      ox - orbR * 0.3,
      oy - orbR * 0.3,
      orbR * 0.1,
      ox,
      oy,
      orbR,
    );
    sphereGrad.addColorStop(0, '#D1FAE5');
    sphereGrad.addColorStop(0.55, '#10B981');
    sphereGrad.addColorStop(1, '#047857');
    ctx.fillStyle = sphereGrad;
    ctx.beginPath();
    ctx.arc(ox, oy, orbR, 0, Math.PI * 2);
    ctx.fill();

    // Specular highlight dot on orb
    ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
    ctx.beginPath();
    ctx.arc(ox - orbR * 0.3, oy - orbR * 0.3, orbR * 0.22, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Liquid-Chrome & Aqua Snake Segments
    const snake = snakeRef.current;
    for (let i = snake.length - 1; i >= 0; i--) {
      const seg = snake[i];
      const isHead = i === 0;
      const sx = seg.x * cellW + 2;
      const sy = seg.y * cellH + 2;
      const sw = cellW - 4;
      const sh = cellH - 4;

      const t = i / Math.max(1, snake.length - 1);
      const segGrad = ctx.createLinearGradient(sx, sy, sx, sy + sh);
      if (isHead) {
        segGrad.addColorStop(0, '#38BDF8');
        segGrad.addColorStop(0.5, '#0284C7');
        segGrad.addColorStop(1, '#0369A1');
      } else {
        const lightness = Math.round(52 + t * 24);
        segGrad.addColorStop(0, `hsl(202, 85%, ${lightness + 12}%)`);
        segGrad.addColorStop(1, `hsl(206, 78%, ${lightness}%)`);
      }

      ctx.fillStyle = segGrad;
      ctx.beginPath();
      ctx.roundRect(sx, sy, sw, sh, isHead ? 7 : 6);
      ctx.fill();

      // Glossy top specular edge
      ctx.fillStyle = 'rgba(255, 255, 255, 0.48)';
      ctx.beginPath();
      ctx.roundRect(sx + 2, sy + 2, sw - 4, Math.max(3, sh * 0.26), 3);
      ctx.fill();

      // Directional eyes on head
      if (isHead) {
        ctx.fillStyle = '#FFFFFF';
        const d = dirRef.current;
        const eyeR = 2.6;
        let e1 = {x: sx + sw * 0.72, y: sy + sh * 0.32};
        let e2 = {x: sx + sw * 0.72, y: sy + sh * 0.68};
        if (d === 'LEFT') {
          e1 = {x: sx + sw * 0.28, y: sy + sh * 0.32};
          e2 = {x: sx + sw * 0.28, y: sy + sh * 0.68};
        } else if (d === 'UP') {
          e1 = {x: sx + sw * 0.32, y: sy + sh * 0.28};
          e2 = {x: sx + sw * 0.68, y: sy + sh * 0.28};
        } else if (d === 'DOWN') {
          e1 = {x: sx + sw * 0.32, y: sy + sh * 0.72};
          e2 = {x: sx + sw * 0.68, y: sy + sh * 0.72};
        }

        [e1, e2].forEach((eye) => {
          ctx.beginPath();
          ctx.arc(eye.x, eye.y, eyeR, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#0C1C2C';
          ctx.beginPath();
          ctx.arc(eye.x, eye.y, 1.3, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#FFFFFF';
        });
      }
    }
  }, []);

  const resetGame = useCallback(
    (autoStart = false) => {
      const initialSnake = [
        {x: 8, y: 7},
        {x: 7, y: 7},
        {x: 6, y: 7},
      ];
      snakeRef.current = initialSnake;
      dirRef.current = 'RIGHT';
      dirQueueRef.current = [];
      orbRef.current = spawnOrb(initialSnake);
      setScore(0);
      setStatus(autoStart ? 'playing' : 'idle');
      drawBoard();
    },
    [drawBoard],
  );

  useEffect(() => {
    themeRef.current = theme;
    drawBoard();
  }, [theme, drawBoard]);

  const queueDirection = useCallback((candidate: Direction) => {
    const queue = dirQueueRef.current;
    const latest = queue.length > 0 ? queue[queue.length - 1] : dirRef.current;
    if (
      candidate === latest ||
      (latest === 'UP' && candidate === 'DOWN') ||
      (latest === 'DOWN' && candidate === 'UP') ||
      (latest === 'LEFT' && candidate === 'RIGHT') ||
      (latest === 'RIGHT' && candidate === 'LEFT')
    ) {
      return;
    }
    if (queue.length < 2) {
      queue.push(candidate);
    }
  }, []);

  // Keyboard controls while playing
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const map: Record<string, Direction> = {
        ArrowUp: 'UP',
        w: 'UP',
        W: 'UP',
        ArrowDown: 'DOWN',
        s: 'DOWN',
        S: 'DOWN',
        ArrowLeft: 'LEFT',
        a: 'LEFT',
        A: 'LEFT',
        ArrowRight: 'RIGHT',
        d: 'RIGHT',
        D: 'RIGHT',
      };
      const dir = map[e.key];
      if (!dir) return;

      if (status === 'playing') {
        e.preventDefault();
        queueDirection(dir);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [status, queueDirection]);

  // Game Loop
  useEffect(() => {
    if (status !== 'playing') return;

    const timer = window.setInterval(() => {
      const snake = [...snakeRef.current];
      const queuedDir = dirQueueRef.current.shift();
      const dir = queuedDir ?? dirRef.current;
      dirRef.current = dir;

      const head = snake[0];
      const nextHead: Point = {
        x: head.x + (dir === 'RIGHT' ? 1 : dir === 'LEFT' ? -1 : 0),
        y: head.y + (dir === 'DOWN' ? 1 : dir === 'UP' ? -1 : 0),
      };

      // Wall or self collision check
      const hitWall =
        nextHead.x < 0 ||
        nextHead.x >= GRID_COLS ||
        nextHead.y < 0 ||
        nextHead.y >= GRID_ROWS;
      const eatingOrb = nextHead.x === orbRef.current.x && nextHead.y === orbRef.current.y;
      const bodyToCheck = eatingOrb ? snake : snake.slice(0, -1);
      const hitSelf = bodyToCheck.some((s) => s.x === nextHead.x && s.y === nextHead.y);

      if (hitWall || hitSelf) {
        setStatus('gameover');
        return;
      }

      const nextSnake = [nextHead, ...snake];
      if (!eatingOrb) {
        nextSnake.pop();
      } else {
        orbRef.current = spawnOrb(nextSnake);
        setScore((prev) => {
          const updated = prev + 10;
          setBestScore((best) => {
            const nextBest = Math.max(best, updated);
            try {
              localStorage.setItem('amka_aero_snake_best', String(nextBest));
            } catch {
              // ignore storage errors
            }
            return nextBest;
          });
          return updated;
        });
      }

      snakeRef.current = nextSnake;
      drawBoard();
    }, SPEED_MS[speed]);

    return () => window.clearInterval(timer);
  }, [status, speed, drawBoard]);

  const handleDpad = (dir: Direction) => {
    if (status === 'idle' || status === 'gameover') {
      resetGame(true);
    } else if (status === 'paused') {
      setStatus('playing');
    }
    queueDirection(dir);
  };

  const handleTouchStart = (e: TouchEvent<HTMLCanvasElement>) => {
    const touch = e.touches[0];
    if (!touch) return;
    touchStartRef.current = {x: touch.clientX, y: touch.clientY};
  };

  const handleTouchMove = (e: TouchEvent<HTMLCanvasElement>) => {
    if (status !== 'playing' || !touchStartRef.current) return;
    const touch = e.touches[0];
    if (!touch) return;
    const dx = touch.clientX - touchStartRef.current.x;
    const dy = touch.clientY - touchStartRef.current.y;
    if (Math.hypot(dx, dy) < 22) return;

    if (Math.abs(dx) > Math.abs(dy)) {
      queueDirection(dx > 0 ? 'RIGHT' : 'LEFT');
    } else {
      queueDirection(dy > 0 ? 'DOWN' : 'UP');
    }
    touchStartRef.current = {x: touch.clientX, y: touch.clientY};
  };

  const handleTouchEnd = () => {
    touchStartRef.current = null;
  };

  const innerConsole = (
    <>
      {/* Brushed Y2K Silver Arcade Header */}
      <div className="aero-silver-header flex flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <div className="flex items-center gap-2">
          {status === 'playing' ? (
            <button
              type="button"
              onClick={() => setStatus('paused')}
              className="inline-flex min-h-[44px] sm:min-h-[38px] items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-semibold aero-btn-silver whitespace-nowrap shrink-0"
            >
              <Pause className="h-3.5 w-3.5" />
              <span>Pause</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() =>
                status === 'gameover' || status === 'idle'
                  ? resetGame(true)
                  : setStatus('playing')
              }
              className="inline-flex min-h-[44px] sm:min-h-[38px] items-center gap-1.5 rounded-lg px-4 py-1.5 text-xs font-semibold aero-btn-aqua whitespace-nowrap shrink-0"
            >
              <Play className="h-3.5 w-3.5" />
              <span>
                {status === 'paused'
                  ? 'Resume'
                  : status === 'gameover'
                    ? 'Play Again'
                    : 'Start Game'}
              </span>
            </button>
          )}

          <button
            type="button"
            onClick={() => resetGame(false)}
            className="inline-flex min-h-[44px] sm:min-h-[38px] items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold aero-btn-silver whitespace-nowrap shrink-0"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Reset</span>
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {embedded && (
            <div className="flex items-center gap-4 text-xs sm:text-sm font-semibold text-[#0C1C2C] dark:text-[#ECF4FD] tabular-nums mr-1">
              <span>Score: {score}</span>
              <span className="text-[#0369A1] dark:text-[#38BDF8]">Best: {bestScore}</span>
            </div>
          )}

          {/* Speed Selector */}
          <div className="inline-flex items-center gap-1 rounded-xl border border-[#B5C4D6] dark:border-[#365273] aero-tray p-1">
            {(['chill', 'normal', 'turbo'] as SpeedTier[]).map((tier) => {
              const active = speed === tier;
              return (
                <button
                  key={tier}
                  type="button"
                  onClick={() => setSpeed(tier)}
                  className={`min-h-[40px] sm:min-h-[34px] rounded-lg px-3 py-1 text-xs font-semibold capitalize whitespace-nowrap shrink-0 transition-colors ${
                    active
                      ? 'bg-white dark:bg-[#1E3550] text-[#0C1C2C] dark:text-[#ECF4FD] shadow-sm border border-[#C5D2E0] dark:border-[#3F5F82]'
                      : 'text-[#40566E] dark:text-[#9EB6CF] hover:text-[#0C1C2C] dark:hover:text-white'
                  }`}
                >
                  {tier}
                </button>
              );
            })}
          </div>
        </div>
      </div>

        {/* Game Arena & Touch Controls */}
        <div className="grid grid-cols-1 gap-6 aero-well p-3.5 sm:p-6 lg:grid-cols-12 lg:items-center">
          <div className="lg:col-span-9 relative overflow-hidden rounded-xl border border-[#9BB2CA] dark:border-[#2C4766] bg-[#F5FAFF] dark:bg-[#091829] shadow-[inset_0_2px_8px_rgba(12,28,44,0.1)]">
            <canvas
              ref={canvasRef}
              width={704}
              height={448}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
              aria-label="Aero Snake game board"
              className={`block w-full h-auto ${status === 'playing' ? 'touch-none' : 'touch-manipulation'}`}
            />

            {status !== 'playing' && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#0C1C2C]/35 backdrop-blur-[2px] p-3 sm:p-4 text-center">
                <div className="rounded-2xl aero-chrome-panel px-4 py-3.5 sm:px-6 sm:py-5 shadow-lg max-w-xs sm:max-w-sm">
                  <p className="font-display text-lg sm:text-xl font-bold text-[#0C1C2C] dark:text-[#ECF4FD]">
                    {status === 'gameover'
                      ? `Game Over · Score ${score}`
                      : status === 'paused'
                        ? 'Game Paused'
                        : 'Aero Snake Ready'}
                  </p>
                  <p className="mt-1 text-xs text-[#40566E] dark:text-[#9EB6CF]">
                    Swipe the board, tap the silver D-Pad, or use Arrow Keys / WASD.
                  </p>
                  <button
                    type="button"
                    onClick={() =>
                      status === 'paused' ? setStatus('playing') : resetGame(true)
                    }
                    className="mt-3 sm:mt-4 inline-flex min-h-[44px] items-center gap-2 rounded-xl px-5 py-2 text-sm font-semibold aero-btn-aqua"
                  >
                    <Play className="h-4 w-4" />
                    <span>
                      {status === 'paused'
                        ? 'Resume'
                        : status === 'gameover'
                          ? 'Play Again'
                          : 'Start Playing'}
                    </span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Brushed Silver Touch D-Pad */}
          <div className="lg:col-span-3 flex flex-col items-center justify-center">
            <p className="mb-3 text-xs font-semibold text-[#40566E] dark:text-[#9EB6CF]">
              D-Pad Controls
            </p>
            <div className="grid grid-cols-3 gap-2.5 sm:gap-2">
              <div />
              <button
                type="button"
                aria-label="Move up"
                onClick={() => handleDpad('UP')}
                className="inline-flex h-14 w-14 sm:h-12 sm:w-12 items-center justify-center rounded-xl aero-btn-silver text-[#0C1C2C] dark:text-[#ECF4FD] touch-manipulation"
              >
                <ChevronUp className="h-6 w-6 sm:h-5 sm:w-5" />
              </button>
              <div />
              <button
                type="button"
                aria-label="Move left"
                onClick={() => handleDpad('LEFT')}
                className="inline-flex h-14 w-14 sm:h-12 sm:w-12 items-center justify-center rounded-xl aero-btn-silver text-[#0C1C2C] dark:text-[#ECF4FD] touch-manipulation"
              >
                <ChevronLeft className="h-6 w-6 sm:h-5 sm:w-5" />
              </button>
              <button
                type="button"
                aria-label="Move down"
                onClick={() => handleDpad('DOWN')}
                className="inline-flex h-14 w-14 sm:h-12 sm:w-12 items-center justify-center rounded-xl aero-btn-silver text-[#0C1C2C] dark:text-[#ECF4FD] touch-manipulation"
              >
                <ChevronDown className="h-6 w-6 sm:h-5 sm:w-5" />
              </button>
              <button
                type="button"
                aria-label="Move right"
                onClick={() => handleDpad('RIGHT')}
                className="inline-flex h-14 w-14 sm:h-12 sm:w-12 items-center justify-center rounded-xl aero-btn-silver text-[#0C1C2C] dark:text-[#ECF4FD] touch-manipulation"
              >
                <ChevronRight className="h-6 w-6 sm:h-5 sm:w-5" />
              </button>
            </div>
            <p className="mt-4 text-center text-xs text-[#40566E] dark:text-[#9EB6CF]">
              Every orb adds +10 points and extends your chrome tail.
            </p>
          </div>
        </div>
    </>
  );

  if (embedded) {
    return innerConsole;
  }

  return (
    <section id="snake" className="mx-auto max-w-[1200px] px-4 py-12 sm:px-6 sm:py-16">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-medium text-[#40566E] dark:text-[#9EB6CF]">
            Y2K Desktop Arcade · Arrow Keys, Swipe Board, or Touch D-Pad
          </p>
          <h2 className="mt-2 font-display text-2xl font-bold tracking-tight text-[#0C1C2C] dark:text-[#ECF4FD] sm:text-3xl">
            Aero Snake
          </h2>
        </div>

        <div className="flex items-center gap-6 text-sm font-semibold text-[#0C1C2C] dark:text-[#ECF4FD] tabular-nums">
          <span>Score: {score}</span>
          <span className="text-[#0369A1] dark:text-[#38BDF8]">Best: {bestScore}</span>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl aero-chrome-panel">{innerConsole}</div>
    </section>
  );
}
