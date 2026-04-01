#!/bin/bash

# ─────────────────────────────────────
# De 3 Ster — opstartscript
# Gebruik: bash start.sh
# ─────────────────────────────────────

echo ""
echo "★  De 3 Ster — systeem opstarten"
echo "─────────────────────────────────"

# 1. Docker controleren
if ! docker info > /dev/null 2>&1; then
  echo "❌ Docker staat niet aan. Open Docker Desktop en probeer opnieuw."
  exit 1
fi
echo "✅ Docker draait"

# 2. Database starten
cd /Users/julian/Agency/3ster
docker compose up -d > /dev/null 2>&1
echo "✅ Database gestart"

# 3. Wacht tot MySQL klaar is
sleep 3

# 4. Backend starten
cd /Users/julian/Agency/3ster/backend
npm run dev &
BACKEND_PID=$!
echo "✅ Backend gestart op http://localhost:3001"

# 5. Even wachten
sleep 2

# 6. Dashboard starten
cd /Users/julian/Agency/3ster/dashboard
npm run dev &
DASHBOARD_PID=$!
echo "✅ Dashboard gestart op http://localhost:5173"

echo ""
echo "─────────────────────────────────"
echo "🌐 Open http://localhost:5173"
echo "   Inloggen: julian@3ster.nl / password"
echo "─────────────────────────────────"
echo ""
echo "Druk op Ctrl+C om alles te stoppen."
echo ""

# Open browser
sleep 2
open http://localhost:5173

# Wacht tot Ctrl+C
trap "echo ''; echo 'Stoppen...'; kill $BACKEND_PID $DASHBOARD_PID 2>/dev/null; docker compose -f /Users/julian/Agency/3ster/docker-compose.yml stop; echo '✅ Alles gestopt.'; exit 0" INT
wait
