import {ApiProperty, ApiSchema} from '@nestjs/swagger';
import {PaymentMethod, PaymentMethodType} from '../../../domain/payment-method/entities';
import {CompanyEntityDto} from '../../@shared/dto';

@ApiSchema({name: 'PaymentMethod'})
export class PaymentMethodDto extends CompanyEntityDto {
    @ApiProperty({
        description: 'The name of the payment method',
        example: 'Mastercard credit',
    })
    name: string;

    @ApiProperty({
        description: 'The type of the payment method',
        example: 'credit card',
        enum: PaymentMethodType,
        enumName: 'PaymentMethodType',
    })
    type: PaymentMethodType;

    constructor(paymentMethod: PaymentMethod) {
        super(paymentMethod);
        this.name = paymentMethod.name;
        this.type = paymentMethod.type;
        this.companyId = paymentMethod.companyId.toString();
    }
}
