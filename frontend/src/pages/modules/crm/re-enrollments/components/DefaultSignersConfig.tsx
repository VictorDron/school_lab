import { useState, useEffect } from 'react';
import { Settings, Plus, Trash2, Save, Loader2, AlertTriangle, ChevronDown } from 'lucide-react';
import {
  useContractDefaultSigners,
  useReplaceDefaultSigners,
  type CreateSignerPayload,
} from '@/hooks/useContractDefaultSigners';

interface SignerRow {
  role: 'SCHOOL_REPRESENTATIVE' | 'WITNESS';
  name: string;
  email: string;
  cpf: string;
}

const ROLE_OPTIONS: { value: SignerRow['role']; label: string }[] = [
  { value: 'SCHOOL_REPRESENTATIVE', label: 'Repr. Escola' },
  { value: 'WITNESS', label: 'Testemunha' },
];

const roleLabel = (role: string) =>
  ROLE_OPTIONS.find((r) => r.value === role)?.label ?? role;

function emptyRow(): SignerRow {
  return { role: 'WITNESS', name: '', email: '', cpf: '' };
}

function isRowValid(row: SignerRow): boolean {
  return row.name.trim().length > 0 && row.email.trim().length > 0;
}

export default function DefaultSignersConfig() {
  const { data: response, isLoading } = useContractDefaultSigners();
  const replaceMutation = useReplaceDefaultSigners();

  const signers = response?.data ?? [];

  const [isExpanded, setIsExpanded] = useState(false);
  const [rows, setRows] = useState<SignerRow[]>([]);
  const [isDirty, setIsDirty] = useState(false);

  useEffect(() => {
    if (signers.length > 0) {
      setRows(
        signers.map((s) => ({
          role: s.role,
          name: s.name,
          email: s.email,
          cpf: s.cpf ?? '',
        })),
      );
    } else {
      setRows([]);
    }
    setIsDirty(false);
  }, [signers]);

  const updateRow = (index: number, field: keyof SignerRow, value: string) => {
    setRows((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
    setIsDirty(true);
  };

  const addRow = () => {
    setRows((prev) => [...prev, emptyRow()]);
    setIsDirty(true);
  };

  const removeRow = (index: number) => {
    setRows((prev) => prev.filter((_, i) => i !== index));
    setIsDirty(true);
  };

  const handleSave = () => {
    const validRows = rows.filter(isRowValid);
    if (validRows.length === 0 && rows.length > 0) return;

    const payload: CreateSignerPayload[] = validRows.map((r) => ({
      role: r.role,
      name: r.name.trim(),
      email: r.email.trim(),
      ...(r.cpf.trim() ? { cpf: r.cpf.trim() } : {}),
    }));

    replaceMutation.mutate(payload, {
      onSuccess: () => setIsDirty(false),
    });
  };

  const allValid = rows.length === 0 || rows.every(isRowValid);

  const summaryText = isLoading
    ? 'Carregando...'
    : signers.length === 0
      ? 'Nenhum signatário configurado'
      : `${signers.length} signatário(s) configurado(s)`;

  return (
    <div className="border border-neutral-200 rounded-lg bg-white">
      {/* Header / collapse toggle */}
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between px-4 py-3 group"
      >
        <div className="flex items-center gap-2.5">
          <Settings className="w-4 h-4 text-cyan-600" />
          <span className="text-sm font-semibold text-neutral-800">
            Signatários Padrão do Contrato
          </span>
          <span className="text-xs text-neutral-500">{summaryText}</span>
        </div>
        <ChevronDown
          className={`w-4 h-4 text-neutral-400 group-hover:text-neutral-600 transition-transform ${
            isExpanded ? 'rotate-180' : ''
          }`}
        />
      </button>

      {/* Expanded content */}
      {isExpanded && (
        <div className="px-4 pb-4 space-y-4 border-t border-neutral-100">
          <p className="text-xs text-neutral-500 pt-3">
            Configure os signatários do lado da escola e testemunhas que serão aplicados
            automaticamente em todos os contratos.
          </p>

          {isLoading ? (
            <div className="flex items-center justify-center py-8 text-neutral-400">
              <Loader2 className="w-5 h-5 animate-spin mr-2" />
              <span className="text-sm">Carregando signatários...</span>
            </div>
          ) : (
            <>
              {/* Table */}
              {rows.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-neutral-400">
                  <AlertTriangle className="w-6 h-6 mb-2 text-amber-400" />
                  <p className="text-sm font-medium text-neutral-600">
                    Nenhum signatário padrão configurado
                  </p>
                  <p className="text-xs text-neutral-400 mt-1">
                    Adicione pelo menos um representante da escola e uma testemunha para
                    gerar contratos automaticamente.
                  </p>
                </div>
              ) : (
                <div className="border border-neutral-200 rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-neutral-50 text-xs text-neutral-500 uppercase tracking-wider">
                        <th className="py-2 px-3 text-left">Papel</th>
                        <th className="py-2 px-3 text-left">Nome</th>
                        <th className="py-2 px-3 text-left">E-mail</th>
                        <th className="py-2 px-3 text-left">CPF</th>
                        <th className="py-2 px-3 w-10"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((row, idx) => (
                        <tr key={idx} className="border-t border-neutral-100">
                          <td className="py-2 px-3">
                            <select
                              value={row.role}
                              onChange={(e) => updateRow(idx, 'role', e.target.value)}
                              className="w-full px-2 py-1.5 text-sm border border-neutral-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                            >
                              {ROLE_OPTIONS.map((opt) => (
                                <option key={opt.value} value={opt.value}>
                                  {opt.label}
                                </option>
                              ))}
                            </select>
                          </td>
                          <td className="py-2 px-3">
                            <input
                              type="text"
                              value={row.name}
                              onChange={(e) => updateRow(idx, 'name', e.target.value)}
                              placeholder="Nome completo"
                              className="w-full px-2 py-1.5 text-sm border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
                            />
                          </td>
                          <td className="py-2 px-3">
                            <input
                              type="email"
                              value={row.email}
                              onChange={(e) => updateRow(idx, 'email', e.target.value)}
                              placeholder="email@escola.com"
                              className="w-full px-2 py-1.5 text-sm border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
                            />
                          </td>
                          <td className="py-2 px-3">
                            <input
                              type="text"
                              value={row.cpf}
                              onChange={(e) => updateRow(idx, 'cpf', e.target.value)}
                              placeholder="000.000.000-00"
                              className="w-full px-2 py-1.5 text-sm border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
                            />
                          </td>
                          <td className="py-2 px-3 text-center">
                            <button
                              type="button"
                              onClick={() => removeRow(idx)}
                              className="text-neutral-400 hover:text-red-500 transition-colors"
                              title="Remover signatário"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center justify-between pt-1">
                <button
                  type="button"
                  onClick={addRow}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-cyan-600 border border-cyan-200 rounded-lg hover:bg-cyan-50 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Adicionar signatário
                </button>

                {isDirty && (
                  <button
                    type="button"
                    onClick={handleSave}
                    disabled={replaceMutation.isPending || !allValid}
                    className="inline-flex items-center gap-1.5 px-4 py-1.5 text-sm font-medium text-white bg-cyan-600 rounded-lg hover:bg-cyan-700 disabled:opacity-50 transition-colors"
                  >
                    {replaceMutation.isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4" />
                    )}
                    Salvar Configuração
                  </button>
                )}
              </div>

              {!allValid && rows.length > 0 && (
                <p className="text-xs text-amber-600">
                  Preencha nome e e-mail de todos os signatários antes de salvar.
                </p>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
