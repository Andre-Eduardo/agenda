import {type AllEntityProps, type EntityProps, type CreateEntity, Entity} from '@domain/@shared/entity';
import {EntityId} from '@domain/@shared/entity/id';
import {DEFAULT_CLINIC_TIME_ZONE, toZonedParts} from '@domain/@shared/utils';
import type {ClinicMemberId} from '@domain/clinic-member/entities';
import type {ClinicId} from '@domain/clinic/entities';

export type WorkingHoursProps = EntityProps<WorkingHours>;
export type CreateWorkingHours = CreateEntity<WorkingHours>;

export class WorkingHours extends Entity<WorkingHoursId> {
    /** Desnormalizado para isolamento de tenant (Bloco 6). */
    clinicId: ClinicId;
    clinicMemberId: ClinicMemberId;
    dayOfWeek: number;
    startTime: string;
    endTime: string;
    slotDuration: number;
    active: boolean;

    constructor(props: AllEntityProps<WorkingHours>) {
        super(props);
        this.clinicId = props.clinicId;
        this.clinicMemberId = props.clinicMemberId;
        this.dayOfWeek = props.dayOfWeek;
        this.startTime = props.startTime;
        this.endTime = props.endTime;
        this.slotDuration = props.slotDuration;
        this.active = props.active ?? true;
    }

    static create(props: CreateWorkingHours): WorkingHours {
        const now = new Date();

        return new WorkingHours({
            ...props,
            id: WorkingHoursId.generate(),
            active: props.active ?? true,
            createdAt: now,
            updatedAt: now,
            deletedAt: null,
        });
    }

    softDelete(): void {
        this.deletedAt = new Date();
        this.updatedAt = new Date();
    }

    toJSON() {
        return {
            id: this.id.toJSON(),
            clinicId: this.clinicId.toJSON(),
            clinicMemberId: this.clinicMemberId.toJSON(),
            dayOfWeek: this.dayOfWeek,
            startTime: this.startTime,
            endTime: this.endTime,
            slotDuration: this.slotDuration,
            active: this.active,
            createdAt: this.createdAt.toJSON(),
            updatedAt: this.updatedAt.toJSON(),
            deletedAt: this.deletedAt?.toJSON() ?? null,
        };
    }

    containsTime(time: string): boolean {
        return time >= this.startTime && time <= this.endTime;
    }

    /**
     * Indica se o intervalo [startAt, endAt] cabe nesta janela de atendimento.
     *
     * `startTime`/`endTime` são hora de parede da clínica, então os instantes (UTC) são
     * convertidos para o fuso da clínica antes da comparação. Comparar em UTC fazia uma
     * consulta às 16h (19h UTC) cair "fora do horário" de uma janela 08:00–18:00.
     */
    coversInterval(startAt: Date, endAt: Date, timeZone: string = DEFAULT_CLINIC_TIME_ZONE): boolean {
        const start = toZonedParts(startAt, timeZone);
        const end = toZonedParts(endAt, timeZone);

        // A single day's working-hours window can never cover an interval that spans
        // into a different local calendar day — comparing HH:mm strings across midnight
        // would otherwise produce false positives (e.g. 23:00–00:00 "covered" by 08:00–09:00).
        if (start.date !== end.date) return false;

        return start.time >= this.startTime && end.time <= this.endTime;
    }
}

export class WorkingHoursId extends EntityId<'WorkingHoursId'> {
    static from(value: string): WorkingHoursId {
        return new WorkingHoursId(value);
    }

    static generate(): WorkingHoursId {
        return new WorkingHoursId();
    }
}
