'use client';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import type { Agent, AgentRelation } from '@/types/agent';

const NODE_SIZE = 32;
const NODE_HALF = NODE_SIZE / 2;
const COL_GAP = 56;
const LEVEL_GAP = 90;
const PADDING = 20;

interface NodePos {
  agent: Agent;
  x: number;
  y: number;
}

function buildLayout(agents: Agent[], relations: AgentRelation[]): NodePos[] {
  if (agents.length === 0) return [];

  // BFS to assign levels based on relations
  const childrenMap = new Map<string, string[]>();
  const parentSet = new Set<string>();
  relations.forEach((r) => {
    if (!childrenMap.has(r.source)) childrenMap.set(r.source, []);
    childrenMap.get(r.source)!.push(r.target);
    parentSet.add(r.target);
  });

  // Roots = agents with no parent
  const agentIds = new Set(agents.map((a) => a.id));
  const roots = agents.filter((a) => !parentSet.has(a.id));

  const levelMap = new Map<string, number>();
  const queue: { id: string; level: number }[] = roots.map((r) => ({ id: r.id, level: 0 }));

  while (queue.length > 0) {
    const { id, level } = queue.shift()!;
    if (levelMap.has(id)) continue;
    levelMap.set(id, level);
    const children = childrenMap.get(id) ?? [];
    children.forEach((cid) => {
      if (agentIds.has(cid) && !levelMap.has(cid)) {
        queue.push({ id: cid, level: level + 1 });
      }
    });
  }

  // Agents not reachable from roots get level = max+1
  const maxLevel = levelMap.size > 0 ? Math.max(...levelMap.values()) : 0;
  agents.forEach((a) => {
    if (!levelMap.has(a.id)) levelMap.set(a.id, maxLevel + 1);
  });

  // Group by level
  const levelGroups = new Map<number, Agent[]>();
  agents.forEach((a) => {
    const lvl = levelMap.get(a.id)!;
    if (!levelGroups.has(lvl)) levelGroups.set(lvl, []);
    levelGroups.get(lvl)!.push(a);
  });

  const sortedLevels = Array.from(levelGroups.keys()).sort((a, b) => a - b);

  // Compute max width to center rows
  const maxRowWidth = Math.max(
    ...sortedLevels.map((lvl) => {
      const n = levelGroups.get(lvl)!.length;
      return n * NODE_SIZE + (n - 1) * COL_GAP;
    })
  );
  const svgWidth = PADDING * 2 + maxRowWidth;

  const positions: NodePos[] = [];
  sortedLevels.forEach((lvl, rowIndex) => {
    const group = levelGroups.get(lvl)!;
    const rowWidth = group.length * NODE_SIZE + (group.length - 1) * COL_GAP;
    const startX = (svgWidth - rowWidth) / 2 + NODE_HALF;
    const y = PADDING + rowIndex * (NODE_SIZE + LEVEL_GAP) + NODE_HALF;
    group.forEach((agent, colIndex) => {
      const x = startX + colIndex * (NODE_SIZE + COL_GAP);
      positions.push({ agent, x, y });
    });
  });

  return positions;
}

function AvatarNode({ agent, x, y, onClick }: { agent: Agent; x: number; y: number; onClick: () => void }) {
  const [imgError, setImgError] = useState(false);
  const isActive = agent.status === 'active';

  return (
    <g
      transform={`translate(${x - NODE_HALF}, ${y - NODE_HALF})`}
      onClick={onClick}
      style={{ cursor: 'pointer' }}
    >
      {/* Animated glow ring for active agents */}
      {isActive && (
        <g>
          {/* Blurred glow layer */}
          <circle
            cx={NODE_HALF}
            cy={NODE_HALF}
            r={NODE_HALF + 8}
            fill="none"
            stroke="#00ff88"
            strokeWidth={6}
            strokeDasharray="22 18"
            strokeLinecap="round"
            filter="url(#neonBlur)"
          >
            <animateTransform
              attributeName="transform"
              type="rotate"
              from={`0 ${NODE_HALF} ${NODE_HALF}`}
              to={`360 ${NODE_HALF} ${NODE_HALF}`}
              dur="1.2s"
              repeatCount="indefinite"
            />
          </circle>
          {/* Sharp ring on top */}
          <circle
            cx={NODE_HALF}
            cy={NODE_HALF}
            r={NODE_HALF + 8}
            fill="none"
            stroke="#00ff88"
            strokeWidth={3.5}
            strokeDasharray="22 18"
            strokeLinecap="round"
          >
            <animateTransform
              attributeName="transform"
              type="rotate"
              from={`0 ${NODE_HALF} ${NODE_HALF}`}
              to={`360 ${NODE_HALF} ${NODE_HALF}`}
              dur="1.2s"
              repeatCount="indefinite"
            />
          </circle>
        </g>
      )}

      <circle
        cx={NODE_HALF}
        cy={NODE_HALF}
        r={NODE_HALF}
        fill="#1e293b"
        stroke="#475569"
        strokeWidth={1.5}
      />

      {imgError ? (
        <text
          x={NODE_HALF}
          y={NODE_HALF + 5}
          textAnchor="middle"
          fontSize={16}
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
        y={NODE_SIZE + 11}
        textAnchor="middle"
        fontSize={8}
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
    return <div className="text-center text-gray-500 dark:text-slate-500 py-12">No agents found</div>;
  }

  const minX = Math.min(...positions.map((p) => p.x)) - NODE_HALF - PADDING;
  const minY = Math.min(...positions.map((p) => p.y)) - NODE_HALF - PADDING;
  const maxX = Math.max(...positions.map((p) => p.x)) + NODE_HALF + PADDING;
  const maxY = Math.max(...positions.map((p) => p.y)) + NODE_SIZE + 12 + PADDING;
  const vbWidth = maxX - minX;
  const vbHeight = maxY - minY;

  const handleClick = (agentId: string) => {
    router.push(`/agents?open=${agentId}`);
  };

  return (
    <div className="w-full h-full flex items-center justify-center py-4">
      <svg
        viewBox={`${minX} ${minY} ${vbWidth} ${vbHeight}`}
        width="100%"
        preserveAspectRatio="xMidYMid meet"
        style={{ display: 'block' }}
      >
        <defs>
          <filter id="neonBlur" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="3" result="blur" />
          </filter>
        </defs>

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
              stroke="#6366f1"
              strokeWidth={1.5}
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
