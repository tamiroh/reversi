import {
    CPU_PLAYER,
    HUMAN_PLAYER,
    chooseCpuPlacement,
    createInitialGame,
    isGameOver,
    placeDisc,
    type GameState,
    type Position,
} from "@reversi/core";
import {
    createGuiElements,
    formatBoardPosition,
    guiPlacementMessage,
    renderGui,
    type GuiState,
} from "../src/ui.ts";

const CPU_THINKING_DELAY_MS = 600;
const PLACEMENT_HIGHLIGHT_DELAY_MS = 650;

const { elements, newGameButton } = createGuiElements(requireElement("app"));

let state: GuiState = {
    game: createInitialGame(),
    highlightedPositions: [],
    message: "Choose a highlighted square.",
    waitingForCpu: false,
};

newGameButton.addEventListener("click", () => {
    state = {
        game: createInitialGame(),
        highlightedPositions: [],
        message: "Choose a highlighted square.",
        waitingForCpu: false,
    };
    render();
});

render();

function requireElement(id: string): HTMLElement {
    const element = document.getElementById(id);
    if (!element) {
        throw new Error(`Missing GUI element: ${id}`);
    }

    return element;
}

function delay(milliseconds: number): Promise<void> {
    return new Promise((resolve) => {
        window.setTimeout(resolve, milliseconds);
    });
}

function render(): void {
    renderGui(elements, state, {
        onHumanPlacement: (position) => {
            void playHumanPlacement(position);
        },
    });
}

async function playHumanPlacement(position: Position): Promise<void> {
    if (state.waitingForCpu || state.game.current !== HUMAN_PLAYER) {
        return;
    }

    const result = placeDisc(state.game, position);
    if (!result.ok) {
        state = { ...state, message: result.reason };
        render();
        return;
    }

    const previousGame = state.game;
    state = {
        game: result.game,
        highlightedPositions: [position, ...result.flipped],
        message: guiPlacementMessage(
            previousGame,
            result.game,
            position,
            result.flipped.length,
        ),
        waitingForCpu: true,
    };
    render();

    await delay(PLACEMENT_HIGHLIGHT_DELAY_MS);
    await playCpuPlacements();
}

async function playCpuPlacements(): Promise<void> {
    while (!isGameOver(state.game.board) && state.game.current === CPU_PLAYER) {
        state = {
            ...state,
            highlightedPositions: [],
            message: "CPU is thinking...",
            waitingForCpu: true,
        };
        render();
        await delay(CPU_THINKING_DELAY_MS);

        const cpuPosition = chooseCpuPlacement(state.game);
        if (!cpuPosition) {
            throw new Error(
                "Unexpected CPU turn without a legal square before game over.",
            );
        }

        const result = placeDisc(state.game, cpuPosition);
        if (!result.ok) {
            throw new Error(
                `Unexpected illegal CPU square after selection: ${formatBoardPosition(cpuPosition)}.`,
            );
        }

        const previousGame = state.game;
        state = {
            game: result.game,
            highlightedPositions: [cpuPosition, ...result.flipped],
            message: guiPlacementMessage(
                previousGame,
                result.game,
                cpuPosition,
                result.flipped.length,
            ),
            waitingForCpu: true,
        };
        render();
        await delay(PLACEMENT_HIGHLIGHT_DELAY_MS);
    }

    state = {
        ...state,
        highlightedPositions: [],
        waitingForCpu: false,
    };
    render();
}
