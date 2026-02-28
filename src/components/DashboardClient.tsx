'use client';
import dynamic from 'next/dynamic';
import type { Agent, AgentRelation } from '@/types/agent';

const AgentGraph = dynamic(
  () => import('@/components/AgentGraph').then((m) => ({ default: m.AgentGraph })),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-full">
        <div className="text-slate-500 animate-pulse">Loading agent graph...</div>
      </div>
    ),
  }
);

interface DashboardClientProps {
  agents: Agent[];
  relations: AgentRelation[];
}

export function DashboardClient({ agents, relations }: DashboardClientProps) {
  return <AgentGraph agents={agents} relations={relations} />;
}
