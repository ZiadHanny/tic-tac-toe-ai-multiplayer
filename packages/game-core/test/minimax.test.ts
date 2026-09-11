import { describe, expect, it } from "vitest";
import { applyMove, checkWinner, getAvailableMoves, isGameOver, otherPlayer } from "../src/board";
import { getAiMove, getBestMove } from "../src/minimax";
import type { Board, Difficulty, Player } from "../src/types";

function randomMove(board: Board): number {
  const moves = getAvailableMoves(board);
  return moves[Math.floor(Math.random() * moves.length)];
}

/** Plays a full game to completion, alternating turns starting with X. */
function playGame(aiPlayer: Player, difficulty: Difficulty): Player | "draw" {
  let board: Board = Array(9).fill(null);
  let current: Player = "X";

  while (!isGameOver(board)) {
    const move = current === aiPlayer ? getAiMove(board, aiPlayer, difficulty) : randomMove(board);
    board = applyMove(board, move, current);
    current = otherPlayer(current);
  }

  return checkWinner(board)?.winner ?? "draw";
}

describe("getBestMove", () => {
  it("takes an immediate winning move when one is available", () => {
    // X: 0,1 filled, 2 completes the top row.
    const board: Board = ["X", "X", null, "O", "O", null, null, null, null];
    expect(getBestMove(board, "X")).toBe(2);
  });

  it("blocks the opponent's immediate winning move", () => {
    // O threatens to complete the top row at index 2.
    const board: Board = ["O", "O", null, "X", null, null, null, null, null];
    expect(getBestMove(board, "X")).toBe(2);
  });

  it("only ever returns an empty cell", () => {
    const board: Board = ["X", "O", "X", null, "O", null, null, null, null];
    const move = getBestMove(board, "O", 3);
    expect(board[move]).toBeNull();
  });
});

describe("getAiMove", () => {
  const difficulties: Difficulty[] = ["easy", "medium", "hard"];

  it.each(difficulties)("always returns an available cell on %s", (difficulty) => {
    const board: Board = ["X", null, "O", null, "X", null, null, null, null];
    for (let i = 0; i < 20; i++) {
      const move = getAiMove(board, "O", difficulty);
      expect(board[move]).toBeNull();
    }
  });

  it("hard difficulty is unbeatable — never loses across many games as either mark", () => {
    for (let i = 0; i < 25; i++) {
      expect(playGame("X", "hard")).not.toBe("O");
    }
    for (let i = 0; i < 25; i++) {
      expect(playGame("O", "hard")).not.toBe("X");
    }
  });
});
