import {Injectable} from '@nestjs/common';
import {Professional, ProfessionalConfig} from '../../../domain/professional/entities';
import {ProfessionalRepository} from '../../../domain/professional/professional.repository';
import {PersonRepository} from '../../../domain/person/person.repository';
import {PersonProfile, PersonType} from '../../../domain/person/entities';
import {EventDispatcher} from '../../../domain/event';
import {PrismaProvider} from '../../../infrastructure/repository/prisma/prisma.provider';
import {ApplicationService, Command} from '../../@shared/application.service';
import {CreateProfessionalDto, ProfessionalDto} from '../dtos';

@Injectable()
export class CreateProfessionalService implements ApplicationService<CreateProfessionalDto, ProfessionalDto> {
    constructor(
        private readonly professionalRepository: ProfessionalRepository,
        private readonly personRepository: PersonRepository,
        private readonly prismaProvider: PrismaProvider,
        private readonly eventDispatcher: EventDispatcher
    ) {}

    async execute({actor, payload}: Command<CreateProfessionalDto>): Promise<ProfessionalDto> {
        const config = ProfessionalConfig.create({color: payload.color ?? null});

        const professional = Professional.create({
            name: payload.name,
            documentId: payload.documentId,
            phone: payload.phone ?? null,
            gender: payload.gender ?? null,
            personType: payload.personType ?? PersonType.NATURAL,
            profiles: new Set([PersonProfile.PROFESSIONAL]),
            specialty: payload.specialty,
            configId: config.id,
            userId: payload.userId ?? null,
        });

        await this.prismaProvider.client.professionalConfig.create({
            data: {
                id: config.id.toString(),
                color: config.color,
                createdAt: config.createdAt,
                updatedAt: config.updatedAt,
                deletedAt: config.deletedAt ?? null,
            },
        });

        await this.personRepository.save(professional as any);
        await this.professionalRepository.save(professional);

        this.eventDispatcher.dispatch(actor, professional);

        return new ProfessionalDto(professional);
    }
}
