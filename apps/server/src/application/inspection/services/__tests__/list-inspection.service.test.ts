import {mock} from 'jest-mock-extended';
import type {Actor} from '../../../../domain/@shared/actor';
import type {PaginatedList} from '../../../../domain/@shared/repository';
import {CompanyId} from '../../../../domain/company/entities';
import type {Inspection} from '../../../../domain/inspection/entities';
import {InspectionEndReasonType} from '../../../../domain/inspection/entities';
import {fakeInspection} from '../../../../domain/inspection/entities/__tests__/fake-inspection';
import type {InspectionRepository} from '../../../../domain/inspection/inspection.repository';
import {UserId} from '../../../../domain/user/entities';
import type {ListInspectionDto} from '../../dtos';
import {InspectionDto} from '../../dtos';
import {ListInspectionService} from '../list-inspection.service';

describe('A list-inspection service', () => {
    const inspectionRepository = mock<InspectionRepository>();
    const listInspectionService = new ListInspectionService(inspectionRepository);

    const actor: Actor = {
        userId: UserId.generate(),
        ip: '127.0.0.1',
    };

    const companyId = CompanyId.generate();

    const existingInspections: Inspection[] = [
        fakeInspection({
            companyId,
            startedAt: new Date(1000),
            createdAt: new Date(1000),
            updatedAt: new Date(1000),
        }),
        fakeInspection({
            companyId,
            startedById: UserId.generate(),
            startedAt: new Date(2000),
            finishedById: UserId.generate(),
            finishedAt: new Date(3000),
            endReason: InspectionEndReasonType.APPROVED,
            note: 'a',
            createdAt: new Date(2000),
            updatedAt: new Date(3000),
        }),
    ];

    const paginatedInspections: PaginatedList<Inspection> = {
        data: existingInspections,
        totalCount: existingInspections.length,
        nextCursor: null,
    };

    it('should list inspections', async () => {
        const payload: ListInspectionDto = {
            companyId,
            pagination: {
                limit: 2,
                sort: {createdAt: 'asc'},
            },
            endReason: InspectionEndReasonType.APPROVED,
        };

        jest.spyOn(inspectionRepository, 'search').mockResolvedValueOnce(paginatedInspections);

        await expect(listInspectionService.execute({actor, payload})).resolves.toEqual({
            data: existingInspections.map((inspection) => new InspectionDto(inspection)),
            totalCount: existingInspections.length,
            nextCursor: null,
        });

        expect(existingInspections.flatMap((inspection) => inspection.events)).toHaveLength(0);

        expect(inspectionRepository.search).toHaveBeenCalledWith(
            companyId,
            {
                limit: 2,
                sort: {createdAt: 'asc'},
            },
            {
                endReason: InspectionEndReasonType.APPROVED,
            }
        );
    });

    it('should paginate inspections', async () => {
        const payload = {
            companyId,
            pagination: {
                cursor: 'bf821fb9-adf9-4fa4-80da-a1fdeb707c80',
                limit: 2,
            },
            endReason: InspectionEndReasonType.APPROVED,
        };

        jest.spyOn(inspectionRepository, 'search').mockResolvedValueOnce(paginatedInspections);

        await expect(listInspectionService.execute({actor, payload})).resolves.toEqual({
            data: existingInspections.map((inspection) => new InspectionDto(inspection)),
            totalCount: existingInspections.length,
            nextCursor: null,
        });

        expect(existingInspections.flatMap((inspection) => inspection.events)).toHaveLength(0);

        expect(inspectionRepository.search).toHaveBeenCalledWith(
            companyId,
            {
                cursor: 'bf821fb9-adf9-4fa4-80da-a1fdeb707c80',
                limit: 2,
                sort: {},
            },
            {
                endReason: InspectionEndReasonType.APPROVED,
            }
        );
    });
});
