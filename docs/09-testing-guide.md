# Testing Guide

## Overview

This guide provides comprehensive testing procedures for the HTI Scheduler application, covering unit tests, integration tests, end-to-end tests, and manual testing procedures.

## Testing Strategy

### Testing Pyramid

```
                    E2E Tests
                 ┌─────────────┐
                 │   Browser   │
                 │ Integration │
                 └─────────────┘
              ┌───────────────────┐
              │  Integration      │
              │  API Testing      │
              └───────────────────┘
          ┌─────────────────────────┐
          │     Unit Tests          │
          │  Services & Components  │
          └─────────────────────────┘
```

## Test Environment Setup

### Prerequisites

```bash
# Install testing dependencies
cd /home/khalaf/Downloads/HTI-scheduler-2

# Backend testing
cd server
npm install --save-dev jest supertest nodemon
npm install --save-dev @babel/preset-env

# Frontend testing
cd ../client
npm install --save-dev @testing-library/react @testing-library/jest-dom
npm install --save-dev @testing-library/user-event jest-environment-jsdom
```

### Jest Configuration

#### Backend (server/jest.config.js)

```javascript
module.exports = {
  testEnvironment: 'node',
  roots: ['<rootDir>/src', '<rootDir>/tests'],
  testMatch: [
    '**/__tests__/**/*.js',
    '**/?(*.)+(spec|test).js'
  ],
  collectCoverageFrom: [
    'services/**/*.js',
    'routes/**/*.js',
    '!**/node_modules/**'
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
  verbose: true,
  transform: {
    '^.+\\.js$': 'babel-jest'
  }
};
```

#### Frontend (client/jest.config.js)

```javascript
module.exports = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/src/setupTests.js'],
  moduleNameMapping: {
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy'
  },
  collectCoverageFrom: [
    'src/**/*.{js,jsx}',
    '!src/index.js',
    '!src/reportWebVitals.js'
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  }
};
```

## Unit Tests

### Backend Service Tests

#### ExcelParserService Tests

```javascript
// tests/services/ExcelParserService.test.js
const ExcelParserService = require('../../services/ExcelParserServiceFinal');
const path = require('path');
const fs = require('fs');

describe('ExcelParserService', () => {
  let parser;
  let mockExcelPath;

  beforeEach(() => {
    parser = new ExcelParserService();
    mockExcelPath = path.join(__dirname, '../fixtures/sample-schedule.xlsx');
  });

  describe('parseExcelFile', () => {
    test('should parse valid Excel file successfully', async () => {
      const result = await parser.parseExcelFile(mockExcelPath);
      
      expect(result).toHaveProperty('courses');
      expect(result).toHaveProperty('schedule');
      expect(result).toHaveProperty('metadata');
      expect(Array.isArray(result.courses)).toBe(true);
      expect(Array.isArray(result.schedule)).toBe(true);
    });

    test('should throw error for invalid file path', async () => {
      await expect(parser.parseExcelFile('invalid-path.xlsx'))
        .rejects
        .toThrow('Excel parsing failed');
    });

    test('should validate course data structure', async () => {
      const result = await parser.parseExcelFile(mockExcelPath);
      
      if (result.courses.length > 0) {
        const course = result.courses[0];
        expect(course).toHaveProperty('code');
        expect(course).toHaveProperty('arabic_name');
        expect(course).toHaveProperty('span');
        expect(typeof course.span).toBe('number');
      }
    });
  });

  describe('parseCellContent', () => {
    test('should parse cell content correctly', () => {
      const cellValue = 'EEC 10105\nCircuits Analysis\nLab A - Dr. Ahmed';
      const result = parser.parseCellContent(cellValue);
      
      expect(result).toEqual({
        course_code: 'EEC 101',
        group: '05',
        arabic_name: 'Circuits Analysis',
        hall: 'Lab A',
        professor: 'Dr. Ahmed',
        raw_content: cellValue
      });
    });

    test('should handle invalid cell content', () => {
      const result = parser.parseCellContent('Invalid Content');
      expect(result).toBeNull();
    });

    test('should handle course without group', () => {
      const cellValue = 'EEC 101\nCircuits Analysis\nLecture Hall - Dr. Ahmed';
      const result = parser.parseCellContent(cellValue);
      
      expect(result.course_code).toBe('EEC 101');
      expect(result.group).toBe('');
    });
  });

  describe('sanitizeCourseCode', () => {
    test('should format course codes correctly', () => {
      expect(parser.sanitizeCourseCode('EEC101')).toBe('EEC 101');
      expect(parser.sanitizeCourseCode('eec 101')).toBe('EEC 101');
      expect(parser.sanitizeCourseCode('EEC 101')).toBe('EEC 101');
    });

    test('should handle empty or invalid input', () => {
      expect(parser.sanitizeCourseCode('')).toBe('');
      expect(parser.sanitizeCourseCode(null)).toBe('');
      expect(parser.sanitizeCourseCode(undefined)).toBe('');
    });
  });
});
```

