#!/bin/bash

echo "🚀 HTI SCHEDULER - DEPLOYMENT SCRIPT"
echo "===================================="

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm first."
    exit 1
fi

echo "✅ Node.js and npm are installed"

# Install backend dependencies
echo "📦 Installing backend dependencies..."
cd server
npm install
if [ $? -ne 0 ]; then
    echo "❌ Failed to install backend dependencies"
    exit 1
fi
cd ..

# Install frontend dependencies
echo "📦 Installing frontend dependencies..."
cd client
npm install
if [ $? -ne 0 ]; then
    echo "❌ Failed to install frontend dependencies"
    exit 1
fi
cd ..

# Build frontend for production
echo "🔨 Building frontend for production..."
cd client
npm run build
if [ $? -ne 0 ]; then
    echo "❌ Failed to build frontend"
    exit 1
fi
cd ..

# Create uploads directory
echo "📁 Creating uploads directory..."
mkdir -p server/uploads

# Set appropriate permissions
chmod 755 server/uploads

echo ""
echo "🎉 HTI SCHEDULER DEPLOYMENT COMPLETE!"
echo "===================================="
echo ""
echo "📋 Next Steps:"
echo "1. Start the backend server:"
echo "   cd server && npm start"
echo ""
echo "2. The frontend build is ready in client/dist/"
echo "   Serve it with your preferred web server"
echo ""
echo "3. Or run in development mode:"
echo "   Backend:  cd server && npm start"
echo "   Frontend: cd client && npm run dev"
echo ""
echo "🌐 Default URLs:"
echo "   Backend API: http://localhost:5000"
echo "   Frontend:    http://localhost:5173 (dev mode)"
echo ""
echo "📚 Documentation: See PROJECT-COMPLETION-REPORT.md"
echo ""
echo "✅ Ready for production use!"
