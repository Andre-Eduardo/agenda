import type {AllEntityProps, CreateEntity, EntityJson, EntityProps} from '../../@shared/entity';
import {InvalidInputException} from '../../@shared/exceptions';
import type {DefectId} from '../../defect/entities';
import {RoomStatus, RoomStatusId} from '../../room-status/entities';
import type {UserId} from '../../user/entities';
import {BlockadeChangedEvent, BlockadeFinishedEvent, BlockadeStartedEvent} from '../events';

export type BlockadeProps = EntityProps<Blockade>;
export type StartBlockade = Omit<CreateEntity<Blockade>, 'startedAt'>;
export type UpdateBlockade = Partial<BlockadeProps>;

export class Blockade extends RoomStatus {
    note: string;
    defects: DefectId[];

    constructor(props: AllEntityProps<Blockade>) {
        super(props);
        this.note = props.note;
        this.defects = props.defects;
        this.validate();
    }

    static start(props: StartBlockade): Blockade {
        const now = new Date();

        const blockade = new Blockade({
            ...props,
            id: RoomStatusId.generate(),
            companyId: props.companyId,
            note: props.note,
            defects: props.defects,
            roomId: props.roomId,
            finishedAt: null,
            finishedById: null,
            startedById: props.startedById,
            startedAt: now,
            createdAt: now,
            updatedAt: now,
        });

        blockade.addEvent(new BlockadeStartedEvent({companyId: props.companyId, blockade, timestamp: now}));

        return blockade;
    }

    change(props: UpdateBlockade): void {
        const oldBlockade = new Blockade(this);

        if (props.note !== undefined) {
            this.note = props.note;
            this.validate('note');
        }

        if (props.defects !== undefined) {
            this.defects = props.defects;
            this.validate('defects');
        }

        this.addEvent(
            new BlockadeChangedEvent({
                companyId: this.companyId,
                oldState: oldBlockade,
                newState: this,
            })
        );
    }

    finish(finishedById: UserId): void {
        const now = new Date();

        this.finishedById = finishedById;
        this.finishedAt = now;

        this.addEvent(
            new BlockadeFinishedEvent({
                companyId: this.companyId,
                blockadeId: this.id,
                finishedById,
                timestamp: now,
            })
        );
    }

    toJSON(): EntityJson<Blockade> {
        return {
            ...super.toJSON(),
            note: this.note,
            defects: this.defects.map((defectId) => defectId.toJSON()),
        };
    }

    private validate(...fields: Array<keyof BlockadeProps>): void {
        if (fields.length === 0 || fields.includes('note')) {
            if (this.note.length < 1) {
                throw new InvalidInputException('Blockade note must be at least 1 character long.');
            }
        }

        if (fields.length === 0 || fields.includes('defects')) {
            if (this.defects.length < 1) {
                throw new InvalidInputException('Blockade defects must be at least 1 defect.');
            }
        }
    }
}
