import {mock} from 'jest-mock-extended';
import type {Actor} from '../../../../domain/@shared/actor';
import {CompanyId} from '../../../../domain/company/entities';
import {fakeInspection} from '../../../../domain/inspection/entities/__tests__/fake-inspection';
import {UserId} from '../../../../domain/user/entities';
import type {PaginatedDto} from '../../../@shared/dto';
import {InspectionDto} from '../../dtos';
import type {
    ApproveInspectionService,
    GetInspectionService,
    GetInspectionByRoomService,
    ListInspectionService,
    RejectInspectionService,
} from '../../services';
import {InspectionController} from '../inspection.controller';

describe('A inspection controller', () => {
    const getInspectionServiceMock = mock<GetInspectionService>();
    const getInspectionByRoomServiceMock = mock<GetInspectionByRoomService>();
    const listInspectionServiceMock = mock<ListInspectionService>();
    const approveInspection = mock<ApproveInspectionService>();
    const rejectInspection = mock<RejectInspectionService>();
    const inspectionController = new InspectionController(
        getInspectionServiceMock,
        getInspectionByRoomServiceMock,
        listInspectionServiceMock,
        approveInspection,
        rejectInspection
    );

    const actor: Actor = {
        userId: UserId.generate(),
        ip: '127.0.0.1',
    };

    const companyId = CompanyId.generate();

    describe('when getting a inspection', () => {
        it('should repass the responsibility to the right service', async () => {
            const inspection = fakeInspection();
            const expectedInspection = new InspectionDto(inspection);

            jest.spyOn(getInspectionServiceMock, 'execute').mockResolvedValueOnce(expectedInspection);

            await expect(inspectionController.getInspection(actor, inspection.id)).resolves.toEqual(expectedInspection);

            expect(getInspectionServiceMock.execute).toHaveBeenCalledWith({
                actor,
                payload: {id: inspection.id},
            });
            expect(listInspectionServiceMock.execute).not.toHaveBeenCalled();
            expect(approveInspection.execute).not.toHaveBeenCalled();
            expect(rejectInspection.execute).not.toHaveBeenCalled();
        });
    });

    describe('when getting a inspection by room ID', () => {
        it('should repass the responsibility to the right service', async () => {
            const inspection = fakeInspection();
            const expectedInspection = new InspectionDto(inspection);

            jest.spyOn(getInspectionByRoomServiceMock, 'execute').mockResolvedValueOnce(expectedInspection);

            await expect(inspectionController.getInspectionByRoom(actor, inspection.roomId)).resolves.toEqual(
                expectedInspection
            );

            expect(getInspectionByRoomServiceMock.execute).toHaveBeenCalledWith({
                actor,
                payload: {id: inspection.roomId},
            });
            expect(listInspectionServiceMock.execute).not.toHaveBeenCalled();
            expect(approveInspection.execute).not.toHaveBeenCalled();
            expect(rejectInspection.execute).not.toHaveBeenCalled();
        });
    });

    describe('when listing inspections', () => {
        it('should repass the responsibility to the right service', async () => {
            const inspections = [fakeInspection(), fakeInspection()];

            const payload = {
                companyId,
                page: 1,
                pagination: {
                    limit: 10,
                },
            };

            const expectedInspections: PaginatedDto<InspectionDto> = {
                data: inspections.map((inspection) => new InspectionDto(inspection)),
                totalCount: 2,
                nextCursor: null,
            };

            jest.spyOn(listInspectionServiceMock, 'execute').mockResolvedValueOnce(expectedInspections);

            await expect(inspectionController.listInspection(actor, payload)).resolves.toEqual(expectedInspections);

            expect(getInspectionServiceMock.execute).not.toHaveBeenCalled();
            expect(listInspectionServiceMock.execute).toHaveBeenCalledWith({actor, payload});
            expect(approveInspection.execute).not.toHaveBeenCalled();
            expect(rejectInspection.execute).not.toHaveBeenCalled();
        });
    });

    describe('when approving an inspection', () => {
        it('should repass the responsibility to the right service', async () => {
            const inspection = fakeInspection();

            const payload = {
                note: 'note',
                finishedById: UserId.generate(),
            };

            const expectedInspection = new InspectionDto(inspection);

            jest.spyOn(approveInspection, 'execute').mockResolvedValueOnce(expectedInspection);

            await expect(inspectionController.approveInspection(actor, inspection.roomId, payload)).resolves.toEqual(
                expectedInspection
            );

            expect(getInspectionServiceMock.execute).not.toHaveBeenCalled();
            expect(listInspectionServiceMock.execute).not.toHaveBeenCalled();
            expect(approveInspection.execute).toHaveBeenCalledWith({
                actor,
                payload: {roomId: inspection.roomId, ...payload},
            });
            expect(rejectInspection.execute).not.toHaveBeenCalled();
        });
    });

    describe('when rejecting an inspection', () => {
        it('should repass the responsibility to the right service', async () => {
            const inspection = fakeInspection();

            const payload = {
                note: 'note',
                finishedById: UserId.generate(),
            };

            const expectedInspection = new InspectionDto(inspection);

            jest.spyOn(rejectInspection, 'execute').mockResolvedValueOnce(expectedInspection);

            await expect(inspectionController.rejectInspection(actor, inspection.roomId, payload)).resolves.toEqual(
                expectedInspection
            );

            expect(getInspectionServiceMock.execute).not.toHaveBeenCalled();
            expect(listInspectionServiceMock.execute).not.toHaveBeenCalled();
            expect(approveInspection.execute).not.toHaveBeenCalled();
            expect(rejectInspection.execute).toHaveBeenCalledWith({
                actor,
                payload: {roomId: inspection.roomId, ...payload},
            });
        });
    });
});
