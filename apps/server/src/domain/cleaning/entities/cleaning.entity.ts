import type {AllEntityProps, CreateEntity, EntityJson} from '../../@shared/entity';
import {RoomStatus, RoomStatusId} from '../../room-status/entities';
import type {UserId} from '../../user/entities';
import {CleaningStartedEvent, CleaningFinishedEvent} from '../events';

export type StartCleaning = Omit<CreateEntity<Cleaning>, 'startedAt'>;
export type FinishCleaning =
    | {
          finishedById: UserId;
          endReason: CleaningEndReasonType.FINISHED | CleaningEndReasonType.CANCELED;
      }
    | {
          endReason: CleaningEndReasonType.EXPIRED;
      };

export enum CleaningEndReasonType {
    FINISHED = 'FINISHED',
    EXPIRED = 'EXPIRED',
    CANCELED = 'CANCELED',
}

export class Cleaning extends RoomStatus {
    endReason: CleaningEndReasonType | null;

    constructor(props: AllEntityProps<Cleaning>) {
        super(props);
        this.endReason = props.endReason;
    }

    static start(props: StartCleaning): Cleaning {
        const now = new Date();

        const cleaning = new Cleaning({
            ...props,
            id: RoomStatusId.generate(),
            finishedAt: null,
            endReason: null,
            finishedById: null,
            startedAt: now,
            createdAt: now,
            updatedAt: now,
        });

        cleaning.addEvent(new CleaningStartedEvent({companyId: props.companyId, cleaning, timestamp: now}));

        return cleaning;
    }

    finish(payload: FinishCleaning): void {
        const now = new Date();

        this.finishedById =
            payload.endReason === CleaningEndReasonType.EXPIRED ? this.startedById : payload.finishedById;
        this.endReason = payload.endReason;
        this.finishedAt = now;

        this.addEvent(
            new CleaningFinishedEvent({
                companyId: this.companyId,
                cleaningId: this.id,
                finishedById: this.finishedById,
                endReason: this.endReason,
                timestamp: now,
            })
        );
    }

    toJSON(): EntityJson<Cleaning> {
        return {
            ...super.toJSON(),
            endReason: this.endReason,
        };
    }
}
