import type { Player } from "@ttt/game-core";

/** The text driving the aria-live turn announcement — identical wording
 * whether the "you" framing applies (AI/online modes) or not (local 2P). */
export function getTurnMessage(currentPlayer: Player, youAre?: Player): string {
  if (youAre) {
    return currentPlayer === youAre ? "Your turn." : `Waiting for player ${currentPlayer}'s move.`;
  }
  return `Player ${currentPlayer}'s turn.`;
}

export function getResultMessage(winner: Player | null, isDraw: boolean, youAre?: Player): string | null {
  if (winner) {
    if (youAre) return winner === youAre ? "You win!" : "You lose.";
    return `Player ${winner} wins!`;
  }
  if (isDraw) return "It's a draw.";
  return null;
}
