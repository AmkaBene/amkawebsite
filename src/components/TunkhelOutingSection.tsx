import {useEffect, useState} from 'react';
import {ChevronLeft, ChevronRight, X} from 'lucide-react';
import {TUNKHEL_OUTING} from '../data/profileData';

export function TunkhelOutingSection() {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [failedImages, setFailedImages] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (activeIndex === null) return;
      if (e.key === 'Escape') setActiveIndex(null);
      if (e.key === 'ArrowRight') {
        setActiveIndex((prev) => (prev === null ? null : (prev + 1) % TUNKHEL_OUTING.length));
      }
      if (e.key === 'ArrowLeft') {
        setActiveIndex((prev) =>
          prev === null
            ? null
            : (prev - 1 + TUNKHEL_OUTING.length) % TUNKHEL_OUTING.length,
        );
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [activeIndex]);

  const currentPhoto = activeIndex !== null ? TUNKHEL_OUTING[activeIndex] : null;

  return (
    <section id="tunkhel" className="mx-auto max-w-[1200px] px-4 py-12 sm:px-6 sm:py-16">
      <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-medium text-[#425870] dark:text-[#9EB6CF]">
            Summer Outing Log · Selenge Aimag · Mandal Sum · Tunkhel Tosgon, Mongolia
          </p>
          <h2 className="mt-2 font-display text-2xl font-bold tracking-tight text-[#0D1D2E] dark:text-[#ECF4FD] sm:text-3xl">
            Tunkhel Tosgon — August 17
          </h2>
        </div>
        <p className="max-w-md text-sm text-[#425870] dark:text-[#9EB6CF]">
          Pine-shadowed rivers, white gers across the meadow, and cooking together indoors—five
          golden-hour frames from our August 17 trip.
        </p>
      </div>

      {/* 2 + 3 Balanced 3:2 Digicam Bento Grid */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-6">
        {TUNKHEL_OUTING.map((photo, idx) => {
          const isTopRow = idx < 2;
          const broken = failedImages[photo.id];

          return (
            <article
              key={photo.id}
              className={`group flex flex-col overflow-hidden rounded-2xl aero-chrome-panel transition-transform duration-200 hover:-translate-y-0.5 ${
                isTopRow ? 'md:col-span-3' : 'md:col-span-2'
              }`}
            >
              <button
                type="button"
                onClick={() => setActiveIndex(idx)}
                className="flex h-full flex-col text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0369A1]"
              >
                <div className="w-full border-b border-[#B9C9DA] dark:border-[#2C4766] p-2 aero-silver-frame">
                  <div className="relative aspect-[3/2] w-full overflow-hidden rounded-lg aero-silver-mat bg-[#DCE8F5] dark:bg-[#0D1E31]">
                    {!broken ? (
                      <img
                        src={photo.image}
                        alt={photo.alt}
                        referrerPolicy="no-referrer"
                        onError={() =>
                          setFailedImages((prev) => ({...prev, [photo.id]: true}))
                        }
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center p-6 text-center text-sm text-[#425870] dark:text-[#9EB6CF]">
                        {photo.scene}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex flex-1 flex-col justify-between p-4 sm:p-5">
                  <div>
                    <div className="flex items-baseline justify-between gap-2">
                      <p className="font-display text-base font-bold text-[#0D1D2E] dark:text-[#ECF4FD] group-hover:text-[#0369A1] dark:group-hover:text-[#38BDF8] transition-colors">
                        {photo.scene}
                      </p>
                      <span className="font-code text-xs text-[#425870] dark:text-[#9EB6CF] tabular-nums shrink-0">
                        Aug 17 · #{String(idx + 1).padStart(2, '0')}
                      </span>
                    </div>
                    <p className="mt-1.5 font-editorial text-lg italic text-[#0369A1] dark:text-[#38BDF8]">
                      {photo.speaker}: “{photo.quote}”
                    </p>
                  </div>
                </div>
              </button>
            </article>
          );
        })}
      </div>

      {/* Fullscreen Photo Viewer */}
      {currentPhoto && activeIndex !== null && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="tunkhel-lightbox-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#0B1726]/80 p-3 sm:p-4 backdrop-blur-sm"
          onClick={() => setActiveIndex(null)}
        >
          <div
            className="relative max-h-[92dvh] w-full max-w-4xl overflow-y-auto rounded-2xl aero-chrome-panel"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="aero-silver-header sticky top-0 z-10 flex items-center justify-between gap-3 px-4 sm:px-5 py-3 sm:py-3.5">
              <p className="min-w-0 truncate text-xs font-semibold text-[#0D1D2E] dark:text-[#ECF4FD] tabular-nums">
                Tunkhel Tosgon, Selenge · Aug 17 ({String(activeIndex + 1).padStart(2, '0')} of 05)
              </p>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  aria-label="Previous trip photo"
                  onClick={() =>
                    setActiveIndex(
                      (activeIndex - 1 + TUNKHEL_OUTING.length) % TUNKHEL_OUTING.length,
                    )
                  }
                  className="inline-flex h-11 w-11 sm:h-9 sm:w-9 items-center justify-center rounded-lg aero-btn-silver text-[#0D1D2E] dark:text-[#ECF4FD]"
                >
                  <ChevronLeft className="h-5 w-5 sm:h-4 sm:w-4" />
                </button>
                <button
                  type="button"
                  aria-label="Next trip photo"
                  onClick={() => setActiveIndex((activeIndex + 1) % TUNKHEL_OUTING.length)}
                  className="inline-flex h-11 w-11 sm:h-9 sm:w-9 items-center justify-center rounded-lg aero-btn-silver text-[#0D1D2E] dark:text-[#ECF4FD]"
                >
                  <ChevronRight className="h-5 w-5 sm:h-4 sm:w-4" />
                </button>
                <button
                  type="button"
                  aria-label="Close photo viewer"
                  onClick={() => setActiveIndex(null)}
                  className="inline-flex h-11 w-11 sm:h-9 sm:w-9 items-center justify-center rounded-lg aero-btn-silver text-[#0D1D2E] dark:text-[#ECF4FD]"
                >
                  <X className="h-5 w-5 sm:h-4 sm:w-4" />
                </button>
              </div>
            </div>

            <div className="p-4 sm:p-7">
              <div className="flex justify-center">
                <div className="inline-block max-w-full rounded-xl p-2.5 aero-silver-frame">
                  <div className="overflow-hidden rounded-lg aero-silver-mat">
                    <img
                      src={currentPhoto.image}
                      alt={currentPhoto.alt}
                      referrerPolicy="no-referrer"
                      className="block max-h-[540px] w-auto max-w-full"
                    />
                  </div>
                </div>
              </div>

              <div className="mt-5 flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between">
                <div>
                  <h3
                    id="tunkhel-lightbox-title"
                    className="font-display text-xl font-bold text-[#0D1D2E] dark:text-[#ECF4FD]"
                  >
                    {currentPhoto.scene}
                  </h3>
                  <p className="mt-1 font-editorial text-xl italic text-[#0369A1] dark:text-[#38BDF8]">
                    {currentPhoto.speaker}: “{currentPhoto.quote}”
                  </p>
                </div>
                <p className="text-xs text-[#425870] dark:text-[#9EB6CF]">
                  Selenge Aimag · Mandal Sum · Tunkhel Tosgon
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
