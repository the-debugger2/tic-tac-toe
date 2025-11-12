// Game state variables
let boardSize = 3;
let gameMode = 'human';
let currentPlayer = 'X';
let gameBoard = [];
let gameActive = true;
let aiPlayer = 'O';
let winLength = 3; // number in a row required to win (set in initGame)

// DOM elements
const boardElement = document.getElementById('board');
const statusElement = document.getElementById('status');
const boardSizeSelect = document.getElementById('boardSize');
const gameModeSelect = document.getElementById('gameMode');
const resetBtn = document.getElementById('resetBtn');

// Initialize the game
function initGame() {
    boardSize = parseInt(boardSizeSelect.value);
    gameMode = gameModeSelect.value;
    currentPlayer = 'X';
    gameActive = true;

    // set win length: for boards larger than 6x6 require 4 in a row, otherwise 3
    winLength = boardSize > 6 ? 4 : 3;

    // Initialize the game board
    gameBoard = Array(boardSize).fill().map(() => Array(boardSize).fill(''));

    // Create the board UI
    createBoard();

    // Update status
    updateStatus();
}

// Create the game board UI
function createBoard() {
    boardElement.innerHTML = '';
    boardElement.style.gridTemplateColumns = `repeat(${boardSize}, 1fr)`;
    boardElement.style.gridTemplateRows = `repeat(${boardSize}, 1fr)`;

    for (let i = 0; i < boardSize; i++) {
        for (let j = 0; j < boardSize; j++) {
            const cell = document.createElement('div');
            cell.classList.add('cell');
            cell.dataset.row = i;
            cell.dataset.col = j;
            cell.addEventListener('click', () => handleCellClick(i, j));
            boardElement.appendChild(cell);
        }
    }
}

// Handle cell click
function handleCellClick(row, col) {
    if (!gameActive || gameBoard[row][col] !== '') return;

    // Make the move
    makeMove(row, col);

    // Check for winner
    const winner = checkWinner();
    if (winner) {
        endGame(winner);
        return;
    }

    // Check for tie
    if (isBoardFull()) {
        endGame('tie');
        return;
    }

    // Switch player
    switchPlayer();

    // If playing against AI and it's AI's turn
    if (gameMode === 'ai' && currentPlayer === aiPlayer && gameActive) {
        setTimeout(makeAIMove, 500);
    }
}

// Make a move on the board
function makeMove(row, col) {
    gameBoard[row][col] = currentPlayer;
    const cell = document.querySelector(`.cell[data-row="${row}"][data-col="${col}"]`);
    cell.textContent = currentPlayer;
    cell.classList.add(currentPlayer.toLowerCase());
}

// Switch the current player
function switchPlayer() {
    currentPlayer = currentPlayer === 'X' ? 'O' : 'X';
    updateStatus();
}

// Update the game status
function updateStatus() {
    if (gameActive) {
        statusElement.textContent = `Player ${currentPlayer}'s Turn`;
    }
}

// Check for a winner
function checkWinner() {
    // Helper to check a sequence of winLength starting at (r,c) with given deltas
    function checkSequence(r, c, dr, dc) {
        const first = gameBoard[r][c];
        if (first === '') return null;
        for (let k = 1; k < winLength; k++) {
            const rr = r + dr * k;
            const cc = c + dc * k;
            if (rr < 0 || rr >= boardSize || cc < 0 || cc >= boardSize) return null;
            if (gameBoard[rr][cc] !== first) return null;
        }
        // return array of winning cells and the winner
        const cells = [];
        for (let k = 0; k < winLength; k++) cells.push([r + dr * k, c + dc * k]);
        return {
            winner: first,
            cells
        };
    }

    // Rows
    for (let i = 0; i < boardSize; i++) {
        for (let j = 0; j <= boardSize - winLength; j++) {
            const res = checkSequence(i, j, 0, 1);
            if (res) {
                highlightWinningCells(res.cells);
                return res.winner;
            }
        }
    }

    // Columns
    for (let i = 0; i <= boardSize - winLength; i++) {
        for (let j = 0; j < boardSize; j++) {
            const res = checkSequence(i, j, 1, 0);
            if (res) {
                highlightWinningCells(res.cells);
                return res.winner;
            }
        }
    }

    // Diagonals (top-left to bottom-right)
    for (let i = 0; i <= boardSize - winLength; i++) {
        for (let j = 0; j <= boardSize - winLength; j++) {
            const res = checkSequence(i, j, 1, 1);
            if (res) {
                highlightWinningCells(res.cells);
                return res.winner;
            }
        }
    }

    // Diagonals (top-right to bottom-left)
    for (let i = 0; i <= boardSize - winLength; i++) {
        for (let j = winLength - 1; j < boardSize; j++) {
            const res = checkSequence(i, j, 1, -1);
            if (res) {
                highlightWinningCells(res.cells);
                return res.winner;
            }
        }
    }

    return null;
}

// Highlight winning cells
function highlightWinningCells(cells) {
    cells.forEach(([row, col]) => {
        const cell = document.querySelector(`.cell[data-row="${row}"][data-col="${col}"]`);
        cell.classList.add('winning-cell');
    });
}

