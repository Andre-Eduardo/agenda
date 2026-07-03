import {expect, type Locator, type Page} from '@playwright/test';
import {BasePage} from '@pages/base-page';

export interface VitalsData {
    systolic?: string;
    diastolic?: string;
    heartRate?: string;
    spo2?: string;
    temperature?: string;
    weight?: string;
    height?: string;
}

export class RecordNewPage extends BasePage {
    readonly title: Locator;

    readonly subjectiveTextarea: Locator;
    readonly objectiveTextarea: Locator;
    readonly assessmentTextarea: Locator;
    readonly planTextarea: Locator;

    readonly systolicInput: Locator;
    readonly diastolicInput: Locator;
    readonly heartRateInput: Locator;
    readonly spo2Input: Locator;
    readonly temperatureInput: Locator;
    readonly weightInput: Locator;
    readonly heightInput: Locator;

    readonly cancelButton: Locator;
    readonly publishButton: Locator;
    readonly confirmPublishButton: Locator;
    readonly reviewButton: Locator;
    readonly discardConfirmButton: Locator;

    constructor(page: Page) {
        super(page);
        this.title = page.getByRole('heading', {name: /^nova evolução$/i});

        this.subjectiveTextarea = page.getByRole('textbox', {name: 'Subjetivo'});
        this.objectiveTextarea = page.getByRole('textbox', {name: 'Objetivo'});
        this.assessmentTextarea = page.getByRole('textbox', {name: 'Avaliação'});
        this.planTextarea = page.getByRole('textbox', {name: 'Plano'});

        this.systolicInput = page.getByLabel('Pressão arterial sistólica');
        this.diastolicInput = page.getByLabel('Pressão arterial diastólica');
        this.heartRateInput = page.getByLabel('Frequência cardíaca');
        this.spo2Input = page.getByLabel('Saturação O₂');
        this.temperatureInput = page.getByLabel('Temperatura');
        this.weightInput = page.getByLabel('Peso');
        this.heightInput = page.getByLabel('Altura');

        this.cancelButton = page.getByRole('button', {name: /^cancelar$/i});
        this.publishButton = page.getByRole('button', {name: /publicar evolução/i}).first();
        this.confirmPublishButton = page.getByRole('button', {name: /publicar evolução/i}).last();
        this.reviewButton = page.getByRole('button', {name: /voltar e revisar/i});
        this.discardConfirmButton = page.getByRole('button', {name: /^descartar$/i});
    }

    async navigate(patientId: string) {
        await this.page.goto(`/patients/${patientId}/records/new`);
    }

    async verifyPageLoaded() {
        await expect(this.page).toHaveURL(/\/patients\/[^/]+\/records\/new$/);
        await expect(this.title).toBeVisible();
    }

    async fillSoap(data: {subjective?: string; objective?: string; assessment?: string; plan?: string}) {
        if (data.subjective) await this.subjectiveTextarea.fill(data.subjective);
        if (data.objective) await this.objectiveTextarea.fill(data.objective);
        if (data.assessment) await this.assessmentTextarea.fill(data.assessment);
        if (data.plan) await this.planTextarea.fill(data.plan);
    }

    async fillVitals(data: VitalsData) {
        if (data.systolic) await this.systolicInput.fill(data.systolic);
        if (data.diastolic) await this.diastolicInput.fill(data.diastolic);
        if (data.heartRate) await this.heartRateInput.fill(data.heartRate);
        if (data.spo2) await this.spo2Input.fill(data.spo2);
        if (data.temperature) await this.temperatureInput.fill(data.temperature);
        if (data.weight) await this.weightInput.fill(data.weight);
        if (data.height) await this.heightInput.fill(data.height);
    }

    async publish() {
        await this.publishButton.click();
        await this.confirmPublishButton.click();
    }

    async cancelAndDiscard() {
        await this.cancelButton.click();
        await this.discardConfirmButton.click();
    }
}
