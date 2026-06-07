# AWE Chair Cue

A tiny static conference-chair assistant prototype for Meta Ray-Ban Display-style web app testing.

The app now loads the official AWE USA 2026 agenda from `agenda.json`.

## Open Locally

Use the local server that is currently running:

```text
http://localhost:4173/
```

Or serve this folder with any static host.

## Edit The Agenda

Open `agenda.json` to inspect the synced AWE schedule. Each session supports:

- `title`
- `speaker`
- `room`
- `start`
- `end`
- `intro`
- `qa`
- `next`

## Controls

- `Prev`: previous agenda item
- `Cue`: cycle Now, Intro cue, Q&A cue, Next
- `Next`: next agenda item
- Keyboard: left arrow, right arrow, space, enter

## Resync AWE Agenda

From the project root, run:

```text
node work/sync-awe-agenda.js
```

If the Windows `node` command is blocked, use the bundled runtime:

```text
C:\Users\klime\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe work\sync-awe-agenda.js
```

## Deploy Later

This folder is plain HTML, CSS, and JavaScript. It can be deployed to Vercel, Netlify, GitHub Pages, or any static web host.
