const { NormalizationReport, CourseReport } = require('../models');

/**
 * Normalization Service for validating and adjusting course spans
 */
class NormalizationService {
  constructor() {
    // Canonical span definitions per course
    this.canonicalSpans = {
      // Electrical Engineering courses
      'EEC 101': { lecture: 2, lab: 1, total: 3 },
      'EEC 102': { lecture: 2, lab: 1, total: 3 },
      'EEC 201': { lecture: 3, lab: 1, total: 4 },
      'EEC 202': { lecture: 3, lab: 1, total: 4 },
      'EEC 301': { lecture: 2, lab: 2, total: 4 },
      'EEC 302': { lecture: 2, lab: 2, total: 4 },
      
      // Mathematics courses
      'MATH 101': { lecture: 3, lab: 0, total: 3 },
      'MATH 102': { lecture: 3, lab: 0, total: 3 },
      'MATH 201': { lecture: 3, lab: 0, total: 3 },
      
      // Physics courses
      'PHYS 101': { lecture: 2, lab: 1, total: 3 },
      'PHYS 102': { lecture: 2, lab: 1, total: 3 },
      
      // Computer Science courses
      'CS 101': { lecture: 2, lab: 1, total: 3 },
      'CS 102': { lecture: 2, lab: 1, total: 3 },
      'CS 201': { lecture: 3, lab: 1, total: 4 },
      
      // Default for unknown courses
      'DEFAULT': { lecture: 2, lab: 1, total: 3 }
    };
  }

  /**
   * Normalize course groups against canonical span requirements
   */
  async normalizeCourseGroups(courseGroups, options = {}) {
    const report = new NormalizationReport();
    const courseMap = this.groupCoursesByCode(courseGroups);
    
    let maxSpanCourse = null;
    let maxSpans = 0;

    for (const [courseCode, groups] of courseMap.entries()) {
      const courseReport = this.normalizeCourse(courseCode, groups, options);
      report.addCourseReport(courseReport);
      
      // Track course with maximum spans
      const totalSpans = groups.reduce((sum, g) => sum + g.total_spans, 0);
      if (totalSpans > maxSpans) {
        maxSpans = totalSpans;
        maxSpanCourse = courseCode;
      }
      
      // Check for inconsistencies between groups
      this.checkGroupConsistency(courseCode, groups, report);
    }
    
    report.max_span_course = maxSpanCourse;
    
    // Apply adjustments if requested
    if (options.applyAdjustments) {
      this.applyNormalizationAdjustments(courseGroups, report);
    }
    
    return {
      success: true,
      report,
      normalized_groups: courseGroups
    };
  }

  /**
   * Group course groups by course code
   */
  groupCoursesByCode(courseGroups) {
    const courseMap = new Map();
    
    for (const group of courseGroups) {
      if (!courseMap.has(group.course_code)) {
        courseMap.set(group.course_code, []);
      }
      courseMap.get(group.course_code).push(group);
    }
    
    return courseMap;
  }

  /**
   * Normalize a specific course and its groups
   */
  normalizeCourse(courseCode, groups, options) {
    const canonical = this.getCanonicalSpans(courseCode);
    const courseReport = new CourseReport(courseCode);
    
    courseReport.canonical_lecture_spans = canonical.lecture;
    courseReport.canonical_lab_spans = canonical.lab;
    
    for (const group of groups) {
      const groupReport = this.normalizeGroup(group, canonical, options);
      courseReport.addGroupReport(groupReport);
    }
    
    return courseReport;
  }

