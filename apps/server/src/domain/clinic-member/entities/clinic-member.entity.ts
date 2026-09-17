import {
    AggregateRoot,
    type AllEntityProps,
    type CreateEntity,
    type EntityJson,
    type EntityProps,
} from '@domain/@shared/entity';
import {EntityId} from '@domain/@shared/entity/id';
import {InvalidInputException} from '@domain/@shared/exceptions';
import {ClinicMemberRole} from '@domain/clinic-member/entities/clinic-member-role';
import {
    ClinicMemberCreatedEvent,
    ClinicMemberChangedEvent,
    ClinicMemberDeletedEvent,
} from '@domain/clinic-member/events';
import type {ClinicId} from '@domain/clinic/entities';
import type {UserId} from '@domain/user/entities';

export type ClinicMemberProps = EntityProps<ClinicMember>;
export type CreateClinicMember = CreateEntity<ClinicMember>;
export type UpdateClinicMember = Partial<ClinicMemberProps>;

/**
 * Pivô central do sistema. Toda ação registra o ClinicMember responsável
 * via createdByMemberId para auditoria.
 *
 * Um membro pode acumular múltiplos papéis (ex: OWNER + PROFESSIONAL). Quando
 * tem o papel PROFESSIONAL, existe um Professional 1:1 com dados regulatórios
 * e agenda própria — os demais papéis (SECRETARY, ADMIN, VIEWER) concedem
 * apenas permissões de gestão, sem agenda própria.
 */
export class ClinicMember extends AggregateRoot<ClinicMemberId> {
    clinicId: ClinicId;
    userId: UserId;
    roles: ClinicMemberRole[];
    /** Como o membro aparece na UI da clínica (ex: "Dr. João Silva") */
    displayName: string | null;
    /** Cor na agenda (substitui ProfessionalConfig.color) */
    color: string | null;
    isActive: boolean;
    /** Auditoria de onboarding. Null para o OWNER inicial da clínica. */
    invitedByMemberId: ClinicMemberId | null;

    constructor(props: AllEntityProps<ClinicMember>) {
        super(props);
        this.clinicId = props.clinicId;
        this.userId = props.userId;
        this.roles = props.roles;
        this.displayName = props.displayName ?? null;
        this.color = props.color ?? null;
        this.isActive = props.isActive;
        this.invitedByMemberId = props.invitedByMemberId ?? null;
        this.validate();
    }

    static create(props: CreateClinicMember): ClinicMember {
        const now = new Date();

        const member = new ClinicMember({
            ...props,
            id: ClinicMemberId.generate(),
            clinicId: props.clinicId,
            userId: props.userId,
            roles: props.roles,
            displayName: props.displayName ?? null,
            color: props.color ?? null,
            isActive: props.isActive ?? true,
            invitedByMemberId: props.invitedByMemberId ?? null,
            createdAt: now,
            updatedAt: now,
            deletedAt: null,
        });

        member.addEvent(new ClinicMemberCreatedEvent({member, timestamp: now}));

        return member;
    }

    /** Só quem tem o papel PROFESSIONAL tem agenda própria. */
    hasRole(role: ClinicMemberRole): boolean {
        return this.roles.includes(role);
    }

    change(props: UpdateClinicMember): void {
        const oldState = new ClinicMember(this);

        if (props.roles !== undefined) {
            this.roles = props.roles;
        }

        if (props.displayName !== undefined) {
            this.displayName = props.displayName;
        }

        if (props.color !== undefined) {
            this.color = props.color;
        }

        if (props.isActive !== undefined) {
            this.isActive = props.isActive;
        }

        this.validate();
        this.addEvent(new ClinicMemberChangedEvent({oldState, newState: this}));
    }

    delete(): void {
        super.delete();
        this.addEvent(new ClinicMemberDeletedEvent({member: this}));
    }

    private validate(): void {
        if (this.displayName !== null && this.displayName.length === 0) {
            throw new InvalidInputException('Display name must be at least 1 character long when provided.');
        }

        if (this.roles.length === 0) {
            throw new InvalidInputException('A clinic member must have at least one role.');
        }
    }

    toJSON(): EntityJson<ClinicMember> {
        return {
            id: this.id.toJSON(),
            clinicId: this.clinicId.toJSON(),
            userId: this.userId.toJSON(),
            roles: this.roles,
            displayName: this.displayName,
            color: this.color,
            isActive: this.isActive,
            invitedByMemberId: this.invitedByMemberId?.toJSON() ?? null,
            createdAt: this.createdAt.toJSON(),
            updatedAt: this.updatedAt.toJSON(),
            deletedAt: this.deletedAt?.toJSON() ?? null,
        };
    }
}

export class ClinicMemberId extends EntityId<'ClinicMemberId'> {
    static from(value: string): ClinicMemberId {
        return new ClinicMemberId(value);
    }

    static generate(): ClinicMemberId {
        return new ClinicMemberId();
    }
}
