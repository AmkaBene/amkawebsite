import {useCallback, useEffect, useRef, useState} from 'react';
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Pause,
  Play,
  RotateCcw,
  RotateCw,
  Volume2,
  VolumeX,
} from 'lucide-react';
import type {SiteTheme} from '../App';

type PieceType = 'I' | 'O' | 'T' | 'S' | 'Z' | 'J' | 'L';

interface ActivePiece {
  type: PieceType;
  matrix: number[][];
  x: number;
  y: number;
}

const COLS = 10;
const ROWS = 20;
const CELL = 26;

const SHAPES: Record<PieceType, number[][]> = {
  I: [
    [0, 0, 0, 0],
    [1, 1, 1, 1],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
  ],
  O: [
    [1, 1],
    [1, 1],
  ],
  T: [
    [0, 1, 0],
    [1, 1, 1],
    [0, 0, 0],
  ],
  S: [
    [0, 1, 1],
    [1, 1, 0],
    [0, 0, 0],
  ],
  Z: [
    [1, 1, 0],
    [0, 1, 1],
    [0, 0, 0],
  ],
  J: [
    [1, 0, 0],
    [1, 1, 1],
    [0, 0, 0],
  ],
  L: [
    [0, 0, 1],
    [1, 1, 1],
    [0, 0, 0],
  ],
};

const PIECE_COLORS: Record<PieceType, {top: string; bottom: string; border: string}> = {
  I: {top: '#7DD3FC', bottom: '#0284C7', border: '#E0F2FE'},
  O: {top: '#FDE68A', bottom: '#D97706', border: '#FEF3C7'},
  T: {top: '#D8B4FE', bottom: '#7E22CE', border: '#F3E8FF'},
  S: {top: '#6EE7B7', bottom: '#059669', border: '#D1FAE5'},
  Z: {top: '#FDA4AF', bottom: '#E11D48', border: '#FFE4E6'},
  J: {top: '#93C5FD', bottom: '#1D4ED8', border: '#DBEAFE'},
  L: {top: '#FDBA74', bottom: '#EA580C', border: '#FFEDD5'},
};

const ALL_TYPES: PieceType[] = ['I', 'O', 'T', 'S', 'Z', 'J', 'L'];

function createEmptyBoard(): (PieceType | null)[][] {
  return Array.from({length: ROWS}, () => Array<PieceType | null>(COLS).fill(null));
}

function shuffleBag(): PieceType[] {
  const bag = [...ALL_TYPES];
  for (let i = bag.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [bag[i], bag[j]] = [bag[j], bag[i]];
  }
  return bag;
}

function rotateMatrixCW(matrix: number[][]): number[][] {
  const n = matrix.length;
  return Array.from({length: n}, (_, r) => Array.from({length: n}, (__, c) => matrix[n - 1 - c][r]));
}

