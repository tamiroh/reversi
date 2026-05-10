import {
    type FixedLengthArray,
    type IntegerRangeFromZero,
} from "./type-utils.ts";

//
// Players
//

export type Player = "B" | "W";

export function opponent(player: Player): Player {
    return player === "B" ? "W" : "B";
}

//
// Board
//

export type Cell = Player | ".";

const BOARD_SIZE = 8;
const EMPTY: Cell = ".";

export type BoardIndex = IntegerRangeFromZero<typeof BOARD_SIZE>;
export type BoardGrid<Item> = FixedLengthArray<
    FixedLengthArray<Item, typeof BOARD_SIZE>,
    typeof BOARD_SIZE
>;
export type BoardRow = FixedLengthArray<Cell, typeof BOARD_SIZE>;
export type Board = BoardGrid<Cell>;

function isBoardIndex(value: number): value is BoardIndex {
    return Number.isInteger(value) && value >= 0 && value < BOARD_SIZE;
}

const BOARD_INDEXES = Array.from(
    { length: BOARD_SIZE },
    (_, index): BoardIndex => {
        if (!isBoardIndex(index)) {
            throw new Error(`Invalid board index: ${index}`);
        }

        return index;
    },
);

function createBoard(rows: Cell[][]): Board {
    if (
        rows.length !== BOARD_SIZE ||
        rows.some((row) => row.length !== BOARD_SIZE)
    ) {
        throw new Error("Board must be 8x8.");
    }

    return rows as Board;
}

function createEmptyBoard(): Board {
    return createBoard(BOARD_INDEXES.map(() => BOARD_INDEXES.map(() => EMPTY)));
}

export function cloneBoard(board: Board): Board {
    return createBoard(board.map((row) => [...row]));
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
// Positions
//

export type Position = {
    row: BoardIndex;
    col: BoardIndex;
};

export function positionAt(row: number, col: number): Position | null {
    if (!isBoardIndex(row) || !isBoardIndex(col)) {
        return null;
    }

    return { row, col };
}

export function positionsEqual(left: Position, right: Position): boolean {
    return left.row === right.row && left.col === right.col;
}

export function positionKey(position: Position): string {
    return `${position.row},${position.col}`;
}

export function isInside(row: number, col: number): boolean {
    return positionAt(row, col) !== null;
}

//
// Game State
//

export type GameState = {
    board: Board;
    current: Player;
};

export function createInitialGame(): GameState {
    const board = createEmptyBoard();

    board[3][3] = "W";
    board[3][4] = "B";
    board[4][3] = "B";
    board[4][4] = "W";

    return { board, current: "B" };
}

//
// Disc Placement
//

export type DiscPlacementResult =
    | { ok: true; game: GameState; flipped: Position[] }
    | { ok: false; reason: string };

const DIRECTIONS = [
    { rowOffset: -1, colOffset: -1 },
    { rowOffset: -1, colOffset: 0 },
    { rowOffset: -1, colOffset: 1 },
    { rowOffset: 0, colOffset: -1 },
    { rowOffset: 0, colOffset: 1 },
    { rowOffset: 1, colOffset: -1 },
    { rowOffset: 1, colOffset: 0 },
    { rowOffset: 1, colOffset: 1 },
];

export function discPositionsFlippedByPlacement(
    board: Board,
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
        let next = positionAt(
            position.row + direction.rowOffset,
            position.col + direction.colOffset,
        );

        while (next && board[next.row][next.col] === other) {
            line.push(next);
            next = positionAt(
                next.row + direction.rowOffset,
                next.col + direction.colOffset,
            );
        }

        if (line.length > 0 && next && board[next.row][next.col] === player) {
            allFlips.push(...line);
        }
    }

    return allFlips;
}

export function legalDiscPlacements(board: Board, player: Player): Position[] {
    const positions: Position[] = [];

    for (const row of BOARD_INDEXES) {
        for (const col of BOARD_INDEXES) {
            if (
                discPositionsFlippedByPlacement(board, player, { row, col })
                    .length > 0
            ) {
                positions.push({ row, col });
            }
        }
    }

    return positions;
}

export function placeDisc(
    game: GameState,
    position: Position,
): DiscPlacementResult {
    const flips = discPositionsFlippedByPlacement(
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

export function isGameOver(board: Board): boolean {
    return (
        legalDiscPlacements(board, "B").length === 0 &&
        legalDiscPlacements(board, "W").length === 0
    );
}

export function winner(board: Board): Player | "draw" {
    const counts = countDiscsByPlayer(board);
    if (counts.B > counts.W) return "B";
    if (counts.W > counts.B) return "W";
    return "draw";
}
