import {Module} from '@nestjs/common';
import {InfrastructureModule} from '../../infrastructure/infrastructure.module';
import {ReservationController} from './controllers';
import {
    CancelReservationService,
    CreateReservationService,
    GetReservationService,
    ListReservationService,
    UpdateReservationService,
} from './services';

@Module({
    imports: [InfrastructureModule],
    controllers: [ReservationController],
    providers: [
        CreateReservationService,
        UpdateReservationService,
        ListReservationService,
        GetReservationService,
        CancelReservationService,
    ],
})
export class ReservationModule {}
