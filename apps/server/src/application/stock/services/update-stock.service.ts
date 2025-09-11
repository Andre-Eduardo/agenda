import {Injectable} from '@nestjs/common';
import {
    DuplicateNameException,
    PreconditionException,
    ResourceNotFoundException,
} from '../../../domain/@shared/exceptions';
import {EventDispatcher} from '../../../domain/event';
import {StockRepository} from '../../../domain/stock/stock.repository';
import {ApplicationService, Command} from '../../@shared/application.service';
import {StockDto, UpdateStockDto} from '../dtos';

@Injectable()
export class UpdateStockService implements ApplicationService<UpdateStockDto, StockDto> {
    constructor(
        private readonly stockRepository: StockRepository,
        private readonly eventDispatcher: EventDispatcher
    ) {}

    async execute({actor, payload}: Command<UpdateStockDto>): Promise<StockDto> {
        const stock = await this.stockRepository.findById(payload.id);

        if (stock === null) {
            throw new ResourceNotFoundException('Stock not found', payload.id.toString());
        }

        stock.change(payload);

        try {
            await this.stockRepository.save(stock);
        } catch (e) {
            if (e instanceof DuplicateNameException) {
                throw new PreconditionException('Cannot update a stock with a name already in use.');
            }

            throw e;
        }

        this.eventDispatcher.dispatch(actor, stock);

        return new StockDto(stock);
    }
}
