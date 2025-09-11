import {Injectable} from '@nestjs/common';
import {PaymentMethodRepository} from '../../../domain/payment-method/payment-method.repository';
import {ApplicationService, Command} from '../../@shared/application.service';
import {PaginatedDto} from '../../@shared/dto';
import {ListPaymentMethodDto, PaymentMethodDto} from '../dtos';

@Injectable()
export class ListPaymentMethodService
    implements ApplicationService<ListPaymentMethodDto, PaginatedDto<PaymentMethodDto>>
{
    constructor(private readonly paymentMethodRepository: PaymentMethodRepository) {}

    async execute({payload}: Command<ListPaymentMethodDto>): Promise<PaginatedDto<PaymentMethodDto>> {
        const result = await this.paymentMethodRepository.search(
            payload.companyId,
            {
                cursor: payload.pagination.cursor ?? undefined,
                limit: payload.pagination.limit,
                sort: payload.pagination.sort ?? {},
            },
            {
                name: payload.name,
                type: payload.type,
            }
        );

        return {
            ...result,
            data: result.data.map((paymentMethod) => new PaymentMethodDto(paymentMethod)),
        };
    }
}
