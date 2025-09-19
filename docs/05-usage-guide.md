# Usage Guide

This comprehensive guide explains how to use the HTI Personalized Weekly Schedule Generator from both user and developer perspectives.

## 🎯 Overview

The HTI Scheduler helps students create personalized weekly schedules by:
1. Uploading Excel timetables with course information
2. Selecting desired courses with flexible input formats
3. Generating conflict-free weekly schedules
4. Exporting schedules to Excel or CSV formats

## 🚀 Getting Started

### Prerequisites
- Application installed and running ([Installation Guide](./04-installation.md))
- Excel file with course timetable data
- Basic understanding of course codes (e.g., EEC 101, EEC 113)

### Quick Start
1. Start the application: `./launch.sh` or `npm run dev`
2. Open browser to `http://localhost:5173`
3. Upload your Excel timetable
4. Select your courses
5. Generate and export your schedule

## 📊 Using the Web Interface

### Step 1: Home Page
```
http://localhost:5173/
```

**Features:**
- Project overview and introduction
- Navigation to different sections
- Quick start instructions

**Actions:**
- Click "Get Started" to begin
- Navigate to "Upload" to start the process

### Step 2: Upload Excel File

Navigate to: `http://localhost:5173/upload`

#### Supported File Formats
- **Excel files**: `.xlsx`, `.xls`
- **Maximum size**: 10MB
- **Language**: Arabic text supported
- **Structure**: Must follow HTI timetable format

#### Upload Process
1. **Select File**: Click "Choose File" or drag & drop
2. **File Validation**: System checks file format and size
3. **Upload**: Click "Upload File" button
4. **Processing**: Wait for parsing to complete
5. **Confirmation**: View parsed course groups summary

#### Expected File Structure
Your Excel file should contain:
```
| Course Code | Group | Day | Time | Duration | Location | Instructor |
|-------------|-------|-----|------|----------|----------|------------|
| EEC 101     | 01    | Sun | 9:00 | 2        | Hall A   | Dr. Ahmed  |
| EEC 113     | 01    | Mon | 11:00| 1        | Lab B    | Dr. Sara   |
```

### Step 3: Generate Schedule

Navigate to: `http://localhost:5173/schedule`

#### Course Selection Input Formats

**Format 1: Course Code Only**
```
EEC 101
EEC 113
EEC 121
```
*System automatically selects best available group*

**Format 2: Course Code + Group**
```
EEC 10101
EEC 11302
EEC 12105
```
*Specifies exact group numbers*

**Format 3: Mixed Input**
```
EEC 101
EEC 11302
EEC 121
```
*Combines automatic and manual group selection*

**Format 4: Shared Groups**
```
EEC 10105,06
```
*Selects shared lecture for groups 05 and 06*

#### Generation Options

**Basic Generation**
- Enter course list in text area
- Click "Generate Schedule"
- View results in weekly table format

**Advanced Options**
- **Strict Span Validation**: Enforce exact span requirements
- **Conflict Resolution**: Automatic conflict detection
- **Smart Group Selection**: Optimize group assignments

#### Understanding the Output

**Weekly Table Structure:**
- **7 Days**: Sunday through Saturday
- **8 Time Slots**: 9:00 AM to 3:30 PM (45-minute slots)
- **3-Row Cells**: Course info, Arabic name, location+instructor

**Cell Content Example:**
```
Row 1: EEC 101 01
Row 2: أساسيات الهندسة الكهربية
Row 3: Hall A - د. أحمد محمد
```

### Step 4: Export Schedule

Navigate to: `http://localhost:5173/export`

#### Export Formats

**Excel Export**
- Full formatting with merged cells
- Arabic text support
- Color-coded sessions
- Metadata sheet included

**CSV Export**
- Plain text format
- Importable to other applications
- Preserves schedule structure

#### Export Process
1. **Select Format**: Choose Excel or CSV
2. **Configure Options**: Set export preferences
3. **Generate**: Click export button
4. **Download**: File downloads automatically

## 🖥️ Command Line Interface

### CLI Tools Overview

The project includes several CLI utilities for testing and demonstration:

