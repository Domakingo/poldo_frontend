export const API_CONFIG = {
  BASE_URL: 'http://figliolo.it:5006/v1',
};

export interface ApiError {
  message: string;
}

export const handleRequest = async <T>(
  endpoint: string,
  errorMsg: string,
  init?: RequestInit
): Promise<T> => {
  const url = `${API_CONFIG.BASE_URL}${endpoint.startsWith('/') ? endpoint : '/' + endpoint}`;

  try {
    const response = await fetch(url, {
      credentials: 'include',
      mode: 'cors',
      ...init
    });

    if (response.status === 204 || response.status === 205) {
      return undefined as unknown as T;
    }

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`${response.status} — ${errorText}`);
    }

    const contentType = response.headers.get('content-type') || '';
    const isJSON = contentType.includes('application/json');

    if (!isJSON) {
      console.warn(`Unexpected content-type (${contentType}) for ${endpoint}`);
      return undefined as unknown as T;
    }

    return await response.json() as T;

  } catch (error: any) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error(`${errorMsg}: ${message}`);
    throw new Error(`${errorMsg}: ${message}`);
  }
}
