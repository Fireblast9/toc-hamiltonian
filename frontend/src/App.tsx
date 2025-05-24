import type { Edge, Node } from "@xyflow/react";
import { useEffect, useRef, useState } from "react";
import Graph from "./Graph";
import GuideModal from "./GuideModal";

export default function App() {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [hasUploaded, setHasUploaded] = useState(false);
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [loading, setLoading] = useState(false);
  const [animating, setAnimating] = useState(false);
  const isClearedRef = useRef(false);
  const isManualEditRef = useRef(false);
  const [showGuide, setShowGuide] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!input.trim()) {
      setNodes([]);
      setEdges([]);
      return;
    }

    const { nodes: parsedNodes, edges: parsedEdges } = parseGraphInput(
      input,
      nodes
    );
    setNodes(parsedNodes);
    setEdges(parsedEdges);
  }, [input]);

  function isInputValidEdgeCount(input: string): boolean {
    const lines = input.trim().split("\n");
    if (lines.length < 1) return false;

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [_, edgeCountStr] = lines[0].split(" ");
    const declaredEdgeCount = parseInt(edgeCountStr, 10);
    const actualEdgeCount = lines.slice(1).filter((line) => line.trim()).length;

    return declaredEdgeCount === actualEdgeCount;
  }

  function handleAddNode() {
    if (!input.trim()) {
      setInput("1 0");
      return;
    }

    const lines = input.trim().split("\n");
    const [nodeCountStr, edgeCountStr] = lines[0].split(" ");
    const newNodeCount = parseInt(nodeCountStr, 10) + 1;

    // Replace only the first line with updated node count
    const newInput = [
      `${newNodeCount} ${edgeCountStr}`,
      ...lines.slice(1),
    ].join("\n");
    setInput(newInput);
  }

  function handleEdgeAdded(source: string, target: string) {
    if (!input.trim()) {
      setInput(`2 1\n${source} ${target}`);
      return;
    }

    const lines = input.trim().split("\n");
    let [nodeCount] = lines[0].split(" ").map(Number);

    const edgeLines = lines.slice(1);
    const edgeSet = new Set(
      edgeLines.map((line) => {
        const [a, b] = line.trim().split(" ");
        return `${Math.min(+a, +b)}-${Math.max(+a, +b)}`;
      })
    );

    const newEdgeId = `${Math.min(+source, +target)}-${Math.max(
      +source,
      +target
    )}`;
    if (edgeSet.has(newEdgeId)) {
      // Prevent duplicate undirected edge
      return;
    }

    const newEdge = `${source} ${target}`;
    const updatedEdges = [...edgeLines, newEdge];
    const newEdgeCount = updatedEdges.length;

    nodeCount = Math.max(nodeCount, +source + 1, +target + 1);

    const newInput = [`${nodeCount} ${newEdgeCount}`, ...updatedEdges].join(
      "\n"
    );
    setInput(newInput);
  }

  function handleNodesUpdated(updatedNodes: Node[]) {
    setNodes(updatedNodes); // Persist positions
  }

  // fetch the output from the server
  async function fetchOutput() {
    isClearedRef.current = false;
    setLoading(true);
    let response: Response;

    try {
      response = await fetch(
        `http://localhost:8000/solve/${encodeURIComponent(input)}`
      );
    } catch {
      setOutput(
        "There was an error connecting to the server. Please ensure the server is running."
      );
      setLoading(false);
      return;
    }

    if (!response.ok) {
      setOutput("Please input a valid graph");
      setLoading(false);
      return;
    }

    const res = await response.json(); // Expected: [4, 3, 2, 1, 0]
    if (!Array.isArray(res) || res.length === 0) {
      setOutput("Not solvable");
      setLoading(false);
      return;
    }

    setLoading(false);

    setOutput("Animating Hamiltonian Path...");
    setAnimating(true);

    // Reset all edge styles
    const clearedEdges = edges.map((edge) => ({
      ...edge,
      style: undefined,
      animated: false,
    }));
    setEdges(clearedEdges);

    // Animate edge by edge
    for (let i = 0; i < res.length - 1; i++) {
      console.log("Animating edge:", res[i], res[i + 1], isClearedRef);
      if (isClearedRef.current) {
        console.log("Stopping...");

        setAnimating(false);
        setLoading(false);
        return;
      }
      const source = res[i].toString();
      const target = res[i + 1].toString();

      await new Promise((resolve) => setTimeout(resolve, 200)); // wait 0.2 second

      setEdges((prev) =>
        prev.map((edge) => {
          const isMatch =
            (edge.source === source && edge.target === target) ||
            (edge.source === target && edge.target === source);
          return isMatch
            ? {
                ...edge,
                style: {
                  stroke: "green",
                  strokeWidth: 3,
                  transition: "stroke 0.5s ease, stroke-width 0.5s ease",
                },
                animated: true,
              }
            : edge;
        })
      );
    }
    setAnimating(false);
    setOutput(`Hamiltonian Path: ${res.join(" → ")}`);
  }

  // handle file upload
  function handleFile(files: FileList | null) {
    const file = files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.name.endsWith(".txt")) {
      alert("Please upload a .txt file.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result;
      if (typeof content === "string") {
        setHasUploaded(true);
        setOutput("");
        setNodes([]);
        setEdges([]);
        isManualEditRef.current = false;
        setInput(content);
      }
    };
    reader.readAsText(file);
  }

  function parseGraphInput(
    input: string,
    existingNodes: Node[] = []
  ): { nodes: Node[]; edges: Edge[] } {
    const lines = input.trim().split("\n");
    console.log(lines);

    if (lines.length === 0) return { nodes: [], edges: [] };

    const [nodeCountStr] = lines[0].split(" ");
    const nodeCount = parseInt(nodeCountStr, 10);
    const existingMap = new Map(existingNodes.map((n) => [n.id, n]));

    const nodes = Array.from({ length: nodeCount }, (_, i) => {
      const id = i.toString();
      return (
        existingMap.get(id) ?? {
          id,
          data: { label: `Node ${i}` },
          position: { x: Math.random() * 500, y: Math.random() * 500 },
        }
      );
    });

    const edges = lines
      .slice(1)
      .map((line) => {
        const [rawSource, rawTarget] = line.trim().split(" ");
        const source = parseInt(rawSource, 10);
        const target = parseInt(rawTarget, 10);

        if (isNaN(source) || isNaN(target)) return null;

        const edgeId = `${Math.min(source, target)}-${Math.max(
          source,
          target
        )}`;
        return {
          id: edgeId,
          source: source.toString(),
          target: target.toString(),
        };
      })
      .filter((e): e is Edge => e !== null); // Type guard to filter out nulls

    return { nodes, edges };
  }

  return (
    <div className="App">
      <style>
        @import
        url('https://fonts.googleapis.com/css2?family=Fira+Sans:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,100;1,200;1,300;1,400;1,500;1,600;1,700;1,800;1,900&display=swap');
      </style>
      <div
        style={{
          float: "left",
          width: "25%",
          minWidth: "200px",
          position: "absolute",
          backgroundColor: "#4b0082", // Indigo
          zIndex: 1,
          color: "white",
          padding: "10px",
          margin: "10px",
          borderRadius: "10px",
          border: "1px solid #000",
          textAlign: "center",
        }}
      >
        <h3>Hamiltonian Path SAT Solver</h3>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            marginBottom: "10px",
          }}
        >
          <label htmlFor="input" style={{ marginBottom: "5px" }}>
            {hasUploaded ? "Preview: " : "Write your graph: "}
          </label>
          <textarea
            value={input}
            disabled={loading || animating}
            onChange={(e) => {
              isManualEditRef.current = true;

              // Allow only numbers, spaces, and newlines
              const numericOnly = e.target.value.replace(/[^\d\s\n]/g, "");

              setInput(numericOnly);
            }}
            style={{
              width: "100%",
              maxWidth: "100%",
              boxSizing: "border-box",
              overflowX: "auto",
              minHeight: "200px",
            }}
            placeholder="Enter graph in the following format (only accepts numbers): 
