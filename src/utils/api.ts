// API configuration and utility functions
// This file centralizes API endpoints and common utilities

// API Base URL configuration
export const API_CONFIG = {
  BASE_URL: 'http://figliolo.it:5007/v1',
};

// Helper function to handle API requests
export interface HandleRequestOptions extends RequestInit {
  
}

export interface A1piError {
  message: string;
}

export const handleRequest = async <T>(
  endpoint: string,
  errorMsg: string,
  init?: HandleRequestOptions
): Promise<T> => {
  const url: string = `${API_CONFIG.BASE_URL}${endpoint.startsWith('/') ? endpoint : '/' + endpoint}`;
  
  try {
    const response: Response = await fetch(url, { credentials: 'include', ...init, mode: 'cors' });
    
    // Handle 404 errors by returning an empty array
    if (response.status === 404) {
      console.warn(`Nessun dato trovato per ${endpoint}`);
      return [] as T;
    }

    if (!response.ok) {
      const errorText: string = await response.text();
      throw new Error(`${errorMsg}: ${response.status} — ${errorText}`);
    }

    const contentType: string | null = response.headers.get('content-type');
    
    if (contentType?.includes('application/json')) {
      try {
        return await response.json() as T;
      } catch (jsonError: any) {
        console.error('Failed to parse JSON response:', jsonError);
        console.error('Response text:', await response.clone().text().catch(() => 'Could not read response text'));
        throw new Error(`${errorMsg}: Invalid JSON response`);
      }
    } else {
      console.warn(`Response is not JSON (${contentType}):`, await response.text().catch(() => 'Could not read response text'));
      return [] as T;
    }

  } catch (error: any) {
    console.error('Request failed:', error);
    throw new Error(`${errorMsg}: ${error.message}`);
  }
}
