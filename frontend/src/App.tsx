import { useState } from "react";

export default function App() {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");

  async function fetchOutput() {
    const response = await fetch(`http://localhost:8000/solve/${input}`);
    if (!response.ok) {
      throw new Error("Network response was not ok");
    }
    setOutput(await response.json());
  }

  console.log("input: ", input);

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
    </div>
  );
}
