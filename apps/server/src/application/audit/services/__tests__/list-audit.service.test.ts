import {mock} from 'jest-mock-extended';
import type {Actor} from '../../../../domain/@shared/actor';
import type {PaginatedList} from '../../../../domain/@shared/repository';
import type {AuditRepository} from '../../../../domain/audit/audit.repository';
import type {Audit} from '../../../../domain/audit/entities';
import {fakeAudit} from '../../../../domain/audit/entities/__tests__/fake-audit';
import {CompanyId} from '../../../../domain/company/entities';
import {RoomId} from '../../../../domain/room/entities';
import {UserId} from '../../../../domain/user/entities';
import type {ListAuditDto} from '../../dtos';
import {AuditDto} from '../../dtos';
import {ListAuditService} from '../list-audit.service';

describe('A list-audit service', () => {
    const auditRepository = mock<AuditRepository>();
    const listAuditService = new ListAuditService(auditRepository);

    const companyId = CompanyId.generate();
    const roomId1 = RoomId.generate();
    const roomId2 = RoomId.generate();

    const actor: Actor = {
        userId: UserId.generate(),
        ip: '127.0.0.1',
    };

    const existingAudits = [
        fakeAudit({companyId, roomId: roomId1, startedById: UserId.generate(), reason: 'audit 1'}),
        fakeAudit({companyId, roomId: roomId2, startedById: UserId.generate(), reason: 'audit 2'}),
    ];

    it('should list audits', async () => {
        const paginatedAudits: PaginatedList<Audit> = {
            data: existingAudits,
            totalCount: existingAudits.length,
            nextCursor: null,
        };

        const payload: ListAuditDto = {
            companyId,
            pagination: {
                limit: 2,
                sort: {createdAt: 'asc'},
            },
            reason: 'audit',
        };

        jest.spyOn(auditRepository, 'search').mockResolvedValueOnce(paginatedAudits);

        await expect(listAuditService.execute({actor, payload})).resolves.toEqual({
            data: existingAudits.map((audit) => new AuditDto(audit)),
            totalCount: existingAudits.length,
            nextCursor: null,
        });
        expect(existingAudits.flatMap((audit) => audit.events)).toHaveLength(0);

        expect(auditRepository.search).toHaveBeenCalledWith(
            companyId,
            {
                limit: 2,
                sort: {createdAt: 'asc'},
            },
            {
                reason: 'audit',
            }
        );
    });

    it('should paginate audits', async () => {
        const paginatedAudits: PaginatedList<Audit> = {
            data: existingAudits,
            totalCount: existingAudits.length,
            nextCursor: null,
        };

        const payload: ListAuditDto = {
            companyId,
            pagination: {
                limit: 2,
                cursor: 'bf821fb9-adf9-4fa4-80da-a1fdeb707c80',
            },
            reason: 'audit',
        };

        jest.spyOn(auditRepository, 'search').mockResolvedValueOnce(paginatedAudits);

        await expect(listAuditService.execute({actor, payload})).resolves.toEqual({
            data: existingAudits.map((audit) => new AuditDto(audit)),
            totalCount: existingAudits.length,
            nextCursor: null,
        });

        expect(existingAudits.flatMap((audit) => audit.events)).toHaveLength(0);

        expect(auditRepository.search).toHaveBeenCalledWith(
            companyId,
            {
                limit: 2,
                cursor: 'bf821fb9-adf9-4fa4-80da-a1fdeb707c80',
                sort: {},
            },
            {
                reason: 'audit',
            }
        );
    });
});
