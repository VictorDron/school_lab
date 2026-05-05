import { useState, useRef } from 'react';
import { Upload, Download, CheckCircle, AlertCircle, XCircle, Loader2 } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import { api } from '@/lib/api';
import toast from 'react-hot-toast';

interface ImportRow {
  rowNumber: number;
  codigoAluno: string;
  nomeAluno: string;
  percentualDesconto: number;
  matchedStudentId: string | null;
  matchedStudentName: string | null;
  matchedStudentGrade: string | null;
  currentDiscount: number | null;
  status: 'matched' | 'not_found' | 'invalid' | 'duplicate';
  message?: string;
}

interface ImportPreview {
  totalRows: number;
  matched: number;
  notFound: number;
  invalid: number;
  duplicates: number;
  rows: ImportRow[];
}

interface Props {
  periodId: string;
  onImportComplete: () => void;
}

export default function DiscountImportSection({ periodId, onImportComplete }: Props) {
  const [preview, setPreview] = useState<ImportPreview | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const previewMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      const res = await api.post(
        `/re-enrollment/periods/${periodId}/pre-reenrollment/import-discounts/preview`,
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } },
      );
      return res.data.data as ImportPreview;
    },
    onSuccess: (data) => setPreview(data),
    onError: (err: any) => {
      toast.error(err.response?.data?.error || 'Erro ao processar arquivo.');
    },
  });

  const applyMutation = useMutation({
    mutationFn: async () => {
      if (!preview) return;
      const rows = preview.rows
        .filter((r) => r.status === 'matched' && r.matchedStudentId)
        .map((r) => ({
          studentId: r.matchedStudentId!,
          discountPercent: r.percentualDesconto,
        }));
      const res = await api.post(
        `/re-enrollment/periods/${periodId}/pre-reenrollment/import-discounts/apply`,
        { rows },
      );
      return res.data.data;
    },
    onSuccess: (data) => {
      toast.success(`${data.applied} desconto(s) aplicado(s) com sucesso!`);
      setPreview(null);
      onImportComplete();
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error || 'Erro ao aplicar descontos.');
    },
  });

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    previewMutation.mutate(file);
    e.target.value = '';
  };

  const handleDownloadTemplate = async () => {
    try {
      const res = await api.get(
        `/re-enrollment/periods/${periodId}/pre-reenrollment/import-discounts/template`,
        { responseType: 'blob' },
      );
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement('a');
      a.href = url;
      a.download = 'template_descontos.csv';
      a.click();
      window.URL.revokeObjectURL(url);
    } catch {
      toast.error('Erro ao baixar template.');
    }
  };

  const statusIcon = (status: ImportRow['status']) => {
    switch (status) {
      case 'matched': return <CheckCircle className="w-4 h-4 text-emerald-500" />;
      case 'not_found': return <XCircle className="w-4 h-4 text-red-500" />;
      case 'invalid': return <AlertCircle className="w-4 h-4 text-amber-500" />;
      case 'duplicate': return <AlertCircle className="w-4 h-4 text-neutral-400" />;
    }
  };

  const statusLabel = (status: ImportRow['status']) => {
    switch (status) {
      case 'matched': return 'Encontrado';
      case 'not_found': return 'Não encontrado';
      case 'invalid': return 'Inválido';
      case 'duplicate': return 'Duplicado';
    }
  };

  return (
    <div className="bg-white rounded-xl border border-neutral-200 p-4">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-sm font-semibold text-neutral-700">Importar Descontos</h4>
        <div className="flex gap-2">
          <button
            onClick={handleDownloadTemplate}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-neutral-600 border border-neutral-300 rounded-lg hover:bg-neutral-50 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            Baixar Template
          </button>
          <button
            onClick={() => fileRef.current?.click()}
            disabled={previewMutation.isPending}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-cyan-600 rounded-lg hover:bg-cyan-700 disabled:opacity-50 transition-colors"
          >
            {previewMutation.isPending ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Upload className="w-3.5 h-3.5" />
            )}
            Enviar CSV
          </button>
          <input
            ref={fileRef}
            type="file"
            accept=".csv"
            onChange={handleFileSelect}
            className="hidden"
          />
        </div>
      </div>

      {preview && (
        <div className="space-y-3">
          {/* Summary */}
          <div className="flex gap-3 text-xs">
            <span className="px-2 py-1 rounded bg-neutral-100 text-neutral-600">
              Total: {preview.totalRows}
            </span>
            <span className="px-2 py-1 rounded bg-emerald-50 text-emerald-700">
              Encontrados: {preview.matched}
            </span>
            {preview.notFound > 0 && (
              <span className="px-2 py-1 rounded bg-red-50 text-red-700">
                Não encontrados: {preview.notFound}
              </span>
            )}
            {preview.invalid > 0 && (
              <span className="px-2 py-1 rounded bg-amber-50 text-amber-700">
                Inválidos: {preview.invalid}
              </span>
            )}
            {preview.duplicates > 0 && (
              <span className="px-2 py-1 rounded bg-neutral-100 text-neutral-500">
                Duplicados: {preview.duplicates}
              </span>
            )}
          </div>

          {/* Preview table */}
          <div className="max-h-64 overflow-y-auto border border-neutral-200 rounded-lg">
            <table className="w-full text-xs">
              <thead className="bg-neutral-50 sticky top-0">
                <tr>
                  <th className="px-3 py-2 text-left font-medium text-neutral-600">#</th>
                  <th className="px-3 py-2 text-left font-medium text-neutral-600">Aluno</th>
                  <th className="px-3 py-2 text-left font-medium text-neutral-600">Série</th>
                  <th className="px-3 py-2 text-right font-medium text-neutral-600">Desconto Atual</th>
                  <th className="px-3 py-2 text-right font-medium text-neutral-600">Novo Desconto</th>
                  <th className="px-3 py-2 text-center font-medium text-neutral-600">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {preview.rows.map((row) => (
                  <tr
                    key={row.rowNumber}
                    className={row.status !== 'matched' ? 'bg-neutral-50/50' : ''}
                  >
                    <td className="px-3 py-1.5 text-neutral-400">{row.rowNumber}</td>
                    <td className="px-3 py-1.5 text-neutral-800">
                      {row.matchedStudentName || row.nomeAluno || row.codigoAluno}
                    </td>
                    <td className="px-3 py-1.5 text-neutral-500">{row.matchedStudentGrade || '—'}</td>
                    <td className="px-3 py-1.5 text-right text-neutral-500">
                      {row.currentDiscount != null ? `${row.currentDiscount}%` : '—'}
                    </td>
                    <td className="px-3 py-1.5 text-right font-medium text-neutral-800">
                      {row.percentualDesconto}%
                    </td>
                    <td className="px-3 py-1.5">
                      <div className="flex items-center justify-center gap-1">
                        {statusIcon(row.status)}
                        <span className="text-neutral-500">{statusLabel(row.status)}</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Actions */}
          <div className="flex gap-2 justify-end">
            <button
              onClick={() => setPreview(null)}
              className="px-3 py-1.5 text-xs font-medium text-neutral-600 border border-neutral-300 rounded-lg hover:bg-neutral-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={() => applyMutation.mutate()}
              disabled={preview.matched === 0 || applyMutation.isPending}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 disabled:opacity-50 transition-colors"
            >
              {applyMutation.isPending ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <CheckCircle className="w-3.5 h-3.5" />
              )}
              Aplicar {preview.matched} Desconto(s)
            </button>
          </div>
        </div>
      )}

      {!preview && (
        <p className="text-xs text-neutral-400">
          Faça upload de um arquivo CSV com os descontos por aluno. Use o template para o formato correto.
        </p>
      )}
    </div>
  );
}
