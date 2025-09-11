import type {AllEntityProps, EntityJson} from '../../@shared/entity';
import {AggregateRoot} from '../../@shared/entity';
import {EntityId} from '../../@shared/entity/id';
import type {CompanyId} from '../../company/entities';
import type {RoomId} from '../../room/entities';
import type {UserId} from '../../user/entities';

export class RoomStatus extends AggregateRoot<RoomStatusId> {
    companyId: CompanyId;
    roomId: RoomId;
    startedById: UserId;
    startedAt: Date;
    finishedById: UserId | null;
    finishedAt: Date | null;

    constructor(props: AllEntityProps<RoomStatus>) {
        super(props);
        this.companyId = props.companyId;
        this.roomId = props.roomId;
        this.startedById = props.startedById;
        this.startedAt = props.startedAt;
        this.finishedById = props.finishedById;
        this.finishedAt = props.finishedAt;
    }

    toJSON(): EntityJson<RoomStatus> {
        return {
            id: this.id.toJSON(),
            companyId: this.companyId.toJSON(),
            roomId: this.roomId.toJSON(),
            startedById: this.startedById.toJSON(),
            startedAt: this.startedAt.toJSON(),
            finishedById: this.finishedById?.toJSON() ?? null,
            finishedAt: this.finishedAt?.toJSON() ?? null,
            createdAt: this.createdAt.toJSON(),
            updatedAt: this.updatedAt.toJSON(),
        };
    }
}

export class RoomStatusId extends EntityId<'RoomStatusId'> {
    static from(value: string): RoomStatusId {
        return new RoomStatusId(value);
    }

    static generate(): RoomStatusId {
        return new RoomStatusId();
    }
}
