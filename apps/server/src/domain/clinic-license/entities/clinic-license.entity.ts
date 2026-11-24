import {AggregateRoot, type AllEntityProps, type CreateEntity, type EntityJson} from '@domain/@shared/entity';
import {EntityId} from '@domain/@shared/entity/id';
import {
    AccessDeniedException,
    AccessDeniedReason,
    InvalidInputException,
    PreconditionException,
} from '@domain/@shared/exceptions';
import {
    ClinicLicenseChangedEvent,
    ClinicModuleAssignedEvent,
    ClinicModuleUnassignedEvent,
    ProfessionalExtraSeatAddedEvent,
} from '@domain/clinic-license/events';
import type {ModuleType} from '@domain/clinic-license/models';
import type {ClinicMemberId} from '@domain/clinic-member/entities';
import type {ClinicId} from '@domain/clinic/entities';

export enum SeatDecision {
    /** Cabe no que já foi contratado. */
    INCLUDED = 'INCLUDED',
    /** Acima do contratado, mas o plano permite extra cobrado à parte. */
    EXTRA_CHARGE = 'EXTRA_CHARGE',
    /** Acima do máximo do plano: só com upgrade. */
    LIMIT_REACHED = 'LIMIT_REACHED',
}

export type ModuleSeats = {
    includedSeats: number;
    extraSeats: number;
    /** `null` = sem teto (extras ilimitados). */
    maxSeats: number | null;
};

export type ModuleAssignment = {
    moduleType: ModuleType;
    clinicMemberId: ClinicMemberId;
    assignedAt: Date;
};

export type ExtraChargeAcceptance = {
    acceptExtraCharge: boolean;
};

export type CreateClinicLicense = Pick<CreateEntity<ClinicLicense>, 'clinicId'> &
    Partial<
        Pick<
            AllEntityProps<ClinicLicense>,
            'includedProfessionals' | 'extraProfessionals' | 'maxProfessionals' | 'modules' | 'assignments'
        >
    >;

export type LicenseConfiguration = {
    includedProfessionals: number;
    maxProfessionals: number | null;
    /** Pacotes contratados. Os que ficarem de fora são desligados, com suas liberações. */
    modules: Map<ModuleType, {includedSeats: number; maxSeats: number | null}>;
};

/**
 * Licença da clínica: quantos profissionais o plano cobre, quais pacotes de IA foram
 * contratados (com vagas) e quais membros foram liberados em cada pacote.
 *
 * Profissionais e vagas acima do incluído só entram com aceite explícito da cobrança
 * extra; acima do máximo, só com upgrade. Remover um membro não reduz `extra*`: a
 * redução vale no ciclo seguinte e é feita pela cobrança.
 */
export class ClinicLicense extends AggregateRoot<ClinicLicenseId> {
    clinicId: ClinicId;
    includedProfessionals: number;
    extraProfessionals: number;
    /** `null` = sem teto (extras ilimitados). */
    maxProfessionals: number | null;
    modules: Map<ModuleType, ModuleSeats>;
    assignments: ModuleAssignment[];

    constructor(props: AllEntityProps<ClinicLicense>) {
        super(props);
        this.clinicId = props.clinicId;
        this.includedProfessionals = props.includedProfessionals;
        this.extraProfessionals = props.extraProfessionals;
        this.maxProfessionals = props.maxProfessionals;
        this.modules = new Map(props.modules);
        this.assignments = [...props.assignments];
        this.validate();
    }

    static create(props: CreateClinicLicense): ClinicLicense {
        const now = new Date();

        return new ClinicLicense({
            clinicId: props.clinicId,
            includedProfessionals: props.includedProfessionals ?? 1,
            extraProfessionals: props.extraProfessionals ?? 0,
            maxProfessionals: props.maxProfessionals === undefined ? 1 : props.maxProfessionals,
            modules: props.modules ?? new Map(),
            assignments: props.assignments ?? [],
            id: ClinicLicenseId.generate(),
            createdAt: now,
            updatedAt: now,
        });
    }

