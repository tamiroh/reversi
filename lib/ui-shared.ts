import {
    BLACK_PLAYER,
    WHITE_PLAYER,
    opponent,
    positionAt,
    type GameState,
    type Player,
    type Position,
} from "./game.ts";

//
// Player Labels
//

const PLAYER_MARKS: Record<Player, string> = {
    [BLACK_PLAYER]: "●",
    [WHITE_PLAYER]: "○",
};

const PLAYER_NAMES: Record<Player, string> = {
    [BLACK_PLAYER]: "Black",
    [WHITE_PLAYER]: "White",
};

export function playerMark(player: Player): string {
    return PLAYER_MARKS[player];
}

export function playerName(player: Player): string {
    return `${PLAYER_NAMES[player]} (${playerMark(player)})`;
}

//
// Board Position Text
//

export function formatBoardPosition(position: Position): string {
    return `${String.fromCharCode("a".charCodeAt(0) + position.col)}${position.row + 1}`;
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

//
// Commands
//

export function isQuitInput(input: string): boolean {
    const text = input.trim().toLowerCase();
    return text === "q" || text === "quit" || text === "exit";
}

//
// Placement Messages
//

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
