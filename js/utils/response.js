export function ok(data) {
  return { success: true, data };
}

export function fail(error, details) {
  return {
    success: false,
    error,
    ...(details ? { details } : {})
  };
}

export function toErrorMessage(error) {
  if (!error) return 'Unknown error occurred.';

  const code = Number(error.code || error.response?.status || error.statusCode || 0);
  const type = String(error.type || '').toLowerCase();
  const message = String(error.message || 'Request failed.');

  if (code === 401) return 'You are not authorized. Please sign in.';
  if (code === 403) return 'Access denied for this action.';
  if (code === 404) return 'Requested resource was not found.';
  if (code === 409) return 'This action conflicts with existing data.';
  if (code === 429 || type.includes('rate_limit')) return 'Too many requests. Please try again shortly.';

  return message;
}
