import { Navigate, Route, Routes } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider } from './context/AuthContext'
import { ContentLibraryProvider } from './context/ContentLibraryContext'
import ProtectedRoute from './components/common/ProtectedRoute'
import DashboardLayout from './components/layout/DashboardLayout'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import TemplatesPage from './pages/TemplatesPage'
import DocumentsPage from './pages/DocumentsPage'
import ContentLibraryPage from './pages/ContentLibraryPage'
import TemplateBuilderPage from './pages/TemplateBuilderPage'

export default function App() {
  return (
    <AuthProvider>
      <ContentLibraryProvider>
        <Toaster position="top-right" toastOptions={{ duration: 3500 }} />
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          <Route element={<ProtectedRoute />}>
            <Route path="/templates/:id" element={<TemplateBuilderPage />} />

            <Route element={<DashboardLayout />}>
              <Route path="/templates" element={<TemplatesPage />} />
              <Route path="/documents" element={<DocumentsPage />} />
              <Route path="/content-library" element={<ContentLibraryPage />} />
            </Route>
          </Route>

          <Route path="/" element={<Navigate to="/templates" replace />} />
          <Route path="*" element={<Navigate to="/templates" replace />} />
        </Routes>
      </ContentLibraryProvider>
    </AuthProvider>
  )
}
