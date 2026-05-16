import { defineConfig } from "vite";

export default defineConfig({
    base: "./",
    build: {
        emptyOutDir: false,
        outDir: "../dist/gui",
        rollupOptions: {
            output: {
                entryFileNames: "renderer.js",
            },
        },
    },
    root: "gui",
});
