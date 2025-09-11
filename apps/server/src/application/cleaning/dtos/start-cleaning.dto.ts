import {createZodDto} from '../../@shared/validation/dto';
import {createRoomStatusSchema} from '../../room-status/dtos';

const startCleaningSchema = createRoomStatusSchema;

export class StartCleaningDto extends createZodDto(startCleaningSchema) {}
