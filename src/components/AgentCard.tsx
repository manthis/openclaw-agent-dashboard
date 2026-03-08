"use client";
import Image from 'next/image';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { StatusBadge } from './StatusBadge';
import type { Agent } from '@/types/agent';

function AgentAvatar({ agent }: { agent: Agent }) {
  const [imgError, setImgError] = useState(false);
  if (agent.avatar && !imgError) {
    return (
      <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-gray-200 dark:border-slate-700 flex-shrink-0">
        <Image
          src={`/api/agents/${agent.id}/avatar`}
          alt={agent.name}
          width={48}
          height={48}
          className="object-cover w-full h-full"
          onError={() => setImgError(true)}
        />
      </div>
    );
  }
  return <span className="text-3xl" data-testid="agent-emoji">{agent.emoji}</span>;
}

export function AgentCard({ agent, onClose }: { agent: Agent; onClose?: () => void }) {
  return (
    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="w-80">
      <Card className="bg-white dark:bg-slate-900 border-gray-200 dark:border-slate-700 shadow-lg dark:shadow-2xl">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <AgentAvatar agent={agent} />
              <div>
                <CardTitle className="text-gray-900 dark:text-white text-lg" data-testid="agent-name">{agent.name}</CardTitle>
                <p className="text-gray-500 dark:text-slate-400 text-xs font-mono">{agent.id}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <StatusBadge status={agent.status} />
              {onClose && <button onClick={onClose} className="text-gray-400 dark:text-slate-500 hover:text-gray-600 dark:hover:text-slate-300 ml-1" aria-label="Close">&#215;</button>}
            </div>
          </div>
        </CardHeader>
        <Separator className="bg-gray-200 dark:bg-slate-700" />
        <CardContent className="pt-3 space-y-3">
          <div>
            <p className="text-gray-400 dark:text-slate-500 text-xs uppercase mb-1">Model</p>
            <p className="text-gray-700 dark:text-slate-300 text-sm font-mono" data-testid="agent-model">{agent.model}</p>
          </div>
          {agent.theme && <div><p className="text-gray-400 dark:text-slate-500 text-xs uppercase mb-1">Theme</p><p className="text-gray-700 dark:text-slate-300 text-sm">{agent.theme}</p></div>}
          <div>
            <p className="text-gray-400 dark:text-slate-500 text-xs uppercase mb-1">Workspace</p>
            <p className="text-gray-500 dark:text-slate-400 text-xs font-mono break-all">{agent.workspace}</p>
          </div>
          <div>
            <p className="text-gray-400 dark:text-slate-500 text-xs uppercase mb-1">Files</p>
            <div className="flex flex-wrap gap-1">
              {(Object.entries(agent.files) as [string, boolean][]).map(([k, v]) => (
                <span key={k} className={`text-xs px-2 py-0.5 rounded font-mono ${v ? 'bg-blue-500/20 text-blue-600 dark:text-blue-400' : 'bg-gray-100 dark:bg-slate-800 text-gray-400 dark:text-slate-600'}`}>{k.toUpperCase()}.md</span>
              ))}
            </div>
          </div>
          {agent.relations.length > 0 && (
            <div>
              <p className="text-gray-400 dark:text-slate-500 text-xs uppercase mb-1">Orchestrates</p>
              <div className="flex flex-wrap gap-1">
                {agent.relations.map((r: string) => <span key={r} className="text-xs px-2 py-0.5 rounded bg-purple-500/20 text-purple-600 dark:text-purple-400 font-mono">{r}</span>)}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
export default AgentCard;
