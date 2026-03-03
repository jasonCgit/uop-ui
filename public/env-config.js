// Runtime environment configuration
// In dev: API_URL is empty (Vite proxy handles /api)
// In CF: Set API_URL to your deployed uop-api URL (e.g. "https://uop-api.apps.cf.example.com")
window.__ENV__ = {
  API_URL: "",
};
