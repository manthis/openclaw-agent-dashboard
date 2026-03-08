'use client';

import { useState } from 'react';
import type { Agent } from '@/types/agent';

interface Props {
  agent: Agent;
  size?: number;
  className?: string;
}

export function AgentAvatar({ agent, size = 40, className = '' }: Props) {
  const [imgError, setImgError] = useState(false);
  const showAvatar = agent.avatar !== null && !imgError;

  const style = { width: size, height: size };

  return (
    <div
      className={`rounded-full overflow-hidden flex items-center justify-center bg-neutral-800 border border-neutral-600 shrink-0 ${className}`}
      style={style}
    >
      {showAvatar ? (
        <img
          src={`/api/agents/${agent.id}/avatar`}
          alt={agent.name}
          className="w-full h-full object-cover"
          onError={() => setImgError(true)}
        />
      ) : (
        <span style={{ fontSize: size * 0.5 }} className="leading-none">{agent.emoji}</span>
      )}
    </div>
  );
}
