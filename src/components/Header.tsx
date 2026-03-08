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

  const dotClass = connected
    ? 'bg-emerald-400 ring-2 ring-emerald-300/60 shadow-[0_0_6px_rgba(52,211,153,0.9),0_0_16px_rgba(52,211,153,0.9),0_0_28px_rgba(52,211,153,0.55)]'
    : 'bg-rose-400 ring-2 ring-rose-300/60 shadow-[0_0_6px_rgba(251,113,133,0.9),0_0_16px_rgba(251,113,133,0.9),0_0_28px_rgba(251,113,133,0.55)]';

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
          <span className={`w-3 h-3 rounded-full inline-block animate-pulse ${dotClass}`} />
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
