import type { UseFormRegister } from "react-hook-form";
import { FREQUENCY_OPTIONS } from "./constants";
import type { FormData } from "./types";

interface RecurrenceFieldsProps {
  register: UseFormRegister<FormData>;
  isRecurring: boolean;
}

export function RecurrenceFields({ register, isRecurring }: RecurrenceFieldsProps) {
  return (
    <div className="space-y-3">
      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          {...register("isRecurring")}
          className="w-4 h-4 rounded border-neutral-300 text-primary-600 focus:ring-primary-500"
        />
        <span className="text-sm text-neutral-700">Evento recorrente</span>
      </label>

      {isRecurring && (
        <div className="pl-6 space-y-3 border-l-2 border-primary-200 ml-2">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-neutral-600 mb-1">
                Frequência
              </label>
              <select
                {...register("recurrenceFrequency")}
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none bg-white"
              >
                {FREQUENCY_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-neutral-600 mb-1">
                Intervalo
              </label>
              <input
                {...register("recurrenceInterval", { valueAsNumber: true, min: 1 })}
                type="number"
                min={1}
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-neutral-600 mb-1">
              Data final da recorrência
            </label>
            <input
              {...register("recurrenceEndDate")}
              type="date"
              className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
            />
          </div>
        </div>
      )}
    </div>
  );
}
