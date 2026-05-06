#!/usr/bin/env node
import { runCliApp } from "../lib/app.ts";

runCliApp().catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
});
