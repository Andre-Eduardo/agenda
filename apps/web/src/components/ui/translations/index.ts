/* eslint-disable @typescript-eslint/no-explicit-any -- Needed to allow Record with any value */

import type {Translation} from './translation';

export type {Translation};

export type TranslationKey = NamespaceKey<Dictionary<Translation>>;

export type Dictionary<T extends Record<string, any>> = {
    [P in keyof T]: T[P] extends Record<string, any> ? Dictionary<T[P]> : T[P];
};

type NamespaceKey<T extends Record<string, any>> = {
    [TKey in keyof T & string]: T[TKey] extends Record<string, any> ? `${TKey}:${NestedKey<T[TKey]>}` : TKey;
}[keyof T & string];

type NestedKey<TObj extends Record<string, any>> = {
    [TKey in keyof TObj & string]: TObj[TKey] extends any[]
        ? TKey
        : string extends keyof TObj[TKey]
          ? TKey
          : TObj[TKey] extends Record<string, any>
            ? `${TKey}.${NestedKey<TObj[TKey]>}`
            : TKey;
}[keyof TObj & string];

export const supportedLocales = ['en-US', 'pt-BR', 'es-ES'] as const;

export type SupportedLocales = (typeof supportedLocales)[number];
