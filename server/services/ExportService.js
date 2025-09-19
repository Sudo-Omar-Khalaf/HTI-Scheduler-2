const ExcelJS = require('exceljs');
const path = require('path');
const fs = require('fs').promises;

/**
 * Export Service for generating Excel and CSV files from schedules
 */
class ExportService {
  constructor() {
    this.days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday'];
    this.timeSlots = [
      '8:00-9:00', '9:00-10:00', '10:00-11:00', '11:00-12:00',
      '12:00-1:00', '1:00-2:00', '2:00-3:00', '3:00-4:00'
    ];
  }

  /**
   * Export schedule to Excel format
   */
  async exportToExcel(scheduleCandidate, options = {}) {
    try {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Schedule', {
        pageSetup: { orientation: 'landscape' },
        properties: { rightToLeft: true } // RTL support for Arabic
      });

      // Set up the basic structure
      this.setupExcelHeaders(worksheet);
      this.populateExcelSchedule(worksheet, scheduleCandidate);
      this.formatExcelWorksheet(worksheet);
      
      // Add metadata sheet if requested
      if (options.includeMetadata) {
        this.addMetadataSheet(workbook, scheduleCandidate);
      }
      
      // Generate filename
      const filename = this.generateFilename(scheduleCandidate, 'xlsx');
      const filepath = path.join(__dirname, '../exports', filename);
      
      // Ensure exports directory exists
      await this.ensureDirectoryExists(path.dirname(filepath));
      
      // Write file
      await workbook.xlsx.writeFile(filepath);
      
