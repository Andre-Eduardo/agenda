import {Given} from '@cucumber/cucumber';
import {chai} from '../support/chai-setup';
import type {Context} from '../support/context';

// ---------------------------------------------------------------------------
// Given — clinic + member creation helpers
// ---------------------------------------------------------------------------

/**
 * Creates a clinic. Stores the new clinic ID as `${ref:id:clinic:<key>}` so
 * subsequent steps can reference it (e.g. when adding members or pacientes).
 *
 * Example:
 *   Given a clinic "primary" exists
 */
Given('a clinic {string} exists', async function (this: Context, key: string) {
    const response = await this.agent.post('/api/v1/clinics').send({
        name: `Clínica ${key}`,
        isPersonalClinic: false,
    });

    chai.expect(
        response.status,
        `Clinic creation failed for "${key}": ${JSON.stringify(response.body)}`,
    ).to.equal(201);

    this.setVariableId('clinic', key, response.body.id as string);
});

/**
 * Creates a clinic member that links a previously-created user to a
 * previously-created clinic.
 *
 * Example:
 *   Given a clinic member "dr_house" with role "PROFESSIONAL" in clinic "primary"
 */
Given(
    'a clinic member {string} with role {string} in clinic {string}',
    async function (this: Context, memberKey: string, role: string, clinicKey: string) {
        const userId = this.getVariableId('user', memberKey);
        const clinicId = this.getVariableId('clinic', clinicKey);

        const response = await this.agent.post('/api/v1/clinic-members').send({
            clinicId,
            userId,
            role,
            displayName: memberKey,
        });

        chai.expect(
            response.status,
            `ClinicMember creation failed for "${memberKey}": ${JSON.stringify(response.body)}`,
        ).to.equal(201);

        this.setVariableId('clinicMember', memberKey, response.body.id as string);
    },
);

/**
 * Backwards-compatible step: keeps "a professional X exists with specialty Y"
 * working but now creates a Clinic + ClinicMember(role=PROFESSIONAL) +
 * Professional in one go. The professional ID continues to be stored as
 * `${ref:id:professional:<key>}` for legacy features.
 */
Given(
    'a professional {string} exists with specialty {string}',
    async function (this: Context, key: string, specialty: string) {
        const userId = this.getVariableId('user', key);

        // 1. Clinic for this professional (auto-created personal clinic)
        const clinicResp = await this.agent.post('/api/v1/clinics').send({
            name: `Clínica de ${key}`,
            isPersonalClinic: true,
        });
        chai.expect(clinicResp.status, JSON.stringify(clinicResp.body)).to.equal(201);
        const clinicId = clinicResp.body.id as string;
        this.setVariableId('clinic', key, clinicId);

        // 2. ClinicMember with role PROFESSIONAL
        const memberResp = await this.agent.post('/api/v1/clinic-members').send({
            clinicId,
            userId,
            role: 'PROFESSIONAL',
            displayName: key,
        });
        chai.expect(memberResp.status, JSON.stringify(memberResp.body)).to.equal(201);
        const clinicMemberId = memberResp.body.id as string;
        this.setVariableId('clinicMember', key, clinicMemberId);

        // 3. Professional record
        const profResp = await this.agent.post('/api/v1/professionals').send({
            clinicMemberId,
            specialty,
            registrationNumber: `CRM-${Math.floor(Math.random() * 100000)}`,
        });
        chai.expect(profResp.status, JSON.stringify(profResp.body)).to.equal(201);
        this.setVariableId('professional', key, profResp.body.id as string);
    },
);
