import { DashboardClient } from '@/components/DashboardClient';
import { MobileRedirect } from '@/components/MobileRedirect';
import { getAgentsGraph } from '@/lib/agents';

export default async function DashboardPage() {
  const { agents, relations } = getAgentsGraph();
  return (
    <main className="h-full overflow-hidden bg-slate-950">
      <MobileRedirect />
      <DashboardClient agents={agents} relations={relations} />
    </main>
  );
}
