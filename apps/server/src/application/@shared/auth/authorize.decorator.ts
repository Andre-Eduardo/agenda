import {SetMetadata} from '@nestjs/common';
import type {Permission} from '../../../domain/auth';

export const AUTHORIZE_KEY = 'authorize';
export const Authorize = (...permissions: Permission[]) => SetMetadata(AUTHORIZE_KEY, permissions);
