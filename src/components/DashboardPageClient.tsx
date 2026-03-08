'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Users, Network, Settings, Github, Wifi, WifiOff, Activity, Cpu, MemoryStick } from 'lucide-react';

interface SystemData {
  gateway: { connected: boolean };
  sessions: number;
  cpu: { percent: number; loadAvg: string };
  memory: { used: number; total: number; percent: number };
  system: {
    hostname: string;
    cpuCores: number;
    platform: string;
    uptime: number;
    nodeVersion: string;
  };
}

function formatBytes(bytes: number) {
  return (bytes / (1024 ** 3)).toFixed(1) + ' GB';
}

function formatUptime(seconds: number) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return h + 'h ' + m + 'm';
}

export function DashboardPageClient() {
  const [data, setData] = useState<SystemData | null>(null);

  const fetchData = async () => {
    try {
      const res = await fetch('/api/system');
      if (res.ok) setData(await res.json());
    } catch {}
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, []);

  const quickActions = [
    { href: '/agents', label: 'Agents', icon: Users, desc: 'Manage your agents', external: false },
    { href: '/agents-map', label: 'Agents Map', icon: Network, desc: 'Visual agent graph', external: false },
    { href: '/config', label: 'Config', icon: Settings, desc: 'System configuration', external: false },
    { href: 'https://github.com/manthis/openclaw-agent-dashboard', label: 'GitHub', icon: Github, desc: 'Source code', external: true },
  ];

  return (
    <div className="min-h-full bg-slate-950 p-6 overflow-auto">
      <div className="max-w-5xl mx-auto space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Mission Control</h1>
          <p className="text-slate-400 text-sm mt-1">System overview & quick access</p>
        </div>

        <section>
          <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Real-time Metrics</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                {data?.gateway.connected
                  ? <Wifi className="w-4 h-4 text-emerald-400" />
                  : <WifiOff className="w-4 h-4 text-red-400" />}
                <span className="text-xs text-slate-400">Gateway</span>
              </div>
              <p className={`text-lg font-semibold ${data?.gateway.connected ? 'text-emerald-400' : 'text-red-400'}`}>
                {data ? (data.gateway.connected ? 'Connected' : 'Offline') : '—'}
              </p>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <Activity className="w-4 h-4 text-indigo-400" />
                <span className="text-xs text-slate-400">Sessions</span>
              </div>
              <p className="text-lg font-semibold text-white">
                {data !== null ? data.sessions : '—'}
              </p>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <Cpu className="w-4 h-4 text-amber-400" />
                <span className="text-xs text-slate-400">CPU</span>
              </div>
              <p className="text-lg font-semibold text-white">
                {data ? data.cpu.percent + '%' : '—'}
              </p>
              {data && <p className="text-xs text-slate-500">load {data.cpu.loadAvg}</p>}
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <MemoryStick className="w-4 h-4 text-purple-400" />
                <span className="text-xs text-slate-400">Memory</span>
              </div>
              <p className="text-lg font-semibold text-white">
                {data ? data.memory.percent + '%' : '—'}
              </p>
              {data && <p className="text-xs text-slate-500">{formatBytes(data.memory.used)} / {formatBytes(data.memory.total)}</p>}
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Quick Actions</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {quickActions.map(({ href, label, icon: Icon, desc, external }) => (
              <Link
                key={href}
                href={href}
                target={external ? '_blank' : undefined}
                rel={external ? 'noopener noreferrer' : undefined}
                className="bg-slate-900 border border-slate-800 rounded-xl p-4 hover:border-indigo-500/50 hover:bg-slate-800 transition-all group"
              >
                <Icon className="w-6 h-6 text-indigo-400 mb-3 group-hover:text-indigo-300" />
                <p className="text-sm font-semibold text-white">{label}</p>
                <p className="text-xs text-slate-500 mt-0.5">{desc}</p>
              </Link>
            ))}
          </div>
        </section>

        <section>
          <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">System Info</h2>
          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <tbody>
                {([
                  ['Hostname', data?.system.hostname],
                  ['CPU Cores', data?.system.cpuCores],
                  ['Platform', data?.system.platform],
                  ['Process Uptime', data ? formatUptime(data.system.uptime) : undefined],
                  ['Node.js', data?.system.nodeVersion],
                ] as [string, string | number | undefined][]).map(([key, val], i) => (
                  <tr key={key} className={i % 2 === 0 ? 'bg-slate-900' : 'bg-slate-800/30'}>
                    <td className="px-4 py-3 text-slate-400 font-medium w-1/3">{key}</td>
                    <td className="px-4 py-3 text-white font-mono">{val !== undefined ? String(val) : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}
