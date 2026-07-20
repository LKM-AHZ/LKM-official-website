import { useEffect, useState } from 'react';

const isDark = () =>
  typeof document !== 'undefined' && document.documentElement.getAttribute('data-theme') === 'lkm-dark';

export function useColorMode() {
  const [mode, setMode] = useState(() => (isDark() ? 'dark' : 'light'));

  useEffect(() => {
    const observer = new MutationObserver(() => {
      setMode(isDark() ? 'dark' : 'light');
    });
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme'],
    });
    return () => observer.disconnect();
  }, []);

  return mode;
}
