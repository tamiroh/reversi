import {
    BLACK_PLAYER,
    type Board,
    type Cell,
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
import { blink, clearScreen, colorize, writeTerminal } from "./terminal.ts";

//
// Terminal UI
//

const HUMAN_PLAYER: Player = BLACK_PLAYER;
const CPU_PLAYER: Player = WHITE_PLAYER;
const EMPTY: Cell = ".";

type RenderBoardOptions = {
    legalPositions?: Position[];
    highlightedPositions?: Position[];
    graphical?: boolean;
};

function playerName(player: Player): string {
    return player === BLACK_PLAYER ? "Black (●)" : "White (○)";
}

function actorName(player: Player): string {
    if (player === HUMAN_PLAYER) return "You (●)";
    if (player === CPU_PLAYER) return "CPU (○)";
    return playerName(player);
}

function renderCell(
    cell: Cell,
    isLegalPosition: boolean,
    isHighlighted: boolean,
    graphical: boolean,
): string {
    if (!graphical) {
        if (cell !== EMPTY) return isHighlighted ? colorize(cell, "93") : cell;
        return isLegalPosition ? blink("*") : ".";
    }

    if (cell === BLACK_PLAYER) return isHighlighted ? colorize("●", "93") : "●";
    if (cell === WHITE_PLAYER) return isHighlighted ? colorize("○", "93") : "○";
    return isLegalPosition ? blink("+") : "·";
}

function renderLargeCell(
    cell: Cell,
    isLegalPosition: boolean,
    isHighlighted: boolean,
): string {
    if (cell === BLACK_PLAYER)
        return ` ${isHighlighted ? colorize("●", "93") : "●"} `;
    if (cell === WHITE_PLAYER)
        return ` ${isHighlighted ? colorize("○", "93") : "○"} `;
    return isLegalPosition ? ` ${blink("+")} ` : "   ";
}

function positionKeySetHas(
    positionKeys: Set<string>,
    position: Position,
): boolean {
    return positionKeys.has(positionKey(position));
}

function renderBoard(
    board: Board,
    positionsOrOptions: Position[] | RenderBoardOptions = [],
): string {
    const options = Array.isArray(positionsOrOptions)
        ? { legalPositions: positionsOrOptions, graphical: false }
        : positionsOrOptions;
    const legalPositions = options.legalPositions ?? [];
    const highlightedPositionKeys = new Set(
        (options.highlightedPositions ?? []).map(positionKey),
    );
    const graphical = options.graphical ?? false;
    const legalPositionKeys = new Set(legalPositions.map(positionKey));

    if (!graphical) {
        const lines = ["  a b c d e f g h"];

        for (const row of boardPositions()) {
            const cells = row.map((position) =>
                renderCell(
                    board[position.row][position.col],
                    positionKeySetHas(legalPositionKeys, position),
                    positionKeySetHas(highlightedPositionKeys, position),
                    false,
                ),
            );
            lines.push(`${row[0].row + 1} ${cells.join(" ")}`);
        }

        return lines.join("\n");
    }

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
            graphical: true,
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
    return renderBoard(game.board, { graphical: true });
}

export function renderGameResult(game: GameState): void {
    clearScreen();

    console.log(renderFinalBoard(game));
    const counts = countDiscsByPlayer(game.board);
    const result = winner(game.board);
    console.log(`Final score: ● ${counts.B} - ○ ${counts.W}`);
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
