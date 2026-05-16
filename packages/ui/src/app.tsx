import {
    BLACK_PLAYER,
    CPU_PLAYER,
    EMPTY_CELL,
    HUMAN_PLAYER,
    boardPositions,
    chooseCpuPlacement,
    countDiscsByPlayer,
    createInitialGame,
    formatBoardPosition,
    isGameOver,
    legalDiscPlacements,
    opponent,
    placeDisc,
    positionKey,
    winner,
    type GameState,
    type Player,
    type Position,
} from "@reversi/core";
import { For, createMemo, createSignal } from "solid-js";
import { render } from "solid-js/web";

const CPU_THINKING_DELAY_MS = 600;
const PLACEMENT_HIGHLIGHT_DELAY_MS = 650;
const INITIAL_GUI_MESSAGE = "Choose a highlighted square.";

type UiState = {
    game: GameState;
    highlightedPositions: Position[];
    message: string;
    waitingForCpu: boolean;
};

export type UiOpponent = {
    name: string;
    thinkingMessage?: string;
    choosePlacement: (
        game: GameState,
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
    root.replaceChildren();
    render(
        () => (
            <ReversiUi
                opponentOptions={[
                    DEFAULT_OPPONENT_OPTION,
                    ...(options.opponents ?? []),
                ]}
            />
        ),
        root,
    );
}

function ReversiUi(props: { opponentOptions: UiOpponentOption[] }) {
    const [state, setState] = createSignal(createInitialUiState());
    const [opponent, setOpponent] = createSignal(DEFAULT_OPPONENT);
    const [selectedOpponentId, setSelectedOpponentId] = createSignal(
        DEFAULT_OPPONENT_OPTION.id,
    );
    const [opponentStatus, setOpponentStatus] = createSignal(
        "CPU opponent is selected.",
    );
    const [isSelectingOpponent, setIsSelectingOpponent] = createSignal(false);

    const counts = createMemo(() => countDiscsByPlayer(state().game.board));

    function newGame(): void {
        setState(createInitialUiState());
    }

    async function selectOpponent(opponentId: string): Promise<void> {
        const option = props.opponentOptions.find(
            (candidate) => candidate.id === opponentId,
        );
        if (!option) {
            throw new Error(`Unknown opponent option: ${opponentId}`);
        }

        setIsSelectingOpponent(true);
        setOpponentStatus(`Setting up ${option.label}...`);

        try {
            const nextOpponent = await option.createOpponent({
                setStatus: setOpponentStatus,
            });
            setOpponent(() => nextOpponent);
            setSelectedOpponentId(option.id);
            setOpponentStatus(`${nextOpponent.name} is selected.`);
            setState(createInitialUiState());
        } catch (error) {
            setOpponentStatus(
                error instanceof Error
                    ? error.message
                    : `${option.label} could not be selected.`,
            );
        } finally {
            setIsSelectingOpponent(false);
        }
    }

    async function playHumanPlacement(position: Position): Promise<void> {
        const currentState = state();
        if (
            currentState.waitingForCpu ||
            currentState.game.current !== HUMAN_PLAYER
        ) {
            return;
        }

        const result = placeDisc(currentState.game, position);
        if (result.ok === false) {
            setState({ ...currentState, message: result.reason });
            return;
        }

        setState({
            game: result.game,
            highlightedPositions: [position, ...result.flipped],
            message: uiPlacementMessage(
                currentState.game,
                result.game,
                position,
                result.flipped.length,
                opponent().name,
            ),
            waitingForCpu: true,
        });

        await delay(PLACEMENT_HIGHLIGHT_DELAY_MS);
        await playOpponentPlacements();
    }

    async function playOpponentPlacements(): Promise<void> {
        while (
            !isGameOver(state().game.board) &&
            state().game.current === CPU_PLAYER
        ) {
            setState((currentState) => ({
                ...currentState,
                highlightedPositions: [],
                message:
                    opponent().thinkingMessage ??
                    `${opponent().name} is thinking...`,
                waitingForCpu: true,
            }));
            await delay(CPU_THINKING_DELAY_MS);

            const currentState = state();
            const cpuPosition = await chooseOpponentPlacement(currentState);
            if (!cpuPosition) {
                throw new Error(
                    `Unexpected ${opponent().name} turn without a legal square before game over.`,
                );
            }

            const result = placeDisc(currentState.game, cpuPosition);
            if (result.ok === false) {
                throw new Error(
                    `Unexpected illegal CPU square after selection: ${formatBoardPosition(cpuPosition)}.`,
                );
            }

            setState({
                game: result.game,
                highlightedPositions: [cpuPosition, ...result.flipped],
                message: uiPlacementMessage(
                    currentState.game,
                    result.game,
                    cpuPosition,
                    result.flipped.length,
                    opponent().name,
                ),
                waitingForCpu: true,
            });
            await delay(PLACEMENT_HIGHLIGHT_DELAY_MS);
        }

        setState((currentState) => ({
            ...currentState,
            highlightedPositions: [],
            waitingForCpu: false,
        }));
    }

    async function chooseOpponentPlacement(
        currentState: UiState,
    ): Promise<Position | null> {
        try {
            return await opponent().choosePlacement(currentState.game);
        } catch (error) {
            setState({
                ...currentState,
                highlightedPositions: [],
                message:
                    error instanceof Error
                        ? error.message
                        : `${opponent().name} could not choose a move.`,
                waitingForCpu: false,
            });
            throw error;
        }
    }

    return (
        <main class="app-shell">
            <section class="game-area" aria-label="Reversi board">
                <div class="board-header">
                    <div>
                        <h1>Reversi</h1>
                        <p class="status">
                            <Status
                                game={state().game}
                                opponentName={opponent().name}
                                waitingForCpu={state().waitingForCpu}
                            />
                        </p>
                    </div>
                    <button
                        class="new-game"
                        type="button"
                        disabled={isSelectingOpponent()}
                        onClick={newGame}
                    >
                        New game
                    </button>
                </div>

                <Board
                    state={state()}
                    onHumanPlacement={(position) => {
                        void playHumanPlacement(position);
                    }}
                />
            </section>

            <aside class="side-panel" aria-label="Game information">
                <OpponentControl
                    disabled={isSelectingOpponent() || state().waitingForCpu}
                    opponentOptions={props.opponentOptions}
                    opponentStatus={opponentStatus()}
                    selectedOpponentId={selectedOpponentId()}
                    onChange={(opponentId) => {
                        void selectOpponent(opponentId);
                    }}
                />

                <dl class="scoreboard">
                    <Score label="You" value={counts()[HUMAN_PLAYER]} />
                    <Score
                        label={opponent().name}
                        value={counts()[CPU_PLAYER]}
                    />
                </dl>

                <p class="message">{state().message}</p>
            </aside>
        </main>
    );
}

function OpponentControl(props: {
    disabled: boolean;
    opponentOptions: UiOpponentOption[];
    opponentStatus: string;
    selectedOpponentId: string;
    onChange: (opponentId: string) => void;
}) {
    return (
        <div class="opponent-control">
            <label>
                Opponent
                <select
                    disabled={
                        props.disabled || props.opponentOptions.length < 2
                    }
                    value={props.selectedOpponentId}
                    onChange={(event) => {
                        props.onChange(event.currentTarget.value);
                    }}
                >
                    <For each={props.opponentOptions}>
                        {(option) => (
                            <option value={option.id}>{option.label}</option>
                        )}
                    </For>
                </select>
            </label>
            <p>{props.opponentStatus}</p>
        </div>
    );
}

function Status(props: {
    game: GameState;
    opponentName: string;
    waitingForCpu: boolean;
}) {
    if (isGameOver(props.game.board)) {
        const result = winner(props.game.board);
        return (
            <>
                {result === "draw"
                    ? "Game over: draw."
                    : `Game over: ${uiPlayerName(result, props.opponentName)} wins.`}
            </>
        );
    }

    return (
        <>
            {props.waitingForCpu
                ? `${props.opponentName} is thinking...`
                : `Turn: ${uiPlayerName(props.game.current, props.opponentName)}`}
        </>
    );
}

function Board(props: {
    state: UiState;
    onHumanPlacement: (position: Position) => void;
}) {
    const legalPositionKeys = createMemo(
        () =>
            new Set(
                legalDiscPlacements(
                    props.state.game.board,
                    props.state.game.current,
                ).map(positionKey),
            ),
    );
    const highlightedPositionKeys = createMemo(
        () => new Set(props.state.highlightedPositions.map(positionKey)),
    );

    return (
        <div class="board">
            <For each={boardPositions().flat()}>
                {(position) => (
                    <Square
                        cell={
                            props.state.game.board[position.row][position.col]
                        }
                        disabled={
                            props.state.waitingForCpu ||
                            props.state.game.current !== HUMAN_PLAYER ||
                            !legalPositionKeys().has(positionKey(position)) ||
                            props.state.game.board[position.row][
                                position.col
                            ] !== EMPTY_CELL
                        }
                        highlighted={highlightedPositionKeys().has(
                            positionKey(position),
                        )}
                        legal={
                            legalPositionKeys().has(positionKey(position)) &&
                            props.state.game.current === HUMAN_PLAYER
                        }
                        position={position}
                        onClick={props.onHumanPlacement}
                    />
                )}
            </For>
        </div>
    );
}

function Square(props: {
    cell: Player | typeof EMPTY_CELL;
    disabled: boolean;
    highlighted: boolean;
    legal: boolean;
    position: Position;
    onClick: (position: Position) => void;
}) {
    return (
        <button
            aria-label={formatBoardPosition(props.position)}
            classList={{
                square: true,
                legal: props.legal,
                highlight: props.highlighted,
            }}
            disabled={props.disabled}
            type="button"
            onClick={() => {
                props.onClick(props.position);
            }}
        >
            {props.cell !== EMPTY_CELL && <Disc player={props.cell} />}
        </button>
    );
}

function Disc(props: { player: Player }) {
    return (
        <span
            class={`disc ${props.player === BLACK_PLAYER ? "black" : "white"}`}
        />
    );
}

function Score(props: { label: string; value: number }) {
    return (
        <div>
            <dt>{props.label}</dt>
            <dd>{props.value}</dd>
        </div>
    );
}

function createInitialUiState(): UiState {
    return {
        game: createInitialGame(),
        highlightedPositions: [],
        message: INITIAL_GUI_MESSAGE,
        waitingForCpu: false,
    };
}

function uiPlayerName(player: Player, opponentName: string): string {
    if (player === HUMAN_PLAYER) return "You";
    if (player === CPU_PLAYER) return opponentName;
    return player;
}

function uiPlacementMessage(
    previousGame: GameState,
    nextGame: GameState,
    position: Position,
    flippedCount: number,
    opponentName: string,
): string {
    if (nextGame.current === previousGame.current) {
        return `${uiPlayerName(opponent(previousGame.current), opponentName)} has no legal squares. ${uiPlayerName(previousGame.current, opponentName)} plays again.`;
    }

    return `${uiPlayerName(previousGame.current, opponentName)} placed at ${formatBoardPosition(position)} and flipped ${flippedCount}.`;
}

function delay(milliseconds: number): Promise<void> {
    return new Promise((resolve) => {
        window.setTimeout(resolve, milliseconds);
    });
}