#### ScheduleGeneratorService Tests

```javascript
// tests/services/ScheduleGeneratorService.test.js
const ScheduleGeneratorService = require('../../services/ScheduleGeneratorService');

describe('ScheduleGeneratorService', () => {
  let generator;
  let mockCourseData;
  let mockScheduleData;

  beforeEach(() => {
    generator = new ScheduleGeneratorService();
    
    mockCourseData = [
      { code: 'EEC 101', arabic_name: 'Circuits Analysis', span: 3 },
      { code: 'EEC 113', arabic_name: 'Digital Logic', span: 3 },
      { code: 'EEC 121', arabic_name: 'Electronics', span: 5 }
    ];

    mockScheduleData = [
      {
        course_code: 'EEC 101',
        group: '05',
        day: 'Saturday',
        slot: 0,
        time: '8:00-8:45',
        arabic_name: 'Circuits Analysis',
        hall: 'Lab A',
        professor: 'Dr. Ahmed'
      },
      {
        course_code: 'EEC 101',
        group: '05',
        day: 'Saturday',
        slot: 1,
        time: '8:45-9:30',
        arabic_name: 'Circuits Analysis',
        hall: 'Lab A',
        professor: 'Dr. Ahmed'
      }
    ];

    generator.courseData = mockCourseData;
    generator.scheduleData = mockScheduleData;
  });

  describe('parseUserCourseSelection', () => {
    test('should parse simple course codes', () => {
      const input = ['EEC 101', 'EEC 113'];
      const result = generator.parseUserCourseSelection(input, mockCourseData);
      
      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        code: 'EEC 101',
        groups: expect.any(Array)
      });
    });

    test('should parse course with specific group', () => {
      const input = ['EEC 10105'];
      const result = generator.parseUserCourseSelection(input, mockCourseData);
      
      expect(result[0]).toEqual({
        code: 'EEC 101',
        groups: ['05']
      });
    });

    test('should parse shared groups', () => {
      const input = ['EEC 10105,06'];
      const result = generator.parseUserCourseSelection(input, mockCourseData);
      
      expect(result[0]).toEqual({
        code: 'EEC 101',
        groups: ['05', '06'],
        shared_lecture: true
      });
    });
  });

  describe('validateCourseSpans', () => {
    test('should validate correct spans', () => {
      const courses = [
        { code: 'EEC 101', groups: ['05'] },
        { code: 'EEC 113', groups: ['02'] }
      ];
      
      const result = generator.validateCourseSpans(courses);
      
      expect(result.valid).toBe(true);
      expect(result.span_details).toHaveLength(2);
    });

    test('should detect span mismatches', () => {
      // Mock incorrect span calculation
      jest.spyOn(generator, 'calculateActualSpan').mockReturnValue(2);
      
      const courses = [{ code: 'EEC 101', groups: ['05'] }];
      const result = generator.validateCourseSpans(courses, { strict_span_validation: true });
      
      expect(result.valid).toBe(false);
      expect(result.mismatch_details).toHaveLength(1);
      expect(result.mismatch_details[0]).toEqual({
        course: 'EEC 101',
        expected: 3,
        actual: 2,
        valid: false
      });
    });
  });

  describe('buildWeeklyTable', () => {
    test('should create correct table structure', () => {
      const courses = [{ code: 'EEC 101', groups: ['05'] }];
      const result = generator.buildWeeklyTable(courses);
      
      expect(result).toHaveProperty('Saturday');
      expect(result).toHaveProperty('Sunday');
      expect(result).toHaveProperty('Monday');
      expect(result).toHaveProperty('Tuesday');
      expect(result).toHaveProperty('Wednesday');
      expect(result).toHaveProperty('Thursday');
      expect(result).toHaveProperty('Friday');
      
      // Each day should have 8 time slots
      Object.values(result).forEach(day => {
        expect(day).toHaveLength(8);
      });
    });

    test('should place courses in correct slots', () => {
      const courses = [{ code: 'EEC 101', groups: ['05'] }];
      const result = generator.buildWeeklyTable(courses);
      
      // Saturday slot 0 should have the course
      expect(result.Saturday[0]).toEqual({
        code: 'EEC 101',
        group: '05',
        arabic_name: 'Circuits Analysis',
        hall: 'Lab A',
        professor: 'Dr. Ahmed',
        time: '8:00-8:45'
      });
    });
  });

  describe('validateNoConflicts', () => {
    test('should detect no conflicts in valid schedule', () => {
      const courses = [{ code: 'EEC 101', groups: ['05'] }];
      const weeklyTable = generator.buildWeeklyTable(courses);
      const conflicts = generator.validateNoConflicts(weeklyTable);
      
      expect(conflicts).toHaveLength(0);
    });

    test('should detect time conflicts', () => {
      // Create conflicting schedule data
      const conflictingData = [
        ...mockScheduleData,
        {
          course_code: 'EEC 113',
          group: '02',
          day: 'Saturday',
          slot: 0,
          time: '8:00-8:45',
          arabic_name: 'Digital Logic',
          hall: 'Lab B',
          professor: 'Dr. Omar'
        }
      ];
      
      generator.scheduleData = conflictingData;
      
      const courses = [
        { code: 'EEC 101', groups: ['05'] },
        { code: 'EEC 113', groups: ['02'] }
      ];
      
      const weeklyTable = generator.buildWeeklyTable(courses);
      const conflicts = generator.validateNoConflicts(weeklyTable);
      
      expect(conflicts.length).toBeGreaterThan(0);
      expect(conflicts[0]).toHaveProperty('day');
      expect(conflicts[0]).toHaveProperty('slot');
      expect(conflicts[0]).toHaveProperty('courses');
    });
  });
});
```

