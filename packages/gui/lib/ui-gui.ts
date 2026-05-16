import {
    BLACK_PLAYER,
    EMPTY_CELL,
    boardPositions,
    countDiscsByPlayer,
    isGameOver,
    legalDiscPlacements,
    opponent,
    positionKey,
    winner,
    type GameState,
    type Player,
    type Position,
    CPU_PLAYER,
    HUMAN_PLAYER,
    formatBoardPosition,
} from "@reversi/core";

export { formatBoardPosition } from "@reversi/core";

export type GuiState = {
    game: GameState;
    highlightedPositions: Position[];
    message: string;
    waitingForCpu: boolean;
};

export type GuiElements = {
    board: HTMLElement;
    status: HTMLElement;
    message: HTMLElement;
    humanScore: HTMLElement;
    cpuScore: HTMLElement;
};

export type GuiRenderCallbacks = {
    onHumanPlacement: (position: Position) => void;
};

function guiPlayerName(player: Player): string {
    if (player === HUMAN_PLAYER) return "You";
    if (player === CPU_PLAYER) return "CPU";
    return player;
}

export function guiPlacementMessage(
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

export function renderGui(
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
