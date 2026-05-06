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
    const cpuPlacement = chooseCpuPlacement(game);

    assert.ok(cpuPlacement);
    assert.ok(
        legalDiscPlacements(game.board, game.current).some((position) =>
            positionsEqual(position, cpuPlacement.position),
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

    const cpuPlacement = chooseCpuPlacement(game);

    assert.ok(cpuPlacement);
    assert.deepEqual(cpuPlacement.position, { row: 0, col: 0 });
});

test("CPU placement can be applied to the game", () => {
    const game = createInitialGame();
    const cpuPlacement = chooseCpuPlacement(game);
    assert.ok(cpuPlacement);

    const result = placeDisc(game, cpuPlacement.position);
    assert.equal(result.ok, true);
});
