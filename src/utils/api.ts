export const API_CONFIG = {
  BASE_URL: 'http://figliolo.it:5101/v1',
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

  try {
    const response = await fetchWithTimeout(url, {
      credentials: 'include',
      mode: 'cors',
      ...init
    }, timeout);

    if (response.status === 204 || response.status === 205) {
      return undefined as unknown as T;
    }

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`API error: ${response.status} — ${errorText}`);
      throw new Error(`${response.status} — ${errorText}`);
    }

    const contentType = response.headers.get('content-type') || '';
    const isJSON = contentType.includes('application/json');

    if (!isJSON) {
      console.warn(`Unexpected content-type (${contentType}) for ${endpoint}`);
      return undefined as unknown as T;
    }

    const jsonData = await response.json();
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
