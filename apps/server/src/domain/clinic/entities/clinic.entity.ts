import {
    AggregateRoot,
    type AllEntityProps,
    type CreateEntity,
    type EntityJson,
    type EntityProps,
} from '@domain/@shared/entity';
import {EntityId} from '@domain/@shared/entity/id';
import {InvalidInputException, PreconditionException} from '@domain/@shared/exceptions';
import type {DocumentId, Email, Phone} from '@domain/@shared/value-objects';
import {
    ClinicAccountTypeChangedEvent,
    ClinicChangedEvent,
    ClinicCreatedEvent,
    ClinicDeletedEvent,
} from '@domain/clinic/events';
import type {AiSpecialtyGroup} from '@domain/form-template/entities';
import type {UserId} from '@domain/user/entities';

/** SOLO = profissional autônomo (conta de uma pessoa); CLINIC = clínica com equipe. */
export enum ClinicAccountType {
    SOLO = 'SOLO',
    CLINIC = 'CLINIC',
}

export const SOLO_ACCOUNT_REQUIRES_SINGLE_MEMBER =
    'A solo account has a single member. Deactivate the other members before switching back to solo.';

export type ClinicProps = EntityProps<Clinic>;
export type CreateClinic = CreateEntity<Clinic>;
export type UpdateClinic = Partial<ClinicProps>;

export class Clinic extends AggregateRoot<ClinicId> {
    name: string;
    createdByUserId: UserId | null;
    documentId: DocumentId | null;
    phone: Phone | null;
    email: Email | null;
    /** Decide quais módulos de clínica existem: SOLO não tem equipe. */
    accountType: ClinicAccountType;
    /** Recepção e painel de chamada. Ligado em CLINIC; opcional no SOLO. */
    receptionEnabled: boolean;
    /** Aceite dos termos de uso no cadastro self-service (LGPD). */
    termsAcceptedAt: Date | null;
    termsVersion: string | null;
    street: string | null;
    number: string | null;
    complement: string | null;
    neighborhood: string | null;
    city: string | null;
    state: string | null;
    zipCode: string | null;
    country: string | null;
    logoUrl: string | null;
    clinicSpecialties: AiSpecialtyGroup[];
    /** Ativa o conceito de salas físicas e a checagem de conflito de sala no agendamento. */
    roomManagementEnabled: boolean;
    /** Quando ligado, o paciente só pode ser chamado depois de liberado na triagem. */
    triageRequired: boolean;

    constructor(props: AllEntityProps<Clinic>) {
        super(props);
        this.name = props.name;
        this.createdByUserId = props.createdByUserId ?? null;
        this.documentId = props.documentId ?? null;
        this.phone = props.phone ?? null;
        this.email = props.email ?? null;
        this.accountType = props.accountType;
        this.receptionEnabled = props.receptionEnabled;
        this.termsAcceptedAt = props.termsAcceptedAt ?? null;
        this.termsVersion = props.termsVersion ?? null;
        this.street = props.street ?? null;
        this.number = props.number ?? null;
        this.complement = props.complement ?? null;
        this.neighborhood = props.neighborhood ?? null;
        this.city = props.city ?? null;
        this.state = props.state ?? null;
        this.zipCode = props.zipCode ?? null;
        this.country = props.country ?? null;
        this.logoUrl = props.logoUrl ?? null;
        this.clinicSpecialties = props.clinicSpecialties ?? [];
        this.roomManagementEnabled = props.roomManagementEnabled ?? false;
        this.triageRequired = props.triageRequired ?? false;
        this.validate();
    }

    static create(props: CreateClinic): Clinic {
        const now = new Date();
        const accountType = props.accountType ?? ClinicAccountType.CLINIC;

        const clinic = new Clinic({
            ...props,
            id: ClinicId.generate(),
            name: props.name,
            createdByUserId: props.createdByUserId ?? null,
            documentId: props.documentId ?? null,
            phone: props.phone ?? null,
            email: props.email ?? null,
            accountType,
            receptionEnabled: props.receptionEnabled ?? accountType === ClinicAccountType.CLINIC,
            termsAcceptedAt: props.termsAcceptedAt ?? null,
            termsVersion: props.termsVersion ?? null,
            street: props.street ?? null,
            number: props.number ?? null,
            complement: props.complement ?? null,
            neighborhood: props.neighborhood ?? null,
            city: props.city ?? null,
            state: props.state ?? null,
            zipCode: props.zipCode ?? null,
            country: props.country ?? null,
            logoUrl: props.logoUrl ?? null,
            clinicSpecialties: props.clinicSpecialties ?? [],
            roomManagementEnabled: props.roomManagementEnabled ?? false,
            triageRequired: props.triageRequired ?? false,
            createdAt: now,
            updatedAt: now,
            deletedAt: null,
        });

        clinic.addEvent(new ClinicCreatedEvent({clinic, timestamp: now}));

        return clinic;
    }

