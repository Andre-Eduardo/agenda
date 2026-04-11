import {createMockProxy} from 'jest-mock-extended';
import {CreateFormTemplateService} from '../create-form-template.service';
import {FormTemplateRepository} from '../../../../domain/form-template/form-template.repository';
import {PreconditionException} from '../../../../domain/@shared/exceptions';
import {Specialty} from '../../../../domain/form-template/entities';
import type {Actor} from '../../../../domain/@shared/actor';

const mockActor = {id: 'user-1', globalRole: 'OWNER'} as unknown as Actor;

describe('CreateFormTemplateService', () => {
    let service: CreateFormTemplateService;
    let repository: ReturnType<typeof createMockProxy<FormTemplateRepository>>;

    beforeEach(() => {
        repository = createMockProxy<FormTemplateRepository>();
        service = new CreateFormTemplateService(repository);
    });

    it('should create a template successfully', async () => {
        repository.findByCode.mockResolvedValue(null);
        repository.save.mockResolvedValue(undefined);

        const result = await service.execute({
            actor: mockActor,
            payload: {
                code: 'test_form',
                name: 'Test Form',
                specialty: Specialty.PSICOLOGIA,
                isPublic: true,
            },
        });

        expect(result.code).toBe('test_form');
        expect(result.name).toBe('Test Form');
        expect(result.specialty).toBe(Specialty.PSICOLOGIA);
        expect(repository.save).toHaveBeenCalledTimes(1);
    });

    it('should throw PreconditionException if code already exists', async () => {
        const existingTemplate = {code: 'existing_code'} as any;
        repository.findByCode.mockResolvedValue(existingTemplate);

        await expect(
            service.execute({
                actor: mockActor,
                payload: {
                    code: 'existing_code',
                    name: 'Some Form',
                    specialty: Specialty.MEDICINA,
                    isPublic: false,
                },
            })
        ).rejects.toThrow(PreconditionException);

        expect(repository.save).not.toHaveBeenCalled();
    });
});
