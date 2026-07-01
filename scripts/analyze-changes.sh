#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(git rev-parse --show-toplevel 2>/dev/null)"
cd "$ROOT_DIR"

if ! git status --short --untracked-files=all | grep -q .; then
  echo "[changes] working tree clean"
  exit 0
fi

git status --short --untracked-files=all | awk '
function category(path) {
  if (path ~ /^\.agents\/skills\//) return "agent skills";
  if (path ~ /^\.agents\/plans\//) return "plans";
  if (path ~ /^\.spw\//) return ".spw";
  if (path ~ /^public\/css\/bundles\//) return "generated css bundles";
  if (path ~ /^public\/css\//) return "source css";
  if (path ~ /^public\/js\//) return "runtime js";
  if (path ~ /^scripts\//) return "scripts";
  if (path ~ /^public\/images\//) return "images";
  if (path ~ /^_partials\//) return "partials";
  if (path ~ /(^|\/)index\.html$/) return "route html";
  return "other";
}

function add_order(name) {
  if (!seen[name]) {
    seen[name] = 1;
    order[++order_count] = name;
  }
}

{
  code = substr($0, 1, 2);
  path = substr($0, 4);
  if (path ~ / -> /) {
    split(path, moved, " -> ");
    path = moved[2];
  }

  bucket = category(path);
  add_order(bucket);
  count[bucket]++;
  total++;
  files[bucket] = files[bucket] "  " code " " path "\n";
}

END {
  print "[changes] files=" total " buckets=" order_count;
  print "";
  print "Suggested review groups:";

  for (i = 1; i <= order_count; i++) {
    bucket = order[i];
    print "- " bucket ": " count[bucket] " file(s)";
  }

  print "";
  for (i = 1; i <= order_count; i++) {
    bucket = order[i];
    print "## " bucket;
    printf "%s", files[bucket];
    print "";
  }
}
'
