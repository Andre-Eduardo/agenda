import {Injectable} from '@nestjs/common';
import {PreconditionException, ResourceNotFoundException} from '../../../domain/@shared/exceptions';
import {CashierRepository} from '../../../domain/cashier/cashier.repository';
import {EventDispatcher} from '../../../domain/event';
import {ApplicationService, Command} from '../../@shared/application.service';
import {CashierDto, CloseCashierDto} from '../dtos';

@Injectable()
export class CloseCashierService implements ApplicationService<CloseCashierDto, CashierDto> {
    constructor(
        private readonly cashierRepository: CashierRepository,
        private readonly eventDispatcher: EventDispatcher
    ) {}

    async execute({actor, payload}: Command<CloseCashierDto>): Promise<CashierDto> {
        const cashier = await this.cashierRepository.findById(payload.id);

        if (!cashier) {
            throw new ResourceNotFoundException('Cashier not found', payload.id.toString());
        }

        if (cashier.closedAt !== null) {
            throw new PreconditionException('Cashier is already closed.');
        }

        cashier.close();

        await this.cashierRepository.save(cashier);

        this.eventDispatcher.dispatch(actor, cashier);

        return new CashierDto(cashier);
    }
}
