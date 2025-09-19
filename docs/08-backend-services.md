# Backend Services Documentation

## Overview

The HTI Scheduler backend provides robust server-side functionality for Excel parsing, schedule generation, validation, and export capabilities. Built with Node.js and Express, it offers RESTful APIs and comprehensive service layers.

## Service Architecture

```
server/
├── services/
│   ├── ExcelParserServiceFinal.js    # Excel file processing
│   ├── ScheduleGeneratorService.js   # Core schedule logic
│   └── ExportService.js              # Export functionality
├── routes/
│   ├── excel.js                      # Excel upload endpoints
│   ├── schedule.js                   # Schedule generation endpoints
│   └── export.js                     # Export endpoints
├── middleware/
│   ├── validation.js                 # Request validation
│   ├── errorHandler.js               # Error handling
│   └── fileUpload.js                 # File upload handling
└── index.js                          # Main server entry point
```

## Core Services

### 1. ExcelParserServiceFinal.js

**Purpose**: Parses Excel files to extract course data, schedules, and metadata.

**Key Features**:
- Multi-sheet Excel processing
- Course data extraction with Arabic names
- Schedule parsing with time slots and days
- Group and professor information extraction
- Data validation and sanitization

#### Class Structure

```javascript
class ExcelParserServiceFinal {
  constructor() {
    this.workbook = null;
    this.courseData = [];
    this.scheduleData = [];
    this.metadata = {};
  }
  
  // Main parsing method
  async parseExcelFile(filePath) {
    try {
      this.workbook = XLSX.readFile(filePath);
      
      // Parse different sheets
      await this.parseCourseSheet();
      await this.parseScheduleSheet();
      await this.extractMetadata();
      
      return {
        courses: this.courseData,
        schedule: this.scheduleData,
        metadata: this.metadata
      };
    } catch (error) {
      throw new Error(`Excel parsing failed: ${error.message}`);
    }
  }
}
```

#### Core Methods

##### parseCourseSheet()
```javascript
async parseCourseSheet() {
  const sheet = this.workbook.Sheets['Courses'] || this.workbook.Sheets[this.workbook.SheetNames[0]];
  const data = XLSX.utils.sheet_to_json(sheet);
  
  this.courseData = data.map(row => ({
    code: this.sanitizeCourseCode(row.Code || row.code),
    arabic_name: row['Arabic Name'] || row.arabic_name || '',
    english_name: row['English Name'] || row.english_name || '',
    credit_hours: parseInt(row['Credit Hours'] || row.credit_hours) || 3,
    span: parseInt(row.Span || row.span) || 3,
    department: row.Department || row.department || 'General'
  })).filter(course => course.code);
  
  // Validate course data
  this.validateCourseData();
}
```

##### parseScheduleSheet()
```javascript
async parseScheduleSheet() {
  const sheet = this.workbook.Sheets['Schedule'] || this.workbook.Sheets[this.workbook.SheetNames[1]];
  
  // Define time slots (8 slots, 45 minutes each)
  const timeSlots = [
    '8:00-8:45', '8:45-9:30', '9:30-10:15', '10:15-11:00',
    '11:00-11:45', '11:45-12:30', '12:30-1:15', '1:15-2:00'
  ];
  
  const days = ['Saturday', 'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
  
  // Parse schedule data maintaining Excel cell positions
  const scheduleData = [];
  const range = XLSX.utils.decode_range(sheet['!ref']);
  
  for (let row = range.s.r + 1; row <= range.e.r; row++) {
    for (let col = range.s.c + 1; col <= range.e.c; col++) {
      const cellRef = XLSX.utils.encode_cell({ r: row, c: col });
      const cell = sheet[cellRef];
      
      if (cell && cell.v) {
        const courseInfo = this.parseCellContent(cell.v);
        if (courseInfo) {
          const dayIndex = col - 1;
          const slotIndex = row - 1;
          
          scheduleData.push({
            ...courseInfo,
            day: days[dayIndex],
            slot: slotIndex,
            time: timeSlots[slotIndex],
            position: { row, col }
          });
        }
      }
    }
  }
  
  this.scheduleData = scheduleData;
}
```

