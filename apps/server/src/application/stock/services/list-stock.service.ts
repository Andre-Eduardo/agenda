import {Injectable} from '@nestjs/common';
import {StockRepository} from '../../../domain/stock/stock.repository';
import {ApplicationService, Command} from '../../@shared/application.service';
import {PaginatedDto} from '../../@shared/dto';
import {ListStockDto, StockDto} from '../dtos';

@Injectable()
export class ListStockService implements ApplicationService<ListStockDto, PaginatedDto<StockDto>> {
    constructor(private readonly stockRepository: StockRepository) {}

    async execute({payload}: Command<ListStockDto>): Promise<PaginatedDto<StockDto>> {
        const result = await this.stockRepository.search(
            payload.companyId,
            {
                cursor: payload.pagination.cursor ?? undefined,
                limit: payload.pagination.limit,
                sort: payload.pagination.sort ?? {},
            },
            {
                name: payload.name,
                type: payload.type,
                roomId: payload.roomId,
            }
        );

        return {
            ...result,
            data: result.data.map((stock) => new StockDto(stock)),
        };
    }
}
