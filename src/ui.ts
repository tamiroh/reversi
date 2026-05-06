import { stdout as output } from "node:process";
import { clearScreenDown, cursorTo } from "node:readline";
import {
    type Cell,
    countDiscsByPlayer,
    legalDiscPlacements,
    positionKey,
    type GameState,
    type Player,
    type Position,
} from "./game.ts";

//
// Terminal UI
//

const HUMAN_PLAYER: Player = "B";
const AI_PLAYER: Player = "W";
const EMPTY: Cell = ".";

type RenderBoardOptions = {
    legalPositions?: Position[];
    highlightedPosition?: Position;
    graphical?: boolean;
};

function colorize(text: string, color: string): string {
    return output.isTTY ? `\x1b[${color}m${text}\x1b[0m` : text;
}

function blink(text: string): string {
    return output.isTTY ? `\x1b[5m${text}\x1b[0m` : text;
}

function playerName(player: Player): string {
    return player === "B" ? "Black (●)" : "White (○)";
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

    if (cell === "B") return isHighlighted ? colorize("●", "93") : "●";
    if (cell === "W") return isHighlighted ? colorize("○", "93") : "○";
    return isLegalPosition ? blink("+") : "·";
}

function renderLargeCell(
    cell: Cell,
    isLegalPosition: boolean,
    isHighlighted: boolean,
): string {
    if (cell === "B") return ` ${isHighlighted ? colorize("●", "93") : "●"} `;
    if (cell === "W") return ` ${isHighlighted ? colorize("○", "93") : "○"} `;
    return isLegalPosition ? ` ${blink("+")} ` : "   ";
}

function renderBoard(
    board: Cell[][],
    positionsOrOptions: Position[] | RenderBoardOptions = [],
): string {
    const options = Array.isArray(positionsOrOptions)
        ? { legalPositions: positionsOrOptions, graphical: false }
        : positionsOrOptions;
    const legalPositions = options.legalPositions ?? [];
    const highlightedPositionKey = options.highlightedPosition
        ? positionKey(options.highlightedPosition)
        : undefined;
    const graphical = options.graphical ?? false;
    const legalPositionKeys = new Set(legalPositions.map(positionKey));

    if (!graphical) {
        const lines = ["  a b c d e f g h"];

        for (let row = 0; row < board.length; row += 1) {
            const cells = board[row].map((cell, col) =>
                renderCell(
                    cell,
                    legalPositionKeys.has(positionKey({ row, col })),
                    highlightedPositionKey === positionKey({ row, col }),
                    false,
                ),
            );
            lines.push(`${row + 1} ${cells.join(" ")}`);
        }

        return lines.join("\n");
    }

    const lines = [
        "     a   b   c   d   e   f   g   h",
        "  ┌───┬───┬───┬───┬───┬───┬───┬───┐",
    ];

    for (let row = 0; row < board.length; row += 1) {
        const cells = board[row].map((cell, col) =>
            renderLargeCell(
                cell,
                legalPositionKeys.has(positionKey({ row, col })),
                highlightedPositionKey === positionKey({ row, col }),
            ),
        );
        lines.push(`${row + 1} │${cells.join("│")}│`);

        if (row < board.length - 1) {
            lines.push("  ├───┼───┼───┼───┼───┼───┼───┼───┤");
        }
    }

    lines.push("  └───┴───┴───┴───┴───┴───┴───┴───┘");
    return lines.join("\n");
}

function screen(
    game: GameState,
    message?: string,
    highlightedPosition?: Position,
): string {
    const counts = countDiscsByPlayer(game.board);
    const legalPositions = legalDiscPlacements(game.board, game.current);

    return [
        "",
        renderBoard(game.board, {
            legalPositions,
            highlightedPosition,
            graphical: true,
        }),
        "",
        `You are ${playerName(HUMAN_PLAYER)}. CPU is ${playerName(AI_PLAYER)}.`,
        "",
        `Turn: ${playerName(game.current)}`,
        `Score: ● ${counts.B} - ○ ${counts.W}`,
        "",
        message ? `Message: ${message}` : "",
    ].join("\n");
}

export function clearScreen(): void {
    if (output.isTTY) {
        cursorTo(output, 0, 0);
        clearScreenDown(output);
    }
}

export function renderGame(
    game: GameState,
    message?: string,
    highlightedPosition?: Position,
): void {
    clearScreen();
    output.write(`${screen(game, message, highlightedPosition)}\n`);
}

export function renderFinalBoard(game: GameState): string {
    return renderBoard(game.board, { graphical: true });
}

export function squarePrompt(): string {
    return `\n${colorize("Enter d3 or 3 4. q to quit.", "90")}\n\nSquare> `;
}

export function playerLabel(player: Player): string {
    return playerName(player);
}

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
