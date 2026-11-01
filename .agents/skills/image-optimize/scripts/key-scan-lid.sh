#!/bin/sh
# key-scan-lid.sh <master.png> <out-rgba.png> [dark%] [chroma%] [open-radius] [core-radius]
#
# Cutouts scanned on a clear sheet lie on the scanner lid, so the black around
# them is not part of the piece (creator, 2026-09-28). This keys the lid to
# transparent on a stripped 2048px intermediate and writes RGBA PNG, plus
# <out>.cleared holding the fraction cleared.
#
# Lid = dark (under 30% after a 5x5 median: the lid's texture sits near 17%
# grey and speckles a plain threshold) + neutral (under 10% chroma) + broad (a
# core that survives a wide opening, so heavy marker touching a cutout's edge
# stays) + reached from the scan edge. The core regrows three small steps inside
# a finer mask so narrow gaps between cutouts still clear. Light slivers in an
# 8px edge band clear only where they meet the lid; pure white reached from the
# edge is uncovered glass (paper sits near 232). A black-paper cutout cannot be
# told from the lid: keep that scan as scanned. Read every result by eye on a
# coloured ground. Record: .spw/surfaces/folio-archive/release-2026-10-31.spw.
set -e
IN="$1"; OUT="$2"; DK="${3:-30}"; CH="${4:-10}"; R="${5:-5}"; RC="${6:-10}"
T=$(mktemp -d "${TMPDIR:-/tmp}/key.XXXXXX")
magick "$IN" -strip -resize '2048x2048>' -colorspace sRGB -type TrueColor "$T/i.png"
W=$(magick identify -format %w "$T/i.png"); H=$(magick identify -format %h "$T/i.png")
magick "$T/i.png" -colorspace Gray -statistic Median 5x5 -threshold "${DK}%" -negate "$T/dark.png"
magick "$T/i.png" -colorspace HCL -channel G -separate +channel -statistic Median 5x5 -threshold "${CH}%" -negate "$T/lowc.png"
# edge band: 8px frame, white
magick -size ${W}x${H} xc:black -fill none -stroke white -strokewidth 16 -draw "rectangle 0,0 $((W-1)),$((H-1))" "$T/band.png"
magick "$T/dark.png" "$T/lowc.png" -compose Multiply -composite -morphology Open "Disk:$R" "$T/cand0.png"
# let the flood cross the band, then keep band pixels only where they touch real lid
magick "$T/cand0.png" "$T/band.png" -compose Lighten -composite -bordercolor white -border 1 -fill gray50 -draw 'color 0,0 floodfill' -shave 1x1 \
  -fill black +opaque gray50 -fill white -opaque gray50 "$T/reach.png"
# core: only broad lid survives a wide opening; regrow a little, geodesically, inside a fine candidate
magick "$T/dark.png" "$T/lowc.png" -compose Multiply -composite -morphology Open Disk:2 "$T/fine.png"
magick "$T/reach.png" "$T/cand0.png" -compose Multiply -composite -morphology Open "Disk:$RC" "$T/lidcore.png"
for k in 1 2 3; do magick "$T/lidcore.png" -morphology Dilate Disk:2 "$T/fine.png" -compose Multiply -composite "$T/lidcore.png"; done
magick "$T/lidcore.png" -morphology Dilate Disk:12 "$T/band.png" -compose Multiply -composite "$T/lidband.png"
magick "$T/i.png" -colorspace Gray -threshold 98.5% -morphology Open Disk:2 -bordercolor white -border 1 \
  -fill gray50 -draw 'color 0,0 floodfill' -shave 1x1 -fill black +opaque gray50 -fill white -opaque gray50 "$T/glass.png"
magick "$T/lidcore.png" "$T/lidband.png" -compose Lighten -composite "$T/glass.png" -compose Lighten -composite -negate -blur 0x0.7 "$T/alpha.png"
magick "$T/i.png" "$T/alpha.png" -alpha off -compose CopyOpacity -composite "$OUT"
magick "$T/alpha.png" -format "%[fx:1-mean]" info: > "$OUT.cleared"
rm -rf "$T"
