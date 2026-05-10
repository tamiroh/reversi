import { createRequire } from "node:module";
import type electron from "electron";

const require = createRequire(import.meta.url);
const { BrowserWindow, app } = require("electron/main") as Pick<
    typeof electron,
    "BrowserWindow" | "app"
>;

function createMainWindow(): void {
    const window = new BrowserWindow({
        width: 920,
        height: 760,
        minWidth: 760,
        minHeight: 640,
        title: "Reversi",
        webPreferences: {
            contextIsolation: true,
            nodeIntegration: false,
        },
    });

    void window.loadFile(
        new URL("../gui/index.html", import.meta.url).pathname,
    );
}

export function runElectronApp(): void {
    app.on("window-all-closed", () => {
        if (process.platform !== "darwin") {
            app.quit();
        }
    });

    app.on("activate", () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createMainWindow();
        }
    });

    void app.whenReady().then(createMainWindow);
}
