import {SetMetadata} from '@nestjs/common';

/**
 * Bypasses the company check in the auth guard.
 * This is useful for endpoints that can't have the company information
 * or don't need it, like the company-creation endpoint.
 */
export const BYPASS_COMPANY = 'BypassCompany';
export const BypassCompany = () => SetMetadata(BYPASS_COMPANY, true);
