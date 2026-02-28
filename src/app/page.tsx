import { Header } from '@/components/Header';
import { DashboardClient } from '@/components/DashboardClient';
import { getAgentsGraph } from '@/lib/agents';

export default async function DashboardPage() {
  const { agents, relations } = getAgentsGraph();
  return (
    <div className="flex flex-col h-screen bg-slate-950">
      <Header />
      <main className="flex-1 overflow-hidden">
        <DashboardClient agents={agents} relations={relations} />
      </main>
    </div>
  );
}
