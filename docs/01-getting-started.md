# Getting Started - HTI Schedule Generator

This guide will help you get started with the HTI Personalized Weekly Schedule Generator project.

## 📋 Prerequisites

Before you begin, ensure you have the following installed on your system:

### Required Software
- **Node.js** (v16 or higher) - [Download here](https://nodejs.org/)
- **npm** (comes with Node.js) or **yarn**
- **Git** - [Download here](https://git-scm.com/)
- **VS Code** (recommended) - [Download here](https://code.visualstudio.com/)

### Recommended VS Code Extensions
- GitHub Copilot
- GitHub Copilot Chat
- ES7+ React/Redux/React-Native snippets
- Prettier - Code formatter
- Tailwind CSS IntelliSense

## 🎯 Project Overview

The HTI Schedule Generator is a full-stack web application that:

1. **Parses Arabic Excel files** containing course timetables
2. **Generates personalized weekly schedules** based on student course selection
3. **Validates course requirements** and detects scheduling conflicts
4. **Exports schedules** to Excel or CSV formats
5. **Provides a modern web interface** for easy interaction

## 🏗️ System Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │    Backend      │    │   Excel Files   │
│   (React)       │◄──►│   (Node.js)     │◄──►│   (Timetables)  │
│                 │    │                 │    │                 │
│ • Schedule UI   │    │ • API Routes    │    │ • Course Data   │
│ • Upload Page   │    │ • Services      │    │ • Group Info    │
│ • Export Tools  │    │ • Validation    │    │ • Time Slots    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 📁 Project Structure

```
HTI-scheduler-2/
├── client/                 # React frontend application
│   ├── src/
│   │   ├── components/    # Reusable UI components
│   │   ├── pages/         # Application pages/routes
│   │   └── services/      # API communication
│   └── package.json       # Frontend dependencies
├── server/                # Node.js backend application
│   ├── routes/           # Express route handlers
│   ├── services/         # Business logic services
│   ├── models/           # Data models
│   └── package.json      # Backend dependencies
├── docs/                 # Documentation (this folder)
├── test-*.js            # Testing utilities
└── *.xlsx               # Sample Excel timetable files
```

## 🔧 Core Components

### Frontend (React)
- **PersonalizedScheduleGenerator**: Main schedule interface
- **UploadPage**: Excel file upload functionality
- **SchedulePage**: Schedule generation and display
- **ExportPage**: Export schedule to various formats

### Backend (Node.js)
- **ExcelParserServiceFinal**: Parse Arabic Excel files
- **ScheduleGeneratorService**: Generate weekly schedules
- **ExportService**: Create Excel/CSV exports
- **API Routes**: Handle client requests

## 🎓 Learning Path

If you're new to the project, follow this learning path:

1. **Start Here**: Read this Getting Started guide
2. **Set up Copilot**: Configure [GitHub Copilot Remote Indexing](./02-copilot-remote-indexing.md)
3. **Understand Architecture**: Study [Project Architecture](./03-project-architecture.md)
4. **Install & Run**: Follow [Installation Guide](./04-installation.md)
5. **Use the App**: Try the [Usage Guide](./05-usage-guide.md)
6. **Explore Code**: Review component and service documentation
7. **Test Features**: Run tests using [Testing Guide](./09-testing-guide.md)

## 🚀 Quick Start (5 Minutes)

For experienced developers who want to get running quickly:

```bash
# 1. Clone and navigate
git clone https://github.com/Sudo-Omar-Khalaf/HTI-Scheduler-2.git
cd HTI-scheduler-2

# 2. Install dependencies
npm install

# 3. Start development servers
npm run dev
# OR use the launch script
./launch.sh

# 4. Open browser
# Frontend: http://localhost:5173
# Backend: http://localhost:5000
```

## 🎯 Key Concepts

### Course Input Formats
The application supports multiple ways to specify courses:
- **Simple**: `"EEC 101"` (smart group selection)
- **With Group**: `"EEC 10105"` (course + group number)
- **Shared Groups**: `"EEC 10105,06"` (shared lecture, specific lab)

### Weekly Schedule Structure
- **7 Days**: Sunday through Saturday
- **8 Time Slots**: 45-minute periods from 9:00 AM to 3:30 PM
- **3-Row Blocks**: Course code+group, Arabic name, hall+professor

### True Span Values
Each course has expected time spans for validation:
- EEC 101: 3 spans (2 lecture + 1 lab)
- EEC 113: 3 spans (2 lecture + 1 lab)
- EEC 121: 5 spans (2 lecture + 3 lab)
- EEC 125: 5 spans (2 lecture + 3 lab)
- EEC 142: 6 spans (3 lecture + 3 lab)
- EEC 212: 5 spans (3 lecture + 2 lab)
- EEC 284: 4 spans (2 lecture + 2 lab)

## 📖 Next Steps

Now that you understand the basics:

1. **Configure your development environment** with [GitHub Copilot Remote Indexing](./02-copilot-remote-indexing.md)
2. **Dive deeper into the architecture** with [Project Architecture](./03-project-architecture.md)
3. **Set up your local development environment** with [Installation Guide](./04-installation.md)

## 🔗 Useful Links

- [GitHub Repository](https://github.com/Sudo-Omar-Khalaf/HTI-Scheduler-2)
- [React Documentation](https://react.dev/)
- [Node.js Documentation](https://nodejs.org/docs/)
- [GitHub Copilot Documentation](https://docs.github.com/en/copilot)

---

**Ready to start?** Continue to [GitHub Copilot Remote Indexing](./02-copilot-remote-indexing.md) →
