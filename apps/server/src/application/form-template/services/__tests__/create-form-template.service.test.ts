import {mock} from 'jest-mock-extended';
import {FormTemplateDto} from '@application/form-template/dtos';
import {CreateFormTemplateService} from '@application/form-template/services/create-form-template.service';
import type {Actor} from '@domain/@shared/actor';
import {PreconditionException} from '@domain/@shared/exceptions';
import {ClinicMemberId} from '@domain/clinic-member/entities';
import {ClinicId} from '@domain/clinic/entities';
import {AiSpecialtyGroup, FormTemplate} from '@domain/form-template/entities';
import type {FormTemplateRepository} from '@domain/form-template/form-template.repository';
import {UserId} from '@domain/user/entities';

describe('A create-form-template service', () => {
    const repository = mock<FormTemplateRepository>();
    const service = new CreateFormTemplateService(repository);

    const actor: Actor = {
        userId: UserId.generate(),
        clinicId: ClinicId.generate(),
        clinicMemberId: ClinicMemberId.generate(),
        ip: '127.0.0.1',
    };
    const now = new Date('2024-01-01T00:00:00Z');

    beforeEach(() => {
        jest.useFakeTimers({now});
    });

    afterEach(() => {
        jest.useRealTimers();
        jest.clearAllMocks();
    });

    it('should create a public template without clinic ownership', async () => {
        repository.findByCode.mockResolvedValue(null);

        const result = await service.execute({
            actor,
            payload: {
                code: 'test_form',
                name: 'Test Form',
                specialty: 'Psicologia',
                isPublic: true,
            },
        });

        expect(result).toEqual(
            expect.objectContaining({
                code: 'test_form',
                name: 'Test Form',
                description: null,
                specialty: 'Psicologia',
                isPublic: true,
                clinicId: null,
                createdByMemberId: null,
            })
        );
        expect(repository.findByCode).toHaveBeenCalledWith('test_form');
        expect(repository.save).toHaveBeenCalledTimes(1);

        const [saved] = repository.save.mock.calls[0];

        expect(saved).toBeInstanceOf(FormTemplate);
        expect(saved.specialtyGroup).toBe(AiSpecialtyGroup.SAUDE_MENTAL);
        expect(result).toEqual(new FormTemplateDto(saved));
    });

    it('should create a private template scoped to the actor clinic member', async () => {
        repository.findByCode.mockResolvedValue(null);

        const result = await service.execute({
            actor,
            payload: {
                code: 'private_form',
                name: 'Private Form',
                description: 'Some description',
                specialty: 'Fisioterapia',
                isPublic: false,
            },
        });

        expect(result).toEqual(
            expect.objectContaining({
                code: 'private_form',
                description: 'Some description',
                isPublic: false,
                clinicId: actor.clinicId.toString(),
                createdByMemberId: actor.clinicMemberId.toString(),
            })
        );

        const [saved] = repository.save.mock.calls[0];

        expect(saved.specialtyGroup).toBe(AiSpecialtyGroup.REABILITACAO);
    });

    it('should throw PreconditionException if code already exists', async () => {
        const existingTemplate = FormTemplate.create({
            code: 'existing_code',
            name: 'Existing Form',
            isPublic: true,
        });

        repository.findByCode.mockResolvedValue(existingTemplate);

        await expect(
            service.execute({
                actor,
                payload: {
                    code: 'existing_code',
                    name: 'Some Form',
                    specialty: 'Medicina',
                    isPublic: false,
                },
            })
        ).rejects.toThrowWithMessage(PreconditionException, 'A template with code "existing_code" already exists.');

        expect(repository.save).not.toHaveBeenCalled();
    });
});
