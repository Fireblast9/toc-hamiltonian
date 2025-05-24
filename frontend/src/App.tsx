import type { Edge, Node } from "@xyflow/react";
import { useEffect, useRef, useState } from "react";
import Graph from "./Graph";

export default function App() {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [hasUploaded, setHasUploaded] = useState(false);
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [loading, setLoading] = useState(false);
  const [animating, setAnimating] = useState(false);
  const isClearedRef = useRef(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!input.trim()) {
      setNodes([]);
      setEdges([]);
    } else {
      const { nodes: parsedNodes, edges: parsedEdges } = parseGraphInput(input);
      setNodes(parsedNodes);
      setEdges(parsedEdges);
    }

    setOutput("");
  }, [input]);

  // fetch the output from the server
  async function fetchOutput() {
    isClearedRef.current = false;
    setLoading(true);
    const response = await fetch(
      `http://localhost:8000/solve/${encodeURIComponent(input)}`
    );

    if (!response.ok) {
      setOutput("Request failed");
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
    if (!file) {
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      setHasUploaded(true);
      const content = e.target?.result;
      if (typeof content === "string") {
        setInput(content);
      }
    };
    reader.readAsText(file);
  }

  function parseGraphInput(input: string) {
    const lines = input.trim().split("\n");
    const [nodeCount] = lines[0].split(" ").map(Number);

    const nodes = Array.from({ length: nodeCount }, (_, i) => ({
      id: i.toString(),
      data: { label: `Node ${i}` },
      position: { x: Math.random() * 500, y: Math.random() * 500 },
    }));

    const edges = lines.slice(1).map((line, index) => {
      const [source, target] = line.trim().split(" ");
      return {
        id: `${source}->${target}-${index}`,
        source,
        target,
      };
    });

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
            onChange={(e) => setInput(e.target.value)}
            style={{ minHeight: "120px", height: "fit-content" }}
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

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginTop: "15px",
          }}
        >
          <button
            onClick={() => {
              fetchOutput();
            }}
            disabled={loading || animating}
            className="cool-button"
            style={{
              cursor: loading || animating ? "not-allowed" : "pointer",
              opacity: loading || animating ? 0.6 : 1,
            }}
          >
            Solve
          </button>

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
              cursor: loading || animating ? "not-allowed" : "pointer",
              opacity: loading || animating ? 0.6 : 1,
            }}
            className="cool-button"
          >
            Clear
          </button>
        </div>
        <p>{output}</p>
      </div>
      <div style={{ width: "100%", height: "100vh" }}>
        <Graph nodes={nodes} edges={edges} loading={loading} />
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
    </div>
  );
}
