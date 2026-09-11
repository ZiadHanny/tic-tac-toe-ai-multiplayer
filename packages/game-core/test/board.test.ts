import { describe, expect, it } from "vitest";
import {
  applyMove,
  checkWinner,
  createEmptyBoard,
  getAvailableMoves,
  isDraw,
  isGameOver,
  otherPlayer,
  WINNING_LINES,
} from "../src/board";
import type { Board } from "../src/types";

describe("createEmptyBoard", () => {
  it("returns 9 null cells", () => {
    const board = createEmptyBoard();
    expect(board).toHaveLength(9);
    expect(board.every((cell) => cell === null)).toBe(true);
  });
});

describe("checkWinner", () => {
  it("returns null on an empty board", () => {
    expect(checkWinner(createEmptyBoard())).toBeNull();
  });

  it("detects a winner on every winning line", () => {
    for (const line of WINNING_LINES) {
      const board: Board = createEmptyBoard();
      for (const index of line) board[index] = "X";
      const result = checkWinner(board);
      expect(result?.winner).toBe("X");
      expect(result?.line).toEqual(line);
    }
  });

  it("does not report a winner for a near-miss line", () => {
    const board: Board = ["X", "X", "O", null, null, null, null, null, null];
    expect(checkWinner(board)).toBeNull();
  });
});

describe("isDraw", () => {
  it("is false on an empty board", () => {
    expect(isDraw(createEmptyBoard())).toBe(false);
  });

  it("is true on a full board with no winner", () => {
    const board: Board = ["X", "O", "X", "X", "O", "O", "O", "X", "X"];
    expect(checkWinner(board)).toBeNull();
    expect(isDraw(board)).toBe(true);
  });

  it("is false on a full board that has a winner", () => {
    const board: Board = ["X", "X", "X", "O", "O", "X", "X", "O", "O"];
    expect(isDraw(board)).toBe(false);
  });
});

describe("isGameOver", () => {
  it("is true on a win or a draw, false otherwise", () => {
    expect(isGameOver(createEmptyBoard())).toBe(false);
    expect(isGameOver(["X", "X", "X", null, null, null, null, null, null])).toBe(true);
    expect(isGameOver(["X", "O", "X", "X", "O", "O", "O", "X", "X"])).toBe(true);
  });
});

describe("getAvailableMoves", () => {
  it("lists every empty index", () => {
    const board: Board = ["X", null, "O", null, null, null, null, null, null];
    expect(getAvailableMoves(board)).toEqual([1, 3, 4, 5, 6, 7, 8]);
  });

  it("is empty for a full board", () => {
    const board: Board = ["X", "O", "X", "X", "O", "O", "O", "X", "X"];
    expect(getAvailableMoves(board)).toEqual([]);
  });
});

describe("applyMove", () => {
  it("places the player's mark without mutating the original board", () => {
    const board = createEmptyBoard();
    const next = applyMove(board, 4, "X");
    expect(next[4]).toBe("X");
    expect(board[4]).toBeNull();
  });

  it("throws when the cell is already occupied", () => {
    const board = applyMove(createEmptyBoard(), 0, "X");
    expect(() => applyMove(board, 0, "O")).toThrow();
  });

  it("throws for an out-of-range index", () => {
    expect(() => applyMove(createEmptyBoard(), 9, "X")).toThrow();
    expect(() => applyMove(createEmptyBoard(), -1, "X")).toThrow();
  });
});

describe("otherPlayer", () => {
  it("swaps X and O", () => {
    expect(otherPlayer("X")).toBe("O");
    expect(otherPlayer("O")).toBe("X");
  });
});
