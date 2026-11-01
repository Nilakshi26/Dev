#include <iostream>
#include <queue>
#include <stack>
#include <string>
#include <vector>
#include <cstdlib>
#include <ctime>

using namespace std;

// DSA concept used: 2D Array / Matrix
// The board is represented as a fixed-size 2D array of 4 rows and 4 columns.
const int SIZE = 4;
const int MAX_HISTORY = 50;
const int MAX_TREE_DEPTH = 2;

struct BoardState {
    int board[SIZE][SIZE];
    string path;
};

// DSA concept used: Array Initialization
// Creates a fresh empty board with all cells set to 0.
void createEmptyBoard(int board[SIZE][SIZE]) {
    for (int row = 0; row < SIZE; row++) {
        for (int col = 0; col < SIZE; col++) {
            board[row][col] = 0;
        }
    }
}

// DSA concept used: Copying / State Storage
// Copies one board into another board.
void copyBoard(const int source[SIZE][SIZE], int destination[SIZE][SIZE]) {
    for (int row = 0; row < SIZE; row++) {
        for (int col = 0; col < SIZE; col++) {
            destination[row][col] = source[row][col];
        }
    }
}

// DSA concept used: Iteration / Traversal
// Displays the current board in a readable terminal format.
void printBoard(const int board[SIZE][SIZE]) {
    cout << "\n+------+------+------+------+\n";
    for (int row = 0; row < SIZE; row++) {
        cout << "|";
        for (int col = 0; col < SIZE; col++) {
            if (board[row][col] == 0) {
                cout << "      |";
            } else {
                cout << "  " << board[row][col] << "  |";
            }
        }
        cout << "\n+------+------+------+------+\n";
    }
}

// DSA concept used: Array Scan / Counting
// Counts how many cells are empty on the board.
int emptyCount(const int board[SIZE][SIZE]) {
    int count = 0;
    for (int row = 0; row < SIZE; row++) {
        for (int col = 0; col < SIZE; col++) {
            if (board[row][col] == 0) {
                count++;
            }
        }
    }
    return count;
}

// DSA concept used: Array Manipulation + Merge Logic
// Removes zeros from a line, merges equal neighbors, and adds merged score.
vector<int> compactAndMerge(vector<int> values, int& gained) {
    vector<int> result;
    int i = 0;

    while (i < (int)values.size()) {
        if (i + 1 < (int)values.size() && values[i] == values[i + 1]) {
            int merged = values[i] * 2;
            result.push_back(merged);
            gained += merged;
            i += 2;
        } else {
            result.push_back(values[i]);
            i++;
        }
    }

    while ((int)result.size() < SIZE) {
        result.push_back(0);
    }

    return result;
}

// DSA concept used: Row/Column Processing
// This is the real reason we move left/right/up/down:
// each move is just a row or column processed in a different order.
// Left: read row left to right
// Right: read row right to left
// Up: read column top to bottom
// Down: read column bottom to top
void moveBoard(const int source[SIZE][SIZE], char direction, int result[SIZE][SIZE], int& gained) {
    copyBoard(source, result);
    gained = 0;

    for (int index = 0; index < SIZE; index++) {
        vector<int> line;

        if (direction == 'L') {
            for (int col = 0; col < SIZE; col++) {
                line.push_back(source[index][col]);
            }
        } else if (direction == 'R') {
            for (int col = SIZE - 1; col >= 0; col--) {
                line.push_back(source[index][col]);
            }
        } else if (direction == 'U') {
            for (int row = 0; row < SIZE; row++) {
                line.push_back(source[row][index]);
            }
        } else if (direction == 'D') {
            for (int row = SIZE - 1; row >= 0; row--) {
                line.push_back(source[row][index]);
            }
        }

        vector<int> merged = compactAndMerge(line, gained);

        if (direction == 'L') {
            for (int col = 0; col < SIZE; col++) {
                result[index][col] = merged[col];
            }
        } else if (direction == 'R') {
            for (int col = 0; col < SIZE; col++) {
                result[index][SIZE - 1 - col] = merged[col];
            }
        } else if (direction == 'U') {
            for (int row = 0; row < SIZE; row++) {
                result[row][index] = merged[row];
            }
        } else if (direction == 'D') {
            for (int row = 0; row < SIZE; row++) {
                result[SIZE - 1 - row][index] = merged[row];
            }
        }
    }
}

