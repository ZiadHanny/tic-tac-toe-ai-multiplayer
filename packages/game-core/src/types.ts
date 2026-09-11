export type Player = "X" | "O";
export type CellValue = Player | null;

/** Length-9 array, row-major: index = row * 3 + col. */
export type Board = CellValue[];

export type Difficulty = "easy" | "medium" | "hard";

export type Line = readonly [number, number, number];

export interface WinResult {
  winner: Player;
  line: Line;
}

export type GameResult = "win" | "draw" | null;
