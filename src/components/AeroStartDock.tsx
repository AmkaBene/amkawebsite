import {useEffect, useRef, useState} from 'react';
import {
  Camera,
  Check,
  Clock,
  Fish,
  Gamepad2,
  HelpCircle,
  Image as ImageIcon,
  Lock,
  Mail,
  MessageSquare,
  Moon,
  Music,
  Palette,
  RotateCcw,
  Sparkles,
  Sun,
  Trophy,
  Users,
} from 'lucide-react';
import type {SiteTheme} from '../App';
import {
  getFoundSecrets,
  getGoldenAeroEnabled,
  resetSecretsProgress,
  SECRET_EGGS,
  setGoldenAeroEnabled,
} from '../utils/secrets';

interface AeroStartDockProps {
  theme: SiteTheme;
  onToggleTheme: () => void;
}

const START_SECTIONS = [
  {label: 'Dual Clock', href: '#dual-clock', icon: Clock, sub: 'Suwon & Ulaanbaatar'},
  {label: 'Aquarium', href: '#aquarium', icon: Fish, sub: 'Feed fish & starfish'},
  {label: 'Y2K Arcade', href: '#games', icon: Gamepad2, sub: 'Snake, Tetris, Wordle'},
  {label: 'Works Studio', href: '#works', icon: ImageIcon, sub: 'Art & code pieces'},
  {label: 'Photobooth', href: '#photobooth', icon: Camera, sub: '4-cut & filters'},
  {label: 'Audio Deck', href: '#soundtrack', icon: Music, sub: '8 favorite artists'},
  {label: 'Paint Pad', href: '#studio', icon: Palette, sub: 'Draw & export PNG'},
  {label: 'Friends & OCs', href: '#friends', icon: Users, sub: 'Outings & characters'},
  {label: 'Amka Quiz', href: '#quiz', icon: HelpCircle, sub: '9 lore questions'},
  {label: 'Visitor Notes', href: '#notes', icon: MessageSquare, sub: 'Guestbook board'},
  {label: 'Secret Vault', href: '#vault', icon: Lock, sub: 'Passcode gallery'},
  {label: 'Connect', href: '#connect', icon: Mail, sub: 'GitHub & Instagram'},
];