// DSA concept used: Comparison / Equality Check
bool isSameBoard(const int a[SIZE][SIZE], const int b[SIZE][SIZE]) {
    for (int row = 0; row < SIZE; row++) {
        for (int col = 0; col < SIZE; col++) {
            if (a[row][col] != b[row][col]) {
                return false;
            }
        }
    }
    return true;
}

// DSA concept used: Randomization + Array Search
// This function explains why a number is added in a particular place:
// 1. scan the whole board to find all empty cells
// 2. choose one empty cell randomly
// 3. assign a new tile value: 2 with 90% chance, 4 with 10% chance
bool addRandomTile(int board[SIZE][SIZE], bool showReason = true) {
    vector<pair<int, int>> emptyCells;

    for (int row = 0; row < SIZE; row++) {
        for (int col = 0; col < SIZE; col++) {
            if (board[row][col] == 0) {
                emptyCells.push_back({row, col});
            }
        }
    }

    if (emptyCells.empty()) {
        return false;
    }

    int pos = rand() % emptyCells.size();
    int row = emptyCells[pos].first;
    int col = emptyCells[pos].second;
    int value = (rand() % 10 < 9) ? 2 : 4;
    board[row][col] = value;

    if (showReason) {
        cout << "Random tile rule: scanned all empty cells, picked row " << (row + 1)
             << ", col " << (col + 1) << ", and inserted " << value
             << " because empty cells are selected randomly and 2 is more likely than 4.\n";
    }

    return true;
}

// DSA concept used: Greedy Algorithm
// For each legal move, simulate the board and choose the move with the best immediate value.
int heuristicValue(const int board[SIZE][SIZE]) {
    int score = 0;
    int empties = 0;
    int largest = 0;

    for (int row = 0; row < SIZE; row++) {
        for (int col = 0; col < SIZE; col++) {
            if (board[row][col] == 0) {
                empties++;
            } else {
                score += board[row][col];
                if (board[row][col] > largest) {
                    largest = board[row][col];
                }
            }
        }
    }

    return score + empties * 10 + largest * 5;
}

bool isLegalMove(const int board[SIZE][SIZE], char direction) {
    int next[SIZE][SIZE];
    int gained = 0;
    moveBoard(board, direction, next, gained);
    return !isSameBoard(board, next);
}

char chooseGreedyMove(const int board[SIZE][SIZE]) {
    char directions[] = {'L', 'R', 'U', 'D'};
    char bestDir = 'L';
    int bestScore = -999999;

    for (int i = 0; i < 4; i++) {
        char dir = directions[i];
        if (!isLegalMove(board, dir)) {
            continue;
        }

        int next[SIZE][SIZE];
        int gained = 0;
        moveBoard(board, dir, next, gained);

        int score = heuristicValue(next) + gained * 20;
        if (score > bestScore) {
            bestScore = score;
            bestDir = dir;
        }
    }

    return bestDir;
}

// DSA concept used: State Space Tree
// A tree node represents a board state and the move that leads to it.
void showStateTree(const int board[SIZE][SIZE]) {
    cout << "\nState Space Tree (current board -> legal moves -> next states)\n";
    cout << "----------------------------------------------------------\n";

    char directions[] = {'L', 'R', 'U', 'D'};
    for (int i = 0; i < 4; i++) {
        char dir = directions[i];
        if (!isLegalMove(board, dir)) {
            continue;
        }

        int next[SIZE][SIZE];
        int gained = 0;
        moveBoard(board, dir, next, gained);

        cout << "Move " << dir << " => gains " << gained << " points\n";
        printBoard(next);
    }
}

