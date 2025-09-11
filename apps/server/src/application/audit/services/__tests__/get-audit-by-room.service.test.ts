import {mock} from 'jest-mock-extended';
import type {Actor} from '../../../../domain/@shared/actor';
import {ResourceNotFoundException} from '../../../../domain/@shared/exceptions';
import type {AuditRepository} from '../../../../domain/audit/audit.repository';
import {fakeAudit} from '../../../../domain/audit/entities/__tests__/fake-audit';
import {RoomId} from '../../../../domain/room/entities';
import {UserId} from '../../../../domain/user/entities';
import type {GetAuditByRoomDto} from '../../dtos';
import {AuditDto} from '../../dtos';
import {GetAuditByRoomService} from '../get-audit-by-room.service';

describe('A get-audit-by-room service', () => {
    const auditRepository = mock<AuditRepository>();
    const getAuditByRoomService = new GetAuditByRoomService(auditRepository);

    const actor: Actor = {
        userId: UserId.generate(),
        ip: '127.0.0.1',
    };

    it('should get an audit', async () => {
        const existingAudit = fakeAudit();
        const payload: GetAuditByRoomDto = {
            roomId: existingAudit.roomId,
        };

        jest.spyOn(auditRepository, 'findByRoom').mockResolvedValueOnce(existingAudit);

        await expect(getAuditByRoomService.execute({actor, payload})).resolves.toEqual(new AuditDto(existingAudit));

        expect(existingAudit.events).toHaveLength(0);
        expect(auditRepository.findByRoom).toHaveBeenCalledWith(payload.roomId);
    });

    it('should throw an error when the audit does not exist', async () => {
        const payload: GetAuditByRoomDto = {
            roomId: RoomId.generate(),
        };

        jest.spyOn(auditRepository, 'findByRoom').mockResolvedValueOnce(null);

        await expect(getAuditByRoomService.execute({actor, payload})).rejects.toThrowWithMessage(
            ResourceNotFoundException,
            'Audit not found for the room'
        );
    });
});
