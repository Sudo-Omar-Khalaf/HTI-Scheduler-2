import React from 'react'
import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import HomePage from './pages/HomePage'
import UploadPage from './pages/UploadPage'
import SchedulePage from './pages/SchedulePage'
import ExportPage from './pages/ExportPage'

function App() {
  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      <Layout>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/upload" element={<UploadPage />} />
          <Route path="/schedule" element={<SchedulePage />} />
          <Route path="/export" element={<ExportPage />} />
        </Routes>
      </Layout>
    </div>
  )
}

export default App
