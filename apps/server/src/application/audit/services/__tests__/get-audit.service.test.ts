import {mock} from 'jest-mock-extended';
import type {Actor} from '../../../../domain/@shared/actor';
import {ResourceNotFoundException} from '../../../../domain/@shared/exceptions';
import type {AuditRepository} from '../../../../domain/audit/audit.repository';
import {fakeAudit} from '../../../../domain/audit/entities/__tests__/fake-audit';
import {RoomStatusId} from '../../../../domain/room-status/entities';
import {UserId} from '../../../../domain/user/entities';
import type {GetAuditDto} from '../../dtos';
import {AuditDto} from '../../dtos';
import {GetAuditService} from '../get-audit.service';

describe('A get-audit service', () => {
    const auditRepository = mock<AuditRepository>();
    const getAuditService = new GetAuditService(auditRepository);

    const actor: Actor = {
        userId: UserId.generate(),
        ip: '127.0.0.1',
    };

    it('should get an audit', async () => {
        const existingAudit = fakeAudit();
        const payload: GetAuditDto = {
            id: existingAudit.id,
        };

        jest.spyOn(auditRepository, 'findById').mockResolvedValueOnce(existingAudit);

        await expect(getAuditService.execute({actor, payload})).resolves.toEqual(new AuditDto(existingAudit));

        expect(existingAudit.events).toHaveLength(0);
        expect(auditRepository.findById).toHaveBeenCalledWith(payload.id);
    });

    it('should throw an error when the audit does not exist', async () => {
        const payload: GetAuditDto = {
            id: RoomStatusId.generate(),
        };

        jest.spyOn(auditRepository, 'findById').mockResolvedValueOnce(null);

        await expect(getAuditService.execute({actor, payload})).rejects.toThrowWithMessage(
            ResourceNotFoundException,
            'Audit not found'
        );
    });
});
