// API configuration and utility functions
export const API_CONFIG = {
  BASE_URL: 'http://figliolo.it:5006/v1',
};

export interface ApiError {
  message: string;
}

// Function to create a fetch request with timeout
const fetchWithTimeout = async (url: string, options: RequestInit, timeout = 15000) => {
  const controller = new AbortController();
  const { signal } = controller;
  
  const timeoutId = setTimeout(() => {
    controller.abort();
  }, timeout);
  
  try {
    const response = await fetch(url, { ...options, signal });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
};

export const handleRequest = async <T>(
  endpoint: string,
  errorMsg: string,
  init?: RequestInit,
  timeout = 15000
): Promise<T> => {
  const url = `${API_CONFIG.BASE_URL}${endpoint.startsWith('/') ? endpoint : '/' + endpoint}`;
  console.log(`API Request to: ${url}`, init?.method || 'GET');

  try {
    console.log('Making fetch request with timeout:', timeout);
    const response = await fetchWithTimeout(url, {
      credentials: 'include',
      mode: 'cors',
      ...init
    }, timeout);
    console.log(`Response received: ${response.status} ${response.statusText}`);

    // Handle 204/205 (No Content) responses
    if (response.status === 204 || response.status === 205) {
      console.log('No content response');
      return undefined as unknown as T;
    }

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`API error: ${response.status} — ${errorText}`);
      throw new Error(`${response.status} — ${errorText}`);
    }

    const contentType = response.headers.get('content-type') || '';
    const isJSON = contentType.includes('application/json');
    console.log(`Content-Type: ${contentType}, isJSON: ${isJSON}`);

    if (!isJSON) {
      console.warn(`Unexpected content-type (${contentType}) for ${endpoint}`);
      return undefined as unknown as T;
    }

    const jsonData = await response.json();
    console.log(`JSON data received (sample):`, Array.isArray(jsonData) ? `Array with ${jsonData.length} items` : (typeof jsonData === 'object' ? 'Object' : jsonData));
    return jsonData as T;

  } catch (error: any) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    if (error.name === 'AbortError') {
      console.error(`Request timeout after ${timeout}ms for ${url}`);
      throw new Error(`Request timeout: ${errorMsg}`);
    }
    console.error(`${errorMsg}: ${message}`);
    throw new Error(`${errorMsg}: ${message}`);
  }
}
