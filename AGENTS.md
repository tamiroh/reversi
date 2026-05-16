# Coding Agent Notes

## Project Shape

- This is a pnpm workspace containing a TypeScript Node.js CLI Reversi game.
- Runtime target is modern Node.js 24.
- The app is intentionally small. Prefer a few clear modules over premature splitting.
- Current packages:
    - `packages/core`: Reversi rules, CPU selection, shared labels/input parsing, and pure utilities.
    - `packages/browser`: shared browser DOM UI, CSS, and browser-side game flow.
    - `packages/cli`: terminal CLI application.
    - `packages/gui`: Electron GUI application.
    - `packages/web`: Vite web application shell.
- Keep package boundaries clear:
    - `packages/core` must stay independent from Node, Electron, terminal, and DOM APIs.
    - `packages/browser` may depend on browser DOM APIs and `@reversi/core`, but not Node or Electron APIs.
    - `packages/cli` may depend on Node terminal APIs and `@reversi/core`.
    - `packages/gui` may depend on Electron, Vite, and `@reversi/browser`.
    - `packages/web` may depend on Vite and `@reversi/browser`.

## Commands

- `pnpm run dev`: run the CLI directly from TypeScript with Node.
- `pnpm run build`: compile TypeScript into `dist`.
- `pnpm test`: run compiled tests from `dist`.
- `pnpm run format`: apply Prettier.
- `pnpm run format:check`: check Prettier formatting.
- `pnpm run ci`: format check, build, and test.

After editing files, run `pnpm run format` before verification. Treat it like an agent-side formatting hook.

## Formatting

- Follow `.editorconfig`: 4-space indentation.
- Prettier is part of CI.
- `pnpm-lock.yaml` is intentionally excluded from Prettier via `.prettierignore`.

## Naming

- Use domain terms that describe the board action directly.
- `Position` means a row/column coordinate.
- `placeDisc` and `legalDiscPlacements` are the preferred terms for disc placement logic.
- Use `square` for user-facing board input.

## File Organization

- In larger modules, use this style of section header:

```ts
//
// Section Name
//
```

Keep related functions in the matching section. Reorder within a file when it improves scanability.

## Design Decisions

- Keep board logic in `game.ts` for now. A previous attempt to split `board.ts` made the boundary feel unclear.
- Keep terminal input simple and keyboard-driven with typed squares such as `d3` or `3 4`.
- Keep CPU player logic independent in `packages/core/src/cpu.ts`; it should depend on public game APIs rather than owning rule logic.

## Error Handling

- Use return values for expected failures, such as invalid user input, illegal disc placements, and no available CPU square.
- Use `null` for absent optional values and discriminated unions for domain results that need a reason.
- Throw `Error` only for unexpected internal inconsistencies that should be unreachable if callers obey the public API.
- Error messages should describe the violated assumption concretely.

## Testing

- Add focused tests when changing game rules or CPU scoring.
- After code changes, run `pnpm run ci` unless the user explicitly says they will handle verification.
