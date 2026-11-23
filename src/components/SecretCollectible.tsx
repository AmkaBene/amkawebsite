import {useEffect, useState} from 'react';
import {Check} from 'lucide-react';
import {collectSecret, getFoundSecrets, SECRET_EGGS} from '../utils/secrets';

type EggVariant = 'banana' | 'bat' | 'star' | 'leek' | 'orb';

interface SecretCollectibleProps {
  eggId: string;
  variant: EggVariant;
  className?: string;
}

function playTreasureChime(isFinal: boolean) {
  try {
    const Ctx =
      window.AudioContext ||
      (window as unknown as {webkitAudioContext: typeof AudioContext}).webkitAudioContext;
    if (!Ctx) return;
    const ctx = new Ctx();
    const notes = isFinal
      ? [523.25, 659.25, 783.99, 1046.5, 1318.5]
      : [659.25, 880, 1174.66];
    notes.forEach((freq, idx) => {
      const start = ctx.currentTime + idx * 0.08;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, start);
      gain.gain.setValueAtTime(0.055, start);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.24);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(start);
      osc.stop(start + 0.26);
    });
  } catch {
    // ignore audio errors
  }
}

export function SecretCollectible({eggId, variant, className = ''}: SecretCollectibleProps) {
  const [collected, setCollected] = useState<boolean>(() => getFoundSecrets().includes(eggId));

  useEffect(() => {
    const sync = () => {
      setCollected(getFoundSecrets().includes(eggId));
    };
    window.addEventListener('amka:secrets-updated', sync);
    return () => window.removeEventListener('amka:secrets-updated', sync);
  }, [eggId]);

  const meta = SECRET_EGGS.find((s) => s.id === eggId);

  const handleCollect = () => {
    if (collected) return;
    const {newlyUnlockedAll} = collectSecret(eggId);
    setCollected(true);
    playTreasureChime(newlyUnlockedAll);
  };

  if (collected) {
    return (
      <span
        title={`${meta?.label || 'Secret'} collected!`}
        aria-label={`${meta?.label || 'Secret'} collected`}
        className={`inline-flex h-7 w-7 items-center justify-center rounded-full border border-[#F59E0B]/45 bg-[#FEF3C7]/70 dark:bg-[#451A03]/45 text-[#D97706] dark:text-[#FCD34D] opacity-70 ${className}`}
      >
        <Check className="h-3.5 w-3.5" />
      </span>
    );
  }

  return (
    <button
      type="button"
      onClick={handleCollect}
      title={`Hidden treasure: ${meta?.label || 'Collect secret'}`}
      aria-label={`Collect secret treasure: ${meta?.label || eggId}`}
      className={`group inline-flex h-8 w-8 items-center justify-center rounded-full border border-transparent hover:border-[#38BDF8]/60 hover:bg-white/65 dark:hover:bg-[#132942]/75 transition-all hover:scale-110 active:scale-95 focus-visible:outline-2 focus-visible:outline-[#0369A1] ${className}`}
    >
      {variant === 'banana' && (
        <svg viewBox="0 0 24 24" className="h-4.5 w-4.5 drop-shadow-sm" aria-hidden="true">
          <path
            d="M5 17C9 20 17 18 20 9C20.5 7.5 19.5 6 18.5 6C17.8 6 17.5 6.8 17.2 7.8C15.5 13 11 15 6.5 14.5C5.2 14.3 4.2 16 5 17Z"
            fill="#FACC15"
            stroke="#854D0E"
            strokeWidth="1.4"
          />
          <path d="M18.5 6L19.5 4.2" stroke="#713F12" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
      )}

      {variant === 'bat' && (
        <svg viewBox="0 0 24 24" className="h-4.5 w-4.5 drop-shadow-sm" aria-hidden="true">
          <path
            d="M12 10L9.5 7L9 11C6.5 9.5 3.5 10.5 2 13C4 13.5 5 15 5 16.5C7 15 8.5 15.5 10 17L12 18.5L14 17C15.5 15.5 17 15 19 16.5C19 15 20 13.5 22 13C20.5 10.5 17.5 9.5 15 11L14.5 7L12 10Z"
            fill="#334155"
            stroke="#0F172A"
            strokeWidth="1.2"
            strokeLinejoin="round"
          />
          <circle cx="10.8" cy="12.5" r="0.9" fill="#38BDF8" />
          <circle cx="13.2" cy="12.5" r="0.9" fill="#38BDF8" />
        </svg>
      )}

      {variant === 'star' && (
        <svg viewBox="0 0 24 24" className="h-4.5 w-4.5 drop-shadow-sm" aria-hidden="true">
          <defs>
            <linearGradient id="egg-star" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#FFFFFF" />
              <stop offset="50%" stopColor="#BAE6FD" />
              <stop offset="100%" stopColor="#64748B" />
            </linearGradient>
          </defs>
          <polygon
            points="12,2.5 14.9,8.4 21.5,9.3 16.7,13.9 17.9,20.5 12,17.4 6.1,20.5 7.3,13.9 2.5,9.3 9.1,8.4"
            fill="url(#egg-star)"
            stroke="#0369A1"
            strokeWidth="1.3"
            strokeLinejoin="round"
          />
        </svg>
      )}

      {variant === 'leek' && (
        <svg viewBox="0 0 24 24" className="h-4.5 w-4.5 drop-shadow-sm" aria-hidden="true">
          <path
            d="M6 19L12 13"
            stroke="#F8FAFC"
            strokeWidth="3.5"
            strokeLinecap="round"
          />
          <path
            d="M11 14L17 5M12 13L19 8"
            stroke="#22C55E"
            strokeWidth="3"
            strokeLinecap="round"
          />
          <path d="M5.5 19.5L11.5 13.5" stroke="#15803D" strokeWidth="1" strokeLinecap="round" />
        </svg>
      )}

      {variant === 'orb' && (
        <svg viewBox="0 0 24 24" className="h-4.5 w-4.5 drop-shadow-sm" aria-hidden="true">
          <defs>
            <radialGradient id="egg-orb" cx="35%" cy="30%" r="65%">
              <stop offset="0%" stopColor="#FFFFFF" />
              <stop offset="45%" stopColor="#38BDF8" />
              <stop offset="100%" stopColor="#0369A1" />
            </radialGradient>
          </defs>
          <circle cx="12" cy="12" r="8.5" fill="url(#egg-orb)" stroke="#075985" strokeWidth="1.2" />
          <ellipse cx="9.5" cy="9" rx="2.5" ry="1.3" transform="rotate(-25 9.5 9)" fill="white" opacity="0.85" />
        </svg>
      )}
    </button>
  );
}
