#!/usr/bin/env node
import { runCliApp } from "../lib/app-cli.ts";

runCliApp().catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
});
