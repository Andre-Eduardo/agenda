import {Injectable} from '@nestjs/common';
import {ResourceNotFoundException} from '../../../domain/@shared/exceptions';
import {CompanyRepository} from '../../../domain/company/company.repository';
import {ApplicationService, Command} from '../../@shared/application.service';
import {GetCompanyDto, CompanyDto} from '../dtos';

@Injectable()
export class GetCompanyService implements ApplicationService<GetCompanyDto, CompanyDto> {
    constructor(private readonly companyRepository: CompanyRepository) {}

    async execute({payload}: Command<GetCompanyDto>): Promise<CompanyDto> {
        const company = await this.companyRepository.findById(payload.id);

        if (company === null) {
            throw new ResourceNotFoundException('Company not found', payload.id.toString());
        }

        return new CompanyDto(company);
    }
}
