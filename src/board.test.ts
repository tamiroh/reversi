import assert from "node:assert/strict";
import test from "node:test";
import {
  createEmptyBoard,
  formatMove,
  parseMove,
  renderBoard
} from "./board.ts";

test("parses algebraic and numeric move input", () => {
  assert.deepEqual(parseMove("a1"), { row: 0, col: 0 });
  assert.deepEqual(parseMove("H8"), { row: 7, col: 7 });
  assert.deepEqual(parseMove("3 4"), { row: 2, col: 3 });
  assert.deepEqual(parseMove("3,4"), { row: 2, col: 3 });
  assert.equal(parseMove("z9"), null);
});

test("formats move coordinates", () => {
  assert.equal(formatMove({ row: 0, col: 0 }), "a1");
  assert.equal(formatMove({ row: 7, col: 7 }), "h8");
});

test("renders a board with legal move markers", () => {
  const board = createEmptyBoard();
  board[3][3] = "W";
  board[3][4] = "B";

  const rendered = renderBoard(board, [{ row: 2, col: 3 }]);

  assert.match(rendered, /d/);
  assert.match(rendered, /\*/);
  assert.match(rendered, /W B/);
});
