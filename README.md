# AWE Chair Cue

A tiny static conference-chair assistant prototype for Meta Ray-Ban Display-style web app testing.

The app now loads the official AWE USA 2026 agenda from `agenda.json`, including session descriptions.

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
- `next`
- `description`

## App Flow

The first screen asks attendees to choose a track. After a track is selected, the app jumps to the current session for that track based on AWE's Pacific time zone. If nothing is active, it shows the next upcoming session.

Use `Menu` to return to track selection and choose a different track.

## Controls

- `Prev`: previous agenda item
- `Menu`: return to track selection
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
