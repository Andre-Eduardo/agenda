import {Injectable} from '@nestjs/common';
import {PreconditionException, ResourceNotFoundException} from '../../../domain/@shared/exceptions';
import {EventDispatcher} from '../../../domain/event';
import {PersonId, PersonProfile} from '../../../domain/person/entities';
import {DuplicateDocumentIdException} from '../../../domain/person/person.exceptions';
import {PersonRepository} from '../../../domain/person/person.repository';
import {Supplier} from '../../../domain/supplier/entities';
import {SupplierRepository} from '../../../domain/supplier/supplier.repository';
import {ApplicationService, Command} from '../../@shared/application.service';
import {CreateSupplierDto, SupplierDto} from '../dtos';

@Injectable()
export class CreateSupplierService implements ApplicationService<CreateSupplierDto, SupplierDto> {
    constructor(
        private readonly personRepository: PersonRepository,
        private readonly supplierRepository: SupplierRepository,
        private readonly eventDispatcher: EventDispatcher
    ) {}

    async execute({actor, payload}: Command<CreateSupplierDto>): Promise<SupplierDto> {
        const supplier = 'id' in payload ? await this.createSupplierFromPerson(payload.id) : Supplier.create(payload);

        try {
            await this.supplierRepository.save(supplier);
        } catch (e) {
            if (e instanceof DuplicateDocumentIdException) {
                throw new PreconditionException('Cannot create a supplier with a document ID already in use.');
            }

            throw e;
        }

        this.eventDispatcher.dispatch(actor, supplier);

        return new SupplierDto(supplier);
    }

    private async createSupplierFromPerson(personId: PersonId): Promise<Supplier> {
        const person = await this.personRepository.findById(personId);

        if (!person) {
            throw new ResourceNotFoundException('Person not found', personId.toString());
        }

        if (person.profiles.has(PersonProfile.SUPPLIER)) {
            throw new PreconditionException('The person is already a supplier.');
        }

        return Supplier.createFromPerson(person);
    }
}
