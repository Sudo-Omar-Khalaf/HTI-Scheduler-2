const XLSX = require('xlsx');
const { CourseGroup, Session } = require('../models');

/**
 * Final Excel Parser Service - Accurate implementation for Arabic university timetable
 * Based on detailed analysis of the Excel structure:
 * - Columns C-J (1-8) represent 45-minute time intervals
 * - Each course block spans 3 rows and 1-3 columns
 * - Row 1: Course code + groups (e.g., "EEC 12305,06")
 * - Row 2: Course name in Arabic
 * - Row 3: Hall number (C501) and/or professor name
 */
class ExcelParserServiceFinal {
  constructor() {
    // Time slots mapping (columns C-J correspond to 1-8)
    this.timeSlots = [
      { column: 1, time: '9.00 - 9.45', excelCol: 'C' },
      { column: 2, time: '9.45 - 10.30', excelCol: 'D' },
      { column: 3, time: '10.40 - 11.25', excelCol: 'E' },
      { column: 4, time: '11.25 - 12.10', excelCol: 'F' },
      { column: 5, time: '12.20 - 1.05', excelCol: 'G' },
      { column: 6, time: '1.05 - 1.50', excelCol: 'H' },
      { column: 7, time: '2.00 - 2.45', excelCol: 'I' },
      { column: 8, time: '2.45 - 3.30', excelCol: 'J' }
    ];
    
    // Day mapping
    this.arabicDays = {
      'السبت': 'Saturday',
      'الأحد': 'Sunday', 
      'الاثنين': 'Monday',
      'الثلاثاء': 'Tuesday',
      'الأربعاء': 'Wednesday',
      'الخميس': 'Thursday',
      'الجمعة': 'Friday'
    };
    
    // Regex patterns
    this.courseCodePattern = /^([A-Z]{2,4})\s*(\d{3})$/;
    this.sharedGroupPattern = /^([A-Z]{2,4})\s*(\d{3})(\d{2}),(\d{2})$/;
    this.singleCourseWithRoomPattern = /^([A-Z]{2,4})\s*(\d{3})(\d{2})\s+(C\d{3,4})$/;
    this.roomPattern = /C\d{3,4}/;
    
    // Track course spans for validation
    this.courseSpanTracker = new Map();
    this.processedBlocks = new Set();
  }

  /**
   * Parse Excel file
   */
  async parseExcelFile(filePath, options = {}) {
    try {
      console.log('📖 Reading Excel file with final parser...');
      
      // Reset state for each new parse operation
      this.courseSpanTracker = new Map();
      this.processedBlocks = new Set();
      
      // Check if file exists
      const fs = require('fs');
      if (!fs.existsSync(filePath)) {
        throw new Error(`File does not exist: ${filePath}`);
      }
      
      const workbook = XLSX.readFile(filePath);
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      
      const rawData = XLSX.utils.sheet_to_json(worksheet, { 
        header: 1, 
        defval: '' 
      });

      console.log('🔍 Detecting schedule blocks...');
      const scheduleEntries = this.detectAllCourseBlocks(rawData);
      
      console.log(`📊 Found ${scheduleEntries.length} schedule entries`);
      
      // Group sessions by course and group
      const groupedSessions = this.groupSessionsByCourseGroup(scheduleEntries);
      
      // Validate span consistency
      this.validateSpanConsistency();
      
      return {
        course_groups: groupedSessions,
        schedule_entries: scheduleEntries,
        span_statistics: this.getSpanStatistics(),
        parsing_summary: this.getParsingSummary(scheduleEntries)
      };
      
    } catch (error) {
      console.error('❌ Error parsing Excel file:', error);
      throw error;
    }
  }

