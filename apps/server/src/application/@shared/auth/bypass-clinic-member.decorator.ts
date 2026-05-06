import {SetMetadata} from '@nestjs/common';

/**
 * Bypasses the clinic member check in the auth guard.
 * Use this for endpoints that don't need clinic-member context
 * (e.g. clinic creation, accepting invitations) or that operate
 * exclusively at the User level.
 */
export const BYPASS_CLINIC_MEMBER = 'BypassClinicMember';
export const BypassClinicMember = () => SetMetadata(BYPASS_CLINIC_MEMBER, true);
