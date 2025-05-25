import type { Edge, Node, NodeChange } from "@xyflow/react";
import {
  addEdge,
  Background,
  Controls,
  MiniMap,
  ReactFlow,
  useEdgesState,
  useNodesState,
  type OnConnect,
} from "@xyflow/react";
import { useCallback, useEffect, useRef } from "react";

import "@xyflow/react/dist/style.css";

import { edgeTypes } from "./edges";
import { nodeTypes } from "./nodes";

import { useReactFlow } from "@xyflow/react";

function FitViewTrigger({
  shouldFitView,
  onFitComplete,
}: {
  shouldFitView: boolean;
  onFitComplete: () => void;
}) {
  const { fitView } = useReactFlow();
  const prevShouldFit = useRef(false);

  useEffect(() => {
    if (shouldFitView && !prevShouldFit.current) {
      fitView({ padding: 0.2 });
      onFitComplete(); // Reset flag
    }
    prevShouldFit.current = shouldFitView;
  }, [shouldFitView, fitView, onFitComplete]);

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
  onFitComplete = () => {},
}: GraphProps & {
  nodes: Node[];
  edges: Edge[];
  loading: boolean;
  animating: boolean;
  onEdgeAdded: (source: string, target: string) => void;
  onEdgesDelete: (edges: Edge[]) => void;
  onNodesUpdated: (updatedNodes: Node[]) => void;
  shouldFitView?: boolean;
  onFitComplete?: () => void;
  onNodesDelete?: () => void;
}) {
  const [graphNodes, setGraphNodes, onNodesChangeInternal] =
    useNodesState(nodes);
  const [graphEdges, setGraphEdges, onEdgesChange] = useEdgesState(edges);

  const onNodesChange = useCallback(
    (changes: NodeChange<Node>[]) => {
      const filteredChanges = changes.filter(
        (change) => change.type !== "remove"
      );
      onNodesChangeInternal(filteredChanges);
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
      onNodesDelete={() => {}}
    >
      <Background />
      <MiniMap />
      <Controls />

      <FitViewTrigger
        shouldFitView={shouldFitView}
        onFitComplete={onFitComplete}
      />
    </ReactFlow>
  );
}
