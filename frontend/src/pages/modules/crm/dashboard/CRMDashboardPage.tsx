import { useNavigate } from 'react-router-dom';
import { ArrowLeft, BarChart3 } from 'lucide-react';
import { CRMDashboardView } from './CRMDashboardView';

export default function CRMDashboardPage() {
  const navigate = useNavigate();

  return (
    <div className="h-full flex flex-col bg-neutral-50">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 bg-white border-b border-neutral-200 flex-shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/crm')}
            className="flex items-center gap-1.5 text-sm text-neutral-500 hover:text-neutral-800 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Pipeline
          </button>
          <div className="h-6 w-px bg-neutral-200" />
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-[#0aacce]" />
            <h1 className="text-lg font-semibold text-neutral-900">Dashboard de Admissão</h1>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* Live indicator */}
          <div className="flex items-center gap-1.5 text-xs text-neutral-500">
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
            Ao vivo
          </div>
        </div>
      </div>

      {/* Content — fills remaining height */}
      <div className="flex-1 min-h-0">
        <CRMDashboardView />
      </div>
    </div>
  );
}
