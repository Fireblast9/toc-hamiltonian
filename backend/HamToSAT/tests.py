import time
import os
import importlib.util
import random
import signal # For timeout
import contextlib # For timeout context manager
import matplotlib.pyplot as plt
import numpy as np

# --- Configuration ---
OPTIMISED_MODULE_NAME = "optimized"
CONVERTER_MODULE_NAME = "converter"
OUTPUT_LATEX_FILE = "stress_test_results.tex"
DEFAULT_TIMEOUT_SECONDS = 10  # Timeout for each HamSAT call on a single graph

def plot_time_comparison(results):
    graph_names = [res['name'] for res in results]
    opt_times = []
    conv_times = []

    for res in results:
        # Handle "Timeout", "Error", "N/A" as a large number or skip
        opt_t = res.get('time_optimised')
        conv_t = res.get('time_converter')

        if isinstance(opt_t, float):
            opt_times.append(opt_t)
        else:
            opt_times.append(DEFAULT_TIMEOUT_SECONDS * 1.2) # Plot timeouts high

        if isinstance(conv_t, float):
            conv_times.append(conv_t)
        else:
            conv_times.append(DEFAULT_TIMEOUT_SECONDS * 1.2) # Plot timeouts high
            
    if not graph_names:
        print("No data to plot.")
        return

    x = np.arange(len(graph_names))  # the label locations
    width = 0.35  # the width of the bars

    fig, ax = plt.subplots(figsize=(max(10, len(graph_names) * 0.5), 6)) # Dynamic width
    rects1 = ax.bar(x - width/2, opt_times, width, label=OPTIMISED_MODULE_NAME)
    rects2 = ax.bar(x + width/2, conv_times, width, label=CONVERTER_MODULE_NAME)

    ax.set_ylabel('Execution Time (s)')
    ax.set_title('Execution Time Comparison by Graph')
    ax.set_xticks(x)
    ax.set_xticklabels(graph_names, rotation=45, ha="right")
    ax.legend()

    # Optional: Add a line for timeout
    ax.axhline(y=DEFAULT_TIMEOUT_SECONDS, color='r', linestyle='--', label=f'Timeout ({DEFAULT_TIMEOUT_SECONDS}s)')
    ax.legend() # Call legend again to include the new line

    fig.tight_layout()
    plt.savefig('time_comparison_chart.png')
    print("\nTime comparison chart saved to time_comparison_chart.png")
    # plt.show() # Uncomment to display interactively


# --- Helper to import scripts ---
def import_script_with_custom_name(script_name_without_py, desired_module_name):
    file_path = f"./{script_name_without_py}.py"
    if not os.path.exists(file_path):
        print(f"Error: Script '{file_path}' not found.")
        return None
    spec = importlib.util.spec_from_file_location(desired_module_name, file_path)
    if spec is None or spec.loader is None: return None
    module = importlib.util.module_from_spec(spec)
    try:
        spec.loader.exec_module(module)
        print(f"Successfully imported '{script_name_without_py}.py' as '{desired_module_name}'.")
        return module
    except Exception as e:
        print(f"Error importing module '{desired_module_name}' from '{file_path}': {e}")
        return None

# --- Timeout Handler (Unix-like systems: Linux, macOS) ---
class TimeoutException(Exception): pass

@contextlib.contextmanager
def time_limit(seconds):
    def signal_handler(signum, frame):
        raise TimeoutException("Timed out!")
    
    # SIGALRM is not available on Windows
    if os.name == 'nt':
        try:
            yield # On Windows, just run without timeout
        finally:
            pass # No alarm to disable or handler to restore
        return

    old_handler = signal.signal(signal.SIGALRM, signal_handler)
    signal.alarm(seconds)
    try:
        yield
    finally:
        signal.alarm(0) # Disable the alarm
        signal.signal(signal.SIGALRM, old_handler) # Restore original handler


IS_WINDOWS = os.name == 'nt'
if IS_WINDOWS:
    print("Warning: SIGALRM-based timeout is not available on Windows. Tests will run without a hard time limit for individual HamSAT calls.")

