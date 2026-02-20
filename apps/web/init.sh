#!/bin/bash

# PuraToDo Development Server Initialization Script
# Usage: ./init.sh [options]
#
# Options:
#   --no-dev    Only install dependencies, don't start dev server
#   --help      Show this help message

set -e

echo "🚀 PuraToDo Development Environment"
echo "===================================="

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
else
    echo "✅ Dependencies already installed"
fi

# Check if .env.local exists
if [ ! -f ".env.local" ]; then
    echo "⚠️  .env.local not found"
    echo "   Please create .env.local with your Supabase credentials:"
    echo "   NEXT_PUBLIC_SUPABASE_URL=your-supabase-url"
    echo "   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key"
else
    echo "✅ .env.local found"
fi

# Parse arguments
START_DEV=true
while [[ "$#" -gt 0 ]]; do
    case $1 in
        --no-dev) START_DEV=false ;;
        --help)
            echo "Usage: ./init.sh [options]"
            echo ""
            echo "Options:"
            echo "  --no-dev    Only install dependencies, don't start dev server"
            echo "  --help      Show this help message"
            exit 0
            ;;
        *) echo "Unknown parameter: $1"; exit 1 ;;
    esac
    shift
done

if [ "$START_DEV" = true ]; then
    echo ""
    echo "🔥 Starting development server..."
    echo "   Local:    http://localhost:3000"
    echo ""
    npm run dev
else
    echo ""
    echo "✨ Environment ready! Run 'npm run dev' to start the server."
fi
