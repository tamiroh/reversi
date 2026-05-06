//
// Types
//

export type Player = "B" | "W";
export type Cell = Player | ".";

export type Position = {
    row: number;
    col: number;
};

export type DiscPlacementResult =
    | { ok: true; game: GameState; flipped: Position[] }
    | { ok: false; reason: string };

export type GameState = {
    board: Cell[][];
    current: Player;
};

export type RenderBoardOptions = {
    legalPositions?: Position[];
    graphical?: boolean;
};

//
// Constants
//

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
    { row: 1, col: 1 },
];

//
// Game Setup
//

export function createInitialGame(): GameState {
    const board = Array.from({ length: BOARD_SIZE }, () =>
        Array.from<Cell>({ length: BOARD_SIZE }).fill(EMPTY),
    );

    board[3][3] = "W";
    board[3][4] = "B";
    board[4][3] = "B";
    board[4][4] = "W";

    return { board, current: "B" };
}

//
// Board Helpers
//

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

export function countDiscsByPlayer(board: Cell[][]): Record<Player, number> {
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
// Placement Rules
//

export function positionsFlippedByDiscPlacement(
    board: Cell[][],
    player: Player,
    position: Position,
): Position[] {
    if (
        !isInside(position.row, position.col) ||
        board[position.row][position.col] !== EMPTY
    ) {
        return [];
    }

    const other = opponent(player);
    const allFlips: Position[] = [];

    for (const direction of DIRECTIONS) {
        const line: Position[] = [];
        let row = position.row + direction.row;
        let col = position.col + direction.col;

        while (isInside(row, col) && board[row][col] === other) {
            line.push({ row, col });
            row += direction.row;
            col += direction.col;
        }

        if (
            line.length > 0 &&
            isInside(row, col) &&
            board[row][col] === player
        ) {
            allFlips.push(...line);
        }
    }

    return allFlips;
}

export function legalDiscPlacements(
    board: Cell[][],
    player: Player,
): Position[] {
    const positions: Position[] = [];

    for (let row = 0; row < BOARD_SIZE; row += 1) {
        for (let col = 0; col < BOARD_SIZE; col += 1) {
            if (
                positionsFlippedByDiscPlacement(board, player, { row, col })
                    .length > 0
            ) {
                positions.push({ row, col });
            }
        }
    }

    return positions;
}

//
// Game Flow
//

export function placeDisc(
    game: GameState,
    position: Position,
): DiscPlacementResult {
    const flips = positionsFlippedByDiscPlacement(
        game.board,
        game.current,
        position,
    );

    if (flips.length === 0) {
        return { ok: false, reason: "Illegal placement." };
    }

    const board = cloneBoard(game.board);
    board[position.row][position.col] = game.current;

    for (const flip of flips) {
        board[flip.row][flip.col] = game.current;
    }

    let next = opponent(game.current);
    if (
        legalDiscPlacements(board, next).length === 0 &&
        legalDiscPlacements(board, game.current).length > 0
    ) {
        next = game.current;
    }

    return {
        ok: true,
        game: { board, current: next },
        flipped: flips,
    };
}

//
// Game Result
//

export function isGameOver(board: Cell[][]): boolean {
    return (
        legalDiscPlacements(board, "B").length === 0 &&
        legalDiscPlacements(board, "W").length === 0
    );
}

export function winner(board: Cell[][]): Player | "draw" {
    const counts = countDiscsByPlayer(board);
    if (counts.B > counts.W) return "B";
    if (counts.W > counts.B) return "W";
    return "draw";
}

//
// Position Coordinates
//

export function parseBoardPosition(input: string): Position | null {
    const text = input.trim().toLowerCase();
    const algebraic = /^([a-h])([1-8])$/.exec(text);
    if (algebraic) {
        return {
            col: algebraic[1].charCodeAt(0) - "a".charCodeAt(0),
            row: Number(algebraic[2]) - 1,
        };
    }

    const numeric = /^([1-8])\s*,?\s*([1-8])$/.exec(text);
    if (numeric) {
        return {
            row: Number(numeric[1]) - 1,
            col: Number(numeric[2]) - 1,
        };
    }

    return null;
}

export function formatBoardPosition(position: Position): string {
    return `${String.fromCharCode("a".charCodeAt(0) + position.col)}${position.row + 1}`;
}

//
// Rendering
//

function renderCell(
    cell: Cell,
    isLegalPosition: boolean,
    graphical: boolean,
): string {
    if (!graphical) {
        if (cell !== EMPTY) return cell;
        return isLegalPosition ? "*" : ".";
    }

    if (cell === "B") return "●";
    if (cell === "W") return "○";
    return isLegalPosition ? "+" : "·";
}

function renderLargeCell(cell: Cell, isLegalPosition: boolean): string {
    if (cell === "B") return " ● ";
    if (cell === "W") return " ○ ";
    return isLegalPosition ? " + " : "   ";
}

export function renderBoard(
    board: Cell[][],
    positionsOrOptions: Position[] | RenderBoardOptions = [],
): string {
    const options = Array.isArray(positionsOrOptions)
        ? { legalPositions: positionsOrOptions, graphical: false }
        : positionsOrOptions;
    const legalPositions = options.legalPositions ?? [];
    const graphical = options.graphical ?? false;
    const legalPositionKeys = new Set(
        legalPositions.map((position) => `${position.row},${position.col}`),
    );

    if (!graphical) {
        const lines = ["  a b c d e f g h"];

        for (let row = 0; row < BOARD_SIZE; row += 1) {
            const cells = board[row].map((cell, col) =>
                renderCell(cell, legalPositionKeys.has(`${row},${col}`), false),
            );
            lines.push(`${row + 1} ${cells.join(" ")}`);
        }

        return lines.join("\n");
    }

    const lines = [
        "     a   b   c   d   e   f   g   h",
        "  ┌───┬───┬───┬───┬───┬───┬───┬───┐",
    ];

    for (let row = 0; row < BOARD_SIZE; row += 1) {
        const cells = board[row].map((cell, col) =>
            renderLargeCell(cell, legalPositionKeys.has(`${row},${col}`)),
        );
        lines.push(`${row + 1} │${cells.join("│")}│`);

        if (row < BOARD_SIZE - 1) {
            lines.push("  ├───┼───┼───┼───┼───┼───┼───┼───┤");
        }
    }

    lines.push("  └───┴───┴───┴───┴───┴───┴───┴───┘");
    return lines.join("\n");
}
