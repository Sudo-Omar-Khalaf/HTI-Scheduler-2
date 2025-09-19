import React, { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'
import { 
  Upload, 
  FileSpreadsheet, 
  CheckCircle, 
  AlertCircle,
  Settings,
  Eye,
  ArrowLeft,
  Loader2,
  X,
  Download
} from 'lucide-react'
import { excelAPI, formatFileSize } from '../services/api'

const UploadPage = () => {
  const navigate = useNavigate()
  const [file, setFile] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [results, setResults] = useState(null)
  const [showNormalization, setShowNormalization] = useState(false)
  const [normalizationOptions, setNormalizationOptions] = useState({
    normalize: false,
    applyAdjustments: false
  })

  const onDrop = useCallback((acceptedFiles, rejectedFiles) => {
    if (rejectedFiles.length > 0) {
      const error = rejectedFiles[0].errors[0]
      if (error.code === 'file-too-large') {
        toast.error('حجم الملف كبير جداً. الحد الأقصى 10 ميجابايت')
      } else if (error.code === 'file-invalid-type') {
        toast.error('نوع الملف غير مدعوم. يُرجى رفع ملف Excel (.xlsx, .xls, .xlsm)')
      } else {
        toast.error('خطأ في الملف: ' + error.message)
      }
      return
    }

    if (acceptedFiles.length > 0) {
      setFile(acceptedFiles[0])
      setResults(null)
    }
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls'],
      'application/vnd.ms-excel.sheet.macroEnabled.12': ['.xlsm']
    },
    maxSize: 10 * 1024 * 1024, // 10MB
    multiple: false
  })

  const handleUpload = async () => {
    if (!file) return

    setUploading(true)
    const formData = new FormData()
    formData.append('excelFile', file)
    formData.append('normalize', normalizationOptions.normalize.toString())
    formData.append('applyAdjustments', normalizationOptions.applyAdjustments.toString())

    try {
      const response = await excelAPI.parseFile(formData)
      console.log('API Response:', response) // Debug log
      console.log('Response data structure:', JSON.stringify(response.data, null, 2)) // Detailed debug log
      setResults(response.data) // Use response.data instead of response
      toast.success('تم تحليل الملف بنجاح!')
      
      // Store results in sessionStorage for use in other pages
      sessionStorage.setItem('uploadResults', JSON.stringify(response.data))
    } catch (error) {
      console.error('Upload error:', error)
      console.error('Error response:', error.response) // Debug log
      toast.error(error.response?.data?.error?.message || 'فشل في تحليل الملف')
    } finally {
      setUploading(false)
    }
  }

  const resetUpload = () => {
    setFile(null)
    setResults(null)
    setShowNormalization(false)
    setNormalizationOptions({ normalize: false, applyAdjustments: false })
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          رفع ملف الجدول الدراسي
        </h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          ارفع ملف Excel الذي يحتوي على جدولك الدراسي لتحليله وإنشاء جداول محسّنة
        </p>
      </div>

      {/* Upload Area */}
      {!results && (
        <div className="max-w-2xl mx-auto">
          <div 
            {...getRootProps()} 
            className={`upload-zone ${isDragActive ? 'dragover' : ''}`}
          >
            <input {...getInputProps()} />
            <div className="flex flex-col items-center justify-center space-y-4">
              {uploading ? (
                <>
                  <Loader2 className="h-12 w-12 text-primary-600 animate-spin" />
                  <p className="text-lg font-medium text-gray-700">
                    جاري تحليل الملف...
                  </p>
                  <p className="text-sm text-gray-500">
                    قد تستغرق هذه العملية بضع ثوانٍ
                  </p>
                </>
              ) : (
                <>
                  <FileSpreadsheet className="h-16 w-16 text-gray-400" />
                  <div className="text-center">
                    <p className="text-lg font-medium text-gray-700">
                      اسحب ملف Excel هنا أو انقر للاختيار
                    </p>
                    <p className="text-sm text-gray-500 mt-2">
                      يدعم ملفات .xlsx و .xls و .xlsm حتى 10 ميجابايت
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* File Info */}
          {file && !uploading && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3 space-x-reverse">
                  <FileSpreadsheet className="h-8 w-8 text-blue-600" />
                  <div>
                    <p className="font-medium text-blue-900">{file.name}</p>
                    <p className="text-sm text-blue-700">{formatFileSize(file.size)}</p>
                  </div>
                </div>
                <button
                  onClick={() => setFile(null)}
                  className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </motion.div>
          )}

          {/* Normalization Options */}
          {file && !uploading && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-6 card"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  خيارات المعالجة
                </h3>
                <button
                  onClick={() => setShowNormalization(!showNormalization)}
                  className="text-primary-600 hover:text-primary-700"
                >
                  <Settings className="h-5 w-5" />
                </button>
              </div>

              <AnimatePresence>
                {showNormalization && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="space-y-4 overflow-hidden"
                  >
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="normalize"
                        checked={normalizationOptions.normalize}
                        onChange={(e) => setNormalizationOptions({
                          ...normalizationOptions,
                          normalize: e.target.checked
                        })}
                        className="form-checkbox"
                      />
                      <label htmlFor="normalize" className="mr-3 text-sm text-gray-700">
                        تطبيق التطبيع والتحقق من البيانات
                      </label>
                    </div>

                    {normalizationOptions.normalize && (
                      <div className="mr-6 flex items-center">
                        <input
                          type="checkbox"
                          id="applyAdjustments"
                          checked={normalizationOptions.applyAdjustments}
                          onChange={(e) => setNormalizationOptions({
                            ...normalizationOptions,
                            applyAdjustments: e.target.checked
                          })}
                          className="form-checkbox"
                        />
                        <label htmlFor="applyAdjustments" className="mr-3 text-sm text-gray-700">
                          تطبيق التعديلات المقترحة تلقائياً
                        </label>
                      </div>
                    )}

                    <div className="bg-gray-50 p-3 rounded-lg text-sm text-gray-600">
                      <p className="font-medium mb-1">ملاحظة:</p>
                      <p>
                        التطبيع يساعد في التحقق من صحة البيانات ومطابقتها للمعايير المطلوبة.
                        التعديلات التلقائية قد تضيف جلسات افتراضية أو تعيد تصنيف الجلسات الموجودة.
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="mt-6 flex justify-end space-x-3 space-x-reverse">
                <button
                  onClick={resetUpload}
                  className="btn btn-outline"
                >
                  إلغاء
                </button>
                <button
                  onClick={handleUpload}
                  disabled={uploading}
                  className="btn btn-primary"
                >
                  {uploading ? (
                    <>
                      <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                      جاري التحليل...
                    </>
                  ) : (
                    <>
                      <Upload className="ml-2 h-4 w-4" />
                      تحليل الملف
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          )}
        </div>
      )}

      {/* Results */}
      {results && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Success Header */}
          <div className="text-center bg-green-50 border border-green-200 rounded-lg p-6">
            <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-green-900 mb-2">
              تم تحليل الملف بنجاح!
            </h2>
            <p className="text-green-700">
              تم استخراج {results?.data?.parsing?.course_groups?.length || 0} مجموعة مقرر
              من {results?.data?.parsing?.parsing_summary?.course_codes_found || 0} مقرراً مختلفاً
            </p>
          </div>

          {/* Parsing Results */}
          {results?.data?.parsing && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="card text-center">
                  <div className="text-3xl font-bold text-primary-600 mb-2">
                    {results.data.parsing.parsing_summary?.course_codes_found || 0}
                  </div>
                  <div className="text-sm text-gray-600">مقررات مختلفة</div>
                </div>
                <div className="card text-center">
                  <div className="text-3xl font-bold text-green-600 mb-2">
                    {results.data.parsing.course_groups?.length || 0}
                  </div>
                  <div className="text-sm text-gray-600">مجموعات إجمالية</div>
                </div>
                <div className="card text-center">
                  <div className="text-3xl font-bold text-blue-600 mb-2">
                    {results.data.parsing.schedule_entries?.length || 0}
                  </div>
                  <div className="text-sm text-gray-600">جلسات تم تحليلها</div>
                </div>
              </div>
            </>
          )}

          {/* Show error state if parsing failed */}
          {!results?.data?.parsing && (
            <div className="text-center bg-red-50 border border-red-200 rounded-lg p-6">
              <AlertCircle className="h-12 w-12 text-red-600 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-red-900 mb-2">
                خطأ في تحليل الملف
              </h2>
              <p className="text-red-700">
                لم يتم تحليل الملف بشكل صحيح. يُرجى المحاولة مرة أخرى.
              </p>
            </div>
          )}

          {/* Normalization Results */}
          {results?.data?.normalization && (
            <div className="card">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                نتائج التطبيع والتحقق
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="text-2xl font-bold text-red-600 mb-1">
                    {results.data.normalization.report?.total_deficits || 0}
                  </div>
                  <div className="text-sm text-red-700">نقص في الساعات</div>
                </div>
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="text-2xl font-bold text-yellow-600 mb-1">
                    {results.data.normalization.report?.total_overages || 0}
                  </div>
                  <div className="text-sm text-yellow-700">زيادة في الساعات</div>
                </div>
              </div>
              
              {(results.data.normalization.report?.inconsistencies?.length || 0) > 0 && (
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                  <div className="flex items-center mb-2">
                    <AlertCircle className="h-5 w-5 text-orange-600 ml-2" />
                    <span className="font-medium text-orange-900">
                      تم اكتشاف {results.data.normalization.report.inconsistencies.length} تضارب
                    </span>
                  </div>
                  <div className="text-sm text-orange-700">
                    يُرجى مراجعة التقرير التفصيلي لمعرفة التفاصيل
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Course Groups Preview */}
          {results?.data?.parsing?.course_groups && (
            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  المجموعات المستخرجة
                </h3>
                <button className="btn btn-outline text-sm">
                  <Eye className="ml-2 h-4 w-4" />
                  عرض التفاصيل
                </button>
              </div>
              
              <div className="space-y-3 max-h-64 overflow-y-auto custom-scrollbar">
                {results.data.parsing.course_groups.slice(0, 10).map((group, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <div className="font-medium text-gray-900">
                        {group.course_code} - مجموعة {group.group_code}
                      </div>
                      <div className="text-sm text-gray-600">
                        {group.sessions?.length || 0} جلسة • {group.course_name || 'بدون اسم'}
                      </div>
                    </div>
                    <div className="text-sm text-gray-500">
                      {group.sessions?.filter(s => s.session_type === 'lecture').length || 0} محاضرة • 
                      {group.sessions?.filter(s => s.session_type === 'lab').length || 0} معمل
                    </div>
                  </div>
                ))}
                
                {results.data.parsing.course_groups.length > 10 && (
                  <div className="text-center text-sm text-gray-500 p-3">
                    و {results.data.parsing.course_groups.length - 10} مجموعة أخرى...
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-center space-x-4 space-x-reverse">
            <button
              onClick={resetUpload}
              className="btn btn-outline"
            >
              رفع ملف جديد
            </button>
            <button
              onClick={() => {
                // Navigate to schedule page with parsed data
                navigate('/schedule', { 
                  state: { 
                    parsedData: results?.data?.parsing || {},
                    normalizationReport: results?.data?.normalization?.report || null
                  } 
                })
              }}
              className="btn btn-primary"
            >
              إنشاء الجداول
              <ArrowLeft className="mr-2 h-4 w-4" />
            </button>
          </div>
        </motion.div>
      )}
    </div>
  )
}

export default UploadPage
