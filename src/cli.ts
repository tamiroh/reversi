#!/usr/bin/env node
import { clearScreenDown, cursorTo } from "node:readline";
import { createInterface } from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import { chooseAiMove } from "./ai.ts";
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

const HUMAN_PLAYER: Player = "B";
const AI_PLAYER: Player = "W";

function playerName(player: Player): string {
  return player === "B" ? "Black (●)" : "White (○)";
}

function status(game: GameState): string {
  const counts = countPieces(game.board);
  const moves = legalMoves(game.board, game.current);

  return [
    renderBoard(game.board, {
      moves,
      graphical: true
    }),
    "",
    `Turn: ${playerName(game.current)}`,
    `Score: ● ${counts.B} - ○ ${counts.W}`,
    `Legal moves: ${moves.map(formatMove).join(", ") || "none"}`
  ].join("\n");
}

function screen(game: GameState, message?: string): string {
  return [
    "Reversi CLI",
    `You are ${playerName(HUMAN_PLAYER)}. CPU is ${playerName(AI_PLAYER)}.`,
    "Enter moves like d3 or 3 4. Legal moves are +. Enter q to quit.",
    "",
    status(game),
    "",
    message ? `Message: ${message}` : ""
  ].join("\n");
}

function render(game: GameState, message?: string): void {
  if (output.isTTY) {
    cursorTo(output, 0, 0);
    clearScreenDown(output);
  }

  output.write(`${screen(game, message)}\n`);
}

async function main(): Promise<void> {
  const rl = createInterface({ input, output });
  let game = createInitialGame();
  let message: string | undefined;

  try {
    while (!isGameOver(game.board)) {
      if (game.current === AI_PLAYER) {
        render(game, message ?? "CPU is thinking...");

        const aiMove = chooseAiMove(game);
        if (!aiMove) {
          throw new Error("CPU has no legal moves on its turn.");
        }

        const result = applyMove(game, aiMove.move);
        if (!result.ok) {
          throw new Error(`AI selected an illegal move: ${formatMove(aiMove.move)}`);
        }

        message = `CPU played ${formatMove(aiMove.move)} and flipped ${result.flipped.length}.`;
        game = result.game;
        continue;
      }

      render(game, message);

      const answer = await rl.question("Move> ");
      const trimmed = answer.trim().toLowerCase();

      if (trimmed === "q" || trimmed === "quit" || trimmed === "exit") {
        if (output.isTTY) {
          cursorTo(output, 0, 0);
          clearScreenDown(output);
        }
        console.log("Bye.");
        return;
      }

      const move = parseMove(answer);
      if (!move) {
        message = "Use a square like d3, or row and column like 3 4.";
        continue;
      }

      const result = applyMove(game, move);
      if (!result.ok) {
        message = result.reason;
        continue;
      }

      if (result.game.current === game.current) {
        const skipped = game.current === "B" ? "White" : "Black";
        message = `${skipped} has no legal moves. ${playerName(game.current)} moves again.`;
      } else {
        message = `${playerName(game.current)} played ${formatMove(move)} and flipped ${result.flipped.length}.`;
      }

      game = result.game;
    }
  } finally {
    rl.close();
  }

  if (output.isTTY) {
    cursorTo(output, 0, 0);
    clearScreenDown(output);
  }

  console.log(renderBoard(game.board, { graphical: true }));
  const counts = countPieces(game.board);
  const result = winner(game.board);
  console.log(`Final score: ● ${counts.B} - ○ ${counts.W}`);
  console.log(result === "draw" ? "Draw." : `${playerName(result)} wins.`);
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
