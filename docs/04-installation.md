# Installation Guide

This comprehensive guide walks you through setting up the HTI Personalized Weekly Schedule Generator on your local development environment.

## 📋 Prerequisites

### System Requirements
- **Operating System**: Windows 10+, macOS 10.15+, or Linux (Ubuntu 18.04+)
- **RAM**: Minimum 4GB, Recommended 8GB+
- **Storage**: At least 1GB free space
- **Internet Connection**: Required for dependencies and GitHub Copilot

### Required Software

#### 1. Node.js and npm
- **Version**: Node.js 16.x or higher
- **Download**: [nodejs.org](https://nodejs.org/)
- **Verification**:
  ```bash
  node --version  # Should show v16.x.x or higher
  npm --version   # Should show 8.x.x or higher
  ```

#### 2. Git
- **Version**: Git 2.25 or higher
- **Download**: [git-scm.com](https://git-scm.com/)
- **Verification**:
  ```bash
  git --version   # Should show git version 2.25.x or higher
  ```

#### 3. Visual Studio Code (Recommended)
- **Download**: [code.visualstudio.com](https://code.visualstudio.com/)
- **Extensions**: GitHub Copilot, ES7+ React/Redux/React-Native snippets

## 🚀 Step-by-Step Installation

### Step 1: Clone the Repository

```bash
# Clone the repository
git clone https://github.com/Sudo-Omar-Khalaf/HTI-Scheduler-2.git

# Navigate to project directory
cd HTI-scheduler-2

# Verify project structure
ls -la
```

Expected output:
```
drwxr-xr-x  client/
drwxr-xr-x  server/
drwxr-xr-x  docs/
-rw-r--r--  package.json
-rw-r--r--  README.md
-rw-r--r--  launch.sh
```

### Step 2: Install Root Dependencies

```bash
# Install root package dependencies
npm install

# Verify installation
npm list --depth=0
```

### Step 3: Install Backend Dependencies

```bash
# Navigate to server directory
cd server

# Install backend dependencies
npm install

# Verify backend installation
npm list --depth=0
```

Expected backend dependencies:
```
├── express@4.18.2
├── cors@2.8.5
├── multer@1.4.5
├── exceljs@4.3.0
├── nodemon@3.0.1 (dev)
└── concurrently@8.2.0 (dev)
```

### Step 4: Install Frontend Dependencies

```bash
# Navigate to client directory (from project root)
cd client

# Install frontend dependencies
npm install

# Verify frontend installation
npm list --depth=0
```

Expected frontend dependencies:
```
├── react@18.2.0
├── react-dom@18.2.0
├── react-router-dom@6.14.2
├── vite@4.4.5
├── tailwindcss@3.3.3
├── @vitejs/plugin-react@4.0.3
└── autoprefixer@10.4.14
```

### Step 5: Environment Configuration

#### Create Environment Files

```bash
# From project root directory
# Backend environment (optional for basic setup)
touch server/.env

# Frontend environment (optional for basic setup)
touch client/.env
```

#### Configure Server Environment (Optional)
```bash
# server/.env
PORT=5000
NODE_ENV=development
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=10485760
```

#### Configure Client Environment (Optional)
```bash
# client/.env
VITE_API_BASE_URL=http://localhost:5000
VITE_APP_NAME=HTI Scheduler
```

### Step 6: Verify Installation

#### Test Backend
```bash
# From server directory
cd server
npm run dev
```

Expected output:
```
[nodemon] starting `node index.js`
🚀 Server running on port 5000
📁 Upload directory: /path/to/uploads
🌐 CORS enabled for all origins
```

#### Test Frontend (New Terminal)
```bash
# From client directory
cd client
npm run dev
```

Expected output:
```
  VITE v4.4.5  ready in 543 ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
  ➜  press h to show help
```

### Step 7: Verify Full Stack

1. **Backend Check**: Visit `http://localhost:5000` (should show API info)
2. **Frontend Check**: Visit `http://localhost:5173` (should show React app)
3. **Integration Check**: Try uploading an Excel file through the UI

## 🔧 Alternative Installation Methods

### Method 1: Using Launch Script

```bash
# From project root - installs and starts everything
chmod +x launch.sh
./launch.sh
```

### Method 2: Using Root Package Script

```bash
# From project root - starts both servers
npm run dev
```

### Method 3: Docker Installation (Advanced)

```bash
# Build and run with Docker Compose
docker-compose up --build
```

## 📁 Directory Setup Verification

After installation, your directory structure should look like:

```
HTI-scheduler-2/
├── client/
│   ├── node_modules/          ✅ Frontend dependencies
│   ├── src/                   ✅ React source code
│   ├── package.json           ✅ Frontend config
│   └── dist/                  ✅ Build output (after npm run build)
├── server/
│   ├── node_modules/          ✅ Backend dependencies
│   ├── services/              ✅ Core business logic
│   ├── routes/                ✅ API endpoints
│   ├── uploads/               ✅ File upload directory
│   └── package.json           ✅ Backend config
├── docs/                      ✅ Documentation
├── node_modules/              ✅ Root dependencies
└── package.json               ✅ Root config
```

## 🧪 Installation Testing

### Test 1: Backend API Health Check

```bash
# Test server response
curl http://localhost:5000/

# Expected response:
# {"message":"HTI Scheduler API is running","version":"1.0.0"}
```

### Test 2: Frontend Loading

```bash
# Check if frontend builds successfully
cd client
npm run build

# Expected: dist/ folder created without errors
```

### Test 3: CLI Tools

```bash
# From project root
node table-demo.js

# Should show schedule generation demo
```

### Test 4: File Upload Test

```bash
# Test file upload endpoint
cd server
curl -X POST http://localhost:5000/api/excel/upload \
  -F "file=@../الجداول الدراسية _ الفصل الدراسي الأول _ قسم الهندسة الكهربية (1).xlsx"
```

## 🚨 Troubleshooting Installation Issues

### Common Issues and Solutions

#### Issue 1: Node.js Version Mismatch
```bash
# Check current version
node --version

# If version is below 16.x, update Node.js
# Download from nodejs.org or use version manager
```

#### Issue 2: Permission Errors (Linux/macOS)
```bash
# Fix npm permissions
sudo chown -R $(whoami) ~/.npm
sudo chown -R $(whoami) /usr/local/lib/node_modules
```

#### Issue 3: Port Already in Use
```bash
# Kill processes on ports 5000 and 5173
sudo lsof -ti:5000 | xargs kill -9
sudo lsof -ti:5173 | xargs kill -9
```

#### Issue 4: Module Not Found Errors
```bash
# Clear npm cache and reinstall
rm -rf node_modules package-lock.json
npm cache clean --force
npm install
```

#### Issue 5: Build Failures
```bash
# Clear build cache
rm -rf client/dist server/dist
npm run clean  # if available
npm run build
```

### Windows-Specific Issues

#### PowerShell Execution Policy
```powershell
# Enable script execution
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

#### Line Ending Issues
```bash
# Configure git for Windows
git config --global core.autocrlf true
```

### macOS-Specific Issues

#### Xcode Command Line Tools
```bash
# Install command line tools
xcode-select --install
```

## 🔒 Security Setup

### File Permissions
```bash
# Set proper permissions
chmod 755 launch.sh deploy.sh
chmod 644 *.json *.md
chmod -R 755 server/uploads
```

### Environment Security
```bash
# Secure environment files
chmod 600 server/.env client/.env
```

## 📊 Performance Optimization

### Development Optimizations
```bash
# Enable faster rebuilds
export NODE_OPTIONS="--max-old-space-size=4096"

# Use faster package manager (optional)
npm install -g pnpm
pnpm install  # instead of npm install
```

## ✅ Installation Verification Checklist

- [ ] Node.js 16+ installed and verified
- [ ] Git installed and repository cloned
- [ ] Root dependencies installed (`npm install`)
- [ ] Backend dependencies installed (`cd server && npm install`)
- [ ] Frontend dependencies installed (`cd client && npm install`)
- [ ] Backend server starts without errors (`cd server && npm run dev`)
- [ ] Frontend server starts without errors (`cd client && npm run dev`)
- [ ] Both servers accessible via browser
- [ ] File upload directory exists and is writable
- [ ] CLI test scripts run successfully
- [ ] VS Code opens project without errors
- [ ] GitHub Copilot configured and working

## 🔗 Next Steps

After successful installation:

1. **Configure GitHub Copilot**: [Remote Indexing Guide](./02-copilot-remote-indexing.md)
2. **Understand the Architecture**: [Project Architecture](./03-project-architecture.md)
3. **Start Using the App**: [Usage Guide](./05-usage-guide.md)
4. **Explore the API**: [API Documentation](./06-api-documentation.md)

## 📞 Support

If you encounter issues during installation:

1. Check the [Troubleshooting Guide](./10-troubleshooting.md)
2. Review the [GitHub Issues](https://github.com/Sudo-Omar-Khalaf/HTI-Scheduler-2/issues)
3. Create a new issue with:
   - Operating system and version
   - Node.js version
   - Error messages and logs
   - Steps to reproduce

---

*Installation complete! You're ready to start developing with the HTI Scheduler.*
