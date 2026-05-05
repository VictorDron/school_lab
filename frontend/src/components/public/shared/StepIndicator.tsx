import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import type { ComponentType } from 'react';

export interface StepDef {
  id: number;
  icon: ComponentType<{ className?: string }>;
  labelPt: string;
  labelEn: string;
}

interface StepIndicatorProps {
  currentStep: number;
  language: string;
  steps: StepDef[];
  /** When provided, completed = set.has(id). When absent, completed = id < currentStep. */
  completedSteps?: Set<number>;
  onStepClick?: (stepId: number) => void;
  /**
   * Visual variant.
   * - 'enrollment' (default): green completed, w-10 circles, simple connector
   * - 'admission': primary completed, w-12 circles, animated connector
   */
  variant?: 'enrollment' | 'admission';
}

export function StepIndicator({
  currentStep,
  language,
  steps,
  completedSteps,
  onStepClick,
  variant = 'enrollment',
}: StepIndicatorProps) {
  const isCompleted = (stepId: number) =>
    completedSteps ? completedSteps.has(stepId) : stepId < currentStep;

  const isClickable = (stepId: number) =>
    isCompleted(stepId) || stepId < currentStep;

  const handleClick = (stepId: number) => {
    if (onStepClick && isClickable(stepId)) {
      onStepClick(stepId);
    }
  };

  const isAdmission = variant === 'admission';

  return (
    <div className="relative">
      {/* Mobile: Simple dots */}
      <div className="flex md:hidden justify-center gap-2 mb-6">
        {steps.map((step) => (
          <div
            key={step.id}
            onClick={() => handleClick(step.id)}
            className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
              step.id === currentStep
                ? 'bg-primary-600 scale-125'
                : isCompleted(step.id)
                ? isAdmission
                  ? 'bg-primary-400'
                  : 'bg-green-500'
                : step.id < currentStep
                ? 'bg-primary-400'
                : 'bg-neutral-200'
            } ${isClickable(step.id) ? 'cursor-pointer' : ''}`}
          />
        ))}
      </div>

      {/* Desktop: Full stepper */}
      <div className="hidden md:flex items-center justify-between mb-8">
        {steps.map((step, index) => {
          const Icon = step.icon;
          const isActive = step.id === currentStep;
          const stepCompleted = isCompleted(step.id);
          const clickable = isClickable(step.id);

          return (
            <div key={step.id} className="flex items-center flex-1">
              <div
                className={`flex flex-col items-center ${isAdmission ? 'relative z-10' : ''} ${clickable ? 'cursor-pointer' : ''}`}
                onClick={() => handleClick(step.id)}
              >
                <motion.div
                  initial={false}
                  animate={{
                    scale: isActive ? 1.1 : 1,
                    backgroundColor: stepCompleted
                      ? isAdmission ? '#0589aa' : '#10b981'
                      : isActive
                      ? '#0589aa'
                      : isAdmission ? '#f5f5f5' : '#e5e7eb',
                  }}
                  className={`${isAdmission ? 'w-12 h-12' : 'w-10 h-10'} rounded-full flex items-center justify-center ${
                    isAdmission ? 'transition-colors' : ''
                  } ${
                    stepCompleted || isActive ? 'text-white' : 'text-neutral-400'
                  } ${stepCompleted && isAdmission ? 'hover:opacity-80' : ''}`}
                >
                  {stepCompleted ? <Check className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
                </motion.div>
                <span
                  className={`mt-2 text-xs font-medium ${
                    isActive
                      ? 'text-primary-600'
                      : isAdmission
                      ? 'text-neutral-500'
                      : stepCompleted
                      ? 'text-green-600'
                      : 'text-neutral-400'
                  }`}
                >
                  {language === 'pt' ? step.labelPt : step.labelEn}
                </span>
              </div>
              {index < steps.length - 1 && (
                isAdmission ? (
                  <div className="flex-1 mx-4 h-0.5 bg-neutral-200 relative">
                    <motion.div
                      initial={false}
                      animate={{ width: stepCompleted ? '100%' : '0%' }}
                      className="absolute inset-y-0 left-0 bg-primary-500"
                      transition={{ duration: 0.3 }}
                    />
                  </div>
                ) : (
                  <div
                    className={`flex-1 h-0.5 mx-2 ${
                      isCompleted(step.id) ? 'bg-green-500' : 'bg-neutral-200'
                    }`}
                  />
                )
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
