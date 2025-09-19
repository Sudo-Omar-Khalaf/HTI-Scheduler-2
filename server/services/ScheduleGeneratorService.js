const { ScheduleCandidate } = require('../models');

/**
 * Personalized Weekly Schedule Generator Service
 * Builds weekly schedules based on user's course selection with exact positioning
 */
class ScheduleGeneratorService {
  constructor() {
    this.maxCandidates = 10;
    this.timeSlots = 8;
    this.days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    
    // True span values for validation
    this.trueSpanValues = {
      'EEC 101': 3, // 2 lecture + 1 lab
      'EEC 113': 3, // 2 lecture + 1 lab  
      'EEC 121': 5, // 2 lecture + 3 lab
      'EEC 125': 5, // 2 lecture + 3 lab
      'EEC 142': 6, // 3 lecture + 3 lab
      'EEC 212': 5, // 3 lecture + 2 lab
      'EEC 284': 4, // 2 lecture + 2 lab
    };

    // Time slot mapping
    this.timeSlotMap = [
      '9.00 - 9.45',
      '9.45 - 10.30', 
      '10.40 - 11.25',
      '11.25 - 12.10',
      '12.20 - 1.05',
      '1.05 - 1.50',
      '2.00 - 2.45',
      '2.45 - 3.30'
    ];
  }

  /**
   * Generate personalized weekly schedule based on user's course selection
   * @param {Array} courseGroups - All available course groups from Excel parsing
   * @param {Object} userRequest - User's course selection and preferences
   * @param {Object} options - Generation options
   * @returns {Object} Generated schedule with validation
   */
  async generatePersonalizedSchedule(courseGroups, userRequest, options = {}) {
    try {
      console.log('🏗️ Generating personalized weekly schedule...');
      
      // Parse user course selection with smart group selection
      const courseSelection = this.parseUserCourseSelection(userRequest, courseGroups);
      console.log('📚 User course selection:', courseSelection);
      
      // Validate course span requirements
      const spanValidation = this.validateCourseSpans(courseSelection, courseGroups);
      if (!spanValidation.isValid) {
        return {
          success: false,
          error: 'Course span validation failed',
          validation_errors: spanValidation.errors,
          schedule: null
        };
      }
      
      // Build the weekly schedule table
      const weeklySchedule = this.buildWeeklyScheduleTable(courseSelection, courseGroups);
      
      // Validate no conflicts exist
      const conflictValidation = this.validateNoConflicts(weeklySchedule);
      
      return {
        success: true,
        schedule: {
          weekly_table: weeklySchedule,
          course_selection: courseSelection,
          span_validation: spanValidation,
          conflict_validation: conflictValidation,
          generation_metadata: {
            timestamp: new Date().toISOString(),
            total_courses: courseSelection.length,
            total_spans: this.calculateTotalSpans(weeklySchedule)
          }
        }
      };
      
    } catch (error) {
      console.error('❌ Schedule generation error:', error);
      return {
        success: false,
        error: error.message,
        schedule: null
      };
    }
  }

  /**
   * Parse user course selection into structured format with smart group selection
   * @param {Object} userRequest - Contains desired_courses array
   * @param {Array} courseGroups - Available course groups from Excel (needed for smart selection)
   * @returns {Array} Parsed course selection with codes and groups
   */
  parseUserCourseSelection(userRequest, courseGroups = []) {
    const courseSelection = [];
    
    for (const courseInput of userRequest.desired_courses || []) {
      // Handle different input formats:
      // 1. "EEC 101" (course code only, smart group selection)
      // 2. "EEC 10105" (course code + group number)
      // 3. {code: "EEC 101", group: "05"} (object format)
      
      let courseCode, groupNumber;
      
      if (typeof courseInput === 'string') {
        // Check if it includes group number (e.g., "EEC 10105")
        const match = courseInput.match(/^([A-Z]{2,4})\s*(\d{3})(\d{2})?$/);
        if (match) {
          const [, dept, courseNum, group] = match;
          courseCode = `${dept} ${courseNum}`;
          groupNumber = group || this.selectSmartGroup(courseCode, courseGroups);
        } else {
          // Simple course code (e.g., "EEC 101")
          courseCode = courseInput.trim();
          groupNumber = this.selectSmartGroup(courseCode, courseGroups);
        }
      } else if (typeof courseInput === 'object') {
        courseCode = courseInput.code;
        groupNumber = courseInput.group || this.selectSmartGroup(courseCode, courseGroups);
      }
      
      if (courseCode && groupNumber) {
        courseSelection.push({
          course_code: courseCode,
          group_number: groupNumber.padStart(2, '0'),
          original_input: courseInput
        });
      }
    }
    
    return courseSelection;
  }

