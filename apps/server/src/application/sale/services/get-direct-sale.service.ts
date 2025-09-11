import {Injectable} from '@nestjs/common';
import {ResourceNotFoundException} from '../../../domain/@shared/exceptions';
import {DirectSaleRepository} from '../../../domain/sale/direct-sale.repository';
import {ApplicationService, Command} from '../../@shared/application.service';
import {GetDirectSaleDto, DirectSaleDto} from '../dtos';

@Injectable()
export class GetDirectSaleService implements ApplicationService<GetDirectSaleDto, DirectSaleDto> {
    constructor(private readonly directSaleRepository: DirectSaleRepository) {}

    async execute({payload}: Command<GetDirectSaleDto>): Promise<DirectSaleDto> {
        const directSale = await this.directSaleRepository.findById(payload.id);

        if (!directSale) {
            throw new ResourceNotFoundException('Direct sale not found', payload.id.toString());
        }

        return new DirectSaleDto(directSale);
    }
}
