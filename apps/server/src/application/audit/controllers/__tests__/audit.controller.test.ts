import {mock} from 'jest-mock-extended';
import type {Actor} from '../../../../domain/@shared/actor';
import {Audit} from '../../../../domain/audit/entities';
import {fakeAudit} from '../../../../domain/audit/entities/__tests__/fake-audit';
import {CompanyId} from '../../../../domain/company/entities';
import {RoomId} from '../../../../domain/room/entities';
import {RoomState} from '../../../../domain/room/models/room-state';
import {UserId} from '../../../../domain/user/entities';
import type {PaginatedDto} from '../../../@shared/dto';
import {AuditDto} from '../../dtos';
import type {
    FinishAuditService,
    GetAuditByRoomService,
    GetAuditService,
    ListAuditService,
    StartAuditService,
} from '../../services';
import {AuditController} from '../audit.controller';

describe('An audit controller', () => {
    const startAuditServiceMock = mock<StartAuditService>();
    const finishAuditServiceMock = mock<FinishAuditService>();
    const getAuditServiceMock = mock<GetAuditService>();
    const getAuditByRoomServiceMock = mock<GetAuditByRoomService>();
    const listAuditServiceMock = mock<ListAuditService>();
    const auditController = new AuditController(
        startAuditServiceMock,
        finishAuditServiceMock,
        getAuditServiceMock,
        getAuditByRoomServiceMock,
        listAuditServiceMock
    );

    const actor: Actor = {
        userId: UserId.generate(),
        ip: '127.0.0.1',
    };

    const companyId = CompanyId.generate();

    describe('when starting an audit', () => {
        it('should repass the responsibility to the right service', async () => {
            const payload = {
                companyId: CompanyId.generate(),
                roomId: RoomId.generate(),
                startedById: UserId.generate(),
                reason: 'Air conditioning not working.',
            };

            const expectedAudit = new AuditDto(Audit.start(payload));

            jest.spyOn(startAuditServiceMock, 'execute').mockResolvedValueOnce(expectedAudit);

            await expect(auditController.startAudit(actor, payload)).resolves.toEqual(expectedAudit);

            expect(startAuditServiceMock.execute).toHaveBeenCalledWith({actor, payload});
            expect(finishAuditServiceMock.execute).not.toHaveBeenCalled();
            expect(getAuditServiceMock.execute).not.toHaveBeenCalled();
            expect(listAuditServiceMock.execute).not.toHaveBeenCalled();
        });
    });

    describe('when finishing an audit', () => {
        it('should repass the responsibility to the right service', async () => {
            const audit = fakeAudit();
            const expectedAudit = new AuditDto(audit);

            const {roomId} = audit;

            const payload = {
                nextRoomState: RoomState.VACANT as const,
                note: 'The air conditioning was fixed.',
            };

            jest.spyOn(finishAuditServiceMock, 'execute').mockResolvedValueOnce(expectedAudit);

            await expect(auditController.finishAudit(actor, roomId, payload)).resolves.toEqual(expectedAudit);

            expect(startAuditServiceMock.execute).not.toHaveBeenCalled();
            expect(finishAuditServiceMock.execute).toHaveBeenCalledWith({actor, payload: {roomId, ...payload}});
            expect(getAuditServiceMock.execute).not.toHaveBeenCalled();
            expect(listAuditServiceMock.execute).not.toHaveBeenCalled();
        });
    });

    describe('when getting an audit', () => {
        it('should repass the responsibility to the right service', async () => {
            const audit = fakeAudit();
            const expectedAudit = new AuditDto(audit);

            jest.spyOn(getAuditServiceMock, 'execute').mockResolvedValueOnce(expectedAudit);

            await expect(auditController.getAudit(actor, audit.id)).resolves.toEqual(expectedAudit);

            expect(startAuditServiceMock.execute).not.toHaveBeenCalled();
            expect(finishAuditServiceMock.execute).not.toHaveBeenCalled();
            expect(getAuditServiceMock.execute).toHaveBeenCalledWith({actor, payload: {id: audit.id}});
            expect(listAuditServiceMock.execute).not.toHaveBeenCalled();
        });
    });

    describe('when getting an audit by room ID', () => {
        it('should repass the responsibility to the right service', async () => {
            const audit = fakeAudit();
            const expectedAudit = new AuditDto(audit);

            jest.spyOn(getAuditByRoomServiceMock, 'execute').mockResolvedValueOnce(expectedAudit);

            await expect(auditController.getAuditByRoom(actor, audit.roomId)).resolves.toEqual(expectedAudit);

            expect(startAuditServiceMock.execute).not.toHaveBeenCalled();
            expect(finishAuditServiceMock.execute).not.toHaveBeenCalled();
            expect(getAuditServiceMock.execute).not.toHaveBeenCalled();
            expect(getAuditByRoomServiceMock.execute).toHaveBeenCalledWith({actor, payload: {roomId: audit.roomId}});
            expect(listAuditServiceMock.execute).not.toHaveBeenCalled();
        });
    });

    describe('when listing audits', () => {
        it('should repass the responsibility to the right service', async () => {
            const audits = [fakeAudit(), fakeAudit()];

            const payload = {
                companyId,
                page: 1,
                pagination: {
                    limit: 10,
                },
            };

            const expectedAudits: PaginatedDto<AuditDto> = {
                data: audits.map((audit) => new AuditDto(audit)),
                totalCount: 2,
                nextCursor: null,
            };

            jest.spyOn(listAuditServiceMock, 'execute').mockResolvedValueOnce(expectedAudits);

            await expect(auditController.listAudit(actor, payload)).resolves.toEqual(expectedAudits);

            expect(startAuditServiceMock.execute).not.toHaveBeenCalled();
            expect(finishAuditServiceMock.execute).not.toHaveBeenCalled();
            expect(getAuditServiceMock.execute).not.toHaveBeenCalled();
            expect(listAuditServiceMock.execute).toHaveBeenCalledWith({actor, payload});
        });
    });
});