    change(props: UpdateClinic): void {
        const oldState = new Clinic(this);

        if (props.name !== undefined) this.name = props.name;

        if (props.documentId !== undefined) this.documentId = props.documentId;

        if (props.phone !== undefined) this.phone = props.phone;

        if (props.email !== undefined) this.email = props.email;

        if (props.street !== undefined) this.street = props.street;

        if (props.number !== undefined) this.number = props.number;

        if (props.complement !== undefined) this.complement = props.complement;

        if (props.neighborhood !== undefined) this.neighborhood = props.neighborhood;

        if (props.city !== undefined) this.city = props.city;

        if (props.state !== undefined) this.state = props.state;

        if (props.zipCode !== undefined) this.zipCode = props.zipCode;

        if (props.country !== undefined) this.country = props.country;

        if (props.logoUrl !== undefined) this.logoUrl = props.logoUrl;

        if (props.clinicSpecialties !== undefined) this.clinicSpecialties = props.clinicSpecialties;

        if (props.roomManagementEnabled !== undefined) this.roomManagementEnabled = props.roomManagementEnabled;

        if (props.receptionEnabled !== undefined) this.receptionEnabled = props.receptionEnabled;

        if (props.triageRequired !== undefined) this.triageRequired = props.triageRequired;

        this.validate();
        this.addEvent(new ClinicChangedEvent({oldState, newState: this}));
    }

    /**
     * Passa a conta de autônomo para clínica (abre a equipe e liga a recepção) ou de volta
     * para autônomo, o que só vale com um único membro de verdade (vínculos de suporte não contam).
     */
    changeAccountType(accountType: ClinicAccountType, activeMembers: number): void {
        if (accountType === this.accountType) return;

        if (accountType === ClinicAccountType.SOLO && activeMembers > 1) {
            throw new PreconditionException(SOLO_ACCOUNT_REQUIRES_SINGLE_MEMBER);
        }

        const from = this.accountType;

        this.accountType = accountType;

        if (accountType === ClinicAccountType.CLINIC) this.receptionEnabled = true;

        this.update();
        this.addEvent(new ClinicAccountTypeChangedEvent({clinic: this, from, to: accountType}));
    }

    isSolo(): boolean {
        return this.accountType === ClinicAccountType.SOLO;
    }

    delete(): void {
        super.delete();
        this.addEvent(new ClinicDeletedEvent({clinic: this}));
    }

    private validate(): void {
        if (this.name.length === 0) {
            throw new InvalidInputException('Clinic name must be at least 1 character long.');
        }
    }

    toJSON(): EntityJson<Clinic> {
        return {
            id: this.id.toJSON(),
            name: this.name,
            createdByUserId: this.createdByUserId?.toJSON() ?? null,
            documentId: this.documentId?.toJSON() ?? null,
            phone: this.phone?.toJSON() ?? null,
            email: this.email?.toJSON() ?? null,
            accountType: this.accountType,
            receptionEnabled: this.receptionEnabled,
            termsAcceptedAt: this.termsAcceptedAt?.toJSON() ?? null,
            termsVersion: this.termsVersion,
            street: this.street,
            number: this.number,
            complement: this.complement,
            neighborhood: this.neighborhood,
            city: this.city,
            state: this.state,
            zipCode: this.zipCode,
            country: this.country,
            logoUrl: this.logoUrl,
            clinicSpecialties: this.clinicSpecialties,
            roomManagementEnabled: this.roomManagementEnabled,
            triageRequired: this.triageRequired,
            createdAt: this.createdAt.toJSON(),
            updatedAt: this.updatedAt.toJSON(),
            deletedAt: this.deletedAt?.toJSON() ?? null,
        };
    }
}

export class ClinicId extends EntityId<'ClinicId'> {
    static from(value: string): ClinicId {
        return new ClinicId(value);
    }

    static generate(): ClinicId {
        return new ClinicId();
    }
}
