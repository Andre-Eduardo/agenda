import {Injectable} from '@nestjs/common';
import {PreconditionException, ResourceNotFoundException} from '../../../domain/@shared/exceptions';
import {EventDispatcher} from '../../../domain/event';
import {DuplicateDocumentIdException} from '../../../domain/person/person.exceptions';
import {SupplierRepository} from '../../../domain/supplier/supplier.repository';
import {ApplicationService, Command} from '../../@shared/application.service';
import {SupplierDto, UpdateSupplierDto} from '../dtos';

@Injectable()
export class UpdateSupplierService implements ApplicationService<UpdateSupplierDto, SupplierDto> {
    constructor(
        private readonly supplierRepository: SupplierRepository,
        private readonly eventDispatcher: EventDispatcher
    ) {}

    async execute({actor, payload}: Command<UpdateSupplierDto>): Promise<SupplierDto> {
        const supplier = await this.supplierRepository.findById(payload.id);

        if (supplier === null) {
            throw new ResourceNotFoundException('Supplier not found', payload.id.toString());
        }

        supplier.change(payload);

        try {
            await this.supplierRepository.save(supplier);
        } catch (e) {
            if (e instanceof DuplicateDocumentIdException) {
                throw new PreconditionException('Cannot update a supplier with a document ID already in use.');
            }

            throw e;
        }

        this.eventDispatcher.dispatch(actor, supplier);

        return new SupplierDto(supplier);
    }
}
