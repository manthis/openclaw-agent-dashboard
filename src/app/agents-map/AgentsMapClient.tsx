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

  useEffect(() => {
    const es = new EventSource('/api/agents/stream');

    es.addEventListener('agents', (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data as string) as AgentsGraph;
        setGraph(data);
      } catch {
        // ignore parse errors
      }
    });

    es.onerror = () => {
      // EventSource auto-reconnects on error
    };

    return () => {
      es.close();
    };
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
