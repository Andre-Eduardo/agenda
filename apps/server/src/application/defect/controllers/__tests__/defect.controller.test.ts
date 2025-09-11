import {mock} from 'jest-mock-extended';
import type {Actor} from '../../../../domain/@shared/actor';
import {CompanyId} from '../../../../domain/company/entities';
import {Defect, DefectId} from '../../../../domain/defect/entities';
import {DefectTypeId} from '../../../../domain/defect-type/entities';
import {RoomId} from '../../../../domain/room/entities';
import {UserId} from '../../../../domain/user/entities';
import type {PaginatedDto} from '../../../@shared/dto';
import type {CreateDefectDto, ListDefectDto, UpdateDefectInputDto} from '../../dtos';
import {DefectDto} from '../../dtos';
import type {
    CreateDefectService,
    DeleteDefectService,
    FinishDefectService,
    GetDefectService,
    ListDefectService,
    UpdateDefectService,
} from '../../services';
import {DefectController} from '../defect.controller';

describe('A defect controller', () => {
    const createDefectServiceMock = mock<CreateDefectService>();
    const listDefectServiceMock = mock<ListDefectService>();
    const getDefectServiceMock = mock<GetDefectService>();
    const updateDefectServiceMock = mock<UpdateDefectService>();
    const deleteDefectServiceMock = mock<DeleteDefectService>();
    const finishDefectServiceMock = mock<FinishDefectService>();
    const defectController = new DefectController(
        createDefectServiceMock,
        listDefectServiceMock,
        getDefectServiceMock,
        updateDefectServiceMock,
        deleteDefectServiceMock,
        finishDefectServiceMock
    );

    const companyId = CompanyId.generate();

    const actor: Actor = {
        userId: UserId.generate(),
        ip: '127.0.0.1',
    };

    describe('when creating a defect', () => {
        it('should repass the responsibility to the right service', async () => {
            const payload: CreateDefectDto = {
                companyId,
                roomId: RoomId.generate(),
                defectTypeId: DefectTypeId.generate(),
                note: 'Defect 1',
            };

            const expectedDefect = new DefectDto(Defect.create({...payload, createdById: actor.userId}));

            jest.spyOn(createDefectServiceMock, 'execute').mockResolvedValueOnce(expectedDefect);

            await expect(defectController.createDefect(actor, payload)).resolves.toEqual(expectedDefect);

            expect(createDefectServiceMock.execute).toHaveBeenCalledWith({actor, payload});
            expect(listDefectServiceMock.execute).not.toHaveBeenCalled();
            expect(getDefectServiceMock.execute).not.toHaveBeenCalled();
            expect(updateDefectServiceMock.execute).not.toHaveBeenCalled();
            expect(deleteDefectServiceMock.execute).not.toHaveBeenCalled();
        });
    });

    describe('when listing defects', () => {
        it('should repass the responsibility to the right service', async () => {
            const payload: ListDefectDto = {
                companyId,
                pagination: {
                    limit: 2,
                },
            };

            const defects = [
                Defect.create({
                    companyId,
                    roomId: RoomId.generate(),
                    defectTypeId: DefectTypeId.generate(),
                    note: 'Defect 1',
                    createdById: actor.userId,
                }),
                Defect.create({
                    companyId,
                    roomId: RoomId.generate(),
                    defectTypeId: DefectTypeId.generate(),
                    note: 'Defect 2',
                    createdById: actor.userId,
                }),
            ];

            const expectedDefect: PaginatedDto<DefectDto> = {
                data: defects.map((defect) => new DefectDto(defect)),
                totalCount: 2,
                nextCursor: 'nextCursor',
            };

            jest.spyOn(listDefectServiceMock, 'execute').mockResolvedValue(expectedDefect);

            await expect(defectController.listDefect(actor, payload)).resolves.toEqual(expectedDefect);

            expect(listDefectServiceMock.execute).toHaveBeenCalledWith({actor, payload});
        });
    });

    describe('when getting a defect', () => {
        it('should repass the responsibility to the right service', async () => {
            const defect = Defect.create({
                companyId,
                roomId: RoomId.generate(),
                defectTypeId: DefectTypeId.generate(),
                note: 'Defect 1',
                createdById: actor.userId,
            });

            const expectedRoom = new DefectDto(defect);

            jest.spyOn(getDefectServiceMock, 'execute').mockResolvedValue(expectedRoom);

            await expect(defectController.getDefect(actor, defect.id)).resolves.toEqual(expectedRoom);

            expect(getDefectServiceMock.execute).toHaveBeenCalledWith({actor, payload: {id: defect.id}});
        });
    });

    describe('when updating a defect', () => {
        it('should repass the responsibility to the right service', async () => {
            const defect = Defect.create({
                companyId,
                roomId: RoomId.generate(),
                defectTypeId: DefectTypeId.generate(),
                note: 'Defect 1',
                createdById: actor.userId,
            });

            const payload: UpdateDefectInputDto = {
                note: 'Defect 1',
            };

            const existingDefect = new DefectDto(defect);

            jest.spyOn(updateDefectServiceMock, 'execute').mockResolvedValueOnce(existingDefect);

            await expect(defectController.updateDefect(actor, defect.id, payload)).resolves.toEqual(existingDefect);

            expect(updateDefectServiceMock.execute).toHaveBeenCalledWith({
                actor,
                payload: {id: defect.id, ...payload},
            });
        });
    });

    describe('when deleting a defect', () => {
        it('should repass the responsibility to the right service', async () => {
            const id = DefectId.generate();

            await defectController.deleteDefect(actor, id);

            expect(deleteDefectServiceMock.execute).toHaveBeenCalledWith({actor, payload: {id}});
        });
    });

    describe('when finish a defect', () => {
        it('should repass the responsibility to the right service', async () => {
            const id = DefectId.generate();

            await defectController.finishDefect(actor, id);

            expect(finishDefectServiceMock.execute).toHaveBeenCalledWith({actor, payload: {id}});
        });
    });
});
