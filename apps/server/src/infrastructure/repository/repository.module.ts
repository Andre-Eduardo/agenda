import {Module, Provider} from '@nestjs/common';
import {AccountRepository} from '../../domain/account/account.repository';
import {AuditRepository} from '../../domain/audit/audit.repository';
import {BlockadeRepository} from '../../domain/blockade/blockade.repository';
import {CashierRepository} from '../../domain/cashier/cashier.repository';
import {CleaningRepository} from '../../domain/cleaning/cleaning.repository';
import {CompanyRepository} from '../../domain/company/company.repository';
import {CustomerRepository} from '../../domain/customer/customer.repository';
import {DeepCleaningRepository} from '../../domain/deep-cleaning/deep-cleaning.repository';
import {DefectRepository} from '../../domain/defect/defect.repository';
import {DefectTypeRepository} from '../../domain/defect-type/defect-type.repository';
import {EmployeeRepository} from '../../domain/employee/employee.repository';
import {EmployeePositionRepository} from '../../domain/employee-position/employee-position.repository';
import {EventRepository} from '../../domain/event/event.repository';
import {InspectionRepository} from '../../domain/inspection/inspection.repository';
import {MaintenanceRepository} from '../../domain/maintenance/maintenance.repository';
import {PaymentMethodRepository} from '../../domain/payment-method/payment-method.repository';
import {PersonRepository} from '../../domain/person/person.repository';
import {ProductRepository} from '../../domain/product/product.repository';
import {ProductCategoryRepository} from '../../domain/product-category/product-category.repository';
import {ReservationRepository} from '../../domain/reservation/reservation.repository';
import {RoomRepository} from '../../domain/room/room.repository';
import {RoomCategoryRepository} from '../../domain/room-category/room-category.repository';
import {DirectSaleRepository} from '../../domain/sale/direct-sale.repository';
import {SaleRepository} from '../../domain/sale/sale.repository';
import {ServiceRepository} from '../../domain/service/service.repository';
import {ServiceCategoryRepository} from '../../domain/service-category/service-category.repository';
import {StockRepository} from '../../domain/stock/stock.repository';
import {SupplierRepository} from '../../domain/supplier/supplier.repository';
import {TransactionRepository} from '../../domain/transaction/transaction.repository';
import {UserRepository} from '../../domain/user/user.repository';
import {AccountPrismaRepository} from './account.prisma.repository';
import {AuditPrismaRepository} from './audit.prisma.repository';
import {BlockadePrismaRepository} from './blockade.prisma.repository';
import {CashierPrismaRepository} from './cashier.prisma.repository';
import {CleaningPrismaRepository} from './cleaning.prisma.repository';
import {CompanyPrismaRepository} from './company.prisma.repository';
import {CustomerPrismaRepository} from './customer.prisma.repository';
import {DeepCleaningPrismaRepository} from './deep-cleaning.prisma.repository';
import {DefectTypePrismaRepository} from './defect-type.prisma.repository';
import {DefectPrismaRepository} from './defect.prisma.repository';
import {DirectSalePrismaRepository} from './direct-sale.prisma.repository';
import {EmployeePositionPrismaRepository} from './employee-position.prisma.repository';
import {EmployeePrismaRepository} from './employee.prisma.repository';
import {EventPrismaRepository} from './event.prisma.repository';
import {InspectionPrismaRepository} from './inspection.prisma.repository';
import {MaintenancePrismaRepository} from './maintenance.prisma.repository';
import {PaymentMethodPrismaRepository} from './payment-method.prisma.repository';
import {PersonPrismaRepository} from './person.prisma.repository';
import {PrismaService} from './prisma';
import {ProductCategoryPrismaRepository} from './product-category.prisma-repository';
import {ProductPrismaRepository} from './product.prisma.repository';
import {ReservationPrismaRepository} from './reservation.prisma.repository';
import {RoomCategoryPrismaRepository} from './room-category.prisma.repository';
import {RoomPrismaRepository} from './room.prisma.repository';
import {SalePrismaRepository} from './sale.prisma.repository';
import {ServiceCategoryPrismaRepository} from './service-category.prisma.repository';
import {ServicePrismaRepository} from './service.prisma.repository';
import {StockPrismaRepository} from './stock.prisma.repository';
import {SupplierPrismaRepository} from './supplier.prisma.repository';
import {TransactionPrismaRepository} from './transaction.prisma.repository';
import {UserPrismaRepository} from './user.prisma.repository';

const repositories: Provider[] = [
    {
        provide: EventRepository,
        useClass: EventPrismaRepository,
    },
    {
        provide: UserRepository,
        useClass: UserPrismaRepository,
    },
    {
        provide: CompanyRepository,
        useClass: CompanyPrismaRepository,
    },
    {
        provide: ProductRepository,
        useClass: ProductPrismaRepository,
    },
    {
        provide: ProductCategoryRepository,
        useClass: ProductCategoryPrismaRepository,
    },
    {
        provide: PaymentMethodRepository,
        useClass: PaymentMethodPrismaRepository,
    },
    {
        provide: RoomRepository,
        useClass: RoomPrismaRepository,
    },
    {
        provide: RoomCategoryRepository,
        useClass: RoomCategoryPrismaRepository,
    },
    {
        provide: ReservationRepository,
        useClass: ReservationPrismaRepository,
    },
    {
        provide: CashierRepository,
        useClass: CashierPrismaRepository,
    },
    {
        provide: StockRepository,
        useClass: StockPrismaRepository,
    },
    {
        provide: SupplierRepository,
        useClass: SupplierPrismaRepository,
    },
    {
        provide: CustomerRepository,
        useClass: CustomerPrismaRepository,
    },
    {
        provide: EmployeeRepository,
        useClass: EmployeePrismaRepository,
    },
    {
        provide: EmployeePositionRepository,
        useClass: EmployeePositionPrismaRepository,
    },
    {
        provide: PersonRepository,
        useClass: PersonPrismaRepository,
    },
    {
        provide: TransactionRepository,
        useClass: TransactionPrismaRepository,
    },
    {
        provide: DefectTypeRepository,
        useClass: DefectTypePrismaRepository,
    },
    {
        provide: DefectRepository,
        useClass: DefectPrismaRepository,
    },
    {
        provide: ServiceCategoryRepository,
        useClass: ServiceCategoryPrismaRepository,
    },
    {
        provide: ServiceRepository,
        useClass: ServicePrismaRepository,
    },
    {
        provide: SaleRepository,
        useClass: SalePrismaRepository,
    },
    {
        provide: DirectSaleRepository,
        useClass: DirectSalePrismaRepository,
    },
    {
        provide: CleaningRepository,
        useClass: CleaningPrismaRepository,
    },
    {
        provide: MaintenanceRepository,
        useClass: MaintenancePrismaRepository,
    },
    {
        provide: InspectionRepository,
        useClass: InspectionPrismaRepository,
    },
    {
        provide: BlockadeRepository,
        useClass: BlockadePrismaRepository,
    },
    {
        provide: DeepCleaningRepository,
        useClass: DeepCleaningPrismaRepository,
    },
    {
        provide: AccountRepository,
        useClass: AccountPrismaRepository,
    },
    {
        provide: AuditRepository,
        useClass: AuditPrismaRepository,
    },
];

@Module({
    imports: [],
    providers: [PrismaService, ...repositories],
    exports: repositories,
})
export class RepositoryModule {}