##### parseCellContent(cellValue)
```javascript
parseCellContent(cellValue) {
  // Parse cell content like: "EEC 10105\nCircuits Analysis\nLab A - Dr. Ahmed"
  const lines = cellValue.toString().split('\n').map(line => line.trim());
  
  if (lines.length < 2) return null;
  
  // Extract course code and group
  const courseMatch = lines[0].match(/^([A-Z]+\s+\d+)(\d{2})?$/);
  if (!courseMatch) return null;
  
  const [, courseCode, group] = courseMatch;
  
  return {
    course_code: courseCode,
    group: group || '',
    arabic_name: lines[1] || '',
    hall: this.extractHall(lines[2] || ''),
    professor: this.extractProfessor(lines[2] || ''),
    raw_content: cellValue
  };
}
```

##### Data Validation Methods
```javascript
validateCourseData() {
  const requiredSpans = {
    'EEC 101': 3, 'EEC 113': 3, 'EEC 121': 5,
    'EEC 125': 5, 'EEC 142': 6, 'EEC 212': 5, 'EEC 284': 4
  };
  
  this.courseData.forEach(course => {
    if (requiredSpans[course.code] && course.span !== requiredSpans[course.code]) {
      console.warn(`Course ${course.code} has incorrect span: expected ${requiredSpans[course.code]}, got ${course.span}`);
    }
  });
}

sanitizeCourseCode(code) {
  if (!code) return '';
  
  // Convert "EEC101" to "EEC 101", handle various formats
  return code.toString()
    .replace(/([A-Z]+)(\d+)/, '$1 $2')
    .trim()
    .toUpperCase();
}

extractHall(text) {
  // Extract hall from "Lab A - Dr. Ahmed" -> "Lab A"
  const hallMatch = text.match(/^([^-]+)/);
  return hallMatch ? hallMatch[1].trim() : '';
}

extractProfessor(text) {
  // Extract professor from "Lab A - Dr. Ahmed" -> "Dr. Ahmed"
  const profMatch = text.match(/-\s*(.+)$/);
  return profMatch ? profMatch[1].trim() : '';
}
```

### 2. ScheduleGeneratorService.js

**Purpose**: Core service for generating personalized weekly schedules with validation and conflict detection.

**Key Features**:
- Smart course parsing with group detection
- Shared lecture handling
- Span validation
- Conflict detection
- Weekly table generation

#### Class Structure

```javascript
class ScheduleGeneratorService {
  constructor() {
    this.courseData = [];
    this.scheduleData = [];
    this.timeSlots = 8;  // 8 time slots per day
    this.days = ['Saturday', 'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
  }
  
  // Main generation method
  async generatePersonalizedSchedule(courseSelection, options = {}) {
    try {
      const selectedCourses = this.parseUserCourseSelection(courseSelection, this.courseData);
      const validation = this.validateCourseSpans(selectedCourses, options);
      
      if (!validation.valid && options.strict_span_validation) {
        throw new Error(`Invalid course spans: ${validation.mismatch_details.map(d => d.course).join(', ')}`);
      }
      
      const weeklyTable = this.buildWeeklyTable(selectedCourses);
      const conflicts = this.validateNoConflicts(weeklyTable);
      
      return {
        weeklyTable,
        validation: {
          ...validation,
          conflicts,
          valid: validation.valid && conflicts.length === 0
        },
        selectedCourses
      };
    } catch (error) {
      throw new Error(`Schedule generation failed: ${error.message}`);
    }
  }
}
```

#### Core Methods