// Check if the board is full
function isBoardFull() {
    for (let i = 0; i < boardSize; i++) {
        for (let j = 0; j < boardSize; j++) {
            if (gameBoard[i][j] === '') {
                return false;
            }
        }
    }
    return true;
}

// End the game
function endGame(result) {
    gameActive = false;
    if (result === 'tie') {
        statusElement.textContent = "Game ended in a tie!";
    } else {
        statusElement.textContent = `Player ${result} wins!`;
    }
}

// AI move logic
function makeAIMove() {
    if (!gameActive) return;

    // For larger boards, use a simpler heuristic approach
    if (boardSize > 5) {
        makeHeuristicAIMove();
    } else {
        // For smaller boards, use minimax for optimal play
        const bestMove = findBestMove();
        if (bestMove) {
            makeMove(bestMove.row, bestMove.col);

            const winner = checkWinner();
            if (winner) {
                endGame(winner);
                return;
            }

            if (isBoardFull()) {
                endGame('tie');
                return;
            }

            switchPlayer();
        }
    }
}

// Find the best move using minimax algorithm
function findBestMove() {
    let bestScore = -Infinity;
    let bestMove = null;

    // choose a sensible maxDepth for minimax depending on board size to avoid long computation
    let maxDepth;
    if (boardSize <= 3) maxDepth = 9;
    else if (boardSize === 4) maxDepth = 6; // limit depth for 4x4 to avoid freeze
    else if (boardSize === 5) maxDepth = 4;
    else maxDepth = 3;

    for (let i = 0; i < boardSize; i++) {
        for (let j = 0; j < boardSize; j++) {
            if (gameBoard[i][j] === '') {
                gameBoard[i][j] = aiPlayer;
                let score = minimax(gameBoard, 0, false, -Infinity, Infinity, maxDepth);
                gameBoard[i][j] = '';

                if (score > bestScore) {
                    bestScore = score;
                    bestMove = {
                        row: i,
                        col: j
                    };
                }
            }
        }
    }

    return bestMove;
}

// Minimax with alpha-beta pruning and depth cutoff. Returns numeric score.
function minimax(board, depth, isMaximizing, alpha, beta, maxDepth) {
    const winner = checkWinnerForMinimax(board);

    if (winner === aiPlayer) return 1000 - depth;
    const opponent = aiPlayer === 'X' ? 'O' : 'X';
    if (winner === opponent) return depth - 1000;
    if (isBoardFullForMinimax(board)) return 0;

    // Depth cutoff: evaluate heuristically to avoid long computation on 4x4/5x5
    if (depth >= maxDepth) {
        return evaluateBoard(board);
    }

    if (isMaximizing) {
        let bestScore = -Infinity;
        for (let i = 0; i < boardSize; i++) {
            for (let j = 0; j < boardSize; j++) {
                if (board[i][j] === '') {
                    board[i][j] = aiPlayer;
                    let score = minimax(board, depth + 1, false, alpha, beta, maxDepth);
                    board[i][j] = '';
                    bestScore = Math.max(score, bestScore);
                    alpha = Math.max(alpha, score);
                    if (beta <= alpha) return bestScore; // prune
                }
            }
        }
        return bestScore;
    } else {
        let bestScore = Infinity;
        for (let i = 0; i < boardSize; i++) {
            for (let j = 0; j < boardSize; j++) {
                if (board[i][j] === '') {
                    board[i][j] = opponent;
                    let score = minimax(board, depth + 1, true, alpha, beta, maxDepth);
                    board[i][j] = '';
                    bestScore = Math.min(score, bestScore);
                    beta = Math.min(beta, score);
                    if (beta <= alpha) return bestScore; // prune
                }
            }
        }
        return bestScore;
    }
}

// Simple heuristic evaluation used at depth cutoff. Positive favors AI, negative favors opponent.
function evaluateBoard(board) {
    const opponent = aiPlayer === 'X' ? 'O' : 'X';
    let score = 0;

    // Helper to score a sequence of length winLength starting at (r,c) with direction (dr,dc)
    function scoreSequence(r, c, dr, dc) {
        let countAI = 0;
        let countOpp = 0;
        for (let k = 0; k < winLength; k++) {
            const rr = r + dr * k;
            const cc = c + dc * k;
            if (rr < 0 || rr >= boardSize || cc < 0 || cc >= boardSize) return 0;
            if (board[rr][cc] === aiPlayer) countAI++;
            else if (board[rr][cc] === opponent) countOpp++;
        }
        if (countAI > 0 && countOpp === 0) return Math.pow(10, countAI);
        if (countOpp > 0 && countAI === 0) return -Math.pow(10, countOpp);
        return 0;
    }

    // Rows
    for (let i = 0; i < boardSize; i++) {
        for (let j = 0; j <= boardSize - winLength; j++) {
            score += scoreSequence(i, j, 0, 1);
        }
    }
    // Columns
    for (let i = 0; i <= boardSize - winLength; i++) {
        for (let j = 0; j < boardSize; j++) {
            score += scoreSequence(i, j, 1, 0);
        }
    }
    // Diagonals TL-BR
    for (let i = 0; i <= boardSize - winLength; i++) {
        for (let j = 0; j <= boardSize - winLength; j++) {
            score += scoreSequence(i, j, 1, 1);
        }
    }
    // Diagonals TR-BL
    for (let i = 0; i <= boardSize - winLength; i++) {
        for (let j = winLength - 1; j < boardSize; j++) {
            score += scoreSequence(i, j, 1, -1);
        }
    }

    return score;
}

