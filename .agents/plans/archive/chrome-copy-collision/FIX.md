# Fix: chrome-copy-collision

## Failures

- Mobile menu scrim could sit above ordinary header controls and floating chrome, making the open menu feel obscured instead of clarified.
- The state satchel and section handle shared the same bottom rail variable, so the satchel could cover or crowd the bottom section jumper.
- Home hero copy repeated the same surface/handle/screenshot promise across the lede, hook, skim notes, and inspector-adjacent text.

## Diagnosis

- The section handle was consuming a clearance rail meant for other floating tools. That made the handle move into the same reserved lane as the satchel instead of staying on its own home rail.
- The region menu was visually a popover, but it was not annotated as shared floating chrome, so its layer role was less inspectable than the state satchel, console, and section handle.
- The home page had good concepts but too many independent prose paragraphs. The page reads better when those concepts become an anatomy/recipe: identity, ingredients, method, output, and next move.

## Planned Fix

1. Keep the section handle on its own safe-area rail and let other floating tools use the raised clearance rail.
2. Put the mobile menu scrim below header/menu controls and hide low-priority bottom chrome while the menu is open.
3. Annotate the region menu as a popover-tier floating chrome surface.
4. Consolidate the home hero copy into recipe/anatomy slots without changing the canonical identity line.

## Deferred Follow-ups

- Audit other long first-screen routes for repeated explanatory copy that should become component anatomy instead.
- Decide whether the satchel should default to a left rail on mobile when the section handle shell is expanded.
