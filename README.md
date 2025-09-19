# HTI Personalized Weekly Schedule Generator ✅ COMPLETED

A comprehensive full-stack application for generating personalized weekly schedules for students based on course selection, with exact Excel positioning and Arabic language support.

**🎉 Project Status: COMPLETED & PRODUCTION READY**

## 🤖 GitHub Copilot Integration

This project is optimized for GitHub Copilot with **remote indexing** enabled for enhanced code suggestions and context awareness.

### Copilot Features Enabled:
- **Remote Indexing**: Better understanding of project structure and patterns
- **Codebase Context**: Includes entire project context in suggestions  
- **Experimental Features**: Temporal context, intent detection, and project templates
- **Smart Completions**: Context-aware auto-completions and code actions

## ✅ Verified Features

All core functionality has been tested and validated:

- ✅ **Parse Arabic Excel Timetables**: Extract course groups and sessions from Arabic university schedules
- ✅ **Generate Weekly Schedules**: Create 7-day × 8-slot personalized weekly tables
- ✅ **Multiple Input Formats**: Support "EEC 101", "EEC 10105", shared groups ("05,06")
- ✅ **3-Row Course Blocks**: Course code+group, Arabic name, hall+professor format
- ✅ **True Span Validation**: Validate course spans (EEC 101: 3, EEC 113: 3, EEC 121: 5, etc.)
- ✅ **Smart Group Selection**: Automatic group selection with conflict detection
- ✅ **Excel/CSV Export**: Export with merged cells and Arabic text support
- ✅ **Modern UI**: Responsive React interface with Tailwind CSS
- ✅ **CLI Tools**: Command-line demo scripts for testing and validation

## 🏗️ Technology Stack

### Backend
- **Node.js** with Express.js
- **ExcelJS** for Arabic Excel processing
- **Multer** for file uploads
- **CORS** for cross-origin requests

### Frontend
- **React** with Vite
- **Tailwind CSS** for modern styling
- **Responsive Design** with Arabic text support

### Development Tools
- **GitHub Copilot** with remote indexing
- **VS Code** with enhanced configuration
- **Custom CLI utilities** for testing

## 🚀 Quick Start

### Prerequisites
- Node.js 16+ 
- npm or yarn
- GitHub Copilot extension (recommended)

### Installation

1. **Clone and install dependencies:**
   ```bash
   git clone https://github.com/Sudo-Omar-Khalaf/HTI-Scheduler-2.git
   cd HTI-scheduler-2
   npm install
   ```

2. **Start development servers:**
   ```bash
   # Using the launch script (recommended)
   ./launch.sh
   
   # Or manually start both servers
   npm run dev
   ```

3. **Open in VS Code for Copilot integration:**
   ```bash
   code .
   ```

### Getting Started with Copilot:
1. Ensure GitHub Copilot extension is installed in VS Code
2. Open this workspace - Copilot will automatically index the project remotely
3. Enjoy enhanced code suggestions with full project context

## 🧪 Testing & Demo

### CLI Testing Utilities
```bash
# Test schedule generation with formatted output
node table-demo.js

# Test weekly table display
node show-table-test.js

# Test core functionality
node test-schedule-generator.js

# Check available course groups
node check-groups.js
```

### API Testing
```bash
# Test API endpoints
curl -X POST http://localhost:5000/api/schedule/generate \
  -H "Content-Type: application/json" \
  -d @test-api-request.json
```

## ✅ Project Completion Validation

**End-to-End Testing Results:**

### Core Functionality ✅ VERIFIED
- **Excel Parsing**: Successfully parses Arabic university schedule Excel files (100 schedule entries detected)
- **Course Selection**: Correctly interprets "EEC 11301" → "EEC 113 01" and "EEC 10105" → "EEC 101 05"
- **Schedule Generation**: Produces 7-day × 8-slot weekly tables with proper positioning
- **Span Validation**: Validates total spans (8 spans total in test case)
- **Conflict Detection**: No time conflicts detected in generated schedules
- **Table Formatting**: 3-row course blocks with course info, Arabic names, and hall/professor details

