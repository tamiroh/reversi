import { mountReversiUi, type UiOpponentOption } from "@reversi/ui";
import "@reversi/ui/style.css";
import { createGeminiNanoOpponent } from "./prompt-opponent.ts";

const root = document.querySelector<HTMLElement>("#app");
if (!root) {
    throw new Error("Missing web root element: app");
}

const webOpponents: UiOpponentOption[] = [
    {
        id: "gemini-nano",
        label: "Gemini Nano",
        createOpponent: ({ setStatus }) => createGeminiNanoOpponent(setStatus),
    },
];

mountReversiUi(root, { opponents: webOpponents });
