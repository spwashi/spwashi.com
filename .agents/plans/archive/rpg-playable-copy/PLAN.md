# Plan: rpg-playable-copy

Refine the public copy so `spwashi.com` reads more like a playable weekly surface for RPG Wednesday, with clear first moves, session logging language, and release-day cadence that a visitor can understand quickly.

## Goal

Make the site’s public entry points feel like they belong to a recurring play system instead of a loose set of lore pages. The current Wednesday cadence should be legible as a release rhythm: a visitor should understand where to start, how to seed a session, where the log lives, and how the Town Library and related routes support play rather than just describing it.

The copy should stay grounded in the creator identity and the existing site voice. The aim is not to make everything fantasy-themed. It is to make the site more playable, more replayable, and easier to enter from the home page or the RPG Wednesday routes.

## Scope

- In scope: public copy on the home page, `play/` hub, `play/rpg-wednesday/`, `play/rpg-wednesday/sessions/`, and the Town Library gateway where that language can help the play model.
- In scope: small metadata or route-label adjustments if they clarify the play surface.
- In scope: a light release-day cue tied to the 13th/26th cadence already present in the campaign structure.
- Out of scope: new gameplay mechanics, new session-page runtime, or a broad taxonomy rewrite.

## Likely Files

- `index.html`
- `play/rpg-wednesday/index.html`
- `play/rpg-wednesday/sessions/index.html`
- `play/rpg-wednesday/library/index.html`
- `about/index.html` only if a supporting sentence needs to point at the play surface more directly
- `settings/index.html` only if a query-mode or landing-mode sentence needs to better support playable discovery

## Copy Strategy

- Lead with the first move: read, seed, log, or build.
- Make release cadence explicit where it matters, especially on the sessions register.
- Use “playable” and “replayable” to describe the site’s public surfaces, not as vague branding words.
- Treat the Town Library as the practical companion to RPG Wednesday, not a separate fantasy project.
- Keep the copy concise enough that a reader or model can identify the page’s job in one pass.

## Validation

- `git diff --check`
- targeted `rg` checks for updated RPG Wednesday phrases and release-day language
- browser spot check on the home and RPG Wednesday routes if the hierarchy changes

## Risks

- The pages can drift into over-lore and lose the “site as tool” clarity.
- Too much release-day language could feel repetitive if it is repeated on every route.
- If the play language becomes too broad, non-RPG routes may start to read as if they are all part of the same campaign.
