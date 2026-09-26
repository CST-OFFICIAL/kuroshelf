import { ThemeMode } from '../types';

const THEME_STORAGE_KEY = 'kuro_theme_mode';

// Application scale set to 90%
export const LOCKED_APP_SCALE = '90%';

export function getStoredThemeMode(): ThemeMode {
  try {
    const saved = localStorage.getItem(THEME_STORAGE_KEY);
    if (saved === 'light' || saved === 'dark' || saved === 'system') {
      return saved;
    }
  } catch {
    // ignore
  }
  return 'dark'; // default theme
}

export function setStoredThemeMode(mode: ThemeMode): void {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, mode);
  } catch {
    // ignore
  }
  applyTheme(mode);
}

/**
 * Sets application scale at 90%
 */
export function applyViewScale(): void {
  if (typeof document === 'undefined') return;
  try {
    (document.body.style as unknown as Record<string, string>).zoom = '';
    (document.documentElement.style as unknown as Record<string, string>).zoom = LOCKED_APP_SCALE;
    document.documentElement.style.setProperty('--app-scale', '0.90');
  } catch {
    // ignore
  }
}

/**
 * Returns whether dark mode is active given the mode preference and system settings
 */
export function isDarkActive(mode: ThemeMode): boolean {
  if (mode === 'dark') return true;
  if (mode === 'light') return false;
  if (typeof window !== 'undefined' && window.matchMedia) {
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  }
  return true;
}

/**
 * Applies the theme class ('dark' or 'light') to document.documentElement
 */
export function applyTheme(mode: ThemeMode): boolean {
  if (typeof document === 'undefined') return true;
  const dark = isDarkActive(mode);
  const root = document.documentElement;

  if (dark) {
    root.classList.add('dark');
    root.classList.remove('light');
    root.style.colorScheme = 'dark';
  } else {
    root.classList.remove('dark');
    root.classList.add('light');
    root.style.colorScheme = 'light';
  }

  // Update theme meta color for mobile browser bars
  const metaTheme = document.querySelector('meta[name="theme-color"]');
  if (metaTheme) {
    metaTheme.setAttribute('content', dark ? '#0c0e12' : '#f4f6f9');
  }

  return dark;
}

/**
 * Sets up a system theme listener if mode is 'system'
 */
export function setupSystemThemeListener(onThemeChange: (isDark: boolean) => void): () => void {
  if (typeof window === 'undefined' || !window.matchMedia) {
    return () => {};
  }

  const media = window.matchMedia('(prefers-color-scheme: dark)');
  const listener = (e: MediaQueryListEvent) => {
    const currentMode = getStoredThemeMode();
    if (currentMode === 'system') {
      applyTheme('system');
      onThemeChange(e.matches);
    }
  };

  if (media.addEventListener) {
    media.addEventListener('change', listener);
    return () => media.removeEventListener('change', listener);
  } else if (media.addListener) {
    media.addListener(listener);
    return () => media.removeListener(listener);
  }

  return () => {};
}
