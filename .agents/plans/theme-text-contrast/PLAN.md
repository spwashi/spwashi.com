# Theme secondary-text contrast

Operation: align. Fixity: tending. Scope: shared theme text palette.

Interior-page sensing: about-opening-dark, recipes-hero-dark, and
rpg-boonhonk-vellum pocket fixtures. No route copy or structure changes.

Six theme packs reduced secondary ink to 60% opacity. Chrome-resolved,
alpha-composited token pairs reached 2.87:1 (oxide light) and 3.39:1
(vellum dark). Banked ember soft ink reached 3.76:1 on its raised surface.
Strengthen secondary pigment while retaining palette hue, and derive muted
ink from each pack's secondary ink instead of the default palette.

Reproduce: `node .agents/plans/theme-text-contrast/probe.mjs`.
The probe uses installed Chrome, real CSS layers, seven packs, light/dark,
three secondary inks and six grounds. It requires at least 4.5:1.
The revised soft/mid matrix ranges from 4.62:1 to 9.12:1 at each mode's
worst pair. This checks palette pairs, not text over images, gradients,
route-specific overrides, or additional element/ancestor opacity.

Validation: `npm run check:local`, `git diff --check`, and
`npm run visual:checks -- --ids=about-opening-dark,recipes-hero-dark,rpg-boonhonk-vellum`.
Theme packs are lazy-loaded source CSS; no bundle edit is required.
