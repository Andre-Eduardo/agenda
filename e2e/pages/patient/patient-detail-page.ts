import {expect, type Locator, type Page} from '@playwright/test';
import {BasePage} from '@pages/base-page';

export class PatientDetailPage extends BasePage {
    readonly title: (patientName: string) => Locator;
    readonly documentSubtitle: Locator;
    readonly recordsTab: Locator;
    readonly clinicalProfileTab: Locator;
    readonly alertsTab: Locator;
    readonly formsTab: Locator;
    readonly editButton: Locator;

    constructor(page: Page) {
        super(page);
        this.title = (patientName: string) =>
            page.getByRole('heading', {name: new RegExp(this.escapeRegExp(patientName), 'i')});
        this.documentSubtitle = page.getByText(/documento:/i).first();
        this.recordsTab = page.getByRole('tab', {name: /prontuário/i});
        this.clinicalProfileTab = page.getByRole('tab', {name: /perfil clínico/i});
        this.alertsTab = page.getByRole('tab', {name: /alertas/i});
        this.formsTab = page.getByRole('tab', {name: /formulários/i});
        this.editButton = page.getByRole('button', {name: /^editar$/i});
    }

    async navigate(patientId: string) {
        await this.page.goto(`/patients/${patientId}`);
    }

    async verifyPageLoaded(patientName?: string) {
        await expect(this.page).toHaveURL(/\/patients\/[^/]+$/);
        await expect(this.documentSubtitle).toBeVisible();
        await expect(this.recordsTab).toBeVisible();
        if (patientName) {
            await expect(this.title(patientName)).toBeVisible();
        }
    }
}
