# HTI Personalized Weekly Schedule Generator

A comprehensive full-stack application for generating personalized weekly schedules for students based on course selection, with exact Excel positioning and Arabic language support.

## 🤖 GitHub Copilot Integration

This project is optimized for GitHub Copilot with remote indexing enabled for enhanced code suggestions and context awareness.

### Copilot Features Enabled:
- **Remote Indexing**: Better understanding of project structure and patterns
- **Codebase Context**: Includes entire project context in suggestions  
- **Experimental Features**: Temporal context, intent detection, and project templates
- **Smart Completions**: Context-aware auto-completions and code actions

### Getting Started with Copilot:
1. Ensure GitHub Copilot extension is installed in VS Code
2. Open this workspace in VS Code
3. Copilot will automatically index the project remotely
4. Enjoy enhanced code suggestions with full project context

## 🏗️ Project Structure

```
├── server/                 # Node.js backend
│   ├── services/          # Core business logic
│   │   ├── ScheduleGeneratorService.js
│   │   ├── ExcelParserServiceFinal.js
│   │   └── ExportService.js
│   └── routes/            # API endpoints
├── client/                # React frontend
│   └── src/
│       ├── components/    # UI components
│       └── pages/         # Application pages
└── .vscode/               # VS Code & Copilot configuration
```

## ✨ Key Features

- 📊 Parse Arabic Excel timetables with course groups
- 🗓️ Generate 7-day × 8-slot weekly schedules
- 📝 Support multiple input formats (EEC 101, EEC 10105, shared groups)
- 🏛️ 3-row course blocks with Arabic names and locations
- ✅ Validate True Span Values for each course
- 🔍 Smart group selection and conflict detection
- 📤 Export to Excel/CSV with merged cells
- 🌐 Full-stack React + Node.js application

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Start development servers
npm run dev

# Or use the launch script
./launch.sh
```

## 🧪 Testing

```bash
# Test schedule generation
node table-demo.js

# Test weekly table output
node show-table-test.js

# Test specific functionality
node test-schedule-generator.js
```

## 📋 API Endpoints

- `POST /api/excel/upload` - Upload Excel timetable
- `POST /api/schedule/generate` - Generate personalized schedule
- `GET /api/export/excel/:scheduleId` - Export to Excel
- `GET /api/export/csv/:scheduleId` - Export to CSV

## 🔧 Development

This project uses modern development tools and practices:
- **Backend**: Node.js, Express, ExcelJS
- **Frontend**: React, Vite, Tailwind CSS
- **Code Quality**: GitHub Copilot with remote indexing
- **Testing**: Custom CLI utilities and validation scripts

## 📖 Documentation

- [Copilot Configuration](.copilot-config.md) - Detailed Copilot setup
- [Test Workflow](test-workflow.md) - Testing procedures and examples

---

*Enhanced with GitHub Copilot for intelligent code suggestions and productivity.*
