export type BillingType = "CREDIT_CARD" | "PIX" | "BOLETO";

export type CreateCustomerDto = {
  name: string;
  email: string;
  phone?: string;
  cpfCnpj?: string;
};

export type CreateSubscriptionDto = {
  customerId: string;
  billingType: BillingType;
  value: number;
  nextDueDate: string; // YYYY-MM-DD
  cycle: "MONTHLY";
  description: string;
};

export type CreateChargeDto = {
  customerId: string;
  billingType: BillingType;
  value: number;
  dueDate: string; // YYYY-MM-DD
  description: string;
};

export type ExternalCustomer = {
  id: string;
  name: string;
  email: string;
};

export type ExternalSubscription = {
  id: string;
  customerId: string;
  status: string;
  nextDueDate: string;
  value: number;
};

export type ExternalSubscriptionStatus = {
  id: string;
  status: string;
  nextDueDate: string;
};

export type ExternalCharge = {
  id: string;
  status: string;
  value: number;
  dueDate: string;
  invoiceUrl: string | null;
};

export interface IPaymentProvider {
  createCustomer(data: CreateCustomerDto): Promise<ExternalCustomer>;
  createSubscription(data: CreateSubscriptionDto): Promise<ExternalSubscription>;
  cancelSubscription(externalSubscriptionId: string): Promise<void>;
  getSubscriptionStatus(externalSubscriptionId: string): Promise<ExternalSubscriptionStatus>;
  createOneTimeCharge(data: CreateChargeDto): Promise<ExternalCharge>;
}

export const IPaymentProvider = Symbol("IPaymentProvider");
