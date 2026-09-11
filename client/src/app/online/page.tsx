"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import ThemeToggle from "@/components/ThemeToggle";
import { useOnlineGame } from "@/hooks/useOnlineGame";

export default function OnlineLobbyPage() {
  const router = useRouter();
  const { createRoom, roomId, status, errorMessage } = useOnlineGame();
  const [joinCode, setJoinCode] = useState("");

  useEffect(() => {
    if (roomId && status !== "error") {
      router.push(`/online/${roomId}`);
    }
  }, [roomId, status, router]);

  const handleJoin = (event: FormEvent) => {
    event.preventDefault();
    if (joinCode.trim()) {
      router.push(`/online/${joinCode.trim().toUpperCase()}`);
    }
  };

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col items-center gap-8 px-4 py-10">
      <div className="flex w-full items-center justify-between">
        <Link href="/" className="text-sm underline">
          ← Modes
        </Link>
        <ThemeToggle />
      </div>

      <h1 className="text-xl font-bold">Online Multiplayer</h1>

      <button type="button" onClick={createRoom} disabled={status === "connecting"} className="btn-primary">
        {status === "connecting" ? "Creating room…" : "Create a room"}
      </button>

      <div className="flex w-full items-center gap-3 text-sm text-[var(--text-muted)]">
        <span className="h-px flex-1" style={{ background: "var(--border)" }} />
        or
        <span className="h-px flex-1" style={{ background: "var(--border)" }} />
      </div>

      <form onSubmit={handleJoin} className="flex w-full max-w-xs flex-col gap-3">
        <label htmlFor="room-code" className="text-sm">
          Have a room code?
        </label>
        <input
          id="room-code"
          className="input-field"
          value={joinCode}
          onChange={(event) => setJoinCode(event.target.value.toUpperCase())}
          placeholder="ABCDE"
          maxLength={5}
          autoComplete="off"
        />
        <button type="submit" className="btn-outline">
          Join room
        </button>
      </form>

      {errorMessage && (
        <p role="alert" className="text-sm font-medium" style={{ color: "var(--mark-o)" }}>
          {errorMessage}
        </p>
      )}
    </div>
  );
}
