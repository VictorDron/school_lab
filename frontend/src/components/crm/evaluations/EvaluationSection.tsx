interface EvaluationSectionProps {
  label: string;
  name: string;
  value?: string;
  onChange?: (value: string) => void;
  readOnly?: boolean;
  placeholder?: string;
}

export function EvaluationSection({
  label,
  name,
  value,
  onChange,
  readOnly = false,
  placeholder,
}: EvaluationSectionProps) {
  return (
    <div>
      <label className="block text-sm font-medium text-neutral-700 mb-1">{label}</label>
      {readOnly ? (
        <p className="text-sm text-neutral-600 bg-neutral-50 rounded-lg p-3 min-h-[60px]">
          {value || <span className="text-neutral-400 italic">Não preenchido</span>}
        </p>
      ) : (
        <textarea
          name={name}
          value={value || ''}
          onChange={(e) => onChange?.(e.target.value)}
          placeholder={placeholder}
          rows={3}
          className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm focus:ring-2 focus:ring-[#0aacce] focus:border-[#0aacce] resize-none"
        />
      )}
    </div>
  );
}
