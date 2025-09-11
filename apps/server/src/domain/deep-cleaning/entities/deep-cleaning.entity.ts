import type {AllEntityProps, CreateEntity, EntityJson} from '../../@shared/entity';
import {RoomStatus, RoomStatusId} from '../../room-status/entities';
import type {UserId} from '../../user/entities';
import {DeepCleaningStartedEvent, DeepCleaningFinishedEvent} from '../events';

export type StartDeepCleaning = Omit<CreateEntity<DeepCleaning>, 'startedAt'>;
export type FinishDeepCleaning =
    | {
          finishedById: UserId;
          endReason: DeepCleaningEndReasonType.FINISHED | DeepCleaningEndReasonType.CANCELED;
      }
    | {
          endReason: DeepCleaningEndReasonType.EXPIRED;
      };

export enum DeepCleaningEndReasonType {
    FINISHED = 'FINISHED',
    EXPIRED = 'EXPIRED',
    CANCELED = 'CANCELED',
}

export class DeepCleaning extends RoomStatus {
    endReason: DeepCleaningEndReasonType | null;

    constructor(props: AllEntityProps<DeepCleaning>) {
        super(props);
        this.endReason = props.endReason;
    }

    static start(props: StartDeepCleaning): DeepCleaning {
        const now = new Date();

        const deepCleaning = new DeepCleaning({
            ...props,
            id: RoomStatusId.generate(),
            companyId: props.companyId,
            roomId: props.roomId,
            finishedAt: null,
            endReason: null,
            startedById: props.startedById,
            finishedById: null,
            startedAt: now,
            createdAt: now,
            updatedAt: now,
        });

        deepCleaning.addEvent(new DeepCleaningStartedEvent({companyId: props.companyId, deepCleaning, timestamp: now}));

        return deepCleaning;
    }

    finish(payload: FinishDeepCleaning): void {
        const now = new Date();

        this.finishedById =
            payload.endReason === DeepCleaningEndReasonType.EXPIRED ? this.startedById : payload.finishedById;
        this.endReason = payload.endReason;
        this.finishedAt = now;

        this.addEvent(
            new DeepCleaningFinishedEvent({
                companyId: this.companyId,
                deepCleaningId: this.id,
                finishedById: this.finishedById,
                endReason: this.endReason,
                timestamp: now,
            })
        );
    }

    toJSON(): EntityJson<DeepCleaning> {
        return {
            ...super.toJSON(),
            endReason: this.endReason,
        };
    }
}
