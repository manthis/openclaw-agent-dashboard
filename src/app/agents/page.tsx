import { Suspense } from 'react';
import { AgentsPageClient } from '@/components/AgentsPageClient';

export const metadata = { title: 'Agents \u2014 OpenClaw Dashboard' };
export const dynamic = 'force-dynamic';

export default function AgentsPage() {
  return (
    <Suspense fallback={<div className="text-gray-500 dark:text-slate-500 p-6">Loading...</div>}>
      <AgentsPageClient />
    </Suspense>
  );
}
