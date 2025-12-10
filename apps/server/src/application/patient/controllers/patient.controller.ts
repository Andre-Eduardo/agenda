import {Controller} from '@nestjs/common';
import {PatientService} from '../services/patient.service';

@Controller('patients')
export class PatientController {
    constructor(private readonly service: PatientService) {}
}
