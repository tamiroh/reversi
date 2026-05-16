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
    opponentScoreLabel: HTMLElement;
    opponentSelect: HTMLSelectElement;
    opponentStatus: HTMLElement;
};

export type GuiPlayerLabels = {
    opponentName: string;
};

export type GuiRenderCallbacks = GuiPlayerLabels & {
    onHumanPlacement: (position: Position) => void;
};

export type GuiLabels = GuiPlayerLabels & {
    opponentOptions: Array<{ id: string; label: string }>;
    selectedOpponentId: string;
};

export type GuiMount = {
    elements: GuiElements;
    newGameButton: HTMLButtonElement;
};

export function createGuiElements(
    root: HTMLElement,
    labels: GuiLabels,
): GuiMount {
    const shell = document.createElement("main");
    shell.className = "app-shell";

    const gameArea = document.createElement("section");
    gameArea.className = "game-area";
    gameArea.ariaLabel = "Reversi board";

    const boardHeader = document.createElement("div");
    boardHeader.className = "board-header";

    const headingGroup = document.createElement("div");
    const heading = document.createElement("h1");
    heading.textContent = "Reversi";
    const status = document.createElement("p");
    status.className = "status";
    headingGroup.append(heading, status);

    const newGameButton = document.createElement("button");
    newGameButton.className = "new-game";
    newGameButton.type = "button";
    newGameButton.textContent = "New game";

    boardHeader.append(headingGroup, newGameButton);

    const board = document.createElement("div");
    board.className = "board";

    gameArea.append(boardHeader, board);

    const sidePanel = document.createElement("aside");
    sidePanel.className = "side-panel";
    sidePanel.ariaLabel = "Game information";

    const opponentControl = renderOpponentControl(labels);

    const scoreboard = document.createElement("dl");
    scoreboard.className = "scoreboard";

    const humanScore = renderScore("You", "2");
    const cpuScore = renderScore(labels.opponentName, "2");
    scoreboard.append(humanScore.item, cpuScore.item);

    const message = document.createElement("p");
    message.className = "message";

    sidePanel.append(opponentControl.item, scoreboard, message);
    shell.append(gameArea, sidePanel);

    root.replaceChildren(shell);

    return {
        elements: {
            board,
            status,
            message,
            humanScore: humanScore.value,
            cpuScore: cpuScore.value,
            opponentScoreLabel: cpuScore.label,
            opponentSelect: opponentControl.select,
            opponentStatus: opponentControl.status,
        },
        newGameButton,
    };
}

function renderOpponentControl(labels: GuiLabels): {
    item: HTMLDivElement;
    select: HTMLSelectElement;
    status: HTMLElement;
} {
    const item = document.createElement("div");
    item.className = "opponent-control";

    const label = document.createElement("label");
    label.textContent = "Opponent";

    const select = document.createElement("select");
    for (const option of labels.opponentOptions) {
        const selectOption = document.createElement("option");
        selectOption.value = option.id;
        selectOption.textContent = option.label;
        select.append(selectOption);
    }
    select.value = labels.selectedOpponentId;
    select.disabled = labels.opponentOptions.length < 2;
    label.append(select);

    const status = document.createElement("p");
    status.textContent =
        labels.opponentOptions.length < 2
            ? "CPU opponent is selected."
            : `${labels.opponentName} is selected.`;

    item.append(label, status);
    return { item, select, status };
}

function renderScore(
    label: string,
    initialValue: string,
): { item: HTMLDivElement; label: HTMLElement; value: HTMLElement } {
    const item = document.createElement("div");
    const term = document.createElement("dt");
    term.textContent = label;
    const value = document.createElement("dd");
    value.textContent = initialValue;
    item.append(term, value);
    return { item, label: term, value };
}

function guiPlayerName(player: Player, labels: GuiPlayerLabels): string {
    if (player === HUMAN_PLAYER) return "You";
    if (player === CPU_PLAYER) return labels.opponentName;
    return player;
}

export function guiPlacementMessage(
    previousGame: GameState,
    nextGame: GameState,
    position: Position,
    flippedCount: number,
    labels: GuiPlayerLabels,
): string {
    if (nextGame.current === previousGame.current) {
        return `${guiPlayerName(opponent(previousGame.current), labels)} has no legal squares. ${guiPlayerName(previousGame.current, labels)} plays again.`;
    }

    return `${guiPlayerName(previousGame.current, labels)} placed at ${formatBoardPosition(position)} and flipped ${flippedCount}.`;
}

export function renderGui(
    elements: GuiElements,
    state: GuiState,
    callbacks: GuiRenderCallbacks,
): void {
    renderGuiStatus(elements, state, callbacks);
    renderGuiScores(elements, state);
    renderGuiBoard(elements, state, callbacks);
}

function renderGuiStatus(
    elements: GuiElements,
    state: GuiState,
    labels: GuiPlayerLabels,
): void {
    if (isGameOver(state.game.board)) {
        const result = winner(state.game.board);
        elements.status.textContent =
            result === "draw"
                ? "Game over: draw."
                : `Game over: ${guiPlayerName(result, labels)} wins.`;
        elements.message.textContent = state.message;
        return;
    }

    elements.status.textContent = state.waitingForCpu
        ? `${labels.opponentName} is thinking...`
        : `Turn: ${guiPlayerName(state.game.current, labels)}`;
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
