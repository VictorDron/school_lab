import { useState } from 'react';
import { useCreatePeriod } from '@/hooks/useReEnrollmentAdmin';

interface FormState {
  name: string;
  targetYear: number;
  startDate: string;
  endDate: string;
}

export default function CreatePeriodForm({ onClose }: { onClose: () => void }) {
  const createMutation = useCreatePeriod();
  const currentYear = new Date().getFullYear();
  const [form, setForm] = useState<FormState>({
    name: `Rematrícula ${currentYear + 1}`,
    targetYear: currentYear + 1,
    startDate: '',
    endDate: '',
  });

  const handleSubmit = async () => {
    if (!form.startDate || !form.endDate) return;
    await createMutation.mutateAsync({
      name: form.name,
      targetYear: form.targetYear,
      startDate: new Date(form.startDate).toISOString(),
      endDate: new Date(form.endDate).toISOString(),
      eligibleGrades: [], // Backend defaults to all grades
    });
    onClose();
  };

  return (
    <div className="bg-white border-b border-neutral-200 px-4 lg:px-6 py-4">
      <div className="max-w-2xl space-y-4">
        <h3 className="text-sm font-semibold text-neutral-700">Criar Nova Campanha</h3>
        <p className="text-xs text-neutral-500">A campanha incluirá automaticamente todas as séries.</p>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-neutral-600 mb-1">Nome</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
            />
          </div>
          <div>
            <label className="block text-sm text-neutral-600 mb-1">Ano Letivo Alvo</label>
            <input
              type="number"
              value={form.targetYear}
              onChange={(e) =>
                setForm((f) => ({ ...f, targetYear: Number(e.target.value) }))
              }
              className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
            />
          </div>
          <div>
            <label className="block text-sm text-neutral-600 mb-1">Data de Início</label>
            <input
              type="datetime-local"
              value={form.startDate}
              onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value }))}
              className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
            />
          </div>
          <div>
            <label className="block text-sm text-neutral-600 mb-1">Data de Fim</label>
            <input
              type="datetime-local"
              value={form.endDate}
              onChange={(e) => setForm((f) => ({ ...f, endDate: e.target.value }))}
              className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
            />
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleSubmit}
            disabled={!form.startDate || !form.endDate || createMutation.isPending}
            className="px-4 py-2 text-sm font-medium text-white bg-cyan-600 rounded-lg hover:bg-cyan-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {createMutation.isPending ? 'Criando...' : 'Criar Campanha'}
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-neutral-600 border border-neutral-300 rounded-lg hover:bg-neutral-50 transition-colors"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}
