'use client';

import { useState } from 'react';
import { Handle, Position } from '@xyflow/react';
import type { NodeProps, Node } from '@xyflow/react';
import type { Agent } from '@/types/agent';
import { StatusBadge } from './StatusBadge';

export type AgentNodeData = Agent & Record<string, unknown>;
export type AgentNodeType = Node<AgentNodeData, 'agentNode'>;

export function AgentNode({ data: agent }: NodeProps<AgentNodeType>) {
  const [imgError, setImgError] = useState(false);
  const showAvatar = agent.avatar !== null && !imgError;

  return (
    <div className="flex flex-col items-center gap-2 p-3 rounded-xl bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-700 shadow-lg w-[120px] min-h-[100px] cursor-pointer select-none transition-all duration-200 hover:border-gray-400 dark:hover:border-neutral-500 hover:shadow-xl">
      <Handle type="target" position={Position.Top} className="!bg-gray-400 dark:!bg-neutral-500" />

      <div className="w-14 h-14 rounded-full overflow-hidden flex items-center justify-center bg-gray-100 dark:bg-neutral-800 border border-gray-300 dark:border-neutral-600 shrink-0">
        {showAvatar ? (
          <img
            src={`/api/agents/${agent.id}/avatar`}
            alt={agent.name}
            className="w-full h-full object-cover"
            onError={() => setImgError(true)}
          />
        ) : (
          <span className="text-3xl leading-none">{agent.emoji}</span>
        )}
      </div>

      <span className="text-xs font-semibold text-gray-900 dark:text-neutral-100 text-center leading-tight max-w-full truncate px-1">
        {agent.name}
      </span>

      <StatusBadge status={agent.status} />

      <Handle type="source" position={Position.Bottom} className="!bg-gray-400 dark:!bg-neutral-500" />
    </div>
  );
}
