import {SetMetadata} from '@nestjs/common';

/**
 * Bypasses the professional check in the auth guard.
 * This is useful for endpoints that can't have the professional information
 * or don't need it, like the professional-creation endpoint.
 */
export const BYPASS_PROFESSIONAL = 'BypassProfessional';
export const BypassProfessional = () => SetMetadata(BYPASS_PROFESSIONAL, true);
