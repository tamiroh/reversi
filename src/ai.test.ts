import assert from "node:assert/strict";
import test from "node:test";
import { chooseAiPlacement } from "./ai.ts";
import {
    placeDisc,
    createInitialGame,
    legalDiscPlacements,
    positionsEqual,
    type GameState,
} from "./game.ts";

test("AI chooses a legal square", () => {
    const game = createInitialGame();
    const aiPlacement = chooseAiPlacement(game);

    assert.ok(aiPlacement);
    assert.ok(
        legalDiscPlacements(game.board, game.current).some((position) =>
            positionsEqual(position, aiPlacement.position),
        ),
    );
});

test("AI prefers an available corner", () => {
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

    const aiPlacement = chooseAiPlacement(game);

    assert.ok(aiPlacement);
    assert.deepEqual(aiPlacement.position, { row: 0, col: 0 });
});

test("AI placement can be applied to the game", () => {
    const game = createInitialGame();
    const aiPlacement = chooseAiPlacement(game);
    assert.ok(aiPlacement);

    const result = placeDisc(game, aiPlacement.position);
    assert.equal(result.ok, true);
});
