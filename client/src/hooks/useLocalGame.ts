"use client";

import { useCallback, useReducer } from "react";
import { applyMove, checkWinner, createEmptyBoard, isDraw, otherPlayer } from "@ttt/game-core";
import type { Board, Line, Player } from "@ttt/game-core";

export interface Scores {
  X: number;
  O: number;
  draws: number;
}

interface GameState {
  board: Board;
  currentPlayer: Player;
  startingPlayer: Player;
  winner: Player | null;
  winningLine: Line | null;
  isDraw: boolean;
  scores: Scores;
}

type Action = { type: "MOVE"; index: number; player: Player } | { type: "REMATCH" } | { type: "RESET_SCORES" };

function createInitialState(startingPlayer: Player): GameState {
  return {
    board: createEmptyBoard(),
    currentPlayer: startingPlayer,
    startingPlayer,
    winner: null,
    winningLine: null,
    isDraw: false,
    scores: { X: 0, O: 0, draws: 0 },
  };
}

function reducer(state: GameState, action: Action): GameState {
  switch (action.type) {
    case "MOVE": {
      if (state.winner || state.isDraw) return state;
      if (action.player !== state.currentPlayer) return state;
      if (state.board[action.index] !== null) return state;

      const board = applyMove(state.board, action.index, action.player);
      const result = checkWinner(board);
      const draw = !result && isDraw(board);

      const scores = { ...state.scores };
      if (result) scores[result.winner] += 1;
      else if (draw) scores.draws += 1;

      return {
        ...state,
        board,
        currentPlayer: otherPlayer(action.player),
        winner: result?.winner ?? null,
        winningLine: result?.line ?? null,
        isDraw: draw,
        scores,
      };
    }
    case "REMATCH": {
      const nextStarting = otherPlayer(state.startingPlayer);
      return {
        ...state,
        board: createEmptyBoard(),
        currentPlayer: nextStarting,
        startingPlayer: nextStarting,
        winner: null,
        winningLine: null,
        isDraw: false,
      };
    }
    case "RESET_SCORES":
      return createInitialState(state.startingPlayer);
    default:
      return state;
  }
}

/** Turn-taking, win/draw detection, and score-keeping shared by the local
 * 2-player and vs-AI modes — the two differ only in who (or what) supplies
 * moves for each side. */
export function useLocalGame(startingPlayer: Player = "X") {
  const [state, dispatch] = useReducer(reducer, startingPlayer, createInitialState);

  const play = useCallback((index: number, player: Player) => {
    dispatch({ type: "MOVE", index, player });
  }, []);

  const rematch = useCallback(() => dispatch({ type: "REMATCH" }), []);
  const resetScores = useCallback(() => dispatch({ type: "RESET_SCORES" }), []);

  return { ...state, play, rematch, resetScores };
}
