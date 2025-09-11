import {createZodDto} from '../../@shared/validation/dto';
import {createRoomStatusSchema} from '../../room-status/dtos';

const startDeepCleaningSchema = createRoomStatusSchema;

export class StartDeepCleaningDto extends createZodDto(startDeepCleaningSchema) {}