##### parseUserCourseSelection(courseInput, courseGroups)
```javascript
parseUserCourseSelection(courseInput, courseGroups = []) {
  // Parse input like: ["EEC 101", "EEC 10105", "EEC 10105,06"]
  const selectedCourses = [];
  
  for (const course of courseInput) {
    const parsed = this.parseSingleCourse(course.trim());
    
    if (parsed.groups.length === 0) {
      // No specific group - find available groups
      const availableGroups = this.findAvailableGroups(parsed.code);
      if (availableGroups.length > 0) {
        parsed.groups = [availableGroups[0]]; // Select first available
      }
    }
    
    // Handle shared groups (e.g., "05,06")
    if (parsed.groups.length > 1) {
      parsed.shared_lecture = true;
    }
    
    selectedCourses.push(parsed);
  }
  
  return selectedCourses;
}

parseSingleCourse(courseString) {
  // Handle formats:
  // "EEC 101" -> { code: "EEC 101", groups: [] }
  // "EEC 10105" -> { code: "EEC 101", groups: ["05"] }
  // "EEC 10105,06" -> { code: "EEC 101", groups: ["05", "06"] }
  
  const match = courseString.match(/^([A-Z]+\s+\d+)(\d{2}(?:,\d{2})*)?$/);
  
  if (!match) {
    return { code: courseString, groups: [] };
  }
  
  const [, code, groupsPart] = match;
  const groups = groupsPart ? groupsPart.split(',').map(g => g.trim()) : [];
  
  return { code, groups };
}
```

##### validateCourseSpans(courses, options = {})
```javascript
validateCourseSpans(courses, options = {}) {
  const requiredSpans = {
    'EEC 101': 3, 'EEC 113': 3, 'EEC 121': 5,
    'EEC 125': 5, 'EEC 142': 6, 'EEC 212': 5, 'EEC 284': 4
  };
  
  const mismatch_details = [];
  let valid = true;
  
  for (const course of courses) {
    const expected = requiredSpans[course.code];
    if (expected) {
      const actual = this.calculateActualSpan(course.code);
      
      const spanValid = actual === expected;
      if (!spanValid) {
        valid = false;
        mismatch_details.push({
          course: course.code,
          expected,
          actual,
          valid: spanValid
        });
      }
    }
  }
  
  return {
    valid,
    span_details: courses.map(course => {
      const expected = requiredSpans[course.code] || 3;
      const actual = this.calculateActualSpan(course.code);
      return {
        course: course.code,
        expected,
        actual,
        valid: actual === expected
      };
    }),
    mismatch_details: options.strict_span_validation ? mismatch_details : []
  };
}

calculateActualSpan(courseCode) {
  // Count actual time slots used by this course in schedule data
  const courseSlots = this.scheduleData.filter(slot => 
    slot.course_code === courseCode
  );
  return courseSlots.length;
}
```

##### buildWeeklyTable(selectedCourses)
```javascript
buildWeeklyTable(selectedCourses) {
  // Initialize 7-day × 8-slot table
  const weeklyTable = {};
  this.days.forEach(day => {
    weeklyTable[day] = new Array(this.timeSlots).fill(null);
  });
  
  // Place courses in their scheduled slots
  for (const selectedCourse of selectedCourses) {
    const scheduleEntries = this.findScheduleEntries(selectedCourse);
    
    for (const entry of scheduleEntries) {
      const { day, slot } = entry;
      
      if (weeklyTable[day] && weeklyTable[day][slot] === null) {
        weeklyTable[day][slot] = {
          code: selectedCourse.code,
          group: selectedCourse.groups.join(','),
          arabic_name: entry.arabic_name,
          hall: entry.hall,
          professor: entry.professor,
          time: entry.time
        };
      }
    }
  }
  
  return weeklyTable;
}

findScheduleEntries(selectedCourse) {
  // Find all schedule entries for a selected course
  const entries = [];
  
  for (const group of selectedCourse.groups) {
    const groupEntries = this.scheduleData.filter(entry => 
      entry.course_code === selectedCourse.code && 
      (entry.group === group || entry.group === '')
    );
    entries.push(...groupEntries);
  }
  
  // Handle shared lectures
  if (selectedCourse.shared_lecture) {
    const lectureEntries = this.scheduleData.filter(entry =>
      entry.course_code === selectedCourse.code &&
      entry.hall && entry.hall.toLowerCase().includes('lecture')
    );
    entries.push(...lectureEntries);
  }
  
  return entries;
}
```

