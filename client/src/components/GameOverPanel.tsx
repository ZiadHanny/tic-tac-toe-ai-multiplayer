interface GameOverPanelProps {
  message: string;
  onRematch: () => void;
  onNewGame?: () => void;
  rematchLabel?: string;
  waitingForOpponent?: boolean;
}

export default function GameOverPanel({
  message,
  onRematch,
  onNewGame,
  rematchLabel = "Rematch",
  waitingForOpponent = false,
}: GameOverPanelProps) {
  return (
    <div className="flex flex-col items-center gap-4 rounded-xl border-2 p-6 text-center" style={{ borderColor: "var(--border)" }}>
      <p className="text-xl font-bold">{message}</p>
      <div className="flex flex-wrap justify-center gap-3">
        <button type="button" onClick={onRematch} className="btn-primary">
          {waitingForOpponent ? "Waiting for opponent…" : rematchLabel}
        </button>
        {onNewGame && (
          <button type="button" onClick={onNewGame} className="btn-outline">
            Start over
          </button>
        )}
      </div>
    </div>
  );
}
