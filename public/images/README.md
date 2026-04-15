# Image Workflow

- Keep raw generations, phone dumps, and prompt-heavy originals in `00.unsorted/`.
- Publish only optimized site-ready derivatives into `public/images/<surface-or-subject>/`.
- Use short descriptive stems: `<surface>-<subject>-<variant>.webp`.
- Keep wide assets around `1600px`, square studies around `1200px`, and portrait studies around `900px` unless a page needs more.
- When descriptive sidecars are ready, give them the same stem as the image:
  - `studio-house-hero.webp`
  - `studio-house-hero.spw`
  - `studio-house-hero.json`
- Favor route or subject buckets first. If an image later becomes more general, move it only after references and sidecars are in place.
- If artwork is by someone else, publish it under a collaborator bucket such as `public/images/collaborators/raven-of-the-broken-biscuits/` and keep attribution in the sidecar. Do not imply authorship in filename, alt text, or surrounding copy.
