# Troubleshooting Guide

## Overview

This guide provides solutions to common issues that may arise when setting up, developing, or using the HTI Scheduler application. It covers backend services, frontend components, deployment issues, and general troubleshooting procedures.

## Table of Contents

1. [Installation Issues](#installation-issues)
2. [Excel Parsing Problems](#excel-parsing-problems)
3. [Schedule Generation Issues](#schedule-generation-issues)
4. [Export Functionality Problems](#export-functionality-problems)
5. [Frontend Component Issues](#frontend-component-issues)
6. [API Communication Problems](#api-communication-problems)
7. [Performance Issues](#performance-issues)
8. [GitHub Copilot Configuration Issues](#github-copilot-configuration-issues)
9. [Development Environment Problems](#development-environment-problems)
10. [Common Error Messages](#common-error-messages)

## Installation Issues

### Node.js Version Compatibility

**Problem**: Application fails to start with Node.js version errors.

**Symptoms**:
```bash
Error: The engine "node" is incompatible with this module.
```

**Solution**:
1. Check Node.js version:
```bash
node --version
```

2. Install compatible Node.js version (18 or higher):
```bash
# Using nvm
nvm install 18
nvm use 18

# Or download from nodejs.org
```

3. Clear npm cache and reinstall:
```bash
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

### Dependency Installation Failures

**Problem**: npm install fails with permission or network errors.

**Symptoms**:
```bash
EACCES: permission denied
ENETUNREACH: network is unreachable
```

**Solutions**:

1. **Permission Issues**:
```bash
# Fix npm permissions
sudo chown -R $(whoami) ~/.npm
sudo chown -R $(whoami) /usr/local/lib/node_modules

# Or use npm config
npm config set prefix ~/.local
```

2. **Network Issues**:
```bash
# Use different registry
npm config set registry https://registry.npmjs.org/

# Clear npm cache
npm cache clean --force

# Try with verbose logging
npm install --verbose
```

3. **Platform-specific Dependencies**:
```bash
# For puppeteer issues
npm install puppeteer --unsafe-perm=true

# For sharp/canvas issues
npm install --platform=linux --arch=x64

# Clear node_modules and retry
rm -rf node_modules
npm install
```

### Port Already in Use

**Problem**: Server fails to start because port is already in use.

**Symptoms**:
```bash
Error: listen EADDRINUSE :::3001
```

**Solutions**:

1. **Find and kill process using port**:
```bash
# Find process using port 3001
lsof -i :3001
netstat -tulpn | grep :3001

# Kill process
sudo kill -9 <PID>
```

2. **Use different port**:
```bash
# Set environment variable
export PORT=3002
npm start

# Or modify package.json
"start": "node index.js --port 3002"
```

3. **Check for multiple instances**:
```bash
# List all node processes
ps aux | grep node

# Kill all node processes
pkill -f node
```

## Excel Parsing Problems

### File Format Issues

**Problem**: Excel file upload fails or parsing returns empty results.

**Symptoms**:
- "Excel parsing failed" error
- Empty course or schedule data
- File upload rejected

**Debugging Steps**:

1. **Check file format**:
```javascript
// Verify file extension and MIME type
console.log('File:', req.file);
console.log('MIME type:', req.file.mimetype);
console.log('Extension:', path.extname(req.file.originalname));
```

2. **Inspect Excel structure**:
```javascript
// Add debug logging to ExcelParserService
const XLSX = require('xlsx');
const workbook = XLSX.readFile(filePath);

console.log('Sheet names:', workbook.SheetNames);
workbook.SheetNames.forEach(name => {
  const sheet = workbook.Sheets[name];
  console.log(`Sheet ${name} range:`, sheet['!ref']);
});
```

3. **Validate cell content**:
```javascript
// In parseCellContent method
parseCellContent(cellValue) {
  console.log('Parsing cell:', cellValue);
  
  if (!cellValue || typeof cellValue !== 'string') {
    console.log('Invalid cell value type');
    return null;
  }
  
  const lines = cellValue.toString().split('\n');
  console.log('Cell lines:', lines);
  
  // ... rest of parsing logic
}
```

**Common Solutions**:

1. **Ensure proper Excel format**:
   - Use .xlsx format (not .xls)
   - Verify sheet names match expected values
   - Check for merged cells that might affect parsing

2. **Fix cell content format**:
   - Ensure course cells follow format: "EEC 10105\nArabic Name\nHall - Professor"
   - Remove extra spaces or special characters
   - Verify line breaks are actual \n characters

3. **Update file size limits**:
```javascript
// In middleware/fileUpload.js
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024 // Increase to 50MB
  }
});
```

### Encoding Issues

**Problem**: Arabic text appears as question marks or garbled characters.

**Solutions**:

1. **Set proper encoding**:
```javascript
// In ExcelParserService
const XLSX = require('xlsx');
const workbook = XLSX.readFile(filePath, { 
  cellText: true,
  encoding: 'utf8'
});
```

2. **Handle Unicode properly**:
```javascript
// Ensure proper Unicode handling
const sanitizeText = (text) => {
  if (!text) return '';
  return text.toString().trim().normalize('NFC');
};
```

3. **Database encoding** (if using database):
```javascript
// MongoDB
const mongoose = require('mongoose');
mongoose.connect(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  // Ensure UTF-8 encoding
  writeConcern: { w: 'majority' }
});
```

## Schedule Generation Issues

### Course Parsing Problems

**Problem**: Course selection parsing fails or produces incorrect results.

**Symptoms**:
- Courses not recognized
- Groups not parsed correctly
- Shared groups not handled properly

**Debugging**:

1. **Add logging to parseUserCourseSelection**:
```javascript
parseUserCourseSelection(courseInput, courseGroups = []) {
  console.log('Input courses:', courseInput);
  console.log('Available course groups:', courseGroups);
  
  const selectedCourses = [];
  
  for (const course of courseInput) {
    console.log('Parsing course:', course);
    const parsed = this.parseSingleCourse(course.trim());
    console.log('Parsed result:', parsed);
    
    // ... rest of logic
  }
  
  console.log('Final selected courses:', selectedCourses);
  return selectedCourses;
}
```

2. **Test regex patterns**:
```javascript
// Test course parsing regex
const testCourses = [
  'EEC 101',
  'EEC 10105',
  'EEC 10105,06',
  'INVALID COURSE'
];

testCourses.forEach(course => {
  const match = course.match(/^([A-Z]+\s+\d+)(\d{2}(?:,\d{2})*)?$/);
  console.log(`${course} -> `, match);
});
```

**Solutions**:

1. **Fix course code format**:
```javascript
// Improve course code sanitization
sanitizeCourseCode(code) {
  if (!code) return '';
  
  return code.toString()
    .trim()
    .toUpperCase()
    .replace(/([A-Z]+)(\d+)/, '$1 $2')  // Add space between letters and numbers
    .replace(/\s+/g, ' ');  // Normalize whitespace
}
```

2. **Handle edge cases**:
```javascript
parseSingleCourse(courseString) {
  // Handle various input formats
  const normalized = courseString.trim().toUpperCase();
  
  // Pattern for: EEC 101, EEC101, EEC 10105, EEC 10105,06
  const patterns = [
    /^([A-Z]+\s*\d+)(\d{2}(?:,\d{2})*)?$/,  // Main pattern
    /^([A-Z]+)\s*(\d+)(\d{2}(?:,\d{2})*)?$/  // Alternative pattern
  ];
  
  for (const pattern of patterns) {
    const match = normalized.match(pattern);
    if (match) {
      // Handle match...
      break;
    }
  }
  
  // Return default if no match
  return { code: courseString, groups: [] };
}
```

### Span Validation Failures

**Problem**: Course span validation returns incorrect results.

**Debugging**:

1. **Check span calculation**:
```javascript
calculateActualSpan(courseCode) {
  const courseSlots = this.scheduleData.filter(slot => {
    console.log(`Checking slot for ${courseCode}:`, slot);
    return slot.course_code === courseCode;
  });
  
  console.log(`Found ${courseSlots.length} slots for ${courseCode}`);
  return courseSlots.length;
}
```

2. **Verify required spans**:
```javascript
const requiredSpans = {
  'EEC 101': 3, 'EEC 113': 3, 'EEC 121': 5,
  'EEC 125': 5, 'EEC 142': 6, 'EEC 212': 5, 'EEC 284': 4
};

// Add debug logging
Object.keys(requiredSpans).forEach(course => {
  const actual = this.calculateActualSpan(course);
  const expected = requiredSpans[course];
  console.log(`${course}: expected ${expected}, actual ${actual}`);
});
```

**Solutions**:

1. **Fix span calculation logic**:
```javascript
calculateActualSpan(courseCode) {
  // Count unique time slots (not duplicate entries)
  const uniqueSlots = new Set();
  
  this.scheduleData.forEach(slot => {
    if (slot.course_code === courseCode) {
      uniqueSlots.add(`${slot.day}-${slot.slot}`);
    }
  });
  
  return uniqueSlots.size;
}
```

2. **Handle group-specific spans**:
```javascript
calculateActualSpan(courseCode, group = null) {
  const courseSlots = this.scheduleData.filter(slot => 
    slot.course_code === courseCode && 
    (group === null || slot.group === group || slot.group === '')
  );
  
  return courseSlots.length;
}
```

### Conflict Detection Issues

**Problem**: Schedule conflicts not detected or false positives.

**Debugging**:

1. **Add detailed conflict logging**:
```javascript
validateNoConflicts(weeklyTable) {
  const conflicts = [];
  
  for (const day of this.days) {
    for (let slot = 0; slot < this.timeSlots; slot++) {
      const courses = this.getCoursesAtSlot(weeklyTable, day, slot);
      console.log(`${day} slot ${slot}:`, courses);
      
      if (courses.length > 1) {
        console.log('Conflict detected:', courses);
        conflicts.push({
          day,
          slot,
          time: this.getTimeSlotString(slot),
          courses: courses.map(c => `${c.code} ${c.group}`)
        });
      }
    }
  }
  
  console.log('Total conflicts:', conflicts.length);
  return conflicts;
}
```

**Solution**:

1. **Fix loop bounds**:
```javascript
// Correct: use this.timeSlots (8) not this.timeSlots.length
for (let slot = 0; slot < this.timeSlots; slot++) {
  // ... conflict checking logic
}
```

2. **Improve course detection**:
```javascript
getCoursesAtSlot(weeklyTable, day, slot) {
  const courses = [];
  const cell = weeklyTable[day] && weeklyTable[day][slot];
  
  if (cell && cell.code) {
    courses.push(cell);
  }
  
  return courses;
}
```

## Export Functionality Problems

### PDF Generation Issues

**Problem**: PDF export fails or produces corrupted files.

**Symptoms**:
- "PDF export failed" error
- Empty or corrupted PDF files
- Puppeteer launch failures

**Solutions**:

1. **Fix Puppeteer installation**:
```bash
# Reinstall puppeteer with chromium
npm uninstall puppeteer
npm install puppeteer

# Or install dependencies manually
sudo apt-get update
sudo apt-get install -y libgtk-3-0 libgbm-dev libxss1 libasound2
```

2. **Handle Puppeteer in Docker/headless environments**:
```javascript
const browser = await puppeteer.launch({
  headless: true,
  args: [
    '--no-sandbox',
    '--disable-setuid-sandbox',
    '--disable-dev-shm-usage',
    '--disable-gpu'
  ]
});
```

3. **Add error handling**:
```javascript
async exportToPDF(schedule, options = {}) {
  let browser;
  try {
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
    
    const pdf = await page.pdf({
      path: filepath,
      format: 'A4',
      landscape: true,
      printBackground: true
    });
    
    return { filepath, filename, format: 'pdf' };
  } catch (error) {
    console.error('PDF generation error:', error);
    throw new Error(`PDF export failed: ${error.message}`);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}
```

### Excel Export Issues

**Problem**: Excel export fails or produces invalid files.

**Solutions**:

1. **Handle large datasets**:
```javascript
prepareExcelData(schedule) {
  try {
    const data = [];
    // ... prepare data
    
    // Validate data size
    if (data.length > 10000) {
      console.warn('Large dataset detected, may cause performance issues');
    }
    
    return data;
  } catch (error) {
    console.error('Excel data preparation failed:', error);
    throw error;
  }
}
```

2. **Fix cell formatting**:
```javascript
applyExcelStyling(worksheet, schedule) {
  if (!worksheet['!cols']) {
    worksheet['!cols'] = [];
  }
  
  // Set column widths
  worksheet['!cols'][0] = { wch: 15 }; // Time column
  for (let i = 1; i <= 7; i++) {
    worksheet['!cols'][i] = { wch: 20 }; // Day columns
  }
  
  // Apply cell formatting
  Object.keys(worksheet).forEach(cellAddress => {
    if (cellAddress[0] === '!') return;
    
    const cell = worksheet[cellAddress];
    if (cell && cell.v) {
      cell.s = {
        alignment: { wrapText: true, vertical: 'top' },
        font: { name: 'Arial', sz: 10 }
      };
    }
  });
}
```

### File Cleanup Issues

**Problem**: Temporary files not cleaned up properly.

**Solution**:

1. **Implement proper cleanup**:
```javascript
// In ExportService
async cleanupTempFiles(maxAge = 3600000) { // 1 hour
  const now = Date.now();
  
  try {
    const files = await fs.readdir(this.tempDir);
    
    for (const file of files) {
      const filepath = path.join(this.tempDir, file);
      const stats = await fs.stat(filepath);
      
      if (now - stats.mtime.getTime() > maxAge) {
        await fs.unlink(filepath);
        console.log('Cleaned up old file:', file);
      }
    }
  } catch (error) {
    console.error('Cleanup error:', error);
  }
}

// Schedule cleanup
setInterval(() => {
  this.cleanupTempFiles();
}, 300000); // Every 5 minutes
```

## Frontend Component Issues

### Component Rendering Problems

**Problem**: React components not rendering or showing errors.

**Debugging**:

1. **Check console errors**:
```javascript
// Add error boundaries
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Component error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary">
          <h2>Something went wrong</h2>
          <details>
            {this.state.error && this.state.error.toString()}
          </details>
        </div>
      );
    }

    return this.props.children;
  }
}
```

2. **Add component debugging**:
```javascript
function PersonalizedScheduleGenerator() {
  console.log('PersonalizedScheduleGenerator rendering');
  
  const [selectedCourses, setSelectedCourses] = useState([]);
  
  useEffect(() => {
    console.log('Selected courses changed:', selectedCourses);
  }, [selectedCourses]);
  
  // ... rest of component
}
```

**Solutions**:

1. **Fix state management**:
```javascript
// Ensure proper state updates
const handleCourseSelection = useCallback((courses) => {
  console.log('Updating courses:', courses);
  setSelectedCourses(prev => {
    console.log('Previous courses:', prev);
    return courses;
  });
}, []);
```

2. **Handle async operations properly**:
```javascript
const generateSchedule = useCallback(async () => {
  if (!selectedCourses.length) {
    setErrors(['Please select at least one course']);
    return;
  }
  
  setIsLoading(true);
  setErrors([]);
  
  try {
    const response = await api.generateSchedule({
      courses: selectedCourses,
      validation: { strict_span_validation: true }
    });
    
    setGeneratedSchedule(response.weeklyTable);
    setValidationResults(response.validation);
  } catch (error) {
    console.error('Generation error:', error);
    setErrors([error.message || 'Schedule generation failed']);
  } finally {
    setIsLoading(false);
  }
}, [selectedCourses]);
```

### State Synchronization Issues

**Problem**: Component state out of sync with API data.

**Solutions**:

1. **Use proper dependency arrays**:
```javascript
// Correct dependency management
useEffect(() => {
  if (courseData) {
    setCourseOptions(courseData.courses);
  }
}, [courseData]); // Include courseData as dependency
```

2. **Implement data validation**:
```javascript
const validateScheduleData = (data) => {
  if (!data || typeof data !== 'object') {
    throw new Error('Invalid schedule data format');
  }
  
  const requiredDays = ['Saturday', 'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
  
  for (const day of requiredDays) {
    if (!Array.isArray(data[day]) || data[day].length !== 8) {
      throw new Error(`Invalid schedule format for ${day}`);
    }
  }
  
  return true;
};
```

## API Communication Problems

### CORS Issues

**Problem**: Frontend cannot communicate with backend due to CORS errors.

**Symptoms**:
```
Access to fetch at 'http://localhost:3001/api/...' from origin 'http://localhost:3000' has been blocked by CORS policy
```

**Solutions**:

1. **Configure CORS properly**:
```javascript
// In server/index.js
const cors = require('cors');

app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    process.env.CLIENT_URL
  ].filter(Boolean),
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
```

2. **Handle preflight requests**:
```javascript
app.options('*', cors()); // Enable preflight for all routes
```

### Network Timeout Issues

**Problem**: API requests timeout or fail intermittently.

**Solutions**:

1. **Add request timeouts**:
```javascript
// In api.js
const apiClient = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:3001/api',
  timeout: 30000, // 30 seconds
  withCredentials: true
});

// Add retry logic
apiClient.interceptors.response.use(
  response => response,
  async error => {
    const { config } = error;
    
    if (!config._retry && error.code === 'ECONNABORTED') {
      config._retry = true;
      console.log('Retrying request:', config.url);
      return apiClient.request(config);
    }
    
    return Promise.reject(error);
  }
);
```

2. **Handle large file uploads**:
```javascript
export const uploadExcel = async (formData, onProgress) => {
  try {
    const response = await apiClient.post('/excel/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 60000, // 1 minute for uploads
      onUploadProgress: onProgress
    });
    
    return response.data;
  } catch (error) {
    if (error.code === 'ECONNABORTED') {
      throw new Error('Upload timeout - file may be too large');
    }
    throw error;
  }
};
```

### Session Management Issues

**Problem**: Session data lost or not persisting between requests.

**Solutions**:

1. **Configure session properly**:
```javascript
// In server/index.js
app.use(session({
  secret: process.env.SESSION_SECRET || 'hti-scheduler-secret-key',
  resave: false,
  saveUninitialized: false,
  rolling: true, // Reset expiry on activity
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    sameSite: 'lax'
  },
  store: new MongoStore({ // If using MongoDB
    url: process.env.MONGODB_URI,
    touchAfter: 24 * 3600 // Lazy session update
  })
}));
```

2. **Add session debugging**:
```javascript
app.use((req, res, next) => {
  console.log('Session ID:', req.sessionID);
  console.log('Session data:', req.session);
  next();
});
```

## Performance Issues

### Slow Excel Parsing

**Problem**: Large Excel files take too long to parse.

**Solutions**:

1. **Stream processing for large files**:
```javascript
const stream = require('stream');
const { pipeline } = require('stream/promises');

