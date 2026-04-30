# Styles Source

Future CSS refactors can move authored sources here before changing public output.

- `entries/` compiles or copies to `public/css/`.
- Keep selectors semantic and inspectable.
- Preserve the `public/css/style.css` cascade layer contract.
- Use PostCSS for native-first transforms; avoid hashed class names.

Current proof entries:
- `design-experiments.css`
- `spw-debug.css`
- `tools-budgeting-surface.css`
