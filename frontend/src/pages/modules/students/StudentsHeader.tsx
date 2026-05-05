import { useLocation, useNavigate } from 'react-router-dom';
import { GraduationCap } from 'lucide-react';
import clsx from 'clsx';

const TABS = [
  { key: 'list', label: 'Alunos', path: '/students' },
  { key: 'dashboard', label: 'Dashboard', path: '/students/dashboard' },
  { key: 'import', label: 'Importar', path: '/students/import' },
  { key: 'documents', label: 'Documentos', path: '/students/documents/upload' },
] as const;

function getActiveTab(pathname: string): string {
  if (pathname.startsWith('/students/dashboard')) return 'dashboard';
  if (pathname.startsWith('/students/documents')) return 'documents';
  if (pathname.startsWith('/students/import')) return 'import';
  return 'list';
}

export function StudentsHeader() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const activeTab = getActiveTab(pathname);

  return (
    <div className="flex-shrink-0 bg-white border-b border-neutral-200 px-4 lg:px-6">
      {/* Title row */}
      <div className="flex items-center gap-3 py-4">
        <div className="p-2 bg-violet-100 rounded-lg">
          <GraduationCap className="w-5 h-5 text-violet-600" />
        </div>
        <h1 className="text-lg font-semibold text-neutral-900">Gestão de Alunos</h1>
      </div>

      {/* Tab bar */}
      <div className="flex gap-0 -mb-px">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => navigate(tab.path)}
            className={clsx(
              'px-4 py-3 text-sm font-medium border-b-2 transition-colors',
              activeTab === tab.key
                ? 'border-violet-600 text-violet-600'
                : 'border-transparent text-neutral-500 hover:text-neutral-700'
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>
    </div>
  );
}
