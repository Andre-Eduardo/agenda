import {Injectable} from '@nestjs/common';
import {ResourceNotFoundException} from '../../../domain/@shared/exceptions';
import {SupplierRepository} from '../../../domain/supplier/supplier.repository';
import {ApplicationService, Command} from '../../@shared/application.service';
import {GetSupplierDto, SupplierDto} from '../dtos';

@Injectable()
export class GetSupplierService implements ApplicationService<GetSupplierDto, SupplierDto> {
    constructor(private readonly supplierRepository: SupplierRepository) {}

    async execute({payload}: Command<GetSupplierDto>): Promise<SupplierDto> {
        const supplier = await this.supplierRepository.findById(payload.id);

        if (!supplier) {
            throw new ResourceNotFoundException('Supplier not found', payload.id.toString());
        }

        return new SupplierDto(supplier);
    }
}
