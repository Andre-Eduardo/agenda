import {mock} from 'jest-mock-extended';
import type {Actor} from '../../../../domain/@shared/actor';
import {CompanyId} from '../../../../domain/company/entities';
import {DefectType, DefectTypeId} from '../../../../domain/defect-type/entities';
import {UserId} from '../../../../domain/user/entities';
import type {PaginatedDto} from '../../../@shared/dto';
import type {UpdateDefectTypeInputDto} from '../../dtos';
import {DefectTypeDto} from '../../dtos';
import type {
    CreateDefectTypeService,
    DeleteDefectTypeService,
    GetDefectTypeService,
    ListDefectTypeService,
    UpdateDefectTypeService,
} from '../../services';
import {DefectTypeController} from '../defect-type.controller';

describe('A defect type controller', () => {
    const createDefectTypeService = mock<CreateDefectTypeService>();
    const listDefectTypeServiceMock = mock<ListDefectTypeService>();
    const getDefectTypeServiceMock = mock<GetDefectTypeService>();
    const updateDefectTypeServiceMock = mock<UpdateDefectTypeService>();
    const deleteDefectTypeServiceMock = mock<DeleteDefectTypeService>();
    const defectTypeController = new DefectTypeController(
        createDefectTypeService,
        listDefectTypeServiceMock,
        getDefectTypeServiceMock,
        updateDefectTypeServiceMock,
        deleteDefectTypeServiceMock
    );

    const companyId = CompanyId.generate();

    const actor: Actor = {
        userId: UserId.generate(),
        ip: '127.0.0.1',
    };

    describe('when creating a defect type', () => {
        it('should repass the responsibility to the right service', async () => {
            const payload = {
                companyId,
                name: 'defect type',
            };

            const expectedDefectType = new DefectTypeDto(DefectType.create(payload));

            jest.spyOn(createDefectTypeService, 'execute').mockResolvedValueOnce(expectedDefectType);

            await expect(defectTypeController.createDefectType(actor, payload)).resolves.toEqual(expectedDefectType);

            expect(createDefectTypeService.execute).toHaveBeenCalledWith({actor, payload});
            expect(listDefectTypeServiceMock.execute).not.toHaveBeenCalled();
            expect(getDefectTypeServiceMock.execute).not.toHaveBeenCalled();
            expect(updateDefectTypeServiceMock.execute).not.toHaveBeenCalled();
            expect(deleteDefectTypeServiceMock.execute).not.toHaveBeenCalled();
        });
    });

    describe('when listing defect type', () => {
        it('should repass the responsibility to the right service', async () => {
            const payload = {
                companyId,
                pagination: {
                    limit: 2,
                },
            };

            const defectTypes = [
                DefectType.create({
                    companyId,
                    name: 'defect type 1',
                }),
                DefectType.create({
                    companyId,
                    name: 'defect type 2',
                }),
            ];

            const expectedDefectType: PaginatedDto<DefectTypeDto> = {
                data: defectTypes.map((defectType) => new DefectTypeDto(defectType)),
                totalCount: 2,
                nextCursor: 'nextCursor',
            };

            jest.spyOn(listDefectTypeServiceMock, 'execute').mockResolvedValue(expectedDefectType);

            await expect(defectTypeController.listDefectType(actor, payload)).resolves.toEqual(expectedDefectType);

            expect(listDefectTypeServiceMock.execute).toHaveBeenCalledWith({actor, payload});
        });
    });

    describe('when getting a defect type', () => {
        it('should repass the responsibility to the right service', async () => {
            const defectType = DefectType.create({
                companyId,
                name: 'defect type 1',
            });

            const expectedDefectType = new DefectTypeDto(defectType);

            jest.spyOn(getDefectTypeServiceMock, 'execute').mockResolvedValue(expectedDefectType);

            await expect(defectTypeController.getDefectType(actor, defectType.id)).resolves.toEqual(expectedDefectType);

            expect(getDefectTypeServiceMock.execute).toHaveBeenCalledWith({actor, payload: {id: defectType.id}});
        });
    });

    describe('when updating a defect type', () => {
        it('should repass the responsibility to the right service', async () => {
            const defectType = DefectType.create({
                companyId,
                name: 'defect type 1',
            });

            const payload: UpdateDefectTypeInputDto = {
                name: 'new defect type',
            };

            const existingDefectType = new DefectTypeDto(defectType);

            jest.spyOn(updateDefectTypeServiceMock, 'execute').mockResolvedValueOnce(existingDefectType);

            await expect(defectTypeController.updateDefectType(actor, defectType.id, payload)).resolves.toEqual(
                existingDefectType
            );

            expect(updateDefectTypeServiceMock.execute).toHaveBeenCalledWith({
                actor,
                payload: {id: defectType.id, ...payload},
            });
        });
    });

    describe('when deleting a defect type', () => {
        it('should repass the responsibility to the right service', async () => {
            const id = DefectTypeId.generate();

            await defectTypeController.deleteDefectType(actor, id);

            expect(deleteDefectTypeServiceMock.execute).toHaveBeenCalledWith({actor, payload: {id}});
        });
    });
});