async parseExcelStream(filePath) {
  const workbook = XLSX.readFile(filePath, { 
    sheetStubs: true,
    cellDates: true
  });
  
  // Process sheets incrementally
  const results = {};
  
  for (const sheetName of workbook.SheetNames) {
    console.log(`Processing sheet: ${sheetName}`);
    results[sheetName] = await this.processSheetInChunks(workbook.Sheets[sheetName]);
  }
  
  return results;
}
```

2. **Add progress tracking**:
```javascript
async parseExcelFile(filePath, onProgress) {
  const steps = ['reading', 'parsing_courses', 'parsing_schedule', 'validation'];
  let currentStep = 0;
  
  const updateProgress = () => {
    currentStep++;
    if (onProgress) {
      onProgress((currentStep / steps.length) * 100);
    }
  };
  
  updateProgress(); // Reading
  this.workbook = XLSX.readFile(filePath);
  
  updateProgress(); // Parsing courses
  await this.parseCourseSheet();
  
  updateProgress(); // Parsing schedule
  await this.parseScheduleSheet();
  
  updateProgress(); // Validation
  this.validateCourseData();
  
  return { courses: this.courseData, schedule: this.scheduleData };
}
```

### Memory Issues

**Problem**: Application runs out of memory with large datasets.

**Solutions**:

1. **Implement data pagination**:
```javascript
// Paginate large course lists
const paginateCourses = (courses, page = 1, limit = 100) => {
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;
  
  return {
    courses: courses.slice(startIndex, endIndex),
    pagination: {
      page,
      limit,
      total: courses.length,
      totalPages: Math.ceil(courses.length / limit)
    }
  };
};
```

2. **Clean up large objects**:
```javascript
// Clear workbook after parsing
async parseExcelFile(filePath) {
  try {
    this.workbook = XLSX.readFile(filePath);
    const result = await this.extractData();
    
    // Clean up memory
    this.workbook = null;
    
    return result;
  } catch (error) {
    this.workbook = null; // Clean up on error too
    throw error;
  }
}
```

## GitHub Copilot Configuration Issues

### Remote Indexing Not Working

**Problem**: GitHub Copilot not using remote repository context.

**Solutions**:

1. **Verify authentication**:
```bash
# Check GitHub CLI authentication
gh auth status

