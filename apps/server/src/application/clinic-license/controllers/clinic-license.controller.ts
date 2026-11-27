import {Body, Controller, Get, Patch, Put, Query} from '@nestjs/common';
import {ApiTags} from '@nestjs/swagger';
import {z} from 'zod';
import {Authorize} from '@application/@shared/auth';
import {BypassClinicMember} from '@application/@shared/auth/bypass-clinic-member.decorator';
import {RequestActor} from '@application/@shared/auth/request-actor.decorator';
import {PaginatedDto} from '@application/@shared/dto';
import {ApiOperation} from '@application/@shared/openapi/decorators';
import {entityIdParam} from '@application/@shared/openapi/params';
import {ValidatedParam, ZodValidationPipe} from '@application/@shared/validation';
import {
    ClinicLicenseDto,
    ConfigureClinicLicenseInputDto,
    MemberModulesDto,
    SetModuleMembersInputDto,
} from '@application/clinic-license/dtos';
import {
    ConfigureClinicLicenseService,
    GetClinicLicenseService,
    GetMyModulesService,
    SetModuleMembersService,
} from '@application/clinic-license/services';
import {ClinicDto, SearchClinicsDto, searchClinicsSchema} from '@application/clinic/dtos';
import {SearchClinicsService} from '@application/clinic/services';
import {Actor, MaybeAuthenticatedActor} from '@domain/@shared/actor';
import {ClinicLicensePermission, ClinicModulePermission, SupportAccessPermission, UserPermission} from '@domain/auth';
import {ModuleType} from '@domain/clinic-license/models';
import {ClinicId} from '@domain/clinic/entities';

const clinicIdSchema = z
    .string()
    .uuid()
    .transform((value) => ClinicId.from(value));

@ApiTags('ClinicLicense')
@Controller()
export class ClinicLicenseController {
    constructor(
        private readonly getClinicLicenseService: GetClinicLicenseService,
        private readonly configureClinicLicenseService: ConfigureClinicLicenseService,
        private readonly setModuleMembersService: SetModuleMembersService,
        private readonly getMyModulesService: GetMyModulesService,
        private readonly searchClinicsService: SearchClinicsService
    ) {}

    @ApiOperation({
        summary: 'Lists and searches clinics (platform admin)',
        description: 'Feeds the AI module management panel: every clinic, independent of any active license.',
        responses: [{status: 200, description: 'Clinics list'}],
    })
    @BypassClinicMember()
    // Support users list every clinic too, to pick which one to enter.
    @Authorize(ClinicLicensePermission.MANAGE, SupportAccessPermission.ENTER)
    @Get('admin/clinics')
    searchClinics(
        @RequestActor() actor: MaybeAuthenticatedActor,
        @Query(new ZodValidationPipe(searchClinicsSchema)) query: SearchClinicsDto
    ): Promise<PaginatedDto<ClinicDto>> {
        return this.searchClinicsService.execute({actor, payload: query});
    }

    @ApiOperation({
        summary: 'Gets the license of the current clinic',
        description: 'Professionals covered by the plan, contracted AI modules, their seats and assigned members.',
        responses: [{status: 200, description: 'Clinic license', type: ClinicLicenseDto}],
    })
    @Authorize(ClinicModulePermission.VIEW)
    @Get('clinics/me/license')
    getCurrentLicense(@RequestActor() actor: Actor): Promise<ClinicLicenseDto> {
        return this.getClinicLicenseService.execute({actor, payload: {clinicId: actor.clinicId}});
    }

    @ApiOperation({
        summary: 'Sets which members use an AI module',
        description:
            'Replaces the members of the module. Above the contracted seats it answers 409 ' +
            'EXTRA_SEAT_CONFIRMATION_REQUIRED until acceptExtraCharge is true; above the plan ceiling, 409 SEAT_LIMIT_REACHED.',
        parameters: [{name: 'moduleType', required: true, enum: ModuleType, enumName: 'ModuleType'}],
        responses: [
            {status: 200, description: 'Updated license', type: ClinicLicenseDto},
            {status: 403, description: 'Module not contracted by the clinic'},
            {status: 409, description: 'Extra charge confirmation required or seat limit reached'},
        ],
    })
    @Authorize(ClinicModulePermission.ASSIGN)
    @Put('clinics/me/modules/:moduleType/members')
    setModuleMembers(
        @RequestActor() actor: Actor,
        @ValidatedParam('moduleType', z.nativeEnum(ModuleType)) moduleType: ModuleType,
        @Body() payload: SetModuleMembersInputDto
    ): Promise<ClinicLicenseDto> {
        return this.setModuleMembersService.execute({actor, payload: {...payload, moduleType}});
    }

    @ApiOperation({
        summary: 'Lists the AI modules, clinic modules and account type of the current member',
        responses: [{status: 200, description: 'Modules of the current member', type: MemberModulesDto}],
    })
    @Authorize(UserPermission.VIEW_PROFILE)
    @Get('clinic-members/me/modules')
    getMyModules(@RequestActor() actor: Actor): Promise<MemberModulesDto> {
        return this.getMyModulesService.execute({actor, payload: undefined});
    }

    @ApiOperation({
        summary: 'Gets the license of a clinic (platform admin)',
        parameters: [entityIdParam('Clinic ID', 'clinicId')],
        responses: [{status: 200, description: 'Clinic license', type: ClinicLicenseDto}],
    })
    @BypassClinicMember()
    @Authorize(ClinicLicensePermission.MANAGE)
    @Get('admin/clinics/:clinicId/license')
    getClinicLicense(
        @RequestActor() actor: MaybeAuthenticatedActor,
        @ValidatedParam('clinicId', clinicIdSchema) clinicId: ClinicId
    ): Promise<ClinicLicenseDto> {
        return this.getClinicLicenseService.execute({actor, payload: {clinicId}});
    }

    @ApiOperation({
        summary: 'Configures the plan limits and AI modules of a clinic (platform admin)',
        description: 'Modules left out are disabled together with their member assignments.',
        parameters: [entityIdParam('Clinic ID', 'clinicId')],
        responses: [{status: 200, description: 'Updated license', type: ClinicLicenseDto}],
    })
    @BypassClinicMember()
    @Authorize(ClinicLicensePermission.MANAGE)
    @Patch('admin/clinics/:clinicId/license')
    configureClinicLicense(
        @RequestActor() actor: MaybeAuthenticatedActor,
        @ValidatedParam('clinicId', clinicIdSchema) clinicId: ClinicId,
        @Body() payload: ConfigureClinicLicenseInputDto
    ): Promise<ClinicLicenseDto> {
        return this.configureClinicLicenseService.execute({actor, payload: {...payload, clinicId}});
    }
}
