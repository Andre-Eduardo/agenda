import {Injectable} from '@nestjs/common';
import {ApplicationService, Command} from '@application/@shared/application.service';
import {ClinicDto} from '@application/clinic/dtos';
import {OnboardSoloDto, SoloOnboardingDto} from '@application/onboarding/dtos';
import type {PlanCode} from '@application/subscription/subscription-plans.config';
import {SubscriptionService} from '@application/subscription/subscription.service';
import {UserDto} from '@application/user/dtos';
import {assertSelfSignUpAllowed} from '@application/user/services/sign-up-user.service';
import type {Actor, UnauthenticatedActor} from '@domain/@shared/actor';
import {PreconditionException} from '@domain/@shared/exceptions';
import {Transactional} from '@domain/@shared/repository';
import {Phone} from '@domain/@shared/value-objects';
import {ClinicMemberRepository} from '@domain/clinic-member/clinic-member.repository';
import {ClinicMember, ClinicMemberRole} from '@domain/clinic-member/entities';
import {ClinicRepository} from '@domain/clinic/clinic.repository';
import {Clinic, ClinicAccountType} from '@domain/clinic/entities';
import {EventDispatcher} from '@domain/event';
import {Professional} from '@domain/professional/entities';
import {ProfessionalRepository} from '@domain/professional/professional.repository';
import {User} from '@domain/user/entities';
import {DuplicateEmailException, DuplicateUsernameException} from '@domain/user/user.exceptions';
import {UserRepository} from '@domain/user/user.repository';
import {EnvConfigService} from '@infrastructure/config';

/** Versão dos termos de uso aceitos no cadastro do autônomo (ver /legal/terms). */
export const SOLO_TERMS_VERSION = '0.2-2026-11-27';

/** Plano inicial do autônomo; a cobrança é ativada depois pelo gateway (Asaas). */
export const SOLO_INITIAL_PLAN: PlanCode = 'STARTER';

/**
 * Cadastro self-service do profissional autônomo, numa transação só: usuário (OWNER),
 * conta SOLO, membro OWNER + PROFESSIONAL, registro profissional e assinatura inicial.
 * Antes eram 4 chamadas (sign-up, clinics, clinic-members, professionals).
 */
@Injectable()
export class OnboardSoloService implements ApplicationService<OnboardSoloDto, SoloOnboardingDto, UnauthenticatedActor> {
    constructor(
        private readonly userRepository: UserRepository,
        private readonly clinicRepository: ClinicRepository,
        private readonly clinicMemberRepository: ClinicMemberRepository,
        private readonly professionalRepository: ProfessionalRepository,
        private readonly subscriptionService: SubscriptionService,
        private readonly eventDispatcher: EventDispatcher,
        private readonly config: EnvConfigService
    ) {}

    @Transactional()
    async execute({actor, payload}: Command<OnboardSoloDto, UnauthenticatedActor>): Promise<SoloOnboardingDto> {
        const {soloMode, inviteCode} = this.config.signUp;

        assertSelfSignUpAllowed(soloMode, inviteCode, payload.inviteCode ?? null);

        const user = await User.signUp({
            name: payload.name,
            username: payload.username,
            email: payload.email,
            password: payload.password,
        });

        await this.saveUser(user);

        const now = new Date();
        const clinic = Clinic.create({
            name: payload.clinicName ?? `Consultório de ${payload.name}`,
            createdByUserId: user.id,
            phone: payload.phone ? Phone.create(payload.phone) : null,
            email: user.email,
            accountType: ClinicAccountType.SOLO,
            receptionEnabled: false,
            roomManagementEnabled: false,
            clinicSpecialties: payload.specialtyNormalized ? [payload.specialtyNormalized] : [],
            termsAcceptedAt: now,
            termsVersion: SOLO_TERMS_VERSION,
        });

        await this.clinicRepository.save(clinic);

        const member = ClinicMember.create({
            clinicId: clinic.id,
            userId: user.id,
            roles: [ClinicMemberRole.OWNER, ClinicMemberRole.PROFESSIONAL],
            displayName: payload.name,
            isActive: true,
        });

        await this.clinicMemberRepository.save(member);

        const professional = Professional.create({
            clinicMemberId: member.id,
            registrationNumber: payload.registrationNumber ?? null,
            specialty: payload.specialty ?? null,
            specialtyNormalized: payload.specialtyNormalized ?? null,
        });

        await this.professionalRepository.save(professional);
        await this.subscriptionService.createSubscription(
            member.id.toString(),
            clinic.id.toString(),
            SOLO_INITIAL_PLAN
        );

        const inside: Actor = {...actor, userId: user.id, clinicId: clinic.id, clinicMemberId: member.id};

        this.eventDispatcher.dispatch({...actor, userId: user.id}, user);
        this.eventDispatcher.dispatch(inside, clinic);
        this.eventDispatcher.dispatch(inside, member);
        this.eventDispatcher.dispatch(inside, professional);

        return new SoloOnboardingDto({
            user: new UserDto(user),
            clinic: new ClinicDto(clinic),
            clinicMemberId: member.id.toString(),
            professionalId: professional.id.toString(),
        });
    }

    private async saveUser(user: User): Promise<void> {
        try {
            await this.userRepository.save(user);
        } catch (error) {
            if (error instanceof DuplicateUsernameException) {
                throw new PreconditionException('Cannot create a user with a username already in use.');
            }

            if (error instanceof DuplicateEmailException) {
                throw new PreconditionException('Cannot create a user with an email already in use.');
            }

            throw error;
        }
    }
}
