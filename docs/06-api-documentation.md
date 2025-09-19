# API Documentation

Complete reference documentation for the HTI Personalized Weekly Schedule Generator REST API.

## 🌐 API Overview

The HTI Scheduler API provides endpoints for Excel file processing, schedule generation, and export functionality. All endpoints return JSON responses with consistent error handling.

**Base URL**: `http://localhost:5000/api`

**Content-Type**: `application/json` (unless specified otherwise)

**API Version**: v1.0.0

## 🔐 Authentication

Currently, the API operates without authentication for development purposes. In production, implement appropriate authentication mechanisms.

## 📊 Response Format

### Success Response
```json
{
  "success": true,
  "message": "Operation completed successfully",
  "data": {
    // Response data
  },
  "metadata": {
    "timestamp": "2025-09-19T14:30:00.000Z",
    "version": "1.0.0"
  }
}
```

### Error Response
```json
{
  "success": false,
  "error": "Error description",
  "code": "ERROR_CODE",
  "details": {
    // Additional error context
  },
  "metadata": {
    "timestamp": "2025-09-19T14:30:00.000Z",
    "endpoint": "/api/schedule/generate"
  }
}
```

## 📁 Excel Operations

### Upload Excel File

Upload and parse Excel timetable files.

**Endpoint**: `POST /api/excel/upload`

**Content-Type**: `multipart/form-data`

**Parameters**:
- `file` (File, required): Excel file (.xlsx or .xls)

**Request Example**:
```bash
curl -X POST http://localhost:5000/api/excel/upload \
  -F "file=@timetable.xlsx"
```

**Response**:
```json
{
  "success": true,
  "message": "Excel file processed successfully",
  "data": {
    "filename": "timetable.xlsx",
    "total_groups": 98,
    "total_sessions": 245,
    "course_codes": [
      "EEC 101", "EEC 113", "EEC 121", "EEC 125", 
      "EEC 142", "EEC 212", "EEC 284"
    ],
    "groups_per_course": {
      "EEC 101": ["01", "02", "03"],
      "EEC 113": ["01", "02"],
      "EEC 121": ["01", "02", "03", "04", "05"],
      "EEC 125": ["01", "02", "03", "04", "05"],
      "EEC 142": ["01", "02", "03", "04", "05", "06"],
      "EEC 212": ["01", "02", "03", "04", "05"],
      "EEC 284": ["01", "02", "03", "04"]
    },
    "parsing_summary": {
      "sheets_processed": 1,
      "rows_processed": 156,
      "valid_sessions": 245,
      "invalid_sessions": 0,
      "processing_time_ms": 1250
    }
  }
}
```

**Error Responses**:

*Invalid File Format*:
```json
{
  "success": false,
  "error": "Invalid file format. Please upload .xlsx or .xls files only",
  "code": "INVALID_FILE_FORMAT"
}
```

*File Too Large*:
```json
{
  "success": false,
  "error": "File size exceeds maximum limit of 10MB",
  "code": "FILE_TOO_LARGE"
}
```

*Processing Error*:
```json
{
  "success": false,
  "error": "Failed to parse Excel file",
  "code": "PARSING_ERROR",
  "details": {
    "reason": "Invalid Excel structure",
    "expected_columns": ["Course Code", "Group", "Day", "Time"]
  }
}
```

### Get Parsed Data

Retrieve previously parsed Excel data.

**Endpoint**: `GET /api/excel/data`

**Response**:
```json
{
  "success": true,
  "data": {
    "course_groups": [
      {
        "course_code": "EEC 101",
        "group_code": "01",
        "course_name": "أساسيات الهندسة الكهربية",
        "sessions": [
          {
            "day_of_week": "Sunday",
            "start_time": "9.00",
            "end_time": "10.30",
            "span": 2,
            "session_type": "lecture",
            "location": "Hall A",
            "instructor": "د. أحمد محمد"
          }
        ]
      }
    ]
  }
}
```

## 🗓️ Schedule Operations

### Generate Personalized Schedule

Generate a personalized weekly schedule based on course selection.

**Endpoint**: `POST /api/schedule/generate`

**Parameters**:
```json
{
  "desired_courses": ["EEC 101", "EEC 11302", "EEC 121"],
  "options": {
    "strict_span_validation": false,
    "allow_conflicts": false,
    "preferred_groups": {
      "EEC 101": "01",
      "EEC 113": "02"
    }
  }
}
```

**Parameter Details**:

- `desired_courses` (Array, required): List of course codes
  - Format 1: `"EEC 101"` (auto group selection)
  - Format 2: `"EEC 10105"` (specific group)
  - Format 3: `"EEC 10105,06"` (shared groups)

- `options` (Object, optional):
  - `strict_span_validation` (Boolean): Enforce exact span requirements
  - `allow_conflicts` (Boolean): Allow time conflicts
  - `preferred_groups` (Object): Preferred group selections

**Request Example**:
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

