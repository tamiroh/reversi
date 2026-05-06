#!/usr/bin/env node
import { clearScreenDown, cursorTo } from "node:readline";
import { createInterface } from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import { chooseAiPlacement } from "./ai.ts";
import {
  placeDisc,
  countDiscsByPlayer,
  createInitialGame,
  formatBoardPosition,
  isGameOver,
  legalDiscPlacements,
  parseBoardPosition,
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
  const counts = countDiscsByPlayer(game.board);
  const legalPositions = legalDiscPlacements(game.board, game.current);

  return [
    renderBoard(game.board, {
      legalPositions,
      graphical: true
    }),
    "",
    `Turn: ${playerName(game.current)}`,
    `Score: ● ${counts.B} - ○ ${counts.W}`,
    `Legal squares: ${legalPositions.map(formatBoardPosition).join(", ") || "none"}`
  ].join("\n");
}

function screen(game: GameState, message?: string): string {
  return [
    "Reversi CLI",
    `You are ${playerName(HUMAN_PLAYER)}. CPU is ${playerName(AI_PLAYER)}.`,
    "Enter a square like d3 or 3 4. Legal squares are +. Enter q to quit.",
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

        const aiPlacement = chooseAiPlacement(game);
        if (!aiPlacement) {
          throw new Error("CPU has no legal squares on its turn.");
        }

        const result = placeDisc(game, aiPlacement.position);
        if (!result.ok) {
          throw new Error(`AI selected an illegal square: ${formatBoardPosition(aiPlacement.position)}`);
        }

        message = `CPU placed at ${formatBoardPosition(aiPlacement.position)} and flipped ${result.flipped.length}.`;
        game = result.game;
        continue;
      }

      render(game, message);

      const answer = await rl.question("Square> ");
      const trimmed = answer.trim().toLowerCase();

      if (trimmed === "q" || trimmed === "quit" || trimmed === "exit") {
        if (output.isTTY) {
          cursorTo(output, 0, 0);
          clearScreenDown(output);
        }
        console.log("Bye.");
        return;
      }

      const position = parseBoardPosition(answer);
      if (!position) {
        message = "Use a square like d3, or row and column like 3 4.";
        continue;
      }

      const result = placeDisc(game, position);
      if (!result.ok) {
        message = result.reason;
        continue;
      }

      if (result.game.current === game.current) {
        const skipped = game.current === "B" ? "White" : "Black";
        message = `${skipped} has no legal squares. ${playerName(game.current)} places again.`;
      } else {
        message = `${playerName(game.current)} placed at ${formatBoardPosition(position)} and flipped ${result.flipped.length}.`;
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
  const counts = countDiscsByPlayer(game.board);
  const result = winner(game.board);
  console.log(`Final score: ● ${counts.B} - ○ ${counts.W}`);
  console.log(result === "draw" ? "Draw." : `${playerName(result)} wins.`);
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
