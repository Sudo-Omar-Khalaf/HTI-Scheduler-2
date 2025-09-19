import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { 
  FileSpreadsheet, 
  Calendar, 
  Download, 
  Home,
  Settings,
  Menu,
  X
} from 'lucide-react'

const Layout = ({ children }) => {
  const location = useLocation()
  const [sidebarOpen, setSidebarOpen] = React.useState(false)

  const navigation = [
    { name: 'الرئيسية', href: '/', icon: Home },
    { name: 'رفع الملف', href: '/upload', icon: FileSpreadsheet },
    { name: 'إنشاء الجدول', href: '/schedule', icon: Calendar },
    { name: 'تصدير الجدول', href: '/export', icon: Download },
  ]

  const isActivePath = (path) => {
    return location.pathname === path
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed inset-y-0 right-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0
        ${sidebarOpen ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'}
      `}>
        <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200">
          <h1 className="text-xl font-bold text-gray-900">HTI Scheduler</h1>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-2 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="mt-8 px-4">
          <ul className="space-y-2">
            {navigation.map((item) => {
              const Icon = item.icon
              return (
                <li key={item.name}>
                  <Link
                    to={item.href}
                    onClick={() => setSidebarOpen(false)}
                    className={`
                      flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors duration-200
                      ${isActivePath(item.href)
                        ? 'bg-primary-100 text-primary-700 border-r-4 border-primary-600'
                        : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                      }
                    `}
                  >
                    <Icon className={`ml-3 h-5 w-5 ${isActivePath(item.href) ? 'text-primary-600' : 'text-gray-400'}`} />
                    {item.name}
                  </Link>
                </li>
              )
            })}
          </ul>
        </nav>

        {/* Footer */}
        <div className="absolute bottom-0 w-full p-4 border-t border-gray-200">
          <div className="text-xs text-gray-500 text-center">
            <p>نظام جدولة المقررات الجامعية</p>
            <p className="mt-1">الإصدار 1.0.0</p>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:mr-64">
        {/* Top navigation for mobile */}
        <div className="lg:hidden bg-white shadow-sm border-b border-gray-200">
          <div className="flex items-center justify-between h-16 px-4">
            <h1 className="text-lg font-semibold text-gray-900">HTI Scheduler</h1>
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100"
            >
              <Menu className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Page content */}
        <main className="flex-1">
          <div className="py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

export default Layout
