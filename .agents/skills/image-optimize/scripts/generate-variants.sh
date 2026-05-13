#!/usr/bin/env bash
set -euo pipefail

# Image optimization helper for site-ready derivatives.
# Generates AVIF/WebP/PNG variants at surface-specific size tiers and prints
# a responsive <picture> snippet with actual output widths.

IMAGE_PATH=""
SURFACE="auto"
DRY_RUN="false"
SHOW_HELP="false"

detect_surface() {
    local path="$1"
    if [[ "$path" == *"rpg-wednesday"* ]]; then
        echo "rpg-wednesday"
    elif [[ "$path" == *"pretext-lab"* ]]; then
        echo "pretext-lab"
    elif [[ "$path" == *"motifs"* ]]; then
        echo "motifs"
    elif [[ "$path" == *"illustrations"* ]]; then
        echo "illustrations"
    else
        echo "illustrations"
    fi
}

get_size_tiers() {
    local surface="$1"
    case "$surface" in
        rpg-wednesday)
            echo "320:thumb 640:display 1024:hero"
            ;;
        pretext-lab)
            echo "400:thumb 800:display 1200:hero"
            ;;
        motifs)
            echo "64:icon 256:display 512:large"
            ;;
        illustrations|*)
            echo "256:thumb 512:display 1024:hero"
            ;;
    esac
}

get_quality() {
    local tier="$1"
    case "$tier" in
        thumb|icon) echo "40" ;;
        display) echo "60" ;;
        large|hero) echo "75" ;;
        *) echo "60" ;;
    esac
}

print_usage() {
    cat <<'EOF'
Usage: generate-variants.sh [options] <image-path>

Options:
  --surface <name>      Override surface detection.
  --surface=<name>      Override surface detection.
  --dry-run             Print commands without writing files.
  -h, --help            Show this help.

Surface defaults:
  illustrations         256/512/1024 tiers
  rpg-wednesday         320/640/1024 tiers
  pretext-lab           400/800/1200 tiers
  motifs                64/256/512 tiers
EOF
}

find_magick_cmd() {
    if command -v magick >/dev/null 2>&1; then
        echo "magick"
        return 0
    fi

    if command -v convert >/dev/null 2>&1; then
        echo "convert"
        return 0
    fi

    return 1
}

check_tools() {
    local missing=()

    if ! MAGICK_CMD="$(find_magick_cmd)"; then
        missing+=("ImageMagick (install: brew install imagemagick)")
    fi

    if ! command -v cwebp >/dev/null 2>&1; then
        echo "⚠ cwebp not found - WebP generation will be skipped"
    fi

    if ! command -v avifenc >/dev/null 2>&1; then
        echo "⚠ avifenc not found - AVIF generation will be skipped"
    fi

    if [ "${#missing[@]}" -gt 0 ]; then
        echo "✗ Missing required tools:"
        printf '%s\n' "${missing[@]}"
        exit 1
    fi
}

get_image_dimensions() {
    local file="$1"
    if [ "$MAGICK_CMD" = "magick" ]; then
        magick identify -format '%w %h' "$file"
    else
        identify -format '%w %h' "$file"
    fi
}

get_file_bytes() {
    wc -c < "$1" | tr -d '[:space:]'
}

humanize_bytes() {
    awk -v bytes="$1" 'BEGIN {
        if (bytes >= 1048576) {
            printf "%.1f MiB", bytes / 1048576;
        } else if (bytes >= 1024) {
            printf "%.1f KiB", bytes / 1024;
        } else {
            printf "%d B", bytes;
        }
    }'
}

emit_srcset() {
    local format="$1"
    local first="true"
    local record

    for record in "${VARIANT_RECORDS[@]}"; do
        IFS='|' read -r rec_format rec_tier rec_path rec_width rec_height rec_bytes <<EOF
$record
EOF
        if [ "$rec_format" != "$format" ]; then
            continue
        fi

        if [ "$first" = "true" ]; then
            printf '      %s %sw' "$rec_path" "$rec_width"
            first="false"
        else
            printf ',\n      %s %sw' "$rec_path" "$rec_width"
        fi
    done

    printf '\n'
}

