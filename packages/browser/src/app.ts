import {
    CPU_PLAYER,
    HUMAN_PLAYER,
    chooseCpuPlacement,
    createInitialGame,
    isGameOver,
    placeDisc,
    type Position,
} from "@reversi/core";
import {
    createGuiElements,
    formatBoardPosition,
    guiPlacementMessage,
    renderGui,
    type GuiState,
} from "./ui.ts";

const CPU_THINKING_DELAY_MS = 600;
const PLACEMENT_HIGHLIGHT_DELAY_MS = 650;
const INITIAL_GUI_MESSAGE = "Choose a highlighted square.";

export function mountBrowserReversi(root: HTMLElement): void {
    new BrowserReversiApp(root).mount();
}

class BrowserReversiApp {
    private readonly elements: ReturnType<typeof createGuiElements>["elements"];
    private readonly newGameButton: HTMLButtonElement;
    private state = createInitialGuiState();

    constructor(root: HTMLElement) {
        const { elements, newGameButton } = createGuiElements(root);
        this.elements = elements;
        this.newGameButton = newGameButton;
    }

    mount(): void {
        this.newGameButton.addEventListener("click", () => {
            this.state = createInitialGuiState();
            this.render();
        });

        this.render();
    }

    private render(): void {
        renderGui(this.elements, this.state, {
            onHumanPlacement: (position) => {
                void this.playHumanPlacement(position);
            },
        });
    }

    private async playHumanPlacement(position: Position): Promise<void> {
        if (
            this.state.waitingForCpu ||
            this.state.game.current !== HUMAN_PLAYER
        ) {
            return;
        }

        const result = placeDisc(this.state.game, position);
        if (!result.ok) {
            this.state = { ...this.state, message: result.reason };
            this.render();
            return;
        }

        const previousGame = this.state.game;
        this.state = {
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
        this.render();

        await delay(PLACEMENT_HIGHLIGHT_DELAY_MS);
        await this.playCpuPlacements();
    }

    private async playCpuPlacements(): Promise<void> {
        while (
            !isGameOver(this.state.game.board) &&
            this.state.game.current === CPU_PLAYER
        ) {
            this.state = {
                ...this.state,
                highlightedPositions: [],
                message: "CPU is thinking...",
                waitingForCpu: true,
            };
            this.render();
            await delay(CPU_THINKING_DELAY_MS);

            const cpuPosition = chooseCpuPlacement(this.state.game);
            if (!cpuPosition) {
                throw new Error(
                    "Unexpected CPU turn without a legal square before game over.",
                );
            }

            const result = placeDisc(this.state.game, cpuPosition);
            if (!result.ok) {
                throw new Error(
                    `Unexpected illegal CPU square after selection: ${formatBoardPosition(cpuPosition)}.`,
                );
            }

            const previousGame = this.state.game;
            this.state = {
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
            this.render();
            await delay(PLACEMENT_HIGHLIGHT_DELAY_MS);
        }

        this.state = {
            ...this.state,
            highlightedPositions: [],
            waitingForCpu: false,
        };
        this.render();
    }
}

function createInitialGuiState(): GuiState {
    return {
        game: createInitialGame(),
        highlightedPositions: [],
        message: INITIAL_GUI_MESSAGE,
        waitingForCpu: false,
    };
}

function delay(milliseconds: number): Promise<void> {
    return new Promise((resolve) => {
        window.setTimeout(resolve, milliseconds);
    });
}
