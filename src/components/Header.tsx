'use client';
import { useState, useEffect } from 'react';

export function Header() {
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    let mounted = true;
    async function check() {
      try {
        const res = await fetch('/api/openclaw-config', { method: 'HEAD' });
        if (mounted) setConnected(res.ok);
      } catch {
        if (mounted) setConnected(false);
      }
    }
    check();
    const id = setInterval(check, 5000);
    return () => { mounted = false; clearInterval(id); };
  }, []);

  return (
    <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur-sm px-4 md:px-6 py-3 md:py-4 flex items-center justify-between">
      <div className="flex items-center gap-2 md:gap-3">
        <span className="text-xl md:text-2xl">🦞</span>
        <div>
          <h1 className="text-white font-bold text-base md:text-xl">OpenClaw Dashboard</h1>
          <p className="text-slate-400 text-xs hidden md:block">Agent Network Monitor</p>
        </div>
      </div>
      <div className="flex items-center gap-2 text-sm">
        <span
          className={`w-2 h-2 rounded-full animate-pulse inline-block ${
            connected ? 'bg-green-500' : 'bg-red-500'
          }`}
        />
        <span className={`text-xs md:text-sm ${connected ? 'text-green-400' : 'text-red-400'}`}>
          <span className="hidden md:inline">Gateway: </span>{connected ? 'Connected' : 'Disconnected'}
        </span>
      </div>
    </header>
  );
}

export default Header;