#### ExportService Tests

```javascript
// tests/services/ExportService.test.js
const ExportService = require('../../services/ExportService');
const fs = require('fs');
const path = require('path');

describe('ExportService', () => {
  let exportService;
  let mockSchedule;

  beforeEach(() => {
    exportService = new ExportService();
    
    mockSchedule = {
      Saturday: [
        {
          code: 'EEC 101',
          group: '05',
          arabic_name: 'Circuits Analysis',
          hall: 'Lab A',
          professor: 'Dr. Ahmed',
          time: '8:00-8:45'
        },
        null, null, null, null, null, null, null
      ],
      Sunday: new Array(8).fill(null),
      Monday: new Array(8).fill(null),
      Tuesday: new Array(8).fill(null),
      Wednesday: new Array(8).fill(null),
      Thursday: new Array(8).fill(null),
      Friday: new Array(8).fill(null)
    };
  });

  afterEach(() => {
    // Clean up test files
    const testFiles = fs.readdirSync(exportService.tempDir)
      .filter(file => file.startsWith('test-'));
    
    testFiles.forEach(file => {
      try {
        fs.unlinkSync(path.join(exportService.tempDir, file));
      } catch (error) {
        // Ignore cleanup errors
      }
    });
  });

  describe('exportToJSON', () => {
    test('should export schedule to JSON format', async () => {
      const result = await exportService.exportToJSON(mockSchedule, {
        filename: 'test-schedule.json'
      });
      
      expect(result).toHaveProperty('filepath');
      expect(result).toHaveProperty('filename');
      expect(result.format).toBe('json');
      expect(fs.existsSync(result.filepath)).toBe(true);
      
      // Verify content
      const content = JSON.parse(fs.readFileSync(result.filepath, 'utf8'));
      expect(content).toHaveProperty('metadata');
      expect(content).toHaveProperty('schedule');
      expect(content.schedule).toEqual(mockSchedule);
    });
  });

  describe('generateHTMLTable', () => {
    test('should generate valid HTML table', () => {
      const html = exportService.generateHTMLTable(mockSchedule);
      
      expect(html).toContain('<!DOCTYPE html>');
      expect(html).toContain('<table class="schedule-table">');
      expect(html).toContain('EEC 101');
      expect(html).toContain('Circuits Analysis');
      expect(html).toContain('Dr. Ahmed');
    });

    test('should handle empty schedule', () => {
      const emptySchedule = {
        Saturday: new Array(8).fill(null),
        Sunday: new Array(8).fill(null),
        Monday: new Array(8).fill(null),
        Tuesday: new Array(8).fill(null),
        Wednesday: new Array(8).fill(null),
        Thursday: new Array(8).fill(null),
        Friday: new Array(8).fill(null)
      };
      
      const html = exportService.generateHTMLTable(emptySchedule);
      expect(html).toContain('<td class="empty-cell">-</td>');
    });
  });

  describe('prepareExcelData', () => {
    test('should prepare data for Excel export', () => {
      const data = exportService.prepareExcelData(mockSchedule);
      
      expect(data).toHaveLength(9); // 1 header + 8 time slots
      expect(data[0]).toEqual(['Time', 'Saturday', 'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']);
      
      // First data row should contain the course
      expect(data[1][0]).toBe('8:00-8:45');
      expect(data[1][1]).toContain('EEC 101 05');
      expect(data[1][1]).toContain('Circuits Analysis');
      expect(data[1][1]).toContain('Lab A - Dr. Ahmed');
    });
  });
});
```

