#!/bin/bash
# Quick setup script for Marex Server Control

set -e

echo "🚀 Marex Server Control - Setup Script"
echo ""

# Check if .env exists
if [ ! -f ".env" ]; then
    echo "📝 Creating .env file..."
    cp .env.example .env
    echo "✓ .env created"
else
    echo "✓ .env already exists"
fi

# Generate JWT_SECRET if not set
if ! grep -q "^JWT_SECRET=" .env || grep -q "JWT_SECRET=your-secret" .env; then
    echo "🔐 Generating JWT_SECRET..."
    SECRET=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")

    if grep -q "^JWT_SECRET=" .env; then
        sed -i.bak "s/^JWT_SECRET=.*/JWT_SECRET=$SECRET/" .env
    else
        echo "JWT_SECRET=$SECRET" >> .env
    fi

    echo "✓ JWT_SECRET generated and saved to .env"
else
    echo "✓ JWT_SECRET already set"
fi

echo ""
echo "📦 Installing dependencies..."
npm install > /dev/null 2>&1 || true
cd backend && npm install > /dev/null 2>&1 && cd .. || true
cd frontend && npm install > /dev/null 2>&1 && cd .. || true

echo ""
echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "1. Edit .env file if you need to configure Telegram or other options"
echo "2. Run: docker-compose up --build -d"
echo "3. Visit: http://localhost"
echo ""
echo "For more help, see README.md"
