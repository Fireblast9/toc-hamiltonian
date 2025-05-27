#!/usr/bin/env python3

## Default executable of a SAT solver (do not change this)
defSATsolver = "z3"

## Change this to an executable SAT solver if z3 is not in your PATH or else
## Example (Linux): SATsolver="/home/user/z3-4.13/bin/z3"
## You can also include command-line options if necessary
SATsolver = defSATsolver

import os
import random
import re
import shutil
import sys
import time # To check how long the execution took
from io import StringIO  # To treat a string like a file
from subprocess import PIPE, Popen


def closed_range(start, stop, step=1):
    dir = 1 if (step > 0) else -1
    return range(start, stop + dir, step)


def varCount():
    global gVarNumberToName
    return len(gVarNumberToName) - 1


def allVarNumbers():
    return closed_range(1, varCount())


def varNumberToName(num):
    global gVarNumberToName
    return gVarNumberToName[num]


def varNameToNumber(name):
    global gVarNameToNumber
    return gVarNameToNumber[name]


def addVarName(name):
    global gVarNumberToName
    global gVarNameToNumber
    gVarNumberToName.append(name)
    gVarNameToNumber[name] = varCount()


# def printClause(clause):
#     print(map(lambda x: "%s%s" % (x < 0 and eval("'-'") or eval ("''"), varNumberToName(abs(x))) , clause))


def getVarNumber(**kwargs):
    return varNameToNumber(getVarName(**kwargs))


def getVarName(**kwargs):

    v = kwargs['vertex']
    p = kwargs['position']

    return "x_%s_%s" % (
        str(v), str(p)
    )  # Use of strings for vertex IDs in case they are not just numbers. DISCUSS!!



def genVarNames(**kwargs):
    # variables X_{v,p} for each vertex v and position p of Hamiltonian path
    vertices = kwargs[
        'vertices']  # list of veritices. !!!Asuming they are numbered from 0 to n-1!!!

    for v in vertices:
        for posision_index in range(len(vertices)):
            name = getVarName(vertex=v, position=posision_index)
            addVarName(name)


def genClauses(**kwargs):
    clauses = []

    vertices = kwargs['vertices'] # list of veritices. !!!Asuming they are numbered from 0 to n-1!!!
    edges = kwargs['edges'] # list of edges. !!!Asuming they are tuples of vertex IDs!!!
    positions = vertices # list of positions in the path

    # define the neighbors matrix
    # neighbors[i][j] = True if there is an edge between vertex i and j
    neighbors = [[False] * len(vertices) for _ in range(len(vertices))]
    for i in range(len(vertices)):
        for j in range(len(vertices)):
            #neighbors[i][j] = False
            if (i, j) in edges:
                neighbors[i][j] = True
                neighbors[j][i] = True

    # 1. Every vertex must be in at least one position in the path
    for v in vertices:
        clauses.append([getVarNumber(vertex=v, position=p) for p in positions])

    # 2. Every position in the path must have at least one vertex
    for p in positions:
        clauses.append([getVarNumber(vertex=v, position=p) for v in vertices])

    # 3. Every position in the path must have at most one vertex
    for p in positions:
        for v1 in vertices:
            for v2 in vertices:
                if v1 != v2:
                    clauses.append([
                        -getVarNumber(vertex=v1, position=p),
                        -getVarNumber(vertex=v2, position=p)
                    ])

    # 4. Every vertex must be in at most one position in the path
    for v in vertices:
        for p1 in positions:
            for p2 in positions:
                if p1 != p2:
                    clauses.append([
                        -getVarNumber(vertex=v, position=p1),
                        -getVarNumber(vertex=v, position=p2)
                    ])

    # 5. for each two consecutive positions in the path, there must be an edge between the vertices in those positions
    for p in range(len(positions) - 1):
        for v1 in vertices:
            for v2 in vertices:
                if v1 != v2 and not neighbors[v1][v2]:
                    clauses.append([
                        -getVarNumber(vertex=v1, position=p),
                        -getVarNumber(vertex=v2, position=p + 1)
                    ])

    return clauses


## A helper function to print the cnf header (do not modify)
def getDimacsHeader(clauses):
    cnt = varCount()
    n = len(clauses)
    str = ""
    for num in allVarNumbers():
        varName = varNumberToName(num)
        str += "c %d ~ %s\n" % (num, varName)
    for cl in clauses:
        print("c ", end='')
        for l in cl:
            print(("!" if (l < 0) else " ") + varNumberToName(abs(l)),
                  "",
                  end='')
        print("")
    print("")
    str += "p cnf %d %d" % (cnt, n)
    return str


## A helper function to print a set of clauses in CNF (do not modify)
def toDimacsCnf(clauses):
    return "\n".join(map(lambda x: "%s 0" % " ".join(map(str, x)), clauses))


## A helper function to print only the satisfied variables in human-readable format (do not modify)
def printResult(res):
    print(res)
    res = res.strip().split('\n')

    # If it was satisfiable, we want to have the assignment printed out
    if res[0] != "s SATISFIABLE":
        return

    # First get the assignment, which is on the second line of the file, and split it on spaces
    # Read the solution
    asgn = map(int, res[1].split()[1:])
    # Then get the variables that are positive, and get their names.
    # This way we know that everything not printed is false.
    # The last element in asgn is the trailing zero and we can ignore it

    # Convert the solution to our names
    facts = map(lambda x: varNumberToName(abs(x)),
                filter(lambda x: x > 0, asgn))

    # Print the solution
    print("c SOLUTION:")
    for f in facts:
        print("c", f)


