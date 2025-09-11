import {Injectable} from '@nestjs/common';
import {DuplicateNameException, PreconditionException} from '../../../domain/@shared/exceptions';
import {EventDispatcher} from '../../../domain/event';
import {Stock, StockType} from '../../../domain/stock/entities';
import {DuplicateMainStockException, DuplicateRoomException} from '../../../domain/stock/stock.exceptions';
import {StockRepository} from '../../../domain/stock/stock.repository';
import {ApplicationService, Command} from '../../@shared/application.service';
import {CreateStockDto, StockDto} from '../dtos';

@Injectable()
export class CreateStockService implements ApplicationService<CreateStockDto, StockDto> {
    constructor(
        private readonly stockRepository: StockRepository,
        private readonly eventDispatcher: EventDispatcher
    ) {}

    async execute({actor, payload}: Command<CreateStockDto>): Promise<StockDto> {
        const stock = Stock.create(payload);

        if (stock.type === StockType.MAIN) {
            const existingMainStock = await this.stockRepository.search(
                payload.companyId,
                {
                    limit: 1,
                    sort: {},
                },
                {type: StockType.MAIN}
            );

            if (existingMainStock.totalCount > 0) {
                throw new DuplicateMainStockException('Main stock already exists.');
            }
        }

        try {
            await this.stockRepository.save(stock);
        } catch (e) {
            if (e instanceof DuplicateNameException) {
                throw new PreconditionException('Cannot create a stock with a name already in use.');
            }

            if (e instanceof DuplicateRoomException) {
                throw new PreconditionException('Cannot create a stock for a room that already has a stock.');
            }

            throw e;
        }

        await this.stockRepository.save(stock);

        this.eventDispatcher.dispatch(actor, stock);

        return new StockDto(stock);
    }
}
