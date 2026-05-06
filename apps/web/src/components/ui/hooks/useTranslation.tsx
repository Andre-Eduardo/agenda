import type {KeyPrefix, Namespace, TFunction} from 'i18next';
import type {FallbackNs, UseTranslationResponse} from 'react-i18next';
import {useTranslation as useI18nTranslation} from 'react-i18next';
import type {UnionToIntersection} from 'type-fest';

// @ts-expect-error -- "translation" is the default namespace
// eslint-disable-next-line unused-imports/no-unused-vars -- For organization purpose
const defaultNamespace: Namespace = 'translation';

type PrefixMapping = UnionToIntersection<
    {
        [N in Extract<Namespace, string>]: {
            [K in KeyPrefix<N> as `${N}:${K}`]: TFunction<N, K>;
        };
    }[Extract<Namespace, string>]
>;

type KeyPrefixes = keyof PrefixMapping;

export type TranslationFunction<K extends KeyPrefixes> = PrefixMapping[K];

export type DynamicKey = '%dynamic';

type DynamicTranslationResponse = {
    t: (key: string, options?: never) => string;
};

export function useTranslation(prefix: DynamicKey): DynamicTranslationResponse;

export function useTranslation<N extends Namespace = typeof defaultNamespace>(
    namespace?: N
): UseTranslationResponse<N, undefined>;

export function useTranslation<N extends Namespace = typeof defaultNamespace, P extends KeyPrefix<N> = undefined>(
    prefix: `${N & string}:${P}`
): UseTranslationResponse<N, P>;

export function useTranslation<
    N extends Namespace = typeof defaultNamespace,
    P extends KeyPrefix<FallbackNs<N>> = undefined,
>(prefixOrNs?: string): UseTranslationResponse<FallbackNs<N>, P> {
    const isNamespace = !(prefixOrNs?.includes(':') ?? false);

    return useI18nTranslation<N, P>(isNamespace ? (prefixOrNs as N) : undefined, {
        keyPrefix: !isNamespace ? (prefixOrNs as P) : undefined,
    });
}
