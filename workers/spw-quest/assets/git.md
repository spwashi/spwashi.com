# Git, in this order

Run only the command that matches the folder you have. The last command only looks.

- No `.git` yet → `git init`. Creates the repository.
- No `.spw/_workbench` in `.gitmodules` → `git submodule add`. Records where the workbench comes from.
- Link just added → `checkout`. Pins the reviewed revision.
- Link recorded, folder empty → `git submodule update --init`. Downloads that revision.
- `git diff --check` only looks. It does not edit or commit.

```bash
test -d .git || git init
git submodule add https://github.com/spwashi/spw-workbench .spw/_workbench
git -C .spw/_workbench checkout 850077ab48e02c58c2b55787075a7b97c9e4bf4f
git submodule update --init -- .spw/_workbench
git diff --check
```
