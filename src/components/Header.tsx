export function Header() {
  return (
    <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur-sm px-6 py-4 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <span className="text-2xl">🏛️</span>
        <div>
          <h1 className="text-white font-bold text-xl">OpenClaw Dashboard</h1>
          <p className="text-slate-400 text-xs">Agent Network Monitor</p>
        </div>
      </div>
      <div className="flex items-center gap-2 text-slate-500 text-sm">
        <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse inline-block" />
        <span>Live</span>
      </div>
    </header>
  );
}

export default Header;
