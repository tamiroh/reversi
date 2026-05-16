import {
    BLACK_PLAYER,
    type Board,
    type Cell,
    EMPTY_CELL,
    WHITE_PLAYER,
    boardPositions,
    countDiscsByPlayer,
    legalDiscPlacements,
    positionKey,
    winner,
    type GameState,
    type Player,
    type Position,
    CPU_PLAYER,
    HUMAN_PLAYER,
    playerMark,
    playerName,
} from "@reversi/core";
import { blink, clearScreen, colorize, writeTerminal } from "./terminal.ts";

//
// Terminal UI
//

type RenderBoardOptions = {
    legalPositions?: Position[];
    highlightedPositions?: Position[];
};

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
