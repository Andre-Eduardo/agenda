import type {ClinicId} from '@domain/clinic/entities';
import {type AllEntityProps, type EntityJson, type EntityProps, type CreateEntity} from '../../@shared/entity';
import {Person, PersonId, PersonType} from '../../person/entities/person.entity';
import {PatientCreatedEvent, PatientChangedEvent, PatientDeletedEvent} from '../events';

export type PatientAddressData = {
    street: string | null;
    number: string | null;
    complement: string | null;
    neighborhood: string | null;
    city: string | null;
    state: string | null;
    zipCode: string | null;
    country: string | null;
};

export type InsurancePlanSummary = {
    id: string;
    name: string;
    code: string | null;
    isActive: boolean;
};

export type PatientProps = EntityProps<Patient>;
export type CreatePatient = CreateEntity<Patient>;
export type UpdatePatient = Partial<PatientProps>;

export class Patient extends Person {
    clinicId: ClinicId;
    birthDate: Date | null;
    email: string | null;
    emergencyContactName: string | null;
    emergencyContactPhone: string | null;
    address: PatientAddressData | null;
    insurancePlanId: string | null;
    insuranceCardNumber: string | null;
    insuranceValidUntil: Date | null;
    /** Populated by repository when insurancePlanId is set. Read-only from domain perspective. */
    insurancePlan: InsurancePlanSummary | null;

    constructor(props: AllEntityProps<Patient>) {
        super(props);
        this.clinicId = props.clinicId;
        this.birthDate = props.birthDate ?? null;
        this.email = props.email ?? null;
        this.emergencyContactName = props.emergencyContactName ?? null;
        this.emergencyContactPhone = props.emergencyContactPhone ?? null;
        this.address = props.address ?? null;
        this.insurancePlanId = props.insurancePlanId ?? null;
        this.insuranceCardNumber = props.insuranceCardNumber ?? null;
        this.insuranceValidUntil = props.insuranceValidUntil ?? null;
        this.insurancePlan = props.insurancePlan ?? null;
        this.validate();
    }

    static create(props: CreatePatient): Patient {
        const now = new Date();

        const patient = new Patient({
            ...props,
            id: PatientId.generate(),
            name: props.name,
            documentId: props.documentId,
            phone: props.phone ?? null,
            gender: props.gender ?? null,
            createdAt: now,
            updatedAt: now,
            deletedAt: null,
            personType: props.personType ?? PersonType.NATURAL,
            clinicId: props.clinicId,
            birthDate: props.birthDate ?? null,
            email: props.email ?? null,
            emergencyContactName: props.emergencyContactName ?? null,
            emergencyContactPhone: props.emergencyContactPhone ?? null,
            address: props.address ?? null,
            insurancePlanId: props.insurancePlanId ?? null,
            insuranceCardNumber: props.insuranceCardNumber ?? null,
            insuranceValidUntil: props.insuranceValidUntil ?? null,
            insurancePlan: props.insurancePlan ?? null,
        });

        patient.addEvent(new PatientCreatedEvent({patient, timestamp: now}));

        return patient;
    }

    delete(): void {
        this.addEvent(new PatientDeletedEvent({patient: this}));
    }

    change(props: UpdatePatient): void {
        const oldState = new Patient(this);

        if (props.name !== undefined) this.name = props.name;
        if (props.phone !== undefined) this.phone = props.phone;
        if (props.gender !== undefined) this.gender = props.gender;
        if (props.birthDate !== undefined) this.birthDate = props.birthDate;
        if (props.email !== undefined) this.email = props.email;
        if (props.emergencyContactName !== undefined) this.emergencyContactName = props.emergencyContactName;
        if (props.emergencyContactPhone !== undefined) this.emergencyContactPhone = props.emergencyContactPhone;
        if (props.address !== undefined) this.address = props.address;
        if (props.insurancePlanId !== undefined) this.insurancePlanId = props.insurancePlanId;
        if (props.insuranceCardNumber !== undefined) this.insuranceCardNumber = props.insuranceCardNumber;
        if (props.insuranceValidUntil !== undefined) this.insuranceValidUntil = props.insuranceValidUntil;

        this.validate();

        this.addEvent(new PatientChangedEvent({oldState, newState: this}));
    }

    validate(): void {
        // Add validation logic if needed
    }

    toJSON(): EntityJson<Patient> {
        return {
            id: this.id.toJSON(),
            clinicId: this.clinicId.toJSON(),
            name: this.name,
            documentId: this.documentId.toJSON(),
            phone: this.phone?.toJSON() ?? null,
            gender: this.gender ?? null,
            personType: this.personType,
            birthDate: this.birthDate?.toJSON() ?? null,
            email: this.email,
            emergencyContactName: this.emergencyContactName,
            emergencyContactPhone: this.emergencyContactPhone,
            address: this.address,
            insurancePlanId: this.insurancePlanId,
            insuranceCardNumber: this.insuranceCardNumber,
            insuranceValidUntil: this.insuranceValidUntil?.toJSON() ?? null,
            insurancePlan: this.insurancePlan,
            createdAt: this.createdAt.toJSON(),
            updatedAt: this.updatedAt.toJSON(),
            deletedAt: this.deletedAt?.toJSON() ?? null,
        };
    }
}

export class PatientId extends PersonId {
    static from(value: string): PatientId {
        return new PatientId(value);
    }

    static generate(): PatientId {
        return new PatientId();
    }
}