  /**
   * Smart group selection - finds the best available group for a course
   * @param {String} courseCode - The course code (e.g., "EEC 101")
   * @param {Array} courseGroups - Available course groups from Excel
   * @returns {String} Selected group number or "01" as fallback
   */
  selectSmartGroup(courseCode, courseGroups) {
    // Find all available groups for this course
    const availableGroups = courseGroups
      .filter(g => g.course_code === courseCode)
      .map(g => g.group_code)
      .filter(g => g) // Remove null/undefined groups
      .sort(); // Sort numerically
    
    console.log(`🎯 Smart group selection for ${courseCode}:`, availableGroups);
    
    if (availableGroups.length === 0) {
      console.log(`⚠️ No groups found for ${courseCode}, defaulting to "01"`);
      return '01';
    }
    
    // Prefer group "01" if available, otherwise take the first available group
    if (availableGroups.includes('01')) {
      console.log(`✅ Selected group "01" for ${courseCode}`);
      return '01';
    } else {
      const selectedGroup = availableGroups[0];
      console.log(`✅ Selected group "${selectedGroup}" for ${courseCode} (01 not available)`);
      return selectedGroup;
    }
  }  /**
   * Validate that each course has the correct number of spans
   * @param {Array} courseSelection - Parsed course selection
   * @param {Array} courseGroups - Available course groups from Excel
   * @returns {Object} Validation result
   */
  validateCourseSpans(courseSelection, courseGroups) {
    const validation = {
      isValid: true,
      errors: [],
      warnings: [],
      course_span_summary: []
    };

    for (const selection of courseSelection) {
      const { course_code, group_number } = selection;
      
      // Find all groups for this course code
      const courseGroupsForCode = courseGroups.filter(g => g.course_code === course_code);
      
      if (courseGroupsForCode.length === 0) {
        validation.isValid = false;
        validation.errors.push(`Course ${course_code} not found in Excel data`);
        continue;
      }
      
      // Calculate total spans for the selected group
      const selectedGroup = courseGroupsForCode.find(g => g.group_code === group_number);
      if (!selectedGroup) {
        validation.isValid = false;
        validation.errors.push(`Group ${group_number} not found for course ${course_code}`);
        continue;
      }
      
      // Calculate actual spans from sessions
      const totalSpans = this.calculateGroupSpans(selectedGroup, courseGroups);
      const expectedSpans = this.trueSpanValues[course_code];
      
      // Only warn about span mismatches, don't block generation
      if (expectedSpans && totalSpans !== expectedSpans) {
        validation.warnings.push(
          `Course ${course_code} group ${group_number}: expected ${expectedSpans} spans, found ${totalSpans} spans`
        );
      }
      
      validation.course_span_summary.push({
        course_code,
        group_number,
        actual_spans: totalSpans,
        expected_spans: expectedSpans,
        is_valid: !expectedSpans || totalSpans === expectedSpans
      });
    }
    
    return validation;
  }

  /**
   * Generate a single schedule candidate using backtracking
   */
  generateScheduleCandidate(availableGroups, userRequest, candidateId) {
    const candidate = new ScheduleCandidate({ id: candidateId });
    const timeGrid = this.createEmptyTimeGrid();
    
    // Shuffle courses for variety
    const shuffledGroups = this.shuffleArray([...availableGroups]);
    
    for (const courseOption of shuffledGroups) {
      const selectedGroup = this.selectBestGroup(
        courseOption.groups, 
        timeGrid, 
        userRequest,
        candidate
      );
      
      if (selectedGroup) {
        const conflicts = this.checkConflicts(selectedGroup, timeGrid);
        
        if (conflicts.length === 0) {
          // Add group to candidate
          candidate.addGroup(selectedGroup, courseOption.credits);
          this.addGroupToTimeGrid(selectedGroup, timeGrid);
          
          // Check credit limit
          if (candidate.total_credits >= userRequest.max_credits) {
            break;
          }
        } else {
          // Track omitted course
          candidate.omitted_courses.push({
            course_code: courseOption.course_code,
            reason: 'time_conflict',
            conflicts: conflicts
          });
        }
      } else {
        candidate.omitted_courses.push({
          course_code: courseOption.course_code,
          reason: 'no_suitable_group'
        });
      }
    }
    
    return candidate;
  }

