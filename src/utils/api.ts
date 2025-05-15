// API configuration and utility functions
// This file centralizes API endpoints and common utilities

// API Base URL configuration
export const API_CONFIG = {
  // Base URL for all API requests
  baseURL: 'http://figliolo.it:5000/v1',
  
  // Endpoint paths (to be appended to baseURL)
  endpoints: {
    users: '/utenti',
    userById: (id: number) => `/utenti/${id}`,
    banUser: (id: number) => `/utenti/${id}/ban`,
    unbanUser: (id: number) => `/utenti/${id}/unban`,
    changeRole: (id: number) => `/utenti/${id}/ruolo`,
  }
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
    // Set default headers
    const headers = {
      ...getAuthHeaders(),
      ...(options.headers || {})
    };

    // Make the request
    const response = await fetch(url, {
      ...options,
      headers,
      // Add credentials to allow cookies to be sent
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

// Full URL builder
export const apiUrl = (endpoint: string) => `${API_CONFIG.baseURL}${endpoint}`;