// DSA concept used: BFS (Queue)
// Breadth-First Search explores states level by level.
void bfsExplore(const int startBoard[SIZE][SIZE], int maxDepth) {
    queue<BoardState> q;
    BoardState root;
    copyBoard(startBoard, root.board);
    root.path = "ROOT";
    q.push(root);

    cout << "\nBFS path exploration (level by level)\n";
    cout << "------------------------------------\n";

    while (!q.empty()) {
        BoardState current = q.front();
        q.pop();

        cout << "Current path: " << current.path << "\n";
        if (current.path.size() / 2 >= maxDepth) {
            continue;
        }

        bool foundChild = false;
        char directions[] = {'L', 'R', 'U', 'D'};
        for (int i = 0; i < 4; i++) {
            char dir = directions[i];
            if (!isLegalMove(current.board, dir)) {
                continue;
            }

            int next[SIZE][SIZE];
            int gained = 0;
            moveBoard(current.board, dir, next, gained);
            BoardState child;
            copyBoard(next, child.board);
            child.path = current.path + " -> " + dir;
            q.push(child);
            cout << "  " << dir << " leads to: " << child.path << "\n";
            foundChild = true;
        }

        if (!foundChild) {
            cout << "  No legal next states from this path.\n";
        }
    }
}

// DSA concept used: DFS (Stack / Recursion)
// Depth-First Search explores a branch deeply before going back.
void dfsExplore(const int board[SIZE][SIZE], int depth, string path) {
    if (depth == 0) {
        cout << "Path: " << path << "\n";
        return;
    }

    bool found = false;
    char directions[] = {'L', 'R', 'U', 'D'};
    for (int i = 0; i < 4; i++) {
        char dir = directions[i];
        if (!isLegalMove(board, dir)) {
            continue;
        }

        int next[SIZE][SIZE];
        int gained = 0;
        moveBoard(board, dir, next, gained);

        found = true;
        dfsExplore(next, depth - 1, path + dir + " -> ");
    }

    if (!found) {
        cout << "Path: " << path << "(leaf)\n";
    }
}

// DSA concept used: Object-Oriented State Management
class Game {
private:
    int board[SIZE][SIZE];
    int score;
    int moves;
    int history[MAX_HISTORY][SIZE][SIZE];
    int historyScores[MAX_HISTORY];
    int historyMoves[MAX_HISTORY];
    int historyCount;

public:
    Game() {
        score = 0;
        moves = 0;
        historyCount = 0;
        createEmptyBoard(board);
        addRandomTile(board);
        addRandomTile(board);
    }

    // DSA concept used: Stack / LIFO History
    void saveState() {
        if (historyCount >= MAX_HISTORY) {
            for (int i = 1; i < MAX_HISTORY; i++) {
                copyBoard(history[i], history[i - 1]);
                historyScores[i - 1] = historyScores[i];
                historyMoves[i - 1] = historyMoves[i];
            }
            historyCount = MAX_HISTORY - 1;
        }

        copyBoard(board, history[historyCount]);
        historyScores[historyCount] = score;
        historyMoves[historyCount] = moves;
        historyCount++;
    }

    void showBoard() const {
        printBoard(board);
        cout << "Score: " << score << " | Moves: " << moves
             << " | Empty cells: " << emptyCount(board) << "\n";
    }

    // DSA concept used: Greedy Move Evaluation + Board Update
    bool move(char direction) {
        int next[SIZE][SIZE];
        int gained = 0;
        moveBoard(board, direction, next, gained);

        if (isSameBoard(board, next)) {
            cout << "No move possible in that direction.\n";
            cout << "Reason: after processing this row/column, the board remained unchanged, so there was no empty cell to slide into and no equal adjacent tiles to merge.\n";
            return false;
        }

        saveState();
        copyBoard(next, board);
        score += gained;
        moves++;
        addRandomTile(board);
        showBoard();
        return true;
    }

