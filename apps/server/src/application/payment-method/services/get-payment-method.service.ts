import {Injectable} from '@nestjs/common';
import {ResourceNotFoundException} from '../../../domain/@shared/exceptions';
import {PaymentMethodRepository} from '../../../domain/payment-method/payment-method.repository';
import {ApplicationService, Command} from '../../@shared/application.service';
import {GetPaymentMethodDto, PaymentMethodDto} from '../dtos';

@Injectable()
export class GetPaymentMethodService implements ApplicationService<GetPaymentMethodDto, PaymentMethodDto> {
    constructor(private readonly paymentMethodRepository: PaymentMethodRepository) {}

    async execute({payload}: Command<GetPaymentMethodDto>): Promise<PaymentMethodDto> {
        const paymentMethod = await this.paymentMethodRepository.findById(payload.id);

        if (paymentMethod === null) {
            throw new ResourceNotFoundException('Payment method not found', payload.id.toString());
        }

        return new PaymentMethodDto(paymentMethod);
    }
}
