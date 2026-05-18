#!/usr/bin/env bash
# Script de build para Render / Railway
# 1. Compila el frontend React
# 2. Copia el resultado a backend/static/frontend
# 3. Instala dependencias Python
set -e

echo "=== Build: frontend ==="
cd frontend
npm install
npm run build
cd ..

echo "=== Copiando frontend a backend/static/frontend ==="
rm -rf backend/static/frontend
mkdir -p backend/static
cp -r frontend/dist backend/static/frontend

echo "=== Build: backend ==="
cd backend
pip install -r requirements.txt

echo "=== Build completo ==="
