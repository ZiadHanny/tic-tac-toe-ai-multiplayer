"use client";

import { forwardRef, type KeyboardEvent } from "react";
import type { CellValue } from "@ttt/game-core";

interface CellProps {
  index: number;
  value: CellValue;
  playable: boolean;
  isWinning: boolean;
  onPlay: () => void;
  onKeyDown: (event: KeyboardEvent<HTMLButtonElement>) => void;
}

/**
 * Always a real, always-focusable <button> — never the native `disabled`
 * attribute, which would remove an occupied cell from the tab order and
 * break keyboard navigation across the board. `aria-disabled` communicates
 * "not currently playable" to assistive tech without doing that; the actual
 * move validity is enforced where the move is applied (see useLocalGame /
 * the server's makeMove), so this is a UX hint, not the real guard.
 */
const Cell = forwardRef<HTMLButtonElement, CellProps>(function Cell(
  { index, value, playable, isWinning, onPlay, onKeyDown },
  ref,
) {
  const row = Math.floor(index / 3) + 1;
  const col = (index % 3) + 1;
  const stateLabel = value ? `contains ${value === "X" ? "X" : "O"}` : "empty";

  return (
    <button
      ref={ref}
      type="button"
      onClick={onPlay}
      onKeyDown={onKeyDown}
      aria-disabled={!playable}
      aria-label={`Row ${row}, column ${col}, ${stateLabel}`}
      className={[
        "aspect-square flex items-center justify-center text-4xl sm:text-5xl font-bold rounded-xl border-2",
        "transition-colors focus-visible:z-10",
        isWinning ? "bg-[var(--win-bg)] border-[var(--accent)]" : "bg-[var(--surface)]",
        playable ? "cursor-pointer hover:border-[var(--accent)]" : "cursor-not-allowed",
      ].join(" ")}
      style={{ color: value === "X" ? "var(--mark-x)" : value === "O" ? "var(--mark-o)" : undefined }}
    >
      <span aria-hidden="true">{value}</span>
    </button>
  );
});

export default Cell;
