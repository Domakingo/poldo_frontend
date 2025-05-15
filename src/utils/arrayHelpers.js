// Helper function to process API responses
export function ensureArray(response) {
  // Ensure the response is always treated as an array
  if (Array.isArray(response)) {
    return response;
  } else if (response && typeof response === 'object') {
    return response.error ? [] : [response];
  }
  return [];
}
