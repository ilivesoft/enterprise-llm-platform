import { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';
import type { Lang } from '../types';

interface LangContextValue {
  lang: Lang;
  setLang: (lang: Lang) => void;
}

export const LangContext = createContext<LangContextValue>({
  lang: 'kr',
  setLang: () => {},
});

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>('kr');
  return (
    <LangContext.Provider value={{ lang, setLang }}>
      {children}
    </LangContext.Provider>
  );
}

export function useLang(): Lang {
  return useContext(LangContext).lang;
}

/** kr/en 중 하나를 선택하는 헬퍼 */
export function L(obj: { kr?: string; en?: string }, lang: Lang): string {
  return lang === 'en' ? (obj.en ?? obj.kr ?? '') : (obj.kr ?? obj.en ?? '');
}
