import {ApiExtraModels, getSchemaPath} from '@nestjs/swagger';
import {z} from 'zod';
import {CompanyId} from '../../../domain/company/entities';
import {PersonId} from '../../../domain/person/entities';
import {RoomId} from '../../../domain/room/entities';
import {RoomCategoryId} from '../../../domain/room-category/entities';
import {createZodDto} from '../../@shared/validation/dto';
import {entityId} from '../../@shared/validation/schemas';
import {datetime} from '../../@shared/validation/schemas/datetime.schema';
import {createTransactionSchema} from '../../transaction/dtos';

const createReservationDepositSchema = createTransactionSchema.pick({
    amount: true,
    paymentMethodId: true,
});

class CreateReservationDepositDto extends createZodDto(createReservationDepositSchema) {}

export const createReservationSchema = z.object({
    companyId: entityId(CompanyId),
    roomId: entityId(RoomId).nullish(),
    roomCategoryId: entityId(RoomCategoryId).nullish(),
    checkIn: datetime.refine((date) => date > new Date(), {
        message: 'Check-in date can not be earlier than the current date.',
    }),
    bookedFor: entityId(PersonId),
    note: z.string().nullish(),
    deposits: z
        .array(createReservationDepositSchema)
        .nullish()
        .openapi({
            items: {
                $ref: getSchemaPath(CreateReservationDepositDto),
            },
        }),
});

@ApiExtraModels(CreateReservationDepositDto)
export class CreateReservationDto extends createZodDto(createReservationSchema) {}