// Check winner for minimax (without UI updates)
function checkWinnerForMinimax(board) {
    // Helper to check a sequence of winLength starting at (r,c) with given deltas
    function checkSequence(r, c, dr, dc) {
        const first = board[r][c];
        if (first === '') return null;
        for (let k = 1; k < winLength; k++) {
            const rr = r + dr * k;
            const cc = c + dc * k;
            if (rr < 0 || rr >= boardSize || cc < 0 || cc >= boardSize) return null;
            if (board[rr][cc] !== first) return null;
        }
        return first;
    }

    // Rows
    for (let i = 0; i < boardSize; i++) {
        for (let j = 0; j <= boardSize - winLength; j++) {
            const res = checkSequence(i, j, 0, 1);
            if (res) return res;
        }
    }

    // Columns
    for (let i = 0; i <= boardSize - winLength; i++) {
        for (let j = 0; j < boardSize; j++) {
            const res = checkSequence(i, j, 1, 0);
            if (res) return res;
        }
    }

    // Diagonals (top-left to bottom-right)
    for (let i = 0; i <= boardSize - winLength; i++) {
        for (let j = 0; j <= boardSize - winLength; j++) {
            const res = checkSequence(i, j, 1, 1);
            if (res) return res;
        }
    }

    // Diagonals (top-right to bottom-left)
    for (let i = 0; i <= boardSize - winLength; i++) {
        for (let j = winLength - 1; j < boardSize; j++) {
            const res = checkSequence(i, j, 1, -1);
            if (res) return res;
        }
    }

    return null;
}

// Check if board is full for minimax
function isBoardFullForMinimax(board) {
    for (let i = 0; i < boardSize; i++) {
        for (let j = 0; j < boardSize; j++) {
            if (board[i][j] === '') {
                return false;
            }
        }
    }
    return true;
}

// Heuristic-based AI for larger boards
function makeHeuristicAIMove() {
    // Try to win
    let move = findWinningMove(aiPlayer);
    if (move) {
        makeMove(move.row, move.col);
        checkGameEnd();
        return;
    }

    // Block opponent's winning move
    move = findWinningMove(currentPlayer === 'X' ? 'O' : 'X');
    if (move) {
        makeMove(move.row, move.col);
        checkGameEnd();
        return;
    }

    // Make a strategic move
    move = findStrategicMove();
    if (move) {
        makeMove(move.row, move.col);
        checkGameEnd();
        return;
    }

    // Make a random move as fallback
    makeRandomMove();
    checkGameEnd();
}

// Find a winning move for a player
function findWinningMove(player) {
    for (let i = 0; i < boardSize; i++) {
        for (let j = 0; j < boardSize; j++) {
            if (gameBoard[i][j] === '') {
                gameBoard[i][j] = player;
                const winner = checkWinnerForMinimax(gameBoard);
                gameBoard[i][j] = '';
                if (winner === player) {
                    return {
                        row: i,
                        col: j
                    };
                }
            }
        }
    }
    return null;
}

// Find a strategic move (center or corners)
function findStrategicMove() {
    // Try center
    const center = Math.floor(boardSize / 2);
    if (gameBoard[center][center] === '') {
        return {
            row: center,
            col: center
        };
    }

    // Try corners
    const corners = [
        [0, 0],
        [0, boardSize - 1],
        [boardSize - 1, 0],
        [boardSize - 1, boardSize - 1]
    ];

    for (const [row, col] of corners) {
        if (gameBoard[row][col] === '') {
            return {
                row,
                col
            };
        }
    }

    return null;
}

// Make a random move
function makeRandomMove() {
    const emptyCells = [];
    for (let i = 0; i < boardSize; i++) {
        for (let j = 0; j < boardSize; j++) {
            if (gameBoard[i][j] === '') {
                emptyCells.push({
                    row: i,
                    col: j
                });
            }
        }
    }

    if (emptyCells.length > 0) {
        const randomIndex = Math.floor(Math.random() * emptyCells.length);
        const move = emptyCells[randomIndex];
        makeMove(move.row, move.col);
    }
}

// Check if the game has ended after AI move
function checkGameEnd() {
    const winner = checkWinner();
    if (winner) {
        endGame(winner);
        return;
    }

    if (isBoardFull()) {
        endGame('tie');
        return;
    }

    switchPlayer();
}

// Event listeners
boardSizeSelect.addEventListener('change', initGame);
gameModeSelect.addEventListener('change', initGame);
resetBtn.addEventListener('click', initGame);

// Initialize the game when the page loads
window.addEventListener('DOMContentLoaded', initGame);