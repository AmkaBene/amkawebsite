import {useEffect, useRef, useState} from 'react';
import {ArrowUpRight, X} from 'lucide-react';
import {WORKS, type WorkItem} from '../data/profileData';
import {SecretCollectible} from './SecretCollectible';

type FilterCategory = 'all' | 'illustrations' | 'posters' | 'code';

function CausticPreviewCanvas({compact = false}: {compact?: boolean}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let frameId = 0;
    let time = 0;

    const drawFrame = (t: number) => {
      const w = canvas.width;
      const h = canvas.height;
      const grad = ctx.createLinearGradient(0, 0, w, h);
      grad.addColorStop(0, '#E0F2FE');
      grad.addColorStop(0.5, '#BAE6FD');
      grad.addColorStop(1, '#D1FAE5');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);

      ctx.lineWidth = 1.4;
      for (let row = 0; row < 9; row++) {
        ctx.beginPath();
        const baseY = (h / 10) * (row + 1);
        for (let x = 0; x <= w; x += 6) {
          const wave =
            Math.sin(x * 0.025 + t + row * 0.65) * 9 +
            Math.cos(x * 0.014 - t * 0.8 + row) * 5;
          const y = baseY + wave;
          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.strokeStyle =
          row % 2 === 0 ? 'rgba(255, 255, 255, 0.78)' : 'rgba(3, 105, 161, 0.28)';
        ctx.stroke();
      }
    };

    drawFrame(0);
    if (!prefersReduced) {
      const tick = () => {
        time += 0.028;
        drawFrame(time);
        frameId = requestAnimationFrame(tick);
      };
      frameId = requestAnimationFrame(tick);
    }

    return () => cancelAnimationFrame(frameId);
  }, []);

  return (
    <canvas
      ref={canvasRef}
      width={compact ? 480 : 720}
      height={compact ? 360 : 420}
      aria-label="Live aqua caustic interference wave field"
      className="h-full w-full object-cover"
    />
  );
}

function PathfinderPreview() {
  const [step, setStep] = useState(4);
  const cols = 8;
  const rows = 5;
  const walls = new Set(['2,1', '2,2', '2,3', '5,0', '5,1', '5,2']);

  useEffect(() => {
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) {
      setStep(8);
      return;
    }
    const interval = window.setInterval(() => {
      setStep((prev) => (prev >= 11 ? 1 : prev + 1));
    }, 650);
    return () => window.clearInterval(interval);
  }, []);

  return (
    <div className="flex h-full w-full flex-col justify-between bg-gradient-to-br from-[#F7FAFD] to-[#E2ECF6] p-4 sm:p-5">
      <div className="flex items-center justify-between text-xs text-[#465B73]">
        <span className="font-code">BFS Frontier · Step {String(step).padStart(2, '0')}</span>
        <span className="font-code tabular-nums">8 × 5 Grid</span>
      </div>

      <div className="my-3 grid grid-cols-8 gap-1.5">
        {Array.from({length: rows}).map((_, r) =>
          Array.from({length: cols}).map((__, c) => {
            const key = `${c},${r}`;
            const isStart = c === 0 && r === 2;
            const isGoal = c === 7 && r === 2;
            const isWall = walls.has(key);
            const dist = Math.abs(c - 0) + Math.abs(r - 2);
            const isVisited = !isWall && dist <= step;
            const isFrontier = !isWall && dist === step;

            let bg = 'bg-white/80 border-[#C5D2E0]';
            if (isWall) bg = 'bg-[#64748B] border-[#475569]';
            else if (isStart) bg = 'bg-[#047857] border-[#065F46]';
            else if (isGoal) bg = 'bg-[#0369A1] border-[#075985]';
            else if (isFrontier) bg = 'bg-[#38BDF8] border-[#0284C7]';
            else if (isVisited) bg = 'bg-[#BAE6FD] border-[#7DD3FC]';

            return (
              <div
                key={key}
                className={`aspect-square rounded border transition-colors duration-200 ${bg}`}
              />
            );
          }),
        )}
      </div>

      <p className="text-xs text-[#465B73]">
        Start (0,2) · Target (7,2) · Shortest Path Deterministic Lattice
      </p>
    </div>
  );
}

