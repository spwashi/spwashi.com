# CSS Tree

`style.css` is the public stylesheet entrypoint and owns cascade layer order. Root-level CSS files are compatibility wrappers for older direct links from route HTML.

Implementation files live in folders that match the cascade layers:

- `reset/`
- `tokens/`
- `shell/`
- `typography/`
- `grammar/`
- `components/`
- `systems/`
- `routes/`
- `handles/`
- `effects/`
- `ornament/`

When changing shared visual behavior, edit the layered implementation file first. Keep `style.css` as the ordered import registry, and keep root wrappers only for stable public URLs.
