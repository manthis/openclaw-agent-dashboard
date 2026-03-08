'use client';
import { useCallback, useState } from 'react';
import {
  ReactFlow,
  Controls,
  Background,
  BackgroundVariant,
  useNodesState,
  useEdgesState,
  type Edge,
  type OnConnect,
  addEdge,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { AnimatePresence } from 'framer-motion';
import { AgentNode, type AgentNodeType } from './AgentNode';
import { AgentCard } from './AgentCard';
import type { Agent, AgentRelation } from '@/types/agent';

const nodeTypes = { agentNode: AgentNode };

const POSITIONS: Record<string, { x: number; y: number }> = {
  hal9000: { x: 550, y: 0 },
  mother: { x: 550, y: 120 },
  data: { x: 0, y: 320 },
  atlas: { x: 280, y: 320 },
  prometheus: { x: 560, y: 320 },
  tars: { x: 840, y: 320 },
  ash: { x: 1120, y: 320 },
  skynet: { x: 1400, y: 320 },
};

function buildNodes(agents: Agent[]): AgentNodeType[] {
  return agents.map((a) => ({
    id: a.id,
    type: 'agentNode' as const,
    position: POSITIONS[a.id] ?? { x: Math.random() * 700, y: 400 },
    data: a as AgentNodeType['data'],
  }));
}

function buildEdges(relations: AgentRelation[]): Edge[] {
  return relations.map((r, i) => ({
    id: `e${i}`,
    source: r.source,
    target: r.target,
    label: r.label,
    animated: r.source === 'hal9000',
    style: { stroke: '#6366f1', strokeWidth: 2 },
    labelStyle: { fill: '#94a3b8', fontSize: 11 },
    labelBgStyle: { fill: '#1e293b' },
  }));
}

export function AgentGraph({ agents, relations }: { agents: Agent[]; relations: AgentRelation[] }) {
  const [nodes, , onNodesChange] = useNodesState<AgentNodeType>(buildNodes(agents));
  const [edges, setEdges, onEdgesChange] = useEdgesState(buildEdges(relations));
  const [selected, setSelected] = useState<Agent | null>(null);

  const onConnect: OnConnect = useCallback(
    (conn) => setEdges((eds) => addEdge(conn, eds)),
    [setEdges]
  );

  const onNodeClick = useCallback(
    (_: React.MouseEvent, node: AgentNodeType) => {
      setSelected(agents.find((a) => a.id === node.id) ?? null);
    },
    [agents]
  );

  return (
    <div className="relative w-full h-full" data-testid="agent-graph">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={onNodeClick}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.6 }}
        minZoom={0.2}
        colorMode="dark"
      >
        <Background variant={BackgroundVariant.Dots} gap={24} size={1} color="#334155" />
        <Controls />
      </ReactFlow>
      <AnimatePresence>
        {selected && (
          <div className="absolute bottom-6 right-6 z-10">
            <AgentCard agent={selected} onClose={() => setSelected(null)} />
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
