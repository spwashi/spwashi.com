#!/bin/sh
# scan-tiers.sh <master.png> <out-dir> <stem> [--key]
#
# Cuts a scan's tiers the way the folio sets ship: a stripped 2048px
# intermediate (lid keyed first with --key), then AVIF and WebP at 256, 512,
# and 1024 on the long edge (thumb q40, display q60, hero q75; tiers never
# upscale). The hero steps down by 5 toward a floor of 45 until under 120 KiB.
# Writes <out-dir>/<stem>-{thumb,display,hero}.{avif,webp} and <stem>.json with
# each tier's size, KiB, and final quality, which a sidecar's tiers facet copies.
set -e
M="$1"; O="$2"; STEM="$3"; KEY="${4:-}"
[ -f "$M" ] && [ -n "$O" ] && [ -n "$STEM" ] || { echo "usage: scan-tiers.sh <master.png> <out-dir> <stem> [--key]" >&2; exit 1; }
HERE=$(cd "$(dirname "$0")" && pwd); T=$(mktemp -d "${TMPDIR:-/tmp}/tiers.XXXXXX"); mkdir -p "$O"
if [ "$KEY" = "--key" ]; then "$HERE/key-scan-lid.sh" "$M" "$T/i.png"; CL=$(cat "$T/i.png.cleared"); K=1
else magick "$M" -strip -resize '2048x2048>' -colorspace sRGB "$T/i.png"; CL=""; K=0; fi
kib(){ echo $(( ($(wc -c < "$1") + 1023) / 1024 )); }
J="{\"stem\":\"$STEM\",\"keyed\":$K,\"cleared\":\"$CL\",\"src\":\"$(magick identify -format '%wx%h' "$M")\""
for spec in thumb:256:40 display:512:60 hero:1024:75; do
  t=${spec%%:*}; r=${spec#*:}; px=${r%%:*}; q=${r#*:}
  magick "$T/i.png" -resize "${px}x${px}>" -strip "$T/$t.png"
  WH=$(magick identify -format '%w %h' "$T/$t.png"); w=${WH% *}; h=${WH#* }
  qa=$q; while :; do avifenc -q $qa -s 6 -j 2 "$T/$t.png" "$O/$STEM-$t.avif" >/dev/null 2>&1; [ "$t" != hero ] || [ $(kib "$O/$STEM-$t.avif") -lt 120 ] || [ $qa -le 45 ] && break; qa=$((qa-5)); done
  qw=$q; while :; do cwebp -q $qw -m 6 -quiet "$T/$t.png" -o "$O/$STEM-$t.webp"; [ "$t" != hero ] || [ $(kib "$O/$STEM-$t.webp") -lt 120 ] || [ $qw -le 45 ] && break; qw=$((qw-5)); done
  J="$J,\"$t\":{\"w\":$w,\"h\":$h,\"avif_kib\":$(kib "$O/$STEM-$t.avif"),\"webp_kib\":$(kib "$O/$STEM-$t.webp"),\"avif_q\":$qa,\"webp_q\":$qw}"
done
echo "$J}" > "$O/$STEM.json"
rm -rf "$T"
