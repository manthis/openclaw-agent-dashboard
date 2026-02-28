'use client';
import { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { motion } from 'framer-motion';
import { StatusBadge } from './StatusBadge';
import type { Agent } from '@/types/agent';

type AgentNodeData = Agent & Record<string, unknown>;

export const AgentNode = memo(function AgentNode({
  data,
  selected,
}: {
  data: AgentNodeData;
  selected?: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      className={`px-4 py-3 rounded-xl border min-w-[140px] cursor-pointer transition-all duration-200 ${selected ? 'bg-slate-700 border-blue-500 shadow-lg shadow-blue-500/20' : 'bg-slate-800 border-slate-600 hover:border-slate-400'}`}
    >
      <Handle type="target" position={Position.Top} className="w-3 h-3 !bg-slate-500 !border-slate-400" />
      <div className="flex flex-col items-center gap-1.5">
        <span className="text-2xl">{data.emoji}</span>
        <span className="text-white text-sm font-semibold">{data.name}</span>
        <span className="text-slate-400 text-xs font-mono">{data.id}</span>
        <StatusBadge status={data.status} />
      </div>
      <Handle type="source" position={Position.Bottom} className="w-3 h-3 !bg-slate-500 !border-slate-400" />
    </motion.div>
  );
});
