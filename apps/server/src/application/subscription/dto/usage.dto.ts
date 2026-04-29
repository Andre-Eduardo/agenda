import { ApiProperty, ApiSchema } from "@nestjs/swagger";
import type {
  AddonDetail,
  ClinicMemberUsageEntry,
  CurrentUsageResult,
  MetricStatus,
  UsageAlert,
} from "@application/subscription/subscription.service";
import { PLAN_LIMITS } from "@application/subscription/subscription-plans.config";

export class UsageMetricDto {
  @ApiProperty()
  used: number;

  @ApiProperty({ nullable: true, description: "null = unlimited" })
  limit: number | null;

  @ApiProperty({ description: "Percentage of limit used (0–100). 0 when limit is null." })
  percent: number;

  @ApiProperty({ nullable: true, description: "null = unlimited" })
  remaining: number | null;

  @ApiProperty({ enum: ["OK", "WARNING", "EXCEEDED", "NOT_INCLUDED"] })
  status: MetricStatus;

  constructor(props: Omit<UsageMetricDto, never>) {
    this.used = props.used;
    this.limit = props.limit;
    this.percent = props.percent;
    this.remaining = props.remaining;
    this.status = props.status;
  }
}

export class UsageAlertDto {
  @ApiProperty()
  metric: string;

  @ApiProperty({ enum: ["WARNING", "EXCEEDED"] })
  type: "WARNING" | "EXCEEDED";

  @ApiProperty()
  message: string;

  constructor(props: UsageAlert) {
    this.metric = props.metric;
    this.type = props.type;
    this.message = props.message;
  }
}

export class UsagePeriodDto {
  @ApiProperty()
  year: number;

  @ApiProperty()
  month: number;

  constructor(props: UsagePeriodDto) {
    this.year = props.year;
    this.month = props.month;
  }
}

export class UsageBreakdownDto {
  @ApiProperty({ type: UsageMetricDto })
  docs: UsageMetricDto;

  @ApiProperty({ type: UsageMetricDto })
  chat: UsageMetricDto;

  @ApiProperty({ type: UsageMetricDto })
  images: UsageMetricDto;

  @ApiProperty({ type: UsageMetricDto })
  storageHotGb: UsageMetricDto;

  constructor(props: UsageBreakdownDto) {
    this.docs = props.docs;
    this.chat = props.chat;
    this.images = props.images;
    this.storageHotGb = props.storageHotGb;
  }
}

export class SubscriptionInfoDto {
  @ApiProperty()
  status: string;

  @ApiProperty({ format: "date-time" })
  currentPeriodStart: string;

  @ApiProperty({ format: "date-time" })
  currentPeriodEnd: string;

  constructor(props: SubscriptionInfoDto) {
    this.status = props.status;
    this.currentPeriodStart = props.currentPeriodStart;
    this.currentPeriodEnd = props.currentPeriodEnd;
  }
}

export class AddonGrantsTotalsDto {
  @ApiProperty({ required: false, nullable: true })
  docsPerMonth?: number;

  @ApiProperty({ required: false, nullable: true })
  chatMessagesPerMonth?: number;

  @ApiProperty({ required: false, nullable: true })
  clinicalImagesPerMonth?: number;

  @ApiProperty({ required: false, nullable: true })
  storageHotGb?: number;

  constructor(grants: AddonGrantsTotalsDto) {
    this.docsPerMonth = grants.docsPerMonth;
    this.chatMessagesPerMonth = grants.chatMessagesPerMonth;
    this.clinicalImagesPerMonth = grants.clinicalImagesPerMonth;
    this.storageHotGb = grants.storageHotGb;
  }
}

export class ActiveAddonDto {
  @ApiProperty()
  code: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  quantity: number;

  @ApiProperty({ type: AddonGrantsTotalsDto })
  grantsTotal: AddonGrantsTotalsDto;

  @ApiProperty({ format: "date-time" })
  expiresAt: string;

  constructor(detail: AddonDetail) {
    this.code = detail.code;
    this.name = detail.name;
    this.quantity = detail.quantity;
    this.grantsTotal = new AddonGrantsTotalsDto(detail.grantsTotal);
    this.expiresAt = detail.expiresAt;
  }
}

@ApiSchema({ name: "CurrentUsage" })
export class CurrentUsageDto {
  @ApiProperty({ enum: Object.keys(PLAN_LIMITS) })
  planCode: string;

  @ApiProperty()
  planName: string;

  @ApiProperty({ type: UsagePeriodDto })
  period: UsagePeriodDto;

