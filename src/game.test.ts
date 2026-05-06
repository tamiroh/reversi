import assert from "node:assert/strict";
import test from "node:test";
import {
  placeDisc,
  createInitialGame,
  formatBoardPosition,
  legalDiscPlacements,
  parseBoardPosition
} from "./game.ts";

test("initial board has four legal squares for black", () => {
  const game = createInitialGame();
  const legalPositions = legalDiscPlacements(game.board, game.current)
    .map(formatBoardPosition)
    .sort();

  assert.deepEqual(legalPositions, ["c4", "d3", "e6", "f5"]);
});

test("placing a disc flips enclosed discs and changes turn", () => {
  const game = createInitialGame();
  const position = parseBoardPosition("d3");
  assert.ok(position);

  const result = placeDisc(game, position);
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

test("parses algebraic and numeric board positions", () => {
  assert.deepEqual(parseBoardPosition("a1"), { row: 0, col: 0 });
  assert.deepEqual(parseBoardPosition("H8"), { row: 7, col: 7 });
  assert.deepEqual(parseBoardPosition("3 4"), { row: 2, col: 3 });
  assert.deepEqual(parseBoardPosition("3,4"), { row: 2, col: 3 });
  assert.equal(parseBoardPosition("z9"), null);
});
