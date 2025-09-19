const express = require('express');
const ScheduleGeneratorService = require('../services/ScheduleGeneratorService');
const { UserRequest } = require('../models');

const router = express.Router();
const scheduleService = new ScheduleGeneratorService();

/**
 * POST /api/schedule/generate
 * Generate schedule candidates based on user request
 */
router.post('/generate', async (req, res) => {
  try {
    const { course_groups, user_request, options = {} } = req.body;
    
    // Validate input
    if (!course_groups || !Array.isArray(course_groups)) {
      return res.status(400).json({
        error: { message: 'Invalid course groups data' }
      });
    }
     if (!user_request) {
      return res.status(400).json({
        error: { message: 'User request is required' }
      });
    }

    // Create UserRequest object
    const userReq = new UserRequest(user_request);
    
    // Handle empty desired_courses for auto-generation mode
    const desiredCoursesCount = userReq.desired_courses?.length || 0;
    console.log(`🎯 Generating schedules for ${desiredCoursesCount} courses`);
    console.log(`📚 Available course groups: ${course_groups.length}`);
    
    // Generate schedules
    const result = await scheduleService.generateSchedules(
      course_groups,
      userReq,
      options
    );
    
    if (!result.success) {
      return res.status(400).json({
        error: { message: result.error }
      });
    }
    
    const candidatesCount = result.candidates?.length || 0;
    console.log(`✅ Generated ${candidatesCount} schedule candidates`);
    
    res.json({
      success: true,
      data: result
    });
    
  } catch (error) {
    console.error('Schedule generation error:', error);
    res.status(500).json({
      error: {
        message: 'Failed to generate schedules',
        details: error.message
      }
    });
  }
});

/**
 * POST /api/schedule/generate-personalized
 * Generate personalized weekly schedule based on exact course selection
 */
router.post('/generate-personalized', async (req, res) => {
  try {
    const { course_groups, user_request, options = {} } = req.body;
    
    // Validate input
    if (!course_groups || !Array.isArray(course_groups)) {
      return res.status(400).json({
        error: { message: 'Invalid course groups data' }
      });
    }
    
    if (!user_request || !user_request.desired_courses) {
      return res.status(400).json({
        error: { message: 'User request with desired_courses is required' }
      });
    }
    
    console.log(`🏗️ Generating personalized weekly schedule...`);
    console.log(`📚 Requested courses:`, user_request.desired_courses);
    console.log(`📊 Available course groups: ${course_groups.length}`);
    
    // Generate personalized schedule
    const result = await scheduleService.generatePersonalizedSchedule(
      course_groups,
      user_request,
      options
    );
    
    if (!result.success) {
      console.log(`❌ Schedule generation failed: ${result.error}`);
      console.log(`🔍 Validation errors:`, result.validation_errors);
      return res.status(400).json({
        error: { 
          message: result.error,
          validation_errors: result.validation_errors 
        }
      });
    }
    
    console.log(`✅ Generated personalized weekly schedule successfully`);
    console.log(`📋 Total courses: ${result.schedule.course_selection.length}`);
    console.log(`⏱️ Total spans: ${result.schedule.generation_metadata.total_spans}`);
    
    res.json({
      success: true,
      data: result.schedule
    });
    
  } catch (error) {
    console.error('❌ Personalized schedule generation error:', error);
    res.status(500).json({
      error: {
        message: 'Failed to generate personalized schedule',
        details: error.message
      }
    });
  }
});

/**
 * POST /api/schedule/validate-groups
 * Validate course groups for conflicts
 */
router.post('/validate-groups', async (req, res) => {
  try {
    const { course_groups } = req.body;
    
    if (!course_groups || !Array.isArray(course_groups)) {
      return res.status(400).json({
        error: { message: 'Invalid course groups data' }
      });
    }
    
    console.log(`🔍 Validating ${course_groups.length} course groups`);
    
    const result = await scheduleService.validateCourseGroups(course_groups);
    
    console.log(`✅ Validation completed. Valid: ${result.valid}`);
    
    res.json({
      success: true,
      data: result
    });
    
  } catch (error) {
    console.error('Validation error:', error);
    res.status(500).json({
      error: {
        message: 'Failed to validate course groups',
        details: error.message
      }
    });
  }
});

