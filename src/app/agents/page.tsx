import { AgentsPageClient } from '@/components/AgentsPageClient';

export const metadata = { title: 'Agents \u2014 OpenClaw Dashboard' };
export const dynamic = 'force-dynamic';

export default function AgentsPage() {
  return <AgentsPageClient />;
}
