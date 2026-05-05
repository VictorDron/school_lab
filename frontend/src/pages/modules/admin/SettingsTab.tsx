import { useEffect, useState } from 'react';
import * as api from '@/lib/api';

interface Settings {
  schoolName: string;
  defaultLanguage: string;
  dateFormat: string;
  currency: string;
  timezone: string;
  legalName: string | null;
  cnpj: string | null;
  legalAddress: string | null;
  legalCity: string | null;
  legalRepresentative: string | null;
  jurisdiction: string | null;
  internationalMaterialFee: number | string | null;
  lgpdContactEmail: string | null;
  gradeProgression: string[];
}

type FormState = Omit<Settings, 'internationalMaterialFee' | 'gradeProgression'> & {
  internationalMaterialFee: string;
  gradeProgression: string;
};

const EMPTY_FORM: FormState = {
  schoolName: '',
  defaultLanguage: 'pt',
  dateFormat: 'DD/MM/YYYY',
  currency: 'BRL',
  timezone: 'America/Sao_Paulo',
  legalName: '',
  cnpj: '',
  legalAddress: '',
  legalCity: '',
  legalRepresentative: '',
  jurisdiction: '',
  internationalMaterialFee: '',
  lgpdContactEmail: '',
  gradeProgression: '',
};

function fromSettings(s: Settings): FormState {
  return {
    schoolName: s.schoolName ?? '',
    defaultLanguage: s.defaultLanguage ?? 'pt',
    dateFormat: s.dateFormat ?? 'DD/MM/YYYY',
    currency: s.currency ?? 'BRL',
    timezone: s.timezone ?? 'America/Sao_Paulo',
    legalName: s.legalName ?? '',
    cnpj: s.cnpj ?? '',
    legalAddress: s.legalAddress ?? '',
    legalCity: s.legalCity ?? '',
    legalRepresentative: s.legalRepresentative ?? '',
    jurisdiction: s.jurisdiction ?? '',
    internationalMaterialFee:
      s.internationalMaterialFee == null ? '' : String(s.internationalMaterialFee),
    lgpdContactEmail: s.lgpdContactEmail ?? '',
    gradeProgression: (s.gradeProgression ?? []).join('\n'),
  };
}

function toPatchPayload(form: FormState): Record<string, unknown> {
  const trimmedFee = form.internationalMaterialFee.trim();
  const fee = trimmedFee === '' ? null : Number(trimmedFee);
  return {
    schoolName: form.schoolName.trim(),
    defaultLanguage: form.defaultLanguage,
    dateFormat: form.dateFormat,
    currency: form.currency,
    timezone: form.timezone,
    legalName: form.legalName?.trim() || null,
    cnpj: form.cnpj?.trim() || null,
    legalAddress: form.legalAddress?.trim() || null,
    legalCity: form.legalCity?.trim() || null,
    legalRepresentative: form.legalRepresentative?.trim() || null,
    jurisdiction: form.jurisdiction?.trim() || null,
    internationalMaterialFee: Number.isFinite(fee) ? fee : null,
    lgpdContactEmail: form.lgpdContactEmail?.trim() || null,
    gradeProgression: form.gradeProgression
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean),
  };
}

