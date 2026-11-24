import {useId} from 'react';
import {ProcedureColor, ProcedureModality} from '@agenda-app/client';
import {useTranslation} from 'react-i18next';
import {z} from 'zod';
import {Input} from '@/components/ui/componentes/input';
import {Label} from '@/components/ui/componentes/label';
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from '@/components/ui/componentes/select';
import styles from './styles.module.css';

export type ProcedureFieldsValue = {
    duration: string;
    price: string;
    color: ProcedureColor;
    modality: ProcedureModality;
};

export const procedureFieldsSchema = z.object({
    duration: z
        .string()
        .regex(/^\d+$/)
        .refine((value) => Number(value) >= 1 && Number(value) <= 720),
    price: z
        .string()
        .regex(/^\d+(?:[.,]\d{1,2})?$/)
        .refine((value) => priceInCents(value) <= 2_147_483_647),
    color: z.nativeEnum(ProcedureColor),
    modality: z.nativeEnum(ProcedureModality),
});

export function priceInCents(price: string): number {
    return Math.round(Number(price.replace(',', '.')) * 100);
}

export function toProcedureFields(value: {
    durationMinutes: number;
    priceInCents: number;
    color: ProcedureColor;
    modality: ProcedureModality;
}): ProcedureFieldsValue {
    return {
        duration: String(value.durationMinutes),
        price: (value.priceInCents / 100).toFixed(2),
        color: value.color,
        modality: value.modality,
    };
}

const colorClasses: Record<ProcedureColor, string> = {
    BLUE: styles.blue,
    GREEN: styles.green,
    AMBER: styles.amber,
    RED: styles.red,
};

export function ProcedureColorDot({color, decorative = false}: {color: ProcedureColor; decorative?: boolean}) {
    const {t} = useTranslation();
    const label = t(`procedure.colors.${color}`);

    return decorative ? (
        <span aria-hidden className={colorClasses[color]} />
    ) : (
        <span role="img" aria-label={label} title={label} className={colorClasses[color]} />
    );
}

type ProcedureFieldsProps = {
    value: ProcedureFieldsValue;
    onChange: (value: ProcedureFieldsValue) => void;
    readOnly?: boolean;
};

export function ProcedureFields({value, onChange, readOnly = false}: ProcedureFieldsProps) {
    const {t} = useTranslation();
    const id = useId();

    return (
        <div className={styles.grid}>
            <div className={styles.field}>
                <Label htmlFor={`${id}-duration`}>{t('procedure.duration')}</Label>
                <Input
                    id={`${id}-duration`}
                    type="number"
                    min={1}
                    max={720}
                    inputMode="numeric"
                    readOnly={readOnly}
                    value={value.duration}
                    onChange={(event) => onChange({...value, duration: event.target.value})}
                />
            </div>
            <div className={styles.field}>
                <Label htmlFor={`${id}-price`}>{t('procedure.price')}</Label>
                <Input
                    id={`${id}-price`}
                    inputMode="decimal"
                    readOnly={readOnly}
                    value={value.price}
                    onChange={(event) => onChange({...value, price: event.target.value})}
                />
            </div>
            <div className={styles.field}>
                <Label htmlFor={`${id}-color`}>{t('procedure.color')}</Label>
                <Select
                    value={value.color}
                    disabled={readOnly}
                    onValueChange={(color: ProcedureColor) => onChange({...value, color})}
                >
                    <SelectTrigger id={`${id}-color`}>
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        {Object.values(ProcedureColor).map((color) => (
                            <SelectItem key={color} value={color}>
                                <ProcedureColorDot color={color} decorative /> {t(`procedure.colors.${color}`)}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
            <div className={styles.field}>
                <Label htmlFor={`${id}-modality`}>{t('procedure.modality')}</Label>
                <Select
                    value={value.modality}
                    disabled={readOnly}
                    onValueChange={(modality: ProcedureModality) => onChange({...value, modality})}
                >
                    <SelectTrigger id={`${id}-modality`}>
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        {Object.values(ProcedureModality).map((modality) => (
                            <SelectItem key={modality} value={modality}>
                                {t(`procedure.modalities.${modality}`)}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
        </div>
    );
}
