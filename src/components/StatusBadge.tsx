'use client';
import { Badge } from '@/components/ui/badge';
import type { AgentStatus } from '@/types/agent';

export function StatusBadge({ status }: { status: AgentStatus }) {
  const isActive = status === 'active';
  return (
    <Badge
      variant={isActive ? 'default' : 'secondary'}
      className={isActive
        ? 'bg-green-500/20 text-green-400 border-green-500/30'
        : 'bg-slate-500/20 text-slate-400 border-slate-500/30'}
    >
      <span className={`mr-1 h-2 w-2 rounded-full inline-block ${isActive ? 'bg-green-400 animate-pulse' : 'bg-slate-500'}`} />
      {isActive ? 'Active' : 'Idle'}
    </Badge>
  );
}

export default StatusBadge;