#### 1. Schedule Generation Demo
```bash
node table-demo.js
```
**Purpose**: Demonstrates weekly table generation
**Output**: Formatted console display of sample schedule
**Use Case**: Testing and validation

#### 2. Table Display Test
```bash
node show-table-test.js
```
**Purpose**: Tests weekly table formatting
**Output**: Structured 3-row cell display
**Use Case**: Development and debugging

#### 3. Schedule Generator Test
```bash
node test-schedule-generator.js
```
**Purpose**: Comprehensive testing of schedule generation
**Output**: Validation results and statistics
**Use Case**: Quality assurance

### Advanced CLI Usage

#### Custom Course Selection
```bash
# Edit the course list in the script
node -e "
const generator = require('./server/services/ScheduleGeneratorService');
const parser = require('./server/services/ExcelParserServiceFinal');
// Custom implementation
"
```

#### Batch Processing
```bash
# Process multiple course combinations
for courses in 'EEC 101,EEC 113' 'EEC 121,EEC 125'; do
  echo \"Processing: $courses\"
  node table-demo.js --courses=\"$courses\"
done
```

## 🔧 API Usage

### Direct API Calls

#### 1. Upload Excel File
```bash
curl -X POST http://localhost:5000/api/excel/upload \
  -F "file=@timetable.xlsx" \
  -H "Content-Type: multipart/form-data"
```

**Response:**
```json
{
  "success": true,
  "message": "File processed successfully",
  "data": {
    "total_groups": 98,
    "total_sessions": 245,
    "course_codes": ["EEC 101", "EEC 113", ...]
  }
}
```

#### 2. Generate Schedule
```bash
curl -X POST http://localhost:5000/api/schedule/generate \
  -H "Content-Type: application/json" \
  -d '{
    "desired_courses": ["EEC 101", "EEC 11302", "EEC 121"],
    "options": {
      "strict_span_validation": false
    }
  }'
```

**Response:**
```json
{
  "success": true,
  "schedule": {
    "weekly_table": {
      "structure": {
        "days": ["Sunday", "Monday", ...],
        "time_slots": ["9.00 - 9.45", ...],
        "total_cells": 56
      },
      "schedule": {
        "Sunday": [
          {
            "row1_course_info": {
              "course_code": "EEC 101",
              "group_numbers": ["01"],
              "display_text": "EEC 101 01"
            },
            "row2_course_name": {
              "arabic_name": "أساسيات الهندسة الكهربية",
              "display_text": "أساسيات الهندسة الكهربية"
            },
            "row3_details": {
              "hall_number": "Hall A",
              "professor_name": "د. أحمد محمد",
              "display_text": "Hall A - د. أحمد محمد"
            }
          }
        ]
      }
    }
  }
}
```

#### 3. Export Schedule
```bash
# Excel export
curl -X GET http://localhost:5000/api/export/excel/schedule-id \
  -o "schedule.xlsx"

# CSV export  
curl -X GET http://localhost:5000/api/export/csv/schedule-id \
  -o "schedule.csv"
```

## 📝 Input Validation and Error Handling

### Course Code Validation

**Valid Formats:**
- `EEC 101` (Department + Number)
- `EEC 10105` (Department + Number + Group)
- `MATH 201` (Different departments supported)

**Invalid Formats:**
- `EEC101` (Missing space)
- `EEC` (Incomplete code)
- `101` (Missing department)

### Error Types and Solutions

#### 1. File Upload Errors
```json
{
  "success": false,
  "error": "Invalid file format",
  "code": "FILE_FORMAT_ERROR",
  "solution": "Upload .xlsx or .xls files only"
}
```

#### 2. Course Not Found
```json
{
  "success": false,
  "error": "Course EEC 999 not found in Excel data",
  "code": "COURSE_NOT_FOUND",
  "solution": "Check course code spelling or upload correct Excel file"
}
```

#### 3. Time Conflicts
```json
{
  "success": false,
  "error": "Schedule has time conflicts",
  "conflicts": [
    {
      "day": "Sunday",
      "time_slot": 2,
      "course1": "EEC 101 01",
      "course2": "EEC 113 02"
    }
  ],
  "solution": "Select different groups or courses"
}
```

