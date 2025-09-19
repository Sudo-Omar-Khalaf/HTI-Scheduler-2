#!/bin/bash

echo "🚀 LAUNCHING HTI SCHEDULER PROJECT"
echo "=================================="

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}📊 Starting Backend Server...${NC}"
cd server
node index.js &
BACKEND_PID=$!

# Wait a moment for backend to start
sleep 3

echo -e "${BLUE}🎨 Starting Frontend Server...${NC}"
cd ../client
npm run dev &
FRONTEND_PID=$!

# Wait a moment for frontend to start
sleep 5

echo -e "${GREEN}✅ HTI SCHEDULER IS NOW RUNNING!${NC}"
echo -e "${GREEN}=================================${NC}"
echo -e "${YELLOW}📱 Frontend:${NC} http://localhost:5173"
echo -e "${YELLOW}🔧 Backend:${NC}  http://localhost:5000"
echo ""
echo -e "${YELLOW}🔍 Available Features:${NC}"
echo "• Upload Arabic Excel timetables"
echo "• Parse course schedules with shared groups"
echo "• Generate conflict-free schedules"
echo "• Export to Excel/CSV formats"
echo "• Full Arabic RTL support"
echo ""
echo -e "${BLUE}Press Ctrl+C to stop all servers${NC}"

# Function to cleanup on exit
cleanup() {
    echo -e "\n${YELLOW}🛑 Stopping servers...${NC}"
    kill $BACKEND_PID 2>/dev/null
    kill $FRONTEND_PID 2>/dev/null
    exit 0
}

# Trap Ctrl+C and cleanup
trap cleanup SIGINT

# Keep script running
wait
