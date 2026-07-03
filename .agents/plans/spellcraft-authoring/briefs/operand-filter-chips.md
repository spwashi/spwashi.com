# Brief: Operand Filter Chips (spellbook combinatoric navigation)

Sized for one collaborator session. References: `/topics/` lane switch (mode-switch contract), spellbook dock on any route, `public/css/handles/operators/geometry-projection.css` (data-spw-op combinatorics section).

**One UX question:** when a spellbook holds ten atoms, does filtering by operator, by operand, or by the combination feel like browsing a shelf or like operating a database?

**One behavior:** a row of filter chips above spell atoms. Each chip toggles one token filter (`operator:frame`, `operand:address`); active chips combine. Implementation is one attribute selector per active chip — `[data-spw-op~="operator:frame"]` — with non-matching atoms dimmed (never removed; the shelf stays whole).

**Validation:** works with two chips active (combinatoric AND); zero chips = no dimming; reduced-motion honored; readable at phone width; state expressible in one breath on camera.
