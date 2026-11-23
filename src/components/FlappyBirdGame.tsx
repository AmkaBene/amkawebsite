import {useCallback, useEffect, useRef, useState} from 'react';
import {Pause, Play, RotateCcw, Volume2, VolumeX, Wind} from 'lucide-react';
import type {SiteTheme} from '../App';

interface PipePair {
  x: number;
  gapY: number;
  passed: boolean;
}

const CANVAS_W = 640;
const CANVAS_H = 400;
const BIRD_X = 148;
const BIRD_R = 15;
const GRAVITY = 1280;
const FLAP_VELOCITY = -395;
const PIPE_SPEED = 185;
const PIPE_WIDTH = 58;
const PIPE_GAP = 136;
const PIPE_SPACING = 248;

export function FlappyBirdGame({theme = 'light'}: {theme?: SiteTheme}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const themeRef = useRef<SiteTheme>(theme);
  const audioCtxRef = useRef<AudioContext | null>(null);

  const birdYRef = useRef(CANVAS_H * 0.44);
  const birdVyRef = useRef(0);
  const wingPhaseRef = useRef(0);
  const pipesRef = useRef<PipePair[]>([]);
  const groundOffsetRef = useRef(0);

  const [status, setStatus] = useState<'idle' | 'playing' | 'paused' | 'gameover'>('idle');
  const statusRef = useRef(status);
  const [score, setScore] = useState(0);
  const [muted, setMuted] = useState(false);
  const mutedRef = useRef(false);
  const [bestScore, setBestScore] = useState<number>(() => {
    try {
      return parseInt(localStorage.getItem('amka_aero_flappy_best') || '0', 10) || 0;
    } catch {
      return 0;
    }
  });

  useEffect(() => {
    statusRef.current = status;
  }, [status]);

  useEffect(() => {
    mutedRef.current = muted;
  }, [muted]);

  const playTone = useCallback((freq: number, duration = 0.08, vol = 0.055) => {
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
      osc.type = 'sine';
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

  const makePipe = useCallback((xPos: number): PipePair => {
    const minY = 95;
    const maxY = CANVAS_H - 135;
    return {
      x: xPos,
      gapY: minY + Math.random() * (maxY - minY),
      passed: false,
    };
  }, []);

  const drawScene = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const isDark = themeRef.current === 'dark';

    // Sky gradient
    const sky = ctx.createLinearGradient(0, 0, 0, CANVAS_H);
    if (isDark) {
      sky.addColorStop(0, '#071629');
      sky.addColorStop(0.65, '#0B243D');
      sky.addColorStop(1, '#0F3448');
    } else {
      sky.addColorStop(0, '#BCE6FF');
      sky.addColorStop(0.65, '#E4F4FF');
      sky.addColorStop(1, '#D3F7EE');
    }
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

    // Soft Aero horizon orbs / clouds
    ctx.fillStyle = isDark ? 'rgba(186, 230, 253, 0.08)' : 'rgba(255, 255, 255, 0.72)';
    const cloudDrift = (groundOffsetRef.current * 0.25) % (CANVAS_W + 160);
    [120, 340, 560].forEach((baseX, idx) => {
      const cx = ((baseX - cloudDrift + CANVAS_W + 160) % (CANVAS_W + 160)) - 80;
      const cy = 62 + idx * 28;
      ctx.beginPath();
      ctx.arc(cx, cy, 24, 0, Math.PI * 2);
      ctx.arc(cx + 22, cy - 6, 30, 0, Math.PI * 2);
      ctx.arc(cx + 48, cy + 2, 22, 0, Math.PI * 2);
      ctx.fill();
    });

    // Emerald glass Aero pipes
    for (const pipe of pipesRef.current) {
      const topH = Math.max(0, pipe.gapY - PIPE_GAP / 2);
      const bottomY = pipe.gapY + PIPE_GAP / 2;
      const bottomH = Math.max(0, CANVAS_H - 36 - bottomY);

      const pipeGrad = ctx.createLinearGradient(pipe.x, 0, pipe.x + PIPE_WIDTH, 0);
      pipeGrad.addColorStop(0, '#6EE7B7');
      pipeGrad.addColorStop(0.32, '#10B981');
      pipeGrad.addColorStop(0.85, '#047857');
      pipeGrad.addColorStop(1, '#065F46');

      // Top pipe
      ctx.fillStyle = pipeGrad;
      ctx.beginPath();
      ctx.roundRect(pipe.x, 0, PIPE_WIDTH, topH, [0, 0, 10, 10]);
      ctx.fill();
      ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
      ctx.fillRect(pipe.x + 8, 0, 10, Math.max(0, topH - 12));

      // Top pipe lip
      ctx.fillStyle = pipeGrad;
      ctx.beginPath();
      ctx.roundRect(pipe.x - 4, Math.max(0, topH - 20), PIPE_WIDTH + 8, 20, 6);
      ctx.fill();

      // Bottom pipe
      ctx.beginPath();
      ctx.roundRect(pipe.x, bottomY, PIPE_WIDTH, bottomH, [10, 10, 0, 0]);
      ctx.fill();
      ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
      ctx.fillRect(pipe.x + 8, bottomY + 18, 10, Math.max(0, bottomH - 18));

      // Bottom pipe lip
      ctx.fillStyle = pipeGrad;
      ctx.beginPath();
      ctx.roundRect(pipe.x - 4, bottomY, PIPE_WIDTH + 8, 20, 6);
      ctx.fill();
    }

    // Ground chrome-emerald strip
    const groundY = CANVAS_H - 36;
    const gGrad = ctx.createLinearGradient(0, groundY, 0, CANVAS_H);
    if (isDark) {
      gGrad.addColorStop(0, '#1C3652');
      gGrad.addColorStop(1, '#0B1829');
    } else {
      gGrad.addColorStop(0, '#E0EFFA');
      gGrad.addColorStop(1, '#B3C9DF');
    }
    ctx.fillStyle = gGrad;
    ctx.fillRect(0, groundY, CANVAS_W, 36);

    // Moving ground stripes
    ctx.fillStyle = isDark ? 'rgba(56, 189, 248, 0.25)' : 'rgba(14, 165, 233, 0.22)';
    const step = 32;
    const offset = groundOffsetRef.current % step;
    for (let x = -step; x < CANVAS_W + step; x += step) {
      ctx.fillRect(x - offset, groundY, 14, 6);
    }

    // Glossy Aero Bird
    const by = birdYRef.current;
    const tilt = Math.max(-0.48, Math.min(0.9, birdVyRef.current / 520));

    ctx.save();
    ctx.translate(BIRD_X, by);
    ctx.rotate(tilt);

    const bodyGrad = ctx.createRadialGradient(-4, -5, 2, 0, 0, BIRD_R + 4);
    bodyGrad.addColorStop(0, '#E0F2FE');
    bodyGrad.addColorStop(0.55, '#38BDF8');
    bodyGrad.addColorStop(1, '#0369A1');
    ctx.fillStyle = bodyGrad;
    ctx.beginPath();
    ctx.ellipse(0, 0, BIRD_R + 3, BIRD_R, 0, 0, Math.PI * 2);
    ctx.fill();

    // Specular crown
    ctx.fillStyle = 'rgba(255,255,255,0.68)';
    ctx.beginPath();
    ctx.ellipse(-4, -7, 8, 3.8, -0.25, 0, Math.PI * 2);
    ctx.fill();

    // Animated Wing
    const wingY = Math.sin(wingPhaseRef.current) * 4;
    ctx.fillStyle = '#F8FAFC';
    ctx.beginPath();
    ctx.ellipse(-5, 2 + wingY * 0.4, 9, 5.5, -0.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#0369A1';
    ctx.lineWidth = 1.2;
    ctx.stroke();

    // Eye
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(8, -4, 4.8, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#0C1C2C';
    ctx.beginPath();
    ctx.arc(9.5, -4, 2.2, 0, Math.PI * 2);
    ctx.fill();

    // Beak
    ctx.fillStyle = '#F59E0B';
    ctx.beginPath();
    ctx.moveTo(14, -1);
    ctx.lineTo(24, 3);
    ctx.lineTo(14, 7);
    ctx.closePath();
    ctx.fill();

    ctx.restore();
  }, []);

  const resetGame = useCallback(
    (autoStart = false) => {
      birdYRef.current = CANVAS_H * 0.44;
      birdVyRef.current = autoStart ? FLAP_VELOCITY : 0;
      wingPhaseRef.current = 0;
      pipesRef.current = [makePipe(CANVAS_W + 90), makePipe(CANVAS_W + 90 + PIPE_SPACING)];
      groundOffsetRef.current = 0;
      setScore(0);
      setStatus(autoStart ? 'playing' : 'idle');
      if (autoStart) {
        playTone(540, 0.06, 0.045);
      }
      drawScene();
    },
    [drawScene, makePipe, playTone],
  );

  useEffect(() => {
    themeRef.current = theme;
    drawScene();
  }, [theme, drawScene]);

  useEffect(() => {
    pipesRef.current = [makePipe(CANVAS_W + 90), makePipe(CANVAS_W + 90 + PIPE_SPACING)];
    drawScene();
  }, [drawScene, makePipe]);

  const flap = useCallback(() => {
    if (statusRef.current === 'idle' || statusRef.current === 'gameover') {
      resetGame(true);
      return;
    }
    if (statusRef.current === 'paused') {
      setStatus('playing');
    }
    birdVyRef.current = FLAP_VELOCITY;
    wingPhaseRef.current += 1.8;
    playTone(560, 0.06, 0.045);
  }, [playTone, resetGame]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (statusRef.current !== 'playing') return;
      const target = e.target as HTMLElement | null;
      if (target && ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)) return;
      if (e.key === ' ' || e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
        e.preventDefault();
        flap();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [flap]);

  useEffect(() => {
    if (status !== 'playing') return;
    let rafId = 0;
    let lastTime = performance.now();

    const step = (now: number) => {
      const dt = Math.min(0.045, (now - lastTime) / 1000);
      lastTime = now;

      birdVyRef.current += GRAVITY * dt;
      birdYRef.current += birdVyRef.current * dt;
      wingPhaseRef.current += dt * 14;
      groundOffsetRef.current += PIPE_SPEED * dt;

      const pipes = pipesRef.current;
      for (const pipe of pipes) {
        pipe.x -= PIPE_SPEED * dt;
        if (!pipe.passed && pipe.x + PIPE_WIDTH < BIRD_X) {
          pipe.passed = true;
          playTone(840, 0.09, 0.055);
          setScore((prev) => {
            const updated = prev + 1;
            setBestScore((best) => {
              const nextBest = Math.max(best, updated);
              try {
                localStorage.setItem('amka_aero_flappy_best', String(nextBest));
              } catch {
                // ignore
              }
              return nextBest;
            });
            return updated;
          });
        }
      }

      if (pipes.length > 0 && pipes[0].x + PIPE_WIDTH < -12) {
        pipes.shift();
        const lastX = pipes[pipes.length - 1]?.x ?? CANVAS_W;
        pipes.push(makePipe(Math.max(CANVAS_W + 40, lastX + PIPE_SPACING)));
      }

      // Forgiving hitbox collision check
      const groundLimit = CANVAS_H - 36 - BIRD_R;
      let crashed = birdYRef.current >= groundLimit || birdYRef.current <= BIRD_R;

      if (!crashed) {
        const hitR = BIRD_R - 3;
        for (const pipe of pipes) {
          if (BIRD_X + hitR > pipe.x && BIRD_X - hitR < pipe.x + PIPE_WIDTH) {
            const topLimit = pipe.gapY - PIPE_GAP / 2 + hitR;
            const bottomLimit = pipe.gapY + PIPE_GAP / 2 - hitR;
            if (birdYRef.current < topLimit || birdYRef.current > bottomLimit) {
              crashed = true;
              break;
            }
          }
        }
      }

      drawScene();

      if (crashed) {
        setStatus('gameover');
        playTone(190, 0.2, 0.065);
        return;
      }

      rafId = window.requestAnimationFrame(step);
    };

    rafId = window.requestAnimationFrame(step);
    return () => window.cancelAnimationFrame(rafId);
  }, [status, drawScene, makePipe, playTone]);

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
              onClick={() => (status === 'paused' ? setStatus('playing') : resetGame(true))}
              className="inline-flex min-h-[44px] sm:min-h-[38px] items-center gap-1.5 rounded-lg px-4 py-1.5 text-xs font-semibold aero-btn-aqua whitespace-nowrap shrink-0"
            >
              <Play className="h-3.5 w-3.5" />
              <span>
                {status === 'paused'
                  ? 'Resume'
                  : status === 'gameover'
                    ? 'Fly Again'
                    : 'Start Flappy'}
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
            aria-label={muted ? 'Unmute Flappy audio' : 'Mute Flappy audio'}
            className="inline-flex min-h-[44px] sm:min-h-[38px] min-w-[44px] sm:min-w-[38px] items-center justify-center rounded-lg px-2.5 py-1.5 text-xs font-semibold aero-btn-silver"
          >
            {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
          </button>
        </div>

        <div className="flex items-center gap-5 text-xs sm:text-sm font-semibold text-[#0C1C2C] dark:text-[#ECF4FD] tabular-nums">
          <span>Score: {score}</span>
          <span className="text-[#0369A1] dark:text-[#38BDF8]">Best: {bestScore}</span>
        </div>
      </div>

      {/* Playfield + Flap Action Bar */}
      <div className="aero-well p-3.5 sm:p-6">
        <div className="mx-auto max-w-[680px]">
          <div className="relative overflow-hidden rounded-xl border border-[#9BB2CA] dark:border-[#2C4766] bg-[#E4F4FF] dark:bg-[#071629] shadow-[inset_0_2px_8px_rgba(12,28,44,0.12)]">
            <canvas
              ref={canvasRef}
              width={CANVAS_W}
              height={CANVAS_H}
              onPointerDown={(e) => {
                e.preventDefault();
                flap();
              }}
              aria-label="Aero Flappy Bird canvas — tap or press Space to flap"
              className="block w-full h-auto cursor-pointer touch-manipulation select-none"
            />

            {status !== 'playing' && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#0C1C2C]/30 backdrop-blur-[2px] p-4 text-center">
                <div className="rounded-2xl aero-chrome-panel px-5 py-4 shadow-lg max-w-xs">
                  <p className="font-display text-lg font-bold text-[#0C1C2C] dark:text-[#ECF4FD]">
                    {status === 'gameover'
                      ? `Crashed · Score ${score}`
                      : status === 'paused'
                        ? 'Flight Paused'
                        : 'Aero Bird'}
                  </p>
                  <p className="mt-1 text-xs text-[#40566E] dark:text-[#9EB6CF]">
                    Tap anywhere on the sky, tap Flap below, or press Spacebar to glide.
                  </p>
                  <button
                    type="button"
                    onClick={() => (status === 'paused' ? setStatus('playing') : resetGame(true))}
                    className="mt-3.5 inline-flex min-h-[44px] items-center gap-2 rounded-xl px-5 py-2 text-sm font-semibold aero-btn-aqua"
                  >
                    <Play className="h-4 w-4" />
                    <span>
                      {status === 'paused'
                        ? 'Resume'
                        : status === 'gameover'
                          ? 'Fly Again'
                          : 'Take Off'}
                    </span>
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="mt-4 flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-xs text-[#40566E] dark:text-[#9EB6CF] text-center sm:text-left">
              Glide past the emerald glass pipes without clipping the horizon.
            </p>
            <button
              type="button"
              onPointerDown={(e) => {
                e.preventDefault();
                flap();
              }}
              className="w-full sm:w-auto inline-flex min-h-[48px] items-center justify-center gap-2 rounded-xl px-6 py-2.5 text-sm font-semibold aero-btn-aqua touch-manipulation select-none"
            >
              <Wind className="h-4 w-4" />
              <span>Flap Wings</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
