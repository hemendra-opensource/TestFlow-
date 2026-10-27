import { supabase } from './supabase.js';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://testflow-aqii.onrender.com/api/v1';

export class ApiError extends Error {
  constructor(message, status = 500, details = null) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.details = details;
  }
}

/**
 * Centralized API client communicating with TeamFlow backend
 */
export async function apiRequest(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

  // Retrieve current session token from Supabase Auth
  const { data: sessionData } = await supabase.auth.getSession();
  const accessToken = sessionData?.session?.access_token;

  const headers = {
    'Content-Type': 'application/json',
    ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    ...options.headers,
  };

  const config = {
    ...options,
    headers,
  };

  if (options.body && typeof options.body === 'object') {
    config.body = JSON.stringify(options.body);
  }

  try {
    const response = await fetch(url, config);

    if (!response.ok) {
      const result = await response.json().catch(() => null);
      // If 401 Unauthorized, dispatch auth expired event
      if (response.status === 401) {
        window.dispatchEvent(new CustomEvent('teamflow:auth-expired'));
      }

      const errorMessage =
        result?.error?.message ||
        result?.message ||
        `Request failed with status ${response.status}`;

      throw new ApiError(errorMessage, response.status, result?.error?.details);
    }

    if (options.responseType === 'blob') {
      return await response.blob();
    }
    if (options.responseType === 'text') {
      return await response.text();
    }

    const result = await response.json().catch(() => null);

    if (options.rawResponse) {
      return result;
    }

    return result?.data !== undefined ? result.data : result;
  } catch (err) {
    if (err instanceof ApiError) {
      throw err;
    }
    throw new ApiError(err.message || 'Network connection failed', 500);
  }
}

export const apiClient = {
  get: (endpoint, options) => apiRequest(endpoint, { ...options, method: 'GET' }),
  post: (endpoint, body, options) => apiRequest(endpoint, { ...options, method: 'POST', body }),
  patch: (endpoint, body, options) => apiRequest(endpoint, { ...options, method: 'PATCH', body }),
  put: (endpoint, body, options) => apiRequest(endpoint, { ...options, method: 'PUT', body }),
  delete: (endpoint, options) => apiRequest(endpoint, { ...options, method: 'DELETE' }),
};
