# Frontend Components Documentation

## Overview

The HTI Scheduler frontend is built with React and provides an intuitive interface for students to generate their personalized weekly schedules. This document details all React components, their props, state management, and integration patterns.

## Project Structure

```
client/src/
├── components/
│   ├── PersonalizedScheduleGenerator.jsx  # Main schedule generator
│   ├── ScheduleDisplay.jsx                # Weekly table display
│   ├── CourseSelector.jsx                 # Course selection interface
│   └── ExportOptions.jsx                  # Export functionality
├── pages/
│   ├── Home.jsx                          # Landing page
│   ├── ScheduleGenerator.jsx             # Main generator page
│   └── About.jsx                         # About page
├── services/
│   └── api.js                            # API communication
└── styles/
    └── components/                       # Component-specific styles
```

## Core Components

### 1. PersonalizedScheduleGenerator.jsx

**Purpose**: Main component that orchestrates the entire schedule generation process.

**Key Features**:
- Course selection with group parsing
- Excel file upload and processing
- Real-time schedule generation
- Export functionality
- Error handling and validation

**Props**: None (top-level component)

**State Management**:
```javascript
const [selectedCourses, setSelectedCourses] = useState([]);
const [generatedSchedule, setGeneratedSchedule] = useState(null);
const [courseData, setCourseData] = useState(null);
const [validationResults, setValidationResults] = useState(null);
const [isLoading, setIsLoading] = useState(false);
const [errors, setErrors] = useState([]);
```

**Key Methods**:

#### handleCourseSelection(courseInput)
```javascript
// Parses course input like "EEC 101, EEC 10105, EEC 121"
// Supports groups: "EEC 10105,06" for shared lectures
const handleCourseSelection = (courseInput) => {
  const courses = courseInput.split(',').map(course => course.trim());
  const parsedCourses = courses.map(parseCourseWithGroup);
  setSelectedCourses(parsedCourses);
};
```

#### generateSchedule()
```javascript
// Main schedule generation logic
const generateSchedule = async () => {
  setIsLoading(true);
  try {
    const response = await api.generateSchedule({
      courses: selectedCourses,
      validation: { strict_span_validation: true }
    });
    setGeneratedSchedule(response.weeklyTable);
    setValidationResults(response.validation);
  } catch (error) {
    setErrors([error.message]);
  } finally {
    setIsLoading(false);
  }
};
```

#### Component Structure
```jsx
function PersonalizedScheduleGenerator() {
  return (
    <div className="schedule-generator">
      <div className="upload-section">
        <ExcelUploader onUpload={handleExcelUpload} />
      </div>
      
      <div className="selection-section">
        <CourseSelector 
          courses={selectedCourses}
          onSelectionChange={handleCourseSelection}
          availableCourses={courseData?.courses}
        />
      </div>
      
      <div className="generation-section">
        <button onClick={generateSchedule} disabled={isLoading}>
          {isLoading ? 'Generating...' : 'Generate Schedule'}
        </button>
      </div>
      
      <div className="results-section">
        {generatedSchedule && (
          <ScheduleDisplay 
            schedule={generatedSchedule}
            validation={validationResults}
          />
        )}
      </div>
      
      <div className="export-section">
        {generatedSchedule && (
          <ExportOptions 
            schedule={generatedSchedule}
            courses={selectedCourses}
          />
        )}
      </div>
    </div>
  );
}
```

### 2. ScheduleDisplay.jsx

**Purpose**: Renders the weekly schedule table with proper formatting.

**Props**:
- `schedule`: Weekly table object (7 days × 8 time slots)
- `validation`: Validation results object
- `showValidation`: Boolean to show/hide validation details

**Key Features**:
- 7-day × 8-slot table rendering
- 3-row course blocks per cell
- Conflict highlighting
- Responsive design

