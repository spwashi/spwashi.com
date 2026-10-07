# Top-Level Route SEO And Onboarding Markup

## Public Goal

Make the primary public routes easier to discover, read, share, and enter by aligning page metadata, route relationships, accessible hero descriptions, and semantic `data-spw-*` attributes.

## Scope

- Conversion routes: `/now/`, `/cards/`, `/membership/`, `/coordination/`, `/research/`.
- Established hubs: home, Services, About, Topics, Tools, Contact, Design.

## Markup Contract

- Each route should have a stable title, meta description, canonical URL, Open Graph/Twitter metadata, and breadcrumb JSON-LD when practical.
- `<main>` should carry the page-level semantic surface role when the route is not already doing so.
- Hero sections should use `aria-labelledby` and `aria-describedby` with a visible lead paragraph.
- Top-level `data-spw-related-routes`, header `related_routes`, and `nav_items` should expose the current conversion paths where they matter.
- Plain-language conversion routes should stay readable without JavaScript.

## Out Of Scope

- New images.
- Payment or membership backend logic.
- Broad visual redesign.
- Rewriting deep topic pages in the same pass.

## Validation

- `git diff --check`
- Targeted `rg` checks for route links, descriptions, and structured metadata.
- `npm run check`
- `npm run build`
