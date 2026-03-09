'use client';

import { useEffect, useState } from 'react';
import { DashboardClient } from '@/components/DashboardClient';
import type { Agent, AgentRelation } from '@/types/agent';

interface AgentsGraph {
  agents: Agent[];
  relations: AgentRelation[];
}

export function AgentsMapClient() {
  const [graph, setGraph] = useState<AgentsGraph | null>(null);

  const fetchGraph = async () => {
    try {
      const res = await fetch('/api/agents/graph', { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json() as AgentsGraph;
        setGraph(data);
      }
    } catch {
      // silently retry on next poll
    }
  };

  useEffect(() => {
    fetchGraph();
    const interval = setInterval(fetchGraph, 10_000);
    return () => clearInterval(interval);
  }, []);

  if (!graph) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-gray-500 dark:text-slate-500 animate-pulse text-sm">Loading agents…</div>
      </div>
    );
  }

  return <DashboardClient agents={graph.agents} relations={graph.relations} />;
}