  /**
   * Detect all course blocks in the Excel data
   */
  detectAllCourseBlocks(rawData) {
    const scheduleEntries = [];
    let currentDay = null;
    
    for (let rowIndex = 0; rowIndex < rawData.length; rowIndex++) {
      const row = rawData[rowIndex];
      
      // Check for day name in column A (index 0)
      const dayCell = String(row[0] || '').trim();
      const foundDay = this.findDayName(dayCell);
      if (foundDay) {
        currentDay = foundDay;
        console.log(`📅 Day: ${dayCell} → ${foundDay} (Row ${rowIndex})`);
        continue;
      }
      
      // Skip if no current day
      if (!currentDay) continue;
      
      // Check each time slot column (C-J = indices 2-9)
      for (let colIndex = 2; colIndex <= 9; colIndex++) {
        const timeSlotIndex = colIndex - 2; // Convert to 0-based index for timeSlots array
        const timeSlot = this.timeSlots[timeSlotIndex];
        
        if (!timeSlot) continue;
        
        // Check if this position is already processed
        const blockId = `${rowIndex}-${colIndex}`;
        if (this.processedBlocks.has(blockId)) continue;
        
        // Try to detect a course block starting at this position
        const courseBlock = this.detectCourseBlock(rawData, rowIndex, colIndex);
        
        if (courseBlock) {
          // Mark all cells in this block as processed
          this.markBlockAsProcessed(rowIndex, colIndex, courseBlock.span);
          
          // Create schedule entries for this block
          const entries = this.createScheduleEntries(courseBlock, currentDay, timeSlot);
          scheduleEntries.push(...entries);
          
          console.log(`🎯 Block at (${rowIndex},${colIndex}): ${courseBlock.courseCode} Groups: [${courseBlock.groups.join(',')}] Span: ${courseBlock.span}`);
        }
      }
    }
    
    return scheduleEntries;
  }

  /**
   * Detect a single course block starting at the given position
   */
  detectCourseBlock(rawData, startRow, startCol) {
    const cellValue = String(rawData[startRow][startCol] || '').trim();
    if (!cellValue) return null;
    
    // Parse the cell value to extract course information
    const courseInfo = this.parseCourseCell(cellValue);
    if (!courseInfo) return null;
    
    // Calculate horizontal span (how many columns this block occupies)
    const span = this.calculateHorizontalSpan(rawData, startRow, startCol);
    
    // Extract course name from row 2 of the block
    const courseName = this.extractCourseName(rawData, startRow + 1, startCol, span);
    
    // Extract room and instructor from row 3 of the block
    const { room, instructor } = this.extractRoomAndInstructor(rawData, startRow + 2, startCol, span, cellValue);
    
    // Track span for this course
    this.trackCourseSpan(courseInfo.courseCode, span);
    
    return {
      courseCode: courseInfo.courseCode,
      groups: courseInfo.groups,
      courseName: courseName,
      room: room,
      instructor: instructor,
      span: span,
      startRow: startRow,
      startCol: startCol
    };
  }

  /**
   * Parse course cell to extract course code and groups
   */
  parseCourseCell(cellValue) {
    // Pattern 1: "EEC 12305,06" (shared groups)
    const sharedMatch = cellValue.match(this.sharedGroupPattern);
    if (sharedMatch) {
      const [, dept, courseNum, group1, group2] = sharedMatch;
      return {
        courseCode: `${dept} ${courseNum}`,
        groups: [group1, group2]
      };
    }
    
    // Pattern 2: "EEC 11302 C401" (single course with room)
    const singleWithRoomMatch = cellValue.match(this.singleCourseWithRoomPattern);
    if (singleWithRoomMatch) {
      const [, dept, courseNum, group] = singleWithRoomMatch;
      return {
        courseCode: `${dept} ${courseNum}`,
        groups: [group]
      };
    }
    
    // Pattern 3: "EEC 11201" (basic course code, extract group from last 2 digits)
    const basicMatch = cellValue.match(this.courseCodePattern);
    if (basicMatch) {
      const [, dept, courseNum] = basicMatch;
      // For courses like "EEC 113", the group is the last 2 digits of courseNum
      const group = courseNum.slice(-2);
      return {
        courseCode: `${dept} ${courseNum}`,
        groups: [group]
      };
    }
    
    // Pattern 4: Try to extract any course code pattern
    const fallbackMatch = cellValue.match(/([A-Z]{2,4})\s*(\d{3,5})/);
    if (fallbackMatch) {
      const courseCode = fallbackMatch[0].replace(/\s+/g, ' ');
      // Extract group from the numeric part
      const numericPart = fallbackMatch[2];
      const group = numericPart.slice(-2);
      return {
        courseCode: courseCode,
        groups: [group]
      };
    }
    
    return null;
  }

