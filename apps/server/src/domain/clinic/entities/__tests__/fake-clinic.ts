import {Clinic, ClinicAccountType, ClinicId} from '../clinic.entity';

export function fakeClinic(payload: Partial<Clinic> = {}): Clinic {
    return new Clinic({
        id: ClinicId.generate(),
        name: 'Clínica Teste',
        documentId: null,
        phone: null,
        email: null,
        accountType: ClinicAccountType.CLINIC,
        receptionEnabled: true,
        termsAcceptedAt: null,
        termsVersion: null,
        createdAt: new Date(1000),
        updatedAt: new Date(1000),
        ...payload,
    });
}
