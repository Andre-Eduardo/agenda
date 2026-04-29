import { ApiProperty, ApiSchema } from "@nestjs/swagger";
import type { Record } from "@domain/record/entities";
import {
  EvolutionTemplateType,
  AttendanceType,
  ClinicalStatusTag,
  ConductTag,
  RecordSource,
} from "@domain/record/entities";
import { EntityDto } from "@application/@shared/dto";

class FileDto {
  @ApiProperty({ format: "uuid" })
  id: string;

  @ApiProperty()
  fileName: string;

  @ApiProperty()
  url: string;

  @ApiProperty()
  description: string;

  constructor(file: Record["files"][number]) {
    this.id = file.id.toString();
    this.fileName = file.fileName;
    this.url = file.url;
    this.description = file.description;
  }
}

@ApiSchema({ name: "Record" })
export class RecordDto extends EntityDto {
  @ApiProperty({ format: "uuid", description: "The clinic this record belongs to" })
  clinicId: string;

  @ApiProperty({ format: "uuid", description: "The patient ID" })
  patientId: string;

  @ApiProperty({ format: "uuid", description: "ClinicMember who typed the record" })
  createdByMemberId: string;

  @ApiProperty({ format: "uuid", description: "Professional clinically responsible" })
  responsibleProfessionalId: string;

  @ApiProperty({ nullable: true, description: "Legacy free-text description" })
  description: string | null;

  @ApiProperty({
    enum: EvolutionTemplateType,
    nullable: true,
    description: "Evolution template type",
  })
  templateType: EvolutionTemplateType | null;

  @ApiProperty({ nullable: true, description: "Evolution title" })
  title: string | null;

  @ApiProperty({ enum: AttendanceType, nullable: true, description: "Attendance type" })
  attendanceType: AttendanceType | null;

  @ApiProperty({ enum: ClinicalStatusTag, nullable: true, description: "Clinical status" })
  clinicalStatus: ClinicalStatusTag | null;

  @ApiProperty({ enum: ConductTag, isArray: true, description: "Conduct tags" })
  conductTags: ConductTag[];

  @ApiProperty({ nullable: true, description: "SOAP Subjective" })
  subjective: string | null;

  @ApiProperty({ nullable: true, description: "SOAP Objective" })
  objective: string | null;

  @ApiProperty({ nullable: true, description: "SOAP/DAP Assessment" })
  assessment: string | null;

  @ApiProperty({ nullable: true, description: "SOAP/DAP Plan" })
  plan: string | null;

  @ApiProperty({ nullable: true, description: "Free notes" })
  freeNotes: string | null;

  @ApiProperty({ format: "date-time", nullable: true, description: "Event date (clinical event)" })
  eventDate: string | null;

  @ApiProperty({ format: "uuid", nullable: true, description: "Linked appointment ID" })
  appointmentId: string | null;

  @ApiProperty({ enum: RecordSource, description: "Origin of the record" })
  source: RecordSource;

  @ApiProperty({
    format: "uuid",
    nullable: true,
    description: "ID of the imported document if applicable",
  })
  importedDocumentId: string | null;

  @ApiProperty({ description: "Indicates if the imported record was manually reviewed and edited" })
  wasHumanEdited: boolean;

  @ApiProperty({ description: "Whether the record is locked (signed)" })
  isLocked: boolean;

  @ApiProperty({ format: "date-time", nullable: true, description: "When the record was signed" })
  signedAt: string | null;

  @ApiProperty({
    format: "uuid",
    nullable: true,
    description: "ID of the member who signed the record",
  })
  signedByMemberId: string | null;

  @ApiProperty({ type: [FileDto], description: "The attached files" })
  files: FileDto[];

  constructor(record: Record) {
    super(record);
    this.clinicId = record.clinicId.toString();
    this.patientId = record.patientId.toString();
    this.createdByMemberId = record.createdByMemberId.toString();
    this.responsibleProfessionalId = record.responsibleProfessionalId.toString();
    this.description = record.description;
    this.templateType = record.templateType;
    this.title = record.title;
    this.attendanceType = record.attendanceType;
    this.clinicalStatus = record.clinicalStatus;
    this.conductTags = record.conductTags;
    this.subjective = record.subjective;
    this.objective = record.objective;
    this.assessment = record.assessment;
    this.plan = record.plan;
    this.freeNotes = record.freeNotes;
    this.eventDate = record.eventDate?.toISOString() ?? null;
    this.appointmentId = record.appointmentId?.toString() ?? null;
    this.source = record.source;
    this.importedDocumentId = record.importedDocumentId?.toString() ?? null;
    this.wasHumanEdited = record.wasHumanEdited;
    this.isLocked = record.isLocked;
    this.signedAt = record.signedAt?.toISOString() ?? null;
    this.signedByMemberId = record.signedByMemberId?.toString() ?? null;
    this.files = record.files.map((f) => new FileDto(f));
  }
}
