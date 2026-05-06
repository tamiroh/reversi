//
// Types
//

export type Player = "B" | "W";
export type Cell = Player | ".";

export type Position = {
  row: number;
  col: number;
};

export type Board = Cell[][];

export type RenderBoardOptions = {
  moves?: Position[];
  graphical?: boolean;
};

export const BOARD_SIZE = 8;
export const EMPTY: Cell = ".";

//
// Board Operations
//

export function createEmptyBoard(): Board {
  return Array.from({ length: BOARD_SIZE }, () =>
    Array.from<Cell>({ length: BOARD_SIZE }).fill(EMPTY)
  );
}

export function boardSize(): number {
  return BOARD_SIZE;
}

export function cloneBoard(board: Board): Board {
  return board.map((row) => [...row]);
}

export function isInside(row: number, col: number): boolean {
  return row >= 0 && row < BOARD_SIZE && col >= 0 && col < BOARD_SIZE;
}

export function countDiscsByPlayer(board: Board): Record<Player, number> {
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

//
// Move Coordinates
//

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

//
// Rendering
//

function renderCell(cell: Cell, isLegalMove: boolean, graphical: boolean): string {
  if (!graphical) {
    if (cell !== EMPTY) return cell;
    return isLegalMove ? "*" : ".";
  }

  if (cell === "B") return "●";
  if (cell === "W") return "○";
  return isLegalMove ? "+" : "·";
}

function renderLargeCell(cell: Cell, isLegalMove: boolean): string {
  if (cell === "B") return " ● ";
  if (cell === "W") return " ○ ";
  return isLegalMove ? " + " : "   ";
}

export function renderBoard(
  board: Board,
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
    "     a   b   c   d   e   f   g   h",
    "  ┌───┬───┬───┬───┬───┬───┬───┬───┐"
  ];

  for (let row = 0; row < BOARD_SIZE; row += 1) {
    const cells = board[row].map((cell, col) =>
      renderLargeCell(cell, moveKeys.has(`${row},${col}`))
    );
    lines.push(`${row + 1} │${cells.join("│")}│`);

    if (row < BOARD_SIZE - 1) {
      lines.push("  ├───┼───┼───┼───┼───┼───┼───┼───┤");
    }
  }

  lines.push("  └───┴───┴───┴───┴───┴───┴───┴───┘");
  return lines.join("\n");
}
