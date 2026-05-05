import { CheckCircle } from 'lucide-react';
import type { ImportStep } from '@/types/import';

interface StepDef {
  id: ImportStep;
  label: string;
}

const STEPS: StepDef[] = [
  { id: 'upload', label: 'Upload' },
  { id: 'mapping', label: 'Mapeamento' },
  { id: 'preview', label: 'Preview' },
  { id: 'confirm', label: 'Confirmar' },
  { id: 'result', label: 'Resultado' },
];

interface ImportStepperProps {
  currentStep: ImportStep;
}

function getStepIndex(step: ImportStep): number {
  return STEPS.findIndex((s) => s.id === step);
}

export function ImportStepper({ currentStep }: ImportStepperProps) {
  const currentIndex = getStepIndex(currentStep);

  return (
    <div className="flex items-center w-full max-w-2xl mx-auto">
      {STEPS.map((step, index) => {
        const isCompleted = index < currentIndex;
        const isCurrent = index === currentIndex;

        return (
          <div key={step.id} className="flex items-center flex-1 last:flex-none">
            {/* Step circle + label */}
            <div className="flex flex-col items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold transition-colors ${
                  isCompleted
                    ? 'bg-green-500 text-white'
                    : isCurrent
                      ? 'bg-violet-600 text-white'
                      : 'bg-neutral-200 text-neutral-500'
                }`}
              >
                {isCompleted ? (
                  <CheckCircle className="w-4 h-4" />
                ) : (
                  index + 1
                )}
              </div>
              <span
                className={`mt-1.5 text-xs font-medium whitespace-nowrap ${
                  isCurrent
                    ? 'text-violet-600'
                    : isCompleted
                      ? 'text-green-600'
                      : 'text-neutral-400'
                } ${index !== currentIndex ? 'hidden sm:block' : ''}`}
              >
                {step.label}
              </span>
            </div>

            {/* Connector line */}
            {index < STEPS.length - 1 && (
              <div
                className={`flex-1 h-0.5 mx-2 transition-colors ${
                  index < currentIndex ? 'bg-green-400' : 'bg-neutral-200'
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
