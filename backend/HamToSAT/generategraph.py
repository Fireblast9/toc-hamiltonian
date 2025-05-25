import networkx as nx

def graph_to_string_format(G):
    """Converts a networkx graph to your program's string input format."""
    n_vertices = G.number_of_nodes()
    n_edges = G.number_of_edges()
    # Assuming nodes are 0-indexed integers after relabeling
    if not all(isinstance(node, int) for node in G.nodes()) or \
       min(G.nodes()) != 0 or max(G.nodes()) != n_vertices -1:
        G = nx.convert_node_labels_to_integers(G, first_label=0, ordering="default")

    lines = [f"{n_vertices} {n_edges}"]
    for u, v in G.edges():
        lines.append(f"{u} {v}")
    return "\n".join(lines)

# --- Example Generators ---

# Cycle graph C_n
G_cycle = nx.cycle_graph(5)
print("Cycle Graph (C5):\n", graph_to_string_format(G_cycle))
# NetworkX also has nx.is_hamiltonian(G_cycle) to check!

# Complete graph K_n
G_complete = nx.complete_graph(4)
print("\nComplete Graph (K4):\n", graph_to_string_format(G_complete))

# Path graph P_n
G_path = nx.path_graph(6)
print("\nPath Graph (P6):\n", graph_to_string_format(G_path))

# Random Graph (Erdos-Renyi)
# n = number of nodes, p = probability of edge creation
G_random_sparse = nx.erdos_renyi_graph(10, 0.2, seed=42)
print("\nRandom Sparse Graph (10 nodes, p=0.2):\n", graph_to_string_format(G_random_sparse))

G_random_dense = nx.erdos_renyi_graph(8, 0.7, seed=42)
print("\nRandom Dense Graph (8 nodes, p=0.7):\n", graph_to_string_format(G_random_dense))

# Barbell graph
G_barbell = nx.barbell_graph(4, 1) # Two K4s connected by a path of length 1
print("\nBarbell Graph:\n", graph_to_string_format(G_barbell))

# Petersen graph (famous for not having a Hamiltonian path but having a Hamiltonian cycle)
# Wait, Petersen graph has no Hamiltonian Cycle. It has Hamiltonian Paths.
# My mistake. It's non-Hamiltonian (no Hamiltonian Cycle).
# It DOES have Hamiltonian Paths. For example, starting from an outer vertex,
# going along the outer cycle, then to an inner star point, then along the inner star.
G_petersen = nx.petersen_graph()
# Petersen graph nodes are 0-9. Edges are (0,1),(1,2),...,(4,0) and (0,5),(1,6),...,(4,9) and (5,7),(6,8),...,(9,6)
# Relabel to be 0-indexed contiguous for the string format
G_petersen = nx.convert_node_labels_to_integers(G_petersen, first_label=0)
print("\nPetersen Graph:\n", graph_to_string_format(G_petersen))
# if nx.is_hamiltonian(G_petersen): # This checks for Hamiltonian CYCLE
#     print("Petersen IS Hamiltonian (Cycle)")
# else:
#     print("Petersen is NOT Hamiltonian (Cycle)")


# You can save these to files or pass the string directly to your HamSAT function
# with open("cycle5.txt", "w") as f:
#     f.write(graph_to_string_format(G_cycle))