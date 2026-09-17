import {expect, type Locator, type Page} from '@playwright/test';
import {BasePage} from '@pages/base-page';

export class AppointmentListPage extends BasePage {
    readonly title: Locator;
    readonly newAppointmentButton: Locator;

    readonly dayViewButton: Locator;
    readonly weekViewButton: Locator;
    readonly monthViewButton: Locator;
    readonly roomsViewButton: Locator;

    readonly patientSearchInput: Locator;
    readonly createSubmitButton: Locator;
    readonly createCancelButton: Locator;

    readonly editAppointmentButton: Locator;
    readonly cancelAppointmentButton: Locator;
    readonly confirmCancelButton: Locator;

    // New/Edit appointment dialog fields (shared labels/roles across both dialogs —
    // only one dialog is ever mounted at a time).
    readonly dateInput: Locator;
    readonly timeInput: Locator;
    readonly durationSelect: Locator;
    readonly roomSelect: Locator;
    readonly saveButton: Locator;

    // Soft-warning confirm dialog (working-hours / member-block violations — Fase 3).
    readonly availabilityWarningDialog: Locator;
    readonly confirmOutsideAvailabilityButton: Locator;
    readonly cancelAvailabilityWarningButton: Locator;

    constructor(page: Page) {
        super(page);
        this.title = page.getByRole('heading', {name: /^agenda$/i});
        this.newAppointmentButton = page.getByRole('button', {name: /novo agendamento/i});

        this.dayViewButton = page.getByRole('button', {name: /^dia$/i});
        this.weekViewButton = page.getByRole('button', {name: /^semana$/i});
        this.monthViewButton = page.getByRole('button', {name: /^mês$/i});
        this.roomsViewButton = page.getByRole('button', {name: /^salas$/i});

        this.patientSearchInput = page.getByPlaceholder(/buscar paciente/i);
        this.createSubmitButton = page.getByRole('button', {name: /agendar consulta/i});
        this.createCancelButton = page.getByRole('dialog').getByRole('button', {name: /^cancelar$/i});

        this.editAppointmentButton = page.getByRole('button', {name: /^editar$/i});
        this.cancelAppointmentButton = page.getByRole('button', {name: /cancelar consulta/i});
        this.confirmCancelButton = page.getByRole('button', {name: /confirmar cancelamento/i});

        this.dateInput = page.getByLabel('Data');
        this.timeInput = page.getByLabel('Horário');
        this.durationSelect = page.getByRole('combobox', {name: /^duração$/i});
        this.roomSelect = page.getByRole('combobox', {name: /^sala$/i});
        this.saveButton = page.getByRole('button', {name: /agendar consulta|salvar alterações/i});

        this.availabilityWarningDialog = page.getByRole('dialog', {
            name: /fora da disponibilidade do profissional/i,
        });
        this.confirmOutsideAvailabilityButton = this.availabilityWarningDialog.getByRole('button', {
            name: /agendar mesmo assim/i,
        });
        this.cancelAvailabilityWarningButton = this.availabilityWarningDialog.getByRole('button', {
            name: /^cancelar$/i,
        });
    }

    async navigate() {
        await this.page.goto('/appointments');
    }

    async verifyPageLoaded() {
        await expect(this.page).toHaveURL(/\/appointments$/);
        await expect(this.title).toBeVisible();
        await expect(this.newAppointmentButton).toBeVisible();
    }

    apptBlock(patientName: string): Locator {
        return this.page.getByRole('button', {name: new RegExp(this.escapeRegExp(patientName))});
    }