### Development Environment ✅ CONFIGURED
- **GitHub Copilot**: Remote indexing and experimental features enabled
- **Documentation**: Comprehensive 12-guide documentation suite (9,279+ lines)
- **Git Repository**: Complete project pushed to https://github.com/Sudo-Omar-Khalaf/HTI-Scheduler-2
- **Development Tools**: VS Code workspace configured with recommended extensions

### Testing Infrastructure ✅ READY
```bash
# CLI demo shows proper output formatting
node table-demo.js      # ✅ Working - displays 3-row course blocks
node show-table-test.js # ✅ Working - detailed schedule format
```

**🎯 Ready for production deployment and further development.**

## 📋 API Endpoints

- `POST /api/excel/upload` - Upload Excel timetable file
- `POST /api/schedule/generate` - Generate personalized weekly schedule
- `GET /api/export/excel/:scheduleId` - Export schedule to Excel
- `GET /api/export/csv/:scheduleId` - Export schedule to CSV

## 🏛️ Project Structure

```
├── server/                           # Node.js backend
│   ├── services/                    # Core business logic
│   │   ├── ScheduleGeneratorService.js  # Main schedule generation
│   │   ├── ExcelParserServiceFinal.js   # Arabic Excel parsing
│   │   ├── ExportService.js             # Excel/CSV export
│   │   └── NormalizationService.js      # Data normalization
│   ├── routes/                      # API endpoints
│   │   ├── excel.js                 # File upload routes
│   │   ├── schedule.js              # Schedule generation
│   │   └── export.js                # Export functionality
│   └── models/                      # Data models
├── client/                          # React frontend
│   └── src/
│       ├── components/              # Reusable UI components
│       │   ├── Layout.jsx
│       │   └── PersonalizedScheduleGenerator.jsx
│       ├── pages/                   # Application pages
│       │   ├── HomePage.jsx
│       │   ├── UploadPage.jsx
│       │   ├── SchedulePage.jsx
│       │   └── ExportPage.jsx
│       └── services/
│           └── api.js               # API client
├── .vscode/                         # VS Code & Copilot configuration
├── .github/                         # GitHub-specific configs
└── test-*.js                       # Testing utilities
```

## 🔧 Development Features

### Available Scripts
```bash
# Development
npm run dev              # Start both client and server in development mode
./launch.sh             # Quick launch script for development

# Testing
npm run test            # Run test suite
node table-demo.js      # Demo weekly table generation
node test-schedule-generator.js  # Test core functionality

# Production
npm run build           # Build for production
npm start              # Start production server
```

### GitHub Copilot Integration
- **Remote Indexing**: Enhanced context understanding across the entire codebase
- **Smart Suggestions**: Context-aware completions for React, Node.js, and business logic
- **Project Templates**: Pre-configured templates for common patterns
- **Real-time Assistance**: Intelligent code generation and debugging support

## 📚 Documentation

- [Copilot Configuration](.copilot-config.md) - Detailed Copilot setup and features
- [Test Workflow](test-workflow.md) - Testing procedures and examples
- [API Documentation](.github/README.md) - Comprehensive API reference

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **GitHub Copilot** for enhanced development experience with remote indexing
- **HTI University** for providing the Arabic Excel timetable specifications
- **Open Source Community** for the excellent libraries and tools used

---

*Powered by GitHub Copilot with remote indexing for intelligent code assistance* 🤖

- `npm run dev` - Start both frontend and backend in development mode
- `npm run build` - Build frontend for production
- `npm start` - Start production server
- `npm run server:dev` - Start only backend in development
- `npm run client:dev` - Start only frontend in development

### Environment Variables

Create `.env` files in server and client directories:

**Server (.env):**
```
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:5173
```

**Client (.env):**
```
VITE_API_BASE_URL=http://localhost:5000
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see LICENSE file for details

## Support

For issues and feature requests, please create an issue in the repository.
