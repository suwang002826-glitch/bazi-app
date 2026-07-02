const DEFAULT_BASE_URL = 'http://127.0.0.1:8787';

export function getBackendBaseUrl() {
  return process.env.EXPO_PUBLIC_BAZI_API_BASE_URL || DEFAULT_BASE_URL;
}

async function parseJsonResponse(response) {
  const text = await response.text();
  if (!text) {
    return {};
  }
  try {
    return JSON.parse(text);
  } catch (error) {
    const parseError = new Error('Bazi backend returned invalid JSON');
    parseError.cause = error;
    parseError.statusCode = response.status;
    throw parseError;
  }
}

async function requestJson(path, options = {}) {
  const response = await fetch(`${getBackendBaseUrl()}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    },
    ...options
  });
  const data = await parseJsonResponse(response);
  if (!response.ok) {
    const error = new Error(data.message || 'Bazi backend request failed');
    error.code = data.code || 'BAZI_API_ERROR';
    error.statusCode = response.status;
    error.details = data.details;
    throw error;
  }
  return data;
}

export function calculateBazi(payload) {
  return requestJson('/bazi/calculate', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}

export function getCalendarCoverage() {
  return requestJson('/bazi/calendar/coverage', {
    method: 'GET'
  });
}
