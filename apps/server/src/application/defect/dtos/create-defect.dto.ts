import {z} from 'zod';
import {CompanyId} from '../../../domain/company/entities';
import {DefectTypeId} from '../../../domain/defect-type/entities';
import {RoomId} from '../../../domain/room/entities';
import {createZodDto} from '../../@shared/validation/dto';
import {entityId} from '../../@shared/validation/schemas';

export const createDefectSchema = z.object({
    companyId: entityId(CompanyId),
    note: z.string().min(1).nullish(),
    roomId: entityId(RoomId),
    defectTypeId: entityId(DefectTypeId),
});

export class CreateDefectDto extends createZodDto(createDefectSchema) {}