N E
0 1
1 2
..."
          />
        </div>
        <div style={{ marginTop: "10px", marginBottom: "10px" }}>
          <input
            type="file"
            id="fileInput"
            accept=".txt"
            ref={fileInputRef}
            onChange={(e) => handleFile(e.target.files)}
            disabled={loading || animating}
            style={{ display: "none" }}
          />

          <label
            htmlFor="fileInput"
            className="cool-button"
            style={{
              display: "inline-block",
              textAlign: "center",
              cursor: loading || animating ? "not-allowed" : "pointer",
              opacity: loading || animating ? 0.6 : 1,
            }}
          >
            Pick a file to upload
          </label>
        </div>
        <button
          onClick={handleAddNode}
          disabled={loading || animating}
          className="cool-button"
          style={{
            cursor: loading || animating ? "not-allowed" : "pointer",
            opacity: loading || animating ? 0.6 : 1,
          }}
        >
          + Add Node
        </button>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginTop: "15px",
          }}
        >
          <button
            onClick={() => {
              setInput("");
              setOutput("");
              setHasUploaded(false);
              setNodes([]);
              setEdges([]);
              setAnimating(false);
              setLoading(false);
              isClearedRef.current = true;
              if (fileInputRef.current) {
                fileInputRef.current.value = "";
              }
            }}
            style={{
              cursor: loading ? "not-allowed" : "pointer",
              opacity: loading ? 0.6 : 1,
            }}
            className="cool-button"
          >
            Clear
          </button>
          <button
            onClick={() => {
              fetchOutput();
            }}
            disabled={loading || animating || !isInputValidEdgeCount(input)}
            className="cool-button"
            style={{
              cursor: loading || animating ? "not-allowed" : "pointer",
              opacity: loading || animating ? 0.6 : 1,
            }}
          >
            Solve
          </button>
        </div>
        <p>{output}</p>
        {!isInputValidEdgeCount(input) && input.length != 0 && (
          <p style={{ color: "orange", fontWeight: "bold" }}>
            ⚠️ Incorrect format. If you are not sure how to format your input,
            please refer to the guide.
          </p>
        )}
      </div>
      <div style={{ width: "100%", height: "100vh" }}>
        <Graph
          nodes={nodes}
          edges={edges}
          loading={loading}
          animating={animating}
          onEdgeAdded={handleEdgeAdded}
          onNodesUpdated={handleNodesUpdated}
        />
      </div>
      {loading && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            backgroundColor: "rgba(0, 0, 0, 0.3)",
            zIndex: 999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            pointerEvents: "none",
          }}
        >
          <div
            className="loader"
            style={{
              width: "50px",
              height: "50px",
              border: "5px solid white",
              borderTop: "5px solid #4b0082",
              borderRadius: "50%",
              animation: "spin 1s linear infinite",
            }}
          />
          <style>
            {`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}
          </style>
        </div>
      )}
      <button
        onClick={() => setShowGuide(true)}
        style={{
          position: "fixed",
          top: "20px",
          right: "20px",
          zIndex: 1000,
          padding: "10px 16px",
          background: "#4b0082",
          color: "white",
          border: "none",
          borderRadius: "8px",
          fontWeight: "bold",
          cursor: "pointer",
          boxShadow: "0 2px 10px rgba(0,0,0,0.3)",
        }}
        className="cool-button"
      >
        ❓ Guide
      </button>

      {showGuide && <GuideModal onClose={() => setShowGuide(false)} />}
    </div>
  );
}
