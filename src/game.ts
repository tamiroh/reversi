import {
  BOARD_SIZE,
  EMPTY,
  cloneBoard,
  countDiscsByPlayer,
  createEmptyBoard,
  isInside,
  type Board,
  type Player,
  type Position
} from "./board.ts";

export type MoveResult =
  | { ok: true; game: GameState; flipped: Position[] }
  | { ok: false; reason: string };

export type GameState = {
  board: Board;
  current: Player;
};

const DIRECTIONS: Position[] = [
  { row: -1, col: -1 },
  { row: -1, col: 0 },
  { row: -1, col: 1 },
  { row: 0, col: -1 },
  { row: 0, col: 1 },
  { row: 1, col: -1 },
  { row: 1, col: 0 },
  { row: 1, col: 1 }
];

export function createInitialGame(): GameState {
  const board = createEmptyBoard();

  board[3][3] = "W";
  board[3][4] = "B";
  board[4][3] = "B";
  board[4][4] = "W";

  return { board, current: "B" };
}

export function opponent(player: Player): Player {
  return player === "B" ? "W" : "B";
}

export function flipsForMove(
  board: Board,
  player: Player,
  move: Position
): Position[] {
  if (!isInside(move.row, move.col) || board[move.row][move.col] !== EMPTY) {
    return [];
  }

  const other = opponent(player);
  const allFlips: Position[] = [];

  for (const direction of DIRECTIONS) {
    const line: Position[] = [];
    let row = move.row + direction.row;
    let col = move.col + direction.col;

    while (isInside(row, col) && board[row][col] === other) {
      line.push({ row, col });
      row += direction.row;
      col += direction.col;
    }

    if (line.length > 0 && isInside(row, col) && board[row][col] === player) {
      allFlips.push(...line);
    }
  }

  return allFlips;
}

export function legalMoves(board: Board, player: Player): Position[] {
  const moves: Position[] = [];

  for (let row = 0; row < BOARD_SIZE; row += 1) {
    for (let col = 0; col < BOARD_SIZE; col += 1) {
      if (flipsForMove(board, player, { row, col }).length > 0) {
        moves.push({ row, col });
      }
    }
  }

  return moves;
}

export function applyMove(game: GameState, move: Position): MoveResult {
  const flips = flipsForMove(game.board, game.current, move);

  if (flips.length === 0) {
    return { ok: false, reason: "Illegal move." };
  }

  const board = cloneBoard(game.board);
  board[move.row][move.col] = game.current;

  for (const flip of flips) {
    board[flip.row][flip.col] = game.current;
  }

  let next = opponent(game.current);
  if (legalMoves(board, next).length === 0 && legalMoves(board, game.current).length > 0) {
    next = game.current;
  }

  return {
    ok: true,
    game: { board, current: next },
    flipped: flips
  };
}

export function isGameOver(board: Board): boolean {
  return legalMoves(board, "B").length === 0 && legalMoves(board, "W").length === 0;
}

export function winner(board: Board): Player | "draw" {
  const counts = countDiscsByPlayer(board);
  if (counts.B > counts.W) return "B";
  if (counts.W > counts.B) return "W";
  return "draw";
}