    /** Contratação: limites de profissionais e pacotes, numa única mudança auditada. */
    configure(configuration: LicenseConfiguration): void {
        const oldState = new ClinicLicense(this);

        this.includedProfessionals = configuration.includedProfessionals;
        this.maxProfessionals = configuration.maxProfessionals;

        for (const type of [...this.modules.keys()]) {
            if (!configuration.modules.has(type)) this.removeModule(type);
        }

        for (const [type, seats] of configuration.modules) {
            this.modules.set(type, {
                includedSeats: seats.includedSeats,
                extraSeats: this.modules.get(type)?.extraSeats ?? 0,
                maxSeats: seats.maxSeats,
            });
        }

        this.validate();
        this.update();
        this.addEvent(new ClinicLicenseChangedEvent({oldState, newState: this}));
    }

    setProfessionalLimits(limits: {includedProfessionals: number; maxProfessionals: number | null}): void {
        this.includedProfessionals = limits.includedProfessionals;
        this.maxProfessionals = limits.maxProfessionals;
        this.validate();
        this.update();
    }

    checkProfessionalSeat(activeProfessionals: number): SeatDecision {
        return decide(activeProfessionals, this.includedProfessionals + this.extraProfessionals, this.maxProfessionals);
    }

    /** Garante vaga para mais um profissional, registrando o extra quando necessário. */
    reserveProfessionalSeat(activeProfessionals: number, acceptance: ExtraChargeAcceptance): SeatDecision {
        const decision = this.checkProfessionalSeat(activeProfessionals);

        this.assertSeatAllowed(decision, acceptance);

        if (decision === SeatDecision.EXTRA_CHARGE) {
            this.extraProfessionals += 1;
            this.update();
            this.addEvent(new ProfessionalExtraSeatAddedEvent({license: this}));
        }

        return decision;
    }

    hasModule(type: ModuleType): boolean {
        return this.modules.has(type);
    }

    enableModule(type: ModuleType, seats: Omit<ModuleSeats, 'extraSeats'> & {extraSeats?: number}): void {
        this.modules.set(type, {
            includedSeats: seats.includedSeats,
            extraSeats: seats.extraSeats ?? this.modules.get(type)?.extraSeats ?? 0,
            maxSeats: seats.maxSeats,
        });
        this.validate();
        this.update();
    }

    disableModule(type: ModuleType): void {
        if (this.removeModule(type)) this.update();
    }

    /** Pacotes contratados pela clínica e liberados para o membro. */
    modulesOf(clinicMemberId: ClinicMemberId): Set<ModuleType> {
        return new Set(
            this.assignments
                .filter((assignment) => assignment.clinicMemberId.equals(clinicMemberId))
                .map((assignment) => assignment.moduleType)
                .filter((type) => this.hasModule(type))
        );
    }

    membersOf(type: ModuleType): ClinicMemberId[] {
        return this.assignments
            .filter((assignment) => assignment.moduleType === type)
            .map((assignment) => assignment.clinicMemberId);
    }

    checkModuleSeat(type: ModuleType): SeatDecision {
        const seats = this.requireModule(type);

        return decide(this.membersOf(type).length, seats.includedSeats + seats.extraSeats, seats.maxSeats);
    }

    assign(type: ModuleType, clinicMemberId: ClinicMemberId, acceptance: ExtraChargeAcceptance): SeatDecision {
        const seats = this.requireModule(type);

        if (this.isAssigned(type, clinicMemberId)) return SeatDecision.INCLUDED;

        const decision = this.checkModuleSeat(type);

        this.assertSeatAllowed(decision, acceptance);

        if (decision === SeatDecision.EXTRA_CHARGE) seats.extraSeats += 1;

        this.assignments.push({moduleType: type, clinicMemberId, assignedAt: new Date()});
        this.update();
        this.addEvent(
            new ClinicModuleAssignedEvent({
                license: this,
                moduleType: type,
                clinicMemberId,
                extraCharge: decision === SeatDecision.EXTRA_CHARGE,
            })
        );

        return decision;
    }