#### 4. Span Validation Errors
```json
{
  "success": false,
  "error": "Course span validation failed",
  "validation_errors": [
    "Course EEC 101 group 01: expected 3 spans, found 4 spans"
  ],
  "solution": "Enable strict_span_validation: false or fix Excel data"
}
```

## 🎨 Customization Options

### Frontend Customization

#### Modify Course Input Interface
```jsx
// client/src/components/PersonalizedScheduleGenerator.jsx
const handleCourseInput = (value) => {
  // Custom parsing logic
  const courses = parseCustomFormat(value);
  setCourseSelection(courses);
};
```

#### Custom Styling
```css
/* client/src/index.css */
.schedule-cell {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 8px;
  padding: 12px;
}
```

### Backend Customization

#### Custom Validation Rules
```javascript
// server/services/ScheduleGeneratorService.js
validateCourseSpans(courseSelection, courseGroups, options = {}) {
  // Add custom validation logic
  const customRules = {
    'EEC 999': 6,  // Custom course span
    'MATH 201': 4
  };
  // Implementation...
}
```

#### Custom Export Formats
```javascript
// server/services/ExportService.js
exportToCustomFormat(scheduleData) {
  // Implement custom export logic
  return customFormattedData;
}
```

## 📊 Performance Tips

### Optimizing Schedule Generation

1. **Batch Course Selection**: Process multiple courses together
2. **Cache Excel Data**: Avoid re-parsing the same file
3. **Limit Course Combinations**: Start with fewer courses for testing

### Frontend Performance

1. **Lazy Loading**: Load components as needed
2. **Memoization**: Cache expensive calculations
3. **Virtual Scrolling**: For large schedule displays

### Backend Performance

1. **File Caching**: Cache parsed Excel results
2. **Compression**: Enable response compression
3. **Connection Pooling**: Optimize database connections

## 🔍 Debugging and Monitoring

### Debug Mode

**Enable Debug Logging:**
```bash
# Set environment variable
export DEBUG=hti-scheduler:*

# Start with debug output
npm run dev
```

**Debug Output Example:**
```
[DEBUG] Excel parsing started: timetable.xlsx
[DEBUG] Found 98 course groups
[DEBUG] Schedule generation for: ["EEC 101", "EEC 113"]
[DEBUG] Validation passed: 0 conflicts found
[DEBUG] Weekly table generated: 56 cells
```

### Monitoring

**Health Check Endpoint:**
```bash
curl http://localhost:5000/health
```

**Performance Metrics:**
```bash
curl http://localhost:5000/api/metrics
```

## 📚 Advanced Usage Scenarios

### Scenario 1: Multiple Student Schedules

```javascript
// Batch processing for multiple students
const students = [
  { name: "Ahmed", courses: ["EEC 101", "EEC 113"] },
  { name: "Sara", courses: ["EEC 121", "EEC 125"] }
];

for (const student of students) {
  const schedule = await generateSchedule(student.courses);
  await exportSchedule(schedule, `${student.name}_schedule.xlsx`);
}
```

### Scenario 2: Academic Planning

```javascript
// Semester planning with prerequisites
const semesterPlan = {
  semester1: ["EEC 101", "MATH 101"],
  semester2: ["EEC 113", "EEC 121"],  // Prerequisites: EEC 101
  semester3: ["EEC 212", "EEC 284"]   // Prerequisites: EEC 113, EEC 121
};
```

### Scenario 3: Resource Optimization

```javascript
// Find optimal group combinations
const optimizeGroups = (courses) => {
  const combinations = generateAllCombinations(courses);
  return combinations.find(combo => 
    hasNoConflicts(combo) && 
    minimizesGaps(combo) && 
    balancesDays(combo)
  );
};
```

## 🔗 Related Documentation

- [Installation Guide](./04-installation.md) - Setup instructions
- [API Documentation](./06-api-documentation.md) - Detailed API reference
- [Frontend Components](./07-frontend-components.md) - UI component details
- [Backend Services](./08-backend-services.md) - Service layer documentation
- [Testing Guide](./09-testing-guide.md) - Testing procedures
- [Troubleshooting](./10-troubleshooting.md) - Common issues and solutions

---

*Master the HTI Scheduler with this comprehensive usage guide. From basic schedule generation to advanced customization, everything you need is here.*
