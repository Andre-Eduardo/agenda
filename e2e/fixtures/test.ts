import {test as base} from '@playwright/test';
import {login} from '@lib/auth';
import {
    createTestPatient,
    createTestPatients,
    createTestProfessional,
    createTestProfessionals,
    createTestUser,
    createTestUsers,
    getPrismaClient,
    type CreatedProfessional,
    type CreateProfessionalEntry,
} from '@lib/factories';
import {SignInPage} from '@pages/auth/sign-in-page';
import {AppointmentListPage} from '@pages/appointment/appointment-list-page';
import {DashboardPage} from '@pages/dashboard/dashboard-page';
import {PatientDetailPage} from '@pages/patient/patient-detail-page';
import {PatientEditPage} from '@pages/patient/patient-edit-page';
import {PatientListPage} from '@pages/patient/patient-list-page';
import {PatientNewPage} from '@pages/patient/patient-new-page';
import {RecordDetailPage} from '@pages/record/record-detail-page';
import {RecordNewPage} from '@pages/record/record-new-page';
import {SettingsPage} from '@pages/settings/settings-page';
import {SidebarComponent} from '@components/sidebar/sidebar-component';

export {expect} from '@playwright/test';

type CreateAuthenticatedProfessionalOptions = CreateProfessionalEntry & {autoLogin?: boolean};

type CustomFixtures = {
    // Infra
    db: ReturnType<typeof getPrismaClient>;
    isSmallScreen: boolean;
    isMediumScreen: boolean;
    isLargeScreen: boolean;

    // Factories
    createUser: typeof createTestUser;
    createUsers: typeof createTestUsers;
    createProfessional: typeof createTestProfessional;
    createProfessionals: typeof createTestProfessionals;
    createPatient: typeof createTestPatient;
    createPatients: typeof createTestPatients;
    createAuthenticatedProfessional: (
        options?: CreateAuthenticatedProfessionalOptions
    ) => Promise<CreatedProfessional>;

    // Page Objects
    signInPage: SignInPage;
    dashboardPage: DashboardPage;
    appointmentListPage: AppointmentListPage;
    patientListPage: PatientListPage;
    patientNewPage: PatientNewPage;
    patientDetailPage: PatientDetailPage;
    patientEditPage: PatientEditPage;
    recordNewPage: RecordNewPage;
    recordDetailPage: RecordDetailPage;
    settingsPage: SettingsPage;

    // Components
    sidebar: SidebarComponent;
};

export const test = base.extend<CustomFixtures>({
    db: async ({}, use) => {
        await use(getPrismaClient());
    },
    isSmallScreen: async ({viewport}, use) => {
        await use(viewport ? viewport.width < 640 : false);
    },
    isMediumScreen: async ({viewport}, use) => {
        await use(viewport ? viewport.width >= 640 && viewport.width < 1024 : false);
    },
    isLargeScreen: async ({viewport}, use) => {
        await use(viewport ? viewport.width >= 1024 : false);
    },

    createUser: async ({}, use) => {
        await use(createTestUser);
    },
    createUsers: async ({}, use) => {
        await use(createTestUsers);
    },
    createProfessional: async ({}, use) => {
        await use(createTestProfessional);
    },
    createProfessionals: async ({}, use) => {
        await use(createTestProfessionals);
    },
    createPatient: async ({}, use) => {
        await use(createTestPatient);
    },
    createPatients: async ({}, use) => {
        await use(createTestPatients);
    },

    createAuthenticatedProfessional: async ({page}, use) => {
        const factory = async (options: CreateAuthenticatedProfessionalOptions = {}) => {
            const {autoLogin = true, ...entry} = options;
            const professional = await createTestProfessional({
                ...entry,
                user: {globalRole: 'OWNER', ...(entry.user ?? {})},
            });

            if (autoLogin) {
                await login(page, {
                    username: professional.user.username,
                    password: professional.user.password,
                    professionalId: professional.id,
                });
            }

            return professional;
        };

        await use(factory);
    },

    signInPage: async ({page}, use) => {
        await use(new SignInPage(page));
    },
    dashboardPage: async ({page}, use) => {
        await use(new DashboardPage(page));
    },
    appointmentListPage: async ({page}, use) => {
        await use(new AppointmentListPage(page));
    },
    patientListPage: async ({page}, use) => {
        await use(new PatientListPage(page));
    },
    patientNewPage: async ({page}, use) => {
        await use(new PatientNewPage(page));
    },
    patientDetailPage: async ({page}, use) => {
        await use(new PatientDetailPage(page));
    },
    patientEditPage: async ({page}, use) => {
        await use(new PatientEditPage(page));
    },
    recordNewPage: async ({page}, use) => {
        await use(new RecordNewPage(page));
    },
    recordDetailPage: async ({page}, use) => {
        await use(new RecordDetailPage(page));
    },
    settingsPage: async ({page}, use) => {
        await use(new SettingsPage(page));
    },

    sidebar: async ({page}, use) => {
        await use(new SidebarComponent(page));
    },
});
