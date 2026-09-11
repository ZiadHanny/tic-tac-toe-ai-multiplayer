import { applyMove, checkWinner, getAvailableMoves, isDraw, otherPlayer } from "./board";
import type { Board, Difficulty, Player } from "./types";

/**
 * Minimax with alpha-beta pruning. Score favors faster wins and slower
 * losses (10 - depth / depth - 10) so the AI prefers to win sooner and
 * delay a loss as long as possible, rather than being indifferent between
 * a win-in-1 and a win-in-5.
 *
 * `maxDepth` caps how many plies ahead the search looks; below that cutoff
 * unresolved positions score as a neutral draw (0). Tic-tac-toe's search
 * space is tiny (at most 9! nodes, far fewer once terminal states prune
 * branches), so a real heuristic evaluation isn't needed — the cutoff
 * exists purely to make "medium" a weaker, beatable opponent.
 */
function minimax(
  board: Board,
  currentPlayer: Player,
  aiPlayer: Player,
  depth: number,
  alpha: number,
  beta: number,
  maxDepth: number,
): number {
  const result = checkWinner(board);
  if (result) {
    return result.winner === aiPlayer ? 10 - depth : depth - 10;
  }
  if (isDraw(board)) return 0;
  if (depth >= maxDepth) return 0;

  const moves = getAvailableMoves(board);
  const maximizing = currentPlayer === aiPlayer;
  let best = maximizing ? -Infinity : Infinity;

  for (const move of moves) {
    const next = applyMove(board, move, currentPlayer);
    const score = minimax(next, otherPlayer(currentPlayer), aiPlayer, depth + 1, alpha, beta, maxDepth);

    if (maximizing) {
      best = Math.max(best, score);
      alpha = Math.max(alpha, score);
    } else {
      best = Math.min(best, score);
      beta = Math.min(beta, score);
    }
    if (beta <= alpha) break;
  }

  return best;
}

/**
 * The strongest move(s) for `aiPlayer` given `maxDepth` plies of lookahead.
 * Ties are broken randomly so a full-depth ("hard") AI stays unbeatable
 * without always playing the exact same opening move.
 */
export function getBestMove(board: Board, aiPlayer: Player, maxDepth: number = Infinity): number {
  const moves = getAvailableMoves(board);
  if (moves.length === 0) {
    throw new Error("No available moves");
  }

  let bestScore = -Infinity;
  let bestMoves: number[] = [];

  for (const move of moves) {
    const next = applyMove(board, move, aiPlayer);
    const score = minimax(next, otherPlayer(aiPlayer), aiPlayer, 1, -Infinity, Infinity, maxDepth);
    if (score > bestScore) {
      bestScore = score;
      bestMoves = [move];
    } else if (score === bestScore) {
      bestMoves.push(move);
    }
  }

  return bestMoves[Math.floor(Math.random() * bestMoves.length)];
}

/**
 * The move the AI should play for a given difficulty:
 * - easy: mostly random, occasionally plays well — loses often.
 * - medium: shallow minimax that sometimes blunders — beatable but not easy.
 * - hard: full-depth minimax — provably unbeatable, worst case is a draw.
 */
export function getAiMove(board: Board, aiPlayer: Player, difficulty: Difficulty): number {
  const moves = getAvailableMoves(board);
  if (moves.length === 0) {
    throw new Error("No available moves");
  }

  const randomMove = () => moves[Math.floor(Math.random() * moves.length)];

  switch (difficulty) {
    case "easy":
      return Math.random() < 0.7 ? randomMove() : getBestMove(board, aiPlayer, 2);
    case "medium":
      return Math.random() < 0.15 ? randomMove() : getBestMove(board, aiPlayer, 3);
    case "hard":
      return getBestMove(board, aiPlayer, Infinity);
  }
}
