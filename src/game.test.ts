import assert from "node:assert/strict";
import test from "node:test";
import { formatMove, parseMove } from "./board.ts";
import { applyMove, createInitialGame, legalMoves } from "./game.ts";

test("initial board has four legal moves for black", () => {
  const game = createInitialGame();
  const moves = legalMoves(game.board, game.current).map(formatMove).sort();

  assert.deepEqual(moves, ["c4", "d3", "e6", "f5"]);
});

test("applying a move flips enclosed pieces and changes turn", () => {
  const game = createInitialGame();
  const move = parseMove("d3");
  assert.ok(move);

  const result = applyMove(game, move);
  assert.equal(result.ok, true);

  if (result.ok) {
    assert.equal(result.game.board[2][3], "B");
    assert.equal(result.game.board[3][3], "B");
    assert.equal(result.game.current, "W");
    assert.deepEqual(result.flipped, [{ row: 3, col: 3 }]);
  }
});

test("rejects illegal moves", () => {
  const game = createInitialGame();
  const result = applyMove(game, { row: 0, col: 0 });

  assert.equal(result.ok, false);
});
