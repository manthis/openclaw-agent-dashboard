'use client';

import { useState } from 'react';
import type { Agent } from '@/types/agent';
import { StatusBadge } from './StatusBadge';
import { AgentAvatar } from './AgentAvatar';
import { Button } from './ui/button';

interface Props {
  agents: Agent[];
  selectedId: string | null;
  onSelect: (agent: Agent) => void;
  onDelete: (id: string) => Promise<void>;
}

export function AgentListTable({ agents, selectedId, onSelect, onDelete }: Props) {
  const [deleteTarget, setDeleteTarget] = useState<Agent | null>(null);

  return (
    <>
      <div className="rounded-lg border border-neutral-700 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-neutral-800 border-b border-neutral-700">
            <tr>
              <th className="px-3 py-2 text-left text-neutral-400 font-medium w-12"></th>
              <th className="px-3 py-2 text-left text-neutral-400 font-medium">Nom</th>
              <th className="px-3 py-2 text-left text-neutral-400 font-medium hidden md:table-cell">Modèle</th>
              <th className="px-3 py-2 text-left text-neutral-400 font-medium">Statut</th>
              <th className="px-3 py-2 w-10"></th>
            </tr>
          </thead>
          <tbody>
            {agents.map(agent => (
              <tr
                key={agent.id}
                onClick={() => onSelect(agent)}
                className={`border-b border-neutral-800 cursor-pointer transition-colors duration-150 ${
                  selectedId === agent.id ? 'bg-neutral-700' : 'bg-neutral-900 hover:bg-neutral-800'
                }`}
              >
                <td className="px-3 py-2">
                  <AgentAvatar agent={agent} size={32} />
                </td>
                <td className="px-3 py-2 font-semibold text-neutral-100">{agent.name}</td>
                <td className="px-3 py-2 text-neutral-400 hidden md:table-cell font-mono text-xs max-w-[200px] truncate">
                  {agent.model.length > 30 ? `${agent.model.slice(0, 30)}…` : agent.model}
                </td>
                <td className="px-3 py-2"><StatusBadge status={agent.status} /></td>
                <td className="px-3 py-2" onClick={e => e.stopPropagation()}>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-red-400 hover:text-red-300 hover:bg-red-950 h-7 px-2"
                    onClick={() => setDeleteTarget(agent)}
                  >✕</Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-neutral-900 border border-neutral-700 rounded-xl p-6 max-w-sm w-full mx-4 shadow-2xl">
            <h2 className="text-neutral-100 font-bold text-lg mb-2">Supprimer {deleteTarget.name} ?</h2>
            <p className="text-neutral-400 text-sm mb-6">
              Action irréversible. L&apos;agent <span className="font-mono text-neutral-200">{deleteTarget.id}</span> sera supprimé.
            </p>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setDeleteTarget(null)} className="px-4 py-2 rounded-lg bg-neutral-800 text-neutral-300 hover:bg-neutral-700 text-sm transition-colors">Annuler</button>
              <button onClick={async () => { await onDelete(deleteTarget.id); setDeleteTarget(null); }} className="px-4 py-2 rounded-lg bg-red-700 text-white hover:bg-red-600 text-sm transition-colors">Supprimer</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