def getHamPath(res, n_vertices):
    """decodes the result from the SAT solver and returns the Hamiltonian path if it exists"""
    res = res.strip().split('\n')

    # If it was satisfiable, we want to have the assignment printed out
    if res[0] != "s SATISFIABLE":
        return
    # First get the assignment, which is on the second line of the file, and split it on spaces
    # Read the solution
    asgn = map(int, res[1].split()[1:])
    # Then get the variables that are positive, and get their names.

    # get the variable number of the true variables and convert to 0-based index
    variable_number = map(lambda x: abs(x) - 1, filter(lambda x: x > 0, asgn))

    # Initialize a list to store the path
    default_value = -1
    path = [default_value for _ in range(n_vertices)]

    counter = 0

    # Iterate over the variable numbers and assign them to the path
    for var in variable_number:
        counter += 1 # count the number of true variables
        v_idx = var // n_vertices
        p_idx = var % n_vertices
        if path[p_idx] == default_value:
            # If the position is not already assigned, assign the vertex to the path
            path[p_idx] = v_idx
        else:
            # If the position is already assigned, something went wrong
            print("Error: multiple vertices assigned to the same position in the path.")
            return

    # check that the number of true variables is equal to the number of vertices
    if counter != n_vertices:
        print("Error: number of true variables is not equal to the number of vertices.")
        return

    # Print the Hamiltonian Path
    print("c HAMILTONIAN PATH:")
    print(path)
    return path

def getGraphData(input_graph_string):
    """ Helper function to read the input graph from a string """
    graph_as_file = StringIO(input_graph_string) # treat the string as a file
    first_line = graph_as_file.readline().strip().split()# strip() removes whiteline characters and end of line at the beginning and end of the string
    n_vertices = int(first_line[0]) # number of vertices
    n_edges = int(first_line[1]) # number of edges

    vertices = []
    edges = []
    for i in range (n_vertices):
        # First vertex is '0'
        vertices.append(i)

    for _ in range(n_edges):
        line = graph_as_file.readline().strip().split()
        v1 = int(line[0])
        v2 = int(line[1])
        edges.append((v1,v2))

    return vertices, edges, n_vertices, n_edges

#------------------------------------This function runs the SAT solver for the given graph-----------------------------------------------
def HamSAT(input_graph_string):
    """ Main function to run the SAT solver """

    global gVarNumberToName, gVarNameToNumber
    gVarNumberToName = ["invalid"]
    gVarNameToNumber = {}

    path = shutil.which(SATsolver.split()[0])
    if path is None:
        if SATsolver == defSATsolver:
            print("Set the path to a SAT solver via SATsolver variable on line 9 of this file (%s)" % sys.argv[0])
        else:
            print("Path '%s' does not exist or is not executable." % SATsolver)
        sys.exit(1)

    kwargs = {}

    # read the input graph
    vertices, edges, n_vertices, n_edges = getGraphData(input_graph_string)

    #check for edge cases
    if n_edges == 0:
        print("c No edges in the graph, no Hamiltonian path exists.")
        return [-1 for _ in range(n_vertices)]

    kwargs['vertices'] = vertices
    kwargs['edges'] = edges

    start = time.time() # Start recording the time

    genVarNames(**kwargs)
    clauses = genClauses(**kwargs)

    head = getDimacsHeader(clauses)
    cnf = toDimacsCnf(clauses)

    # Here we create a temporary cnf file for SATsolver
    fl = open("tmp_prob.cnf", "w")
    fl.write("\n".join([head, cnf]) + "\n")
    fl.close()

    # Run the SATsolver
    # Use with linux
    #solverOutput = Popen([SATsolver + " tmp_prob.cnf"], stdout=PIPE, shell=True).communicate()[0]
    # Use with windows
    solverOutput = Popen([SATsolver, "tmp_prob.cnf"], stdout=PIPE).communicate()[0]

    res = solverOutput.decode('utf-8')
    end = time.time() # End recording the time
    total_time = end - start # Calculate the total time taken

    printResult(res) # Print the SAT result in human-readable format

    hamiltonian_path = [-1 for _ in range(n_vertices)] # Initialize the Hamiltonian path with -1
    hamiltonian_path = getHamPath(res, n_vertices) # Get the Hamiltonian path from the result

    print(f"It took {total_time:.4f} seconds to run the SAT solver.")
    
    # Remove the temporary file
    if os.path.exists("tmp_prob.cnf"):
        os.remove("tmp_prob.cnf")

    return hamiltonian_path
#---------------------------------------------------------------------------------------------------------------------------------------



## This function is invoked when the python script is run directly and not imported
if __name__ == '__main__':

    if len(sys.argv) != 2:
        print("no input given, using default input file\n")

    input_file = sys.argv[1] if len(sys.argv) > 1 else 'graphs/cyclegraph.txt'

    with open(input_file, 'r') as file:
        file_content = file.read()
    HamSAT(file_content)