# Re-authenticate if needed
gh auth refresh --scopes repo
```

2. **Update VS Code settings**:
```json
{
  "github.copilot.preferences.remoteIndexing": true,
  "github.copilot.preferences.codebaseIndexing": "enabled",
  "github.copilot.preferences.includeCodebaseContext": true,
  "github.copilot.advanced": {
    "experimentalIndexing": true,
    "contextualSuggestions": true
  }
}
```

3. **Check repository access**:
```bash
# Verify repository is public or you have access
gh repo view Sudo-Omar-Khalaf/HTI-Scheduler-2
```

### Copilot Suggestions Not Relevant

**Problem**: Copilot provides generic suggestions instead of project-specific ones.

**Solutions**:

1. **Improve project context files**:
```markdown
<!-- .copilot-config.md -->
# HTI Scheduler Project Context

This is a schedule generation system for students with:
- Excel parsing for course data
- Personalized weekly schedule generation
- Span validation (EEC 101: 3 slots, EEC 142: 6 slots)
- Group handling (e.g., "EEC 10105,06" for shared lectures)
- Export functionality (PDF, Excel, JSON)

Key technologies: Node.js, React, XLSX, Puppeteer
```

2. **Add .github/copilot.yml**:
```yaml
# What this project does
purpose: Student schedule generation system for HTI university

