#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}=====================================${NC}"
echo -e "${BLUE}   FileFlow Application Startup${NC}"
echo -e "${BLUE}=====================================${NC}"
echo

# Check if database is initialized
if [ ! -f "backend/instance/fileflow.db" ]; then
    echo -e "${GREEN}Initializing database...${NC}"
    cd /workspaces/file-uploader-viewing-mode-is-under-process-/FileFlow
    export FLASK_APP=backend.app
    flask init-db
fi

# Create user_files directory if it doesn't exist
mkdir -p backend/user_files

echo
echo -e "${GREEN}Starting Flask backend on port 5000...${NC}"
cd /workspaces/file-uploader-viewing-mode-is-under-process-/FileFlow
export FLASK_APP=backend.app
export FLASK_ENV=development
flask run --host=0.0.0.0 --port=5000 &
BACKEND_PID=$!

echo -e "${GREEN}Backend started with PID: $BACKEND_PID${NC}"
echo

# Wait a moment for backend to start
sleep 2

echo -e "${GREEN}Starting React frontend on port 3000...${NC}"
cd /workspaces/file-uploader-viewing-mode-is-under-process-/FileFlow/frontend
npm start &
FRONTEND_PID=$!

echo -e "${GREEN}Frontend started with PID: $FRONTEND_PID${NC}"
echo

echo -e "${BLUE}=====================================${NC}"
echo -e "${BLUE}   Application is starting up!${NC}"
echo -e "${BLUE}=====================================${NC}"
echo -e "Backend:  ${GREEN}http://localhost:5000${NC}"
echo -e "Frontend: ${GREEN}http://localhost:3000${NC}"
echo
echo "Press Ctrl+C to stop both servers"
echo

# Wait for both processes
wait $BACKEND_PID $FRONTEND_PID
