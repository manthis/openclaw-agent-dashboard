'use client';

import { useState } from 'react';
import type { Agent } from '@/types/agent';
import { AgentListTable } from './AgentListTable';
import { AgentEditPanel } from './AgentEditPanel';
import { AgentAddDialog } from './AgentAddDialog';
import { Button } from './ui/button';

interface Props { initialAgents: Agent[]; }

export function AgentsClient({ initialAgents }: Props) {
  const [agents, setAgents] = useState<Agent[]>(initialAgents);
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  const refresh = async () => {
    const data = await fetch('/api/agents').then(r => r.json()) as Agent[];
    setAgents(data);
    if (selectedAgent && !data.find((a: Agent) => a.id === selectedAgent.id)) {
      setSelectedAgent(null);
      setIsDirty(false);
    }
  };

  const handleSelect = (agent: Agent) => {
    if (isDirty && !confirm('Modifications non sauvegardées. Continuer ?')) return;
    setSelectedAgent(agent);
    setIsDirty(false);
  };

  const handleDelete = async (id: string) => {
    await fetch(`/api/agents/${id}`, { method: 'DELETE' });
    await refresh();
  };

  return (
    <div className="flex h-full min-h-0">
      <div className="flex flex-col flex-1 min-w-0 p-6 gap-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-neutral-100">Agents</h1>
          <Button
            size="sm"
            className="bg-neutral-700 hover:bg-neutral-600 text-neutral-100 border border-neutral-600"
            onClick={() => setAddOpen(true)}
          >
            + Ajouter
          </Button>
        </div>
        <AgentListTable
          agents={agents}
          selectedId={selectedAgent?.id ?? null}
          onSelect={handleSelect}
          onDelete={handleDelete}
        />
      </div>

      {selectedAgent && (
        <div className="w-[480px] border-l border-neutral-700 overflow-y-auto">
          <AgentEditPanel
            agent={selectedAgent}
            isDirty={isDirty}
            setIsDirty={setIsDirty}
            onSaved={refresh}
            onClose={() => {
              if (isDirty && !confirm('Modifications non sauvegardées. Fermer ?')) return;
              setSelectedAgent(null);
              setIsDirty(false);
            }}
          />
        </div>
      )}

      <AgentAddDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        onCreated={async () => { setAddOpen(false); await refresh(); }}
      />
    </div>
  );
}
