'use client';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useState, useRef, useEffect } from 'react';
import type { Agent, AgentRelation } from '@/types/agent';

const NODE_SIZE = 56;
const NODE_HALF = NODE_SIZE / 2;
const COL_GAP = 80; // horizontal gap between nodes in same row
const ROW_GAP = 100; // vertical gap between rows
const PADDING = 20;

interface NodePos {
  agent: Agent;
  x: number;
  y: number;
}

function buildLayout(agents: Agent[], relations: AgentRelation[]): NodePos[] {
  // Determine hierarchy levels
  // Level 0: agents with no incoming relations (roots)
  // Level 1: agents that are targets of level 0
  // Level 2: rest

  const allIds = agents.map((a) => a.id);
  const targetIds = new Set(relations.map((r) => r.target));
  const sourceIds = new Set(relations.map((r) => r.source));

  const roots = agents.filter((a) => !targetIds.has(a.id));
  const level1Ids = new Set<string>();
  roots.forEach((r) => {
    relations.filter((rel) => rel.source === r.id).forEach((rel) => level1Ids.add(rel.target));
  });
  const level2 = agents.filter((a) => !roots.find((r) => r.id === a.id) && !level1Ids.has(a.id));
  const level1 = agents.filter((a) => level1Ids.has(a.id));

  const levels = [roots, level1, level2].filter((l) => l.length > 0);

  const positions: NodePos[] = [];
  levels.forEach((level, rowIndex) => {
    const totalWidth = level.length * NODE_SIZE + (level.length - 1) * COL_GAP;
    level.forEach((agent, colIndex) => {
      const x = PADDING + colIndex * (NODE_SIZE + COL_GAP) + NODE_HALF;
      const y = PADDING + rowIndex * (NODE_SIZE + ROW_GAP) + NODE_HALF;
      positions.push({ agent, x, y });
    });
  });

  return positions;
}

function AvatarNode({ agent, x, y, onClick }: { agent: Agent; x: number; y: number; onClick: () => void }) {
  const [imgError, setImgError] = useState(false);

  return (
    <g
      transform={`translate(${x - NODE_HALF}, ${y - NODE_HALF})`}
      onClick={onClick}
      style={{ cursor: 'pointer' }}
    >
      {/* Circle background */}
      <circle
        cx={NODE_HALF}
        cy={NODE_HALF}
        r={NODE_HALF}
        fill="#1e293b"
        stroke="#475569"
        strokeWidth={2}
      />

      {/* Emoji fallback (always render, hidden by image if loaded) */}
      {(!agent.avatar || imgError) && (
        <text
          x={NODE_HALF}
          y={NODE_HALF + 8}
          textAnchor="middle"
          fontSize={26}
          style={{ userSelect: 'none' }}
        >
          {agent.emoji}
        </text>
      )}

      {/* Name below */}
      <text
        x={NODE_HALF}
        y={NODE_SIZE + 16}
        textAnchor="middle"
        fontSize={11}
        fill="#94a3b8"
        style={{ userSelect: 'none' }}
      >
        {agent.name}
      </text>
    </g>
  );
}

interface MobileDashboardProps {
  agents: Agent[];
  relations: AgentRelation[];
}

export function MobileDashboard({ agents, relations }: MobileDashboardProps) {
  const router = useRouter();
  const positions = buildLayout(agents, relations);

  if (positions.length === 0) {
    return <div className="text-center text-slate-500 py-12">No agents found</div>;
  }

  const maxX = Math.max(...positions.map((p) => p.x)) + NODE_HALF + PADDING;
  const maxY = Math.max(...positions.map((p) => p.y)) + NODE_HALF + 24 + PADDING; // 24 for label

  const handleClick = (agentId: string) => {
    router.push(`/agents?open=${agentId}`);
  };

  return (
    <div className="w-full overflow-x-auto py-4">
      <svg
        width={maxX}
        height={maxY}
        className="mx-auto"
        style={{ display: 'block' }}
      >
        {/* Relations */}
        {relations.map((rel, i) => {
          const from = positions.find((p) => p.agent.id === rel.source);
          const to = positions.find((p) => p.agent.id === rel.target);
          if (!from || !to) return null;
          return (
            <line
              key={i}
              x1={from.x}
              y1={from.y + NODE_HALF}
              x2={to.x}
              y2={to.y - NODE_HALF}
              stroke="#475569"
              strokeWidth={1.5}
              strokeDasharray="4 3"
            />
          );
        })}

        {/* Nodes */}
        {positions.map(({ agent, x, y }) => (
          <AvatarNode
            key={agent.id}
            agent={agent}
            x={x}
            y={y}
            onClick={() => handleClick(agent.id)}
          />
        ))}
      </svg>
    </div>
  );
}
