import assert from "node:assert/strict";
import test from "node:test";
import { chooseAiMove } from "./ai.ts";
import { applyMove, createInitialGame, formatMove, legalMoves, type GameState } from "./game.ts";

test("AI chooses a legal move", () => {
  const game = createInitialGame();
  const aiMove = chooseAiMove(game);

  assert.ok(aiMove);
  assert.ok(legalMoves(game.board, game.current).some((move) => formatMove(move) === formatMove(aiMove.move)));
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
      ["B", ".", ".", ".", ".", ".", ".", "."]
    ]
  };

  const aiMove = chooseAiMove(game);

  assert.ok(aiMove);
  assert.equal(formatMove(aiMove.move), "a1");
});

test("AI move can be applied to the game", () => {
  const game = createInitialGame();
  const aiMove = chooseAiMove(game);
  assert.ok(aiMove);

  const result = applyMove(game, aiMove.move);
  assert.equal(result.ok, true);
});
