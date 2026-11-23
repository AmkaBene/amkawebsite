export interface SecretEggMeta {
  id: string;
  label: string;
  hint: string;
}

export const SECRET_EGGS: SecretEggMeta[] = [
  {
    id: 'secret-banana',
    label: 'Silver Banana',
    hint: 'Tucked beside Amka’s camera badge at the top',
  },
  {
    id: 'secret-star-works',
    label: 'Chrome 5-Star',
    hint: 'Hidden near the Art & Code Studio filters',
  },
  {
    id: 'secret-leek',
    label: 'Crystal Leek',
    hint: 'Resting near the Silver Audio Deck',
  },
  {
    id: 'secret-bat',
    label: 'Midnight Bat',
    hint: 'Perched inside the Amka Lore Check header',
  },
  {
    id: 'secret-orb',
    label: 'Aero Pearl Orb',
    hint: 'Tucked beside the Y2K Chrome Disc in About',
  },
];

const FOUND_KEY = 'amka_found_secrets_v1';
const GOLDEN_KEY = 'amka_golden_aero_enabled';

export function getFoundSecrets(): string[] {
  try {
    const raw = localStorage.getItem(FOUND_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((x) => typeof x === 'string') : [];
  } catch {
    return [];
  }
}

export function getGoldenAeroEnabled(): boolean {
  try {
    return localStorage.getItem(GOLDEN_KEY) === 'true';
  } catch {
    return false;
  }
}

export function setGoldenAeroEnabled(enabled: boolean): void {
  try {
    localStorage.setItem(GOLDEN_KEY, String(enabled));
  } catch {
    // ignore storage errors
  }
  document.documentElement.classList.toggle('golden-aero', enabled);
  window.dispatchEvent(new CustomEvent('amka:secrets-updated'));
}

export function collectSecret(id: string): {found: string[]; newlyUnlockedAll: boolean} {
  const current = getFoundSecrets();
  if (current.includes(id)) {
    return {found: current, newlyUnlockedAll: false};
  }
  const next = [...current, id];
  try {
    localStorage.setItem(FOUND_KEY, JSON.stringify(next));
  } catch {
    // ignore storage errors
  }

  const newlyUnlockedAll = next.length >= SECRET_EGGS.length;
  if (newlyUnlockedAll) {
    setGoldenAeroEnabled(true);
    window.dispatchEvent(new CustomEvent('amka:miku-celebrate'));
  } else {
    window.dispatchEvent(new CustomEvent('amka:secrets-updated'));
  }

  const meta = SECRET_EGGS.find((s) => s.id === id);
  window.dispatchEvent(
    new CustomEvent('amka:secret-toast', {
      detail: {
        id,
        label: meta?.label || 'Secret Treasure',
        count: next.length,
        total: SECRET_EGGS.length,
        unlockedAll: newlyUnlockedAll,
      },
    }),
  );

  return {found: next, newlyUnlockedAll};
}

export function resetSecretsProgress(): void {
  try {
    localStorage.removeItem(FOUND_KEY);
    localStorage.removeItem(GOLDEN_KEY);
  } catch {
    // ignore
  }
  document.documentElement.classList.remove('golden-aero');
  window.dispatchEvent(new CustomEvent('amka:secrets-updated'));
}
