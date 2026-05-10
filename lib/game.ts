import {
    type FixedLengthArray,
    type IntegerRangeFromZero,
} from "./type-utils.ts";

//
// Players
//

export const BLACK_PLAYER = "B";
export const WHITE_PLAYER = "W";
export const PLAYERS = [BLACK_PLAYER, WHITE_PLAYER] as const;

export type Player = (typeof PLAYERS)[number];

export function isPlayer(value: unknown): value is Player {
    return PLAYERS.includes(value as Player);
}

export function opponent(player: Player): Player {
    return player === BLACK_PLAYER ? WHITE_PLAYER : BLACK_PLAYER;
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

function createBoardGrid<Item>(rows: Item[][]): BoardGrid<Item> {
    if (
        rows.length !== BOARD_SIZE ||
        rows.some((row) => row.length !== BOARD_SIZE)
    ) {
        throw new Error("Board grid must be 8x8.");
    }

    return rows as BoardGrid<Item>;
}

function isCell(value: unknown): value is Cell {
    return isPlayer(value) || value === EMPTY;
}

function isCellRows(rows: unknown[][]): rows is Cell[][] {
    return rows.every((row) => row.every(isCell));
}

function createBoard(rows: unknown[][]): Board {
    if (!isCellRows(rows)) {
        throw new Error("Board contains an invalid cell.");
    }

    return createBoardGrid(rows);
}

function createEmptyBoard(): Board {
    return createBoard(BOARD_INDEXES.map(() => BOARD_INDEXES.map(() => EMPTY)));
}

export function cloneBoard(board: Board): Board {
    return createBoard(board.map((row) => [...row]));
}

export function countDiscsByPlayer(board: Board): Record<Player, number> {
    const counts: Record<Player, number> = {
        [BLACK_PLAYER]: 0,
        [WHITE_PLAYER]: 0,
    };

    for (const row of board) {
        for (const cell of row) {
            if (isPlayer(cell)) {
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

export function boardPositions(): BoardGrid<Position> {
    return createBoardGrid(
        BOARD_INDEXES.map((row) => BOARD_INDEXES.map((col) => ({ row, col }))),
    );
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

    board[3][3] = WHITE_PLAYER;
    board[3][4] = BLACK_PLAYER;
    board[4][3] = BLACK_PLAYER;
    board[4][4] = WHITE_PLAYER;

    return { board, current: BLACK_PLAYER };
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

    for (const row of boardPositions()) {
        for (const position of row) {
            if (
                discPositionsFlippedByPlacement(board, player, position)
                    .length > 0
            ) {
                positions.push(position);
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
        legalDiscPlacements(board, BLACK_PLAYER).length === 0 &&
        legalDiscPlacements(board, WHITE_PLAYER).length === 0
    );
}

export function winner(board: Board): Player | "draw" {
    const counts = countDiscsByPlayer(board);
    if (counts[BLACK_PLAYER] > counts[WHITE_PLAYER]) return BLACK_PLAYER;
    if (counts[WHITE_PLAYER] > counts[BLACK_PLAYER]) return WHITE_PLAYER;
    return "draw";
}
