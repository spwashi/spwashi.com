# Feature Module Clusters

`public/js/modules/` holds route-specific and domain-specific feature bundles.
Keep this directory folder-only at the first level so ownership is visible before
opening individual files.

## Clusters

- `blog/`: blog interpreter, specimens, and attentional register behavior.
- `cards/`: reusable card widgets used by services and annual seed surfaces.
- `design/`: design experiments, review surfaces, and settings previews.
- `effects/`: optional visual/effect systems that are not shell-wide runtime.
- `home/`: home-route feature modules.
- `math/`: direct-linked math practice lab modules.
- `media/`: media-publishing feature modules; shared media utilities live in `public/js/media/`.
- `profile/`: profile/character card data model and tool UI.
- `rpg-wednesday/`: RPG Wednesday route workbench entrypoint plus internal helpers.
- `services/`: services and care-route widgets.
- `tools/`: standalone tool-route modules.
- `widgets/`: reusable interactive widgets that are not owned by a single route family.

## Rules

- Route HTML may direct-link a clustered module when the route owns the behavior.
- Shared lazy-loaded modules should be registered in `public/js/runtime/module-catalog.js`.
- If a feature grows internal helpers, keep them inside its cluster and use explicit absolute imports.
- Update `.spw/conventions/site-semantics.spw` when a new durable cluster is introduced.
