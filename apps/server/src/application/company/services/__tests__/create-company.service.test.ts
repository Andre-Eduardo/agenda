import {mock} from 'jest-mock-extended';
import type {Actor} from '../../../../domain/@shared/actor';
import {Email} from '../../../../domain/@shared/value-objects';
import {GlobalRole} from '../../../../domain/auth';
import type {CompanyRepository} from '../../../../domain/company/company.repository';
import {Company, CompanyId} from '../../../../domain/company/entities';
import {CompanyCreatedEvent} from '../../../../domain/company/events';
import type {EventDispatcher} from '../../../../domain/event';
import {UserId} from '../../../../domain/user/entities';
import {fakeUser} from '../../../../domain/user/entities/__tests__/fake-user';
import {UserCompanyAddedEvent} from '../../../../domain/user/events';
import type {TokenProvider} from '../../../../domain/user/token';
import {TokenScope} from '../../../../domain/user/token';
import type {UserRepository} from '../../../../domain/user/user.repository';
import {ObfuscatedPassword, Username} from '../../../../domain/user/value-objects';
import {JsonWebToken} from '../../../../infrastructure/auth/jwt';
import type {CreateCompanyDto} from '../../dtos';
import {CompanyDto} from '../../dtos';
import {CreateCompanyService} from '../index';

describe('A create-company service', () => {
    const userRepository = mock<UserRepository>();
    const companyRepository = mock<CompanyRepository>();
    const eventDispatcher = mock<EventDispatcher>();
    const tokenProvider = mock<TokenProvider>();
    const createCompanyService = new CreateCompanyService(
        userRepository,
        companyRepository,
        tokenProvider,
        eventDispatcher
    );

    const actor: Actor = {
        userId: UserId.generate(),
        ip: '127.0.0.1',
    };

    const now = new Date();

    beforeEach(() => {
        jest.useFakeTimers({now});
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    it('should create a company', async () => {
        const existingUser = fakeUser({
            id: UserId.generate(),
            firstName: 'John',
            lastName: 'Doe',
            email: Email.create('john.doe@example.com'),
            username: Username.create('johndoe'),
            password: await ObfuscatedPassword.obfuscate('@SecurePassword123'),
            globalRole: GlobalRole.OWNER,
            companies: [CompanyId.generate()],
            createdAt: new Date(1000),
            updatedAt: new Date(1000),
        });

        const payload: CreateCompanyDto = {
            name: 'Company Name',
        };

        const token = JsonWebToken.signed(
            {
                userId: existingUser.id,
                companies: existingUser.companies,
                scope: [TokenScope.AUTH],
                issueTime: now,
                expirationTime: new Date(now.getTime() + 3600 * 1000),
            },
            'secret'
        );

        const company = Company.create({name: 'Company Name'});

        jest.spyOn(userRepository, 'findById').mockResolvedValueOnce(existingUser);
        jest.spyOn(Company, 'create').mockReturnValue(company);
        jest.spyOn(tokenProvider, 'issue').mockReturnValue(token);

        await expect(createCompanyService.execute({actor, payload})).resolves.toEqual({
            token,
            company: new CompanyDto(company),
        });

        expect(Company.create).toHaveBeenCalledWith(payload);

        expect(company.events).toHaveLength(1);
        expect(company.events[0]).toBeInstanceOf(CompanyCreatedEvent);
        expect(company.events).toEqual([
            {
                type: CompanyCreatedEvent.type,
                companyId: company.id,
                timestamp: now,
                company,
            },
        ]);

        expect(existingUser.events).toHaveLength(1);
        expect(existingUser.events[0]).toBeInstanceOf(UserCompanyAddedEvent);
        expect(existingUser.events).toEqual([
            {
                type: UserCompanyAddedEvent.type,
                companyId: company.id,
                timestamp: now,
                userId: existingUser.id,
            },
        ]);

        expect(companyRepository.save).toHaveBeenCalledWith(company);
        expect(userRepository.save).toHaveBeenCalledWith(existingUser);
        expect(eventDispatcher.dispatch).toHaveBeenCalledWith(actor, company);
        expect(eventDispatcher.dispatch).toHaveBeenCalledWith(actor, existingUser);
    });

    it('should throw an error if the user is not found', async () => {
        const payload: CreateCompanyDto = {
            name: 'Company Name',
        };

        jest.spyOn(userRepository, 'findById').mockResolvedValueOnce(null);

        await expect(createCompanyService.execute({actor, payload})).rejects.toThrowWithMessage(
            Error,
            'User not found.'
        );

        expect(companyRepository.save).not.toHaveBeenCalled();
        expect(userRepository.save).not.toHaveBeenCalled();
        expect(eventDispatcher.dispatch).not.toHaveBeenCalled();
    });
});
