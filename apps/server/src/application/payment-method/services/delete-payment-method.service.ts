import {Injectable} from '@nestjs/common';
import {ResourceNotFoundException} from '../../../domain/@shared/exceptions';
import {EventDispatcher} from '../../../domain/event';
import {PaymentMethodRepository} from '../../../domain/payment-method/payment-method.repository';
import {ApplicationService, Command} from '../../@shared/application.service';
import {DeletePaymentMethodDto} from '../dtos';

@Injectable()
export class DeletePaymentMethodService implements ApplicationService<DeletePaymentMethodDto> {
    constructor(
        private readonly paymentMethodRepository: PaymentMethodRepository,
        private readonly eventDispatcher: EventDispatcher
    ) {}

    async execute({actor, payload}: Command<DeletePaymentMethodDto>): Promise<void> {
        const paymentMethod = await this.paymentMethodRepository.findById(payload.id);

        if (paymentMethod === null) {
            throw new ResourceNotFoundException('Payment method not found', payload.id.toString());
        }

        paymentMethod.delete();

        await this.paymentMethodRepository.delete(paymentMethod.id);

        this.eventDispatcher.dispatch(actor, paymentMethod);
    }
}