  /**
   * Select the best group from available options
   */
  selectBestGroup(groups, timeGrid, userRequest, candidate) {
    // Score each group
    const scoredGroups = groups.map(group => ({
      group,
      score: this.scoreGroup(group, timeGrid, userRequest, candidate)
    }));
    
    // Sort by score and select the best one that fits
    scoredGroups.sort((a, b) => b.score - a.score);
    
    for (const { group } of scoredGroups) {
      const conflicts = this.checkConflicts(group, timeGrid);
      if (conflicts.length === 0) {
        return group;
      }
    }
    
    return null;
  }

  /**
   * Score a group based on various criteria
   */
  scoreGroup(group, timeGrid, userRequest, candidate) {
    let score = 100; // Base score
    
    // Prefer groups with fewer conflicts
    const conflicts = this.checkConflicts(group, timeGrid);
    score -= conflicts.length * 50;
    
    // Prefer groups that match user preferences
    const preferredGroup = userRequest.getPreferredGroup(group.course_code);
    if (preferredGroup === group.group_code) {
      score += 30;
    }
    
    // Prefer groups with good time distribution
    const timeDistribution = this.calculateTimeDistribution(group);
    score += timeDistribution * 10;
    
    // Prefer groups with fewer total sessions (more efficient)
    score += (10 - group.sessions.length) * 2;
    
    // Prefer groups that create fewer gaps in the schedule
    score -= this.calculateGapPenalty(group, timeGrid) * 5;
    
    return Math.max(0, score);
  }

  /**
   * Check for conflicts between a group and existing time grid
   */
  checkConflicts(group, timeGrid) {
    const conflicts = [];
    
    for (const session of group.sessions) {
      if (session.synthetic) continue; // Skip synthetic sessions
      
      const dayIndex = this.days.indexOf(session.day);
      if (dayIndex === -1) continue;
      
      for (let slot = session.slot; slot < session.slot + session.span; slot++) {
        if (slot < 1 || slot > this.timeSlots) continue;
        
        if (timeGrid[dayIndex][slot - 1]) {
          conflicts.push({
            day: session.day,
            slot: slot,
            existing_session: timeGrid[dayIndex][slot - 1],
            conflicting_session: session
          });
        }
      }
    }
    
    return conflicts;
  }

  /**
   * Add a group's sessions to the time grid
   */
  addGroupToTimeGrid(group, timeGrid) {
    for (const session of group.sessions) {
      if (session.synthetic) continue;
      
      const dayIndex = this.days.indexOf(session.day);
      if (dayIndex === -1) continue;
      
      for (let slot = session.slot; slot < session.slot + session.span; slot++) {
        if (slot >= 1 && slot <= this.timeSlots) {
          timeGrid[dayIndex][slot - 1] = {
            course_code: group.course_code,
            group_code: group.group_code,
            session: session
          };
        }
      }
    }
  }

  /**
   * Create empty time grid (5 days x 8 slots)
   */
  createEmptyTimeGrid() {
    return Array(5).fill(null).map(() => Array(8).fill(null));
  }

  /**
   * Calculate time distribution score for a group
   */
  calculateTimeDistribution(group) {
    const dayCount = new Set(group.sessions.map(s => s.day)).size;
    const maxDays = Math.min(this.days.length, group.sessions.length);
    return dayCount / maxDays; // Prefer spread across days
  }

