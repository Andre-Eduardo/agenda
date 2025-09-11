import {Injectable} from '@nestjs/common';
import {ResourceNotFoundException} from '../../../domain/@shared/exceptions';
import {EventDispatcher} from '../../../domain/event';
import {PersonRepository} from '../../../domain/person/person.repository';
import {SupplierRepository} from '../../../domain/supplier/supplier.repository';
import {ApplicationService, Command} from '../../@shared/application.service';
import {DeleteSupplierDto} from '../dtos';

@Injectable()
export class DeleteSupplierService implements ApplicationService<DeleteSupplierDto> {
    constructor(
        private readonly personRepository: PersonRepository,
        private readonly supplierRepository: SupplierRepository,
        private readonly eventDispatcher: EventDispatcher
    ) {}

    async execute({actor, payload}: Command<DeleteSupplierDto>): Promise<void> {
        const supplier = await this.supplierRepository.findById(payload.id);

        if (!supplier) {
            throw new ResourceNotFoundException('Supplier not found', payload.id.toString());
        }

        supplier.delete();

        // Required to update the person's profiles.
        await this.supplierRepository.save(supplier);

        await this.supplierRepository.delete(payload.id);

        if (supplier.profiles.size === 0) {
            await this.personRepository.delete(payload.id);
        }

        this.eventDispatcher.dispatch(actor, supplier);
    }
}
