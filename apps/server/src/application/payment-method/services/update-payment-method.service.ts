import {Injectable} from '@nestjs/common';
import {ResourceNotFoundException} from '../../../domain/@shared/exceptions';
import {EventDispatcher} from '../../../domain/event';
import {PaymentMethodRepository} from '../../../domain/payment-method/payment-method.repository';
import {ApplicationService, Command} from '../../@shared/application.service';
import {PaymentMethodDto, UpdatePaymentMethodDto} from '../dtos';

@Injectable()
export class UpdatePaymentMethodService implements ApplicationService<UpdatePaymentMethodDto, PaymentMethodDto> {
    constructor(
        private readonly paymentMethodRepository: PaymentMethodRepository,
        private readonly eventDispatcher: EventDispatcher
    ) {}

    async execute({actor, payload}: Command<UpdatePaymentMethodDto>): Promise<PaymentMethodDto> {
        const paymentMethod = await this.paymentMethodRepository.findById(payload.id);

        if (paymentMethod === null) {
            throw new ResourceNotFoundException('Payment method not found', payload.id.toString());
        }

        paymentMethod.change(payload);

        await this.paymentMethodRepository.save(paymentMethod);

        this.eventDispatcher.dispatch(actor, paymentMethod);

        return new PaymentMethodDto(paymentMethod);
    }
}
