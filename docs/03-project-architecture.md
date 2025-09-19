# Project Architecture

This document provides a comprehensive overview of the HTI Personalized Weekly Schedule Generator architecture, including system design, component relationships, and data flow.

## 🏗️ System Architecture Overview

The HTI Scheduler follows a modern full-stack architecture with clear separation of concerns:

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend       │    │   Data Layer    │
│   (React)       │◄──►│   (Node.js)     │◄──►│   (Excel Files) │
│                 │    │                 │    │                 │
│ • UI Components │    │ • REST API      │    │ • Course Data   │
│ • State Mgmt    │    │ • Services      │    │ • Schedule Data │
│ • Routing       │    │ • File Upload   │    │ • Export Files  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 📁 Directory Structure

```
HTI-scheduler-2/
├── client/                     # Frontend React application
│   ├── src/
│   │   ├── components/         # Reusable UI components
│   │   ├── pages/             # Page-level components
│   │   ├── services/          # API communication
│   │   └── App.jsx            # Main application component
│   ├── package.json           # Frontend dependencies
│   └── vite.config.js         # Vite build configuration
│
├── server/                     # Backend Node.js application
│   ├── routes/                # API route handlers
│   │   ├── excel.js           # Excel upload endpoints
│   │   ├── schedule.js        # Schedule generation endpoints
│   │   └── export.js          # Export functionality endpoints
│   ├── services/              # Core business logic
│   │   ├── ExcelParserServiceFinal.js    # Excel parsing logic
│   │   ├── ScheduleGeneratorService.js   # Schedule generation
│   │   ├── ExportService.js              # Export functionality
│   │   └── NormalizationService.js       # Data normalization
│   ├── models/                # Data models and schemas
│   ├── uploads/               # Temporary file storage
│   └── index.js               # Server entry point
│
├── docs/                      # Project documentation
├── tests/                     # Test files and utilities
└── .vscode/                   # VS Code configuration
```

## 🔄 Data Flow Architecture

### 1. User Input Flow
```
User Input → Frontend Validation → API Request → Backend Processing → Response
```

### 2. Excel Processing Flow
```
Excel Upload → File Validation → Parser Service → Data Normalization → Storage
```

### 3. Schedule Generation Flow
```
Course Selection → Validation → Schedule Generation → Conflict Detection → Output
```

### 4. Export Flow
```
Schedule Data → Export Service → File Generation → Download Response
```

## 🎯 Core Components

### Frontend Architecture (Client)

#### 1. **App.jsx** - Main Application
- Route configuration
- Global state management
- Theme and layout providers

#### 2. **Components Directory**
- **Layout.jsx**: Main layout wrapper with navigation
- **PersonalizedScheduleGenerator.jsx**: Core schedule generation interface

#### 3. **Pages Directory**
- **HomePage.jsx**: Landing page and project overview
- **UploadPage.jsx**: Excel file upload interface
- **SchedulePage.jsx**: Schedule generation and display
- **ExportPage.jsx**: Export options and download

#### 4. **Services Directory**
- **api.js**: Centralized API communication layer

### Backend Architecture (Server)

#### 1. **Routes Layer**
Handles HTTP requests and responses:

```javascript
// Route structure
routes/
├── excel.js      # POST /api/excel/upload
├── schedule.js   # POST /api/schedule/generate
└── export.js     # GET /api/export/{excel|csv}/:id
```

#### 2. **Services Layer**
Core business logic implementation:

**ExcelParserServiceFinal.js**
```javascript
class ExcelParserServiceFinal {
  parseExcelFile(filePath)     // Parse Excel to course groups
  extractCourseGroups(sheet)   // Extract course data
  normalizeData(rawData)       // Clean and structure data
}
```

**ScheduleGeneratorService.js**
```javascript
class ScheduleGeneratorService {
  generatePersonalizedSchedule() // Main generation logic
  parseUserCourseSelection()     // Parse user input
  validateCourseSpans()          // Validate course requirements
  buildWeeklyScheduleTable()     // Create weekly table
  validateNoConflicts()          // Check for time conflicts
}
```

**ExportService.js**
```javascript
class ExportService {
  exportToExcel(scheduleData)    // Generate Excel export
  exportToCSV(scheduleData)      // Generate CSV export
  createMergedCells()            // Handle cell merging
}
```

#### 3. **Models Layer**
Data structures and validation schemas

## 📊 Data Models

### Course Group Model
```javascript
{
  course_code: "EEC 101",
  group_code: "01",
  course_name: "أساسيات الهندسة الكهربية",
  sessions: [
    {
      day_of_week: "Sunday",
      start_time: "9.00",
      end_time: "10.30",
      span: 2,
      session_type: "lecture",
      location: "Hall A",
      instructor: "د. أحمد محمد"
    }
  ]
}
```

