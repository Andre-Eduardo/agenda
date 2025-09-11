import type {AllEntityProps, CreateEntity, EntityJson, EntityProps} from '../../@shared/entity';
import {InvalidInputException} from '../../@shared/exceptions';
import {RoomStatus, RoomStatusId} from '../../room-status/entities';
import type {UserId} from '../../user/entities';
import {AuditFinishedEvent, AuditStartedEvent} from '../events';

export type StartAudit = Omit<CreateEntity<Audit>, 'startedAt'>;
export type AuditProps = EntityProps<Audit>;
export type FinishAudit =
    | {
          finishedById: UserId;
          note?: string | null;
          endReason: AuditEndReasonType.COMPLETED;
      }
    | {
          endReason: AuditEndReasonType.EXPIRED;
      };

export enum AuditEndReasonType {
    COMPLETED = 'COMPLETED',
    EXPIRED = 'EXPIRED',
}

export class Audit extends RoomStatus {
    reason: string;
    endReason: AuditEndReasonType | null;
    note: string | null;

    constructor(props: AllEntityProps<Audit>) {
        super(props);
        this.reason = props.reason;
        this.endReason = props.endReason;
        this.note = props.note;
        this.validate();
    }

    static start(props: StartAudit): Audit {
        const roomStatusId = RoomStatusId.generate();
        const now = new Date();

        const audit = new Audit({
            ...props,
            id: roomStatusId,
            endReason: null,
            note: null,
            startedAt: now,
            finishedAt: null,
            finishedById: null,
            createdAt: now,
            updatedAt: now,
        });

        audit.addEvent(
            new AuditStartedEvent({
                companyId: props.companyId,
                audit,
                timestamp: now,
            })
        );

        return audit;
    }

    finish(payload: FinishAudit): void {
        const now = new Date();

        this.finishedById = payload.endReason === AuditEndReasonType.EXPIRED ? this.startedById : payload.finishedById;
        this.endReason = payload.endReason;
        this.finishedAt = now;

        if (payload.endReason !== AuditEndReasonType.EXPIRED) {
            this.note = payload.note ?? null;
            this.validate('note');
        }

        this.addEvent(
            new AuditFinishedEvent({
                companyId: this.companyId,
                auditId: this.id,
                finishedById: this.finishedById,
                endReason: this.endReason,
                timestamp: now,
            })
        );
    }

    toJSON(): EntityJson<Audit> {
        return {
            ...super.toJSON(),
            reason: this.reason,
            endReason: this.endReason,
            note: this.note,
        };
    }

    private validate(...fields: Array<keyof AuditProps>): void {
        if (fields.length === 0 || fields.includes('reason')) {
            if (this.reason.length < 1) {
                throw new InvalidInputException('Audit reason must be at least 1 character long.');
            }
        }

        if (fields.length === 0 || fields.includes('note')) {
            if (this.note !== null && this.note.length < 1) {
                throw new InvalidInputException('Audit note must be at least 1 character long.');
            }
        }
    }
}
