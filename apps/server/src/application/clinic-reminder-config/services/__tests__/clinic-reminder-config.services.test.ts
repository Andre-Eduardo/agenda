import {mock} from 'jest-mock-extended';
import type {Actor} from '@domain/@shared/actor';
import {AccessDeniedException} from '@domain/@shared/exceptions';
import {ReminderChannel} from '@domain/appointment-reminder/entities';
import {ClinicMemberRepository} from '@domain/clinic-member/clinic-member.repository';
import {ClinicMemberId, type ClinicMember} from '@domain/clinic-member/entities';
import {ClinicReminderConfigRepository} from '@domain/clinic-reminder-config/clinic-reminder-config.repository';
import {ClinicReminderConfig} from '@domain/clinic-reminder-config/entities';
import {DEFAULT_REMINDER_MESSAGE_TEMPLATE} from '@domain/clinic-reminder-config/reminder-message-template';
import {ClinicRepository} from '@domain/clinic/clinic.repository';
import {ClinicId, type Clinic} from '@domain/clinic/entities';
import {UserId, type User} from '@domain/user/entities';
import {UserRepository} from '@domain/user/user.repository';
import {
    GetReminderConfigService,
    PreviewReminderMessageService,
    ReminderMessageRenderer,
    UpsertReminderConfigService,
} from '..';

