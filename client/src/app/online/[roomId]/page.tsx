"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Board from "@/components/Board";
import GameOverPanel from "@/components/GameOverPanel";
import RoomShare from "@/components/RoomShare";
import StatusAnnouncer from "@/components/StatusAnnouncer";
import ThemeToggle from "@/components/ThemeToggle";
import { useOnlineGame } from "@/hooks/useOnlineGame";
import { getResultMessage, getTurnMessage } from "@/lib/status";

function RoomStatusScreen({ message, children }: { message: string; children?: ReactNode }) {
  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-4 px-4 text-center">
      <p role="status" aria-live="polite" className="text-lg font-medium">
        {message}
      </p>
      {children}
    </div>
  );
}

export default function OnlineRoomPage() {
  const params = useParams<{ roomId: string }>();
  const router = useRouter();
  const online = useOnlineGame();
  const hasRequestedJoin = useRef(false);

  useEffect(() => {
    if (hasRequestedJoin.current) return;
    hasRequestedJoin.current = true;
    online.joinRoom(params.roomId);
    // Runs once per mount, keyed by the room in the URL — re-running it on
    // every state change would re-emit "room:join" in a loop.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.roomId]);

  const handleLeave = () => {
    online.leaveRoom();
    router.push("/online");
  };

  if (online.status === "idle" || online.status === "connecting" || !online.game || !online.you) {
    return <RoomStatusScreen message="Connecting…" />;
  }

  if (online.status === "error") {
    return (
      <RoomStatusScreen message={online.errorMessage ?? "Something went wrong."}>
        <Link href="/online" className="btn-outline">
          Back to lobby
        </Link>
      </RoomStatusScreen>
    );
  }

  const gameOver = Boolean(online.game.winner) || online.game.isDraw;
  const resultMessage = getResultMessage(online.game.winner, online.game.isDraw, online.you);
  const isMyTurn = online.game.currentPlayer === online.you;

  let statusMessage: string;
  if (online.status === "waiting-for-opponent") {
    statusMessage = "Waiting for an opponent to join…";
  } else if (online.status === "opponent-left") {
    statusMessage = "Your opponent left the room.";
  } else if (online.status === "opponent-disconnected") {
    statusMessage = "Your opponent disconnected. Waiting for them to reconnect…";
  } else {
    statusMessage = resultMessage ?? getTurnMessage(online.game.currentPlayer, online.you);
  }

  const opponentWantsRematch = gameOver && online.rematchRequestedBy && online.rematchRequestedBy !== online.you;
  const gameOverMessage = (resultMessage ?? "") + (opponentWantsRematch ? " Your opponent wants a rematch!" : "");

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col items-center gap-6 px-4 py-10">
      <div className="flex w-full items-center justify-between">
        <button type="button" onClick={handleLeave} className="text-sm underline">
          ← Leave room
        </button>
        <ThemeToggle />
      </div>

      <h1 className="text-xl font-bold">Online Multiplayer</h1>
      <p className="text-sm text-[var(--text-muted)]">
        You are playing as{" "}
        <strong style={{ color: online.you === "X" ? "var(--mark-x)" : "var(--mark-o)" }}>{online.you}</strong>
      </p>

      {online.status === "waiting-for-opponent" && online.roomId && <RoomShare roomId={online.roomId} />}

      <StatusAnnouncer
        message={statusMessage}
        priority={gameOver || online.status === "opponent-left" ? "assertive" : "polite"}
      />

      <Board
        board={online.game.board}
        winningLine={online.game.winningLine}
        canPlay={!gameOver && isMyTurn && online.status === "in-game"}
        onPlay={online.play}
      />

      {gameOver && (
        <GameOverPanel
          message={gameOverMessage}
          onRematch={online.requestRematch}
          rematchLabel={online.rematchRequestedBy === online.you ? "Rematch requested" : "Rematch"}
          waitingForOpponent={online.rematchRequestedBy === online.you}
        />
      )}
    </div>
  );
}
