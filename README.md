# Reversi

A small single-player Reversi/Othello game written in TypeScript.

It supports both a terminal UI and an Electron GUI.

## Setup

```sh
pnpm install
```

## Play in the Terminal

```sh
pnpm run cli
```

Enter a square using board coordinates like `d3`, or row and column numbers like `3 4`.
Legal squares are shown as `+`.

You play black (`●`) and go first. The CPU plays white (`○`).

## Play in the GUI

```sh
pnpm run gui
```

The GUI uses Electron. You play black and click highlighted squares to place discs.

## Test

```sh
pnpm run ci
```
