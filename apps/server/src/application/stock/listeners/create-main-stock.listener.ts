import {Injectable} from '@nestjs/common';
import {OnEvent} from '@nestjs/event-emitter';
import {CompanyCreatedEvent} from '../../../domain/company/events';
import {Event} from '../../../domain/event';
import {StockType} from '../../../domain/stock/entities';
import {CreateStockService} from '../services';

@Injectable()
export class CreateMainStockListener {
    constructor(private readonly createStockService: CreateStockService) {}

    @OnEvent(CompanyCreatedEvent.type)
    async handle(event: Event<CompanyCreatedEvent>): Promise<void> {
        await this.createStockService.execute({
            actor: event.actor,
            payload: {
                companyId: event.payload.companyId,
                type: StockType.MAIN,
            },
        });
    }
}
