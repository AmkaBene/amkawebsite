import {useEffect, useRef} from 'react';

interface SparkParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  kind: 'star' | 'bubble';
  hue: string;
}

export function Y2kCursor() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const isFine = window.matchMedia('(pointer: fine)').matches;
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!isFine || prefersReduced) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const particles: SparkParticle[] = [];
    let lastX = -100;
    let lastY = -100;
    let ringX = -100;
    let ringY = -100;
    let pointerActive = false;
    let animId = 0;

    const spawnParticle = (x: number, y: number, burst = false) => {
      const colors = ['#38BDF8', '#7DD3FC', '#E2E8F0', '#34D399', '#FFFFFF'];
      const count = burst ? 7 : 1;
      for (let i = 0; i < count; i++) {
        const angle = burst ? (Math.PI * 2 * i) / count + Math.random() * 0.4 : Math.random() * Math.PI * 2;
        const speed = burst ? 1.2 + Math.random() * 1.4 : 0.25 + Math.random() * 0.45;
        particles.push({
          x: x + (Math.random() - 0.5) * 6,
          y: y + (Math.random() - 0.5) * 6,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed - (burst ? 0.3 : 0.45),
          life: 0,
          maxLife: burst ? 28 : 22,
          size: burst ? 5 + Math.random() * 4 : 3.2 + Math.random() * 3,
          kind: Math.random() > 0.42 ? 'star' : 'bubble',
          hue: colors[Math.floor(Math.random() * colors.length)],
        });
      }
      if (particles.length > 50) {
        particles.splice(0, particles.length - 50);
      }
    };

    const onMouseMove = (e: MouseEvent) => {
      pointerActive = true;
      const dx = e.clientX - lastX;
      const dy = e.clientY - lastY;
      if (Math.hypot(dx, dy) > 14) {
        spawnParticle(e.clientX, e.clientY, false);
        lastX = e.clientX;
        lastY = e.clientY;
      } else {
        lastX = e.clientX;
        lastY = e.clientY;
      }
    };

    const onMouseDown = (e: MouseEvent) => {
      pointerActive = true;
      lastX = e.clientX;
      lastY = e.clientY;
      spawnParticle(e.clientX, e.clientY, true);
    };

    const onMouseLeave = () => {
      pointerActive = false;
    };

    window.addEventListener('mousemove', onMouseMove, {passive: true});
    window.addEventListener('mousedown', onMouseDown, {passive: true});
    document.addEventListener('mouseleave', onMouseLeave);

    const drawFivePointStar = (x: number, y: number, r: number, alpha: number, color: string) => {
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.translate(x, y);
      ctx.beginPath();
      const innerR = r * 0.44;
      for (let i = 0; i < 10; i++) {
        const angle = -Math.PI / 2 + (i * Math.PI) / 5;
        const rad = i % 2 === 0 ? r : innerR;
        const px = Math.cos(angle) * rad;
        const py = Math.sin(angle) * rad;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.fillStyle = color;
      ctx.fill();
      ctx.strokeStyle = 'rgba(51, 65, 85, 0.72)';
      ctx.lineWidth = 0.85;
      ctx.stroke();
      ctx.restore();
    };

    const tick = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (pointerActive) {
        ringX += (lastX - ringX) * 0.22;
        ringY += (lastY - ringY) * 0.22;

        // Subtle Y2K silver-aqua halo ring trailing the chrome arrow
        ctx.save();
        ctx.beginPath();
        ctx.arc(ringX, ringY, 12, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(14, 165, 233, 0.35)';
        ctx.lineWidth = 1.25;
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(ringX, ringY, 14, -Math.PI * 0.85, -Math.PI * 0.25);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.75)';
        ctx.lineWidth = 1.5;
        ctx.stroke();
        ctx.restore();
      }

      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.life += 1;

        const progress = p.life / p.maxLife;
        const alpha = Math.max(0, 1 - progress);

        if (p.kind === 'star') {
          drawFivePointStar(p.x, p.y, p.size * (1.15 - progress * 0.35), alpha, p.hue);
        } else {
          ctx.save();
          ctx.globalAlpha = alpha * 0.85;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size * 0.65, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(224, 242, 254, 0.45)';
          ctx.fill();
          ctx.strokeStyle = 'rgba(14, 165, 233, 0.65)';
          ctx.lineWidth = 0.9;
          ctx.stroke();
          ctx.restore();
        }

        if (p.life >= p.maxLife) {
          particles.splice(i, 1);
        }
      }

      animId = requestAnimationFrame(tick);
    };

    animId = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mousedown', onMouseDown);
      document.removeEventListener('mouseleave', onMouseLeave);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-50"
    />
  );
}
