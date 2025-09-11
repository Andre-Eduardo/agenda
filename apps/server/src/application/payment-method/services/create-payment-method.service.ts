import {Injectable} from '@nestjs/common';
import {EventDispatcher} from '../../../domain/event';
import {PaymentMethod} from '../../../domain/payment-method/entities';
import {PaymentMethodRepository} from '../../../domain/payment-method/payment-method.repository';
import {ApplicationService, Command} from '../../@shared/application.service';
import {CreatePaymentMethodDto, PaymentMethodDto} from '../dtos';

@Injectable()
export class CreatePaymentMethodService implements ApplicationService<CreatePaymentMethodDto, PaymentMethodDto> {
    constructor(
        private readonly paymentMethodRepository: PaymentMethodRepository,
        private readonly eventDispatcher: EventDispatcher
    ) {}

    async execute({actor, payload}: Command<CreatePaymentMethodDto>): Promise<PaymentMethodDto> {
        const paymentMethod = PaymentMethod.create(payload);

        await this.paymentMethodRepository.save(paymentMethod);

        this.eventDispatcher.dispatch(actor, paymentMethod);

        return new PaymentMethodDto(paymentMethod);
    }
}
