import {Controller, Get, Param, Query} from '@nestjs/common';
import {ApiTags} from '@nestjs/swagger';
import {Actor} from '../../../domain/@shared/actor';
import {AppointmentPaymentStatus, PaymentMethod} from '../../../domain/appointment-payment/entities';
import {FinancialReportPermission} from '../../../domain/auth';
import {Authorize} from '../../@shared/auth';
import {RequestActor} from '../../@shared/auth/request-actor.decorator';
import {ApiOperation} from '../../@shared/openapi/decorators';
import {entityIdParam} from '../../@shared/openapi/params';
import {RevenueReportDto, RevenueSummaryReportDto} from '../dtos/financial-report.dto';
import {FinancialReportService} from '../financial-report.service';

@ApiTags('Financial Report')
@Controller('clinics/:clinicId/financial')
export class FinancialReportController {
    constructor(private readonly financialReportService: FinancialReportService) {}

    @ApiOperation({
        summary: 'Get revenue report for a clinic',
        parameters: [entityIdParam('Clinic ID', 'clinicId')],
        queries: [
            {name: 'startDate', required: true, description: 'Start date ISO8601', schema: {type: 'string', format: 'date-time'}},
            {name: 'endDate', required: true, description: 'End date ISO8601', schema: {type: 'string', format: 'date-time'}},
            {name: 'professionalMemberId', required: false, description: 'Filter by professional member ID', schema: {type: 'string', format: 'uuid'}},
            {name: 'paymentMethod', required: false, description: 'Filter by payment method', schema: {type: 'string', enum: Object.values(PaymentMethod)}},
            {name: 'status', required: false, description: 'Filter by payment status', schema: {type: 'string', enum: Object.values(AppointmentPaymentStatus)}},
            {name: 'page', required: false, description: 'Page number (default 1)', schema: {type: 'integer'}},
            {name: 'pageSize', required: false, description: 'Page size (default 50)', schema: {type: 'integer'}},
        ],
        responses: [
            {status: 200, description: 'Revenue report', type: RevenueReportDto},
            {status: 400, description: 'Invalid date range'},
            {status: 404, description: 'Clinic not found'},
        ],
    })
    @Authorize(FinancialReportPermission.VIEW)
    @Get('report')
    async getRevenueReport(
        @RequestActor() actor: Actor,
        @Param('clinicId') clinicId: string,
        @Query('startDate') startDate: string,
        @Query('endDate') endDate: string,
        @Query('professionalMemberId') professionalMemberId?: string,
        @Query('paymentMethod') paymentMethod?: string,
        @Query('status') status?: string,
        @Query('page') page?: string,
        @Query('pageSize') pageSize?: string,
    ): Promise<RevenueReportDto> {
        const report = await this.financialReportService.getRevenueReport(
            clinicId,
            actor.clinicMemberId.toString(),
            {
                startDate: new Date(startDate),
                endDate: new Date(endDate),
                professionalMemberId: professionalMemberId ?? undefined,
                paymentMethod: paymentMethod as PaymentMethod | undefined,
                status: status as AppointmentPaymentStatus | undefined,
                page: page ? parseInt(page, 10) : 1,
                pageSize: pageSize ? parseInt(pageSize, 10) : 50,
            },
        );

        return new RevenueReportDto(report);
    }

    @ApiOperation({
        summary: 'Get revenue summary for a clinic (dashboard)',
        parameters: [entityIdParam('Clinic ID', 'clinicId')],
        queries: [
            {name: 'startDate', required: true, description: 'Start date ISO8601', schema: {type: 'string', format: 'date-time'}},
            {name: 'endDate', required: true, description: 'End date ISO8601', schema: {type: 'string', format: 'date-time'}},
            {name: 'professionalMemberId', required: false, description: 'Filter by professional member ID', schema: {type: 'string', format: 'uuid'}},
            {name: 'paymentMethod', required: false, description: 'Filter by payment method', schema: {type: 'string', enum: Object.values(PaymentMethod)}},
            {name: 'status', required: false, description: 'Filter by payment status', schema: {type: 'string', enum: Object.values(AppointmentPaymentStatus)}},
        ],
        responses: [
            {status: 200, description: 'Revenue summary', type: RevenueSummaryReportDto},
            {status: 400, description: 'Invalid date range'},
            {status: 404, description: 'Clinic not found'},
        ],
    })
    @Authorize(FinancialReportPermission.VIEW)
    @Get('summary')
    async getRevenueSummary(
        @RequestActor() actor: Actor,
        @Param('clinicId') clinicId: string,
        @Query('startDate') startDate: string,
        @Query('endDate') endDate: string,
        @Query('professionalMemberId') professionalMemberId?: string,
        @Query('paymentMethod') paymentMethod?: string,
        @Query('status') status?: string,
    ): Promise<RevenueSummaryReportDto> {
        const report = await this.financialReportService.getRevenueSummary(
            clinicId,
            actor.clinicMemberId.toString(),
            {
                startDate: new Date(startDate),
                endDate: new Date(endDate),
                professionalMemberId: professionalMemberId ?? undefined,
                paymentMethod: paymentMethod as PaymentMethod | undefined,
                status: status as AppointmentPaymentStatus | undefined,
            },
        );

        return new RevenueSummaryReportDto(report);
    }
}
