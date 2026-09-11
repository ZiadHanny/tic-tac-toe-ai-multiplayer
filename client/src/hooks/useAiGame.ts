"use client";

import { useEffect, useRef } from "react";
import { getAiMove } from "@ttt/game-core";
import type { Difficulty, Player } from "@ttt/game-core";
import { useLocalGame } from "./useLocalGame";

const AI_MOVE_DELAY_MS = 500;

/** Wraps useLocalGame and plays the non-human side automatically whenever
 * it becomes their turn, using the requested difficulty. */
export function useAiGame(difficulty: Difficulty, humanSymbol: Player = "X") {
  const game = useLocalGame(humanSymbol);
  const aiSymbol: Player = humanSymbol === "X" ? "O" : "X";
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (game.winner || game.isDraw) return;
    if (game.currentPlayer !== aiSymbol) return;

    timeoutRef.current = setTimeout(() => {
      const move = getAiMove(game.board, aiSymbol, difficulty);
      game.play(move, aiSymbol);
    }, AI_MOVE_DELAY_MS);

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
    // game.play is a stable dispatch-backed callback; the other game.* fields
    // above are the actual triggers for re-evaluating whether the AI should move.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [game.board, game.currentPlayer, game.winner, game.isDraw, aiSymbol, difficulty]);

  return { ...game, humanSymbol, aiSymbol };
}