##### validateNoConflicts(weeklyTable)
```javascript
validateNoConflicts(weeklyTable) {
  const conflicts = [];
  
  for (const day of this.days) {
    for (let slot = 0; slot < this.timeSlots; slot++) {
      const course = weeklyTable[day][slot];
      
      if (course) {
        // Check for overlapping courses (should not happen with proper parsing)
        for (let checkSlot = slot + 1; checkSlot < this.timeSlots; checkSlot++) {
          const checkCourse = weeklyTable[day][checkSlot];
          
          if (checkCourse && course.code === checkCourse.code && course.group === checkCourse.group) {
            // This might be a multi-slot course, which is valid
            continue;
          }
        }
      }
    }
  }
  
  // Check for time conflicts across different courses
  for (const day of this.days) {
    for (let slot = 0; slot < this.timeSlots; slot++) {
      const courses = this.getCoursesAtSlot(weeklyTable, day, slot);
      
      if (courses.length > 1) {
        conflicts.push({
          day,
          slot,
          time: this.getTimeSlotString(slot),
          courses: courses.map(c => `${c.code} ${c.group}`)
        });
      }
    }
  }
  
  return conflicts;
}
```

### 3. ExportService.js

**Purpose**: Handles exporting generated schedules to various formats (PDF, Excel, JSON).

**Key Features**:
- Multiple export formats
- Custom styling and formatting
- Progress tracking
- File management

#### Class Structure

```javascript
class ExportService {
  constructor() {
    this.supportedFormats = ['pdf', 'excel', 'json', 'html'];
    this.tempDir = path.join(__dirname, '../temp');
    this.ensureTempDir();
  }
  
  async exportSchedule(schedule, format, options = {}) {
    try {
      switch (format.toLowerCase()) {
        case 'pdf':
          return await this.exportToPDF(schedule, options);
        case 'excel':
          return await this.exportToExcel(schedule, options);
        case 'json':
          return await this.exportToJSON(schedule, options);
        case 'html':
          return await this.exportToHTML(schedule, options);
        default:
          throw new Error(`Unsupported format: ${format}`);
      }
    } catch (error) {
      throw new Error(`Export failed: ${error.message}`);
    }
  }
}
```

#### Export Methods

##### exportToPDF(schedule, options)
```javascript
async exportToPDF(schedule, options = {}) {
  const puppeteer = require('puppeteer');
  const path = require('path');
  
  try {
    // Generate HTML content
    const htmlContent = this.generateHTMLTable(schedule, {
      ...options,
      styling: 'pdf'
    });
    
    // Launch browser
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    
    // Set content and styling
    await page.setContent(htmlContent);
    await page.addStyleTag({
      content: this.getPDFStyles()
    });
    
    // Generate PDF
    const filename = options.filename || `schedule-${Date.now()}.pdf`;
    const filepath = path.join(this.tempDir, filename);
    
    await page.pdf({
      path: filepath,
      format: 'A4',
      landscape: true,
      margin: {
        top: '20mm',
        right: '10mm',
        bottom: '20mm',
        left: '10mm'
      }
    });
    
    await browser.close();
    
    return {
      filepath,
      filename,
      format: 'pdf',
      size: await this.getFileSize(filepath)
    };
  } catch (error) {
    throw new Error(`PDF export failed: ${error.message}`);
  }
}
```

