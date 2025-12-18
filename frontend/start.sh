#!/bin/bash

echo "🚀 VideoConf Application Startup Script"
echo "========================================"

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    exit 1
fi

# Check if PostgreSQL is running (basic check)
if ! pg_isready -q; then
    echo "⚠️  PostgreSQL might not be running. Please ensure PostgreSQL is started."
fi

echo "📦 Setting up Backend..."
cd backend

# Check if .env exists, if not run setup
if [ ! -f .env ]; then
    echo "🔧 Running backend setup..."
    npm run setup
    echo "⚠️  Please edit backend/.env file with your database credentials before continuing."
    echo "   Then run this script again."
    exit 0
fi

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    echo "📥 Installing backend dependencies..."
    npm install
fi

# Start backend in background
echo "🚀 Starting backend server..."
npm run dev &
BACKEND_PID=$!

# Wait a moment for backend to start
sleep 3

echo "📦 Setting up Frontend..."
cd ..

# Create .env.local if it doesn't exist
if [ ! -f .env.local ]; then
    echo "🔧 Creating frontend environment file..."
    echo "NEXT_PUBLIC_API_URL=http://localhost:5000/api" > .env.local
fi

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    echo "📥 Installing frontend dependencies..."
    npm install
fi

# Start frontend
echo "🚀 Starting frontend server..."
npm run dev &
FRONTEND_PID=$!

echo ""
echo "🎉 Application is starting up!"
echo "=============================="
echo "📱 Frontend: http://localhost:3000"
echo "🔧 Backend:  http://localhost:5000"
echo "📊 Health:   http://localhost:5000/health"
echo ""
echo "🔐 Demo Credentials:"
echo "   Admin: admin@example.com / password"
echo "   User:  john.doe@example.com / password"
echo ""
echo "Press Ctrl+C to stop both servers"

# Function to cleanup on exit
cleanup() {
    echo ""
    echo "🛑 Stopping servers..."
    kill $BACKEND_PID 2>/dev/null
    kill $FRONTEND_PID 2>/dev/null
    echo "✅ Servers stopped"
    exit 0
}

# Set up signal handlers
trap cleanup SIGINT SIGTERM

# Wait for both processes
wait 