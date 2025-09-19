# HTI Scheduler

A full-stack web application for parsing, validating, and generating university course schedules from Arabic Excel timetables.

## Features

- **Arabic Excel Parsing**: Extract course schedules from Arabic university timetables
- **Smart Data Validation**: Automatically detect and resolve scheduling conflicts
- **Schedule Optimization**: Generate multiple optimized schedule candidates
- **Export Functionality**: Export schedules to Excel and CSV formats with RTL support
- **Modern UI**: Responsive React interface with Arabic text support

## Technology Stack

### Backend
- **Node.js** with Express.js
- **XLSX** for Excel file processing
- **Multer** for file uploads
- **Helmet** for security
- **CORS** for cross-origin requests

### Frontend
- **React** with Vite
- **Tailwind CSS** for styling
- **Framer Motion** for animations
- **React Hot Toast** for notifications
- **Lucide React** for icons

## Quick Start

### Prerequisites
- Node.js 16+ 
- npm or yarn

### Installation

1. **Clone and install dependencies:**
   ```bash
   git clone <repository-url>
   cd HTI-scheduler-2
   npm run install:all
   ```

2. **Start development servers:**
   ```bash
   npm run dev
   ```

3. **Access the application:**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:5000

### Production Build

```bash
# Build frontend for production
npm run build

# Start production server
npm start
```

## Usage

1. **Upload Excel File**: Drag and drop your Arabic Excel timetable
2. **Review Results**: View parsed courses, groups, and validation results
3. **Generate Schedules**: Create optimized schedule candidates with preferences
4. **Export**: Download schedules in Excel or CSV format

## API Endpoints

- `POST /api/excel/parse` - Parse Excel timetable
- `POST /api/schedule/generate` - Generate optimized schedules
- `POST /api/export/excel` - Export schedule to Excel
- `POST /api/export/csv` - Export schedule to CSV

## File Structure

```
HTI-scheduler-2/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/          # Application pages
│   │   └── services/       # API services
├── server/                 # Node.js backend
│   ├── models/             # Data models
│   ├── routes/             # API routes
│   ├── services/           # Business logic
│   └── uploads/            # File upload directory
└── package.json            # Root package configuration
```

## Development

### Available Scripts

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
