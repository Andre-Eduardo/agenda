import {Injectable} from '@nestjs/common';
import {ResourceNotFoundException} from '../../../domain/@shared/exceptions';
import {CompanyRepository} from '../../../domain/company/company.repository';
import {EventDispatcher} from '../../../domain/event';
import {ApplicationService, Command} from '../../@shared/application.service';
import {DeleteCompanyDto} from '../dtos';

@Injectable()
export class DeleteCompanyService implements ApplicationService<DeleteCompanyDto> {
    constructor(
        private readonly companyRepository: CompanyRepository,
        private readonly eventDispatcher: EventDispatcher
    ) {}

    async execute({actor, payload}: Command<DeleteCompanyDto>): Promise<void> {
        const company = await this.companyRepository.findById(payload.id);

        if (company === null) {
            throw new ResourceNotFoundException('Company not found', payload.id.toString());
        }

        company.delete();

        await this.companyRepository.delete(company.id);

        this.eventDispatcher.dispatch(actor, company);
    }
}
