import React from 'react';

export const Position = { Top: 'top', Bottom: 'bottom', Left: 'left', Right: 'right' };
export const BackgroundVariant = { Dots: 'dots', Lines: 'lines', Cross: 'cross' };

export function useNodesState(initial: unknown[]) {
  const [nodes, setNodes] = React.useState(initial);
  return [nodes, setNodes, () => {}] as const;
}

export function useEdgesState(initial: unknown[]) {
  const [edges, setEdges] = React.useState(initial);
  return [edges, setEdges, () => {}] as const;
}

export function addEdge(edge: unknown, edges: unknown[]) {
  return [...edges, edge];
}

export function Handle() {
  return null;
}

export function Background() {
  return null;
}

export function Controls() {
  return null;
}

export function MiniMap() {
  return null;
}

export function ReactFlow({
  nodes,
  onNodeClick,
  children,
}: {
  nodes?: { id: string; data: Record<string, unknown> }[];
  edges?: unknown[];
  nodeTypes?: unknown;
  onNodeClick?: (event: React.MouseEvent, node: { id: string }) => void;
  fitView?: boolean;
  proOptions?: unknown;
  children?: React.ReactNode;
}) {
  return (
    <div data-testid="react-flow">
      {nodes?.map((node) => (
        <div
          key={node.id}
          data-testid={`node-${node.id}`}
          onClick={(e) => onNodeClick?.(e, node)}
        >
          {String(node.data.name)}
        </div>
      ))}
      {children}
    </div>
  );
}

export default ReactFlow;
