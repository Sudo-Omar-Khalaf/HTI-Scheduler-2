import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Calendar, BookOpen, Clock, MapPin, User, CheckCircle, AlertCircle } from 'lucide-react';
import { scheduleAPI } from '../services/api';
import toast from 'react-hot-toast';

/**
 * Personalized Schedule Generator Component
 * Allows users to input course codes and generates a weekly schedule table
 */
const PersonalizedScheduleGenerator = ({ parsedData }) => {
  const [courseInput, setCourseInput] = useState('');
  const [selectedCourses, setSelectedCourses] = useState([]);
  const [generatedSchedule, setGeneratedSchedule] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [validationErrors, setValidationErrors] = useState([]);

  // Extract courseGroups from parsedData
  const courseGroups = parsedData?.course_groups || [];

  // Days and time slots for the weekly table
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const timeSlots = [
    '9.00 - 9.45',
    '9.45 - 10.30', 
    '10.40 - 11.25',
    '11.25 - 12.10',
    '12.20 - 1.05',
    '1.05 - 1.50',
    '2.00 - 2.45',
    '2.45 - 3.30'
  ];

  const handleAddCourse = () => {
    if (!courseInput.trim()) return;
    
    const courses = courseInput.split(',').map(c => c.trim()).filter(c => c);
    const newCourses = [];
    
    for (const course of courses) {
      if (!selectedCourses.find(sc => sc === course)) {
        newCourses.push(course);
      }
    }
    
    if (newCourses.length > 0) {
      setSelectedCourses([...selectedCourses, ...newCourses]);
      setCourseInput('');
      toast.success(`تم إضافة ${newCourses.length} مقرر`);
    }
  };

  const handleRemoveCourse = (courseToRemove) => {
    setSelectedCourses(selectedCourses.filter(c => c !== courseToRemove));
  };

  const generatePersonalizedSchedule = async () => {
    if (selectedCourses.length === 0) {
      toast.error('يرجى إضافة مقررات أولاً');
      return;
    }

    setIsGenerating(true);
    setValidationErrors([]);

    try {
      const userRequest = {
        desired_courses: selectedCourses
      };

      console.log('🎯 Generating personalized schedule for:', selectedCourses);
      console.log('📊 Course groups available:', courseGroups.length);
      console.log('📝 First few course groups:', courseGroups.slice(0, 3));
      
      const response = await scheduleAPI.generatePersonalized(courseGroups, userRequest);
      
      console.log('✅ API Response:', response);
      
      if (response.data.success) {
        setGeneratedSchedule(response.data.schedule);
        toast.success('تم إنشاء الجدول الشخصي بنجاح!');
      } else {
        setValidationErrors(response.data.validation_errors || []);
        toast.error(response.data.error || 'فشل في إنشاء الجدول');
      }
    } catch (error) {
      console.error('❌ Schedule generation error:', error);
      setValidationErrors(error.response?.data?.validation_errors || []);
      toast.error(error.response?.data?.error?.message || 'حدث خطأ في إنشاء الجدول');
    } finally {
      setIsGenerating(false);
    }
  };

  const renderCourseBlock = (cell) => {
    if (!cell || cell.is_continuation) return null;

    return (
      <div className="bg-blue-50 border border-blue-200 rounded p-1 text-xs h-full">
        {/* Row 1: Course Code + Groups */}
        <div className="font-bold text-blue-800 text-center">
          {cell.row1_course_info.display_text}
        </div>
        
        {/* Row 2: Course Name */}
        <div className="text-blue-600 text-center mt-1 text-[10px]">
          {cell.row2_course_name.display_text || 'اسم المقرر'}
        </div>
        
        {/* Row 3: Hall + Professor */}
        <div className="text-blue-500 text-center mt-1 text-[10px]">
          {cell.row3_details.display_text || 'القاعة - الأستاذ'}
        </div>
      </div>
    );
  };

  const renderWeeklyTable = () => {
    if (!generatedSchedule?.weekly_table) return null;

    return (
      <div className="overflow-x-auto">
        <table className="w-full border-collapse border border-gray-300 text-sm">
          <thead>
            <tr className="bg-gray-100">
              <th className="border border-gray-300 p-2 text-center font-bold">اليوم / الوقت</th>
              {timeSlots.map((slot, index) => (
                <th key={index} className="border border-gray-300 p-2 text-center text-xs min-w-[120px]">
                  <div>الفترة {index + 1}</div>
                  <div className="text-[10px] text-gray-600">{slot}</div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {days.map((day) => (
              <tr key={day} className="h-20">
                <td className="border border-gray-300 p-2 font-bold text-center bg-gray-50">
                  {day === 'Sunday' ? 'الأحد' :
                   day === 'Monday' ? 'الاثنين' :
                   day === 'Tuesday' ? 'الثلاثاء' :
                   day === 'Wednesday' ? 'الأربعاء' :
                   day === 'Thursday' ? 'الخميس' :
                   day === 'Friday' ? 'الجمعة' :
                   day === 'Saturday' ? 'السبت' : day}
                </td>
                {timeSlots.map((_, slotIndex) => {
                  const cell = generatedSchedule.weekly_table.schedule[day]?.[slotIndex];
                  return (
                    <td key={slotIndex} className="border border-gray-300 p-1 relative">
                      {renderCourseBlock(cell)}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Course Input Section */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
          <BookOpen className="ml-2" />
          إدخال المقررات المطلوبة
        </h3>
        
        <div className="flex gap-3 mb-4">
          <input
            type="text"
            value={courseInput}
            onChange={(e) => setCourseInput(e.target.value)}
            placeholder="أدخل رموز المقررات (مثال: EEC 101, EEC 11305, EEC 142)"
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            onKeyPress={(e) => e.key === 'Enter' && handleAddCourse()}
          />
          <button
            onClick={handleAddCourse}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            إضافة
          </button>
        </div>

        {/* Selected Courses */}
        {selectedCourses.length > 0 && (
          <div className="mb-4">
            <h4 className="font-semibold text-gray-700 mb-2">المقررات المحددة:</h4>
            <div className="flex flex-wrap gap-2">
              {selectedCourses.map((course, index) => (
                <span
                  key={index}
                  className="inline-flex items-center bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm"
                >
                  {course}
                  <button
                    onClick={() => handleRemoveCourse(course)}
                    className="mr-2 text-blue-600 hover:text-blue-800"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Generate Button */}
        <button
          onClick={generatePersonalizedSchedule}
          disabled={isGenerating || selectedCourses.length === 0}
          className="w-full py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
        >
          {isGenerating ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              جاري إنشاء الجدول...
            </>
          ) : (
            <>
              <Calendar className="ml-2" />
              إنشاء الجدول الشخصي
            </>
          )}
        </button>
      </div>

      {/* Validation Errors */}
      {validationErrors.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-red-50 border border-red-200 rounded-lg p-4"
        >
          <div className="flex items-center mb-2">
            <AlertCircle className="h-5 w-5 text-red-600 ml-2" />
            <h4 className="font-semibold text-red-800">أخطاء في التحقق:</h4>
          </div>
          <ul className="list-disc list-inside space-y-1">
            {validationErrors.map((error, index) => (
              <li key={index} className="text-red-700 text-sm">{error}</li>
            ))}
          </ul>
        </motion.div>
      )}

      {/* Generated Schedule */}
      {generatedSchedule && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-lg shadow-md p-6"
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-gray-800 flex items-center">
              <CheckCircle className="ml-2 text-green-600" />
              الجدول الأسبوعي الشخصي
            </h3>
            <div className="text-sm text-gray-600">
              إجمالي المقررات: {generatedSchedule.course_selection?.length || 0} |
              إجمالي الفترات: {generatedSchedule.generation_metadata?.total_spans || 0}
            </div>
          </div>

          {/* Weekly Schedule Table */}
          {renderWeeklyTable()}

          {/* Schedule Metadata */}
          {generatedSchedule.span_validation && (
            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h4 className="font-semibold text-green-800 mb-2">ملخص التحقق من الفترات:</h4>
                <div className="space-y-1 text-sm">
                  {generatedSchedule.span_validation.course_span_summary?.map((course, index) => (
                    <div key={index} className="flex justify-between">
                      <span>{course.course_code} ({course.group_number})</span>
                      <span className={course.is_valid ? 'text-green-600' : 'text-red-600'}>
                        {course.actual_spans}/{course.expected_spans} فترات
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {generatedSchedule.conflict_validation && (
                <div className={`border rounded-lg p-4 ${
                  generatedSchedule.conflict_validation.has_conflicts 
                    ? 'bg-red-50 border-red-200' 
                    : 'bg-green-50 border-green-200'
                }`}>
                  <h4 className={`font-semibold mb-2 ${
                    generatedSchedule.conflict_validation.has_conflicts 
                      ? 'text-red-800' 
                      : 'text-green-800'
                  }`}>
                    فحص التضارب:
                  </h4>
                  <div className="text-sm">
                    {generatedSchedule.conflict_validation.has_conflicts ? (
                      <div>
                        <span className="text-red-600">
                          تم العثور على {generatedSchedule.conflict_validation.total_conflicts} تضارب
                        </span>
                        {generatedSchedule.conflict_validation.conflicts?.slice(0, 3).map((conflict, index) => (
                          <div key={index} className="text-xs text-red-500 mt-1">
                            {conflict.day} - {conflict.course1} ↔ {conflict.course2}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <span className="text-green-600">✅ لا توجد تضاربات</span>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
};

export default PersonalizedScheduleGenerator;
