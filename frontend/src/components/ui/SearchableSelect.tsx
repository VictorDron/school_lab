import { useState, useRef, useEffect, useMemo } from 'react';
import { ChevronDown, X, Search } from 'lucide-react';

export interface SearchableSelectOption {
  value: string;
  label: string;
}

interface SearchableSelectProps {
  options: SearchableSelectOption[];
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  disabled?: boolean;
  className?: string;
  allowCustomValue?: boolean;
  customValueLabel?: string;
}

export function SearchableSelect({
  options,
  value,
  onChange,
  placeholder = 'Select...',
  searchPlaceholder = 'Search...',
  disabled = false,
  className = '',
  allowCustomValue = false,
  customValueLabel = 'Use custom value',
}: SearchableSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Check if value is a custom value (not in options)
  const isCustomValue = useMemo(
    () => value && !options.find((opt) => opt.value === value),
    [options, value]
  );

  const selectedOption = useMemo(
    () => options.find((opt) => opt.value === value),
    [options, value]
  );

  // Display value - either the option label or the custom value
  const displayValue = useMemo(() => {
    if (selectedOption) return selectedOption.label;
    if (isCustomValue && value) return value;
    return null;
  }, [selectedOption, isCustomValue, value]);

  const filteredOptions = useMemo(() => {
    if (!search) return options;
    const searchLower = search.toLowerCase();
    return options.filter((opt) =>
      opt.label.toLowerCase().includes(searchLower)
    );
  }, [options, search]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearch('');
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const handleSelect = (optionValue: string) => {
    onChange(optionValue);
    setIsOpen(false);
    setSearch('');
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('');
    setSearch('');
  };

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`
          w-full flex items-center justify-between gap-2 px-3 py-2
          bg-white border border-neutral-300 rounded-lg text-left
          transition-colors
          ${disabled ? 'bg-neutral-100 cursor-not-allowed' : 'hover:border-neutral-400 cursor-pointer'}
          ${isOpen ? 'border-primary-500 ring-2 ring-primary-500/20' : ''}
        `}
      >
        <span className={displayValue ? 'text-neutral-900' : 'text-neutral-500'}>
          {displayValue || placeholder}
        </span>
        <div className="flex items-center gap-1">
          {value && !disabled && (
            <span
              onClick={handleClear}
              className="p-0.5 hover:bg-neutral-100 rounded transition-colors"
            >
              <X className="w-4 h-4 text-neutral-400" />
            </span>
          )}
          <ChevronDown
            className={`w-4 h-4 text-neutral-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          />
        </div>
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-neutral-200 rounded-lg shadow-lg overflow-hidden">
          {/* Search Input */}
          <div className="p-2 sm:p-2 border-b border-neutral-100">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
              <input
                ref={inputRef}
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={searchPlaceholder}
                className="w-full pl-8 pr-3 py-2.5 sm:py-2 text-base sm:text-sm border border-neutral-200 rounded-md focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="off"
              />
            </div>
          </div>

          {/* Options List */}
          <div className="max-h-48 sm:max-h-60 overflow-y-auto overscroll-contain">
            {filteredOptions.length === 0 ? (
              <div className="px-3 py-2">
                {allowCustomValue && search.trim() ? (
                  <button
                    type="button"
                    onClick={() => handleSelect(search.trim())}
                    className="w-full px-3 py-2 text-left text-sm text-primary-700 bg-primary-50 hover:bg-primary-100 rounded-md transition-colors"
                  >
                    {customValueLabel}: <span className="font-medium">"{search.trim()}"</span>
                  </button>
                ) : (
                  <div className="py-2 text-sm text-neutral-500 text-center">
                    No results found
                  </div>
                )}
              </div>
            ) : (
              <>
                {filteredOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => handleSelect(option.value)}
                    className={`
                      w-full px-3 py-2 text-left text-sm transition-colors
                      ${option.value === value
                        ? 'bg-primary-50 text-primary-700 font-medium'
                        : 'text-neutral-700 hover:bg-neutral-50'
                      }
                    `}
                  >
                    {option.label}
                  </button>
                ))}
                {/* Show custom value option if searching and no exact match */}
                {allowCustomValue && search.trim() && !filteredOptions.some((opt) => opt.label.toLowerCase() === search.toLowerCase()) && (
                  <button
                    type="button"
                    onClick={() => handleSelect(search.trim())}
                    className="w-full px-3 py-2 text-left text-sm text-primary-600 hover:bg-primary-50 border-t border-neutral-100 transition-colors"
                  >
                    {customValueLabel}: <span className="font-medium">"{search.trim()}"</span>
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
