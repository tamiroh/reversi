import { stdout as output } from "node:process";
import { clearScreenDown, cursorTo } from "node:readline";

//
// ANSI Styling
//

export function colorize(text: string, color: string): string {
    return output.isTTY ? `\x1b[${color}m${text}\x1b[0m` : text;
}

export function blink(text: string): string {
    return output.isTTY ? `\x1b[5m${text}\x1b[0m` : text;
}

//
// Terminal Output
//

export function clearScreen(): void {
    if (output.isTTY) {
        cursorTo(output, 0, 0);
        clearScreenDown(output);
    }
}

export function writeTerminal(text: string): void {
    output.write(text);
}
