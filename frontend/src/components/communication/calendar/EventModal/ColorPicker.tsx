import { PRESET_COLORS } from "./constants";

interface ColorPickerProps {
  selectedColor: string;
  onSelect: (color: string) => void;
}

export function ColorPicker({ selectedColor, onSelect }: ColorPickerProps) {
  return (
    <div>
      <label className="block text-sm font-medium text-neutral-700 mb-1">Cor</label>
      <div className="flex gap-2">
        {PRESET_COLORS.map((color) => (
          <button
            key={color}
            type="button"
            onClick={() => onSelect(selectedColor === color ? "" : color)}
            className={`w-8 h-8 rounded-full transition-all ${
              selectedColor === color
                ? "ring-2 ring-offset-2 ring-primary-500 scale-110"
                : "hover:scale-105"
            }`}
            style={{ backgroundColor: color }}
          />
        ))}
      </div>
    </div>
  );
}