describe('The clinic reminder config services', () => {
    const clinicId = ClinicId.generate();
    const actor: Actor = {
        userId: UserId.generate(),
        clinicId,
        clinicMemberId: ClinicMemberId.generate(),
        ip: '127.0.0.1',
    };
    const otherClinicId = ClinicId.generate();

    const configRepository = mock<ClinicReminderConfigRepository>();
    const clinicRepository = mock<ClinicRepository>();
    const clinicMemberRepository = mock<ClinicMemberRepository>();
    const userRepository = mock<UserRepository>();
    const renderer = new ReminderMessageRenderer(
        configRepository,
        clinicRepository,
        clinicMemberRepository,
        userRepository
    );

    function savedConfig(): ClinicReminderConfig {
        return ClinicReminderConfig.create({
            clinicId,
            enabledChannels: [ReminderChannel.EMAIL],
            hoursBeforeList: [48, 2],
            messageTemplate: 'Oi {{paciente}}',
        });
    }

    beforeEach(() => {
        jest.resetAllMocks();
        jest.useFakeTimers({now: new Date('2026-11-25T12:00:00Z')});
        clinicRepository.findById.mockResolvedValue(mock<Clinic>({name: 'Clínica Bem Estar'}));
        clinicMemberRepository.findById.mockResolvedValue(mock<ClinicMember>({displayName: 'Dra. Ana'}));
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    describe('getting the config', () => {
        const service = new GetReminderConfigService(configRepository);

        it('should return the saved config', async () => {
            configRepository.findByClinicId.mockResolvedValue(savedConfig());

            await expect(service.execute({actor, payload: {clinicId}})).resolves.toMatchObject({
                enabledChannels: [ReminderChannel.EMAIL],
                hoursBeforeList: [48, 2],
                messageTemplate: 'Oi {{paciente}}',
                usesDefaultTemplate: false,
                isActive: true,
                configured: true,
            });
        });

        it('should return inactive defaults without saving when the clinic never configured reminders', async () => {
            configRepository.findByClinicId.mockResolvedValue(null);

            await expect(service.execute({actor, payload: {clinicId}})).resolves.toMatchObject({
                enabledChannels: [ReminderChannel.WHATSAPP],
                hoursBeforeList: [24],
                messageTemplate: DEFAULT_REMINDER_MESSAGE_TEMPLATE,
                usesDefaultTemplate: true,
                isActive: false,
                configured: false,
            });
            expect(configRepository.save).not.toHaveBeenCalled();
        });

        it('should deny reading another clinic config', async () => {
            await expect(service.execute({actor, payload: {clinicId: otherClinicId}})).rejects.toThrow(
                AccessDeniedException
            );
            expect(configRepository.findByClinicId).not.toHaveBeenCalled();
        });
    });

    describe('saving the config', () => {
        const service = new UpsertReminderConfigService(configRepository);

        it('should create the config with the custom text', async () => {
            configRepository.findByClinicId.mockResolvedValue(null);

            await expect(
                service.execute({
                    actor,
                    payload: {
                        clinicId,
                        enabledChannels: [ReminderChannel.WHATSAPP],
                        hoursBeforeList: [2, 24],
                        messageTemplate: 'Oi {{paciente}}, até {{data}}',
                        isActive: true,
                    },
                })
            ).resolves.toMatchObject({hoursBeforeList: [24, 2], messageTemplate: 'Oi {{paciente}}, até {{data}}'});
            expect(configRepository.save).toHaveBeenCalledWith(expect.any(ClinicReminderConfig));
        });

        it('should update the existing config and reset the text with null', async () => {
            const existing = savedConfig();

            configRepository.findByClinicId.mockResolvedValue(existing);

            await expect(
                service.execute({
                    actor,
                    payload: {
                        clinicId,
                        enabledChannels: [ReminderChannel.WHATSAPP],
                        hoursBeforeList: [24],
                        messageTemplate: null,
                        isActive: false,
                    },
                })
            ).resolves.toMatchObject({usesDefaultTemplate: true, isActive: false});
            expect(configRepository.save).toHaveBeenCalledWith(existing);
        });

        it('should deny changing another clinic config', async () => {
            await expect(
                service.execute({
                    actor,
                    payload: {
                        clinicId: otherClinicId,
                        enabledChannels: [ReminderChannel.WHATSAPP],
                        hoursBeforeList: [24],
                    },
                })
            ).rejects.toThrow(AccessDeniedException);
            expect(configRepository.save).not.toHaveBeenCalled();
        });
    });

    describe('previewing the message', () => {
        const service = new PreviewReminderMessageService(renderer);

        it('should fill the unsaved text with sample data, the clinic and the actor as professional', async () => {
            await expect(
                service.execute({
                    actor,
                    payload: {
                        clinicId,
                        messageTemplate: '{{paciente}} | {{data}} {{hora}} | {{profissional}} | {{clinica}}',
                    },
                })
            ).resolves.toMatchObject({
                subject: 'Lembrete de consulta',
                message: 'Maria Silva | 26/11/2026 14:30 | Dra. Ana | Clínica Bem Estar',
            });
            expect(clinicMemberRepository.findById).toHaveBeenCalledWith(actor.clinicMemberId);
        });

        it('should preview the default text when the text is blank', async () => {
            const result = await service.execute({actor, payload: {clinicId, messageTemplate: '  '}});

            expect(result.message).toContain('Olá, Maria Silva!');
            expect(result.variables).toEqual(['paciente', 'data', 'hora', 'profissional', 'clinica']);
        });

        it('should deny previewing for another clinic', async () => {
            await expect(
                service.execute({actor, payload: {clinicId: otherClinicId, messageTemplate: null}})
            ).rejects.toThrow(AccessDeniedException);
        });
    });

    describe('rendering a reminder', () => {
        it('should use the saved text and fall back to the user name when the member has no display name', async () => {
            configRepository.findByClinicId.mockResolvedValue(savedConfig());
            clinicMemberRepository.findById.mockResolvedValue(
                mock<ClinicMember>({displayName: null, userId: actor.userId})
            );
            userRepository.findById.mockResolvedValue(mock<User>({name: 'Ana Souza'}));

            await expect(
                renderer.render({
                    clinicId,
                    patientName: 'João',
                    startAt: new Date('2026-12-01T13:30:00Z'),
                    professionalId: actor.clinicMemberId,
                })
            ).resolves.toBe('Oi João');
        });

        it('should use the default text when the clinic has no config', async () => {
            configRepository.findByClinicId.mockResolvedValue(null);

            await expect(
                renderer.render({
                    clinicId,
                    patientName: 'João',
                    startAt: new Date('2026-12-01T13:30:00Z'),
                    professionalId: actor.clinicMemberId,
                })
            ).resolves.toBe(
                'Olá, João! Lembramos que você tem uma consulta agendada para 01/12/2026 às 10:30 com Dra. Ana. ' +
                    'Em caso de imprevisto, entre em contato com Clínica Bem Estar.'
            );
        });
    });
});