  /**
   * Normalize a specific group
   */
  normalizeGroup(group, canonical, options) {
    const currentLectureSpans = group.getTotalLectureSpans();
    const currentLabSpans = group.getTotalLabSpans();
    const currentTotal = group.total_spans;
    
    // Calculate deficits and overages
    const lectureDifference = canonical.lecture - currentLectureSpans;
    const labDifference = canonical.lab - currentLabSpans;
    const totalDifference = canonical.total - currentTotal;
    
    const groupReport = {
      group_code: group.group_code,
      current_lecture_spans: currentLectureSpans,
      current_lab_spans: currentLabSpans,
      current_total_spans: currentTotal,
      canonical_lecture_spans: canonical.lecture,
      canonical_lab_spans: canonical.lab,
      canonical_total_spans: canonical.total,
      lecture_difference: lectureDifference,
      lab_difference: labDifference,
      total_difference: totalDifference,
      deficit: Math.max(0, -totalDifference),
      overage: Math.max(0, totalDifference),
      adjustments: []
    };
    
    // Generate adjustment suggestions
    if (totalDifference !== 0) {
      this.generateAdjustmentSuggestions(group, groupReport, canonical);
    }
    
    return groupReport;
  }

  /**
   * Generate adjustment suggestions for a group
   */
  generateAdjustmentSuggestions(group, groupReport, canonical) {
    const adjustments = [];
    
    // If we have deficit, suggest adding synthetic sessions
    if (groupReport.deficit > 0) {
      if (groupReport.lecture_difference > 0) {
        adjustments.push({
          type: 'add_synthetic_lecture',
          spans: groupReport.lecture_difference,
          description: `Add ${groupReport.lecture_difference} synthetic lecture span(s)`
        });
      }
      
      if (groupReport.lab_difference > 0) {
        adjustments.push({
          type: 'add_synthetic_lab',
          spans: groupReport.lab_difference,
          description: `Add ${groupReport.lab_difference} synthetic lab span(s)`
        });
      }
    }
    
    // If we have overage, suggest reclassification
    if (groupReport.overage > 0) {
      const unknownSessions = group.sessions.filter(s => s.session_type === 'unknown');
      if (unknownSessions.length > 0) {
        adjustments.push({
          type: 'reclassify_sessions',
          sessions: unknownSessions.map(s => s.getTimeSlot()),
          description: `Reclassify ${unknownSessions.length} unknown session(s)`
        });
      }
    }
    
    // Suggest balancing lecture/lab distribution
    if (groupReport.lecture_difference < 0 && groupReport.lab_difference > 0) {
      const canConvert = Math.min(Math.abs(groupReport.lecture_difference), groupReport.lab_difference);
      adjustments.push({
        type: 'convert_lab_to_lecture',
        spans: canConvert,
        description: `Convert ${canConvert} lab span(s) to lecture`
      });
    } else if (groupReport.lab_difference < 0 && groupReport.lecture_difference > 0) {
      const canConvert = Math.min(Math.abs(groupReport.lab_difference), groupReport.lecture_difference);
      adjustments.push({
        type: 'convert_lecture_to_lab',
        spans: canConvert,
        description: `Convert ${canConvert} lecture span(s) to lab`
      });
    }
    
    groupReport.adjustments = adjustments;
  }

  /**
   * Check for inconsistencies between groups of the same course
   */
  checkGroupConsistency(courseCode, groups, report) {
    if (groups.length <= 1) return;
    
    const spans = groups.map(g => g.total_spans);
    const unique = [...new Set(spans)];
    
    if (unique.length > 1) {
      report.addInconsistency({
        course_code: courseCode,
        type: 'inconsistent_total_spans',
        description: `Groups have different total spans: ${unique.join(', ')}`,
        groups: groups.map(g => ({
          group_code: g.group_code,
          total_spans: g.total_spans
        }))
      });
    }
    
    // Check lecture/lab distribution consistency
    const lectureSpans = groups.map(g => g.getTotalLectureSpans());
    const labSpans = groups.map(g => g.getTotalLabSpans());
    
    if (new Set(lectureSpans).size > 1) {
      report.addInconsistency({
        course_code: courseCode,
        type: 'inconsistent_lecture_spans',
        description: `Groups have different lecture spans: ${[...new Set(lectureSpans)].join(', ')}`,
        groups: groups.map((g, i) => ({
          group_code: g.group_code,
          lecture_spans: lectureSpans[i]
        }))
      });
    }
    
    if (new Set(labSpans).size > 1) {
      report.addInconsistency({
        course_code: courseCode,
        type: 'inconsistent_lab_spans',
        description: `Groups have different lab spans: ${[...new Set(labSpans)].join(', ')}`,
        groups: groups.map((g, i) => ({
          group_code: g.group_code,
          lab_spans: labSpans[i]
        }))
      });
    }
  }

