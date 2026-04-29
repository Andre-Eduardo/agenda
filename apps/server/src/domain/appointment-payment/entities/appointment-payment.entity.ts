import {
  AggregateRoot,
  type AllEntityProps,
  type EntityJson,
  type EntityProps,
  type CreateEntity,
} from "@domain/@shared/entity";
import { EntityId } from "@domain/@shared/entity/id";
import type { ClinicId } from "@domain/clinic/entities";
import type { ClinicMemberId } from "@domain/clinic-member/entities";
import type { PatientId } from "@domain/patient/entities";
import type { AppointmentId } from "@domain/appointment/entities";
import type { InsurancePlanId } from "@domain/insurance-plan/entities";
import { AppointmentPaymentRegisteredEvent } from "@domain/appointment-payment/events";

export enum PaymentMethod {
  CASH = "CASH",
  PIX = "PIX",
  CREDIT_CARD = "CREDIT_CARD",
  DEBIT_CARD = "DEBIT_CARD",
  BANK_TRANSFER = "BANK_TRANSFER",
  INSURANCE = "INSURANCE",
  COURTESY = "COURTESY",
}

export enum AppointmentPaymentStatus {
  PENDING = "PENDING",
  PAID = "PAID",
  EXEMPT = "EXEMPT",
  REFUNDED = "REFUNDED",
}

export type AppointmentPaymentProps = EntityProps<AppointmentPayment>;
export type CreateAppointmentPayment = CreateEntity<AppointmentPayment>;

export class AppointmentPayment extends AggregateRoot<AppointmentPaymentId> {
  clinicId: ClinicId;
  appointmentId: AppointmentId;
  patientId: PatientId;
  registeredByMemberId: ClinicMemberId;
  paymentMethod: PaymentMethod;
  status: AppointmentPaymentStatus;
  amountBrl: number;
  paidAt: Date | null;
  insurancePlanId: InsurancePlanId | null;
  insuranceAuthCode: string | null;
  notes: string | null;

  constructor(props: AllEntityProps<AppointmentPayment>) {
    super(props);
    this.clinicId = props.clinicId;
    this.appointmentId = props.appointmentId;
    this.patientId = props.patientId;
    this.registeredByMemberId = props.registeredByMemberId;
    this.paymentMethod = props.paymentMethod;
    this.status = props.status;
    this.amountBrl = props.amountBrl;
    this.paidAt = props.paidAt ?? null;
    this.insurancePlanId = props.insurancePlanId ?? null;
    this.insuranceAuthCode = props.insuranceAuthCode ?? null;
    this.notes = props.notes ?? null;
  }

  static create(props: CreateAppointmentPayment): AppointmentPayment {
    const id = AppointmentPaymentId.generate();
    const now = new Date();

    const payment = new AppointmentPayment({
      ...props,
      id,
      paidAt: props.paidAt ?? null,
      insurancePlanId: props.insurancePlanId ?? null,
      insuranceAuthCode: props.insuranceAuthCode ?? null,
      notes: props.notes ?? null,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
    });

    payment.addEvent(new AppointmentPaymentRegisteredEvent({ payment, timestamp: now }));

    return payment;
  }

  updateStatus(status: AppointmentPaymentStatus, paidAt: Date | null): void {
    this.status = status;
    this.paidAt = paidAt;
    this.updatedAt = new Date();
  }

  toJSON(): EntityJson<AppointmentPayment> {
    return {
      id: this.id.toJSON(),
      clinicId: this.clinicId.toJSON(),
      appointmentId: this.appointmentId.toJSON(),
      patientId: this.patientId.toJSON(),
      registeredByMemberId: this.registeredByMemberId.toJSON(),
      paymentMethod: this.paymentMethod,
      status: this.status,
      amountBrl: this.amountBrl,
      paidAt: this.paidAt?.toJSON() ?? null,
      insurancePlanId: this.insurancePlanId?.toJSON() ?? null,
      insuranceAuthCode: this.insuranceAuthCode,
      notes: this.notes,
      createdAt: this.createdAt.toJSON(),
      updatedAt: this.updatedAt.toJSON(),
      deletedAt: this.deletedAt?.toJSON() ?? null,
    };
  }
}

export class AppointmentPaymentId extends EntityId<"AppointmentPaymentId"> {
  static from(value: string): AppointmentPaymentId {
    return new AppointmentPaymentId(value);
  }

  static generate(): AppointmentPaymentId {
    return new AppointmentPaymentId();
  }
}
