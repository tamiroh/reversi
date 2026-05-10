import { chooseCpuPlacement } from "../lib/cpu.ts";
import {
    BLACK_PLAYER,
    EMPTY_CELL,
    boardPositions,
    countDiscsByPlayer,
    createInitialGame,
    isGameOver,
    legalDiscPlacements,
    opponent,
    placeDisc,
    positionKey,
    winner,
    type GameState,
    type Player,
    type Position,
} from "../lib/game.ts";
import { CPU_PLAYER, HUMAN_PLAYER } from "../lib/player-roles.ts";

type GuiState = {
    game: GameState;
    highlightedPositions: Position[];
    message: string;
    waitingForCpu: boolean;
};

type GuiElements = {
    board: HTMLElement;
    status: HTMLElement;
    message: HTMLElement;
    humanScore: HTMLElement;
    cpuScore: HTMLElement;
};

type GuiRenderCallbacks = {
    onHumanPlacement: (position: Position) => void;
};

const CPU_THINKING_DELAY_MS = 600;
const PLACEMENT_HIGHLIGHT_DELAY_MS = 650;

const elements: GuiElements = {
    board: requireElement("board"),
    status: requireElement("status"),
    message: requireElement("message"),
    humanScore: requireElement("human-score"),
    cpuScore: requireElement("cpu-score"),
};
const newGameButton = requireElement("new-game");

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

//
// GUI UI
//

function guiPlayerName(player: Player): string {
    if (player === HUMAN_PLAYER) return "You";
    if (player === CPU_PLAYER) return "CPU";
    return player;
}

function guiPlacementMessage(
    previousGame: GameState,
    nextGame: GameState,
    position: Position,
    flippedCount: number,
): string {
    if (nextGame.current === previousGame.current) {
        return `${guiPlayerName(opponent(previousGame.current))} has no legal squares. ${guiPlayerName(previousGame.current)} plays again.`;
    }

    return `${guiPlayerName(previousGame.current)} placed at ${formatBoardPosition(position)} and flipped ${flippedCount}.`;
}

function renderGui(
    elements: GuiElements,
    state: GuiState,
    callbacks: GuiRenderCallbacks,
): void {
    renderGuiStatus(elements, state);
    renderGuiScores(elements, state);
    renderGuiBoard(elements, state, callbacks);
}

function renderGuiStatus(elements: GuiElements, state: GuiState): void {
    if (isGameOver(state.game.board)) {
        const result = winner(state.game.board);
        elements.status.textContent =
            result === "draw"
                ? "Game over: draw."
                : `Game over: ${guiPlayerName(result)} wins.`;
        elements.message.textContent = state.message;
        return;
    }

    elements.status.textContent = state.waitingForCpu
        ? "CPU is thinking..."
        : `Turn: ${guiPlayerName(state.game.current)}`;
    elements.message.textContent = state.message;
}

function renderGuiScores(elements: GuiElements, state: GuiState): void {
    const counts = countDiscsByPlayer(state.game.board);
    elements.humanScore.textContent = String(counts[HUMAN_PLAYER]);
    elements.cpuScore.textContent = String(counts[CPU_PLAYER]);
}

function renderGuiBoard(
    elements: GuiElements,
    state: GuiState,
    callbacks: GuiRenderCallbacks,
): void {
    const legalPositionKeys = new Set(
        legalDiscPlacements(state.game.board, state.game.current).map(
            positionKey,
        ),
    );
    const highlightedPositionKeys = new Set(
        state.highlightedPositions.map(positionKey),
    );

    elements.board.replaceChildren(
        ...boardPositions().flatMap((row) =>
            row.map((position) =>
                renderGuiSquare(
                    state,
                    callbacks,
                    position,
                    legalPositionKeys.has(positionKey(position)),
                    highlightedPositionKeys.has(positionKey(position)),
                ),
            ),
        ),
    );
}

function renderGuiSquare(
    state: GuiState,
    callbacks: GuiRenderCallbacks,
    position: Position,
    isLegalPosition: boolean,
    isHighlighted: boolean,
): HTMLButtonElement {
    const cell = state.game.board[position.row][position.col];
    const square = document.createElement("button");
    square.className = "square";
    square.type = "button";
    square.ariaLabel = formatBoardPosition(position);
    square.disabled =
        state.waitingForCpu ||
        state.game.current !== HUMAN_PLAYER ||
        !isLegalPosition ||
        cell !== EMPTY_CELL;

    if (isLegalPosition && state.game.current === HUMAN_PLAYER) {
        square.classList.add("legal");
    }

    if (isHighlighted) {
        square.classList.add("highlight");
    }

    if (cell !== EMPTY_CELL) {
        square.append(renderGuiDisc(cell));
    }

    square.addEventListener("click", () => {
        callbacks.onHumanPlacement(position);
    });

    return square;
}

function renderGuiDisc(player: Player): HTMLSpanElement {
    const disc = document.createElement("span");
    disc.className = `disc ${player === BLACK_PLAYER ? "black" : "white"}`;
    return disc;
}

function formatBoardPosition(position: Position): string {
    return `${String.fromCharCode("a".charCodeAt(0) + position.col)}${position.row + 1}`;
}
