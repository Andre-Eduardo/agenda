import { ApiProperty, ApiSchema } from "@nestjs/swagger";
import type { PlanCode } from "@application/subscription/subscription-plans.config";
import { PLAN_LIMITS } from "@application/subscription/subscription-plans.config";

export type SubscriptionStatus = "ACTIVE" | "SUSPENDED" | "CANCELLED" | "TRIAL";

type RawSubscription = {
  id: string;
  memberId: string;
  clinicId: string;
  planCode: string;
  status: string;
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  previousPlanCode: string | null;
  planChangedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

@ApiSchema({ name: "ProfessionalSubscription" })
export class SubscriptionDto {
  @ApiProperty({ format: "uuid" })
  id: string;

  @ApiProperty({ format: "uuid" })
  memberId: string;

  @ApiProperty({ format: "uuid" })
  clinicId: string;

  @ApiProperty({ enum: Object.keys(PLAN_LIMITS) })
  planCode: PlanCode;

  @ApiProperty({ enum: ["ACTIVE", "SUSPENDED", "CANCELLED", "TRIAL"] })
  status: SubscriptionStatus;

  @ApiProperty({ format: "date-time" })
  currentPeriodStart: string;

  @ApiProperty({ format: "date-time" })
  currentPeriodEnd: string;

  @ApiProperty({ enum: Object.keys(PLAN_LIMITS), nullable: true })
  previousPlanCode: PlanCode | null;

  @ApiProperty({ format: "date-time", nullable: true })
  planChangedAt: string | null;

  @ApiProperty({ format: "date-time" })
  createdAt: string;

  @ApiProperty({ format: "date-time" })
  updatedAt: string;

  constructor(sub: RawSubscription) {
    this.id = sub.id;
    this.memberId = sub.memberId;
    this.clinicId = sub.clinicId;
    this.planCode = sub.planCode as PlanCode;
    this.status = sub.status as SubscriptionStatus;
    this.currentPeriodStart = sub.currentPeriodStart.toISOString();
    this.currentPeriodEnd = sub.currentPeriodEnd.toISOString();
    this.previousPlanCode = sub.previousPlanCode as PlanCode | null;
    this.planChangedAt = sub.planChangedAt?.toISOString() ?? null;
    this.createdAt = sub.createdAt.toISOString();
    this.updatedAt = sub.updatedAt.toISOString();
  }
}
