import { Injectable } from "@nestjs/common";
import { PatientRepository } from "@domain/patient/patient.repository";

@Injectable()
export class PatientService {
  constructor(private readonly repository: PatientRepository) {}
}
