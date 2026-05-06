#!/usr/bin/env node
import { createInterface } from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import {
  applyMove,
  countPieces,
  createInitialGame,
  formatMove,
  isGameOver,
  legalMoves,
  parseMove,
  renderBoard,
  winner,
  type GameState,
  type Player
} from "./game.ts";

function playerName(player: Player): string {
  return player === "B" ? "Black (B)" : "White (W)";
}

function status(game: GameState): string {
  const counts = countPieces(game.board);
  const moves = legalMoves(game.board, game.current);

  return [
    renderBoard(game.board, moves),
    "",
    `Turn: ${playerName(game.current)}`,
    `Score: B ${counts.B} - W ${counts.W}`,
    `Legal moves: ${moves.map(formatMove).join(", ") || "none"}`
  ].join("\n");
}

async function main(): Promise<void> {
  const rl = createInterface({ input, output });
  let game = createInitialGame();

  console.log("Reversi CLI");
  console.log("Enter moves like d3 or 3 4. Enter q to quit.");

  try {
    while (!isGameOver(game.board)) {
      console.log("");
      console.log(status(game));

      const answer = await rl.question("> ");
      const trimmed = answer.trim().toLowerCase();

      if (trimmed === "q" || trimmed === "quit" || trimmed === "exit") {
        console.log("Bye.");
        return;
      }

      const move = parseMove(answer);
      if (!move) {
        console.log("Use a square like d3, or row and column like 3 4.");
        continue;
      }

      const result = applyMove(game, move);
      if (!result.ok) {
        console.log(result.reason);
        continue;
      }

      if (result.game.current === game.current) {
        const skipped = game.current === "B" ? "White" : "Black";
        console.log(`${skipped} has no legal moves. ${playerName(game.current)} moves again.`);
      }

      game = result.game;
    }
  } finally {
    rl.close();
  }

  console.log("");
  console.log(renderBoard(game.board));
  const counts = countPieces(game.board);
  const result = winner(game.board);
  console.log(`Final score: B ${counts.B} - W ${counts.W}`);
  console.log(result === "draw" ? "Draw." : `${playerName(result)} wins.`);
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
