import { useEffect } from "react";

export default function GuideModal({ onClose }: { onClose: () => void }) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose]);

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        backgroundColor: "rgba(0,0,0,0.6)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1001,
      }}
    >
      <div
        style={{
          background: "white",
          padding: "30px",
          borderRadius: "12px",
          maxWidth: "650px",
          width: "90%",
          position: "relative",
          fontFamily: "sans-serif",
        }}
      >
        <button
          onClick={onClose}
          style={{
            position: "absolute",
            top: "10px",
            right: "15px",
            background: "transparent",
            border: "none",
            fontSize: "20px",
            cursor: "pointer",
          }}
        >
          ✖
        </button>

        <h2 style={{ marginTop: 0 }}>
          🧭 How to Use the Hamiltonian Path Solver
        </h2>

        <h3>🧠 What is a Hamiltonian Path?</h3>
        <p>
          A Hamiltonian Path is a path through a graph that visits each node
          exactly once.
        </p>

        <h3>✍️ How to Input a Graph</h3>
        <ul>
          <li>
            <strong>Text or File:</strong> Enter your graph manually or upload a{" "}
            <code>.txt</code> file.
          </li>
          <li>
            <strong>Format:</strong> The first line is{" "}
            <code>&lt;nodeCount&gt; &lt;edgeCount&gt;</code>, followed by one
            edge per line:
            <pre
              style={{
                background: "#f4f4f4",
                padding: "8px",
                borderRadius: "6px",
              }}
            >
              {`5 4
0 1
1 2
2 3
3 4`}
            </pre>
          </li>
          <li>
            <strong>Interactive:</strong> Click "+ Add Node" to insert new
            nodes.
          </li>
          <li>
            <strong>Connect nodes:</strong> Drag from one node to another in the
            canvas to create edges.
          </li>
        </ul>

        <h3>📏 Rules</h3>
        <ul>
          <li>
            The graph is <strong>undirected</strong>: an edge from 1 to 2 is the
            same as 2 to 1.
          </li>
          <li>Duplicate or reversed edges will be ignored.</li>
          <li>
            Edge count must match the number of edge lines invalid inputs are
            rejected.
          </li>
          <li>You must connect all parts of the graph to make it solvable.</li>
        </ul>
        <h3>🛠️ Editing the Graph</h3>
        <ul>
          <li>
            <strong>Delete an edge:</strong> Click on the edge to select it,
            then press <kbd>Delete</kbd> or <kbd>Backspace</kbd>.
          </li>
          <li>
            <strong>Delete a node:</strong> Use the <em>“Delete Last Node”</em>{" "}
            button. This will remove the last node and all of its connected
            edges.
          </li>
        </ul>

        <hr style={{ marginTop: "30px", marginBottom: "10px" }} />
        <p style={{ fontSize: "0.85rem", color: "#555", textAlign: "center" }}>
          Built by{" "}
          <strong>
            Theodoros Chalkidis, Jamila Oubenali and Sasha Toscano
          </strong>
        </p>
      </div>
    </div>
  );
}