      return {
        success: true,
        filename,
        filepath,
        size: (await fs.stat(filepath)).size
      };
      
    } catch (error) {
      console.error('Excel export error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Export schedule to CSV format
   */
  async exportToCSV(scheduleCandidate, options = {}) {
    try {
      const scheduleGrid = this.createScheduleGrid(scheduleCandidate);
      const csvContent = this.convertGridToCSV(scheduleGrid, options);
      
      const filename = this.generateFilename(scheduleCandidate, 'csv');
      const filepath = path.join(__dirname, '../exports', filename);
      
      await this.ensureDirectoryExists(path.dirname(filepath));
      await fs.writeFile(filepath, csvContent, 'utf8');
      
      return {
        success: true,
        filename,
        filepath,
        size: (await fs.stat(filepath)).size
      };
      
    } catch (error) {
      console.error('CSV export error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Setup Excel headers and structure
   */
  setupExcelHeaders(worksheet) {
    // Set column widths
    worksheet.getColumn(1).width = 15; // Time column
    for (let i = 2; i <= 6; i++) {
      worksheet.getColumn(i).width = 20; // Day columns
    }
    
    // Headers row
    worksheet.getCell('A1').value = 'Time / يوم';
    worksheet.getCell('B1').value = 'الأحد\nSunday';
    worksheet.getCell('C1').value = 'الاثنين\nMonday';
    worksheet.getCell('D1').value = 'الثلاثاء\nTuesday';
    worksheet.getCell('E1').value = 'الأربعاء\nWednesday';
    worksheet.getCell('F1').value = 'الخميس\nThursday';
    
    // Time slots column
    for (let i = 0; i < this.timeSlots.length; i++) {
      const row = i + 2;
      worksheet.getCell(`A${row}`).value = this.timeSlots[i];
    }
    
    // Style headers
    const headerRange = worksheet.getRow(1);
    headerRange.font = { bold: true, size: 12 };
    headerRange.alignment = { horizontal: 'center', vertical: 'middle' };
    headerRange.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' }
    };
    
    // Style time column
    const timeColumn = worksheet.getColumn(1);
    timeColumn.font = { bold: true };
    timeColumn.alignment = { horizontal: 'center', vertical: 'middle' };
    timeColumn.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFF0F0F0' }
    };
  }

  /**
   * Populate Excel worksheet with schedule data
   */
  populateExcelSchedule(worksheet, scheduleCandidate) {
    const scheduleGrid = this.createScheduleGrid(scheduleCandidate);
    
    // Fill schedule cells
    for (let dayIndex = 0; dayIndex < this.days.length; dayIndex++) {
      for (let slotIndex = 0; slotIndex < this.timeSlots.length; slotIndex++) {
        const cellData = scheduleGrid[dayIndex][slotIndex];
        if (cellData) {
          const cellRef = this.getCellReference(dayIndex + 2, slotIndex + 2); // B2 to F9
          const cell = worksheet.getCell(cellRef);
          
          // Set cell value
          cell.value = this.formatCellContent(cellData);
          
          // Handle merged cells for multi-slot sessions
          if (cellData.span > 1) {
            const endRow = slotIndex + cellData.span + 1;
            const mergeRange = `${cellRef}:${this.getCellReference(dayIndex + 2, endRow)}`;
            try {
              worksheet.mergeCells(mergeRange);
            } catch (e) {
              // Cell might already be merged
            }
          }
          
          // Style the cell
          this.styleScheduleCell(cell, cellData);
        }
      }
    }
  }

  /**
   * Create a 2D grid representation of the schedule
   */
  createScheduleGrid(scheduleCandidate) {
    const grid = Array(5).fill(null).map(() => Array(8).fill(null));
    
    for (const group of scheduleCandidate.selected_groups) {
      for (const session of group.sessions) {
        if (session.synthetic) continue;
        
        const dayIndex = this.days.indexOf(session.day);
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
          span: session.span,
          shared_groups: session.shared_groups
        };
        
        // Fill all slots covered by this session
        for (let i = 0; i < session.span && slotIndex + i < 8; i++) {
          grid[dayIndex][slotIndex + i] = cellData;
        }
      }
    }
    
    return grid;
  }

  /**
   * Format cell content for display
   */
  formatCellContent(cellData) {
    const lines = [];
    
    // Course code and group
    lines.push(`${cellData.course_code} - G${cellData.group_code}`);
    
    // Course name (Arabic)
    if (cellData.course_name) {
      lines.push(cellData.course_name);
    }
    
    // Session type
    lines.push(`(${cellData.session_type})`);
    
    // Room
    if (cellData.room) {
      lines.push(`Room: ${cellData.room}`);
    }
    
    // Professor
    if (cellData.professor) {
      lines.push(`Dr. ${cellData.professor}`);
    }
    
    return lines.join('\n');
  }

  /**
   * Style schedule cells based on session type
   */
  styleScheduleCell(cell, cellData) {
    // Base styling
    cell.alignment = { 
      horizontal: 'center', 
      vertical: 'middle',
      wrapText: true 
    };
    cell.border = {
      top: { style: 'thin' },
      left: { style: 'thin' },
      bottom: { style: 'thin' },
      right: { style: 'thin' }
    };
    
    // Color coding by session type
    const colors = {
      lecture: 'FFB3E5FC', // Light blue
      lab: 'FFC8E6C9',     // Light green
      unknown: 'FFFFF3E0' // Light orange
    };
    
    const color = colors[cellData.session_type] || colors.unknown;
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: color }
    };
    
    // Shared session indicator
    if (cellData.shared_groups && cellData.shared_groups.length > 1) {
      cell.font = { bold: true };
    }
  }

  /**
   * Format Excel worksheet
   */
  formatExcelWorksheet(worksheet) {
    // Set row heights
    for (let i = 2; i <= 9; i++) {
      worksheet.getRow(i).height = 60;
    }
    
    // Add borders to the entire table
    const tableRange = 'A1:F9';
    const range = worksheet.getCell(tableRange);
    
    // Freeze header row and time column
    worksheet.views = [
      { state: 'frozen', xSplit: 1, ySplit: 1 }
    ];
  }

  /**
   * Add metadata sheet with detailed information
   */
  addMetadataSheet(workbook, scheduleCandidate) {
    const metaSheet = workbook.addWorksheet('Metadata');
    
    let row = 1;
    
    // Schedule summary
    metaSheet.getCell(`A${row}`).value = 'Schedule Summary';
    metaSheet.getCell(`A${row}`).font = { bold: true, size: 14 };
    row += 2;
    
    metaSheet.getCell(`A${row}`).value = 'Schedule ID:';
    metaSheet.getCell(`B${row}`).value = scheduleCandidate.id;
    row++;
    
    metaSheet.getCell(`A${row}`).value = 'Total Credits:';
    metaSheet.getCell(`B${row}`).value = scheduleCandidate.total_credits;
    row++;
    
    metaSheet.getCell(`A${row}`).value = 'Total Courses:';
    metaSheet.getCell(`B${row}`).value = scheduleCandidate.selected_groups.length;
    row++;
    
    metaSheet.getCell(`A${row}`).value = 'Score:';
    metaSheet.getCell(`B${row}`).value = scheduleCandidate.score;
    row += 2;
    
    // Course details
    metaSheet.getCell(`A${row}`).value = 'Course Details';
    metaSheet.getCell(`A${row}`).font = { bold: true, size: 12 };
    row++;
    
    metaSheet.getCell(`A${row}`).value = 'Course Code';
    metaSheet.getCell(`B${row}`).value = 'Group';
    metaSheet.getCell(`C${row}`).value = 'Course Name';
    metaSheet.getCell(`D${row}`).value = 'Total Sessions';
    metaSheet.getCell(`E${row}`).value = 'Lecture Sessions';
    metaSheet.getCell(`F${row}`).value = 'Lab Sessions';
    
    const headerRow = metaSheet.getRow(row);
    headerRow.font = { bold: true };
    row++;
    
    for (const group of scheduleCandidate.selected_groups) {
      metaSheet.getCell(`A${row}`).value = group.course_code;
      metaSheet.getCell(`B${row}`).value = group.group_code;
      metaSheet.getCell(`C${row}`).value = group.sessions[0]?.course_name || '';
      metaSheet.getCell(`D${row}`).value = group.sessions.length;
      metaSheet.getCell(`E${row}`).value = group.getLectureSessions().length;
      metaSheet.getCell(`F${row}`).value = group.getLabSessions().length;
      row++;
    }
    
    // Omitted courses
    if (scheduleCandidate.omitted_courses.length > 0) {
      row += 2;
      metaSheet.getCell(`A${row}`).value = 'Omitted Courses';
      metaSheet.getCell(`A${row}`).font = { bold: true, size: 12 };
      row++;
      
      for (const omitted of scheduleCandidate.omitted_courses) {
        metaSheet.getCell(`A${row}`).value = omitted.course_code;
        metaSheet.getCell(`B${row}`).value = omitted.reason;
        row++;
      }
    }
    
    // Auto-fit columns
    metaSheet.columns.forEach(column => {
      column.width = 15;
    });
  }

  /**
   * Convert schedule grid to CSV format
   */
  convertGridToCSV(scheduleGrid, options = {}) {
    const rows = [];
    
    // Header row
    const headers = ['Time', ...this.days];
    rows.push(headers.join(','));
    
    // Data rows
    for (let slotIndex = 0; slotIndex < this.timeSlots.length; slotIndex++) {
      const row = [this.timeSlots[slotIndex]];
      
      for (let dayIndex = 0; dayIndex < this.days.length; dayIndex++) {
        const cellData = scheduleGrid[dayIndex][slotIndex];
        if (cellData) {
          const cellText = this.formatCellContentForCSV(cellData);
          row.push(`"${cellText}"`);
        } else {
          row.push('');
        }
      }
      
      rows.push(row.join(','));
    }
    
    return rows.join('\n');
  }

  /**
   * Format cell content for CSV export
   */
  formatCellContentForCSV(cellData) {
    const parts = [
      `${cellData.course_code}-G${cellData.group_code}`,
      cellData.course_name,
      `(${cellData.session_type})`
    ];
    
    if (cellData.room) parts.push(`Room: ${cellData.room}`);
    if (cellData.professor) parts.push(`Dr. ${cellData.professor}`);
    
    return parts.filter(p => p).join(' | ');
  }

  /**
   * Generate filename for exports
   */
  generateFilename(scheduleCandidate, extension) {
    const timestamp = new Date().toISOString().slice(0, 19).replace(/[:.]/g, '-');
    return `schedule_${scheduleCandidate.id}_${timestamp}.${extension}`;
  }

  /**
   * Get Excel cell reference (e.g., B2, C3)
   */
  getCellReference(col, row) {
    const colLetter = String.fromCharCode(64 + col); // A=65, B=66, etc.
    return `${colLetter}${row}`;
  }

  /**
   * Ensure directory exists
   */
  async ensureDirectoryExists(dirPath) {
    try {
      await fs.mkdir(dirPath, { recursive: true });
    } catch (error) {
      // Directory might already exist
    }
  }

  /**
   * Get export statistics
   */
  async getExportStatistics() {
    try {
      const exportsDir = path.join(__dirname, '../exports');
      const files = await fs.readdir(exportsDir);
      
      const stats = {
        total_files: files.length,
        excel_files: files.filter(f => f.endsWith('.xlsx')).length,
        csv_files: files.filter(f => f.endsWith('.csv')).length,
        recent_files: []
      };
      
      // Get recent files with stats
      for (const file of files.slice(-10)) {
        const filePath = path.join(exportsDir, file);
        const stat = await fs.stat(filePath);
        stats.recent_files.push({
          filename: file,
          size: stat.size,
          created: stat.birthtime,
          modified: stat.mtime
        });
      }
      
      return stats;
    } catch (error) {
      return {
        total_files: 0,
        excel_files: 0,
        csv_files: 0,
        recent_files: []
      };
    }
  }
}

module.exports = ExportService;
