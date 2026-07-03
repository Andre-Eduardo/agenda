import {expect, type Locator, type Page} from '@playwright/test';
import {BasePage} from '@pages/base-page';

export interface PatientIdentityData {
    name: string;
    documentId: string;
    birthDate?: string;
    gender?: 'MALE' | 'FEMALE' | 'OTHER';
}

export interface PatientContactData {
    phone?: string;
    email?: string;
    emergencyContactName?: string;
    emergencyContactPhone?: string;
}

export interface PatientAddressData {
    zipCode?: string;
    street?: string;
    number?: string;
    complement?: string;
    neighborhood?: string;
    city?: string;
    state?: string;
}

export interface PatientHealthData {
    allergies?: string;
    notes?: string;
}

export class PatientNewPage extends BasePage {
    readonly title: Locator;
    readonly subtitle: Locator;

    readonly identityTab: Locator;
    readonly contactTab: Locator;
    readonly addressTab: Locator;
    readonly healthTab: Locator;

    readonly nameInput: Locator;
    readonly documentIdInput: Locator;
    readonly birthDateInput: Locator;
    readonly genderSelect: Locator;

    readonly phoneInput: Locator;
    readonly emailInput: Locator;
    readonly emergencyContactNameInput: Locator;
    readonly emergencyContactPhoneInput: Locator;

    readonly zipCodeInput: Locator;
    readonly streetInput: Locator;
    readonly numberInput: Locator;
    readonly complementInput: Locator;
    readonly neighborhoodInput: Locator;
    readonly cityInput: Locator;
    readonly stateSelect: Locator;

    readonly allergiesTextarea: Locator;
    readonly notesTextarea: Locator;

    readonly cancelButton: Locator;
    readonly backButton: Locator;
    readonly nextButton: Locator;
    readonly submitButton: Locator;

    readonly nameError: Locator;
    readonly documentIdError: Locator;
    readonly emailError: Locator;

    constructor(page: Page) {
        super(page);
        this.title = page.getByRole('heading', {name: /^novo paciente$/i});
        this.subtitle = page.getByText(/anamnese clínica é registrada nas evoluções/i);

        this.identityTab = page.getByRole('tab', {name: /identificação/i});
        this.contactTab = page.getByRole('tab', {name: /contato/i});
        this.addressTab = page.getByRole('tab', {name: /endereço/i});
        this.healthTab = page.getByRole('tab', {name: /saúde/i});

        this.nameInput = page.locator('input[name="name"]');
        this.documentIdInput = page.locator('input[name="documentId"]');
        this.birthDateInput = page.locator('input[name="birthDate"]');
        this.genderSelect = page.locator('select[name="gender"]');

        this.phoneInput = page.locator('input[name="phone"]');
        this.emailInput = page.locator('input[name="email"]');
        this.emergencyContactNameInput = page.locator('input[name="emergencyContactName"]');
        this.emergencyContactPhoneInput = page.locator('input[name="emergencyContactPhone"]');

        this.zipCodeInput = page.locator('input[name="zipCode"]');
        this.streetInput = page.locator('input[name="street"]');
        this.numberInput = page.locator('input[name="number"]');
        this.complementInput = page.locator('input[name="complement"]');
        this.neighborhoodInput = page.locator('input[name="neighborhood"]');
        this.cityInput = page.locator('input[name="city"]');
        this.stateSelect = page.locator('select[name="state"]');

        this.allergiesTextarea = page.locator('textarea[name="allergies"]');
        this.notesTextarea = page.locator('textarea[name="notes"]');

        this.cancelButton = page.getByRole('button', {name: /^cancelar$/i});
        this.backButton = page.getByRole('button', {name: /^voltar$/i});
        this.nextButton = page.getByRole('button', {name: /^avançar$/i});
        this.submitButton = page.getByRole('button', {name: /salvar paciente/i});

        this.nameError = page.getByText(/nome é obrigatório/i);
        this.documentIdError = page.getByText(/documento é obrigatório/i);
        this.emailError = page.getByText(/e-mail inválido/i);
    }

    async navigate() {
        await this.page.goto('/patients/new');
    }

    async verifyPageLoaded() {
        await expect(this.page).toHaveURL(/\/patients\/new$/);
        await expect(this.title).toBeVisible();
        await expect(this.subtitle).toBeVisible();
    }

    async fillIdentity(data: PatientIdentityData) {
        await this.identityTab.click();
        await this.nameInput.fill(data.name);
        await this.documentIdInput.fill(data.documentId);
        if (data.birthDate) await this.birthDateInput.fill(data.birthDate);
        if (data.gender) await this.genderSelect.selectOption(data.gender);
    }

    async fillContact(data: PatientContactData) {
        await this.contactTab.click();
        if (data.phone) await this.phoneInput.fill(data.phone);
        if (data.email) await this.emailInput.fill(data.email);
        if (data.emergencyContactName) await this.emergencyContactNameInput.fill(data.emergencyContactName);
        if (data.emergencyContactPhone) await this.emergencyContactPhoneInput.fill(data.emergencyContactPhone);
    }

    async fillAddress(data: PatientAddressData) {
        await this.addressTab.click();
        if (data.zipCode) await this.zipCodeInput.fill(data.zipCode);
        if (data.street) await this.streetInput.fill(data.street);
        if (data.number) await this.numberInput.fill(data.number);
        if (data.complement) await this.complementInput.fill(data.complement);
        if (data.neighborhood) await this.neighborhoodInput.fill(data.neighborhood);
        if (data.city) await this.cityInput.fill(data.city);
        if (data.state) await this.stateSelect.selectOption(data.state);
    }

    async fillHealth(data: PatientHealthData) {
        await this.healthTab.click();
        if (data.allergies) await this.allergiesTextarea.fill(data.allergies);
        if (data.notes) await this.notesTextarea.fill(data.notes);
    }

    async submit() {
        await this.healthTab.click();
        await this.submitButton.click();
    }

    /** Clicks submit with the form empty, then returns to the identity tab where required errors render. */
    async attemptEmptySubmit() {
        await this.healthTab.click();
        await this.submitButton.click();
        await this.identityTab.click();
    }
}
