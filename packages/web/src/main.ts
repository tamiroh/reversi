import { mountBrowserReversi } from "@reversi/browser";
import "@reversi/browser/style.css";

const root = document.querySelector<HTMLElement>("#app");
if (!root) {
    throw new Error("Missing web root element: app");
}

mountBrowserReversi(root);