### Weekly Schedule Model
```javascript
{
  structure: {
    days: ["Sunday", "Monday", ...],
    time_slots: ["9.00 - 9.45", ...],
    total_cells: 56
  },
  schedule: {
    "Sunday": [
      {
        row1_course_info: { course_code, group_numbers, display_text },
        row2_course_name: { arabic_name, display_text },
        row3_details: { hall_number, professor_name, display_text },
        session_metadata: { session_type, start_time, end_time }
      }
    ]
  }
}
```

## 🔧 Key Design Patterns

### 1. **Service Layer Pattern**
- Separates business logic from route handlers
- Enables easier testing and maintenance
- Promotes code reusability

### 2. **Repository Pattern**
- Abstracts data access logic
- Enables easier database switching
- Centralizes data operations

### 3. **Factory Pattern**
- Used in schedule generation for creating different schedule types
- Enables flexible schedule creation strategies

### 4. **Observer Pattern**
- Frontend state management
- Real-time updates and notifications

## 🌐 API Architecture

### RESTful Endpoints

#### Excel Operations
```
POST /api/excel/upload
- Purpose: Upload and parse Excel files
- Input: FormData with Excel file
- Output: Parsed course groups data
```

#### Schedule Operations
```
POST /api/schedule/generate
- Purpose: Generate personalized schedule
- Input: Course selection and preferences
- Output: Weekly schedule table with validation
```

#### Export Operations
```
GET /api/export/excel/:scheduleId
GET /api/export/csv/:scheduleId
- Purpose: Export generated schedules
- Input: Schedule ID
- Output: File download
```

### Error Handling Strategy

```javascript
// Standardized error response format
{
  success: false,
  error: "Description of the error",
  code: "ERROR_CODE",
  details: {
    // Additional error context
  }
}
```

## 🔄 State Management

### Frontend State
- **Local State**: Component-specific data (React useState)
- **Shared State**: Cross-component data (React Context)
- **Server State**: API data (React Query/SWR pattern)

### Backend State
- **Session State**: User session data
- **Cache State**: Parsed Excel data caching
- **Temporary State**: File upload handling

## 🚀 Performance Considerations

### Frontend Optimizations
- **Code Splitting**: Route-based lazy loading
- **Memoization**: React.memo for expensive components
- **Virtual Scrolling**: For large schedule tables
- **Debouncing**: User input optimization

### Backend Optimizations
- **Caching**: Excel parse results caching
- **Streaming**: Large file upload handling
- **Connection Pooling**: Database connections
- **Compression**: Response compression

## 🔒 Security Architecture

### Frontend Security
- **Input Validation**: Client-side validation
- **XSS Prevention**: Sanitized outputs
- **CSRF Protection**: Token-based protection

### Backend Security
- **File Validation**: Upload file type checking
- **Input Sanitization**: Server-side validation
- **Rate Limiting**: API request throttling
- **CORS Configuration**: Cross-origin restrictions

## 🧪 Testing Architecture

### Testing Layers
```
├── Unit Tests         # Individual function testing
├── Integration Tests  # Service interaction testing
├── API Tests         # Endpoint testing
└── E2E Tests         # Full workflow testing
```

### Test Files Structure
```
├── test-schedule-generator.js    # Schedule generation tests
├── table-demo.js                # CLI output testing
├── show-table-test.js           # Weekly table display tests
└── debug-data-structure.js      # Data structure validation
```

## 📈 Scalability Considerations

### Horizontal Scaling
- **Load Balancing**: Multiple server instances
- **Database Sharding**: Data distribution
- **CDN Integration**: Static asset delivery

### Vertical Scaling
- **Memory Optimization**: Efficient data structures
- **CPU Optimization**: Algorithm improvements
- **I/O Optimization**: Async operations

## 🔗 Integration Points

### External Dependencies
- **ExcelJS**: Excel file processing
- **React**: Frontend framework
- **Express.js**: Backend framework
- **Multer**: File upload handling

### Internal Dependencies
```
Frontend → Backend API → Services → Data Layer
     ↓         ↓           ↓          ↓
   Pages → Components → Utils → Models
```

## 📚 Related Documentation

- [Installation Guide](./04-installation.md)
- [API Documentation](./06-api-documentation.md)
- [Backend Services](./08-backend-services.md)
- [Frontend Components](./07-frontend-components.md)

---

*This architecture supports the complex requirements of parsing Arabic Excel files and generating personalized weekly schedules with proper validation and export capabilities.*