    unassign(type: ModuleType, clinicMemberId: ClinicMemberId): void {
        const before = this.assignments.length;

        this.assignments = this.assignments.filter(
            (assignment) => !(assignment.moduleType === type && assignment.clinicMemberId.equals(clinicMemberId))
        );

        if (this.assignments.length !== before) {
            this.update();
            this.addEvent(new ClinicModuleUnassignedEvent({license: this, moduleType: type, clinicMemberId}));
        }
    }

    /** Remove o membro de todos os pacotes (ex.: membro desativado). */
    unassignMember(clinicMemberId: ClinicMemberId): void {
        for (const type of this.modulesOf(clinicMemberId)) this.unassign(type, clinicMemberId);
    }

    isAssigned(type: ModuleType, clinicMemberId: ClinicMemberId): boolean {
        return this.assignments.some(
            (assignment) => assignment.moduleType === type && assignment.clinicMemberId.equals(clinicMemberId)
        );
    }

    private removeModule(type: ModuleType): boolean {
        if (!this.modules.delete(type)) return false;

        this.assignments = this.assignments.filter((assignment) => assignment.moduleType !== type);

        return true;
    }

    private requireModule(type: ModuleType): ModuleSeats {
        const seats = this.modules.get(type);

        if (seats === undefined) {
            throw new AccessDeniedException(
                `The clinic has not contracted the ${type} module.`,
                AccessDeniedReason.MODULE_NOT_ENABLED
            );
        }

        return seats;
    }

    private assertSeatAllowed(decision: SeatDecision, acceptance: ExtraChargeAcceptance): void {
        if (decision === SeatDecision.LIMIT_REACHED) {
            throw new PreconditionException('clinic_license.seat_limit_reached');
        }

        if (decision === SeatDecision.EXTRA_CHARGE && !acceptance.acceptExtraCharge) {
            throw new PreconditionException('clinic_license.extra_seat_confirmation_required');
        }
    }

    private validate(): void {
        assertSeatNumbers('professionals', this.includedProfessionals, this.extraProfessionals, this.maxProfessionals);

        for (const [type, seats] of this.modules) {
            assertSeatNumbers(`module ${type}`, seats.includedSeats, seats.extraSeats, seats.maxSeats);
        }
    }

    toJSON(): EntityJson<ClinicLicense> {
        return {
            id: this.id.toJSON(),
            clinicId: this.clinicId.toJSON(),
            includedProfessionals: this.includedProfessionals,
            extraProfessionals: this.extraProfessionals,
            maxProfessionals: this.maxProfessionals,
            modules: Object.fromEntries(this.modules),
            assignments: this.assignments.map((assignment) => ({
                moduleType: assignment.moduleType,
                clinicMemberId: assignment.clinicMemberId.toJSON(),
                assignedAt: assignment.assignedAt.toJSON(),
            })),
            createdAt: this.createdAt.toJSON(),
            updatedAt: this.updatedAt.toJSON(),
            deletedAt: this.deletedAt?.toJSON() ?? null,
        };
    }
}

function decide(used: number, paid: number, max: number | null): SeatDecision {
    if (used < paid) return SeatDecision.INCLUDED;

    if (max === null || used < max) return SeatDecision.EXTRA_CHARGE;

    return SeatDecision.LIMIT_REACHED;
}

function assertSeatNumbers(what: string, included: number, extra: number, max: number | null): void {
    const valid =
        Number.isInteger(included) &&
        Number.isInteger(extra) &&
        included >= 0 &&
        extra >= 0 &&
        (max === null || (Number.isInteger(max) && max >= included));

    if (!valid) {
        throw new InvalidInputException(`Invalid seat configuration for ${what}.`);
    }
}

export class ClinicLicenseId extends EntityId<'ClinicLicenseId'> {
    static from(value: string): ClinicLicenseId {
        return new ClinicLicenseId(value);
    }

    static generate(): ClinicLicenseId {
        return new ClinicLicenseId();
    }
}