**Response**:
```json
{
  "success": true,
  "schedule": {
    "weekly_table": {
      "structure": {
        "days": [
          "Sunday", "Monday", "Tuesday", "Wednesday", 
          "Thursday", "Friday", "Saturday"
        ],
        "time_slots": [
          "9.00 - 9.45", "9.45 - 10.30", "10.40 - 11.25",
          "11.25 - 12.10", "12.20 - 1.05", "1.05 - 1.50",
          "2.00 - 2.45", "2.45 - 3.30"
        ],
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
            },
            "session_metadata": {
              "session_type": "lecture",
              "start_time": "9.00",
              "end_time": "10.30",
              "day_of_week": "Sunday",
              "original_span": 2
            },
            "is_continuation": false,
            "span_position": 1,
            "total_span": 2
          },
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
            },
            "session_metadata": {
              "session_type": "lecture",
              "start_time": "9.00",
              "end_time": "10.30",
              "day_of_week": "Sunday",
              "original_span": 2
            },
            "is_continuation": true,
            "span_position": 2,
            "total_span": 2
          }
        ],
        "Monday": [null, null, ...],
        "Tuesday": [...],
        "Wednesday": [...],
        "Thursday": [...],
        "Friday": [...],
        "Saturday": [...]
      }
    },
    "course_selection": [
      {
        "course_code": "EEC 101",
        "group_number": "01",
        "original_input": "EEC 101"
      },
      {
        "course_code": "EEC 113",
        "group_number": "02",
        "original_input": "EEC 11302"
      }
    ],
    "span_validation": {
      "isValid": true,
      "errors": [],
      "warnings": [
        "Course EEC 101 group 01: expected 3 spans, found 4 spans"
      ],
      "course_span_summary": [
        {
          "course_code": "EEC 101",
          "group_number": "01",
          "actual_spans": 4,
          "expected_spans": 3,
          "is_valid": false
        }
      ],
      "mismatch_details": [
        {
          "course_code": "EEC 101",
          "group_number": "01",
          "expected_spans": 3,
          "actual_spans": 4,
          "message": "Course EEC 101 group 01: expected 3 spans, found 4 spans"
        }
      ]
    },
    "conflict_validation": {
      "has_conflicts": false,
      "conflicts": [],
      "total_conflicts": 0
    },
    "generation_metadata": {
      "timestamp": "2025-09-19T14:30:00.000Z",
      "total_courses": 2,
      "total_spans": 7
    }
  }
}
```

**Error Responses**:

*Course Not Found*:
```json
{
  "success": false,
  "error": "Course span validation failed",
  "validation_errors": [
    "Course EEC 999 not found in Excel data"
  ]
}
```

*Time Conflicts*:
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
  ]
}
```

*Invalid Input Format*:
```json
{
  "success": false,
  "error": "Invalid course format",
  "code": "INVALID_COURSE_FORMAT",
  "details": {
    "invalid_courses": ["EEC101", "INVALID"],
    "expected_format": "EEC 101 or EEC 10105"
  }
}
```

### Validate Schedule

Validate a schedule without generating the full weekly table.

**Endpoint**: `POST /api/schedule/validate`

**Parameters**:
```json
{
  "desired_courses": ["EEC 101", "EEC 113"],
  "validation_options": {
    "check_spans": true,
    "check_conflicts": true,
    "strict_mode": false
  }
}
```

**Response**:
```json
{
  "success": true,
  "validation": {
    "is_valid": true,
    "course_availability": {
      "available": ["EEC 101", "EEC 113"],
      "unavailable": []
    },
    "span_validation": {
      "valid_spans": ["EEC 101"],
      "invalid_spans": [
        {
          "course": "EEC 113",
          "expected": 3,
          "actual": 4
        }
      ]
    },
    "conflict_detection": {
      "conflicts": [],
      "total_conflicts": 0
    }
  }
}
```

## 📤 Export Operations

### Export to Excel

Export generated schedule to Excel format with formatting.

**Endpoint**: `GET /api/export/excel/:scheduleId`

**Parameters**:
- `scheduleId` (String): Schedule identifier from generation response

**Query Parameters**:
- `include_metadata` (Boolean): Include metadata sheet (default: true)
- `merge_cells` (Boolean): Merge cells for multi-span sessions (default: true)
- `arabic_support` (Boolean): Enable Arabic text support (default: true)

**Request Example**:
```bash
curl -X GET "http://localhost:5000/api/export/excel/schedule-123?include_metadata=true" \
  -o "schedule.xlsx"
```

**Response**: Binary Excel file download

**Response Headers**:
```
Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet
Content-Disposition: attachment; filename="schedule-2025-09-19.xlsx"
Content-Length: 15432
```

### Export to CSV

Export generated schedule to CSV format.

**Endpoint**: `GET /api/export/csv/:scheduleId`

**Parameters**:
- `scheduleId` (String): Schedule identifier

**Query Parameters**:
- `delimiter` (String): CSV delimiter (default: ",")
- `include_headers` (Boolean): Include column headers (default: true)
- `flatten_cells` (Boolean): Flatten 3-row cells to single row (default: false)

**Request Example**:
```bash
curl -X GET "http://localhost:5000/api/export/csv/schedule-123?delimiter=;" \
  -o "schedule.csv"
