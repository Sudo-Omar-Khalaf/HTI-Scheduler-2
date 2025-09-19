# HTI Scheduler Documentation

Welcome to the comprehensive documentation for the HTI Scheduler project - a personalized weekly schedule generator for students.

## Table of Contents

### Getting Started
- [Quick Start Guide](./01-getting-started.md) - Get up and running quickly
- [Installation Guide](./04-installation.md) - Complete setup instructions
- [Usage Guide](./05-usage-guide.md) - How to use the application

### Development & Architecture
- [Project Architecture](./03-project-architecture.md) - System design and components
- [API Documentation](./06-api-documentation.md) - REST API reference
- [Frontend Components](./07-frontend-components.md) - React component documentation
- [Backend Services](./08-backend-services.md) - Server-side service documentation
- [GitHub Copilot Remote Indexing](./02-copilot-remote-indexing.md) - Enhanced development with AI

### Testing & Quality Assurance
- [Testing Guide](./09-testing-guide.md) - Testing procedures and scripts
- [Troubleshooting Guide](./10-troubleshooting.md) - Common issues and solutions

### Deployment & Operations
- [Deployment Guide](./11-deployment.md) - Production deployment instructions
- [Contributing Guide](./12-contributing.md) - Development guidelines and contribution process

## About HTI Scheduler

The HTI Scheduler is a comprehensive web application designed to help students generate personalized weekly schedules based on their course selections. It provides intelligent parsing of course codes, handles group assignments, validates time spans, and exports schedules in multiple formats.

### Key Features

- **Smart Course Parsing**: Handles various formats including "EEC 101", "EEC 10105", and shared groups "EEC 10105,06"
- **Excel Integration**: Processes uploaded Excel files containing course and schedule data
- **Span Validation**: Ensures courses meet required time slot allocations (e.g., EEC 101: 3 slots, EEC 142: 6 slots)
- **Conflict Detection**: Identifies and prevents time conflicts in generated schedules
- **Multiple Export Formats**: PDF, Excel, and JSON export options
- **Responsive Design**: Works seamlessly on desktop and mobile devices
- **GitHub Copilot Integration**: Enhanced development experience with AI-powered coding assistance

### Architecture Overview

The application follows a modern full-stack architecture:

- **Frontend**: React.js with hooks and functional components
- **Backend**: Node.js with Express.js framework
- **Excel Processing**: XLSX library for parsing uploaded files
- **PDF Generation**: Puppeteer for creating formatted PDF exports
- **Session Management**: Express sessions for maintaining user state
- **Testing**: Comprehensive test suite with Jest and React Testing Library
- **Deployment**: Docker support with multiple deployment options

### Documentation Structure

Our documentation is comprehensive and organized by audience and use case:

#### For New Users
- **Quick Start**: Immediate introduction to key features
- **Installation**: Step-by-step setup for all environments
- **Usage Guide**: Complete user manual with examples

#### For Developers
- **Architecture**: Deep dive into system design and patterns
- **Frontend Components**: React component API and usage
- **Backend Services**: Server-side architecture and services
- **API Reference**: Complete REST API documentation
- **Testing Guide**: Testing strategies and procedures
- **GitHub Copilot**: AI-enhanced development setup

#### For DevOps/Administrators
- **Deployment Guide**: Production deployment strategies
- **Troubleshooting**: Common issues and solutions
- **Contributing**: Development workflow and standards

## Quick Navigation

### For Developers
1. Start with [Installation Guide](./04-installation.md) to set up your environment
2. Read [Project Architecture](./03-project-architecture.md) to understand the system
3. Configure [GitHub Copilot](./02-copilot-remote-indexing.md) for enhanced development
4. Explore [Frontend Components](./07-frontend-components.md) and [Backend Services](./08-backend-services.md)
5. Reference [API Documentation](./06-api-documentation.md) while building
6. Follow [Testing Guide](./09-testing-guide.md) for quality assurance
7. Use [Contributing Guide](./12-contributing.md) for development workflow

### For Users
1. Follow [Quick Start Guide](./01-getting-started.md) for immediate overview
2. Use [Installation Guide](./04-installation.md) for setup
3. Reference [Usage Guide](./05-usage-guide.md) for daily operations
4. Check [Troubleshooting Guide](./10-troubleshooting.md) when issues arise

### For Administrators
1. Review [Installation Guide](./04-installation.md) for local deployment
2. Study [Deployment Guide](./11-deployment.md) for production setup
3. Understand [Project Architecture](./03-project-architecture.md) for system administration
4. Use [Troubleshooting Guide](./10-troubleshooting.md) for operational issues

## Project Highlights

### Advanced Features
- **Intelligent Course Parsing**: Supports complex group formats like "EEC 10105,06" for shared lectures
- **True Span Validation**: Validates against known course requirements (EEC 101: 3, EEC 142: 6, etc.)
- **Conflict Detection**: Prevents scheduling conflicts across different courses
- **Multiple Export Formats**: Professional PDF, Excel spreadsheets, and JSON data exports
- **Session Management**: Maintains user state across Excel uploads and schedule generations

### Development Excellence
- **Comprehensive Testing**: Unit, integration, and end-to-end test coverage
- **GitHub Copilot Integration**: AI-enhanced development with remote indexing
- **Docker Support**: Containerized deployment for any environment
- **Modern Architecture**: React hooks, Express.js, and contemporary patterns
- **Detailed Documentation**: Step-by-step guides for all aspects of the project

### Production Ready
- **Multiple Deployment Options**: Docker, cloud platforms, traditional servers
- **Security Features**: CORS protection, rate limiting, input validation
- **Performance Optimization**: Caching, compression, and efficient processing
- **Monitoring & Logging**: Comprehensive logging and health checks
- **Backup & Recovery**: Database backup strategies and recovery procedures

## Support and Contributing

This project is actively maintained and welcomes contributions. We have comprehensive guides for:

- **Bug Reports**: Use our issue templates for consistent reporting
- **Feature Requests**: Structured process for new feature proposals  
- **Code Contributions**: Detailed workflow with coding standards
- **Documentation**: Guidelines for improving and extending documentation

For questions, issues, or feature requests, please visit the [GitHub repository](https://github.com/Sudo-Omar-Khalaf/HTI-Scheduler-2).

## Version Information

- **Current Version**: 2.0.0
- **Last Updated**: September 2025
- **Node.js**: 18+ required
- **React**: 18+ used
- **Documentation**: 12 comprehensive guides
- **Test Coverage**: 80%+ target coverage
- **GitHub Copilot**: Remote indexing configured
