import { cp, mkdir } from "node:fs/promises";

await mkdir("dist/gui", { recursive: true });
await cp("gui/index.html", "dist/gui/index.html");
await cp("gui/style.css", "dist/gui/style.css");
