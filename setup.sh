#!/bin/bash
set -e

echo "=== Notarium+ Setup Script ==="
echo ""

# Check Node version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
  echo "❌ Node.js 18+ required. You have $NODE_VERSION"
  exit 1
fi

echo "✓ Node.js version OK"

# Install dependencies
echo "Installing dependencies..."
npm install

# Setup environment
echo "Setting up environment..."
cp .env.example .env.local

echo ""
echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "1. Edit .env.local with your configuration"
echo "2. Run 'npm run dev' to start development servers"
echo "3. Open http://localhost:5173 for frontend"
echo "4. Backend API available at http://localhost:8787"
