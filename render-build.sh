#!/bin/bash
set -e

echo "🔧 Installing dependencies..."
pnpm install

echo "🏗️ Building Medusa admin and backend..."
pnpm run build

echo "✅ Build complete!"
echo "📁 Checking build output..."
ls -la .medusa/admin || echo "⚠️ Admin build directory not found"
ls -la dist || echo "⚠️ Dist directory not found"
