#!/usr/bin/env bash
set -e

echo ">>> Node: $(node --version)"
echo ">>> npm:  $(npm --version)"
echo ">>> pip:  $(pip --version)"

echo ""
echo "=== [1/3] Build frontend ==="
cd frontend
npm install
npm run build
cd ..

echo ""
echo "=== [2/3] Copy frontend -> backend/static/frontend ==="
rm -rf backend/static/frontend
mkdir -p backend/static
cp -r frontend/dist backend/static/frontend
echo "Files copied:"
ls backend/static/frontend/

echo ""
echo "=== [3/3] Install Python dependencies ==="
pip install --upgrade pip -q
pip install -r backend/requirements.txt -q

echo ""
echo "=== Build complete ==="