export default function SettingsTab() {
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    api
      .get<Settings>('/settings')
      .then((res) => {
        if (cancelled) return;
        if (res.data) setForm(fromSettings(res.data));
      })
      .catch((err) => {
        if (!cancelled) setError(api.getErrorMessage(err));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await api.patch<Settings>('/settings', toPatchPayload(form));
      setSavedAt(Date.now());
    } catch (err) {
      setError(api.getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="p-6">
        <p className="text-neutral-500">Carregando configurações…</p>
      </div>
    );
  }

  return (
    <div className="p-6">
      <form onSubmit={onSubmit} className="max-w-2xl space-y-6">
        <h2 className="text-xl font-semibold text-neutral-900">Configurações do Sistema</h2>

        {error && (
          <div className="card border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>
        )}
        {savedAt && !error && !saving && (
          <div className="card border border-green-200 bg-green-50 p-4 text-sm text-green-700">
            Salvo às {new Date(savedAt).toLocaleTimeString('pt-BR')}.
          </div>
        )}

        {/* Identity */}
        <div className="card p-6 space-y-4">
          <h3 className="text-sm font-semibold text-neutral-900">Identidade</h3>
          <div>
            <label className="label">Nome da Escola (display)</label>
            <input
              className="input"
              value={form.schoolName}
              onChange={(e) => update('schoolName', e.target.value)}
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Idioma Padrão</label>
              <select
                className="input"
                value={form.defaultLanguage}
                onChange={(e) => update('defaultLanguage', e.target.value)}
              >
                <option value="pt">Português</option>
                <option value="en">English</option>
              </select>
            </div>
            <div>
              <label className="label">Formato de Data</label>
              <select
                className="input"
                value={form.dateFormat}
                onChange={(e) => update('dateFormat', e.target.value)}
              >
                <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                <option value="YYYY-MM-DD">YYYY-MM-DD</option>
              </select>
            </div>
            <div>
              <label className="label">Moeda</label>
              <input
                className="input"
                value={form.currency}
                onChange={(e) => update('currency', e.target.value)}
              />
            </div>
            <div>
              <label className="label">Fuso Horário</label>
              <input
                className="input"
                value={form.timezone}
                onChange={(e) => update('timezone', e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Legal entity */}
        <div className="card p-6 space-y-4">
          <div>
            <h3 className="text-sm font-semibold text-neutral-900">Entidade Legal</h3>
            <p className="text-xs text-neutral-500 mt-1">
              Aparece em contratos e aditivos. Vazios = template degrada (ex.: omite a cláusula
              de CNPJ).
            </p>
          </div>
          <div>
            <label className="label">Razão Social</label>
            <input
              className="input"
              placeholder="Ex: ICS Escola Internacional do Rio Ltda."
              value={form.legalName ?? ''}
              onChange={(e) => update('legalName', e.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">CNPJ</label>
              <input
                className="input"
                placeholder="00.000.000/0000-00"
                value={form.cnpj ?? ''}
                onChange={(e) => update('cnpj', e.target.value)}
              />
            </div>
            <div>
              <label className="label">Cidade da sede</label>
              <input
                className="input"
                placeholder="Rio de Janeiro"
                value={form.legalCity ?? ''}
                onChange={(e) => update('legalCity', e.target.value)}
              />
            </div>
          </div>
          <div>
            <label className="label">Endereço da sede</label>
            <input
              className="input"
              placeholder="Av. ..., nº ..., bairro, cidade — CEP"
              value={form.legalAddress ?? ''}
              onChange={(e) => update('legalAddress', e.target.value)}
            />
          </div>
          <div>
            <label className="label">Representante legal</label>
            <input
              className="input"
              placeholder="Sra. Fulana de Tal, Diretora"
              value={form.legalRepresentative ?? ''}
              onChange={(e) => update('legalRepresentative', e.target.value)}
            />
          </div>
          <div>
            <label className="label">Foro de eleição (cláusula 5.6)</label>
            <input
              className="input"
              placeholder="Comarca do Rio de Janeiro - RJ"
              value={form.jurisdiction ?? ''}
              onChange={(e) => update('jurisdiction', e.target.value)}
            />
          </div>
        </div>

        {/* Compliance + fee */}
        <div className="card p-6 space-y-4">
          <h3 className="text-sm font-semibold text-neutral-900">Compliance & Cláusulas</h3>
          <div>
            <label className="label">E-mail do Encarregado LGPD (cláusula 4.7)</label>
            <input
              className="input"
              type="email"
              placeholder="dpo@escola.com"
              value={form.lgpdContactEmail ?? ''}
              onChange={(e) => update('lgpdContactEmail', e.target.value)}
            />
          </div>
          <div>
            <label className="label">Taxa material pedagógico internacional (R$)</label>
            <input
              className="input"
              type="number"
              step="0.01"
              min="0"
              placeholder="Vazio = cláusula 3.8 omitida"
              value={form.internationalMaterialFee}
              onChange={(e) => update('internationalMaterialFee', e.target.value)}
            />
          </div>
        </div>

        {/* Curriculum */}
        <div className="card p-6 space-y-4">
          <div>
            <h3 className="text-sm font-semibold text-neutral-900">Currículo</h3>
            <p className="text-xs text-neutral-500 mt-1">
              Progressão de séries em ordem ascendente (uma por linha). Vazio usa o padrão K-12
              americano (Nursery → 12th Grade).
            </p>
          </div>
          <div>
            <label className="label">Progressão de séries</label>
            <textarea
              className="input min-h-[180px] font-mono text-xs"
              placeholder={'Maternal\nJardim I\n1º ano EF\n...'}
              value={form.gradeProgression}
              onChange={(e) => update('gradeProgression', e.target.value)}
            />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button type="submit" className="btn btn-primary btn-md" disabled={saving}>
            {saving ? 'Salvando…' : 'Salvar Configurações'}
          </button>
        </div>
      </form>
    </div>
  );
}
