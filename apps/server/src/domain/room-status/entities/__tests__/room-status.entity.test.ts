import {CompanyId} from '../../../company/entities';
import {RoomId} from '../../../room/entities';
import {UserId} from '../../../user/entities';
import {RoomStatus, RoomStatusId} from '../room-status.entity';
import {fakeRoomStatus} from './fake-room-status';

describe('A room status', () => {
    it.each([
        {
            finishedById: UserId.generate(),
            finishedAt: new Date(),
        },
        {
            finishedById: null,
            finishedAt: null,
        },
    ])('should be serializable', (values) => {
        const roomStatus = fakeRoomStatus({...values});

        expect(roomStatus).toBeInstanceOf(RoomStatus);

        expect(roomStatus.toJSON()).toEqual({
            id: roomStatus.id.toJSON(),
            companyId: roomStatus.companyId.toJSON(),
            roomId: roomStatus.roomId.toJSON(),
            startedById: roomStatus.startedById.toJSON(),
            startedAt: roomStatus.startedAt.toJSON(),
            finishedById: roomStatus.finishedById?.toJSON() ?? null,
            finishedAt: roomStatus.finishedAt?.toJSON() ?? null,
            createdAt: roomStatus.createdAt.toJSON(),
            updatedAt: roomStatus.updatedAt.toJSON(),
        });
    });

    it('should generate a room status with default values when no payload is provided', () => {
        const roomStatus = fakeRoomStatus();

        expect(roomStatus).toBeInstanceOf(RoomStatus);
        expect(roomStatus.id).toBeInstanceOf(RoomStatusId);
        expect(roomStatus.companyId).toBeInstanceOf(CompanyId);
        expect(roomStatus.roomId).toBeInstanceOf(RoomId);
        expect(roomStatus.startedById).toBeInstanceOf(UserId);
        expect(roomStatus.startedAt.getTime()).toBe(1000);
        expect(roomStatus.finishedById).toBeNull();
        expect(roomStatus.finishedAt).toBeNull();
        expect(roomStatus.createdAt.getTime()).toBe(1000);
        expect(roomStatus.updatedAt.getTime()).toBe(1000);
    });
});

describe('A room status ID', () => {
    it('can be created from a string', () => {
        const uuid = '6267dbfa-177a-4596-882e-99572932ffce';
        const id = RoomStatusId.from(uuid);

        expect(id.toString()).toBe(uuid);
    });

    it('can be generated', () => {
        expect(RoomStatusId.generate()).toBeInstanceOf(RoomStatusId);
    });
});
