# CSS Tree

`style.css` is the public stylesheet entrypoint and owns cascade layer order. Root-level CSS files are compatibility wrappers for older direct links from route HTML.

`spw-compose.css` is the portable composition entrypoint. It exposes tokens, typography, grammar, components, handles, and light effects without the full site shell, route surfaces, or ornament layer.

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

Use `spw-compose.css` when another site wants the theme/component language but should keep its own page shell and route layout.

Documentation route: `/design/composition/`.

Spellcasting language is useful when documenting composition: CSS tokens define
the field, component selectors define the target, and state attributes reveal the
cast result. Stylesheets are the disposition of the surface: they encode what the
browser should treat as calm, active, focused, readable, dimensional, or strange.
