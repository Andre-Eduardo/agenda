import {Injectable} from '@nestjs/common';
import {ResourceNotFoundException} from '../../../domain/@shared/exceptions';
import {StockRepository} from '../../../domain/stock/stock.repository';
import {ApplicationService, Command} from '../../@shared/application.service';
import {GetStockDto, StockDto} from '../dtos';

@Injectable()
export class GetStockService implements ApplicationService<GetStockDto, StockDto> {
    constructor(private readonly stockRepository: StockRepository) {}

    async execute({payload}: Command<GetStockDto>): Promise<StockDto> {
        const stock = await this.stockRepository.findById(payload.id);

        if (!stock) {
            throw new ResourceNotFoundException('Stock not found', payload.id.toString());
        }

        return new StockDto(stock);
    }
}
