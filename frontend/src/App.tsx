import { useState } from "react";
import Graph from "./Graph";

export default function App() {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [hasUploaded, setHasUploaded] = useState(false);

  async function fetchOutput() {
    const response = await fetch(
      `http://localhost:8000/solve/${encodeURIComponent(input)}`
    );
    if (!response.ok) {
      throw new Error("Network response was not ok");
    }
    const res = await response.json();
    if (!res) {
      setOutput("No solution found");
    } else {
      setOutput("");
      console.log(res);
    }
  }
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

  return (
    <div className="App">
      <h1>SAT Solver</h1>
      <div>
        <label htmlFor="input">{hasUploaded ? "Preview: " : "Graph: "}</label>
        <textarea value={input} onChange={(e) => setInput(e.target.value)} />
      </div>
      <div>
        <label htmlFor="fileInput">Upload a file</label>
        <input
          type="file"
          id="fileInput"
          accept=".txt"
          onChange={(e) => handleFile(e.target.files)}
        />
      </div>

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