### Frontend Component Tests

#### PersonalizedScheduleGenerator Tests

```javascript
// client/src/components/__tests__/PersonalizedScheduleGenerator.test.js
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import PersonalizedScheduleGenerator from '../PersonalizedScheduleGenerator';
import * as api from '../../services/api';

// Mock API
jest.mock('../../services/api');

describe('PersonalizedScheduleGenerator', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders course selection interface', () => {
    render(<PersonalizedScheduleGenerator />);
    
    expect(screen.getByPlaceholderText(/enter course/i)).toBeInTheDocument();
    expect(screen.getByText(/add course/i)).toBeInTheDocument();
    expect(screen.getByText(/generate schedule/i)).toBeInTheDocument();
  });

  test('handles course input and selection', async () => {
    const user = userEvent.setup();
    render(<PersonalizedScheduleGenerator />);
    
    const input = screen.getByPlaceholderText(/enter course/i);
    const addButton = screen.getByText(/add course/i);
    
    await user.type(input, 'EEC 101');
    await user.click(addButton);
    
    expect(screen.getByText('EEC 101')).toBeInTheDocument();
  });

  test('generates schedule successfully', async () => {
    const mockSchedule = {
      Saturday: [{ code: 'EEC 101', group: '05', arabic_name: 'Circuits Analysis' }],
      Sunday: new Array(8).fill(null)
    };
    
    api.generateSchedule.mockResolvedValue({
      weeklyTable: mockSchedule,
      validation: { valid: true }
    });

    const user = userEvent.setup();
    render(<PersonalizedScheduleGenerator />);
    
    // Add course
    const input = screen.getByPlaceholderText(/enter course/i);
    await user.type(input, 'EEC 101');
    await user.click(screen.getByText(/add course/i));
    
    // Generate schedule
    await user.click(screen.getByText(/generate schedule/i));
    
    await waitFor(() => {
      expect(screen.getByText(/weekly schedule/i)).toBeInTheDocument();
    });
    
    expect(api.generateSchedule).toHaveBeenCalledWith({
      courses: ['EEC 101'],
      validation: { strict_span_validation: true }
    });
  });

  test('handles generation errors', async () => {
    api.generateSchedule.mockRejectedValue(new Error('Generation failed'));

    const user = userEvent.setup();
    render(<PersonalizedScheduleGenerator />);
    
    await user.type(screen.getByPlaceholderText(/enter course/i), 'EEC 101');
    await user.click(screen.getByText(/add course/i));
    await user.click(screen.getByText(/generate schedule/i));
    
    await waitFor(() => {
      expect(screen.getByText(/generation failed/i)).toBeInTheDocument();
    });
  });
});
```

#### ScheduleDisplay Tests

