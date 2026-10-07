# Mobile chrome alignment

Operation: align. Fixity: stable. Focus: floating controls. Element: earth.

## Reproduction and goal

Home at 390×844 and 320×844: the satchel root shrinks to 16px while its
102px button hangs outside the viewport. Search's header action group is
hidden on mobile. The travel rail competes with the satchel and a late
correction caps it at 9.25rem.

Keep search reachable, the satchel contained, and current-room text readable.
Use the existing page-model floating-chrome boundary and measured lanes as
stable gravity wells; focus/press feedback belongs to controls, not anchors.

## Patch

- Exclude floating roots from component inline-size containment.
- Stack mobile satchel and travel lanes; honor their measured gutter/width.
- Remove the late rail width cap and keep its measured lane authority.
- Move the existing Search link into the brand; show its dialog immediately.
- Add restrained local focus/press depth with reduced-motion support.
- Preserve routes, settings ownership, operator taxonomy, and dependencies.

## Verification

Headless home at both widths: closed/open satchel, search, rail, focus, and
viewport bounds. Pocket visual checks, syntax, local checks, generated output.
