import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
  type TouchEvent,
} from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Eye,
  EyeOff,
  Heart,
  ImagePlus,
  Lock,
  LockOpen,
  Trash2,
  X,
} from 'lucide-react';
import {VAULT_PHOTOS, type VaultPhoto} from '../data/profileData';

const VAULT_PASSCODE = 'Mamuna247';
const STORAGE_KEY = 'amka_vault_unlocked';

export function VaultSection() {
  const [unlocked, setUnlocked] = useState<boolean>(() => {
    try {
      return sessionStorage.getItem(STORAGE_KEY) === 'true';
    } catch {
      return false;
    }
  });
  const [passInput, setPassInput] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [localPhotos, setLocalPhotos] = useState<VaultPhoto[]>([]);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const swipeStartXRef = useRef<number | null>(null);

  const allVaultPhotos = [...VAULT_PHOTOS, ...localPhotos];
  const activePhoto = activeIndex !== null ? allVaultPhotos[activeIndex] ?? null : null;

  useEffect(() => {
    if (activeIndex === null) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setActiveIndex(null);
      } else if (e.key === 'ArrowRight') {
        setActiveIndex((prev) =>
          prev === null ? null : (prev + 1) % allVaultPhotos.length,
        );
      } else if (e.key === 'ArrowLeft') {
        setActiveIndex((prev) =>
          prev === null ? null : (prev - 1 + allVaultPhotos.length) % allVaultPhotos.length,
        );
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [activeIndex, allVaultPhotos.length]);

  const handleUnlock = (e: FormEvent) => {
    e.preventDefault();
    if (passInput.trim() === VAULT_PASSCODE) {
      setUnlocked(true);
      setErrorMsg(null);
      setPassInput('');
      try {
        sessionStorage.setItem(STORAGE_KEY, 'true');
      } catch {
        // ignore storage restrictions
      }
    } else {
      setErrorMsg('Incorrect passcode. Check spelling and capitalization.');
    }
  };

  const handleLock = () => {
    setUnlocked(false);
    setActiveIndex(null);
    setPassInput('');
    setErrorMsg(null);
    try {
      sessionStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore storage restrictions
    }
  };

  const handleAddLocalPreview = (e: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) return;

    files.forEach((file) => {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result !== 'string') return;
        const cleanTitle = file.name.replace(/\.[^.]+$/, '') || 'Vault Frame';
        setLocalPhotos((prev) => [
          ...prev,
          {
            id: `local-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            title: cleanTitle,
            date: new Date().toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            }),
            caption: 'Session photo preview inside your unlocked vault.',
            image: reader.result as string,
          },
        ]);
      };
      reader.readAsDataURL(file);
    });
    e.target.value = '';
  };

  const handleLightboxTouchStart = (e: TouchEvent<HTMLDivElement>) => {
    swipeStartXRef.current = e.touches[0]?.clientX ?? null;
  };

  const handleLightboxTouchEnd = (e: TouchEvent<HTMLDivElement>) => {
    if (swipeStartXRef.current === null || activeIndex === null) return;
    const endX = e.changedTouches[0]?.clientX;
    if (typeof endX !== 'number') return;
    const delta = endX - swipeStartXRef.current;
    swipeStartXRef.current = null;

    if (Math.abs(delta) < 42) return;
    if (delta < 0) {
      setActiveIndex((activeIndex + 1) % allVaultPhotos.length);
    } else {
      setActiveIndex((activeIndex - 1 + allVaultPhotos.length) % allVaultPhotos.length);
    }
  };

  return (
    <section id="vault" className="mx-auto max-w-[1200px] px-4 py-12 sm:px-6 sm:py-16">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-medium text-[#40566E] dark:text-[#9EB6CF]">
            Locked Silver Archive · Passcode Protected Dedication
          </p>
          <h2 className="mt-2 font-display text-2xl font-bold tracking-tight text-[#0C1C2C] dark:text-[#ECF4FD] sm:text-3xl">
            Private Memory Vault
          </h2>
        </div>

        <p className="font-code text-xs text-[#40566E] dark:text-[#9EB6CF] tabular-nums">
          {unlocked
            ? `Unlocked · ${allVaultPhotos.length} Silver Frames`
            : 'Locked · Passcode Required'}
        </p>
      </div>

      <div className="overflow-hidden rounded-2xl aero-chrome-panel">
        {/* Brushed Silver Header Bar */}
        <div className="aero-silver-header flex flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-5 sm:py-3.5">
          <div className="flex items-center gap-2 text-xs font-semibold text-[#0C1C2C] dark:text-[#ECF4FD]">
            {unlocked ? (
              <LockOpen className="h-4 w-4 text-[#047857] dark:text-[#34D399]" />
            ) : (
              <Lock className="h-4 w-4 text-[#0369A1] dark:text-[#38BDF8]" />
            )}
            <span>
              {unlocked ? 'For Mamuna · Unlocked Silver Vault' : 'Encrypted Photo Archive'}
            </span>
          </div>

          {unlocked && (
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex min-h-[44px] sm:min-h-[36px] items-center gap-1.5 rounded-lg px-3.5 sm:px-3 py-1.5 text-xs font-semibold aero-btn-aqua whitespace-nowrap shrink-0"
              >
                <ImagePlus className="h-3.5 w-3.5" />
                <span>Add Preview</span>
              </button>
              <button
                type="button"
                onClick={handleLock}
                className="inline-flex min-h-[44px] sm:min-h-[36px] items-center gap-1.5 rounded-lg px-3.5 sm:px-3 py-1.5 text-xs font-semibold aero-btn-silver whitespace-nowrap shrink-0"
              >
                <Lock className="h-3.5 w-3.5" />
                <span>Lock Vault</span>
              </button>
            </div>
          )}
        </div>

        {!unlocked ? (
          /* Locked State */
          <div className="px-5 py-10 sm:px-8 sm:py-16">
            <div className="mx-auto max-w-md text-center">
              <div className="mx-auto inline-flex h-14 w-14 items-center justify-center rounded-2xl aero-silver-frame">
                <Lock className="h-6 w-6 text-[#0369A1] dark:text-[#38BDF8]" />
              </div>
              <h3 className="mt-5 font-display text-xl font-bold text-[#0C1C2C] dark:text-[#ECF4FD]">
                Enter Passcode to Unlock
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-[#40566E] dark:text-[#9EB6CF]">
                A password-protected silver gallery holding Amka’s private dedication and keepsake
                photos.
              </p>

              <form onSubmit={handleUnlock} className="mt-6 space-y-3 text-left">
                <div className="relative">
                  <label htmlFor="vault-passcode" className="sr-only">
                    Vault passcode
                  </label>
                  <input
                    id="vault-passcode"
                    type={showPass ? 'text' : 'password'}
                    value={passInput}
                    onChange={(e) => {
                      setPassInput(e.target.value);
                      if (errorMsg) setErrorMsg(null);
                    }}
                    placeholder="Enter passcode..."
                    autoComplete="off"
                    className="w-full min-h-[46px] rounded-xl border border-[#B5C7DA] dark:border-[#365273] bg-white/95 dark:bg-[#0D1E31] px-4 py-3 pr-12 text-base sm:text-sm text-[#0C1C2C] dark:text-[#ECF4FD] placeholder:text-[#64748B] dark:placeholder:text-[#7892AD] shadow-inner focus:outline-2 focus:outline-[#0369A1] dark:focus:outline-[#38BDF8]"
                  />
                  <button
                    type="button"
                    aria-label={showPass ? 'Hide passcode' : 'Show passcode'}
                    onClick={() => setShowPass((v) => !v)}
                    className="absolute right-1.5 top-1/2 -translate-y-1/2 inline-flex h-10 w-10 items-center justify-center rounded-lg text-[#40566E] dark:text-[#9EB6CF] hover:text-[#0C1C2C] dark:hover:text-white"
                  >
                    {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>

                {errorMsg && (
                  <p role="alert" className="text-xs font-medium text-[#BE185D] dark:text-[#FB7185]">
                    {errorMsg}
                  </p>
                )}

                <button
                  type="submit"
                  className="inline-flex min-h-[46px] sm:min-h-[44px] w-full items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold aero-btn-aqua"
                >
                  <LockOpen className="h-4 w-4" />
                  <span>Unlock Archive</span>
                </button>
              </form>
            </div>
          </div>
        ) : (
          /* Unlocked State: Mamuna Dedication & Silver Photo Gallery */
          <div className="p-4 sm:p-8">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleAddLocalPreview}
              className="hidden"
            />

            {/* Heartfelt Dedication Header */}
            <div className="mb-6 sm:mb-8 rounded-2xl border border-[#C5D2E0] dark:border-[#2C4766] bg-gradient-to-br from-[#F4FAFF] via-[#FFFFFF] to-[#E9F7F4] dark:from-[#0D2136] dark:via-[#11273F] dark:to-[#0C2528] p-5 sm:p-7">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="max-w-2xl">
                  <p className="inline-flex items-center gap-1.5 text-xs font-medium text-[#0369A1] dark:text-[#38BDF8]">
                    <Heart className="h-3.5 w-3.5 fill-current" />
                    <span>Secret Vault · Mamuna Edition</span>
                  </p>
                  <h3
                    className="mt-2 font-editorial text-2xl sm:text-3xl font-semibold italic leading-snug text-[#0C1C2C] dark:text-[#ECF4FD]"
                    style={{textWrap: 'balance'}}
                  >
                    Dedicated to my smart, beautiful, funny, sexy, love of my life, Mamuna.
                  </h3>
                  <p className="mt-2.5 text-sm leading-relaxed text-[#40566E] dark:text-[#9EB6CF]">
                    Every arcade mirror selfie, pizza slice, forest hug, and 6-cut booth strip lives
                    here in brushed silver frames—just for the two of us. Tap any photo to open it
                    full-screen.
                  </p>
                </div>

                <p className="font-code text-xs text-[#40566E] dark:text-[#9EB6CF] tabular-nums shrink-0">
                  {allVaultPhotos.length} Frames Saved
                </p>
              </div>
            </div>

            {/* Natural-Ratio Silver Framed Masonry Gallery */}
            <div className="columns-1 gap-5 sm:columns-2 lg:columns-3">
              {allVaultPhotos.map((item, idx) => (
                <article
                  key={item.id}
                  className="group mb-5 inline-block w-full break-inside-avoid overflow-hidden rounded-2xl aero-chrome-panel transition-transform duration-200 hover:-translate-y-0.5"
                >
                  <button
                    type="button"
                    onClick={() => setActiveIndex(idx)}
                    className="block w-full text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0369A1]"
                  >
                    <div className="w-full border-b border-[#B9C9DA] dark:border-[#2C4766] p-2.5 aero-silver-frame">
                      <div className="relative overflow-hidden rounded-lg aero-silver-mat bg-[#E8F0F8] dark:bg-[#0D1E31]">
                        <img
                          src={item.image}
                          alt={item.title}
                          referrerPolicy="no-referrer"
                          loading="lazy"
                          className="block h-auto w-full transition-transform duration-300 group-hover:scale-[1.015]"
                        />
                        <div className="pointer-events-none absolute inset-0 aero-specular-sheen" />
                      </div>
                    </div>
                  </button>

                  <div className="flex items-start justify-between gap-3 p-4">
                    <button
                      type="button"
                      onClick={() => setActiveIndex(idx)}
                      className="min-w-0 flex-1 text-left"
                    >
                      <h4 className="font-display text-base font-bold text-[#0C1C2C] dark:text-[#ECF4FD] group-hover:text-[#0369A1] dark:group-hover:text-[#38BDF8] transition-colors">
                        {item.title}
                      </h4>
                      <p className="mt-1 text-xs leading-relaxed text-[#40566E] dark:text-[#9EB6CF]">
                        <span className="font-code tabular-nums">{item.date}</span> · {item.caption}
                      </p>
                    </button>

                    {item.id.startsWith('local-') && (
                      <button
                        type="button"
                        aria-label={`Remove ${item.title}`}
                        onClick={() => {
                          setLocalPhotos((prev) => prev.filter((p) => p.id !== item.id));
                          setActiveIndex(null);
                        }}
                        className="inline-flex h-11 w-11 sm:h-9 sm:w-9 shrink-0 items-center justify-center rounded-lg aero-btn-silver"
                      >
                        <Trash2 className="h-4 w-4 sm:h-3.5 sm:w-3.5" />
                      </button>
                    )}
                  </div>
                </article>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Fullscreen Silver Vault Photo Lightbox with Mobile Swipe */}
      {activePhoto && activeIndex !== null && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="vault-lightbox-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#0B1726]/82 p-3 sm:p-4 backdrop-blur-sm"
          onClick={() => setActiveIndex(null)}
        >
          <div
            onTouchStart={handleLightboxTouchStart}
            onTouchEnd={handleLightboxTouchEnd}
            className="relative max-h-[92dvh] w-full max-w-4xl overflow-y-auto rounded-2xl aero-chrome-panel"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="aero-silver-header sticky top-0 z-10 flex items-center justify-between gap-3 px-4 sm:px-5 py-3 sm:py-3.5">
              <p className="min-w-0 truncate text-xs font-semibold text-[#0C1C2C] dark:text-[#ECF4FD] tabular-nums">
                For Mamuna · {activePhoto.date} ({String(activeIndex + 1).padStart(2, '0')} of{' '}
                {String(allVaultPhotos.length).padStart(2, '0')})
              </p>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  aria-label="Previous memory"
                  onClick={() =>
                    setActiveIndex(
                      (activeIndex - 1 + allVaultPhotos.length) % allVaultPhotos.length,
                    )
                  }
                  className="inline-flex h-11 w-11 sm:h-9 sm:w-9 items-center justify-center rounded-lg aero-btn-silver text-[#0C1C2C] dark:text-[#ECF4FD]"
                >
                  <ChevronLeft className="h-5 w-5 sm:h-4 sm:w-4" />
                </button>
                <button
                  type="button"
                  aria-label="Next memory"
                  onClick={() => setActiveIndex((activeIndex + 1) % allVaultPhotos.length)}
                  className="inline-flex h-11 w-11 sm:h-9 sm:w-9 items-center justify-center rounded-lg aero-btn-silver text-[#0C1C2C] dark:text-[#ECF4FD]"
                >
                  <ChevronRight className="h-5 w-5 sm:h-4 sm:w-4" />
                </button>
                <button
                  type="button"
                  aria-label="Close vault photo viewer"
                  onClick={() => setActiveIndex(null)}
                  className="inline-flex h-11 w-11 sm:h-9 sm:w-9 items-center justify-center rounded-lg aero-btn-silver text-[#0C1C2C] dark:text-[#ECF4FD]"
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
                      src={activePhoto.image}
                      alt={activePhoto.title}
                      referrerPolicy="no-referrer"
                      className="block max-h-[62dvh] sm:max-h-[600px] w-auto max-w-full"
                    />
                  </div>
                </div>
              </div>

              <div className="mt-5">
                <h3
                  id="vault-lightbox-title"
                  className="font-display text-xl sm:text-2xl font-bold text-[#0C1C2C] dark:text-[#ECF4FD]"
                >
                  {activePhoto.title}
                </h3>
                <p className="mt-1.5 text-sm leading-relaxed text-[#40566E] dark:text-[#9EB6CF]">
                  {activePhoto.caption}
                </p>
                <p className="mt-2 font-code text-xs text-[#40566E] dark:text-[#9EB6CF] tabular-nums sm:hidden">
                  Swipe left or right for next memory
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