```javascript
// client/src/components/__tests__/ScheduleDisplay.test.js
import React from 'react';
import { render, screen } from '@testing-library/react';
import ScheduleDisplay from '../ScheduleDisplay';

describe('ScheduleDisplay', () => {
  const mockSchedule = {
    Saturday: [
      {
        code: 'EEC 101',
        group: '05',
        arabic_name: 'Circuits Analysis',
        hall: 'Lab A',
        professor: 'Dr. Ahmed'
      },
      null, null, null, null, null, null, null
    ],
    Sunday: new Array(8).fill(null),
    Monday: new Array(8).fill(null),
    Tuesday: new Array(8).fill(null),
    Wednesday: new Array(8).fill(null),
    Thursday: new Array(8).fill(null),
    Friday: new Array(8).fill(null)
  };

  const mockValidation = {
    valid: true,
    span_details: [
      { course: 'EEC 101', expected: 3, actual: 3, valid: true }
    ],
    conflicts: []
  };

  test('renders schedule table correctly', () => {
    render(<ScheduleDisplay schedule={mockSchedule} validation={mockValidation} />);
    
    // Check for day headers
    expect(screen.getByText('Saturday')).toBeInTheDocument();
    expect(screen.getByText('Sunday')).toBeInTheDocument();
    
    // Check for time slots
    expect(screen.getByText('8:00-8:45')).toBeInTheDocument();
    
    // Check for course content
    expect(screen.getByText('EEC 101 05')).toBeInTheDocument();
    expect(screen.getByText('Circuits Analysis')).toBeInTheDocument();
    expect(screen.getByText('Lab A - Dr. Ahmed')).toBeInTheDocument();
  });

  test('displays validation summary', () => {
    render(<ScheduleDisplay schedule={mockSchedule} validation={mockValidation} />);
    
    expect(screen.getByText(/schedule valid/i)).toBeInTheDocument();
  });

  test('shows conflicts when present', () => {
    const validationWithConflicts = {
      ...mockValidation,
      valid: false,
      conflicts: [
        {
          day: 'Saturday',
          slot: 0,
          time: '8:00-8:45',
          courses: ['EEC 101 05', 'EEC 113 02']
        }
      ]
    };
    
    render(<ScheduleDisplay schedule={mockSchedule} validation={validationWithConflicts} />);
    
    expect(screen.getByText(/validation issues/i)).toBeInTheDocument();
    expect(screen.getByText(/time conflicts/i)).toBeInTheDocument();
  });

  test('handles empty schedule', () => {
    const emptySchedule = {
      Saturday: new Array(8).fill(null),
      Sunday: new Array(8).fill(null),
      Monday: new Array(8).fill(null),
      Tuesday: new Array(8).fill(null),
      Wednesday: new Array(8).fill(null),
      Thursday: new Array(8).fill(null),
      Friday: new Array(8).fill(null)
    };
    
    render(<ScheduleDisplay schedule={emptySchedule} validation={mockValidation} />);
    
    // Should show empty slots
    const emptySlots = screen.getAllByText('-');
    expect(emptySlots.length).toBeGreaterThan(0);
  });
});
```

## Integration Tests

### API Route Tests

```javascript
// tests/integration/api.test.js
const request = require('supertest');
const app = require('../../index');
const path = require('path');

describe('API Integration Tests', () => {
  let server;

  beforeAll(() => {
    server = app.listen(0); // Random port
  });

  afterAll((done) => {
    server.close(done);
  });

  describe('Excel Upload', () => {
    test('should upload and parse Excel file', async () => {
      const response = await request(app)
        .post('/api/excel/upload')
        .attach('excel', path.join(__dirname, '../fixtures/sample-schedule.xlsx'))
        .expect(200);

      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('courses');
      expect(response.body).toHaveProperty('schedule_entries');
    });

    test('should reject non-Excel files', async () => {
      const response = await request(app)
        .post('/api/excel/upload')
        .attach('excel', path.join(__dirname, '../fixtures/sample.txt'))
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('Schedule Generation', () => {
    beforeEach(async () => {
      // Upload sample Excel file
      await request(app)
        .post('/api/excel/upload')
        .attach('excel', path.join(__dirname, '../fixtures/sample-schedule.xlsx'));
    });

    test('should generate schedule successfully', async () => {
      const response = await request(app)
        .post('/api/schedule/generate')
        .send({
          courses: ['EEC 101', 'EEC 113'],
          validation: { strict_span_validation: true }
        })
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('weeklyTable');
      expect(response.body).toHaveProperty('validation');
      expect(response.body).toHaveProperty('selectedCourses');
    });

    test('should validate course selection', async () => {
      const response = await request(app)
        .post('/api/schedule/validate')
        .send({
          courses: ['EEC 101', 'INVALID COURSE']
        })
        .expect(200);

      expect(response.body).toHaveProperty('validation');
      expect(response.body).toHaveProperty('selectedCourses');
    });

    test('should handle invalid course input', async () => {
      await request(app)
        .post('/api/schedule/generate')
        .send({
          courses: [] // Empty courses array
        })
        .expect(400);
    });
  });

  describe('Export Functionality', () => {
    const mockSchedule = {
      Saturday: [
        {
          code: 'EEC 101',
          group: '05',
          arabic_name: 'Circuits Analysis',
          hall: 'Lab A',
          professor: 'Dr. Ahmed'
        }
      ]
    };

    test('should export schedule to PDF', async () => {
      const response = await request(app)
        .post('/api/export/schedule')
        .send({
          schedule: mockSchedule,
          format: 'pdf',
          filename: 'test-schedule'
        })
        .expect(200);

      expect(response.headers['content-type']).toContain('application/pdf');
    });

    test('should export schedule to JSON', async () => {
      const response = await request(app)
        .post('/api/export/schedule')
        .send({
          schedule: mockSchedule,
          format: 'json'
        })
        .expect(200);

      expect(response.headers['content-type']).toContain('application/json');
    });

    test('should handle invalid export format', async () => {
      await request(app)
        .post('/api/export/schedule')
        .send({
          schedule: mockSchedule,
          format: 'invalid'
        })
        .expect(500);
    });
  });
});
```

