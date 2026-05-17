import type {AxiosError, AxiosRequestConfig} from 'axios';
import axios from 'axios';

export const getBaseURL = () => {
    if (import.meta.env.VITE_API_URL) {
        return import.meta.env.VITE_API_URL;
    }

    if (typeof window === 'undefined') {
        return 'http://localhost:3000';
    }

    const {origin} = window.location;

    if (import.meta.env.PROD) {
        return origin;
    }

    return `${origin.replace(/:\d+$/, '')}:${import.meta.env.VITE_API_PORT ?? 3000}`;
};

export const AXIOS_INSTANCE = axios.create({
    baseURL: getBaseURL(),
    withCredentials: true,
});

export const apiClient = <T>(config: AxiosRequestConfig, options?: AxiosRequestConfig): Promise<T> =>
    AXIOS_INSTANCE({...config, ...options}).then(({data}) => data);

export type ErrorType<Error> = AxiosError<Error>;
