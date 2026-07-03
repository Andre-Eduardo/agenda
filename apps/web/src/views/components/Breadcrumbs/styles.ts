import {css} from '@/styled-system/css';

export const nav = css({display: 'flex', alignItems: 'center', gap: '1', fontSize: 'sm', color: 'text.secondary'});
export const separator = css({w: '4', h: '4', color: 'text.tertiary'});
export const current = css({fontWeight: 'medium', color: 'text.primary'});
export const link = css({transitionProperty: 'color', _hover: {color: 'text.primary'}});
