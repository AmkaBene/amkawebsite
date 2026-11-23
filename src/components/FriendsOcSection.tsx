import {useEffect, useState} from 'react';
import {ArrowUpRight, ChevronLeft, ChevronRight, X} from 'lucide-react';
import {FRIEND_OCS, type FriendOc} from '../data/profileData';

export function FriendsOcSection() {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [failedImages, setFailedImages] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (selectedIndex === null) return;
      if (e.key === 'Escape') setSelectedIndex(null);
      if (e.key === 'ArrowRight') {
        setSelectedIndex((prev) =>
          prev === null ? null : (prev + 1) % FRIEND_OCS.length,
        );
      }
      if (e.key === 'ArrowLeft') {
        setSelectedIndex((prev) =>
          prev === null ? null : (prev - 1 + FRIEND_OCS.length) % FRIEND_OCS.length,
        );
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [selectedIndex]);

  const activeFriend: FriendOc | null =
    selectedIndex !== null ? FRIEND_OCS[selectedIndex] : null;

  return (
    <section id="friends-oc" className="mx-auto max-w-[1200px] px-4 py-12 sm:px-6 sm:py-16">
      <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-medium text-[#425870] dark:text-[#9EB6CF]">
            Character Design Project · Inspired by No, I’m Not a Human
          </p>
          <h2 className="mt-2 font-display text-2xl font-bold tracking-tight text-[#0D1D2E] dark:text-[#ECF4FD] sm:text-3xl">
            Friends OC Dossier
          </h2>
        </div>
        <p className="max-w-md text-sm text-[#425870] dark:text-[#9EB6CF]">
          Six individual character inspection cards designed for myself and my friends—each with
          custom room palettes, eye, hand, ear, and aura silhouette checks.
        </p>
      </div>

      {/* 3-in-a-Row Character Grid */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {FRIEND_OCS.map((oc, idx) => {
          const broken = failedImages[oc.id];
          return (
            <article
              key={oc.id}
              className="group flex flex-col overflow-hidden rounded-2xl aero-chrome-panel transition-transform duration-200 hover:-translate-y-0.5"
            >
              <button
                type="button"
                onClick={() => setSelectedIndex(idx)}
                className="flex h-full flex-col text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0369A1]"
              >
                {/* 2:1 Separated Character Sheet in Brushed Silver Frame */}
                <div className="w-full border-b border-[#B9C9DA] dark:border-[#2C4766] p-2 aero-silver-frame">
                  <div className="relative aspect-[2/1] w-full overflow-hidden rounded-lg aero-silver-mat bg-[#0B1416]">
                    {!broken ? (
                      <img
                        src={oc.image}
                        alt={`${oc.name} — No, I’m Not a Human inspired OC inspection card`}
                        referrerPolicy="no-referrer"
                        onError={() => setFailedImages((prev) => ({...prev, [oc.id]: true}))}
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center p-4 text-center text-white">
                        <span className="font-display text-lg font-bold">{oc.name}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Unboxed Editorial Metadata */}
                <div className="flex flex-1 flex-col justify-between p-5">
                  <div>
                    <div className="flex items-baseline justify-between gap-2">
                      <h3 className="font-display text-lg font-bold text-[#0D1D2E] dark:text-[#ECF4FD] group-hover:text-[#0369A1] dark:group-hover:text-[#38BDF8] transition-colors">
                        {oc.name}
                      </h3>
                      <span className="font-code text-xs text-[#425870] dark:text-[#9EB6CF] tabular-nums">
                        {String(idx + 1).padStart(2, '0')} / 06
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-[#425870] dark:text-[#9EB6CF]">
                      {oc.setting} · {oc.auraType}
                    </p>
                    <p className="mt-2.5 text-sm leading-relaxed text-[#425870] dark:text-[#9EB6CF]">
                      {oc.summary}
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-[#D7E2EE] dark:border-[#2C4766] flex items-center justify-between text-xs font-semibold text-[#0369A1] dark:text-[#38BDF8]">
                    <span>Inspect dossier</span>
                    <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                  </div>
                </div>
              </button>
            </article>
          );
        })}
      </div>

      {/* Individual Friend OC Inspection Lightbox */}
      {activeFriend && selectedIndex !== null && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="oc-lightbox-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#0B1726]/75 p-3 sm:p-4 backdrop-blur-sm"
          onClick={() => setSelectedIndex(null)}
        >
          <div
            className="relative max-h-[92dvh] w-full max-w-4xl overflow-y-auto rounded-2xl aero-chrome-panel"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Brushed Y2K Silver Header */}
            <div className="aero-silver-header sticky top-0 z-10 flex items-center justify-between gap-3 px-4 sm:px-5 py-3 sm:py-3.5">
              <p className="min-w-0 truncate text-xs font-semibold text-[#0D1D2E] dark:text-[#ECF4FD] tabular-nums">
                Character Dossier · {activeFriend.name} ({String(selectedIndex + 1).padStart(2, '0')}{' '}
                of 06)
              </p>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  aria-label="Previous character"
                  onClick={() =>
                    setSelectedIndex(
                      (selectedIndex - 1 + FRIEND_OCS.length) % FRIEND_OCS.length,
                    )
                  }
                  className="inline-flex h-11 w-11 sm:h-9 sm:w-9 items-center justify-center rounded-lg aero-btn-silver text-[#0D1D2E] dark:text-[#ECF4FD]"
                >
                  <ChevronLeft className="h-5 w-5 sm:h-4 sm:w-4" />
                </button>
                <button
                  type="button"
                  aria-label="Next character"
                  onClick={() => setSelectedIndex((selectedIndex + 1) % FRIEND_OCS.length)}
                  className="inline-flex h-11 w-11 sm:h-9 sm:w-9 items-center justify-center rounded-lg aero-btn-silver text-[#0D1D2E] dark:text-[#ECF4FD]"
                >
                  <ChevronRight className="h-5 w-5 sm:h-4 sm:w-4" />
                </button>
                <button
                  type="button"
                  aria-label="Close character dossier"
                  onClick={() => setSelectedIndex(null)}
                  className="inline-flex h-11 w-11 sm:h-9 sm:w-9 items-center justify-center rounded-lg aero-btn-silver text-[#0D1D2E] dark:text-[#ECF4FD]"
                >
                  <X className="h-5 w-5 sm:h-4 sm:w-4" />
                </button>
              </div>
            </div>

            <div className="p-4 sm:p-7">
              <div className="rounded-xl p-2.5 aero-silver-frame">
                <div className="overflow-hidden rounded-lg aero-silver-mat bg-[#0B1416]">
                  <img
                    src={activeFriend.image}
                    alt={`${activeFriend.name} character inspection sheet`}
                    referrerPolicy="no-referrer"
                    className="w-full h-auto block"
                  />
                </div>
              </div>

              <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-12">
                <div className="sm:col-span-7">
                  <h3
                    id="oc-lightbox-title"
                    className="font-display text-2xl font-bold text-[#0D1D2E] dark:text-[#ECF4FD]"
                  >
                    {activeFriend.name}
                  </h3>
                  <p className="mt-1 text-xs font-medium text-[#425870] dark:text-[#9EB6CF]">
                    {activeFriend.setting} · Inspired by No, I’m Not a Human
                  </p>
                  <p className="mt-3 text-sm leading-relaxed text-[#425870] dark:text-[#9EB6CF]">
                    {activeFriend.summary}
                  </p>
                </div>

                <div className="sm:col-span-5 space-y-2.5 border-t pt-4 sm:border-t-0 sm:border-l sm:pt-0 sm:pl-6 border-[#D7E2EE] dark:border-[#2C4766]">
                  <div>
                    <p className="text-xs font-medium text-[#425870] dark:text-[#9EB6CF]">
                      Aura Silhouette
                    </p>
                    <p className="text-sm font-semibold text-[#0D1D2E] dark:text-[#ECF4FD]">
                      {activeFriend.auraType}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-[#425870] dark:text-[#9EB6CF]">
                      Diagnostic Checks
                    </p>
                    <p className="text-sm font-semibold text-[#0D1D2E] dark:text-[#ECF4FD]">
                      {activeFriend.checks}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
