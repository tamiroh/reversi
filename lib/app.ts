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
    type GameState,
    type Player,
    type Position,
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

type AppState = {
    game: GameState;
    message?: string;
};

type TurnResult = { quit: true } | { quit: false; state: AppState };

export async function runCliApp(): Promise<void> {
    const rl = createInterface({ input, output });
    let state: AppState = { game: createInitialGame() };

    try {
        while (!isGameOver(state.game.board)) {
            const result =
                state.game.current === CPU_PLAYER
                    ? await playCpuTurn(state)
                    : await playHumanTurn(state, rl);

            if (result.quit) {
                return;
            }

            state = result.state;
        }
    } finally {
        rl.close();
    }

    renderGameResult(state.game);
}

async function playCpuTurn(state: AppState): Promise<TurnResult> {
    renderGame(state.game, state.message ?? "CPU is thinking...");
    await delay(CPU_THINKING_DELAY_MS);

    const cpuPlacement = chooseCpuPlacement(state.game);
    if (!cpuPlacement) {
        throw new Error("CPU has no legal squares on its turn.");
    }

    const result = placeDisc(state.game, cpuPlacement.position);
    if (!result.ok) {
        throw new Error(
            `CPU selected an illegal square: ${formatBoardPosition(cpuPlacement.position)}`,
        );
    }

    return resolvePlacement(
        state.game,
        result.game,
        cpuPlacement.position,
        result.flipped,
    );
}

async function playHumanTurn(
    state: AppState,
    rl: Awaited<ReturnType<typeof createInterface>>,
): Promise<TurnResult> {
    renderGame(state.game, state.message);

    const answer = await rl.question(squarePrompt());
    const trimmed = answer.trim().toLowerCase();

    if (trimmed === "q" || trimmed === "quit" || trimmed === "exit") {
        clearScreen();
        console.log("Bye.");
        return { quit: true };
    }

    const position = parseBoardPosition(answer);
    if (!position) {
        return {
            quit: false,
            state: {
                ...state,
                message: "Use a square like d3, or row and column like 3 4.",
            },
        };
    }

    const result = placeDisc(state.game, position);
    if (!result.ok) {
        return {
            quit: false,
            state: { ...state, message: result.reason },
        };
    }

    return resolvePlacement(state.game, result.game, position, result.flipped);
}

async function resolvePlacement(
    previousGame: GameState,
    nextGame: GameState,
    position: Position,
    flipped: Position[],
): Promise<TurnResult> {
    const message = placementMessage(
        previousGame,
        nextGame,
        position,
        flipped.length,
    );
    renderGame(nextGame, message, [position, ...flipped]);
    await delay(PLACEMENT_HIGHLIGHT_DELAY_MS);

    return { quit: false, state: { game: nextGame, message } };
}

function placementMessage(
    previousGame: GameState,
    nextGame: GameState,
    position: Position,
    flippedCount: number,
): string {
    if (nextGame.current === previousGame.current) {
        const skipped = previousGame.current === "B" ? "White" : "Black";
        return `${skipped} has no legal squares. ${playerLabel(previousGame.current)} places again.`;
    }

    return `${playerLabel(previousGame.current)} placed at ${formatBoardPosition(position)} and flipped ${flippedCount}.`;
}

function renderGameResult(game: GameState): void {
    clearScreen();

    console.log(renderFinalBoard(game));
    const counts = countDiscsByPlayer(game.board);
    const result = winner(game.board);
    console.log(`Final score: ● ${counts.B} - ○ ${counts.W}`);
    console.log(result === "draw" ? "Draw." : `${playerLabel(result)} wins.`);
}
