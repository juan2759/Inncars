#!/usr/bin/env bash
set -e

echo ">>> Python: $(python --version)"
echo ">>> Node:   $(node --version)"

echo ""
echo "=== [1/3] Build frontend ==="
cd frontend
npm install --prefer-offline
npm run build
cd ..

echo ""
echo "=== [2/3] Copiar frontend a backend/static/frontend ==="
rm -rf backend/static/frontend
mkdir -p backend/static
cp -r frontend/dist backend/static/frontend
echo "    Archivos copiados:"
ls backend/static/frontend/

echo ""
echo "=== [3/3] Instalar dependencias Python ==="
cd backend
pip install --upgrade pip -q
pip install -r requirements.txt -q

echo ""
echo "=== Build completo ==="
