import { mountReversiUi } from "@reversi/ui";
import "@reversi/ui/style.css";

const root = document.querySelector<HTMLElement>("#app");
if (!root) {
    throw new Error("Missing GUI root element: app");
}

mountReversiUi(root);
