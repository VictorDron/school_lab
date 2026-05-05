import { useEffect, useState } from 'react';
import { ShieldCheck, AlertCircle } from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface ParentalConsentRecord {
  id: string;
  leadId: string;
  ipAddress: string | null;
  userAgent: string | null;
  consentTextVersion: string;
  consentedAt: string;
}

interface Props {
  leadId: string;
}

export function ParentalConsentTab({ leadId }: Props) {
  const [records, setRecords] = useState<ParentalConsentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/leads/${leadId}/parental-consents`, { credentials: 'include' })
      .then((res) => res.json())
      .then((json) => {
        if (json.success) setRecords(json.data);
        else setError('Erro ao carregar registros de consentimento.');
      })
      .catch(() => setError('Erro ao carregar registros de consentimento.'))
      .finally(() => setLoading(false));
  }, [leadId]);

  if (loading) {
    return <div className="py-8 text-center text-sm text-gray-500">Carregando...</div>;
  }

  if (error) {
    return (
      <div className="flex items-center gap-2 py-8 text-center text-sm text-red-500 justify-center">
        <AlertCircle className="w-4 h-4" />
        {error}
      </div>
    );
  }

  if (records.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-gray-400">
        <ShieldCheck className="w-8 h-8 mb-2" />
        <p className="text-sm">Nenhum registro de consentimento parental encontrado.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3 p-4">
      <p className="text-xs text-gray-500 mb-3">
        Registros de consentimento parental conforme LGPD e Lei 15.211/2025.
      </p>
      {records.map((record) => (
        <div key={record.id} className="bg-white rounded-lg border border-gray-200 p-4 space-y-2">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-green-500" />
            <span className="text-sm font-medium text-gray-900">Consentimento registrado</span>
            <span className="ml-auto text-xs text-gray-400">
              {formatDistanceToNow(new Date(record.consentedAt), { addSuffix: true, locale: ptBR })}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <span className="text-gray-500 uppercase tracking-wide">Data e hora</span>
              <p className="font-medium text-gray-900">
                {format(new Date(record.consentedAt), "dd/MM/yyyy 'às' HH:mm:ss", { locale: ptBR })}
              </p>
            </div>
            <div>
              <span className="text-gray-500 uppercase tracking-wide">Versão do texto</span>
              <p className="font-medium text-gray-900">{record.consentTextVersion}</p>
            </div>
            <div>
              <span className="text-gray-500 uppercase tracking-wide">Endereço IP</span>
              <p className="font-medium text-gray-900">{record.ipAddress ?? 'Não disponível'}</p>
            </div>
            <div>
              <span className="text-gray-500 uppercase tracking-wide">Dispositivo</span>
              <p className="font-medium text-gray-900 truncate" title={record.userAgent ?? undefined}>
                {record.userAgent ? record.userAgent.split(' ')[0] : 'Não disponível'}
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
