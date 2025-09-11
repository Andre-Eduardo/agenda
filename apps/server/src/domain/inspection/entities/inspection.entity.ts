import type {AllEntityProps, EntityJson} from '../../@shared/entity';
import {RoomStatus, RoomStatusId} from '../../room-status/entities';
import type {UserId} from '../../user/entities';
import {InspectionStartedEvent, InspectionFinishedEvent} from '../events';

export type CreateInspection = Pick<Inspection, 'startedById' | 'companyId' | 'roomId'>;
export type FinishInspection =
    | {
          finishedById: UserId;
          note: string | null | undefined;
          endReason: InspectionEndReasonType.APPROVED | InspectionEndReasonType.REJECTED;
      }
    | {
          endReason: InspectionEndReasonType.EXPIRED;
      };

export enum InspectionEndReasonType {
    APPROVED = 'APPROVED',
    REJECTED = 'REJECTED',
    EXPIRED = 'EXPIRED',
}

export class Inspection extends RoomStatus {
    note: string | null;
    endReason: InspectionEndReasonType | null;

    constructor(props: AllEntityProps<Inspection>) {
        super(props);
        this.note = props.note;
        this.endReason = props.endReason;
    }

    static start(props: CreateInspection): Inspection {
        const now = new Date();

        const inspection = new Inspection({
            ...props,
            note: null,
            id: RoomStatusId.generate(),
            finishedAt: null,
            endReason: null,
            finishedById: null,
            startedAt: now,
            createdAt: now,
            updatedAt: now,
        });

        inspection.addEvent(new InspectionStartedEvent({companyId: props.companyId, inspection, timestamp: now}));

        return inspection;
    }

    finish(payload: FinishInspection): void {
        const now = new Date();

        this.finishedById =
            payload.endReason === InspectionEndReasonType.EXPIRED ? this.startedById : payload.finishedById;
        this.note = payload.endReason === InspectionEndReasonType.EXPIRED ? null : (payload.note ?? null);
        this.endReason = payload.endReason;
        this.finishedAt = now;

        this.addEvent(
            new InspectionFinishedEvent({
                companyId: this.companyId,
                inspectionId: this.id,
                finishedById: this.finishedById,
                endReason: this.endReason,
                timestamp: now,
            })
        );
    }

    toJSON(): EntityJson<Inspection> {
        return {
            ...super.toJSON(),
            note: this.note,
            endReason: this.endReason,
        };
    }
}
