//
// Players
//

export type Player = "B" | "W";

export function opponent(player: Player): Player {
    return player === "B" ? "W" : "B";
}

//
// Positions
//

export type Position = {
    row: number;
    col: number;
};

export function positionsEqual(left: Position, right: Position): boolean {
    return left.row === right.row && left.col === right.col;
}

export function positionKey(position: Position): string {
    return `${position.row},${position.col}`;
}

//
// Board
//

export type Cell = Player | ".";

const BOARD_SIZE = 8;
const EMPTY: Cell = ".";

export function boardSize(): number {
    return BOARD_SIZE;
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
// Game State
//

export type GameState = {
    board: Cell[][];
    current: Player;
};

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
        let row = position.row + direction.rowOffset;
        let col = position.col + direction.colOffset;

        while (isInside(row, col) && board[row][col] === other) {
            line.push({ row, col });
            row += direction.rowOffset;
            col += direction.colOffset;
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
