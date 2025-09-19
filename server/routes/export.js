const express = require('express');
const path = require('path');
const ExportService = require('../services/ExportService');

const router = express.Router();
const exportService = new ExportService();

/**
 * POST /api/export/excel
 * Export schedule to Excel format
 */
router.post('/excel', async (req, res) => {
  try {
    const { schedule_candidate, options = {} } = req.body;
    
    if (!schedule_candidate) {
      return res.status(400).json({
        error: { message: 'Schedule candidate is required' }
      });
    }
    
    if (!schedule_candidate.selected_groups || schedule_candidate.selected_groups.length === 0) {
      return res.status(400).json({
        error: { message: 'Schedule candidate must have selected groups' }
      });
    }
    
    console.log(`📊 Exporting schedule ${schedule_candidate.id} to Excel`);
    
    const result = await exportService.exportToExcel(schedule_candidate, options);
    
    if (!result.success) {
      return res.status(500).json({
        error: { message: result.error }
      });
    }
    
    console.log(`✅ Excel export completed: ${result.filename}`);
    
    // Send file as download
    res.download(result.filepath, result.filename, (err) => {
      if (err) {
        console.error('File download error:', err);
        if (!res.headersSent) {
          res.status(500).json({
            error: { message: 'Failed to download file' }
          });
        }
      }
    });
    
  } catch (error) {
    console.error('Excel export error:', error);
    res.status(500).json({
      error: {
        message: 'Failed to export to Excel',
        details: error.message
      }
    });
  }
});

/**
 * POST /api/export/csv
 * Export schedule to CSV format
 */
router.post('/csv', async (req, res) => {
  try {
    const { schedule_candidate, options = {} } = req.body;
    
    if (!schedule_candidate) {
      return res.status(400).json({
        error: { message: 'Schedule candidate is required' }
      });
    }
    
    if (!schedule_candidate.selected_groups || schedule_candidate.selected_groups.length === 0) {
      return res.status(400).json({
        error: { message: 'Schedule candidate must have selected groups' }
      });
    }
    
    console.log(`📄 Exporting schedule ${schedule_candidate.id} to CSV`);
    
    const result = await exportService.exportToCSV(schedule_candidate, options);
    
    if (!result.success) {
      return res.status(500).json({
        error: { message: result.error }
      });
    }
    
    console.log(`✅ CSV export completed: ${result.filename}`);
    
    // Send file as download
    res.download(result.filepath, result.filename, (err) => {
      if (err) {
        console.error('File download error:', err);
        if (!res.headersSent) {
          res.status(500).json({
            error: { message: 'Failed to download file' }
          });
        }
      }
    });
    
  } catch (error) {
    console.error('CSV export error:', error);
    res.status(500).json({
      error: {
        message: 'Failed to export to CSV',
        details: error.message
      }
    });
  }
});

/**
 * POST /api/export/bulk
 * Export multiple schedules in a single ZIP file
 */
router.post('/bulk', async (req, res) => {
  try {
    const { schedule_candidates, format = 'excel', options = {} } = req.body;
    
    if (!schedule_candidates || !Array.isArray(schedule_candidates)) {
      return res.status(400).json({
        error: { message: 'Schedule candidates array is required' }
      });
    }
    
    if (schedule_candidates.length === 0) {
      return res.status(400).json({
        error: { message: 'At least one schedule candidate is required' }
      });
    }
    
    console.log(`📦 Bulk exporting ${schedule_candidates.length} schedules in ${format} format`);
    
    const archiver = require('archiver');
    const archive = archiver('zip', { zlib: { level: 9 } });
    
    // Set response headers for ZIP download
    const timestamp = new Date().toISOString().slice(0, 19).replace(/[:.]/g, '-');
    const zipFilename = `schedules_bulk_${timestamp}.zip`;
    
    res.attachment(zipFilename);
    archive.pipe(res);
    
    // Export each schedule and add to archive
    for (const candidate of schedule_candidates) {
      try {
        let result;
        if (format === 'csv') {
          result = await exportService.exportToCSV(candidate, options);
        } else {
          result = await exportService.exportToExcel(candidate, options);
        }
        
        if (result.success) {
          archive.file(result.filepath, { name: result.filename });
        }
      } catch (exportError) {
        console.error(`Failed to export schedule ${candidate.id}:`, exportError);
      }
    }
    
    // Finalize the archive
    archive.finalize();
    
    console.log(`✅ Bulk export completed: ${zipFilename}`);
    
  } catch (error) {
    console.error('Bulk export error:', error);
    res.status(500).json({
      error: {
        message: 'Failed to perform bulk export',
        details: error.message
      }
    });
  }
});