# --- Test Graph Generation ---
def generate_graph_string(num_vertices, edges_list):
    header = f"{num_vertices} {len(edges_list)}\n"
    edge_lines = "\n".join([f"{u} {v}" for u, v in edges_list])
    return header + edge_lines

def generate_random_graph(num_vertices, edge_probability):
    """Generates a random Erdos-Renyi graph."""
    edges = []
    for i in range(num_vertices):
        for j in range(i + 1, num_vertices):
            if random.random() < edge_probability:
                edges.append((i, j))
    return generate_graph_string(num_vertices, edges)

def generate_path_graph_string(num_vertices):
    if num_vertices == 0: return "0 0\n"
    if num_vertices == 1: return "1 0\n"
    edges = [(i, i + 1) for i in range(num_vertices - 1)]
    return generate_graph_string(num_vertices, edges)

def generate_cycle_graph_string(num_vertices):
    if num_vertices < 3: return generate_path_graph_string(num_vertices)
    edges = [(i, (i + 1) % num_vertices) for i in range(num_vertices)]
    return generate_graph_string(num_vertices, edges)

def generate_complete_graph_string(num_vertices):
    edges = []
    for i in range(num_vertices):
        for j in range(i + 1, num_vertices):
            edges.append((i,j))
    return generate_graph_string(num_vertices, edges)


# --- Predefined and Generated Test Graphs ---
test_graphs = {
    "Single_Vertex": generate_graph_string(1, []),
    "Path_P5": generate_path_graph_string(5),
    "Cycle_C5": generate_cycle_graph_string(5),
    "Complete_K5": generate_complete_graph_string(5),
    "Disconnected_C3_P1": generate_graph_string(4, [(0,1),(1,2),(2,0)]),
    "Petersen_Graph": generate_graph_string(10, [
        (0,1),(1,2),(2,3),(3,4),(4,0), (0,5),(1,6),(2,7),(3,8),(4,9),
        (5,7),(7,9),(9,6),(6,8),(8,5)
    ]),
}

for n in [10, 15, 20, 25, 30]:
    test_graphs[f"Path_P{n}"] = generate_path_graph_string(n)
for n in [10, 15, 20, 25, 30]:
    test_graphs[f"Cycle_C{n}"] = generate_cycle_graph_string(n)
for n in [6, 7, 8, 9, 10, 11]: # K11 might be very slow
    test_graphs[f"Complete_K{n}"] = generate_complete_graph_string(n)
for n in [15, 20, 25, 30, 35]:
    test_graphs[f"Random_Sparse_V{n}_P0.2"] = generate_random_graph(n, 0.2)
for n in [15, 18, 20, 22, 25]:
    test_graphs[f"Random_Dense_V{n}_P0.5"] = generate_random_graph(n, 0.5)


# --- LaTeX Output Generation ---
def format_path_for_latex(path_result):
    if path_result is None: return "None (UNSAT/Error)"
    if isinstance(path_result, str) and ("Error" in path_result or "Timeout" in path_result or "Not Run" in path_result):
        return escape_latex(path_result)
    if isinstance(path_result, list):
        if not path_result or -1 in path_result:
            return "UNSAT / Incomplete"
        return escape_latex(" -> ".join(map(str, path_result)))
    return escape_latex(str(path_result))

def escape_latex(text):
    if text is None: return "None"
    text = str(text)
    chars = { '&': r'\&', '%': r'\%', '$': r'\$', '#': r'\#', '_': r'\_',
              '{': r'\{', '}': r'\}', '~': r'\textasciitilde{}', '^': r'\textasciicircum{}',
              '\\': r'\textbackslash{}', '<': r'\textless{}', '>': r'\textgreater{}'}
    return "".join([chars.get(c, c) for c in text])

