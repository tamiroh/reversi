import assert from "node:assert/strict";
import test from "node:test";
import { formatBoardPosition, isQuitInput, parseBoardPosition } from "./ui.ts";

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
