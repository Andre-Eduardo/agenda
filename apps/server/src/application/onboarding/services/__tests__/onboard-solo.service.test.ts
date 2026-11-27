import {mock} from 'jest-mock-extended';
import {OnboardSoloService, SOLO_TERMS_VERSION} from '@application/onboarding/services';
import type {SubscriptionService} from '@application/subscription/subscription.service';
import {unknownActor} from '@domain/@shared/actor';
import {AccessDeniedException, PreconditionException} from '@domain/@shared/exceptions';
import type {AtomicExecutor} from '@domain/@shared/repository';
import type {ClinicMemberRepository} from '@domain/clinic-member/clinic-member.repository';
import {ClinicMember, ClinicMemberRole} from '@domain/clinic-member/entities';
import type {ClinicRepository} from '@domain/clinic/clinic.repository';
import {Clinic, ClinicAccountType} from '@domain/clinic/entities';
import type {EventDispatcher} from '@domain/event';
import type {ProfessionalRepository} from '@domain/professional/professional.repository';
import {DuplicateUsernameException} from '@domain/user/user.exceptions';
import type {UserRepository} from '@domain/user/user.repository';
import {type EnvConfigService, SignUpMode} from '@infrastructure/config';

const payload = {
    name: 'Dra. Ana Souza',
    username: 'ana_souza',
    email: 'ana@example.com',
    password: 'An4.Souza!',
    registrationNumber: 'CRP 06/12345',
    specialty: 'Psicologia',
    acceptTerms: true as const,
};

function setup(soloMode = SignUpMode.OPEN) {
    const userRepository = mock<UserRepository>();
    const clinicRepository = mock<ClinicRepository>();
    const clinicMemberRepository = mock<ClinicMemberRepository>();
    const professionalRepository = mock<ProfessionalRepository>();
    const subscriptionService = mock<SubscriptionService>();
    const eventDispatcher = mock<EventDispatcher>();
    const config = mock<EnvConfigService>();
    const atomicExecutor = mock<AtomicExecutor>();

    Object.defineProperty(config, 'signUp', {
        get: () => ({mode: SignUpMode.CLOSED, soloMode, inviteCode: 'convite'}),
    });
    atomicExecutor.runAtomically.mockImplementation((callback) => callback());

    const service = new OnboardSoloService(
        userRepository,
        clinicRepository,
        clinicMemberRepository,
        professionalRepository,
        subscriptionService,
        eventDispatcher,
        config
    );

    Object.assign(service, {atomicExecutor});

    return {
        service,
        userRepository,
        clinicRepository,
        clinicMemberRepository,
        professionalRepository,
        subscriptionService,
    };
}

describe('Solo onboarding', () => {
    it('creates the user, a solo account, its single member, the professional record and a subscription', async () => {
        const {
            service,
            userRepository,
            clinicRepository,
            clinicMemberRepository,
            professionalRepository,
            subscriptionService,
        } = setup();

        const result = await service.execute({actor: unknownActor, payload});

        expect(userRepository.save).toHaveBeenCalledTimes(1);

        const clinic = clinicRepository.save.mock.calls[0]?.[0];

        expect(clinic).toBeInstanceOf(Clinic);
        expect(clinic).toMatchObject({
            name: 'Consultório de Dra. Ana Souza',
            accountType: ClinicAccountType.SOLO,
            receptionEnabled: false,
            termsVersion: SOLO_TERMS_VERSION,
        });
        expect(clinic?.termsAcceptedAt).toBeInstanceOf(Date);

        const member = clinicMemberRepository.save.mock.calls[0]?.[0];

        expect(member).toBeInstanceOf(ClinicMember);
        expect(member?.roles).toEqual([ClinicMemberRole.OWNER, ClinicMemberRole.PROFESSIONAL]);
        expect(professionalRepository.save).toHaveBeenCalledTimes(1);
        expect(subscriptionService.createSubscription).toHaveBeenCalledWith(
            member?.id.toString(),
            clinic?.id.toString(),
            'STARTER'
        );
        expect(result.clinic.accountType).toBe(ClinicAccountType.SOLO);
        expect(result.clinicMemberId).toBe(member?.id.toString());
    });

    it('stays closed when solo sign-up is closed', async () => {
        const {service, userRepository} = setup(SignUpMode.CLOSED);

        await expect(service.execute({actor: unknownActor, payload})).rejects.toThrow(AccessDeniedException);
        expect(userRepository.save).not.toHaveBeenCalled();
    });

    it('requires the invite code when solo sign-up is by invite', async () => {
        const {service} = setup(SignUpMode.INVITE);

        await expect(service.execute({actor: unknownActor, payload})).rejects.toThrow(AccessDeniedException);
        await expect(
            service.execute({actor: unknownActor, payload: {...payload, inviteCode: 'convite'}})
        ).resolves.toMatchObject({clinic: {accountType: ClinicAccountType.SOLO}});
    });

    it('refuses a username already in use', async () => {
        const {service, userRepository, clinicRepository} = setup();

        userRepository.save.mockRejectedValue(new DuplicateUsernameException());

        await expect(service.execute({actor: unknownActor, payload})).rejects.toThrow(PreconditionException);
        expect(clinicRepository.save).not.toHaveBeenCalled();
    });
});
