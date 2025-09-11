import {Injectable} from '@nestjs/common';
import {ResourceNotFoundException} from '../../../domain/@shared/exceptions';
import {CompanyRepository} from '../../../domain/company/company.repository';
import {EventDispatcher} from '../../../domain/event';
import {ApplicationService, Command} from '../../@shared/application.service';
import {CompanyDto, UpdateCompanyDto} from '../dtos';

@Injectable()
export class UpdateCompanyService implements ApplicationService<UpdateCompanyDto, CompanyDto> {
    constructor(
        private readonly companyRepository: CompanyRepository,
        private readonly eventDispatcher: EventDispatcher
    ) {}

    async execute({actor, payload}: Command<UpdateCompanyDto>): Promise<CompanyDto> {
        const company = await this.companyRepository.findById(payload.id);

        if (company === null) {
            throw new ResourceNotFoundException('Company not found', payload.id.toString());
        }

        company.change({
            name: payload.name,
        });

        await this.companyRepository.save(company);

        this.eventDispatcher.dispatch(actor, company);

        return new CompanyDto(company);
    }
}
