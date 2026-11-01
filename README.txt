2048 — Play to Learn DSA
=======================

Overview
--------
This project is a simple 2048 game built to learn data structures and algorithms through a game. The C++ version is kept simple so the logic is easy to understand.

The project uses a 4x4 board, tile movement, merging, score tracking, and random tile placement. The goal is to make the core algorithm easy to learn without using complicated C++ patterns.

Project Structure
-----------------
- cpp/2048_engine.cpp
  Main C++ game file for the terminal version.

- README.txt
  Project guide for the C++ version.

What the C++ File Does
---------------------
The C++ file creates a console-based 2048 game. It does not affect the web app.

It includes:
- a 4x4 game board using a 2D array
- movement in four directions
- tile merging when two equal numbers meet
- score calculation
- random tile generation
- undo support using history
- a simple command-based game loop

The main idea is to keep the code simple and beginner-friendly.

Why a number appears in that position
------------------------------------
The program does not place numbers randomly without logic. It follows this process:

1. Scan the whole board and collect all empty cells.
2. Pick one empty cell randomly.
3. Decide the value using probability: 2 is chosen 90% of the time and 4 is chosen 10% of the time.
4. Print the reason in the terminal so the user can understand why that tile was added there.

This is important because it shows how randomization and array scanning work together in the game.

DSA Concepts Used
-----------------
1. 2D Array
   - Used to store the board.
   - Purpose: represent rows and columns of the game.

2. Array Compression
   - Used while moving tiles left, right, up, and down.
   - Purpose: remove empty spaces and slide values together.

3. Merge Logic
   - Used when neighboring tiles are equal.
   - Purpose: combine them and increase the score.

4. Randomization
   - Used to add a new tile after every valid move.
   - Purpose: make the game behave like real 2048.

5. Undo / History Logic
   - Used to restore the previous board state.
   - Purpose: allow the player to reverse a move.

6. Game Loop
   - Used to keep reading user input until the game ends or the user quits.
   - Purpose: manage the game flow.

Technology Stack
---------------
- C++17
- Standard C++ library
- Basic arrays, vectors, loops, and random functions

Libraries and Dependencies
--------------------------
This project does not need heavy third-party libraries.

- The C++ program uses only the standard library.
- A C++ compiler such as g++ is required.

How to Run the C++ File
-----------------------
Open Command Prompt or PowerShell and run:

Windows:
  cd "C:\Users\Nilakshi Gaikwad\Downloads\2048-DSA-PlayToLearn-Final-With-CPP\2048-DSA-PlayToLearn\cpp"
  g++ -std=c++17 -O2 -Wall -Wextra 2048_engine.cpp -o 2048.exe
  .\2048.exe

Linux / macOS:
  cd /path/to/project/cpp
  g++ -std=c++17 -O2 -Wall -Wextra 2048_engine.cpp -o 2048
  ./2048

Commands in the Game
--------------------
- U / D / L / R
  Move the board up, down, left, or right.

- greedy
  Shows the best immediate move using a greedy strategy.

- tree
  Shows the state-space tree for possible moves.

- bfs
  Explores possible states using Breadth-First Search.

- dfs
  Explores possible states using Depth-First Search.

- undo
  Go back to the previous board state.

- new
  Start a new game.

- board
  Show the current board and score.

- help
  Show all valid commands.

- quit
  Exit the game.

Time Complexity of the C++ Code
-------------------------------
The game board is fixed to 4 x 4, so each operation is effectively constant time. However, the logic still follows standard DSA thinking used in real board-based problems.

1. createEmptyBoard
   - Iterates through all 16 cells once.
   - Time Complexity: O(16) = O(1)

2. emptyCount
   - Scans the full board.
   - Time Complexity: O(16) = O(1)

3. compactAndMerge
   - Processes one row or one column.
   - In a 4-element line, the work is constant.
   - Time Complexity: O(4) = O(1)

4. moveBoard
   - Moves through all rows and columns and merges values.
   - Time Complexity: O(4 x 4) = O(1)

5. addRandomTile
   - Finds empty positions by scanning the board.
   - Time Complexity: O(16) = O(1)

6. chooseGreedyMove
   - Tries all four directions and evaluates each possible move.
   - Time Complexity: O(4 * 16) = O(1) for a fixed board size.

7. bfsExplore
   - Uses a queue and explores every reachable state up to a depth limit.
   - Time Complexity: O(V + E) in graph terms, where V is the number of states explored.

8. dfsExplore
   - Uses stack-based recursion to visit all reachable states in a branch.
   - Time Complexity: O(V) in the explored state space.

9. saveState / undo
   - Copies the board state or restores it from history.
   - Time Complexity: O(16) = O(1)

Overall:
- For this fixed-size game, each move is constant time.
- If the board were generalized to n x n, the movement and merge operations would be O(n^2).

Project Details for the C++ Code
--------------------------------
This C++ project is a simple terminal game built to demonstrate DSA concepts in a practical way.

It includes:
- a 4x4 board represented by a 2D array
- movement in all directions using row and column processing
- merge logic for equal neighboring values
- greedy move evaluation to choose the best immediate move
- state-space tree generation for legal next states
- BFS traversal using a queue to explore states level by level
- DFS traversal using a stack/recursive branch search
- score tracking
- random tile placement
- undo support using history arrays
- a command-based game loop

The purpose is educational:
- to understand how data structures are used in games
- to practice array-based logic and loops
- to see how merging and movement work in real time
- to apply greedy decision-making
- to explore state-space graphs using BFS and DFS
- to understand why left, right, up, and down are handled differently but follow the same logic

Important Note
--------------
This project is designed to be simple and easy to understand. The C++ version is a standalone terminal version of 2048 and is meant to teach the game logic clearly without using advanced C++ features.