##### exportToExcel(schedule, options)
```javascript
async exportToExcel(schedule, options = {}) {
  const XLSX = require('xlsx');
  const path = require('path');
  
  try {
    // Create workbook
    const workbook = XLSX.utils.book_new();
    
    // Prepare data for Excel
    const excelData = this.prepareExcelData(schedule);
    
    // Create worksheet
    const worksheet = XLSX.utils.aoa_to_sheet(excelData);
    
    // Apply styling
    this.applyExcelStyling(worksheet, schedule);
    
    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Weekly Schedule');
    
    // Generate file
    const filename = options.filename || `schedule-${Date.now()}.xlsx`;
    const filepath = path.join(this.tempDir, filename);
    
    XLSX.writeFile(workbook, filepath);
    
    return {
      filepath,
      filename,
      format: 'excel',
      size: await this.getFileSize(filepath)
    };
  } catch (error) {
    throw new Error(`Excel export failed: ${error.message}`);
  }
}

prepareExcelData(schedule) {
  const days = ['Saturday', 'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
  const timeSlots = [
    '8:00-8:45', '8:45-9:30', '9:30-10:15', '10:15-11:00',
    '11:00-11:45', '11:45-12:30', '12:30-1:15', '1:15-2:00'
  ];
  
  // Create header row
  const data = [['Time', ...days]];
  
  // Add data rows
  for (let slot = 0; slot < 8; slot++) {
    const row = [timeSlots[slot]];
    
    for (const day of days) {
      const course = schedule[day] && schedule[day][slot];
      if (course) {
        // Multi-line cell content
        const cellContent = [
          `${course.code} ${course.group}`,
          course.arabic_name,
          `${course.hall} - ${course.professor}`
        ].join('\n');
        row.push(cellContent);
      } else {
        row.push('');
      }
    }
    
    data.push(row);
  }
  
  return data;
}
```

##### exportToJSON(schedule, options)
```javascript
async exportToJSON(schedule, options = {}) {
  const path = require('path');
  const fs = require('fs').promises;
  
  try {
    const exportData = {
      metadata: {
        exported_at: new Date().toISOString(),
        format: 'json',
        version: '1.0',
        ...options.metadata
      },
      schedule: schedule,
      summary: this.generateScheduleSummary(schedule)
    };
    
    const filename = options.filename || `schedule-${Date.now()}.json`;
    const filepath = path.join(this.tempDir, filename);
    
    await fs.writeFile(filepath, JSON.stringify(exportData, null, 2));
    
    return {
      filepath,
      filename,
      format: 'json',
      size: await this.getFileSize(filepath)
    };
  } catch (error) {
    throw new Error(`JSON export failed: ${error.message}`);
  }
}
```

#### Utility Methods

##### generateHTMLTable(schedule, options)
```javascript
generateHTMLTable(schedule, options = {}) {
  const days = ['Saturday', 'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
  const timeSlots = [
    '8:00-8:45', '8:45-9:30', '9:30-10:15', '10:15-11:00',
    '11:00-11:45', '11:45-12:30', '12:30-1:15', '1:15-2:00'
  ];
  
  let html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Weekly Schedule</title>
      ${options.styling === 'pdf' ? this.getPDFStyles() : this.getWebStyles()}
    </head>
    <body>
      <div class="schedule-container">
        <h1>Weekly Schedule</h1>
        <table class="schedule-table">
          <thead>
            <tr>
              <th class="time-header">Time</th>
              ${days.map(day => `<th class="day-header">${day}</th>`).join('')}
            </tr>
          </thead>
          <tbody>
  `;
  
  for (let slot = 0; slot < 8; slot++) {
    html += `<tr>`;
    html += `<td class="time-cell">${timeSlots[slot]}</td>`;
    
    for (const day of days) {
      const course = schedule[day] && schedule[day][slot];
      if (course) {
        html += `
          <td class="course-cell">
            <div class="course-code">${course.code} ${course.group}</div>
            <div class="course-name">${course.arabic_name}</div>
            <div class="course-details">${course.hall} - ${course.professor}</div>
          </td>
        `;
      } else {
        html += `<td class="empty-cell">-</td>`;
      }
    }
    
    html += `</tr>`;
  }
  
  html += `
          </tbody>
        </table>
      </div>
    </body>
    </html>
  `;
  
  return html;
}
```

##### Styling Methods
```javascript
getPDFStyles() {
  return `
    <style>
      body {
        font-family: 'Arial', sans-serif;
        margin: 0;
        padding: 20px;
        font-size: 12px;
      }
      
      .schedule-container {
        max-width: 100%;
        margin: 0 auto;
      }
      
      h1 {
        text-align: center;
        color: #333;
        margin-bottom: 20px;
      }
      
      .schedule-table {
        width: 100%;
        border-collapse: collapse;
        border: 2px solid #333;
      }
      
      th, td {
        border: 1px solid #666;
        padding: 8px;
        text-align: center;
        vertical-align: top;
      }
      
      th {
        background-color: #f0f0f0;
        font-weight: bold;
      }
      
      .time-header, .time-cell {
        background-color: #e0e0e0;
        font-weight: bold;
        width: 100px;
      }
      
      .course-cell {
        background-color: #f9f9f9;
        min-height: 60px;
      }
      
      .course-code {
        font-weight: bold;
        color: #007acc;
        margin-bottom: 4px;
      }
      
      .course-name {
        font-size: 10px;
        color: #333;
        margin-bottom: 4px;
      }
      
      .course-details {
        font-size: 9px;
        color: #666;
      }
      
      .empty-cell {
        color: #ccc;
        font-style: italic;
      }
    </style>
  `;
}
```

## Middleware Services

### 1. Validation Middleware

```javascript
// middleware/validation.js
const { body, param, validationResult } = require('express-validator');

