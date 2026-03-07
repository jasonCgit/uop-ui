// Runtime environment configuration
// In dev: API_URL is empty (Vite proxy handles /api)
// In CF: Set API_URL to your deployed uop-api URL (e.g. "https://uop-api.apps.cf.example.com")
window.__ENV__ = {
  API_URL: "",
  AURA_BACKEND: "aura",       // "aura" | "smartsdk"
  AURA_API_URL: "",            // AURA team's endpoint (empty = same as API_URL)
  SMARTSDK_API_URL: "",        // UOP's own SmartSDK endpoint (empty = same as API_URL)
};
