import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import api from '../services/api';

const ExportPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [exportFormat, setExportFormat] = useState('excel');
  const [exportOptions, setExportOptions] = useState({
    includeMetadata: true,
    includeStats: true,
    arabicRTL: true,
    mergeCells: true
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  // Get schedule data from navigation state
  const { schedule, parsedData } = location.state || {};

  React.useEffect(() => {
    if (!schedule) {
      navigate('/upload');
      return;
    }
  }, [schedule, navigate]);

  const handleExport = async () => {
    if (!schedule) return;

    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const response = await api.exportSchedule({
        schedule,
        format: exportFormat,
        options: exportOptions
      });

      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      
      const extension = exportFormat === 'excel' ? 'xlsx' : 'csv';
      const timestamp = new Date().toISOString().split('T')[0];
      link.setAttribute('download', `schedule_${timestamp}.${extension}`);
      
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      setSuccess(true);
    } catch (err) {
      setError(err.response?.data?.error || 'فشل في تصدير الجدول');
    } finally {
      setLoading(false);
    }
  };

  const handleOptionChange = (key, value) => {
    setExportOptions(prev => ({
      ...prev,
      [key]: value
    }));
  };

  if (!schedule) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">لا يوجد جدول للتصدير</h2>
          <p className="text-gray-600 mb-4">يرجى إنشاء جدول أولاً</p>
          <button
            onClick={() => navigate('/upload')}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
          >
            العودة للرفع
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">تصدير الجدول الدراسي</h1>
          <p className="text-gray-600">
            اختر تنسيق التصدير والخيارات المناسبة لك
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Export Options */}
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">خيارات التصدير</h2>
              
              {/* Format Selection */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  تنسيق التصدير
                </label>
                <div className="space-y-2">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="format"
                      value="excel"
                      checked={exportFormat === 'excel'}
                      onChange={(e) => setExportFormat(e.target.value)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                    />
                    <span className="mr-3">
                      <span className="text-sm font-medium text-gray-900">Excel (.xlsx)</span>
                      <span className="block text-xs text-gray-500">
                        يدعم التنسيق المتقدم والخلايا المدمجة
                      </span>
                    </span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="format"
                      value="csv"
                      checked={exportFormat === 'csv'}
                      onChange={(e) => setExportFormat(e.target.value)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                    />
                    <span className="mr-3">
                      <span className="text-sm font-medium text-gray-900">CSV (.csv)</span>
                      <span className="block text-xs text-gray-500">
                        ملف نصي بسيط يمكن فتحه في أي برنامج
                      </span>
                    </span>
                  </label>
                </div>
              </div>

              {/* Export Options */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900">خيارات إضافية</h3>
                
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={exportOptions.includeMetadata}
                    onChange={(e) => handleOptionChange('includeMetadata', e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span className="mr-3">
                    <span className="text-sm font-medium text-gray-900">تضمين البيانات الوصفية</span>
                    <span className="block text-xs text-gray-500">
                      معلومات الملف وتاريخ الإنشاء
                    </span>
                  </span>
                </label>

                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={exportOptions.includeStats}
                    onChange={(e) => handleOptionChange('includeStats', e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span className="mr-3">
                    <span className="text-sm font-medium text-gray-900">تضمين الإحصائيات</span>
                    <span className="block text-xs text-gray-500">
                      عدد المواد والساعات الإجمالية
                    </span>
                  </span>
                </label>

                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={exportOptions.arabicRTL}
                    onChange={(e) => handleOptionChange('arabicRTL', e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span className="mr-3">
                    <span className="text-sm font-medium text-gray-900">دعم اللغة العربية (RTL)</span>
                    <span className="block text-xs text-gray-500">
                      تنسيق النص من اليمين إلى اليسار
                    </span>
                  </span>
                </label>

                {exportFormat === 'excel' && (
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={exportOptions.mergeCells}
                      onChange={(e) => handleOptionChange('mergeCells', e.target.checked)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <span className="mr-3">
                      <span className="text-sm font-medium text-gray-900">دمج الخلايا المتشابهة</span>
                      <span className="block text-xs text-gray-500">
                        دمج خلايا المواد المتتالية لمظهر أفضل
                      </span>
                    </span>
                  </label>
                )}
              </div>

              {/* Export Button */}
              <div className="mt-6">
                <button
                  onClick={handleExport}
                  disabled={loading}
                  className="w-full bg-green-600 text-white py-3 px-4 rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin -ml-1 ml-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      جاري التصدير...
                    </>
                  ) : (
                    <>
                      <svg className="h-5 w-5 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      تصدير الجدول
                    </>
                  )}
                </button>
              </div>

              {/* Status Messages */}
              {error && (
                <div className="mt-4 bg-red-50 border border-red-200 rounded-md p-4">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="mr-3">
                      <h3 className="text-sm font-medium text-red-800">خطأ في التصدير</h3>
                      <div className="mt-2 text-sm text-red-700">{error}</div>
                    </div>
                  </div>
                </div>
              )}

              {success && (
                <div className="mt-4 bg-green-50 border border-green-200 rounded-md p-4">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="mr-3">
                      <h3 className="text-sm font-medium text-green-800">تم التصدير بنجاح</h3>
                      <div className="mt-2 text-sm text-green-700">
                        تم تحميل الملف بنجاح إلى جهازك
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Navigation */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">خيارات أخرى</h3>
              <div className="space-y-3">
                <button
                  onClick={() => navigate('/schedule', { state: { parsedData, normalizationReport: null } })}
                  className="w-full text-left px-4 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-md"
                >
                  العودة لصفحة الجداول
                </button>
                <button
                  onClick={() => navigate('/upload')}
                  className="w-full text-left px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-md"
                >
                  رفع ملف جديد
                </button>
              </div>
            </div>
          </div>

          {/* Schedule Preview */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">معاينة الجدول</h2>
            
            {/* Schedule Summary */}
            <div className="mb-6">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="bg-gray-50 p-3 rounded-md">
                  <div className="font-medium text-gray-900">عدد المواد</div>
                  <div className="text-2xl font-bold text-blue-600">
                    {schedule.sessions?.length || 0}
                  </div>
                </div>
                <div className="bg-gray-50 p-3 rounded-md">
                  <div className="font-medium text-gray-900">نقاط الجدول</div>
                  <div className="text-2xl font-bold text-green-600">
                    {schedule.score?.toFixed(1) || 'N/A'}
                  </div>
                </div>
              </div>
            </div>

            {/* Course List */}
            <div className="mb-6">
              <h3 className="text-lg font-medium text-gray-900 mb-3">المواد المشمولة</h3>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {schedule.sessions?.map((session, index) => (
                  <div key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded-md">
                    <div>
                      <div className="font-medium text-gray-900">{session.courseCode}</div>
                      <div className="text-sm text-gray-600">{session.courseName}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium text-gray-900">{session.sessionType}</div>
                      <div className="text-xs text-gray-500">{session.dayOfWeek} - {session.startTime}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Schedule Conflicts (if any) */}
            {schedule.conflicts && schedule.conflicts.length > 0 && (
              <div>
                <h3 className="text-lg font-medium text-red-600 mb-3">تضارب في الجدول</h3>
                <div className="space-y-2">
                  {schedule.conflicts.map((conflict, index) => (
                    <div key={index} className="p-2 bg-red-50 border border-red-200 rounded-md">
                      <div className="text-sm text-red-800">{conflict.message}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExportPage;