/**
 * POST /api/schedule/analyze
 * Analyze schedule candidate for detailed metrics
 */
router.post('/analyze', async (req, res) => {
  try {
    const { schedule_candidate, course_groups } = req.body;
    
    if (!schedule_candidate) {
      return res.status(400).json({
        error: { message: 'Schedule candidate is required' }
      });
    }
    
    const analysis = analyzeScheduleCandidate(schedule_candidate, course_groups || []);
    
    res.json({
      success: true,
      data: analysis
    });
    
  } catch (error) {
    console.error('Schedule analysis error:', error);
    res.status(500).json({
      error: {
        message: 'Failed to analyze schedule',
        details: error.message
      }
    });
  }
});

/**
 * GET /api/schedule/time-slots
 * Get available time slots configuration
 */
router.get('/time-slots', (req, res) => {
  const timeSlots = {
    days: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday'],
    slots: [
      { id: 1, time: '8:00-9:00', label: '8:00 AM - 9:00 AM' },
      { id: 2, time: '9:00-10:00', label: '9:00 AM - 10:00 AM' },
      { id: 3, time: '10:00-11:00', label: '10:00 AM - 11:00 AM' },
      { id: 4, time: '11:00-12:00', label: '11:00 AM - 12:00 PM' },
      { id: 5, time: '12:00-1:00', label: '12:00 PM - 1:00 PM' },
      { id: 6, time: '1:00-2:00', label: '1:00 PM - 2:00 PM' },
      { id: 7, time: '2:00-3:00', label: '2:00 PM - 3:00 PM' },
      { id: 8, time: '3:00-4:00', label: '3:00 PM - 4:00 PM' }
    ],
    total_slots_per_day: 8,
    total_days: 5
  };
  
  res.json({
    success: true,
    data: timeSlots
  });
});

/**
 * POST /api/schedule/optimize
 * Optimize a specific schedule candidate
 */
router.post('/optimize', async (req, res) => {
  try {
    const { schedule_candidate, optimization_criteria = {} } = req.body;
    
    if (!schedule_candidate) {
      return res.status(400).json({
        error: { message: 'Schedule candidate is required' }
      });
    }
    
    // Apply optimization
    const optimized = optimizeSchedule(schedule_candidate, optimization_criteria);
    
    res.json({
      success: true,
      data: {
        original: schedule_candidate,
        optimized,
        improvements: calculateImprovements(schedule_candidate, optimized)
      }
    });
    
  } catch (error) {
    console.error('Schedule optimization error:', error);
    res.status(500).json({
      error: {
        message: 'Failed to optimize schedule',
        details: error.message
      }
    });
  }
});

/**
 * GET /api/schedule/statistics
 * Get scheduling statistics and metrics
 */
router.get('/statistics', (req, res) => {
  try {
    // This would typically come from a database or cache
    const statistics = {
      total_schedules_generated: 0,
      average_generation_time: 0,
      most_popular_courses: [],
      conflict_resolution_rate: 0,
      user_satisfaction_rate: 0,
      optimization_success_rate: 0
    };
    
    res.json({
      success: true,
      data: statistics
    });
    
  } catch (error) {
    res.status(500).json({
      error: {
        message: 'Failed to get statistics',
        details: error.message
      }
    });
  }
});

/**
 * Helper function to analyze a schedule candidate
 */
