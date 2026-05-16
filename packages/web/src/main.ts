import {
    mountBrowserReversi,
    type BrowserOpponentOption,
} from "@reversi/browser";
import "@reversi/browser/style.css";
import { createGeminiNanoOpponent } from "./prompt-opponent.ts";

const root = document.querySelector<HTMLElement>("#app");
if (!root) {
    throw new Error("Missing web root element: app");
}

const webOpponents: BrowserOpponentOption[] = [
    {
        id: "gemini-nano",
        label: "Gemini Nano",
        createOpponent: ({ setStatus }) => createGeminiNanoOpponent(setStatus),
    },
];

mountBrowserReversi(root, { opponents: webOpponents });
