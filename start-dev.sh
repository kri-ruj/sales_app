#!/bin/bash

# Bright Sales App - Development Startup Script
echo "🎤 Starting Bright Sales App Development Environment"
echo "=================================================="

# Check if MongoDB is running
echo "🔍 Checking MongoDB connection..."
if ! command -v mongosh &> /dev/null; then
    echo "⚠️  mongosh not found. Please install MongoDB and mongosh"
    echo "📋 Installation guide: https://docs.mongodb.com/manual/installation/"
fi

# Check if MongoDB is accessible
if mongosh --eval "db.adminCommand('ping')" --quiet; then
    echo "✅ MongoDB is running"
else
    echo "⚠️  MongoDB is not running. Please start MongoDB first:"
    echo "   - macOS: brew services start mongodb/brew/mongodb-community"
    echo "   - Linux: sudo systemctl start mongod"
    echo "   - Windows: net start MongoDB"
fi

# Install dependencies if needed
echo ""
echo "📦 Installing dependencies..."
if [ ! -d "node_modules" ]; then
    echo "Installing frontend dependencies..."
    npm install
fi

if [ ! -d "backend/node_modules" ]; then
    echo "Installing backend dependencies..."
    cd backend && npm install && cd ..
fi

# Build backend
echo ""
echo "🔨 Building backend..."
cd backend && npm run build && cd ..

# Start development servers
echo ""
echo "🚀 Starting development servers..."
echo "   - Frontend: http://localhost:3999"
echo "   - Backend:  http://localhost:5999"
echo "   - API:      http://localhost:5999/api"
echo ""
echo "Press Ctrl+C to stop both servers"
echo ""

# Run both frontend and backend concurrently
npm run dev