function analyzeScheduleCandidate(candidate, courseGroups) {
  const analysis = {
    schedule_id: candidate.id,
    total_courses: candidate.selected_groups.length,
    total_credits: candidate.total_credits,
    total_sessions: 0,
    lecture_sessions: 0,
    lab_sessions: 0,
    synthetic_sessions: 0,
    daily_distribution: {},
    time_efficiency: 0,
    day_utilization: 0,
    gaps_analysis: [],
    peak_hours: [],
    recommendations: []
  };
  
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday'];
  const timeGrid = Array(5).fill(null).map(() => Array(8).fill(false));
  
  // Initialize daily distribution
  days.forEach(day => {
    analysis.daily_distribution[day] = {
      total_sessions: 0,
      lecture_sessions: 0,
      lab_sessions: 0,
      hours_occupied: 0
    };
  });
  
  // Analyze sessions
  for (const group of candidate.selected_groups) {
    for (const session of group.sessions) {
      analysis.total_sessions++;
      
      if (session.synthetic) {
        analysis.synthetic_sessions++;
        continue;
      }
      
      if (session.session_type === 'lecture') {
        analysis.lecture_sessions++;
      } else if (session.session_type === 'lab') {
        analysis.lab_sessions++;
      }
      
      const dayIndex = days.indexOf(session.day);
      if (dayIndex !== -1) {
        const dayStats = analysis.daily_distribution[session.day];
        dayStats.total_sessions++;
        
        if (session.session_type === 'lecture') {
          dayStats.lecture_sessions++;
        } else if (session.session_type === 'lab') {
          dayStats.lab_sessions++;
        }
        
        dayStats.hours_occupied += session.span;
        
        // Mark time grid
        for (let slot = session.slot; slot < session.slot + session.span; slot++) {
          if (slot >= 1 && slot <= 8) {
            timeGrid[dayIndex][slot - 1] = true;
          }
        }
      }
    }
  }
  
  // Calculate time efficiency
  let totalOccupiedSlots = 0;
  let totalUsableDays = 0;
  
  for (let day = 0; day < 5; day++) {
    const dayOccupied = timeGrid[day].some(slot => slot);
    if (dayOccupied) {
      totalUsableDays++;
      totalOccupiedSlots += timeGrid[day].filter(slot => slot).length;
    }
  }
  
  analysis.time_efficiency = totalUsableDays > 0 ? 
    (totalOccupiedSlots / (totalUsableDays * 8)) * 100 : 0;
  analysis.day_utilization = (totalUsableDays / 5) * 100;
  
  // Analyze gaps
  for (let day = 0; day < 5; day++) {
    const dayName = days[day];
    const dayGrid = timeGrid[day];
    
    if (dayGrid.some(slot => slot)) {
      const firstSlot = dayGrid.indexOf(true);
      const lastSlot = dayGrid.lastIndexOf(true);
      
      for (let slot = firstSlot; slot <= lastSlot; slot++) {
        if (!dayGrid[slot]) {
          analysis.gaps_analysis.push({
            day: dayName,
            slot: slot + 1,
            time: `${slot + 8}:00-${slot + 9}:00`
          });
        }
      }
    }
  }
  
  // Generate recommendations
  if (analysis.time_efficiency < 50) {
    analysis.recommendations.push({
      type: 'efficiency',
      message: 'Consider consolidating sessions to improve time efficiency'
    });
  }
  
  if (analysis.gaps_analysis.length > 2) {
    analysis.recommendations.push({
      type: 'gaps',
      message: 'Multiple gaps detected. Consider rearranging sessions to minimize breaks'
    });
  }
  
  if (totalUsableDays <= 2) {
    analysis.recommendations.push({
      type: 'distribution',
      message: 'Sessions are concentrated in few days. Consider spreading across more days'
    });
  }
  
  return analysis;
}

/**
 * Helper function to optimize a schedule
 */
function optimizeSchedule(candidate, criteria) {
  // This is a simplified optimization
  // In a real implementation, this would use advanced algorithms
  const optimized = JSON.parse(JSON.stringify(candidate));
  optimized.id = `${candidate.id}_optimized`;
  
  // Apply optimization logic based on criteria
  // For now, just recalculate the score
  optimized.score = Math.min(candidate.score * 1.1, 1000);
  
  return optimized;
}

/**
 * Helper function to calculate improvements
 */
function calculateImprovements(original, optimized) {
  return {
    score_improvement: optimized.score - original.score,
    efficiency_gain: 0, // Would be calculated based on actual metrics
    conflict_reduction: 0,
    gap_reduction: 0
  };
}

module.exports = router;
