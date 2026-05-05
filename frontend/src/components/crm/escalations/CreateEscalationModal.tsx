import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Loader2, AlertTriangle } from 'lucide-react';
import { useCreateEscalation } from '@/hooks/useEscalations';
import type { AdmissionDepartment, EscalationSeverity } from '@/types/contract';

interface CreateEscalationModalProps {
  isOpen: boolean;
  onClose: () => void;
  leadId: string;
  leadName: string;
}

const departmentOptions: { value: AdmissionDepartment; label: string }[] = [
  { value: 'ADMISSIONS', label: 'Admissões' },
  { value: 'PSYCHOLOGY', label: 'Psicologia' },
  { value: 'HEALTH', label: 'Saúde' },
  { value: 'SECRETARIAT', label: 'Secretaria' },
  { value: 'COORDINATION', label: 'Coordenação' },
  { value: 'FINANCE', label: 'Financeiro' },
  { value: 'LEGAL', label: 'Jurídico' },
  { value: 'DIRECTOR', label: 'Diretoria' },
];

const gateStepOptions: { value: string; label: string }[] = [
  { value: 'FORM_APPROVED', label: 'Formulário' },
  { value: 'VISIT_APPROVED', label: 'Visita' },
  { value: 'EVALUATION_COMPLETED', label: 'Avaliação' },
  { value: 'APPROVED', label: 'Aprovação' },
  { value: 'CONTRACT_PENDING', label: 'Contrato' },
  { value: 'FINANCIAL_APPROVED', label: 'Financeiro' },
  { value: 'ENROLLED', label: 'Matrícula' },
];

const severityOptions: { value: EscalationSeverity; label: string }[] = [
  { value: 'LOW', label: 'Baixa' },
  { value: 'MEDIUM', label: 'Média' },
  { value: 'HIGH', label: 'Alta' },
  { value: 'CRITICAL', label: 'Crítica' },
];

export function CreateEscalationModal({ isOpen, onClose, leadId, leadName }: CreateEscalationModalProps) {
  const createMutation = useCreateEscalation();

  const [department, setDepartment] = useState<AdmissionDepartment>('ADMISSIONS');
  const [gateStep, setGateStep] = useState('FORM_APPROVED');
  const [severity, setSeverity] = useState<EscalationSeverity>('MEDIUM');
  const [description, setDescription] = useState('');
  const [touched, setTouched] = useState(false);

  // Block body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const descriptionError = touched && description.trim().length < 10
    ? 'A descrição deve ter pelo menos 10 caracteres'
    : '';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setTouched(true);

    if (description.trim().length < 10) return;

    createMutation.mutate(
      { leadId, department, gateStep, description: description.trim(), severity },
      {
        onSuccess: () => {
          resetForm();
          onClose();
        },
      },
    );
  };

  const resetForm = () => {
    setDepartment('ADMISSIONS');
    setGateStep('FORM_APPROVED');
    setSeverity('MEDIUM');
    setDescription('');
    setTouched(false);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div className="bg-white rounded-2xl shadow-large w-full max-w-lg max-h-[90vh] overflow-hidden">
              {/* Header */}
              <div className="relative bg-gradient-to-r from-red-600 to-red-500 px-6 py-5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                    <AlertTriangle className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-white">Escalação - {leadName}</h2>
                    <p className="text-sm text-white/70">Registrar nova escalação crítica</p>
                  </div>
                </div>
                <button
                  onClick={handleClose}
                  className="absolute top-4 right-4 p-1.5 hover:bg-white/20 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-white" />
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="px-6 py-5 space-y-5 overflow-y-auto max-h-[calc(90vh-11rem)]">
                {/* Department */}
                <div>
                  <label className="label">Departamento</label>
                  <select
                    value={department}
                    onChange={(e) => setDepartment(e.target.value as AdmissionDepartment)}
                    className="input"
                  >
                    {departmentOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Gate Step */}
                <div>
                  <label className="label">Etapa</label>
                  <select
                    value={gateStep}
                    onChange={(e) => setGateStep(e.target.value)}
                    className="input"
                  >
                    {gateStepOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Severity */}
                <div>
                  <label className="label">Severidade</label>
                  <select
                    value={severity}
                    onChange={(e) => setSeverity(e.target.value as EscalationSeverity)}
                    className="input"
                  >
                    {severityOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Description */}
                <div>
                  <label className="label">Descrição *</label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    onBlur={() => setTouched(true)}
                    rows={4}
                    placeholder="Descreva o problema que motivou a escalação..."
                    className={`input resize-none ${descriptionError ? 'input-error' : ''}`}
                  />
                  {descriptionError && (
                    <p className="text-xs text-error-500 mt-1">{descriptionError}</p>
                  )}
                </div>
              </form>

              {/* Footer */}
              <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-neutral-100 bg-neutral-50/50">
                <button
                  type="button"
                  onClick={handleClose}
                  className="btn btn-secondary btn-md"
                  disabled={createMutation.isPending}
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSubmit as unknown as React.MouseEventHandler}
                  disabled={createMutation.isPending}
                  className="btn btn-md bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
                >
                  {createMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      Criando...
                    </>
                  ) : (
                    'Criar Escalação'
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
