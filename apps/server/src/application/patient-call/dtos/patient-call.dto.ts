import {ApiProperty, ApiSchema} from '@nestjs/swagger';
import {z} from 'zod';
import {createZodDto} from '@application/@shared/validation/dto';

const hexColor = z.string().regex(/^#[0-9a-fA-F]{6}$/);

export class SavePatientCallPanelDto extends createZodDto(
    z.object({
        title: z.string().trim().min(1).max(80),
        message: z.string().trim().min(1).max(160),
        foregroundColor: hexColor,
        backgroundColor: hexColor,
        useClinicLogo: z.boolean(),
        soundEnabled: z.boolean(),
        displaySeconds: z.number().int().min(8).max(60),
    })
) {}

export class AnnouncePatientCallDto extends createZodDto(
    z.object({
        place: z.enum(['ROOM', 'DESK']),
        number: z.number().int().min(1).max(9999),
    })
) {}

export class RecallPatientCallDto extends createZodDto(z.object({callCount: z.number().int().positive()})) {}

export class RemovePatientCallDto extends createZodDto(z.object({reason: z.string().trim().min(1).max(250)})) {}

@ApiSchema({name: 'PatientCallAvailability'})
export class PatientCallAvailabilityDto {
    @ApiProperty({type: Boolean})
    enabled = false;

    @ApiProperty({type: Boolean})
    published = false;
}

@ApiSchema({name: 'PatientCallDisplayIdentity'})
export class PatientCallDisplayIdentityDto {
    @ApiProperty({type: String})
    title = '';

    @ApiProperty({type: String})
    message = '';

    @ApiProperty({type: String})
    foregroundColor = '';

    @ApiProperty({type: String})
    backgroundColor = '';

    @ApiProperty({type: Boolean})
    soundEnabled = false;
}

@ApiSchema({name: 'PatientCallPanelSettings'})
export class PatientCallPanelSettingsDto extends PatientCallDisplayIdentityDto {
    @ApiProperty({type: Boolean})
    enabled = false;

    @ApiProperty({type: String, nullable: true})
    publicToken: string | null = null;

    @ApiProperty({type: String, nullable: true})
    clinicLogoUrl: string | null = null;

    @ApiProperty({type: Boolean})
    useClinicLogo = true;

    @ApiProperty({type: Number})
    displaySeconds = 15;
}

@ApiSchema({name: 'PatientCallQueueEntry'})
export class PatientCallQueueEntryDto {
    @ApiProperty({type: String, format: 'uuid'})
    appointmentId = '';

    @ApiProperty({type: String})
    code = '';

    @ApiProperty({type: String, format: 'date-time'})
    arrivedAt: Date = new Date(0);

    @ApiProperty({type: Number})
    callCount = 0;

    @ApiProperty({type: String, nullable: true})
    destination: string | null = null;
}

@ApiSchema({name: 'PatientCallQueueItem'})
export class PatientCallQueueItemDto extends PatientCallQueueEntryDto {
    @ApiProperty({type: String})
    patientName = '';
}

@ApiSchema({name: 'PublicPatientCall'})
export class PublicPatientCallDto {
    @ApiProperty({type: String})
    code = '';

    @ApiProperty({type: String})
    destination = '';

    @ApiProperty({type: String, format: 'date-time'})
    expiresAt: Date = new Date(0);
}

@ApiSchema({name: 'PublicPatientCallPanel'})
export class PublicPatientCallPanelDto extends PatientCallDisplayIdentityDto {
    @ApiProperty({type: String, nullable: true})
    logoUrl: string | null = null;

    @ApiProperty({type: PublicPatientCallDto, nullable: true})
    call: PublicPatientCallDto | null = null;
}
