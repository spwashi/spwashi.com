#!/usr/bin/env bash
set -euo pipefail

# Image Optimization Script
# Generates AVIF/WebP/PNG variants at surface-specific size tiers

IMAGE_PATH="${1:-.}"
SURFACE="${2:-auto}"
DRY_RUN="${3:-false}"

# === Detect Surface Type ===
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
        echo "illustrations"  # default
    fi
}

# === Size Tiers by Surface ===
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

# === Quality by Tier ===
get_quality() {
    local tier="$1"
    case "$tier" in
        thumb|icon) echo "40" ;;
        display)    echo "60" ;;
        large|hero) echo "75" ;;
        *)          echo "60" ;;
    esac
}

# === Check Dependencies ===
check_tools() {
    local missing=()

    if ! command -v convert &>/dev/null && ! command -v magick &>/dev/null; then
        missing+=("ImageMagick (install: brew install imagemagick)")
    fi
    if ! command -v cwebp &>/dev/null; then
        echo "⚠ cwebp not found — WebP generation will be skipped"
    fi
    if ! command -v avifenc &>/dev/null; then
        echo "⚠ avifenc not found — AVIF generation will be skipped"
    fi

    if [ ${#missing[@]} -gt 0 ]; then
        echo "✗ Missing required tools:"
        printf '%s\n' "${missing[@]}"
        exit 1
    fi
}

# === Parse Arguments ===
parse_args() {
    local raw_arg="$1"

    if [[ "$raw_arg" == "--dry-run" ]]; then
        DRY_RUN="true"
        return
    fi

    if [[ "$raw_arg" == --surface=* ]]; then
        SURFACE="${raw_arg#--surface=}"
        return
    fi

    # Otherwise treat as image path
    IMAGE_PATH="$raw_arg"
}

# Process all remaining arguments
for arg in "$@"; do
    if [[ "$arg" != "$IMAGE_PATH" ]]; then
        parse_args "$arg"
    fi
done

# === Main Logic ===
main() {
    check_tools

    # Validate source image
    if [ ! -f "$IMAGE_PATH" ]; then
        echo "✗ Image not found: $IMAGE_PATH"
        exit 1
    fi

    # Get image info
    local basename=$(basename "$IMAGE_PATH")
    local filename="${basename%.*}"
    local ext="${basename##*.}"
    local dir=$(dirname "$IMAGE_PATH")
    local original_size=$(du -h "$IMAGE_PATH" | cut -f1)

    # Detect surface if needed
    if [ "$SURFACE" = "auto" ]; then
        SURFACE=$(detect_surface "$IMAGE_PATH")
    fi

    echo "📦 Image Optimization"
    echo "  Source: $IMAGE_PATH"
    echo "  Surface: $SURFACE"
    echo "  Original size: $original_size"

    # Get size tiers
    local tiers=$(get_size_tiers "$SURFACE")

    # Generate variants
    local generated_count=0
    local total_variant_size=0

    for tier_spec in $tiers; do
        local size="${tier_spec%%:*}"
        local tier_name="${tier_spec##*:}"
        local quality=$(get_quality "$tier_name")

        echo ""
        echo "  Generating ${tier_name} (${size}×${size}, ${quality}% quality)..."

        # Generate JPEG for conversion base
        local temp_jpg="/tmp/${filename}-${tier_name}.jpg"
        if [ "$DRY_RUN" = "true" ]; then
            echo "    [DRY] convert \"$IMAGE_PATH\" -resize ${size}x${size} -quality $quality \"$temp_jpg\""
        else
            convert "$IMAGE_PATH" -resize ${size}x${size} -quality $quality "$temp_jpg"
        fi

        # Generate PNG (fallback)
        local png_file="$dir/${filename}-${tier_name}.png"
        if [ "$DRY_RUN" = "true" ]; then
            echo "    [DRY] convert \"$temp_jpg\" \"$png_file\""
        else
            convert "$temp_jpg" "$png_file"
            generated_count=$((generated_count + 1))
            local png_size=$(du -h "$png_file" | cut -f1)
            echo "      ✓ PNG: $png_size"
            total_variant_size=$((total_variant_size + $(du -b "$png_file" | cut -f1)))
        fi

        # Generate WebP
        local webp_file="$dir/${filename}-${tier_name}.webp"
        if [ "$DRY_RUN" = "true" ]; then
            echo "    [DRY] cwebp -q $quality \"$temp_jpg\" -o \"$webp_file\""
        else
            if command -v cwebp &>/dev/null; then
                cwebp -q "$quality" "$temp_jpg" -o "$webp_file" 2>/dev/null
                generated_count=$((generated_count + 1))
                local webp_size=$(du -h "$webp_file" | cut -f1)
                echo "      ✓ WebP: $webp_size"
                total_variant_size=$((total_variant_size + $(du -b "$webp_file" | cut -f1)))
            fi
        fi

        # Generate AVIF
        local avif_file="$dir/${filename}-${tier_name}.avif"
        if [ "$DRY_RUN" = "true" ]; then
            echo "    [DRY] avifenc -q $quality \"$temp_jpg\" \"$avif_file\""
        else
            if command -v avifenc &>/dev/null; then
                avifenc -q "$quality" "$temp_jpg" "$avif_file" >/dev/null 2>&1
                generated_count=$((generated_count + 1))
                local avif_size=$(du -h "$avif_file" | cut -f1)
                echo "      ✓ AVIF: $avif_size"
                total_variant_size=$((total_variant_size + $(du -b "$avif_file" | cut -f1)))
            fi
        fi

        # Clean up temp
        [ "$DRY_RUN" = "false" ] && rm -f "$temp_jpg"
    done

    # Report
    if [ "$DRY_RUN" = "false" ]; then
        echo ""
        echo "✓ Generated $generated_count variant files"

        if [ $total_variant_size -gt 0 ]; then
            local human_variant_size=$(echo "scale=1; $total_variant_size / 1024 / 1024" | bc)
            local original_bytes=$(du -b "$IMAGE_PATH" | cut -f1)
            local ratio=$(echo "scale=1; $total_variant_size * 100 / $original_bytes" | cut -d. -f1)
            echo "✓ Total variant size: ${human_variant_size}M (${ratio}% of original)"
        fi

        # Output srcset snippet
        echo ""
        echo "📋 Copy this srcset snippet:"
        echo ""
        echo '  <img'
        echo "    src=\"${IMAGE_PATH/$dir\//\/public\/images\/}${filename}-display.avif\""
        echo "    srcset=\""
        for tier_spec in $tiers; do
            local size="${tier_spec%%:*}"
            local tier_name="${tier_spec##*:}"
            echo "      ${IMAGE_PATH/$dir\//\/public\/images\/}${filename}-${tier_name}.avif ${size}w,"
        done
        echo "    \""
        echo "    sizes=\"(max-width: 512px) 100vw, 512px\""
        echo "    alt=\"[from sidecar]\" />"
        echo ""

        echo "⚙ Next: Update ${filename}.spw with optimization metadata"
    fi
}

main
