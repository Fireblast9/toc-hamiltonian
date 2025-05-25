import type { Edge, Node, NodeChange } from "@xyflow/react";
import {
  Background,
  Controls,
  MiniMap,
  ReactFlow,
  addEdge,
  useEdgesState,
  useNodesState,
  type OnConnect,
} from "@xyflow/react";
import { useCallback, useEffect } from "react";

import "@xyflow/react/dist/style.css";

import { edgeTypes } from "./edges";
import { nodeTypes } from "./nodes";

import { useReactFlow } from "@xyflow/react";

function FitViewTrigger({ shouldFitView }: { shouldFitView: boolean }) {
  const { fitView } = useReactFlow();

  useEffect(() => {
    if (shouldFitView) {
      fitView({ padding: 0.2 });
    }
  }, [shouldFitView, fitView]);

  return null;
}

interface GraphProps {
  nodes: Node[];
  edges: Edge[];
  shouldFitView?: boolean;
}

export default function Graph({
  nodes,
  edges,
  loading,
  animating,
  onEdgeAdded,
  onEdgesDelete,
  onNodesUpdated,
  shouldFitView = true,
}: GraphProps & {
  nodes: Node[];
  edges: Edge[];
  loading: boolean;
  animating: boolean;
  onEdgeAdded: (source: string, target: string) => void;
  onEdgesDelete: (edges: Edge[]) => void;
  onNodesUpdated: (updatedNodes: Node[]) => void;
  shouldFitView?: boolean;
}) {
  const [graphNodes, setGraphNodes, onNodesChangeInternal] =
    useNodesState(nodes);
  const [graphEdges, setGraphEdges, onEdgesChange] = useEdgesState(edges);

  const onNodesChange = useCallback(
    (changes: NodeChange<Node>[]) => {
      onNodesChangeInternal(changes);
      // After changes apply, call back with updated nodes
      setTimeout(() => onNodesUpdated(graphNodes), 0);
    },
    [onNodesChangeInternal, graphNodes, onNodesUpdated]
  );

  const onConnect: OnConnect = useCallback(
    (connection) => {
      if (loading || animating) return;

      const newSource = connection.source;
      const newTarget = connection.target;

      const normalizedId = `${Math.min(+newSource, +newTarget)}-${Math.max(
        +newSource,
        +newTarget
      )}`;

      // Check if edge already exists (either direction)
      const edgeExists = edges.some((e) => {
        const existingId = `${Math.min(+e.source, +e.target)}-${Math.max(
          +e.source,
          +e.target
        )}`;
        return existingId === normalizedId;
      });

      if (edgeExists) {
        // Prevent duplicate undirected edge
        return;
      }

      setGraphEdges((eds) => addEdge({ ...connection, id: normalizedId }, eds));
      onEdgeAdded(newSource, newTarget);
    },
    [edges, setGraphEdges, onEdgeAdded, loading, animating]
  );

  useEffect(() => {
    setGraphNodes(nodes);
  }, [nodes]);

  useEffect(() => {
    setGraphEdges(edges);
  }, [edges]);

  return (
    <ReactFlow
      nodes={graphNodes}
      onNodesChange={onNodesChange}
      edges={graphEdges}
      onEdgesChange={onEdgesChange}
      onConnect={onConnect}
      nodeTypes={nodeTypes}
      edgeTypes={edgeTypes}
      fitView
      nodesDraggable={!loading}
      elementsSelectable={!loading}
      zoomOnScroll={!loading}
      panOnScroll={!loading}
      panOnDrag={!loading}
      onEdgesDelete={onEdgesDelete}
      deleteKeyCode={["Backspace", "Delete"]}
    >
      <Background />
      <MiniMap />
      <Controls />

      <FitViewTrigger shouldFitView={shouldFitView} />
    </ReactFlow>
  );
}
