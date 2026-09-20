import { ThemeMode, ViewDistance } from '../types';

const THEME_STORAGE_KEY = 'kuro_theme_mode';
const VIEW_DISTANCE_STORAGE_KEY = 'kuro_view_distance';

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

export function getStoredViewDistance(): ViewDistance {
  try {
    const saved = localStorage.getItem(VIEW_DISTANCE_STORAGE_KEY);
    if (saved === '85%' || saved === '90%' || saved === '100%') {
      return saved;
    }
    // Upgrade 75%, 67%, or legacy 'far' to 85% (comfortably zoomed in)
    if (saved === '75%' || saved === '67%' || saved === 'far') {
      return '85%';
    }
    if (saved === 'standard') return '100%';
  } catch {
    // ignore
  }
  return '85%'; // Default to 85% comfortable zoom
}

export function setStoredThemeMode(mode: ThemeMode): void {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, mode);
  } catch {
    // ignore
  }
  applyTheme(mode);
}

export function applyViewScale(distance: ViewDistance): void {
  if (typeof document === 'undefined') return;
  // Clear any existing zoom on body to prevent accidental browser compounding
  try {
    (document.body.style as unknown as Record<string, string>).zoom = '';
  } catch {
    // ignore
  }

  const zoomValue = 
    distance === '67%' ? '67%' : 
    distance === '75%' ? '75%' : 
    distance === '90%' ? '90%' : 
    distance === '100%' || distance === 'standard' ? '100%' : 
    '85%';

  try {
    (document.documentElement.style as unknown as Record<string, string>).zoom = zoomValue;
    const scaleNum = 
      zoomValue === '100%' ? '1' : 
      zoomValue === '90%' ? '0.9' : 
      zoomValue === '85%' ? '0.85' : 
      zoomValue === '75%' ? '0.75' : '0.67';
    document.documentElement.style.setProperty('--app-scale', scaleNum);
  } catch {
    // ignore
  }
}

export function setStoredViewDistance(distance: ViewDistance): void {
  const normalized: ViewDistance = distance === 'far' ? '85%' : distance === 'standard' ? '100%' : distance;
  try {
    localStorage.setItem(VIEW_DISTANCE_STORAGE_KEY, normalized);
  } catch {
    // ignore
  }
  applyViewScale(normalized);
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
