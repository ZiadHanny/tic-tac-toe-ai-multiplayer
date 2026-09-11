"use client";

import Link from "next/link";
import Board from "@/components/Board";
import GameOverPanel from "@/components/GameOverPanel";
import Scoreboard from "@/components/Scoreboard";
import StatusAnnouncer from "@/components/StatusAnnouncer";
import ThemeToggle from "@/components/ThemeToggle";
import { useLocalGame } from "@/hooks/useLocalGame";
import { getResultMessage, getTurnMessage } from "@/lib/status";

export default function LocalGamePage() {
  const game = useLocalGame();
  const gameOver = Boolean(game.winner) || game.isDraw;
  const resultMessage = getResultMessage(game.winner, game.isDraw);
  const statusMessage = resultMessage ?? getTurnMessage(game.currentPlayer);

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col items-center gap-6 px-4 py-10">
      <div className="flex w-full items-center justify-between">
        <Link href="/" className="text-sm underline">
          ← Modes
        </Link>
        <ThemeToggle />
      </div>

      <h1 className="text-xl font-bold">Local 2 Player</h1>
      <Scoreboard scores={game.scores} />
      <StatusAnnouncer message={statusMessage} priority={gameOver ? "assertive" : "polite"} />

      <Board
        board={game.board}
        winningLine={game.winningLine}
        canPlay={!gameOver}
        onPlay={(index) => game.play(index, game.currentPlayer)}
      />

      {gameOver && (
        <GameOverPanel message={resultMessage ?? ""} onRematch={game.rematch} onNewGame={game.resetScores} />
      )}
    </div>
  );
}