    async createAppointment(
        patientName: string,
        options: {
            date?: string;
            startTime?: string;
            durationMin?: number;
            room?: string;
            confirmOutsideAvailability?: boolean;
        } = {}
    ) {
        await this.newAppointmentButton.click();
        await this.patientSearchInput.fill(patientName);

        const patientOption = this.page.getByRole('button', {name: patientName});
        await patientOption.click();

        if (options.date) {
            await this.dateInput.fill(options.date);
        }

        if (options.startTime) {
            await this.timeInput.fill(options.startTime);
        }

        if (options.durationMin !== undefined) {
            await this.selectDuration(options.durationMin);
        }

        if (options.room) {
            await this.selectRoom(options.room);
        }

        await this.createSubmitButton.click();

        if (options.confirmOutsideAvailability) {
            await expect(this.availabilityWarningDialog).toBeVisible();
            await this.confirmOutsideAvailabilityButton.click();
        }

        // Dialog only closes on mutation success — waiting here avoids racing the calendar refetch.
        await expect(this.page.getByRole('dialog', {name: /novo agendamento/i})).toBeHidden();
    }

    /** Same as `createAppointment`, but expects a hard failure (e.g. room double-booking) —
     * the create dialog stays open and no confirm dialog is offered, since room conflicts
     * cannot happen physically and are never soft-confirmable. */
    async createAppointmentExpectRoomConflict(
        patientName: string,
        options: {date?: string; startTime?: string; durationMin?: number; room?: string} = {}
    ) {
        await this.newAppointmentButton.click();
        await this.patientSearchInput.fill(patientName);

        const patientOption = this.page.getByRole('button', {name: patientName});
        await patientOption.click();

        if (options.date) {
            await this.dateInput.fill(options.date);
        }

        if (options.startTime) {
            await this.timeInput.fill(options.startTime);
        }

        if (options.durationMin !== undefined) {
            await this.selectDuration(options.durationMin);
        }

        if (options.room) {
            await this.selectRoom(options.room);
        }

        await this.createSubmitButton.click();
        await expect(this.page.getByText(/erro ao criar consulta/i)).toBeVisible();
        await expect(this.page.getByRole('dialog', {name: /novo agendamento/i})).toBeVisible();
    }

    async selectDuration(minutes: number) {
        const label =
            minutes >= 60 ? `${Math.floor(minutes / 60)}h${minutes % 60 ? ` ${minutes % 60}min` : ''}` : `${minutes} min`;

        await this.durationSelect.click();
        await this.page.getByRole('option', {name: label, exact: true}).click();
    }

    async selectRoom(roomName: string) {
        await this.roomSelect.click();
        await this.page.getByRole('option', {name: roomName, exact: true}).click();
    }

    /** The colored dot rendered on a calendar block when the appointment has a room assigned. */
    roomBadge(roomName: string): Locator {
        return this.page.getByTitle(`Sala: ${roomName}`);
    }

    /** Header cell of a room column in the "Salas" view. */
    roomColumnHeader(roomName: string): Locator {
        return this.page.getByText(roomName, {exact: true});
    }

    /** Header cell for appointments without a room assigned, in the "Salas" view. */
    noRoomColumnHeader(): Locator {
        return this.page.getByText('Sem sala', {exact: true});
    }

    async openAppointment(patientName: string) {
        await this.apptBlock(patientName).click();
    }

    async cancelOpenAppointment() {
        await this.cancelAppointmentButton.click();
        await this.confirmCancelButton.click();
        await expect(this.page.getByRole('dialog', {name: /cancelar consulta/i})).toBeHidden();
    }


    /** Edits the currently-open appointment's date/time/room via the Edit dialog. */
    async rescheduleOpenAppointment(options: {
        date?: string;
        startTime?: string;
        room?: string;
        confirmOutsideAvailability?: boolean;
    }) {
        await this.editAppointmentButton.click();

        if (options.date) {
            await this.dateInput.fill(options.date);
        }

        if (options.startTime) {
            await this.timeInput.fill(options.startTime);
        }

        if (options.room) {
            await this.selectRoom(options.room);
        }

        await this.saveButton.click();

        if (options.confirmOutsideAvailability) {
            await expect(this.availabilityWarningDialog).toBeVisible();
            await this.confirmOutsideAvailabilityButton.click();
        }

        await expect(this.page.getByRole('dialog', {name: /editar agendamento/i})).toBeHidden();
    }
}
