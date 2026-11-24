import {randomUUID} from 'crypto';
import {Given} from '@cucumber/cucumber';
import type {ClinicModuleType} from '@prisma/client';
import type {Context} from '../support/context';

// ---------------------------------------------------------------------------
// Given — AI module license + assignment helpers
// ---------------------------------------------------------------------------

/**
 * Contracts an AI module for a previously-created clinic (idempotent — gives
 * generous default seats so scenarios don't hit seat limits incidentally).
 *
 * Example:
 *   Given the clinic "dr_house" has contracted the AI module "AI_AGENT"
 */
Given(
    'the clinic {string} has contracted the AI module {string}',
    async function (this: Context, clinicKey: string, moduleType: string) {
        const clinicId = this.getVariableId('clinic', clinicKey);
        const now = new Date();

        const license = await this.prisma.clinicLicense.upsert({
            where: {clinicId},
            create: {
                id: randomUUID(),
                clinicId,
                includedProfessionals: 5,
                extraProfessionals: 0,
                maxProfessionals: 10,
                createdAt: now,
                updatedAt: now,
            },
            update: {},
        });

        await this.prisma.clinicLicenseModule.upsert({
            where: {
                licenseId_moduleType: {licenseId: license.id, moduleType: moduleType as ClinicModuleType},
            },
            create: {
                id: randomUUID(),
                licenseId: license.id,
                moduleType: moduleType as ClinicModuleType,
                includedSeats: 5,
                extraSeats: 0,
                maxSeats: 10,
            },
            update: {},
        });
    }
);

/**
 * Releases a previously-created clinic member to use an AI module already
 * contracted by their clinic (see "has contracted the AI module" above).
 *
 * Example:
 *   Given the clinic member "dr_house" is released for the AI module "AI_AGENT"
 */
Given(
    'the clinic member {string} is released for the AI module {string}',
    async function (this: Context, memberKey: string, moduleType: string) {
        const memberId = this.getVariableId('clinicMember', memberKey);
        const member = await this.prisma.clinicMember.findUniqueOrThrow({where: {id: memberId}});
        const license = await this.prisma.clinicLicense.findUniqueOrThrow({where: {clinicId: member.clinicId}});

        await this.prisma.clinicModuleAssignment.upsert({
            where: {
                clinicMemberId_moduleType: {clinicMemberId: memberId, moduleType: moduleType as ClinicModuleType},
            },
            create: {
                id: randomUUID(),
                licenseId: license.id,
                clinicMemberId: memberId,
                moduleType: moduleType as ClinicModuleType,
                assignedAt: new Date(),
            },
            update: {},
        });
    }
);

/**
 * Sets the clinic's professional plan limits directly (idempotent), so features that
 * need more than the base (license-less) system's single included professional can
 * add members without hitting `clinic_license.seat_limit_reached`.
 *
 * Example:
 *   Given the clinic "dr_house" has a plan for 5 professionals
 */
Given(
    'the clinic {string} has a plan for {int} professionals',
    async function (this: Context, clinicKey: string, includedProfessionals: number) {
        const clinicId = this.getVariableId('clinic', clinicKey);
        const now = new Date();

        await this.prisma.clinicLicense.upsert({
            where: {clinicId},
            create: {
                id: randomUUID(),
                clinicId,
                includedProfessionals,
                extraProfessionals: 0,
                maxProfessionals: includedProfessionals,
                createdAt: now,
                updatedAt: now,
            },
            update: {includedProfessionals, maxProfessionals: includedProfessionals, updatedAt: now},
        });
    }
);
