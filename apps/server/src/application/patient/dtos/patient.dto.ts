import { ApiProperty, ApiSchema } from "@nestjs/swagger";
import type { Patient, PatientAddressData, InsurancePlanSummary } from "@domain/patient/entities";
import { Gender, PersonType } from "@domain/person/entities";
import { EntityDto } from "@application/@shared/dto";

export class PatientAddressDto {
  @ApiProperty({ nullable: true })
  street: string | null;

  @ApiProperty({ nullable: true })
  number: string | null;

  @ApiProperty({ nullable: true })
  complement: string | null;

  @ApiProperty({ nullable: true })
  neighborhood: string | null;

  @ApiProperty({ nullable: true })
  city: string | null;

  @ApiProperty({ nullable: true })
  state: string | null;

  @ApiProperty({ nullable: true })
  zipCode: string | null;

  @ApiProperty({ nullable: true, example: "BR" })
  country: string | null;

  constructor(data: PatientAddressData) {
    this.street = data.street;
    this.number = data.number;
    this.complement = data.complement;
    this.neighborhood = data.neighborhood;
    this.city = data.city;
    this.state = data.state;
    this.zipCode = data.zipCode;
    this.country = data.country;
  }
}

export class PatientInsurancePlanDto {
  @ApiProperty({ format: "uuid" })
  id: string;

  @ApiProperty({ example: "Unimed" })
  name: string;

  @ApiProperty({ nullable: true, example: "UNI-001" })
  code: string | null;

  @ApiProperty()
  isActive: boolean;

  constructor(data: InsurancePlanSummary) {
    this.id = data.id;
    this.name = data.name;
    this.code = data.code;
    this.isActive = data.isActive;
  }
}

@ApiSchema({ name: "Patient" })
export class PatientDto extends EntityDto {
  @ApiProperty({ description: "The patient name", example: "John Doe" })
  name: string;

  @ApiProperty({ description: "The patient document ID", example: "123.456.789-00" })
  documentId: string;

  @ApiProperty({ nullable: true, description: "The patient phone", example: "(12) 94567-8912" })
  phone: string | null;

  @ApiProperty({ enum: Gender, nullable: true, description: "The patient gender" })
  gender: Gender | null;

  @ApiProperty({ enum: PersonType, description: "The person type" })
  personType: PersonType;

  @ApiProperty({ format: "uuid", description: "The clinic this patient belongs to" })
  clinicId: string;

  @ApiProperty({ format: "date-time", nullable: true, description: "The patient birth date" })
  birthDate: string | null;

  @ApiProperty({ nullable: true, description: "The patient email" })
  email: string | null;

  @ApiProperty({ nullable: true, description: "Emergency contact name" })
  emergencyContactName: string | null;

  @ApiProperty({ nullable: true, description: "Emergency contact phone" })
  emergencyContactPhone: string | null;

  @ApiProperty({ nullable: true, type: PatientAddressDto, description: "Patient address" })
  address: PatientAddressDto | null;

  @ApiProperty({ nullable: true, format: "uuid", description: "Insurance plan ID" })
  insurancePlanId: string | null;

  @ApiProperty({ nullable: true, description: "Insurance card number" })
  insuranceCardNumber: string | null;

  @ApiProperty({ nullable: true, format: "date-time", description: "Insurance valid until" })
  insuranceValidUntil: string | null;

  @ApiProperty({
    nullable: true,
    type: PatientInsurancePlanDto,
    description: "Insurance plan details",
  })
  insurancePlan: PatientInsurancePlanDto | null;

  constructor(patient: Patient) {
    super(patient);
    this.name = patient.name;
    this.documentId = patient.documentId.toString();
    this.phone = patient.phone?.toString() ?? null;
    this.gender = patient.gender;
    this.personType = patient.personType;
    this.clinicId = patient.clinicId.toString();
    this.birthDate = patient.birthDate?.toISOString() ?? null;
    this.email = patient.email;
    this.emergencyContactName = patient.emergencyContactName;
    this.emergencyContactPhone = patient.emergencyContactPhone;
    this.address = patient.address ? new PatientAddressDto(patient.address) : null;
    this.insurancePlanId = patient.insurancePlanId;
    this.insuranceCardNumber = patient.insuranceCardNumber;
    this.insuranceValidUntil = patient.insuranceValidUntil?.toISOString() ?? null;
    this.insurancePlan = patient.insurancePlan
      ? new PatientInsurancePlanDto(patient.insurancePlan)
      : null;
  }
}
