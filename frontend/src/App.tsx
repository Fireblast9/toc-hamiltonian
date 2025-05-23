import { useState } from "react";
import Graph from "./Graph";

export default function App() {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");

  async function fetchOutput() {
    const response = await fetch(
      `http://localhost:8000/solve/${encodeURIComponent(input)}`
    );
    if (!response.ok) {
      throw new Error("Network response was not ok");
    }
    const res = await response.json();
    if (res === "false") {
      setOutput("No solution found");
    } else {
      setOutput(res);
    }
  }

  return (
    <div className="App">
      <h1>SAT Solver</h1>
      <textarea value={input} onChange={(e) => setInput(e.target.value)} />

      <button
        onClick={() => {
          fetchOutput();
        }}
      >
        Solve
      </button>

      <p>{output}</p>
      <Graph />
    </div>
  );
}
