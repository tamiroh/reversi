import assert from "node:assert/strict";
import test from "node:test";
import {
    placeDisc,
    createInitialGame,
    isGameOver,
    legalDiscPlacements,
    positionKey,
    winner,
    type GameState,
} from "./game.ts";

//
// Game Setup
//

test("initial board has four legal squares for black", () => {
    const game = createInitialGame();
    const legalPositions = legalDiscPlacements(game.board, game.current)
        .map(positionKey)
        .sort();

    assert.deepEqual(legalPositions, ["2,3", "3,2", "4,5", "5,4"]);
});

//
// Disc Placement
//

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

test("keeps the current player when the opponent has no legal squares", () => {
    const game: GameState = {
        current: "B",
        board: [
            [".", "W", "B", "B", "B", "B", "B", "B"],
            ["B", "W", "B", "B", "B", "B", "B", "B"],
            ["B", "B", ".", "B", "B", "B", "B", "B"],
            ["B", "B", "B", "B", "B", "B", "B", "B"],
            ["B", "B", "B", "B", "B", "B", "B", "B"],
            ["B", "B", "B", "B", "B", "B", "B", "B"],
            ["B", "B", "B", "B", "B", "B", "B", "B"],
            ["B", "B", "B", "B", "B", "B", "B", "B"],
        ],
    };

    const result = placeDisc(game, { row: 0, col: 0 });
    assert.equal(result.ok, true);

    if (result.ok) {
        assert.equal(result.game.current, "B");
        assert.deepEqual(result.flipped, [{ row: 0, col: 1 }]);
        assert.deepEqual(
            legalDiscPlacements(result.game.board, "W").map(positionKey),
            [],
        );
        assert.deepEqual(
            legalDiscPlacements(result.game.board, "B").map(positionKey),
            ["2,2"],
        );
    }
});

//
// Game Result
//

test("detects game over when neither player has legal squares", () => {
    const game: GameState = {
        current: "B",
        board: [
            ["B", "B", "B", "B", "B", "B", "B", "B"],
            ["B", "B", "B", "B", "B", "B", "B", "B"],
            ["B", "B", "B", "B", "B", "B", "B", "B"],
            ["B", "B", "B", "B", "B", "B", "B", "B"],
            ["B", "B", "B", "B", "B", "B", "B", "B"],
            ["B", "B", "B", "B", "B", "B", "B", "B"],
            ["B", "B", "B", "B", "B", "B", "B", "B"],
            ["B", "B", "B", "B", "B", "B", "B", "B"],
        ],
    };

    assert.equal(isGameOver(game.board), true);
    assert.equal(winner(game.board), "B");
});
