# Plan: spw-document-room

`.spw` opens as a local document. The installed app handles the file. `/open/` parses it in the browser and shows a room. The source stays available to read, edit, and export.

## Scope

- In: manifest file handler and share target, one launch consumer, `/open/`, a client-side room projection.
- Out: a server upload, a second parser, new icon files, a graph library.

## Contract

Desktop Chromium can open a `.spw` with the installed app. A share lands through the service worker and is deleted after `/open/` reads it. Every other browser uses the file field. `focus-existing` keeps the current window; the text crosses pages in session storage and is cleared on read.

## Validation

`node --test scripts/tests/spw-document-room.test.mjs`

`npm run check:pwa`