  /**
   * Calculate horizontal span of a course block
   */
  calculateHorizontalSpan(rawData, startRow, startCol) {
    let span = 1;
    
    // Check up to 3 columns to the right
    for (let colOffset = 1; colOffset <= 3; colOffset++) {
      const checkCol = startCol + colOffset;
      if (checkCol >= rawData[startRow].length) break;
      
      const cellValue = String(rawData[startRow][checkCol] || '').trim();
      
      // If the cell is empty or contains only room/instructor info, it's part of the span
      if (!cellValue || this.roomPattern.test(cellValue) || this.isInstructorInfo(cellValue)) {
        span++;
      } else {
        // If we find another course code, stop
        if (this.courseCodePattern.test(cellValue) || this.sharedGroupPattern.test(cellValue)) {
          break;
        }
        span++;
      }
    }
    
    return span;
  }

  /**
   * Extract course name from the second row of a block
   */
  extractCourseName(rawData, row, startCol, span) {
    if (row >= rawData.length) return '';
    
    for (let colOffset = 0; colOffset < span; colOffset++) {
      const col = startCol + colOffset;
      if (col >= rawData[row].length) continue;
      
      const cellValue = String(rawData[row][col] || '').trim();
      
      // Arabic course name should not contain course codes or room numbers
      if (cellValue && 
          !this.courseCodePattern.test(cellValue) && 
          !this.roomPattern.test(cellValue) &&
          !cellValue.match(/^[A-Z]{2,4}\s*\d/)) {
        return cellValue;
      }
    }
    
    return '';
  }

  /**
   * Extract room and instructor from the third row of a block
   */
  extractRoomAndInstructor(rawData, row, startCol, span, originalCell) {
    let room = '';
    let instructor = '';
    
    // First, check if room is in the original cell (row 1)
    const roomInOriginal = originalCell.match(this.roomPattern);
    if (roomInOriginal) {
      room = roomInOriginal[0];
    }
    
    // Check row 3 for additional info
    if (row < rawData.length) {
      for (let colOffset = 0; colOffset < span; colOffset++) {
        const col = startCol + colOffset;
        if (col >= rawData[row].length) continue;
        
        const cellValue = String(rawData[row][col] || '').trim();
        if (!cellValue) continue;
        
        // Extract room number
        if (!room) {
          const roomMatch = cellValue.match(this.roomPattern);
          if (roomMatch) {
            room = roomMatch[0];
          }
        }
        
        // Extract instructor (any remaining Arabic text)
        if (!instructor && 
            !this.roomPattern.test(cellValue) && 
            !this.courseCodePattern.test(cellValue)) {
          instructor = cellValue;
        }
      }
    }
    
    return { room, instructor };
  }

  /**
   * Check if text looks like instructor information
   */
  isInstructorInfo(text) {
    // Arabic text that doesn't contain course codes or room numbers
    return text.includes('م.') || 
           text.includes('د.') || 
           text.includes('أ.') ||
           (text.length > 5 && !this.roomPattern.test(text) && !this.courseCodePattern.test(text));
  }

  /**
   * Find day name in a cell
   */
  findDayName(cellValue) {
    for (const [arabicDay, englishDay] of Object.entries(this.arabicDays)) {
      if (cellValue.includes(arabicDay)) {
        return englishDay;
      }
    }
    return null;
  }

  /**
   * Mark a block and its span as processed
   */
  markBlockAsProcessed(startRow, startCol, span) {
    for (let rowOffset = 0; rowOffset < 3; rowOffset++) {
      for (let colOffset = 0; colOffset < span; colOffset++) {
        const blockId = `${startRow + rowOffset}-${startCol + colOffset}`;
        this.processedBlocks.add(blockId);
      }
    }
  }

