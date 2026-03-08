'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Users, Network, Settings, Github, Wifi, WifiOff, Activity, Cpu, MemoryStick } from 'lucide-react';
import { useGatewayActivity } from '@/lib/hooks/use-gateway-activity';

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

const TYPE_BADGE_COLORS: Record<string, string> = {
  session_created: 'bg-emerald-500/20 text-emerald-400',
  session_closed: 'bg-red-500/20 text-red-400',
  message_in: 'bg-blue-500/20 text-blue-400',
  message_out: 'bg-indigo-500/20 text-indigo-400',
};
const DEFAULT_BADGE = 'bg-slate-600/20 text-slate-400';

export function DashboardPageClient() {
  const [data, setData] = useState<SystemData | null>(null);
  const { connected: gwConnected, events: gwEvents } = useGatewayActivity();

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
    <div className="min-h-full bg-gray-50 dark:bg-slate-950 p-6 overflow-auto">
      <div className="max-w-5xl mx-auto space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Mission Control</h1>
          <p className="text-gray-500 dark:text-slate-400 text-sm mt-1">System overview &amp; quick access</p>
        </div>

        <section>
          <h2 className="text-xs font-semibold text-gray-400 dark:text-slate-500 uppercase tracking-wider mb-3">Real-time Metrics</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl p-4 shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                {data?.gateway.connected
                  ? <Wifi className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
                  : <WifiOff className="w-4 h-4 text-red-500 dark:text-red-400" />}
                <span className="text-xs text-gray-500 dark:text-slate-400">Gateway</span>
              </div>
              <p className={`text-lg font-semibold ${data?.gateway.connected ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                {data ? (data.gateway.connected ? 'Connected' : 'Offline') : '—'}
              </p>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl p-4 shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <Activity className="w-4 h-4 text-indigo-500 dark:text-indigo-400" />
                <span className="text-xs text-gray-500 dark:text-slate-400">Sessions</span>
              </div>
              <p className="text-lg font-semibold text-gray-900 dark:text-white">
                {data !== null ? data.sessions : '—'}
              </p>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl p-4 shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <Cpu className="w-4 h-4 text-amber-500 dark:text-amber-400" />
                <span className="text-xs text-gray-500 dark:text-slate-400">CPU</span>
              </div>
              <p className="text-lg font-semibold text-gray-900 dark:text-white">
                {data ? data.cpu.percent + '%' : '—'}
              </p>
              {data && <p className="text-xs text-gray-400 dark:text-slate-500">load {data.cpu.loadAvg}</p>}
            </div>

            <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl p-4 shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <MemoryStick className="w-4 h-4 text-purple-500 dark:text-purple-400" />
                <span className="text-xs text-gray-500 dark:text-slate-400">Memory</span>
              </div>
              <p className="text-lg font-semibold text-gray-900 dark:text-white">
                {data ? data.memory.percent + '%' : '—'}
              </p>
              {data && <p className="text-xs text-gray-400 dark:text-slate-500">{formatBytes(data.memory.used)} / {formatBytes(data.memory.total)}</p>}
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-xs font-semibold text-gray-400 dark:text-slate-500 uppercase tracking-wider mb-3">Quick Actions</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {quickActions.map(({ href, label, icon: Icon, desc, external }) => (
              <Link
                key={href}
                href={href}
                target={external ? '_blank' : undefined}
                rel={external ? 'noopener noreferrer' : undefined}
                className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl p-4 hover:border-indigo-400 dark:hover:border-indigo-500/50 hover:bg-gray-50 dark:hover:bg-slate-800 transition-all group shadow-sm"
              >
                <Icon className="w-6 h-6 text-indigo-600 dark:text-indigo-400 mb-3 group-hover:text-indigo-500 dark:group-hover:text-indigo-300" />
                <p className="text-sm font-semibold text-gray-900 dark:text-white">{label}</p>
                <p className="text-xs text-gray-500 dark:text-slate-500 mt-0.5">{desc}</p>
              </Link>
            ))}
          </div>
        </section>

        <section>
          <h2 className="text-xs font-semibold text-gray-400 dark:text-slate-500 uppercase tracking-wider mb-3">Gateway Activity</h2>
          <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <span className={`w-2 h-2 rounded-full inline-block ${gwConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
              <span className={`text-sm ${gwConnected ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                WebSocket {gwConnected ? 'Connected' : 'Disconnected'}
              </span>
            </div>
            <div className="h-[300px] overflow-y-auto rounded-lg bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800">
              {gwEvents.length === 0 ? (
                <div className="flex items-center justify-center h-full text-gray-400 dark:text-slate-500 text-sm">
                  No activity yet
                </div>
              ) : (
                <div className="divide-y divide-gray-100 dark:divide-slate-800/50">
                  {gwEvents.map(ev => (
                    <div key={ev.id} className="px-3 py-2 flex items-start gap-2 text-sm">
                      <span className="text-gray-400 dark:text-slate-500 font-mono text-xs mt-0.5 shrink-0">
                        {new Date(ev.timestamp).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </span>
                      <span className={`px-1.5 py-0.5 rounded text-xs font-medium shrink-0 ${TYPE_BADGE_COLORS[ev.type] ?? DEFAULT_BADGE}`}>
                        {ev.type}
                      </span>
                      <span className="text-gray-600 dark:text-slate-300 truncate">{ev.summary}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-xs font-semibold text-gray-400 dark:text-slate-500 uppercase tracking-wider mb-3">System Info</h2>
          <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm">
            <table className="w-full text-sm">
              <tbody>
                {([
                  ['Hostname', data?.system.hostname],
                  ['CPU Cores', data?.system.cpuCores],
                  ['Platform', data?.system.platform],
                  ['Process Uptime', data ? formatUptime(data.system.uptime) : undefined],
                  ['Node.js', data?.system.nodeVersion],
                ] as [string, string | number | undefined][]).map(([key, val], i) => (
                  <tr key={key} className={i % 2 === 0 ? 'bg-white dark:bg-slate-900' : 'bg-gray-50 dark:bg-slate-800/30'}>
                    <td className="px-4 py-3 text-gray-500 dark:text-slate-400 font-medium w-1/3">{key}</td>
                    <td className="px-4 py-3 text-gray-900 dark:text-white font-mono">{val !== undefined ? String(val) : '—'}</td>
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