def generate_latex_table(results):
    latex_string = "\\documentclass[8pt]{article}\n"
    latex_string += "\\usepackage[a4paper, landscape, margin=0.5in]{geometry}\n"
    latex_string += "\\usepackage{longtable}\n"
    latex_string += "\\usepackage{array}\n"
    latex_string += "\\usepackage{booktabs}\n"
    latex_string += "\\usepackage{graphicx}\n"
    latex_string += "\\newcommand*\\rot{\\rotatebox{90}}\n"
    latex_string += "\\title{Hamiltonian Path Solver Stress Test Comparison}\n"
    latex_string += "\\author{Automated Test Script}\n"
    latex_string += "\\date{\\today}\n"
    latex_string += "\\begin{document}\n"
    latex_string += "\\maketitle\n\\parindent=0pt\n\n"
    latex_string += "\\section*{Test Results}\n\n"
    latex_string += "\\newcolumntype{L}[1]{>{\\raggedright\\arraybackslash}p{#1}}\n\n"
    latex_string += "\\LTcapsep=1ex\n"

    latex_string += "\\begin{longtable}{@{}L{3.2cm} c c L{4cm} L{1.2cm} L{4cm} L{1.2cm}@{}}\n" # Adjusted column widths
    latex_string += "\\toprule\n"
    latex_string += "\\textbf{Graph Name} & \\textbf{V} & \\textbf{E} & \\textbf{Optimised Path} & \\rot{\\textbf{Time (s)}} & \\textbf{Converter Path} & \\rot{\\textbf{Time (s)}} \\\\\n"
    latex_string += "\\midrule\n"
    latex_string += "\\endfirsthead\n"
    latex_string += "\\toprule\n"
    latex_string += "\\textbf{Graph Name} & \\textbf{V} & \\textbf{E} & \\textbf{Optimised Path} & \\rot{\\textbf{Time (s)}} & \\textbf{Converter Path} & \\rot{\\textbf{Time (s)}} \\\\\n"
    latex_string += "\\midrule\n"
    latex_string += "\\endhead\n"
    latex_string += "\\midrule\n"
    latex_string += "\\multicolumn{7}{r@{}}{{Continued on next page}} \\\\\n"
    latex_string += "\\midrule\n"
    latex_string += "\\endfoot\n"
    latex_string += "\\bottomrule\n"
    latex_string += "\\endlastfoot\n"

    for res in results:
        name_tex = escape_latex(res["name"])
        opt_path_tex = format_path_for_latex(res["optimised_path"])
        conv_path_tex = format_path_for_latex(res["converter_path"])
        
        opt_time_str = f"{res['time_optimised']:.3f}" if isinstance(res['time_optimised'], float) else escape_latex(res['time_optimised'])
        conv_time_str = f"{res['time_converter']:.3f}" if isinstance(res['time_converter'], float) else escape_latex(res['time_converter'])

        latex_string += (f"{name_tex} & {res['vertices']} & {res['edges']} & "
                         f"{opt_path_tex} & {opt_time_str} & "
                         f"{conv_path_tex} & {conv_time_str} \\\\\n")
        latex_string += "\\midrule\n"

    latex_string += "\\end{longtable}\n"
    latex_string += "\\end{document}\n"
    return latex_string

