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

export type UiOpponent = {
    name: string;
    thinkingMessage?: string;
    choosePlacement: (
        game: GuiState["game"],
    ) => Position | null | Promise<Position | null>;
};

export type UiOpponentFactoryContext = {
    setStatus: (message: string) => void;
};

export type UiOpponentOption = {
    id: string;
    label: string;
    createOpponent: (
        context: UiOpponentFactoryContext,
    ) => UiOpponent | Promise<UiOpponent>;
};

export type UiReversiOptions = {
    opponents?: UiOpponentOption[];
};

const DEFAULT_OPPONENT: UiOpponent = {
    name: "CPU",
    thinkingMessage: "CPU is thinking...",
    choosePlacement: chooseCpuPlacement,
};

const DEFAULT_OPPONENT_OPTION: UiOpponentOption = {
    id: "cpu",
    label: "CPU",
    createOpponent: () => DEFAULT_OPPONENT,
};

export function mountReversiUi(
    root: HTMLElement,
    options: UiReversiOptions = {},
): void {
    new ReversiUiApp(root, [
        DEFAULT_OPPONENT_OPTION,
        ...(options.opponents ?? []),
    ]).mount();
}

class ReversiUiApp {
    private readonly elements: ReturnType<typeof createGuiElements>["elements"];
    private readonly newGameButton: HTMLButtonElement;
    private readonly opponentSelect: HTMLSelectElement;
    private readonly opponentOptions: UiOpponentOption[];
    private opponent = DEFAULT_OPPONENT;
    private selectedOpponentId = DEFAULT_OPPONENT_OPTION.id;
    private state = createInitialGuiState();

    constructor(root: HTMLElement, opponentOptions: UiOpponentOption[]) {
        const { elements, newGameButton } = createGuiElements(root, {
            opponentName: DEFAULT_OPPONENT.name,
            opponentOptions,
            selectedOpponentId: DEFAULT_OPPONENT_OPTION.id,
        });
        this.elements = elements;
        this.newGameButton = newGameButton;
        this.opponentSelect = elements.opponentSelect;
        this.opponentOptions = opponentOptions;
    }

    mount(): void {
        this.newGameButton.addEventListener("click", () => {
            this.state = createInitialGuiState();
            this.render();
        });

        this.opponentSelect.addEventListener("change", () => {
            void this.selectOpponent(this.opponentSelect.value);
        });

        this.render();
    }

    private render(): void {
        this.syncControls();
        renderGui(this.elements, this.state, {
            opponentName: this.opponent.name,
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
        if (result.ok === false) {
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
                { opponentName: this.opponent.name },
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
                message:
                    this.opponent.thinkingMessage ??
                    `${this.opponent.name} is thinking...`,
                waitingForCpu: true,
            };
            this.render();
            await delay(CPU_THINKING_DELAY_MS);

            const cpuPosition = await this.chooseOpponentPlacement();
            if (!cpuPosition) {
                throw new Error(
                    `Unexpected ${this.opponent.name} turn without a legal square before game over.`,
                );
            }

            const result = placeDisc(this.state.game, cpuPosition);
            if (result.ok === false) {
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
                    { opponentName: this.opponent.name },
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

    private async chooseOpponentPlacement(): Promise<Position | null> {
        try {
            return await this.opponent.choosePlacement(this.state.game);
        } catch (error) {
            this.state = {
                ...this.state,
                highlightedPositions: [],
                message:
                    error instanceof Error
                        ? error.message
                        : `${this.opponent.name} could not choose a move.`,
                waitingForCpu: false,
            };
            this.render();
            throw error;
        }
    }

    private async selectOpponent(opponentId: string): Promise<void> {
        const option = this.opponentOptions.find(
            (candidate) => candidate.id === opponentId,
        );
        if (!option) {
            throw new Error(`Unknown opponent option: ${opponentId}`);
        }

        this.setOpponentControlsEnabled(false);
        this.elements.opponentStatus.textContent = `Setting up ${option.label}...`;

        try {
            const opponent = await option.createOpponent({
                setStatus: (message) => {
                    this.elements.opponentStatus.textContent = message;
                },
            });
            this.opponent = opponent;
            this.selectedOpponentId = option.id;
            this.elements.opponentScoreLabel.textContent = opponent.name;
            this.elements.opponentStatus.textContent = `${opponent.name} is selected.`;
            this.state = createInitialGuiState();
            this.render();
        } catch (error) {
            this.opponentSelect.value = this.currentOpponentId();
            this.elements.opponentStatus.textContent =
                error instanceof Error
                    ? error.message
                    : `${option.label} could not be selected.`;
        } finally {
            this.setOpponentControlsEnabled(true);
        }
    }

    private currentOpponentId(): string {
        return this.selectedOpponentId;
    }

    private setOpponentControlsEnabled(enabled: boolean): void {
        this.opponentSelect.disabled = !enabled || this.state.waitingForCpu;
        this.newGameButton.disabled = !enabled;
    }

    private syncControls(): void {
        this.opponentSelect.disabled =
            this.opponentOptions.length < 2 || this.state.waitingForCpu;
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