const validateCourseSelection = [
  body('courses')
    .isArray()
    .withMessage('Courses must be an array')
    .custom((courses) => {
      if (courses.length === 0) {
        throw new Error('At least one course must be selected');
      }
      
      for (const course of courses) {
        if (typeof course !== 'string' || course.trim().length === 0) {
          throw new Error('Each course must be a non-empty string');
        }
      }
      
      return true;
    }),
  
  body('validation.strict_span_validation')
    .optional()
    .isBoolean()
    .withMessage('strict_span_validation must be a boolean'),
  
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }
    next();
  }
];
```

### 2. Error Handling Middleware

```javascript
// middleware/errorHandler.js
const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);
  
  // Determine error type and status code
  let statusCode = 500;
  let message = 'Internal server error';
  
  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = err.message;
  } else if (err.name === 'ExcelParsingError') {
    statusCode = 422;
    message = 'Excel file could not be processed';
  } else if (err.message.includes('Schedule generation failed')) {
    statusCode = 422;
    message = err.message;
  }
  
  res.status(statusCode).json({
    error: message,
    timestamp: new Date().toISOString(),
    path: req.path
  });
};

module.exports = errorHandler;
```

### 3. File Upload Middleware

```javascript
// middleware/fileUpload.js
const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../uploads'));
  },
  filename: (req, file, cb) => {
    const timestamp = Date.now();
    const ext = path.extname(file.originalname);
    cb(null, `excel-${timestamp}${ext}`);
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-excel'
  ];
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only Excel files are allowed'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

module.exports = upload;
```

## API Route Handlers

### 1. Excel Routes

```javascript
// routes/excel.js
const express = require('express');
const router = express.Router();
const ExcelParserService = require('../services/ExcelParserServiceFinal');
const upload = require('../middleware/fileUpload');

// Upload and parse Excel file
router.post('/upload', upload.single('excel'), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No Excel file provided' });
    }
    
    const parser = new ExcelParserService();
    const result = await parser.parseExcelFile(req.file.path);
    
    // Store parsed data in session or database
    req.session.courseData = result.courses;
    req.session.scheduleData = result.schedule;
    
    res.json({
      message: 'Excel file processed successfully',
      courses: result.courses.length,
      schedule_entries: result.schedule.length,
      metadata: result.metadata
    });
  } catch (error) {
    next(error);
  }
});

// Get parsed course data
router.get('/courses', (req, res) => {
  const courses = req.session.courseData || [];
  res.json({ courses });
});

// Get parsed schedule data
router.get('/schedule', (req, res) => {
  const schedule = req.session.scheduleData || [];
  res.json({ schedule });
});

module.exports = router;
```

### 2. Schedule Generation Routes

```javascript
// routes/schedule.js
const express = require('express');
const router = express.Router();
const ScheduleGeneratorService = require('../services/ScheduleGeneratorService');
const { validateCourseSelection } = require('../middleware/validation');

