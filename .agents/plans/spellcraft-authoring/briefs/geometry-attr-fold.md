# Brief: Fold the Seven Geometry Attributes into data-spw-op

Sized for one careful session. `runtime/spells.js` renderSpellAtom explodes operator geometry into seven attributes (`data-spw-operator-left-role`, `-right-role`, `-flow`, `-brace-bias`, `-geometry`, `-overload`, `-charge-role`). The G1 fold: extend the `data-spw-op` bundle with `flow:`, `geometry:`, `bias:` axes and migrate the ~20 CSS readers (enumerate with `rg -n 'data-spw-operator-(left-role|right-role|flow|brace-bias|geometry|overload|charge-role)' public/css`) in the same patch.

**One question:** which of the seven axes do CSS rules actually discriminate on? (Census first; axes nothing reads may not deserve bundle tokens.)

**One behavior:** identical rendering before and after — this is a pure grammar fold. Writers: spells.js only. Readers: geometry-projection.css primarily.

**Validation:** `npm run check:local`; rg census shows zero old-name readers; screenshot of a spell atom's dataset reads as one line (the capture test).
