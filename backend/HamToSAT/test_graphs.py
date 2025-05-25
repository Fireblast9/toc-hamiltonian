import networkx as nx
from generategraph import graph_to_string_format
from opt import HamSAT


if __name__ == '__main__':
    # Example graphs
    graphs = {
        "Cycle Graph (C5)": nx.cycle_graph(5),
        "Complete Graph (K4)": nx.complete_graph(4),
        "Path Graph (P6)": nx.path_graph(6),
        "Random Sparse Graph (10 nodes, p=0.2)": nx.erdos_renyi_graph(10, 0.2, seed=42),
        "Random Dense Graph (8 nodes, p=0.7)": nx.erdos_renyi_graph(8, 0.7, seed=42),
        "Barbell Graph": nx.barbell_graph(4, 1),
        "Petersen Graph": nx.petersen_graph()
    }

    for name, G in graphs.items():
        print(f"\n{name}:\n", graph_to_string_format(G))
        # Check if the graph is Hamiltonian
        # is_hamiltonian = HamSAT(graph_to_string_format(G))
        # print(f"{name} is Hamiltonian: {is_hamiltonian}")