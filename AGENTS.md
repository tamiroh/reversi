# Coding Agent Notes

## Project Shape

- This is a TypeScript Node.js CLI Reversi game.
- Runtime target is modern Node.js 24.
- The app is intentionally small. Prefer a few clear modules over premature splitting.
- Current module boundaries:
    - `bin/reversi.ts`: thin executable entrypoint.
    - `lib/app.ts`: CLI application orchestration and terminal I/O wiring.
    - `lib/game.ts`: Reversi rules and board representation.
    - `lib/cpu.ts`: CPU square selection and scoring.
    - `lib/ui.ts`: Reversi UI rendering, messages, and input parsing.
    - `lib/terminal.ts`: reusable terminal output, screen, and ANSI styling helpers.
    - `lib/type-utils.ts`: reusable TypeScript type utilities.

## Commands

- `npm run dev`: run the CLI directly from TypeScript with Node.
- `npm run build`: compile TypeScript into `dist`.
- `npm test`: run compiled tests from `dist`.
- `npm run format`: apply Prettier.
- `npm run format:check`: check Prettier formatting.
- `npm run ci`: format check, build, and test.

After editing files, run `npm run format` before verification. Treat it like an agent-side formatting hook.

## Formatting

- Follow `.editorconfig`: 4-space indentation.
- Prettier is part of CI.
- `package-lock.json` is intentionally excluded from Prettier via `.prettierignore`.

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
- Keep CPU player logic independent in `lib/cpu.ts`; it should depend on public game APIs rather than owning rule logic.

## Error Handling

- Use return values for expected failures, such as invalid user input, illegal disc placements, and no available CPU square.
- Use `null` for absent optional values and discriminated unions for domain results that need a reason.
- Throw `Error` only for unexpected internal inconsistencies that should be unreachable if callers obey the public API.
- Error messages should describe the violated assumption concretely.

## Testing

- Add focused tests when changing game rules or CPU scoring.
- After code changes, run `npm run ci` unless the user explicitly says they will handle verification.
