import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import type { Theme, AccentKey, TweakSettings } from '../types';

interface ThemeContextValue {
  tweaks: TweakSettings;
  theme: Theme;
  setTheme: (theme: Theme) => void;
  setTweak: <K extends keyof TweakSettings>(key: K, value: TweakSettings[K]) => void;
}

const ACCENTS: Record<AccentKey, { accent: string; press: string }> = {
  blue:   { accent: '#2563EB', press: '#1D4ED8' },
  ilive:  { accent: '#2993D1', press: '#1F7AB0' },
  navy:   { accent: '#214290', press: '#1A3470' },
  violet: { accent: '#7C3AED', press: '#6D28D9' },
  teal:   { accent: '#0D9488', press: '#0F766E' },
};

function hexToRgb(h: string): [number, number, number] {
  const n = parseInt(h.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

const DEFAULTS: TweakSettings = {
  theme: 'light',
  accent: 'blue',
  density: 'comfortable',
  cardStyle: 'detailed',
};

export const ThemeContext = createContext<ThemeContextValue>({
  tweaks: DEFAULTS,
  theme: 'light',
  setTheme: () => {},
  setTweak: () => {},
});

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [tweaks, setTweaks] = useState<TweakSettings>(DEFAULTS);
  const [theme, setTheme] = useState<Theme>(DEFAULTS.theme);

  // tweak.theme 변경 시 local theme에 반영
  useEffect(() => {
    setTheme(tweaks.theme);
  }, [tweaks.theme]);

  // theme + density + accent 를 CSS 변수로 적용
  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute('data-theme', theme);
    root.setAttribute('data-density', tweaks.density === 'compact' ? 'compact' : 'comfortable');

    const a = ACCENTS[tweaks.accent] || ACCENTS.blue;
    const [r, g, b] = hexToRgb(a.accent);
    root.style.setProperty('--accent', a.accent);
    root.style.setProperty('--accent-press', a.press);
    root.style.setProperty('--accent-soft', `rgba(${r}, ${g}, ${b}, ${theme === 'dark' ? 0.18 : 0.10})`);
    root.style.setProperty('--accent-ring', `rgba(${r}, ${g}, ${b}, 0.35)`);
  }, [theme, tweaks.density, tweaks.accent]);

  function setTweak<K extends keyof TweakSettings>(key: K, value: TweakSettings[K]) {
    setTweaks(prev => ({ ...prev, [key]: value }));
  }

  return (
    <ThemeContext.Provider value={{ tweaks, theme, setTheme, setTweak }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
