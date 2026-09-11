"use client";

import { useRef, type KeyboardEvent } from "react";
import type { Board as BoardT, Line } from "@ttt/game-core";
import Cell from "./Cell";

interface BoardProps {
  board: BoardT;
  winningLine: Line | null;
  /** Whether a move can currently be applied at all (correct turn, game not over). */
  canPlay: boolean;
  onPlay: (index: number) => void;
}

/**
 * The 3x3 grid. Every cell is a real, always-focusable button (see Cell.tsx)
 * so Tab cycles through all nine in order; arrow keys are layered on top as
 * a spatial shortcut that wraps around each row/column, per the "arrows OR
 * Tab" keyboard requirement.
 */
export default function Board({ board, winningLine, canPlay, onPlay }: BoardProps) {
  const cellRefs = useRef<Array<HTMLButtonElement | null>>([]);

  const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    // Enter/Space are handled explicitly here rather than left to the
    // browser's native "Enter/Space activates a focused button" behavior:
    // that default action only fires for genuinely trusted hardware input,
    // so anything that dispatches keyboard events programmatically (browser
    // automation, some virtual keyboards) would otherwise silently do
    // nothing. Explicit handling makes the cell playable by key regardless.
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      if (board[index] === null && canPlay) onPlay(index);
      return;
    }

    const row = Math.floor(index / 3);
    const col = index % 3;
    let target: number | null = null;

    switch (event.key) {
      case "ArrowUp":
        target = ((row + 2) % 3) * 3 + col;
        break;
      case "ArrowDown":
        target = ((row + 1) % 3) * 3 + col;
        break;
      case "ArrowLeft":
        target = row * 3 + ((col + 2) % 3);
        break;
      case "ArrowRight":
        target = row * 3 + ((col + 1) % 3);
        break;
      default:
        return;
    }

    event.preventDefault();
    cellRefs.current[target]?.focus();
  };

  return (
    <div role="group" aria-label="Tic Tac Toe board" className="mx-auto grid w-full max-w-sm grid-cols-3 gap-3">
      {board.map((value, index) => (
        <Cell
          key={index}
          ref={(el) => {
            cellRefs.current[index] = el;
          }}
          index={index}
          value={value}
          playable={canPlay && value === null}
          isWinning={winningLine?.includes(index) ?? false}
          onPlay={() => value === null && canPlay && onPlay(index)}
          onKeyDown={(event) => handleKeyDown(event, index)}
        />
      ))}
    </div>
  );
}
