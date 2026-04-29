import { ApiProperty, ApiSchema } from "@nestjs/swagger";
import type {
  MemberCostReport,
  ClinicCostReport,
  ModelBreakdownEntry,
} from "@application/billing/billing-report.service";
import { PLAN_LIMITS } from "@application/subscription/subscription-plans.config";

@ApiSchema({ name: "ModelBreakdownEntry" })
export class ModelBreakdownEntryDto {
  @ApiProperty()
  modelId!: string;

  @ApiProperty()
  messages!: number;

  @ApiProperty()
  costUsd!: number;

  constructor(data: ModelBreakdownEntry) {
    this.modelId = data.modelId;
    this.messages = data.messages;
    this.costUsd = data.costUsd;
  }
}

@ApiSchema({ name: "MemberBillingReport" })
export class MemberBillingReportDto {
  @ApiProperty({ format: "uuid" })
  memberId!: string;

  @ApiProperty()
  displayName!: string;

  @ApiProperty({ enum: Object.keys(PLAN_LIMITS) })
  planCode!: string;

  @ApiProperty()
  planPriceBrl!: number;

  @ApiProperty()
  periodYear!: number;

  @ApiProperty()
  periodMonth!: number;

  @ApiProperty({ description: "Docs uploaded in the period" })
  docsCount!: number;

  @ApiProperty({ description: "Chat messages (usage record counter)" })
  chatMessages!: number;

  @ApiProperty({ description: "Clinical images in the period" })
  imagesCount!: number;

  @ApiProperty({ description: "Total AI cost in USD" })
  totalAiCostUsd!: number;

  @ApiProperty({ description: "Total AI cost in BRL" })
  totalAiCostBrl!: number;

  @ApiProperty({ description: "Number of completed chat interactions with AI" })
  aiInteractionCount!: number;

  @ApiProperty({ description: "Average cost per message in USD" })
  avgCostPerMessageUsd!: number;

  @ApiProperty({ type: [ModelBreakdownEntryDto] })
  modelBreakdown!: ModelBreakdownEntryDto[];

  @ApiProperty({ description: "Monthly plan revenue in BRL" })
  planRevenueBrl!: number;

  @ApiProperty({ description: "Total cost in BRL (AI + future add-ons)" })
  totalCostBrl!: number;

  @ApiProperty({ description: "Gross margin in BRL" })
  grossMarginBrl!: number;

  @ApiProperty({ description: "Gross margin percent" })
  grossMarginPercent!: number;

  constructor(report: MemberCostReport) {
    this.memberId = report.member.id;
    this.displayName = report.member.displayName;
    this.planCode = report.member.planCode;
    this.planPriceBrl = report.member.planPriceBrl;
    this.periodYear = report.period.year;
    this.periodMonth = report.period.month;
    this.docsCount = report.usage.docs.count;
    this.chatMessages = report.usage.chat.messages;
    this.imagesCount = report.usage.images.count;
    this.totalAiCostUsd = report.aiCost.totalCostUsd;
    this.totalAiCostBrl = report.aiCost.totalCostBrl;
    this.aiInteractionCount = report.aiCost.interactionCount;
    this.avgCostPerMessageUsd = report.aiCost.avgCostPerMessageUsd;
    this.modelBreakdown = report.aiCost.modelBreakdown.map((e) => new ModelBreakdownEntryDto(e));
    this.planRevenueBrl = report.revenue.planRevenueBrl;
    this.totalCostBrl = report.margin.totalCostBrl;
    this.grossMarginBrl = report.margin.grossMarginBrl;
    this.grossMarginPercent = report.margin.grossMarginPercent;
  }
}

@ApiSchema({ name: "ClinicBillingReportMostExpensive" })
export class MostExpensiveMemberDto {
  @ApiProperty({ format: "uuid" })
  memberId!: string;

  @ApiProperty()
  displayName!: string;

  @ApiProperty()
  aiCostUsd!: number;
}

@ApiSchema({ name: "ClinicBillingReportMostActive" })
export class MostActiveMemberDto {
  @ApiProperty({ format: "uuid" })
  memberId!: string;

  @ApiProperty()
  displayName!: string;

  @ApiProperty()
  messages!: number;
}

@ApiSchema({ name: "ClinicBillingReportSummary" })
export class ClinicBillingReportSummaryDto {
  @ApiProperty()
  totalMembers!: number;

  @ApiProperty()
  totalRevenueBrl!: number;

  @ApiProperty()
  totalAiCostUsd!: number;

  @ApiProperty()
  totalAiCostBrl!: number;

  @ApiProperty()
  avgMarginPercent!: number;

  @ApiProperty({ type: MostExpensiveMemberDto, nullable: true })
  mostExpensiveMember!: MostExpensiveMemberDto | null;

  @ApiProperty({ type: MostActiveMemberDto, nullable: true })
  mostActiveByChat!: MostActiveMemberDto | null;
}

@ApiSchema({ name: "ClinicBillingReport" })
export class ClinicBillingReportDto {
  @ApiProperty({ format: "uuid" })
  clinicId!: string;

  @ApiProperty()
  clinicName!: string;

  @ApiProperty()
  periodYear!: number;

  @ApiProperty()
  periodMonth!: number;

  @ApiProperty({ type: [MemberBillingReportDto] })
  members!: MemberBillingReportDto[];

  @ApiProperty({ type: ClinicBillingReportSummaryDto })
  summary!: ClinicBillingReportSummaryDto;

  constructor(report: ClinicCostReport) {
    this.clinicId = report.clinic.id;
    this.clinicName = report.clinic.name;
    this.periodYear = report.period.year;
    this.periodMonth = report.period.month;
    this.members = report.members.map((m) => new MemberBillingReportDto(m));
    this.summary = {
      totalMembers: report.summary.totalMembers,
      totalRevenueBrl: report.summary.totalRevenueBrl,
      totalAiCostUsd: report.summary.totalAiCostUsd,
      totalAiCostBrl: report.summary.totalAiCostBrl,
      avgMarginPercent: report.summary.avgMarginPercent,
      mostExpensiveMember: report.summary.mostExpensiveMember,
      mostActiveByChat: report.summary.mostActiveByChat,
    };
  }
}