## End-to-End Tests

### Cypress Configuration

```javascript
// cypress.config.js
const { defineConfig } = require('cypress');

module.exports = defineConfig({
  e2e: {
    baseUrl: 'http://localhost:3000',
    supportFile: 'cypress/support/e2e.js',
    specPattern: 'cypress/e2e/**/*.cy.{js,jsx,ts,tsx}',
    viewportWidth: 1280,
    viewportHeight: 720,
    video: true,
    screenshotOnRunFailure: true,
    setupNodeEvents(on, config) {
      // implement node event listeners here
    },
  },
});
```

### E2E Test Cases

```javascript
// cypress/e2e/schedule-generation.cy.js
describe('Schedule Generation E2E', () => {
  beforeEach(() => {
    cy.visit('/');
    
    // Upload sample Excel file
    cy.get('[data-testid="excel-upload"]').selectFile('cypress/fixtures/sample-schedule.xlsx');
    cy.wait(2000); // Wait for upload to complete
  });

  it('should generate a complete schedule', () => {
    // Enter courses
    cy.get('[data-testid="course-input"]').type('EEC 101, EEC 113, EEC 121');
    cy.get('[data-testid="add-course"]').click();

    // Verify courses are added
    cy.get('[data-testid="selected-courses"]').should('contain', 'EEC 101');
    cy.get('[data-testid="selected-courses"]').should('contain', 'EEC 113');
    cy.get('[data-testid="selected-courses"]').should('contain', 'EEC 121');

    // Generate schedule
    cy.get('[data-testid="generate-schedule"]').click();

    // Wait for generation
    cy.get('[data-testid="loading-indicator"]').should('be.visible');
    cy.get('[data-testid="loading-indicator"]').should('not.exist');

    // Verify schedule is displayed
    cy.get('[data-testid="weekly-schedule"]').should('be.visible');
    cy.get('[data-testid="schedule-table"]').should('exist');

    // Check for course content in schedule
    cy.get('[data-testid="schedule-table"]').should('contain', 'EEC 101');
    cy.get('[data-testid="schedule-table"]').should('contain', 'EEC 113');
    cy.get('[data-testid="schedule-table"]').should('contain', 'EEC 121');
  });

  it('should handle course parsing with groups', () => {
    // Test various course input formats
    cy.get('[data-testid="course-input"]').type('EEC 10105, EEC 11302, EEC 12106,07');
    cy.get('[data-testid="add-course"]').click();

    cy.get('[data-testid="generate-schedule"]').click();

    // Verify parsing results
    cy.get('[data-testid="weekly-schedule"]').should('be.visible');
    cy.get('[data-testid="schedule-table"]').should('contain', 'EEC 101 05');
    cy.get('[data-testid="schedule-table"]').should('contain', 'EEC 113 02');
    cy.get('[data-testid="schedule-table"]').should('contain', 'EEC 121 06,07');
  });

  it('should validate course spans', () => {
    // Enter courses with known spans
    cy.get('[data-testid="course-input"]').type('EEC 101, EEC 142'); // 3 and 6 spans
    cy.get('[data-testid="add-course"]').click();

    cy.get('[data-testid="generate-schedule"]').click();

    // Check validation results
    cy.get('[data-testid="validation-summary"]').should('be.visible');
    cy.get('[data-testid="span-details"]').should('contain', 'EEC 101: Expected 3');
    cy.get('[data-testid="span-details"]').should('contain', 'EEC 142: Expected 6');
  });

  it('should export schedule to different formats', () => {
    // Generate a schedule first
    cy.get('[data-testid="course-input"]').type('EEC 101, EEC 113');
    cy.get('[data-testid="add-course"]').click();
    cy.get('[data-testid="generate-schedule"]').click();
    cy.get('[data-testid="weekly-schedule"]').should('be.visible');

    // Test PDF export
    cy.get('[data-testid="export-format-pdf"]').check();
    cy.get('[data-testid="export-button"]').click();
    
    // Verify download (note: actual file download testing may require additional setup)
    cy.get('[data-testid="export-status"]').should('contain', 'Exporting');
    cy.get('[data-testid="export-status"]').should('contain', 'Complete', { timeout: 10000 });

    // Test Excel export
    cy.get('[data-testid="export-format-excel"]').check();
    cy.get('[data-testid="export-button"]').click();
    cy.get('[data-testid="export-status"]').should('contain', 'Complete', { timeout: 10000 });

    // Test JSON export
    cy.get('[data-testid="export-format-json"]').check();
    cy.get('[data-testid="export-button"]').click();
    cy.get('[data-testid="export-status"]').should('contain', 'Complete', { timeout: 10000 });
  });

  it('should handle errors gracefully', () => {
    // Test with invalid course input
    cy.get('[data-testid="course-input"]').type('INVALID COURSE');
    cy.get('[data-testid="add-course"]').click();
    cy.get('[data-testid="generate-schedule"]').click();

    // Should show error message
    cy.get('[data-testid="error-message"]').should('be.visible');
    cy.get('[data-testid="error-message"]').should('contain', 'Invalid course');
  });
});

// cypress/e2e/excel-upload.cy.js
describe('Excel Upload E2E', () => {
  it('should upload and process Excel file', () => {
    cy.visit('/');

    // Upload file
    cy.get('[data-testid="excel-upload"]').selectFile('cypress/fixtures/sample-schedule.xlsx');

    // Verify upload progress
    cy.get('[data-testid="upload-progress"]').should('be.visible');
    cy.get('[data-testid="upload-progress"]').should('not.exist');

    // Verify success message
    cy.get('[data-testid="upload-success"]').should('contain', 'Excel file processed successfully');

    // Verify course data is loaded
    cy.get('[data-testid="course-count"]').should('contain', 'courses loaded');
  });

  it('should reject invalid file types', () => {
    cy.visit('/');

    // Try to upload non-Excel file
    cy.get('[data-testid="excel-upload"]').selectFile('cypress/fixtures/invalid.txt');

    // Should show error
    cy.get('[data-testid="upload-error"]').should('contain', 'Only Excel files are allowed');
  });
});
```

