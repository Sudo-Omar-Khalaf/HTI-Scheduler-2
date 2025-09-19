/**
 * Course Group model representing a specific group of a course
 */
class CourseGroup {
  constructor({
    course_code,
    group_code,
    sessions = [],
    total_spans = 0,
    canonical_spans = null
  }) {
    this.course_code = course_code;
    this.group_code = group_code;
    this.sessions = sessions;
    this.total_spans = total_spans;
    this.canonical_spans = canonical_spans;
  }

  addSession(session) {
    this.sessions.push(session);
    this.total_spans += session.span;
  }

  getLectureSessions() {
    return this.sessions.filter(s => s.session_type === 'lecture');
  }

  getLabSessions() {
    return this.sessions.filter(s => s.session_type === 'lab');
  }

  getTotalLectureSpans() {
    return this.getLectureSessions().reduce((sum, s) => sum + s.span, 0);
  }

  getTotalLabSpans() {
    return this.getLabSessions().reduce((sum, s) => sum + s.span, 0);
  }
}

/**
 * Session model representing a single time slot for a course
 */
class Session {
  constructor({
    day,
    slot,
    span,
    room = '',
    raw = '',
    row = -1,
    col_start = -1,
    col_end = -1,
    course_name = '',
    professor = '',
    session_type = 'unknown',
    shared_groups = [],
    synthetic = false
  }) {
    this.day = day;
    this.slot = slot;
    this.span = span;
    this.room = room;
    this.raw = raw;
    this.row = row;
    this.col_start = col_start;
    this.col_end = col_end;
    this.course_name = course_name;
    this.professor = professor;
    this.session_type = session_type;
    this.shared_groups = shared_groups;
    this.synthetic = synthetic;
  }

  isShared() {
    return this.shared_groups.length > 1;
  }

  getTimeSlot() {
    return `${this.day}-${this.slot}`;
  }

  conflictsWith(other) {
    if (this.day !== other.day) return false;
    
    const thisEnd = this.slot + this.span;
    const otherEnd = other.slot + other.span;
    
    return !(thisEnd <= other.slot || otherEnd <= this.slot);
  }
}

/**
 * User request model for schedule generation
 */
class UserRequest {
  constructor({
    desired_courses = [],
    max_credits = 18,
    credits_per_course = {},
    group_preferences = {}
  }) {
    this.desired_courses = desired_courses;
    this.max_credits = max_credits;
    this.credits_per_course = credits_per_course;
    this.group_preferences = group_preferences;
  }

  getPreferredGroup(course_code) {
    return this.group_preferences[course_code] || null;
  }

  getCourseCredits(course_code) {
    return this.credits_per_course[course_code] || 3;
  }
}

/**
 * Schedule candidate model
 */
class ScheduleCandidate {
  constructor({
    id,
    selected_groups = [],
    total_credits = 0,
    omitted_courses = [],
    score = 0,
    conflicts = []
  }) {
    this.id = id;
    this.selected_groups = selected_groups;
    this.total_credits = total_credits;
    this.omitted_courses = omitted_courses;
    this.score = score;
    this.conflicts = conflicts;
  }

  addGroup(group, credits) {
    this.selected_groups.push(group);
    this.total_credits += credits;
  }

  hasConflicts() {
    return this.conflicts.length > 0;
  }

  getAllSessions() {
    return this.selected_groups.flatMap(group => group.sessions);
  }
}

/**
 * Normalization report model
 */
class NormalizationReport {
  constructor() {
    this.course_reports = [];
    this.total_deficits = 0;
    this.total_overages = 0;
    this.inconsistencies = [];
    this.max_span_course = null;
  }

  addCourseReport(report) {
    this.course_reports.push(report);
    this.total_deficits += report.total_deficit;
    this.total_overages += report.total_overage;
  }

  addInconsistency(inconsistency) {
    this.inconsistencies.push(inconsistency);
  }
}

/**
 * Course report for normalization
 */
class CourseReport {
  constructor(course_code) {
    this.course_code = course_code;
    this.groups = [];
    this.canonical_lecture_spans = 0;
    this.canonical_lab_spans = 0;
    this.total_deficit = 0;
    this.total_overage = 0;
    this.adjustments = [];
  }

  addGroupReport(group_report) {
    this.groups.push(group_report);
    this.total_deficit += group_report.deficit;
    this.total_overage += group_report.overage;
  }
}

module.exports = {
  CourseGroup,
  Session,
  UserRequest,
  ScheduleCandidate,
  NormalizationReport,
  CourseReport
};
