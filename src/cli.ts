#!/usr/bin/env node
import { createInterface } from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import { setTimeout as delay } from "node:timers/promises";
import { chooseCpuPlacement } from "./cpu.ts";
import {
    placeDisc,
    countDiscsByPlayer,
    createInitialGame,
    isGameOver,
    winner,
    type Player,
} from "./game.ts";
import {
    clearScreen,
    formatBoardPosition,
    parseBoardPosition,
    playerLabel,
    renderFinalBoard,
    renderGame,
    squarePrompt,
} from "./ui.ts";

const CPU_PLAYER: Player = "W";
const CPU_THINKING_DELAY_MS = 700;
const PLACEMENT_HIGHLIGHT_DELAY_MS = 700;

async function main(): Promise<void> {
    const rl = createInterface({ input, output });
    let game = createInitialGame();
    let message: string | undefined;

    try {
        while (!isGameOver(game.board)) {
            if (game.current === CPU_PLAYER) {
                renderGame(game, message ?? "CPU is thinking...");
                await delay(CPU_THINKING_DELAY_MS);

                const cpuPlacement = chooseCpuPlacement(game);
                if (!cpuPlacement) {
                    throw new Error("CPU has no legal squares on its turn.");
                }

                const result = placeDisc(game, cpuPlacement.position);
                if (!result.ok) {
                    throw new Error(
                        `CPU selected an illegal square: ${formatBoardPosition(cpuPlacement.position)}`,
                    );
                }

                message = `CPU placed at ${formatBoardPosition(cpuPlacement.position)} and flipped ${result.flipped.length}.`;
                game = result.game;
                renderGame(game, message, [
                    cpuPlacement.position,
                    ...result.flipped,
                ]);
                await delay(PLACEMENT_HIGHLIGHT_DELAY_MS);
                continue;
            }

            renderGame(game, message);

            const answer = await rl.question(squarePrompt());
            const trimmed = answer.trim().toLowerCase();

            if (trimmed === "q" || trimmed === "quit" || trimmed === "exit") {
                clearScreen();
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
                message = `${skipped} has no legal squares. ${playerLabel(game.current)} places again.`;
            } else {
                message = `${playerLabel(game.current)} placed at ${formatBoardPosition(position)} and flipped ${result.flipped.length}.`;
            }

            game = result.game;
            renderGame(game, message, [position, ...result.flipped]);
            await delay(PLACEMENT_HIGHLIGHT_DELAY_MS);
        }
    } finally {
        rl.close();
    }

    clearScreen();

    console.log(renderFinalBoard(game));
    const counts = countDiscsByPlayer(game.board);
    const result = winner(game.board);
    console.log(`Final score: ● ${counts.B} - ○ ${counts.W}`);
    console.log(result === "draw" ? "Draw." : `${playerLabel(result)} wins.`);
}

main().catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
});
