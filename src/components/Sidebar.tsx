'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Network, Users, Settings, Bot } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/agents-map', label: 'Agents Map', icon: Network },
  { href: '/agents', label: 'Agents', icon: Users },
  { href: '/config', label: 'Config', icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  return (
    <aside className="w-56 flex-shrink-0 bg-white dark:bg-slate-900 border-r border-gray-200 dark:border-slate-800 flex flex-col">
      <div className="flex items-center gap-2 px-4 py-4 border-b border-gray-200 dark:border-slate-800">
        <Bot className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
        <span className="text-gray-900 dark:text-white font-semibold tracking-tight">OpenClaw</span>
      </div>
      <nav className="flex-1 px-2 py-4 space-y-1">
        {navItems.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
              pathname === href
                ? 'bg-indigo-50 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-300'
                : 'text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-800'
            )}
          >
            <Icon className="w-4 h-4" />
            {label}
          </Link>
        ))}
      </nav>
      <div className="px-4 py-3 border-t border-gray-200 dark:border-slate-800">
        <p className="text-gray-400 dark:text-slate-600 text-xs">OpenClaw Dashboard</p>
      </div>
    </aside>
  );
}
