import { useState, useContext } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { ThemeProvider, ThemeContext } from './contexts/ThemeContext';
import { LangContext } from './contexts/LangContext';
import { ToastProvider } from './contexts/ToastContext';
import { Sidebar } from './components/chrome/Sidebar';
import { TopBar } from './components/chrome/TopBar';
import { ChatWorkspace } from './pages/ChatWorkspace';
import { Services } from './pages/Services';
import { Dashboard } from './pages/Dashboard';
import { Marketplace } from './pages/Marketplace';
import { Playground } from './pages/Playground';
import { ApiKeys } from './pages/ApiKeys';
import { Settings } from './pages/Settings';
import type { Lang } from './types';

function AppShell() {
  const navigate = useNavigate();
  const location = useLocation();
  const { theme, setTheme, tweaks } = useContext(ThemeContext);
  const { lang, setLang } = useContext(LangContext);
  const [collapsed, setCollapsed] = useState(false);

  // 현재 경로에서 route id 추출
  const pathToId: Record<string, string> = {
    '/chat': 'chat',
    '/services': 'services',
    '/dashboard': 'dashboard',
    '/marketplace': 'marketplace',
    '/playground': 'playground',
    '/api-keys': 'api-keys',
    '/settings': 'settings',
  };
  const current = pathToId[location.pathname] || 'chat';

  function onNav(id: string) {
    navigate('/' + id);
  }

  // full-height 페이지 (내부 스크롤)
  const fullHeight = current === 'chat' || current === 'playground';

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg)' }}>
      <Sidebar
        current={current}
        onNav={onNav}
        collapsed={collapsed}
        onToggle={() => setCollapsed(c => !c)}
      />
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', height: '100vh' }}>
        <TopBar
          current={current}
          theme={theme}
          onToggleTheme={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          lang={lang}
          onToggleLang={(l: Lang) => setLang(l)}
        />
        <main style={{ flex: 1, minHeight: 0, overflowY: fullHeight ? 'hidden' : 'auto' }} key={current}>
          <Routes>
            <Route path="/" element={<Navigate to="/chat" replace />} />
            <Route path="/chat" element={<ChatWorkspace />} />
            <Route path="/services" element={<Services />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/marketplace" element={<Marketplace cardStyle={tweaks.cardStyle} />} />
            <Route path="/playground" element={<Playground />} />
            <Route path="/api-keys" element={<ApiKeys />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="*" element={<Navigate to="/chat" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

function AppProviders() {
  return (
    <ThemeProvider>
      <LangProvider>
        <ToastProvider>
          <BrowserRouter>
            <AppShell />
          </BrowserRouter>
        </ToastProvider>
      </LangProvider>
    </ThemeProvider>
  );
}

// LangProvider (ThemeContext와 분리, context bridge)
import { useState as useStateLP, createContext as createContextLP } from 'react';
import type { ReactNode } from 'react';

interface LangCtxValue {
  lang: Lang;
  setLang: (lang: Lang) => void;
}

const LangContextInternal = createContextLP<LangCtxValue>({ lang: 'kr', setLang: () => {} });

// LangContext를 실제로 LangContext.tsx에서 import하여 연동
function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useStateLP<Lang>('kr');
  return (
    <LangContextInternal.Provider value={{ lang, setLang }}>
      <LangContext.Provider value={{ lang, setLang }}>
        {children}
      </LangContext.Provider>
    </LangContextInternal.Provider>
  );
}

export default AppProviders;
