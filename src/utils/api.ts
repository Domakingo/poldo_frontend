// API configuration and utility functions
// This file centralizes API endpoints and common utilities

// API Base URL configuration
export const API_CONFIG = {
  BASE_URL: 'http://figliolo.it:5006/v1',
  DEFAULT_IMAGE: 'http://figliolo.it:5006/v1/prodotti/image/-1'
};

// Helper function for creating proper headers with auth token
export const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };
};

// Common fetch wrapper with error handling
export const fetchWithAuth = async (url: string, options: RequestInit = {}) => {
  try {
    // Make the request
    const response = await fetch(url, {
      ...options,
      credentials: 'include'
    });

    // Handle errors
    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      throw new Error(
        errorData?.error ||
        `Errore API: ${response.status} ${response.statusText}`
      );
    }

    // Parse response
    const data = await response.json().catch(() => null);
    return { success: true, data };
  } catch (error: any) {
    console.error('API request failed:', error);
    return {
      success: false,
      error: error.message || 'Si è verificato un errore durante la richiesta'
    };
  }
};

// Helper function to handle API requests
export interface HandleRequestOptions extends RequestInit {
  // You can extend this interface if you want to add custom options in the future
}

export interface ApiError {
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
