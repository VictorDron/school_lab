import { useEffect, lazy, Suspense } from 'react';
import { Routes, Route, Navigate, useParams } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';

// Layouts (keep eager — used on every page)
import AuthLayout from '@/layouts/AuthLayout';
import MainLayout from '@/layouts/MainLayout';

// Auth Pages (keep eager — first interaction)
import LoginPage from '@/pages/auth/LoginPage';
import RegisterPage from '@/pages/auth/RegisterPage';
import ForgotPasswordPage from '@/pages/auth/ForgotPasswordPage';
import ResetPasswordPage from '@/pages/auth/ResetPasswordPage';

// Components (keep eager — used globally)
import { LoadingScreen } from '@/components/ui/LoadingScreen';
import { ForcePasswordChangeModal } from '@/components/auth/ForcePasswordChangeModal';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';

// Lazy-loaded pages (code-split by module)
const LauncherPage = lazy(() => import('@/pages/LauncherPage'));
const CommunicationPage = lazy(() => import('@/pages/modules/CommunicationPage'));
const ProcurementPage = lazy(() => import('@/pages/modules/ProcurementPage'));
const AssetsPage = lazy(() => import('@/pages/modules/AssetsPage'));
const CRMPage = lazy(() => import('@/pages/modules/CRMPage'));
const GEDPage = lazy(() => import('@/pages/modules/GEDPage'));
const AdminPage = lazy(() => import('@/pages/modules/AdminPage'));
const StudentManagementPage = lazy(() => import('@/pages/modules/StudentManagementPage'));
const ResourceManagementPage = lazy(() => import('@/pages/modules/ResourceManagementPage'));
const AdmissionFormPage = lazy(() => import('@/pages/public/AdmissionFormPage'));
const EnrollmentFormPage = lazy(() => import('@/pages/public/EnrollmentFormPage'));
const ReEnrollmentFormPage = lazy(() => import('@/pages/public/ReEnrollmentFormPage'));
const PreReEnrollmentResponsePage = lazy(() => import('@/pages/public/PreReEnrollmentResponsePage'));

// Protected Route wrapper
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuthStore();

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

// Module Route wrapper with access check
function ModuleRoute({
  children,
  module
}: {
  children: React.ReactNode;
  module: 'COMMUNICATION' | 'PROCUREMENT' | 'ASSETS' | 'CRM' | 'GED' | 'ADMIN' | 'STUDENT_MANAGEMENT';
}) {
  const { hasModuleAccess } = useAuthStore();

  if (!hasModuleAccess(module)) {
    return <Navigate to="/launcher" replace />;
  }

  return <>{children}</>;
}

// Redirect for backwards-compatible email links that used /public/re-enrollment/
function PublicReEnrollmentRedirect() {
  const params = useParams<{ token: string }>();
  return <Navigate to={`/re-enrollment/${params.token}`} replace />;
}

export default function App() {
  const { checkAuth, isAuthenticated } = useAuthStore();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  return (
    <ErrorBoundary>
      <ForcePasswordChangeModal />
      <Suspense fallback={<LoadingScreen />}>
        <Routes>
          {/* Auth Routes */}
          <Route element={<AuthLayout />}>
            <Route
              path="/"
              element={isAuthenticated ? <Navigate to="/launcher" replace /> : <LoginPage />}
            />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />
          </Route>

        {/* Public Routes */}
        <Route path="/admissions/apply" element={<AdmissionFormPage />} />
        <Route path="/enrollment/apply" element={<EnrollmentFormPage />} />
        <Route path="/re-enrollment/:token" element={<ReEnrollmentFormPage />} />
        <Route path="/public/re-enrollment/:token" element={<PublicReEnrollmentRedirect />} />
        <Route path="/public/pre-reenrollment/:token" element={<PreReEnrollmentResponsePage />} />

        {/* Protected Routes */}
        <Route
          element={
            <ProtectedRoute>
              <MainLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/launcher" element={<LauncherPage />} />

          <Route
            path="/communication/*"
            element={
              <ModuleRoute module="COMMUNICATION">
                <CommunicationPage />
              </ModuleRoute>
            }
          />

          <Route
            path="/resources/*"
            element={
              <ModuleRoute module="PROCUREMENT">
                <ResourceManagementPage />
              </ModuleRoute>
            }
          />
          <Route path="/procurement/*" element={<Navigate to="/resources" replace />} />
          <Route path="/assets/*" element={<Navigate to="/resources" replace />} />

          <Route
            path="/crm/*"
            element={
              <ModuleRoute module="CRM">
                <CRMPage />
              </ModuleRoute>
            }
          />

          <Route
            path="/ged/*"
            element={
              <ModuleRoute module="GED">
                <GEDPage />
              </ModuleRoute>
            }
          />

          <Route
            path="/admin/*"
            element={
              <ModuleRoute module="ADMIN">
                <AdminPage />
              </ModuleRoute>
            }
          />

          <Route
            path="/students/*"
            element={
              <ModuleRoute module="STUDENT_MANAGEMENT">
                <StudentManagementPage />
              </ModuleRoute>
            }
          />
        </Route>

          {/* Catch all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </ErrorBoundary>
  );
}
