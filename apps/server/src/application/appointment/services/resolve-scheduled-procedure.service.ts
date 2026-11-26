import {Inject, Injectable} from '@nestjs/common';
import type {Actor} from '@domain/@shared/actor';
import {
    AccessDeniedException,
    AccessDeniedReason,
    InvalidInputException,
    ResourceNotFoundException,
} from '@domain/@shared/exceptions';
import {ProcedurePermission} from '@domain/auth';
import {Authorizer} from '@domain/auth/authorizer';
import type {ProcedureId, ProcedureOverrides, ScheduledProcedure} from '@domain/procedure/procedure.entity';
import {ProcedureRepository} from '@domain/procedure/procedure.repository';

type ScheduleInput = {
    startAt: Date;
    endAt?: Date;
    procedureId?: ProcedureId;
    procedureOverrides?: ProcedureOverrides;
};

type ExistingSchedule = {
    startAt: Date;
    endAt: Date;
    procedure: ScheduledProcedure | null;
};

@Injectable()
export class ResolveScheduledProcedureService {
    constructor(
        @Inject(ProcedureRepository) private readonly procedures: ProcedureRepository,
        private readonly authorizer: Authorizer
    ) {}

    async resolve(
        actor: Actor,
        input: ScheduleInput,
        current?: ExistingSchedule
    ): Promise<{endAt: Date; procedure: ScheduledProcedure | null}> {
        const {startAt, procedureId, procedureOverrides} = input;
        let procedure = current?.procedure ?? null;
        let durationMs = current === undefined ? 0 : current.endAt.getTime() - current.startAt.getTime();

        if (procedureId !== undefined && procedureId.toString() !== procedure?.id) {
            const entry = await this.procedures.findActive(actor.clinicId, procedureId);

            if (entry === null) {
                throw new ResourceNotFoundException('procedure.not_found', procedureId.toString());
            }

            const {name, color, priceInCents, modality} = entry;

            procedure = {id: entry.id.toString(), name, color, priceInCents, modality};
            durationMs = entry.durationMinutes * 60_000;
        }

        if (procedure === null) {
            if (procedureOverrides !== undefined) {
                throw new InvalidInputException('procedure.required');
            }

            const endAt = input.endAt ?? current?.endAt;

            if (endAt === undefined) {
                throw new InvalidInputException('appointment.end_required');
            }

            return {endAt, procedure};
        }

        const endAt = input.endAt ?? new Date(startAt.getTime() + durationMs);
        const scheduledDurationMs = endAt.getTime() - startAt.getTime();
        const overrides = {...procedure, ...procedureOverrides};
        const hasOverride =
            scheduledDurationMs !== durationMs ||
            overrides.color !== procedure.color ||
            overrides.priceInCents !== procedure.priceInCents ||
            overrides.modality !== procedure.modality;

        if (hasOverride) {
            const allowed = await this.authorizer.validate(
                actor.clinicMemberId,
                actor.userId,
                ProcedurePermission.OVERRIDE
            );

            if (!allowed) {
                throw new AccessDeniedException(
                    'procedure.override_denied',
                    AccessDeniedReason.INSUFFICIENT_PERMISSIONS
                );
            }

            const durationMinutes = scheduledDurationMs / 60_000;

            if (!Number.isInteger(durationMinutes) || durationMinutes < 1 || durationMinutes > 720) {
                throw new InvalidInputException('procedure.invalid_duration');
            }
        }

        return {endAt, procedure: overrides};
    }
}
