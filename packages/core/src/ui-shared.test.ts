import assert from "node:assert/strict";
import test from "node:test";
import { createInitialGame, placeDisc, type GameState } from "./game.ts";
import {
    formatBoardPosition,
    isQuitInput,
    parseBoardPosition,
    placementMessage,
} from "./ui-shared.ts";

//
// Board Position Input
//

test("parses algebraic board positions", () => {
    assert.deepEqual(parseBoardPosition("d3"), { row: 2, col: 3 });
    assert.deepEqual(parseBoardPosition(" H8 "), { row: 7, col: 7 });
});

test("parses numeric board positions", () => {
    assert.deepEqual(parseBoardPosition("3 4"), { row: 2, col: 3 });
    assert.deepEqual(parseBoardPosition("3,4"), { row: 2, col: 3 });
});

test("rejects invalid board positions", () => {
    assert.equal(parseBoardPosition("i1"), null);
    assert.equal(parseBoardPosition("a9"), null);
    assert.equal(parseBoardPosition("0 1"), null);
    assert.equal(parseBoardPosition("hello"), null);
});

test("formats board positions", () => {
    assert.equal(formatBoardPosition({ row: 2, col: 3 }), "d3");
    assert.equal(formatBoardPosition({ row: 7, col: 7 }), "h8");
});

//
// Commands
//

test("detects quit input", () => {
    assert.equal(isQuitInput("q"), true);
    assert.equal(isQuitInput(" QUIT "), true);
    assert.equal(isQuitInput("exit"), true);
    assert.equal(isQuitInput("d3"), false);
});

//
// Placement Messages
//

test("formats placement messages", () => {
    const game = createInitialGame();
    const position = { row: 2, col: 3 } as const;
    const result = placeDisc(game, position);
    assert.equal(result.ok, true);

    if (result.ok) {
        assert.equal(
            placementMessage(
                game,
                result.game,
                position,
                result.flipped.length,
            ),
            "Black (●) placed at d3 and flipped 1.",
        );
    }
});

test("formats skipped-player placement messages", () => {
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
    const position = { row: 0, col: 0 } as const;
    const result = placeDisc(game, position);
    assert.equal(result.ok, true);

    if (result.ok) {
        assert.equal(
            placementMessage(
                game,
                result.game,
                position,
                result.flipped.length,
            ),
            "White (○) has no legal squares. Black (●) places again.",
        );
    }
});
