import {Injectable} from '@nestjs/common';
import {SupplierRepository} from '../../../domain/supplier/supplier.repository';
import {ApplicationService, Command} from '../../@shared/application.service';
import {PaginatedDto} from '../../@shared/dto';
import {ListSupplierDto, SupplierDto} from '../dtos';

@Injectable()
export class ListSupplierService implements ApplicationService<ListSupplierDto, PaginatedDto<SupplierDto>> {
    constructor(private readonly supplierRepository: SupplierRepository) {}

    async execute({payload}: Command<ListSupplierDto>): Promise<PaginatedDto<SupplierDto>> {
        const result = await this.supplierRepository.search(
            payload.companyId,
            {
                cursor: payload.pagination.cursor ?? undefined,
                limit: payload.pagination.limit,
                sort: payload.pagination.sort ?? {},
            },
            {
                name: payload.name,
                documentId: payload.documentId,
                phone: payload.phone,
                companyName: payload.companyName,
                personType: payload.personType,
                profiles: payload.profiles,
            }
        );

        return {
            ...result,
            data: result.data.map((supplier) => new SupplierDto(supplier)),
        };
    }
}
