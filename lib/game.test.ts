import assert from "node:assert/strict";
import test from "node:test";
import {
    placeDisc,
    createInitialGame,
    legalDiscPlacements,
    positionKey,
} from "./game.ts";

test("initial board has four legal squares for black", () => {
    const game = createInitialGame();
    const legalPositions = legalDiscPlacements(game.board, game.current)
        .map(positionKey)
        .sort();

    assert.deepEqual(legalPositions, ["2,3", "3,2", "4,5", "5,4"]);
});

test("placing a disc flips enclosed discs and changes turn", () => {
    const game = createInitialGame();
    const result = placeDisc(game, { row: 2, col: 3 });
    assert.equal(result.ok, true);

    if (result.ok) {
        assert.equal(result.game.board[2][3], "B");
        assert.equal(result.game.board[3][3], "B");
        assert.equal(result.game.current, "W");
        assert.deepEqual(result.flipped, [{ row: 3, col: 3 }]);
    }
});

test("rejects illegal placements", () => {
    const game = createInitialGame();
    const result = placeDisc(game, { row: 0, col: 0 });

    assert.equal(result.ok, false);
});
