#!/bin/bash

# ─────────────────────────────────────────
# De 3 Ster — installatie script
# Gebruik: bash install.sh
# Zet bestanden neer in Julian/Agency/3ster
# ─────────────────────────────────────────

set -e

AGENCY_DIR="$(cd "$(dirname "$0")/.." && pwd)"
TARGET="$AGENCY_DIR/3ster"

echo ""
echo "📁 Installeren in: $TARGET"
echo ""

# Maak volledige mapstructuur aan
mkdir -p "$TARGET/backend/src/routes"
mkdir -p "$TARGET/backend/src/controllers"
mkdir -p "$TARGET/backend/src/models"
mkdir -p "$TARGET/backend/src/middleware"
mkdir -p "$TARGET/backend/src/config"
mkdir -p "$TARGET/dashboard/src/pages"
mkdir -p "$TARGET/dashboard/src/components"
mkdir -p "$TARGET/dashboard/src/hooks"
mkdir -p "$TARGET/dashboard/src/api"

# Kopieer bestanden
cp -r files/. "$TARGET/"

# Maak lege placeholders aan als ze nog niet bestaan
touch "$TARGET/backend/src/routes/reservations.js"
touch "$TARGET/backend/src/controllers/.gitkeep"
touch "$TARGET/backend/src/models/.gitkeep"
touch "$TARGET/backend/src/middleware/auth.js"
touch "$TARGET/backend/src/config/db.js"
touch "$TARGET/backend/server.js"
touch "$TARGET/dashboard/src/components/.gitkeep"
touch "$TARGET/dashboard/src/hooks/.gitkeep"
touch "$TARGET/dashboard/src/api/reservations.js"

echo "✅ Klaar! Structuur aangemaakt in:"
echo "   $TARGET"
echo ""
echo "Volgende stap:"
echo "   cd $TARGET && cat README.md"
echo ""
