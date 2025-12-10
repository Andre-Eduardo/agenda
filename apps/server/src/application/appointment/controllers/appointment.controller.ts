import {Controller} from '@nestjs/common';
import {AppointmentService} from '../services/appointment.service';

@Controller('appointments')
export class AppointmentController {
    constructor(private readonly service: AppointmentService) {}
}
