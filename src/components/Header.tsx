'use client';
import { useTheme } from 'next-themes';
import { Sun, Moon } from 'lucide-react';
import { useState, useEffect } from 'react';

export function Header() {
  const { setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [connected, setConnected] = useState<boolean>(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    let alive = true;

    async function check() {
      try {
        const res = await fetch('/api/system', { cache: 'no-store' });
        const data = (await res.json()) as { gateway?: { connected?: boolean } };
        if (!alive) return;
        setConnected(Boolean(data?.gateway?.connected));
      } catch {
        if (!alive) return;
        setConnected(false);
      }
    }

    check();
    const id = setInterval(check, 5000);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, []);

  const isDark = resolvedTheme === 'dark';

  const dotBase =
    'relative inline-block w-4 h-4 rounded-full animate-pulse ring-2';

  const dotColor = connected
    ? 'bg-emerald-300 ring-emerald-200/70'
    : 'bg-rose-300 ring-rose-200/70';

  const dotGlowStyle: React.CSSProperties = connected
    ? {
        boxShadow:
          '0 0 10px rgba(52,211,153,1), 0 0 26px rgba(52,211,153,0.95), 0 0 60px rgba(52,211,153,0.65)',
        filter:
          'drop-shadow(0 0 10px rgba(52,211,153,1)) drop-shadow(0 0 22px rgba(52,211,153,0.9))',
      }
    : {
        boxShadow:
          '0 0 10px rgba(251,113,133,1), 0 0 26px rgba(251,113,133,0.95), 0 0 60px rgba(251,113,133,0.65)',
        filter:
          'drop-shadow(0 0 10px rgba(251,113,133,1)) drop-shadow(0 0 22px rgba(251,113,133,0.9))',
      };

  const dotHaloClass = connected
    ? 'bg-emerald-400/55'
    : 'bg-rose-400/55';

  return (
    <header className="border-b border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900/80 backdrop-blur-sm px-4 md:px-6 py-3 md:py-4 flex items-center justify-between">
      <div className="flex items-center gap-2 md:gap-3">
        <span className="text-xl md:text-2xl">🦞</span>
        <div>
          <h1 className="text-gray-900 dark:text-white font-bold text-base md:text-xl">OpenClaw Dashboard</h1>
          <p className="text-gray-500 dark:text-slate-400 text-xs hidden md:block">Agent Network Monitor</p>
        </div>
      </div>
      <div className="flex items-center gap-3 text-sm">
        <div className="flex items-center gap-2">
          <span className={`${dotBase} ${dotColor}`} style={dotGlowStyle}>
            {/* halo layer (helps a lot on iOS Safari where tiny box-shadows can look subtle) */}
            <span
              className={`absolute -inset-2 rounded-full blur-md ${dotHaloClass}`}
            />
          </span>
          <span
            className={`text-xs md:text-sm ${
              connected
                ? 'text-green-600 dark:text-green-400'
                : 'text-red-600 dark:text-red-400'
            }`}
          >
            <span className="hidden md:inline">Gateway: </span>
            {connected ? 'Connected' : 'Disconnected'}
          </span>
        </div>
        {mounted && (
          <button
            onClick={() => setTheme(isDark ? 'light' : 'dark')}
            className="p-2 rounded-lg text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
            aria-label="Toggle theme"
          >
            {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
        )}
      </div>
    </header>
  );
}

export default Header;
