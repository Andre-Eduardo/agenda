import { ApiProperty, ApiSchema } from "@nestjs/swagger";
import type { FormTemplateVersion } from "@domain/form-template-version/entities";
import { FormStatus } from "@domain/form-template-version/entities";
import { EntityDto } from "@application/@shared/dto";

@ApiSchema({ name: "FormTemplateVersion" })
export class FormTemplateVersionDto extends EntityDto {
  @ApiProperty({ format: "uuid", description: "Template ID" })
  templateId: string;

  @ApiProperty({ description: "Auto-incremented version number" })
  versionNumber: number;

  @ApiProperty({ enum: FormStatus, description: "Version lifecycle status" })
  status: FormStatus;

  @ApiProperty({ description: "Form field structure (JSON)" })
  definitionJson: unknown;

  @ApiProperty({ nullable: true, description: "Optional JSON schema for validation" })
  schemaJson: unknown;

  @ApiProperty({
    format: "date-time",
    nullable: true,
    description: "When this version was published",
  })
  publishedAt: string | null;

  constructor(version: FormTemplateVersion) {
    super(version);
    this.templateId = version.templateId.toString();
    this.versionNumber = version.versionNumber;
    this.status = version.status;
    this.definitionJson = version.definitionJson;
    this.schemaJson = version.schemaJson;
    this.publishedAt = version.publishedAt?.toISOString() ?? null;
  }
}
