import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import api from '../services/api';
import PersonalizedScheduleGenerator from '../components/PersonalizedScheduleGenerator';

const SchedulePage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [schedules, setSchedules] = useState([]);
  const [selectedSchedule, setSelectedSchedule] = useState(null);
  const [activeTab, setActiveTab] = useState('auto'); // 'auto' or 'manual'
  const [userPreferences, setUserPreferences] = useState({
    preferredCourses: [],
    avoidedTimeSlots: [],
    maxCoursesPerDay: 4,
    preferMorningClasses: false
  });
  const [error, setError] = useState(null);

  // Get parsed data from navigation state or sessionStorage
  const { parsedData: navigationParsedData, normalizationReport } = location.state || {};
  const [parsedData, setParsedData] = useState(navigationParsedData);

  useEffect(() => {
    console.log('🔍 SchedulePage mounted');
    console.log('📊 Navigation state:', location.state);
    console.log('📝 parsedData from navigation:', navigationParsedData);
    console.log('💾 sessionStorage uploadResults:', sessionStorage.getItem('uploadResults'));
    
    // If no data from navigation, try to get from sessionStorage
    if (!parsedData) {
      console.log('⚠️ No parsedData, checking sessionStorage...');
      const storedResults = sessionStorage.getItem('uploadResults');
      if (storedResults) {
        try {
          const parsed = JSON.parse(storedResults);
          console.log('✅ Found stored results:', parsed);
          setParsedData(parsed?.parsing || parsed);
        } catch (error) {
          console.error('❌ Error parsing stored results:', error);
          navigate('/upload');
          return;
        }
      } else {
        console.log('❌ No stored results found, redirecting to upload...');
        navigate('/upload');
        return;
      }
    }
  }, [parsedData, navigate]);

  // Debug selectedSchedule changes
  useEffect(() => {
    console.log('📊 selectedSchedule changed:', selectedSchedule);
    if (selectedSchedule) {
      console.log('⚠️ selectedSchedule is set, this might trigger export navigation');
    }
  }, [selectedSchedule]);

  const generateSchedules = async () => {
    if (!parsedData) return;

    setLoading(true);
    setError(null);

    try {
      const response = await api.generateSchedules({
        courseGroups: parsedData.course_groups || [],
        preferences: userPreferences
      });

      setSchedules(response.schedules || []);
      if (response.schedules && response.schedules.length > 0) {
        setSelectedSchedule(response.schedules[0]);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'فشل في توليد الجداول');
    } finally {
      setLoading(false);
    }
  };

  const handlePreferenceChange = (key, value) => {
    setUserPreferences(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const addPreferredCourse = (courseCode) => {
    if (!userPreferences.preferredCourses.includes(courseCode)) {
      setUserPreferences(prev => ({
        ...prev,
        preferredCourses: [...prev.preferredCourses, courseCode]
      }));
    }
  };

  const removePreferredCourse = (courseCode) => {
    setUserPreferences(prev => ({
      ...prev,
      preferredCourses: prev.preferredCourses.filter(code => code !== courseCode)
    }));
  };

  const exportSchedule = () => {
    console.log('🚨 exportSchedule called with selectedSchedule:', selectedSchedule);
    if (selectedSchedule) {
      console.log('📤 Navigating to export page...');
      navigate('/export', { 
        state: { 
          schedule: selectedSchedule,
          parsedData: parsedData 
        } 
      });
    }
  };

  if (!parsedData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">لا توجد بيانات متاحة</h2>
          <p className="text-gray-600 mb-4">يرجى رفع ملف Excel أولاً</p>
          <button
            onClick={() => navigate('/upload')}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
          >
            رفع ملف
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">إنشاء الجداول الدراسية</h1>
          <p className="text-gray-600">
            قم بتخصيص تفضيلاتك وإنشاء جداول دراسية محسّنة
          </p>
          
          {/* Tab Navigation */}
          <div className="mt-6 border-b border-gray-200">
            <nav className="-mb-px flex space-x-8 space-x-reverse">
              <button
                onClick={() => setActiveTab('auto')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'auto'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                توليد تلقائي للجداول
              </button>
              <button
                onClick={() => setActiveTab('manual')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'manual'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                إنشاء جدول شخصي
              </button>
            </nav>
          </div>
        </div>

        {/* Conditional Content Based on Active Tab */}
        {activeTab === 'manual' ? (
          /* Personalized Schedule Generator */
          <PersonalizedScheduleGenerator parsedData={parsedData} />
        ) : (
          /* Auto Generation Tab Content */
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Preferences Panel */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">التفضيلات</h2>
                
                {/* Max Courses Per Day */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    أقصى عدد مواد في اليوم
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="8"
                    value={userPreferences.maxCoursesPerDay}
                    onChange={(e) => handlePreferenceChange('maxCoursesPerDay', parseInt(e.target.value))}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                {/* Prefer Morning Classes */}
                <div className="mb-4">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={userPreferences.preferMorningClasses}
                      onChange={(e) => handlePreferenceChange('preferMorningClasses', e.target.checked)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <span className="mr-2 text-sm text-gray-700">تفضيل المحاضرات الصباحية</span>
                  </label>
                </div>

                {/* Preferred Courses */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    المواد المفضلة
                  </label>
                  <div className="space-y-2">
                    {parsedData?.course_groups?.map(group => (
                      <label key={`${group.course_code}-${group.group_code}`} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={userPreferences.preferredCourses.includes(group.course_code)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              addPreferredCourse(group.course_code);
                            } else {
                              removePreferredCourse(group.course_code);
                            }
                          }}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <span className="mr-2 text-sm text-gray-700">
                          {group.course_code} - {group.course_name || 'غير محدد'}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                <button
                  onClick={generateSchedules}
                  disabled={loading}
                  className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'جاري إنشاء الجداول...' : 'إنشاء الجداول'}
                </button>
              </div>            {/* Course Groups Summary */}
            <div className="bg-white rounded-lg shadow-md p-6 mt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">ملخص المواد</h3>
              <div className="space-y-2">
                {parsedData?.course_groups?.map(group => (
                  <div key={`${group.course_code}-${group.group_code}`} className="flex justify-between items-center text-sm">
                    <span>{group.course_code} - مجموعة {group.group_code}</span>
                    <span className="text-gray-500">{group.sessions?.length || 0} جلسة</span>
                  </div>
                ))}
              </div>
            </div>
            </div>

            {/* Schedule Display */}
            <div className="lg:col-span-2">
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="mr-3">
                      <h3 className="text-sm font-medium text-red-800">خطأ</h3>
                      <div className="mt-2 text-sm text-red-700">{error}</div>
                    </div>
                  </div>
                </div>
              )}

              {schedules.length > 0 ? (
                <div className="bg-white rounded-lg shadow-md">
                  {/* Schedule Selector */}
                  <div className="border-b border-gray-200 p-6">
                    <div className="flex justify-between items-center">
                      <h2 className="text-xl font-semibold text-gray-900">
                        الجداول المتاحة ({schedules.length})
                      </h2>
                      <div className="flex space-x-4 space-x-reverse">
                        <select
                          value={schedules.findIndex(s => s === selectedSchedule)}
                          onChange={(e) => setSelectedSchedule(schedules[parseInt(e.target.value)])}
                          className="border border-gray-300 rounded-md px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                          {schedules.map((schedule, index) => (
                            <option key={index} value={index}>
                              الجدول {index + 1} (نقاط: {schedule.score?.toFixed(2) || 'غير محدد'})
                            </option>
                          ))}
                        </select>
                        <button
                          onClick={exportSchedule}
                          className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
                        >
                          تصدير الجدول
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Schedule Grid */}
                  {selectedSchedule && (
                    <div className="p-6">
                      <ScheduleGrid schedule={selectedSchedule} />
                    </div>
                  )}
                </div>
              ) : (
                <div className="bg-white rounded-lg shadow-md p-12">
                  <div className="text-center">
                    <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <h3 className="mt-2 text-sm font-medium text-gray-900">لا توجد جداول متاحة</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      انقر على "إنشاء الجداول" لبدء توليد الجداول الدراسية
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Schedule Grid Component
const ScheduleGrid = ({ schedule }) => {
  const days = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس'];
  const timeSlots = ['8:00', '9:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00'];

  const getSessionAtTimeSlot = (day, timeSlot) => {
    return schedule.sessions?.find(session => {
      const sessionDay = session.dayOfWeek?.toLowerCase();
      const dayMap = {
        'الأحد': 'sunday',
        'الاثنين': 'monday', 
        'الثلاثاء': 'tuesday',
        'الأربعاء': 'wednesday',
        'الخميس': 'thursday'
      };
      
      return dayMap[day] === sessionDay && 
             session.startTime <= timeSlot && 
             session.endTime > timeSlot;
    });
  };

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              الوقت
            </th>
            {days.map(day => (
              <th key={day} className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                {day}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {timeSlots.map(timeSlot => (
            <tr key={timeSlot}>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                {timeSlot}
              </td>
              {days.map(day => {
                const session = getSessionAtTimeSlot(day, timeSlot);
                return (
                  <td key={`${day}-${timeSlot}`} className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {session ? (
                      <div className="bg-blue-100 border border-blue-200 rounded-md p-2">
                        <div className="font-medium text-blue-900">{session.courseCode}</div>
                        <div className="text-xs text-blue-700">{session.courseName}</div>
                        <div className="text-xs text-blue-600">
                          {session.sessionType} - {session.location}
                        </div>
                      </div>
                    ) : null}
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

export default SchedulePage;