export function AeroStartDock({theme, onToggleTheme}: AeroStartDockProps) {
  const [open, setOpen] = useState(false);
  const [foundIds, setFoundIds] = useState<string[]>(() => getFoundSecrets());
  const [goldenEnabled, setGoldenEnabled] = useState<boolean>(() => getGoldenAeroEnabled());
  const [showClues, setShowClues] = useState(false);
  const [mikuHidden, setMikuHidden] = useState(false);

  const dockRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const syncSecrets = () => {
      setFoundIds(getFoundSecrets());
      setGoldenEnabled(getGoldenAeroEnabled());
    };
    const onMikuStatus = (ev: Event) => {
      const detail = (ev as CustomEvent<{dismissed: boolean}>).detail;
      if (detail && typeof detail.dismissed === 'boolean') {
        setMikuHidden(detail.dismissed);
      }
    };

    window.addEventListener('amka:secrets-updated', syncSecrets);
    window.addEventListener('amka:miku-status', onMikuStatus);
    return () => {
      window.removeEventListener('amka:secrets-updated', syncSecrets);
      window.removeEventListener('amka:miku-status', onMikuStatus);
    };
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    const onPointerDown = (e: PointerEvent) => {
      if (dockRef.current && !dockRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('pointerdown', onPointerDown);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('pointerdown', onPointerDown);
    };
  }, [open]);

  const allUnlocked = foundIds.length >= SECRET_EGGS.length;

  const handleToggleGolden = () => {
    if (!allUnlocked) {
      setShowClues(true);
      return;
    }
    const next = !goldenEnabled;
    setGoldenAeroEnabled(next);
    setGoldenEnabled(next);
  };

  const handleSummonMiku = () => {
    const nextDismissed = !mikuHidden;
    window.dispatchEvent(new CustomEvent('amka:miku-set', {detail: {dismissed: nextDismissed}}));
    setMikuHidden(nextDismissed);
  };

  const handleCelebrateMiku = () => {
    window.dispatchEvent(new CustomEvent('amka:miku-set', {detail: {dismissed: false}}));
    window.dispatchEvent(new CustomEvent('amka:miku-celebrate'));
    setMikuHidden(false);
  };

  return (
    <div ref={dockRef} className="fixed bottom-3 left-3 z-40">
      {/* Vista / Windows 7 Inspired Brushed Silver Glass Start Menu */}
      {open && (
        <div
          role="dialog"
          aria-label="Frutiger Aero Start Menu"
          className="mb-2.5 w-[356px] max-w-[calc(100vw-24px)] max-h-[min(78dvh,560px)] overflow-hidden rounded-2xl aero-chrome-panel shadow-2xl flex flex-col"
        >
          {/* Start Menu Glossy Profile Titlebar */}
          <div className="aero-silver-header flex items-center justify-between gap-3 px-4 py-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <span
                aria-hidden="true"
                className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-[#0284C7] bg-gradient-to-br from-[#E0F2FE] via-[#38BDF8] to-[#0369A1] text-xs font-bold text-white shadow-sm"
              >
                AK
              </span>
              <div className="min-w-0">
                <p className="font-display text-xs font-bold text-[#0D1D2E] dark:text-[#ECF4FD] truncate">
                  Amka · Aero Start
                </p>
                <p className="text-[11px] text-[#425870] dark:text-[#9EB6CF] truncate">
                  SKKU Suwon · Computer Science
                </p>
              </div>
            </div>

            <span className="font-code text-[11px] font-semibold text-[#0369A1] dark:text-[#38BDF8] tabular-nums shrink-0">
              Secrets {foundIds.length}/{SECRET_EGGS.length}
            </span>
          </div>

          {/* Two-Pane Vista Layout */}
          <div className="grid grid-cols-1 sm:grid-cols-12 overflow-y-auto flex-1">
            {/* Left Pane: 12 Section Launchers */}
            <div className="sm:col-span-7 bg-white/85 dark:bg-[#0D1E31]/90 p-2.5 border-b sm:border-b-0 sm:border-r border-[#C5D2E0] dark:border-[#2C4766]">
              <p className="px-2 pb-1.5 text-[10px] font-semibold uppercase tracking-wider text-[#556B82] dark:text-[#8CA8C4]">
                Studio Programs
              </p>
              <nav aria-label="Aero Start sections" className="grid grid-cols-2 sm:grid-cols-1 gap-1">
                {START_SECTIONS.map((item) => {
                  const Icon = item.icon;
                  return (
                    <a
                      key={item.href}
                      href={item.href}
                      onClick={() => setOpen(false)}
                      className="flex items-center gap-2.5 rounded-lg px-2 py-1.5 text-left transition-colors hover:bg-[#E0F2FE] dark:hover:bg-[#17304D] focus-visible:outline-2 focus-visible:outline-[#0369A1]"
                    >
                      <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-[#B8C9DB] dark:border-[#2C4766] bg-gradient-to-b from-white to-[#DCE7F3] dark:from-[#172F4B] dark:to-[#0F2136] text-[#0369A1] dark:text-[#38BDF8]">
                        <Icon className="h-3.5 w-3.5" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-xs font-semibold text-[#0D1D2E] dark:text-[#ECF4FD] truncate">
                          {item.label}
                        </span>
                        <span className="hidden sm:block text-[10px] text-[#556B82] dark:text-[#8CA8C4] truncate">
                          {item.sub}
                        </span>
                      </span>
                    </a>
                  );
                })}
              </nav>
            </div>

            {/* Right Pane: Controls, Golden Aero Unlock & Secret Tracker */}
            <div className="sm:col-span-5 bg-gradient-to-b from-[#E5EFF9] to-[#D4E2F1] dark:from-[#10243B] dark:to-[#0A1828] p-3 flex flex-col justify-between gap-3">
              <div className="space-y-2">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-[#425870] dark:text-[#9EB6CF]">
                  Desktop Controls
                </p>

                <button
                  type="button"
                  onClick={onToggleTheme}
                  className="flex w-full min-h-[40px] sm:min-h-[36px] items-center justify-between gap-2 rounded-lg px-2.5 py-1.5 text-xs font-semibold aero-btn-silver"
                >
                  <span className="flex items-center gap-1.5">
                    {theme === 'light' ? (
                      <Moon className="h-3.5 w-3.5 text-[#0369A1]" />
                    ) : (
                      <Sun className="h-3.5 w-3.5 text-[#FDE047]" />
                    )}
                    <span>{theme === 'light' ? 'Dark Mode' : 'Light Mode'}</span>
                  </span>
                </button>

                <button
                  type="button"
                  onClick={handleToggleGolden}
                  className={`flex w-full min-h-[40px] sm:min-h-[36px] items-center justify-between gap-2 rounded-lg px-2.5 py-1.5 text-xs font-semibold ${
                    goldenEnabled && allUnlocked ? 'aero-btn-aqua' : 'aero-btn-silver'
                  }`}
                >
                  <span className="flex items-center gap-1.5 min-w-0">
                    <Trophy
                      className={`h-3.5 w-3.5 shrink-0 ${
                        allUnlocked
                          ? 'text-[#D97706] dark:text-[#FDE047]'
                          : 'text-[#64748B] dark:text-[#9EB6CF]'
                      }`}
                    />
                    <span className="truncate">
                      {allUnlocked
                        ? goldenEnabled
                          ? 'Golden Aero: On'
                          : 'Golden Aero: Off'
                        : `Golden (${foundIds.length}/5)`}
                    </span>
                  </span>
                </button>

                <button
                  type="button"
                  onClick={handleSummonMiku}
                  className="flex w-full min-h-[40px] sm:min-h-[36px] items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold aero-btn-silver"
                >
                  <Sparkles className="h-3.5 w-3.5 text-[#06B6D4]" />
                  <span>{mikuHidden ? 'Summon Miku 64' : 'Hide Miku 64'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleCelebrateMiku}
                  className="flex w-full min-h-[40px] sm:min-h-[36px] items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold aero-btn-aqua"
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>Miku Party!</span>
                </button>
              </div>

              {/* Secret Hunt Clues Drawer */}
              <div className="rounded-xl border border-[#B5C6D8] dark:border-[#2C4766] bg-white/65 dark:bg-[#0D1E31]/80 p-2.5">
                <div className="flex items-center justify-between gap-1">
                  <button
                    type="button"
                    onClick={() => setShowClues((prev) => !prev)}
                    className="text-[11px] font-semibold text-[#0369A1] dark:text-[#38BDF8] hover:underline"
                  >
                    {showClues ? 'Hide clues' : 'Secret clues'}
                  </button>
                  {foundIds.length > 0 && (
                    <button
                      type="button"
                      onClick={() => resetSecretsProgress()}
                      title="Reset secret hunt"
                      aria-label="Reset secret hunt progress"
                      className="inline-flex h-6 w-6 items-center justify-center rounded text-[#425870] dark:text-[#9EB6CF] hover:text-[#0D1D2E] dark:hover:text-white"
                    >
                      <RotateCcw className="h-3 w-3" />
                    </button>
                  )}
                </div>

                {showClues && (
                  <ul className="mt-2 space-y-1.5">
                    {SECRET_EGGS.map((egg) => {
                      const found = foundIds.includes(egg.id);
                      return (
                        <li key={egg.id} className="flex items-start gap-1.5 text-[10px] leading-snug">
                          <span
                            className={`mt-0.5 inline-flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full border ${
                              found
                                ? 'border-[#059669] bg-[#10B981] text-white'
                                : 'border-[#94A3B8] dark:border-[#475569]'
                            }`}
                          >
                            {found && <Check className="h-2.5 w-2.5" />}
                          </span>
                          <span
                            className={
                              found
                                ? 'text-[#059669] dark:text-[#34D399] font-semibold line-through'
                                : 'text-[#425870] dark:text-[#9EB6CF]'
                            }
                          >
                            {egg.hint}
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Glossy Translucent Frutiger Aero Orb Start Button */}
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-expanded={open}
        aria-label={open ? 'Close Frutiger Aero Start Menu' : 'Open Frutiger Aero Start Menu'}
        title="Aero Start Menu"
        className={`group relative flex h-12 w-12 items-center justify-center rounded-full border transition-transform duration-150 hover:scale-105 active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0369A1] ${
          goldenEnabled && allUnlocked
            ? 'border-[#F59E0B] bg-gradient-to-b from-[#FEF08A] via-[#D97706] to-[#78350F] shadow-[0_4px_14px_rgba(180,83,9,0.45),inset_0_2px_2px_rgba(255,255,255,0.85)]'
            : 'border-[#0284C7] bg-gradient-to-b from-[#BAE6FD] via-[#0EA5E9] to-[#0C4A6E] shadow-[0_4px_14px_rgba(3,105,161,0.45),inset_0_2px_2px_rgba(255,255,255,0.85)]'
        }`}
      >
        {/* Top glossy Aero dome specular reflection */}
        <span
          aria-hidden="true"
          className="pointer-events-none absolute top-[2px] left-1/2 -translate-x-1/2 h-[18px] w-[36px] rounded-full bg-gradient-to-b from-white/85 to-white/5"
        />

        {/* Classic 4-Pane Vista Flag Crystal */}
        <svg viewBox="0 0 24 24" className="relative z-10 h-5.5 w-5.5 drop-shadow" aria-hidden="true">
          <path d="M3.5 5.2C6 4.4 8.6 4.6 11 5.4V11H3.5V5.2Z" fill="#EF4444" />
          <path d="M12.5 5.8C15 6.5 17.6 6.4 20.5 5.2V11H12.5V5.8Z" fill="#22C55E" />
          <path d="M3.5 12.5H11V18.3C8.6 17.5 6 17.4 3.5 18.2V12.5Z" fill="#38BDF8" />
          <path d="M12.5 12.5H20.5V18.1C17.6 19.3 15 19.3 12.5 18.6V12.5Z" fill="#FACC15" />
        </svg>

        {/* Tiny progress badge if any secrets found */}
        {foundIds.length > 0 && (
          <span
            aria-hidden="true"
            className="absolute -top-1 -right-1 inline-flex h-4.5 min-w-[18px] items-center justify-center rounded-full border border-white bg-[#0369A1] px-1 font-code text-[9px] font-bold text-white shadow"
          >
            {foundIds.length}
          </span>
        )}
      </button>
    </div>
  );
}
