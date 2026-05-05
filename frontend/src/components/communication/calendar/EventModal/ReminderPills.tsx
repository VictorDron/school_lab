import { Controller, type Control } from "react-hook-form";
import { REMINDER_OPTIONS } from "./constants";
import type { FormData } from "./types";

interface ReminderPillsProps {
  control: Control<FormData>;
}

export function ReminderPills({ control }: ReminderPillsProps) {
  return (
    <div>
      <label className="block text-sm font-medium text-neutral-700 mb-2">
        Lembretes
      </label>
      <Controller
        name="reminderMinutes"
        control={control}
        render={({ field }) => (
          <div className="flex flex-wrap gap-2">
            {REMINDER_OPTIONS.map((opt) => {
              const isSelected = field.value.includes(opt.value);
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => {
                    if (isSelected) {
                      field.onChange(field.value.filter((v: number) => v !== opt.value));
                    } else {
                      field.onChange([...field.value, opt.value]);
                    }
                  }}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    isSelected
                      ? "bg-primary-100 text-primary-700 ring-1 ring-primary-300"
                      : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
                  }`}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        )}
      />
    </div>
  );
}