  /**
   * Apply normalization adjustments to course groups
   */
  applyNormalizationAdjustments(courseGroups, report) {
    for (const courseReport of report.course_reports) {
      for (const groupReport of courseReport.groups) {
        const group = courseGroups.find(g => 
          g.course_code === courseReport.course_code && 
          g.group_code === groupReport.group_code
        );
        
        if (!group) continue;
        
        for (const adjustment of groupReport.adjustments) {
          this.applyAdjustment(group, adjustment);
        }
      }
    }
  }

  /**
   * Apply a specific adjustment to a group
   */
  applyAdjustment(group, adjustment) {
    const { Session } = require('../models');
    
    switch (adjustment.type) {
      case 'add_synthetic_lecture':
        for (let i = 0; i < adjustment.spans; i++) {
          const syntheticSession = new Session({
            day: 'TBD',
            slot: -1,
            span: 1,
            course_name: group.sessions[0]?.course_name || '',
            session_type: 'lecture',
            synthetic: true,
            course_code: group.course_code,
            group_code: group.group_code,
            shared_groups: [group.group_code]
          });
          group.addSession(syntheticSession);
        }
        break;
        
      case 'add_synthetic_lab':
        for (let i = 0; i < adjustment.spans; i++) {
          const syntheticSession = new Session({
            day: 'TBD',
            slot: -1,
            span: 1,
            course_name: group.sessions[0]?.course_name || '',
            session_type: 'lab',
            synthetic: true,
            course_code: group.course_code,
            group_code: group.group_code,
            shared_groups: [group.group_code]
          });
          group.addSession(syntheticSession);
        }
        break;
        
      case 'convert_lab_to_lecture':
        const labSessions = group.getLabSessions();
        for (let i = 0; i < Math.min(adjustment.spans, labSessions.length); i++) {
          labSessions[i].session_type = 'lecture';
        }
        break;
        
      case 'convert_lecture_to_lab':
        const lectureSessions = group.getLectureSessions();
        for (let i = 0; i < Math.min(adjustment.spans, lectureSessions.length); i++) {
          lectureSessions[i].session_type = 'lab';
        }
        break;
    }
  }

  /**
   * Get canonical spans for a course
   */
  getCanonicalSpans(courseCode) {
    // Normalize course code format
    const normalizedCode = courseCode.replace(/\s+/g, ' ').trim().toUpperCase();
    
    // Check for exact match
    if (this.canonicalSpans[normalizedCode]) {
      return this.canonicalSpans[normalizedCode];
    }
    
    // Check for pattern matches (e.g., EEC XXX)
    const prefix = normalizedCode.split(' ')[0];
    const matchingKeys = Object.keys(this.canonicalSpans).filter(key => 
      key.startsWith(prefix) && key !== 'DEFAULT'
    );
    
    if (matchingKeys.length > 0) {
      return this.canonicalSpans[matchingKeys[0]];
    }
    
    // Return default
    return this.canonicalSpans['DEFAULT'];
  }

  /**
   * Add or update canonical spans for a course
   */
  updateCanonicalSpans(courseCode, spans) {
    this.canonicalSpans[courseCode] = spans;
  }

  /**
   * Get all canonical spans
   */
  getAllCanonicalSpans() {
    return { ...this.canonicalSpans };
  }
}

module.exports = NormalizationService;
