import { ApiProperty, ApiSchema } from "@nestjs/swagger";
import type { FormFieldIndex } from "@domain/form-field-index/entities";
import { AiSpecialtyGroup } from "@domain/form-template/entities";

@ApiSchema({ name: "FormFieldIndex" })
export class FormFieldIndexDto {
  @ApiProperty({ format: "uuid" })
  id: string;

  @ApiProperty({ format: "uuid" })
  patientFormId: string;

  @ApiProperty()
  fieldId: string;

  @ApiProperty({ nullable: true })
  fieldLabel: string | null;

  @ApiProperty({ nullable: true })
  fieldType: string | null;

  @ApiProperty({ nullable: true })
  valueText: string | null;

  @ApiProperty({ nullable: true })
  valueNumber: number | null;

  @ApiProperty({ nullable: true })
  valueBoolean: boolean | null;

  @ApiProperty({ format: "date-time", nullable: true })
  valueDate: string | null;

  @ApiProperty({ nullable: true })
  valueJson: unknown;

  @ApiProperty({ enum: AiSpecialtyGroup, nullable: true })
  specialtyGroup: AiSpecialtyGroup | null;

  @ApiProperty({ nullable: true })
  confidence: number | null;

  constructor(entry: FormFieldIndex) {
    this.id = entry.id.toString();
    this.patientFormId = entry.patientFormId.toString();
    this.fieldId = entry.fieldId;
    this.fieldLabel = entry.fieldLabel;
    this.fieldType = entry.fieldType;
    this.valueText = entry.valueText;
    this.valueNumber = entry.valueNumber;
    this.valueBoolean = entry.valueBoolean;
    this.valueDate = entry.valueDate?.toISOString() ?? null;
    this.valueJson = entry.valueJson;
    this.specialtyGroup = entry.specialtyGroup;
    this.confidence = entry.confidence;
  }
}