## Performance Tests

### Load Testing with Artillery

```yaml
# load-test.yml
config:
  target: 'http://localhost:3001'
  phases:
    - duration: 60
      arrivalRate: 10
      name: "Warm up"
    - duration: 120
      arrivalRate: 50
      name: "Load test"
    - duration: 60
      arrivalRate: 100
      name: "Stress test"
  variables:
    sampleExcel: "sample-schedule.xlsx"

scenarios:
  - name: "Schedule Generation Flow"
    weight: 80
    flow:
      - post:
          url: "/api/excel/upload"
          formData:
            excel: "{{ sampleExcel }}"
      - post:
          url: "/api/schedule/generate"
          json:
            courses: ["EEC 101", "EEC 113", "EEC 121"]
            validation:
              strict_span_validation: true
      - post:
          url: "/api/export/schedule"
          json:
            schedule: "{{ weeklyTable }}"
            format: "pdf"

  - name: "Excel Processing"
    weight: 20
    flow:
      - post:
          url: "/api/excel/upload"
          formData:
            excel: "{{ sampleExcel }}"
      - get:
          url: "/api/excel/courses"
      - get:
          url: "/api/excel/schedule"
```

### Frontend Performance Tests

```javascript
// tests/performance/component-performance.test.js
import React from 'react';
import { render } from '@testing-library/react';
import { performance } from 'perf_hooks';
import PersonalizedScheduleGenerator from '../../src/components/PersonalizedScheduleGenerator';

describe('Component Performance', () => {
  test('PersonalizedScheduleGenerator renders within performance budget', () => {
    const startTime = performance.now();
    
    render(<PersonalizedScheduleGenerator />);
    
    const endTime = performance.now();
    const renderTime = endTime - startTime;
    
    // Should render within 100ms
    expect(renderTime).toBeLessThan(100);
  });

  test('Large schedule table renders efficiently', () => {
    const largeSchedule = generateLargeSchedule(); // Helper function
    
    const startTime = performance.now();
    
    render(<ScheduleDisplay schedule={largeSchedule} />);
    
    const endTime = performance.now();
    const renderTime = endTime - startTime;
    
    // Should handle large schedules within 200ms
    expect(renderTime).toBeLessThan(200);
  });
});
```

## Test Data and Fixtures

