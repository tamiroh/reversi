import assert from "node:assert/strict";
import test from "node:test";
import { chooseCpuPlacement } from "./cpu.ts";
import {
    placeDisc,
    createInitialGame,
    legalDiscPlacements,
    positionsEqual,
    type GameState,
} from "./game.ts";

test("CPU chooses a legal square", () => {
    const game = createInitialGame();
    const cpuPosition = chooseCpuPlacement(game);

    assert.ok(cpuPosition);
    assert.ok(
        legalDiscPlacements(game.board, game.current).some((position) =>
            positionsEqual(position, cpuPosition),
        ),
    );
});

test("CPU prefers an available corner", () => {
    const game: GameState = {
        current: "B",
        board: [
            [".", "W", "B", "B", "B", "B", "B", "B"],
            ["B", "W", ".", ".", ".", ".", ".", "."],
            ["B", ".", ".", ".", ".", ".", ".", "."],
            ["B", ".", ".", ".", ".", ".", ".", "."],
            ["B", ".", ".", ".", ".", ".", ".", "."],
            ["B", ".", ".", ".", ".", ".", ".", "."],
            ["B", ".", ".", ".", ".", ".", ".", "."],
            ["B", ".", ".", ".", ".", ".", ".", "."],
        ],
    };

    const cpuPosition = chooseCpuPlacement(game);

    assert.ok(cpuPosition);
    assert.deepEqual(cpuPosition, { row: 0, col: 0 });
});

test("CPU placement can be applied to the game", () => {
    const game = createInitialGame();
    const cpuPosition = chooseCpuPlacement(game);
    assert.ok(cpuPosition);

    const result = placeDisc(game, cpuPosition);
    assert.equal(result.ok, true);
});
