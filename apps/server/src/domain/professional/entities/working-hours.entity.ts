import {type AllEntityProps, type EntityProps, type CreateEntity, Entity} from '../../@shared/entity';
import {EntityId} from '../../@shared/entity/id';
import type {ClinicId} from '../../clinic/entities';
import type {ClinicMemberId} from '../../clinic-member/entities';

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

    coversInterval(startAt: Date, endAt: Date): boolean {
        const start = toTimeString(startAt);
        const end = toTimeString(endAt);

        return start >= this.startTime && end <= this.endTime;
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

function toTimeString(date: Date): string {
    const h = date.getUTCHours().toString().padStart(2, '0');
    const m = date.getUTCMinutes().toString().padStart(2, '0');

    return `${h}:${m}`;
}
