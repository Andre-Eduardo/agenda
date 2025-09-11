import {Injectable} from '@nestjs/common';
import {DirectSaleRepository} from '../../../domain/sale/direct-sale.repository';
import {ApplicationService, Command} from '../../@shared/application.service';
import {PaginatedDto} from '../../@shared/dto';
import {DirectSaleDto, ListDirectSaleDto} from '../dtos';

@Injectable()
export class ListDirectSaleService implements ApplicationService<ListDirectSaleDto, PaginatedDto<DirectSaleDto>> {
    constructor(private readonly directSaleRepository: DirectSaleRepository) {}

    async execute({payload}: Command<ListDirectSaleDto>): Promise<PaginatedDto<DirectSaleDto>> {
        const result = await this.directSaleRepository.search(
            payload.companyId,
            {
                cursor: payload.pagination.cursor ?? undefined,
                limit: payload.pagination.limit,
                sort: payload.pagination.sort ?? {},
            },
            {
                sellerId: payload.sellerId,
                buyerId: payload.buyerId,
                items: payload.items,
                createdAt: payload.createdAt,
            }
        );

        return {
            ...result,
            data: result.data.map((directSale) => new DirectSaleDto(directSale)),
        };
    }
}
