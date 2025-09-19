import axios from 'axios'

const api = axios.create({
  baseURL: 'http://localhost:5000/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor for logging
api.interceptors.request.use(
  (config) => {
    console.log(`🚀 API Request: ${config.method?.toUpperCase()} ${config.url}`)
    return config
  },
  (error) => {
    console.error('❌ API Request Error:', error)
    return Promise.reject(error)
  }
)

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    console.log(`✅ API Response: ${response.config.method?.toUpperCase()} ${response.config.url}`)
    return response
  },
  (error) => {
    console.error('❌ API Response Error:', error.response?.data || error.message)
    
    // Handle specific error cases
    if (error.response?.status === 413) {
      throw new Error('ملف كبير جداً. الحد الأقصى للحجم هو 10 ميجابايت')
    }
    
    if (error.response?.status === 415) {
      throw new Error('نوع الملف غير مدعوم. يُرجى رفع ملف Excel فقط')
    }
    
    if (error.code === 'ECONNABORTED') {
      throw new Error('انتهت مهلة الاتصال. يُرجى المحاولة مرة أخرى')
    }
    
    throw error
  }
)

// API endpoints
export const excelAPI = {
  // Parse Excel file
  parseFile: (formData, options = {}) => {
    return api.post('/excel/parse', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      ...options
    })
  },

  // Normalize course groups
  normalize: (courseGroups, options = {}) => {
    return api.post('/excel/normalize', {
      course_groups: courseGroups,
      options
    })
  },

  // Get canonical spans
  getCanonicalSpans: () => {
    return api.get('/excel/canonical-spans')
  },

  // Update canonical spans
  updateCanonicalSpans: (courseCode, spans) => {
    return api.put(`/excel/canonical-spans/${courseCode}`, spans)
  },

  // Get upload statistics
  getUploadStats: () => {
    return api.get('/excel/upload-stats')
  }
}

export const scheduleAPI = {
  // Generate schedules
  generate: (courseGroups, userRequest, options = {}) => {
    return api.post('/schedule/generate', {
      course_groups: courseGroups,
      user_request: userRequest,
      options
    })
  },

  // Generate personalized weekly schedule
  generatePersonalized: (courseGroups, userRequest, options = {}) => {
    return api.post('/schedule/generate-personalized', {
      course_groups: courseGroups,
      user_request: userRequest,
      options
    })
  },

  // Validate course groups
  validateGroups: (courseGroups) => {
    return api.post('/schedule/validate-groups', {
      course_groups: courseGroups
    })
  },

  // Analyze schedule
  analyze: (scheduleCandidate, courseGroups = []) => {
    return api.post('/schedule/analyze', {
      schedule_candidate: scheduleCandidate,
      course_groups: courseGroups
    })
  },

  // Get time slots configuration
  getTimeSlots: () => {
    return api.get('/schedule/time-slots')
  },

  // Optimize schedule
  optimize: (scheduleCandidate, criteria = {}) => {
    return api.post('/schedule/optimize', {
      schedule_candidate: scheduleCandidate,
      optimization_criteria: criteria
    })
  },

  // Get statistics
  getStatistics: () => {
    return api.get('/schedule/statistics')
  }
}

export const exportAPI = {
  // Export to Excel
  exportExcel: (scheduleCandidate, options = {}) => {
    return api.post('/export/excel', {
      schedule_candidate: scheduleCandidate,
      options
    }, {
      responseType: 'blob'
    })
  },

  // Export to CSV
  exportCSV: (scheduleCandidate, options = {}) => {
    return api.post('/export/csv', {
      schedule_candidate: scheduleCandidate,
      options
    }, {
      responseType: 'blob'
    })
  },

  // Bulk export
  exportBulk: (scheduleCandidates, format = 'excel', options = {}) => {
    return api.post('/export/bulk', {
      schedule_candidates: scheduleCandidates,
      format,
      options
    }, {
      responseType: 'blob'
    })
  },

  // Get supported formats
  getFormats: () => {
    return api.get('/export/formats')
  },

  // Get export statistics
  getStatistics: () => {
    return api.get('/export/statistics')
  },

  // Get export preview
  getPreview: (scheduleCandidate) => {
    return api.post('/export/preview', {
      schedule_candidate: scheduleCandidate
    })
  },

  // Clean up old files
  cleanup: (olderThanDays = 7) => {
    return api.delete('/export/cleanup', {
      params: { older_than_days: olderThanDays }
    })
  }
}

// Utility functions
export const downloadFile = (blob, filename) => {
  const url = window.URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  window.URL.revokeObjectURL(url)
}

export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

export const formatDate = (date) => {
  return new Intl.DateTimeFormat('ar-SA', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date(date))
}

// Simplified API methods used by components
const apiMethods = {
  parseExcel: excelAPI.parseFile,
  normalizeData: excelAPI.normalize,
  generateSchedules: (data) => scheduleAPI.generate(data.courseGroups, data.preferences),
  exportSchedule: (data) => {
    if (data.format === 'excel') {
      return exportAPI.exportExcel(data.schedule, data.options)
    } else {
      return exportAPI.exportCSV(data.schedule, data.options)
    }
  }
}

// Merge with default export
Object.assign(api, apiMethods)

export default api
