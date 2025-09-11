import type {AllEntityProps, CreateEntity, EntityJson, EntityProps} from '../../@shared/entity';
import {AggregateRoot} from '../../@shared/entity';
import {EntityId} from '../../@shared/entity/id';
import {InvalidInputException} from '../../@shared/exceptions';
import type {CompanyId} from '../../company/entities';
import type {DefectTypeId} from '../../defect-type/entities';
import type {RoomId} from '../../room/entities';
import type {UserId} from '../../user/entities';
import {DefectChangedEvent, DefectCreatedEvent, DefectDeletedEvent, DefectFinishedEvent} from '../events';

export type DefectProps = EntityProps<Defect>;
export type CreateDefect = CreateEntity<Defect>;
export type UpdateDefect = Omit<Partial<DefectProps>, 'companyId'>;

export class Defect extends AggregateRoot<DefectId> {
    companyId: CompanyId;
    note: string | null;
    roomId: RoomId;
    defectTypeId: DefectTypeId;
    createdById: UserId;
    finishedById: UserId | null;
    finishedAt: Date | null;

    constructor(props: AllEntityProps<Defect>) {
        super(props);
        this.companyId = props.companyId;
        this.note = props.note;
        this.roomId = props.roomId;
        this.defectTypeId = props.defectTypeId;
        this.createdById = props.createdById;
        this.finishedById = props.finishedById;
        this.finishedAt = props.finishedAt;
        this.validate();
    }

    static create(props: CreateDefect): Defect {
        const defectId = DefectId.generate();
        const now = new Date();

        const defect = new Defect({
            ...props,
            id: defectId,
            note: props.note ?? null,
            finishedById: null,
            finishedAt: null,
            createdAt: now,
            updatedAt: now,
        });

        defect.addEvent(
            new DefectCreatedEvent({
                companyId: props.companyId,
                defect,
                timestamp: now,
            })
        );

        return defect;
    }

    change(props: UpdateDefect): void {
        const oldDefect = new Defect(this);

        if (props.note !== undefined) {
            this.note = props.note;
            this.validate('note');
        }

        if (props.roomId !== undefined) {
            this.roomId = props.roomId;
        }

        if (props.defectTypeId !== undefined) {
            this.defectTypeId = props.defectTypeId;
        }

        this.addEvent(
            new DefectChangedEvent({
                companyId: this.companyId,
                oldState: oldDefect,
                newState: this,
            })
        );
    }

    finish(finishedById: UserId): void {
        const now = new Date();

        this.finishedById = finishedById;
        this.finishedAt = now;

        this.addEvent(
            new DefectFinishedEvent({
                companyId: this.companyId,
                defectId: this.id,
                finishedById,
                timestamp: now,
            })
        );
    }

    delete(): void {
        this.addEvent(new DefectDeletedEvent({companyId: this.companyId, defect: this}));
    }

    toJSON(): EntityJson<Defect> {
        return {
            id: this.id.toString(),
            companyId: this.companyId.toJSON(),
            note: this.note,
            roomId: this.roomId.toJSON(),
            defectTypeId: this.defectTypeId.toJSON(),
            createdById: this.createdById.toJSON(),
            finishedById: this.finishedById?.toJSON() ?? null,
            finishedAt: this.finishedAt?.toJSON() ?? null,
            createdAt: this.createdAt.toJSON(),
            updatedAt: this.updatedAt.toJSON(),
        };
    }

    private validate(...fields: Array<keyof DefectProps>): void {
        if (fields.length === 0 || fields.includes('note')) {
            if (this.note !== null && this.note.length < 1) {
                throw new InvalidInputException('Defect note must be at least 1 character long.');
            }
        }
    }
}

export class DefectId extends EntityId<'DefectId'> {
    static from(value: string): DefectId {
        return new DefectId(value);
    }

    static generate(): DefectId {
        return new DefectId();
    }
}