**Component Structure**:
```jsx
function ScheduleDisplay({ schedule, validation, showValidation = true }) {
  const days = ['Saturday', 'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
  const timeSlots = [
    '8:00-8:45', '8:45-9:30', '9:30-10:15', '10:15-11:00',
    '11:00-11:45', '11:45-12:30', '12:30-1:15', '1:15-2:00'
  ];

  const renderCourseCell = (course) => {
    if (!course) return <div className="empty-slot">-</div>;
    
    return (
      <div className="course-cell">
        <div className="course-code">{course.code} {course.group}</div>
        <div className="course-name">{course.arabic_name}</div>
        <div className="course-details">{course.hall} - {course.professor}</div>
      </div>
    );
  };

  return (
    <div className="schedule-display">
      {showValidation && <ValidationSummary validation={validation} />}
      
      <table className="weekly-schedule">
        <thead>
          <tr>
            <th>Time</th>
            {days.map(day => <th key={day}>{day}</th>)}
          </tr>
        </thead>
        <tbody>
          {timeSlots.map((slot, slotIndex) => (
            <tr key={slot}>
              <td className="time-slot">{slot}</td>
              {days.map(day => (
                <td key={day} className="schedule-cell">
                  {renderCourseCell(schedule[day]?.[slotIndex])}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

### 3. CourseSelector.jsx

**Purpose**: Interface for selecting courses with intelligent group handling.

**Props**:
- `courses`: Currently selected courses array
- `onSelectionChange`: Callback for course selection changes
- `availableCourses`: List of available courses from Excel

**Key Features**:
- Smart course parsing (with/without groups)
- Shared group detection ("05,06")
- Real-time validation feedback
- Autocomplete suggestions

**Component Structure**:
```jsx
function CourseSelector({ courses, onSelectionChange, availableCourses }) {
  const [courseInput, setCourseInput] = useState('');
  const [suggestions, setSuggestions] = useState([]);

  const handleInputChange = (value) => {
    setCourseInput(value);
    
    // Generate suggestions based on available courses
    if (availableCourses) {
      const filtered = availableCourses.filter(course => 
        course.code.toLowerCase().includes(value.toLowerCase())
      );
      setSuggestions(filtered.slice(0, 5));
    }
  };

  const addCourse = () => {
    if (courseInput.trim()) {
      onSelectionChange([...courses, courseInput.trim()]);
      setCourseInput('');
    }
  };

  const removeCourse = (index) => {
    const updated = courses.filter((_, i) => i !== index);
    onSelectionChange(updated);
  };

  return (
    <div className="course-selector">
      <div className="input-section">
        <input
          type="text"
          value={courseInput}
          onChange={(e) => handleInputChange(e.target.value)}
          placeholder="Enter course (e.g., EEC 101, EEC 10105, EEC 10105,06)"
          onKeyPress={(e) => e.key === 'Enter' && addCourse()}
        />
        <button onClick={addCourse}>Add Course</button>
      </div>

      {suggestions.length > 0 && (
        <div className="suggestions">
          {suggestions.map(course => (
            <div 
              key={course.id} 
              className="suggestion"
              onClick={() => setCourseInput(course.code)}
            >
              {course.code} - {course.arabic_name}
            </div>
          ))}
        </div>
      )}

      <div className="selected-courses">
        {courses.map((course, index) => (
          <div key={index} className="course-tag">
            {course}
            <button onClick={() => removeCourse(index)}>×</button>
          </div>
        ))}
      </div>
    </div>
  );
}
```

### 4. ExportOptions.jsx

**Purpose**: Provides various export formats for the generated schedule.

**Props**:
- `schedule`: Generated weekly schedule
- `courses`: Selected courses list
- `onExport`: Export callback function

**Key Features**:
- Multiple export formats (PDF, Excel, JSON)
- Custom filename generation
- Export progress tracking

**Component Structure**:
```jsx
function ExportOptions({ schedule, courses, onExport }) {
  const [exportFormat, setExportFormat] = useState('pdf');
  const [isExporting, setIsExporting] = useState(false);
  const [customFilename, setCustomFilename] = useState('');

  const generateDefaultFilename = () => {
    const timestamp = new Date().toISOString().split('T')[0];
    const courseList = courses.slice(0, 3).join('-');
    return `schedule-${courseList}-${timestamp}`;
  };

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const filename = customFilename || generateDefaultFilename();
      await api.exportSchedule({
        schedule,
        format: exportFormat,
        filename,
        courses
      });
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="export-options">
      <h3>Export Schedule</h3>
      
      <div className="format-selection">
        <label>
          <input
            type="radio"
            value="pdf"
            checked={exportFormat === 'pdf'}
            onChange={(e) => setExportFormat(e.target.value)}
          />
          PDF
        </label>
        <label>
          <input
            type="radio"
            value="excel"
            checked={exportFormat === 'excel'}
            onChange={(e) => setExportFormat(e.target.value)}
          />
          Excel
        </label>
        <label>
          <input
            type="radio"
            value="json"
            checked={exportFormat === 'json'}
            onChange={(e) => setExportFormat(e.target.value)}
          />
          JSON
        </label>
      </div>

      <div className="filename-input">
        <input
          type="text"
          value={customFilename}
          onChange={(e) => setCustomFilename(e.target.value)}
          placeholder={generateDefaultFilename()}
        />
      </div>

      <button 
        onClick={handleExport} 
        disabled={isExporting}
        className="export-button"
      >
        {isExporting ? 'Exporting...' : `Export as ${exportFormat.toUpperCase()}`}
      </button>
    </div>
  );
}
```

## Utility Components

### ValidationSummary.jsx

Displays validation results and span verification:

```jsx
function ValidationSummary({ validation }) {
  if (!validation) return null;

  return (
    <div className="validation-summary">
      <div className={`status ${validation.valid ? 'valid' : 'invalid'}`}>
        {validation.valid ? '✓ Schedule Valid' : '✗ Validation Issues'}
      </div>
      
      {validation.span_details && (
        <div className="span-details">
          <h4>Course Spans:</h4>
          {validation.span_details.map(detail => (
            <div key={detail.course} className={detail.valid ? 'valid' : 'invalid'}>
              {detail.course}: Expected {detail.expected}, Got {detail.actual}
              {!detail.valid && ' ✗'}
            </div>
          ))}
        </div>
      )}
      
      {validation.conflicts && validation.conflicts.length > 0 && (
        <div className="conflicts">
          <h4>Time Conflicts:</h4>
          {validation.conflicts.map((conflict, index) => (
            <div key={index} className="conflict">
              {conflict.courses.join(' vs ')} at {conflict.time}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

### ExcelUploader.jsx

Handles Excel file upload with validation:

```jsx
function ExcelUploader({ onUpload }) {
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = Array.from(e.dataTransfer.files);
    const excelFile = files.find(file => 
      file.type.includes('spreadsheet') || file.name.endsWith('.xlsx')
    );
    
    if (excelFile) {
      uploadFile(excelFile);
    }
  };

  const uploadFile = async (file) => {
    const formData = new FormData();
    formData.append('excel', file);
    
    try {
      setUploadProgress(0);
      const response = await api.uploadExcel(formData, {
        onUploadProgress: (progressEvent) => {
          const progress = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          setUploadProgress(progress);
        }
      });
      onUpload(response.data);
    } catch (error) {
      console.error('Upload failed:', error);
    }
  };

  return (
    <div 
      className={`excel-uploader ${isDragging ? 'dragging' : ''}`}
      onDrop={handleDrop}
      onDragOver={(e) => e.preventDefault()}
      onDragEnter={() => setIsDragging(true)}
      onDragLeave={() => setIsDragging(false)}
    >
      <div className="upload-content">
        <p>Drop Excel file here or click to browse</p>
        <input 
          type="file" 
          accept=".xlsx,.xls" 
          onChange={(e) => uploadFile(e.target.files[0])}
        />
      </div>
      
      {uploadProgress > 0 && (
        <div className="progress-bar">
          <div 
            className="progress-fill" 
            style={{ width: `${uploadProgress}%` }}
          />
        </div>
      )}
    </div>
  );
}
```

## State Management Patterns

### 1. Course Selection State

```javascript
// Course selection with smart parsing
const [courseSelection, setCourseSelection] = useState({
  raw: '',           // User input: "EEC 101, EEC 10105,06"
  parsed: [],        // Parsed courses with groups
  validated: [],     // Validated against Excel data
  conflicts: []      // Detected conflicts
});
```

### 2. Schedule Generation State

```javascript
const [scheduleState, setScheduleState] = useState({
  isGenerating: false,
  weeklyTable: null,
  validation: null,
  errors: [],
  warnings: []
});
```

### 3. Export State

```javascript
const [exportState, setExportState] = useState({
  format: 'pdf',
  filename: '',
  isExporting: false,
  progress: 0
});
```

## Event Handling Patterns

### Course Input Parsing

```javascript
const parseCourseInput = (input) => {
  // Handle patterns like:
  // "EEC 101" -> { code: "EEC 101", groups: [] }
  // "EEC 10105" -> { code: "EEC 101", groups: ["05"] }
  // "EEC 10105,06" -> { code: "EEC 101", groups: ["05", "06"] }
  
  const courses = input.split(',').map(course => {
    const trimmed = course.trim();
    const match = trimmed.match(/^([A-Z]+\s+\d+)(\d{2}(?:,\d{2})*)?$/);
    
    if (!match) return { code: trimmed, groups: [] };
    
    const [, code, groupsPart] = match;
    const groups = groupsPart ? groupsPart.split(',') : [];
    
    return { code, groups };
  });
  
  return courses;
};
```

### Validation Integration

```javascript
const validateAndGenerate = async () => {
  // Client-side validation
  const clientValidation = validateCourseSelection(selectedCourses);
  if (!clientValidation.valid) {
    setErrors(clientValidation.errors);
    return;
  }
  
  // Server-side generation with validation
  const response = await api.generateSchedule({
    courses: selectedCourses,
    validation: { strict_span_validation: true }
  });
  
  // Handle validation results
  if (!response.validation.valid) {
    setWarnings(response.validation.warnings || []);
  }
  
  setGeneratedSchedule(response.weeklyTable);
};
```

## Styling Guidelines

### CSS Class Naming Convention

```css
/* Component-level classes */
.schedule-generator { }
.course-selector { }
.schedule-display { }

/* Element-level classes */
.course-cell { }
.time-slot { }
.export-button { }

/* State-based classes */
.is-loading { }
.has-conflicts { }
.is-valid { }

/* Utility classes */
.text-center { }
.mt-4 { }
.error-message { }
```

### Responsive Design

```css
/* Mobile-first approach */
.weekly-schedule {
  font-size: 0.8rem;
  overflow-x: auto;
}

@media (min-width: 768px) {
  .weekly-schedule {
    font-size: 1rem;
  }
}

@media (min-width: 1024px) {
  .schedule-generator {
    max-width: 1200px;
    margin: 0 auto;
  }
}
```

## Testing Components

### Unit Testing Example

```javascript
// CourseSelector.test.jsx
import { render, fireEvent, screen } from '@testing-library/react';
import CourseSelector from '../components/CourseSelector';

test('parses course input correctly', () => {
  const mockOnChange = jest.fn();
  render(
    <CourseSelector 
      courses={[]} 
      onSelectionChange={mockOnChange} 
    />
  );
  
  const input = screen.getByPlaceholderText(/enter course/i);
  fireEvent.change(input, { target: { value: 'EEC 10105,06' } });
  fireEvent.click(screen.getByText('Add Course'));
  
  expect(mockOnChange).toHaveBeenCalledWith(['EEC 10105,06']);
});
```

### Integration Testing

```javascript
// ScheduleGenerator.test.jsx
test('generates schedule end-to-end', async () => {
  const mockApi = {
    generateSchedule: jest.fn().mockResolvedValue({
      weeklyTable: mockScheduleData,
      validation: { valid: true }
    })
  };
  
  render(<PersonalizedScheduleGenerator api={mockApi} />);
  
  // Add courses
  fireEvent.change(screen.getByPlaceholderText(/enter course/i), {
    target: { value: 'EEC 101, EEC 113' }
  });
  fireEvent.click(screen.getByText('Add Course'));
  
  // Generate schedule
  fireEvent.click(screen.getByText('Generate Schedule'));
  
  // Verify schedule display
  await waitFor(() => {
    expect(screen.getByText('Weekly Schedule')).toBeInTheDocument();
  });
});
```

## Performance Optimization

### React.memo Usage

```javascript
// Memoize expensive components
const ScheduleDisplay = React.memo(({ schedule, validation }) => {
  // Component implementation
}, (prevProps, nextProps) => {
  // Custom comparison for deep objects
  return JSON.stringify(prevProps.schedule) === JSON.stringify(nextProps.schedule);
});
```

### useMemo for Expensive Calculations

```javascript
const sortedCourses = useMemo(() => {
  return availableCourses?.sort((a, b) => a.code.localeCompare(b.code)) || [];
}, [availableCourses]);
```

### useCallback for Event Handlers

```javascript
const handleCourseSelection = useCallback((courses) => {
  setSelectedCourses(courses);
  // Trigger validation
  validateCourses(courses);
}, [validateCourses]);
```

This comprehensive frontend documentation covers all React components, their interactions, state management patterns, and best practices for the HTI Scheduler application.
