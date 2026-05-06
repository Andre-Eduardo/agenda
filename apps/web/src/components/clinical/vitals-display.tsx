import styles from "./vitals-display.module.css";

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
    <div className={styles.grid}>
      {items.map((item, i) => (
        <div key={i} className={styles.item}>
          <span className={styles.itemLabel}>{item.label}</span>
          <span className={styles.value}>{item.value}</span>
          <span className={styles.unit}>{item.unit}</span>
        </div>
      ))}
    </div>
  );
}
