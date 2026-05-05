import {useEffect} from 'react';
import type {ApiProblem} from '@agenda-app/client';
import {AxiosError} from 'axios';
import {useTranslation} from 'react-i18next';
import {useQueryClient} from '@tanstack/react-query';
import {toast} from 'sonner';

type ApiError = AxiosError<ApiProblem>;

export const isApiError = (error: unknown): error is ApiError => error instanceof AxiosError;

export const isUnauthorizedError = (error: unknown): error is ApiError =>
    isApiError(error) && error.response?.status === 401;

export const isForbiddenError = (error: unknown): error is ApiError =>
    isApiError(error) && error.response?.status === 403;

export const isUnexpectedError = (error: unknown): error is ApiError =>
    isApiError(error) && error.response?.status === 500;

export const QueryErrorHandler = () => {
    const {t} = useTranslation();
    const client = useQueryClient();
    const defaultOptions = client.getDefaultOptions();

    useEffect(() => {
        const handleRetry = (failureCount: number, error: Error) => {
            if (isApiError(error) && !isUnexpectedError(error)) {
                return false;
            }

            return failureCount < 3;
        };

        client.setDefaultOptions({
            ...defaultOptions,
            queries: {
                ...defaultOptions?.queries,
                throwOnError: (error) => isUnauthorizedError(error),
                retry: handleRetry,
            },
            mutations: {
                ...defaultOptions?.mutations,
                onError: (error) => {
                    if (isUnauthorizedError(error)) {
                        return;
                    }

                    if (isApiError(error)) {
                        toast.error(error.response?.data.title ?? t('states.error'), {
                            description: error.response?.data.detail,
                        });
                    } else {
                        toast.error(t('states.error'), {
                            description: (error as Error).message,
                        });
                    }
                },
                retry: handleRetry,
            },
        });
    }, [client, defaultOptions, t]);

    return null;
};