```

**Response**: Plain text CSV file download

**CSV Format**:
```csv
Day,Time Slot,Course Code,Group,Course Name,Location,Instructor
Sunday,9.00 - 9.45,EEC 101,01,أساسيات الهندسة الكهربية,Hall A,د. أحمد محمد
Sunday,9.45 - 10.30,EEC 101,01,أساسيات الهندسة الكهربية,Hall A,د. أحمد محمد
Monday,11.25 - 12.10,EEC 113,02,هندسة الدوائر الكهربية,Lab B,د. سارة علي
```

### Get Export Status

Check the status of an export operation.

**Endpoint**: `GET /api/export/status/:exportId`

**Response**:
```json
{
  "success": true,
  "export_status": {
    "id": "export-456",
    "status": "completed",
    "format": "excel",
    "created_at": "2025-09-19T14:30:00.000Z",
    "completed_at": "2025-09-19T14:30:05.000Z",
    "download_url": "/api/export/download/export-456",
    "expires_at": "2025-09-19T18:30:00.000Z"
  }
}
```

## 🔍 Utility Endpoints

### Health Check

Check API health and status.

**Endpoint**: `GET /api/health`

**Response**:
```json
{
  "success": true,
  "status": "healthy",
  "version": "1.0.0",
  "uptime": 3600,
  "services": {
    "excel_parser": "operational",
    "schedule_generator": "operational",
    "export_service": "operational"
  },
  "system": {
    "memory_usage": "45%",
    "cpu_usage": "12%",
    "disk_space": "78% available"
  }
}
```

### API Information

Get API version and capability information.

**Endpoint**: `GET /api/info`

**Response**:
```json
{
  "success": true,
  "api": {
    "name": "HTI Scheduler API",
    "version": "1.0.0",
    "description": "Personalized Weekly Schedule Generator",
    "supported_formats": {
      "input": [".xlsx", ".xls"],
      "output": [".xlsx", ".csv"]
    },
    "features": [
      "excel_parsing",
      "schedule_generation", 
      "conflict_detection",
      "span_validation",
      "export_functionality",
      "arabic_support"
    ],
    "limits": {
      "max_file_size": "10MB",
      "max_courses_per_schedule": 20,
      "supported_languages": ["ar", "en"]
    }
  }
}
```

## 📊 Rate Limiting

Current rate limits (development environment):

- **Excel Upload**: 10 requests per minute
- **Schedule Generation**: 30 requests per minute  
- **Export Operations**: 50 requests per minute
- **Utility Endpoints**: 100 requests per minute

**Rate Limit Headers**:
```
X-RateLimit-Limit: 30
X-RateLimit-Remaining: 25
X-RateLimit-Reset: 1695127800
```

**Rate Limit Exceeded Response**:
```json
{
  "success": false,
  "error": "Rate limit exceeded",
  "code": "RATE_LIMIT_EXCEEDED",
  "details": {
    "limit": 30,
    "reset_time": "2025-09-19T14:45:00.000Z"
  }
}
```

## 🚨 Error Codes Reference

| Code | Description | Common Causes |
|------|-------------|---------------|
| `FILE_FORMAT_ERROR` | Invalid file format | Wrong file extension |
| `FILE_TOO_LARGE` | File exceeds size limit | File > 10MB |
| `PARSING_ERROR` | Excel parsing failed | Corrupted/invalid Excel |
| `COURSE_NOT_FOUND` | Course not in data | Wrong course code |
| `GROUP_NOT_FOUND` | Group not available | Invalid group number |
| `SPAN_VALIDATION_FAILED` | Course span mismatch | Data inconsistency |
| `TIME_CONFLICTS` | Schedule conflicts | Overlapping sessions |
| `INVALID_COURSE_FORMAT` | Wrong input format | Malformed course code |
| `EXPORT_FAILED` | Export generation failed | System error |
| `RATE_LIMIT_EXCEEDED` | Too many requests | Rate limit hit |

## 🧪 Testing with Postman

### Collection Import

Import the Postman collection for easy API testing:

```json
{
  "info": {
    "name": "HTI Scheduler API",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "item": [
    {
      "name": "Upload Excel",
      "request": {
        "method": "POST",
        "header": [],
        "body": {
          "mode": "formdata",
          "formdata": [
            {
              "key": "file",
              "type": "file",
              "src": "timetable.xlsx"
            }
          ]
        },
        "url": "{{base_url}}/api/excel/upload"
      }
    }
  ],
  "variable": [
    {
      "key": "base_url",
      "value": "http://localhost:5000"
    }
  ]
}
```

## 🔗 Related Documentation

- [Usage Guide](./05-usage-guide.md) - How to use the API
- [Backend Services](./08-backend-services.md) - Service implementation details
- [Testing Guide](./09-testing-guide.md) - Testing procedures
- [Troubleshooting](./10-troubleshooting.md) - Common API issues

---

*Complete API reference for the HTI Scheduler. Use this documentation to integrate with the schedule generation system.*