/**
 * GET /api/export/formats
 * Get supported export formats
 */
router.get('/formats', (req, res) => {
  const formats = {
    excel: {
      format: 'excel',
      extension: 'xlsx',
      mime_type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      description: 'Excel format with formatting, merged cells, and metadata',
      features: ['formatting', 'merged_cells', 'metadata_sheet', 'rtl_support']
    },
    csv: {
      format: 'csv',
      extension: 'csv',
      mime_type: 'text/csv',
      description: 'Comma-separated values format for simple data import',
      features: ['simple_format', 'universal_compatibility']
    }
  };
  
  res.json({
    success: true,
    data: {
      supported_formats: formats,
      default_format: 'excel',
      bulk_export_supported: true
    }
  });
});

/**
 * GET /api/export/statistics
 * Get export statistics
 */
router.get('/statistics', async (req, res) => {
  try {
    const stats = await exportService.getExportStatistics();
    
    res.json({
      success: true,
      data: stats
    });
    
  } catch (error) {
    console.error('Export statistics error:', error);
    res.status(500).json({
      error: {
        message: 'Failed to get export statistics',
        details: error.message
      }
    });
  }
});

/**
 * GET /api/export/preview/:scheduleId
 * Get a preview of how the schedule will look when exported
 */
router.post('/preview', async (req, res) => {
  try {
    const { schedule_candidate } = req.body;
    
    if (!schedule_candidate) {
      return res.status(400).json({
        error: { message: 'Schedule candidate is required' }
      });
    }
    
    // Create a simplified grid representation for preview
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday'];
    const timeSlots = [
      '8:00-9:00', '9:00-10:00', '10:00-11:00', '11:00-12:00',
      '12:00-1:00', '1:00-2:00', '2:00-3:00', '3:00-4:00'
    ];
    
    const grid = Array(5).fill(null).map(() => Array(8).fill(null));
    
    // Populate grid
    for (const group of schedule_candidate.selected_groups) {
      for (const session of group.sessions) {
        if (session.synthetic) continue;
        
        const dayIndex = days.indexOf(session.day);
        if (dayIndex === -1) continue;
        
        const slotIndex = session.slot - 1;
        if (slotIndex < 0 || slotIndex >= 8) continue;
        
        const cellData = {
          course_code: group.course_code,
          group_code: group.group_code,
          course_name: session.course_name,
          session_type: session.session_type,
          room: session.room,
          professor: session.professor,
          span: session.span
        };
        
        // Fill all slots covered by this session
        for (let i = 0; i < session.span && slotIndex + i < 8; i++) {
          grid[dayIndex][slotIndex + i] = cellData;
        }
      }
    }
    
    const preview = {
      schedule_id: schedule_candidate.id,
      days,
      time_slots: timeSlots,
      grid,
      metadata: {
        total_courses: schedule_candidate.selected_groups.length,
        total_credits: schedule_candidate.total_credits,
        score: schedule_candidate.score,
        omitted_courses: schedule_candidate.omitted_courses || []
      }
    };
    
    res.json({
      success: true,
      data: preview
    });
    
  } catch (error) {
    console.error('Export preview error:', error);
    res.status(500).json({
      error: {
        message: 'Failed to generate export preview',
        details: error.message
      }
    });
  }
});

/**
 * DELETE /api/export/cleanup
 * Clean up old export files
 */
router.delete('/cleanup', async (req, res) => {
  try {
    const { older_than_days = 7 } = req.query;
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - parseInt(older_than_days));
    
    const exportsDir = path.join(__dirname, '../exports');
    const fs = require('fs').promises;
    
    let deletedFiles = 0;
    let freedSpace = 0;
    
    try {
      const files = await fs.readdir(exportsDir);
      
      for (const file of files) {
        const filePath = path.join(exportsDir, file);
        const stat = await fs.stat(filePath);
        
        if (stat.mtime < cutoffDate) {
          freedSpace += stat.size;
          await fs.unlink(filePath);
          deletedFiles++;
        }
      }
    } catch (error) {
      // Directory might not exist
    }
    
    console.log(`🧹 Cleanup completed: ${deletedFiles} files deleted, ${freedSpace} bytes freed`);
    
    res.json({
      success: true,
      data: {
        deleted_files: deletedFiles,
        freed_space_bytes: freedSpace,
        freed_space_mb: Math.round(freedSpace / (1024 * 1024) * 100) / 100,
        cutoff_date: cutoffDate.toISOString()
      }
    });
    
  } catch (error) {
    console.error('Cleanup error:', error);
    res.status(500).json({
      error: {
        message: 'Failed to clean up export files',
        details: error.message
      }
    });
  }
});

module.exports = router;
