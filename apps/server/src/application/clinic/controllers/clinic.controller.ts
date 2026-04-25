import {Body, Controller, Get, Post} from '@nestjs/common';
import {ApiTags} from '@nestjs/swagger';
import {z} from 'zod';
import {Actor} from '../../../domain/@shared/actor';
import {ClinicId} from '../../../domain/clinic/entities';
import {BypassClinicMember} from '../../@shared/auth/bypass-clinic-member.decorator';
import {RequestActor} from '../../@shared/auth/request-actor.decorator';
import {ApiOperation} from '../../@shared/openapi/decorators';
import {entityIdParam} from '../../@shared/openapi/params';
import {ValidatedParam} from '../../@shared/validation';
import {ClinicDto, CreateClinicDto} from '../dtos';
import {CreateClinicService, GetClinicService} from '../services';

@ApiTags('Clinic')
@Controller('clinics')
export class ClinicController {
    constructor(
        private readonly createClinicService: CreateClinicService,
        private readonly getClinicService: GetClinicService,
    ) {}

    @ApiOperation({
        summary: 'Creates a new clinic',
        responses: [{status: 201, description: 'Clinic created', type: ClinicDto}],
    })
    @BypassClinicMember()
    @Post()
    async createClinic(@RequestActor() actor: Actor, @Body() payload: CreateClinicDto): Promise<ClinicDto> {
        return this.createClinicService.execute({actor, payload});
    }

    @ApiOperation({
        summary: 'Get clinic by id',
        parameters: [entityIdParam('Clinic ID', 'clinicId')],
        responses: [{status: 200, description: 'Clinic', type: ClinicDto}],
    })
    @Get(':clinicId')
    async getClinic(
        @RequestActor() actor: Actor,
        @ValidatedParam('clinicId', z.string().uuid().transform((v) => ClinicId.from(v)))
        clinicId: ClinicId,
    ): Promise<ClinicDto> {
        return this.getClinicService.execute({actor, payload: {clinicId}});
    }
}
