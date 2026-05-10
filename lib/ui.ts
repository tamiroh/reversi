import {
    BLACK_PLAYER,
    type Board,
    type Cell,
    EMPTY_CELL,
    WHITE_PLAYER,
    boardPositions,
    countDiscsByPlayer,
    legalDiscPlacements,
    opponent,
    positionAt,
    positionKey,
    winner,
    type GameState,
    type Player,
    type Position,
} from "./game.ts";
import { CPU_PLAYER, HUMAN_PLAYER } from "./player-roles.ts";
import { blink, clearScreen, colorize, writeTerminal } from "./terminal.ts";

//
// Terminal UI
//

const PLAYER_MARKS: Record<Player, string> = {
    [BLACK_PLAYER]: "●",
    [WHITE_PLAYER]: "○",
};

const PLAYER_NAMES: Record<Player, string> = {
    [BLACK_PLAYER]: "Black",
    [WHITE_PLAYER]: "White",
};

type RenderBoardOptions = {
    legalPositions?: Position[];
    highlightedPositions?: Position[];
};

function playerMark(player: Player): string {
    return PLAYER_MARKS[player];
}

function playerName(player: Player): string {
    return `${PLAYER_NAMES[player]} (${playerMark(player)})`;
}

function actorName(player: Player): string {
    if (player === HUMAN_PLAYER) return `You (${playerMark(player)})`;
    if (player === CPU_PLAYER) return `CPU (${playerMark(player)})`;
    return playerName(player);
}

function renderPlayerMark(player: Player, isHighlighted: boolean): string {
    const mark = playerMark(player);
    return isHighlighted ? colorize(mark, "93") : mark;
}

function renderLargeCell(
    cell: Cell,
    isLegalPosition: boolean,
    isHighlighted: boolean,
): string {
    if (cell !== EMPTY_CELL)
        return ` ${renderPlayerMark(cell, isHighlighted)} `;
    return isLegalPosition ? ` ${blink("+")} ` : "   ";
}

function positionKeySetHas(
    positionKeys: Set<string>,
    position: Position,
): boolean {
    return positionKeys.has(positionKey(position));
}

function renderBoard(board: Board, options: RenderBoardOptions = {}): string {
    const legalPositions = options.legalPositions ?? [];
    const highlightedPositionKeys = new Set(
        (options.highlightedPositions ?? []).map(positionKey),
    );
    const legalPositionKeys = new Set(legalPositions.map(positionKey));

    const lines = [
        "     a   b   c   d   e   f   g   h",
        "  ┌───┬───┬───┬───┬───┬───┬───┬───┐",
    ];

    for (const row of boardPositions()) {
        const cells = row.map((position) =>
            renderLargeCell(
                board[position.row][position.col],
                positionKeySetHas(legalPositionKeys, position),
                positionKeySetHas(highlightedPositionKeys, position),
            ),
        );
        lines.push(`${row[0].row + 1} │${cells.join("│")}│`);

        if (row[0].row < board.length - 1) {
            lines.push("  ├───┼───┼───┼───┼───┼───┼───┼───┤");
        }
    }

    lines.push("  └───┴───┴───┴───┴───┴───┴───┴───┘");
    return lines.join("\n");
}

function screen(
    game: GameState,
    message?: string,
    highlightedPositions: Position[] = [],
): string {
    const legalPositions = legalDiscPlacements(game.board, game.current);

    return [
        "",
        renderBoard(game.board, {
            legalPositions,
            highlightedPositions,
        }),
        "",
        `Turn: ${actorName(game.current)}`,
        "",
        message ? message : "",
    ].join("\n");
}

export function renderGame(
    game: GameState,
    message?: string,
    highlightedPositions: Position[] = [],
): void {
    clearScreen();
    writeTerminal(`${screen(game, message, highlightedPositions)}\n`);
}

export function renderFinalBoard(game: GameState): string {
    return renderBoard(game.board);
}

export function renderGameResult(game: GameState): void {
    clearScreen();

    console.log(renderFinalBoard(game));
    const counts = countDiscsByPlayer(game.board);
    const result = winner(game.board);
    console.log(
        `Final score: ${playerMark(BLACK_PLAYER)} ${counts[BLACK_PLAYER]} - ${playerMark(WHITE_PLAYER)} ${counts[WHITE_PLAYER]}`,
    );
    console.log(result === "draw" ? "Draw." : `${playerName(result)} wins.`);
}

export function squarePrompt(): string {
    return `\n${colorize("Enter d3 or 3 4. q to quit.", "90")}\nSquare> `;
}

export function placementMessage(
    previousGame: GameState,
    nextGame: GameState,
    position: Position,
    flippedCount: number,
): string {
    if (nextGame.current === previousGame.current) {
        const skipped = playerName(opponent(previousGame.current));
        return `${skipped} has no legal squares. ${playerName(previousGame.current)} places again.`;
    }

    return `${playerName(previousGame.current)} placed at ${formatBoardPosition(position)} and flipped ${flippedCount}.`;
}

export function parseBoardPosition(input: string): Position | null {
    const text = input.trim().toLowerCase();
    const algebraic = /^([a-h])([1-8])$/.exec(text);
    if (algebraic) {
        return positionAt(
            Number(algebraic[2]) - 1,
            algebraic[1].charCodeAt(0) - "a".charCodeAt(0),
        );
    }

    const numeric = /^([1-8])\s*,?\s*([1-8])$/.exec(text);
    if (numeric) {
        return positionAt(Number(numeric[1]) - 1, Number(numeric[2]) - 1);
    }

    return null;
}

export function isQuitInput(input: string): boolean {
    const text = input.trim().toLowerCase();
    return text === "q" || text === "quit" || text === "exit";
}

export function formatBoardPosition(position: Position): string {
    return `${String.fromCharCode("a".charCodeAt(0) + position.col)}${position.row + 1}`;
}
