import {Injectable} from '@nestjs/common';
import {PreconditionException, ResourceNotFoundException} from '../../../domain/@shared/exceptions';
import {EventDispatcher} from '../../../domain/event';
import {StockType} from '../../../domain/stock/entities';
import {StockWithChildrenException} from '../../../domain/stock/stock.exceptions';
import {StockRepository} from '../../../domain/stock/stock.repository';
import {ApplicationService, Command} from '../../@shared/application.service';
import {DeleteStockDto} from '../dtos';

@Injectable()
export class DeleteStockService implements ApplicationService<DeleteStockDto> {
    constructor(
        private readonly stockRepository: StockRepository,
        private readonly eventDispatcher: EventDispatcher
    ) {}

    async execute({actor, payload}: Command<DeleteStockDto>): Promise<void> {
        const stock = await this.stockRepository.findById(payload.id);

        if (!stock) {
            throw new ResourceNotFoundException('Stock not found', payload.id.toString());
        }

        if (stock.type === StockType.MAIN) {
            throw new PreconditionException('Cannot delete the main stock.');
        }

        stock.delete();

        try {
            await this.stockRepository.delete(payload.id);
        } catch (e) {
            if (e instanceof StockWithChildrenException) {
                throw new PreconditionException('Cannot delete a stock with children.');
            }

            throw e;
        }

        this.eventDispatcher.dispatch(actor, stock);
    }
}
