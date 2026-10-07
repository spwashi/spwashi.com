# Lens seat and secondary materials

Operation: align. Fixity: experimental (seat), tending (carriers). Two shared-layer patches that share one idea: a surface that sits on a frame should read the frame's material, and the control that sits on it should show where it sat.

## Lens switcher (handles/operators/state-semantics.css, Cluster D2)
- On silent-chrome switches the pressed option names itself `anchor-name: --spw-lens-seat`; the track's `::after` is a 0.18rem bar anchored to it. Anchor lengths transition, so the bar slides to the next option. `anchor-scope` keeps each track's bar on its own option. Gated by `@supports (anchor-name) and (anchor-scope)`; other browsers keep the pressed state unchanged.
- Silent chrome is the qualifying condition because Cluster C leaves `::after` free there; labeled chrome still uses it for the feedback chip and keeps the pressed dot.
- Fine-pointer hover on an idle option takes the seat ink as a preview. Reduced motion keeps the bar, drops the slide.
- Row tracks pack tighter (gap, padding, block padding). The 44px floor is untouched.
- Not done: no JS change; the runtime already writes `data-spw-lens-mode` and the pressed state. The `--spw-lens-index/count` arithmetic approach was tried and dropped: the home working view wraps to 2×2 at pocket width, so slot math cannot be right there.

## Secondary material carriers (effects/material.css, 2b)
- `.spw-route-bridge`, its card links, `.spw-reason-strip > *`, and non-quiet `.mode-switch` now paint the host frame's resolved `--material-local-background` under a veil of the strong surface. The veil thins with tangibility and again on glass; matte drops the specular inset and keeps a one-pixel foot. Links lift on hover or focus; asides and strip items stay at rest (two states, per material-physics.spw#states).
- Layout, type, and the accent tint stay with the component sheets. Only surface, seam, shadow, and transition moved.
- Convention: `material-physics.spw#carriers`.

## Sensation review
The slide and the hover preview are feel decisions. They are implemented but should be approved in a browser before being treated as settled. Dev server on 4173, home working view and `/about/#about-frame` are the two tracks to press.

## Validation
`npm run build:css:core`, `npm run check:local -- --allow-dirty`, `git diff --check`, browser at 500px: bar renders under the pressed option on the home working view after a press (zoom capture), reason-strip and bridge veil alpha 0.41 at rest, 0.27 under glass, matte inset foot.
