'use client';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import type { Agent, AgentRelation } from '@/types/agent';

const NODE_SIZE = 40;
const NODE_HALF = NODE_SIZE / 2;
const COL_GAP = 60;
const ROW_GAP = 80;
const PADDING = 24;
const MAX_PER_ROW = 4;

interface NodePos {
  agent: Agent;
  x: number;
  y: number;
}

function buildLayout(agents: Agent[], relations: AgentRelation[]): NodePos[] {
  const targetIds = new Set(relations.map((r) => r.target));

  const roots = agents.filter((a) => !targetIds.has(a.id));
  const level1Ids = new Set<string>();
  roots.forEach((r) => {
    relations.filter((rel) => rel.source === r.id).forEach((rel) => level1Ids.add(rel.target));
  });
  const level2 = agents.filter((a) => !roots.find((r) => r.id === a.id) && !level1Ids.has(a.id));
  const level1 = agents.filter((a) => level1Ids.has(a.id));

  const rawLevels = [roots, level1, level2].filter((l) => l.length > 0);

  // Split levels into rows of MAX_PER_ROW
  const rows: Agent[][] = [];
  for (const level of rawLevels) {
    for (let i = 0; i < level.length; i += MAX_PER_ROW) {
      rows.push(level.slice(i, i + MAX_PER_ROW));
    }
  }

  const positions: NodePos[] = [];
  rows.forEach((row, rowIndex) => {
    const rowWidth = row.length * NODE_SIZE + (row.length - 1) * COL_GAP;
    row.forEach((agent, colIndex) => {
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
      <circle
        cx={NODE_HALF}
        cy={NODE_HALF}
        r={NODE_HALF}
        fill="#1e293b"
        stroke="#475569"
        strokeWidth={2}
      />

      {imgError ? (
        <text
          x={NODE_HALF}
          y={NODE_HALF + 7}
          textAnchor="middle"
          fontSize={20}
          style={{ userSelect: 'none' }}
        >
          {agent.emoji}
        </text>
      ) : (
        <image
          href={`/api/agents/${agent.id}/avatar`}
          x={2}
          y={2}
          width={NODE_SIZE - 4}
          height={NODE_SIZE - 4}
          clipPath={`circle(${NODE_HALF - 2}px at ${NODE_HALF - 2}px ${NODE_HALF - 2}px)`}
          preserveAspectRatio="xMidYMid slice"
          onError={() => setImgError(true)}
        />
      )}

      <text
        x={NODE_HALF}
        y={NODE_SIZE + 14}
        textAnchor="middle"
        fontSize={10}
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
  const maxY = Math.max(...positions.map((p) => p.y)) + NODE_HALF + 20 + PADDING;

  const handleClick = (agentId: string) => {
    router.push(`/agents?open=${agentId}`);
  };

  return (
    <div className="w-full overflow-x-auto py-4">
      <svg
        viewBox={`0 0 ${maxX} ${maxY}`}
        width="100%"
        style={{ display: 'block', maxWidth: maxX }}
        className="mx-auto"
      >
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
