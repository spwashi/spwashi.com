# Image Optimization Skill

Generate responsive image variants from source images using ImageMagick + cwebp, producing AVIF/WebP/PNG at surface-specific size tiers.

## When to Use

- After renaming an image with `/image-naming-magic`
- When you have a source image (PNG, JPG, WebP) that needs optimization
- To generate srcset HTML snippets for embedding images with responsive sizing
- To update `.spw` sidecar metadata with optimization records

## Workflow

```bash
/image-optimize [image-path] [--surface=TYPE] [--dry-run]
```

**Arguments:**
- `image-path` — Full or relative path to source image (e.g., `/public/images/assets/illustrations/teal-reflection.png`)
- `--surface=TYPE` — Optional: rpg-wednesday | pretext-lab | illustrations | motifs (auto-detected from path if omitted)
- `--dry-run` — Optional: show what would be generated without writing files

**Process:**
1. Validate source image exists and is readable
2. Extract image characteristics: format, dimensions, color space
3. Detect surface type (from directory path or `--surface` flag)
4. Look up size tiers for that surface
5. Generate variants:
   - Create temporary files for each size/format combo
   - Use `convert` (ImageMagick) to resize + apply quality
   - Use `cwebp` to generate WebP variants
   - Use `avifenc` (if available) for AVIF variants
   - PNG fallback always generated
6. Write variants to flat directory structure using naming convention:
   ```
   teal-reflection-thumb.avif   (256×256, 40% quality)
   teal-reflection-thumb.webp
   teal-reflection-thumb.png
   teal-reflection-display.avif  (512×512, 60% quality)
   teal-reflection-display.webp
   teal-reflection-display.png
   teal-reflection-hero.avif     (1024×1024, 75% quality)
   teal-reflection-hero.webp
   teal-reflection-hero.png
   ```
7. Update `.spw` sidecar with optimization metadata:
   - `optimized_on` timestamp
   - Original file size
   - Optimized variant sizes
   - Compression ratios
   - Available formats
8. Output srcset HTML snippet (copy-paste ready):
   ```html
   <img src="/public/images/assets/illustrations/teal-reflection-display.avif"
        srcset="
          /public/images/assets/illustrations/teal-reflection-thumb.avif 256w,
          /public/images/assets/illustrations/teal-reflection-display.avif 512w,
          /public/images/assets/illustrations/teal-reflection-hero.avif 1024w"
        sizes="(max-width: 512px) 100vw, 512px"
        alt="[from sidecar]" />
   ```

## Size Tiers (by Surface)

Defined in `references/size-tiers.spw`:

- **rpg-wednesday:** 320×320 (thumb), 640×640 (display), 1024×1024 (hero)
- **pretext-lab:** 400×400 (thumb), 800×800 (display), 1200×1200 (hero)
- **illustrations:** 256×256 (thumb), 512×512 (display), 1024×1024 (hero)
- **motifs:** 64×64 (icon), 256×256 (display), 512×512 (large)

Quality targets: 40% (thumb), 60% (display), 75% (hero/full)

## Output Artifacts

1. **Variant files** — 9 files per image (3 sizes × 3 formats)
2. **Updated .spw sidecar** — optimization metadata block
3. **srcset HTML snippet** — ready to copy into HTML/Markdown
4. **Summary report** — file sizes, compression ratios, formats generated

## Heuristics

- **Aspect ratio:** Preserved from source (no cropping)
- **Format detection:** PNG → lossless (slight compression); JPG → lossy; WebP source → match quality
- **Fallback:** PNG always generated for maximum compatibility
- **AVIF support:** Attempted if `avifenc` available; warn if missing
- **Tool availability:** Check for `convert`, `cwebp`, `avifenc` before starting

## Dependencies

- `ImageMagick` (provides `convert` or `magick` command) — resize + JPEG compression
- `cwebp` — WebP generation (often bundled with ImageMagick)
- `avifenc` (optional) — AVIF generation; skip with warning if unavailable
- Bash + standard utilities (identify, du, etc.)

## Integration Notes

- Skill updates `.spw` sidecar in place (idempotent)
- Safe to re-run on already-optimized images (overwrites variants)
- HTML snippet can be pasted directly into templates
- Pairs with `/image-naming-magic` skill (run naming first, then optimize)

## Examples

```bash
# Optimize an illustration, auto-detect surface from path
/image-optimize /public/images/assets/illustrations/teal-reflection.png

# Optimize with explicit surface (useful if path doesn't match convention)
/image-optimize ./render.png --surface=rpg-wednesday

# Dry-run to see what would be generated
/image-optimize /public/images/assets/pretext-lab/physics-diagram.png --dry-run

# The skill will output:
# ✓ Optimized teal-reflection at 3 sizes, 3 formats
# ✓ Compression: 1.6 MB → 342 KB (21% of original)
# ✓ Updated teal-reflection.spw with optimization metadata
# 
# Copy this srcset snippet:
# [HTML snippet printed to stdout]
```

## Troubleshooting

| Issue | Solution |
|-------|----------|
| `convert: command not found` | Install ImageMagick: `brew install imagemagick` or `apt-get install imagemagick` |
| `cwebp: command not found` | WebP generation will be skipped (PNG fallback still works) |
| `avifenc: command not found` | AVIF generation will be skipped (warning printed) |
| Variants not being generated | Check permissions on image file and destination directory; try `--dry-run` first |
| Sidecar .spw not updating | Verify `.spw` file exists and is writable; check Spw syntax before update |

## Future Extensions

- Batch mode: optimize entire directory in one call
- Caching: skip regeneration if source hasn't changed (mtime check)
- Blur-up/LQIP: generate ultra-low-res placeholder for progressive loading
- Metadata: preserve EXIF if present, or strip for privacy
