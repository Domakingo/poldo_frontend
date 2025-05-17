import { API_CONFIG } from '@/utils/api'

/**
 * Helper function to handle API requests
 */
export async function handleRequest<T>(
  endpoint: string,
  errorMsg: string,
  init?: RequestInit
): Promise<T> {
  const url = `${API_CONFIG.BASE_URL}${endpoint.startsWith('/') ? endpoint : '/' + endpoint}`;
  try {
    const response = await fetch(url, { credentials: 'include', ...init, mode: 'cors' });

    // Handle 404 errors by returning an empty array
    if (response.status === 404) {
      console.warn(`Nessun dato trovato per ${endpoint}`);
      return [] as unknown as T;
    }

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`${errorMsg}: ${response.status} — ${errorText}`);
    }

    const contentType = response.headers.get('content-type');
    if (contentType?.includes('application/json')) {
      return await response.json();
    }
    return {} as unknown as T;

  } catch (error: any) {
    console.error('Request failed:', error);
    throw new Error(`${errorMsg}: ${error.message}`);
  }
}

/**
 * Process API response to ensure it's treated as an array
 */
export function ensureArray<T>(response: any): T[] {
  if (Array.isArray(response)) {
    return response;
  } else if (response && typeof response === 'object') {
    return response.error ? [] : [response]; 
  }
  return [];
}
