import { Injectable } from "@nestjs/common";
import { AppointmentRepository } from "@domain/appointment/appointment.repository";

@Injectable()
export class AppointmentService {
  constructor(private readonly repository: AppointmentRepository) {}
}