  /**
   * Create schedule entries from a course block
   */
  createScheduleEntries(courseBlock, day, timeSlot) {
    const entries = [];
    
    for (const group of courseBlock.groups) {
      const sessionType = this.determineSessionType(courseBlock.courseName, courseBlock.room, courseBlock.groups);
      
      entries.push({
        course_code: courseBlock.courseCode,
        group_code: group.padStart(2, '0'),
        course_name: courseBlock.courseName,
        instructor: courseBlock.instructor,
        location: courseBlock.room,
        day_of_week: day,
        start_time: timeSlot.time.split(' - ')[0],
        end_time: timeSlot.time.split(' - ')[1],
        session_type: sessionType,
        time_slot: timeSlot.column,
        span: courseBlock.span,
        shared_groups: courseBlock.groups.length > 1 ? courseBlock.groups : []
      });
    }
    
    return entries;
  }

  /**
   * Determine session type (lecture vs lab)
   */
  determineSessionType(courseName, room, groups) {
    // Labs are typically indicated by smaller room numbers or specific patterns
    if (room && room.match(/C(3|4|5)\d{2}/)) {
      return groups.length > 1 ? 'lecture' : 'lab';
    }
    return groups.length > 1 ? 'lecture' : 'lab';
  }

  /**
   * Track course span for consistency validation
   */
  trackCourseSpan(courseCode, span) {
    if (!this.courseSpanTracker.has(courseCode)) {
      this.courseSpanTracker.set(courseCode, new Set());
    }
    this.courseSpanTracker.get(courseCode).add(span);
  }

  /**
   * Validate span consistency across all course groups
   */
  validateSpanConsistency() {
    const inconsistentCourses = [];
    
    for (const [courseCode, spans] of this.courseSpanTracker.entries()) {
      if (spans.size > 1) {
        inconsistentCourses.push({
          courseCode,
          spans: Array.from(spans),
          spanCount: spans.size
        });
      }
    }
    
    if (inconsistentCourses.length > 0) {
      console.log('⚠️ Courses with inconsistent spans:');
      inconsistentCourses.forEach(course => {
        console.log(`   ${course.courseCode}: spans ${course.spans.join(', ')}`);
      });
    }
    
    return inconsistentCourses;
  }

  /**
   * Group sessions by course and group
   */
  groupSessionsByCourseGroup(scheduleEntries) {
    const groupMap = new Map();
    
    for (const entry of scheduleEntries) {
      const key = `${entry.course_code}-${entry.group_code}`;
      
      if (!groupMap.has(key)) {
        groupMap.set(key, {
          course_code: entry.course_code,
          group_code: entry.group_code,
          course_name: entry.course_name,
          sessions: []
        });
      }
      
      groupMap.get(key).sessions.push({
        day_of_week: entry.day_of_week,
        start_time: entry.start_time,
        end_time: entry.end_time,
        location: entry.location,
        instructor: entry.instructor,
        session_type: entry.session_type,
        span: entry.span
      });
    }
    
    return Array.from(groupMap.values());
  }

  /**
   * Get span statistics
   */
  getSpanStatistics() {
    const stats = {
      total_courses: this.courseSpanTracker.size,
      consistent_courses: 0,
      inconsistent_courses: 0,
      span_distribution: {}
    };
    
    for (const [courseCode, spans] of this.courseSpanTracker.entries()) {
      if (spans.size === 1) {
        stats.consistent_courses++;
      } else {
        stats.inconsistent_courses++;
      }
      
      for (const span of spans) {
        stats.span_distribution[span] = (stats.span_distribution[span] || 0) + 1;
      }
    }
    
    return stats;
  }

  /**
   * Get parsing summary
   */
  getParsingSummary(scheduleEntries) {
    const summary = {
      total_entries: scheduleEntries.length,
      course_codes_found: new Set(scheduleEntries.map(e => e.course_code)).size,
      groups_found: new Set(scheduleEntries.map(e => `${e.course_code}-${e.group_code}`)).size,
      with_course_names: scheduleEntries.filter(e => e.course_name).length,
      with_rooms: scheduleEntries.filter(e => e.location).length,
      with_instructors: scheduleEntries.filter(e => e.instructor).length,
      shared_group_entries: scheduleEntries.filter(e => e.shared_groups.length > 0).length
    };
    
    return summary;
  }
}

module.exports = ExcelParserServiceFinal;
