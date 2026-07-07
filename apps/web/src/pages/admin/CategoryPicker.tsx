import { focusRing } from "../../styles/focusRing";
import { CATEGORIES } from "./categories";

export function CategoryPicker({
  value,
  color,
  onChange,
}: {
  value: string;
  color: string;
  onChange: (next: string) => void;
}) {
  return (
    <select
      value={value}
      onClick={(e) => e.stopPropagation()}
      onChange={(e) => onChange(e.target.value)}
      aria-label={`${value} kategorisini değiştir`}
      className={`cursor-pointer rounded-full border-none px-2 py-0.5 text-xs font-medium ${focusRing}`}
      style={{ backgroundColor: `${color}22`, color }}
    >
      {CATEGORIES.map((c) => (
        <option key={c} value={c}>
          {c}
        </option>
      ))}
    </select>
  );
}
