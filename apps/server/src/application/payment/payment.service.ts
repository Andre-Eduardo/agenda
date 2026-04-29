import { Inject, Injectable } from "@nestjs/common";
import { randomUUID } from "crypto";
import { ResourceNotFoundException, InvalidInputException } from "@domain/@shared/exceptions";
import { PrismaProvider } from "@infrastructure/repository/prisma/prisma.provider";
import {
  PLAN_LIMITS,
  PlanCode,
  PlanCodeRecord,
} from "@application/subscription/subscription-plans.config";
import { toEnum } from "@domain/@shared/utils";
import { IPaymentProvider } from "@application/payment/providers/payment-provider.interface";
import { AsaasPaymentAdapter } from "@application/payment/providers/asaas.adapter";

export type PaymentMethod = "CREDIT_CARD" | "PIX" | "BOLETO";

@Injectable()
export class PaymentService {
  constructor(
    private readonly prismaProvider: PrismaProvider,
    @Inject(IPaymentProvider) private readonly paymentProvider: AsaasPaymentAdapter,
  ) {}

  private get prisma() {
    return this.prismaProvider.client;
  }

  private firstDayOfNextMonth(): string {
    const now = new Date();
    const next = new Date(now.getFullYear(), now.getMonth() + 1, 1);

    return next.toISOString().slice(0, 10);
  }

  async activateSubscription(
    memberId: string,
    _clinicId: string,
    planCode: PlanCode,
    paymentMethod: PaymentMethod,
    cpfCnpj?: string,
  ) {
    const subscription = await this.prisma.professionalSubscription.findUnique({
      where: { memberId },
      include: { member: { include: { user: true } } },
    });

    if (!subscription) {
      throw new ResourceNotFoundException("subscription.not_found", memberId);
    }

    const { user } = subscription.member;
    const userEmail = user.email;

    if (!userEmail) {
      throw new InvalidInputException("subscription.user_email_required");
    }

    let asaasCustomerId: string;

    if (subscription.asaasCustomerId) {
      asaasCustomerId = subscription.asaasCustomerId;
    } else {
      const customer = await this.paymentProvider.createCustomer({
        name: user.name,
        email: userEmail,
        phone: user.phone ?? undefined,
        cpfCnpj,
      });

      asaasCustomerId = customer.id;
      await this.prisma.professionalSubscription.update({
        where: { memberId },
        data: { asaasCustomerId, updatedAt: new Date() },
      });
    }

    const planConfig = PLAN_LIMITS[planCode];
    const externalSub = await this.paymentProvider.createSubscription({
      customerId: asaasCustomerId,
      billingType: paymentMethod,
      value: planConfig.priceMonthlyBrl,
      nextDueDate: this.firstDayOfNextMonth(),
      cycle: "MONTHLY",
      description: `Plano ${planConfig.name} — App de Saúde`,
    });

    const nextDueDate = new Date(externalSub.nextDueDate);

    return this.prisma.professionalSubscription.update({
      where: { memberId },
      data: {
        asaasSubscriptionId: externalSub.id,
        planCode,
        status: "ACTIVE",
        nextDueDate,
        updatedAt: new Date(),
      },
    });
  }

  async cancelSubscription(memberId: string) {
    const subscription = await this.prisma.professionalSubscription.findUnique({
      where: { memberId },
    });

    if (!subscription) {
      throw new ResourceNotFoundException("subscription.not_found", memberId);
    }

    if (subscription.asaasSubscriptionId) {
      await this.paymentProvider.cancelSubscription(subscription.asaasSubscriptionId);
    }

    return this.prisma.professionalSubscription.update({
      where: { memberId },
      data: { status: "CANCELLED", updatedAt: new Date() },
    });
  }

  async changePlanAndCharge(memberId: string, newPlanCode: PlanCode, paymentMethod: PaymentMethod) {
    const subscription = await this.prisma.professionalSubscription.findUnique({
      where: { memberId },
      include: { member: { include: { user: true } } },
    });

    if (!subscription) {
      throw new ResourceNotFoundException("subscription.not_found", memberId);
    }

    const { asaasCustomerId } = subscription;

    if (!asaasCustomerId) {
      throw new InvalidInputException("subscription.no_payment_method");
    }

    if (subscription.asaasSubscriptionId) {
      await this.paymentProvider.cancelSubscription(subscription.asaasSubscriptionId);
    }

    const planConfig = PLAN_LIMITS[newPlanCode];
    const externalSub = await this.paymentProvider.createSubscription({
      customerId: asaasCustomerId,
      billingType: paymentMethod,
      value: planConfig.priceMonthlyBrl,
      nextDueDate: this.firstDayOfNextMonth(),
      cycle: "MONTHLY",
      description: `Plano ${planConfig.name} — App de Saúde`,
    });

    const now = new Date();

    return this.prisma.professionalSubscription.update({
      where: { memberId },
      data: {
        planCode: newPlanCode,
        previousPlanCode: toEnum(PlanCodeRecord, subscription.planCode),
        planChangedAt: now,
        asaasSubscriptionId: externalSub.id,
        nextDueDate: new Date(externalSub.nextDueDate),
        updatedAt: now,
      },
    });
  }

  async listPayments(memberId: string) {
    const subscription = await this.prisma.professionalSubscription.findUnique({
      where: { memberId },
    });

    if (!subscription) {
      throw new ResourceNotFoundException("subscription.not_found", memberId);
    }

    return this.prisma.paymentEvent.findMany({
      where: { memberId },
      orderBy: { createdAt: "desc" },
    });
  }

  async getSubscriptionByMemberId(memberId: string) {
    const subscription = await this.prisma.professionalSubscription.findUnique({
      where: { memberId },
    });

    if (!subscription) {
      throw new ResourceNotFoundException("subscription.not_found", memberId);
    }

    return subscription;
  }

  async createUsageRecordForNextPeriodIfNeeded(
    subscriptionId: string,
    memberId: string,
    clinicId: string,
  ) {
    const now = new Date();
    const nextYear = now.getMonth() === 11 ? now.getFullYear() + 1 : now.getFullYear();
    const nextMonth = now.getMonth() === 11 ? 1 : now.getMonth() + 2;

    const subscription = await this.prisma.professionalSubscription.findUnique({
      where: { id: subscriptionId },
    });

    if (!subscription) return;

    const existing = await this.prisma.usageRecord.findUnique({
      where: {
        usage_record_member_period_unique: {
          memberId,
          periodYear: nextYear,
          periodMonth: nextMonth,
        },
      },
    });

    if (existing) return;

    await this.prisma.usageRecord.create({
      data: {
        id: randomUUID(),
        clinicId,
        memberId,
        subscriptionId,
        periodYear: nextYear,
        periodMonth: nextMonth,
        planCodeSnapshot: subscription.planCode,
        docsUploaded: 0,
        chatMessages: 0,
        clinicalImages: 0,
        storageHotGbUsed: 0,
        createdAt: now,
        updatedAt: now,
      },
    });
  }
}
