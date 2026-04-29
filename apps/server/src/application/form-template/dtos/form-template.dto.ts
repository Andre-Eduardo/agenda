import { ApiProperty, ApiSchema } from "@nestjs/swagger";
import type { FormTemplate } from "@domain/form-template/entities";
import { EntityDto } from "@application/@shared/dto";

@ApiSchema({ name: "FormTemplate" })
export class FormTemplateDto extends EntityDto {
  @ApiProperty({ description: "Unique stable code for the template" })
  code: string;

  @ApiProperty({ description: "Template name" })
  name: string;

  @ApiProperty({ nullable: true, description: "Optional description" })
  description: string | null;

  @ApiProperty({ nullable: true, description: "Target specialty label (free text)" })
  specialty: string | null;

  @ApiProperty({ description: "Whether this is a public system template (clinicId is null)" })
  isPublic: boolean;

  @ApiProperty({
    format: "uuid",
    nullable: true,
    description: "Owner clinic ID (null for public templates)",
  })
  clinicId: string | null;

  @ApiProperty({
    format: "uuid",
    nullable: true,
    description: "Member who created the template (null for public templates)",
  })
  createdByMemberId: string | null;

  constructor(template: FormTemplate) {
    super(template);
    this.code = template.code;
    this.name = template.name;
    this.description = template.description;
    this.specialty = template.specialtyLabel;
    this.isPublic = template.isPublic;
    this.clinicId = template.clinicId?.toString() ?? null;
    this.createdByMemberId = template.createdByMemberId?.toString() ?? null;
  }
}
