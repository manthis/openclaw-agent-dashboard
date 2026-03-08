import { DashboardClient } from '@/components/DashboardClient';
import { getAgentsGraph } from '@/lib/agents';

export default async function DashboardPage() {
  const { agents, relations } = getAgentsGraph();
  return (
    <main className="flex-1 overflow-hidden bg-slate-950">
      <DashboardClient agents={agents} relations={relations} />
    </main>
  );
}
