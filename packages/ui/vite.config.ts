import { defineConfig } from "vite";
import solid from "vite-plugin-solid";

export default defineConfig({
    build: {
        lib: {
            cssFileName: "style",
            entry: "src/index.ts",
            fileName: "index",
            formats: ["es"],
        },
        rollupOptions: {
            external: ["@reversi/core", "solid-js", "solid-js/web"],
        },
    },
    plugins: [solid()],
});
