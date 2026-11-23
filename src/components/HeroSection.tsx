import {useState} from 'react';
import {ArrowUpRight} from 'lucide-react';
import {PROFILE} from '../data/profileData';
import {SecretCollectible} from './SecretCollectible';

export function HeroSection() {
  const [heroImgError, setHeroImgError] = useState(false);
  const [logoError, setLogoError] = useState(false);

  const summaryColumns = [
    {
      label: 'Origin',
      primary: `${PROFILE.originCity}, Mongolia`,
      secondary: `Age ${PROFILE.age} · ${PROFILE.nationality}`,
    },
    {
      label: 'University',
      primary: PROFILE.university,
      secondary: `${PROFILE.major} · ${PROFILE.campus}`,
    },
    {
      label: 'Disciplines',
      primary: 'Drawing, Painting & Code',
      secondary: 'Digital Art · Posters · TypeScript',
    },
    {
      label: 'Soundtrack',
      primary: '8 Defining Artists',
      secondary: 'Melanie · Lana · Mitski · ILLIT · AURORA · TV Girl · Björk · Hatsune Miku',
    },
  ];

  return (
    <section id="top" className="mx-auto max-w-[1200px] px-4 pt-8 pb-10 sm:px-6 sm:pt-12">
      {/* Split-Screen Hero */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:items-stretch">
        {/* Left Column: Logo Emblem & Typographic Hierarchy */}
        <div className="lg:col-span-6 flex flex-col justify-between rounded-2xl aero-chrome-panel p-6 sm:p-8 lg:p-10">
          <div>
            {/* Amka's Y2K Silver Digital Camera Logo */}
            <div className="mb-6 flex flex-col items-start gap-3.5 sm:flex-row sm:items-center sm:gap-4">
              <div className="w-36 sm:w-44 rounded-xl p-1.5 aero-silver-frame shrink-0">
                <div className="overflow-hidden rounded-lg aero-silver-mat bg-white">
                  {!logoError ? (
                    <img
                      src={PROFILE.logoImage}
                      alt="Amka Vlog personal logo rendered inside a silver Y2K digital camera screen"
                      referrerPolicy="no-referrer"
                      onError={() => setLogoError(true)}
                      className="h-auto w-full block object-cover"
                    />
                  ) : (
                    <div className="px-4 py-3 text-center text-xs font-bold text-[#0F1F30]">
                      Amka Vlog
                    </div>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <p className="text-xs font-medium leading-relaxed text-[#465B73] dark:text-[#9EB6CF]">
                  Sungkyunkwan University
                  <br />
                  Computer Science · Suwon Campus
                </p>
                <SecretCollectible eggId="secret-banana" variant="banana" />
              </div>
            </div>

            <h1
              className="font-display text-[clamp(1.85rem,6.4vw,3.15rem)] sm:text-[clamp(2.1rem,3.8vw,3.15rem)] font-bold leading-[1.12] tracking-tight text-[#0F1F30] dark:text-[#ECF4FD]"
              style={{textWrap: 'balance'}}
            >
              Amka — drawing worlds, painting light &amp; writing code.
            </h1>

            <p className="mt-5 max-w-[58ch] text-[15px] leading-[1.68] text-[#465B73] dark:text-[#9EB6CF]">
              I’m a 19-year-old Mongolian Computer Science major at{' '}
              <span className="font-medium text-[#0F1F30] dark:text-[#ECF4FD]">
                Sungkyunkwan University
              </span>
              . Between systems programming and algorithms, I illustrate celestial horses, surreal
              characters, and mixed-media posters—all housed in a Frutiger Aero and Y2K silver
              digital studio.
            </p>
          </div>

          <div className="mt-8 grid grid-cols-2 gap-3 pt-6 border-t border-[#DAE3EE] dark:border-[#2C4766] sm:flex sm:flex-wrap sm:items-center sm:gap-3.5">
            <a
              href="#works"
              className="col-span-2 inline-flex min-h-[46px] sm:min-h-[44px] items-center justify-center rounded-xl px-5 py-2.5 text-sm font-semibold aero-btn-aqua whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0369A1]"
            >
              Explore My Art &amp; Code
            </a>

            <a
              href={PROFILE.githubUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-[46px] sm:min-h-[44px] items-center justify-center gap-1.5 rounded-xl px-4 py-2.5 text-sm font-medium aero-btn-silver whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0369A1]"
            >
              <span>GitHub</span>
              <ArrowUpRight className="h-4 w-4 text-[#0369A1] dark:text-[#38BDF8]" />
            </a>

            <a
              href={PROFILE.instagramUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-[46px] sm:min-h-[44px] items-center justify-center gap-1.5 rounded-xl px-4 py-2.5 text-sm font-medium aero-btn-silver whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0369A1]"
            >
              <span>Instagram</span>
              <ArrowUpRight className="h-4 w-4 text-[#0369A1] dark:text-[#38BDF8]" />
            </a>
          </div>
        </div>

        {/* Right Column: Amka's Frutiger Aero Desktop Portrait in a Y2K Silver Frame (exact 1:1 fit) */}
        <div className="lg:col-span-6 flex items-center justify-center">
          <div className="w-full max-w-[520px] lg:max-w-none overflow-hidden rounded-2xl p-3 aero-silver-frame">
            <div className="relative aspect-square w-full overflow-hidden rounded-xl aero-silver-mat bg-gradient-to-b from-[#7DD3FC]/35 via-[#BAE6FD]/35 to-[#BBF7D0]/35">
              {!heroImgError ? (
                <img
                  src={PROFILE.heroArtwork}
                  alt="Amka framed inside a Frutiger Aero Windows Media Player desktop collage with a leaping dolphin and retro Windows 95 menus"
                  referrerPolicy="no-referrer"
                  onError={() => setHeroImgError(true)}
                  className="block h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full flex-col items-center justify-center p-8 text-center">
                  <p className="font-editorial text-2xl italic text-[#0F1F30] dark:text-[#ECF4FD]">
                    Amka · Frutiger Aero Desktop Collage
                  </p>
                  <p className="mt-2 text-xs text-[#465B73] dark:text-[#9EB6CF]">
                    Windows Media Player Edition
                  </p>
                </div>
              )}

              <div className="pointer-events-none absolute inset-0 aero-specular-sheen" />
              <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#0B1726]/80 via-[#0B1726]/35 to-transparent px-5 py-3.5">
                <p className="text-xs font-medium text-white/95">
                  Amka · Windows Media Player &amp; Frutiger Aero Desktop Collage
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Full-Width 4-Column Summary Row Below Split */}
      <div className="mt-6 grid grid-cols-1 divide-y divide-[#C5D2E0] dark:divide-[#2C4766] rounded-2xl aero-chrome-panel sm:grid-cols-2 sm:divide-y-0 sm:divide-x lg:grid-cols-4">
        {summaryColumns.map((item) => (
          <div key={item.label} className="px-6 py-5">
            <p className="text-xs font-medium text-[#465B73] dark:text-[#9EB6CF]">{item.label}</p>
            <p className="mt-1.5 text-sm font-semibold text-[#0F1F30] dark:text-[#ECF4FD] tabular-nums">
              {item.primary}
            </p>
            <p
              className="mt-1 text-xs text-[#465B73] dark:text-[#9EB6CF] truncate"
              title={item.secondary}
            >
              {item.secondary}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
