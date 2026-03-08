'use client';
import { useTheme } from 'next-themes';
import { Sun, Moon } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useGatewayActivity } from '@/lib/hooks/use-gateway-activity';

export function Header() {
  const { connected } = useGatewayActivity();
  const { setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const isDark = resolvedTheme === 'dark';

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
          <span
            className={`w-2 h-2 rounded-full animate-pulse inline-block ${
              connected ? 'bg-green-500' : 'bg-red-500'
            }`}
          />
          <span className={`text-xs md:text-sm ${connected ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
            <span className="hidden md:inline">Gateway: </span>{connected ? 'Connected' : 'Disconnected'}
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
