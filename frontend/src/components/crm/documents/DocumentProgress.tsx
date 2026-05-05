import { useMemo } from 'react';
import { motion } from 'framer-motion';
import type { Lead } from '@/types/crm';
import type { UnifiedDocument } from './utils';
import { documentsRequiredByColumnSlug } from './constants';
import { getDocumentTypeInfo } from './utils';

interface DocumentProgressProps {
  lead: Lead;
  documents: UnifiedDocument[];
}

export function DocumentProgress({ lead, documents }: DocumentProgressProps) {
  const documentationProgress = useMemo(() => {
    const columnSlug = lead.column?.slug || 'UNDER_ANALYSIS';
    const requiredTypes =
      documentsRequiredByColumnSlug[columnSlug] || documentsRequiredByColumnSlug.UNDER_ANALYSIS || [];
    const uploadedTypes = new Set(documents.map((d) => d.type));
    const completed = requiredTypes.filter((t) => uploadedTypes.has(t)).length;
    return {
      completed,
      total: requiredTypes.length,
      percentage: requiredTypes.length > 0 ? Math.round((completed / requiredTypes.length) * 100) : 100,
      missing: requiredTypes.filter((t) => !uploadedTypes.has(t)),
    };
  }, [documents, lead.column?.slug]);

  const progressColor =
    documentationProgress.percentage === 100
      ? 'from-green-500 to-emerald-500'
      : documentationProgress.percentage >= 50
        ? 'from-primary-500 to-blue-500'
        : 'from-amber-500 to-orange-500';

  return (
    <div className="bg-gradient-to-r from-primary-50 to-blue-50 rounded-xl p-4 border border-primary-100">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="font-semibold text-neutral-900">Progresso da Documentacao</h3>
          <p className="text-sm text-neutral-600">
            {documentationProgress.completed} de {documentationProgress.total} documentos obrigatórios
          </p>
        </div>
        <div className={`text-2xl font-bold ${
          documentationProgress.percentage === 100 ? 'text-green-600' : 'text-primary-600'
        }`}>
          {documentationProgress.percentage}%
        </div>
      </div>
      <div className="h-2 bg-neutral-200 rounded-full overflow-hidden">
        <motion.div
          className={`h-full bg-gradient-to-r ${progressColor}`}
          initial={{ width: 0 }}
          animate={{ width: `${documentationProgress.percentage}%` }}
          transition={{ duration: 0.5 }}
        />
      </div>
      {documentationProgress.missing.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1">
          <span className="text-xs text-neutral-500">Faltando:</span>
          {documentationProgress.missing.map((type) => (
            <span key={type} className="text-xs px-2 py-0.5 bg-amber-100 text-amber-700 rounded">
              {getDocumentTypeInfo(type).label}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
