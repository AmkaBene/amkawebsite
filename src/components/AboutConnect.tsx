import {useState} from 'react';
import {ArrowUpRight, Disc3} from 'lucide-react';
import {PROFILE} from '../data/profileData';
import {SecretCollectible} from './SecretCollectible';

export function AboutConnect() {
  const [logoError, setLogoError] = useState(false);
  const [spinMode, setSpinMode] = useState<'normal' | 'turbo' | 'paused'>('normal');

  const cycleSpin = () => {
    setSpinMode((prev) =>
      prev === 'normal' ? 'turbo' : prev === 'turbo' ? 'paused' : 'normal',
    );
  };

  return (
    <footer id="connect" className="mx-auto max-w-[1200px] px-4 pt-12 pb-16 sm:px-6 sm:pt-16">
      <div className="overflow-hidden rounded-2xl aero-chrome-panel">
        <div className="grid grid-cols-1 gap-8 p-6 sm:p-8 lg:grid-cols-12 lg:items-center lg:p-10">
          {/* Left Column: Amka's Silver Digi-Cam Emblem + Spinning Y2K Holographic CD */}
          <div className="lg:col-span-5 flex flex-col items-center gap-5 lg:items-start">
            <div className="w-full max-w-[380px] overflow-hidden rounded-2xl p-2.5 aero-silver-frame">
              <div className="w-full overflow-hidden rounded-xl aero-silver-mat bg-gradient-to-br from-[#DCE8F5] to-[#E6F0FA] dark:from-[#12263C] dark:to-[#0A1829]">
                {!logoError ? (
                  <img
                    src={PROFILE.logoImage}
                    alt="Amka Vlog personal logo inside a Y2K brushed silver digital camera frame"
                    referrerPolicy="no-referrer"
                    onError={() => setLogoError(true)}
                    className="h-auto w-full block object-contain"
                  />
                ) : (
                  <div className="flex aspect-video w-full flex-col items-center justify-center p-6 text-center">
                    <p className="font-editorial text-2xl italic text-[#0F1F30] dark:text-[#ECF4FD]">
                      Amka Vlog
                    </p>
                    <p className="mt-1 text-xs text-[#465B73] dark:text-[#9EB6CF]">
                      Mongolia · SKKU CS
                    </p>
                  </div>
                )}
              </div>
              <p className="mt-2.5 px-1 text-center text-xs font-medium text-[#465B73] dark:text-[#C5D8EC]">
                Amka’s Creator Mark · Silver Digi-Cam Emblem
              </p>
            </div>

            {/* Interactive Spinning Y2K Holographic Chrome CD-ROM */}
            <div className="flex w-full max-w-[380px] items-center gap-2">
              <button
                type="button"
                onClick={cycleSpin}
                aria-label={`Spinning Y2K chrome disc, currently ${spinMode}. Click to change speed.`}
                className="group flex flex-1 min-w-0 items-center gap-4 rounded-2xl border border-[#B5C7DA] dark:border-[#2C4766] bg-white/75 dark:bg-[#0D1E31]/85 px-4 py-3 text-left transition-colors hover:border-[#0369A1] dark:hover:border-[#38BDF8]"
              >
                <div
                  className={`relative h-14 w-14 shrink-0 rounded-full border border-[#8EA5BF] shadow-[inset_0_1px_2px_rgba(255,255,255,0.9),0_4px_10px_rgba(12,28,44,0.2)] ${
                    spinMode === 'turbo'
                      ? 'animate-aero-disc-fast'
                      : spinMode === 'normal'
                        ? 'animate-aero-disc'
                        : ''
                  }`}
                  style={{
                    background:
                      'conic-gradient(from 0deg, #e2e8f0, #7dd3fc, #f8fafc, #6ee7b7, #bae6fd, #cbd5e1, #e0f2fe, #e2e8f0)',
                  }}
                >
                  <div className="absolute inset-[17px] rounded-full border border-[#94A3B8] bg-[#F8FAFC] dark:bg-[#0C1C2E]" />
                  <div className="absolute inset-[22px] rounded-full border border-[#64748B] bg-[#DCE7F3] dark:bg-[#193047]" />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-[#0C1C2C] dark:text-[#ECF4FD]">
                    <Disc3 className="h-3.5 w-3.5 text-[#0369A1] dark:text-[#38BDF8]" />
                    <span className="truncate">Y2K Chrome Disc · Amka Archive</span>
                  </div>
                  <p className="mt-0.5 text-xs text-[#465B73] dark:text-[#9EB6CF]">
                    Spin: <span className="font-semibold capitalize">{spinMode}</span> · Click to
                    change speed
                  </p>
                </div>
              </button>
              <SecretCollectible eggId="secret-orb" variant="orb" />
            </div>
          </div>

          {/* Bio & Direct Social Links */}
          <div className="lg:col-span-7 flex flex-col justify-between">
            <div>
              <p className="text-xs font-medium text-[#465B73] dark:text-[#9EB6CF]">
                About Me · {PROFILE.nationality} · Age {PROFILE.age}
              </p>
              <h2
                className="mt-2 font-display text-2xl font-bold tracking-tight text-[#0F1F30] dark:text-[#ECF4FD] sm:text-3xl"
                style={{textWrap: 'balance'}}
              >
                Studying Computer Science at Sungkyunkwan University, creating in between.
              </h2>
              <p className="mt-4 max-w-[65ch] text-[15px] leading-[1.68] text-[#465B73] dark:text-[#9EB6CF]">
                I grew up in Mongolia and moved to Suwon to study Computer Science at SKKU’s
                Natural Sciences Campus. Whether I’m writing TypeScript and C structs, painting
                Frutiger Aero skies and Mongolian steeds, or putting together experimental posters,
                I love spaces that feel expressive, tactile, and nostalgic—like 2000s digital
                cameras and clear water reflections.
              </p>
            </div>

            {/* Direct Links Grid */}
            <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <a
                href={PROFILE.githubUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center justify-between rounded-xl border border-[#C5D2E0] dark:border-[#2C4766] bg-white/85 dark:bg-[#102237]/90 px-5 py-4 transition-colors hover:border-[#0369A1] dark:hover:border-[#38BDF8] hover:bg-white dark:hover:bg-[#162C46] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0369A1]"
              >
                <div>
                  <p className="text-xs font-medium text-[#465B73] dark:text-[#9EB6CF]">
                    Code &amp; Repositories
                  </p>
                  <p className="mt-1 font-display text-base font-bold text-[#0F1F30] dark:text-[#ECF4FD] group-hover:text-[#0369A1] dark:group-hover:text-[#38BDF8]">
                    GitHub · @{PROFILE.githubHandle}
                  </p>
                </div>
                <ArrowUpRight className="h-5 w-5 text-[#0369A1] dark:text-[#38BDF8] transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </a>

              <a
                href={PROFILE.instagramUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center justify-between rounded-xl border border-[#C5D2E0] dark:border-[#2C4766] bg-white/85 dark:bg-[#102237]/90 px-5 py-4 transition-colors hover:border-[#0369A1] dark:hover:border-[#38BDF8] hover:bg-white dark:hover:bg-[#162C46] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0369A1]"
              >
                <div>
                  <p className="text-xs font-medium text-[#465B73] dark:text-[#9EB6CF]">
                    Art, Sketches &amp; Life
                  </p>
                  <p className="mt-1 font-display text-base font-bold text-[#0F1F30] dark:text-[#ECF4FD] group-hover:text-[#0369A1] dark:group-hover:text-[#38BDF8]">
                    Instagram · @{PROFILE.instagramHandle}
                  </p>
                </div>
                <ArrowUpRight className="h-5 w-5 text-[#0369A1] dark:text-[#38BDF8] transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </a>
            </div>
          </div>
        </div>

        {/* Quiet Copyright Bar */}
        <div className="aero-silver-header flex flex-col gap-3 px-6 py-4 text-xs text-[#465B73] dark:text-[#9EB6CF] sm:flex-row sm:items-center sm:justify-between">
          <p>
            © 2026 {PROFILE.name} · Sungkyunkwan University Computer Science · Ulaanbaatar &amp;
            Suwon
          </p>
          <div className="flex items-center gap-5">
            <a href="#top" className="hover:text-[#0F1F30] dark:hover:text-white transition-colors">
              Back to top
            </a>
            <a
              href={PROFILE.githubUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-[#0F1F30] dark:hover:text-white transition-colors"
            >
              GitHub
            </a>
            <a
              href={PROFILE.instagramUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-[#0F1F30] dark:hover:text-white transition-colors"
            >
              Instagram
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
