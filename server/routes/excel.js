const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const ExcelParserServiceFinal = require('../services/ExcelParserServiceFinal');
const NormalizationService = require('../services/NormalizationService');

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads');
    try {
      await fs.mkdir(uploadDir, { recursive: true });
      cb(null, uploadDir);
    } catch (error) {
      cb(error);
    }
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, `schedule-${uniqueSuffix}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
      'application/vnd.ms-excel', // .xls
      'application/vnd.ms-excel.sheet.macroEnabled.12' // .xlsm
    ];
    
    if (allowedTypes.includes(file.mimetype) || 
        file.originalname.match(/\.(xlsx|xls|xlsm)$/i)) {
      cb(null, true);
    } else {
      cb(new Error('Only Excel files (.xlsx, .xls, .xlsm) are allowed'));
    }
  }
});

// Initialize services
const finalParserService = new ExcelParserServiceFinal();
const normalizationService = new NormalizationService();

/**
 * POST /api/excel/parse
 * Parse uploaded Excel file
 */
router.post('/parse', upload.single('excelFile'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        error: { message: 'No Excel file uploaded' }
      });
    }

    const { normalize = 'false', applyAdjustments = 'false' } = req.body;
    const shouldNormalize = normalize === 'true';
    const shouldApplyAdjustments = applyAdjustments === 'true';

    console.log(`📊 Parsing Excel file: ${req.file.originalname}`);
    
    // Parse the Excel file using the final parser
    const parseResult = await finalParserService.parseExcelFile(req.file.path);
    
    // The improved parser returns { course_groups, schedule_entries, span_statistics }
    // rather than { success, error } format
    if (!parseResult || !parseResult.course_groups) {
      // Clean up uploaded file
      await fs.unlink(req.file.path).catch(() => {});
      
      return res.status(400).json({
        error: { message: 'Excel parsing failed: Invalid result structure' }
      });
    }

    let normalizationResult = null;
    
    // Apply normalization if requested
    if (shouldNormalize && parseResult.course_groups.length > 0) {
      console.log('🔧 Applying normalization...');
      
      normalizationResult = await normalizationService.normalizeCourseGroups(
        parseResult.course_groups,
        { applyAdjustments: shouldApplyAdjustments }
      );
    }

    // Clean up uploaded file
    await fs.unlink(req.file.path).catch(() => {});

    const response = {
      success: true,
      data: {
        parsing: parseResult,
        normalization: normalizationResult,
        file_info: {
          original_name: req.file.originalname,
          size: req.file.size,
          uploaded_at: new Date().toISOString()
        }
      }
    };

    console.log(`✅ Successfully parsed ${parseResult.course_groups.length} course groups`);
    res.json(response);

  } catch (error) {
    console.error('Excel parsing error:', error);
    
    // Clean up uploaded file
    if (req.file) {
      await fs.unlink(req.file.path).catch(() => {});
    }
    
    res.status(500).json({
      error: { 
        message: 'Failed to parse Excel file',
        details: error.message 
      }
    });
  }
});

/**
 * POST /api/excel/normalize
 * Normalize existing course groups
 */
router.post('/normalize', async (req, res) => {
  try {
    const { course_groups, options = {} } = req.body;
    
    if (!course_groups || !Array.isArray(course_groups)) {
      return res.status(400).json({
        error: { message: 'Invalid course groups data' }
      });
    }

    console.log(`🔧 Normalizing ${course_groups.length} course groups`);
    
    const result = await normalizationService.normalizeCourseGroups(
      course_groups,
      options
    );
    
    if (!result.success) {
      return res.status(400).json({
        error: { message: result.error }
      });
    }

    console.log(`✅ Normalization completed`);
    res.json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('Normalization error:', error);
    res.status(500).json({
      error: {
        message: 'Failed to normalize course groups',
        details: error.message
      }
    });
  }
});

/**
 * GET /api/excel/canonical-spans
 * Get all canonical span definitions
 */
router.get('/canonical-spans', (req, res) => {
  try {
    const canonicalSpans = normalizationService.getAllCanonicalSpans();
    
    res.json({
      success: true,
      data: canonicalSpans
    });
  } catch (error) {
    res.status(500).json({
      error: {
        message: 'Failed to retrieve canonical spans',
        details: error.message
      }
    });
  }
});

/**
 * PUT /api/excel/canonical-spans/:courseCode
 * Update canonical spans for a specific course
 */
router.put('/canonical-spans/:courseCode', (req, res) => {
  try {
    const { courseCode } = req.params;
    const { lecture, lab, total } = req.body;
    
    if (typeof lecture !== 'number' || typeof lab !== 'number' || typeof total !== 'number') {
      return res.status(400).json({
        error: { message: 'Invalid span values. Must be numbers.' }
      });
    }
    
    if (lecture + lab !== total) {
      return res.status(400).json({
        error: { message: 'Lecture + Lab spans must equal total spans' }
      });
    }
    
    const spans = { lecture, lab, total };
    normalizationService.updateCanonicalSpans(courseCode, spans);
    
    res.json({
      success: true,
      data: {
        course_code: courseCode,
        spans
      }
    });
    
  } catch (error) {
    res.status(500).json({
      error: {
        message: 'Failed to update canonical spans',
        details: error.message
      }
    });
  }
});

/**
 * GET /api/excel/upload-stats
 * Get upload statistics
 */
router.get('/upload-stats', async (req, res) => {
  try {
    const uploadsDir = path.join(__dirname, '../uploads');
    
    let stats = {
      total_uploads: 0,
      total_size: 0,
      recent_uploads: []
    };
    
    try {
      const files = await fs.readdir(uploadsDir);
      stats.total_uploads = files.length;
      
      for (const file of files.slice(-10)) { // Last 10 files
        const filePath = path.join(uploadsDir, file);
        const fileStat = await fs.stat(filePath);
        stats.total_size += fileStat.size;
        stats.recent_uploads.push({
          filename: file,
          size: fileStat.size,
          uploaded_at: fileStat.birthtime
        });
      }
    } catch (error) {
      // Directory might not exist yet
    }
    
    res.json({
      success: true,
      data: stats
    });
    
  } catch (error) {
    res.status(500).json({
      error: {
        message: 'Failed to get upload statistics',
        details: error.message
      }
    });
  }
});

// Error handling middleware for multer
router.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        error: { message: 'File too large. Maximum size is 10MB.' }
      });
    }
    return res.status(400).json({
      error: { message: error.message }
    });
  }
  
  if (error.message.includes('Only Excel files')) {
    return res.status(400).json({
      error: { message: error.message }
    });
  }
  
  next(error);
});

module.exports = router;
