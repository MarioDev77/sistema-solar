#!/usr/bin/env bash
# =============================================================
# download-textures.sh — Sistema Solar (texturas 4K/8K NASA/SSS)
# Uso:
#   1. Extraia o ZIP do projeto
#   2. cd sistema-solar-main/frontend/public/textures
#   3. bash download-textures.sh
# Depois redimensione com: bash resize-4k.sh   (opcional, requer ImageMagick)
# =============================================================
set -uo pipefail

SSS="https://www.solarsystemscope.com/textures/download"
PJ="https://photojournal.jpl.nasa.gov/jpeg"

# ---- Arquivos prontos: Solar System Scope (8K equiretangular, CC BY 4.0) ----
declare -A SSS_MAP=(
  [sun.jpg]="8k_sun.jpg"
  [mercury.jpg]="8k_mercury.jpg"
  [venus.jpg]="8k_venus_surface.jpg"
  [earth.jpg]="8k_earth_daymap.jpg"
  [moon.jpg]="8k_moon.jpg"
  [mars.jpg]="8k_mars.jpg"
  [jupiter.jpg]="8k_jupiter.jpg"
  [saturn.jpg]="8k_saturn.jpg"
  [saturn-ring.png]="8k_saturn_ring_alpha.png"
  [uranus.jpg]="2k_uranus.jpg"       # SSS so disponibiliza 2K p/ Urano
  [neptune.jpg]="2k_neptune.jpg"     # SSS so disponibiliza 2K p/ Netuno
  # extras (opcionais — Terra):
  [earth-night.jpg]="8k_earth_nightmap.jpg"
  [earth-clouds.jpg]="8k_earth_clouds.jpg"
)

# ---- NASA/JPL Photojournal (dominio publico) — luas de Saturno + Plutao ----
# Estes sao os mosaicos globais da Cassini citados no CREDITOS.txt.
# Atenção: alguns vem com legendas/insetos polares — recorte se necessario.
declare -A PJ_MAP=(
  [pluto.jpg]="PIA11707.jpg"     # Pluto Color Map (New Horizons, global)
  [enceladus.jpg]="PIA18435.jpg" # Color Maps of Enceladus 2014 (Cassini)
  [dione.jpg]="PIA18434.jpg"     # Color Maps of Dione 2014 (Cassini)
  [iapetus.jpg]="PIA18436.jpg"   # Color Maps of Iapetus 2014 (Cassini)
  [mimas.jpg]="PIA18437.jpg"     # Color Map of Mimas 2014 (Cassini)
  [rhea.jpg]="PIA18438.jpg"      # Color Maps of Rhea 2014 (Cassini)
  [tethys.jpg]="PIA18439.jpg"    # Color Maps of Tethys 2014 (Cassini)
  [titan.jpg]="PIA19658.jpg"     # Titan Global Map June 2015 (Cassini ISS)
)

download() {
  local url="$1" out="$2"
  if [ -s "$out" ]; then echo "  [ok ja existe] $out"; return 0; fi
  echo "  baixando $out ..."
  curl -fL --retry 3 --connect-timeout 30 -o "$out" "$url" \
    && echo "  [ok] $out" || echo "  [FALHOU] $out  <- verifique: $url"
}

echo "== Solar System Scope (8K) =="
for out in "${!SSS_MAP[@]}"; do download "$SSS/${SSS_MAP[$out]}" "$out"; done

echo; echo "== NASA/JPL Photojournal =="
for out in "${!PJ_MAP[@]}"; do download "$PJ/${PJ_MAP[$out]}" "$out"; done

echo; echo "== LEMBRETE: estas luas precisam download manual (ver tabela) =="
for m in io europa ganymede callisto triton titania oberon umbriel ariel miranda phobos deimos charon; do
  [ -s "$m.jpg" ] || echo "  pendente: $m.jpg"
done
echo; echo "Concluido. Atualize o CREDITOS.txt (modelo em CREDITOS-novo.txt)."
