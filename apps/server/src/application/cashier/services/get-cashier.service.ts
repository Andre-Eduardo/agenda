import {Injectable} from '@nestjs/common';
import {ResourceNotFoundException} from '../../../domain/@shared/exceptions';
import {CashierRepository} from '../../../domain/cashier/cashier.repository';
import {ApplicationService, Command} from '../../@shared/application.service';
import {CashierDto, GetCashierDto} from '../dtos';

@Injectable()
export class GetCashierService implements ApplicationService<GetCashierDto, CashierDto> {
    constructor(private readonly cashierRepository: CashierRepository) {}

    async execute({payload}: Command<GetCashierDto>): Promise<CashierDto> {
        const cashier = await this.cashierRepository.findById(payload.id);

        if (!cashier) {
            throw new ResourceNotFoundException('Cashier not found', payload.id.toString());
        }

        return new CashierDto(cashier);
    }
}
