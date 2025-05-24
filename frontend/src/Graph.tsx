import type { Edge, Node } from "@xyflow/react";
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

interface GraphProps {
  nodes: Node[];
  edges: Edge[];
  loading: boolean;
}

export default function Graph({ nodes, edges, loading }: GraphProps) {
  const [graphNodes, setGraphNodes, onNodesChange] = useNodesState(nodes);
  const [graphEdges, setGraphEdges, onEdgesChange] = useEdgesState(edges);

  const onConnect: OnConnect = useCallback(
    (connection) => setGraphEdges((edges) => addEdge(connection, edges)),
    [setGraphEdges]
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
    >
      <Background />
      <MiniMap />
      <Controls />
    </ReactFlow>
  );
}