    // DSA concept used: Backtracking / Undo using Stack
    void undo() {
        if (historyCount == 0) {
            cout << "Nothing to undo.\n";
            return;
        }

        historyCount--;
        copyBoard(history[historyCount], board);
        score = historyScores[historyCount];
        moves = historyMoves[historyCount];
        cout << "Undo complete.\n";
        showBoard();
    }

    void newGame() {
        score = 0;
        moves = 0;
        historyCount = 0;
        createEmptyBoard(board);
        addRandomTile(board);
        addRandomTile(board);
        showBoard();
    }

    void explainDirections() const {
        cout << "\nWhy do we move left, right, up, and down?\n";
        cout << "Because all moves are just row/column processing:\n";
        cout << "- Left: compress row from left to right\n";
        cout << "- Right: reverse row, compress, then restore order\n";
        cout << "- Up: compress each column from top to bottom\n";
        cout << "- Down: reverse column, compress, then restore order\n";
    }

    void showGreedyMove() {
        char dir = chooseGreedyMove(board);
        cout << "\nGreedy move suggestion: " << dir << "\n";
        int next[SIZE][SIZE];
        int gained = 0;
        moveBoard(board, dir, next, gained);
        cout << "This move gives a heuristic score of " << heuristicValue(next) + gained * 20 << "\n";
    }

    void showTreeAnalysis() {
        showStateTree(board);
    }

    void showBfsAnalysis() {
        bfsExplore(board, MAX_TREE_DEPTH);
    }

    void showDfsAnalysis() {
        cout << "\nDFS path exploration\n";
        cout << "--------------------\n";
        dfsExplore(board, MAX_TREE_DEPTH, "ROOT -> ");
    }
};

int main() {
    srand(static_cast<unsigned int>(time(0)));
    Game game;

    cout << "===========================================\n";
    cout << "2048 - DSA Demo Game in C++\n";
    cout << "===========================================\n";
    game.showBoard();
    game.explainDirections();

    while (true) {
        cout << "\nCommands: U / D / L / R | greedy | tree | bfs | dfs | undo | new | board | help | quit\n> ";
        string command;
        cin >> command;

        string lower = command;
        for (char& ch : lower) {
            ch = tolower(ch);
        }

        if (lower == "quit" || lower == "q") {
            cout << "Goodbye!\n";
            break;
        }

        if (lower == "help" || lower == "h") {
            cout << "U = up\n";
            cout << "D = down\n";
            cout << "L = left\n";
            cout << "R = right\n";
            cout << "greedy = choose best immediate move\n";
            cout << "tree = show state-space tree\n";
            cout << "bfs = show BFS traversal for possible states\n";
            cout << "dfs = show DFS traversal for possible states\n";
            cout << "undo = go back one move\n";
            cout << "new = start a new game\n";
            cout << "board = print the board\n";
            continue;
        }

        if (lower == "board" || lower == "b") {
            game.showBoard();
            continue;
        }

        if (lower == "new" || lower == "n") {
            game.newGame();
            continue;
        }

        if (lower == "undo") {
            game.undo();
            continue;
        }

        if (lower == "greedy") {
            game.showGreedyMove();
            continue;
        }

        if (lower == "tree") {
            game.showTreeAnalysis();
            continue;
        }

        if (lower == "bfs") {
            game.showBfsAnalysis();
            continue;
        }

        if (lower == "dfs") {
            game.showDfsAnalysis();
            continue;
        }

        if (lower == "u" || lower == "d" || lower == "l" || lower == "r") {
            char dir = toupper(command[0]);
            game.move(dir);
        } else {
            cout << "Unknown command. Try help.\n";
        }
    }

    return 0;
}

