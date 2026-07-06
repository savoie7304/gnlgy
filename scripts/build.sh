#!/usr/bin/env bash
set -e

cd "$(dirname "$0")/.."

echo "=== Building frontend ==="
cd frontend
npm run build
cd ..

echo "=== Copying to backend static ==="
rm -rf backend/src/main/resources/static
cp -r frontend/dist backend/src/main/resources/static

echo "=== Building backend JAR ==="
cd backend
mvn package -DskipTests -q
cd ..

echo "=== Copying JAR to electron/ ==="
cp backend/target/backend-1.0.0.jar electron/genealogie.jar

echo "=== Installing Electron dependencies ==="
cd electron
npm install
cd ..

echo ""
echo "=== Done ==="
echo "Run: cd electron && npm start"
