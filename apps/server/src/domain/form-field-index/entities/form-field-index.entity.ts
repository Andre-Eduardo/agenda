import {Entity, type AllEntityProps, type CreateEntity} from '../../@shared/entity';
import {EntityId} from '../../@shared/entity/id';
import type {PatientFormId} from '../../patient-form/entities';
import type {Specialty} from '../../form-template/entities';

export type CreateFormFieldIndex = CreateEntity<FormFieldIndex>;

export class FormFieldIndex extends Entity<FormFieldIndexId> {
    patientFormId: PatientFormId;
    fieldId: string;
    fieldLabel: string | null;
    fieldType: string | null;
    valueText: string | null;
    valueNumber: number | null;
    valueBoolean: boolean | null;
    valueDate: Date | null;
    valueJson: unknown | null;
    specialty: Specialty;
    confidence: number | null;

    constructor(props: AllEntityProps<FormFieldIndex>) {
        super(props);
        this.patientFormId = props.patientFormId;
        this.fieldId = props.fieldId;
        this.fieldLabel = props.fieldLabel ?? null;
        this.fieldType = props.fieldType ?? null;
        this.valueText = props.valueText ?? null;
        this.valueNumber = props.valueNumber ?? null;
        this.valueBoolean = props.valueBoolean ?? null;
        this.valueDate = props.valueDate ?? null;
        this.valueJson = props.valueJson ?? null;
        this.specialty = props.specialty;
        this.confidence = props.confidence ?? null;
    }

    static create(props: CreateFormFieldIndex): FormFieldIndex {
        const now = new Date();
        return new FormFieldIndex({
            ...props,
            id: FormFieldIndexId.generate(),
            fieldLabel: props.fieldLabel ?? null,
            fieldType: props.fieldType ?? null,
            valueText: props.valueText ?? null,
            valueNumber: props.valueNumber ?? null,
            valueBoolean: props.valueBoolean ?? null,
            valueDate: props.valueDate ?? null,
            valueJson: props.valueJson ?? null,
            confidence: props.confidence ?? null,
            createdAt: now,
            updatedAt: now,
        });
    }

    toJSON() {
        return {
            id: this.id.toJSON(),
            patientFormId: this.patientFormId.toJSON(),
            fieldId: this.fieldId,
            fieldLabel: this.fieldLabel,
            fieldType: this.fieldType,
            valueText: this.valueText,
            valueNumber: this.valueNumber,
            valueBoolean: this.valueBoolean,
            valueDate: this.valueDate?.toJSON() ?? null,
            valueJson: this.valueJson,
            specialty: this.specialty,
            confidence: this.confidence,
            createdAt: this.createdAt.toJSON(),
            updatedAt: this.updatedAt.toJSON(),
        };
    }
}

export class FormFieldIndexId extends EntityId<'FormFieldIndexId'> {
    static from(value: string): FormFieldIndexId {
        return new FormFieldIndexId(value);
    }

    static generate(): FormFieldIndexId {
        return new FormFieldIndexId();
    }
}
