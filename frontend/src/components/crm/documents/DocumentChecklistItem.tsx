import { CheckCircle2, Circle } from 'lucide-react';
import type { LeadChild } from '@/types/crm';
import type { UnifiedDocument } from './utils';
import { DocumentTypeDefinition } from './constants';

interface DocumentChecklistItemProps {
  type: DocumentTypeDefinition;
  documents: UnifiedDocument[];
  children: LeadChild[];
}

export function DocumentChecklistItem({
  type,
  documents,
  children,
}: DocumentChecklistItemProps) {
  const Icon = type.icon;
  const matchingDocs = documents.filter((d) => d.type === type.value);
  const hasDocument = matchingDocs.length > 0;

  return (
    <div
      className={`p-3 rounded-lg border ${
        hasDocument ? 'border-green-200 bg-green-50' : 'border-neutral-200 bg-white'
      }`}
    >
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-lg ${hasDocument ? 'bg-green-100' : 'bg-neutral-100'}`}>
          <Icon className={`w-4 h-4 ${hasDocument ? 'text-green-600' : 'text-neutral-500'}`} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className={`font-medium ${hasDocument ? 'text-green-900' : 'text-neutral-900'}`}>
              {type.label}
            </span>
            {type.required && (
              <span className="text-xs px-1.5 py-0.5 bg-red-100 text-red-700 rounded">Obrigatório</span>
            )}
            {type.perChild && (
              <span className="text-xs px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded">Por aluno</span>
            )}
          </div>
          {type.perChild && children.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1">
              {children.map((child) => {
                const hasForChild = matchingDocs.some((d) => d.childId === child.id);
                return (
                  <span
                    key={child.id}
                    className={`text-xs px-1.5 py-0.5 rounded ${
                      hasForChild ? 'bg-green-100 text-green-700' : 'bg-neutral-100 text-neutral-600'
                    }`}
                  >
                    {hasForChild ? '✓' : '○'} {child.fullName.split(' ')[0]}
                  </span>
                );
              })}
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          {hasDocument ? (
            <CheckCircle2 className="w-5 h-5 text-green-600" />
          ) : (
            <Circle className="w-5 h-5 text-neutral-300" />
          )}
        </div>
      </div>
      {matchingDocs.length > 0 && (
        <div className="mt-2 pl-11 text-xs text-neutral-500">
          {matchingDocs.length} arquivo(s) enviado(s)
          {matchingDocs.some((d) => d.source === 'ENROLLMENT') && (
            <span className="ml-1 text-emerald-600">(via matrícula)</span>
          )}
        </div>
      )}
    </div>
  );
}
