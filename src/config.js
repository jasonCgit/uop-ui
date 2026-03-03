// API base URL — reads from runtime env-config.js injected in index.html
// Empty string in dev (Vite proxy forwards /api to the backend)
// Set window.__ENV__.API_URL in CF to point at the deployed uop-api
export const API_URL = window.__ENV__?.API_URL || '';
