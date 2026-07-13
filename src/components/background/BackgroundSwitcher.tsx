import { Component, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import type { BackgroundId } from './backgrounds';
import { BACKGROUNDS, DEFAULT_BACKGROUND } from './backgrounds';

function getIsDark(): boolean {
  if (typeof document === 'undefined') return true;
  return document.documentElement.getAttribute('data-theme') === 'lkm-dark';
}

function getInitialBackground(): BackgroundId {
  if (typeof window === 'undefined') return DEFAULT_BACKGROUND;
  const stored = localStorage.getItem('interactiveBackground');
  if (stored && BACKGROUNDS.some((b) => b.id === stored)) {
    return stored as BackgroundId;
  }
  return DEFAULT_BACKGROUND;
}

/** Error boundary for canvas background components */
class BackgroundErrorBoundary extends Component<
  { children: React.ReactNode; fallback: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode; fallback: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}

export default function BackgroundSwitcher() {
  const [currentBg, setCurrentBg] = useState<BackgroundId>(getInitialBackground);
  const [isDark, setIsDark] = useState(getIsDark);
  const [panelOpen, setPanelOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);

  // Theme detection via data-theme attribute
  useEffect(() => {
    setIsDark(getIsDark());
    const observer = new MutationObserver(() => {
      setIsDark(getIsDark());
    });
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme'],
    });
    return () => observer.disconnect();
  }, []);

  // Auto-switch if current background isn't suitable for this theme
  useEffect(() => {
    const entry = BACKGROUNDS.find((b) => b.id === currentBg);
    if (entry && entry.theme !== 'both' && entry.theme !== (isDark ? 'dark' : 'light')) {
      setCurrentBg(DEFAULT_BACKGROUND);
    }
  }, [isDark, currentBg]);

  // Filter backgrounds for current theme
  const visibleBackgrounds = useMemo(
    () => BACKGROUNDS.filter((b) => b.theme === 'both' || b.theme === (isDark ? 'dark' : 'light')),
    [isDark]
  );

  // Close panel on outside click and Escape key
  useEffect(() => {
    if (!panelOpen) return;
    const handleClick = (e: MouseEvent) => {
      if (
        panelRef.current &&
        !panelRef.current.contains(e.target as Node) &&
        btnRef.current &&
        !btnRef.current.contains(e.target as Node)
      ) {
        setPanelOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setPanelOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [panelOpen]);

  const [portalRoot, setPortalRoot] = useState<HTMLElement | null>(null);

  useEffect(() => {
    setPortalRoot(document.querySelector('[data-hero-section]') as HTMLElement | null);
  }, []);

  const switchBg = useCallback((id: BackgroundId) => {
    setCurrentBg(id);
    setPanelOpen(false);
    localStorage.setItem('interactiveBackground', id);
  }, []);

  const activeEntry = BACKGROUNDS.find((b) => b.id === currentBg);
  const ActiveComponent = activeEntry?.component;
  const colorProps = isDark ? activeEntry?.darkProps : activeEntry?.lightProps;

  const controls = (
    <>
      {/* Floating toggle button */}
      <button
        ref={btnRef}
        type="button"
        onClick={() => setPanelOpen((v) => !v)}
        style={{ pointerEvents: 'auto' }}
        className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full flex items-center justify-center
                   bg-white/60 dark:bg-gray-900/60 backdrop-blur-md
                   text-gray-700 dark:text-gray-200
                   shadow-lg hover:shadow-xl
                   border border-white/20 dark:border-gray-700/30
                   transition-all duration-200 hover:scale-105"
        aria-label="切换背景"
        title="切换背景"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect x="3" y="3" width="7" height="7" />
          <rect x="14" y="3" width="7" height="7" />
          <rect x="14" y="14" width="7" height="7" />
          <rect x="3" y="14" width="7" height="7" />
        </svg>
      </button>

      {/* Selection panel */}
      {panelOpen && (
        <div
          ref={panelRef}
          style={{ pointerEvents: 'auto' }}
          className="absolute top-14 right-4 z-10
                     bg-white/70 dark:bg-gray-900/70 backdrop-blur-xl
                     rounded-xl shadow-2xl p-3
                     border border-white/20 dark:border-gray-700/30
                     w-[280px] sm:w-[320px]"
          role="dialog"
          aria-label="选择背景效果"
        >
          <div className="grid grid-cols-4 sm:grid-cols-4 gap-1.5">
            {visibleBackgrounds.map((bg) => {
              const isActive = bg.id === currentBg;
              return (
                <button
                  key={bg.id}
                  type="button"
                  onClick={() => switchBg(bg.id as BackgroundId)}
                  className={`flex flex-col items-center justify-center gap-1 p-2 rounded-lg text-xs
                             transition-all duration-150
                             ${
                               isActive
                                 ? 'bg-primary/15 text-primary ring-1 ring-primary/30'
                                 : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100/50 dark:hover:bg-gray-800/50'
                             }`}
                  title={bg.name}
                >
                  <span className="text-lg">{bg.icon}</span>
                  <span className="leading-tight text-center">{bg.name}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </>
  );

  return (
    <div className="absolute inset-0 z-0" style={{ pointerEvents: 'none' }}>
      {/* Background canvas layer */}
      <div style={{ pointerEvents: 'auto', position: 'absolute', inset: 0, overflow: 'hidden' }}>
        {ActiveComponent && (
          <BackgroundErrorBoundary fallback={<div className="absolute inset-0 bg-base-100" />}>
            <ActiveComponent key={`${currentBg}-${isDark ? 'dark' : 'light'}`} className="" {...colorProps} />
          </BackgroundErrorBoundary>
        )}
      </div>

      {portalRoot && createPortal(controls, portalRoot)}
    </div>
  );
}
