import {
    placeDisc,
    countDiscsByPlayer,
    legalDiscPlacements,
    opponent,
    type BoardGrid,
    type GameState,
    type Position,
} from "./game.ts";

const POSITION_WEIGHTS = [
    [120, -20, 20, 5, 5, 20, -20, 120],
    [-20, -40, -5, -5, -5, -5, -40, -20],
    [20, -5, 15, 3, 3, 15, -5, 20],
    [5, -5, 3, 3, 3, 3, -5, 5],
    [5, -5, 3, 3, 3, 3, -5, 5],
    [20, -5, 15, 3, 3, 15, -5, 20],
    [-20, -40, -5, -5, -5, -5, -40, -20],
    [120, -20, 20, 5, 5, 20, -20, 120],
] satisfies BoardGrid<number>;

function comparePositions(a: Position, b: Position): number {
    return a.row - b.row || a.col - b.col;
}

function scoreDiscPlacement(game: GameState, position: Position): number {
    const result = placeDisc(game, position);
    if (!result.ok) {
        return Number.NEGATIVE_INFINITY;
    }

    const player = game.current;
    const other = opponent(player);
    const counts = countDiscsByPlayer(result.game.board);
    const pieceDifference = counts[player] - counts[other];
    const mobilityDifference =
        legalDiscPlacements(result.game.board, player).length -
        legalDiscPlacements(result.game.board, other).length;

    return (
        POSITION_WEIGHTS[position.row][position.col] +
        result.flipped.length * 8 +
        pieceDifference * 2 +
        mobilityDifference * 4
    );
}

export function chooseCpuPlacement(game: GameState): Position | null {
    const positions = legalDiscPlacements(game.board, game.current);
    if (positions.length === 0) {
        return null;
    }

    return positions
        .map((position) => ({
            position,
            score: scoreDiscPlacement(game, position),
        }))
        .sort(
            (a, b) =>
                b.score - a.score || comparePositions(a.position, b.position),
        )[0].position;
}
