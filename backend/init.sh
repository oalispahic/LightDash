#!/bin/sh

# Ensure data directory exists
mkdir -p /app/data

# If database doesn't exist, create it with initial users
if [ ! -f /app/data/data.db ]; then
  echo "Initializing database..."
  node /app/setup-users.js
fi

# Start the app
node /app/src/index.js

