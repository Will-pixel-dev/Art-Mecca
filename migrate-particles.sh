#!/usr/bin/env bash
# migrate-particles.sh — consolidate inline particle systems into particles-global.js
# Run from project root. Commit a checkpoint before running.

# --- Palette mapping ---
declare -A PALETTE=(
  ["pages/account/settings.html"]="red"
  ["pages/admin/admin-template.html"]="white"
  ["pages/admin/moderation.html"]="venus"
  ["pages/auth/login.html"]="sunset"
  ["pages/auth/register.html"]="twilight"
  ["pages/community/artwork-detail.html"]="purple"
  ["pages/community/edit-artwork.html"]="green"
  ["pages/community/hub.html"]="gold"
  ["pages/community/my-uploads.html"]="twilight"
  ["pages/community/notifications.html"]="pink"
  ["pages/community/nsfw-gallery.html"]="velvet"
  ["pages/community/points.html"]="sunset"
  ["pages/community/upload.html"]="twilight"
  ["pages/Equip/blog.html"]="neon"
  ["pages/Equip/cv-templates.html"]="purple"
  ["pages/Equip/earn.html"]="green"
  ["pages/Equip/Equip.html"]="purple"
  ["pages/Equip/portfolio-mode.html"]="twilight"
  ["pages/Equip/portfolio-templates.html"]="pink"
  ["pages/software/software-comparison.html"]="blue"
  ["pages/software/software-journals.html"]="blue"
  ["pages/tools/color-palette-generator.html"]="pink"
  ["pages/tools/color-scheme-analyzer.html"]="blue"
  ["pages/tools/prompt-generator.html"]="gold"
  ["pages/tools/software-quiz.html"]="blue"
  ["pages/tools/tools.html"]="green"
  ["pages/tutorials/character-design/character-design-tutorials.html"]="sunset"
  ["pages/tutorials/character-design/character-design.html"]="sunset"
  ["pages/tutorials/color-lighting/color-lighting-tutorials.html"]="gold"
  ["pages/tutorials/digital-painting/digital-painting-tutorials.html"]="green"
  ["pages/tutorials/digital-painting/digital-painting.html"]="green"
  ["pages/tutorials/facial-features/eye-render-tutorial.html"]="pink"
  ["pages/tutorials/facial-features/facial-anatomy-basics.html"]="pink"
  ["pages/tutorials/facial-features/facial-anatomy-tutorials.html"]="pink"
  ["pages/tutorials/facial-features/lip-rendering-tutorial.html"]="pink"
  ["pages/tutorials/facial-features/nose-rendering-tutorial.html"]="pink"
  ["pages/tutorials/facial-features/skin-rendering-tutorial.html"]="pink"
  ["pages/tutorials/software-guides/krita-basics.html"]="blue"
  ["pages/tutorials/software-guides/software-guides-tutorials.html"]="blue"
  ["pages/tutorials/workflow-process/time-management.html"]="purple"
  ["pages/tutorials/workflow-process/workflow-process-tutorials.html"]="purple"
)

# --- Skip list ---
should_skip() {
  case "$1" in
    */messages.html|*/title.html) return 0 ;;
    *) return 1 ;;
  esac
}

# --- Step 1: ensure canvas has data-particle-color="palette" ---
update_canvas() {
  local file="$1"
  local palette="$2"

  if grep -q 'data-particle-color="[^"]' "$file"; then
    echo "  ✓ canvas already has a palette value"
    return 0
  fi

  if grep -q 'data-particle-color=""' "$file"; then
    # Empty attribute — fill it in
    sed -i.bak "s|data-particle-color=\"\"|data-particle-color=\"${palette}\"|" "$file"
    echo "  ✓ filled empty palette -> ${palette}"
    return 0
  fi

  if grep -q '<canvas id="particleCanvas"></canvas>' "$file"; then
    sed -i.bak \
      "s|<canvas id=\"particleCanvas\"></canvas>|<canvas id=\"particleCanvas\" data-particle-color=\"${palette}\"></canvas>|" \
      "$file"
    echo "  ✓ added palette -> ${palette}"
    return 0
  fi

  if grep -q 'id="particleCanvas"' "$file"; then
    sed -i.bak -E \
      "s|(<canvas[^>]*id=\"particleCanvas\"[^>]*)(>)|\\1 data-particle-color=\"${palette}\"\\2|" \
      "$file"
    echo "  ✓ inserted palette (canvas had extra attributes) -> ${palette}"
    return 0
  fi

  echo "  ⚠ no particleCanvas element found — no palette added"
}

# --- Step 2: remove the inline <script> particle block ---
# Uses awk. Detects from a line matching getElementById(...particleCanvas...)
# to a line matching `animateParticles();` (inclusive) and drops the range.
strip_inline_particles() {
  local file="$1"
  if ! grep -q 'getElementById("particleCanvas")\|getElementById('"'"'particleCanvas'"'"')' "$file"; then
    echo "  ✓ no inline particle block found (already removed?)"
    return 0
  fi

  awk '
    BEGIN { skip=0; found=0 }
    skip==0 && /getElementById\(["\x27]particleCanvas["\x27]\)/ {
      skip=1; found=1
      print "        /* Particle system removed — now handled by particles-global.js */"
      next
    }
    skip==1 {
      if (/animateParticles\(\)\s*;/) {
        skip=0
        next
      }
      next
    }
    { print }
    END { if (found) exit 0; else exit 1 }
  ' "$file" > "$file.tmp"

  if [[ $? -eq 0 ]]; then
    mv "$file.tmp" "$file"
    echo "  ✓ removed inline particle block"
  else
    rm -f "$file.tmp"
    echo "  ⚠ inline block pattern not matched — check manually"
  fi
}

# --- Step 3: ensure /particles-global.js is loaded (with leading slash) ---
ensure_global_script() {
  local file="$1"

  # Already has the correct root-relative path?
  if grep -q 'src="/particles-global\.js"' "$file"; then
    echo "  ✓ /particles-global.js already loaded"
    return 0
  fi

  # Has a relative-path version that needs fixing?
  if grep -q 'src="particles-global\.js"' "$file"; then
    sed -i.bak 's|src="particles-global\.js"|src="/particles-global.js"|g' "$file"
    echo "  ✓ fixed relative path -> /particles-global.js"
    return 0
  fi

  # Not loaded at all — insert before </body>
  sed -i.bak 's|</body>|    <script src="/particles-global.js"></script>\n</body>|' "$file"
  echo "  ✓ added /particles-global.js before </body>"
}

# --- Main loop ---
OK=0
SKIPPED=0
FAILED=0

for file in "${!PALETTE[@]}"; do
  palette="${PALETTE[$file]}"

  if [[ ! -f "$file" ]]; then
    echo "⚠ MISSING: $file"
    ((FAILED++))
    continue
  fi

  if should_skip "$file"; then
    echo "⏭ SKIPPED: $file"
    ((SKIPPED++))
    continue
  fi

  echo "🔧 $file  (palette: $palette)"
  update_canvas "$file" "$palette"
  strip_inline_particles "$file"
  ensure_global_script "$file"
  echo ""
  ((OK++))
done

echo "=========================================="
echo "✅ Processed: $OK"
echo "⏭  Skipped:   $SKIPPED"
echo "⚠  Failed:    $FAILED"
echo "=========================================="
