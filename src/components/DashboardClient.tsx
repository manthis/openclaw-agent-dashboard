'use client';
import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';
import Image from 'next/image';
import type { Agent, AgentRelation } from '@/types/agent';
import { StatusBadge } from './StatusBadge';

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

function AgentMobileCard({ agent }: { agent: Agent }) {
  const [imgError, setImgError] = useState(false);
  return (
    <div className="bg-slate-900 border border-slate-700 rounded-xl p-4 flex items-start gap-3">
      <div className="flex-shrink-0">
        {agent.avatar && !imgError ? (
          <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-slate-700">
            <Image
              src={`/api/agents/${agent.id}/avatar`}
              alt={agent.name}
              width={48}
              height={48}
              className="object-cover w-full h-full"
              onError={() => setImgError(true)}
            />
          </div>
        ) : (
          <span className="text-3xl">{agent.emoji}</span>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-white font-semibold text-sm truncate">{agent.name}</h3>
          <StatusBadge status={agent.status} />
        </div>
        <p className="text-slate-500 text-xs font-mono truncate">{agent.id}</p>
        {agent.model && <p className="text-slate-400 text-xs mt-1 truncate">{agent.model}</p>}
      </div>
    </div>
  );
}

function AgentMobileList({ agents }: { agents: Agent[] }) {
  return (
    <div className="p-4 space-y-3">
      <h2 className="text-slate-400 text-xs uppercase font-semibold tracking-wider mb-3">Agents ({agents.length})</h2>
      {agents.length === 0 ? (
        <div className="text-center text-slate-500 py-12">No agents found</div>
      ) : (
        agents.map((agent) => <AgentMobileCard key={agent.id} agent={agent} />)
      )}
    </div>
  );
}

interface DashboardClientProps {
  agents: Agent[];
  relations: AgentRelation[];
}

export function DashboardClient({ agents, relations }: DashboardClientProps) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)');
    setIsMobile(mq.matches);
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  if (isMobile) {
    return <AgentMobileList agents={agents} />;
  }

  return <AgentGraph agents={agents} relations={relations} />;
}
