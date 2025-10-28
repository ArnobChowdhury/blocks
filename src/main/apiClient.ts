/*
 * Blocks Tracker - Todoing and habit tracking in one place.
 * Copyright (C) 2025 Chowdhury Md Sami Al Muntahi
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program. If not, see <https://www.gnu.org/licenses/>.
 */
import axios from 'axios';
import keytar from 'keytar';
import log from 'electron-log';
import {
  API_BASE_URL,
  KEYCHAIN_SERVICE,
  KEYCHAIN_REFRESH_TOKEN_ACCOUNT,
} from './constants';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
});

let onAuthFailure: () => void;
let onTokenRefreshed: (
  newAccessToken: string,
  newRefreshToken: string,
) => Promise<{ email: string; id: string }>;

export const registerAuthFailureHandler = (handler: () => void) => {
  onAuthFailure = handler;
};

export const registerTokenRefreshHandler = (
  handler: (
    newAccessToken: string,
    newRefreshToken: string,
  ) => Promise<{ email: string; id: string }>,
) => {
  onTokenRefreshed = handler;
};

let inMemoryToken: string | null = null;

export const setInMemoryToken = (token: string | null) => {
  inMemoryToken = token;
  log.info('[APIClient] In-memory token updated.');
};

export const getInMemoryToken = () => inMemoryToken;

// Variables to handle token refresh race conditions
let isRefreshing = false;
let failedQueue: {
  resolve: (value: any) => void;
  reject: (reason?: any) => void;
}[] = [];

// Request interceptor to add the auth token to every request
apiClient.interceptors.request.use(
  (config) => {
    if (inMemoryToken) {
      config.headers.Authorization = `Bearer ${inMemoryToken}`;
    } else {
      log.warn(
        '[APIClient] No in-memory token; request will be unauthenticated.',
      );
    }
    return config;
  },
  (error) => Promise.reject(error),
);

const processQueue = (error: Error | null, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });

  failedQueue = [];
};

/**
 * Response interceptor to handle token refresh on 401 errors.
 * It also handles concurrent requests by queueing them while a token is being refreshed.
 */
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return apiClient(originalRequest);
          })
          .catch((err) => {
            return Promise.reject(err);
          });
      }

      isRefreshing = true;
      log.info('[APIClient] Received 401. Attempting to refresh token...');

      return new Promise(async (resolve, reject) => {
        try {
          const accessToken = inMemoryToken;
          const refreshToken = await keytar.getPassword(
            KEYCHAIN_SERVICE,
            KEYCHAIN_REFRESH_TOKEN_ACCOUNT,
          );

          if (!accessToken || !refreshToken) {
            throw new Error(
              'No access or refresh token found for refresh attempt.',
            );
          }

          const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
            accessToken,
            refreshToken,
          });

          const { accessToken: newAccessToken, refreshToken: newRefreshToken } =
            response.data.result.data;

          await onTokenRefreshed?.(newAccessToken, newRefreshToken);

          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
          processQueue(null, newAccessToken);
          resolve(apiClient(originalRequest));
        } catch (refreshError: any) {
          log.error(
            '[APIClient] Token refresh failed. Triggering auth failure.',
            refreshError,
          );
          processQueue(refreshError, null);
          onAuthFailure?.();
          reject(refreshError);
        } finally {
          isRefreshing = false;
        }
      });
    }

    return Promise.reject(error);
  },
);

export default apiClient;