export function WorksGallery() {
  const [filter, setFilter] = useState<FilterCategory>('all');
  const [activeWork, setActiveWork] = useState<WorkItem | null>(null);
  const [failedImages, setFailedImages] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setActiveWork(null);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  const filteredWorks =
    filter === 'all' ? WORKS : WORKS.filter((item) => item.category === filter);

  const filterTabs: {id: FilterCategory; label: string}[] = [
    {id: 'all', label: 'All Works'},
    {id: 'illustrations', label: 'Illustrations'},
    {id: 'posters', label: 'Posters'},
    {id: 'code', label: 'Code'},
  ];

  return (
    <section id="works" className="mx-auto max-w-[1200px] px-4 py-12 sm:px-6 sm:py-16">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-medium text-[#465B73] dark:text-[#9EB6CF]">
            Original Works · 9 Art Pieces &amp; Software Studies
          </p>
          <div className="mt-2 flex items-center gap-2.5">
            <h2 className="font-display text-2xl font-bold tracking-tight text-[#0F1F30] dark:text-[#ECF4FD] sm:text-3xl">
              Art &amp; Code Studio
            </h2>
            <SecretCollectible eggId="secret-star-works" variant="star" />
          </div>
        </div>

        {/* Interactive Filter Segmented Control */}
        <div
          role="tablist"
          aria-label="Filter creative works"
          className="inline-flex w-fit flex-wrap items-center gap-1 rounded-xl border border-[#C5D2E0] dark:border-[#2C4766] aero-tray p-1 shadow-[inset_0_1px_2px_rgba(15,31,48,0.06)]"
        >
          {filterTabs.map((tab) => {
            const active = filter === tab.id;
            return (
              <button
                key={tab.id}
                role="tab"
                type="button"
                aria-selected={active}
                onClick={() => setFilter(tab.id)}
                className={`min-h-[42px] sm:min-h-[38px] rounded-lg px-3.5 py-1.5 text-xs font-semibold whitespace-nowrap shrink-0 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0369A1] ${
                  active
                    ? 'bg-white dark:bg-[#1E3550] text-[#0F1F30] dark:text-[#ECF4FD] shadow-sm border border-[#C5D2E0] dark:border-[#3F5F82]'
                    : 'text-[#465B73] dark:text-[#9EB6CF] hover:text-[#0F1F30] dark:hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Masonry Gallery — natural aspect ratio inside Y2K brushed-silver frames with zero wasted gutters */}
      <div className="mt-8 columns-1 gap-6 md:columns-2 lg:columns-3">
        {filteredWorks.map((work) => {
          const imgBroken = failedImages[work.id];

          return (
            <article
              key={work.id}
              className="group mb-6 inline-block w-full break-inside-avoid overflow-hidden rounded-2xl aero-chrome-panel transition-transform duration-200 hover:-translate-y-0.5"
            >
              <button
                type="button"
                onClick={() => setActiveWork(work)}
                className="flex w-full flex-col text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0369A1]"
              >
                {/* Brushed Y2K Silver Frame hugging natural image proportions */}
                <div className="w-full border-b border-[#B9C9DA] dark:border-[#2C4766] p-2.5 aero-silver-frame">
                  <div className="relative w-full overflow-hidden rounded-lg aero-silver-mat bg-[#E8F0F8] dark:bg-[#0D1E31]">
                    {work.image && !imgBroken ? (
                      <img
                        src={work.image}
                        alt={work.imageAlt || work.title}
                        referrerPolicy="no-referrer"
                        onError={() =>
                          setFailedImages((prev) => ({...prev, [work.id]: true}))
                        }
                        className="block h-auto w-full transition-transform duration-300 group-hover:scale-[1.015]"
                      />
                    ) : work.codePreviewType === 'caustics' ? (
                      <div className="aspect-[4/3] w-full">
                        <CausticPreviewCanvas compact />
                      </div>
                    ) : work.codePreviewType === 'pathfinder' ? (
                      <div className="aspect-[4/3] w-full">
                        <PathfinderPreview />
                      </div>
                    ) : (
                      <div className="flex aspect-[4/3] w-full flex-col items-center justify-center p-6 text-center">
                        <p className="font-editorial text-xl italic text-[#0F1F30] dark:text-[#ECF4FD]">
                          {work.title}
                        </p>
                        <p className="mt-1 text-xs text-[#465B73] dark:text-[#9EB6CF]">
                          {work.medium}
                        </p>
                      </div>
                    )}
                    <div className="pointer-events-none absolute inset-0 aero-specular-sheen" />
                  </div>
                </div>

                {/* Editorial Card Content (Zero-Pill Unboxed Metadata) */}
                <div className="flex flex-1 flex-col justify-between p-5 sm:p-6">
                  <div>
                    <h3 className="font-display text-lg font-semibold text-[#0F1F30] dark:text-[#ECF4FD] group-hover:text-[#0369A1] dark:group-hover:text-[#38BDF8] transition-colors">
                      {work.title}
                    </h3>
                    <p className="mt-1 text-xs text-[#465B73] dark:text-[#9EB6CF] tabular-nums">
                      {work.medium} · {work.year}
                    </p>
                    <p className="mt-3 text-sm leading-relaxed text-[#465B73] dark:text-[#9EB6CF]">
                      {work.summary}
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-[#DAE3EE] dark:border-[#2C4766] flex items-center justify-between text-xs font-semibold text-[#0369A1] dark:text-[#38BDF8]">
                    <span>Inspect piece</span>
                    <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                  </div>
                </div>
              </button>
            </article>
          );
        })}
      </div>

      {/* Lightbox Modal */}
      {activeWork && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="lightbox-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#0B1726]/75 p-3 sm:p-4 backdrop-blur-sm"
          onClick={() => setActiveWork(null)}
        >
          <div
            className="relative max-h-[92dvh] w-full max-w-3xl overflow-y-auto rounded-2xl aero-chrome-panel"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Y2K Silver Titlebar */}
            <div className="aero-silver-header sticky top-0 z-10 flex items-center justify-between px-4 sm:px-5 py-3 sm:py-3.5">
              <p className="text-xs font-medium text-[#465B73] dark:text-[#9EB6CF] truncate pr-4">
                {activeWork.medium} · {activeWork.year}
              </p>
              <button
                type="button"
                aria-label="Close detail viewer"
                onClick={() => setActiveWork(null)}
                className="inline-flex h-11 w-11 sm:h-9 sm:w-9 items-center justify-center rounded-lg aero-btn-silver text-[#0F1F30] dark:text-[#ECF4FD] shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0369A1]"
              >
                <X className="h-5 w-5 sm:h-4 sm:w-4" />
              </button>
            </div>

            <div className="p-5 sm:p-7">
              <div className="flex justify-center">
                {activeWork.image && !failedImages[activeWork.id] ? (
                  <div className="inline-block max-w-full rounded-xl p-2.5 aero-silver-frame">
                    <div className="overflow-hidden rounded-lg aero-silver-mat">
                      <img
                        src={activeWork.image}
                        alt={activeWork.imageAlt || activeWork.title}
                        referrerPolicy="no-referrer"
                        className="block max-h-[580px] w-auto max-w-full"
                      />
                    </div>
                  </div>
                ) : activeWork.codePreviewType === 'caustics' ? (
                  <div className="w-full rounded-xl p-2.5 aero-silver-frame">
                    <div className="aspect-[16/9] w-full overflow-hidden rounded-lg aero-silver-mat">
                      <CausticPreviewCanvas />
                    </div>
                  </div>
                ) : (
                  <div className="w-full rounded-xl p-2.5 aero-silver-frame">
                    <div className="aspect-[16/9] w-full overflow-hidden rounded-lg aero-silver-mat">
                      <PathfinderPreview />
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-6">
                <h3
                  id="lightbox-title"
                  className="font-display text-2xl font-bold text-[#0F1F30] dark:text-[#ECF4FD]"
                >
                  {activeWork.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-[#465B73] dark:text-[#9EB6CF]">
                  {activeWork.details}
                </p>

                {activeWork.codeSnippet && (
                  <pre className="mt-4 overflow-x-auto rounded-xl border border-[#C5D2E0] bg-[#0F1F30] p-4 font-code text-xs leading-relaxed text-[#E0F2FE]">
                    <code>{activeWork.codeSnippet}</code>
                  </pre>
                )}

                {activeWork.externalUrl && (
                  <div className="mt-5">
                    <a
                      href={activeWork.externalUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex min-h-[44px] items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold aero-btn-aqua"
                    >
                      <span>{activeWork.externalLabel || 'Open Repository'}</span>
                      <ArrowUpRight className="h-4 w-4" />
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
