import {useEffect, useRef, useState} from 'react';
import {Sparkles, Trophy, X} from 'lucide-react';

interface ToastDetail {
  id: string;
  label: string;
  count: number;
  total: number;
  unlockedAll: boolean;
}

interface FireworkParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  alpha: number;
  color: string;
  size: number;
  isStar: boolean;
}

export function EasterEggToastAndFireworks() {
  const [toast, setToast] = useState<ToastDetail | null>(null);
  const [showCanvas, setShowCanvas] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const timerRef = useRef<number | null>(null);

  // Secret found toast listener
  useEffect(() => {
    const onToast = (ev: Event) => {
      const detail = (ev as CustomEvent<ToastDetail>).detail;
      if (!detail) return;
      setToast(detail);
      if (timerRef.current) window.clearTimeout(timerRef.current);
      timerRef.current = window.setTimeout(
        () => {
          setToast(null);
        },
        detail.unlockedAll ? 5500 : 3600,
      );
    };

    window.addEventListener('amka:secret-toast', onToast);
    return () => {
      window.removeEventListener('amka:secret-toast', onToast);
      if (timerRef.current) window.clearTimeout(timerRef.current);
    };
  }, []);

  // Golden Aero celebration firework overlay listener
  useEffect(() => {
    const onCelebrate = () => {
      const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (prefersReduced) return;
      setShowCanvas(true);
    };

    window.addEventListener('amka:miku-celebrate', onCelebrate);
    return () => window.removeEventListener('amka:miku-celebrate', onCelebrate);
  }, []);

  useEffect(() => {
    if (!showCanvas) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const palette = ['#F59E0B', '#FDE047', '#38BDF8', '#22D3EE', '#FFFFFF', '#FBBF24'];
    const particles: FireworkParticle[] = [];

    const spawnBurst = (cx: number, cy: number, count: number) => {
      for (let i = 0; i < count; i++) {
        const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.25;
        const speed = 120 + Math.random() * 260;
        particles.push({
          x: cx,
          y: cy,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed - 40,
          alpha: 1,
          color: palette[Math.floor(Math.random() * palette.length)],
          size: 3 + Math.random() * 3.5,
          isStar: i % 3 === 0,
        });
      }
    };

    // Launch 4 staggered celebratory bursts across upper/mid viewport
    const w = canvas.width;
    const h = canvas.height;
    spawnBurst(w * 0.25, h * 0.35, 28);
    const t1 = window.setTimeout(() => spawnBurst(w * 0.72, h * 0.3, 30), 320);
    const t2 = window.setTimeout(() => spawnBurst(w * 0.5, h * 0.24, 34), 680);
    const t3 = window.setTimeout(() => spawnBurst(w * 0.35, h * 0.48, 24), 1050);

    let rafId = 0;
    let lastTime = performance.now();
    const startTime = lastTime;

    const renderFrame = (now: number) => {
      const dt = Math.min(0.04, (now - lastTime) / 1000);
      lastTime = now;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.vy += 320 * dt;
        p.vx *= 0.985;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.alpha -= 0.42 * dt;

        if (p.alpha <= 0) {
          particles.splice(i, 1);
          continue;
        }

        ctx.save();
        ctx.globalAlpha = Math.max(0, p.alpha);
        ctx.fillStyle = p.color;
        if (p.isStar) {
          ctx.beginPath();
          const spikes = 5;
          const outer = p.size * 1.45;
          const inner = p.size * 0.62;
          for (let s = 0; s < spikes * 2; s++) {
            const rad = s % 2 === 0 ? outer : inner;
            const ang = (s * Math.PI) / spikes - Math.PI / 2;
            const sx = p.x + Math.cos(ang) * rad;
            const sy = p.y + Math.sin(ang) * rad;
            if (s === 0) ctx.moveTo(sx, sy);
            else ctx.lineTo(sx, sy);
          }
          ctx.closePath();
          ctx.fill();
        } else {
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size * 0.7, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      }

      if (now - startTime < 4400 && (particles.length > 0 || now - startTime < 1400)) {
        rafId = window.requestAnimationFrame(renderFrame);
      } else {
        setShowCanvas(false);
      }
    };

    rafId = window.requestAnimationFrame(renderFrame);

    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
      window.clearTimeout(t3);
      window.cancelAnimationFrame(rafId);
    };
  }, [showCanvas]);

  return (
    <>
      {showCanvas && (
        <canvas
          ref={canvasRef}
          aria-hidden="true"
          className="pointer-events-none fixed inset-0 z-40"
        />
      )}

      {toast && (
        <div
          role="status"
          aria-live="polite"
          className="fixed top-[72px] right-4 z-50 max-w-[340px] rounded-2xl aero-chrome-panel p-3.5 shadow-xl"
        >
          <div className="flex items-start gap-3">
            <div
              className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border ${
                toast.unlockedAll
                  ? 'border-[#D97706] bg-gradient-to-br from-[#FDE047] to-[#D97706] text-[#451A03]'
                  : 'border-[#0284C7] bg-gradient-to-br from-[#BAE6FD] to-[#0284C7] text-white'
              }`}
            >
              {toast.unlockedAll ? <Trophy className="h-4.5 w-4.5" /> : <Sparkles className="h-4.5 w-4.5" />}
            </div>

            <div className="min-w-0 flex-1">
              <p className="font-display text-xs font-bold text-[#0D1D2E] dark:text-[#ECF4FD]">
                {toast.unlockedAll
                  ? 'All 5 Treasures Found · Golden Aero Unlocked!'
                  : `Found Secret: ${toast.label}`}
              </p>
              <p className="mt-0.5 text-xs text-[#425870] dark:text-[#9EB6CF]">
                {toast.unlockedAll
                  ? 'Golden Frutiger Aero mode is now active! Toggle it anytime in the Start Menu.'
                  : `Collectible ${toast.count} of ${toast.total} discovered. Keep exploring!`}
              </p>
            </div>

            <button
              type="button"
              onClick={() => setToast(null)}
              aria-label="Dismiss notification"
              className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg aero-btn-silver text-[#425870] dark:text-[#9EB6CF]"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
