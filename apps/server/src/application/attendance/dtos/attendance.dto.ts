import {ApiProperty, ApiSchema} from '@nestjs/swagger';
import {z} from 'zod';
import {createZodDto} from '@application/@shared/validation/dto';
import type {AppointmentTriage, AttendanceItem} from '@domain/attendance/attendance.repository';

export const listAttendanceSchema = z.object({
    scope: z
        .enum(['mine', 'all'])
        .default('all')
        .openapi({description: 'mine = only the actor own agenda; all = every agenda the actor can operate'}),
    dateFrom: z.coerce.date().openapi({description: 'Earliest appointment start to include'}),
    dateTo: z.coerce.date().openapi({description: 'Latest appointment start to include'}),
});

export class ListAttendanceDto extends createZodDto(listAttendanceSchema) {}

export class CallAttendanceDto extends createZodDto(
    z.object({
        destination: z
            .string()
            .trim()
            .min(1)
            .max(80)
            .openapi({description: 'Where the patient must go, shown on the call panel (e.g. "Sala 3")'}),
    })
) {}

const optionalInt = (min: number, max: number) => z.number().int().min(min).max(max).nullish();

export const saveTriageSchema = z.object({
    weightKg: z.number().min(0.5).max(500).nullish(),
    heightCm: optionalInt(20, 260),
    systolicPressure: optionalInt(40, 300),
    diastolicPressure: optionalInt(20, 200),
    heartRate: optionalInt(20, 300),
    temperatureCelsius: z.number().min(30).max(45).nullish(),
    oxygenSaturation: optionalInt(50, 100),
    notes: z.string().trim().max(1000).nullish(),
    release: z.boolean().openapi({description: 'true releases the patient to be called. A release cannot be undone.'}),
});

export class SaveTriageDto extends createZodDto(saveTriageSchema) {}

@ApiSchema({name: 'AttendanceItem'})
export class AttendanceItemDto {
    @ApiProperty({format: 'uuid'}) appointmentId: string;
    @ApiProperty({format: 'uuid'}) patientId: string;
    @ApiProperty() patientName: string;
    @ApiProperty({format: 'uuid'}) attendedByMemberId: string;
    @ApiProperty({type: String, nullable: true}) attendedByName: string | null;
    @ApiProperty({format: 'date-time'}) startAt: string;
    @ApiProperty({type: String, format: 'date-time', nullable: true}) arrivedAt: string | null;
    @ApiProperty({type: String, format: 'date-time', nullable: true}) calledAt: string | null;
    @ApiProperty({enum: ['ARRIVED', 'IN_PROGRESS'], enumName: 'AttendanceStatus'}) status: 'ARRIVED' | 'IN_PROGRESS';
    @ApiProperty({type: String, nullable: true, description: 'Last destination announced'}) destination: string | null;
    @ApiProperty({type: Number}) callCount: number;
    @ApiProperty({type: Boolean, description: 'Triage data was saved at least once'}) triageStarted: boolean;
    @ApiProperty({type: Boolean, description: 'Patient was released by the triage'}) triageReleased: boolean;
    @ApiProperty({type: Boolean, description: 'Patient can be called now (released or triage not required)'})
    callable: boolean;
    @ApiProperty({type: String, nullable: true, description: 'Appointment room or the professional default room'})
    suggestedDestination: string | null;
    @ApiProperty({type: Boolean, description: 'Appointment belongs to the actor own agenda'}) mine: boolean;

    constructor(item: AttendanceItem, extra: {attendedByName: string | null; triageRequired: boolean; mine: boolean}) {
        this.appointmentId = item.appointmentId;
        this.patientId = item.patientId;
        this.patientName = item.patientName;
        this.attendedByMemberId = item.attendedByMemberId;
        this.attendedByName = extra.attendedByName;
        this.startAt = item.startAt.toISOString();
        this.arrivedAt = item.arrivedAt?.toISOString() ?? null;
        this.calledAt = item.calledAt?.toISOString() ?? null;
        this.status = item.status;
        this.destination = item.destination;
        this.callCount = item.callCount;
        this.triageStarted = item.triageStarted;
        this.triageReleased = item.triageReleasedAt !== null;
        this.callable = item.status === 'ARRIVED' && (!extra.triageRequired || this.triageReleased);
        this.suggestedDestination = item.suggestedDestination;
        this.mine = extra.mine;
    }
}

@ApiSchema({name: 'AttendanceQueue'})
export class AttendanceQueueDto {
    @ApiProperty({type: Boolean, description: 'Clinic setting: triage must release the patient before the call'})
    triageRequired: boolean;

    @ApiProperty({type: Boolean, description: 'Calls are shown on the public TV panel'})
    panelPublished: boolean;

    @ApiProperty({type: AttendanceItemDto, isArray: true})
    items: AttendanceItemDto[];

    constructor(triageRequired: boolean, panelPublished: boolean, items: AttendanceItemDto[]) {
        this.triageRequired = triageRequired;
        this.panelPublished = panelPublished;
        this.items = items;
    }
}

@ApiSchema({name: 'AttendanceCallResult'})
export class AttendanceCallResultDto {
    @ApiProperty({format: 'uuid'}) appointmentId: string;
    @ApiProperty({enum: ['ARRIVED', 'IN_PROGRESS'], enumName: 'AttendanceStatus'}) status: 'IN_PROGRESS';
    @ApiProperty() destination: string;
    @ApiProperty({type: Boolean, description: 'The call was shown on the public TV panel'}) announced: boolean;

    constructor(appointmentId: string, destination: string, announced: boolean) {
        this.appointmentId = appointmentId;
        this.status = 'IN_PROGRESS';
        this.destination = destination;
        this.announced = announced;
    }
}

@ApiSchema({name: 'AppointmentTriage'})
export class AppointmentTriageDto {
    @ApiProperty({format: 'uuid'}) appointmentId: string;
    @ApiProperty({type: Number, nullable: true}) weightKg: number | null;
    @ApiProperty({type: Number, nullable: true}) heightCm: number | null;
    @ApiProperty({type: Number, nullable: true}) systolicPressure: number | null;
    @ApiProperty({type: Number, nullable: true}) diastolicPressure: number | null;
    @ApiProperty({type: Number, nullable: true}) heartRate: number | null;
    @ApiProperty({type: Number, nullable: true}) temperatureCelsius: number | null;
    @ApiProperty({type: Number, nullable: true}) oxygenSaturation: number | null;
    @ApiProperty({type: String, nullable: true}) notes: string | null;
    @ApiProperty({type: Boolean}) released: boolean;
    @ApiProperty({type: String, format: 'date-time', nullable: true}) releasedAt: string | null;
    @ApiProperty({type: String, format: 'date-time', nullable: true}) updatedAt: string | null;

    constructor(appointmentId: string, triage: AppointmentTriage | null) {
        this.appointmentId = appointmentId;
        this.weightKg = triage?.weightKg ?? null;
        this.heightCm = triage?.heightCm ?? null;
        this.systolicPressure = triage?.systolicPressure ?? null;
        this.diastolicPressure = triage?.diastolicPressure ?? null;
        this.heartRate = triage?.heartRate ?? null;
        this.temperatureCelsius = triage?.temperatureCelsius ?? null;
        this.oxygenSaturation = triage?.oxygenSaturation ?? null;
        this.notes = triage?.notes ?? null;
        this.released = (triage?.releasedAt ?? null) !== null;
        this.releasedAt = triage?.releasedAt?.toISOString() ?? null;
        this.updatedAt = triage?.updatedAt.toISOString() ?? null;
    }
}
