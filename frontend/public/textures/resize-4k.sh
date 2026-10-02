#!/usr/bin/env bash
# resize-4k.sh — redimensiona texturas para 4096×2048 (alvo ideal p/ WebGL)
# Requer: ImageMagick (magick ou convert). Rode na pasta textures/.
for f in *.jpg; do
  [ "$f" = "saturn-ring.png" ] && continue
  magick "$f" -resize 4096x2048^ -gravity center -extent 4096x2048 "$f" \
    && echo "ok: $f" || echo "falhou: $f"
done
# Aneis: manter transparencia PNG
[ -f saturn-ring.png ] && magick saturn-ring.png -resize 4096x4096 saturn-ring.png
