// src/services/api-client.ts

// =============================================================================

// Axios API Client with Token Management

// Uses token-manager.ts to avoid circular dependency with auth-store

// =============================================================================



import axios, {

    AxiosInstance,

    AxiosError,

    InternalAxiosRequestConfig,

} from 'axios';

import {

    getAccessToken,

    getRefreshToken,

    setTokens,

    clearTokens,

} from '@/lib/token-manager';

import { dispatchSessionExpired } from '@/lib/auth-events';



const API_BASE_URL =

    import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';



// =============================================================================

// Axios Instance

// =============================================================================

export const apiClient: AxiosInstance = axios.create({

    baseURL: API_BASE_URL,

    headers: {

        'Content-Type': 'application/json',

    },

    timeout: 30000,

});



// =============================================================================

// Refresh Token Queue (Prevent Race Conditions)

// =============================================================================

let isRefreshing = false;

let failedQueue: Array<{

    resolve: (value: unknown) => void;

    reject: (reason?: unknown) => void;

}> = [];



const processQueue = (error: Error | null, token: string | null = null) => {

    failedQueue.forEach((promise) => {

        if (error) {

            promise.reject(error);

        } else {

            promise.resolve(token);

        }

    });

    failedQueue = [];

};



function getJwtExpSeconds(token: string): number | null {

    try {

        const parts = token.split('.');

        if (parts.length !== 3) return null;



        const base64Url = parts[1];

        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');

        const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=');

        const json = atob(padded);

        const payload = JSON.parse(json) as { exp?: number };

        return typeof payload.exp === 'number' ? payload.exp : null;

    } catch {

        return null;

    }

}



function isTokenExpiredOrExpiringSoon(token: string, skewSeconds = 30): boolean {

    const exp = getJwtExpSeconds(token);

    if (!exp) return false;

    const nowSeconds = Math.floor(Date.now() / 1000);

    return exp <= nowSeconds + skewSeconds;

}



async function refreshAccessToken(): Promise<string> {

    if (isRefreshing) {

        const queuedToken = await new Promise((resolve, reject) => {

            failedQueue.push({ resolve, reject });

        });

        if (typeof queuedToken !== 'string' || !queuedToken) {

            throw new Error('Failed to refresh access token');

        }

        return queuedToken;

    }



    isRefreshing = true;

    try {

        const refreshToken = getRefreshToken();

        if (!refreshToken) {

            throw new Error('No refresh token available');

        }



        const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {

            refreshToken,

        });



        const { accessToken, refreshToken: newRefreshToken } = response.data.data;

        setTokens(accessToken, newRefreshToken);



        const normalizedAccessToken = getAccessToken();

        if (!normalizedAccessToken) {

            throw new Error('Failed to store refreshed access token');

        }



        processQueue(null, normalizedAccessToken);

        return normalizedAccessToken;

    } catch (refreshError) {

        processQueue(refreshError as Error, null);

        throw refreshError;

    } finally {

        isRefreshing = false;

    }

}



// =============================================================================

// Request Interceptor

// =============================================================================

apiClient.interceptors.request.use(

    async (config: InternalAxiosRequestConfig) => {

        // ✅ Use token-manager (no circular dependency)

        let token = getAccessToken();



        if (

            (!token && getRefreshToken()) ||

            (token && isTokenExpiredOrExpiringSoon(token) && getRefreshToken())

        ) {

            try {

                token = await refreshAccessToken();

            } catch {

                token = getAccessToken();

            }

        }



        config.headers = (config.headers ?? {}) as any;

        if (token) {
            // console.log('Attaching Token:', token.substring(0, 10) + '...');
            (config.headers as any).Authorization = `Bearer ${token}`;
        } else {
            console.warn('No token found in token-manager');
        }



        // Prevent conditional GET caching (ETag/304) from browser/proxies

        delete (config.headers as any)['If-None-Match'];

        delete (config.headers as any)['if-none-match'];

        delete (config.headers as any)['If-Modified-Since'];

        delete (config.headers as any)['if-modified-since'];

        return config;

    },

    (error) => Promise.reject(error)

);



// =============================================================================

// Response Interceptor (Auto Refresh Token + Auto Unwrap)

// =============================================================================

apiClient.interceptors.response.use(

    (response) => {

        // ✅ Auto-unwrap Standard API Response { success: true, data: [...] }

        // This prevents "data.map is not a function" errors across all services

        const responseData = response.data;



        // Check if this is a Standard Wrapped Response

        if (

            responseData &&

            typeof responseData === 'object' &&

            'success' in responseData &&

            'data' in responseData

        ) {

            // Validate success flag

            if (!responseData.success) {

                // If backend explicitly says success: false, reject with error

                const errorMessage =

                    responseData.message || responseData.error || 'API Error';

                return Promise.reject(new Error(errorMessage));

            }



            // ✅ Unwrap: Return inner data directly to services

            // Services will receive Array/Object directly, not { success, data }

            response.data = responseData.data;

        }



        // For blob/file downloads or non-standard responses, return as-is

        return response;

    },

    async (error: AxiosError) => {

        const originalRequest = error.config as InternalAxiosRequestConfig & {

            _retry?: boolean;

        };



        // 401 = Unauthorized, need to refresh token

        if (error.response?.status === 401 && !originalRequest._retry) {

            // If already refreshing, queue this request

            if (isRefreshing) {

                return new Promise((resolve, reject) => {

                    failedQueue.push({ resolve, reject });

                }).then((token) => {

                    const refreshedToken = typeof token === 'string' ? token : getAccessToken();

                    originalRequest.headers = originalRequest.headers ?? {};

                    if (refreshedToken) {

                        originalRequest.headers.Authorization = `Bearer ${refreshedToken}`;

                    }

                    return apiClient(originalRequest);

                });

            }



            originalRequest._retry = true;



            try {

                const accessToken = await refreshAccessToken();



                originalRequest.headers = originalRequest.headers ?? {};

                originalRequest.headers.Authorization = `Bearer ${accessToken}`;

                return apiClient(originalRequest);

            } catch (refreshError) {

                // Refresh failed - logout user

                // ✅ Clear tokens via token-manager

                clearTokens();



                // Dispatch event for React to handle navigation

                dispatchSessionExpired();



                return Promise.reject(refreshError);

            } finally {

                // no-op (refreshAccessToken owns isRefreshing)

            }

        }



        return Promise.reject(error);

    }

);



// =============================================================================

// Helper: Extract API Data

// =============================================================================

export interface StandardApiResponse<T> {

    success: boolean;

    data: T;

    error?: string;

    message?: string;

    meta?: {

        total?: number;

        page?: number;

        limit?: number;

    };

}



export function extractApiData<T>(response: {

    data: StandardApiResponse<T>;

}): T {

    if (!response.data.success) {

        throw new Error(

            response.data.message || response.data.error || 'API Error'

        );

    }

    return response.data.data;

}

