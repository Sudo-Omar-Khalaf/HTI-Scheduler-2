import React from 'react'
import { Link } from 'react-router-dom'
import { 
  Upload, 
  Calendar, 
  Download, 
  FileSpreadsheet,
  CheckCircle,
  ArrowLeft,
  BookOpen,
  Clock,
  Users
} from 'lucide-react'

const HomePage = () => {
  const features = [
    {
      icon: Upload,
      title: 'رفع ملفات Excel',
      description: 'ارفع جداولك الدراسية من ملفات Excel العربية بسهولة',
      color: 'text-blue-600'
    },
    {
      icon: CheckCircle,
      title: 'التحقق والتطبيع',
      description: 'تحقق من صحة البيانات وتطبيعها حسب المعايير المقررة',
      color: 'text-green-600'
    },
    {
      icon: Calendar,
      title: 'إنشاء الجداول',
      description: 'توليد جداول دراسية متعددة خالية من التعارضات',
      color: 'text-purple-600'
    },
    {
      icon: Download,
      title: 'تصدير النتائج',
      description: 'صدّر جداولك بصيغ Excel و CSV مع التنسيق العربي',
      color: 'text-orange-600'
    }
  ]

  const steps = [
    {
      number: '1',
      title: 'رفع الملف',
      description: 'ارفع ملف Excel الذي يحتوي على جدولك الدراسي'
    },
    {
      number: '2',
      title: 'المراجعة والتطبيع',
      description: 'راجع البيانات المستخرجة وطبّق التطبيع إذا لزم الأمر'
    },
    {
      number: '3',
      title: 'اختيار المقررات',
      description: 'حدد المقررات المرغوبة وتفضيلات المجموعات'
    },
    {
      number: '4',
      title: 'إنشاء الجداول',
      description: 'احصل على عدة خيارات للجداول الدراسية'
    },
    {
      number: '5',
      title: 'التصدير',
      description: 'صدّر الجدول المختار بالصيغة المناسبة'
    }
  ]

  const stats = [
    { label: 'مقررات مدعومة', value: '100+', icon: BookOpen },
    { label: 'مجموعات', value: '200+', icon: Users },
    { label: 'فترات زمنية', value: '40', icon: Clock },
    { label: 'تنسيقات التصدير', value: '2', icon: FileSpreadsheet }
  ]

  return (
    <div className="space-y-12">
      {/* Hero Section */}
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 sm:text-5xl lg:text-6xl">
          نظام جدولة المقررات الجامعية
        </h1>
        <p className="mt-6 text-xl text-gray-600 max-w-3xl mx-auto">
          أداة شاملة لتحليل وتوليد الجداول الدراسية من ملفات Excel العربية
          مع دعم كامل للتحقق من صحة البيانات وحل التعارضات
        </p>
        <div className="mt-8 flex justify-center gap-4">
          <Link
            to="/upload"
            className="btn btn-primary text-lg px-8 py-4 inline-flex items-center"
          >
            ابدأ الآن
            <ArrowLeft className="mr-2 h-5 w-5" />
          </Link>
          <a
            href="#features"
            className="btn btn-outline text-lg px-8 py-4"
          >
            تعرف على المزيد
          </a>
        </div>
      </div>

      {/* Stats Section */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {stats.map((stat, index) => {
          const Icon = stat.icon
          return (
            <div key={index} className="card text-center">
              <Icon className="h-8 w-8 text-primary-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
              <div className="text-sm text-gray-600">{stat.label}</div>
            </div>
          )
        })}
      </div>

      {/* Features Section */}
      <section id="features" className="scroll-mt-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            المزايا الرئيسية
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            نظام شامل ومتقدم لإدارة الجداول الدراسية بكفاءة ودقة عالية
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => {
            const Icon = feature.icon
            return (
              <div 
                key={index}
                className="card text-center hover:shadow-lg transition-shadow duration-300"
              >
                <div className="mb-4">
                  <Icon className={`h-12 w-12 mx-auto ${feature.color}`} />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-600 text-sm leading-relaxed">
                  {feature.description}
                </p>
              </div>
            )
          })}
        </div>
      </section>

      {/* How it works Section */}
      <section className="bg-gray-100 -mx-4 px-4 py-16 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8 rounded-2xl">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              كيف يعمل النظام؟
            </h2>
            <p className="text-lg text-gray-600">
              خطوات بسيطة للحصول على جدولك الدراسي المثالي
            </p>
          </div>

          <div className="space-y-8">
            {steps.map((step, index) => (
              <div key={index} className="flex items-start">
                <div className="flex-shrink-0">
                  <div className="flex items-center justify-center w-10 h-10 bg-primary-600 text-white rounded-full font-bold">
                    {step.number}
                  </div>
                </div>
                <div className="mr-4 flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">
                    {step.title}
                  </h3>
                  <p className="text-gray-600">
                    {step.description}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center mt-12">
            <Link
              to="/upload"
              className="btn btn-primary text-lg px-8 py-4 inline-flex items-center"
            >
              ابدأ رحلتك الآن
              <ArrowLeft className="mr-2 h-5 w-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="text-center bg-primary-600 text-white -mx-4 px-4 py-16 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8 rounded-2xl">
        <h2 className="text-3xl font-bold mb-4">
          جاهز لإنشاء جدولك الدراسي؟
        </h2>
        <p className="text-xl mb-8 text-primary-100">
          ابدأ الآن واحصل على جدول دراسي مثالي في دقائق معدودة
        </p>
        <Link
          to="/upload"
          className="bg-white text-primary-600 hover:bg-gray-100 px-8 py-4 rounded-lg font-semibold text-lg inline-flex items-center transition-colors duration-200"
        >
          رفع الملف الآن
          <Upload className="mr-2 h-5 w-5" />
        </Link>
      </section>
    </div>
  )
}

export default HomePage
