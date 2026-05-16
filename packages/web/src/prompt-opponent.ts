import type { BrowserOpponent } from "@reversi/browser";
import {
    formatBoardPosition,
    legalDiscPlacements,
    type GameState,
    type Position,
} from "@reversi/core";

type PromptApiStatus = (message: string) => void;

const PROMPT_API_OPTIONS: LanguageModelCreateOptions = {
    expectedInputs: [{ type: "text", languages: ["en"] }],
    expectedOutputs: [{ type: "text", languages: ["en"] }],
};

export async function createGeminiNanoOpponent(
    setStatus: PromptApiStatus,
): Promise<BrowserOpponent> {
    setStatus("Checking Chrome Prompt API availability...");

    if (typeof LanguageModel === "undefined") {
        throw new Error(
            "Chrome Prompt API is not available in this browser. Use a supported desktop Chrome build.",
        );
    }

    const availability = await LanguageModel.availability(PROMPT_API_OPTIONS);
    if (availability === "unavailable") {
        throw new Error(
            "Gemini Nano is unavailable on this device or Chrome profile.",
        );
    }

    if (availability === "downloadable") {
        setStatus("Downloading Gemini Nano. Keep this tab open.");
    } else if (availability === "downloading") {
        setStatus("Gemini Nano is still downloading. Keep this tab open.");
    }

    const session = await LanguageModel.create({
        ...PROMPT_API_OPTIONS,
        initialPrompts: [
            {
                role: "system",
                content:
                    "You play Reversi as White. Choose strong legal moves. Always answer with exactly one board square, such as d3, and no other text.",
            },
        ],
        monitor(monitor) {
            monitor.addEventListener("downloadprogress", (event) => {
                const progress = event as ProgressEvent;
                if (progress.lengthComputable) {
                    setStatus(
                        `Downloading Gemini Nano: ${Math.round((progress.loaded / progress.total) * 100)}%.`,
                    );
                    return;
                }

                setStatus("Downloading Gemini Nano...");
            });
        },
    });

    return {
        name: "Gemini Nano",
        thinkingMessage: "Gemini Nano is thinking...",
        choosePlacement: (game) => chooseGeminiNanoPlacement(session, game),
    };
}

async function chooseGeminiNanoPlacement(
    session: LanguageModel,
    game: GameState,
): Promise<Position | null> {
    const legalMoves = legalDiscPlacements(game.board, game.current);
    if (legalMoves.length === 0) {
        return null;
    }

    const legalMoveLabels = legalMoves.map(formatBoardPosition);
    const response = await session.prompt(
        buildMovePrompt(game, legalMoveLabels),
    );
    const placement = parseLegalPlacement(response, legalMoves);
    if (placement) {
        return placement;
    }

    const retry = await session.prompt(
        `Your previous answer was not one of these legal moves: ${legalMoveLabels.join(", ")}. Answer with exactly one square from that list.`,
    );
    const retryPlacement = parseLegalPlacement(retry, legalMoves);
    if (retryPlacement) {
        return retryPlacement;
    }

    throw new Error(
        `Gemini Nano did not choose a legal move. First response: ${JSON.stringify(response)}. Retry response: ${JSON.stringify(retry)}.`,
    );
}

function buildMovePrompt(game: GameState, legalMoveLabels: string[]): string {
    return [
        "Choose the next Reversi move for White.",
        "Board rows are 1 to 8 from top to bottom. Columns are a to h from left to right.",
        "Cells use B for black human discs, W for your white discs, and . for empty cells.",
        renderBoard(game),
        `Legal moves: ${legalMoveLabels.join(", ")}`,
        "Answer with exactly one legal square.",
    ].join("\n");
}

function renderBoard(game: GameState): string {
    const rows = game.board.map(
        (row, index) => `${index + 1} ${row.join(" ")}`,
    );
    return ["  a b c d e f g h", ...rows].join("\n");
}

function parseLegalPlacement(
    response: string,
    legalMoves: Position[],
): Position | null {
    const normalized = response.trim().toLowerCase();
    const legalMoveByLabel = new Map(
        legalMoves.map((position) => [formatBoardPosition(position), position]),
    );

    const exactMatch = legalMoveByLabel.get(normalized);
    if (exactMatch) {
        return exactMatch;
    }

    const squareMatch = normalized.match(/\b[a-h][1-8]\b/u);
    return squareMatch ? (legalMoveByLabel.get(squareMatch[0]) ?? null) : null;
}