  @ApiProperty({ format: "date-time", description: "ISO timestamp of the next monthly reset" })
  resetAt: string;

  @ApiProperty({ type: UsageBreakdownDto })
  usage: UsageBreakdownDto;

  @ApiProperty()
  isAnyLimitReached: boolean;

  @ApiProperty({ description: "Percentage threshold at which warnings are shown (default: 80)" })
  warningThreshold: number;

  @ApiProperty({ type: [String], description: "Metrics that have reached their limit" })
  limitsReached: string[];

  @ApiProperty({ type: [UsageAlertDto] })
  alerts: UsageAlertDto[];

  @ApiProperty({ type: [ActiveAddonDto] })
  addons: ActiveAddonDto[];

  @ApiProperty({ type: SubscriptionInfoDto })
  subscription: SubscriptionInfoDto;

  constructor(result: CurrentUsageResult) {
    this.planCode = result.planCode;
    this.planName = result.planName;
    this.period = new UsagePeriodDto(result.period);
    this.resetAt = result.resetAt;
    this.usage = new UsageBreakdownDto({
      docs: new UsageMetricDto(result.usage.docs),
      chat: new UsageMetricDto(result.usage.chat),
      images: new UsageMetricDto(result.usage.images),
      storageHotGb: new UsageMetricDto(result.usage.storageHotGb),
    });
    this.isAnyLimitReached = result.isAnyLimitReached;
    this.warningThreshold = result.warningThreshold;
    this.limitsReached = result.limitsReached;
    this.alerts = result.alerts.map((a) => new UsageAlertDto(a));
    this.addons = result.addons.map((a) => new ActiveAddonDto(a));
    this.subscription = new SubscriptionInfoDto(result.subscription);
  }
}

export class MemberUsageSummaryItemDto {
  @ApiProperty({ format: "uuid" })
  memberId: string;

  @ApiProperty()
  displayName: string;

  @ApiProperty({ enum: Object.keys(PLAN_LIMITS) })
  planCode: string;

  @ApiProperty({ type: UsageBreakdownDto })
  usage: UsageBreakdownDto;

  @ApiProperty()
  hasAnyWarning: boolean;

  @ApiProperty()
  hasAnyExceeded: boolean;

  constructor(entry: ClinicMemberUsageEntry) {
    this.memberId = entry.memberId;
    this.displayName = entry.displayName;
    this.planCode = entry.planCode;
    this.usage = new UsageBreakdownDto({
      docs: new UsageMetricDto(entry.usage.usage.docs),
      chat: new UsageMetricDto(entry.usage.usage.chat),
      images: new UsageMetricDto(entry.usage.usage.images),
      storageHotGb: new UsageMetricDto(entry.usage.usage.storageHotGb),
    });
    const statuses = [
      entry.usage.usage.docs.status,
      entry.usage.usage.chat.status,
      entry.usage.usage.images.status,
      entry.usage.usage.storageHotGb.status,
    ];

    this.hasAnyWarning = statuses.includes("WARNING");
    this.hasAnyExceeded = statuses.includes("EXCEEDED");
  }
}

export class ClinicMembersUsageSummaryDto {
  @ApiProperty({ type: UsagePeriodDto })
  period: UsagePeriodDto;

  @ApiProperty({ type: [MemberUsageSummaryItemDto] })
  members: MemberUsageSummaryItemDto[];

  @ApiProperty()
  summary: { totalMembers: number; membersWithWarning: number; membersExceeded: number };

  constructor(period: { year: number; month: number }, entries: ClinicMemberUsageEntry[]) {
    this.period = new UsagePeriodDto(period);
    this.members = entries.map((e) => new MemberUsageSummaryItemDto(e));
    this.summary = {
      totalMembers: entries.length,
      membersWithWarning: this.members.filter((m) => m.hasAnyWarning).length,
      membersExceeded: this.members.filter((m) => m.hasAnyExceeded).length,
    };
  }
}

/** @deprecated Use MemberUsageSummaryItemDto — kept for backward compatibility with old /clinics/:id/usage */
@ApiSchema({ name: "MemberUsageSummary" })
export class MemberUsageSummaryDto {
  @ApiProperty({ format: "uuid" })
  memberId: string;

  @ApiProperty({ type: CurrentUsageDto })
  usage: CurrentUsageDto;

  constructor(memberId: string, result: CurrentUsageResult) {
    this.memberId = memberId;
    this.usage = new CurrentUsageDto(result);
  }
}
