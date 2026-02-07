export const BACKEND_URL = 'http://localhost:8085';

// Polling intervals for keeping pages up to date
// Long for generally unchanging pages
// Short for pages that change often (eg system metrics)
export const LONG_POLLING_INTERVAL = 60000;
export const SHORT_POLLING_INTERVAL = 1000;