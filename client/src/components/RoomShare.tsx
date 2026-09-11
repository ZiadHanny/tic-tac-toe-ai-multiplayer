"use client";

import { useState } from "react";

interface RoomShareProps {
  roomId: string;
}

export default function RoomShare({ roomId }: RoomShareProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    const shareUrl = `${window.location.origin}/online/${roomId}`;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API can be blocked (permissions, insecure context); the
      // code is still shown on screen for the player to share by hand.
    }
  };

  return (
    <div className="flex flex-col items-center gap-3">
      <p className="text-sm text-[var(--text-muted)]">Share this room code with your opponent</p>
      <p className="rounded-lg border-2 px-6 py-3 font-mono text-3xl font-bold tracking-[0.3em]" style={{ borderColor: "var(--border)" }}>
        {roomId}
      </p>
      <button type="button" onClick={handleCopy} className="btn-outline">
        {copied ? "Link copied!" : "Copy invite link"}
      </button>
    </div>
  );
}
