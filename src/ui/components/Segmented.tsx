import type { ComponentChildren } from 'preact';

interface Props<T> {
  options: readonly { value: T; label: ComponentChildren }[];
  value: T;
  onChange(value: T): void;
  label: string;
}

export function Segmented<T extends string | number>({
  options,
  value,
  onChange,
  label,
}: Props<T>) {
  const index = Math.max(
    0,
    options.findIndex((o) => o.value === value),
  );
  return (
    <div class="seg" role="group" aria-label={label} style={{ '--count': options.length }}>
      <span class="seg-ind" style={{ transform: `translateX(${index * 100}%)` }} />
      {options.map((o) => (
        <button key={o.value} aria-pressed={o.value === value} onClick={() => onChange(o.value)}>
          {o.label}
        </button>
      ))}
    </div>
  );
}
