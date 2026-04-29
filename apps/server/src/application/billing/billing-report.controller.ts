import { Controller, Get, Param, Query } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { Actor } from "@domain/@shared/actor";
import { BillingPermission } from "@domain/auth";
import { Authorize } from "@application/@shared/auth";
import { RequestActor } from "@application/@shared/auth/request-actor.decorator";
import { ApiOperation } from "@application/@shared/openapi/decorators";
import { entityIdParam } from "@application/@shared/openapi/params";
import { BillingReportService } from "@application/billing/billing-report.service";
import {
  ClinicBillingReportDto,
  MemberBillingReportDto,
} from "@application/billing/dto/billing-report.dto";

@ApiTags("Billing")
@Controller("")
export class BillingReportController {
  constructor(private readonly billingReportService: BillingReportService) {}

  @ApiOperation({
    summary: "Get billing cost report for a professional member",
    parameters: [entityIdParam("Member ID", "memberId")],
    queries: [
      {
        name: "year",
        required: true,
        description: "Year (e.g. 2026)",
        schema: { type: "integer" },
      },
      { name: "month", required: true, description: "Month 1-12", schema: { type: "integer" } },
    ],
    responses: [
      { status: 200, description: "Billing report", type: MemberBillingReportDto },
      { status: 400, description: "Invalid or future period" },
      { status: 403, description: "Not authorized to view this report" },
      { status: 404, description: "Member or subscription not found" },
    ],
  })
  @Get("members/:memberId/billing-report")
  async getMemberBillingReport(
    @RequestActor() actor: Actor,
    @Param("memberId") memberId: string,
    @Query("year") rawYear: string,
    @Query("month") rawMonth: string,
  ): Promise<MemberBillingReportDto> {
    this.billingReportService.validateSelfOrThrow(actor.clinicMemberId.toString(), memberId);

    const year = parseInt(rawYear, 10);
    const month = parseInt(rawMonth, 10);

    const report = await this.billingReportService.getMemberCostReport(
      memberId,
      actor.clinicId.toString(),
      year,
      month,
    );

    return new MemberBillingReportDto(report);
  }

  @ApiOperation({
    summary:
      "Get aggregated billing cost report for all professionals in a clinic (admin/owner only)",
    parameters: [entityIdParam("Clinic ID", "clinicId")],
    queries: [
      {
        name: "year",
        required: true,
        description: "Year (e.g. 2026)",
        schema: { type: "integer" },
      },
      { name: "month", required: true, description: "Month 1-12", schema: { type: "integer" } },
    ],
    responses: [
      { status: 200, description: "Clinic billing report", type: ClinicBillingReportDto },
      { status: 400, description: "Invalid or future period" },
      { status: 403, description: "Not authorized to view clinic billing data" },
      { status: 404, description: "Clinic not found" },
    ],
  })
  @Authorize(BillingPermission.VIEW_CLINIC)
  @Get("clinics/:clinicId/billing-report")
  async getClinicBillingReport(
    @RequestActor() _actor: Actor,
    @Param("clinicId") clinicId: string,
    @Query("year") rawYear: string,
    @Query("month") rawMonth: string,
  ): Promise<ClinicBillingReportDto> {
    const year = parseInt(rawYear, 10);
    const month = parseInt(rawMonth, 10);

    const report = await this.billingReportService.getClinicCostReport(clinicId, year, month);

    return new ClinicBillingReportDto(report);
  }
}
