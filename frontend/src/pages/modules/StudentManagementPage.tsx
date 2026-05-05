import { lazy, Suspense } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import StudentsPage from './students/StudentsPage';
import { StudentsHeader } from './students/StudentsHeader';

const StudentDetailPage = lazy(() => import('./students/detail/StudentDetailPage'));
const StudentDashboardPage = lazy(() => import('./students/dashboard/StudentDashboardPage'));
const ImportPage = lazy(() => import('./students/import/ImportPage'));
const ImportHistoryPage = lazy(() => import('./students/import/ImportHistoryPage'));
const DocumentUploadPage = lazy(() => import('./students/DocumentUploadPage'));

const SuspenseFallback = (
  <div className="flex items-center justify-center h-full">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-600" />
  </div>
);

/** Detail page uses its own header/back button — hide tab bar for UUID paths */
const UUID_PATTERN = /^\/students\/[0-9a-f-]{36}/i;

export default function StudentManagementPage() {
  const { pathname } = useLocation();
  const isDetailPage = UUID_PATTERN.test(pathname);

  return (
    <div className="h-full flex flex-col">
      {!isDetailPage && <StudentsHeader />}
      <div className="flex-1 overflow-hidden">
        <Routes>
          <Route index element={<StudentsPage />} />
          <Route path="import/history" element={<Suspense fallback={SuspenseFallback}><ImportHistoryPage /></Suspense>} />
          <Route path="import" element={<Suspense fallback={SuspenseFallback}><ImportPage /></Suspense>} />
          <Route path="documents/upload" element={<Suspense fallback={SuspenseFallback}><DocumentUploadPage /></Suspense>} />
          <Route path="dashboard" element={<Suspense fallback={SuspenseFallback}><StudentDashboardPage /></Suspense>} />
          <Route path=":id" element={<Suspense fallback={SuspenseFallback}><StudentDetailPage /></Suspense>} />
        </Routes>
      </div>
    </div>
  );
}