# --- Main Test Execution ---
if __name__ == "__main__":
    print(f"Attempting to import SAT solver from: {OPTIMISED_MODULE_NAME}.py")
    optimised_module = import_script_with_custom_name(OPTIMISED_MODULE_NAME, "optimised_solver_module")
    
    print(f"Attempting to import SAT solver from: {CONVERTER_MODULE_NAME}.py") # << COMMENT OUT
    converter_module = import_script_with_custom_name(CONVERTER_MODULE_NAME, "converter_solver_module") # << COMMENT OUT

    modules_to_test_config = []
    if optimised_module and hasattr(optimised_module, 'HamSAT'):
        modules_to_test_config.append({
            "display_name": OPTIMISED_MODULE_NAME, 
            "module_obj": optimised_module, 
            "path_key": "optimised_path", 
            "time_key": "time_optimised"
        })
    else:
        print(f"Warning: Could not load/use HamSAT from {OPTIMISED_MODULE_NAME}.py.")

    if converter_module and hasattr(converter_module, 'HamSAT'): # << COMMENT OUT
        modules_to_test_config.append({ # << COMMENT OUT
            "display_name": CONVERTER_MODULE_NAME,  # << COMMENT OUT
            "module_obj": converter_module,  # << COMMENT OUT
            "path_key": "converter_path",  # << COMMENT OUT
            "time_key": "time_converter" # << COMMENT OUT
        }) # << COMMENT OUT
    else: # << COMMENT OUT
        print(f"Warning: Could not load/use HamSAT from {CONVERTER_MODULE_NAME}.py.") # << COMMENT OUT

    if not modules_to_test_config:
        print("No valid HamSAT modules found to test. Exiting.")
        exit(1)
    
    results_data = []
    overall_start_time = time.time()

    print("\n--- Starting Stress Comparison Tests ---")
    for graph_name, graph_str_data in test_graphs.items():
        print(f"\nTesting graph: {graph_name}")
        
        try:
            first_line = graph_str_data.split('\n', 1)[0].split()
            n_verts = int(first_line[0])
            m_edges = int(first_line[1])
        except (IndexError, ValueError) as e:
            print(f"  Error parsing N, M for graph {graph_name}: {e}. Skipping.")
            results_data.append({
                "name": graph_name, "vertices": "N/A", "edges": "N/A",
                "optimised_path": "Parse Error", "time_optimised": "N/A",
                "converter_path": "Parse Error", "time_converter": "N/A",
            })
            continue

        current_run_result = {
            "name": graph_name, "vertices": n_verts, "edges": m_edges,
            "optimised_path": "Not Run", "time_optimised": "N/A",
            "converter_path": "Not Run", "time_converter": "N/A",
        }

        for test_config in modules_to_test_config: 
            module_display_name = test_config["display_name"] 
            module_obj = test_config["module_obj"]
            path_key = test_config["path_key"]
            time_key = test_config["time_key"]
            
            print(f"  Running HamSAT from {module_display_name}.py...")
            path_result_for_module = None
            time_taken_for_module = "N/A" 
            
            try:
                if hasattr(module_obj, 'gVarNumberToName'): module_obj.gVarNumberToName = ["invalid"]
                if hasattr(module_obj, 'gVarNameToNumber'): module_obj.gVarNameToNumber = {}
                
                start_t = time.time()
                # Timeout logic remains, wrapped by the check for IS_WINDOWS
                if not IS_WINDOWS:
                    with time_limit(DEFAULT_TIMEOUT_SECONDS):
                        path_result_for_module = module_obj.HamSAT(graph_str_data)
                else:
                    path_result_for_module = module_obj.HamSAT(graph_str_data)
                
                end_t = time.time()
                time_taken_for_module = end_t - start_t
                
                status_msg = "Path found" if path_result_for_module and (not isinstance(path_result_for_module, list) or -1 not in path_result_for_module) else "No path/Error"
                time_str = f"{time_taken_for_module:.3f}s" if isinstance(time_taken_for_module, float) else str(time_taken_for_module)
                print(f"    {module_display_name} Result: {status_msg} -> {path_result_for_module if path_result_for_module else ''} (Time: {time_str})")

            except TimeoutException:
                time_taken_for_module = "Timeout"
                path_result_for_module = "Timeout"
                print(f"    {module_display_name} Result: TIMEOUT after {DEFAULT_TIMEOUT_SECONDS}s")
            except Exception as e:
                time_taken_for_module = "Error"
                path_result_for_module = f"Runtime Err: {type(e).__name__}" # More specific error
                print(f"    Error running {module_display_name} HamSAT for {graph_name}: {e}")
            
            current_run_result[path_key] = path_result_for_module
            current_run_result[time_key] = time_taken_for_module
            
        results_data.append(current_run_result)

    overall_end_time = time.time()
    print(f"\n--- All tests completed in {overall_end_time - overall_start_time:.4f} seconds ---")

    latex_content = generate_latex_table(results_data)
    plot_time_comparison(results_data) # Call the plotting function
    try:
        with open(OUTPUT_LATEX_FILE, "w") as f:
            f.write(latex_content)
        print(f"\nLaTeX results saved to {OUTPUT_LATEX_FILE}")
        print(f"To compile: pdflatex {OUTPUT_LATEX_FILE} (may need to run twice for table layout)")
    except IOError as e:
        print(f"Error writing LaTeX file: {e}")