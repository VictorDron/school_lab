// ---------------------------------------------------------------------------
// MotherAddressToggle — switch that controls whether the mother provides her
// own address. When off, the family shares the father's address; when on, a
// separate AddressFields block is rendered for the mother.
// ---------------------------------------------------------------------------

export interface MotherAddressToggleProps {
  enabled: boolean;
  onChange: (enabled: boolean) => void;
  language: string;
}

export function MotherAddressToggle({ enabled, onChange, language }: MotherAddressToggleProps) {
  return (
    <div className="mt-6 mb-4 flex items-center justify-between p-4 bg-neutral-50 rounded-lg border border-neutral-200">
      <div>
        <p className="text-sm font-medium text-neutral-900">
          {language === 'pt' ? 'A mãe mora em endereço diferente?' : 'Does the mother live at a different address?'}
        </p>
        <p className="text-xs text-neutral-500 mt-0.5">
          {language === 'pt'
            ? 'Ative para informar um endereço separado para a mãe.'
            : 'Enable to provide a separate address for the mother.'}
        </p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={enabled}
        onClick={() => onChange(!enabled)}
        className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 ${
          enabled ? 'bg-primary-600' : 'bg-neutral-300'
        }`}
      >
        <span
          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
            enabled ? 'translate-x-5' : 'translate-x-0'
          }`}
        />
      </button>
    </div>
  );
}
