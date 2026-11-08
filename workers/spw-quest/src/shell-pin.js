// The reader the guide imports, pinned to one dated release, so the shell
// (assets/sw.js) can keep it and check it (PR 2 of
// .agents/plans/spw-quest/note-shell-design.md). The values are copied from
// assets/parser/2026.10.13/manifest.json (path reader.min.js); a test fails if
// they drift. assets/sw.js repeats them as literals, with SHELL_VERSION, and a
// test fails if the served script does not. Changing the pin is a deliberate
// edit of both files that also increments SHELL_VERSION in both.
//
// On 2026-11-08 the pinned reader and the site's /parser.js gave the same
// token streams for all fourteen guide files and the walk.

export const SHELL_VERSION = "1";
export const PINNED_RELEASE = "2026.10.13";
export const PINNED_READER = "/parser/2026.10.13/reader.min.js";
export const PINNED_READER_SHA256 = "9928ec7f51a0416ee39857dc3a3b236d071051f484e4da5a3460a8f62c5d4de7";
export const PINNED_READER_BYTES = 87605;

/**
 * Published release names, newest first: the later day, then a patch over its
 * release, then the higher N. Prereleases and anything that is not a name are
 * dropped. Self-contained, because the guide runs it by toString: it inlines
 * the name pattern and the tiers rather than reading parser-releases.js.
 */
export function newestPublished(entries) {
  const pattern = /^(\d{4}\.\d{2}\.\d{2})(?:-(pre|patch)\.([1-9]\d*))?$/;
  const tiers = { prerelease: 0, release: 1, patch: 2 };
  const read = [];
  for (const entry of Array.isArray(entries) ? entries : []) {
    const name = typeof entry === "string" ? entry : entry?.name;
    const match = pattern.exec(typeof name === "string" ? name : "");
    if (!match) continue;
    const kind = match[2] === "pre" ? "prerelease" : match[2] === "patch" ? "patch" : "release";
    if (kind === "prerelease") continue;
    read.push({ name, day: match[1], tier: tiers[kind], n: Number(match[3] || 0) });
  }
  read.sort((a, b) => b.day.localeCompare(a.day) || b.tier - a.tier || b.n - a.n);
  return read.map((item) => item.name);
}

/**
 * Runs on the guide after it has painted: a published release newer than the
 * pin shows as a line with a ?parser= link. Not a poll, not the shell. The
 * link trials that release's full build through the guide's switch; it does
 * not change what the guide keeps.
 */
export function releaseNotice(pinned, newest) {
  const line = document.querySelector("[data-release-notice]");
  if (!line || new URLSearchParams(location.search).has("parser")) return;
  fetch("/parser/index.json", { cache: "no-cache" })
    .then((response) => (response.ok ? response.json() : null))
    .then((index) => {
      if (!index || index.schema !== "spw.parser-index/2") return;
      const name = newest(index.releases)[0];
      if (!name || name === pinned) return;
      const link = line.querySelector("a");
      line.querySelector("[data-release-name]").textContent = name;
      link.href = `/?parser=${encodeURIComponent(name)}`;
      line.hidden = false;
    })
    .catch(() => {});
}
