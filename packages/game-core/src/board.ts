import type { Board, Line, Player, WinResult } from "./types";

export const WINNING_LINES: readonly Line[] = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6],
];

export function createEmptyBoard(): Board {
  return Array(9).fill(null);
}

export function checkWinner(board: Board): WinResult | null {
  for (const line of WINNING_LINES) {
    const [a, b, c] = line;
    const value = board[a];
    if (value && value === board[b] && value === board[c]) {
      return { winner: value, line };
    }
  }
  return null;
}

export function isDraw(board: Board): boolean {
  return board.every((cell) => cell !== null) && checkWinner(board) === null;
}

export function isGameOver(board: Board): boolean {
  return checkWinner(board) !== null || isDraw(board);
}

export function getAvailableMoves(board: Board): number[] {
  const moves: number[] = [];
  for (let i = 0; i < board.length; i++) {
    if (board[i] === null) moves.push(i);
  }
  return moves;
}

export function applyMove(board: Board, index: number, player: Player): Board {
  if (index < 0 || index > 8) {
    throw new Error(`Invalid cell index: ${index}`);
  }
  if (board[index] !== null) {
    throw new Error(`Cell ${index} is already occupied`);
  }
  const next = board.slice();
  next[index] = player;
  return next;
}

export function otherPlayer(player: Player): Player {
  return player === "X" ? "O" : "X";
}
