export type Player = "B" | "W";
export type Cell = Player | ".";

export type Position = {
  row: number;
  col: number;
};

export type MoveResult =
  | { ok: true; game: GameState; flipped: Position[] }
  | { ok: false; reason: string };

export type GameState = {
  board: Cell[][];
  current: Player;
};

export type RenderBoardOptions = {
  moves?: Position[];
  graphical?: boolean;
};

const BOARD_SIZE = 8;
const EMPTY: Cell = ".";
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
  const board = Array.from({ length: BOARD_SIZE }, () =>
    Array.from<Cell>({ length: BOARD_SIZE }).fill(EMPTY)
  );

  board[3][3] = "W";
  board[3][4] = "B";
  board[4][3] = "B";
  board[4][4] = "W";

  return { board, current: "B" };
}

export function boardSize(): number {
  return BOARD_SIZE;
}

export function opponent(player: Player): Player {
  return player === "B" ? "W" : "B";
}

export function cloneBoard(board: Cell[][]): Cell[][] {
  return board.map((row) => [...row]);
}

export function isInside(row: number, col: number): boolean {
  return row >= 0 && row < BOARD_SIZE && col >= 0 && col < BOARD_SIZE;
}

export function flipsForMove(
  board: Cell[][],
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

export function legalMoves(board: Cell[][], player: Player): Position[] {
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

export function countPieces(board: Cell[][]): Record<Player, number> {
  const counts: Record<Player, number> = { B: 0, W: 0 };

  for (const row of board) {
    for (const cell of row) {
      if (cell === "B" || cell === "W") {
        counts[cell] += 1;
      }
    }
  }

  return counts;
}

export function isGameOver(board: Cell[][]): boolean {
  return legalMoves(board, "B").length === 0 && legalMoves(board, "W").length === 0;
}

export function winner(board: Cell[][]): Player | "draw" {
  const counts = countPieces(board);
  if (counts.B > counts.W) return "B";
  if (counts.W > counts.B) return "W";
  return "draw";
}

export function parseMove(input: string): Position | null {
  const text = input.trim().toLowerCase();
  const algebraic = /^([a-h])([1-8])$/.exec(text);
  if (algebraic) {
    return {
      col: algebraic[1].charCodeAt(0) - "a".charCodeAt(0),
      row: Number(algebraic[2]) - 1
    };
  }

  const numeric = /^([1-8])\s*,?\s*([1-8])$/.exec(text);
  if (numeric) {
    return {
      row: Number(numeric[1]) - 1,
      col: Number(numeric[2]) - 1
    };
  }

  return null;
}

export function formatMove(move: Position): string {
  return `${String.fromCharCode("a".charCodeAt(0) + move.col)}${move.row + 1}`;
}

function renderCell(cell: Cell, isLegalMove: boolean, graphical: boolean): string {
  if (!graphical) {
    if (cell !== EMPTY) return cell;
    return isLegalMove ? "*" : ".";
  }

  if (cell === "B") return "●";
  if (cell === "W") return "○";
  return isLegalMove ? "+" : "·";
}

export function renderBoard(
  board: Cell[][],
  movesOrOptions: Position[] | RenderBoardOptions = []
): string {
  const options = Array.isArray(movesOrOptions)
    ? { moves: movesOrOptions, graphical: false }
    : movesOrOptions;
  const moves = options.moves ?? [];
  const graphical = options.graphical ?? false;
  const moveKeys = new Set(moves.map((move) => `${move.row},${move.col}`));

  if (!graphical) {
    const lines = ["  a b c d e f g h"];

    for (let row = 0; row < BOARD_SIZE; row += 1) {
      const cells = board[row].map((cell, col) =>
        renderCell(cell, moveKeys.has(`${row},${col}`), false)
      );
      lines.push(`${row + 1} ${cells.join(" ")}`);
    }

    return lines.join("\n");
  }

  const lines = [
    "    a b c d e f g h",
    "  ┌─────────────────┐"
  ];

  for (let row = 0; row < BOARD_SIZE; row += 1) {
    const cells = board[row].map((cell, col) =>
      renderCell(cell, moveKeys.has(`${row},${col}`), true)
    );
    lines.push(`${row + 1} │ ${cells.join(" ")} │`);
  }

  lines.push("  └─────────────────┘");
  return lines.join("\n");
}
