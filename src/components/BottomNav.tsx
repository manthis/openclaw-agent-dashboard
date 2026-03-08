'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Network, Users, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/agents-map', label: 'Agents Map', icon: Network },
  { href: '/agents', label: 'Agents', icon: Users },
  { href: '/config', label: 'Config', icon: Settings },
];

export function BottomNav() {
  const pathname = usePathname();
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-slate-900 border-t border-gray-200 dark:border-slate-800 flex items-center justify-around h-16 px-2">
      {navItems.map(({ href, label, icon: Icon }) => (
        <Link
          key={href}
          href={href}
          className={cn(
            'flex flex-col items-center gap-1 flex-1 py-2 text-xs font-medium transition-colors min-h-[44px] justify-center',
            pathname === href
              ? 'text-indigo-600 dark:text-indigo-400'
              : 'text-gray-500 dark:text-slate-500 hover:text-gray-700 dark:hover:text-slate-300'
          )}
        >
          <Icon className="w-5 h-5" />
          <span>{label}</span>
        </Link>
      ))}
    </nav>
  );
}