### Sample Excel File Structure

```javascript
// tests/fixtures/createSampleExcel.js
const XLSX = require('xlsx');
const path = require('path');

function createSampleExcelFile() {
  const workbook = XLSX.utils.book_new();

  // Create courses sheet
  const coursesData = [
    ['Code', 'Arabic Name', 'English Name', 'Credit Hours', 'Span', 'Department'],
    ['EEC 101', 'Circuits Analysis', 'Circuits Analysis', 3, 3, 'ECE'],
    ['EEC 113', 'Digital Logic', 'Digital Logic Design', 3, 3, 'ECE'],
    ['EEC 121', 'Electronics', 'Electronics Engineering', 3, 5, 'ECE'],
    ['EEC 125', 'Communication', 'Communication Systems', 3, 5, 'ECE'],
    ['EEC 142', 'Control Systems', 'Control Systems', 3, 6, 'ECE'],
    ['EEC 212', 'Microprocessors', 'Microprocessor Systems', 3, 5, 'ECE'],
    ['EEC 284', 'Power Electronics', 'Power Electronics', 3, 4, 'ECE']
  ];

  const coursesSheet = XLSX.utils.aoa_to_sheet(coursesData);
  XLSX.utils.book_append_sheet(workbook, coursesSheet, 'Courses');

  // Create schedule sheet with sample data
  const scheduleData = createSampleScheduleData();
  const scheduleSheet = XLSX.utils.aoa_to_sheet(scheduleData);
  XLSX.utils.book_append_sheet(workbook, scheduleSheet, 'Schedule');

  // Write file
  const filePath = path.join(__dirname, 'sample-schedule.xlsx');
  XLSX.writeFile(workbook, filePath);
  
  return filePath;
}

function createSampleScheduleData() {
  // Create 9x8 grid (header + 8 time slots, 8 columns for days)
  const data = [
    ['Time', 'Saturday', 'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
  ];

  const timeSlots = [
    '8:00-8:45', '8:45-9:30', '9:30-10:15', '10:15-11:00',
    '11:00-11:45', '11:45-12:30', '12:30-1:15', '1:15-2:00'
  ];

  // Sample course placements
  const sampleCourses = [
    { course: 'EEC 10105', name: 'Circuits Analysis', hall: 'Lab A', prof: 'Dr. Ahmed', day: 1, slots: [0, 1, 2] },
    { course: 'EEC 11302', name: 'Digital Logic', hall: 'Lab B', prof: 'Dr. Omar', day: 2, slots: [0, 1, 2] },
    { course: 'EEC 12103', name: 'Electronics', hall: 'Lab C', prof: 'Dr. Sara', day: 3, slots: [0, 1, 2, 3, 4] }
  ];

  // Initialize empty schedule
  for (let slot = 0; slot < 8; slot++) {
    const row = [timeSlots[slot]];
    for (let day = 0; day < 7; day++) {
      row.push('');
    }
    data.push(row);
  }

  // Place sample courses
  sampleCourses.forEach(course => {
    course.slots.forEach(slot => {
      const cellContent = `${course.course}\n${course.name}\n${course.hall} - ${course.prof}`;
      data[slot + 1][course.day] = cellContent;
    });
  });

  return data;
}

module.exports = { createSampleExcelFile, createSampleScheduleData };
```

## Test Scripts

### Package.json Test Scripts

```json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "test:integration": "jest --testMatch='**/integration/**/*.test.js'",
    "test:e2e": "cypress run",
    "test:e2e:open": "cypress open",
    "test:load": "artillery run load-test.yml",
    "test:all": "npm run test && npm run test:integration && npm run test:e2e",
    "test:ci": "jest --coverage --watchAll=false"
  }
}
```

### Continuous Integration

```yaml
# .github/workflows/test.yml
name: Test Suite

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest

    steps:
    - uses: actions/checkout@v2
    
    - name: Setup Node.js
      uses: actions/setup-node@v2
      with:
        node-version: '18'
        
    - name: Install dependencies
      run: |
        cd server && npm install
        cd ../client && npm install
        
    - name: Run backend tests
      run: |
        cd server
        npm run test:ci
        
    - name: Run frontend tests
      run: |
        cd client
        npm run test:ci
        
    - name: Run integration tests
      run: |
        cd server
        npm run test:integration
        
    - name: Upload coverage
      uses: codecov/codecov-action@v1
```

This comprehensive testing guide covers all aspects of testing the HTI Scheduler application, from unit tests to end-to-end testing, performance testing, and continuous integration setup.