// Generate personalized schedule
router.post('/generate', validateCourseSelection, async (req, res, next) => {
  try {
    const { courses, validation = {} } = req.body;
    
    const generator = new ScheduleGeneratorService();
    
    // Load data from session
    generator.courseData = req.session.courseData || [];
    generator.scheduleData = req.session.scheduleData || [];
    
    if (generator.scheduleData.length === 0) {
      return res.status(400).json({
        error: 'No schedule data available. Please upload an Excel file first.'
      });
    }
    
    const result = await generator.generatePersonalizedSchedule(courses, validation);
    
    res.json({
      success: true,
      weeklyTable: result.weeklyTable,
      validation: result.validation,
      selectedCourses: result.selectedCourses
    });
  } catch (error) {
    next(error);
  }
});

// Validate course selection
router.post('/validate', validateCourseSelection, async (req, res, next) => {
  try {
    const { courses } = req.body;
    
    const generator = new ScheduleGeneratorService();
    generator.courseData = req.session.courseData || [];
    generator.scheduleData = req.session.scheduleData || [];
    
    const selectedCourses = generator.parseUserCourseSelection(courses, generator.courseData);
    const validation = generator.validateCourseSpans(selectedCourses, { strict_span_validation: true });
    
    res.json({
      validation,
      selectedCourses
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
```

### 3. Export Routes

```javascript
// routes/export.js
const express = require('express');
const router = express.Router();
const ExportService = require('../services/ExportService');
const path = require('path');

// Export schedule
router.post('/schedule', async (req, res, next) => {
  try {
    const { schedule, format = 'pdf', filename, metadata } = req.body;
    
    if (!schedule) {
      return res.status(400).json({ error: 'Schedule data is required' });
    }
    
    const exportService = new ExportService();
    const result = await exportService.exportSchedule(schedule, format, {
      filename,
      metadata
    });
    
    // Send file as download
    res.download(result.filepath, result.filename, (err) => {
      if (err) {
        console.error('Download error:', err);
        if (!res.headersSent) {
          res.status(500).json({ error: 'Download failed' });
        }
      }
      
      // Clean up temp file
      setTimeout(() => {
        const fs = require('fs');
        fs.unlink(result.filepath, (unlinkErr) => {
          if (unlinkErr) console.error('Cleanup error:', unlinkErr);
        });
      }, 5000);
    });
  } catch (error) {
    next(error);
  }
});

// Get supported export formats
router.get('/formats', (req, res) => {
  res.json({
    formats: ['pdf', 'excel', 'json', 'html'],
    default: 'pdf'
  });
});

module.exports = router;
```

## Server Configuration

### Main Server (index.js)

```javascript
const express = require('express');
const cors = require('cors');
const session = require('express-session');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Session configuration
app.use(session({
  secret: process.env.SESSION_SECRET || 'hti-scheduler-secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// Routes
app.use('/api/excel', require('./routes/excel'));
app.use('/api/schedule', require('./routes/schedule'));
app.use('/api/export', require('./routes/export'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Error handling
app.use(require('./middleware/errorHandler'));

// Start server
app.listen(PORT, () => {
  console.log(`HTI Scheduler server running on port ${PORT}`);
});

module.exports = app;
```

## Database Integration (Optional)

### Course Data Model

```javascript
// models/Course.js
const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
    unique: true
  },
  arabic_name: {
    type: String,
    required: true
  },
  english_name: String,
  credit_hours: {
    type: Number,
    default: 3
  },
  span: {
    type: Number,
    default: 3
  },
  department: String,
  created_at: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Course', courseSchema);
```

### Schedule Data Model

```javascript
// models/ScheduleEntry.js
const mongoose = require('mongoose');

const scheduleEntrySchema = new mongoose.Schema({
  course_code: {
    type: String,
    required: true
  },
  group: String,
  day: {
    type: String,
    enum: ['Saturday', 'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
  },
  slot: {
    type: Number,
    min: 0,
    max: 7
  },
  time: String,
  hall: String,
  professor: String,
  arabic_name: String,
  created_at: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('ScheduleEntry', scheduleEntrySchema);
```

This comprehensive backend documentation covers all server-side services, their methods, API endpoints, middleware, and integration patterns for the HTI Scheduler application.
