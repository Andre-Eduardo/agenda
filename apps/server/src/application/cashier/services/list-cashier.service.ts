import {Injectable} from '@nestjs/common';
import {CashierRepository} from '../../../domain/cashier/cashier.repository';
import {ApplicationService, Command} from '../../@shared/application.service';
import {PaginatedDto} from '../../@shared/dto';
import {CashierDto, ListCashierDto} from '../dtos';

@Injectable()
export class ListCashierService implements ApplicationService<ListCashierDto, PaginatedDto<CashierDto>> {
    constructor(private readonly cashierRepository: CashierRepository) {}

    async execute({payload}: Command<ListCashierDto>): Promise<PaginatedDto<CashierDto>> {
        const result = await this.cashierRepository.search(
            payload.companyId,
            {
                cursor: payload.pagination.cursor ?? undefined,
                limit: payload.pagination.limit,
                sort: payload.pagination.sort ?? {},
            },
            {
                userId: payload.userId,
                createdAt: payload.createdAt,
                closedAt: payload.closedAt,
            }
        );

        return {
            ...result,
            data: result.data.map((cashier) => new CashierDto(cashier)),
        };
    }
}