  /**
   * Calculate gap penalty for a group
   */
  calculateGapPenalty(group, timeGrid) {
    let penalty = 0;
    
    for (const session of group.sessions) {
      if (session.synthetic) continue;
      
      const dayIndex = this.days.indexOf(session.day);
      if (dayIndex === -1) continue;
      
      // Check for gaps before and after this session
      const before = session.slot - 1;
      const after = session.slot + session.span;
      
      if (before >= 1 && !timeGrid[dayIndex][before - 1]) penalty += 0.5;
      if (after <= this.timeSlots && !timeGrid[dayIndex][after - 1]) penalty += 0.5;
    }
    
    return penalty;
  }

  /**
   * Check if candidate is valid according to user request
   */
  isValidCandidate(candidate, userRequest) {
    // Must have at least one course
    if (candidate.selected_groups.length === 0) return false;
    
    // Must not exceed credit limit
    if (candidate.total_credits > userRequest.max_credits) return false;
    
    // Must not have unresolved conflicts
    if (candidate.hasConflicts()) return false;
    
    return true;
  }

  /**
   * Calculate overall score for a candidate
   */
  calculateScore(candidate, userRequest) {
    let score = 0;
    
    // Base score from number of courses included
    score += candidate.selected_groups.length * 100;
    
    // Bonus for fulfilling desired courses
    const includedCourses = new Set(candidate.selected_groups.map(g => g.course_code));
    const desiredCourses = new Set(userRequest.desired_courses);
    const fulfilledCourses = [...desiredCourses].filter(c => includedCourses.has(c));
    score += fulfilledCourses.length * 50;
    
    // Bonus for efficient credit usage
    const creditEfficiency = candidate.total_credits / userRequest.max_credits;
    score += creditEfficiency * 30;
    
    // Penalty for omitted courses
    score -= candidate.omitted_courses.length * 20;
    
    // Bonus for preferred groups
    for (const group of candidate.selected_groups) {
      const preferred = userRequest.getPreferredGroup(group.course_code);
      if (preferred === group.group_code) {
        score += 25;
      }
    }
    
    // Time distribution bonus
    const allSessions = candidate.getAllSessions().filter(s => !s.synthetic);
    const dayDistribution = this.calculateDayDistribution(allSessions);
    score += dayDistribution * 15;
    
    return Math.round(score);
  }

  /**
   * Calculate day distribution score
   */
  calculateDayDistribution(sessions) {
    if (sessions.length === 0) return 0;
    
    const daysUsed = new Set(sessions.map(s => s.day)).size;
    const avgSessionsPerDay = sessions.length / daysUsed;
    
    // Prefer even distribution (not too many sessions per day)
    if (avgSessionsPerDay <= 3) return 10;
    if (avgSessionsPerDay <= 4) return 7;
    if (avgSessionsPerDay <= 5) return 4;
    return 0;
  }

  /**
   * Check if candidate is duplicate of existing ones
   */
  isDuplicateCandidate(candidate, existingCandidates) {
    for (const existing of existingCandidates) {
      if (this.candidatesAreEqual(candidate, existing)) {
        return true;
      }
    }
    return false;
  }

  /**
   * Check if two candidates are equal
   */
  candidatesAreEqual(candidate1, candidate2) {
    if (candidate1.selected_groups.length !== candidate2.selected_groups.length) {
      return false;
    }
    
    const groups1 = new Set(candidate1.selected_groups.map(g => `${g.course_code}-${g.group_code}`));
    const groups2 = new Set(candidate2.selected_groups.map(g => `${g.course_code}-${g.group_code}`));
    
    return groups1.size === groups2.size && [...groups1].every(g => groups2.has(g));
  }

  /**
   * Shuffle array for randomization
   */
  shuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  /**
   * Validate course groups for conflicts
   */
  async validateCourseGroups(courseGroups) {
    const conflicts = [];
    const groupMap = new Map();
    
    // Build group map
    for (const group of courseGroups) {
      const key = `${group.course_code}-${group.group_code}`;
      groupMap.set(key, group);
    }
    
    // Check each group for internal conflicts
    for (const group of courseGroups) {
      const groupConflicts = this.findInternalConflicts(group);
      if (groupConflicts.length > 0) {
        conflicts.push({
          course_code: group.course_code,
          group_code: group.group_code,
          type: 'internal_conflict',
          conflicts: groupConflicts
        });
      }
    }
    
    return {
      success: true,
      valid: conflicts.length === 0,
      conflicts
    };
  }

