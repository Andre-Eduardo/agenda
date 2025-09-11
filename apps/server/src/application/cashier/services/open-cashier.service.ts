import {Injectable} from '@nestjs/common';
import {PreconditionException} from '../../../domain/@shared/exceptions';
import {CashierRepository} from '../../../domain/cashier/cashier.repository';
import {Cashier} from '../../../domain/cashier/entities';
import {EventDispatcher} from '../../../domain/event';
import {ApplicationService, Command} from '../../@shared/application.service';
import {CashierDto, OpenCashierDto} from '../dtos';

@Injectable()
export class OpenCashierService implements ApplicationService<OpenCashierDto, CashierDto> {
    constructor(
        private readonly cashierRepository: CashierRepository,
        private readonly eventDispatcher: EventDispatcher
    ) {}

    async execute({actor, payload}: Command<OpenCashierDto>): Promise<CashierDto> {
        const openedCashier = await this.cashierRepository.findOpened(payload.companyId, payload.userId);

        if (openedCashier !== null) {
            throw new PreconditionException('The user already has one opened cashier.');
        }

        const cashier = Cashier.open(payload);

        await this.cashierRepository.save(cashier);

        this.eventDispatcher.dispatch(actor, cashier);

        return new CashierDto(cashier);
    }
}
