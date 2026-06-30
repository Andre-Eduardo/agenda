import {useEffect} from 'react';
import {AxiosError, type ApiProblem} from '@agenda-app/client';
import {useQueryClient} from '@tanstack/react-query';
import {useTranslation} from 'react-i18next';
import {toast} from 'sonner';

type ApiError = AxiosError<ApiProblem>;

export const isApiError = (error: unknown): error is ApiError => error instanceof AxiosError;

const getStatus = (error: unknown): number | undefined => {
    if (!isApiError(error)) return undefined;

    return error.response?.status;
};

export const isUnauthorizedError = (error: unknown): error is ApiError => getStatus(error) === 401;

export const isForbiddenError = (error: unknown): error is ApiError => getStatus(error) === 403;

export const isUnexpectedError = (error: unknown): error is ApiError => getStatus(error) === 500;

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
                        const problem = error.response?.data;

                        toast.error(problem?.title ?? t('states.error'), {
                            description: problem?.detail,
                        });
                    } else {
                        toast.error(t('states.error'), {
                            description: error.message,
                        });
                    }
                },
                retry: handleRetry,
            },
        });
    }, [client, defaultOptions, t]);

    return null;
};
