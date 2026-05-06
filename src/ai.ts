import {
  applyMove,
  legalMoves,
  opponent,
  type GameState
} from "./game.ts";
import {
  countDiscsByPlayer,
  type Position
} from "./board.ts";

export type AiMove = {
  move: Position;
  score: number;
};

const POSITION_WEIGHTS = [
  [120, -20, 20, 5, 5, 20, -20, 120],
  [-20, -40, -5, -5, -5, -5, -40, -20],
  [20, -5, 15, 3, 3, 15, -5, 20],
  [5, -5, 3, 3, 3, 3, -5, 5],
  [5, -5, 3, 3, 3, 3, -5, 5],
  [20, -5, 15, 3, 3, 15, -5, 20],
  [-20, -40, -5, -5, -5, -5, -40, -20],
  [120, -20, 20, 5, 5, 20, -20, 120]
];

function comparePositions(a: Position, b: Position): number {
  return a.row - b.row || a.col - b.col;
}

export function scoreMove(game: GameState, move: Position): number {
  const result = applyMove(game, move);
  if (!result.ok) {
    return Number.NEGATIVE_INFINITY;
  }

  const player = game.current;
  const other = opponent(player);
  const counts = countDiscsByPlayer(result.game.board);
  const pieceDifference = counts[player] - counts[other];
  const mobilityDifference =
    legalMoves(result.game.board, player).length - legalMoves(result.game.board, other).length;

  return (
    POSITION_WEIGHTS[move.row][move.col] +
    result.flipped.length * 8 +
    pieceDifference * 2 +
    mobilityDifference * 4
  );
}

export function chooseAiMove(game: GameState): AiMove | null {
  const moves = legalMoves(game.board, game.current);
  if (moves.length === 0) {
    return null;
  }

  return moves
    .map((move) => ({ move, score: scoreMove(game, move) }))
    .sort((a, b) => b.score - a.score || comparePositions(a.move, b.move))[0];
}
