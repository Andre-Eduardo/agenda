import {CheckCircle2, AlertTriangle, XCircle} from 'lucide-react';
import {cn} from '@/lib/utils';
import styles from './confidence-indicator.module.css';

export type ConfidenceLevel = 'high' | 'mid' | 'low';

interface ConfidenceIndicatorProps {
    level: ConfidenceLevel;
    label?: string;
    className?: string;
}

/**
 * Per-field confidence chip used on AI-extracted form fields (OCR, suggestions).
 * See design-system.md §10.3.
 *
 * TODO: integrate with form field rendering — apply matching border color to
 * the input itself when the field is wrapped (border-(--color-confidence-{level})).
 */
export function ConfidenceIndicator({level, label, className}: ConfidenceIndicatorProps) {
    const config = {
        high: {Icon: CheckCircle2, defaultLabel: 'Alta confiança'},
        mid: {Icon: AlertTriangle, defaultLabel: 'Confiança moderada'},
        low: {Icon: XCircle, defaultLabel: 'Baixa confiança — revisar'},
    }[level];

    const {Icon} = config;
    const levelClass = {high: styles.high, mid: styles.mid, low: styles.low}[level];

    return (
        <span className={cn(styles.root, levelClass, className)}>
            <Icon aria-hidden className="size-3.5" />
            {label ?? config.defaultLabel}
        </span>
    );
}