  /**
   * Find internal conflicts within a group
   */
  findInternalConflicts(group) {
    const conflicts = [];
    const sessions = group.sessions.filter(s => !s.synthetic);
    
    for (let i = 0; i < sessions.length; i++) {
      for (let j = i + 1; j < sessions.length; j++) {
        if (sessions[i].conflictsWith(sessions[j])) {
          conflicts.push({
            session1: sessions[i].getTimeSlot(),
            session2: sessions[j].getTimeSlot(),
            overlap: this.calculateOverlap(sessions[i], sessions[j])
          });
        }
      }
    }
    
    return conflicts;
  }

  /**
   * Calculate overlap between two sessions
   */
  calculateOverlap(session1, session2) {
    if (session1.day !== session2.day) return 0;
    
    const start1 = session1.slot;
    const end1 = session1.slot + session1.span;
    const start2 = session2.slot;
    const end2 = session2.slot + session2.span;
    
    const overlapStart = Math.max(start1, start2);
    const overlapEnd = Math.min(end1, end2);
    
    return Math.max(0, overlapEnd - overlapStart);
  }

  /**
   * Build the weekly schedule table with exact positioning
   * @param {Array} courseSelection - User's selected courses and groups
   * @param {Array} courseGroups - All available course groups
   * @returns {Object} Weekly schedule table
   */
  buildWeeklyScheduleTable(courseSelection, courseGroups) {
    // Initialize empty weekly table
    const weeklyTable = {
      structure: {
        days: this.days,
        time_slots: this.timeSlotMap,
        total_cells: this.days.length * this.timeSlots
      },
      schedule: {}
    };
    
    // Initialize empty schedule grid
    for (const day of this.days) {
      weeklyTable.schedule[day] = new Array(this.timeSlots).fill(null);
    }
    
    // Place each selected course in its exact Excel position
    for (const selection of courseSelection) {
      const { course_code, group_number } = selection;
      
      // Find the selected group
      const selectedGroup = courseGroups.find(g => 
        g.course_code === course_code && g.group_code === group_number
      );
      
      if (!selectedGroup) {
        continue;
      }
      
      // Place all sessions for this group
      for (const session of selectedGroup.sessions) {
        const dayIndex = this.days.indexOf(session.day_of_week);
        const timeSlotIndex = this.findTimeSlotIndex(session.start_time);
        
        if (dayIndex !== -1 && timeSlotIndex !== -1) {
          const courseBlock = this.createCourseBlock(session, selectedGroup, courseGroups);
          
          // Handle span placement
          for (let span = 0; span < session.span; span++) {
            const slotIndex = timeSlotIndex + span;
            if (slotIndex < this.timeSlots) {
              weeklyTable.schedule[this.days[dayIndex]][slotIndex] = {
                ...courseBlock,
                is_continuation: span > 0,
                span_position: span + 1,
                total_span: session.span
              };
            }
          }
        }
      }
    }
    
    return weeklyTable;
  }

  /**
   * Create a course block with the required 3-row structure
   * @param {Object} session - Session information
   * @param {Object} selectedGroup - Selected course group
   * @param {Array} courseGroups - All course groups for shared group detection
   * @returns {Object} Course block structure
   */
  createCourseBlock(session, selectedGroup, courseGroups) {
    // Find shared groups for this session
    const sharedGroups = this.findSharedGroups(session, courseGroups);
    
    return {
      // Row 1: Course Code + Group Number(s)
      row1_course_info: {
        course_code: selectedGroup.course_code,
        group_numbers: sharedGroups.length > 0 ? sharedGroups : [selectedGroup.group_code],
        display_text: sharedGroups.length > 0 
          ? `${selectedGroup.course_code} ${sharedGroups.join(',')}`
          : `${selectedGroup.course_code} ${selectedGroup.group_code}`
      },
      
      // Row 2: Course Name (Arabic)
      row2_course_name: {
        arabic_name: selectedGroup.course_name || '',
        display_text: selectedGroup.course_name || ''
      },
      
      // Row 3: Hall Number + Professor Name (Arabic)
      row3_details: {
        hall_number: session.location || '',
        professor_name: session.instructor || '',
        display_text: [session.location, session.instructor].filter(Boolean).join(' - ')
      },
      
      // Additional metadata
      session_metadata: {
        session_type: session.session_type,
        start_time: session.start_time,
        end_time: session.end_time,
        day_of_week: session.day_of_week,
        original_span: session.span
      }
    };
  }

