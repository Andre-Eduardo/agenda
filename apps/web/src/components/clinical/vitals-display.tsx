interface VitalItem {
  label: string;
  value: string;
  unit: string;
}

interface VitalsDisplayProps {
  items: VitalItem[];
}

export function VitalsDisplay({ items }: VitalsDisplayProps) {
  return (
    <div className="grid grid-cols-4 gap-2">
      {items.map((item, i) => (
        <div
          key={i}
          className="flex flex-col gap-[3px] rounded-(--radius-data) bg-(--color-bg-surface) p-(--padding-data-block)"
        >
          <span className="text-2xs leading-[1.2] text-(--color-text-secondary)">{item.label}</span>
          <span className="font-mono text-sm-body leading-[1.2] tabular-nums text-(--color-text-primary)">
            {item.value}
          </span>
          <span className="font-mono text-2xs leading-[1.2] text-(--color-text-tertiary)">{item.unit}</span>
        </div>
      ))}
    </div>
  );
}