# Technical context
technologies:
  - Node.js
  - React
  - Excel parsing
  - Schedule optimization

# Key concepts
concepts:
  - Course parsing with groups
  - Time slot validation
  - Conflict detection
  - Export formats
```

## Development Environment Problems

### Hot Reload Not Working

**Problem**: Changes not reflected automatically during development.

**Solutions**:

1. **Check file watching limits**:
```bash
# Increase file watch limit
echo fs.inotify.max_user_watches=524288 | sudo tee -a /etc/sysctl.conf
sudo sysctl -p
```

2. **Fix webpack configuration**:
```javascript
// In webpack.config.js or package.json
module.exports = {
  devServer: {
    watchFiles: ['src/**/*'],
    hot: true,
    liveReload: true
  }
};
```

3. **Check polling options**:
```json
{
  "scripts": {
    "start": "WATCHPACK_POLLING=true react-scripts start"
  }
}
```

### Path Resolution Issues

**Problem**: Module imports fail in development or production.

**Solutions**:

1. **Configure path aliases**:
```javascript
// In jsconfig.json (for React)
{
  "compilerOptions": {
    "baseUrl": "src",
    "paths": {
      "@components/*": ["components/*"],
      "@services/*": ["services/*"],
      "@utils/*": ["utils/*"]
    }
  }
}
```

2. **Fix relative imports**:
```javascript
// Instead of: import api from '../../../services/api'
// Use: import api from '@services/api'
```

## Common Error Messages

### "Schedule generation failed: Invalid course spans"

**Cause**: Course span validation detected mismatches.

**Solution**:
1. Check actual vs expected spans in schedule data
2. Verify course parsing correctly extracts all time slots
3. Update required spans if they changed:

```javascript
const requiredSpans = {
  'EEC 101': 3, // Update if changed
  'EEC 113': 3,
  'EEC 121': 5,
  'EEC 125': 5,
  'EEC 142': 6,
  'EEC 212': 5,
  'EEC 284': 4
};
```

### "Excel parsing failed: Cannot read property"

**Cause**: Excel file structure doesn't match expected format.

**Solution**:
1. Verify Excel file has correct sheet names
2. Check cell content format
3. Add defensive programming:

```javascript
const cell = sheet[cellRef];
if (cell && cell.v) {
  const content = cell.v.toString();
  // Process content safely
}
```

### "TypeError: Cannot read property 'length' of undefined"

**Cause**: Array or object is undefined when accessed.

**Solution**:
1. Add null checks:
```javascript
if (this.courseData && this.courseData.length > 0) {
  // Process course data
}
```

2. Use optional chaining:
```javascript
const courseCount = this.courseData?.length || 0;
```

### "Export failed: PDF generation timeout"

**Cause**: Puppeteer timeout during PDF generation.

**Solution**:
1. Increase timeout:
```javascript
await page.pdf({
  path: filepath,
  format: 'A4',
  timeout: 60000 // 1 minute
});
```

2. Optimize HTML content:
```javascript
// Remove large images or complex CSS
const optimizedHtml = htmlContent
  .replace(/<img[^>]*>/g, '') // Remove images
  .replace(/style="[^"]*"/g, ''); // Simplify styles
```

## Logging and Debugging

### Enable Debug Logging

1. **Backend debugging**:
```bash
# Set debug environment variable
DEBUG=hti-scheduler:* npm start

# Or in code
const debug = require('debug')('hti-scheduler:service');
debug('Processing course:', courseCode);
```

2. **Frontend debugging**:
```javascript
// Add to .env.local
REACT_APP_DEBUG=true

// In components
if (process.env.REACT_APP_DEBUG) {
  console.log('Debug info:', data);
}
```

### Health Check Endpoint

Add comprehensive health checks:

```javascript
// In server/index.js
app.get('/api/health', (req, res) => {
  const health = {
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    version: process.version,
    environment: process.env.NODE_ENV,
    services: {
      database: 'OK', // Check database connection
      filesystem: 'OK', // Check file system access
      excel_parser: 'OK' // Check Excel parsing capability
    }
  };
  
  res.json(health);
});
```

This troubleshooting guide covers the most common issues you may encounter while working with the HTI Scheduler application. Keep this reference handy during development and deployment.
