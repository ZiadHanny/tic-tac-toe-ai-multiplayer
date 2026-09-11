import type { Scores } from "@/hooks/useLocalGame";

interface ScoreboardProps {
  scores: Scores;
  labelX?: string;
  labelO?: string;
}

export default function Scoreboard({ scores, labelX = "Player X", labelO = "Player O" }: ScoreboardProps) {
  return (
    <div className="flex justify-center gap-8 text-center" role="group" aria-label="Score">
      <div>
        <p className="text-xs text-[var(--text-muted)]">{labelX}</p>
        <p className="text-2xl font-bold" style={{ color: "var(--mark-x)" }}>
          {scores.X}
        </p>
      </div>
      <div>
        <p className="text-xs text-[var(--text-muted)]">Draws</p>
        <p className="text-2xl font-bold">{scores.draws}</p>
      </div>
      <div>
        <p className="text-xs text-[var(--text-muted)]">{labelO}</p>
        <p className="text-2xl font-bold" style={{ color: "var(--mark-o)" }}>
          {scores.O}
        </p>
      </div>
    </div>
  );
}
