# Contributing Guide

## Overview

Welcome to the HTI Scheduler project! This guide provides comprehensive information for developers who want to contribute to the project, including development guidelines, coding standards, testing procedures, and the contribution process.

## Table of Contents

1. [Getting Started](#getting-started)
2. [Development Environment Setup](#development-environment-setup)
3. [Project Structure](#project-structure)
4. [Coding Standards](#coding-standards)
5. [Development Workflow](#development-workflow)
6. [Testing Requirements](#testing-requirements)
7. [Documentation Guidelines](#documentation-guidelines)
8. [Pull Request Process](#pull-request-process)
9. [Issue Reporting](#issue-reporting)
10. [Code Review Guidelines](#code-review-guidelines)
11. [Release Process](#release-process)

## Getting Started

### Prerequisites

Before contributing, ensure you have:

- **Node.js 18+** installed
- **Git** configured with your GitHub account
- **VS Code** with recommended extensions (see `.vscode/extensions.json`)
- **GitHub Copilot** configured for enhanced development (see [Copilot setup guide](./02-copilot-remote-indexing.md))

### Quick Start

1. **Fork the repository**:
   ```bash
   # Fork on GitHub, then clone your fork
   git clone https://github.com/YOUR_USERNAME/HTI-Scheduler-2.git
   cd HTI-Scheduler-2
   ```

2. **Set up upstream remote**:
   ```bash
   git remote add upstream https://github.com/Sudo-Omar-Khalaf/HTI-Scheduler-2.git
   git remote -v  # Verify remotes
   ```

3. **Install dependencies**:
   ```bash
   # Backend dependencies
   cd server
   npm install
   
   # Frontend dependencies
   cd ../client
   npm install
   
   # Return to root
   cd ..
   ```

4. **Set up environment**:
   ```bash
   # Copy environment templates
   cp .env.example .env
   cp server/.env.example server/.env
   cp client/.env.example client/.env
   
   # Edit with your local configuration
   ```

5. **Start development servers**:
   ```bash
   # Terminal 1: Backend
   cd server
   npm run dev
   
   # Terminal 2: Frontend
   cd client
   npm start
   ```

6. **Verify setup**:
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:3001/api/health
   - Upload sample Excel file and generate a schedule

## Development Environment Setup

### VS Code Configuration

The project includes comprehensive VS Code configuration:

```json
// .vscode/settings.json (already configured)
{
  "github.copilot.preferences.remoteIndexing": true,
  "github.copilot.preferences.codebaseIndexing": "enabled",
  "github.copilot.preferences.includeCodebaseContext": true,
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "eslint.workingDirectories": ["server", "client"],
  "typescript.preferences.importModuleSpecifier": "relative"
}
```

### Recommended Extensions

Install these VS Code extensions (defined in `.vscode/extensions.json`):

- **GitHub Copilot** (`GitHub.copilot`)
- **ESLint** (`dbaeumer.vscode-eslint`)
- **Prettier** (`esbenp.prettier-vscode`)
- **Jest** (`Orta.vscode-jest`)
- **REST Client** (`humao.rest-client`)
- **GitLens** (`eamodio.gitlens`)

### Environment Variables

#### Backend (.env)
```bash
NODE_ENV=development
PORT=3001
SESSION_SECRET=dev-secret-key
CLIENT_URL=http://localhost:3000

# Optional: Database connections
MONGODB_URI=mongodb://localhost:27017/hti-scheduler-dev
REDIS_URL=redis://localhost:6379

# Development flags
DEBUG=hti-scheduler:*
LOG_LEVEL=debug
```

#### Frontend (.env)
```bash
REACT_APP_API_URL=http://localhost:3001/api
REACT_APP_DEBUG=true
REACT_APP_VERSION=development
```

## Project Structure

```
HTI-Scheduler-2/
├── client/                     # React frontend
│   ├── public/
│   ├── src/
│   │   ├── components/         # React components
│   │   ├── pages/             # Page components
│   │   ├── services/          # API services
│   │   ├── styles/            # CSS/styling
│   │   └── utils/             # Utility functions
│   ├── package.json
│   └── README.md
├── server/                     # Node.js backend
│   ├── routes/                # Express routes
│   ├── services/              # Business logic
│   ├── middleware/            # Express middleware
│   ├── models/                # Data models
│   ├── utils/                 # Utility functions
│   ├── tests/                 # Backend tests
│   ├── package.json
│   └── index.js               # Server entry point
├── docs/                      # Documentation
├── .vscode/                   # VS Code configuration
├── .github/                   # GitHub workflows and templates
├── docker-compose.yml         # Docker setup
├── package.json               # Root package.json
└── README.md                  # Project overview
```

### Component Organization

#### Frontend Components
```
client/src/components/
├── PersonalizedScheduleGenerator.jsx  # Main generator
├── ScheduleDisplay.jsx               # Weekly table display
├── CourseSelector.jsx                # Course selection
├── ExportOptions.jsx                 # Export functionality
├── ValidationSummary.jsx             # Validation results
├── ExcelUploader.jsx                 # File upload
└── common/                           # Shared components
    ├── LoadingSpinner.jsx
    ├── ErrorBoundary.jsx
    └── Button.jsx
```

#### Backend Services
```
server/services/
├── ExcelParserServiceFinal.js        # Excel processing
├── ScheduleGeneratorService.js       # Schedule generation
├── ExportService.js                  # Export functionality
└── ValidationService.js              # Data validation
```

## Coding Standards

### JavaScript/React Standards

#### General Principles
- Use **ES6+** features consistently
- Prefer **functional components** with hooks over class components
- Use **async/await** over Promise chains
- Implement proper **error handling**
- Write **self-documenting code** with clear variable names

#### Naming Conventions
```javascript
// Variables and functions: camelCase
const courseData = [];
const generateSchedule = () => {};

// Constants: UPPER_SNAKE_CASE
const MAX_FILE_SIZE = 50 * 1024 * 1024;
const TIME_SLOTS = 8;

// Components: PascalCase
const PersonalizedScheduleGenerator = () => {};

// Files: PascalCase for components, camelCase for utilities
PersonalizedScheduleGenerator.jsx
scheduleUtils.js
```

#### Function Structure
```javascript
// Good: Clear, single responsibility
const parseCourseCode = (input) => {
  if (!input || typeof input !== 'string') {
    return { code: '', groups: [] };
  }
  
  const normalized = input.trim().toUpperCase();
  const match = normalized.match(/^([A-Z]+\s+\d+)(\d{2}(?:,\d{2})*)?$/);
  
  if (!match) {
    return { code: input, groups: [] };
  }
  
  const [, code, groupsPart] = match;
  const groups = groupsPart ? groupsPart.split(',') : [];
  
  return { code, groups };
};

// Bad: Multiple responsibilities, unclear
const processInput = (input) => {
  // Complex logic without clear purpose
};
```

#### React Component Standards
```jsx
// Good: Functional component with proper structure
import React, { useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';

const CourseSelector = ({ 
  courses, 
  onSelectionChange, 
  availableCourses,
  isLoading = false 
}) => {
  const [courseInput, setCourseInput] = useState('');
  const [validationError, setValidationError] = useState('');
  
  // Use useCallback for event handlers passed as props
  const handleAddCourse = useCallback(() => {
    if (!courseInput.trim()) {
      setValidationError('Course input cannot be empty');
      return;
    }
    
    setValidationError('');
    onSelectionChange([...courses, courseInput.trim()]);
    setCourseInput('');
  }, [courseInput, courses, onSelectionChange]);
  
  return (
    <div className="course-selector">
      <div className="input-section">
        <input
          type="text"
          value={courseInput}
          onChange={(e) => setCourseInput(e.target.value)}
          placeholder="Enter course (e.g., EEC 101, EEC 10105,06)"
          disabled={isLoading}
          onKeyPress={(e) => e.key === 'Enter' && handleAddCourse()}
        />
        <button 
          onClick={handleAddCourse}
          disabled={isLoading || !courseInput.trim()}
        >
          Add Course
        </button>
      </div>
      
      {validationError && (
        <div className="error-message">{validationError}</div>
      )}
    </div>
  );
};

CourseSelector.propTypes = {
  courses: PropTypes.arrayOf(PropTypes.string).isRequired,
  onSelectionChange: PropTypes.func.isRequired,
  availableCourses: PropTypes.array,
  isLoading: PropTypes.bool
};

export default CourseSelector;
```

#### Error Handling Standards
```javascript
// Backend: Consistent error handling
class ScheduleGeneratorService {
  async generatePersonalizedSchedule(courseSelection, options = {}) {
    try {
      // Validate input
      if (!Array.isArray(courseSelection) || courseSelection.length === 0) {
        throw new ValidationError('Course selection cannot be empty');
      }
      
      const selectedCourses = this.parseUserCourseSelection(courseSelection);
      const validation = this.validateCourseSpans(selectedCourses, options);
      
      if (!validation.valid && options.strict_span_validation) {
        throw new ValidationError(
          `Invalid course spans: ${validation.mismatch_details.map(d => d.course).join(', ')}`,
          { details: validation.mismatch_details }
        );
      }
      
      const weeklyTable = this.buildWeeklyTable(selectedCourses);
      const conflicts = this.validateNoConflicts(weeklyTable);
      
      return {
        weeklyTable,
        validation: { ...validation, conflicts, valid: validation.valid && conflicts.length === 0 },
        selectedCourses
      };
    } catch (error) {
      // Log error with context
      console.error('Schedule generation failed:', {
        courseSelection,
        options,
        error: error.message,
        stack: error.stack
      });
      
      // Re-throw with enhanced context
      if (error instanceof ValidationError) {
        throw error;
      }
      
      throw new Error(`Schedule generation failed: ${error.message}`);
    }
  }
}

// Custom error classes
class ValidationError extends Error {
  constructor(message, details = {}) {
    super(message);
    this.name = 'ValidationError';
    this.details = details;
  }
}
```

#### Frontend Error Handling
```jsx
const PersonalizedScheduleGenerator = () => {
  const [errors, setErrors] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  
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
      
      // Show warnings if validation has issues
      if (!response.validation.valid) {
        setErrors(response.validation.warnings || ['Schedule generated with warnings']);
      }
    } catch (error) {
      console.error('Generation error:', error);
      
      // Handle different error types
      if (error.response?.status === 400) {
        setErrors([error.response.data.error || 'Invalid input provided']);
      } else if (error.response?.status === 422) {
        setErrors([error.response.data.error || 'Schedule generation failed due to validation errors']);
      } else {
        setErrors(['An unexpected error occurred. Please try again.']);
      }
    } finally {
      setIsLoading(false);
    }
  }, [selectedCourses]);
};
```

### CSS/Styling Standards

#### CSS Organization
```css
/* Component-specific styles */
.course-selector {
  /* Layout */
  display: flex;
  flex-direction: column;
  gap: 1rem;
  
  /* Spacing */
  padding: 1rem;
  margin-bottom: 2rem;
  
  /* Visual */
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  background: #fafafa;
}

.course-selector__input-section {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

.course-selector__input {
  flex: 1;
  padding: 0.5rem;
  border: 1px solid #ccc;
  border-radius: 4px;
  font-size: 1rem;
}

.course-selector__button {
  padding: 0.5rem 1rem;
  background: #007acc;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.course-selector__button:hover {
  background: #005c99;
}

.course-selector__button:disabled {
  background: #ccc;
  cursor: not-allowed;
}

/* Error states */
.course-selector--error .course-selector__input {
  border-color: #ff6b6b;
}

.course-selector__error-message {
  color: #ff6b6b;
  font-size: 0.875rem;
  margin-top: 0.25rem;
}
```

#### Responsive Design
```css
/* Mobile-first approach */
.weekly-schedule {
  width: 100%;
  overflow-x: auto;
  font-size: 0.75rem;
}

.schedule-cell {
  min-width: 120px;
  padding: 0.25rem;
}

/* Tablet */
@media (min-width: 768px) {
  .weekly-schedule {
    font-size: 0.875rem;
  }
  
  .schedule-cell {
    min-width: 140px;
    padding: 0.5rem;
  }
}

/* Desktop */
@media (min-width: 1024px) {
  .weekly-schedule {
    font-size: 1rem;
  }
  
  .schedule-cell {
    min-width: 160px;
    padding: 0.75rem;
  }
}
```

## Development Workflow

### Branch Strategy

We use **Git Flow** with the following branches:

- **`main`**: Production-ready code
- **`develop`**: Integration branch for features
- **`feature/*`**: Feature development branches
- **`bugfix/*`**: Bug fix branches
- **`hotfix/*`**: Critical production fixes
- **`release/*`**: Release preparation branches

### Workflow Steps

1. **Create feature branch**:
   ```bash
   # Sync with upstream
   git checkout develop
   git pull upstream develop
   
   # Create feature branch
   git checkout -b feature/your-feature-name
   ```

2. **Development cycle**:
   ```bash
   # Make changes
   git add .
   git commit -m "feat: add course parsing with group detection"
   
   # Push regularly
   git push origin feature/your-feature-name
   ```

3. **Before submitting PR**:
   ```bash
   # Sync with latest develop
   git checkout develop
   git pull upstream develop
   git checkout feature/your-feature-name
   git rebase develop
   
   # Run tests
   npm run test:all
   
   # Fix any conflicts and test failures
   ```

4. **Submit Pull Request**:
   - Create PR from your feature branch to `develop`
   - Fill out PR template completely
   - Request review from maintainers

### Commit Message Standards

We follow **Conventional Commits** specification:

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

#### Types
- **feat**: New feature
- **fix**: Bug fix
- **docs**: Documentation changes
- **style**: Code style changes (formatting, etc.)
- **refactor**: Code refactoring
- **test**: Adding or updating tests
- **chore**: Maintenance tasks

#### Examples
```bash
feat(scheduler): add support for shared group lectures

- Parse course input like "EEC 10105,06" for shared groups
- Handle shared lectures in schedule generation
- Add validation for group conflicts

Closes #123

fix(excel-parser): handle cells with missing line breaks

The parser now gracefully handles Excel cells that don't
follow the expected 3-line format.

test(api): add integration tests for schedule generation

- Test successful schedule generation
- Test validation error handling
- Test conflict detection

docs(readme): update installation instructions

Add Docker setup instructions and troubleshooting section.
```

## Testing Requirements

### Testing Strategy

All contributions must include appropriate tests:

#### Backend Testing
- **Unit tests** for services and utilities
- **Integration tests** for API endpoints
- **Test coverage** minimum 80%

#### Frontend Testing
- **Component tests** using React Testing Library
- **Integration tests** for user workflows
- **Accessibility tests** using jest-axe

### Writing Tests

#### Backend Unit Test Example
```javascript
// tests/services/ScheduleGeneratorService.test.js
describe('ScheduleGeneratorService', () => {
  let generator;
  
  beforeEach(() => {
    generator = new ScheduleGeneratorService();
    generator.courseData = mockCourseData;
    generator.scheduleData = mockScheduleData;
  });
  
  describe('parseUserCourseSelection', () => {
    it('should parse course with shared groups correctly', () => {
      const input = ['EEC 10105,06'];
      const result = generator.parseUserCourseSelection(input);
      
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        code: 'EEC 101',
        groups: ['05', '06'],
        shared_lecture: true
      });
    });
    
    it('should handle course without groups', () => {
      const input = ['EEC 101'];
      const result = generator.parseUserCourseSelection(input);
      
      expect(result[0].code).toBe('EEC 101');
      expect(result[0].groups).toEqual([]);
    });
  });
});
```

#### Frontend Component Test Example
```javascript
// client/src/components/__tests__/CourseSelector.test.js
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CourseSelector from '../CourseSelector';

describe('CourseSelector', () => {
  const mockProps = {
    courses: [],
    onSelectionChange: jest.fn(),
    availableCourses: [
      { code: 'EEC 101', arabic_name: 'Circuits Analysis' }
    ]
  };
  
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  it('should add course when button is clicked', async () => {
    const user = userEvent.setup();
    render(<CourseSelector {...mockProps} />);
    
    const input = screen.getByPlaceholderText(/enter course/i);
    const addButton = screen.getByText(/add course/i);
    
    await user.type(input, 'EEC 101');
    await user.click(addButton);
    
    expect(mockProps.onSelectionChange).toHaveBeenCalledWith(['EEC 101']);
  });
  
  it('should show error for empty input', async () => {
    const user = userEvent.setup();
    render(<CourseSelector {...mockProps} />);
    
    const addButton = screen.getByText(/add course/i);
    await user.click(addButton);
    
    expect(screen.getByText(/cannot be empty/i)).toBeInTheDocument();
  });
});
```

### Running Tests

```bash
# Backend tests
cd server
npm test                    # Run all tests
npm run test:watch         # Watch mode
npm run test:coverage      # With coverage

# Frontend tests
cd client
npm test                   # Run all tests
npm run test:coverage      # With coverage

# Integration tests
npm run test:integration

# E2E tests
npm run test:e2e
```

## Documentation Guidelines

### Code Documentation

#### JSDoc for Functions
```javascript
/**
 * Generates a personalized weekly schedule for selected courses
 * @param {string[]} courseSelection - Array of course codes (e.g., ["EEC 101", "EEC 10105,06"])
 * @param {Object} options - Generation options
 * @param {boolean} options.strict_span_validation - Enable strict span validation
 * @returns {Promise<Object>} Generated schedule with validation results
 * @throws {ValidationError} When course spans don't match requirements
 * @example
 * const result = await generator.generatePersonalizedSchedule(
 *   ["EEC 101", "EEC 10105,06"], 
 *   { strict_span_validation: true }
 * );
 */
async generatePersonalizedSchedule(courseSelection, options = {}) {
  // Implementation
}
```

#### Component Documentation
```jsx
/**
 * Course selector component for adding and managing course selections
 * 
 * @component
 * @param {Object} props
 * @param {string[]} props.courses - Currently selected courses
 * @param {Function} props.onSelectionChange - Callback when course selection changes
 * @param {Array} props.availableCourses - Available courses from Excel data
 * @param {boolean} props.isLoading - Loading state indicator
 * 
 * @example
 * <CourseSelector
 *   courses={["EEC 101", "EEC 113"]}
 *   onSelectionChange={handleCourseChange}
 *   availableCourses={courseData}
 *   isLoading={false}
 * />
 */
const CourseSelector = ({ courses, onSelectionChange, availableCourses, isLoading }) => {
  // Component implementation
};
```

### README Updates

When adding features, update relevant documentation:

#### API Documentation
```markdown
## New Endpoint: Course Validation

### POST /api/schedule/validate

Validates course selection without generating full schedule.

**Request Body:**
```json
{
  "courses": ["EEC 101", "EEC 10105,06"],
  "options": {
    "strict_span_validation": true
  }
}
```

**Response:**
```json
{
  "validation": {
    "valid": true,
    "span_details": [
      {
        "course": "EEC 101",
        "expected": 3,
        "actual": 3,
        "valid": true
      }
    ]
  },
  "selectedCourses": [...]
}
```
```

## Pull Request Process

### PR Template

All PRs must use this template:

```markdown
## Description
Brief description of changes and motivation.

## Type of Change
- [ ] Bug fix (non-breaking change which fixes an issue)
- [ ] New feature (non-breaking change which adds functionality)
- [ ] Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] Documentation update

## Changes Made
- List of specific changes
- Another change
- etc.

## Testing
- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] Manual testing completed
- [ ] New tests added for new functionality

## Checklist
- [ ] My code follows the project's coding standards
- [ ] I have performed a self-review of my code
- [ ] I have commented my code, particularly in hard-to-understand areas
- [ ] I have made corresponding changes to the documentation
- [ ] My changes generate no new warnings
- [ ] I have added tests that prove my fix is effective or that my feature works
- [ ] New and existing unit tests pass locally with my changes

## Screenshots (if applicable)
Add screenshots to help explain your changes.

## Related Issues
Closes #123
Related to #456
```

### Review Process

1. **Automated Checks**: All PRs must pass:
   - ESLint/Prettier checks
   - Unit tests
   - Integration tests
   - Build process

2. **Code Review**: At least one maintainer review required:
   - Code quality and standards
   - Test coverage
   - Documentation updates
   - Security considerations

3. **Manual Testing**: Reviewer should test:
   - Feature functionality
   - Edge cases
   - Integration with existing features

## Issue Reporting

### Bug Reports

Use this template for bug reports:

```markdown
## Bug Description
A clear and concise description of what the bug is.

## Steps to Reproduce
1. Go to '...'
2. Click on '....'
3. Scroll down to '....'
4. See error

## Expected Behavior
A clear and concise description of what you expected to happen.

## Actual Behavior
A clear and concise description of what actually happened.

## Screenshots
If applicable, add screenshots to help explain your problem.

## Environment
- OS: [e.g., Ubuntu 20.04]
- Node.js version: [e.g., 18.17.0]
- Browser: [e.g., Chrome 96]
- Project version: [e.g., 1.2.0]

## Additional Context
Add any other context about the problem here.

## Possible Solution
If you have ideas on how to fix this, include them here.
```

### Feature Requests

```markdown
## Feature Description
A clear and concise description of the feature you'd like to see.

## Problem Statement
Describe the problem this feature would solve.

## Proposed Solution
A clear and concise description of what you want to happen.

## Alternative Solutions
Describe any alternative solutions or features you've considered.

## Use Cases
Describe specific use cases for this feature.

## Additional Context
Add any other context, mockups, or examples about the feature request here.
```

## Code Review Guidelines

### For Authors

Before requesting review:
- [ ] Self-review your code
- [ ] Run all tests locally
- [ ] Update documentation
- [ ] Add/update tests for new functionality
- [ ] Ensure commit messages follow conventions
- [ ] Rebase on latest develop branch

### For Reviewers

Focus on:
- **Functionality**: Does the code do what it's supposed to do?
- **Code Quality**: Is the code readable, maintainable, and efficient?
- **Testing**: Are there adequate tests with good coverage?
- **Security**: Are there any security vulnerabilities?
- **Performance**: Could this impact application performance?
- **Documentation**: Is the code well-documented?

#### Review Checklist
- [ ] Code follows project standards
- [ ] Tests are comprehensive and pass
- [ ] No obvious security issues
- [ ] Performance impact is acceptable
- [ ] Documentation is updated
- [ ] Error handling is appropriate
- [ ] Edge cases are considered

#### Providing Feedback

**Good feedback**:
```
Consider extracting this validation logic into a separate function 
for better reusability and testing:

```javascript
const validateCourseInput = (input) => {
  if (!input || typeof input !== 'string') {
    throw new ValidationError('Course input must be a non-empty string');
  }
  // validation logic
};
```

**Not helpful**:
```
This code is bad.
```

## Release Process

### Version Numbering

We follow **Semantic Versioning** (SemVer):
- **MAJOR**: Breaking changes
- **MINOR**: New features (backward compatible)
- **PATCH**: Bug fixes (backward compatible)

### Release Workflow

1. **Prepare Release**:
   ```bash
   git checkout develop
   git pull upstream develop
   git checkout -b release/v1.2.0
   
   # Update version numbers
   npm version minor --no-git-tag-version
   
   # Update CHANGELOG.md
   # Update documentation
   ```

2. **Testing**:
   ```bash
   npm run test:all
   npm run build
   # Manual testing
   ```

3. **Merge to Main**:
   ```bash
   git checkout main
   git merge release/v1.2.0
   git tag v1.2.0
   git push upstream main --tags
   ```

4. **Deploy**:
   - Automated deployment from main branch
   - Update production environment
   - Monitor for issues

5. **Merge back to Develop**:
   ```bash
   git checkout develop
   git merge main
   git push upstream develop
   ```

### Changelog Format

```markdown
# Changelog

## [1.2.0] - 2024-01-15

### Added
- Support for shared group lectures (EEC 10105,06)
- New course validation API endpoint
- Export to Excel format
- GitHub Copilot remote indexing support

### Changed
- Improved error handling in schedule generation
- Updated UI for better mobile experience
- Enhanced Excel parsing performance

### Fixed
- Course span validation for EEC 142 (6 slots)
- Memory leak in PDF export service
- CORS issues in production deployment

### Security
- Updated dependencies to fix security vulnerabilities
- Added rate limiting to API endpoints

## [1.1.0] - 2024-01-01
...
```

## Getting Help

### Development Questions

- **GitHub Discussions**: For general questions and discussions
- **GitHub Issues**: For bug reports and feature requests
- **Code Review**: Tag maintainers in PR reviews

### Maintainers

- **Omar Khalaf** (@Sudo-Omar-Khalaf) - Project Lead
- **Contributors** - See CONTRIBUTORS.md

### Resources

- [Project Documentation](./docs/)
- [API Reference](./docs/06-api-documentation.md)
- [Architecture Guide](./docs/03-project-architecture.md)
- [Troubleshooting Guide](./docs/10-troubleshooting.md)

Thank you for contributing to the HTI Scheduler project! Your contributions help make scheduling easier for students and improve the educational experience.
