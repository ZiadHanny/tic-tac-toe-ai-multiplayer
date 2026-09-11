"use client";

import { useState } from "react";
import Link from "next/link";
import type { Difficulty } from "@ttt/game-core";
import Board from "@/components/Board";
import GameOverPanel from "@/components/GameOverPanel";
import Scoreboard from "@/components/Scoreboard";
import StatusAnnouncer from "@/components/StatusAnnouncer";
import ThemeToggle from "@/components/ThemeToggle";
import { useAiGame } from "@/hooks/useAiGame";
import { getResultMessage, getTurnMessage } from "@/lib/status";

const DIFFICULTIES: { value: Difficulty; label: string }[] = [
  { value: "easy", label: "Easy" },
  { value: "medium", label: "Medium" },
  { value: "hard", label: "Hard (unbeatable)" },
];

const HUMAN_SYMBOL = "X" as const;

function AiGameSession({ difficulty }: { difficulty: Difficulty }) {
  const game = useAiGame(difficulty, HUMAN_SYMBOL);
  const gameOver = Boolean(game.winner) || game.isDraw;
  const isHumanTurn = game.currentPlayer === HUMAN_SYMBOL;
  const resultMessage = getResultMessage(game.winner, game.isDraw, HUMAN_SYMBOL);
  const statusMessage = resultMessage ?? getTurnMessage(game.currentPlayer, HUMAN_SYMBOL);

  return (
    <>
      <Scoreboard scores={game.scores} labelX="You" labelO="AI" />
      <StatusAnnouncer message={statusMessage} priority={gameOver ? "assertive" : "polite"} />

      <Board
        board={game.board}
        winningLine={game.winningLine}
        canPlay={!gameOver && isHumanTurn}
        onPlay={(index) => game.play(index, HUMAN_SYMBOL)}
      />

      {gameOver && (
        <GameOverPanel message={resultMessage ?? ""} onRematch={game.rematch} onNewGame={game.resetScores} />
      )}
    </>
  );
}

export default function AiGamePage() {
  const [difficulty, setDifficulty] = useState<Difficulty>("hard");

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col items-center gap-6 px-4 py-10">
      <div className="flex w-full items-center justify-between">
        <Link href="/" className="text-sm underline">
          ← Modes
        </Link>
        <ThemeToggle />
      </div>

      <h1 className="text-xl font-bold">Player vs AI</h1>

      <div role="radiogroup" aria-label="AI difficulty" className="flex flex-wrap justify-center gap-2">
        {DIFFICULTIES.map((option) => {
          const selected = difficulty === option.value;
          return (
            <button
              key={option.value}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => setDifficulty(option.value)}
              className="rounded-full border-2 px-4 py-2 text-sm font-medium"
              style={{
                borderColor: selected ? "var(--accent)" : "var(--border)",
                background: selected ? "var(--accent)" : "transparent",
                color: selected ? "#fff" : "var(--text)",
              }}
            >
              {option.label}
            </button>
          );
        })}
      </div>

      <AiGameSession key={difficulty} difficulty={difficulty} />
    </div>
  );
}