export function TetrisGame({theme = 'light'}: {theme?: SiteTheme}) {
  const boardCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const nextCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const themeRef = useRef<SiteTheme>(theme);

  const boardRef = useRef<(PieceType | null)[][]>(createEmptyBoard());
  const bagRef = useRef<PieceType[]>(shuffleBag());
  const activeRef = useRef<ActivePiece | null>(null);
  const nextTypeRef = useRef<PieceType>('T');
  const audioCtxRef = useRef<AudioContext | null>(null);

  const [status, setStatus] = useState<'idle' | 'playing' | 'paused' | 'gameover'>('idle');
  const [score, setScore] = useState(0);
  const [lines, setLines] = useState(0);
  const [level, setLevel] = useState(1);
  const [muted, setMuted] = useState(false);
  const mutedRef = useRef(false);
  const [bestScore, setBestScore] = useState<number>(() => {
    try {
      return parseInt(localStorage.getItem('amka_aero_tetris_best') || '0', 10) || 0;
    } catch {
      return 0;
    }
  });

  useEffect(() => {
    mutedRef.current = muted;
  }, [muted]);

  const playTone = useCallback((freq: number, duration = 0.08, vol = 0.06) => {
    if (mutedRef.current) return;
    try {
      const Ctx =
        window.AudioContext || (window as unknown as {webkitAudioContext: typeof AudioContext}).webkitAudioContext;
      if (!Ctx) return;
      if (!audioCtxRef.current) {
        audioCtxRef.current = new Ctx();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') {
        void ctx.resume();
      }
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      gain.gain.setValueAtTime(vol, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + duration);
    } catch {
      // ignore audio errors
    }
  }, []);

  const pullFromBag = useCallback((): PieceType => {
    if (bagRef.current.length === 0) {
      bagRef.current = shuffleBag();
    }
    return bagRef.current.pop() ?? 'I';
  }, []);

  const collides = useCallback(
    (matrix: number[][], offsetX: number, offsetY: number, grid = boardRef.current): boolean => {
      for (let r = 0; r < matrix.length; r++) {
        for (let c = 0; c < matrix[r].length; c++) {
          if (!matrix[r][c]) continue;
          const x = offsetX + c;
          const y = offsetY + r;
          if (x < 0 || x >= COLS || y >= ROWS) return true;
          if (y >= 0 && grid[y][x] !== null) return true;
        }
      }
      return false;
    },
    [],
  );

  const drawTile = useCallback(
    (
      ctx: CanvasRenderingContext2D,
      px: number,
      py: number,
      size: number,
      type: PieceType,
      ghost = false,
    ) => {
      const palette = PIECE_COLORS[type];
      if (ghost) {
        ctx.save();
        ctx.strokeStyle = themeRef.current === 'dark' ? 'rgba(186,230,253,0.36)' : 'rgba(3,105,161,0.35)';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([3, 3]);
        ctx.strokeRect(px + 2, py + 2, size - 4, size - 4);
        ctx.restore();
        return;
      }

      const grad = ctx.createLinearGradient(px, py, px, py + size);
      grad.addColorStop(0, palette.top);
      grad.addColorStop(1, palette.bottom);
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.roundRect(px + 1, py + 1, size - 2, size - 2, 5);
      ctx.fill();

      // Glossy Frutiger Aero inner sheen
      ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
      ctx.beginPath();
      ctx.roundRect(px + 3, py + 3, size - 6, Math.max(4, (size - 4) * 0.34), 3);
      ctx.fill();

      ctx.strokeStyle = palette.border;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect(px + 1.5, py + 1.5, size - 3, size - 3, 4.5);
      ctx.stroke();
    },
    [],
  );

  const drawNextPiece = useCallback(() => {
    const canvas = nextCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const isDark = themeRef.current === 'dark';
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = isDark ? '#091829' : '#F4FAFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const type = nextTypeRef.current;
    const matrix = SHAPES[type];
    const tile = 20;

    let minR = matrix.length;
    let maxR = -1;
    let minC = matrix[0].length;
    let maxC = -1;
    for (let r = 0; r < matrix.length; r++) {
      for (let c = 0; c < matrix[r].length; c++) {
        if (matrix[r][c]) {
          minR = Math.min(minR, r);
          maxR = Math.max(maxR, r);
          minC = Math.min(minC, c);
          maxC = Math.max(maxC, c);
        }
      }
    }

    const pieceW = (maxC - minC + 1) * tile;
    const pieceH = (maxR - minR + 1) * tile;
    const startX = (canvas.width - pieceW) / 2 - minC * tile;
    const startY = (canvas.height - pieceH) / 2 - minR * tile;

    for (let r = 0; r < matrix.length; r++) {
      for (let c = 0; c < matrix[r].length; c++) {
        if (matrix[r][c]) {
          drawTile(ctx, startX + c * tile, startY + r * tile, tile, type);
        }
      }
    }
  }, [drawTile]);

  const drawBoard = useCallback(() => {
    const canvas = boardCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const isDark = themeRef.current === 'dark';
    const w = canvas.width;
    const h = canvas.height;

    const bgGrad = ctx.createLinearGradient(0, 0, w, h);
    if (isDark) {
      bgGrad.addColorStop(0, '#071423');
      bgGrad.addColorStop(1, '#0C2136');
    } else {
      bgGrad.addColorStop(0, '#F5FAFF');
      bgGrad.addColorStop(1, '#E2F1FC');
    }
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, w, h);

    ctx.strokeStyle = isDark ? 'rgba(56, 189, 248, 0.12)' : 'rgba(148, 178, 206, 0.25)';
    ctx.lineWidth = 1;
    for (let c = 1; c < COLS; c++) {
      ctx.beginPath();
      ctx.moveTo(c * CELL, 0);
      ctx.lineTo(c * CELL, h);
      ctx.stroke();
    }
    for (let r = 1; r < ROWS; r++) {
      ctx.beginPath();
      ctx.moveTo(0, r * CELL);
      ctx.lineTo(w, r * CELL);
      ctx.stroke();
    }

    const board = boardRef.current;
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const cell = board[r][c];
        if (cell) {
          drawTile(ctx, c * CELL, r * CELL, CELL, cell);
        }
      }
    }

    const active = activeRef.current;
    if (active) {
      let ghostY = active.y;
      while (!collides(active.matrix, active.x, ghostY + 1)) {
        ghostY++;
      }

      for (let r = 0; r < active.matrix.length; r++) {
        for (let c = 0; c < active.matrix[r].length; c++) {
          if (!active.matrix[r][c]) continue;
          if (ghostY + r >= 0 && ghostY !== active.y) {
            drawTile(ctx, (active.x + c) * CELL, (ghostY + r) * CELL, CELL, active.type, true);
          }
          if (active.y + r >= 0) {
            drawTile(ctx, (active.x + c) * CELL, (active.y + r) * CELL, CELL, active.type);
          }
        }
      }
    }
  }, [collides, drawTile]);

  const spawnPiece = useCallback((): boolean => {
    const type = nextTypeRef.current;
    nextTypeRef.current = pullFromBag();
    const matrix = SHAPES[type].map((row) => [...row]);
    const x = Math.floor((COLS - matrix[0].length) / 2);
    const y = type === 'I' ? -1 : 0;

    if (collides(matrix, x, y)) {
      activeRef.current = null;
      setStatus('gameover');
      playTone(170, 0.25, 0.07);
      drawNextPiece();
      drawBoard();
      return false;
    }

    activeRef.current = {type, matrix, x, y};
    drawNextPiece();
    drawBoard();
    return true;
  }, [collides, drawBoard, drawNextPiece, playTone, pullFromBag]);

  const lockAndClear = useCallback(() => {
    const active = activeRef.current;
    if (!active) return;

    const board = boardRef.current.map((row) => [...row]);
    for (let r = 0; r < active.matrix.length; r++) {
      for (let c = 0; c < active.matrix[r].length; c++) {
        if (!active.matrix[r][c]) continue;
        const y = active.y + r;
        const x = active.x + c;
        if (y < 0) {
          setStatus('gameover');
          playTone(170, 0.25, 0.07);
          return;
        }
        board[y][x] = active.type;
      }
    }

    let cleared = 0;
    const remaining: (PieceType | null)[][] = [];
    for (let r = 0; r < ROWS; r++) {
      if (board[r].every((cell) => cell !== null)) {
        cleared++;
      } else {
        remaining.push(board[r]);
      }
    }
    while (remaining.length < ROWS) {
      remaining.unshift(Array<PieceType | null>(COLS).fill(null));
    }
    boardRef.current = remaining;

    if (cleared > 0) {
      const ptsTable = [0, 100, 300, 500, 800];
      playTone(cleared >= 3 ? 880 : 660, 0.14, 0.07);
      setLines((prevLines) => {
        const totalLines = prevLines + cleared;
        const nextLvl = Math.floor(totalLines / 10) + 1;
        setLevel(nextLvl);
        setScore((prevScore) => {
          const updated = prevScore + (ptsTable[cleared] ?? 800) * nextLvl;
          setBestScore((best) => {
            const nextBest = Math.max(best, updated);
            try {
              localStorage.setItem('amka_aero_tetris_best', String(nextBest));
            } catch {
              // ignore storage errors
            }
            return nextBest;
          });
          return updated;
        });
        return totalLines;
      });
    } else {
      playTone(260, 0.04, 0.035);
    }

    spawnPiece();
  }, [playTone, spawnPiece]);

  const movePiece = useCallback(
    (dx: number, dy: number): boolean => {
      const active = activeRef.current;
      if (!active) return false;
      if (!collides(active.matrix, active.x + dx, active.y + dy)) {
        active.x += dx;
        active.y += dy;
        drawBoard();
        return true;
      }
      return false;
    },
    [collides, drawBoard],
  );

  const rotatePiece = useCallback(() => {
    const active = activeRef.current;
    if (!active || active.type === 'O') return;
    const rotated = rotateMatrixCW(active.matrix);
    const kicks = [0, -1, 1, -2, 2];
    for (const kick of kicks) {
      if (!collides(rotated, active.x + kick, active.y)) {
        active.matrix = rotated;
        active.x += kick;
        playTone(520, 0.045, 0.035);
        drawBoard();
        return;
      }
    }
  }, [collides, drawBoard, playTone]);

  const hardDrop = useCallback(() => {
    const active = activeRef.current;
    if (!active) return;
    let dropDist = 0;
    while (!collides(active.matrix, active.x, active.y + 1)) {
      active.y += 1;
      dropDist += 1;
    }
    if (dropDist > 0) {
      setScore((prev) => {
        const updated = prev + dropDist * 2;
        setBestScore((best) => {
          const nextBest = Math.max(best, updated);
          try {
            localStorage.setItem('amka_aero_tetris_best', String(nextBest));
          } catch {
            // ignore
          }
          return nextBest;
        });
        return updated;
      });
    }
    lockAndClear();
  }, [collides, lockAndClear]);

  const resetGame = useCallback(
    (autoStart = false) => {
      boardRef.current = createEmptyBoard();
      bagRef.current = shuffleBag();
      nextTypeRef.current = pullFromBag();
      setScore(0);
      setLines(0);
      setLevel(1);
      if (autoStart) {
        setStatus('playing');
        spawnPiece();
      } else {
        activeRef.current = null;
        setStatus('idle');
        drawNextPiece();
        drawBoard();
      }
    },
    [drawBoard, drawNextPiece, pullFromBag, spawnPiece],
  );

  useEffect(() => {
    themeRef.current = theme;
    drawNextPiece();
    drawBoard();
  }, [theme, drawBoard, drawNextPiece]);

  useEffect(() => {
    if (status !== 'playing') return;
    const intervalMs = Math.max(115, 760 - (level - 1) * 65);
    const timer = window.setInterval(() => {
      if (!movePiece(0, 1)) {
        lockAndClear();
      }
    }, intervalMs);
    return () => window.clearInterval(timer);
  }, [status, level, movePiece, lockAndClear]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (status !== 'playing') return;
      const target = e.target as HTMLElement | null;
      if (target && ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)) return;

      if (['ArrowLeft', 'ArrowRight', 'ArrowDown', 'ArrowUp', ' '].includes(e.key)) {
        e.preventDefault();
      }
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        movePiece(-1, 0);
      } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        movePiece(1, 0);
      } else if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') {
        movePiece(0, 1);
      } else if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W' || e.key === 'x' || e.key === 'X') {
        rotatePiece();
      } else if (e.key === ' ') {
        hardDrop();
      } else if (e.key === 'p' || e.key === 'P') {
        setStatus('paused');
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [status, movePiece, rotatePiece, hardDrop]);

  const handleTouchAction = (fn: () => void) => {
    if (status === 'idle' || status === 'gameover') {
      resetGame(true);
      return;
    }
    if (status === 'paused') {
      setStatus('playing');
    }
    fn();
  };

  return (
    <div>
      {/* Brushed Y2K Silver Header */}
      <div className="aero-silver-header flex flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <div className="flex flex-wrap items-center gap-2">
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
                status === 'paused' ? setStatus('playing') : resetGame(true)
              }
              className="inline-flex min-h-[44px] sm:min-h-[38px] items-center gap-1.5 rounded-lg px-4 py-1.5 text-xs font-semibold aero-btn-aqua whitespace-nowrap shrink-0"
            >
              <Play className="h-3.5 w-3.5" />
              <span>
                {status === 'paused'
                  ? 'Resume'
                  : status === 'gameover'
                    ? 'Play Again'
                    : 'Start Tetris'}
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

          <button
            type="button"
            onClick={() => setMuted((m) => !m)}
            aria-label={muted ? 'Unmute game audio' : 'Mute game audio'}
            className="inline-flex min-h-[44px] sm:min-h-[38px] min-w-[44px] sm:min-w-[38px] items-center justify-center rounded-lg px-2.5 py-1.5 text-xs font-semibold aero-btn-silver"
          >
            {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-4 text-xs sm:text-sm font-semibold text-[#0C1C2C] dark:text-[#ECF4FD] tabular-nums">
          <span>Score: {score}</span>
          <span>Lvl: {level}</span>
          <span className="text-[#0369A1] dark:text-[#38BDF8]">Best: {bestScore}</span>
        </div>
      </div>

      {/* Playfield + Next Preview + Touch Pad */}
      <div className="grid grid-cols-1 gap-6 aero-well p-3.5 sm:p-6 lg:grid-cols-12 lg:items-center">
        <div className="lg:col-span-7 flex justify-center">
          <div className="relative w-full max-w-[290px] sm:max-w-[300px] overflow-hidden rounded-xl border border-[#9BB2CA] dark:border-[#2C4766] bg-[#F5FAFF] dark:bg-[#071423] shadow-[inset_0_2px_8px_rgba(12,28,44,0.12)]">
            <canvas
              ref={boardCanvasRef}
              width={COLS * CELL}
              height={ROWS * CELL}
              aria-label="Aero Tetris board"
              className="block w-full h-auto"
            />

            {status !== 'playing' && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#0C1C2C]/35 backdrop-blur-[2px] p-4 text-center">
                <div className="rounded-2xl aero-chrome-panel px-5 py-4 shadow-lg max-w-[240px]">
                  <p className="font-display text-lg font-bold text-[#0C1C2C] dark:text-[#ECF4FD]">
                    {status === 'gameover'
                      ? `Game Over · ${score}`
                      : status === 'paused'
                        ? 'Tetris Paused'
                        : 'Aero Tetris'}
                  </p>
                  <p className="mt-1 text-xs text-[#40566E] dark:text-[#9EB6CF]">
                    Arrow keys + Spacebar on desktop, or silver pad below on phone.
                  </p>
                  <button
                    type="button"
                    onClick={() =>
                      status === 'paused' ? setStatus('playing') : resetGame(true)
                    }
                    className="mt-3.5 inline-flex min-h-[44px] items-center gap-2 rounded-xl px-5 py-2 text-sm font-semibold aero-btn-aqua"
                  >
                    <Play className="h-4 w-4" />
                    <span>
                      {status === 'paused'
                        ? 'Resume'
                        : status === 'gameover'
                          ? 'Play Again'
                          : 'Drop Blocks'}
                    </span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Next Piece + Score Breakdown + Touch Controls */}
        <div className="lg:col-span-5 flex flex-col items-center gap-5">
          <div className="w-full max-w-xs grid grid-cols-2 gap-3 rounded-xl border border-[#B5C4D6] dark:border-[#365273] aero-tray p-3.5">
            <div className="flex flex-col items-center justify-center">
              <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-[#40566E] dark:text-[#9EB6CF]">
                Next Piece
              </p>
              <canvas
                ref={nextCanvasRef}
                width={96}
                height={76}
                aria-label="Next Tetris piece preview"
                className="rounded-lg border border-[#A8BCD2] dark:border-[#2C4766]"
              />
            </div>

            <div className="flex flex-col justify-center gap-1.5 text-xs text-[#0C1C2C] dark:text-[#ECF4FD] tabular-nums">
              <div className="flex items-center justify-between">
                <span className="text-[#40566E] dark:text-[#9EB6CF]">Lines</span>
                <span className="font-semibold">{lines}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#40566E] dark:text-[#9EB6CF]">Level</span>
                <span className="font-semibold">{level}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#40566E] dark:text-[#9EB6CF]">Score</span>
                <span className="font-semibold text-[#0369A1] dark:text-[#38BDF8]">{score}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#40566E] dark:text-[#9EB6CF]">Best</span>
                <span className="font-semibold">{bestScore}</span>
              </div>
            </div>
          </div>

          {/* Mobile & Desktop Tactile Silver Arcade Controls */}
          <div className="w-full max-w-xs flex flex-col items-center">
            <p className="mb-2.5 text-xs font-semibold text-[#40566E] dark:text-[#9EB6CF]">
              Touch Arcade Controls
            </p>
            <div className="grid grid-cols-3 gap-2.5 w-full">
              <button
                type="button"
                aria-label="Move piece left"
                onClick={() => handleTouchAction(() => movePiece(-1, 0))}
                className="inline-flex min-h-[50px] items-center justify-center rounded-xl aero-btn-silver text-[#0C1C2C] dark:text-[#ECF4FD] touch-manipulation"
              >
                <ChevronLeft className="h-6 w-6" />
              </button>
              <button
                type="button"
                aria-label="Rotate piece clockwise"
                onClick={() => handleTouchAction(rotatePiece)}
                className="inline-flex min-h-[50px] items-center justify-center gap-1 rounded-xl aero-btn-aqua text-xs font-semibold touch-manipulation"
              >
                <RotateCw className="h-4 w-4" />
                <span>Spin</span>
              </button>
              <button
                type="button"
                aria-label="Move piece right"
                onClick={() => handleTouchAction(() => movePiece(1, 0))}
                className="inline-flex min-h-[50px] items-center justify-center rounded-xl aero-btn-silver text-[#0C1C2C] dark:text-[#ECF4FD] touch-manipulation"
              >
                <ChevronRight className="h-6 w-6" />
              </button>

              <button
                type="button"
                aria-label="Soft drop piece"
                onClick={() => handleTouchAction(() => movePiece(0, 1))}
                className="inline-flex min-h-[48px] items-center justify-center gap-1 rounded-xl aero-btn-silver text-xs font-semibold text-[#0C1C2C] dark:text-[#ECF4FD] touch-manipulation"
              >
                <ChevronDown className="h-4 w-4" />
                <span>Drop</span>
              </button>
              <button
                type="button"
                aria-label="Hard drop piece (Space)"
                onClick={() => handleTouchAction(hardDrop)}
                className="col-span-2 inline-flex min-h-[48px] items-center justify-center rounded-xl aero-btn-silver text-xs font-bold tracking-wide text-[#0369A1] dark:text-[#38BDF8] touch-manipulation"
              >
                <span>Space</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