parse_args() {
    while [ $# -gt 0 ]; do
        case "$1" in
            --help|-h)
                SHOW_HELP="true"
                ;;
            --dry-run)
                DRY_RUN="true"
                ;;
            --surface=*)
                SURFACE="${1#--surface=}"
                ;;
            --surface)
                shift
                if [ $# -eq 0 ]; then
                    echo "✗ --surface requires a value"
                    exit 1
                fi
                SURFACE="$1"
                ;;
            --*)
                echo "✗ Unknown argument: $1"
                exit 1
                ;;
            *)
                if [ -z "$IMAGE_PATH" ]; then
                    IMAGE_PATH="$1"
                else
                    echo "✗ Unexpected extra path argument: $1"
                    exit 1
                fi
                ;;
        esac
        shift
    done
}

main() {
    parse_args "$@"

    if [ "$SHOW_HELP" = "true" ]; then
        print_usage
        exit 0
    fi

    if [ -z "$IMAGE_PATH" ]; then
        print_usage
        exit 1
    fi

    check_tools

    if [ ! -f "$IMAGE_PATH" ]; then
        echo "✗ Image not found: $IMAGE_PATH"
        exit 1
    fi

    local source_path="${IMAGE_PATH#./}"
    local basename filename dir original_bytes source_width source_height
    basename=$(basename "$IMAGE_PATH")
    filename="${basename%.*}"
    dir=$(dirname "$IMAGE_PATH")
    original_bytes=$(get_file_bytes "$IMAGE_PATH")
    read -r source_width source_height <<EOF
$(get_image_dimensions "$IMAGE_PATH")
EOF

    if [ "$SURFACE" = "auto" ]; then
        SURFACE=$(detect_surface "$IMAGE_PATH")
    fi

    local tiers
    tiers=$(get_size_tiers "$SURFACE")

    local public_base
    if [[ "$source_path" == public/* ]]; then
        public_base="/${source_path%.*}"
    else
        public_base="/public/images/assets/${filename}"
    fi

    echo "📦 Image Optimization"
    echo "  Source: $IMAGE_PATH"
    echo "  Surface: $SURFACE"
    echo "  Original dimensions: ${source_width}x${source_height}"
    echo "  Original size: $(humanize_bytes "$original_bytes")"

    local generated_count=0
    local total_variant_bytes=0
    local preferred_png_path=""
    local preferred_variant_width=""
    local preferred_variant_height=""
    local has_avif="false"
    local has_webp="false"
    VARIANT_RECORDS=()

    local tier_spec
    for tier_spec in $tiers; do
        local size tier_name quality temp_jpg png_file webp_file avif_file png_dims webp_dims avif_dims png_width png_height webp_width webp_height avif_width avif_height bytes
        size="${tier_spec%%:*}"
        tier_name="${tier_spec##*:}"
        quality="$(get_quality "$tier_name")"

        echo ""
        echo "  Generating ${tier_name} (${size}px target, ${quality}% quality)..."

        if [ "$DRY_RUN" = "true" ]; then
            temp_jpg="${TMPDIR:-/tmp}/${filename}-${tier_name}.jpg"
        else
            temp_jpg=$(mktemp "${TMPDIR:-/tmp}/${filename}-${tier_name}.XXXXXX.jpg")
        fi
        png_file="$dir/${filename}-${tier_name}.png"
        webp_file="$dir/${filename}-${tier_name}.webp"
        avif_file="$dir/${filename}-${tier_name}.avif"

        if [ "$DRY_RUN" = "true" ]; then
            echo "    [DRY] $MAGICK_CMD \"$IMAGE_PATH\" -resize ${size}x${size} -quality $quality \"$temp_jpg\""
        else
            "$MAGICK_CMD" "$IMAGE_PATH" -resize "${size}x${size}" -quality "$quality" "$temp_jpg"
        fi

        if [ "$DRY_RUN" = "true" ]; then
            echo "    [DRY] $MAGICK_CMD \"$temp_jpg\" \"$png_file\""
        else
            "$MAGICK_CMD" "$temp_jpg" "$png_file"
            bytes=$(get_file_bytes "$png_file")
            png_dims=$(get_image_dimensions "$png_file")
            read -r png_width png_height <<EOF
$png_dims
EOF
            VARIANT_RECORDS+=("png|$tier_name|$public_base-${tier_name}.png|$png_width|$png_height|$bytes")
            generated_count=$((generated_count + 1))
            total_variant_bytes=$((total_variant_bytes + bytes))
            echo "      ✓ PNG: $(humanize_bytes "$bytes")"

            if [ -z "$preferred_png_path" ] || [ "$tier_name" = "display" ]; then
                preferred_png_path="$public_base-${tier_name}.png"
                preferred_variant_width="$png_width"
                preferred_variant_height="$png_height"
            fi
        fi

        if [ "$DRY_RUN" = "true" ]; then
            echo "    [DRY] cwebp -q $quality \"$temp_jpg\" -o \"$webp_file\""
        elif command -v cwebp >/dev/null 2>&1; then
            cwebp -q "$quality" "$temp_jpg" -o "$webp_file" >/dev/null 2>&1
            bytes=$(get_file_bytes "$webp_file")
            webp_dims=$(get_image_dimensions "$webp_file")
            read -r webp_width webp_height <<EOF
$webp_dims
EOF
            VARIANT_RECORDS+=("webp|$tier_name|$public_base-${tier_name}.webp|$webp_width|$webp_height|$bytes")
            generated_count=$((generated_count + 1))
            total_variant_bytes=$((total_variant_bytes + bytes))
            has_webp="true"
            echo "      ✓ WebP: $(humanize_bytes "$bytes")"
        fi

        if [ "$DRY_RUN" = "true" ]; then
            echo "    [DRY] avifenc -q $quality \"$temp_jpg\" \"$avif_file\""
        elif command -v avifenc >/dev/null 2>&1; then
            avifenc -q "$quality" "$temp_jpg" "$avif_file" >/dev/null 2>&1
            bytes=$(get_file_bytes "$avif_file")
            avif_dims=$(get_image_dimensions "$avif_file")
            read -r avif_width avif_height <<EOF
$avif_dims
EOF
            VARIANT_RECORDS+=("avif|$tier_name|$public_base-${tier_name}.avif|$avif_width|$avif_height|$bytes")
            generated_count=$((generated_count + 1))
            total_variant_bytes=$((total_variant_bytes + bytes))
            has_avif="true"
            echo "      ✓ AVIF: $(humanize_bytes "$bytes")"
        fi

        rm -f "$temp_jpg"
    done

    if [ "$DRY_RUN" = "true" ]; then
        return 0
    fi

    echo ""
    echo "✓ Generated $generated_count variant files"

    if [ "$total_variant_bytes" -gt 0 ]; then
        local ratio
        ratio=$((total_variant_bytes * 100 / original_bytes))
        echo "✓ Total variant size: $(humanize_bytes "$total_variant_bytes") (${ratio}% of original)"
    fi

    echo ""
    echo "📋 Copy this picture snippet:"
    echo ""

    if [ "$has_avif" = "true" ]; then
        echo '  <picture>'
        echo '    <source type="image/avif" srcset="'
        emit_srcset avif
        echo '    " />'
    else
        echo '  <picture>'
    fi

    if [ "$has_webp" = "true" ]; then
        echo '    <source type="image/webp" srcset="'
        emit_srcset webp
        echo '    " />'
    fi

    echo '    <img'
    echo "      src=\"${preferred_png_path}\""
    echo '      srcset="'
    emit_srcset png
    echo '      "'
    echo "      sizes=\"(max-width: ${preferred_variant_width}px) 100vw, ${preferred_variant_width}px\""
    echo "      width=\"${source_width}\""
    echo "      height=\"${source_height}\""
    echo '      alt="[from sidecar]"'
    echo '      decoding="async" />'
    echo '  </picture>'
    echo ""
    echo "⚙ Next: Update ${filename}.spw with optimization metadata"
}

main "$@"
