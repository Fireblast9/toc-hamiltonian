
# Hamiltonian Path to SAT Solver (Theory of Computation Project)

**Authors:** Sasha Toscano, Theodoros Chalkidis, Jamila Oubenali
**Course:** Theory of Computation (2025)
**Live Application:** [https://toc.soulsbros.ch/](https://toc.soulsbros.ch/)
**GitHub Repository:** [https://github.com/Fireblast9/toc-hamiltonian](https://github.com/Fireblast9/toc-hamiltonian)

## Project Overview

This project addresses the problem of finding a Hamiltonian Path in a given graph by converting the problem into a Boolean Satisfiability (SAT) instance. A Hamiltonian Path is a path within a graph that visits every vertex exactly once. Our solution involves:

1.  **Encoding:** Translating the graph structure and Hamiltonian Path constraints into a set of Boolean clauses in Conjunctive Normal Form (CNF).
2.  **Solving:** Using an external SAT solver (e.g., Z3) to determine if a satisfying assignment exists for these clauses.
3.  **Decoding:** If a satisfying assignment is found, translating it back into a valid Hamiltonian Path for the original graph.
4.  **Web Application:** A user-friendly web interface for graph input (file upload or manual creation), SAT solving, and visualization of the resulting Hamiltonian Path.


## Design and Implementation

The core of the project lies in the SAT encoding. We identified five fundamental constraints necessary to define a Hamiltonian Path:

1.  **Every vertex must be visited at least once.**
    *   *Formula:* $\bigwedge_{c \in \mathit{Cities}} \bigvee_{p \in \text{Positions}}  \mathit{visited}(c, p)$
2.  **Every position in the path must have at least one vertex mapped to it.**
    *   *Formula:* $\bigwedge_{p \in \mathit{Positions}} \bigvee_{c \in \mathit{Cities}}  \mathit{visited}(c, p)$
3.  **A vertex should not be visited more than once (at most one position per vertex).**
    *   *Formula:* $\bigwedge_{c \in \mathit{Cities}} \bigwedge_{\substack{p_{\alpha}, p_{\beta} \in \mathit{Positions} \\ p_{\alpha} \neq p_{\beta}}}  (\neg \text{visited}(c, p_\alpha) \lor \neg \text{visited}(c, p_\beta))$
4.  **No two vertices can occur at the same position in the path (at most one vertex per position).**
    *   *Formula:* $\bigwedge_{p \in \mathit{Positions}} \bigwedge_{\substack{c_{\alpha}, c_{\beta} \in \mathit{Cities} \\ c_{\alpha} \neq c_{\beta}}}  (\neg \text{visited}(c_\alpha, p) \lor \neg \text{visited}(c_\beta, p))$
5.  **Two vertices can be adjacent in the path if and only if they are connected by an edge in the original graph.**
    *   *Formula (for non-neighbors):* $\bigwedge_{p \in \mathit{Positions}} \bigwedge_{\substack{c_{\alpha}, c_{\beta} \in \mathit{Cities} \\ c_{\alpha} \neq c_{\beta} \\ c_{\alpha} \text{ not neighbor of } c_{\beta}}} (\neg \text{visited}(c_\alpha, p) \lor \neg \text{visited}(c_\beta, p+1))$

The primary Boolean variable used is `visited(c, p)`, which is true if city/vertex `c` is at position `p` in the path.

### Code Structure (Backend SAT Encoding)

The backend logic for SAT encoding and solving is primarily located in `/backend/HamToSAT/`. The key Python files are:

*   `converter.py`: The main version used by the web application.
*   `optimised.py` / `optimization_attempt.py`: Experimental versions with different clause generation strategies.

Key functions within these files include:
*   `HamSAT(input_graph_string)`: Orchestrates the encoding, solving, and decoding.
*   `getGraphData(input_graph_string)`: Parses the input graph string.
*   `genClauses()`: Implements the translation of the five constraints into CNF clauses.
*   `getHamPath(res, n_vertices)`: Decodes the SAT solver's output into a path.

### Input Graph Format

Graphs are input as text. The first line specifies the number of vertices (N) and the number of edges (M). Subsequent lines define edges, with each line containing two space-separated vertex IDs (0-indexed).

Example:
4 4 # 4 vertices, 4 edges
0 1
1 2
2 3
3 0 # A cycle graph C4

### Web Application

The user interface is a React (TypeScript) frontend with a FastAPI backend. It features:
*   Graph input via file upload or a built-in text editor with a visual graph tool (using React Flow).
*   Real-time graph visualization as the user defines it.
*   Dynamic display of the Hamiltonian path found by the SAT solver.
*   A user guide accessible via the guide icon.

## Running the Backend Locally

The Python scripts in `/backend/HamToSAT/` can be run from the command line. They accept a graph file path as an argument.

1.  **Prerequisites:**
    *   Python
    *   A SAT Solver (e.g., Z3) installed and accessible in your PATH. The script defaults to `z3` but can be configured.
2.  **Execution:**
    ```bash
    cd backend/HamToSAT/
    python converter.py path/to/your/graph.txt
    # or
    python optimised.py path/to/your/graph.txt
    ```
    Example graph files are provided in the `/backend/HamToSAT/graphs/` directory.

## To run the WebApp Locally

```
    cd frontend
    yarn dev
```

To run backend

```
    cd backend
    fastapi dev main.py
```
