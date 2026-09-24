import {mock} from 'jest-mock-extended';
import {SearchAuditLogsService} from '@application/audit/services/search-audit-logs.service';
import {Actor} from '@domain/@shared/actor';
import {AuditLogRepository} from '@domain/audit/audit-log.repository';
import {ClinicMemberId} from '@domain/clinic-member/entities';
import {ClinicId} from '@domain/clinic/entities';
import {UserId} from '@domain/user/entities';

describe('searching audit history', () => {
    it('scopes the query to the authenticated clinic and returns a stable DTO', async () => {
        const actor: Actor = {
            userId: UserId.generate(),
            clinicId: ClinicId.generate(),
            clinicMemberId: ClinicMemberId.generate(),
            ip: '127.0.0.1',
        };
        const repository = mock<AuditLogRepository>();

        repository.search.mockResolvedValue({
            data: [
                {
                    id: 'entry-1',
                    clinicId: actor.clinicId.toString(),
                    actorUserId: actor.userId.toString(),
                    actorMemberId: actor.clinicMemberId.toString(),
                    resource: 'PatientController',
                    resourceId: 'patient-1',
                    action: 'GET:getPatient',
                    result: 'SUCCESS',
                    statusCode: 200,
                    ip: actor.ip,
                    occurredAt: new Date('2026-09-24T12:00:00.000Z'),
                },
            ],
            totalCount: 1,
        });

        const result = await new SearchAuditLogsService(repository).execute({actor, payload: {page: 2, pageSize: 10}});

        expect(repository.search).toHaveBeenCalledWith(actor.clinicId.toString(), 2, 10);
        expect(result).toMatchObject({
            totalCount: 1,
            data: [{id: 'entry-1', occurredAt: '2026-09-24T12:00:00.000Z'}],
        });
    });
});
