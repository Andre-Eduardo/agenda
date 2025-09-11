import {Injectable} from '@nestjs/common';
import {CompanyRepository} from '../../../domain/company/company.repository';
import {Company} from '../../../domain/company/entities';
import {EventDispatcher} from '../../../domain/event';
import {Token, TokenProvider, TokenScope} from '../../../domain/user/token';
import {UserRepository} from '../../../domain/user/user.repository';
import {ApplicationService, Command} from '../../@shared/application.service';
import {CompanyDto, CreateCompanyDto} from '../dtos';

type CreateCompanyResponse = {
    token: Token;
    company: CompanyDto;
};

@Injectable()
export class CreateCompanyService implements ApplicationService<CreateCompanyDto, CreateCompanyResponse> {
    constructor(
        private readonly userRepository: UserRepository,
        private readonly companyRepository: CompanyRepository,
        private readonly tokenProvider: TokenProvider,
        private readonly eventDispatcher: EventDispatcher
    ) {}

    async execute({actor, payload}: Command<CreateCompanyDto>): Promise<CreateCompanyResponse> {
        const user = await this.userRepository.findById(actor.userId);

        if (user === null) {
            throw new Error('User not found.');
        }

        const company = Company.create(payload);

        user.addToCompany(company.id);

        await this.companyRepository.save(company);
        await this.userRepository.save(user);

        const token = await this.tokenProvider.issue(user.id, {
            scope: [TokenScope.AUTH],
            companies: user.companies,
        });

        this.eventDispatcher.dispatch(actor, company);
        this.eventDispatcher.dispatch(actor, user);

        return {
            token,
            company: new CompanyDto(company),
        };
    }
}
