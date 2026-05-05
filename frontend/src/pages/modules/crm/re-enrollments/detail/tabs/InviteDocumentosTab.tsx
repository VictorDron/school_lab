import { FileText, ExternalLink, CheckCircle2, XCircle, Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { InviteDetail, InviteDetailDocument } from '@/hooks/useReEnrollmentInvite';

interface InviteDocumentosTabProps {
  detail: InviteDetail;
}

const CATEGORY_LABELS: Record<string, string> = {
  STUDENT: 'Aluno',
  MOTHER: 'Mãe',
  FATHER: 'Pai',
  FINANCIAL_RESPONSIBLE: 'Responsável Financeiro',
  SCHOOL: 'Escola',
};

export function InviteDocumentosTab({ detail }: InviteDocumentosTabProps) {
  const { documents } = detail;

  if (documents.length === 0) {
    return (
      <div className="bg-white border border-neutral-200 rounded-lg p-8">
        <div className="text-center max-w-md mx-auto">
          <FileText className="w-8 h-8 text-neutral-300 mx-auto mb-2" />
          <p className="text-sm font-medium text-neutral-700">
            Nenhum documento enviado
          </p>
          <p className="text-xs text-neutral-500 mt-1">
            A família envia os documentos pelo link público; assim que subirem, eles
            aparecerão aqui para revisão.
          </p>
        </div>
      </div>
    );
  }

  // Group by category
  const byCategory = documents.reduce<Record<string, InviteDetailDocument[]>>(
    (acc, doc) => {
      (acc[doc.category] ||= []).push(doc);
      return acc;
    },
    {},
  );

  const orderedCategories = Object.keys(byCategory).sort((a, b) => {
    const order = ['STUDENT', 'MOTHER', 'FATHER', 'FINANCIAL_RESPONSIBLE', 'SCHOOL'];
    return order.indexOf(a) - order.indexOf(b);
  });

  return (
    <div className="space-y-4">
      {orderedCategories.map((cat) => (
        <section key={cat} className="bg-white border border-neutral-200 rounded-lg overflow-hidden">
          <header className="px-4 py-2.5 border-b border-neutral-200 bg-neutral-50">
            <h3 className="text-xs font-semibold text-neutral-700 uppercase tracking-wide">
              {CATEGORY_LABELS[cat] || cat}
            </h3>
          </header>
          <ul className="divide-y divide-neutral-100">
            {byCategory[cat].map((doc) => (
              <li key={doc.id} className="px-4 py-3 flex items-center gap-3">
                <StatusIcon status={doc.status} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-neutral-900 truncate">
                    {doc.fileName}
                  </p>
                  <p className="text-[11px] text-neutral-500">
                    {doc.documentType} ·{' '}
                    {formatDistanceToNow(new Date(doc.uploadedAt), {
                      addSuffix: true,
                      locale: ptBR,
                    })}
                    {doc.reviewedAt && (
                      <>
                        {' · revisado '}
                        {formatDistanceToNow(new Date(doc.reviewedAt), {
                          addSuffix: true,
                          locale: ptBR,
                        })}
                      </>
                    )}
                  </p>
                  {doc.status === 'REJECTED' && doc.rejectionReason && (
                    <p className="text-[11px] text-red-700 mt-0.5">
                      Motivo: {doc.rejectionReason}
                    </p>
                  )}
                </div>
                <a
                  href={doc.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-shrink-0 inline-flex items-center gap-1 px-2 py-1 text-xs text-primary-600 hover:bg-primary-50 rounded transition-colors"
                >
                  <ExternalLink className="w-3 h-3" />
                  Abrir
                </a>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}

function StatusIcon({ status }: { status: string }) {
  if (status === 'APPROVED') {
    return (
      <div className="w-7 h-7 bg-emerald-50 rounded-md flex items-center justify-center flex-shrink-0">
        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
      </div>
    );
  }
  if (status === 'REJECTED') {
    return (
      <div className="w-7 h-7 bg-red-50 rounded-md flex items-center justify-center flex-shrink-0">
        <XCircle className="w-4 h-4 text-red-600" />
      </div>
    );
  }
  return (
    <div className="w-7 h-7 bg-amber-50 rounded-md flex items-center justify-center flex-shrink-0">
      <Clock className="w-4 h-4 text-amber-600" />
    </div>
  );
}
