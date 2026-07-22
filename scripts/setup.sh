#!/bin/bash
# Quick setup script for Marex Server Control

set -e

echo "Marex Server Control - Setup Script"
echo ""

# Check if .env exists
if [ ! -f ".env" ]; then
    echo "Creating .env file..."
    cp .env.example .env
    echo "✓ .env created"
else
    echo "✓ .env already exists"
fi

# Generate a 32-byte hex secret for the given env var if it's missing
# or still holds a placeholder value. Idempotent — safe to re-run.
generate_secret() {
    local var="$1"
    local placeholder_pattern="$2"

    if ! grep -q "^${var}=" .env \
       || grep -q "^${var}=$" .env \
       || { [ -n "$placeholder_pattern" ] && grep -q "$placeholder_pattern" .env; }; then
        echo "Generating ${var}..."
        local secret
        secret=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")

        if grep -q "^${var}=" .env; then
            sed -i.bak "s|^${var}=.*|${var}=${secret}|" .env
        else
            echo "${var}=${secret}" >> .env
        fi

        echo "✓ ${var} generated and saved to .env"
    else
        echo "✓ ${var} already set"
    fi
}

generate_secret JWT_SECRET "JWT_SECRET=your-secret"
generate_secret SYSD_TOKEN ""

echo ""
echo "Installing dependencies..."
npm install > /dev/null 2>&1 || true
cd backend && npm install > /dev/null 2>&1 && cd .. || true
cd frontend && npm install > /dev/null 2>&1 && cd .. || true

echo ""
echo "Setup complete!"
echo ""
echo "Next steps:"
echo "1. Edit .env file if you need to configure Telegram or other options"
echo "2. Run: docker-compose up --build -d"
echo "3. Visit: http://localhost"
echo ""
echo "For more help, see README.md"
