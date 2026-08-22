# Neighboring references

Gitignored checkouts live here so neighboring curriculum (such as Dregg sidecar
notes and lore.land) can be inspected and crawled locally.

Tracked:

- `catalog.json` — remotes and why each is here
- this README

Ignored:

- one directory per catalog `id` (the clone)
- `_crawl.json` — last sidecar `.spw` inventory from a sync

Sync:

```sh
npm run refs:sync
```

Shallow clone if missing, fast-forward if present, then walk each clone for
`*.spw`. Dragons Clutch is the proof that Dregg repos keep Spw as sidecar
curriculum: <https://github.com/emberian/dragons-clutch/tree/main/.spw>.