  /**
   * Find shared groups for a session (e.g., EEC 10105,06)
   * @param {Object} session - Current session
   * @param {Array} courseGroups - All course groups
   * @returns {Array} Array of shared group numbers
   */
  findSharedGroups(session, courseGroups) {
    // Find all groups that have the exact same session (same time, day, location)
    const matchingSessions = [];
    
    for (const group of courseGroups) {
      if (group.course_code === session.course_code) {
        for (const groupSession of group.sessions) {
          if (groupSession.day_of_week === session.day_of_week &&
              groupSession.start_time === session.start_time &&
              groupSession.end_time === session.end_time &&
              groupSession.session_type === session.session_type) {
            matchingSessions.push(group.group_code);
          }
        }
      }
    }
    
    return matchingSessions.length > 1 ? matchingSessions.sort() : [];
  }

  /**
   * Find the time slot index for a given start time
   * @param {String} startTime - Start time (e.g., "9.00")
   * @returns {Number} Time slot index or -1 if not found
   */
  findTimeSlotIndex(startTime) {
    // Map start times to slot indices
    const timeMap = {
      '9.00': 0,
      '9.45': 1,
      '10.40': 2,
      '11.25': 3,
      '12.20': 4,
      '1.05': 5,
      '2.00': 6,
      '2.45': 7
    };
    
    return timeMap[startTime] !== undefined ? timeMap[startTime] : -1;
  }

  /**
   * Calculate total spans for a group including shared sessions
   * @param {Object} selectedGroup - The selected group
   * @param {Array} courseGroups - All course groups
   * @returns {Number} Total number of spans
   */
  calculateGroupSpans(selectedGroup, courseGroups) {
    let totalSpans = 0;
    
    for (const session of selectedGroup.sessions) {
      // Check if this is a shared session
      const sharedGroups = this.findSharedGroups(session, courseGroups);
      
      if (sharedGroups.includes(selectedGroup.group_code)) {
        // This is a shared session, count it
        totalSpans += session.span;
      } else {
        // This is an individual session, count it
        totalSpans += session.span;
      }
    }
    
    return totalSpans;
  }

  /**
   * Validate that no conflicts exist in the schedule
   * @param {Object} weeklyTable - The weekly schedule table
   * @returns {Object} Validation result
   */
  validateNoConflicts(weeklyTable) {
    const conflicts = [];
    
    for (const day of this.days) {
      for (let slot = 0; slot < this.timeSlots; slot++) {
        const cell = weeklyTable.schedule[day][slot];
        if (cell && !cell.is_continuation) {
          // Check for overlaps with other courses in this slot
          for (let checkSlot = slot; checkSlot < slot + cell.total_span; checkSlot++) {
            if (checkSlot !== slot && weeklyTable.schedule[day][checkSlot] && 
                !weeklyTable.schedule[day][checkSlot].is_continuation) {
              conflicts.push({
                day,
                time_slot: checkSlot,
                course1: cell.row1_course_info.display_text,
                course2: weeklyTable.schedule[day][checkSlot].row1_course_info.display_text
              });
            }
          }
        }
      }
    }
    
    return {
      has_conflicts: conflicts.length > 0,
      conflicts,
      total_conflicts: conflicts.length
    };
  }

  /**
   * Calculate total spans in the weekly schedule
   * @param {Object} weeklyTable - The weekly schedule table
   * @returns {Number} Total number of spans
   */
  calculateTotalSpans(weeklyTable) {
    let totalSpans = 0;
    
    for (const day of this.days) {
      for (let slot = 0; slot < this.timeSlots; slot++) {
        const cell = weeklyTable.schedule[day][slot];
        if (cell && !cell.is_continuation) {
          totalSpans += cell.total_span;
        }
      }
    }
    
    return totalSpans;
  }

  /**
   * Legacy method for backward compatibility
   */
  async generateSchedules(courseGroups, userRequest, options = {}) {
    return await this.generatePersonalizedSchedule(courseGroups, userRequest, options);
  }
}

module.exports = ScheduleGeneratorService;
