import { createInterface } from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import { setTimeout as delay } from "node:timers/promises";
import { chooseCpuPlacement } from "./cpu.ts";
import {
    placeDisc,
    createInitialGame,
    isGameOver,
    type GameState,
    type Player,
} from "./game.ts";
import {
    clearScreen,
    formatBoardPosition,
    isQuitInput,
    parseBoardPosition,
    placementMessage,
    renderGame,
    renderGameResult,
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

    const message = placementMessage(
        state.game,
        result.game,
        cpuPlacement.position,
        result.flipped.length,
    );
    renderGame(result.game, message, [
        cpuPlacement.position,
        ...result.flipped,
    ]);
    await delay(PLACEMENT_HIGHLIGHT_DELAY_MS);

    return {
        quit: false,
        state: { game: result.game, message },
    };
}

async function playHumanTurn(
    state: AppState,
    rl: Awaited<ReturnType<typeof createInterface>>,
): Promise<TurnResult> {
    renderGame(state.game, state.message);

    const answer = await rl.question(squarePrompt());

    if (isQuitInput(answer)) {
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

    const message = placementMessage(
        state.game,
        result.game,
        position,
        result.flipped.length,
    );
    renderGame(result.game, message, [position, ...result.flipped]);
    await delay(PLACEMENT_HIGHLIGHT_DELAY_MS);

    return {
        quit: false,
        state: { game: result.game, message },
    };
}
